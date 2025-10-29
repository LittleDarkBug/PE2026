# Guide de Configuration VR pour Meta Quest 3 avec Quest Link

## Problème : "Session mode 'immersive-vr' not supported in browser"

Ce message apparaît lorsque le navigateur ne détecte pas correctement le support WebXR pour la VR.

## ✅ Checklist de Diagnostic

### 1. **Vérifier Quest Link**
- [ ] Le casque Quest 3 est connecté via câble USB ou Air Link
- [ ] L'application **Meta Quest Link** (anciennement Oculus) est en cours d'exécution sur PC
- [ ] Le casque affiche l'environnement Quest Link (pas l'environnement Quest natif)
- [ ] Le casque est bien détecté dans l'application Meta Quest (indicateur vert)

### 2. **Navigateur Compatible**
Quest Link fonctionne uniquement avec certains navigateurs sur PC :

#### ✅ Navigateurs Recommandés :
- **Google Chrome** (version 90+)
- **Microsoft Edge** (version 90+)

#### ❌ Navigateurs NON Supportés :
- Firefox (support WebXR limité avec Quest Link)
- Safari (pas de support WebXR)
- Navigateur Meta Quest natif (utilisez le PC)

### 3. **Activer les Flags WebXR dans Chrome/Edge**

#### Dans Chrome :
1. Ouvrez `chrome://flags` dans la barre d'adresse
2. Recherchez "WebXR"
3. Activez les flags suivants :
   - `#webxr-incubations` → **Enabled**
   - `#webxr-hand-input` → **Enabled** (optionnel)
4. Cliquez sur **Relaunch** pour redémarrer le navigateur

#### Dans Edge :
1. Ouvrez `edge://flags` dans la barre d'adresse
2. Même procédure que pour Chrome

### 4. **Vérifier HTTPS / Localhost**
WebXR nécessite une connexion sécurisée :
- ✅ `https://...` (production)
- ✅ `http://localhost:...` (développement local)
- ✅ `http://127.0.0.1:...` (développement local)
- ❌ `http://192.168.x.x:...` (adresse IP locale non sécurisée)

### 5. **Test de Diagnostic WebXR**
Ouvrez la console développeur (F12) et exécutez :
```javascript
// Test 1 : Vérifier l'existence de l'API
console.log("navigator.xr existe ?", !!navigator.xr);

// Test 2 : Vérifier le support VR
if (navigator.xr) {
    navigator.xr.isSessionSupported('immersive-vr').then(supported => {
        console.log("immersive-vr supporté ?", supported);
    });
}
```

### 6. **Mise à jour des Pilotes**
- Mettez à jour l'application **Meta Quest** (PC)
- Mettez à jour le firmware du Quest 3 via le casque
- Mettez à jour les pilotes graphiques (NVIDIA/AMD)

## 🔧 Solutions Appliquées au Code

### Modifications effectuées :
1. ✅ **Ajout du polyfill WebXR** dans `index.html` pour une meilleure compatibilité
2. ✅ **Détection améliorée** dans `main.js` avec vérification avant création
3. ✅ **Suppression du sessionMode forcé** - laisse Babylon.js détecter automatiquement
4. ✅ **Messages de diagnostic** clairs dans la console

### Vérifier les modifications :
```bash
# Rechargez la page (Ctrl+F5 pour forcer le rechargement)
# Ouvrez la console (F12)
# Vous devriez voir :
# "Support immersive-vr: true"
# "WebXR activé - Plateforme VR prête"
```

## 🎮 Tester WebXR avec des Sites de Référence

Avant de tester votre application, vérifiez que WebXR fonctionne avec :
1. **WebXR Samples** : https://immersive-web.github.io/webxr-samples/
2. **Babylon.js Playground** : https://playground.babylonjs.com/ (cherchez "XR")

Si ces sites fonctionnent mais pas votre application, le problème vient du code.
Si ces sites ne fonctionnent pas non plus, le problème vient de la configuration Quest Link.

## 🔍 Codes d'Erreur Communs

| Erreur | Cause | Solution |
|--------|-------|----------|
| `NotSupportedError` | WebXR non disponible | Activer flags Chrome |
| `SecurityError` | Pas de HTTPS/localhost | Utiliser HTTPS ou localhost |
| `InvalidStateError` | Quest Link non actif | Démarrer l'application Meta Quest |
| `NotAllowedError` | Permission refusée | Cliquer sur "Autoriser" dans le navigateur |

## 📝 Ordre de Démarrage Recommandé

1. **Démarrer l'application Meta Quest** sur PC
2. **Connecter le Quest 3** (câble ou Air Link)
3. **Attendre l'environnement Quest Link** sur le casque
4. **Ouvrir Chrome/Edge** sur le PC
5. **Naviguer vers** `http://localhost:5000` (votre app)
6. **Ouvrir la console** (F12) pour voir les messages
7. **Cliquer sur le bouton VR** en bas à droite

## 🆘 Si Ça Ne Fonctionne Toujours Pas

### Option 1 : Tester avec le Navigateur Quest Natif
Si Quest Link pose problème, testez directement depuis le navigateur du Quest 3 :
1. Mettez le casque
2. Ouvrez le navigateur Meta Quest
3. Accédez à votre IP locale : `http://[IP_PC]:5000`
4. Note : Nécessite que votre PC et Quest soient sur le même réseau

### Option 2 : Utiliser SideQuest / Developer Mode
Pour un développement plus stable, activez le mode développeur du Quest 3.

### Option 3 : Logs Détaillés
Dans la console, tapez :
```javascript
BABYLON.SceneLoaderFlags.ShowLoadingScreen = false;
BABYLON.EngineFactory.DebugEnabled = true;
```

## 📧 Informations Système Utiles
Partagez ces infos si vous demandez de l'aide :
```javascript
// Dans la console du navigateur :
console.log({
    userAgent: navigator.userAgent,
    hasXR: !!navigator.xr,
    babylonVersion: BABYLON.Engine.Version
});
```

## 🎯 Prochaines Étapes
Une fois WebXR fonctionnel, vous pourrez :
- 🎮 Utiliser les contrôleurs Quest pour interagir avec les nœuds du graphe
- 🚀 Vous téléporter dans l'espace 3D
- 👋 Utiliser le hand tracking (si activé)
- 🔄 Collaborer en multi-utilisateurs en VR

---

**Note** : Les modifications du code permettent une meilleure détection et des messages d'erreur plus explicites. Rechargez la page et vérifiez la console pour les nouveaux messages de diagnostic.
