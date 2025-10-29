# Guide de Lancement - Visualisation 3D de Graphes

## Installation

### 1. Backend Python

```powershell
# Se placer dans le dossier du projet
cd babylon-python-student-project

# Créer l'environnement virtuel (si pas déjà fait)
python -m venv venv

# Activer l'environnement (PowerShell)
.\venv\Scripts\Activate.ps1

# Installer les dépendances
pip install -r backend\requirements.txt
```

### 2. Vérifier les dépendances

Le fichier `backend\requirements.txt` doit contenir :
```
Flask==2.3.0
Flask-CORS==4.0.0
Flask-SocketIO==5.3.0
networkx==3.1
numpy==1.24.0
pandas==2.0.0
python-socketio==5.9.0
```

## Lancement

### 1. Démarrer le Backend

```powershell
# Dans le dossier du projet
.\venv\Scripts\python.exe backend\app.py
```

Le serveur sera accessible sur `http://127.0.0.1:5000`

### 2. Démarrer le Frontend

**Option A - Serveur HTTP Python** (Recommandé)
```powershell
# Dans un nouveau terminal
cd frontend
python -m http.server 8000
```

Puis ouvrir : `http://localhost:8000`

**Option B - Live Server (VS Code)**
- Installer l'extension "Live Server"
- Clic droit sur `frontend/index.html`
- Sélectionner "Open with Live Server"

## Fonctionnalités

### Qualité 3D Améliorée
- **Matériaux PBR** : Rendu physiquement réaliste avec métallicité et rugosité
- **Éclairage 3 points** : Key light, fill light et back light pour effet cinématographique
- **Ombres douces** : Shadow mapping avec blur exponentiel
- **Pipeline HDR** : Tone mapping ACES, bloom, anti-aliasing FXAA
- **Arêtes cylindriques** : Vraie géométrie 3D au lieu de simples lignes
- **Glow effect** : HighlightLayer pour sélection sans déformer les meshes
- **Skybox** : Environnement immersif

### Interface Utilisateur
- **Toolbar moderne** : 6 boutons avec icônes SVG
- **Modal centré** : Informations des nœuds au centre de l'écran
- **Filtrage avancé** : Sliders, sélection de type, recherche textuelle
- **Minimap 2D** : Carte interactive avec position caméra
- **Focus animé** : Animation fluide de caméra vers nœud sélectionné
- **Notifications toast** : Feedback visuel pour chaque action
- **Stats en temps réel** : FPS, nombre de nœuds/arêtes

### Navigation
- **Rotation** : Clic gauche + glisser
- **Zoom** : Molette de souris
- **Pan** : Clic droit + glisser
- **Reset caméra** : Bouton dans la toolbar
- **Focus sur nœud** : Sélectionner un nœud puis cliquer sur "Focus"
- **Minimap** : Clic sur la minimap pour déplacer la vue

### Mode Collaboratif
- **Sessions multi-utilisateurs** : Rejoindre/créer des sessions
- **Curseurs partagés** : Voir les curseurs 3D des autres utilisateurs
- **Sélections synchronisées** : Les sélections sont partagées en temps réel
- **WebSocket** : Communication temps réel avec Socket.IO

### Réalité Virtuelle
- **Support WebXR** : Compatible Meta Quest, HTC Vive, Valve Index
- **Contrôleurs VR** : Interaction par pointage laser
- **Téléportation** : Déplacement dans l'environnement
- **Retour haptique** : Vibrations lors des interactions
- **Mode immersif** : Cliquer sur le bouton VR en bas à droite

## Import de Données

### Format CSV
```csv
source,target
Alice,Bob
Bob,Charlie
Alice,Charlie
```

### Format JSON (Option 1 - Nodes/Edges)
```json
{
  "nodes": [
    {"id": "1", "label": "Alice", "properties": {"age": 25}},
    {"id": "2", "label": "Bob", "properties": {"age": 30}}
  ],
  "edges": [
    {"source": "1", "target": "2"}
  ]
}
```

### Format JSON (Option 2 - Links)
```json
{
  "nodes": [
    {"id": "1", "label": "Alice"},
    {"id": "2", "label": "Bob"}
  ],
  "links": [
    {"source": "1", "target": "2"}
  ]
}
```

## Raccourcis Clavier

- **Échap** : Fermer les modals
- **Clic** : Sélectionner un nœud
- **Hover** : Prévisualiser un nœud (effet glow)

## Dépannage

### Backend ne démarre pas
- Vérifier que l'environnement virtuel est activé
- Réinstaller les dépendances : `pip install -r backend\requirements.txt`

### Frontend ne se connecte pas
- Vérifier que le backend est lancé sur `http://127.0.0.1:5000`
- Vérifier les CORS dans la console du navigateur
- Ouvrir la console développeur (F12) pour voir les erreurs

### WebXR ne fonctionne pas
- WebXR nécessite HTTPS ou localhost
- Vérifier que le casque VR est connecté
- Utiliser Chrome ou Edge (meilleur support WebXR)

### Performances lentes
- Réduire le nombre de nœuds (filtrage)
- Désactiver les ombres dans le code si nécessaire
- Réduire la qualité du bloom dans le pipeline

## Architecture

```
babylon-python-student-project/
├── backend/
│   ├── app.py                  # Serveur Flask principal
│   ├── requirements.txt        # Dépendances Python
│   ├── routes/
│   │   └── api.py             # Endpoints REST
│   └── services/
│       ├── graph_service.py   # Logique métier graphes
│       └── data_service.py    # Gestion données
├── frontend/
│   ├── index.html             # Page principale
│   ├── css/
│   │   └── style.css          # Styles modernes
│   ├── js/
│   │   ├── main.js            # Point d'entrée
│   │   ├── graphManager.js    # Gestion graphes 3D
│   │   ├── uiManager.js       # Interface utilisateur
│   │   ├── collaborativeManager.js  # Mode collaboratif
│   │   └── utils.js           # Fonctions utilitaires
│   └── assets/
│       ├── sample_graph.csv   # Exemple CSV
│       └── sample_graph.json  # Exemple JSON
└── README.md                  # Ce fichier
```

## Technologies Utilisées

### Frontend
- **Babylon.js 6.x** : Moteur 3D WebGL
- **Socket.IO Client** : WebSocket temps réel
- **Vanilla JavaScript** : Pas de framework lourd
- **CSS Variables** : Thème personnalisable

### Backend
- **Flask** : Framework web Python
- **Flask-SocketIO** : WebSocket serveur
- **NetworkX** : Algorithmes de graphes
- **NumPy/Pandas** : Manipulation de données

## Améliorations Futures

- [ ] Export en formats 3D (GLTF, OBJ)
- [ ] Plus de layouts (treemap, hierarchical)
- [ ] Recherche avancée avec regex
- [ ] Mode sombre/clair
- [ ] Annotations sur les nœuds
- [ ] Historique des modifications
- [ ] Plugins personnalisés

## Support

Pour toute question, ouvrir une issue ou contacter l'équipe de développement.

**Projet Étudiant UTT - PE2026**
