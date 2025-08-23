#!/usr/bin/env node

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3002;
const REPO_NAME = 'MaterialMap'; // Simulate a subdirectory deployment

// Simulate GitHub Pages subdirectory environment
// For username.github.io/repo-name, files are served from /repo-name/
app.use(`/${REPO_NAME}`, express.static(path.join(__dirname, '..')));

// Handle SPA routing for subdirectory
app.get(`/${REPO_NAME}/*`, (req, res) => {
  const filePath = req.path.replace(`/${REPO_NAME}`, '');
  if (filePath.includes('.')) {
    return res.status(404).send('File not found');
  }
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Redirect root to subdirectory
app.get('/', (req, res) => {
  res.redirect(`/${REPO_NAME}/`);
});

app.listen(PORT, () => {
  console.log(`GitHub Pages subdirectory simulation server running at http://localhost:${PORT}/${REPO_NAME}`);
  console.log('This simulates deployment to username.github.io/repo-name');
});