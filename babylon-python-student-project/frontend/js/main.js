// Point d'entrée principal de l'application
let graphManager, uiManager;

window.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById("renderCanvas");
    
    if (!canvas) {
        console.error("Canvas element not found!");
        return;
    }

    // Créer le moteur Babylon.js
    const engine = new BABYLON.Engine(canvas, true, { 
        preserveDrawingBuffer: true, 
        stencil: true 
    });

    // Créer la scène de base
    const scene = createBaseScene(engine, canvas);

    // Initialiser le gestionnaire de graphes
    graphManager = new GraphManager(scene, engine);
    window.graphManager = graphManager; // Rendre accessible globalement pour le menu VR
    
    // Initialiser l'interface utilisateur
    uiManager = new UIManager(graphManager);
    window.uiManager = uiManager; // Rendre accessible globalement pour le menu VR

    // Boucle de rendu
    engine.runRenderLoop(function () {
        scene.render();
    });

    // Gérer le redimensionnement de la fenêtre
    window.addEventListener("resize", function () {
        engine.resize();
    });

    // Afficher des informations dans la console
    console.log("Application de Visualisation 3D de Graphes");
    console.log("Backend API:", "http://127.0.0.1:5000/api");
    console.log("Système initialisé avec succès!");
    console.log("\nContrôles:");
    console.log("  • Clic gauche + glisser: Rotation de la caméra");
    console.log("  • Molette: Zoom");
    console.log("  • Clic sur nœud: Sélection et affichage des infos");
    console.log("  • Utilisez le panneau de contrôle à droite");
    
    // Charger un graphe de démonstration au démarrage
    setTimeout(() => {
        graphManager.loadDemoGraph().catch(err => {
            console.log('Backend non disponible. Lancez: python backend/app.py');
        });
    }, 1000);
});

// Fonction pour créer la scène de base avec éclairage avancé
function createBaseScene(engine, canvas) {
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.05, 0.08, 0.15, 1.0);

    // Créer une caméra AVANT le pipeline avec contrôles améliorés
    const camera = new BABYLON.ArcRotateCamera(
        "camera", 
        Math.PI / 2, 
        Math.PI / 4, 
        15, 
        BABYLON.Vector3.Zero(), 
        scene
    );
    camera.attachControl(canvas, true);
    
    // === DÉSACTIVER LES INTERACTIONS QUI BLOQUENT LA CAMÉRA ===
    // Empêcher le changement de curseur et les blocages lors du survol
    canvas.style.cursor = "default";
    scene.hoverCursor = "default";
    scene.defaultCursor = "default";
    
    // Désactiver les actions de hover qui bloquent la caméra
    scene.constantlyUpdateMeshUnderPointer = false;
    
    // Monde illimité - Aucune restriction de distance
    camera.lowerRadiusLimit = 0; // Peut aller au centre (0)
    camera.upperRadiusLimit = Number.MAX_VALUE; // Distance infinie
    
    // === OPTIMISATION TOUCHPAD ===
    // Zoom avec scroll du touchpad - très sensible
    camera.wheelPrecision = 5; // Encore plus sensible pour zoom rapide
    camera.wheelDeltaPercentage = 0.05; // Augmenté pour zoom plus rapide
    
    // Rotation avec touchpad - ultra-sensible
    camera.angularSensibilityX = 250; // Divisé par 2 pour touchpad
    camera.angularSensibilityY = 250; // Plus sensible aux petits mouvements
    
    // Pan avec touchpad (2 doigts) - très sensible
    camera.panningSensibility = 25; // Divisé par 2 pour touchpad
    
    // Inertie réduite pour touchpad (plus direct)
    camera.inertia = 0.7; // Moins d'inertie = plus de contrôle précis
    camera.panningInertia = 0.3; // Pan plus direct
    // Aucune limite de rotation - expérience immersive totale
    camera.lowerAlphaLimit = null; // Rotation horizontale illimitée
    camera.upperAlphaLimit = null;
    camera.lowerBetaLimit = null;  // Rotation verticale illimitée
    camera.upperBetaLimit = null;
    
    // Aucune limite de distance de pan
    camera.panningDistanceLimit = null;
    
    // Collision avec les objets (désactivé pour mouvement libre)
    camera.checkCollisions = false;
    
    // Permettre la rotation continue sans réinitialisation
    camera.allowUpsideDown = true;
    
    // Support tactile optimisé pour touchpad
    camera.useNaturalPinchZoom = true; // Activer pinch-to-zoom naturel
    camera.pinchPrecision = 10; // Très sensible pour touchpad
    camera.pinchDeltaPercentage = 0.002; // Zoom progressif
    camera.multiTouchPanning = true; // Pan avec 2 doigts
    camera.multiTouchPanAndZoom = true; // Zoom et pan simultanés
    
    // Désactiver les gestes qui peuvent gêner
    camera.useCtrlForPanning = false; // Pas besoin de Ctrl sur touchpad
    camera.pinchToPanMaxDistance = 20; // Distance max pour pan tactile
    
    // Autoriser le dépassement des limites (si jamais activées accidentellement)
    camera.lowerRadiusLimitEnforced = false;
    camera.upperRadiusLimitEnforced = false;
    
    // Performance - Vue très étendue
    camera.minZ = 0.01; // Plus proche possible
    camera.maxZ = 100000; // Vue ultra-lointaine
    
    // Activer le mode "smooth" pour les animations
    camera.useAutoRotationBehavior = false;
    camera.useBouncingBehavior = false;
    camera.useFramingBehavior = false;
    
    // Activer le pipeline de rendu HDR pour meilleure qualité (avec vérifications)
    try {
        const pipeline = new BABYLON.DefaultRenderingPipeline(
            "defaultPipeline",
            true,
            scene,
            [camera]
        );
        
        // Configuration du pipeline pour qualité optimale
        if (pipeline.fxaaEnabled !== undefined) {
            pipeline.fxaaEnabled = true; // Anti-aliasing
        }
        if (pipeline.samples !== undefined) {
            pipeline.samples = 4; // Multi-sampling
        }
        
        // Image processing
        if (pipeline.imageProcessingEnabled !== undefined) {
            pipeline.imageProcessingEnabled = true;
        }
        if (pipeline.imageProcessing) {
            pipeline.imageProcessing.toneMappingEnabled = true;
            pipeline.imageProcessing.toneMappingType = BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;
            pipeline.imageProcessing.exposure = 1.2;
            pipeline.imageProcessing.contrast = 1.1;
        }
        
        // Bloom pour effet glow naturel
        if (pipeline.bloomEnabled !== undefined) {
            pipeline.bloomEnabled = true;
            pipeline.bloomThreshold = 0.8;
            pipeline.bloomWeight = 0.3;
            pipeline.bloomKernel = 64;
            pipeline.bloomScale = 0.5;
        }
        
        console.log('Pipeline de rendu HDR activé');
    } catch (error) {
        console.warn('Pipeline HDR non disponible, utilisation du rendu standard:', error.message);
    }

    // Système d'éclairage à 3 points pour qualité cinématographique - Maximum
    // Key light - lumière principale très forte
    const keyLight = new BABYLON.DirectionalLight(
        "keyLight", 
        new BABYLON.Vector3(-1, -2, -1), 
        scene
    );
    keyLight.intensity = 4.0; // Très forte pour excellente visibilité
    keyLight.shadowEnabled = true;
    
    // Shadow generator pour ombres douces
    const shadowGenerator = new BABYLON.ShadowGenerator(1024, keyLight);
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.blurKernel = 32;
    shadowGenerator.bias = 0.00001;
    scene.shadowGenerator = shadowGenerator; // Stocker pour utilisation ultérieure

    // Fill light - lumière de remplissage forte
    const fillLight = new BABYLON.HemisphericLight(
        "fillLight", 
        new BABYLON.Vector3(0, 1, 0), 
        scene
    );
    fillLight.intensity = 1.5; // Très augmenté
    fillLight.groundColor = new BABYLON.Color3(0.4, 0.45, 0.55);

    // Back light - lumière de contour très forte
    const backLight = new BABYLON.PointLight(
        "backLight", 
        new BABYLON.Vector3(0, 5, -10), 
        scene
    );
    backLight.intensity = 2.0; // Doublé
    backLight.diffuse = new BABYLON.Color3(0.8, 1.0, 1.2);
    
    // Lumière ambiante forte pour visibilité totale
    const ambientLight = new BABYLON.HemisphericLight(
        "ambientLight",
        new BABYLON.Vector3(0, 1, 0),
        scene
    );
    ambientLight.intensity = 1.2; // Doublé
    ambientLight.diffuse = new BABYLON.Color3(1.0, 1.0, 1.0);
    ambientLight.specular = new BABYLON.Color3(0.8, 0.8, 0.9);
    
    // Lumières supplémentaires pour éliminer les zones d'ombre
    const sideLight1 = new BABYLON.PointLight(
        "sideLight1",
        new BABYLON.Vector3(10, 0, 0),
        scene
    );
    sideLight1.intensity = 1.0;
    sideLight1.diffuse = new BABYLON.Color3(1.0, 1.0, 1.0);
    
    const sideLight2 = new BABYLON.PointLight(
        "sideLight2",
        new BABYLON.Vector3(-10, 0, 0),
        scene
    );
    sideLight2.intensity = 1.0;
    sideLight2.diffuse = new BABYLON.Color3(1.0, 1.0, 1.0);

    // Pas de sol - espace infini pour exploration immersive
    
    // Skybox sphérique pour immersion spatiale totale (élimine l'effet cube)
    const skybox = BABYLON.MeshBuilder.CreateSphere("skyBox", { 
        diameter: 50000.0,
        segments: 64 // Sphère lisse pour éviter les arêtes visibles
    }, scene);
    const skyboxMaterial = new BABYLON.StandardMaterial("skyBoxMaterial", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.disableLighting = true;
    
    // Dégradé spatial très discret pour ne pas interférer avec l'éclairage du graphe
    skyboxMaterial.emissiveColor = new BABYLON.Color3(0.002, 0.003, 0.006);
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    
    // Créer une texture procédurale sphérique pour l'espace étoilé
    const skyTexture = new BABYLON.DynamicTexture("skyTexture", 4096, scene, false); // Résolution augmentée
    const ctx = skyTexture.getContext();
    const size = 4096;
    
    // Fond spatial avec dégradé radial (effet de profondeur infinie)
    const centerX = size / 2;
    const centerY = size / 2;
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size / 2);
    gradient.addColorStop(0, 'rgba(5, 8, 20, 0.05)');      // Centre très transparent
    gradient.addColorStop(0.4, 'rgba(3, 6, 18, 0.08)');    // Milieu subtil
    gradient.addColorStop(0.7, 'rgba(2, 4, 12, 0.12)');    // Extérieur un peu plus présent
    gradient.addColorStop(1, 'rgba(0, 2, 8, 0.15)');       // Bords légers
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Ajouter des étoiles avec densité variable pour effet de profondeur
    for (let i = 0; i < 2000; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        
        // Calculer la distance du centre pour effet de profondeur
        const distFromCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)) / (size / 2);
        
        // Les étoiles plus au centre sont plus petites/lointaines
        const depthFactor = 0.3 + distFromCenter * 0.7;
        const radius = Math.random() * 0.6 * depthFactor;
        const brightness = (Math.random() * 0.4 + 0.1) * depthFactor;
        
        // Couleur des étoiles très subtiles avec variation de profondeur
        const starType = Math.random();
        let color;
        if (starType < 0.6) {
            color = `rgba(255, 255, 255, ${brightness * 0.4})`;
        } else if (starType < 0.85) {
            color = `rgba(200, 220, 255, ${brightness * 0.35})`;
        } else {
            color = `rgba(255, 240, 200, ${brightness * 0.35})`;
        }
        
        // Effet de glow très réduit uniquement pour étoiles proches
        if (brightness > 0.35 && distFromCenter > 0.6) {
            const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 1.5);
            glowGradient.addColorStop(0, color);
            glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = glowGradient;
            ctx.fillRect(x - radius * 1.5, y - radius * 1.5, radius * 3, radius * 3);
        }
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Ajouter des nébuleuses très discrètes avec profondeur
    for (let i = 0; i < 4; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const radius = 100 + Math.random() * 300;
        
        // Couleurs de nébuleuses très transparentes
        const nebulaColors = [
            'rgba(120, 80, 200, 0.02)',   // Violet ultra-transparent
            'rgba(80, 150, 255, 0.015)',  // Bleu ultra-transparent
            'rgba(200, 100, 150, 0.02)',  // Rose ultra-transparent
            'rgba(100, 200, 150, 0.015)', // Cyan/vert ultra-transparent
        ];
        const color = nebulaColors[Math.floor(Math.random() * nebulaColors.length)];
        
        const nebulaGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        nebulaGradient.addColorStop(0, color);
        nebulaGradient.addColorStop(0.5, color.replace(/[\d.]+\)$/, '0.005)'));
        nebulaGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = nebulaGradient;
        ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
    
    // Réduire drastiquement les étoiles brillantes
    for (let i = 0; i < 10; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const brightness = 0.3 + Math.random() * 0.2; // Beaucoup moins lumineux
        
        // Croix lumineuse plus petite
        ctx.strokeStyle = `rgba(255, 255, 255, ${brightness * 0.3})`;
        ctx.lineWidth = 0.3;
        ctx.beginPath();
        ctx.moveTo(x - 4, y);
        ctx.lineTo(x + 4, y);
        ctx.moveTo(x, y - 4);
        ctx.lineTo(x, y + 4);
        ctx.stroke();
        
        // Point central réduit
        const flareGradient = ctx.createRadialGradient(x, y, 0, x, y, 3);
        flareGradient.addColorStop(0, `rgba(255, 255, 255, ${brightness * 0.5})`);
        flareGradient.addColorStop(0.5, `rgba(200, 220, 255, ${brightness * 0.2})`);
        flareGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = flareGradient;
        ctx.fillRect(x - 3, y - 3, 6, 6);
    }
    
    skyTexture.update();
    skyboxMaterial.emissiveTexture = skyTexture;
    skyboxMaterial.emissiveTexture.level = 0.3; // Très subtil pour ne pas écraser l'éclairage
    skyboxMaterial.alpha = 0.9; // Plus transparent pour laisser passer la lumière
    skyboxMaterial.ambientColor = new BABYLON.Color3(0, 0, 0); // Pas de contribution ambiante
    
    // Configuration pour éliminer l'effet "cube"
    skybox.material = skyboxMaterial;
    skybox.infiniteDistance = true;
    skybox.isPickable = false; // Ne pas interférer avec les interactions
    skybox.rotation.y = Math.PI / 4; // Rotation pour briser la symétrie
    
    // Animation lente de rotation pour dynamisme spatial
    scene.registerBeforeRender(() => {
        skybox.rotation.y += 0.00005; // Rotation très lente, imperceptible mais vivante
    });

    // Système de particules pour poussière cosmique - Version discrète
    const particleSystem = new BABYLON.ParticleSystem("cosmicDust", 500, scene); // Réduit de 2000 à 500
    
    // Texture de particule très petite et subtile
    const particleTexture = new BABYLON.DynamicTexture("particleTexture", 32, scene, false);
    const pCtx = particleTexture.getContext();
    const pSize = 32;
    
    // Créer une particule très transparente
    const pGradient = pCtx.createRadialGradient(pSize/2, pSize/2, 0, pSize/2, pSize/2, pSize/2);
    pGradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)'); // Très transparent
    pGradient.addColorStop(0.4, 'rgba(200, 220, 255, 0.1)'); // Ultra transparent
    pGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    pCtx.fillStyle = pGradient;
    pCtx.fillRect(0, 0, pSize, pSize);
    particleTexture.update();
    
    particleSystem.particleTexture = particleTexture;
    
    // Zone d'émission sphérique autour de la caméra
    particleSystem.createSphereEmitter(100);
    particleSystem.emitter = new BABYLON.Vector3(0, 0, 0);
    
    // Couleurs des particules très discrètes
    particleSystem.color1 = new BABYLON.Color4(0.8, 0.9, 1.0, 0.1); // Très transparent
    particleSystem.color2 = new BABYLON.Color4(0.9, 0.95, 1.0, 0.15); // Très transparent
    particleSystem.colorDead = new BABYLON.Color4(0.8, 0.85, 0.9, 0);
    
    // Taille des particules beaucoup plus petite
    particleSystem.minSize = 0.02;
    particleSystem.maxSize = 0.1;
    
    // Durée de vie plus courte
    particleSystem.minLifeTime = 8;
    particleSystem.maxLifeTime = 15;
    
    // Taux d'émission réduit
    particleSystem.emitRate = 30; // Réduit de 100 à 30
    
    // Vitesse très lente pour discrétion
    particleSystem.minEmitPower = 0.2;
    particleSystem.maxEmitPower = 0.5;
    particleSystem.updateSpeed = 0.005;
    
    // Direction aléatoire
    particleSystem.direction1 = new BABYLON.Vector3(-1, -1, -1);
    particleSystem.direction2 = new BABYLON.Vector3(1, 1, 1);
    
    // Blend mode pour effet lumineux subtil
    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
    
    particleSystem.start();
    
    // Faire suivre l'émetteur avec la caméra pour effet immersif constant
    scene.registerBeforeRender(() => {
        particleSystem.emitter = camera.position.clone();
    });

    // Ajouter des contrôles clavier supplémentaires pour navigation
    scene.onKeyboardObservable.add((kbInfo) => {
        const speed = 0.5;
        switch (kbInfo.type) {
            case BABYLON.KeyboardEventTypes.KEYDOWN:
                switch (kbInfo.event.key) {
                    case "w":
                    case "W":
                    case "z":
                    case "Z":
                        // Avancer (rapprocher)
                        camera.radius -= speed;
                        break;
                    case "s":
                    case "S":
                        // Reculer (éloigner)
                        camera.radius += speed;
                        break;
                    case "a":
                    case "A":
                    case "q":
                    case "Q":
                        // Rotation gauche
                        camera.alpha -= 0.05;
                        break;
                    case "d":
                    case "D":
                        // Rotation droite
                        camera.alpha += 0.05;
                        break;
                    case "r":
                    case "R":
                        // Reset vue
                        camera.alpha = Math.PI / 2;
                        camera.beta = Math.PI / 4;
                        camera.radius = 15;
                        camera.target = BABYLON.Vector3.Zero();
                        break;
                }
                break;
        }
    });

    // Configuration WebXR pour la réalité virtuelle
    setupWebXR(scene);

    return scene;
}

// Configuration WebXR pour casques VR - Optimisé pour utilisation VR
async function setupWebXR(scene) {
    try {
        // Créer l'expérience WebXR complète avec toutes les fonctionnalités
        const xrHelper = await scene.createDefaultXRExperienceAsync({
            floorMeshes: [],
            disableTeleportation: true
        });

        // Stocker globalement pour accès depuis l'UI
        window.xrHelper = xrHelper;

        if (xrHelper.baseExperience) {
            console.log("WebXR activé - Plateforme VR prête");
            
            const featuresManager = xrHelper.baseExperience.featuresManager;
            
            // 1. SÉLECTION PAR POINTEUR - Interaction avec les nœuds du graphe
            try {
                const pointerSelection = featuresManager.enableFeature(
                    BABYLON.WebXRFeatureName.POINTER_SELECTION, 
                    "stable", 
                    {
                        xrInput: xrHelper.input,
                        enablePointerSelectionOnAllControllers: true
                    }
                );
                console.log("Sélection pointer VR activée");
            } catch (e) {
                console.warn("Pointer selection non disponible:", e.message);
            }

            // 2. MOUVEMENT DES MAINS - Navigation avec joysticks
            try {
                const movement = featuresManager.enableFeature(
                    BABYLON.WebXRFeatureName.MOVEMENT,
                    "stable",
                    {
                        xrInput: xrHelper.input,
                        movementOrientationFollowsViewerPose: true,
                        movementSpeed: 1.0,
                        rotationSpeed: 0.5
                    }
                );
                console.log("Mouvement VR activé (joysticks)");
            } catch (e) {
                console.warn("Mouvement VR non disponible:", e.message);
            }

            // 3. RETOUR HAPTIQUE - Vibrations lors des interactions
            xrHelper.input.onControllerAddedObservable.add((controller) => {
                controller.onMotionControllerInitObservable.add((motionController) => {
                    console.log(`Contrôleur ${motionController.handedness} détecté`);
                    
                    // Récupérer les composants du contrôleur
                    const componentIds = motionController.getComponentIds();
                    
                    // Trigger principal (sélection)
                    const triggerComponent = motionController.getComponent(componentIds[0]);
                    if (triggerComponent) {
                        triggerComponent.onButtonStateChangedObservable.add(() => {
                            if (triggerComponent.pressed) {
                                // Vibration lors du clic
                                if (motionController.pulse) {
                                    motionController.pulse(0.6, 100);
                                }
                            }
                        });
                    }
                    
                    // Grip (préhension)
                    const gripComponent = motionController.getComponent("xr-standard-squeeze");
                    if (gripComponent) {
                        gripComponent.onButtonStateChangedObservable.add(() => {
                            if (gripComponent.pressed) {
                                console.log("Grip pressé - Fonction personnalisée possible");
                                if (motionController.pulse) {
                                    motionController.pulse(0.4, 80);
                                }
                            }
                        });
                    }
                });
            });

            // 4. GESTION DES ÉTATS VR
            xrHelper.baseExperience.onStateChangedObservable.add((state) => {
                switch(state) {
                    case BABYLON.WebXRState.IN_XR:
                        console.log("Mode VR immersif activé!");
                        
                        // Marquer globalement qu'on est en VR
                        window.isInVRMode = true;
                        
                        // Masquer tous les panneaux HTML 2D
                        hideHTML2DPanels();
                        // Créer le menu VR 3D
                        createVRMenu(scene, xrHelper);
                        if (window.uiManager) {
                            window.uiManager.showToast("Mode VR activé", "success");
                        }
                        
                        // Empêcher les actions qui sortent de VR
                        preventVRDisruptingActions();
                        
                        // Maintenir le focus sur le canvas
                        const canvas = scene.getEngine().getRenderingCanvas();
                        if (canvas) {
                            canvas.focus();
                            // Prévenir la perte de focus
                            canvas.addEventListener('blur', (e) => {
                                if (window.isInVRMode) {
                                    setTimeout(() => canvas.focus(), 0);
                                }
                            });
                        }
                        break;
                    case BABYLON.WebXRState.EXITING_XR:
                        console.log("Sortie du mode VR...");
                        
                        // Désactiver le mode VR
                        window.isInVRMode = false;
                        
                        // Réafficher les panneaux HTML 2D
                        showHTML2DPanels();
                        // Nettoyer le menu VR
                        if (scene.vrMenu) {
                            scene.vrMenu.dispose();
                            scene.vrMenu = null;
                        }
                        
                        // Restaurer les actions normales
                        restoreNormalActions();
                        break;
                    case BABYLON.WebXRState.NOT_IN_XR:
                        console.log("Mode desktop actif");
                        window.isInVRMode = false;
                        // S'assurer que les panneaux sont visibles
                        showHTML2DPanels();
                        break;
                }
            });

            // 5. OPTIMISATIONS PERFORMANCE VR
            scene.getEngine().enableOfflineSupport = false;
            scene.autoClear = false;
            scene.autoClearDepthAndStencil = false;
            
            // Frame rate cible pour VR (90 FPS pour confort)
            scene.getEngine().setHardwareScalingLevel(1.0);

            console.log("✓ Plateforme VR complètement configurée");
            console.log("✓ Cliquez sur le bouton VR (en bas à droite) pour entrer en mode immersif");
        }
    } catch (error) {
        console.error("WebXR Erreur détaillée:", error);
        console.log("Note: WebXR nécessite HTTPS ou localhost + casque VR compatible");
        
        // Afficher un message d'erreur plus détaillé à l'utilisateur
        if (error.message.includes("session")) {
            console.log("SOLUTION: Votre casque VR ne supporte peut-être pas certaines fonctionnalités.");
            console.log("Essayez de:");
            console.log("1. Redémarrer votre casque VR");
            console.log("2. Vérifier que votre navigateur est à jour");
            console.log("3. Vérifier que WebXR est activé dans les paramètres du navigateur");
        }
    }
}

// Fonctions pour masquer/afficher les panneaux HTML 2D
function hideHTML2DPanels() {
    // Masquer tous les éléments d'interface HTML
    const elementsToHide = [
        document.querySelector('.menu-toggle'),
        document.querySelector('.main-toolbar'),
        document.querySelector('.side-panel'),
        document.querySelector('.stats-panel'),
        document.querySelector('.info-modal')
    ];
    
    elementsToHide.forEach(element => {
        if (element) {
            element.style.display = 'none';
        }
    });
    
    console.log("Panneaux HTML 2D masqués pour mode VR");
}

function showHTML2DPanels() {
    // Réafficher tous les éléments d'interface HTML
    const menuToggle = document.querySelector('.menu-toggle');
    if (menuToggle) menuToggle.style.display = 'flex';
    
    const mainToolbar = document.querySelector('.main-toolbar');
    if (mainToolbar) mainToolbar.style.display = 'flex';
    
    const sidePanel = document.querySelector('.side-panel');
    if (sidePanel) sidePanel.style.display = 'flex';
    
    const statsPanel = document.querySelector('.stats-panel');
    if (statsPanel) statsPanel.style.display = 'block';
    
    const infoModal = document.querySelector('.info-modal');
    if (infoModal && infoModal.classList.contains('active')) {
        infoModal.style.display = 'flex';
    }
    
    console.log("Panneaux HTML 2D réaffichés pour mode desktop");
}

// Empêcher les actions qui perturbent la session VR
function preventVRDisruptingActions() {
    console.log("Protection VR activee - blocage des actions perturbatrices");
    
    // Bloquer les alertes et confirmations
    window.originalAlert = window.alert;
    window.originalConfirm = window.confirm;
    window.originalPrompt = window.prompt;
    
    window.alert = (msg) => console.log('[VR Mode - Alert bloque]:', msg);
    window.confirm = (msg) => { console.log('[VR Mode - Confirm bloque]:', msg); return false; };
    window.prompt = (msg) => { console.log('[VR Mode - Prompt bloque]:', msg); return null; };
    
    // Empêcher l'ouverture de nouveaux onglets/fenêtres
    window.originalOpen = window.open;
    window.open = () => {
        console.warn('[VR Mode - window.open bloque]');
        return null;
    };
}

// Restaurer les actions normales après sortie de VR
function restoreNormalActions() {
    console.log("Protection VR desactivee - restauration des actions normales");
    
    if (window.originalAlert) window.alert = window.originalAlert;
    if (window.originalConfirm) window.confirm = window.originalConfirm;
    if (window.originalPrompt) window.prompt = window.originalPrompt;
    if (window.originalOpen) window.open = window.originalOpen;
}

// Création du menu VR 3D intégré dans la scène - SYSTÈME COMPLET
function createVRMenu(scene, xrHelper) {
    // Créer un plan pour le menu principal
    const menuPanel = BABYLON.MeshBuilder.CreatePlane("vrMenuPanel", {
        width: 6,
        height: 5
    }, scene);
    
    // Positionner le menu devant l'utilisateur
    menuPanel.position = new BABYLON.Vector3(0, 1.5, 5);
    
    // Créer la texture GUI
    const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(menuPanel, 2400, 2000);
    
    // État du menu (quelle page afficher)
    let currentPage = 'main';
    let selectedGraphFiles = []; // Pour stocker les fichiers JSON prêchargés
    
    // Container principal avec scroll
    const scrollViewer = new BABYLON.GUI.ScrollViewer();
    scrollViewer.width = "95%";
    scrollViewer.height = "90%";
    scrollViewer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    scrollViewer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    scrollViewer.thickness = 0;
    scrollViewer.barColor = "#3b82f6";
    scrollViewer.barBackground = "#1e293b";
    advancedTexture.addControl(scrollViewer);
    
    const panel = new BABYLON.GUI.StackPanel();
    panel.width = "100%";
    panel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    scrollViewer.addControl(panel);
    
    // Fond semi-transparent
    const background = new BABYLON.GUI.Rectangle();
    background.width = 1;
    background.height = 1;
    background.background = "rgba(15, 23, 42, 0.98)";
    background.cornerRadius = 20;
    background.thickness = 4;
    background.color = "#3b82f6";
    advancedTexture.addControl(background);
    background.zIndex = -1;
    
    // Fonction pour vider le panel
    function clearPanel() {
        // Vider sans déclencher de re-render complet
        while (panel.children.length > 0) {
            panel.removeControl(panel.children[0]);
        }
    }
    
    // Fonction helper pour créer un titre
    function createTitle(text) {
        const title = new BABYLON.GUI.TextBlock();
        title.text = text;
        title.height = "100px";
        title.fontSize = 70;
        title.color = "#60a5fa";
        title.fontWeight = "bold";
        title.paddingBottom = "30px";
        title.paddingTop = "20px";
        panel.addControl(title);
    }
    
    // Fonction helper pour créer un bouton
    function createVRButton(text, callback, color = "#1e293b") {
        const button = BABYLON.GUI.Button.CreateSimpleButton("btn_" + text.replace(/\s/g, '_'), text);
        button.width = "90%";
        button.height = "100px";
        button.color = "#f1f5f9";
        button.background = color;
        button.fontSize = 45;
        button.cornerRadius = 10;
        button.thickness = 2;
        button.paddingTop = "15px";
        button.paddingBottom = "15px";
        
        button.onPointerEnterObservable.add(() => {
            button.background = "#3b82f6";
        });
        
        button.onPointerOutObservable.add(() => {
            button.background = color;
        });
        
        button.onPointerClickObservable.add(() => {
            // Exécuter le callback dans un délai pour éviter de perturber la session XR
            setTimeout(() => {
                try {
                    callback();
                } catch(error) {
                    console.error('Erreur callback VR:', error);
                }
            }, 0);
        });
        
        panel.addControl(button);
    }
    
    // Fonction helper pour créer un séparateur
    function createSeparator() {
        const separator = new BABYLON.GUI.Rectangle();
        separator.height = "2px";
        separator.width = "80%";
        separator.background = "#475569";
        separator.thickness = 0;
        separator.paddingTop = "10px";
        separator.paddingBottom = "10px";
        panel.addControl(separator);
    }
    
    // Fonction helper pour créer un texte d'information
    function createInfoText(text) {
        const info = new BABYLON.GUI.TextBlock();
        info.text = text;
        info.height = "60px";
        info.fontSize = 35;
        info.color = "#94a3b8";
        info.fontStyle = "italic";
        info.paddingTop = "15px";
        info.paddingBottom = "15px";
        info.textWrapping = true;
        panel.addControl(info);
    }
    
    // PAGE PRINCIPALE
    function showMainPage() {
        currentPage = 'main';
        clearPanel();
        createTitle("MENU VR - Visualisation 3D");
        
        createVRButton("Gestion des Graphes", () => showGraphManagementPage(), "#1e293b");
        createVRButton("Layouts & Apparence", () => showLayoutPage(), "#1e293b");
        createVRButton("Filtres & Recherche", () => showFilterPage(), "#1e293b");
        createVRButton("Export & Sauvegarde", () => showExportPage(), "#1e293b");
        createVRButton("Parametres VR", () => showSettingsPage(), "#1e293b");
        
        createSeparator();
        createVRButton("Masquer Menu", () => {
            menuPanel.setEnabled(false);
            scene.vrMenuHidden = true;
            showVRNotification(scene, "Menu masque - Touchez la sphere bleue", 3000);
        }, "#dc2626");
        
        createInfoText("Utilisez le pointeur laser pour interagir");
    }
    
    // PAGE GESTION DES GRAPHES
    function showGraphManagementPage() {
        currentPage = 'graphs';
        clearPanel();
        createTitle("Gestion des Graphes");
        
        createVRButton("Retour", () => showMainPage(), "#475569");
        createSeparator();
        
        createVRButton("Charger Graphe Demo", () => {
            if (window.graphManager) {
                showVRNotification(scene, "Chargement en cours...", 1500);
                const currentXRSession = xrHelper.baseExperience.sessionManager.session;
                
                window.graphManager.loadDemoGraph()
                    .then(() => {
                        if (currentXRSession && !currentXRSession.ended) {
                            showVRNotification(scene, "Graphe demo charge", 2500);
                        }
                    })
                    .catch((error) => {
                        if (currentXRSession && !currentXRSession.ended) {
                            showVRNotification(scene, "Erreur: " + error.message, 2500);
                        }
                    });
            }
        }, "#10b981");
        
        createVRButton("Charger Fichier JSON", () => {
            showImportDialogVR();
        }, "#3b82f6");
        
        createVRButton("Effacer le Graphe", () => {
            if (window.graphManager) {
                window.graphManager.clearGraph();
                showVRNotification(scene, "Graphe efface", 2000);
            }
        }, "#dc2626");
        
        createSeparator();
        createInfoText("Chargez des donnees pour commencer");
    }
    
    // Dialogue d'import en VR
    function showImportDialogVR() {
        clearPanel();
        createTitle("Import Fichier JSON");
        
        createVRButton("Retour", () => showGraphManagementPage(), "#475569");
        createSeparator();
        
        createInfoText("Fichiers disponibles:");
        
        createVRButton("sample_graph.json", () => {
            loadPredefinedGraph('sample_graph.json');
            setTimeout(() => showGraphManagementPage(), 1000);
        }, "#1e293b");
        
        createVRButton("test_graph_200.json", () => {
            loadPredefinedGraph('test_graph_200.json');
            setTimeout(() => showGraphManagementPage(), 1000);
        }, "#1e293b");
    }
    
    // PAGE LAYOUTS
    function showLayoutPage() {
        currentPage = 'layouts';
        clearPanel();
        createTitle("Layouts & Apparence");
        
        createVRButton("Retour", () => showMainPage(), "#475569");
        createSeparator();
        
        createInfoText("Choisissez la disposition du graphe:");
        
        createVRButton("Layout Force-Directed", () => {
            applyLayoutVR('force');
        }, "#3b82f6");
        
        createVRButton("Layout Circulaire", () => {
            applyLayoutVR('circular');
        }, "#8b5cf6");
        
        createVRButton("Layout Spherique", () => {
            applyLayoutVR('sphere');
        }, "#10b981");
        
        createVRButton("Layout Aleatoire", () => {
            applyLayoutVR('random');
        }, "#f59e0b");
        
        createSeparator();
        createInfoText("Les animations sont fluides en VR");
    }
    
    // PAGE FILTRES
    function showFilterPage() {
        currentPage = 'filters';
        clearPanel();
        createTitle("Filtres & Recherche");
        
        createVRButton("Retour", () => showMainPage(), "#475569");
        createSeparator();
        
        createInfoText("Filtrage par type de noeud:");
        
        createVRButton("Afficher Serveurs uniquement", () => {
            filterByType('server');
        }, "#ef4444");
        
        createVRButton("Afficher Databases uniquement", () => {
            filterByType('database');
        }, "#8b5cf6");
        
        createVRButton("Afficher APIs uniquement", () => {
            filterByType('api');
        }, "#3b82f6");
        
        createVRButton("Afficher Services uniquement", () => {
            filterByType('service');
        }, "#10b981");
        
        createSeparator();
        
        createVRButton("Reinitialiser Filtres", () => {
            if (window.graphManager && window.graphManager.originalGraph) {
                window.graphManager.renderGraph(window.graphManager.originalGraph);
                showVRNotification(scene, "Filtres reinitialises", 2000);
            }
        }, "#f59e0b");
    }
    
    // PAGE EXPORT
    function showExportPage() {
        currentPage = 'export';
        clearPanel();
        createTitle("Export & Sauvegarde");
        
        createVRButton("Retour", () => showMainPage(), "#475569");
        createSeparator();
        
        createInfoText("Export disponible en mode desktop");
        createInfoText("Sortez de VR pour exporter les donnees");
        
        createVRButton("Capture d'ecran VR", () => {
            captureVRScreenshot();
        }, "#10b981");
        
        createSeparator();
        
        if (window.graphManager && window.graphManager.currentGraph) {
            const nodeCount = window.graphManager.currentGraph.nodes?.length || 0;
            const edgeCount = window.graphManager.currentGraph.edges?.length || 0;
            createInfoText(`Graphe actuel: ${nodeCount} noeuds, ${edgeCount} aretes`);
        }
    }
    
    // PAGE PARAMETRES
    function showSettingsPage() {
        currentPage = 'settings';
        clearPanel();
        createTitle("Parametres VR");
        
        createVRButton("Retour", () => showMainPage(), "#475569");
        createSeparator();
        
        createInfoText("Affichage:");
        
        createVRButton("Lumieres: Normal", () => {
            adjustLighting('normal');
        }, "#1e293b");
        
        createVRButton("Lumieres: Forte", () => {
            adjustLighting('bright');
        }, "#1e293b");
        
        createVRButton("Lumieres: Sombre", () => {
            adjustLighting('dark');
        }, "#1e293b");
        
        createSeparator();
        
        createVRButton("Infos Noeuds 3D: ON", () => {
            showVRNotification(scene, "Panneaux 3D toujours actives", 2000);
        }, "#10b981");
        
        createVRButton("Reinitialiser Position", () => {
            // Repositionner le menu devant l'utilisateur
            if (scene.activeCamera) {
                const camera = scene.activeCamera;
                const forward = camera.getForwardRay(5).direction;
                menuPanel.position = camera.position.add(forward.scale(5));
                menuPanel.position.y = 1.5;
                showVRNotification(scene, "Menu repositionne", 1500);
            }
        }, "#3b82f6");
    }
    
    // === FONCTIONS HELPER POUR LES ACTIONS ===
    
    function loadPredefinedGraph(filename) {
        if (!window.graphManager) return;
        
        console.log('[VR] Debut chargement:', filename);
        showVRNotification(scene, "Chargement...", 1500);
        
        // Sauvegarder l'état VR
        const wasInVR = window.isInVRMode;
        
        fetch(`/babylon-python-student-project/frontend/assets/${filename}`)
            .then(response => {
                console.log('[VR] Fetch response recu');
                return response.json();
            })
            .then(graphData => {
                console.log('[VR] JSON parse, still in VR:', window.isInVRMode);
                
                // S'assurer qu'on est toujours en VR avant de render
                if (wasInVR && window.isInVRMode) {
                    // Utiliser requestAnimationFrame pour synchroniser avec le rendu VR
                    requestAnimationFrame(() => {
                        window.graphManager.renderGraph(graphData);
                        showVRNotification(scene, `${filename} charge`, 2500);
                    });
                } else {
                    window.graphManager.renderGraph(graphData);
                    if (wasInVR && !window.isInVRMode) {
                        console.error('[VR] Session perdue pendant le chargement!');
                    }
                }
            })
            .catch(error => {
                console.error('[VR] Erreur chargement:', error);
                showVRNotification(scene, "Fichier introuvable", 2500);
            });
    }
    
    function applyLayoutVR(layoutType) {
        console.log('[VR] Apply layout:', layoutType);
        
        if (window.graphManager && window.graphManager.currentGraph) {
            // Utiliser requestAnimationFrame pour synchroniser avec le rendu VR
            requestAnimationFrame(() => {
                window.graphManager.applyLayout(layoutType);
                showVRNotification(scene, `Layout ${layoutType} applique`, 2000);
            });
        } else {
            showVRNotification(scene, "Chargez d'abord un graphe", 2500);
        }
    }
    
    function filterByType(type) {
        console.log('[VR] Filter by type:', type);
        
        if (!window.graphManager || !window.graphManager.originalGraph) {
            showVRNotification(scene, "Aucun graphe charge", 2500);
            return;
        }
        
        const original = window.graphManager.originalGraph;
        const filteredNodes = original.nodes.filter(node => node.type === type);
        const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
        const filteredEdges = original.edges.filter(edge => 
            filteredNodeIds.has(edge.source) && filteredNodeIds.has(edge.target)
        );
        
        const filteredGraph = {
            nodes: filteredNodes,
            edges: filteredEdges,
            metadata: original.metadata
        };
        
        // Utiliser requestAnimationFrame pour synchroniser avec le rendu VR
        requestAnimationFrame(() => {
            window.graphManager.renderGraph(filteredGraph);
            showVRNotification(scene, `Filtre: ${filteredNodes.length} noeuds ${type}`, 2500);
        });
    }
    
    function captureVRScreenshot() {
        if (scene && scene.getEngine()) {
            BABYLON.Tools.CreateScreenshot(scene.getEngine(), scene.activeCamera, { precision: 2 });
            showVRNotification(scene, "Capture d'ecran enregistree", 2000);
        }
    }
    
    function adjustLighting(mode) {
        const lights = scene.lights;
        
        switch(mode) {
            case 'bright':
                lights.forEach(light => light.intensity *= 1.5);
                showVRNotification(scene, "Lumieres augmentees", 2000);
                break;
            case 'dark':
                lights.forEach(light => light.intensity *= 0.5);
                showVRNotification(scene, "Lumieres diminuees", 2000);
                break;
            case 'normal':
            default:
                // Réinitialiser aux valeurs par défaut
                lights.forEach((light, i) => {
                    if (light.name === 'keyLight') light.intensity = 4.0;
                    else if (light.name === 'fillLight') light.intensity = 1.5;
                    else if (light.name === 'backLight') light.intensity = 2.0;
                    else if (light.name === 'ambientLight') light.intensity = 1.2;
                    else light.intensity = 1.0;
                });
                showVRNotification(scene, "Lumieres normales", 2000);
                break;
        }
    }
    
    // === INITIALISATION DU MENU ===
    
    // Afficher la page principale au démarrage
    showMainPage();
    
    // Bouton flottant pour afficher/masquer le menu
    const toggleButton = BABYLON.MeshBuilder.CreateSphere("vrMenuToggle", {
        diameter: 0.3
    }, scene);
    toggleButton.position = new BABYLON.Vector3(-2, 1.5, 2);
    
    const toggleMaterial = new BABYLON.StandardMaterial("toggleMat", scene);
    toggleMaterial.diffuseColor = new BABYLON.Color3(0.23, 0.51, 0.96);
    toggleMaterial.emissiveColor = new BABYLON.Color3(0.23, 0.51, 0.96);
    toggleButton.material = toggleMaterial;
    
    toggleButton.actionManager = new BABYLON.ActionManager(scene);
    toggleButton.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPickTrigger,
            () => {
                if (scene.vrMenuHidden) {
                    menuPanel.setEnabled(true);
                    scene.vrMenuHidden = false;
                    showVRNotification(scene, "Menu affiché", 1000);
                } else {
                    menuPanel.setEnabled(false);
                    scene.vrMenuHidden = true;
                    showVRNotification(scene, "Menu masqué", 1000);
                }
            }
        )
    );
    
    // Stocker les références
    scene.vrMenu = menuPanel;
    scene.vrMenuToggle = toggleButton;
    
    console.log("Menu VR 3D créé avec succès");
}

// Afficher une notification temporaire en VR
function showVRNotification(scene, message, duration = 2000) {
    const notifPanel = BABYLON.MeshBuilder.CreatePlane("vrNotification", {
        width: 3,
        height: 0.5
    }, scene);
    
    notifPanel.position = new BABYLON.Vector3(0, 2.5, 3);
    notifPanel.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
    
    const notifTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(notifPanel, 1024, 170);
    
    const notifBg = new BABYLON.GUI.Rectangle();
    notifBg.background = "rgba(59, 130, 246, 0.9)";
    notifBg.cornerRadius = 20;
    notifBg.thickness = 0;
    notifTexture.addControl(notifBg);
    
    const notifText = new BABYLON.GUI.TextBlock();
    notifText.text = message;
    notifText.color = "white";
    notifText.fontSize = 60;
    notifText.fontWeight = "bold";
    notifTexture.addControl(notifText);
    
    // Animation d'apparition manuelle (compatible VR)
    notifPanel.scaling = new BABYLON.Vector3(0, 0, 0);
    let scaleInFrame = 0;
    const scaleInDuration = 10;
    const scaleInObserver = scene.onBeforeRenderObservable.add(() => {
        scaleInFrame++;
        const progress = Math.min(scaleInFrame / scaleInDuration, 1);
        const easedProgress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        notifPanel.scaling = BABYLON.Vector3.Lerp(
            new BABYLON.Vector3(0, 0, 0),
            new BABYLON.Vector3(1, 1, 1),
            easedProgress
        );
        if (progress >= 1) {
            scene.onBeforeRenderObservable.remove(scaleInObserver);
        }
    });
    
    // Disparition après le délai
    setTimeout(() => {
        let scaleOutFrame = 0;
        const scaleOutDuration = 10;
        const scaleOutObserver = scene.onBeforeRenderObservable.add(() => {
            scaleOutFrame++;
            const progress = Math.min(scaleOutFrame / scaleOutDuration, 1);
            const easedProgress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            notifPanel.scaling = BABYLON.Vector3.Lerp(
                new BABYLON.Vector3(1, 1, 1),
                new BABYLON.Vector3(0, 0, 0),
                easedProgress
            );
            if (progress >= 1) {
                scene.onBeforeRenderObservable.remove(scaleOutObserver);
                notifPanel.dispose();
            }
        });
    }, duration);
}
