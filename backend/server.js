const express = require('express');
const multer = require('multer');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const { query } = require('./db');

// --- Load .env file from the correct path ---
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const app = express();
const port = process.env.PORT || 5000;

// --- Middleware ---
app.use(cors({
  origin: "https://image-detector-1.onrender.com", // your frontend Render URL here
  credentials: true
})); // Allow requests from your React app
app.use(express.json());

// --- Multer Setup (to handle in-memory file uploads) ---
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- Gemini AI Setup ---
// Check for API key on startup
if (!process.env.GEMINI_API_KEY) {
  console.error('FATAL ERROR: GEMINI_API_KEY is not defined in .env file.');
  console.error('Please check your backend/.env file.');
  console.error('It should contain: GEMINI_API_KEY=your_api_key_here');
  process.exit(1); // Exit the process if the key is missing
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Converts a Node.js Buffer to a GoogleGenerativeAI.Part object.
 * @param {Buffer} buffer - The image buffer.
 * @param {string} mimeType - The MIME type of the image (e.g., "image/jpeg").
 * @returns {GoogleGenerativeAI.Part}
 */
function bufferToGenerativePart(buffer, mimeType) {
  return {
    inlineData: {
      data: buffer.toString('base64'),
      mimeType,
    },
  };
}



// --- Authentication Endpoints ---

// Signup endpoint
app.post('/api/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    // Check if user already exists
    const existingUserQuery = 'SELECT id FROM users WHERE email = $1 OR username = $2';
    const existingUser = await query(existingUserQuery, [email, username]);

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email or username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const insertUserQuery = `
      INSERT INTO users (username, email, password_hash, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING id, username, email, created_at
    `;
    const newUser = await query(insertUserQuery, [username, email, hashedPassword]);

    res.status(201).json({
      message: 'User created successfully',
      user: newUser.rows[0]
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error during signup' });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const findUserQuery = 'SELECT id, username, email, password_hash FROM users WHERE email = $1';
    const userResult = await query(findUserQuery, [email]);

    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Protect the analyze endpoint
app.post('/api/analyze', authenticateToken, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded.' });
  }

  try {
   const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Updated prompt to be more insistent on JSON
    const prompt = `
      Analyze this image. Is it an AI-generated image or a real photograph?
      Please respond in JSON format only, with no other text, markdown, or backticks.
      The JSON object must have three keys:
      1. "is_ai": a boolean (true if AI-generated, false if real).
      2. "confidence": a number between 0.0 and 1.0.
      3. "reason": a brief string explaining your reasoning.
    `;

    const imagePart = bufferToGenerativePart(req.file.buffer, req.file.mimetype);

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    console.log('Gemini raw response:', text); // Check this in your server terminal

    let jsonResponse;
    try {
      // Clean the response text to get pure JSON
      // This is more robust: it finds the first '{' and last '}'
      const startIndex = text.indexOf('{');
      const endIndex = text.lastIndexOf('}');

      if (startIndex === -1 || endIndex === -1) {
        throw new Error('No valid JSON object found in Gemini response.');
      }

      jsonResponse = text.substring(startIndex, endIndex + 1);

      // Parse the JSON string into an object
      const data = JSON.parse(jsonResponse);

      // Save analysis to database
      const insertAnalysisQuery = `
        INSERT INTO analysis_history (user_id, image_name, is_ai, confidence, reason, analyzed_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `;
      await query(insertAnalysisQuery, [
        req.user.id,
        req.file.originalname || 'uploaded_image',
        data.is_ai,
        data.confidence,
        data.reason
      ]);

      res.json(data); // Send success response

    } catch (parseError) {
      console.error('Failed to parse Gemini JSON response:', parseError);
      console.error('Original Gemini text:', text);
      // Send a specific error back to the client
      res.status(500).json({
        error: 'Failed to parse response from AI. The AI may not have returned valid JSON.',
        gemini_response: text,
      });
    }
  } catch (error) { // This catches errors from the Google API call itself
    console.error('Error calling Google AI:', error.message);

    // Check for common API key issues
    if (error.message.includes('API key')) {
        return res.status(401).json({ error: 'Google AI API key is invalid or missing. Check your .env file.' });
    }

    res.status(500).json({ error: 'Failed to analyze image with Google AI.', details: error.message });
  }
});

// Temporary endpoint to list available models
app.get('/api/models', async (req, res) => {
  try {
    const models = await genAI.listModels();
    const modelNames = models.data.map(model => model.name);
    res.json({ models: modelNames });
  } catch (error) {
    console.error('Error listing models:', error.message);
    res.status(500).json({ error: 'Failed to list models.', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on https://image-detector-58ue.onrender.com`);
});
