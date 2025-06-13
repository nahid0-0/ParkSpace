require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const cors = require('cors');
const mysql = require('mysql2/promise');
const multer = require('multer');
const AWS = require('aws-sdk');
const path = require('path');

const app = express();

// Middleware
app.use(express.json());
app.use(express.static('.'));  // Serve static files from current directory

const PORT = process.env.PORT || 3000;

// Configure AWS
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1'
});

const s3 = new AWS.S3();

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    }
});

// Database connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'car_parking',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

console.log('Database connection pool initialized successfully!');

// Initialize database tables
async function initializeDatabase() {
    try {
        // Create users table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                email VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                phone VARCHAR(20),
                first_name VARCHAR(50),
                last_name VARCHAR(50),
                address TEXT,
                city VARCHAR(50),
                state VARCHAR(50),
                zip_code VARCHAR(10),
                profile_picture_url TEXT,
                is_verified BOOLEAN DEFAULT FALSE,
                verification_token VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('Users table verified/created successfully!');

        // Create parking_properties table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS parking_properties (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                street_address VARCHAR(255) NOT NULL,
                unit VARCHAR(50),
                city VARCHAR(100) NOT NULL,
                state VARCHAR(50) NOT NULL,
                zip_code VARCHAR(20) NOT NULL,
                location_instructions TEXT,
                spot_title VARCHAR(255) NOT NULL,
                spot_type ENUM('driveway', 'garage', 'street', 'lot', 'covered') NOT NULL,
                hourly_rate DECIMAL(10, 2) NOT NULL,
                starting_date DATETIME NOT NULL,
                ending_date DATETIME NOT NULL,
                photo1_url TEXT,
                photo2_url TEXT,
                photo3_url TEXT,
                photo4_url TEXT,
                photo5_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('Parking properties table verified/created successfully!');

        // Create bookings table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS bookings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                property_id INT NOT NULL,
                start_time DATETIME NOT NULL,
                end_time DATETIME NOT NULL,
                total_cost DECIMAL(10, 2) NOT NULL,
                booking_status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (property_id) REFERENCES parking_properties(id) ON DELETE CASCADE
            )
        `);
        console.log('Bookings table verified/created successfully!');

        // Check and add total_cost column if it doesn't exist
        try {
            await pool.execute(`ALTER TABLE bookings ADD COLUMN total_cost DECIMAL(10, 2) NOT NULL DEFAULT 0`);
            console.log('total_cost column added to bookings table');
        } catch (error) {
            if (error.code !== 'ER_DUP_FIELDNAME') {
                console.error('Error adding total_cost column:', error);
            } else {
                console.log('total_cost column already exists in bookings table');
            }
        }

    } catch (error) {
        console.error('Database initialization error:', error);
    }
}

// Initialize database on startup
initializeDatabase();

// Nodemailer configuration
const transporter = nodemailer.createTransporter({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
        user: 'your-ethereal-email@ethereal.email',
        pass: 'your-ethereal-password'
    }
});

// S3 Upload endpoint
app.post('/api/s3-test-upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const fileName = `parking-images/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
        
        const params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: fileName,
            Body: req.file.buffer,
            ContentType: req.file.mimetype
        };

        const result = await s3.upload(params).promise();
        
        res.json({
            message: 'Upload successful',
            url: result.Location
        });
    } catch (error) {
        console.error('S3 upload error:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// Search parking properties endpoint
app.get('/api/search-parking', async (req, res) => {
    try {
        const { location, date, time, duration } = req.query;
        
        let query = `
            SELECT p.*, u.username as owner_name, u.phone as owner_phone
            FROM parking_properties p
            JOIN users u ON p.user_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (location) {
            query += ` AND (p.city LIKE ? OR p.street_address LIKE ? OR p.zip_code LIKE ?)`;
            const searchTerm = `%${location}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        if (date && time) {
            const searchDateTime = new Date(`${date}T${time}`);
            query += ` AND p.starting_date <= ? AND p.ending_date >= ?`;
            params.push(searchDateTime, searchDateTime);
        }

        query += ` ORDER BY p.created_at DESC`;

        const [results] = await pool.execute(query, params);
        
        res.json({ 
            success: true, 
            properties: results.map(property => ({
                ...property,
                photos: [
                    property.photo1_url,
                    property.photo2_url,
                    property.photo3_url,
                    property.photo4_url,
                    property.photo5_url
                ].filter(Boolean)
            }))
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

// Create booking endpoint
app.post('/api/create-booking', async (req, res) => {
    try {
        const { property_id, start_time, end_time, user_id } = req.body;

        // Input validation
        if (!property_id || !start_time || !end_time || !user_id) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const startDateTime = new Date(start_time);
        const endDateTime = new Date(end_time);
        const now = new Date();

        // Validation checks
        if (startDateTime < now) {
            return res.status(400).json({ error: 'Cannot book in the past' });
        }

        if (endDateTime <= startDateTime) {
            return res.status(400).json({ error: 'End time must be after start time' });
        }

        const durationHours = (endDateTime - startDateTime) / (1000 * 60 * 60);
        if (durationHours < 1) {
            return res.status(400).json({ error: 'Minimum booking duration is 1 hour' });
        }

        // Get property details
        const [propertyResult] = await pool.execute(
            'SELECT id, user_id, spot_title, hourly_rate FROM parking_properties WHERE id = ?',
            [property_id]
        );

        if (propertyResult.length === 0) {
            return res.status(404).json({ error: 'Property not found' });
        }

        const property = propertyResult[0];

        // Check if user is trying to book their own property
        if (property.user_id === parseInt(user_id)) {
            return res.status(400).json({ error: 'Cannot book your own property' });
        }

        // Check for overlapping bookings
        const [overlappingBookings] = await pool.execute(
            `SELECT id FROM bookings 
             WHERE property_id = ? 
             AND booking_status IN ('pending', 'confirmed') 
             AND NOT (end_time <= ? OR start_time >= ?)`,
            [property_id, start_time, end_time]
        );

        if (overlappingBookings.length > 0) {
            return res.status(409).json({ error: 'Time slot already booked' });
        }

        // Calculate total cost
        const totalCost = durationHours * parseFloat(property.hourly_rate);

        // Create booking
        const [result] = await pool.execute(
            `INSERT INTO bookings (user_id, property_id, start_time, end_time, total_cost, booking_status) 
             VALUES (?, ?, ?, ?, ?, 'confirmed')`,
            [user_id, property_id, start_time, end_time, totalCost]
        );

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            booking: {
                id: result.insertId,
                property_title: property.spot_title,
                start_time,
                end_time,
                duration_hours: durationHours,
                hourly_rate: property.hourly_rate,
                total_cost: totalCost,
                status: 'confirmed'
            }
        });

    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({ error: 'Failed to create booking' });
    }
});

// Get user bookings endpoint
app.get('/api/user-bookings/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const [bookings] = await pool.execute(
            `SELECT b.*, p.spot_title, p.street_address, p.city, p.state,
                    u.username as owner_name, u.phone as owner_phone
             FROM bookings b
             JOIN parking_properties p ON b.property_id = p.id
             JOIN users u ON p.user_id = u.id
             WHERE b.user_id = ?
             ORDER BY b.start_time DESC`,
            [userId]
        );

        res.json({ success: true, bookings });
    } catch (error) {
        console.error('Get bookings error:', error);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

// Add property endpoint
app.post('/api/add-property', async (req, res) => {
    try {
        const {
            user_id, street_address, unit, city, state, zip_code,
            location_instructions, spot_title, spot_type, hourly_rate,
            starting_date, ending_date, photo1_url, photo2_url,
            photo3_url, photo4_url, photo5_url
        } = req.body;

        if (!user_id || !street_address || !city || !state || !zip_code || 
            !spot_title || !spot_type || !hourly_rate || !starting_date || !ending_date) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const [result] = await pool.execute(
            `INSERT INTO parking_properties 
             (user_id, street_address, unit, city, state, zip_code, location_instructions,
              spot_title, spot_type, hourly_rate, starting_date, ending_date,
              photo1_url, photo2_url, photo3_url, photo4_url, photo5_url)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [user_id, street_address, unit, city, state, zip_code, location_instructions,
             spot_title, spot_type, hourly_rate, starting_date, ending_date,
             photo1_url, photo2_url, photo3_url, photo4_url, photo5_url]
        );

        res.status(201).json({
            success: true,
            message: 'Property added successfully',
            id: result.insertId
        });
    } catch (error) {
        console.error('Add property error:', error);
        res.status(500).json({ error: 'Failed to add property' });
    }
});

// User authentication endpoints (signup, login, etc.) from the previous version...
app.post('/api/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        const [existingUsers] = await pool.execute(
            'SELECT * FROM users WHERE email = ? OR username = ?',
            [email, username]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({ error: 'Email or username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');

        await pool.execute(
            'INSERT INTO users (username, email, password, verification_token) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, verificationToken]
        );

        res.status(201).json({ message: 'User created successfully. Please check your email to verify your account.' });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const [users] = await pool.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

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

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 