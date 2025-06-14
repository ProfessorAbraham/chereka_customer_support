const express = require('express');
require('dotenv').config();

const app = express();

app.use(express.json());

app.get('/test', (req, res) => {
  res.json({ message: 'Test server is working' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running on port ${PORT}`);
});

