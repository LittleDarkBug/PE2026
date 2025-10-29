// Fonction pour créer la scène 3D avec visualisation de graphe
function createGraphScene(engine, canvas) {
    const scene = new BABYLON.Scene(engine);

    // Créer une caméra
    const camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, Math.PI / 4, 10, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 5;
    camera.upperRadiusLimit = 50;

    // Créer une lumière principale
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), scene);
    light.intensity = 0.7;

    // Ajouter une lumière directionnelle pour plus de profondeur
    const dirLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-1, -2, -1), scene);
    dirLight.intensity = 0.5;

    // Créer un sol de référence
    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 20, height: 20 }, scene);
    const groundMaterial = new BABYLON.StandardMaterial("groundMat", scene);
    groundMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.3);
    groundMaterial.alpha = 0.3;
    ground.material = groundMaterial;
    ground.position.y = -2;

    // Créer des nœuds de graphe exemple
    createSampleGraph(scene);

    // Configuration WebXR pour la réalité virtuelle
    setupWebXR(scene);

    return scene;
}

// Configuration WebXR pour casques VR
async function setupWebXR(scene) {
    try {
        // Créer l'expérience WebXR par défaut avec support VR
        const xrHelper = await scene.createDefaultXRExperienceAsync({
            floorMeshes: [scene.getMeshByName("ground")],
            optionalFeatures: true
        });

        if (xrHelper.baseExperience) {
            console.log("WebXR activé ! Support VR disponible");
            
            // Configuration des contrôleurs VR
            xrHelper.input.onControllerAddedObservable.add((controller) => {
                controller.onMotionControllerInitObservable.add((motionController) => {
                    console.log("Contrôleur VR détecté:", motionController.handedness);
                    
                    // Ajouter interaction par pointage laser
                    const xr_ids = motionController.getComponentIds();
                    let triggerComponent = motionController.getComponent(xr_ids[0]);
                    
                    if (triggerComponent) {
                        triggerComponent.onButtonStateChangedObservable.add(() => {
                            if (triggerComponent.pressed) {
                                console.log("Trigger pressé sur", motionController.handedness);
                            }
                        });
                    }
                });
            });

            // Téléportation dans l'environnement VR
            const featuresManager = xrHelper.baseExperience.featuresManager;
            featuresManager.enableFeature(BABYLON.WebXRFeatureName.TELEPORTATION, "stable", {
                xrInput: xrHelper.input,
                floorMeshes: [scene.getMeshByName("ground")],
                snapPositions: [new BABYLON.Vector3(2, 0, 2)]
            });

            // Interaction avec les objets (pointer selection)
            featuresManager.enableFeature(BABYLON.WebXRFeatureName.POINTER_SELECTION, "stable", {
                xrInput: xrHelper.input,
                enablePointerSelectionOnAllControllers: true
            });

            console.log("Pour entrer en VR, cliquez sur le bouton VR en bas à droite");
        }
    } catch (error) {
        console.log("WebXR non disponible:", error.message);
        console.log("WebXR nécessite HTTPS ou localhost, et un casque VR compatible");
    }
}

// Fonction pour créer un graphe exemple
function createSampleGraph(scene) {
    const nodes = [];
    const nodeCount = 8;
    const radius = 5;

    // Créer les nœuds en cercle
    for (let i = 0; i < nodeCount; i++) {
        const angle = (i / nodeCount) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = Math.random() * 2 - 1; // Variation en hauteur

        // Créer une sphère pour chaque nœud
        const node = BABYLON.MeshBuilder.CreateSphere(`node${i}`, { diameter: 0.8 }, scene);
        node.position = new BABYLON.Vector3(x, y, z);

        // Matériau pour le nœud
        const material = new BABYLON.StandardMaterial(`nodeMat${i}`, scene);
        material.diffuseColor = new BABYLON.Color3(
            Math.random() * 0.5 + 0.5,
            Math.random() * 0.5 + 0.5,
            1
        );
        material.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.4);
        node.material = material;

        // Rendre le nœud interactif
        node.isPickable = true;
        node.actionManager = new BABYLON.ActionManager(scene);
        
        // Action au clic/sélection (VR et desktop)
        node.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnPickTrigger,
                function(evt) {
                    console.log(`Nœud ${i} sélectionné!`);
                    // Animation de sélection
                    highlightNode(evt.meshUnderPointer, scene);
                }
            )
        );

        // Hover effect (desktop)
        node.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnPointerOverTrigger,
                function(evt) {
                    evt.meshUnderPointer.material.emissiveColor = new BABYLON.Color3(0.5, 0.5, 1);
                }
            )
        );

        node.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnPointerOutTrigger,
                function(evt) {
                    evt.meshUnderPointer.material.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.4);
                }
            )
        );

        // Ajouter une animation de pulsation
        const animation = new BABYLON.Animation(
            `nodeAnim${i}`,
            "scaling",
            30,
            BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
            BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
        );

        const keys = [];
        keys.push({ frame: 0, value: new BABYLON.Vector3(1, 1, 1) });
        keys.push({ frame: 30, value: new BABYLON.Vector3(1.2, 1.2, 1.2) });
        keys.push({ frame: 60, value: new BABYLON.Vector3(1, 1, 1) });
        animation.setKeys(keys);
        node.animations.push(animation);
        scene.beginAnimation(node, 0, 60, true);

        // Ajouter un label 3D au-dessus du nœud
        addNodeLabel(scene, node, `N${i}`, i);

        nodes.push(node);
    }

    // Créer des arêtes entre les nœuds
    for (let i = 0; i < nodeCount; i++) {
        const nextIndex = (i + 1) % nodeCount;
        createEdge(scene, nodes[i].position, nodes[nextIndex].position, i);

        // Créer quelques connexions diagonales
        if (i % 2 === 0 && i + 3 < nodeCount) {
            createEdge(scene, nodes[i].position, nodes[i + 3].position, i + 10);
        }
    }
}

// Fonction pour ajouter un label texte au-dessus d'un nœud
function addNodeLabel(scene, node, text, index) {
    const plane = BABYLON.MeshBuilder.CreatePlane(`label${index}`, { width: 0.8, height: 0.4 }, scene);
    plane.position = new BABYLON.Vector3(node.position.x, node.position.y + 0.7, node.position.z);
    plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

    const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(plane);
    const textBlock = new BABYLON.GUI.TextBlock();
    textBlock.text = text;
    textBlock.color = "white";
    textBlock.fontSize = 48;
    advancedTexture.addControl(textBlock);

    return plane;
}

// Fonction pour mettre en évidence un nœud sélectionné
function highlightNode(node, scene) {
    // Animation de "pop"
    const anim = new BABYLON.Animation(
        "selectAnim",
        "scaling",
        60,
        BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    const keys = [];
    keys.push({ frame: 0, value: node.scaling.clone() });
    keys.push({ frame: 10, value: new BABYLON.Vector3(1.5, 1.5, 1.5) });
    keys.push({ frame: 20, value: node.scaling.clone() });
    anim.setKeys(keys);

    node.animations = [anim];
    scene.beginAnimation(node, 0, 20, false);
    
    // Changer temporairement la couleur
    const originalEmissive = node.material.emissiveColor.clone();
    node.material.emissiveColor = new BABYLON.Color3(1, 1, 0);
    
    setTimeout(() => {
        node.material.emissiveColor = originalEmissive;
    }, 500);
}

// Fonction pour créer une arête entre deux nœuds
function createEdge(scene, start, end, index) {
    const points = [start, end];
    const line = BABYLON.MeshBuilder.CreateLines(`edge${index}`, { points: points }, scene);
    line.color = new BABYLON.Color3(0.5, 0.8, 1);
    line.alpha = 0.6;
    return line;
}