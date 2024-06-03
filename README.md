# 🎓 College ERP System - Backend

This repository contains the backend part of the College ERP System, designed to handle server-side logic, database interactions, and API endpoints for the application.

## 📋 Table of Contents

- [Description](#description)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Scripts](#scripts)
- [Dependencies](#dependencies)
- [Contributors](#contributors)
- [License](#license)

## 📖 Description

The backend for the College ERP System is built using Node.js and Express.js, with MongoDB as the database. It handles all the server-side logic, including user authentication, data management, and API endpoints.

## ✨ Features

- **User Authentication**: Secure login and registration.
- **Profile Management**: CRUD operations for student and admin profiles.
- **LOR Requests**: Manage Letters of Recommendation requests.
- **Email Notifications**: Automated email updates.
- **Secure Password Handling**: Password encryption and reset functionality.

## ⚙️ Installation

### Prerequisites

- Node.js
- MongoDB

### Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/csrohitranjan/college-erp-backend.git
   cd college-erp-backend
   ```
2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Create a `.env` file** with the following variables:
   ```plaintext
   MONGO_URI=<Your MongoDB URI>
   JWT_SECRET=<Your JWT Secret>
   CLOUDINARY_URL=<Your Cloudinary URL>
   ```

## 🚀 Usage

### Starting the Server

- **Production Mode**:

  ```bash
  npm start
  ```

- **Development Mode**:
  ```bash
  npm run dev
  ```

## 📜 Scripts

- `start`: Starts the server in production mode.
- `dev`: Starts the server with nodemon for development.
- `build`: Run build scripts (assumed for rendering).
- `test`: Placeholder for running tests.

## 📦 Dependencies

### Production Dependencies

- `bcrypt`: For password hashing.
- `cloudinary`: For cloud storage of media files.
- `cookie-parser`: For parsing cookies.
- `cors`: For enabling cross-origin requests.
- `dotenv`: For managing environment variables.
- `express`: For building the server and handling requests.
- `firebase`: For Firebase integration.
- `jsonwebtoken`: For JSON Web Token authentication.
- `mongoose`: For MongoDB object modeling.
- `nodemailer`: For sending emails.
- `puppeteer`: For headless browser automation.

### Development Dependencies

- `nodemon`: For automatically restarting the server.
- `prettier`: For code formatting.

## 📄 License

This project is licensed under the ISC License.

---

Feel free to contribute and provide feedback to help us improve this system!
