# Plateforme de Visualisation 3D Immersive de Graphes

## Description

Plateforme web interactive permettant la visualisation et l'exploration de graphes en 3D avec support WebXR pour casques de réalité virtuelle. Développée dans le cadre d'un projet étudiant UTT.

## Fonctionnalités Implémentées

### Import et Génération de Graphes
- Import de fichiers **CSV** avec parsing automatique
- Import de fichiers **JSON** (formats multiples supportés)
- Génération automatique de graphes avec nœuds, liens et propriétés
- Calcul automatique du layout 3D (force-directed, circular, sphere, random)

### Réalité Virtuelle (WebXR)
- Support des casques VR (Meta Quest, HTC Vive, Valve Index, etc.)
- Déplacement libre dans l'espace 3D
- Téléportation VR
- Interaction avec les contrôleurs VR
- Retour haptique lors des interactions
- Navigation: rotation, zoom, repositionnement
- Compatible OpenXR / WebXR standards

### Exploration et Interaction
- Sélection de nœuds avec affichage des propriétés détaillées
- Panneau d'informations contextuel
- Hover effects sur les nœuds
- Labels 3D sur chaque nœud
- Codes couleur automatiques pour différencier les nœuds

### Interface Utilisateur
- Interface ergonomique et intuitive
- Panneau de contrôle pour toutes les fonctionnalités
- Notifications visuelles
- Boutons d'import, filtrage, sauvegarde
- Interface adaptée VR et desktop

### Fonctionnalités Avancées
- API REST complète (Flask)
- Filtrage de graphes selon critères
- Sauvegarde/chargement d'états
- Sessions collaboratives (infrastructure)
- Mode multi-utilisateurs (en développement)
- WebSocket temps réel (en développement)

## Installation et Lancement

### Prérequis
- Python 3.8+ avec conda (recommandé)
- Navigateur moderne (Chrome, Edge, Firefox)
- Casque VR (optionnel, pour mode immersif)

### 1. Installation Backend

```powershell
# Se placer dans le dossier du projet
cd babylon-python-student-project

# Créer l'environnement virtuel
python -m venv venv

# Activer l'environnement (PowerShell)
.\venv\Scripts\Activate.ps1

# Installer les dépendances
pip install -r backend\requirements.txt
```

### 2. Lancement Backend

```powershell
python backend\app.py
```

Le backend sera accessible sur: **http://127.0.0.1:5000**

### 3. Lancement Frontend

**Option A: Serveur HTTP Python**
```powershell
# Dans un nouveau terminal
cd frontend
python -m http.server 8000
```
Puis ouvrir: **http://localhost:8000**

## Utilisation

### Mode Desktop
1. **Charger un graphe**: Cliquez sur "Charger Graphe Démo"
2. **Importer vos données**: Cliquez sur "Importer Fichier"
3. **Explorer**: 
   - Clic gauche + glisser = Rotation
   - Molette = Zoom
   - Clic sur nœud = Sélection
4. **Filtrer**: Utilisez le bouton "Filtrer Graphe"
5. **Sauvegarder**: Bouton "Sauvegarder État"

### Mode VR
1. Connectez votre casque VR
2. Ouvrez l'application (HTTPS requis pour WebXR)
3. Cliquez sur le bouton VR (en bas à droite)
4. Utilisez les contrôleurs pour:
   - Pointer et sélectionner les nœuds
   - Téléporter dans l'environnement
   - Sentir les retours haptiques

## API Endpoints Principaux

- `GET /api/graph/demo` - Générer un graphe de démonstration
- `POST /api/graph/import/csv` - Importer un CSV
- `POST /api/graph/import/json` - Importer un JSON
- `GET /api/graph/list` - Lister tous les graphes
- `POST /api/session/create` - Créer une session collaborative

## Projet Étudiant

**Établissement**: Université de Technologie de Troyes (UTT)  
**Cours**: PE2026 - Conception et réalisation  
**Sujet**: Plateforme interactive de visualisation de graphes 3D immersifs  
**Tuteur**: Babiga BIRREGAH

### Contributeurs
- SOSSOU DIDI ORLOG
- PARBEY F. O. Aimey-Ester
