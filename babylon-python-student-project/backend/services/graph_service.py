import json
import csv
import io
import networkx as nx
from typing import Dict, List, Any

class GraphService:
    """Service pour gérer la création et manipulation de graphes"""
    
    def __init__(self):
        self.graphs = {}  # Stockage des graphes en mémoire
        
    def parse_csv_to_graph(self, csv_content: str, source_col: str = 'source', 
                          target_col: str = 'target') -> Dict[str, Any]:
        """
        Parse un CSV et génère un graphe
        Format attendu: colonnes source, target, et autres propriétés optionnelles
        """
        try:
            # Lire le CSV
            csv_file = io.StringIO(csv_content)
            reader = csv.DictReader(csv_file)
            
            nodes = {}
            edges = []
            
            for row in reader:
                source = row.get(source_col)
                target = row.get(target_col)
                
                if not source or not target:
                    continue
                
                # Ajouter les nœuds
                if source not in nodes:
                    nodes[source] = {
                        'id': source,
                        'label': source,
                        'properties': {}
                    }
                
                if target not in nodes:
                    nodes[target] = {
                        'id': target,
                        'label': target,
                        'properties': {}
                    }
                
                # Ajouter les propriétés des nœuds depuis les autres colonnes
                edge_props = {}
                for key, value in row.items():
                    if key not in [source_col, target_col]:
                        edge_props[key] = value
                
                # Ajouter l'arête
                edges.append({
                    'source': source,
                    'target': target,
                    'properties': edge_props
                })
            
            graph_data = {
                'nodes': list(nodes.values()),
                'edges': edges,
                'metadata': {
                    'node_count': len(nodes),
                    'edge_count': len(edges),
                    'format': 'csv'
                }
            }
            
            return graph_data
            
        except Exception as e:
            raise ValueError(f"Erreur lors du parsing CSV: {str(e)}")
    
    def parse_json_to_graph(self, json_content: str) -> Dict[str, Any]:
        """
        Parse un JSON et génère un graphe
        Formats supportés:
        1. {nodes: [...], edges/links: [...]}
        2. Liste d'objets avec relations
        """
        try:
            data = json.loads(json_content)
            
            # Format 1: Structure standard avec nodes et edges
            if isinstance(data, dict) and ('nodes' in data or 'vertices' in data):
                nodes = data.get('nodes', data.get('vertices', []))
                edges = data.get('edges', data.get('links', []))
                
                # Normaliser les nœuds
                normalized_nodes = []
                for i, node in enumerate(nodes):
                    if isinstance(node, dict):
                        node_id = node.get('id', node.get('name', f'node_{i}'))
                        normalized_nodes.append({
                            'id': node_id,
                            'label': node.get('label', node.get('name', node_id)),
                            'properties': {k: v for k, v in node.items() 
                                         if k not in ['id', 'label', 'name']}
                        })
                    else:
                        normalized_nodes.append({
                            'id': str(node),
                            'label': str(node),
                            'properties': {}
                        })
                
                # Normaliser les arêtes
                normalized_edges = []
                for edge in edges:
                    if isinstance(edge, dict):
                        source = edge.get('source', edge.get('from'))
                        target = edge.get('target', edge.get('to'))
                        normalized_edges.append({
                            'source': str(source),
                            'target': str(target),
                            'properties': {k: v for k, v in edge.items() 
                                         if k not in ['source', 'target', 'from', 'to']}
                        })
                
                graph_data = {
                    'nodes': normalized_nodes,
                    'edges': normalized_edges,
                    'metadata': {
                        'node_count': len(normalized_nodes),
                        'edge_count': len(normalized_edges),
                        'format': 'json'
                    }
                }
                
                return graph_data
            
            # Format 2: Liste d'objets
            elif isinstance(data, list):
                # Essayer de détecter les relations
                nodes = {}
                edges = []
                
                for item in data:
                    if isinstance(item, dict):
                        node_id = item.get('id', item.get('name'))
                        if node_id:
                            nodes[node_id] = {
                                'id': node_id,
                                'label': item.get('label', item.get('name', node_id)),
                                'properties': item
                            }
                
                graph_data = {
                    'nodes': list(nodes.values()),
                    'edges': edges,
                    'metadata': {
                        'node_count': len(nodes),
                        'edge_count': 0,
                        'format': 'json'
                    }
                }
                
                return graph_data
            
            else:
                raise ValueError("Format JSON non reconnu")
                
        except json.JSONDecodeError as e:
            raise ValueError(f"JSON invalide: {str(e)}")
        except Exception as e:
            raise ValueError(f"Erreur lors du parsing JSON: {str(e)}")
    
    def compute_layout(self, graph_data: Dict[str, Any], 
                      layout_type: str = 'force') -> Dict[str, Any]:
        """
        Calcule les positions 3D des nœuds selon un algorithme de layout
        """
        try:
            # Créer un graphe NetworkX
            G = nx.Graph()
            
            # Ajouter les nœuds
            for node in graph_data['nodes']:
                G.add_node(node['id'], **node.get('properties', {}))
            
            # Ajouter les arêtes
            for edge in graph_data['edges']:
                G.add_edge(edge['source'], edge['target'], 
                          **edge.get('properties', {}))
            
            # Calculer le layout selon le type
            if layout_type == 'force' or layout_type == 'spring':
                pos = nx.spring_layout(G, dim=3, iterations=100)
            elif layout_type == 'circular':
                pos_2d = nx.circular_layout(G)
                pos = {node: [coords[0], 0, coords[1]] 
                      for node, coords in pos_2d.items()}
            elif layout_type == 'random':
                pos = nx.random_layout(G, dim=3)
            elif layout_type == 'sphere':
                pos = nx.spring_layout(G, dim=3, iterations=50)
            else:
                pos = nx.spring_layout(G, dim=3)
            
            # Mettre à jour les positions dans le graph_data
            for node in graph_data['nodes']:
                node_id = node['id']
                if node_id in pos:
                    coords = pos[node_id]
                    # Échelle pour une meilleure visualisation
                    node['position'] = {
                        'x': float(coords[0]) * 10,
                        'y': float(coords[1]) * 10 if len(coords) > 1 else 0,
                        'z': float(coords[2]) * 10 if len(coords) > 2 else 0
                    }
            
            return graph_data
            
        except Exception as e:
            raise ValueError(f"Erreur lors du calcul de layout: {str(e)}")
    
    def save_graph(self, graph_id: str, graph_data: Dict[str, Any]):
        """Sauvegarde un graphe en mémoire"""
        self.graphs[graph_id] = graph_data
        return graph_id
    
    def get_graph(self, graph_id: str) -> Dict[str, Any]:
        """Récupère un graphe sauvegardé"""
        return self.graphs.get(graph_id)
    
    def list_graphs(self) -> List[Dict[str, Any]]:
        """Liste tous les graphes sauvegardés"""
        return [
            {
                'id': graph_id,
                'metadata': graph_data.get('metadata', {})
            }
            for graph_id, graph_data in self.graphs.items()
        ]
    
    def filter_graph(self, graph_data: Dict[str, Any], 
                    filters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Filtre le graphe selon des critères
        filters: {
            'node_property': {'key': 'value'},
            'edge_property': {'key': 'value'},
            'min_connections': int
        }
        """
        filtered_nodes = []
        filtered_edges = []
        
        # Filtrer les nœuds
        for node in graph_data['nodes']:
            if self._match_filters(node, filters.get('node_property', {})):
                filtered_nodes.append(node)
        
        # Ne garder que les IDs des nœuds filtrés
        node_ids = {node['id'] for node in filtered_nodes}
        
        # Filtrer les arêtes
        for edge in graph_data['edges']:
            if (edge['source'] in node_ids and 
                edge['target'] in node_ids and
                self._match_filters(edge, filters.get('edge_property', {}))):
                filtered_edges.append(edge)
        
        return {
            'nodes': filtered_nodes,
            'edges': filtered_edges,
            'metadata': {
                **graph_data.get('metadata', {}),
                'filtered': True,
                'original_node_count': len(graph_data['nodes']),
                'original_edge_count': len(graph_data['edges'])
            }
        }
    
    def _match_filters(self, item: Dict[str, Any], filters: Dict[str, Any]) -> bool:
        """Vérifie si un item correspond aux filtres"""
        if not filters:
            return True
        
        properties = item.get('properties', {})
        for key, value in filters.items():
            if properties.get(key) != value:
                return False
        return True

# Instance globale du service
graph_service = GraphService()
