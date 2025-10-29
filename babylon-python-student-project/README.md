# Babylon-Python Student Project

## Description
Ce projet est une application web utilisant Babylon.js pour créer une expérience 3D interactive. Le frontend est développé en HTML, CSS et JavaScript, tandis que le backend est construit avec Python. L'application permet de visualiser des modèles 3D et d'interagir avec eux.

## Structure du projet
```
babylon-python-student-project
├── frontend
│   ├── index.html
│   ├── css
│   │   └── style.css
│   ├── js
│   │   ├── main.js
│   │   ├── scene.js
│   │   └── utils.js
│   └── assets
│       └── models
├── backend
│   ├── app.py
│   ├── routes
│   │   └── api.py
│   ├── services
│   │   └── data_service.py
│   └── requirements.txt
├── venv
└── README.md
```

## Installation

1. Clone le dépôt :
   ```
   git clone <URL_DU_DEPOT>
   cd babylon-python-student-project
   ```

2. Créez un environnement virtuel et activez-le :
   ```
   python -m venv venv
   source venv/bin/activate  # Sur Windows, utilisez `venv\Scripts\activate`
   ```

3. Installez les dépendances backend :
   ```
   pip install -r backend/requirements.txt
   ```

## Exécution

### Backend
Pour démarrer le serveur backend, exécutez :
```
python backend/app.py
```

### Frontend
Ouvrez `frontend/index.html` dans un navigateur pour accéder à l'application.

## Contribuer
Les contributions sont les bienvenues ! Veuillez soumettre une demande de tirage pour toute amélioration ou correction.

## License
Ce projet est sous licence MIT.