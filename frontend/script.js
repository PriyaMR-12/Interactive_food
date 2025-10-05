// API Configuration
const SPOONACULAR_API_KEY = 'b9b1f35fc51a4ae18bda8dcd74bf3cbc'; // Replace with your actual API key
const SPOONACULAR_BASE_URL = 'https://api.spoonacular.com/recipes';


// Global state
let selectedIngredients = [];
let currentRecipes = [];

// DOM Elements
const ingredientInput = document.getElementById('ingredientInput');
const addIngredientBtn = document.getElementById('addIngredientBtn');
const selectedIngredientsContainer = document.getElementById('selectedIngredients');
const searchRecipesBtn = document.getElementById('searchRecipesBtn');
const loadingSection = document.getElementById('loadingSection');
const resultsSection = document.getElementById('resultsSection');
const errorSection = document.getElementById('errorSection');
const recipesGrid = document.getElementById('recipesGrid');
const clearResultsBtn = document.getElementById('clearResultsBtn');
const retryBtn = document.getElementById('retryBtn');
const recipeModal = document.getElementById('recipeModal');
const closeModal = document.getElementById('closeModal');
const nameEl = document.getElementById('navUserName');

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    checkApiKey();
    setupProgressiveImageLoading();
    applyBootstrapHelpers();
});

// Event Listeners
function initializeEventListeners() {
    // Add ingredient functionality
    addIngredientBtn.addEventListener('click', addIngredient);
    ingredientInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addIngredient();
        }
    });
    
    // Search recipes
    searchRecipesBtn.addEventListener('click', searchRecipes);
    
    // Clear results
    clearResultsBtn.addEventListener('click', clearResults);
    
    // Retry button
    if (retryBtn) {
        retryBtn.addEventListener('click', function() {
            hideError();
            searchRecipes();
        });
    }
    
    // Modal functionality
    closeModal.addEventListener('click', closeRecipeModal);
    window.addEventListener('click', function(e) {
        if (e.target === recipeModal) {
            closeRecipeModal();
        }
    });
    
    // Input validation
    ingredientInput.addEventListener('input', validateInput);
}


 
// Check if API key is configured
function checkApiKey() {
    if (SPOONACULAR_API_KEY === ' ' || !SPOONACULAR_API_KEY) {
        showError('Please configure your Spoonacular API key in script.js. Get a free key at https://spoonacular.com/food-api');
        console.error('API Key Missing: Update SPOONACULAR_API_KEY with a valid key.');
    }
}

// Add ingredient to the list
function addIngredient() {
    const ingredient = ingredientInput.value.trim().toLowerCase();
    
    if (ingredient && !selectedIngredients.includes(ingredient)) {
        selectedIngredients.push(ingredient);
        ingredientInput.value = '';
        updateSelectedIngredientsDisplay();
        updateSearchButton();
        validateInput();
    }
}

// Remove ingredient from the list
function removeIngredient(ingredient) {
    selectedIngredients = selectedIngredients.filter(item => item !== ingredient);
    updateSelectedIngredientsDisplay();
    updateSearchButton();
}

// Update the display of selected ingredients
function updateSelectedIngredientsDisplay() {
    if (selectedIngredients.length === 0) {
        selectedIngredientsContainer.innerHTML = '<p class="placeholder-text">Add ingredients to see them here...</p>';
    } else {
        selectedIngredientsContainer.innerHTML = selectedIngredients.map(ingredient => 
            `<div class="ingredient-tag">
                <span>${ingredient}</span>
                <button class="remove-btn" onclick="removeIngredient('${ingredient}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>`
        ).join('');
    }
    applyBootstrapHelpers();
}

// Update search button state
function updateSearchButton() {
    searchRecipesBtn.disabled = selectedIngredients.length === 0;
}

// Validate input
function validateInput() {
    const ingredient = ingredientInput.value.trim();
    addIngredientBtn.disabled = !ingredient || selectedIngredients.includes(ingredient.toLowerCase());
}

// Search for recipes
async function searchRecipes() {
    if (selectedIngredients.length === 0) return;
    
    showLoading();
    hideError();
    
    try {
        const recipes = await fetchRecipes(selectedIngredients);
        currentRecipes = recipes;
        console.log('Fetched Recipes:', recipes); // Debug log
        displayRecipes(recipes);
        showResults();
    } catch (error) {
        console.error('Error fetching recipes:', error);
        showError(`Failed to fetch recipes: ${error.message}. Check your API key and internet connection.`);
    }
}

// Fetch recipes from Spoonacular API
async function fetchRecipes(ingredients) {
    const ingredientsString = ingredients.join(',');
    const url = `${SPOONACULAR_BASE_URL}/findByIngredients?ingredients=${encodeURIComponent(ingredientsString)}&number=12&apiKey=${SPOONACULAR_API_KEY}`;
    
    console.log('API Request URL:', url); // Debug log
    
    const response = await fetch(url);
    
    if (!response.ok) {
        console.error('API Response Status:', response.status, response.statusText); // Debug
        if (response.status === 401) {
            throw new Error('Invalid API key. Get a new one from spoonacular.com.');
        } else if (response.status === 402) {
            throw new Error('API quota exceeded (too many requests today). Wait 24 hours for reset or upgrade to paid plan: https://spoonacular.com/food-api/pricing');
        } else if (response.status === 429) {
            throw new Error('Rate limit hit. Wait a few minutes and try again.');
        } else {
            throw new Error(`API failed with status ${response.status}: ${response.statusText}. Check your key and internet.`);
        }
    }
    
    const recipes = await response.json();
    console.log('Raw API Response:', recipes); // Debug log
    
    if (!recipes || !Array.isArray(recipes) || recipes.length === 0) {
        throw new Error('No recipes found for your ingredients. Try different ones (e.g., chicken, rice).');
    }
    
    // Fetch detailed information for each recipe (with delay to avoid rate limits)
    const detailedRecipes = await Promise.all(
        recipes.map((recipe, index) => 
            new Promise(resolve => {
                setTimeout(() => resolve(fetchRecipeDetails(recipe.id)), index * 200) // 200ms delay
            })
        )
    );
    
    const validRecipes = detailedRecipes.filter(recipe => recipe !== null);
    if (validRecipes.length === 0) {
        throw new Error('No detailed recipe data available. Check API key or quota.');
    }
    
    return validRecipes;
}

// Fetch detailed recipe information
async function fetchRecipeDetails(recipeId) {
    try {
        const url = `${SPOONACULAR_BASE_URL}/${recipeId}/information?apiKey=${SPOONACULAR_API_KEY}`;
        console.log('Fetching Details for Recipe ID:', recipeId); // Debug
        const response = await fetch(url);
        
        if (!response.ok) {
            console.warn(`Failed to fetch details for recipe ${recipeId}: ${response.status}`);
            return null;
        }
        
        const data = await response.json();
        console.log('Recipe Details:', data); // Debug log
        return data;
    } catch (error) {
        console.warn(`Error fetching recipe details for ${recipeId}:`, error);
        return null;
    }
}

// Display recipes in the grid
function displayRecipes(recipes) {
    if (recipes.length === 0) {
        recipesGrid.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.6); font-size: 1.1rem; grid-column: 1 / -1;">No recipes found. Try adding more ingredients!</p>';
        return;
    }
    
    recipesGrid.innerHTML = recipes.map(recipe => createRecipeCard(recipe)).join('');
    setupProgressiveImageLoading();
    applyBootstrapHelpers();
}

// Create a recipe card element
function createRecipeCard(recipe) {
    const srcCandidates = [
        recipe.image,
        `https://spoonacular.com/recipeImages/${recipe.id}-556x370.jpg`,
        `https://spoonacular.com/recipeImages/${recipe.id}-312x231.jpg`
    ].filter(Boolean).join('|');
    const title = recipe.title || 'Untitled Recipe';
    const readyInMinutes = recipe.readyInMinutes || 'N/A';
    const servings = recipe.servings || 'N/A';
    const difficulty = getDifficultyLevel(recipe.readyInMinutes);
    const description = recipe.summary ? 
        (recipe.summary.replace(/<[^>]*>/g, '').substring(0, 150) + '...') : 
        'A delicious recipe you can make with your ingredients.';
    
    return `
        <div class="recipe-card">
            <div class="recipe-image">
                <img data-load-src="${srcCandidates}" src="https://via.placeholder.com/300x200?text=No+Image" alt="${title}" loading="lazy">
            </div>
            <div class="recipe-content">
                <h3 class="recipe-title">${title}</h3>
                <div class="recipe-info">
                    <span class="time"><i class="fas fa-clock"></i> ${readyInMinutes} min</span>
                    <span class="servings"><i class="fas fa-users"></i> ${servings} servings</span>
                    <span class="difficulty"><i class="fas fa-signal"></i> ${difficulty}</span>
                </div>
                <p class="recipe-description">${description}</p>
                <button class="view-recipe-btn" onclick="openRecipeInNewTab(${recipe.id})">View Recipe</button>
            </div>
        </div>
    `;
}

function openRecipeInNewTab(recipeId) {
    window.open(`https://spoonacular.com/recipes/${recipeId}`, '_blank');
}

// Get difficulty level based on cooking time
function getDifficultyLevel(readyInMinutes) {
    if (readyInMinutes <= 30) return 'Easy';
    if (readyInMinutes <= 60) return 'Medium';
    return 'Hard';
}

// Track viewed recipe
function trackViewedRecipe(recipe) {
    if (!window.Auth || !window.Auth.isAuthenticated()) return; // Only for logged-in users
    const user = window.Auth.currentUser ();
    if (!user || !user.email) return;
    
    const viewedKey = `rf_viewed_${user.email}`;
    let viewed = JSON.parse(localStorage.getItem(viewedKey) || '[]');
    
    // Add current recipe with timestamp (avoid duplicates by ID)
    const existingIndex = viewed.findIndex(r => r.id === recipe.id);
    const viewedEntry = {
        ...recipe, // Full recipe data (title, image, ingredients, etc.)
        viewedAt: Date.now() // Timestamp for sorting
    };
    
    if (existingIndex > -1) {
        // Update existing entry with new timestamp (move to top)
        viewed[existingIndex] = viewedEntry;
        // Reorder to move to top
        viewed = [viewedEntry, ...viewed.filter(r => r.id !== recipe.id)];
    } else {
        // Add new entry
        viewed.unshift(viewedEntry); // Add to beginning for most recent first
        // Limit to last 20 viewed recipes
        if (viewed.length > 20) {
            viewed = viewed.slice(0, 20);
        }
    }
    
    // Save back to storage
    localStorage.setItem(viewedKey, JSON.stringify(viewed));
    console.log('Tracked Viewed Recipe:', recipe.title); // Debug log
}

// Open recipe modal with detailed information (Enhanced with tracking)
async function openRecipeModal(recipeId) {
    const recipe = currentRecipes.find(r => r.id === recipeId);
    if (!recipe) {
        console.error('Recipe not found in currentRecipes:', recipeId);
        showError('Recipe details not available. Try searching again.');
        return;
    }
    
    console.log('Opening Modal for Recipe:', recipe); // Debug log
    
    // Track the view immediately
    trackViewedRecipe(recipe);
    
    // Populate modal with recipe data
    document.getElementById('modalTitle').textContent = recipe.title || 'Untitled Recipe';
    
    const modalImageEl = document.getElementById('modalImage');
    const modalCandidates = [
        recipe.image,
        `https://spoonacular.com/recipeImages/${recipe.id}-636x393.jpg`,
        `https://spoonacular.com/recipeImages/${recipe.id}-480x360.jpg`
    ].filter(Boolean);
    loadImageProgressively(modalImageEl, modalCandidates, 'https://via.placeholder.com/400x300?text=Recipe+Image');
    modalImageEl.alt = recipe.title || 'Recipe Image';
    
    document.getElementById('modalTime').textContent = recipe.readyInMinutes || 'N/A';
    document.getElementById('modalServings').textContent = recipe.servings || 'N/A';
    document.getElementById('modalDifficulty').textContent = getDifficultyLevel(recipe.readyInMinutes);
    
    // Populate ingredients with fallback
    const ingredientsList = document.getElementById('modalIngredients');
    if (recipe.extendedIngredients && recipe.extendedIngredients.length > 0) {
        ingredientsList.innerHTML = recipe.extendedIngredients.map(ingredient => {
            const imagePath = ingredient.image ? `https://spoonacular.com/cdn/ingredients_100x100/${ingredient.image}` : 'https://via.placeholder.com/60x60?text=Ing';
            const name = ingredient.original || ingredient.name || 'Unknown ingredient';
            return `<li><img class="ingredient-thumb" src="${imagePath}" alt="${name}" onerror="this.src='https://via.placeholder.com/60x60?text=Ing'">${name} ${ingredient.amount ? `(${ingredient.amount} ${ingredient.unit || ''})` : ''}</li>`;
        }).join('');
    } else {
        ingredientsList.innerHTML = '<li><em>No ingredients available. Check your API key or try another recipe.</em></li>';
    }
    
    // Populate instructions with fallback
    const instructionsList = document.getElementById('modalInstructions');
    if (recipe.analyzedInstructions && recipe.analyzedInstructions.length > 0 && recipe.analyzedInstructions[0].steps) {
        const steps = recipe.analyzedInstructions[0].steps;
        instructionsList.innerHTML = steps.map((step, index) => 
            `<li>${index + 1}. ${step.step || 'Step description missing'}</li>`
        ).join('');
    } else if (recipe.instructions) {
        const instructions = recipe.instructions.replace(/<[^>]*>/g, '');
        instructionsList.innerHTML = instructions.split('. ').map((instr, index) => 
            `<li>${index + 1}. ${instr.trim() || 'Instruction missing'}.</li>`
        ).filter(li => li.trim()).join('');
    } else {
        instructionsList.innerHTML = '<li><em>No instructions available. Recipe details may be incomplete.</em></li>';
    }
    
    // Show modal
    recipeModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Close recipe modal
function closeRecipeModal() {
    recipeModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Clear all results
function clearResults() {
    selectedIngredients = [];
    currentRecipes = [];
    ingredientInput.value = '';
    updateSelectedIngredientsDisplay();
    updateSearchButton();
    hideResults();
    hideError();
}

// Show/hide sections
function showLoading() {
    loadingSection.style.display = 'block';
    resultsSection.style.display = 'none';
    if (errorSection) errorSection.style.display = 'none';
}

function showResults() {
    loadingSection.style.display = 'none';
    resultsSection.style.display = 'block';
    if (errorSection) errorSection.style.display = 'none';
}

function hideResults() {
    resultsSection.style.display = 'none';
}

// Enhanced showError (Visible toast for debugging)
function showError(message) {
    console.error('UI Error:', message); // Always log
    // Create a visible error div if not present
    let errorDiv = document.getElementById('visibleError');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'visibleError';
        errorDiv.className = 'error-msg'; // Use your CSS class
        errorDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 999; max-width: 300px; padding: 15px; background: rgba(255,0,0,0.9); color: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); font-size: 14px;';
        document.body.appendChild(errorDiv);
    }
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    // Auto-hide after 5 seconds
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function hideError() {
    const errorDiv = document.getElementById('visibleError');
    if (errorDiv) errorDiv.style.display = 'none';
    if (errorSection) errorSection.style.display = 'none';
}

// Progressive image loading setup
function setupProgressiveImageLoading() {
    const images = document.querySelectorAll('img[data-load-src]');
    images.forEach(img => {
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    loadImageProgressively(entry.target, entry.target.dataset.loadSrc.split('|'), 'https://via.placeholder.com/300x200?text=Loading...');
                    observer.unobserve(entry.target);
                }
            });
        });
        observer.observe(img);
    });
}

// Load image progressively (tries multiple sources)
// Progressive image loading setup
function setupProgressiveImageLoading() {
    const images = document.querySelectorAll('img[data-load-src]');
    images.forEach(img => {
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    loadImageProgressively(entry.target, entry.target.dataset.loadSrc.split('|'), 'https://via.placeholder.com/300x200?text=Loading...');
                    observer.unobserve(entry.target);
                }
            });
        });
        observer.observe(img);
    });
}

// Load image progressively (tries multiple sources)
function loadImageProgressively(img, sources, fallback) {
    if (sources.length === 0) {
        img.src = fallback;
        return;
    }
    
    const source = sources.shift();
    const imgCopy = new Image();
    imgCopy.onload = () => {
        img.src = source;
    };
    imgCopy.onerror = () => {
        loadImageProgressively(img, sources, fallback); // Try next source recursively
    };
    imgCopy.src = source;
}

// Apply Bootstrap helpers for better responsiveness
// Apply Bootstrap helpers for better responsiveness (CORRECTED - No modal interference)
function applyBootstrapHelpers() {
    // Add Bootstrap grid classes to recipe cards for responsiveness
    const cards = document.querySelectorAll('.recipe-card');
    cards.forEach(card => {
        card.classList.add('col-md-6', 'col-lg-4', 'mb-4');
    });
    
    // Add classes to ingredient tags for better styling
    const tags = document.querySelectorAll('.ingredient-tag');
    tags.forEach(tag => {
        tag.classList.add('badge', 'bg-primary', 'me-2', 'mb-2');
    });
    
    // Ensure modal is Bootstrap-compatible (BUT DO NOT FORCE DISPLAY - FIXED)
    const modal = document.getElementById('recipeModal');
    if (modal) {
        // Only add basic classes; no 'show' or display override
        modal.classList.add('modal', 'fade');
        // Do NOT set display: 'block' - it stays hidden by default
    }
    
    // Other minor fixes (e.g., for navbar dropdowns)
    const dropdowns = document.querySelectorAll('.dropdown-toggle');
    dropdowns.forEach(dropdown => {
        dropdown.setAttribute('data-bs-toggle', 'dropdown');
    });
}

// Expose functions globally for HTML onclick handlers (required for inline JS in HTML)
window.removeIngredient = removeIngredient;
window.openRecipeModal = openRecipeModal;
window.closeRecipeModal = closeRecipeModal;
window.trackViewedRecipe = trackViewedRecipe; // Optional, for debugging