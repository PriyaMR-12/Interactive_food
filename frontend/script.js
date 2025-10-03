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

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    checkApiKey();
    // Try progressive image loading for any items already rendered
    setupProgressiveImageLoading();
    // Light Bootstrap tweaks for controls
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
    if (SPOONACULAR_API_KEY === 'b9b1f35fc51a4ae18bda8dcd74bf3cbc' || !SPOONACULAR_API_KEY) {
        showError('Please configure your Spoonacular API key in the script.js file. Get your free API key at https://spoonacular.com/food-api');
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
        displayRecipes(recipes);
        showResults();
    } catch (error) {
        console.error('Error fetching recipes:', error);
        showError('Failed to fetch recipes. Please check your internet connection and try again.');
    }
}

// Fetch recipes from Spoonacular API
async function fetchRecipes(ingredients) {
    const ingredientsString = ingredients.join(',');
    const url = `${SPOONACULAR_BASE_URL}/findByIngredients?ingredients=${encodeURIComponent(ingredientsString)}&number=12&apiKey=${SPOONACULAR_API_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('Invalid API key. Please check your Spoonacular API key.');
        } else if (response.status === 402) {
            throw new Error('API quota exceeded. Please try again later.');
        } else {
            throw new Error(`API request failed with status: ${response.status}`);
        }
    }
    
    const recipes = await response.json();
    
    if (!recipes || recipes.length === 0) {
        throw new Error('No recipes found for the given ingredients. Try adding more ingredients or different ones.');
    }
    
    // Fetch detailed information for each recipe
    const detailedRecipes = await Promise.all(
        recipes.map(recipe => fetchRecipeDetails(recipe.id))
    );
    
    return detailedRecipes.filter(recipe => recipe !== null);
}

// Fetch detailed recipe information
async function fetchRecipeDetails(recipeId) {
    try {
        const url = `${SPOONACULAR_BASE_URL}/${recipeId}/information?apiKey=${SPOONACULAR_API_KEY}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            console.warn(`Failed to fetch details for recipe ${recipeId}`);
            return null;
        }
        
        return await response.json();
    } catch (error) {
        console.warn(`Error fetching recipe details for ${recipeId}:`, error);
        return null;
    }
}

// Display recipes in the grid
function displayRecipes(recipes) {
    if (recipes.length === 0) {
        recipesGrid.innerHTML = '<p style="text-align: center; color: #666; font-size: 1.1rem; grid-column: 1 / -1;">No recipes found. Try adding more ingredients!</p>';
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
        recipe.summary.replace(/<[^>]*>/g, '').substring(0, 150) + '...' : 
        'A delicious recipe you can make with your ingredients.';
    
    return `
        <div class="recipe-card" onclick="openRecipeModal(${recipe.id})">
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
                <button class="view-recipe-btn">View Recipe</button>
            </div>
        </div>
    `;
}

// Get difficulty level based on cooking time
function getDifficultyLevel(readyInMinutes) {
    if (readyInMinutes <= 30) return 'Easy';
    if (readyInMinutes <= 60) return 'Medium';
    return 'Hard';
}

// Open recipe modal with detailed information
async function openRecipeModal(recipeId) {
    const recipe = currentRecipes.find(r => r.id === recipeId);
    if (!recipe) return;
    
    // Populate modal with recipe data
    document.getElementById('modalTitle').textContent = recipe.title || 'Untitled Recipe';
    const modalImageEl = document.getElementById('modalImage');
    // Progressive image loading for modal
    const modalCandidates = [
        recipe.image,
        `https://spoonacular.com/recipeImages/${recipe.id}-636x393.jpg`,
        `https://spoonacular.com/recipeImages/${recipe.id}-480x360.jpg`
    ].filter(Boolean);
    loadImageProgressively(modalImageEl, modalCandidates, 'https://via.placeholder.com/400x300?text=No+Image');
    modalImageEl.alt = recipe.title || 'Recipe Image';
    
    document.getElementById('modalTime').textContent = recipe.readyInMinutes || 'N/A';
    document.getElementById('modalServings').textContent = recipe.servings || 'N/A';
    document.getElementById('modalDifficulty').textContent = getDifficultyLevel(recipe.readyInMinutes);
    
    // Populate ingredients
    const ingredientsList = document.getElementById('modalIngredients');
    if (recipe.extendedIngredients && recipe.extendedIngredients.length > 0) {
        ingredientsList.innerHTML = recipe.extendedIngredients.map(ingredient => {
            const imagePath = ingredient.image ? `https://spoonacular.com/cdn/ingredients_100x100/${ingredient.image}` : 'https://via.placeholder.com/60?text=%20';
            const name = ingredient.original || ingredient.name || '';
            return `<li><img class="ingredient-thumb" src="${imagePath}" alt="${name}" onerror="this.onerror=null;this.src='https://via.placeholder.com/60?text=%20'">${name}</li>`;
        }).join('');
    } else {
        ingredientsList.innerHTML = '<li>No ingredients information available</li>';
    }
    
    // Populate instructions
    const instructionsList = document.getElementById('modalInstructions');
    if (recipe.analyzedInstructions && recipe.analyzedInstructions.length > 0) {
        const steps = recipe.analyzedInstructions[0].steps || [];
        instructionsList.innerHTML = steps.map(step => 
            `<li>${step.step}</li>`
        ).join('');
    } else if (recipe.instructions) {
        // Fallback to basic instructions
        const instructions = recipe.instructions.replace(/<[^>]*>/g, '');
        instructionsList.innerHTML = `<li>${instructions}</li>`;
    } else {
        instructionsList.innerHTML = '<li>No instructions available</li>';
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

function showError(message) {
    // Suppress UI error panel; log to console instead
    console.warn('Suppressed error:', message);
    loadingSection.style.display = 'none';
    // Keep results visible if any; otherwise, do nothing
}

function hideError() {
    if (errorSection) errorSection.style.display = 'none';
}

// Utility function to handle API errors gracefully
function handleApiError(error) {
    console.error('API Error:', error);
    
    if (error.message.includes('API key')) {
        showError('Please configure your Spoonacular API key. Get your free API key at https://spoonacular.com/food-api');
    } else if (error.message.includes('quota')) {
        showError('API quota exceeded. Please try again later or upgrade your plan.');
    } else if (error.message.includes('No recipes found')) {
        showError('No recipes found for the given ingredients. Try adding more ingredients or different ones.');
    } else {
        showError('An error occurred while fetching recipes. Please try again.');
    }
}

// Add some sample functionality for demonstration
function addSampleIngredients() {
    const sampleIngredients = ['chicken', 'tomatoes', 'onions', 'garlic'];
    sampleIngredients.forEach(ingredient => {
        if (!selectedIngredients.includes(ingredient)) {
            selectedIngredients.push(ingredient);
        }
    });
    updateSelectedIngredientsDisplay();
    updateSearchButton();
}

// Make functions globally available
window.removeIngredient = removeIngredient;
window.openRecipeModal = openRecipeModal;
window.closeRecipeModal = closeRecipeModal;

// Progressive image loading utilities
function setupProgressiveImageLoading(){
    const imgs = document.querySelectorAll('img[data-load-src]');
    imgs.forEach(img => {
        const candidates = (img.getAttribute('data-load-src') || '').split('|').filter(Boolean);
        loadImageProgressively(img, candidates, img.getAttribute('src'));
    });
}

function loadImageProgressively(imgElement, srcCandidates, fallback){
    if (!srcCandidates || srcCandidates.length === 0){
        if (fallback) imgElement.src = fallback;
        return;
    }
    let index = 0;
    const tryNext = () => {
        if (index >= srcCandidates.length){
            if (fallback) imgElement.src = fallback;
            return;
        }
        const src = srcCandidates[index++];
        const testImg = new Image();
        testImg.onload = () => { imgElement.src = src; };
        testImg.onerror = tryNext;
        testImg.src = src;
    };
    tryNext();
}

// Apply a few Bootstrap helper classes to existing elements without changing HTML structure
function applyBootstrapHelpers(){
    try {
        const searchBtn = document.getElementById('searchRecipesBtn');
        if (searchBtn){ searchBtn.classList.add('btn','btn-primary'); }
        const clearBtn = document.getElementById('clearResultsBtn');
        if (clearBtn){ clearBtn.classList.add('btn','btn-danger','btn-sm'); }
        const addBtn = document.getElementById('addIngredientBtn');
        if (addBtn){ addBtn.classList.add('btn','btn-primary'); }
        document.querySelectorAll('.view-recipe-btn').forEach(b=>b.classList.add('btn','btn-primary'));
    } catch(e) { /* noop */ }
}
