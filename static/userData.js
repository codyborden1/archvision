class UserData {
    constructor() {
        this.renderings = [];
        this.favorites = [];
        this.settings = {
            defaultAspectRatio: 'ASPECT_16_9',
            theme: 'light'
        };
        this.loadData();
    }

    loadData() {
        this.renderings = JSON.parse(localStorage.getItem('renderings')) || [];
        this.favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        this.settings = JSON.parse(localStorage.getItem('settings')) || this.settings;
    }

    saveData() {
        localStorage.setItem('renderings', JSON.stringify(this.renderings));
        localStorage.setItem('favorites', JSON.stringify(this.favorites));
        localStorage.setItem('settings', JSON.stringify(this.settings));
    }

    addRendering(rendering) {
        this.renderings.unshift(rendering);
        this.saveData();
    }

    deleteRendering(index) {
        this.renderings.splice(index, 1);
        this.saveData();
    }

    toggleFavorite(rendering) {
        const existingIndex = this.favorites.findIndex(fav => fav.imageUrl === rendering.imageUrl);
        if (existingIndex === -1) {
            this.favorites.push(rendering);
        } else {
            this.favorites.splice(existingIndex, 1);
        }
        this.saveData();
        return existingIndex === -1;
    }

    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.saveData();
    }
}

const userData = new UserData(); 