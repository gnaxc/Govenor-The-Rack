const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'governor-super-secret-key-2026'; // In production, this goes in a .env file!

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://127.0.0.1:27017/governorDB')
  .then(() => console.log('Connected to Governor Database'))
  .catch(err => console.error('Database connection error:', err));

// --- 1. DATA MODELS ---
const assetSchema = new mongoose.Schema({
  hostname: String, ipAddress: String, osVersion: String, rackPosition: String
});
const Asset = mongoose.model('Asset', assetSchema);

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true } // Will be securely hashed
});
const User = mongoose.model('User', userSchema);

// --- 2. INITIALIZE SECURE ADMIN USER ---
// Automatically resets and creates an admin account on startup
async function createAdminUser() {
    // Delete the admin user if it exists to ensure a clean state and matching passwords
    await User.deleteOne({ username: 'admin' });

    const hashedPassword = await bcrypt.hash('gDevLabs2026!', 10);
    await User.create({ username: 'admin', password: hashedPassword });
    console.log('Secure Admin account created/reset.');
}
createAdminUser();

// --- 3. AUTHENTICATION MIDDLEWARE (THE BOUNCER) ---
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Extract Bearer token

    if (!token) return res.status(401).json({ message: 'Access Denied: No Token' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid Token' });
        req.user = user;
        next(); // Token is valid, let them through
    });
}

// --- 4. REST API ROUTES ---
// LOGIN ROUTE
app.post('/api/v1/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token valid for 1 hour
    const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
});

// GET ROUTE (Public view)
app.get('/api/v1/assets', async (req, res) => {
    try {
        const assets = await Asset.find();
        res.json(assets);
    } catch (error) { res.status(500).json({ message: "Error retrieving assets" }); }
});

// POST ROUTE (Secured by JWT Bouncer)
app.post('/api/v1/assets', authenticateToken, async (req, res) => {
    try {
        const newAsset = new Asset(req.body);
        const savedAsset = await newAsset.save();
        res.status(201).json(savedAsset);
    } catch (error) { res.status(400).json({ message: "Error saving asset" }); }
});

// Only start the server if not running tests
if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => { console.log(`Governor API running on Port ${PORT}`); });
}
module.exports = app;