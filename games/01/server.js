const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'labyrinth-game-secret-key-change-in-production';

// PostgreSQL connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Initialize PostgreSQL database
async function initDatabase() {
    const client = await pool.connect();
    try {
        // Create users table
        await client.query(`
            CREATE TABLE IF NOT EXISTS game_users (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                coins INTEGER DEFAULT 0,
                highest_level INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Database initialized with game_users table');
    } finally {
        client.release();
    }
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
        const existingUser = await pool.query(
            'SELECT id FROM game_users WHERE username = $1',
            [username]
        );
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Username already taken' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const result = await pool.query(
            'INSERT INTO game_users (name, username, password, coins, highest_level) VALUES ($1, $2, $3, 0, 1) RETURNING id',
            [name, username, hashedPassword]
        );

        res.status(201).json({
            message: 'User registered successfully',
            userId: result.rows[0].id
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
        const result = await pool.query(
            'SELECT * FROM game_users WHERE username = $1',
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const user = result.rows[0];

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
app.get('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name, username, coins, highest_level FROM game_users WHERE id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: result.rows[0] });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Server error fetching profile' });
    }
});

// Update user coins
app.put('/api/user/coins', authenticateToken, async (req, res) => {
    try {
        const { coins } = req.body;

        if (typeof coins !== 'number' || coins < 0) {
            return res.status(400).json({ error: 'Invalid coins value' });
        }

        await pool.query(
            'UPDATE game_users SET coins = $1 WHERE id = $2',
            [coins, req.user.id]
        );

        res.json({ message: 'Coins updated', coins });
    } catch (error) {
        console.error('Update coins error:', error);
        res.status(500).json({ error: 'Server error updating coins' });
    }
});

// Update user progress (level and coins)
app.put('/api/user/progress', authenticateToken, async (req, res) => {
    try {
        const { level, coins } = req.body;

        // Get current highest level
        const result = await pool.query(
            'SELECT highest_level FROM game_users WHERE id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const currentHighestLevel = result.rows[0].highest_level;
        const newHighestLevel = Math.max(currentHighestLevel, level || 1);

        await pool.query(
            'UPDATE game_users SET coins = $1, highest_level = $2 WHERE id = $3',
            [coins || 0, newHighestLevel, req.user.id]
        );

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
app.get('/api/leaderboard', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT name, username, coins, highest_level
            FROM game_users
            ORDER BY highest_level DESC, coins DESC
            LIMIT 10
        `);

        res.json({ leaderboard: result.rows });
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
        console.log(`Server running on port ${PORT}`);
        console.log(`Game available at http://localhost:${PORT}/login.html`);
    });
}).catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});
