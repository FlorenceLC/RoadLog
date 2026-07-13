/**
 * RoadLog - Module Reconnaissance Vocale
 * Utilise la Web Speech API pour la dictée vocale
 */

const Speech = {
    
    /** @type {SpeechRecognition|null} Instance de reconnaissance */
    _recognition: null,
    
    /** @type {boolean} Mode écoute continue actif */
    _continuousMode: false,
    
    /** @type {Function|null} Callback courant */
    _currentCallback: null,
    
    /** @type {boolean} En cours d'écoute */
    _listening: false,
    
    /**
     * Vérifie si la reconnaissance vocale est disponible
     * @returns {boolean}
     */
    isAvailable() {
        return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    },
    
    /**
     * Initialise la reconnaissance vocale
     */
    init() {
        if (!this.isAvailable()) {
            console.warn('Reconnaissance vocale non disponible');
            return;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this._recognition = new SpeechRecognition();
        this._recognition.lang = 'fr-FR';
        this._recognition.continuous = false;
        this._recognition.interimResults = true;
        this._recognition.maxAlternatives = 3;
    },
    
    /**
     * Démarre l'écoute pour un champ spécifique
     * @param {Function} callback - Fonction appelée avec le texte reconnu
     * @param {Object} options - Options supplémentaires
     */
    startListening(callback, options = {}) {
        if (!this._recognition) {
            UI.showToast('Reconnaissance vocale non disponible', 'error');
            return;
        }
        
        if (this._listening) {
            this.stopListening();
            return;
        }
        
        this._currentCallback = callback;
        this._listening = true;
        
        this._recognition.continuous = options.continuous || false;
        
        this._recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }
            
            if (options.onInterim && interimTranscript) {
                options.onInterim(interimTranscript);
            }
            
            if (finalTranscript && this._currentCallback) {
                this._currentCallback(finalTranscript);
            }
        };
        
        this._recognition.onerror = (event) => {
            console.error('Erreur reconnaissance vocale:', event.error);
            this._listening = false;
            
            if (event.error === 'not-allowed') {
                UI.showToast('Accès au microphone refusé', 'error');
            } else if (event.error !== 'aborted') {
                UI.showToast('Erreur de reconnaissance vocale', 'error');
            }
            
            if (options.onEnd) options.onEnd();
        };
        
        this._recognition.onend = () => {
            this._listening = false;
            
            // En mode continu, relancer automatiquement
            if (this._continuousMode) {
                try {
                    this._recognition.start();
                    this._listening = true;
                } catch (e) {
                    console.error('Erreur relancement écoute:', e);
                }
            }
            
            if (options.onEnd) options.onEnd();
        };
        
        try {
            this._recognition.start();
        } catch (e) {
            console.error('Erreur démarrage écoute:', e);
            this._listening = false;
        }
    },
    
    /**
     * Arrête l'écoute
     */
    stopListening() {
        this._listening = false;
        this._continuousMode = false;
        
        if (this._recognition) {
            try {
                this._recognition.stop();
            } catch (e) {
                // Ignorer les erreurs d'arrêt
            }
        }
    },
    
    /**
     * Démarre le mode écoute continue
     */
    startContinuousMode() {
        if (!this._recognition) {
            UI.showToast('Reconnaissance vocale non disponible', 'error');
            return;
        }
        
        this._continuousMode = true;
        const continuousEl = document.getElementById('continuous-mode');
        const transcriptEl = document.getElementById('continuous-transcript');
        const statusText = document.getElementById('continuous-status-text');
        const pendingEl = document.getElementById('continuous-pending');
        
        continuousEl.classList.remove('hidden');
        transcriptEl.innerHTML = '';
        statusText.textContent = 'En écoute...';
        
        this.startListening(
            async (text) => {
                // Afficher le texte reconnu
                transcriptEl.innerHTML += `<div style="margin-bottom: 8px; color: var(--text-primary);">💬 "${Utils.escapeHtml(text)}"</div>`;
                transcriptEl.scrollTop = transcriptEl.scrollHeight;
                
                // Analyser le texte
                const categories = GitHub.getCategories();
                const plate = Utils.extractPlateFromText(text);
                const detectedCats = Utils.extractCategoriesFromText(text, categories);
                
                if (plate) {
                    // Créer l'observation
                    const previewHtml = `
                        <div class="card" style="margin: 8px 0;">
                            <strong>Plaque :</strong> ${Utils.escapeHtml(plate)}<br>
                            <strong>Catégories :</strong> ${detectedCats.length > 0 ? detectedCats.map(c => Utils.escapeHtml(c)).join(', ') : 'Aucune détectée'}<br>
                            <div style="margin-top: 8px; display: flex; gap: 8px;">
                                <button class="btn btn-small btn-success continuous-confirm" data-plate="${Utils.escapeHtml(plate)}" 
                                        data-categories='${JSON.stringify(detectedCats)}' data-notes="${Utils.escapeHtml(text)}">
                                    ✅ Valider
                                </button>
                                <button class="btn btn-small btn-ghost continuous-dismiss">❌ Ignorer</button>
                            </div>
                        </div>
                    `;
                    pendingEl.innerHTML = previewHtml;
                    
                    // Bouton confirmer
                    pendingEl.querySelector('.continuous-confirm').addEventListener('click', async (e) => {
                        const btn = e.target;
                        const obsPlate = btn.dataset.plate;
                        const obsCats = JSON.parse(btn.dataset.categories);
                        const obsNotes = btn.dataset.notes;
                        
                        try {
                            await GitHub.addObservation({
                                plate: obsPlate,
                                date: Utils.getCurrentDate(),
                                time: Utils.getCurrentTime(),
                                categories: obsCats,
                                notes: obsNotes
                            });
                            
                            transcriptEl.innerHTML += `<div style="color: var(--accent-success);">✅ Observation ${Utils.escapeHtml(obsPlate)} enregistrée</div>`;
                            pendingEl.innerHTML = '';
                            UI.showToast(`Observation ${obsPlate} enregistrée`, 'success');
                        } catch (err) {
                            UI.showToast('Erreur lors de l\'enregistrement', 'error');
                        }
                    });
                    
                    // Bouton ignorer
                    pendingEl.querySelector('.continuous-dismiss').addEventListener('click', () => {
                        pendingEl.innerHTML = '';
                        transcriptEl.innerHTML += `<div style="color: var(--text-muted);">❌ Ignoré</div>`;
                    });
                } else {
                    transcriptEl.innerHTML += `<div style="color: var(--accent-warning);">⚠️ Aucune plaque détectée</div>`;
                }
            },
            {
                continuous: true,
                onInterim: (text) => {
                    statusText.textContent = `En écoute... "${text}"`;
                },
                onEnd: () => {
                    if (this._continuousMode) {
                        statusText.textContent = 'En écoute...';
                    }
                }
            }
        );
    },
    
    /**
     * Arrête le mode écoute continue
     */
    stopContinuousMode() {
        this._continuousMode = false;
        this.stopListening();
        document.getElementById('continuous-mode').classList.add('hidden');
    },
    
    /**
     * Traite une dictée complète pour le formulaire
     * @param {string} text - Texte reconnu
     */
    processFullDictation(text) {
        const categories = GitHub.getCategories();
        const plate = Utils.extractPlateFromText(text);
        const detectedCats = Utils.extractCategoriesFromText(text, categories);
        
        // Préparer le preview
        const previewContent = document.getElementById('voice-preview-content');
        previewContent.innerHTML = `
            <div class="form-group">
                <label>Texte reconnu</label>
                <p style="color: var(--text-primary); font-style: italic;">"${Utils.escapeHtml(text)}"</p>
            </div>
            <div class="form-group">
                <label>Plaque détectée</label>
                <p style="color: ${plate ? 'var(--accent-success)' : 'var(--accent-danger)'}; font-weight: 600;">
                    ${plate ? plate : 'Non détectée'}
                </p>
            </div>
            <div class="form-group">
                <label>Catégories détectées</label>
                <div class="categories-grid">
                    ${detectedCats.length > 0 
                        ? detectedCats.map(c => `<span class="category-chip selected">${Utils.escapeHtml(c)}</span>`).join('')
                        : '<p class="text-muted">Aucune catégorie détectée</p>'
                    }
                </div>
            </div>
        `;
        
        // Afficher la modale
        const modal = document.getElementById('modal-voice-preview');
        modal.classList.remove('hidden');
        
        // Bouton confirmer : remplir le formulaire
        document.getElementById('voice-preview-confirm').onclick = () => {
            if (plate) document.getElementById('obs-plate').value = plate;
            if (detectedCats.length > 0) {
                document.querySelectorAll('.category-chip').forEach(chip => {
                    chip.classList.toggle('selected', detectedCats.includes(chip.dataset.category));
                });
            }
            // Mettre le texte en notes
            const notesField = document.getElementById('obs-notes');
            if (notesField.value) {
                notesField.value += '\n' + text;
            } else {
                notesField.value = text;
            }
            
            // Vérifier alerte plaque
            if (plate) UI.checkPlateAlert(plate);
            
            modal.classList.add('hidden');
            UI.showToast('Formulaire pré-rempli', 'success');
        };
        
        // Bouton modifier : fermer la modale et laisser éditer
        document.getElementById('voice-preview-edit').onclick = () => {
            if (plate) document.getElementById('obs-plate').value = plate;
            if (detectedCats.length > 0) {
                document.querySelectorAll('.category-chip').forEach(chip => {
                    chip.classList.toggle('selected', detectedCats.includes(chip.dataset.category));
                });
            }
            modal.classList.add('hidden');
        };
        
        // Bouton annuler
        document.getElementById('voice-preview-cancel').onclick = () => {
            modal.classList.add('hidden');
        };
    }
};
