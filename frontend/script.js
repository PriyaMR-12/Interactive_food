// API Configuration
const SPOONACULAR_API_KEY = 'b9b1f35fc51a4ae18bda8dcd74bf3cbc'; // Replace with your actual API key
const SPOONACULAR_BASE_URL = 'https://api.spoonacular.com/recipes';

// Backend Base URL
const API_BASE = "http://localhost:5000";

// Simple Auth Handler (Replace later with real login logic)
window.Auth = {
  isAuthenticated: () => !!localStorage.getItem("token"),
  currentUser: () => {
    const email = localStorage.getItem("userEmail");
    return email ? { email } : null;
  }
};

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
    return `
        <div class="recipe-card">
            <img src="${recipe.image}" alt="${recipe.title}" class="recipe-img">
            <h3 class="recipe-title">${recipe.title}</h3>
            <button class="view-btn" onclick="openRecipeModal(${recipe.id})">View Recipe</button>
            <button class="fav-btn" onclick="saveFavorite(${recipe.id}, '${recipe.title}', '${recipe.image}')">❤️ Save</button>
        </div>
    `;


}

function saveFavorite(id, title, image) {
    const user = window.Auth?.currentUser();
    if (!user || !user.email) {
        alert("Please log in to save recipes.");
        return;
    }

    fetch("http://localhost:4000/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            userEmail: user.email,
            recipeId: id,
            title,
            image
        })
    })
    .then(res => res.json())
    .then(data => alert("Recipe added to favorites!"))
    .catch(err => console.error("Error saving favorite:", err));
}

window.saveFavorite = saveFavorite;


// Add this to script.js
function saveViewedRecipe(recipe) {
    const email = localStorage.getItem("userEmail");
    if (!email) return;
    
  
    const viewedData = {
      userEmail: user.email,
      recipeId: recipe.id,
      title: recipe.title,
      image: recipe.image,
      summary: recipe.summary,
      readyInMinutes: recipe.readyInMinutes,
      servings: recipe.servings
    };
  
    fetch("http://localhost:4000/api/viewed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(viewedData)
    })
      .then(res => res.json())
      .then(data => console.log("Saved viewed recipe:", data))
      .catch(err => console.error("Failed to save viewed recipe:", err));
  }
  
// Unified openRecipeModal that accepts either a recipe object OR a recipeId
// ✅ Updated openRecipeModal() for full recipe details
async function openRecipeModal(recipeId) {
    try {
        const apiKey = "b9b1f35fc51a4ae18bda8dcd74bf3cbc";
        const response = await fetch(`https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${apiKey}`);
        const data = await response.json();

        if (!data || !data.extendedIngredients) {
            showError("Recipe details not available. Try searching again.");
            return;
        }

        // Populate modal fields
        document.getElementById('modalTitle').textContent = data.title;
        document.getElementById('modalImage').src = data.image;
        document.getElementById('modalTime').textContent = data.readyInMinutes || 'N/A';
        document.getElementById('modalServings').textContent = data.servings || 'N/A';
        document.getElementById('modalDifficulty').textContent = data.veryPopular ? 'Popular' : 'Normal';

        // Ingredients
        const ingredientsList = data.extendedIngredients
            .map(ing => `<li>${ing.original}</li>`)
            .join('');
        document.getElementById('modalIngredients').innerHTML = ingredientsList;

        // Instructions
        const instructionsList = data.analyzedInstructions[0]?.steps
            ?.map(step => `<li>${step.step}</li>`)
            .join('') || '<li>No instructions available.</li>';
        document.getElementById('modalInstructions').innerHTML = instructionsList;

        // Show modal
        const recipeModal = document.getElementById('recipeModal');
        recipeModal.style.display = 'block';
document.body.style.overflow = 'hidden';

    } catch (error) {
        console.error('Error fetching recipe details:', error);
        showError('Failed to load recipe details.');
    }
}

// Close modal logic
document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('recipeModal').style.display = 'none';
});

  
  
  
// Get difficulty level based on cooking time
function getDifficultyLevel(readyInMinutes) {
    if (readyInMinutes <= 30) return 'Easy';
    if (readyInMinutes <= 60) return 'Medium';
    return 'Hard';
}

// Track viewed recipe
async function trackViewedRecipe(recipe) {
    if (!window.Auth || !window.Auth.isAuthenticated()) return;
    const user = window.Auth.currentUser();
    if (!user || !user.email) return;

    const viewedData = {
        userEmail: user.email,
        recipeId: recipe.id,
        title: recipe.title,
        image: recipe.image,
        viewedAt: Date.now()
    };

    try {
        const response = await fetch("http://localhost:4000/api/viewed", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(viewedData)
        });

        const data = await response.json();
        console.log("✅ Viewed recipe saved to backend:", data);
    } catch (error) {
        console.error("❌ Failed to save viewed recipe:", error);
    }
}

// Open recipe modal with detailed information (Enhanced with tracking)

document.getElementById("logoutBtn")?.addEventListener("click", () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    window.location.href = "login.html";
});

// Close recipe modal
function closeRecipeModal() {
    const recipeModal = document.getElementById('recipeModal');
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

async function loginUser(event) {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
  
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  
    const data = await res.json();
  
    if (res.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("userEmail", email);
      alert("Login successful!");
      window.location.href = "index.html";
    } else {
      alert(data.message || "Login failed");
    }
  }
  
  async function submitSignup(event) {
    event.preventDefault();
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
  
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
  
    const data = await res.json();
  
    if (res.ok) {
      alert("Signup successful!");
      window.location.href = "login.html";
    } else {
      alert(data.message || "Signup failed");
    }
  }
  
  function logoutUser() {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    alert("Logged out!");
    window.location.href = "login.html";
  }
  
// Expose functions globally for HTML onclick handlers (required for inline JS in HTML)
window.removeIngredient = removeIngredient;
window.openRecipeModal = openRecipeModal;
window.closeRecipeModal = closeRecipeModal;
window.trackViewedRecipe = trackViewedRecipe; // Optional, for debugging