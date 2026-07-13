/**
 * RoadLog - Module GitHub
 * Gestion de la synchronisation avec GitHub Gist
 */

const GitHub = {
    
    /** @type {Object|null} Données en mémoire */
    _data: null,
    
    /** @type {boolean} Synchronisation en cours */
    _syncing: false,
    
    /** @type {string|null} SHA du dernier contenu connu */
    _lastSha: null,
    
    /**
     * Effectue une requête vers l'API GitHub
     * @param {string} endpoint - URL relative
     * @param {Object} options - Options fetch
     * @returns {Promise<Response>}
     */
    async _request(endpoint, options = {}) {
        const token = Storage.getToken();
        if (!token) {
            throw new Error('Token GitHub non configuré');
        }
        
        const url = endpoint.startsWith('http') ? endpoint : `${CONFIG.GITHUB_API_BASE}${endpoint}`;
        
        const response = await fetch(url, {
            ...options,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(`GitHub API Error ${response.status}: ${error.message || response.statusText}`);
        }
        
        return response;
    },
    
    /**
     * Vérifie la validité du token
     * @param {string} token
     * @returns {Promise<boolean>}
     */
    async verifyToken(token) {
        try {
            const response = await fetch(`${CONFIG.GITHUB_API_BASE}/user`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            return response.ok;
        } catch {
            return false;
        }
    },
    
    /**
     * Crée un nouveau Gist
     * @returns {Promise<string>} ID du Gist créé
     */
    async createGist() {
        const data = {
            ...CONFIG.DEFAULT_DATA,
            categories: [...CONFIG.DEFAULT_CATEGORIES],
            metadata: {
                ...CONFIG.DEFAULT_DATA.metadata,
                created: new Date().toISOString(),
                lastModified: new Date().toISOString()
            }
        };
        
        const response = await this._request('/gists', {
            method: 'POST',
            body: JSON.stringify({
                description: CONFIG.GIST_DESCRIPTION,
                public: false,
                files: {
                    [CONFIG.GIST_FILENAME]: {
                        content: JSON.stringify(data, null, 2)
                    }
                }
            })
        });
        
        const gist = await response.json();
        this._data = data;
        Storage.setCache(data);
        
        return gist.id;
    },
    
    /**
     * Charge les données depuis le Gist
     * @returns {Promise<Object>}
     */
    async loadData() {
        if (this._syncing) {
            // Retourner le cache si une sync est en cours
            return this._data || Storage.getCache() || { ...CONFIG.DEFAULT_DATA };
        }
        
        this._syncing = true;
        UI.setSyncStatus('pending');
        
        try {
            const gistId = Storage.getGistId();
            if (!gistId) throw new Error('ID du Gist non configuré');
            
            const response = await this._request(`/gists/${gistId}`);
            const gist = await response.json();
            
            const file = gist.files[CONFIG.GIST_FILENAME];
            if (!file) {
                throw new Error('Fichier de données introuvable dans le Gist');
            }
            
            let data;
            
            // Si le contenu est tronqué, récupérer le contenu brut
            if (file.truncated) {
                const rawResponse = await fetch(file.raw_url);
                const rawContent = await rawResponse.text();
                data = JSON.parse(rawContent);
            } else {
                data = JSON.parse(file.content);
            }
            
            // Migration de données si nécessaire
            data = this._migrateData(data);
            
            this._data = data;
            Storage.setCache(data);
            UI.setSyncStatus('ok');
            
            return data;
            
        } catch (error) {
            console.error('Erreur chargement données:', error);
            UI.setSyncStatus('error');
            
            // Fallback sur le cache local
            const cache = Storage.getCache();
            if (cache) {
                this._data = cache;
                UI.showToast('Données chargées depuis le cache local', 'warning');
                return cache;
            }
            
            // Aucune donnée disponible
            this._data = { 
                ...CONFIG.DEFAULT_DATA, 
                categories: [...CONFIG.DEFAULT_CATEGORIES] 
            };
            return this._data;
            
        } finally {
            this._syncing = false;
        }
    },
    
    /**
     * Sauvegarde les données dans le Gist
     * @param {Object} data - Données à sauvegarder
     * @returns {Promise<void>}
     */
    async saveData(data = null) {
        if (!data) data = this._data;
        if (!data) return;
        
        // Mettre à jour les métadonnées
        data.metadata = data.metadata || {};
        data.metadata.lastModified = new Date().toISOString();
        data.metadata.totalObservations = data.observations ? data.observations.length : 0;
        
        this._syncing = true;
        UI.setSyncStatus('pending');
        
        try {
            const gistId = Storage.getGistId();
            if (!gistId) throw new Error('ID du Gist non configuré');
            
            await this._request(`/gists/${gistId}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    files: {
                        [CONFIG.GIST_FILENAME]: {
                            content: JSON.stringify(data, null, 2)
                        }
                    }
                })
            });
            
            this._data = data;
            Storage.setCache(data);
            UI.setSyncStatus('ok');
            
        } catch (error) {
            console.error('Erreur sauvegarde données:', error);
            UI.setSyncStatus('error');
            
            // Sauvegarder en cache local pour synchronisation ultérieure
            Storage.setCache(data);
            this._data = data;
            
            UI.showToast('Sauvegardé localement. Synchronisation en attente.', 'warning');
            throw error;
        } finally {
            this._syncing = false;
        }
    },
    
    /**
     * Migre les données d'une ancienne version si nécessaire
     * @param {Object} data
     * @returns {Object}
     */
    _migrateData(data) {
        // Assurer la structure minimale
        if (!data.observations) data.observations = [];
        if (!data.categories) data.categories = [...CONFIG.DEFAULT_CATEGORIES];
        if (!data.favorites) data.favorites = [];
        if (!data.metadata) {
            data.metadata = {
                created: new Date().toISOString(),
                lastModified: new Date().toISOString(),
                totalObservations: data.observations.length
            };
        }
        
        return data;
    },
    
    /**
     * Récupère les données en mémoire
     * @returns {Object}
     */
    getData() {
        if (!this._data) {
            this._data = Storage.getCache() || { 
                ...CONFIG.DEFAULT_DATA,
                categories: [...CONFIG.DEFAULT_CATEGORIES]
            };
        }
        return this._data;
    },
    
    // ==================== OPÉRATIONS CRUD ====================
    
    /**
     * Ajoute une observation
     * @param {Object} observation
     * @returns {Promise<Object>} Observation créée
     */
    async addObservation(observation) {
        const data = this.getData();
        
        const newObs = {
            id: Utils.generateId(),
            plate: observation.plate,
            date: observation.date,
            time: observation.time,
            datetime: `${observation.date}T${observation.time}`,
            latitude: observation.latitude || null,
            longitude: observation.longitude || null,
            address: observation.address || '',
            location: observation.location || '',
            direction: observation.direction || '',
            categories: observation.categories || [],
            notes: observation.notes || '',
            photos: observation.photos || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        data.observations.unshift(newObs);
        
        await this.saveData(data);
        return newObs;
    },
    
    /**
     * Met à jour une observation
     * @param {string} id
     * @param {Object} updates
     * @returns {Promise<Object>}
     */
    async updateObservation(id, updates) {
        const data = this.getData();
        const index = data.observations.findIndex(o => o.id === id);
        
        if (index === -1) throw new Error('Observation introuvable');
        
        data.observations[index] = {
            ...data.observations[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        
        // Recalculer datetime si date ou time changés
        if (updates.date || updates.time) {
            const obs = data.observations[index];
            obs.datetime = `${obs.date}T${obs.time}`;
        }
        
        await this.saveData(data);
        return data.observations[index];
    },
    
    /**
     * Supprime une observation
     * @param {string} id
     * @returns {Promise<void>}
     */
    async deleteObservation(id) {
        const data = this.getData();
        data.observations = data.observations.filter(o => o.id !== id);
        await this.saveData(data);
    },
    
    /**
     * Duplique une observation
     * @param {string} id
     * @returns {Promise<Object>}
     */
    async duplicateObservation(id) {
        const data = this.getData();
        const original = data.observations.find(o => o.id === id);
        
        if (!original) throw new Error('Observation introuvable');
        
        const duplicate = {
            ...JSON.parse(JSON.stringify(original)),
            id: Utils.generateId(),
            date: Utils.getCurrentDate(),
            time: Utils.getCurrentTime(),
            datetime: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        data.observations.unshift(duplicate);
        await this.saveData(data);
        return duplicate;
    },
    
    /**
     * Récupère une observation par son ID
     * @param {string} id
     * @returns {Object|null}
     */
    getObservation(id) {
        const data = this.getData();
        return data.observations.find(o => o.id === id) || null;
    },
    
    /**
     * Récupère les observations d'une plaque
     * @param {string} plate
     * @returns {Object[]}
     */
    getObservationsByPlate(plate) {
        const data = this.getData();
        const normalizedPlate = plate.replace(/-/g, '').toUpperCase();
        return data.observations.filter(o => 
            o.plate.replace(/-/g, '').toUpperCase() === normalizedPlate
        );
    },
    
    /**
     * Compte le nombre d'observations pour une plaque
     * @param {string} plate
     * @returns {number}
     */
    countPlateObservations(plate) {
        return this.getObservationsByPlate(plate).length;
    },
    
    // ==================== CATÉGORIES ====================
    
    /**
     * Récupère les catégories
     * @returns {string[]}
     */
    getCategories() {
        const data = this.getData();
        return data.categories || [...CONFIG.DEFAULT_CATEGORIES];
    },
    
    /**
     * Ajoute une catégorie
     * @param {string} category
     * @returns {Promise<void>}
     */
    async addCategory(category) {
        const data = this.getData();
        if (!data.categories.includes(category)) {
            data.categories.push(category);
            await this.saveData(data);
        }
    },
    
    /**
     * Met à jour une catégorie
     * @param {number} index
     * @param {string} newName
     * @returns {Promise<void>}
     */
    async updateCategory(index, newName) {
        const data = this.getData();
        const oldName = data.categories[index];
        data.categories[index] = newName;
        
        // Mettre à jour les observations utilisant cette catégorie
        data.observations.forEach(obs => {
            const catIndex = obs.categories.indexOf(oldName);
            if (catIndex !== -1) {
                obs.categories[catIndex] = newName;
            }
        });
        
        await this.saveData(data);
    },
    
    /**
     * Supprime une catégorie
     * @param {number} index
     * @returns {Promise<void>}
     */
    async deleteCategory(index) {
        const data = this.getData();
        const catName = data.categories[index];
        data.categories.splice(index, 1);
        
        // Retirer la catégorie des observations
        data.observations.forEach(obs => {
            obs.categories = obs.categories.filter(c => c !== catName);
        });
        
        await this.saveData(data);
    },
    
    // ==================== FAVORIS ====================
    
    /**
     * Bascule le statut favori d'une plaque
     * @param {string} plate
     * @returns {Promise<boolean>} Nouveau statut
     */
    async toggleFavorite(plate) {
        const data = this.getData();
        const index = data.favorites.indexOf(plate);
        
        if (index === -1) {
            data.favorites.push(plate);
        } else {
            data.favorites.splice(index, 1);
        }
        
        await this.saveData(data);
        return index === -1;
    },
    
    /**
     * Vérifie si une plaque est en favori
     * @param {string} plate
     * @returns {boolean}
     */
    isFavorite(plate) {
        const data = this.getData();
        return data.favorites.includes(plate);
    },
    
    /**
     * Récupère les favoris
     * @returns {string[]}
     */
    getFavorites() {
        const data = this.getData();
        return data.favorites || [];
    }
};
