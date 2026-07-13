
/**
 * RoadLog - Module Caméra / Photos
 * Gestion de la prise de photo, importation et compression
 */

const Camera = {
    
    /** @type {string[]} Photos en base64 pour l'observation courante */
    _photos: [],
    
    /**
     * Initialise les événements caméra
     */
    init() {
        // Bouton prendre une photo
        document.getElementById('btn-take-photo').addEventListener('click', () => {
            document.getElementById('camera-input').click();
        });
        
        // Bouton importer une photo
        document.getElementById('btn-import-photo').addEventListener('click', () => {
            document.getElementById('photo-input').click();
        });
        
        // Écouter les changements de fichier
        document.getElementById('camera-input').addEventListener('change', (e) => {
            this._handleFiles(e.target.files);
            e.target.value = '';
        });
        
        document.getElementById('photo-input').addEventListener('change', (e) => {
            this._handleFiles(e.target.files);
            e.target.value = '';
        });
    },
    
    /**
     * Traite les fichiers sélectionnés
     * @param {FileList} files
     */
    async _handleFiles(files) {
        for (const file of files) {
            if (!file.type.startsWith('image/')) continue;
            
            try {
                const compressed = await this.compressImage(file);
                this._photos.push(compressed);
                this.renderPreviews();
            } catch (error) {
                console.error('Erreur traitement photo:', error);
                UI.showToast('Erreur lors du traitement de la photo', 'error');
            }
        }
    },
    
    /**
     * Compresse une image
     * @param {File} file
     * @returns {Promise<string>} Base64 compressé
     */
    compressImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let { width, height } = img;
                    
                    // Redimensionner si nécessaire
                    const maxWidth = CONFIG.PHOTO_MAX_WIDTH;
                    const maxHeight = CONFIG.PHOTO_MAX_HEIGHT;
                    
                    if (width > maxWidth || height > maxHeight) {
                        const ratio = Math.min(maxWidth / width, maxHeight / height);
                        width = Math.round(width * ratio);
                        height = Math.round(height * ratio);
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    const compressed = canvas.toDataURL('image/jpeg', CONFIG.PHOTO_QUALITY);
                    resolve(compressed);
                };
                
                img.onerror = () => reject(new Error('Erreur chargement image'));
                img.src = e.target.result;
            };
            
            reader.onerror = () => reject(new Error('Erreur lecture fichier'));
            reader.readAsDataURL(file);
        });
    },
    
    /**
     * Affiche les aperçus des photos
     */
    renderPreviews() {
        const container = document.getElementById('photos-preview');
        
        container.innerHTML = this._photos.map((photo, index) => `
            <div class="photo-thumb">
                <img src="${photo}" alt="Photo ${index + 1}" onclick="UI.showPhoto(Camera._photos[${index}])">
                <button class="photo-remove" onclick="Camera.removePhoto(${index})" title="Supprimer">✕</button>
            </div>
        `).join('');
    },
    
    /**
     * Supprime une photo
     * @param {number} index
     */
    removePhoto(index) {
        this._photos.splice(index, 1);
        this.renderPreviews();
    },
    
    /**
     * Récupère les photos courantes
     * @returns {string[]}
     */
    getPhotos() {
        return [...this._photos];
    },
    
    /**
     * Efface toutes les photos temporaires
     */
    clearPhotos() {
        this._photos = [];
        const container = document.getElementById('photos-preview');
        if (container) container.innerHTML = '';
    }
};
