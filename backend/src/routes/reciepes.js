// backend/routes/recipes.js
const express = require('express');
const fetch = require('node-fetch'); // or global fetch in modern Node
const router = express.Router();
const API_KEY = process.env.SPOONACULAR_API_KEY;

router.get('/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const r = await fetch(`https://api.spoonacular.com/recipes/${id}/information?apiKey=${API_KEY}`);
    const data = await r.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'upstream fetch failed' });
  }
});

module.exports = router;
