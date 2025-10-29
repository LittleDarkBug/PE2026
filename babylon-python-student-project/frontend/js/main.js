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
    
    // Initialiser l'interface utilisateur
    uiManager = new UIManager(graphManager);

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
        // Créer l'expérience WebXR avec configuration minimale
        const xrHelper = await scene.createDefaultXRExperienceAsync({
            floorMeshes: []
        });

        if (xrHelper.baseExperience) {
            console.log("WebXR activé - Plateforme VR prête");
            
            const featuresManager = xrHelper.baseExperience.featuresManager;
            
            // 1. TÉLÉPORTATION - Navigation rapide dans l'espace 3D
            try {
                const teleportation = featuresManager.enableFeature(
                    BABYLON.WebXRFeatureName.TELEPORTATION, 
                    "stable", 
                    {
                        xrInput: xrHelper.input,
                        floorMeshes: [], // Téléportation libre dans l'espace
                        defaultTargetMeshOptions: {
                            teleportationFillColor: "#3390FF",
                            teleportationBorderColor: "#00FFFF",
                            torusArrowMaterial: scene.getMaterialByName("teleportMat")
                        },
                        timeToTeleport: 3000,
                        useMainComponentOnly: true
                    }
                );
                console.log("Téléportation VR activée");
            } catch (e) {
                console.log("Téléportation non disponible:", e);
            }

            // 2. SÉLECTION PAR POINTEUR - Interaction avec les nœuds du graphe
            try {
                const pointerSelection = featuresManager.enableFeature(
                    BABYLON.WebXRFeatureName.POINTER_SELECTION, 
                    "stable", 
                    {
                        xrInput: xrHelper.input,
                        enablePointerSelectionOnAllControllers: true,
                        preferredHandedness: "none",
                        maxPointerDistance: 100
                    }
                );
                console.log("Sélection pointer VR activée");
            } catch (e) {
                console.log("Pointer selection non disponible:", e);
            }

            // MOUVEMENT désactivé - incompatible avec TELEPORTATION
            // Utilisez la téléportation pour vous déplacer

            // RETOUR HAPTIQUE - Vibrations lors des interactions
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

            // 5. GESTION DES ÉTATS VR
            xrHelper.baseExperience.onStateChangedObservable.add((state) => {
                switch(state) {
                    case BABYLON.WebXRState.IN_XR:
                        console.log("Mode VR immersif activé!");
                        // Adapter l'interface pour VR
                        if (window.uiManager) {
                            window.uiManager.showToast("Mode VR activé", "success");
                        }
                        break;
                    case BABYLON.WebXRState.EXITING_XR:
                        console.log("Sortie du mode VR...");
                        break;
                    case BABYLON.WebXRState.NOT_IN_XR:
                        console.log("Mode desktop actif");
                        break;
                }
            });

            // 6. OPTIMISATIONS PERFORMANCE VR
            scene.getEngine().enableOfflineSupport = false;
            scene.autoClear = false;
            scene.autoClearDepthAndStencil = false;
            
            // Frame rate cible pour VR (90 FPS pour confort)
            scene.getEngine().setHardwareScalingLevel(1.0);

            console.log("✓ Plateforme VR complètement configurée");
            console.log("✓ Cliquez sur le bouton VR pour entrer en mode immersif");
            
            // Stocker xrHelper globalement pour le bouton manuel
            window.xrHelper = xrHelper;
        }
    } catch (error) {
        console.log("WebXR non disponible:", error.message);
        console.log("Note: WebXR nécessite HTTPS ou localhost + casque VR compatible");
    }
}

// Fonction pour forcer l'entrée en VR via le bouton manuel
async function forceEnterVR() {
    try {
        if (window.xrHelper && window.xrHelper.baseExperience) {
            await window.xrHelper.baseExperience.enterXRAsync("immersive-vr", "local-floor");
            console.log("Entrée en VR forcée avec succès");
        } else {
            console.error("XR Helper non initialisé");
            alert("WebXR n'est pas disponible. Vérifiez que votre casque est connecté et que Quest Link est actif.");
        }
    } catch (error) {
        console.error("Erreur lors de l'entrée en VR:", error);
        alert("Impossible d'entrer en VR: " + error.message + "\n\nAssurez-vous que:\n- Le casque Quest 3 est connecté\n- Quest Link est actif\n- OpenXR est configuré sur Oculus");
    }
}

