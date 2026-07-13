/**
 * RoadLog - Routeur
 * Gestion de la navigation entre les pages
 */

const Router = {
    
    /** @type {string} Page courante */
    currentPage: 'dashboard',
    
    /** @type {Object} Titres des pages */
    pageTitles: {
        'dashboard': 'Tableau de bord',
        'new-observation': 'Nouvelle observation',
        'history': 'Historique',
        'plate-detail': 'Détail plaque',
        'statistics': 'Statistiques',
        'map': 'Carte',
        'favorites': 'Favoris',
        'categories': 'Gestion des catégories',
        'sharing': 'Partage',
        'export': 'Export',
        'qrcode': 'QR Code',
        'settings': 'Paramètres'
    },
    
    /** @type {Object} Callbacks de navigation */
    _callbacks: {},
    
    /**
     * Initialise le routeur
     */
    init() {
        // Écouter les clics sur les liens du menu
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                if (page) this.navigate(page);
            });
        });
        
        // Navigation par le hash
        window.addEventListener('hashchange', () => {
            const page = window.location.hash.substring(1) || 'dashboard';
            this.navigate(page, false);
        });
        
        // Charger la page initiale
        const initialPage = window.location.hash.substring(1) || 'dashboard';
        this.navigate(initialPage, false);
    },
    
    /**
     * Navigue vers une page
     * @param {string} page - Identifiant de la page
     * @param {boolean} updateHash - Mettre à jour le hash URL
     * @param {Object} params - Paramètres additionnels
     */
    navigate(page, updateHash = true, params = {}) {
        // Vérifier que la page existe
        if (!document.getElementById(`page-${page}`)) {
            console.warn(`Page "${page}" introuvable`);
            page = 'dashboard';
        }
        
        // Masquer toutes les pages
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        
        // Afficher la page cible
        const pageEl = document.getElementById(`page-${page}`);
        if (pageEl) {
            pageEl.classList.add('active');
        }
        
        // Mettre à jour le titre
        const title = this.pageTitles[page] || 'RoadLog';
        document.getElementById('page-title').textContent = title;
        
        // Mettre à jour le menu actif
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.classList.toggle('active', link.dataset.page === page);
        });
        
        // Fermer le sidebar
        UI.closeSidebar();
        
        // Mettre à jour le hash
        if (updateHash) {
            window.location.hash = page;
        }
        
        // Sauvegarder la page courante
        this.currentPage = page;
        
        // Exécuter le callback de la page
        if (this._callbacks[page]) {
            this._callbacks[page](params);
        }
        
        // Scroll en haut
        window.scrollTo(0, 0);
    },
    
    /**
     * Enregistre un callback pour une page
     * @param {string} page
     * @param {Function} callback
     */
    onNavigate(page, callback) {
        this._callbacks[page] = callback;
    },
    
    /**
     * Retourne à la page précédente ou au dashboard
     */
    back() {
        window.history.back();
    }
};
