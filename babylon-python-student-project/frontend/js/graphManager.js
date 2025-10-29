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
        // Nettoyer l'ancien graphe
        this.clearGraph();
        
        const nodes = graphData.nodes || [];
        const edges = graphData.edges || [];
        
        console.log(`Rendu de ${nodes.length} nœuds et ${edges.length} arêtes`);
        
        // Sauvegarder le graphe actuel pour pouvoir le restaurer
        this.currentGraph = graphData;
        
        // Si c'est la première fois qu'on charge ce graphe, sauvegarder l'original
        if (!this.originalGraph || graphData.nodes.length >= this.originalGraph.nodes.length) {
            this.originalGraph = JSON.parse(JSON.stringify(graphData));
        }
        
        // Mettre à jour les statistiques
        if (window.uiManager) {
            window.uiManager.updateStats();
        }
        
        // Créer une map des nœuds pour retrouver les positions
        const nodeMap = {};
        
        // Créer les nœuds
        nodes.forEach((nodeData, index) => {
            const nodeMesh = this.createNode(nodeData, index);
            this.graphMeshes.nodes.push(nodeMesh);
            nodeMap[nodeData.id] = nodeMesh;
            
            // Ajouter au shadow generator si disponible
            if (this.scene.shadowGenerator) {
                this.scene.shadowGenerator.addShadowCaster(nodeMesh);
            }
        });
        
        // Créer les arêtes
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
        
        console.log('Graphe rendu avec succès');
    }

    /**
     * Crée un nœud 3D avec matériaux PBR de haute qualité
     */
    createNode(nodeData, index) {
        const position = nodeData.position || { x: 0, y: 0, z: 0 };
        
        // Créer la sphère du nœud avec plus de segments pour une meilleure qualité
        const sphere = BABYLON.MeshBuilder.CreateSphere(
            `node_${nodeData.id}`,
            { diameter: 0.6, segments: 32 },
            this.scene
        );
        
        sphere.position = new BABYLON.Vector3(
            position.x,
            position.y,
            position.z
        );
        
        // Matériau PBR pour rendu réaliste
        const material = new BABYLON.PBRMetallicRoughnessMaterial(`nodeMat_${nodeData.id}`, this.scene);
        
        // Colorer selon le type si disponible
        const hue = (index * 137.5) % 360; // Golden angle pour distribuer les couleurs
        const color = this.hslToRgb(hue / 360, 0.7, 0.6);
        
        material.baseColor = new BABYLON.Color3(color.r, color.g, color.b);
        material.metallic = 0.3;
        material.roughness = 0.4;
        material.emissiveColor = new BABYLON.Color3(color.r * 0.2, color.g * 0.2, color.b * 0.2);
        
        // Activer l'alpha blending pour transparence
        material.alpha = 0.95;
        material.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHABLEND;
        
        sphere.material = material;
        
        // Activer les ombres pour ce mesh
        sphere.receiveShadows = true;
        
        // Rendre interactif
        sphere.isPickable = true;
        sphere.actionManager = new BABYLON.ActionManager(this.scene);
        
        // Stocker les données du nœud
        sphere.metadata = {
            nodeData: nodeData,
            type: 'graph-node'
        };
        
        // Action au clic
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
     * Crée une arête 3D cylindrique entre deux nœuds
     */
    createEdge(startPos, endPos, edgeData, index) {
        // Calculer la direction et la longueur
        const direction = endPos.subtract(startPos);
        const length = direction.length();
        const center = BABYLON.Vector3.Center(startPos, endPos);
        
        // Créer un cylindre pour l'arête (vraie 3D)
        const edge = BABYLON.MeshBuilder.CreateCylinder(
            `edge_${index}`,
            {
                height: length,
                diameter: 0.05,
                tessellation: 8
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
        
        // Matériau PBR pour l'arête
        const edgeMaterial = new BABYLON.PBRMetallicRoughnessMaterial(`edgeMat_${index}`, this.scene);
        edgeMaterial.baseColor = new BABYLON.Color3(0.4, 0.6, 0.9);
        edgeMaterial.metallic = 0.5;
        edgeMaterial.roughness = 0.3;
        edgeMaterial.alpha = 0.7;
        edgeMaterial.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHABLEND;
        
        edge.material = edgeMaterial;
        edge.isPickable = false;
        
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
        
        // Animation d'apparition
        plane.scaling = new BABYLON.Vector3(0, 0, 0);
        BABYLON.Animation.CreateAndStartAnimation(
            "labelAppear",
            plane,
            "scaling",
            60,
            10,
            new BABYLON.Vector3(0, 0, 0),
            new BABYLON.Vector3(1, 1, 1),
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        
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
        // Supprimer tous les nœuds
        this.graphMeshes.nodes.forEach(node => {
            if (node.getChildren) {
                node.getChildren().forEach(child => child.dispose());
            }
            node.dispose();
        });
        
        // Supprimer toutes les arêtes
        this.graphMeshes.edges.forEach(edge => edge.dispose());
        
        this.graphMeshes = { nodes: [], edges: [] };
        this.selectedNodes = [];
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
        this.graphMeshes.nodes.forEach((nodeMesh, index) => {
            if (positions[index]) {
                const targetPos = new BABYLON.Vector3(
                    positions[index].x,
                    positions[index].y,
                    positions[index].z
                );

                // Animation fluide vers la nouvelle position
                BABYLON.Animation.CreateAndStartAnimation(
                    `moveNode_${index}`,
                    nodeMesh,
                    "position",
                    60,
                    60,
                    nodeMesh.position.clone(),
                    targetPos,
                    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
                );
            }
        });

        // Mettre à jour les positions des arêtes après animation
        setTimeout(() => {
            this.updateEdges();
        }, 1100);
    }

    /**
     * Met à jour les positions des arêtes
     */
    updateEdges() {
        // Recréer les arêtes avec les nouvelles positions
        this.graphMeshes.edges.forEach(edge => edge.dispose());
        this.graphMeshes.edges = [];

        if (!this.currentGraph || !this.currentGraph.edges) return;

        this.currentGraph.edges.forEach(edgeData => {
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
                    edgeData
                );
                this.graphMeshes.edges.push(edge);
            }
        });
    }
}

