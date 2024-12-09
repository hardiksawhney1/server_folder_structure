const express = require('express');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

const PORT = 5000;

// Helper function to get nested object value
const getNestedValue = (obj, path) => {
  return path.split('/').reduce((current, key) => current && current[key], obj);
};

// Helper function to set nested object value
const setNestedValue = (obj, path, value) => {
  const keys = path.split('/');
  const lastKey = keys.pop();
  const target = keys.reduce((current, key) => current[key], obj);
  target[lastKey] = value;
};

app.get('/api/data', (req, res) => {
  fs.readFile('./data.json', 'utf8', (err, data) => {
    if (err) {
      res.status(500).send('Error reading data');
    } else {
      res.json(JSON.parse(data));
    }
  });
});

// New endpoint to add file or folder
app.post('/api/add', (req, res) => {
  console.log('Received request:', req.body);
  const { path, type, name } = req.body;
  
  fs.readFile('./data.json', 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Error reading data' });
    }

    try {
      const jsonData = JSON.parse(data);

      if (type === 'file') {
        // Adding a file
        let targetArray;
        
        if (path === 'root' || !path) {
          // Add to root
          targetArray = jsonData.root;
        } else {
          // Add to specified path
          let current = jsonData;
          const parts = path.split('/');
          
          for (const part of parts) {
            if (!current[part]) {
              current[part] = [];
            }
            current = current[part];
          }
          targetArray = current;
        }

        if (!Array.isArray(targetArray)) {
          targetArray = [];
        }

        if (targetArray.includes(name)) {
          return res.status(400).json({ error: 'File already exists' });
        }

        targetArray.push(name);
        
      } else {
        // Adding a folder
        if (path === '') {
          // Add at root level
          if (jsonData[name]) {
            return res.status(400).json({ error: 'Folder already exists' });
          }
          jsonData[name] = {};
        } else {
          let current = jsonData;
          const parts = path.split('/');
          
          for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (!current[part]) {
              current[part] = {};
            }
            current = current[part];
          }

          if (current[name]) {
            return res.status(400).json({ error: 'Folder already exists' });
          }
          current[name] = {};
        }
      }

      fs.writeFile('./data.json', JSON.stringify(jsonData, null, 2), writeErr => {
        if (writeErr) {
          return res.status(500).json({ error: 'Error saving data' });
        }
        res.json({ success: true, data: jsonData });
      });

    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
