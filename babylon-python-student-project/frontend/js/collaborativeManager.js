/**
 * CollaborativeManager - Gestion des sessions collaboratives multi-utilisateurs
 */
class CollaborativeManager {
    constructor(graphManager, scene) {
        this.graphManager = graphManager;
        this.scene = scene;
        this.socket = null;
        this.sessionId = null;
        this.userId = this.generateUserId();
        this.connectedUsers = new Map();
        this.userCursors = new Map();
        this.isConnected = false;
    }

    /**
     * Génère un ID unique pour l'utilisateur
     */
    generateUserId() {
        return 'user_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Se connecte au serveur WebSocket
     */
    connect() {
        if (this.socket) {
            console.log('Déjà connecté');
            return;
        }

        this.socket = io('http://127.0.0.1:5000', {
            transports: ['websocket', 'polling']
        });

        this.setupEventListeners();
    }

    /**
     * Configure les écouteurs d'événements WebSocket
     */
    setupEventListeners() {
        // Connexion établie
        this.socket.on('connect', () => {
            console.log('Connecté au serveur collaboratif');
            this.isConnected = true;
        });

        // Déconnexion
        this.socket.on('disconnect', () => {
            console.log('Déconnecté du serveur collaboratif');
            this.isConnected = false;
            this.clearAllUserCursors();
        });

        // Nouveau message de session
        this.socket.on('session_message', (data) => {
            console.log('Message de session:', data);
        });

        // Nouvel utilisateur rejoint
        this.socket.on('user_joined', (data) => {
            console.log('Utilisateur rejoint:', data.user_id);
            this.connectedUsers.set(data.user_id, data);
            this.createUserCursor(data.user_id, data.username || data.user_id);
            
            if (window.uiManager) {
                window.uiManager.showToast(
                    `${data.username || 'Utilisateur'} a rejoint la session`,
                    'info'
                );
            }
        });

        // Utilisateur quitte
        this.socket.on('user_left', (data) => {
            console.log('Utilisateur quitte:', data.user_id);
            this.connectedUsers.delete(data.user_id);
            this.removeUserCursor(data.user_id);
            
            if (window.uiManager) {
                window.uiManager.showToast(
                    `${data.username || 'Utilisateur'} a quitté la session`,
                    'info'
                );
            }
        });

        // Position de curseur d'un autre utilisateur
        this.socket.on('cursor_update', (data) => {
            if (data.user_id !== this.userId) {
                this.updateUserCursor(data.user_id, data.position);
            }
        });

        // Nœud sélectionné par un autre utilisateur
        this.socket.on('node_selected', (data) => {
            if (data.user_id !== this.userId) {
                this.highlightRemoteSelection(data.node_id, data.user_id);
            }
        });

        // État du graphe mis à jour
        this.socket.on('graph_updated', (data) => {
            console.log('Graphe mis à jour par:', data.user_id);
            if (data.user_id !== this.userId && data.graph_data) {
                this.graphManager.renderGraph(data.graph_data);
            }
        });
    }

    /**
     * Crée ou rejoint une session collaborative
     */
    async createOrJoinSession(sessionName) {
        if (!this.isConnected) {
            this.connect();
            // Attendre la connexion
            await new Promise(resolve => {
                const checkConnection = setInterval(() => {
                    if (this.isConnected) {
                        clearInterval(checkConnection);
                        resolve();
                    }
                }, 100);
            });
        }

        this.socket.emit('join_session', {
            session_id: sessionName,
            user_id: this.userId,
            username: 'Utilisateur_' + this.userId.substr(-4)
        });

        this.sessionId = sessionName;
        console.log('Session rejointe:', sessionName);
    }

    /**
     * Quitte la session actuelle
     */
    leaveSession() {
        if (!this.socket || !this.sessionId) return;

        this.socket.emit('leave_session', {
            session_id: this.sessionId,
            user_id: this.userId
        });

        this.clearAllUserCursors();
        this.sessionId = null;
        console.log('Session quittée');
    }

    /**
     * Envoie la position du curseur
     */
    sendCursorPosition(position) {
        if (!this.socket || !this.sessionId) return;

        this.socket.emit('cursor_move', {
            session_id: this.sessionId,
            user_id: this.userId,
            position: position
        });
    }

    /**
     * Envoie une sélection de nœud
     */
    sendNodeSelection(nodeId) {
        if (!this.socket || !this.sessionId) return;

        this.socket.emit('select_node', {
            session_id: this.sessionId,
            user_id: this.userId,
            node_id: nodeId
        });
    }

    /**
     * Envoie une mise à jour du graphe
     */
    sendGraphUpdate(graphData) {
        if (!this.socket || !this.sessionId) return;

        this.socket.emit('update_graph', {
            session_id: this.sessionId,
            user_id: this.userId,
            graph_data: graphData
        });
    }

    /**
     * Crée un curseur 3D pour un utilisateur distant
     */
    createUserCursor(userId, username) {
        if (this.userCursors.has(userId)) return;

        // Créer un curseur visuel (sphère + label)
        const cursor = BABYLON.MeshBuilder.CreateSphere(
            `cursor_${userId}`,
            { diameter: 0.3, segments: 16 },
            this.scene
        );

        const material = new BABYLON.StandardMaterial(`cursorMat_${userId}`, this.scene);
        const hue = Math.random();
        const color = this.hslToRgb(hue, 0.8, 0.6);
        material.diffuseColor = new BABYLON.Color3(color.r, color.g, color.b);
        material.emissiveColor = material.diffuseColor.scale(0.5);
        cursor.material = material;
        cursor.isPickable = false;

        // Ajouter un label
        const plane = BABYLON.MeshBuilder.CreatePlane(
            `cursorLabel_${userId}`,
            { width: 2, height: 0.5 },
            this.scene
        );
        plane.position.y = 0.5;
        plane.parent = cursor;
        plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

        const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(plane);
        const textBlock = new BABYLON.GUI.TextBlock();
        textBlock.text = username;
        textBlock.color = "white";
        textBlock.fontSize = 32;
        textBlock.outlineWidth = 3;
        textBlock.outlineColor = "black";
        advancedTexture.addControl(textBlock);

        this.userCursors.set(userId, { cursor, plane });
    }

    /**
     * Met à jour la position du curseur d'un utilisateur
     */
    updateUserCursor(userId, position) {
        let cursorData = this.userCursors.get(userId);
        
        if (!cursorData) {
            this.createUserCursor(userId, 'User_' + userId.substr(-4));
            cursorData = this.userCursors.get(userId);
        }

        if (cursorData && position) {
            cursorData.cursor.position = new BABYLON.Vector3(
                position.x,
                position.y,
                position.z
            );
        }
    }

    /**
     * Supprime le curseur d'un utilisateur
     */
    removeUserCursor(userId) {
        const cursorData = this.userCursors.get(userId);
        if (cursorData) {
            cursorData.cursor.dispose();
            cursorData.plane.dispose();
            this.userCursors.delete(userId);
        }
    }

    /**
     * Supprime tous les curseurs utilisateurs
     */
    clearAllUserCursors() {
        this.userCursors.forEach((cursorData, userId) => {
            this.removeUserCursor(userId);
        });
        this.connectedUsers.clear();
    }

    /**
     * Met en surbrillance une sélection distante
     */
    highlightRemoteSelection(nodeId, userId) {
        // Trouver le nœud
        const nodeMesh = this.graphManager.graphMeshes.nodes.find(
            node => node.metadata && node.metadata.nodeData.id === nodeId
        );

        if (nodeMesh) {
            // Créer un effet de pulsation temporaire
            const originalEmissive = nodeMesh.material.emissiveColor.clone();
            const pulseColor = new BABYLON.Color3(1, 0.5, 0);
            
            let pulse = 0;
            const pulseInterval = setInterval(() => {
                pulse += 0.1;
                const t = (Math.sin(pulse * Math.PI * 2) + 1) / 2;
                nodeMesh.material.emissiveColor = BABYLON.Color3.Lerp(
                    originalEmissive,
                    pulseColor,
                    t
                );

                if (pulse >= 2) {
                    clearInterval(pulseInterval);
                    nodeMesh.material.emissiveColor = originalEmissive;
                }
            }, 50);
        }
    }

    /**
     * Convertit HSL en RGB
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
     * Déconnecte proprement
     */
    disconnect() {
        if (this.socket) {
            this.leaveSession();
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }
}
