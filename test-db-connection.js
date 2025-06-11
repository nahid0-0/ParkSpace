require('dotenv').config();
const mysql = require('mysql2/promise');

async function testConnection() {
    let connection;
    
    try {
        // Create connection configuration
        const config = {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT,
            database: process.env.DB_NAME
        };

        console.log('Attempting to connect to the database...');
        
        // Establish connection
        connection = await mysql.createConnection(config);
        console.log('Successfully connected to the database!');

        // Test query
        const [rows] = await connection.execute('SELECT 1 + 1 AS solution');
        console.log('Test query result:', rows[0].solution);

    } catch (error) {
        console.error('\nDatabase connection error:');
        
        // Handle specific error cases
        if (error.code === 'ECONNREFUSED') {
            console.error('Connection refused. Please check:');
            console.error('1. The database host is correct');
            console.error('2. The port is correct');
            console.error('3. The AWS Security Group allows connections from your IP');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('Access denied. Please check:');
            console.error('1. The username is correct');
            console.error('2. The password is correct');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.error('Database does not exist. Please check the database name.');
        } else {
            console.error('Error details:', error.message);
        }
        
        process.exit(1);
    } finally {
        if (connection) {
            try {
                await connection.end();
                console.log('\nDatabase connection closed successfully.');
            } catch (err) {
                console.error('Error closing the connection:', err.message);
            }
        }
    }
}

// Run the test
testConnection(); 