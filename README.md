# Interactive Recipe Finder 🍳

A beautiful and responsive web application that helps users discover delicious recipes based on their available ingredients. Built with HTML, CSS, and JavaScript, this app integrates with the Spoonacular API to provide smart recipe suggestions that reduce food waste and cooking time.

## Features ✨

- **Ingredient-Based Search**: Enter your available ingredients and get personalized recipe suggestions
- **Beautiful UI/UX**: Modern, responsive design with smooth animations and intuitive interface
- **Recipe Details**: View detailed recipe information including ingredients, instructions, cooking time, and difficulty level
- **Smart Suggestions**: Get recipes that maximize the use of your available ingredients
- **Mobile Responsive**: Works perfectly on all devices - desktop, tablet, and mobile
- **Error Handling**: Graceful error handling with user-friendly messages
- **Loading States**: Smooth loading animations for better user experience

## Getting Started 🚀

### Prerequisites

- A modern web browser
- A Spoonacular API key (free at [spoonacular.com/food-api](https://spoonacular.com/food-api))

### Installation

1. **Clone or download this repository**
   ```bash
   git clone <repository-url>
   cd Interactive_reciepe
   ```

2. **Get your Spoonacular API key**
   - Visit [spoonacular.com/food-api](https://spoonacular.com/food-api)
   - Sign up for a free account
   - Get your API key from the dashboard

3. **Configure the API key**
   - Open `script.js`
   - Replace `YOUR_API_KEY_HERE` with your actual Spoonacular API key:
   ```javascript
   const SPOONACULAR_API_KEY = 'your-actual-api-key-here';
   ```

4. **Open the application**
   - Simply open `index.html` in your web browser
   - Or serve it using a local web server for better performance

## How to Use 📖

1. **Add Ingredients**: Type your available ingredients in the input field and click the "+" button or press Enter
2. **Manage Ingredients**: Remove ingredients by clicking the "×" button on ingredient tags
3. **Search Recipes**: Click "Find Recipes" to get personalized recipe suggestions
4. **View Details**: Click on any recipe card to see detailed information including ingredients and cooking instructions
5. **Clear Results**: Use the "Clear Results" button to start over with new ingredients

## API Integration 🔌

This application uses the **Spoonacular API** for recipe data:

- **Find by Ingredients**: Searches for recipes based on available ingredients
- **Recipe Information**: Fetches detailed recipe data including instructions and nutrition info
- **Free Tier**: Includes 150 requests per day (perfect for personal use)

### API Endpoints Used

- `GET /recipes/findByIngredients` - Find recipes by ingredients
- `GET /recipes/{id}/information` - Get detailed recipe information

## File Structure 📁

```
Interactive_reciepe/
├── index.html          # Main HTML structure
├── styles.css          # CSS styling and responsive design
├── script.js           # JavaScript functionality and API integration
└── README.md           # This file
```

## Customization 🎨

### Styling
- Modify `styles.css` to change colors, fonts, and layout
- The app uses CSS custom properties for easy theming
- Responsive breakpoints can be adjusted in the media queries

### Functionality
- Add more API endpoints in `script.js`
- Implement additional features like recipe favorites or meal planning
- Add more sophisticated ingredient parsing and suggestions

## Browser Support 🌐

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

## Troubleshooting 🔧

### Common Issues

1. **"Please configure your API key" error**
   - Make sure you've replaced `YOUR_API_KEY_HERE` with your actual Spoonacular API key

2. **"API quota exceeded" error**
   - You've reached your daily API limit (150 requests for free tier)
   - Wait 24 hours or upgrade your plan

3. **"No recipes found" error**
   - Try adding more ingredients
   - Check if ingredient names are spelled correctly
   - Try more common ingredient names

4. **Images not loading**
   - Some recipe images might be unavailable
   - This is normal and the app will show placeholder images

## Contributing 🤝

Feel free to contribute to this project by:
- Reporting bugs
- Suggesting new features
- Improving the code
- Enhancing the UI/UX

## License 📄

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments 🙏

- [Spoonacular API](https://spoonacular.com/food-api) for providing recipe data
- [Font Awesome](https://fontawesome.com/) for icons
- [Google Fonts](https://fonts.google.com/) for the Poppins font family

---

**Happy Cooking! 🍽️**

Made with ❤️ for food lovers who want to make the most of their ingredients.
