/**
 * RoadLog - Module Géolocalisation
 * Gestion de la position GPS et du géocodage inverse
 */

const Geo = {
    
    /**
     * Vérifie si la géolocalisation est disponible
     * @returns {boolean}
     */
    isAvailable() {
        return 'geolocation' in navigator;
    },
    
    /**
     * Obtient la position actuelle
     * @returns {Promise<{latitude: number, longitude: number}>}
     */
    async getCurrentPosition() {
        if (!this.isAvailable()) {
            throw new Error('Géolocalisation non disponible');
        }
        
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
                },
                (error) => {
                    let message;
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            message = 'Accès à la géolocalisation refusé';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            message = 'Position non disponible';
                            break;
                        case error.TIMEOUT:
                            message = 'Délai de géolocalisation dépassé';
                            break;
                        default:
                            message = 'Erreur de géolocalisation';
                    }
                    reject(new Error(message));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000
                }
            );
        });
    },
    
    /**
     * Effectue un géocodage inverse (coordonnées -> adresse)
     * Utilise l'API Nominatim (OpenStreetMap)
     * @param {number} lat
     * @param {number} lng
     * @returns {Promise<string>}
     */
    async reverseGeocode(lat, lng) {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
                {
                    headers: {
                        'Accept-Language': 'fr'
                    }
                }
            );
            
            if (!response.ok) throw new Error('Erreur géocodage');
            
            const data = await response.json();
            
            if (data.address) {
                const parts = [];
                if (data.address.road) parts.push(data.address.road);
                if (data.address.house_number) parts.unshift(data.address.house_number);
                if (data.address.city || data.address.town || data.address.village) {
                    parts.push(data.address.city || data.address.town || data.address.village);
                }
                if (data.address.postcode) parts.push(data.address.postcode);
                
                return parts.join(', ') || data.display_name;
            }
            
            return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
            
        } catch (error) {
            console.error('Erreur géocodage inverse:', error);
            return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        }
    },
    
    /**
     * Obtient la position et l'adresse
     * @returns {Promise<{latitude: number, longitude: number, address: string}>}
     */
    async getPositionWithAddress() {
        const position = await this.getCurrentPosition();
        const address = await this.reverseGeocode(position.latitude, position.longitude);
        
        return {
            ...position,
            address
        };
    }
};
