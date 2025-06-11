require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const cors = require('cors');
const { initializeDatabase, getDbConnection } = require('./src/config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173', // Update this with your frontend URL
    credentials: true
}));

// Initialize database
initializeDatabase();

// Nodemailer configuration (using Ethereal for testing)
const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
        // Get these credentials from https://ethereal.email/
        user: 'your-ethereal-email@ethereal.email',
        pass: 'your-ethereal-password'
    }
});

// Signup endpoint
app.post('/api/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        const db = getDbConnection();

        // Check if user already exists
        const [existingUsers] = await db.execute(
            'SELECT * FROM users WHERE email = ? OR username = ?',
            [email, username]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({ error: 'Email or username already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Insert new user
        await db.execute(
            'INSERT INTO users (username, email, password, verification_token) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, verificationToken]
        );

        // Send verification email
        const verificationUrl = `http://localhost:${PORT}/api/verify-email?token=${verificationToken}`;
        await transporter.sendMail({
            from: '"ParkSpace" <noreply@parkspace.com>',
            to: email,
            subject: 'Verify your ParkSpace account',
            html: `
                <h1>Welcome to ParkSpace!</h1>
                <p>Please click the link below to verify your email address:</p>
                <a href="${verificationUrl}">${verificationUrl}</a>
            `
        });

        res.status(201).json({ message: 'User created successfully. Please check your email to verify your account.' });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Email verification endpoint
app.get('/api/verify-email', async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({ error: 'Verification token is required' });
        }

        const db = getDbConnection();

        // Find user with token
        const [users] = await db.execute(
            'SELECT * FROM users WHERE verification_token = ?',
            [token]
        );

        if (users.length === 0) {
            return res.status(400).json({ error: 'Invalid verification token' });
        }

        const user = users[0];

        if (user.is_verified) {
            return res.status(400).json({ error: 'Email already verified' });
        }

        // Update user verification status
        await db.execute(
            'UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE id = ?',
            [user.id]
        );

        res.status(200).json({ message: 'Email successfully verified!' });
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const db = getDbConnection();

        // Find user
        const [users] = await db.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];

        // Check if email is verified
        if (!user.is_verified) {
            return res.status(403).json({ error: 'Please verify your email before logging in' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // TODO: Generate JWT token here
        res.status(200).json({ 
            message: 'Login successful!',
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 