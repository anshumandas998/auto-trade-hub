const express = require('express');
const mysql = require('mysql');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3018;
const SECRET_KEY = 'your-secret-key'; // Change this to a secure secret key

// ✅ Database Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '200518',
    database: 'userdetails'
});

db.connect(err => {
    if (err) {
        console.error('❌ Database connection failed:', err);
    } else {
        console.log('✅ Database connected successfully');
    }
});

// ✅ Serve static files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // Middleware for JSON body parsing

// ✅ Serve Login Page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// ✅ Serve Dashboard Page
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// ✅ Register Route
app.post('/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and Password are required' });
    }

    // Check if user already exists
    const checkUser = 'SELECT * FROM users WHERE email = ?';
    db.query(checkUser, [email], async (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Server error' });
        }

        if (results.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password before storing
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO users (email, password) VALUES (?, ?)';
        db.query(sql, [email, hashedPassword], (err) => {
            if (err) {
                return res.status(500).json({ message: 'Error registering user' });
            }
            res.json({ message: 'Registration successful' });
        });
    });
});

// ✅ Login Route
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and Password are required' });
    }

    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], async (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Server error' });
        }

        if (results.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Compare hashed password
        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign({ email: user.email }, SECRET_KEY, { expiresIn: '1h' });

        res.json({ message: 'Login successful', token });
    });
});

// ✅ Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
