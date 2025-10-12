document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("customRecipeForm");
    const listDiv = document.getElementById("customRecipesList");
  
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const title = document.getElementById("recipeTitle").value.trim();
      const ingredients = document.getElementById("recipeIngredients").value.trim();
      const instructions = document.getElementById("recipeInstructions").value.trim();
  
      const user = window.Auth?.currentUser();
      if (!user || !user.email) {
        alert("Please log in to save custom recipes.");
        return;
      }
  
      fetch("http://localhost:5000/api/custom-recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: user.email,
          title,
          ingredients,
          instructions
        })
      })
        .then(res => res.json())
        .then(data => {
          alert("Recipe saved!");
          loadCustomRecipes();
        })
        .catch(err => console.error("Error saving custom recipe:", err));
    });
  
    function loadCustomRecipes() {
      const user = window.Auth?.currentUser();
      if (!user || !user.email) return;
  
      fetch(`http://localhost:5000/api/custom-recipes?userEmail=${user.email}`)
        .then(res => res.json())
        .then(recipes => {
          listDiv.innerHTML = "";
          if (recipes.length === 0) {
            listDiv.innerHTML = "<p>No custom recipes yet.</p>";
            return;
          }
          recipes.forEach(r => {
            const card = document.createElement("div");
            card.className = "custom-recipe-card";
            card.innerHTML = `
              <h3>${r.title}</h3>
              <p><strong>Ingredients:</strong> ${r.ingredients}</p>
              <p><strong>Instructions:</strong> ${r.instructions}</p>
            `;
            listDiv.appendChild(card);
          });
        })
        .catch(err => console.error("Error fetching custom recipes:", err));
    }
  
    loadCustomRecipes();
  });
  