-- PostgreSQL database schema for Image Detection App (Supabase)

-- Connect to the database (already created in Supabase)

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX idx_users_email ON users(email);

-- Create index on username for faster lookups
CREATE INDEX idx_users_username ON users(username);

-- Optional: Create a table for storing analysis history
CREATE TABLE analysis_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    image_name VARCHAR(255),
    is_ai BOOLEAN NOT NULL,
    confidence DECIMAL(3,2) NOT NULL, -- 0.00 to 1.00
    reason TEXT,
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on user_id for faster queries
CREATE INDEX idx_analysis_history_user_id ON analysis_history(user_id);

-- Create index on analyzed_at for time-based queries
CREATE INDEX idx_analysis_history_analyzed_at ON analysis_history(analyzed_at);
