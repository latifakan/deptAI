// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;  // From .env (Atlas)
const DB_NAME = 'payoffai';

app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

let db;

// ──────────────────────────────
// MongoDB Atlas Connection (Cloud)
// ──────────────────────────────
MongoClient.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(client => {
    db = client.db(DB_NAME);
    console.log(`Connected to MongoDB Atlas → ${DB_NAME}`);
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB Atlas connection error:', err);
    process.exit(1);
  });

// ──────────────────────────────
// 1. Contact form save
// ──────────────────────────────
app.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields required' });
  }
  try {
    await db.collection('contacts').insertOne({ name, email, message, date: new Date() });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Save failed' });
  }
});

// ──────────────────────────────
// 2. Admin: Load all contact messages
// ──────────────────────────────
app.get('/admin/contacts', async (req, res) => {
  const token = req.headers.authorization;
  if (token !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return res.status(403).json({ error: 'Access denied' });
  }
  try {
    const contacts = await db.collection('contacts')
      .find()
      .sort({ date: -1 })
      .toArray();
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: 'Load failed' });
  }
});

// ──────────────────────────────
// 3. Health check
// ──────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'PayOffAI Backend running', time: new Date().toLocaleString('de-DE') });
});