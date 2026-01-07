const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'labyrinth-game-secret-key-change-in-production';
const DB_PATH = path.join(__dirname, 'game.db');

let db;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Initialize SQLite database
async function initDatabase() {
    const SQL = await initSqlJs();

    // Load existing database or create new one
    if (fs.existsSync(DB_PATH)) {
        const fileBuffer = fs.readFileSync(DB_PATH);
        db = new SQL.Database(fileBuffer);
    } else {
        db = new SQL.Database();
    }

    // Create users table
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            coins INTEGER DEFAULT 0,
            highest_level INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);

    saveDatabase();
    console.log('Database initialized with users table');
}

// Save database to file
function saveDatabase() {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
}

// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

// API Routes

// Register new user
app.post('/api/register', async (req, res) => {
    try {
        const { name, username, password } = req.body;

        if (!name || !username || !password) {
            return res.status(400).json({ error: 'Name, username, and password are required' });
        }

        if (username.length < 3) {
            return res.status(400).json({ error: 'Username must be at least 3 characters' });
        }

        if (password.length < 4) {
            return res.status(400).json({ error: 'Password must be at least 4 characters' });
        }

        // Check if username already exists
        const existingUser = db.exec('SELECT id FROM users WHERE username = ?', [username]);
        if (existingUser.length > 0 && existingUser[0].values.length > 0) {
            return res.status(400).json({ error: 'Username already taken' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        db.run(
            'INSERT INTO users (name, username, password, coins, highest_level) VALUES (?, ?, ?, 0, 1)',
            [name, username, hashedPassword]
        );
        saveDatabase();

        const result = db.exec('SELECT last_insert_rowid() as id');
        const userId = result[0].values[0][0];

        res.status(201).json({
            message: 'User registered successfully',
            userId
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// Login user
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Find user
        const result = db.exec('SELECT * FROM users WHERE username = ?', [username]);
        if (result.length === 0 || result[0].values.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const columns = result[0].columns;
        const values = result[0].values[0];
        const user = {};
        columns.forEach((col, i) => user[col] = values[i]);

        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Generate token
        const token = jwt.sign(
            { id: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                username: user.username,
                coins: user.coins,
                highest_level: user.highest_level
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// Get user profile
app.get('/api/user/profile', authenticateToken, (req, res) => {
    try {
        const result = db.exec('SELECT id, name, username, coins, highest_level FROM users WHERE id = ?', [req.user.id]);

        if (result.length === 0 || result[0].values.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const columns = result[0].columns;
        const values = result[0].values[0];
        const user = {};
        columns.forEach((col, i) => user[col] = values[i]);

        res.json({ user });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Server error fetching profile' });
    }
});

// Update user coins
app.put('/api/user/coins', authenticateToken, (req, res) => {
    try {
        const { coins } = req.body;

        if (typeof coins !== 'number' || coins < 0) {
            return res.status(400).json({ error: 'Invalid coins value' });
        }

        db.run('UPDATE users SET coins = ? WHERE id = ?', [coins, req.user.id]);
        saveDatabase();

        res.json({ message: 'Coins updated', coins });
    } catch (error) {
        console.error('Update coins error:', error);
        res.status(500).json({ error: 'Server error updating coins' });
    }
});

// Update user progress (level and coins)
app.put('/api/user/progress', authenticateToken, (req, res) => {
    try {
        const { level, coins } = req.body;

        // Get current highest level
        const result = db.exec('SELECT highest_level FROM users WHERE id = ?', [req.user.id]);

        if (result.length === 0 || result[0].values.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const currentHighestLevel = result[0].values[0][0];
        const newHighestLevel = Math.max(currentHighestLevel, level || 1);

        db.run('UPDATE users SET coins = ?, highest_level = ? WHERE id = ?', [coins || 0, newHighestLevel, req.user.id]);
        saveDatabase();

        res.json({
            message: 'Progress saved',
            coins: coins || 0,
            highest_level: newHighestLevel
        });
    } catch (error) {
        console.error('Update progress error:', error);
        res.status(500).json({ error: 'Server error updating progress' });
    }
});

// Get leaderboard
app.get('/api/leaderboard', (req, res) => {
    try {
        const result = db.exec(`
            SELECT name, username, coins, highest_level
            FROM users
            ORDER BY highest_level DESC, coins DESC
            LIMIT 10
        `);

        let leaderboard = [];
        if (result.length > 0) {
            const columns = result[0].columns;
            leaderboard = result[0].values.map(row => {
                const obj = {};
                columns.forEach((col, i) => obj[col] = row[i]);
                return obj;
            });
        }

        res.json({ leaderboard });
    } catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).json({ error: 'Server error fetching leaderboard' });
    }
});

// Serve the game
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Start server
initDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
        console.log(`Game available at http://localhost:${PORT}/login.html`);
    });
});
