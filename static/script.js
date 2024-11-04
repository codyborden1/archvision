const pageContent = document.getElementById('page-content');
let renderings = [];

function loadPage(pageId) {
    fetch(`/${pageId}`)
        .then(response => response.text())
        .then(html => {
            pageContent.innerHTML = html;
            updateActiveNavLink(pageId);
            if (pageId === 'generation-form') {
                setupGenerationForm();
            } else if (pageId === 'my-renderings') {
                updateRenderingsGrid();
            } else if (pageId === 'favorites') {
                loadFavorites();
            }
        });
}

function setupGenerationForm() {
    const form = document.getElementById('imageForm');
    const finalPromptDiv = document.getElementById('finalPrompt');

    function updateFinalPrompt() {
        const fields = [
            'buildingType', 'viewType', 'architecturalStyle', 'buildingComponent', 'designPrinciple',
            'materialType', 'structuralSystem', 'siteConsideration', 'technicalTerm',
            'renderingStyle', 'propertySize', 'sustainabilityOption', 'customKeyword'
        ];

        let promptParts = fields.map(field => {
            const element = document.getElementById(field);
            if (element && element.value) {
                if (field === 'viewType') {
                    return `${element.value} view`;
                }
                if (field === 'customKeyword') {
                    return `"${element.value}"`;
                }
                return element.value;
            }
            return null;
        }).filter(Boolean);

        if (promptParts.length > 0) {
            const renderingStyle = document.getElementById('renderingStyle').value;
            const finalPrompt = `An architectural concept for a\n${promptParts.join(",\n")} building${renderingStyle ? `, rendered in ${renderingStyle} style` : ''}`;
            finalPromptDiv.value = finalPrompt;
        } else {
            finalPromptDiv.value = 'An architectural concept for a building';
        }

        // Adjust textarea height based on content
        finalPromptDiv.style.height = 'auto';
        finalPromptDiv.style.height = `${finalPromptDiv.scrollHeight}px`;
    }

    document.querySelectorAll('select, input').forEach(element => {
        element.addEventListener('change', updateFinalPrompt);
    });

    // Set 16:9 as the default aspect ratio
    document.getElementById('aspectRatio').value = 'ASPECT_16_9';

    // Initial update of the final prompt
    updateFinalPrompt();

    // Prevent manual editing of the finalPrompt textarea
    finalPromptDiv.addEventListener('input', (e) => {
        e.preventDefault();
        return false;
    });
}

function generateConcept() {
    const prompt = document.getElementById('finalPrompt').value;
    const aspectRatio = document.getElementById('aspectRatio').value;
    const resultDiv = document.getElementById('result');

    // Create and show the overlay
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.innerHTML = `
        <div class="overlay-content">
            <h2>Building Your Vision</h2>
            <div class="spinner"></div>
            <p>Stacking pixels like a pro...</p>
            <p>Creating architectural wonders, one byte at a time...</p>
            <p>Designing spaces that would make Lego jealous...</p>
        </div>
    `;
    document.body.appendChild(overlay);

    fetch('/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, aspectRatio }),
    })
    .then(response => response.json())
    .then(data => {
        // Remove the overlay
        overlay.remove();

        if (data.url) {
            showLightbox(data.url, prompt);
            addRendering(data.url, prompt);
            saveRenderingsToLocalStorage();
        } else {
            resultDiv.innerHTML = `<p class="error">Error: ${data.error || 'Unknown error occurred'}</p>`;
        }
    })
    .catch(error => {
        // Remove the overlay
        overlay.remove();

        console.error('Error:', error);
        resultDiv.innerHTML = `<p class="error">Error: ${error.message}</p>`;
    });
}

function showLightbox(imageUrl, prompt) {
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
        <div class="lightbox-content">
            <span class="close" onclick="closeLightbox()">&times;</span>
            <div class="lightbox-image-container">
                <img src="${imageUrl}" alt="Generated Architectural Concept">
            </div>
            <p>${prompt}</p>
        </div>
    `;
    document.body.appendChild(lightbox);
    
    // Add click event listener to close on overlay click
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });
}

function closeLightbox() {
    const lightbox = document.querySelector('.lightbox');
    if (lightbox) {
        lightbox.remove();
    }
}

function addRendering(imageUrl, prompt) {
    const aspectRatio = document.getElementById('aspectRatio').value;
    const rendering = {
        imageUrl,
        prompt,
        aspectRatio
    };
    renderings.unshift(rendering);
    localStorage.setItem('renderings', JSON.stringify(renderings));
}

function updateRenderingsGrid() {
    const renderingsGrid = document.getElementById('renderingsGrid');
    if (renderingsGrid) {
        renderingsGrid.innerHTML = '';
        renderings.forEach((rendering, index) => {
            const renderingItem = document.createElement('div');
            renderingItem.className = 'rendering-item';
            const isFavorited = isInFavorites(rendering);
            renderingItem.innerHTML = `
                <img src="${rendering.imageUrl}" alt="Architectural Concept" onclick="openModal(${index})">
                <p>${rendering.prompt}</p>
                <div class="rendering-actions">
                    <button class="save-btn ${isFavorited ? 'favorited' : ''}" onclick="toggleFavorite(${index})">
                        <i class="fa-star ${isFavorited ? 'fas' : 'far'}"></i>
                    </button>
                    <button class="delete-btn" onclick="deleteRendering(${index})"><i class="fas fa-trash"></i></button>
                </div>
            `;
            renderingsGrid.appendChild(renderingItem);
        });
    }
}

function isInFavorites(rendering) {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    return favorites.some(fav => fav.imageUrl === rendering.imageUrl);
}

function openModal(index) {
    const rendering = renderings[index];
    showLightbox(rendering.imageUrl, rendering.prompt);
}

function closeModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.remove();
    }
}

function scrollToForm() {
    loadPage('generation-form');
    setTimeout(() => {
        document.getElementById('imageForm').scrollIntoView({ behavior: 'smooth' });
    }, 100);
}

// Add event listeners for navigation
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const pageId = e.target.closest('a').getAttribute('data-page');
        loadPage(pageId);
    });
});

// Add the generate-nav-btn class to the Generate nav link
const generateNavLink = document.querySelector('.nav-link[data-page="generation-form"]');
if (generateNavLink) {
    generateNavLink.classList.add('generate-nav-btn');
}

function saveRenderingsToLocalStorage() {
    localStorage.setItem('renderings', JSON.stringify(renderings));
}

function loadRenderingsFromLocalStorage() {
    const storedRenderings = localStorage.getItem('renderings');
    if (storedRenderings) {
        renderings = JSON.parse(storedRenderings);
        updateRenderingsGrid();
    }
}

// Update the initial page load to start on the generate page
document.addEventListener('DOMContentLoaded', () => {
    loadRenderingsFromLocalStorage();
    loadPage('generation-form');
});

function deleteRendering(index) {
    if (confirm('Are you sure you want to delete this rendering?')) {
        renderings.splice(index, 1);
        updateRenderingsGrid();
        saveRenderingsToLocalStorage();
    }
}

function toggleFavorite(index) {
    const rendering = renderings[index];
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const existingIndex = favorites.findIndex(fav => fav.imageUrl === rendering.imageUrl);
    
    if (existingIndex === -1) {
        favorites.push(rendering);
        alert('Image saved to favorites!');
    } else {
        favorites.splice(existingIndex, 1);
        alert('Image removed from favorites.');
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateRenderingsGrid();
}

function saveToFavorites(index) {
    toggleFavorite(index);
}

function loadFavorites() {
    const favoritesGrid = document.getElementById('favoritesGrid');
    if (favoritesGrid) {
        favoritesGrid.innerHTML = '';
        const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        favorites.forEach((favorite, index) => {
            const favoriteItem = document.createElement('div');
            favoriteItem.className = 'rendering-item';
            favoriteItem.innerHTML = `
                <img src="${favorite.imageUrl}" alt="Architectural Concept" onclick="openFavoriteModal(${index})">
                <p>${favorite.prompt}</p>
                <button class="delete-btn" onclick="deleteFavorite(${index})">Remove</button>
            `;
            favoritesGrid.appendChild(favoriteItem);
        });
    }
}

function openFavoriteModal(index) {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const favorite = favorites[index];
    showLightbox(favorite.imageUrl, favorite.prompt);
}

function deleteFavorite(index) {
    if (confirm('Are you sure you want to remove this favorite?')) {
        let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        favorites.splice(index, 1);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        loadFavorites();
    }
}

function updateActiveNavLink(pageId) {
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('data-page') === pageId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}
