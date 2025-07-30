# Cupid Dating App

A modern dating application built with Node.js, Express, MySQL, and Socket.IO.

## Setup

### Prerequisites

- Node.js (v14 or higher)
- MySQL Database
- Git

### Installation

1. Clone the repository

   ```bash
   git clone <your-repo-url>
   cd cupid
   ```

2. Install dependencies

   ```bash
   cd server
   npm install
   ```

3. Setup Database
   - Create a MySQL database named `cupid_db`
   - Update database credentials in `server/.env`

4. Environment Configuration

   Create `server/.env` file:

   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_NAME=cupid_db

   # JWT Secret
   JWT_SECRET=your_super_secure_secret_key_here

   # Server Configuration
   PORT=3000
   NODE_ENV=production
   ```

5. Start the Server

   ```bash
   cd server
   npm start
   ```

6. Access the Application
   - Navigate to `client/pages/signup.html` to create an account
   - Visit `client/pages/login.html` to sign in

## License

This project is licensed under the MIT License.