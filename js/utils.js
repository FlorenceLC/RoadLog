/**
 * RoadLog - Utilitaires
 * Fonctions d'aide génériques utilisées dans toute l'application
 */

const Utils = {
    
    /**
     * Génère un identifiant unique
     * @returns {string} UUID v4
     */
    generateId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },
    
    /**
     * Formate une plaque d'immatriculation (format XX-123-XX)
     * @param {string} input - Texte brut
     * @returns {string} Plaque formatée
     */
    formatPlate(input) {
        // Retirer tout sauf lettres et chiffres
        const clean = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
        
        if (clean.length <= 2) return clean;
        if (clean.length <= 5) return clean.substring(0, 2) + '-' + clean.substring(2);
        return clean.substring(0, 2) + '-' + clean.substring(2, 5) + '-' + clean.substring(5, 7);
    },
    
    /**
     * Valide une plaque d'immatriculation française
     * @param {string} plate - Plaque à valider
     * @returns {boolean}
     */
    isValidPlate(plate) {
        const clean = plate.replace(/-/g, '');
        return /^[A-Z]{2}\d{3}[A-Z]{2}$/i.test(clean);
    },
    
    /**
     * Extrait une plaque d'un texte
     * @param {string} text - Texte à analyser
     * @returns {string|null} Plaque trouvée ou null
     */
    extractPlateFromText(text) {
        // Nettoyer le texte pour la reconnaissance vocale
        let cleaned = text.toUpperCase()
            .replace(/\s+/g, '')
            .replace(/TIRET/g, '-')
            .replace(/TRAIT/g, '-');
        
        // Chercher une plaque dans le texte complet
        const match = cleaned.match(CONFIG.PLATE_REGEX);
        if (match) {
            return Utils.formatPlate(match[0]);
        }
        
        // Essayer lettre par lettre (reconnaissance vocale épelle parfois)
        const words = text.toUpperCase().split(/\s+/);
        let plateCandidate = '';
        
        for (const word of words) {
            if (/^[A-Z]$/.test(word) || /^\d+$/.test(word)) {
                plateCandidate += word;
            }
        }
        
        if (plateCandidate.length >= 7) {
            const plateMatch = plateCandidate.match(/[A-Z]{2}\d{3}[A-Z]{2}/);
            if (plateMatch) {
                return Utils.formatPlate(plateMatch[0]);
            }
        }
        
        return null;
    },
    
    /**
     * Extrait les catégories d'un texte vocal
     * @param {string} text - Texte à analyser
     * @param {string[]} categories - Liste des catégories disponibles
     * @returns {string[]} Catégories trouvées
     */
    extractCategoriesFromText(text, categories) {
        const lower = text.toLowerCase();
        const found = [];
        
        // Correspondances directes et synonymes
        const synonyms = {
            'téléphone': ['téléphone au volant', 'téléphone'],
            'portable': ['téléphone au volant'],
            'distance': ['non-respect des distances de sécurité'],
            'distances': ['non-respect des distances de sécurité'],
            'colle': ['non-respect des distances de sécurité'],
            'priorité': ['refus de priorité'],
            'feu rouge': ['franchissement de feu rouge'],
            'grillé le feu': ['franchissement de feu rouge'],
            'stop': ['stop non marqué'],
            'clignotant': ['clignotant non utilisé'],
            'queue de poisson': ['queue de poisson'],
            'coupé la route': ['queue de poisson'],
            'doublé par la droite': ['dépassement par la droite'],
            'dépassement droite': ['dépassement par la droite'],
            'doublé par la gauche': ['dépassement par la gauche'],
            'dépassement gauche': ['dépassement par la gauche'],
            'dépassement dangereux': ['dépassement dangereux'],
            'doublé dangereusement': ['dépassement dangereux'],
            'vitesse': ['vitesse manifestement excessive'],
            'vite': ['vitesse manifestement excessive'],
            'excès de vitesse': ['vitesse manifestement excessive'],
            'changement de voie': ['changement de voie dangereux'],
            'rabattu': ['changement de voie dangereux'],
            'bande d\'arrêt': ['circulation sur bande d\'arrêt d\'urgence'],
            'bau': ['circulation sur bande d\'arrêt d\'urgence'],
            'stationnement': ['stationnement gênant'],
            'garé': ['stationnement gênant'],
            'éclairage': ['éclairage défectueux'],
            'phare': ['éclairage défectueux'],
            'agressif': ['comportement agressif'],
            'agressivité': ['comportement agressif'],
            'klaxon': ['comportement agressif'],
            'insulte': ['comportement agressif']
        };
        
        // Recherche par synonymes
        for (const [keyword, cats] of Object.entries(synonyms)) {
            if (lower.includes(keyword)) {
                cats.forEach(cat => {
                    if (!found.includes(cat) && categories.map(c => c.toLowerCase()).includes(cat.toLowerCase())) {
                        // Trouver la casse correcte
                        const match = categories.find(c => c.toLowerCase() === cat.toLowerCase());
                        if (match) found.push(match);
                    }
                });
            }
        }
        
        // Recherche directe par nom de catégorie
        for (const cat of categories) {
            if (lower.includes(cat.toLowerCase()) && !found.includes(cat)) {
                found.push(cat);
            }
        }
        
        return found;
    },
    
    /**
     * Formate une date en français
     * @param {string|Date} date - Date à formater
     * @returns {string}
     */
    formatDate(date) {
        const d = new Date(date);
        return d.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    },
    
    /**
     * Formate une heure
     * @param {string|Date} date - Date à formater
     * @returns {string}
     */
    formatTime(date) {
        const d = new Date(date);
        return d.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    /**
     * Formate une date et heure
     * @param {string|Date} date
     * @returns {string}
     */
    formatDateTime(date) {
        return `${Utils.formatDate(date)} ${Utils.formatTime(date)}`;
    },
    
    /**
     * Formate une date relative (il y a X minutes, etc.)
     * @param {string|Date} date
     * @returns {string}
     */
    formatRelativeDate(date) {
        const now = new Date();
        const d = new Date(date);
        const diff = now - d;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'À l\'instant';
        if (minutes < 60) return `Il y a ${minutes} min`;
        if (hours < 24) return `Il y a ${hours}h`;
        if (days < 7) return `Il y a ${days}j`;
        return Utils.formatDate(date);
    },
    
    /**
     * Vérifie si une date est aujourd'hui
     * @param {string|Date} date
     * @returns {boolean}
     */
    isToday(date) {
        const d = new Date(date);
        const today = new Date();
        return d.toDateString() === today.toDateString();
    },
    
    /**
     * Vérifie si une date est dans la semaine courante
     * @param {string|Date} date
     * @returns {boolean}
     */
    isThisWeek(date) {
        const d = new Date(date);
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + 1);
        startOfWeek.setHours(0, 0, 0, 0);
        return d >= startOfWeek;
    },
    
    /**
     * Vérifie si une date est dans le mois courant
     * @param {string|Date} date
     * @returns {boolean}
     */
    isThisMonth(date) {
        const d = new Date(date);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    },
    
    /**
     * Debounce une fonction
     * @param {Function} func
     * @param {number} wait - Délai en ms
     * @returns {Function}
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    /**
     * Échappe les caractères HTML
     * @param {string} text
     * @returns {string}
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    /**
     * Tronque un texte
     * @param {string} text
     * @param {number} maxLength
     * @returns {string}
     */
    truncate(text, maxLength = 50) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },
    
    /**
     * Copie du texte dans le presse-papier
     * @param {string} text
     * @returns {Promise<boolean>}
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            // Fallback pour les anciens navigateurs
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            const result = document.execCommand('copy');
            document.body.removeChild(textarea);
            return result;
        }
    },
    
    /**
     * Obtient la date actuelle au format YYYY-MM-DD
     * @returns {string}
     */
    getCurrentDate() {
        return new Date().toISOString().split('T')[0];
    },
    
    /**
     * Obtient l'heure actuelle au format HH:MM
     * @returns {string}
     */
    getCurrentTime() {
        const now = new Date();
        return now.toTimeString().substring(0, 5);
    },
    
    /**
     * Crée un élément HTML avec des attributs
     * @param {string} tag
     * @param {Object} attrs
     * @param {string|HTMLElement|HTMLElement[]} children
     * @returns {HTMLElement}
     */
    createElement(tag, attrs = {}, children = null) {
        const el = document.createElement(tag);
        
        for (const [key, value] of Object.entries(attrs)) {
            if (key === 'className') {
                el.className = value;
            } else if (key === 'style' && typeof value === 'object') {
                Object.assign(el.style, value);
            } else if (key.startsWith('on') && typeof value === 'function') {
                el.addEventListener(key.substring(2).toLowerCase(), value);
            } else if (key === 'dataset' && typeof value === 'object') {
                for (const [dk, dv] of Object.entries(value)) {
                    el.dataset[dk] = dv;
                }
            } else {
                el.setAttribute(key, value);
            }
        }
        
        if (children !== null) {
            if (typeof children === 'string') {
                el.innerHTML = children;
            } else if (children instanceof HTMLElement) {
                el.appendChild(children);
            } else if (Array.isArray(children)) {
                children.forEach(child => {
                    if (child instanceof HTMLElement) el.appendChild(child);
                    else if (typeof child === 'string') el.innerHTML += child;
                });
            }
        }
        
        return el;
    },
    
    /**
     * Compte les occurrences dans un tableau
     * @param {Array} arr
     * @returns {Object}
     */
    countOccurrences(arr) {
        return arr.reduce((acc, val) => {
            acc[val] = (acc[val] || 0) + 1;
            return acc;
        }, {});
    },
    
    /**
     * Trie un objet par valeurs (descendant)
     * @param {Object} obj
     * @returns {Array<[string, number]>}
     */
    sortByValueDesc(obj) {
        return Object.entries(obj).sort((a, b) => b[1] - a[1]);
    },
    
    /**
     * Obtient le numéro de semaine ISO
     * @param {Date} date
     * @returns {number}
     */
    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }
};
