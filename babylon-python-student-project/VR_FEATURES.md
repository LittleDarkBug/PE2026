# 🎮 Système VR Complet - Guide des Fonctionnalités

## ✨ Vue d'ensemble

Votre application de visualisation 3D de graphes est maintenant **100% utilisable en VR** avec un système de menu complet et toutes les fonctionnalités accessibles sans quitter le mode immersif.

---

## 🚀 Entrer en Mode VR

### Méthode 1 : Bouton VR dans le menu
1. Ouvrez le menu hamburger (☰ en haut à gauche)
2. Cliquez sur **"Entrer en VR"** (bouton violet avec animation)
3. Mettez votre casque VR

### Méthode 2 : Bouton natif Babylon.js
- Si un casque VR est détecté, un bouton VR apparaît en bas à droite du canvas

### Prérequis
- URL doit être `http://localhost:5500/...` (pas 127.0.0.1)
- Casque VR connecté (Meta Quest, HTC Vive, etc.)
- Chrome, Edge, ou navigateur Quest

---

## 🎯 Menu VR - Navigation

### Page Principale
Le menu VR s'affiche automatiquement devant vous en entrant en VR.

**6 catégories principales :**
- 📂 **Gestion des Graphes** - Charger, effacer
- 🎨 **Layouts & Apparence** - Dispositions 3D
- 🔍 **Filtres & Recherche** - Filtrer par type
- 💾 **Export & Sauvegarde** - Captures d'écran
- ⚙️ **Paramètres VR** - Lumières, position
- ❌ **Masquer Menu** - Cacher le menu

### Contrôles VR
- **Pointeur Laser** : Utilisez les contrôleurs pour pointer
- **Trigger** : Cliquer sur les boutons (avec vibration)
- **Joystick Gauche** : Se déplacer dans l'espace
- **Joystick Droit** : Tourner
- **Grip** : Action secondaire

### Sphère Bleue Flottante
Une sphère bleue flotte à gauche du menu :
- **Cliquez dessus** pour afficher/masquer le menu
- Utile si vous avez masqué le menu

---

## 📂 1. Gestion des Graphes

### Charger un Graphe
- **🎲 Charger Graphe Démo** : Graphe de démonstration (backend requis)
- **📊 Graphe Exemple 200 nœuds** : Charge `test_graph_200.json`
- **🌐 Graphe Réseau** : Charge `sample_graph.json`

### Effacer
- **🗑️ Effacer le Graphe** : Supprime tous les nœuds et arêtes

### Note
Les fichiers JSON sont chargés depuis `/frontend/assets/`

---

## 🎨 2. Layouts & Apparence

Choisissez la disposition spatiale de votre graphe :

### 🔵 Force-Directed (par défaut)
- Algorithme physique d'attraction/répulsion
- Idéal pour voir les clusters naturels

### ⭕ Circulaire
- Nœuds disposés en cercle
- Parfait pour les graphes cycliques

### 🌐 Sphérique
- Nœuds répartis sur une sphère
- Utilise tous les axes 3D

### 🎲 Aléatoire
- Disposition aléatoire dans l'espace
- Utile pour recommencer une exploration

### Animations
Toutes les transitions sont animées en VR (durée : 1 seconde)

---

## 🔍 3. Filtres & Recherche

Filtrez le graphe par type de nœud :

- **🖥️ Serveurs** (rouge)
- **🗄️ Databases** (violet)
- **🔌 APIs** (bleu)
- **⚙️ Services** (vert)

### Réinitialiser
- **🔄 Réinitialiser Filtres** : Affiche tous les nœuds à nouveau

### Fonctionnement
- Seuls les nœuds du type sélectionné sont affichés
- Les arêtes sont filtrées automatiquement
- Une notification indique le nombre de nœuds affichés

---

## 💾 4. Export & Sauvegarde

### 📸 Capture d'écran VR
- Prend une capture haute résolution
- Téléchargement automatique

### Statistiques
Le menu affiche :
- Nombre de nœuds dans le graphe actuel
- Nombre d'arêtes

### Export JSON
L'export de fichiers JSON nécessite de sortir du mode VR (limitation navigateur)

---

## ⚙️ 5. Paramètres VR

### Ajustement des Lumières
- **💡 Lumières: Normal** - Valeurs par défaut
- **🔆 Lumières: Forte** - Augmente de 50%
- **🌙 Lumières: Sombre** - Diminue de 50%

### Autres Options
- **ℹ️ Infos Nœuds 3D: ON** - Toujours actif en VR
- **🎯 Réinitialiser Position** - Replace le menu devant vous

### Repositionnement du Menu
Si le menu est derrière vous ou mal placé, utilisez "Réinitialiser Position"

---

## 🎮 Interactions avec les Nœuds

### Sélection
1. Pointez un nœud avec le laser
2. Appuyez sur le trigger
3. Le nœud s'illumine en jaune

### Panneau d'Information 3D
Quand un nœud est sélectionné :
- Un panneau 3D apparaît au-dessus
- Affiche : ID, Type, Label, Connexions
- Badge coloré selon le type
- Animation d'apparition fluide
- Billboard mode (toujours face à vous)

### Désélection
Cliquez sur le même nœud ou sur un autre

---

## 🔒 Protections XR-First

Le système empêche automatiquement :
- ❌ Sortie intempestive du mode VR
- ❌ Alertes JavaScript qui bloquent
- ❌ Perte de focus du canvas
- ❌ Ouverture de fenêtres/onglets

### Mode VR Maintenu
- Le chargement de graphes ne sort pas de VR
- Les changements de layout restent en VR
- Les filtres fonctionnent en VR
- Les animations sont fluides

---

## 🌌 Environnement Spatial

### Background
- Skybox sphérique avec étoiles
- Nébuleuses colorées
- Particules de poussière cosmique
- Rotation lente pour effet vivant

### Éclairage
- 6 sources de lumière
- Ombres douces
- Pipeline HDR avec bloom
- Anti-aliasing (FXAA)

---

## 📊 Statistiques en Temps Réel

### Console du Navigateur
Logs détaillés pour chaque action :
```
VR Menu: Chargement démo demandé
VR Menu: Démo chargée avec succès
renderGraph appelé, mode VR: true
Graphe rendu avec succès, VR maintenu: true
```

### Notifications VR
Toutes les actions affichent une notification 3D :
- ✓ Succès (bleu)
- ✗ Erreur (rouge)
- ℹ️ Information (bleu)

---

## 🐛 Dépannage

### Le bouton VR ne fait rien
1. Vérifiez l'URL : doit être `localhost` (pas 127.0.0.1)
2. Ouvrez la console (F12) pour voir les erreurs
3. Vérifiez que le casque VR est connecté

### Je sors de VR sans le vouloir
- Normal si c'était l'ancien système
- Avec les nouvelles protections, ça ne devrait plus arriver
- Rechargez la page pour appliquer les nouveaux changements

### Le menu est mal positionné
- Utilisez "⚙️ Paramètres VR" → "🎯 Réinitialiser Position"
- Ou cliquez sur la sphère bleue pour le cacher/réafficher

### Les graphes ne chargent pas
1. Vérifiez que les fichiers existent dans `/frontend/assets/`
2. Vérifiez la console pour les erreurs
3. Le backend doit tourner pour "Charger Démo"

### Performances lentes en VR
- Réduisez la taille du graphe
- Utilisez "🌙 Lumières: Sombre" pour économiser
- Fermez les autres applications

---

## 🎓 Meilleures Pratiques

### Pour une expérience optimale :
1. **Commencez petit** : Chargez d'abord un petit graphe
2. **Testez les layouts** : Essayez sphérique en premier (impressionnant en VR)
3. **Utilisez les filtres** : Pour explorer de gros graphes par parties
4. **Réglez les lumières** : Selon votre préférence
5. **Naviguez librement** : Les joysticks permettent de se déplacer partout

### Workflow recommandé :
1. Entrer en VR
2. Ouvrir le menu (automatique)
3. Charger un graphe
4. Appliquer un layout sphérique
5. Explorer en se déplaçant
6. Cliquer sur les nœuds pour les détails
7. Filtrer si besoin
8. Prendre des captures d'écran

---

## 🚀 Fonctionnalités Avancées

### Multi-Graphes
Vous pouvez charger plusieurs graphes successivement :
- L'ancien est effacé automatiquement
- Le nouveau s'affiche avec animation

### Filtres Cumulatifs
Pour l'instant un seul filtre à la fois, mais on peut :
1. Filtrer par type
2. Prendre note des nœuds intéressants
3. Réinitialiser
4. Filtrer par un autre type

### Captures VR
Les screenshots capturent exactement ce que vous voyez dans le casque

---

## 📝 Résumé des Touches/Actions

| Action | Contrôle |
|--------|----------|
| Pointer | Joystick ou mouvement contrôleur |
| Cliquer | Trigger (gâchette) |
| Se déplacer | Joystick gauche |
| Tourner | Joystick droit |
| Menu | Sphère bleue ou automatique |
| Info nœud | Trigger sur nœud |
| Vibration | Automatique sur clic |

---

## 🎉 Conclusion

Votre plateforme est maintenant **entièrement VR-native** ! Vous pouvez :
- ✅ Charger des graphes en VR
- ✅ Changer de layout en VR
- ✅ Filtrer les données en VR
- ✅ Prendre des captures en VR
- ✅ Ajuster les paramètres en VR
- ✅ Explorer librement en 3D
- ✅ Interagir avec les nœuds
- ✅ Naviguer dans le menu complet

**Tout fonctionne sans jamais sortir du mode VR !** 🚀

---

## 📧 Support

Pour toute question ou problème :
1. Consultez la console du navigateur (F12)
2. Vérifiez les logs avec le préfixe "VR Menu:"
3. Testez d'abord en mode desktop pour isoler les problèmes

**Amusez-vous bien en VR !** 🎮✨
