#!/usr/bin/env node

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Simulate GitHub Pages environment
// For MaterialMap.github.io, files are served from root
app.use(express.static(path.join(__dirname, '..')));

// Handle SPA routing - serve index.html for non-file requests
app.get('*', (req, res) => {
  // Don't serve index.html for actual files
  if (req.path.includes('.')) {
    return res.status(404).send('File not found');
  }
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`GitHub Pages simulation server running at http://localhost:${PORT}`);
  console.log('This simulates the production environment structure');
});