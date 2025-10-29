/**
 * Interface utilisateur moderne pour le contrôle du graphe
 */

class UIManager {
    constructor(graphManager) {
        this.graphManager = graphManager;
        this.currentNode = null;
        this.init();
    }

    init() {
        // Créer l'interface HTML
        this.createToolbar();
        this.createSidePanel();
        this.createInfoModal();
        this.createStatsPanel();
        this.createControlsHelp();
        this.createToastContainer();
        
        // Écouter les sélections de nœuds
        window.addEventListener('nodeSelected', (e) => {
            this.showNodeInfo(e.detail);
        });
    }
    
    // Icônes SVG
    getIcon(name) {
        const icons = {
            upload: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>',
            filter: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>',
            save: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>',
            refresh: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>',
            users: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
            download: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>',
            graph: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>',
            info: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
            check: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
            x: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
            alert: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>'
        };
        return icons[name] || '';
    }

    createToolbar() {
        // Bouton hamburger en haut à gauche
        const menuToggle = document.createElement('button');
        menuToggle.className = 'menu-toggle';
        menuToggle.id = 'menu-toggle';
        menuToggle.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
        `;
        document.body.appendChild(menuToggle);

        // Menu déroulant (caché par défaut)
        const toolbar = document.createElement('div');
        toolbar.className = 'main-toolbar hidden';
        toolbar.id = 'main-toolbar';
        toolbar.innerHTML = `
            <button class="btn btn-primary" id="btn-load-demo">
                <span class="btn-icon">${this.getIcon('graph')}</span>
                <span>Charger Démo</span>
            </button>
            <button class="btn" id="btn-import">
                <span class="btn-icon">${this.getIcon('upload')}</span>
                <span>Importer</span>
            </button>
            <button class="btn" id="btn-save">
                <span class="btn-icon">${this.getIcon('save')}</span>
                <span>Sauvegarder</span>
            </button>
            <button class="btn" id="btn-filter">
                <span class="btn-icon">${this.getIcon('filter')}</span>
                <span>Filtrer</span>
            </button>
            <button class="btn" id="btn-reset">
                <span class="btn-icon">${this.getIcon('refresh')}</span>
                <span>Réinitialiser</span>
            </button>
            <button class="btn" id="btn-collab">
                <span class="btn-icon">${this.getIcon('users')}</span>
                <span>Collaboratif</span>
            </button>
        `;
        document.body.appendChild(toolbar);

        // Toggle menu au clic
        menuToggle.onclick = () => {
            toolbar.classList.toggle('hidden');
            menuToggle.classList.toggle('active');
        };

        // Fermer le menu en cliquant sur le canvas
        document.getElementById('renderCanvas').addEventListener('click', () => {
            if (!toolbar.classList.contains('hidden')) {
                toolbar.classList.add('hidden');
                menuToggle.classList.remove('active');
            }
        });

        // Event listeners
        document.getElementById('btn-load-demo').onclick = () => this.loadDemo();
        document.getElementById('btn-import').onclick = () => this.showImportDialog();
        document.getElementById('btn-save').onclick = () => this.saveGraphState();
        document.getElementById('btn-filter').onclick = () => this.showFilterDialog();
        document.getElementById('btn-reset').onclick = () => this.resetCamera();
        document.getElementById('btn-collab').onclick = () => this.showCollaborativeDialog();
    }

    createSidePanel() {
        const panel = document.createElement('div');
        panel.className = 'side-panel';
        panel.id = 'side-panel';
        panel.innerHTML = `
            <div class="control-group">
                <label class="control-label">${this.getIcon('graph')} Layout</label>
                <select id="layout-select" class="select-minimal">
                    <option value="force">Force</option>
                    <option value="circular">Circulaire</option>
                    <option value="sphere">Sphère</option>
                    <option value="random">Aléatoire</option>
                </select>
            </div>
            <div class="control-group">
                <button class="btn btn-minimal" id="btn-export-json">
                    <span class="btn-icon">${this.getIcon('download')}</span>
                    <span>Export</span>
                </button>
            </div>
        `;
        document.body.appendChild(panel);

        // Connecter les événements
        document.getElementById('btn-export-json').onclick = () => this.exportGraph();
        
        // Connecter le sélecteur de layout
        document.getElementById('layout-select').onchange = (e) => {
            const layout = e.target.value;
            if (this.graphManager && this.graphManager.currentGraph) {
                this.showToast(`Layout ${layout}`, 'info');
                this.graphManager.applyLayout(layout);
            }
        };
    }

    createInfoModal() {
        const modal = document.createElement('div');
        modal.className = 'info-modal';
        modal.id = 'info-modal';
        modal.innerHTML = `
            <button class="close-btn" id="close-info-modal">&times;</button>
            <div class="panel-title">
                <span class="btn-icon">${this.getIcon('info')}</span>
                <span>Informations du Nœud</span>
            </div>
            <div id="info-content"></div>
        `;
        document.body.appendChild(modal);

        document.getElementById('close-info-modal').onclick = () => {
            this.hideNodeInfo();
        };

        // Fermer avec Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('visible')) {
                this.hideNodeInfo();
            }
        });
    }

    createStatsPanel() {
        const panel = document.createElement('div');
        panel.className = 'stats-panel';
        panel.id = 'stats-panel';
        panel.innerHTML = `
            <div class="stat-item">
                <div class="stat-label">Nœuds</div>
                <div class="stat-value" id="stat-nodes">0</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Arêtes</div>
                <div class="stat-value" id="stat-edges">0</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">FPS</div>
                <div class="stat-value" id="stat-fps">0</div>
            </div>
        `;
        document.body.appendChild(panel);
        
        // Créer minimap
        this.createMinimap();
        
        // Créer panneau d'aide pour les contrôles
        this.createControlsHelp();

        // Mettre à jour le FPS
        setInterval(() => {
            if (this.graphManager && this.graphManager.engine) {
                const fps = Math.round(this.graphManager.engine.getFps());
                document.getElementById('stat-fps').textContent = fps;
            }
        }, 1000);
    }

    createMinimap() {
        const minimap = document.createElement('div');
        minimap.id = 'minimap';
        minimap.className = 'minimap';
        minimap.innerHTML = `
            <div class="minimap-header">
                <span>Carte</span>
                <button class="minimap-toggle" onclick="uiManager.toggleMinimap()">−</button>
            </div>
            <canvas id="minimap-canvas" width="200" height="200"></canvas>
        `;
        document.body.appendChild(minimap);
        
        this.minimapCanvas = document.getElementById('minimap-canvas');
        this.minimapCtx = this.minimapCanvas.getContext('2d');
        this.minimapVisible = true;
        
        // Mettre à jour la minimap régulièrement
        setInterval(() => this.updateMinimap(), 100);
        
        // Interaction avec la minimap
        this.minimapCanvas.addEventListener('click', (e) => {
            const rect = this.minimapCanvas.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
            const z = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
            
            const camera = this.graphManager.scene.activeCamera;
            if (camera) {
                camera.target = new BABYLON.Vector3(x * 20, 0, z * 20);
            }
        });
    }

    toggleMinimap() {
        this.minimapVisible = !this.minimapVisible;
        const canvas = this.minimapCanvas;
        const toggle = document.querySelector('.minimap-toggle');
        
        if (this.minimapVisible) {
            canvas.style.display = 'block';
            toggle.textContent = '−';
        } else {
            canvas.style.display = 'none';
            toggle.textContent = '+';
        }
    }

    updateMinimap() {
        if (!this.minimapVisible || !this.minimapCtx) return;
        
        const ctx = this.minimapCtx;
        const width = this.minimapCanvas.width;
        const height = this.minimapCanvas.height;
        
        // Effacer
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(0, 0, width, height);
        
        // Dessiner la grille
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const pos = (i / 4) * width;
            ctx.beginPath();
            ctx.moveTo(pos, 0);
            ctx.lineTo(pos, height);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, pos);
            ctx.lineTo(width, pos);
            ctx.stroke();
        }
        
        // Dessiner les nœuds
        if (this.graphManager && this.graphManager.graphMeshes.nodes.length > 0) {
            const nodes = this.graphManager.graphMeshes.nodes;
            const scale = 5;
            
            nodes.forEach(node => {
                const x = (node.position.x / scale + 1) * width / 2;
                const z = (node.position.z / scale + 1) * height / 2;
                
                ctx.beginPath();
                ctx.arc(x, z, 3, 0, Math.PI * 2);
                ctx.fillStyle = this.graphManager.selectedNodes.includes(node) 
                    ? 'rgba(255, 220, 0, 0.9)' 
                    : 'rgba(59, 130, 246, 0.7)';
                ctx.fill();
            });
        }
        
        // Dessiner la caméra
        const camera = this.graphManager.scene.activeCamera;
        if (camera && camera.target) {
            const scale = 5;
            const x = (camera.target.x / scale + 1) * width / 2;
            const z = (camera.target.z / scale + 1) * height / 2;
            
            ctx.beginPath();
            ctx.arc(x, z, 5, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(34, 197, 94, 1)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Direction de vue
            ctx.beginPath();
            ctx.moveTo(x, z);
            const angle = camera.alpha;
            ctx.lineTo(x + Math.cos(angle) * 10, z + Math.sin(angle) * 10);
            ctx.strokeStyle = 'rgba(34, 197, 94, 0.5)';
            ctx.stroke();
        }
    }

    createControlsHelp() {
        // Vérifier si existe déjà pour éviter les doublons
        if (document.getElementById('controls-help')) {
            return;
        }
        
        const help = document.createElement('div');
        help.className = 'controls-help';
        help.id = 'controls-help';
        help.innerHTML = `
            <h4>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 8px;">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                <span>Contrôles</span>
                <button class="controls-help-toggle" onclick="uiManager.toggleControlsHelp()">−</button>
            </h4>
            <div class="controls-content">
                <ul>
                    <li>
                        <span class="key">Glisser 1 doigt</span>
                        <span class="action">Rotation</span>
                    </li>
                    <li>
                        <span class="key">Glisser 2 doigts</span>
                        <span class="action">Pan</span>
                    </li>
                    <li>
                        <span class="key">Pincer / Scroll</span>
                        <span class="action">Zoom</span>
                    </li>
                    <li>
                        <span class="key">W/Z</span>
                        <span class="action">Avancer</span>
                    </li>
                    <li>
                        <span class="key">S</span>
                        <span class="action">Reculer</span>
                    </li>
                    <li>
                        <span class="key">A/Q</span>
                        <span class="action">Gauche</span>
                    </li>
                    <li>
                        <span class="key">D</span>
                        <span class="action">Droite</span>
                    </li>
                    <li>
                        <span class="key">R</span>
                        <span class="action">Reset vue</span>
                    </li>
                    <li>
                        <span class="key">Clic nœud</span>
                        <span class="action">Sélectionner</span>
                    </li>
                </ul>
            </div>
        `;
        document.body.appendChild(help);
        
        // Auto-masquer après 10 secondes
        setTimeout(() => {
            help.style.opacity = '0.3';
        }, 10000);
    }

    toggleControlsHelp() {
        const help = document.getElementById('controls-help');
        const toggle = help.querySelector('.controls-help-toggle');
        help.classList.toggle('collapsed');
        toggle.textContent = help.classList.contains('collapsed') ? '+' : '−';
    }

    createToastContainer() {
        const container = document.createElement('div');
        container.className = 'toast-container';
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    showNodeInfo(detail) {
        if (!detail.selected || !detail.node) {
            this.hideNodeInfo();
            return;
        }

        this.currentNode = detail.node;
        const modal = document.getElementById('info-modal');
        const content = document.getElementById('info-content');

        let html = `
            <div class="info-list">
                <div class="info-item">
                    <div class="info-item-label">Identifiant</div>
                    <div class="info-item-value">${detail.node.id}</div>
                </div>
                <div class="info-item">
                    <div class="info-item-label">Label</div>
                    <div class="info-item-value">${detail.node.label || detail.node.id}</div>
                </div>
        `;

        // Ajouter les propriétés
        if (detail.node.properties && Object.keys(detail.node.properties).length > 0) {
            html += `<div class="control-label" style="margin-top: 16px;">Propriétés</div>`;
            for (const [key, value] of Object.entries(detail.node.properties)) {
                if (key !== 'id' && key !== 'label') {
                    html += `
                        <div class="info-item">
                            <div class="info-item-label">${key}</div>
                            <div class="info-item-value">${value}</div>
                        </div>
                    `;
                }
            }
        }

        // Ajouter la position
        if (detail.node.position) {
            html += `
                <div class="control-label" style="margin-top: 16px;">Position 3D</div>
                <div class="info-item">
                    <div class="info-item-label">Coordonnées</div>
                    <div class="info-item-value">
                        X: ${detail.node.position.x.toFixed(2)}, 
                        Y: ${detail.node.position.y.toFixed(2)}, 
                        Z: ${detail.node.position.z.toFixed(2)}
                    </div>
                </div>
            `;
        }

        html += `</div>`;
        content.innerHTML = html;
        modal.classList.add('visible');
    }

    hideNodeInfo() {
        const modal = document.getElementById('info-modal');
        modal.classList.remove('visible');
        this.currentNode = null;
        
        // Désélectionner tous les nœuds
        if (this.graphManager) {
            this.graphManager.selectedNodes.forEach(node => {
                this.graphManager.unselectNode(node);
            });
        }
    }

    updateStats(nodeCount, edgeCount) {
        document.getElementById('stat-nodes').textContent = nodeCount || 0;
        document.getElementById('stat-edges').textContent = edgeCount || 0;
    }

    showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const iconName = type === 'success' ? 'check' : type === 'error' ? 'alert' : 'info';
        
        toast.innerHTML = `
            <span class="btn-icon">${this.getIcon(iconName)}</span>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideInRight 0.3s ease-out reverse';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    async loadDemo() {
        try {
            this.showToast('Chargement du graphe de démonstration...', 'info');
            const result = await this.graphManager.loadDemoGraph();
            this.updateStats();
            this.showToast('Graphe de démonstration chargé avec succès', 'success');
        } catch (error) {
            this.showToast('Erreur: ' + error.message, 'error');
        }
    }

    showImportDialog() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv,.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            this.showToast('Import en cours...', 'info');
            
            const reader = new FileReader();
            reader.onload = async (event) => {
                const content = event.target.result;
                
                try {
                    let result;
                    if (file.name.endsWith('.csv')) {
                        result = await this.graphManager.importCSV(content);
                    } else if (file.name.endsWith('.json')) {
                        result = await this.graphManager.importJSON(content);
                    }
                    
                    this.updateStats(
                        result.graph_data.metadata.node_count, 
                        result.graph_data.metadata.edge_count
                    );
                    this.showToast('Fichier importé avec succès', 'success');
                } catch (error) {
                    this.showToast('Erreur lors de l\'import: ' + error.message, 'error');
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    }

    showFilterDialog() {
        // Créer le modal de filtrage s'il n'existe pas
        let filterModal = document.getElementById('filter-modal');
        if (!filterModal) {
            filterModal = document.createElement('div');
            filterModal.id = 'filter-modal';
            filterModal.className = 'info-modal';
            filterModal.innerHTML = `
                <div class="info-modal-content" style="max-width: 600px;">
                    <div class="info-modal-header">
                        <h3>Filtrer le graphe</h3>
                        <button class="close-btn" onclick="uiManager.hideFilterDialog()">
                            ${this.getIcon('x')}
                        </button>
                    </div>
                    <div class="info-modal-body">
                        <div class="control-label">Nombre minimum de connexions</div>
                        <input type="range" id="filter-min-connections" min="0" max="10" value="0" class="filter-slider">
                        <span id="filter-min-connections-value">0</span>
                        
                        <div class="control-label" style="margin-top: 16px;">Nombre maximum de connexions</div>
                        <input type="range" id="filter-max-connections" min="0" max="20" value="20" class="filter-slider">
                        <span id="filter-max-connections-value">20</span>
                        
                        <div class="control-label" style="margin-top: 16px;">Type de nœud</div>
                        <select id="filter-node-type" class="filter-select">
                            <option value="">Tous les types</option>
                            <option value="user">Utilisateur</option>
                            <option value="group">Groupe</option>
                            <option value="resource">Ressource</option>
                        </select>
                        
                        <div class="control-label" style="margin-top: 16px;">Recherche par nom</div>
                        <input type="text" id="filter-search" placeholder="Rechercher..." class="filter-input">
                        
                        <div style="margin-top: 24px; display: flex; gap: 12px;">
                            <button class="btn btn-primary" id="btn-apply-filters">
                                ${this.getIcon('filter')} Appliquer
                            </button>
                            <button class="btn" id="btn-reset-filters">
                                ${this.getIcon('refresh')} Réinitialiser
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(filterModal);
            
            // Ajouter les event listeners pour les sliders
            document.getElementById('filter-min-connections').addEventListener('input', (e) => {
                document.getElementById('filter-min-connections-value').textContent = e.target.value;
            });
            
            document.getElementById('filter-max-connections').addEventListener('input', (e) => {
                document.getElementById('filter-max-connections-value').textContent = e.target.value;
            });
            
            // Ajouter les event listeners pour les boutons
            document.getElementById('btn-apply-filters').addEventListener('click', () => {
                this.applyFilters();
            });
            
            document.getElementById('btn-reset-filters').addEventListener('click', () => {
                this.resetFilters();
            });
        }
        
        filterModal.classList.add('visible');
    }

    hideFilterDialog() {
        const modal = document.getElementById('filter-modal');
        if (modal) {
            modal.classList.remove('visible');
        }
    }

    applyFilters() {
        const minConnections = parseInt(document.getElementById('filter-min-connections').value);
        const maxConnections = parseInt(document.getElementById('filter-max-connections').value);
        const nodeType = document.getElementById('filter-node-type').value;
        const searchTerm = document.getElementById('filter-search').value.toLowerCase();
        
        const filters = {
            min_connections: minConnections,
            max_connections: maxConnections
        };
        
        if (nodeType) {
            filters.node_type = nodeType;
        }
        
        if (searchTerm) {
            filters.search_term = searchTerm;
        }
        
        this.graphManager.filterGraph(filters);
        this.hideFilterDialog();
        this.showToast('Filtres appliqués', 'success');
    }

    resetFilters() {
        document.getElementById('filter-min-connections').value = 0;
        document.getElementById('filter-min-connections-value').textContent = '0';
        document.getElementById('filter-max-connections').value = 20;
        document.getElementById('filter-max-connections-value').textContent = '20';
        document.getElementById('filter-node-type').value = '';
        document.getElementById('filter-search').value = '';
        
        // Recharger le graphe original sauvegardé
        if (this.graphManager.originalGraph) {
            this.graphManager.renderGraph(this.graphManager.originalGraph);
            this.showToast('Filtres réinitialisés', 'success');
        } else if (this.graphManager.currentGraph) {
            // Fallback si originalGraph n'existe pas
            this.graphManager.renderGraph(this.graphManager.currentGraph);
            this.showToast('Filtres réinitialisés', 'success');
        } else {
            this.showToast('Aucun graphe à restaurer', 'info');
        }
    }

    saveGraphState() {
        this.showToast('État sauvegardé', 'success');
    }

    resetCamera() {
        const camera = this.graphManager.scene.activeCamera;
        if (camera) {
            camera.alpha = Math.PI / 2;
            camera.beta = Math.PI / 4;
            camera.radius = 15;
            camera.target = BABYLON.Vector3.Zero();
        }
        this.showToast('Vue réinitialisée', 'success');
    }

    showCollaborativeDialog() {
        // Créer le modal collaboratif s'il n'existe pas
        let collabModal = document.getElementById('collab-modal');
        if (!collabModal) {
            collabModal = document.createElement('div');
            collabModal.id = 'collab-modal';
            collabModal.className = 'info-modal';
            collabModal.innerHTML = `
                <div class="info-modal-content" style="max-width: 500px;">
                    <div class="info-modal-header">
                        <h3>Mode Collaboratif</h3>
                        <button class="close-btn" onclick="uiManager.hideCollabDialog()">
                            ${this.getIcon('x')}
                        </button>
                    </div>
                    <div class="info-modal-body">
                        <div id="collab-status" style="margin-bottom: 16px; padding: 12px; background: var(--bg-light); border-radius: 8px;">
                            <strong>État:</strong> <span id="collab-status-text">Déconnecté</span>
                        </div>
                        
                        <div class="control-label">Nom de la session</div>
                        <input type="text" id="collab-session-name" placeholder="ma-session" class="filter-input" value="session-${Date.now()}">
                        
                        <div style="margin-top: 24px; display: flex; gap: 12px;">
                            <button class="btn btn-primary" id="btn-join-session">
                                ${this.getIcon('users')} Rejoindre
                            </button>
                            <button class="btn btn-danger" id="btn-leave-session" style="display: none;">
                                ${this.getIcon('x')} Quitter
                            </button>
                        </div>
                        
                        <div id="collab-users" style="margin-top: 16px; display: none;">
                            <div class="control-label">Utilisateurs connectés</div>
                            <div id="collab-users-list" style="margin-top: 8px;"></div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(collabModal);
            
            document.getElementById('btn-join-session').onclick = () => this.joinCollaborativeSession();
            document.getElementById('btn-leave-session').onclick = () => this.leaveCollaborativeSession();
        }
        
        collabModal.classList.add('visible');
    }

    hideCollabDialog() {
        const modal = document.getElementById('collab-modal');
        if (modal) {
            modal.classList.remove('visible');
        }
    }

    async joinCollaborativeSession() {
        const sessionName = document.getElementById('collab-session-name').value.trim();
        if (!sessionName) {
            this.showToast('Veuillez entrer un nom de session', 'error');
            return;
        }

        try {
            if (!window.collaborativeManager) {
                window.collaborativeManager = new CollaborativeManager(
                    this.graphManager,
                    this.graphManager.scene
                );
            }

            await window.collaborativeManager.createOrJoinSession(sessionName);
            
            document.getElementById('collab-status-text').textContent = `Connecté à ${sessionName}`;
            document.getElementById('collab-status-text').style.color = 'var(--success-color)';
            document.getElementById('btn-join-session').style.display = 'none';
            document.getElementById('btn-leave-session').style.display = 'block';
            document.getElementById('collab-users').style.display = 'block';
            
            this.showToast('Session collaborative rejointe', 'success');
            
            // Envoyer les sélections de nœuds
            window.addEventListener('nodeSelected', (e) => {
                if (window.collaborativeManager && e.detail.selected) {
                    window.collaborativeManager.sendNodeSelection(e.detail.node.id);
                }
            });
            
        } catch (error) {
            this.showToast('Erreur de connexion: ' + error.message, 'error');
        }
    }

    leaveCollaborativeSession() {
        if (window.collaborativeManager) {
            window.collaborativeManager.leaveSession();
            
            document.getElementById('collab-status-text').textContent = 'Déconnecté';
            document.getElementById('collab-status-text').style.color = 'var(--text-secondary)';
            document.getElementById('btn-join-session').style.display = 'block';
            document.getElementById('btn-leave-session').style.display = 'none';
            document.getElementById('collab-users').style.display = 'none';
            
            this.showToast('Session collaborative quittée', 'info');
        }
    }

    clearSelection() {
        // Désélectionner tous les nœuds dans le graphManager
        if (this.graphManager) {
            this.graphManager.selectedNodes.forEach(node => {
                this.graphManager.unselectNode(node);
            });
            this.graphManager.selectedNodes = [];
        }
        
        this.hideNodeInfo();
        this.showToast('Sélection effacée', 'info');
    }

    focusOnSelected() {
        if (!this.graphManager || this.graphManager.selectedNodes.length === 0) {
            this.showToast('Aucun nœud sélectionné', 'error');
            return;
        }
        
        const camera = this.graphManager.scene.activeCamera;
        if (!camera) return;
        
        // Obtenir le premier nœud sélectionné
        const selectedNode = this.graphManager.selectedNodes[0];
        const targetPosition = selectedNode.position.clone();
        
        // Animer la caméra vers le nœud
        BABYLON.Animation.CreateAndStartAnimation(
            'focusCamera',
            camera,
            'target',
            60,
            30,
            camera.target,
            targetPosition,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        
        // Ajuster le rayon pour un bon zoom
        BABYLON.Animation.CreateAndStartAnimation(
            'zoomCamera',
            camera,
            'radius',
            60,
            30,
            camera.radius,
            5,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        
        this.showToast('Focus sur le nœud sélectionné', 'success');
    }

    exportGraph() {
        if (!this.graphManager.currentGraph) {
            this.showToast('Aucun graphe à exporter', 'error');
            return;
        }

        const dataStr = JSON.stringify(this.graphManager.currentGraph, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'graph_export_' + Date.now() + '.json';
        link.click();
        URL.revokeObjectURL(url);
        
        this.showToast('Graphe exporté', 'success');
    }

    updateStats() {
        if (!this.graphManager || !this.graphManager.currentGraph) return;
        
        const nodeCount = this.graphManager.currentGraph.nodes ? 
            this.graphManager.currentGraph.nodes.length : 0;
        const edgeCount = this.graphManager.currentGraph.edges ? 
            this.graphManager.currentGraph.edges.length : 0;
        
        const nodeEl = document.getElementById('stat-nodes');
        const edgeEl = document.getElementById('stat-edges');
        
        if (nodeEl) nodeEl.textContent = nodeCount;
        if (edgeEl) edgeEl.textContent = edgeCount;
    }

    createVRUI(xrHelper) {
        console.log('Interface VR initialisée');
    }
}

