/**
 * RoadLog - Module IA
 * Architecture prête pour l'intégration d'un modèle Mistral
 * Permet l'interprétation de phrases naturelles
 */

const AI = {
    
    /**
     * Vérifie si l'IA est configurée et activée
     * @returns {boolean}
     */
    isEnabled() {
        const settings = Storage.getSettings();
        return settings.aiEnabled && settings.aiBaseUrl && settings.aiApiKey;
    },
    
    /**
     * Analyse un texte en langage naturel via l'API Mistral
     * @param {string} text - Texte à analyser
     * @param {string[]} availableCategories - Catégories disponibles
     * @returns {Promise<Object>} Résultat structuré
     */
    async analyzeText(text, availableCategories) {
        if (!this.isEnabled()) {
            // Fallback sur l'analyse locale
            return this._localAnalysis(text, availableCategories);
        }
        
        const settings = Storage.getSettings();
        
        const systemPrompt = `Tu es un assistant d'analyse d'observations routières. 
Tu reçois une phrase décrivant un comportement routier et tu dois extraire :
1. La plaque d'immatriculation (format français XX-123-XX)
2. Les catégories correspondantes parmi cette liste : ${availableCategories.join(', ')}
3. Une note descriptive résumant l'incident

Réponds UNIQUEMENT en JSON avec cette structure :
{
    "plate": "XX-123-XX" ou null,
    "categories": ["catégorie1", "catégorie2"],
    "notes": "description courte de l'incident"
}`;
        
        try {
            const response = await fetch(`${settings.aiBaseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${settings.aiApiKey}`
                },
                body: JSON.stringify({
                    model: 'mistral-small-latest',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: text }
                    ],
                    temperature: 0.1,
                    max_tokens: 300,
                    response_format: { type: 'json_object' }
                })
            });
            
            if (!response.ok) {
                throw new Error(`Erreur API Mistral: ${response.status}`);
            }
            
            const data = await response.json();
            const result = JSON.parse(data.choices[0].message.content);
            
            // Valider et nettoyer le résultat
            return {
                plate: result.plate ? Utils.formatPlate(result.plate) : null,
                categories: (result.categories || []).filter(c => availableCategories.includes(c)),
                notes: result.notes || text,
                confidence: 'high',
                source: 'ai'
            };
            
        } catch (error) {
            console.error('Erreur analyse IA:', error);
            UI.showToast('Erreur IA, analyse locale utilisée', 'warning');
            return this._localAnalysis(text, availableCategories);
        }
    },
    
    /**
     * Analyse locale (sans IA) en fallback
     * @param {string} text
     * @param {string[]} availableCategories
     * @returns {Object}
     */
    _localAnalysis(text, availableCategories) {
        return {
            plate: Utils.extractPlateFromText(text),
            categories: Utils.extractCategoriesFromText(text, availableCategories),
            notes: text,
            confidence: 'low',
            source: 'local'
        };
    },
    
    /**
     * Teste la connexion à l'API Mistral
     * @returns {Promise<boolean>}
     */
    async testConnection() {
        const settings = Storage.getSettings();
        
        if (!settings.aiBaseUrl || !settings.aiApiKey) {
            return false;
        }
        
        try {
            const response = await fetch(`${settings.aiBaseUrl}/models`, {
                headers: {
                    'Authorization': `Bearer ${settings.aiApiKey}`
                }
            });
            return response.ok;
        } catch {
            return false;
        }
    }
    
    // ==================== FUTURS MODULES ====================
    // Les méthodes suivantes sont des placeholders pour les évolutions futures
    
    // async recognizePlateFromImage(imageBase64) { }
    // async batchAnalyze(texts) { }
    // async suggestCategories(description) { }
};
