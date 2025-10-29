from flask import Flask
from flask_cors import CORS
from routes.api import api_bp

app = Flask(__name__)
CORS(app)  # Activer CORS pour permettre les requêtes depuis le frontend

app.register_blueprint(api_bp, url_prefix='/api')

@app.route('/')
def index():
    return """
    <h1>API de Visualisation de Graphes 3D Immersifs</h1>
    <p>Endpoints disponibles :</p>
    <ul>
        <li><b>GET /api/health</b> - Vérification de l'API</li>
        <li><b>POST /api/graph/import/csv</b> - Importer un graphe depuis CSV</li>
        <li><b>POST /api/graph/import/json</b> - Importer un graphe depuis JSON</li>
        <li><b>GET /api/graph/demo</b> - Générer un graphe de démonstration</li>
        <li><b>GET /api/graph/list</b> - Lister tous les graphes</li>
        <li><b>GET /api/graph/&lt;id&gt;</b> - Récupérer un graphe spécifique</li>
        <li><b>POST /api/graph/&lt;id&gt;/filter</b> - Filtrer un graphe</li>
        <li><b>POST /api/graph/&lt;id&gt;/save-state</b> - Sauvegarder un état</li>
        <li><b>GET /api/graph/&lt;id&gt;/load-state/&lt;state_id&gt;</b> - Charger un état</li>
        <li><b>POST /api/session/create</b> - Créer une session collaborative</li>
        <li><b>POST /api/session/&lt;id&gt;/join</b> - Rejoindre une session</li>
        <li><b>GET /api/session/list</b> - Lister les sessions actives</li>
    </ul>
    """

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)