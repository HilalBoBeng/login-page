const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the SQLite database.');
});

// Create users table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    uid TEXT
)`);

// --- API Endpoints ---

// Signup
app.post('/api/signup', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const uid = crypto.randomBytes(16).toString('hex');

        const sql = `INSERT INTO users (username, password, uid) VALUES (?, ?, ?)`;
        db.run(sql, [username, hashedPassword, uid], function(err) {
            if (err) {
                // Unique constraint violation
                if (err.errno === 19) {
                    return res.status(409).json({ error: 'Username already exists' });
                }
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ message: 'User created successfully', userId: this.lastID, uid: uid });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error during signup' });
    }
});

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    const sql = `SELECT * FROM users WHERE username = ?`;
    db.get(sql, [username], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (match) {
            res.status(200).json({ message: 'Login successful', uid: user.uid });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    });
});

// AI Chat Proxy
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY;
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;

    if (!API_KEY) {
        return res.status(500).json({ error: 'API key not configured on the server.' });
    }

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    try {
        const geminiResponse = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: message }] }]
            })
        });

        if (!geminiResponse.ok) {
            const errorData = await geminiResponse.json();
            console.error("Gemini API Error:", errorData);
            return res.status(geminiResponse.status).json({ error: `Gemini API Error: ${errorData.error.message}` });
        }

        const data = await geminiResponse.json();
        res.status(200).json(data);

    } catch (error) {
        console.error("Server Fetch Error:", error);
        res.status(500).json({ error: 'Failed to fetch response from AI service.' });
    }
});


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
