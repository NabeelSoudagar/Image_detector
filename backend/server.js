const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');

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



// Public analyze endpoint
app.post('/api/analyze', upload.single('image'), async (req, res) => {
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

      // Note: Database saving removed for public access

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
