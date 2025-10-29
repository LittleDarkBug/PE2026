from flask import Blueprint, jsonify, request
from services.graph_service import graph_service
import uuid
import json

api_bp = Blueprint('api', __name__)

# Store des sessions collaboratives
sessions = {}

@api_bp.route('/health', methods=['GET'])
def health_check():
    """Vérification que l'API fonctionne"""
    return jsonify({
        'status': 'ok',
        'message': 'API de visualisation de graphes 3D'
    })

@api_bp.route('/data', methods=['GET'])
def get_data():
    """Endpoint de test"""
    sample_data = {
        'message': 'Hello from the backend!',
        'status': 'success'
    }
    return jsonify(sample_data)

@api_bp.route('/data/<int:item_id>', methods=['GET'])
def get_item(item_id):
    """Endpoint de test avec paramètre"""
    item_data = {
        'id': item_id,
        'name': f'Item {item_id}',
        'description': 'This is a sample item.'
    }
    return jsonify(item_data)

# === ENDPOINTS POUR L'IMPORT DE DONNÉES ===

@api_bp.route('/graph/import/csv', methods=['POST'])
def import_csv():
    """
    Importe un fichier CSV et génère un graphe
    Body: {
        "csv_content": "source,target,weight\nA,B,1\n...",
        "source_col": "source",
        "target_col": "target",
        "layout": "force"
    }
    """
    try:
        data = request.get_json()
        csv_content = data.get('csv_content')
        source_col = data.get('source_col', 'source')
        target_col = data.get('target_col', 'target')
        layout_type = data.get('layout', 'force')
        
        if not csv_content:
            return jsonify({'error': 'csv_content requis'}), 400
        
        # Parser le CSV
        graph_data = graph_service.parse_csv_to_graph(
            csv_content, source_col, target_col
        )
        
        # Calculer le layout 3D
        graph_data = graph_service.compute_layout(graph_data, layout_type)
        
        # Sauvegarder le graphe
        graph_id = str(uuid.uuid4())
        graph_service.save_graph(graph_id, graph_data)
        
        return jsonify({
            'success': True,
            'graph_id': graph_id,
            'graph_data': graph_data
        })
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': f'Erreur serveur: {str(e)}'}), 500

@api_bp.route('/graph/import/json', methods=['POST'])
def import_json():
    """
    Importe un fichier JSON et génère un graphe
    Body: {
        "json_content": "{nodes: [...], edges: [...]}",
        "layout": "force"
    }
    """
    try:
        data = request.get_json()
        json_content = data.get('json_content')
        layout_type = data.get('layout', 'force')
        
        if not json_content:
            return jsonify({'error': 'json_content requis'}), 400
        
        # Si json_content est déjà un dict, le reconvertir en string
        if isinstance(json_content, dict):
            json_content = json.dumps(json_content)
        
        # Parser le JSON
        graph_data = graph_service.parse_json_to_graph(json_content)
        
        # Calculer le layout 3D
        graph_data = graph_service.compute_layout(graph_data, layout_type)
        
        # Sauvegarder le graphe
        graph_id = str(uuid.uuid4())
        graph_service.save_graph(graph_id, graph_data)
        
        return jsonify({
            'success': True,
            'graph_id': graph_id,
            'graph_data': graph_data
        })
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': f'Erreur serveur: {str(e)}'}), 500

# === ENDPOINTS POUR LA GESTION DES GRAPHES ===

@api_bp.route('/graph/<graph_id>', methods=['GET'])
def get_graph(graph_id):
    """Récupère un graphe par son ID"""
    graph_data = graph_service.get_graph(graph_id)
    
    if graph_data is None:
        return jsonify({'error': 'Graphe non trouvé'}), 404
    
    return jsonify(graph_data)

@api_bp.route('/graph/list', methods=['GET'])
def list_graphs():
    """Liste tous les graphes disponibles"""
    graphs = graph_service.list_graphs()
    return jsonify({'graphs': graphs})

@api_bp.route('/graph/<graph_id>/filter', methods=['POST'])
def filter_graph(graph_id):
    """
    Filtre un graphe selon des critères
    Body: {
        "node_property": {"type": "person"},
        "edge_property": {"weight": ">5"},
        "min_connections": 2
    }
    """
    try:
        graph_data = graph_service.get_graph(graph_id)
        if graph_data is None:
            return jsonify({'error': 'Graphe non trouvé'}), 404
        
        filters = request.get_json()
        filtered_graph = graph_service.filter_graph(graph_data, filters)
        
        return jsonify({
            'success': True,
            'graph_data': filtered_graph
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/graph/<graph_id>/save-state', methods=['POST'])
def save_graph_state(graph_id):
    """
    Sauvegarde l'état actuel d'un graphe (positions, filtres, etc.)
    Body: {
        "state_name": "Mon état 1",
        "camera": {...},
        "visible_nodes": [...],
        "filters": {...}
    }
    """
    try:
        graph_data = graph_service.get_graph(graph_id)
        if graph_data is None:
            return jsonify({'error': 'Graphe non trouvé'}), 404
        
        state_data = request.get_json()
        state_id = str(uuid.uuid4())
        
        # Ajouter l'état aux métadonnées du graphe
        if 'states' not in graph_data:
            graph_data['states'] = {}
        
        graph_data['states'][state_id] = {
            'id': state_id,
            'name': state_data.get('state_name', f'État {len(graph_data["states"]) + 1}'),
            'timestamp': state_data.get('timestamp'),
            'data': state_data
        }
        
        graph_service.save_graph(graph_id, graph_data)
        
        return jsonify({
            'success': True,
            'state_id': state_id
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/graph/<graph_id>/load-state/<state_id>', methods=['GET'])
def load_graph_state(graph_id, state_id):
    """Charge un état sauvegardé du graphe"""
    try:
        graph_data = graph_service.get_graph(graph_id)
        if graph_data is None:
            return jsonify({'error': 'Graphe non trouvé'}), 404
        
        states = graph_data.get('states', {})
        if state_id not in states:
            return jsonify({'error': 'État non trouvé'}), 404
        
        return jsonify({
            'success': True,
            'state': states[state_id]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# === ENDPOINTS POUR LES SESSIONS COLLABORATIVES ===

@api_bp.route('/session/create', methods=['POST'])
def create_session():
    """
    Crée une session collaborative
    Body: {
        "session_name": "Ma session",
        "graph_id": "uuid-du-graphe",
        "max_users": 10
    }
    """
    try:
        data = request.get_json()
        session_id = str(uuid.uuid4())
        
        sessions[session_id] = {
            'id': session_id,
            'name': data.get('session_name', f'Session {len(sessions) + 1}'),
            'graph_id': data.get('graph_id'),
            'max_users': data.get('max_users', 10),
            'users': [],
            'created_at': data.get('timestamp')
        }
        
        return jsonify({
            'success': True,
            'session_id': session_id,
            'session': sessions[session_id]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/session/<session_id>/join', methods=['POST'])
def join_session(session_id):
    """
    Rejoindre une session collaborative
    Body: {
        "user_name": "John Doe",
        "user_id": "uuid"
    }
    """
    try:
        if session_id not in sessions:
            return jsonify({'error': 'Session non trouvée'}), 404
        
        session = sessions[session_id]
        data = request.get_json()
        
        user_info = {
            'id': data.get('user_id', str(uuid.uuid4())),
            'name': data.get('user_name', 'Anonyme'),
            'joined_at': data.get('timestamp')
        }
        
        if len(session['users']) >= session['max_users']:
            return jsonify({'error': 'Session pleine'}), 403
        
        session['users'].append(user_info)
        
        return jsonify({
            'success': True,
            'session': session,
            'user': user_info
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/session/<session_id>', methods=['GET'])
def get_session(session_id):
    """Récupère les informations d'une session"""
    if session_id not in sessions:
        return jsonify({'error': 'Session non trouvée'}), 404
    
    return jsonify(sessions[session_id])

@api_bp.route('/session/list', methods=['GET'])
def list_sessions():
    """Liste toutes les sessions actives"""
    return jsonify({
        'sessions': list(sessions.values())
    })

# === ENDPOINT POUR GÉNÉRER UN GRAPHE DE DÉMONSTRATION ===

@api_bp.route('/graph/demo', methods=['GET'])
def create_demo_graph():
    """Génère un graphe de démonstration"""
    try:
        # Graphe de démonstration avec des données sociales
        demo_json = {
            "nodes": [
                {"id": "Alice", "label": "Alice", "type": "person", "age": 30},
                {"id": "Bob", "label": "Bob", "type": "person", "age": 25},
                {"id": "Charlie", "label": "Charlie", "type": "person", "age": 35},
                {"id": "David", "label": "David", "type": "person", "age": 28},
                {"id": "Eve", "label": "Eve", "type": "person", "age": 32},
                {"id": "Frank", "label": "Frank", "type": "person", "age": 40},
                {"id": "Grace", "label": "Grace", "type": "person", "age": 27},
                {"id": "Henry", "label": "Henry", "type": "person", "age": 33}
            ],
            "edges": [
                {"source": "Alice", "target": "Bob", "relationship": "friend", "weight": 5},
                {"source": "Alice", "target": "Charlie", "relationship": "colleague", "weight": 3},
                {"source": "Bob", "target": "David", "relationship": "friend", "weight": 4},
                {"source": "Charlie", "target": "Eve", "relationship": "friend", "weight": 5},
                {"source": "David", "target": "Frank", "relationship": "family", "weight": 10},
                {"source": "Eve", "target": "Grace", "relationship": "colleague", "weight": 3},
                {"source": "Frank", "target": "Henry", "relationship": "friend", "weight": 4},
                {"source": "Grace", "target": "Alice", "relationship": "friend", "weight": 5},
                {"source": "Bob", "target": "Eve", "relationship": "friend", "weight": 4},
                {"source": "Charlie", "target": "Frank", "relationship": "colleague", "weight": 2}
            ]
        }
        
        graph_data = graph_service.parse_json_to_graph(json.dumps(demo_json))
        graph_data = graph_service.compute_layout(graph_data, 'force')
        
        graph_id = str(uuid.uuid4())
        graph_service.save_graph(graph_id, graph_data)
        
        return jsonify({
            'success': True,
            'graph_id': graph_id,
            'graph_data': graph_data
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500