const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 3001;

// Enable CORS for all origins
app.use(cors());

// Current season standings endpoint
app.get('/api/standings', async (req, res) => {
  try {
    const response = await fetch('https://www.thesportsdb.com/api/v1/json/3/lookuptable.php?l=4328&s=2024-2025');
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching standings:', error);
    res.status(500).json({ error: 'Failed to fetch standings' });
  }
});

// Historical standings endpoint - multiple seasons
app.get('/api/standings/history', async (req, res) => {
  try {
    const seasons = [
      '2024-2025',
      '2023-2024',
      '2022-2023',
      '2021-2022',
      '2020-2021'
    ];

    const promises = seasons.map(season =>
      fetch(`https://www.thesportsdb.com/api/v1/json/3/lookuptable.php?l=4328&s=${season}`)
        .then(r => r.json())
        .then(data => ({ season, data: data.table || [] }))
        .catch(err => ({ season, data: [], error: err.message }))
    );

    const results = await Promise.all(promises);
    res.json(results);
  } catch (error) {
    console.error('Error fetching historical standings:', error);
    res.status(500).json({ error: 'Failed to fetch historical standings' });
  }
});

// Recent games endpoint
app.get('/api/games', async (req, res) => {
  try {
    const response = await fetch('https://www.thesportsdb.com/api/v1/json/3/eventspastleague.php?id=4328');
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

// Next games endpoint
app.get('/api/games/upcoming', async (req, res) => {
  try {
    const response = await fetch('https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=4328');
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching upcoming games:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming games' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Premier League API is running' });
});

app.listen(PORT, () => {
  console.log(`Premier League Stats backend running on http://localhost:${PORT}`);
  console.log(`Test it: http://localhost:${PORT}/api/health`);
});
