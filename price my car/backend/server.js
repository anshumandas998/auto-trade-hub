const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const http = require('http');

const app = express();
const PORT = 3018;
const SECRET_KEY = 'your-secret-key';

// Python API URL for predictions
const PYTHON_API_URL = 'http://localhost:5000';

// In-memory user storage (for demo purposes - uses localStorage on frontend)
// This replaces MySQL database

// ✅ Serve static files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // Middleware for JSON body parsing

// ✅ Serve Landing Page (Home)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ✅ Serve Login Page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// ✅ Serve Dashboard Page
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Simple hash function (not secure, for demo only)
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString();
}

// ✅ Register Route
app.post('/register', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and Password are required' });
    }

    // Get users from header or use default
    const users = JSON.parse(req.headers['x-users'] || '[]');
    
    // Check if user already exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
    }

    // Simple password hashing (for demo purposes)
    const hashedPassword = simpleHash(password);
    
    // Add new user
    users.push({ email, password: hashedPassword });
    
    res.json({ message: 'Registration successful', users });
});

// ✅ Login Route
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and Password are required' });
    }

    // Get users from header or use default
    const users = JSON.parse(req.headers['x-users'] || '[]');
    
    // Find user
    const hashedPassword = simpleHash(password);
    const user = users.find(u => u.email === email && u.password === hashedPassword);
    
    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ email: user.email }, SECRET_KEY, { expiresIn: '1h' });

    res.json({ message: 'Login successful', token });
});

// ✅ Car Price Prediction Route - Proxy to Python API
app.post('/predict', async (req, res) => {
    try {
        const predictionData = req.body;
        
        // Forward request to Python API
        const data = JSON.stringify(predictionData);
        
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: '/predict',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const pythonReq = http.request(options, (pythonRes) => {
            let responseData = '';
            
            pythonRes.on('data', (chunk) => {
                responseData += chunk;
            });
            
            pythonRes.on('end', () => {
                try {
                    const result = JSON.parse(responseData);
                    res.status(pythonRes.statusCode).json(result);
                } catch (e) {
                    res.status(500).json({ error: 'Failed to parse prediction response' });
                }
            });
        });

        pythonReq.on('error', (error) => {
            console.error('Python API error:', error.message);
            res.status(500).json({ error: 'Prediction service unavailable. Make sure the Python API is running.' });
        });

        pythonReq.write(data);
        pythonReq.end();
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ✅ Health check for prediction service
app.get('/predict/health', (req, res) => {
    const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/health',
        method: 'GET'
    };

    const pythonReq = http.request(options, (pythonRes) => {
        let responseData = '';
        
        pythonRes.on('data', (chunk) => {
            responseData += chunk;
        });
        
        pythonRes.on('end', () => {
            try {
                const result = JSON.parse(responseData);
                res.json(result);
            } catch (e) {
                res.status(500).json({ status: 'error', message: 'Failed to parse response' });
            }
        });
    });

    pythonReq.on('error', () => {
        res.status(503).json({ status: 'unavailable', message: 'Prediction service is not running' });
    });

    pythonReq.end();
});

// ✅ Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log('✅ Using in-memory storage (no MySQL required)');
});

