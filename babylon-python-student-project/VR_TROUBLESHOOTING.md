# 🔧 Dépannage VR - Guide de résolution des problèmes

## Erreur: "Could not create a session because something went wrong initializing the runtime"

### Causes communes

1. **Configuration de session non supportée**
   - Certains casques VR ne supportent pas toutes les fonctionnalités WebXR
   - Solution: Le code a été modifié pour utiliser une configuration minimale par défaut

2. **Runtime WebXR non initialisé**
   - Le runtime VR (Oculus, SteamVR, etc.) n'est pas démarré
   - Solution: Démarrer l'application VR du casque avant d'ouvrir le navigateur

3. **Navigateur non compatible**
   - Tous les navigateurs ne supportent pas WebXR
   - Solution: Utiliser Chrome, Edge, ou Firefox avec WebXR activé

### Solutions appliquées dans le code

✅ **Configuration fallback progressive**
```javascript
// Essaie d'abord avec configuration minimale
// Si échec, utilise les paramètres par défaut
```

✅ **Features optionnelles en "stable"**
```javascript
// Utilise "stable" au lieu de "latest" pour meilleure compatibilité
BABYLON.WebXRFeatureName.MOVEMENT, "stable"
```

✅ **Options simplifiées**
```javascript
// Retire les options qui causent des problèmes de compatibilité
// Garde uniquement les options essentielles
```

## Étapes de dépannage

### 1. Vérifier le runtime VR

**Windows Mixed Reality:**
```
1. Ouvrir le Portail Mixed Reality
2. S'assurer que le casque est détecté
3. Fermer et rouvrir le navigateur
```

**Oculus/Meta Quest:**
```
1. Activer le mode développeur dans l'app Oculus
2. Connecter le casque en Link ou Air Link
3. Démarrer Oculus Desktop
4. Ouvrir le navigateur dans le casque ou sur PC
```

**SteamVR:**
```
1. Démarrer SteamVR
2. Vérifier que le casque est connecté (vert)
3. Ouvrir le navigateur
```

### 2. Vérifier le navigateur

**Chrome/Edge:**
```
1. Ouvrir chrome://flags
2. Chercher "WebXR"
3. Activer "WebXR Incubations"
4. Redémarrer le navigateur
```

**Firefox:**
```
1. Ouvrir about:config
2. Chercher "webxr"
3. Activer dom.vr.webxr.enabled
4. Redémarrer le navigateur
```

### 3. Vérifier HTTPS/localhost

WebXR nécessite:
- `https://` (connexion sécurisée), OU
- `http://localhost` ou `http://127.0.0.1`

✅ Bon: `http://localhost:8000`
❌ Mauvais: `http://192.168.1.10:8000`

### 4. Console du navigateur

Ouvrir la console (F12) et vérifier:
```
✓ "WebXR activé - Plateforme VR prête"
✓ "Sélection pointer VR activée"
✓ "Mouvement VR activé (joysticks)"
```

Si vous voyez:
```
⚠ "Configuration de base échouée"
```
→ Redémarrer le runtime VR et le navigateur

## Matériel testé

| Casque | Statut | Notes |
|--------|--------|-------|
| Meta Quest 2/3 | ✅ Testé | Utiliser navigateur intégré ou Link |
| Windows Mixed Reality | ✅ Testé | Edge recommandé |
| Valve Index | ✅ Compatible | Nécessite SteamVR |
| HTC Vive | ✅ Compatible | Nécessite SteamVR |
| Oculus Rift | ✅ Compatible | Chrome ou Edge |

## Commandes VR

### Contrôleurs
- **Joystick gauche**: Déplacement avant/arrière/gauche/droite
- **Joystick droit**: Rotation
- **Trigger (index)**: Sélection de nœud
- **Grip (main)**: Grab (si activé)

### Navigation
- **Téléportation**: Pointer vers le sol, appuyer sur le trigger
- **Mouvement libre**: Utiliser les joysticks

## Logs utiles

Pour activer les logs détaillés, ouvrir la console et taper:
```javascript
BABYLON.Tools.Log = console.log;
```

## Contact support

Si le problème persiste:
1. Noter le modèle de casque VR
2. Noter la version du navigateur
3. Copier les logs de la console
4. Créer une issue GitHub avec ces informations

## Modifications récentes

**2025-10-29**
- ✅ Configuration WebXR simplifiée pour meilleure compatibilité
- ✅ Fallback progressif en cas d'échec
- ✅ Passage de "latest" à "stable" pour les features
- ✅ Meilleure gestion des erreurs avec messages détaillés
