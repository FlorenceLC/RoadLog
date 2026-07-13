/**
 * RoadLog - Module Interface Utilisateur
 * Gestion de l'interface, des événements et du rendu
 */

const UI = {
    
    /** @type {number} Délai auto-close toast */
    _toastTimeout: null,
    
    /**
     * Initialise l'interface utilisateur
     */
    init() {
        this._initSidebar();
        this._initTogglePasswords();
        this._initModals();
    },
    
    // ==================== SIDEBAR ====================
    
    /**
     * Initialise le menu latéral
     */
    _initSidebar() {
        const menuToggle = document.getElementById('menu-toggle');
        const sidebarClose = document.getElementById('sidebar-close');
        const overlay = document.getElementById('menu-overlay');
        
        menuToggle.addEventListener('click', () => this.openSidebar());
        sidebarClose.addEventListener('click', () => this.closeSidebar());
        overlay.addEventListener('click', () => this.closeSidebar());
    },
    
    /**
     * Ouvre le menu latéral
     */
    openSidebar() {
        document.getElementById('sidebar').classList.add('open');
        document.getElementById('menu-overlay').classList.add('active');
    },
    
    /**
     * Ferme le menu latéral
     */
    closeSidebar() {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('menu-overlay').classList.remove('active');
    },
    
    // ==================== TOGGLE PASSWORD ====================
    
    /**
     * Initialise les boutons toggle password
     */
    _initTogglePasswords() {
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.dataset.target;
                const input = document.getElementById(targetId);
                if (input) {
                    const isPassword = input.type === 'password';
                    input.type = isPassword ? 'text' : 'password';
                    btn.textContent = isPassword ? '🙈' : '👁️';
                }
            });
        });
    },
    
    // ==================== MODALES ====================
    
    /**
     * Initialise les modales
     */
    _initModals() {
        // Fermer les modales en cliquant sur le backdrop
        document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
            backdrop.addEventListener('click', () => {
                backdrop.closest('.modal').classList.add('hidden');
            });
        });
    },
    
    /**
     * Affiche une modale de confirmation
     * @param {string} title
     * @param {string} message
     * @returns {Promise<boolean>}
     */
    confirm(title, message) {
        return new Promise((resolve) => {
            const modal = document.getElementById('modal-confirm');
            document.getElementById('modal-confirm-title').textContent = title;
            document.getElementById('modal-confirm-message').textContent = message;
            modal.classList.remove('hidden');
            
            const okBtn = document.getElementById('modal-confirm-ok');
            const cancelBtn = document.getElementById('modal-confirm-cancel');
            
            const cleanup = () => {
                modal.classList.add('hidden');
                okBtn.removeEventListener('click', onOk);
                cancelBtn.removeEventListener('click', onCancel);
            };
            
            const onOk = () => { cleanup(); resolve(true); };
            const onCancel = () => { cleanup(); resolve(false); };
            
            okBtn.addEventListener('click', onOk);
            cancelBtn.addEventListener('click', onCancel);
        });
    },
    
    // ==================== TOASTS ====================
    
    /**
     * Affiche une notification toast
     * @param {string} message
     * @param {string} type - success, error, warning, info
     * @param {number} duration - Durée en ms
     */
    showToast(message, type = 'info', duration = CONFIG.TOAST_DURATION) {
        const container = document.getElementById('toast-container');
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        toast.innerHTML = `<span>${icons[type] || ''}</span><span>${Utils.escapeHtml(message)}</span>`;
        container.appendChild(toast);
        
        // Auto-suppression
        setTimeout(() => {
            toast.classList.add('toast-out');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },
    
    // ==================== SYNC STATUS ====================
    
    /**
     * Met à jour le statut de synchronisation
     * @param {string} status - ok, error, pending
     */
    setSyncStatus(status) {
        const statusEl = document.getElementById('sync-status');
        if (!statusEl) return;
        
        const dot = statusEl.querySelector('.sync-dot');
        const text = statusEl.querySelector('span:last-child');
        
        dot.className = 'sync-dot';
        
        switch (status) {
            case 'ok':
                dot.classList.add('sync-ok');
                text.textContent = 'Synchronisé';
                break;
            case 'error':
                dot.classList.add('sync-error');
                text.textContent = 'Erreur de sync';
                break;
            case 'pending':
                dot.classList.add('sync-pending');
                text.textContent = 'Synchronisation...';
                break;
        }
    },
    
    // ==================== ALERT BANNER ====================
    
    /**
     * Affiche le bandeau d'alerte
     * @param {string} message
     */
    showAlertBanner(message) {
        const banner = document.getElementById('alert-banner');
        document.getElementById('alert-banner-text').textContent = message;
        banner.classList.remove('hidden');
    },
    
    /**
     * Masque le bandeau d'alerte
     */
    hideAlertBanner() {
        document.getElementById('alert-banner').classList.add('hidden');
    },
    
    // ==================== DASHBOARD ====================
    
    /**
     * Met à jour le tableau de bord
     */
    updateDashboard() {
        const data = GitHub.getData();
        const observations = data.observations || [];
        
        // Compteurs
        document.getElementById('stat-total').textContent = observations.length;
        document.getElementById('stat-today').textContent = 
            observations.filter(o => Utils.isToday(o.datetime)).length;
        document.getElementById('stat-week').textContent = 
            observations.filter(o => Utils.isThisWeek(o.datetime)).length;
        document.getElementById('stat-month').textContent = 
            observations.filter(o => Utils.isThisMonth(o.datetime)).length;
        
        // Dernière observation
        const lastObsEl = document.getElementById('last-observation-content');
        if (observations.length > 0) {
            const last = observations[0];
            lastObsEl.innerHTML = `
                <div class="history-item" onclick="Router.navigate('plate-detail', true, {plate: '${Utils.escapeHtml(last.plate)}'})">
                    <div class="history-item-header">
                        <span class="history-item-plate">${Utils.escapeHtml(last.plate)}</span>
                        <span class="history-item-date">${Utils.formatRelativeDate(last.datetime)}</span>
                    </div>
                    <div class="history-item-categories">
                        ${last.categories.map(c => `<span class="tag">${Utils.escapeHtml(c)}</span>`).join('')}
                    </div>
                    ${last.location ? `<div class="history-item-location">📍 ${Utils.escapeHtml(last.location)}</div>` : ''}
                </div>
            `;
        } else {
            lastObsEl.innerHTML = '<p class="text-muted">Aucune observation enregistrée.</p>';
        }
        
        // Top des plaques
        this._renderTopPlates(observations);
        
        // Top des catégories
        this._renderTopCategories(observations);
    },
    
    /**
     * Affiche les plaques les plus fréquentes
     * @param {Object[]} observations
     */
    _renderTopPlates(observations) {
        const container = document.getElementById('top-plates-content');
        if (observations.length === 0) {
            container.innerHTML = '<p class="text-muted">Aucune donnée disponible.</p>';
            return;
        }
        
        const plateCounts = Utils.countOccurrences(observations.map(o => o.plate));
        const sorted = Utils.sortByValueDesc(plateCounts).slice(0, 5);
        const maxCount = sorted.length > 0 ? sorted[0][1] : 1;
        
        container.innerHTML = `
            <ul class="top-list">
                ${sorted.map(([plate, count], i) => `
                    <li class="top-list-item" onclick="Router.navigate('plate-detail', true, {plate: '${Utils.escapeHtml(plate)}'})">
                        <span class="top-list-rank">#${i + 1}</span>
                        <span class="top-list-label plate-badge">${Utils.escapeHtml(plate)}</span>
                        <span class="top-list-value">${count}</span>
                    </li>
                `).join('')}
            </ul>
        `;
    },
    
    /**
     * Affiche les catégories les plus fréquentes
     * @param {Object[]} observations
     */
    _renderTopCategories(observations) {
        const container = document.getElementById('top-categories-content');
        if (observations.length === 0) {
            container.innerHTML = '<p class="text-muted">Aucune donnée disponible.</p>';
            return;
        }
        
        const allCats = observations.flatMap(o => o.categories);
        const catCounts = Utils.countOccurrences(allCats);
        const sorted = Utils.sortByValueDesc(catCounts).slice(0, 5);
        const maxCount = sorted.length > 0 ? sorted[0][1] : 1;
        
        container.innerHTML = `
            <ul class="top-list">
                ${sorted.map(([cat, count], i) => `
                    <li class="top-list-item">
                        <span class="top-list-rank">#${i + 1}</span>
                        <div class="flex-1">
                            <span class="top-list-label">${Utils.escapeHtml(cat)}</span>
                            <div class="top-list-bar" style="width: ${(count / maxCount) * 100}%"></div>
                        </div>
                        <span class="top-list-value">${count}</span>
                    </li>
                `).join('')}
            </ul>
        `;
    },
    
    // ==================== FORMULAIRE D'OBSERVATION ====================
    
    /**
     * Réinitialise le formulaire d'observation
     */
    resetObservationForm() {
        document.getElementById('obs-id').value = '';
        document.getElementById('obs-plate').value = '';
        document.getElementById('obs-date').value = Utils.getCurrentDate();
        document.getElementById('obs-time').value = Utils.getCurrentTime();
        document.getElementById('obs-lat').value = '';
        document.getElementById('obs-lng').value = '';
        document.getElementById('obs-location').value = '';
        document.getElementById('obs-direction').value = '';
        document.getElementById('obs-notes').value = '';
        document.getElementById('geoloc-result').classList.add('hidden');
        document.getElementById('plate-alert').classList.add('hidden');
        document.getElementById('photos-preview').innerHTML = '';
        
        // Décocher toutes les catégories
        document.querySelectorAll('.category-chip').forEach(chip => {
            chip.classList.remove('selected');
        });
        
        // Réinitialiser les photos temporaires
        Camera.clearPhotos();
    },
    
    /**
     * Remplit le formulaire avec des données existantes
     * @param {Object} obs
     */
    fillObservationForm(obs) {
        document.getElementById('obs-id').value = obs.id || '';
        document.getElementById('obs-plate').value = obs.plate || '';
        document.getElementById('obs-date').value = obs.date || Utils.getCurrentDate();
        document.getElementById('obs-time').value = obs.time || Utils.getCurrentTime();
        document.getElementById('obs-lat').value = obs.latitude || '';
        document.getElementById('obs-lng').value = obs.longitude || '';
        document.getElementById('obs-location').value = obs.location || '';
        document.getElementById('obs-direction').value = obs.direction || '';
        document.getElementById('obs-notes').value = obs.notes || '';
        
        // Géolocalisation
        if (obs.address) {
            document.getElementById('geoloc-address').textContent = obs.address;
            document.getElementById('geoloc-result').classList.remove('hidden');
        }
        
        // Catégories
        document.querySelectorAll('.category-chip').forEach(chip => {
            const catName = chip.dataset.category;
            chip.classList.toggle('selected', obs.categories && obs.categories.includes(catName));
        });
        
        // Photos
        if (obs.photos && obs.photos.length > 0) {
            Camera._photos = [...obs.photos];
            Camera.renderPreviews();
        }
        
        // Alerte plaque
        this.checkPlateAlert(obs.plate);
    },
    
    /**
     * Vérifie et affiche l'alerte pour une plaque
     * @param {string} plate
     */
    checkPlateAlert(plate) {
        if (!plate || !Utils.isValidPlate(plate)) return;
        
        const count = GitHub.countPlateObservations(plate);
        const threshold = Storage.getSettings().alertThreshold || 3;
        const alertEl = document.getElementById('plate-alert');
        
        // Ne pas compter l'observation en cours d'édition
        const editId = document.getElementById('obs-id').value;
        const adjustedCount = editId ? count : count;
        
        if (adjustedCount >= threshold) {
            alertEl.textContent = `⚠️ Cette plaque possède déjà ${adjustedCount} observation(s).`;
            alertEl.classList.remove('hidden');
        } else if (adjustedCount > 0) {
            alertEl.textContent = `ℹ️ ${adjustedCount} observation(s) existante(s) pour cette plaque.`;
            alertEl.classList.remove('hidden');
        } else {
            alertEl.classList.add('hidden');
        }
    },
    
    /**
     * Rend les chips de catégories
     */
    renderCategories() {
        const container = document.getElementById('categories-container');
        const categories = GitHub.getCategories();
        
        container.innerHTML = categories.map(cat => `
            <label class="category-chip" data-category="${Utils.escapeHtml(cat)}">
                <input type="checkbox" value="${Utils.escapeHtml(cat)}">
                ${Utils.escapeHtml(cat)}
            </label>
        `).join('');
        
        // Événements de clic
        container.querySelectorAll('.category-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                e.preventDefault();
                chip.classList.toggle('selected');
            });
        });
    },
    
    /**
     * Récupère les catégories sélectionnées
     * @returns {string[]}
     */
    getSelectedCategories() {
        const selected = [];
        document.querySelectorAll('.category-chip.selected').forEach(chip => {
            selected.push(chip.dataset.category);
        });
        return selected;
    },
    
    // ==================== HISTORIQUE ====================
    
    /**
     * Affiche la liste de l'historique
     * @param {Object[]} observations - Observations à afficher
     * @param {number} page - Numéro de page (commence à 1)
     */
    renderHistory(observations, page = 1) {
        const container = document.getElementById('history-list');
        const paginationContainer = document.getElementById('history-pagination');
        
        if (!observations || observations.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">Aucune observation trouvée.</p>';
            paginationContainer.innerHTML = '';
            return;
        }
        
        // Pagination
        const total = observations.length;
        const perPage = CONFIG.ITEMS_PER_PAGE;
        const totalPages = Math.ceil(total / perPage);
        const start = (page - 1) * perPage;
        const end = start + perPage;
        const pageObs = observations.slice(start, end);
        
        // Rendu des items
        container.innerHTML = pageObs.map(obs => `
            <div class="history-item" data-obs-id="${obs.id}">
                <div class="history-item-header">
                    <span class="history-item-plate" 
                          onclick="event.stopPropagation(); Router.navigate('plate-detail', true, {plate: '${Utils.escapeHtml(obs.plate)}'})">${Utils.escapeHtml(obs.plate)}</span>
                    <span class="history-item-date">${Utils.formatDate(obs.datetime)} ${Utils.formatTime(obs.datetime)}</span>
                </div>
                <div class="history-item-categories">
                    ${obs.categories.map(c => `<span class="tag">${Utils.escapeHtml(c)}</span>`).join('')}
                </div>
                ${obs.location ? `<div class="history-item-location">📍 ${Utils.escapeHtml(obs.location)}</div>` : ''}
                ${obs.notes ? `<div class="history-item-location">📝 ${Utils.escapeHtml(Utils.truncate(obs.notes, 80))}</div>` : ''}
                <div class="history-item-actions">
                    <button class="btn btn-small btn-ghost" onclick="event.stopPropagation(); App.editObservation('${obs.id}')" title="Modifier">✏️</button>
                    <button class="btn btn-small btn-ghost" onclick="event.stopPropagation(); App.duplicateObservation('${obs.id}')" title="Dupliquer">📋</button>
                    <button class="btn btn-small btn-ghost" onclick="event.stopPropagation(); App.deleteObservation('${obs.id}')" title="Supprimer">🗑️</button>
                </div>
            </div>
        `).join('');
        
        // Pagination
        if (totalPages > 1) {
            let paginationHtml = '';
            
            if (page > 1) {
                paginationHtml += `<button class="btn btn-small btn-ghost" onclick="App.historyPage(${page - 1})">◀</button>`;
            }
            
            for (let i = 1; i <= totalPages; i++) {
                if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) {
                    paginationHtml += `<button class="btn btn-small ${i === page ? 'btn-primary active' : 'btn-ghost'}" onclick="App.historyPage(${i})">${i}</button>`;
                } else if (i === page - 3 || i === page + 3) {
                    paginationHtml += `<span class="text-muted">...</span>`;
                }
            }
            
            if (page < totalPages) {
                paginationHtml += `<button class="btn btn-small btn-ghost" onclick="App.historyPage(${page + 1})">▶</button>`;
            }
            
            paginationContainer.innerHTML = paginationHtml;
        } else {
            paginationContainer.innerHTML = '';
        }
    },
    
    // ==================== FICHE PLAQUE ====================
    
    /**
     * Affiche la fiche détaillée d'une plaque
     * @param {string} plate
     */
    renderPlateDetail(plate) {
        const observations = GitHub.getObservationsByPlate(plate);
        const isFav = GitHub.isFavorite(plate);
        
        document.getElementById('detail-plate-number').textContent = plate;
        document.getElementById('detail-obs-count').textContent = observations.length;
        
        // Bouton favori
        cons
