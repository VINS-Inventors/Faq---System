require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');

const authRoutes = require('./routes/auth');
const queryRoutes = require('./routes/queries');
const faqRoutes = require('./routes/faqRoutes');
const forumRoutes = require('./routes/forumRoutes');
const postRoutes = require('./routes/postRoutes');
const userRoutes = require('./routes/users');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/queries', queryRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({ message: 'FAQ Management System API', health: '/api/health' });
});

// Initialize db (tries MongoDB, falls back to local storage) then start server
const PORT = process.env.PORT || 5000;

db.init().then(() => {
  app.listen(PORT, () => {
    console.log(`FAQ API running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});