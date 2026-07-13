/**
 * RoadLog - Configuration
 * Constantes et paramètres par défaut de l'application
 */

const CONFIG = {
    // Version de l'application
    VERSION: '1.0.0',
    
    // Nom du fichier dans le Gist
    GIST_FILENAME: 'roadlog_data.json',
    GIST_DESCRIPTION: 'RoadLog - Données d\'observations routières',
    
    // Clés LocalStorage
    STORAGE_KEYS: {
        TOKEN: 'roadlog_github_token',
        GIST_ID: 'roadlog_gist_id',
        SETTINGS: 'roadlog_settings',
        CACHE: 'roadlog_cache',
        LAST_SYNC: 'roadlog_last_sync'
    },
    
    // Catégories par défaut
    DEFAULT_CATEGORIES: [
        'Non-respect des distances de sécurité',
        'Changement de voie dangereux',
        'Refus de priorité',
        'Téléphone au volant',
        'Vitesse manifestement excessive',
        'Franchissement de feu rouge',
        'Stop non marqué',
        'Dépassement dangereux',
        'Dépassement par la droite',
        'Dépassement par la gauche',
        'Queue de poisson',
        'Clignotant non utilisé',
        'Circulation sur bande d\'arrêt d\'urgence',
        'Stationnement gênant',
        'Éclairage défectueux',
        'Comportement agressif',
        'Autre'
    ],
    
    // Paramètres par défaut
    DEFAULT_SETTINGS: {
        alertThreshold: 3,
        geolocEnabled: true,
        voiceEnabled: true,
        autoSave: true,
        aiEnabled: false,
        aiBaseUrl: '',
        aiApiKey: ''
    },
    
    // Pagination
    ITEMS_PER_PAGE: 20,
    
    // Compression photo
    PHOTO_MAX_WIDTH: 1200,
    PHOTO_MAX_HEIGHT: 1200,
    PHOTO_QUALITY: 0.7,
    
    // Regex pour les plaques françaises
    PLATE_REGEX: /([A-Z]{2})-?(\d{3})-?([A-Z]{2})/gi,
    PLATE_REGEX_STRICT: /^[A-Z]{2}-?\d{3}-?[A-Z]{2}$/i,
    
    // API GitHub
    GITHUB_API_BASE: 'https://api.github.com',
    
    // Délai de debounce pour la recherche (ms)
    SEARCH_DEBOUNCE: 300,
    
    // Durée d'affichage des toasts (ms)
    TOAST_DURATION: 3000,
    
    // Intervalle de synchronisation automatique (ms) : 5 minutes
    AUTO_SYNC_INTERVAL: 5 * 60 * 1000,
    
    // Structure de données par défaut
    DEFAULT_DATA: {
        version: '1.0.0',
        observations: [],
        categories: [],
        favorites: [],
        metadata: {
            created: null,
            lastModified: null,
            totalObservations: 0
        }
    }
};

// Empêcher la modification de la configuration
Object.freeze(CONFIG);
Object.freeze(CONFIG.STORAGE_KEYS);
Object.freeze(CONFIG.DEFAULT_SETTINGS);
Object.freeze(CONFIG.DEFAULT_DATA);
