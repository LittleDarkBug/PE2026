/**
 * Gestionnaire de graphes - Import, visualisation, et manipulation de graphes 3D
 */

class GraphManager {
    constructor(scene, engine) {
        this.scene = scene;
        this.engine = engine;
        this.currentGraph = null;
        this.graphMeshes = {
            nodes: [],
            edges: []
        };
        this.selectedNodes = [];
        this.API_BASE = 'http://127.0.0.1:5000/api';
        
        // Configuration XR/VR optimisée
        this.xrOptimizations = {
            maxNodesForFullDetail: 100,  // Au-delà, réduire les détails
            maxNodesForEdges: 200,       // Au-delà, masquer les arêtes
            nodeSegmentsVR: 16,          // Segments des sphères en VR
            nodeSegmentsDesktop: 32,     // Segments en desktop
            edgeSegmentsVR: 6,           // Segments des cylindres en VR
            edgeSegmentsDesktop: 8       // Segments en desktop
        };
    }

    /**
     * Vérifie si on est en mode VR
     */
    isInVR() {
        return this.scene.activeCamera && this.scene.activeCamera.getClassName() === 'WebXRCamera';
    }
    
    /**
     * Retourne la configuration optimale selon le mode et la taille du graphe
     */
    getOptimalConfig(nodeCount) {
        const isVR = this.isInVR();
        const config = {
            nodeSegments: isVR ? this.xrOptimizations.nodeSegmentsVR : this.xrOptimizations.nodeSegmentsDesktop,
            edgeSegments: isVR ? this.xrOptimizations.edgeSegmentsVR : this.xrOptimizations.edgeSegmentsDesktop,
            showEdges: nodeCount <= this.xrOptimizations.maxNodesForEdges,
            useFullDetail: nodeCount <= this.xrOptimizations.maxNodesForFullDetail,
            useShadows: isVR && nodeCount <= this.xrOptimizations.maxNodesForFullDetail
        };
        
        console.log(`[XR Config] Nodes: ${nodeCount}, VR: ${isVR}, Config:`, config);
        return config;
    }

    /**
     * Charge un graphe depuis le backend
     */
    async loadGraph(graphId) {
        try {
            const response = await fetch(`${this.API_BASE}/graph/${graphId}`);
            const graphData = await response.json();
            
            if (graphData.error) {
                throw new Error(graphData.error);
            }
            
            this.currentGraph = graphData;
            this.renderGraph(graphData);
            
            console.log('Graphe chargé:', graphData.metadata);
            return graphData;
        } catch (error) {
            console.error('Erreur chargement graphe:', error);
            throw error;
        }
    }

    /**
     * Importe un graphe depuis un fichier CSV
     */
    async importCSV(csvContent, sourceCol = 'source', targetCol = 'target', layout = 'force') {
        try {
            const response = await fetch(`${this.API_BASE}/graph/import/csv`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    csv_content: csvContent,
                    source_col: sourceCol,
                    target_col: targetCol,
                    layout: layout
                })
            });
            
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            this.currentGraph = result.graph_data;
            this.renderGraph(result.graph_data);
            
            console.log('Graphe CSV importé:', result.graph_id);
            return result;
        } catch (error) {
            console.error('Erreur import CSV:', error);
            throw error;
        }
    }

    /**
     * Importe un graphe depuis un fichier JSON
     */
    async importJSON(jsonContent, layout = 'force') {
        try {
            const response = await fetch(`${this.API_BASE}/graph/import/json`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    json_content: jsonContent,
                    layout: layout
                })
            });
            
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            this.currentGraph = result.graph_data;
            this.renderGraph(result.graph_data);
            
            console.log('Graphe JSON importé:', result.graph_id);
            return result;
        } catch (error) {
            console.error('Erreur import JSON:', error);
            throw error;
        }
    }

    /**
     * Charge un graphe de démonstration
     */
    async loadDemoGraph() {
        try {
            const response = await fetch(`${this.API_BASE}/graph/demo`);
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            this.currentGraph = result.graph_data;
            this.renderGraph(result.graph_data);
            
            console.log('Graphe de démo chargé');
            return result;
        } catch (error) {
            console.error('Erreur chargement démo:', error);
            throw error;
        }
    }

    /**
     * Rend le graphe en 3D dans la scène Babylon.js
     */
    renderGraph(graphData) {
        console.log('[VR] renderGraph appelé, mode VR:', this.isInVR());
        
        // En VR, ne pas interrompre le rendu
        if (this.isInVR()) {
            // Désactiver temporairement le rendu automatique pour éviter les conflits
            const wasRunning = this.engine.stopRenderLoop;
        }
        
        // Nettoyer l'ancien graphe
        this.clearGraph();
        
        const nodes = graphData.nodes || [];
        const edges = graphData.edges || [];
        
        console.log(`[VR] Rendu de ${nodes.length} nœuds et ${edges.length} arêtes`);
        
        // CRITIQUE : Initialiser les positions si elles n'existent pas
        this.initializePositions(nodes);
        
        // OPTIMISATION XR : Obtenir la configuration optimale
        const xrConfig = this.getOptimalConfig(nodes.length);
        this.currentXRConfig = xrConfig; // Stocker pour utilisation par createNode/createEdge
        
        // Sauvegarder le graphe actuel pour pouvoir le restaurer
        this.currentGraph = graphData;
        
        // Si c'est la première fois qu'on charge ce graphe, sauvegarder l'original
        if (!this.originalGraph || graphData.nodes.length >= this.originalGraph.nodes.length) {
            this.originalGraph = JSON.parse(JSON.stringify(graphData));
        }
        
        // Mettre à jour les statistiques (seulement en mode desktop)
        if (window.uiManager && !this.isInVR()) {
            window.uiManager.updateStats();
        }
        
        // Créer une map des nœuds pour retrouver les positions
        const nodeMap = {};
        
        // Créer les nœuds
        nodes.forEach((nodeData, index) => {
            const nodeMesh = this.createNode(nodeData, index);
            this.graphMeshes.nodes.push(nodeMesh);
            nodeMap[nodeData.id] = nodeMesh;
            
            // Shadow generator déjà géré dans createNode()
            // (pas besoin de le faire ici)
        });
        
        console.log(`[VR] ${this.graphMeshes.nodes.length} nœuds créés dans la scène`);
        
        // Debug VR : Vérifier la visibilité des nœuds
        if (this.isInVR() && this.graphMeshes.nodes.length > 0) {
            const firstNode = this.graphMeshes.nodes[0];
            const camPos = this.scene.activeCamera ? this.scene.activeCamera.position : new BABYLON.Vector3(0, 0, 0);
            const distance = BABYLON.Vector3.Distance(camPos, firstNode.position);
            console.log(`[VR] Caméra position: (${camPos.x.toFixed(2)}, ${camPos.y.toFixed(2)}, ${camPos.z.toFixed(2)})`);
            console.log(`[VR] Premier nœud position: (${firstNode.position.x.toFixed(2)}, ${firstNode.position.y.toFixed(2)}, ${firstNode.position.z.toFixed(2)})`);
            console.log(`[VR] Distance caméra -> nœud: ${distance.toFixed(2)}`);
            console.log(`[VR] Diamètre nœud: ${this.isInVR() ? '1.5' : '0.6'}`);
            
            // Vérifier si les nœuds sont visibles (sans isInFrustum qui crash)
            this.graphMeshes.nodes.forEach((node, i) => {
                if (i < 3) {
                    console.log(`[VR] Node ${i}: visible=${node.isVisible}, enabled=${node.isEnabled()}, material=${node.material ? 'OK' : 'NONE'}`);
                }
            });
        }
        
        // Créer les arêtes (si config XR le permet)
        if (xrConfig.showEdges) {
            edges.forEach((edgeData, index) => {
                const sourceNode = nodeMap[edgeData.source];
                const targetNode = nodeMap[edgeData.target];
                
                if (sourceNode && targetNode) {
                    const edgeMesh = this.createEdge(
                        sourceNode.position,
                        targetNode.position,
                        edgeData,
                        index
                    );
                    this.graphMeshes.edges.push(edgeMesh);
                }
            });
        } else {
            console.log(`[XR Optim] ${edges.length} arêtes masquées pour performance`);
        }
        
        // CRITIQUE VR : Centrer le graphe devant la caméra
        if (this.isInVR() && this.graphMeshes.nodes.length > 0) {
            this.centerGraphForVR();
        }
        
        console.log('[VR] Graphe rendu avec succès, VR maintenu:', this.isInVR());
    }
    
    /**
     * Centre le graphe devant la caméra VR
     */
    centerGraphForVR() {
        if (!this.scene.activeCamera) return;
        
        const camPos = this.scene.activeCamera.position;
        console.log(`[VR] Centrage du graphe - caméra à (${camPos.x.toFixed(2)}, ${camPos.y.toFixed(2)}, ${camPos.z.toFixed(2)})`);
        
        // Calculer le centre du graphe
        let sumX = 0, sumY = 0, sumZ = 0;
        this.graphMeshes.nodes.forEach(node => {
            sumX += node.position.x;
            sumY += node.position.y;
            sumZ += node.position.z;
        });
        const count = this.graphMeshes.nodes.length;
        const centerX = sumX / count;
        const centerY = sumY / count;
        const centerZ = sumZ / count;
        
        console.log(`[VR] Centre graphe: (${centerX.toFixed(2)}, ${centerY.toFixed(2)}, ${centerZ.toFixed(2)})`);
        
        // Décaler pour placer le centre à 5 mètres devant la caméra
        const targetZ = camPos.z - 5;  // 5 mètres devant
        const targetY = camPos.y;      // Même hauteur que la caméra
        const targetX = camPos.x;      // Même X que la caméra
        
        const offsetX = targetX - centerX;
        const offsetY = targetY - centerY;
        const offsetZ = targetZ - centerZ;
        
        console.log(`[VR] Décalage appliqué: (${offsetX.toFixed(2)}, ${offsetY.toFixed(2)}, ${offsetZ.toFixed(2)})`);
        
        // Appliquer le décalage à tous les nœuds
        this.graphMeshes.nodes.forEach(node => {
            node.position.x += offsetX;
            node.position.y += offsetY;
            node.position.z += offsetZ;
        });
        
        // Mettre à jour les arêtes
        this.updateEdges();
        
        console.log(`[VR] Graphe centré devant vous à ${Math.abs(targetZ - camPos.z).toFixed(2)}m`);
    }
    
    /**
     * Initialise les positions des nœuds s'ils n'en ont pas
     * CRITIQUE pour XR : évite que tous les nœuds soient à (0,0,0)
     */
    initializePositions(nodes) {
        if (!nodes || nodes.length === 0) {
            console.warn('[VR] Aucun nœud à positionner');
            return;
        }
        
        // Compter combien de nœuds ont des positions non-nulles
        const nodesWithPositions = nodes.filter(node => 
            node.position && 
            (Math.abs(node.position.x) > 0.01 || Math.abs(node.position.y) > 0.01 || Math.abs(node.position.z) > 0.01)
        ).length;
        
        console.log(`[VR] Nœuds avec positions: ${nodesWithPositions}/${nodes.length}`);
        
        // Si plus de 50% des nœuds ont des positions, on garde celles-ci
        if (nodesWithPositions > nodes.length / 2) {
            console.log('[VR] Positions existantes conservées');
            // Initialiser quand même ceux qui n'ont pas de position
            nodes.forEach((node, i) => {
                if (!node.position || (Math.abs(node.position.x) < 0.01 && Math.abs(node.position.y) < 0.01 && Math.abs(node.position.z) < 0.01)) {
                    const angle = (i / nodes.length) * Math.PI * 2;
                    const radius = Math.max(5, nodes.length * 0.5);
                    node.position = {
                        x: Math.cos(angle) * radius,
                        y: 0,
                        z: Math.sin(angle) * radius
                    };
                    console.log(`[VR] Position générée pour ${node.id}: (${node.position.x.toFixed(2)}, ${node.position.y.toFixed(2)}, ${node.position.z.toFixed(2)})`);
                }
            });
            return;
        }
        
        console.log('[VR] GENERATION COMPLETE - layout circulaire pour tous les nœuds');
        
        // Générer un layout circulaire par défaut pour TOUS
        const nodeCount = nodes.length;
        const radius = Math.max(5, nodeCount * 0.5);
        
        nodes.forEach((node, i) => {
            const angle = (i / nodeCount) * Math.PI * 2;
            node.position = {
                x: Math.cos(angle) * radius,
                y: 0,
                z: Math.sin(angle) * radius
            };
            if (i < 5) { // Afficher les 5 premiers
                console.log(`[VR] Node ${node.id}: pos=(${node.position.x.toFixed(2)}, ${node.position.y.toFixed(2)}, ${node.position.z.toFixed(2)})`);
            }
        });
        console.log(`[VR] ${nodeCount} nœuds positionnés sur cercle de rayon ${radius.toFixed(2)}`);
    }

    /**
     * Crée un nœud 3D avec matériaux PBR de haute qualité
     */
    createNode(nodeData, index) {
        const position = nodeData.position || { x: 0, y: 0, z: 0 };
        
        // Debug VR : vérifier les positions
        if (index < 3 || this.isInVR()) {
            console.log(`[VR] createNode ${nodeData.id}: pos=(${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})`);
        }
        
        // OPTIMISÉ POUR XR/VR - Utiliser la config dynamique
        const config = this.currentXRConfig || this.getOptimalConfig(1);
        
        // Créer la sphère du nœud avec segments adaptés au mode
        // TAILLE AUGMENTÉE pour debug VR : 1.5 au lieu de 0.6
        const diameter = this.isInVR() ? 1.5 : 0.6;
        const sphere = BABYLON.MeshBuilder.CreateSphere(
            `node_${nodeData.id}`,
            { diameter: diameter, segments: config.nodeSegments },
            this.scene
        );
        
        sphere.position = new BABYLON.Vector3(
            position.x,
            position.y,
            position.z
        );
        
        if (index === 0) {
            console.log(`[VR] PREMIER NOEUD créé: ${nodeData.id}, diameter=${diameter}, pos=(${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})`);
        }
        
        // Matériau PBR pour rendu réaliste - OPTIMISÉ XR
        const material = new BABYLON.PBRMetallicRoughnessMaterial(`nodeMat_${nodeData.id}`, this.scene);
        
        // Colorer selon le type si disponible
        const hue = (index * 137.5) % 360; // Golden angle pour distribuer les couleurs
        const color = this.hslToRgb(hue / 360, 0.7, 0.6);
        
        material.baseColor = new BABYLON.Color3(color.r, color.g, color.b);
        material.metallic = 0.3;
        material.roughness = 0.4;
        material.emissiveColor = new BABYLON.Color3(color.r * 0.2, color.g * 0.2, color.b * 0.2);
        
        // PAS d'alpha blending - meilleure performance XR
        // material.alpha = 1.0 par défaut
        
        sphere.material = material;
        
        // OPTIMISATION XR : Ombres conditionnelles selon la taille du graphe
        sphere.receiveShadows = config.useShadows;
        
        // Ajouter au shadow generator si activé et disponible
        if (config.useShadows && this.scene.shadowGenerator) {
            this.scene.shadowGenerator.addShadowCaster(sphere);
        }
        
        // Rendre interactif - COMPATIBLE XR
        sphere.isPickable = true;
        
        // CRITIQUE XR : Utiliser observable au lieu de ActionManager
        // ActionManager peut causer des problèmes en WebXR
        sphere.actionManager = new BABYLON.ActionManager(this.scene);
        
        // Stocker les données du nœud
        sphere.metadata = {
            nodeData: nodeData,
            type: 'graph-node'
        };
        
        // Action au clic - Compatible XR pointer
        sphere.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnPickTrigger,
                (evt) => {
                    this.onNodeClick(evt.meshUnderPointer);
                }
            )
        );
        
        // Hover effects désactivés pour ne pas bloquer la caméra avec touchpad
        // Les utilisateurs peuvent cliquer directement pour sélectionner
        
        /*
        sphere.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnPointerOverTrigger,
                (evt) => {
                    if (!this.selectedNodes.includes(evt.meshUnderPointer)) {
                        evt.meshUnderPointer.material.emissiveColor = evt.meshUnderPointer.material.baseColor.scale(0.5);
                    }
                }
            )
        );
        
        sphere.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnPointerOutTrigger,
                (evt) => {
                    if (!this.selectedNodes.includes(evt.meshUnderPointer)) {
                        const color = evt.meshUnderPointer.material.baseColor;
                        evt.meshUnderPointer.material.emissiveColor = new BABYLON.Color3(
                            color.r * 0.2, 
                            color.g * 0.2, 
                            color.b * 0.2
                        );
                    }
                }
            )
        );
        */
                // Ajouter label
        this.addNodeLabel(sphere, nodeData.label || nodeData.id);
        
        return sphere;
    }

    /**
     * Crée une arête 3D cylindrique entre deux nœuds - OPTIMISÉ XR
     */
    createEdge(startPos, endPos, edgeData, index) {
        // Calculer la direction et la longueur
        const direction = endPos.subtract(startPos);
        const length = direction.length();
        const center = BABYLON.Vector3.Center(startPos, endPos);
        
        // OPTIMISÉ XR - Utiliser la config dynamique
        const config = this.currentXRConfig || this.getOptimalConfig(1);
        
        // Créer un cylindre pour l'arête (vraie 3D)
        // tessellation adaptée au mode (6-8 segments)
        const edge = BABYLON.MeshBuilder.CreateCylinder(
            `edge_${index}`,
            {
                height: length,
                diameter: 0.05,
                tessellation: config.edgeSegments
            },
            this.scene
        );
        
        edge.position = center;
        
        // Orienter le cylindre vers la destination
        const axis = new BABYLON.Vector3(0, 1, 0);
        const quaternion = BABYLON.Quaternion.FromUnitVectorsToRef(
            axis,
            direction.normalize(),
            new BABYLON.Quaternion()
        );
        edge.rotationQuaternion = quaternion;
        
        // Matériau PBR pour l'arête - OPTIMISÉ XR
        const edgeMaterial = new BABYLON.PBRMetallicRoughnessMaterial(`edgeMat_${index}`, this.scene);
        edgeMaterial.baseColor = new BABYLON.Color3(0.4, 0.6, 0.9);
        edgeMaterial.metallic = 0.5;
        edgeMaterial.roughness = 0.3;
        
        // OPTIMISATION XR : Alpha réduit mais pas de transparencyMode pour performance
        edgeMaterial.alpha = 0.8; // Visible mais pas trop coûteux
        
        edge.material = edgeMaterial;
        edge.isPickable = false; // Les arêtes ne sont pas sélectionnables en XR
        
        // OPTIMISATION XR : Pas d'ombres sur les arêtes (trop coûteux)
        edge.receiveShadows = false;
        
        // Stocker les données de l'arête
        edge.metadata = {
            edgeData: edgeData,
            type: 'graph-edge',
            startPos: startPos,
            endPos: endPos
        };
        
        return edge;
    }

    /**
     * Ajoute un label à un nœud - Simple et lisible
     */
    addNodeLabel(nodeMesh, text) {
        // Taille adaptative selon la longueur du texte
        const textLength = text.length;
        const width = Math.max(3, Math.min(8, textLength * 0.4));
        const height = 1.5;
        
        // Créer un plan adaptatif plus grand
        const plane = BABYLON.MeshBuilder.CreatePlane(
            `label_${nodeMesh.name}`,
            { width: width, height: height },
            this.scene
        );
        
        // Positionner très proche du nœud
        plane.position = new BABYLON.Vector3(0, 0.6, 0);
        
        // Billboard pour toujours faire face à la caméra
        plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
        plane.parent = nodeMesh;
        plane.isPickable = false;
        plane.renderingGroupId = 1;
        
        // Texture GUI ultra haute résolution
        const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(
            plane, 
            2048,
            1024
        );
        
        // Pas de container, juste le texte
        const textBlock = new BABYLON.GUI.TextBlock();
        textBlock.text = text;
        textBlock.color = "#FFFFFF";
        textBlock.fontSize = 120; // Taille augmentée
        textBlock.fontWeight = "bold";
        textBlock.fontFamily = "Arial, sans-serif";
        
        // Ombres pour lisibilité sans contour
        textBlock.shadowBlur = 20;
        textBlock.shadowColor = "rgba(0, 0, 0, 1)";
        textBlock.shadowOffsetX = 4;
        textBlock.shadowOffsetY = 4;
        
        advancedTexture.addControl(textBlock);
        
        // Animation d'apparition manuelle (compatible VR)
        plane.scaling = new BABYLON.Vector3(0, 0, 0);
        let frame = 0;
        const duration = 10;
        const observer = this.scene.onBeforeRenderObservable.add(() => {
            frame++;
            const progress = Math.min(frame / duration, 1);
            const easedProgress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            plane.scaling = BABYLON.Vector3.Lerp(
                new BABYLON.Vector3(0, 0, 0),
                new BABYLON.Vector3(1, 1, 1),
                easedProgress
            );
            if (progress >= 1) {
                this.scene.onBeforeRenderObservable.remove(observer);
            }
        });
        
        return plane;
    }

    /**
     * Gestion du clic sur un nœud avec glow effect
     */
    onNodeClick(nodeMesh) {
        console.log('Nœud cliqué:', nodeMesh.metadata.nodeData);
        
        // Toggle selection
        const index = this.selectedNodes.indexOf(nodeMesh);
        if (index > -1) {
            // Désélectionner
            this.selectedNodes.splice(index, 1);
            
            // Retirer du highlight layer
            if (this.highlightLayer) {
                this.highlightLayer.removeMesh(nodeMesh);
            }
            
            // Restaurer l'emissive original
            const color = nodeMesh.material.baseColor;
            nodeMesh.material.emissiveColor = new BABYLON.Color3(
                color.r * 0.2,
                color.g * 0.2,
                color.b * 0.2
            );
            
            // Masquer l'info panel 3D
            this.hideNodeInfo3D();
        } else {
            // Sélectionner
            this.selectedNodes.push(nodeMesh);
            
            // Ajouter au highlight layer pour effet glow
            if (!this.highlightLayer) {
                this.highlightLayer = new BABYLON.HighlightLayer("highlightLayer", this.scene);
                this.highlightLayer.blurHorizontalSize = 1.0;
                this.highlightLayer.blurVerticalSize = 1.0;
            }
            
            this.highlightLayer.addMesh(nodeMesh, BABYLON.Color3.Yellow());
            
            // Augmenter l'emissive
            nodeMesh.material.emissiveColor = new BABYLON.Color3(1, 0.9, 0);
            
            // Afficher l'info panel 3D amélioré
            this.showNodeInfo3D(nodeMesh);
        }
        
        // Émettre un événement personnalisé
        window.dispatchEvent(new CustomEvent('nodeSelected', {
            detail: {
                node: nodeMesh.metadata.nodeData,
                selected: index === -1
            }
        }));
    }
    
    /**
     * Affiche un panneau d'information 3D amélioré au-dessus du nœud
     */
    showNodeInfo3D(nodeMesh) {
        // Masquer l'ancien panneau s'il existe
        this.hideNodeInfo3D();
        
        const nodeData = nodeMesh.metadata.nodeData;
        
        // Créer un plan pour le panneau d'information amélioré
        const infoPanel = BABYLON.MeshBuilder.CreatePlane("nodeInfoPanel", {
            width: 3.5,
            height: 2.5
        }, this.scene);
        
        // Positionner au-dessus du nœud avec un léger offset
        infoPanel.position = nodeMesh.position.clone();
        infoPanel.position.y += 1.8;
        
        // Faire toujours face à la caméra (billboard)
        infoPanel.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
        
        // Créer le matériau avec texture dynamique haute résolution
        const infoPanelMaterial = new BABYLON.StandardMaterial("infoMaterial", this.scene);
        const texture = new BABYLON.DynamicTexture("infoTexture", {width: 1400, height: 1000}, this.scene, false);
        
        const ctx = texture.getContext();
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Fond avec dégradé subtil
        const gradient = ctx.createLinearGradient(0, 0, 0, 1000);
        gradient.addColorStop(0, 'rgba(15, 23, 42, 0.98)');
        gradient.addColorStop(1, 'rgba(30, 41, 59, 0.98)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1400, 1000);
        
        // Bordure double avec effet de profondeur
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 12;
        ctx.strokeRect(6, 6, 1388, 988);
        
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 4;
        ctx.strokeRect(12, 12, 1376, 976);
        
        // Badge de type en haut à droite
        const typeColors = {
            'server': '#ef4444',
            'database': '#8b5cf6',
            'api': '#3b82f6',
            'service': '#10b981',
            'default': '#64748b'
        };
        const typeColor = typeColors[nodeData.type] || typeColors['default'];
        
        ctx.fillStyle = typeColor;
        ctx.fillRect(1100, 40, 260, 80);
        ctx.font = 'bold 45px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText((nodeData.type || 'N/A').toUpperCase(), 1230, 90);
        ctx.textAlign = 'left';
        
        // Titre avec ombre
        ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;
        ctx.font = 'bold 70px Arial';
        ctx.fillStyle = '#60a5fa';
        const titleText = nodeData.label || nodeData.id;
        const maxTitleWidth = 1000;
        let displayTitle = titleText;
        if (ctx.measureText(titleText).width > maxTitleWidth) {
            displayTitle = titleText.substring(0, 20) + '...';
        }
        ctx.fillText(displayTitle, 50, 100);
        ctx.shadowBlur = 0;
        
        // Ligne séparatrice avec dégradé
        const lineGradient = ctx.createLinearGradient(50, 150, 1350, 150);
        lineGradient.addColorStop(0, 'rgba(59, 130, 246, 0)');
        lineGradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.8)');
        lineGradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
        ctx.strokeStyle = lineGradient;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(50, 150);
        ctx.lineTo(1350, 150);
        ctx.stroke();
        
        // Informations avec icônes
        ctx.font = '50px Arial';
        ctx.fillStyle = '#f1f5f9';
        let yPos = 240;
        const lineHeight = 85;
        
        // ID avec icône
        ctx.fillStyle = '#94a3b8';
        ctx.font = '40px Arial';
        ctx.fillText('ID:', 80, yPos);
        ctx.fillStyle = '#f1f5f9';
        ctx.font = '48px monospace';
        ctx.fillText(nodeData.id, 200, yPos);
        yPos += lineHeight;
        
        // Position
        ctx.fillStyle = '#94a3b8';
        ctx.font = '40px Arial';
        ctx.fillText('Position:', 80, yPos);
        ctx.fillStyle = '#f1f5f9';
        ctx.font = '45px monospace';
        ctx.fillText(`(${nodeMesh.position.x.toFixed(1)}, ${nodeMesh.position.y.toFixed(1)}, ${nodeMesh.position.z.toFixed(1)})`, 280, yPos);
        yPos += lineHeight;
        
        // Connexions avec barre visuelle
        if (this.currentGraph && this.currentGraph.edges) {
            const connections = this.currentGraph.edges.filter(
                edge => edge.source === nodeData.id || edge.target === nodeData.id
            ).length;
            
            ctx.fillStyle = '#94a3b8';
            ctx.font = '40px Arial';
            ctx.fillText('Connexions:', 80, yPos);
            ctx.fillStyle = '#10b981';
            ctx.font = 'bold 48px Arial';
            ctx.fillText(connections.toString(), 340, yPos);
            
            // Barre de connexions
            const barWidth = Math.min(connections * 30, 700);
            ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
            ctx.fillRect(450, yPos - 30, 700, 35);
            ctx.fillStyle = '#10b981';
            ctx.fillRect(450, yPos - 30, barWidth, 35);
            
            yPos += lineHeight + 40;
        }
        
        // Séparateur
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(80, yPos - 20);
        ctx.lineTo(1320, yPos - 20);
        ctx.stroke();
        
        // Instructions avec icône
        ctx.font = 'italic 38px Arial';
        ctx.fillStyle = '#64748b';
        ctx.fillText('💡 Cliquez à nouveau pour désélectionner', 80, yPos + 40);
        
        texture.update();
        
        infoPanelMaterial.diffuseTexture = texture;
        infoPanelMaterial.emissiveTexture = texture;
        infoPanelMaterial.emissiveColor = new BABYLON.Color3(0.9, 0.9, 0.9);
        infoPanelMaterial.disableLighting = true;
        infoPanelMaterial.backFaceCulling = false;
        infoPanelMaterial.alpha = 0.98;
        
        infoPanel.material = infoPanelMaterial;
        infoPanel.isPickable = false; // Ne pas interférer avec les clics
        
        // Animation d'apparition manuelle (compatible VR)
        infoPanel.scaling = new BABYLON.Vector3(0, 0, 0);
        let scaleFrame = 0;
        const scaleDuration = 15;
        const scaleObserver = this.scene.onBeforeRenderObservable.add(() => {
            scaleFrame++;
            const progress = Math.min(scaleFrame / scaleDuration, 1);
            const easedProgress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            infoPanel.scaling = BABYLON.Vector3.Lerp(
                new BABYLON.Vector3(0, 0, 0),
                new BABYLON.Vector3(1, 1, 1),
                easedProgress
            );
            if (progress >= 1) {
                this.scene.onBeforeRenderObservable.remove(scaleObserver);
            }
        });
        
        // Légère rotation oscillante pour attirer l'attention
        const rotationAnim = new BABYLON.Animation(
            "infoPanelFloat",
            "rotation.z",
            30,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
        );
        
        const keys = [
            { frame: 0, value: -0.02 },
            { frame: 30, value: 0.02 },
            { frame: 60, value: -0.02 }
        ];
        rotationAnim.setKeys(keys);
        infoPanel.animations.push(rotationAnim);
        this.scene.beginAnimation(infoPanel, 0, 60, true);
        
        // Stocker la référence
        this.currentInfoPanel = infoPanel;
    }
    
    /**
     * Masque le panneau d'information 3D
     */
    hideNodeInfo3D() {
        if (this.currentInfoPanel) {
            this.currentInfoPanel.dispose();
            this.currentInfoPanel = null;
        }
    }

    /**
     * Désélectionne un nœud
     */
    unselectNode(nodeMesh) {
        const index = this.selectedNodes.indexOf(nodeMesh);
        if (index > -1) {
            this.selectedNodes.splice(index, 1);
            
            // Retirer du highlight layer
            if (this.highlightLayer) {
                this.highlightLayer.removeMesh(nodeMesh);
            }
            
            // Restaurer l'emissive original
            const color = nodeMesh.material.baseColor;
            nodeMesh.material.emissiveColor = new BABYLON.Color3(
                color.r * 0.2,
                color.g * 0.2,
                color.b * 0.2
            );
        }
    }

    /**
     * Filtre le graphe selon des critères - Version côté client
     */
    async filterGraph(filters) {
        if (!this.currentGraph) {
            console.error('Aucun graphe chargé');
            return;
        }
        
        try {
            // Créer une copie du graphe original pour le filtrage
            const originalGraph = this.currentGraph;
            const filteredGraph = {
                nodes: [],
                edges: []
            };
            
            // Filtrer les nœuds
            originalGraph.nodes.forEach(node => {
                let keep = true;
                
                // Filtrer par nombre de connexions
                const connections = originalGraph.edges.filter(
                    edge => edge.source === node.id || edge.target === node.id
                ).length;
                
                if (connections < filters.min_connections || connections > filters.max_connections) {
                    keep = false;
                }
                
                // Filtrer par type de nœud
                if (filters.node_type && node.type !== filters.node_type) {
                    keep = false;
                }
                
                // Filtrer par terme de recherche
                if (filters.search_term && !node.label.toLowerCase().includes(filters.search_term)) {
                    keep = false;
                }
                
                if (keep) {
                    filteredGraph.nodes.push(node);
                }
            });
            
            // Créer un Set des IDs de nœuds filtrés pour référence rapide
            const nodeIds = new Set(filteredGraph.nodes.map(n => n.id));
            
            // Filtrer les arêtes (garder uniquement celles entre nœuds filtrés)
            originalGraph.edges.forEach(edge => {
                if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
                    filteredGraph.edges.push(edge);
                }
            });
            
            // Afficher le graphe filtré
            console.log(`Filtrage: ${originalGraph.nodes.length} → ${filteredGraph.nodes.length} nœuds, ${originalGraph.edges.length} → ${filteredGraph.edges.length} arêtes`);
            this.renderGraph(filteredGraph);
            
        } catch (error) {
            console.error('Erreur filtrage:', error);
        }
    }

    /**
     * Nettoie le graphe actuel
     */
    clearGraph() {
        console.log('clearGraph called, VR mode:', this.isInVR());
        
        // Masquer le panneau d'information 3D
        this.hideNodeInfo3D();
        
        // En mode VR, dispose de manière plus douce pour ne pas perturber la session
        if (this.isInVR()) {
            // Désactiver temporairement les meshes avant de les disposer
            this.graphMeshes.nodes.forEach(node => {
                node.isVisible = false;
                if (node.getChildren) {
                    node.getChildren().forEach(child => {
                        child.isVisible = false;
                    });
                }
            });
            
            this.graphMeshes.edges.forEach(edge => {
                edge.isVisible = false;
            });
            
            // Disposer après un micro-délai en VR
            setTimeout(() => {
                this.graphMeshes.nodes.forEach(node => {
                    if (node.getChildren) {
                        node.getChildren().forEach(child => child.dispose());
                    }
                    node.dispose();
                });
                
                this.graphMeshes.edges.forEach(edge => edge.dispose());
            }, 10);
        } else {
            // En mode desktop, dispose immédiatement
            this.graphMeshes.nodes.forEach(node => {
                if (node.getChildren) {
                    node.getChildren().forEach(child => child.dispose());
                }
                node.dispose();
            });
            
            this.graphMeshes.edges.forEach(edge => edge.dispose());
        }
        
        this.graphMeshes = { nodes: [], edges: [] };
        this.selectedNodes = [];
        
        console.log('clearGraph completed, VR maintained:', this.isInVR());
    }

    /**
     * Conversion HSL vers RGB
     */
    hslToRgb(h, s, l) {
        let r, g, b;
        
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        
        
        return { r, g, b };
    }

    /**
     * Applique un nouveau layout aux nœuds existants
     */
    applyLayout(layoutType) {
        if (!this.currentGraph || !this.currentGraph.nodes) {
            console.warn("Aucun graphe chargé");
            return;
        }

        const nodes = this.currentGraph.nodes;
        const nodeCount = nodes.length;
        
        // Calculer les nouvelles positions selon le layout
        let positions = [];
        
        switch(layoutType) {
            case 'circular':
                // Disposition circulaire
                const radius = Math.max(5, nodeCount * 0.5);
                nodes.forEach((node, i) => {
                    const angle = (i / nodeCount) * Math.PI * 2;
                    positions.push({
                        x: Math.cos(angle) * radius,
                        y: 0,
                        z: Math.sin(angle) * radius
                    });
                });
                break;

            case 'sphere':
                // Disposition sphérique
                const sphereRadius = Math.max(8, nodeCount * 0.4);
                nodes.forEach((node, i) => {
                    const phi = Math.acos(-1 + (2 * i) / nodeCount);
                    const theta = Math.sqrt(nodeCount * Math.PI) * phi;
                    positions.push({
                        x: sphereRadius * Math.cos(theta) * Math.sin(phi),
                        y: sphereRadius * Math.sin(theta) * Math.sin(phi),
                        z: sphereRadius * Math.cos(phi)
                    });
                });
                break;

            case 'random':
                // Disposition aléatoire
                const range = Math.max(10, nodeCount * 0.6);
                nodes.forEach(() => {
                    positions.push({
                        x: (Math.random() - 0.5) * range,
                        y: (Math.random() - 0.5) * range,
                        z: (Math.random() - 0.5) * range
                    });
                });
                break;

            case 'force':
            default:
                // Force-directed reste celui par défaut du backend
                // On pourrait recalculer ici ou redemander au serveur
                console.log("Layout force-directed: utilise les positions actuelles du serveur");
                return;
        }

        // Animer les nœuds vers leurs nouvelles positions
        const animationDuration = 60; // frames
        let currentFrame = 0;
        const startPositions = this.graphMeshes.nodes.map(node => node.position.clone());
        
        // Animation manuelle compatible VR
        const animationObserver = this.scene.onBeforeRenderObservable.add(() => {
            currentFrame++;
            const progress = Math.min(currentFrame / animationDuration, 1);
            
            // Easing quadratique (smooth in-out)
            const easedProgress = progress < 0.5 
                ? 2 * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            
            this.graphMeshes.nodes.forEach((nodeMesh, index) => {
                if (positions[index] && startPositions[index]) {
                    const targetPos = new BABYLON.Vector3(
                        positions[index].x,
                        positions[index].y,
                        positions[index].z
                    );
                    
                    // Interpolation linéaire avec easing
                    nodeMesh.position = BABYLON.Vector3.Lerp(
                        startPositions[index],
                        targetPos,
                        easedProgress
                    );
                }
            });
            
            // Mettre à jour les arêtes pendant l'animation
            if (currentFrame % 5 === 0) {
                this.updateEdges();
            }
            
            // Terminer l'animation
            if (progress >= 1) {
                this.scene.onBeforeRenderObservable.remove(animationObserver);
                this.updateEdges();
                console.log('Animation layout terminee');
            }
        });
    }

    /**
     * Met à jour les positions des arêtes
     */
    updateEdges() {
        // Recréer les arêtes avec les nouvelles positions
        this.graphMeshes.edges.forEach(edge => edge.dispose());
        this.graphMeshes.edges = [];

        if (!this.currentGraph || !this.currentGraph.edges) return;

        this.currentGraph.edges.forEach((edgeData, index) => {
            const sourceNode = this.graphMeshes.nodes.find(
                n => n.metadata.nodeData.id === edgeData.source
            );
            const targetNode = this.graphMeshes.nodes.find(
                n => n.metadata.nodeData.id === edgeData.target
            );

            if (sourceNode && targetNode) {
                const edge = this.createEdge(
                    sourceNode.position,
                    targetNode.position,
                    edgeData,
                    index
                );
                this.graphMeshes.edges.push(edge);
            }
        });
    }
    
    /**
     * Diagnostic VR - Affiche les infos sur les nœuds visibles
     * Appeler depuis la console : window.graphManager.diagnoseVR()
     */
    diagnoseVR() {
        console.log('=== DIAGNOSTIC VR ===');
        console.log(`Mode VR: ${this.isInVR()}`);
        console.log(`Nœuds dans graphMeshes: ${this.graphMeshes.nodes.length}`);
        console.log(`Arêtes dans graphMeshes: ${this.graphMeshes.edges.length}`);
        
        if (this.currentGraph) {
            console.log(`Nœuds dans currentGraph: ${this.currentGraph.nodes.length}`);
        }
        
        if (this.scene.activeCamera) {
            const cam = this.scene.activeCamera;
            console.log(`Caméra: ${cam.getClassName()}`);
            console.log(`Position caméra: (${cam.position.x.toFixed(2)}, ${cam.position.y.toFixed(2)}, ${cam.position.z.toFixed(2)})`);
        }
        
        console.log('\n=== PREMIERS NOEUDS ===');
        this.graphMeshes.nodes.slice(0, 5).forEach((node, i) => {
            console.log(`Node ${i} [${node.name}]:`);
            console.log(`  Position: (${node.position.x.toFixed(2)}, ${node.position.y.toFixed(2)}, ${node.position.z.toFixed(2)})`);
            console.log(`  Visible: ${node.isVisible}, Enabled: ${node.isEnabled()}`);
            console.log(`  Material: ${node.material ? 'OK' : 'MANQUANT'}`);
            console.log(`  Parent: ${node.parent ? node.parent.name : 'NONE'}`);
            
            if (this.scene.activeCamera) {
                const distance = BABYLON.Vector3.Distance(this.scene.activeCamera.position, node.position);
                console.log(`  Distance caméra: ${distance.toFixed(2)}`);
            }
        });
        
        console.log('\n=== TOUS LES NOEUDS (positions) ===');
        this.graphMeshes.nodes.forEach((node, i) => {
            const pos = node.position;
            const isAtOrigin = Math.abs(pos.x) < 0.01 && Math.abs(pos.y) < 0.01 && Math.abs(pos.z) < 0.01;
            if (isAtOrigin) {
                console.warn(`⚠️ Node ${i} [${node.name}] à l'origine (0,0,0)!`);
            }
        });
        
        const nodesAtOrigin = this.graphMeshes.nodes.filter(n => 
            Math.abs(n.position.x) < 0.01 && Math.abs(n.position.y) < 0.01 && Math.abs(n.position.z) < 0.01
        ).length;
        
        console.log(`\n⚠️ TOTAL: ${nodesAtOrigin}/${this.graphMeshes.nodes.length} nœuds à l'origine (0,0,0)`);
        
        return {
            totalNodes: this.graphMeshes.nodes.length,
            nodesAtOrigin: nodesAtOrigin,
            isVR: this.isInVR()
        };
    }
}

