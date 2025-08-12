# ParkSpace 🚗

**Find & Rent Parking Spots Instantly**

ParkSpace is a modern web application that helps users discover and book parking spots in seconds. Built with a sleek frontend and robust backend, it features Google OAuth authentication, real-time search, and a seamless user experience.

## ✨ Features

- **Instant Booking**: Secure parking spots in seconds with lightning-fast booking
- **Google Authentication**: Sign in seamlessly with your Google account
- **Smart Search**: Find parking spots by location, date, time, and duration
- **User Profiles**: Manage your bookings and account information
- **Responsive Design**: Beautiful UI that works on all devices
- **Real-time Updates**: Live availability and booking status

## 🛠️ Tech Stack

**Frontend:**
- HTML5, CSS3, JavaScript (ES6+)
- Tailwind CSS for styling
- Appwrite SDK for authentication
- AWS SDK integration

**Backend:**
- Node.js with Express.js
- Database integration (configured via environment variables)
- RESTful API architecture

**Authentication:**
- Google OAuth 2.0 via Appwrite
- Session management
- Secure user profiles

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Google OAuth credentials
- Appwrite account

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd parkspace
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

4. **Start the development server**
   ```bash
   npm start
   # or
   node server.js
   ```

5. **Open your browser**
   
   Navigate to `http://localhost:3000`

## 📁 Project Structure

```
parkspace/
├── .kiro/                  # Kiro IDE specifications
│   └── specs/             # Feature specifications
├── src/                   # Source files (if any additional modules)
├── index.html            # Main landing page
├── profile.html          # User profile page
├── search_result.html    # Search results page
├── script.js             # Main JavaScript functionality
├── styles.css            # Custom styles
├── server.js             # Express.js backend server
├── package.json          # Node.js dependencies
└── README.md             # This file
```

## 🔧 Configuration

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add your domain to authorized origins
6. Update Appwrite with your Google OAuth credentials

### Appwrite Setup

1. Create an account at [Appwrite Cloud](https://cloud.appwrite.io/)
2. Create a new project
3. Configure Google OAuth provider
4. Update the project ID in your code and environment variables

## 🎯 Key Features Explained

### Authentication Flow
- Users can sign up/sign in with email/password or Google OAuth
- Google authentication handled via Appwrite
- User profiles automatically created and synced with backend database
- Session management for persistent login state

### Search Functionality
- Location-based parking spot search
- Date and time filtering
- Duration-based availability
- Real-time results display

### User Management
- Profile creation and updates
- Booking history
- Account settings
- Secure logout

## 🧪 Testing

### Manual Testing
- Open `test-auth-status.html` to test authentication status
- Use `test-db-connection.js` to verify database connectivity

### API Testing
The backend provides these main endpoints:
- `POST /api/signup` - User registration
- `POST /api/login` - User authentication
- `GET /api/user/:id` - Get user profile
- `POST /api/user/create-or-update` - Create/update user profile

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Getting Started
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test thoroughly
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Development Guidelines
- Follow existing code style and conventions
- Test your changes thoroughly
- Update documentation if needed
- Write clear commit messages
- Keep pull requests focused and small

### Code Style
- Use meaningful variable and function names
- Add comments for complex logic
- Follow JavaScript ES6+ standards
- Maintain consistent indentation (2 spaces)
- Use semicolons consistently

## 📝 API Documentation

### Authentication Endpoints

#### POST /api/signup
Create a new user account
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword",
  "first_name": "John",
  "last_name": "Doe"
}
```

#### POST /api/login
Authenticate user
```json
{
  "email": "john@example.com",
  "password": "securepassword"
}
```

#### POST /api/user/create-or-update
Create or update user profile (used for Google OAuth)
```json
{
  "appwrite_id": "unique_id",
  "email": "john@example.com",
  "username": "johndoe",
  "first_name": "John",
  "last_name": "Doe",
  "provider": "google"
}
```

## 🐛 Troubleshooting

### Common Issues

**Server won't start:**
- Check if port 3000 is available
- Verify all environment variables are set
- Ensure database connection is working

**Google Auth not working:**
- Verify Appwrite project ID is correct
- Check Google OAuth credentials
- Ensure domain is added to authorized origins

**Database connection issues:**
- Verify database credentials in `.env`
- Check if database server is running
- Test connection with `node test-db-connection.js`

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Tailwind CSS for the beautiful styling framework
- Appwrite for authentication services
- Google for OAuth integration
- All contributors who help improve ParkSpace

## 📞 Support

If you have questions or need help:
1. Check the troubleshooting section above
2. Search existing issues on GitHub
3. Create a new issue with detailed information
4. Contact the maintainers

---

**Happy Parking! 🚗💨**
