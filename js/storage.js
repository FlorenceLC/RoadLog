/**
 * RoadLog - Gestion du stockage
 * Gestion du LocalStorage pour la configuration et le cache
 */

const Storage = {
    
    /**
     * Sauvegarde le token GitHub
     * @param {string} token
     */
    setToken(token) {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, token);
        } catch (e) {
            console.error('Erreur sauvegarde token:', e);
        }
    },
    
    /**
     * Récupère le token GitHub
     * @returns {string|null}
     */
    getToken() {
        return localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
    },
    
    /**
     * Sauvegarde l'ID du Gist
     * @param {string} gistId
     */
    setGistId(gistId) {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEYS.GIST_ID, gistId);
        } catch (e) {
            console.error('Erreur sauvegarde Gist ID:', e);
        }
    },
    
    /**
     * Récupère l'ID du Gist
     * @returns {string|null}
     */
    getGistId() {
        return localStorage.getItem(CONFIG.STORAGE_KEYS.GIST_ID);
    },
    
    /**
     * Sauvegarde les paramètres
     * @param {Object} settings
     */
    setSettings(settings) {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        } catch (e) {
            console.error('Erreur sauvegarde paramètres:', e);
        }
    },
    
    /**
     * Récupère les paramètres
     * @returns {Object}
     */
    getSettings() {
        try {
            const stored = localStorage.getItem(CONFIG.STORAGE_KEYS.SETTINGS);
            if (stored) {
                return { ...CONFIG.DEFAULT_SETTINGS, ...JSON.parse(stored) };
            }
        } catch (e) {
            console.error('Erreur lecture paramètres:', e);
        }
        return { ...CONFIG.DEFAULT_SETTINGS };
    },
    
    /**
     * Sauvegarde les données en cache local
     * @param {Object} data
     */
    setCache(data) {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEYS.CACHE, JSON.stringify(data));
            localStorage.setItem(CONFIG.STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
        } catch (e) {
            console.error('Erreur sauvegarde cache:', e);
            // En cas de dépassement de quota, essayer de compresser
            if (e.name === 'QuotaExceededError') {
                console.warn('Quota LocalStorage dépassé, nettoyage du cache...');
                this.clearCache();
            }
        }
    },
    
    /**
     * Récupère les données du cache local
     * @returns {Object|null}
     */
    getCache() {
        try {
            const stored = localStorage.getItem(CONFIG.STORAGE_KEYS.CACHE);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.error('Erreur lecture cache:', e);
        }
        return null;
    },
    
    /**
     * Récupère la date de dernière synchronisation
     * @returns {string|null}
     */
    getLastSync() {
        return localStorage.getItem(CONFIG.STORAGE_KEYS.LAST_SYNC);
    },
    
    /**
     * Vide le cache local
     */
    clearCache() {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.CACHE);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.LAST_SYNC);
    },
    
    /**
     * Vérifie si la configuration initiale a été effectuée
     * @returns {boolean}
     */
    isConfigured() {
        return !!(this.getToken() && this.getGistId());
    },
    
    /**
     * Restaure les paramètres par défaut (sans toucher au token/gist)
     */
    restoreDefaults() {
        this.setSettings(CONFIG.DEFAULT_SETTINGS);
    },
    
    /**
     * Efface toutes les données locales (sauf token et gist ID)
     */
    clearAllExceptAuth() {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.SETTINGS);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.CACHE);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.LAST_SYNC);
    }
};
