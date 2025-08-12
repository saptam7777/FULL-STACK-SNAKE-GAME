// server.js
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const SCORES_FILE = path.join(__dirname, 'scores.json');
if (!fs.existsSync(SCORES_FILE)) fs.writeFileSync(SCORES_FILE, '[]', 'utf8');

// Helper to read/write scores
function readScores() {
  try {
    const raw = fs.readFileSync(SCORES_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    return [];
  }
}
function writeScores(arr) {
  fs.writeFileSync(SCORES_FILE, JSON.stringify(arr, null, 2), 'utf8');
}

// Save a new score { name, score, date }
app.post('/score', (req, res) => {
  const { name, score } = req.body;
  if (typeof name !== 'string' || typeof score !== 'number') {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const scores = readScores();
  scores.push({ name: name.slice(0, 30), score, date: new Date().toISOString() });
  // keep only top 50
  scores.sort((a, b) => b.score - a.score);
  writeScores(scores.slice(0, 50));
  res.json({ ok: true });
});

// Return top N scores
app.get('/scores', (req, res) => {
  const limit = Math.max(1, Math.min(50, parseInt(req.query.limit || '10')));
  const scores = readScores();
  res.json(scores.slice(0, limit));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
