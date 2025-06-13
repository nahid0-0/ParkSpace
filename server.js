require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const { initializeDatabase, getDbConnection } = require('./src/config/database');
const multer = require('multer');
const AWS = require('aws-sdk');

const app = express();

// CORS middleware at the very top
app.use(cors({
    origin: [
        'http://127.0.0.1:5501',
        'http://localhost:5501',
        'http://127.0.0.1:8080',
        'http://localhost:8080'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
// Initialize database
initializeDatabase();

app.options('/api/signup', cors()); // Explicitly handle OPTIONS for signup
app.post('/api/signup', cors(), async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, and password are required' });
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
            const existingUser = existingUsers[0];
            if (existingUser.email === email) {
                return res.status(409).json({ error: 'Email already registered' });
            }
            if (existingUser.username === username) {
                return res.status(409).json({ error: 'Username already taken' });
            }
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create user
        const [result] = await db.execute(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );

        res.status(201).json({ 
            message: 'Account created successfully!',
            user: {
                id: result.insertId,
                username: username,
                email: email
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
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

        // Verify password
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

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        const db = getDbConnection();
        await db.query('SELECT 1');
        res.status(200).json({ status: 'ok', message: 'Database connection is healthy.' });
    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({ status: 'error', message: 'Database connection failed.', error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Configure AWS SDK
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

// Configure Multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Route to upload file to S3
app.post('/api/s3-test-upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded.' });
        }

        // Set up S3 upload parameters
        const params = {
            Bucket: process.env.AWS_S3_BUCKET, // Changed from AWS_S3_BUCKET_NAME to AWS_S3_BUCKET
            Key: `test-uploads/${Date.now()}_${req.file.originalname}`,
            Body: req.file.buffer,
            ContentType: req.file.mimetype
        };

        // Upload file to S3
        const data = await s3.upload(params).promise();

        // Send response with S3 file URL
        res.status(200).json({
            url: data.Location
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: 'Error uploading file to S3' });
    }
});

app.post('/api/add-property', async (req, res) => {
    try {
        const {
            user_id, street_address, unit, city, state, zip_code,
            location_instructions, spot_title, spot_type, hourly_rate,
            photo1_url, photo2_url, photo3_url, photo4_url, photo5_url
        } = req.body;

        const db = getDbConnection();
        const [result] = await db.execute(
            'INSERT INTO parking_properties (user_id, street_address, unit, city, state, zip_code, location_instructions, spot_title, spot_type, hourly_rate, photo1_path, photo2_path, photo3_path, photo4_path, photo5_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                user_id, street_address, unit || null, city, state, zip_code,
                location_instructions, spot_title, spot_type, hourly_rate,
                photo1_url, photo2_url, photo3_url, photo4_url, photo5_url
            ]
        );

        res.status(201).json({ message: 'Property added successfully', id: result.insertId });
    } catch (error) {
        console.error('Add property error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/test-image', async (req, res) => {
    const { photo_path } = req.body;
    if (!photo_path) {
        return res.status(400).json({ error: 'photo_path is required' });
    }
    try {
        const db = getDbConnection();
        await db.execute('INSERT INTO test_image (photo_path) VALUES (?)', [photo_path]);
        res.status(201).json({ message: 'Image URL saved!' });
    } catch (error) {
        console.error('DB error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get properties for search
app.get('/api/search-properties', async (req, res) => {
    try {
        const { location, date, price_min, price_max, spot_type } = req.query;
        
        const db = getDbConnection();
        let query = `
            SELECT pp.*, u.username as owner_name 
            FROM parking_properties pp 
            LEFT JOIN users u ON pp.user_id = u.id 
            WHERE 1=1
        `;
        let params = [];

        // Filter by location (city or state)
        if (location) {
            query += ` AND (pp.city LIKE ? OR pp.state LIKE ? OR pp.street_address LIKE ?)`;
            const locationPattern = `%${location}%`;
            params.push(locationPattern, locationPattern, locationPattern);
        }

        // Filter by price range
        if (price_min) {
            query += ` AND pp.hourly_rate >= ?`;
            params.push(price_min);
        }
        if (price_max) {
            query += ` AND pp.hourly_rate <= ?`;
            params.push(price_max);
        }

        // Filter by spot type
        if (spot_type) {
            query += ` AND pp.spot_type = ?`;
            params.push(spot_type);
        }

        query += ` ORDER BY pp.created_at DESC`;

        const [properties] = await db.execute(query, params);
        
        // Transform data to match frontend expectations
        const formattedProperties = properties.map(property => ({
            id: property.id,
            user_id: property.user_id,
            title: property.spot_title,
            street_address: property.street_address,
            unit: property.unit,
            city: property.city,
            state: property.state,
            zip_code: property.zip_code,
            location: `${property.street_address}${property.unit ? ', ' + property.unit : ''}, ${property.city}, ${property.state} ${property.zip_code}`,
            location_instructions: property.location_instructions,
            spot_type: property.spot_type,
            hourly_rate: parseFloat(property.hourly_rate),
            rating: parseFloat(property.rating) || (4.0 + Math.random() * 1),
            reviews: Math.floor(Math.random() * 200) + 10, // Mock reviews for now
            distance: `${(Math.random() * 5).toFixed(1)} miles`, // Mock distance for now
            features: getFeatures(property.spot_type),
            photos: [
                property.photo1_path,
                property.photo2_path,
                property.photo3_path,
                property.photo4_path,
                property.photo5_path
            ].filter(photo => photo && photo.trim() !== ''),
            primary_image: property.photo1_path || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
            owner_name: property.owner_name,
            created_at: property.created_at,
            updated_at: property.updated_at,
            starting_date: property.starting_date,
            ending_date: property.ending_date
        }));

        res.status(200).json(formattedProperties);
    } catch (error) {
        console.error('Search properties error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Helper function to determine features based on spot type
function getFeatures(spotType) {
    const features = [];
    
    switch(spotType) {
        case 'Garage':
        case 'Covered Parking':
            features.push('covered');
            break;
        case 'Driveway':
            features.push('security');
            break;
        case 'Street Parking':
            // No special features
            break;
        default:
            break;
    }
    
    // Randomly add some features for variety
    if (Math.random() > 0.7) features.push('security');
    if (Math.random() > 0.8) features.push('ev');
    
    return features;
}

// Profile API endpoints

// Get user profile
app.get('/api/profile/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const db = getDbConnection();
        const [users] = await db.execute(
            'SELECT id, first_name, last_name, username, email, phone_number, address, avatar_url, average_rating, status, created_at, updated_at FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = users[0];
        
        // Get user statistics
        const [bookingCount] = await db.execute(
            'SELECT COUNT(*) as count FROM bookings WHERE user_id = ?',
            [userId]
        );
        
        const [propertyCount] = await db.execute(
            'SELECT COUNT(*) as count FROM parking_properties WHERE user_id = ?',
            [userId]
        );

        // Format response
        const profile = {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            username: user.username,
            email: user.email,
            phone_number: user.phone_number,
            address: user.address,
            avatar_url: user.avatar_url,
            average_rating: parseFloat(user.average_rating) || 0,
            status: user.status,
            created_at: user.created_at,
            updated_at: user.updated_at,
            stats: {
                bookings: bookingCount[0].count,
                properties: propertyCount[0].count,
                rating: parseFloat(user.average_rating) || 4.8
            }
        };

        res.status(200).json(profile);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update user profile
app.put('/api/profile/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { first_name, last_name, username, email, phone_number, address, avatar_url } = req.body;
        
        const db = getDbConnection();
        
        // Update user profile including avatar_url (if provided)
        const [result] = await db.execute(
            'UPDATE users SET first_name = ?, last_name = ?, username = ?, email = ?, phone_number = ?, address = ?, avatar_url = COALESCE(?, avatar_url), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [first_name, last_name, username, email, phone_number, address, avatar_url, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create a new booking
app.post('/api/bookings', async (req, res) => {
    try {
        const { user_id, property_id, start_time, end_time } = req.body;
        
        // Validate required fields - only need start and end times
        if (!user_id || !property_id || !start_time || !end_time) {
            return res.status(400).json({ error: 'User ID, property ID, start time, and end time are required' });
        }

        // Validate that start_time is before end_time
        const startDate = new Date(start_time);
        const endDate = new Date(end_time);
        
        if (startDate >= endDate) {
            return res.status(400).json({ error: 'Start time must be before end time' });
        }

        // Validate that booking is not in the past
        if (startDate < new Date()) {
            return res.status(400).json({ error: 'Cannot book in the past' });
        }

        const db = getDbConnection();
        
        // Check if the property exists
        const [property] = await db.execute(
            'SELECT id, user_id, spot_title, hourly_rate FROM parking_properties WHERE id = ?',
            [property_id]
        );

        if (property.length === 0) {
            return res.status(404).json({ error: 'Property not found' });
        }

        // Check if user is trying to book their own property
        if (property[0].user_id == user_id) {
            return res.status(400).json({ error: 'Cannot book your own property' });
        }

        // Calculate total cost based on duration and hourly rate
        const durationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
        const hourlyRate = parseFloat(property[0].hourly_rate);
        const total_cost = Math.round((durationHours * hourlyRate) * 100) / 100; // Round to 2 decimal places

        // Validate minimum booking duration (e.g., 1 hour)
        if (durationHours < 1) {
            return res.status(400).json({ error: 'Minimum booking duration is 1 hour' });
        }

        // Check for overlapping bookings
        const [overlapping] = await db.execute(`
            SELECT id FROM bookings 
            WHERE property_id = ? 
            AND status IN ('pending', 'confirmed')
            AND (
                (start_time <= ? AND end_time > ?) OR
                (start_time < ? AND end_time >= ?) OR
                (start_time >= ? AND end_time <= ?)
            )
        `, [property_id, start_time, start_time, end_time, end_time, start_time, end_time]);

        if (overlapping.length > 0) {
            return res.status(400).json({ error: 'Property is already booked for the selected time period' });
        }

        // Create the booking
        const [result] = await db.execute(
            'INSERT INTO bookings (user_id, property_id, start_time, end_time, total_cost, status) VALUES (?, ?, ?, ?, ?, ?)',
            [user_id, property_id, start_time, end_time, total_cost, 'confirmed']
        );

        // Get the created booking with property details
        const [newBooking] = await db.execute(`
            SELECT b.*, pp.spot_title, pp.street_address, pp.city, pp.state, pp.zip_code, pp.hourly_rate,
                   u.first_name, u.last_name
            FROM bookings b
            LEFT JOIN parking_properties pp ON b.property_id = pp.id
            LEFT JOIN users u ON pp.user_id = u.id
            WHERE b.id = ?
        `, [result.insertId]);

        const booking = newBooking[0];
        const formattedBooking = {
            id: booking.id,
            property_id: booking.property_id,
            title: booking.spot_title || 'Parking Space',
            address: `${booking.street_address}, ${booking.city}, ${booking.state} ${booking.zip_code}`,
            start_time: booking.start_time,
            end_time: booking.end_time,
            total_cost: parseFloat(booking.total_cost),
            hourly_rate: parseFloat(booking.hourly_rate),
            status: booking.status,
            owner_name: `${booking.first_name} ${booking.last_name}`,
            created_at: booking.created_at
        };

        res.status(201).json({ 
            message: 'Booking created successfully', 
            booking: formattedBooking 
        });
    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Cancel a booking
app.put('/api/bookings/:bookingId/cancel', async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { user_id } = req.body;
        
        const db = getDbConnection();
        
        // Check if booking exists and belongs to the user
        const [booking] = await db.execute(
            'SELECT id, user_id, status, start_time FROM bookings WHERE id = ?',
            [bookingId]
        );

        if (booking.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        if (booking[0].user_id != user_id) {
            return res.status(403).json({ error: 'Not authorized to cancel this booking' });
        }

        if (booking[0].status === 'cancelled') {
            return res.status(400).json({ error: 'Booking is already cancelled' });
        }

        if (booking[0].status === 'completed') {
            return res.status(400).json({ error: 'Cannot cancel completed booking' });
        }

        // Update booking status to cancelled
        const [result] = await db.execute(
            'UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            ['cancelled', bookingId]
        );

        if (result.affectedRows === 0) {
            return res.status(500).json({ error: 'Failed to cancel booking' });
        }

        res.status(200).json({ message: 'Booking cancelled successfully' });
    } catch (error) {
        console.error('Cancel booking error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user's bookings
app.get('/api/profile/:userId/bookings', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const db = getDbConnection();
        const [bookings] = await db.execute(`
            SELECT b.*, pp.spot_title, pp.street_address, pp.city, pp.state, pp.zip_code, pp.hourly_rate,
                   u.first_name, u.last_name
            FROM bookings b
            LEFT JOIN parking_properties pp ON b.property_id = pp.id
            LEFT JOIN users u ON pp.user_id = u.id
            WHERE b.user_id = ?
            ORDER BY b.created_at DESC
        `, [userId]);

        // Format bookings for frontend
        const formattedBookings = bookings.map(booking => ({
            id: booking.id,
            property_id: booking.property_id,
            title: booking.spot_title || 'Parking Space',
            address: `${booking.street_address}, ${booking.city}, ${booking.state} ${booking.zip_code}`,
            start_time: booking.start_time,
            end_time: booking.end_time,
            total_cost: parseFloat(booking.total_cost),
            hourly_rate: parseFloat(booking.hourly_rate),
            status: booking.status,
            owner_name: `${booking.first_name} ${booking.last_name}`,
            created_at: booking.created_at
        }));

        res.status(200).json(formattedBookings);
    } catch (error) {
        console.error('Get bookings error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user's properties
app.get('/api/profile/:userId/properties', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const db = getDbConnection();
        const [properties] = await db.execute(
            'SELECT * FROM parking_properties WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );

        // Format properties for frontend
        const formattedProperties = properties.map(property => ({
            id: property.id,
            title: property.spot_title,
            address: `${property.street_address}${property.unit ? ', ' + property.unit : ''}, ${property.city}, ${property.state} ${property.zip_code}`,
            spot_type: property.spot_type,
            hourly_rate: parseFloat(property.hourly_rate),
            status: property.status || 'active',
            photos: [
                property.photo1_path,
                property.photo2_path,
                property.photo3_path,
                property.photo4_path,
                property.photo5_path
            ].filter(photo => photo && photo.trim() !== ''),
            created_at: property.created_at
        }));

        res.status(200).json(formattedProperties);
    } catch (error) {
        console.error('Get properties error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Find user by username or email
app.get('/api/find-user', async (req, res) => {
    try {
        const { username, email } = req.query;
        
        if (!username && !email) {
            return res.status(400).json({ error: 'Username or email required' });
        }

        const db = getDbConnection();
        let query = 'SELECT id, first_name, last_name, username, email, phone_number, address, average_rating, created_at FROM users WHERE ';
        let params = [];

        if (username) {
            query += 'username = ?';
            params.push(username);
        } else {
            query += 'email = ?';
            params.push(email);
        }

        const [users] = await db.execute(query, params);

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(users[0]);
    } catch (error) {
        console.error('Find user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete property endpoint
app.delete('/api/properties/:propertyId', async (req, res) => {
    try {
        const { propertyId } = req.params;
        
        const db = getDbConnection();
        
        // Delete the property
        const [result] = await db.execute(
            'DELETE FROM parking_properties WHERE id = ?',
            [propertyId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Property not found' });
        }

        res.status(200).json({ message: 'Property deleted successfully' });
    } catch (error) {
        console.error('Delete property error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Test endpoint to create a sample user
app.post('/api/test-user', async (req, res) => {
    try {
        const { username, email, first_name, last_name, phone_number, address } = req.body;
        
        const db = getDbConnection();
        const [result] = await db.execute(
            'INSERT INTO users (username, email, password, first_name, last_name, phone_number, address) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [username, email, 'hashedpassword', first_name, last_name, phone_number, address]
        );

        res.status(201).json({ 
            message: 'Test user created successfully', 
            userId: result.insertId 
        });
    } catch (error) {
        console.error('Test user creation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
