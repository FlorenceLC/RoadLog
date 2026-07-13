/**
 * RoadLog - Module Statistiques
 * Génération des graphiques et des statistiques
 * Utilise Canvas 2D natif (sans librairie)
 */

const Stats = {
    
    /**
     * Met à jour tous les graphiques
     */
    renderAll() {
        const data = GitHub.getData();
        const observations = data.observations || [];
        
        this.renderDailyChart(observations);
        this.renderWeeklyChart(observations);
        this.renderMonthlyChart(observations);
        this.renderCategoriesChart(observations);
        this.renderEvolutionChart(observations);
        this.renderTopPlates(observations);
        this.renderTopCategories(observations);
    },
    
    /**
     * Dessine un graphique en barres
     * @param {HTMLCanvasElement} canvas
     * @param {string[]} labels
     * @param {number[]} values
     * @param {string} color
     * @param {string} title
     */
    _drawBarChart(canvas, labels, values, color = '#4361ee', title = '') {
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        
        // Dimensions
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        
        const w = rect.width;
        const h = rect.height;
        const padding = { top: 20, right: 20, bottom: 40, left: 40 };
        const chartW = w - padding.left - padding.right;
        const chartH = h - padding.top - padding.bottom;
        
        // Fond
        ctx.clearRect(0, 0, w, h);
        
        if (values.length === 0) {
            ctx.fillStyle = '#6b6b80';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Aucune donnée', w / 2, h / 2);
            return;
        }
        
        const maxValue = Math.max(...values, 1);
        const barWidth = Math.max(4, (chartW / values.length) * 0.7);
        const gap = (chartW / values.length) * 0.3;
        
        // Grille horizontale
        ctx.strokeStyle = '#2a2a4a';
        ctx.lineWidth = 0.5;
        const gridLines = 5;
        for (let i = 0; i <= gridLines; i++) {
            const y = padding.top + (chartH / gridLines) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(w - padding.right, y);
            ctx.stroke();
            
            // Valeurs axe Y
            ctx.fillStyle = '#6b6b80';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(
                Math.round(maxValue - (maxValue / gridLines) * i).toString(),
                padding.left - 5,
                y + 4
            );
        }
        
        // Barres
        values.forEach((value, i) => {
            const x = padding.left + (chartW / values.length) * i + gap / 2;
            const barH = (value / maxValue) * chartH;
            const y = padding.top + chartH - barH;
            
            // Gradient
            const gradient = ctx.createLinearGradient(x, y, x, y + barH);
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, color + '60');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barH, 3);
            ctx.fill();
            
            // Labels
            if (labels[i]) {
                ctx.fillStyle = '#6b6b80';
                ctx.font = '9px sans-serif';
                ctx.textAlign = 'center';
                ctx.save();
                ctx.translate(x + barWidth / 2, h - 5);
                ctx.rotate(-Math.PI / 6);
                ctx.fillText(labels[i], 0, 0);
                ctx.restore();
            }
        });
    },
    
    /**
     * Dessine un graphique en ligne
     * @param {HTMLCanvasElement} canvas
     * @param {string[]} labels
     * @param {number[]} values
     * @param {string} color
     */
    _drawLineChart(canvas, labels, values, color = '#06d6a0') {
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        
        const w = rect.width;
        const h = rect.height;
        const padding = { top: 20, right: 20, bottom: 40, left: 40 };
        const chartW = w - padding.left - padding.right;
        const chartH = h - padding.top - padding.bottom;
        
        ctx.clearRect(0, 0, w, h);
        
        if (values.length === 0) {
            ctx.fillStyle = '#6b6b80';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Aucune donnée', w / 2, h / 2);
            return;
        }
        
        const maxValue = Math.max(...values, 1);
        
        // Grille
        ctx.strokeStyle = '#2a2a4a';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= 5; i++) {
            const y = padding.top + (chartH / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(w - padding.right, y);
            ctx.stroke();
            
            ctx.fillStyle = '#6b6b80';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(Math.round(maxValue - (maxValue / 5) * i).toString(), padding.left - 5, y + 4);
        }
        
        // Surface sous la courbe
        const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
        gradient.addColorStop(0, color + '40');
        gradient.addColorStop(1, color + '00');
        
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top + chartH);
        
        values.forEach((value, i) => {
            const x = padding.left + (chartW / (values.length - 1 || 1)) * i;
            const y = padding.top + chartH - (value / maxValue) * chartH;
            ctx.lineTo(x, y);
        });
        
        ctx.lineTo(padding.left + chartW, padding.top + chartH);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Ligne
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        
        values.forEach((value, i) => {
            const x = padding.left + (chartW / (values.length - 1 || 1)) * i;
            const y = padding.top + chartH - (value / maxValue) * chartH;
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        
        ctx.stroke();
        
        // Points
        values.forEach((value, i) => {
            const x = padding.left + (chartW / (values.length - 1 || 1)) * i;
            const y = padding.top + chartH - (value / maxValue) * chartH;
            
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
        });
        
        // Labels
        const labelStep = Math.ceil(values.length / 10);
        labels.forEach((label, i) => {
            if (i % 
