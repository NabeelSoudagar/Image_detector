# Image Detection Backend

This is the backend API for the AI Image Detection application, built with Node.js, Express, and PostgreSQL.

## Features

- User authentication (signup/login) with JWT tokens
- Image analysis using Google Gemini AI
- PostgreSQL database for persistent storage
- Password hashing with bcrypt
- CORS enabled for frontend communication

## Setup

### Prerequisites

- Node.js (v14 or higher)
- Supabase PostgreSQL database
- Google Gemini AI API key

### Installation

1. Clone the repository and navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the database:
   - Create a Supabase project and database
   - Run the SQL script in `database.sql` in your Supabase SQL editor to create the tables

4. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your Supabase database credentials, JWT secret, and Gemini API key

5. Start the server:
   ```bash
   npm start
   ```

The server will run on `http://localhost:5000` by default.

## API Endpoints

### Authentication

- `POST /api/signup` - Register a new user
- `POST /api/login` - Login user

### Image Analysis

- `POST /api/analyze` - Analyze an uploaded image (requires authentication)

### Utility

- `GET /api/models` - List available Gemini AI models

## Database Schema

### Users Table
- `id` (SERIAL PRIMARY KEY)
- `username` (VARCHAR(50) UNIQUE)
- `email` (VARCHAR(100) UNIQUE)
- `password_hash` (VARCHAR(255))
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Analysis History Table
- `id` (SERIAL PRIMARY KEY)
- `user_id` (INTEGER, FOREIGN KEY)
- `image_name` (VARCHAR(255))
- `is_ai` (BOOLEAN)
- `confidence` (DECIMAL(3,2))
- `reason` (TEXT)
- `analyzed_at` (TIMESTAMP)

## Environment Variables

- `DB_HOST` - PostgreSQL host
- `DB_PORT` - PostgreSQL port
- `DB_NAME` - Database name
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `JWT_SECRET` - Secret key for JWT tokens
- `GEMINI_API_KEY` - Google Gemini AI API key
- `PORT` - Server port (default: 5000)
