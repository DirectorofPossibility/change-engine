// api/civic-dashboard/index.js
const axios = require('axios'); // Import axios for making HTTP requests

module.exports = async (req, res) => {
  // --- CORS Headers: REQUIRED for your Squarespace site to access this API ---
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allows requests from any origin (e.g., your Squarespace site)
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS'); // Allows GET requests and preflight OPTIONS requests
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); // Allows the Content-Type header to be sent

  // Handle preflight OPTIONS request: Browsers send this before certain cross-origin requests
  if (req.method === 'OPTIONS') {
    return res.status(204).send(); // Respond with a successful but empty response
  }
  // --- End CORS Headers ---

  const { zip } = req.query; // Get the 'zip' parameter from the URL query

  if (!zip) {
    return res.status(400).json({ error: 'ZIP code is required.' });
  }

  // Access the API key from environment variables (set in Vercel Dashboard)
  const GOOGLE_CIVIC_API_KEY = process.env.GOOGLE_CIVIC_API_KEY;

  if (!GOOGLE_CIVIC_API_KEY) {
    console.error('Google Civic API Key not found in environment variables.');
    return res.status(500).json({
      error: 'Server configuration error: Google Civic API Key missing on Vercel.',
      details: 'Please ensure GOOGLE_CIVIC_API_KEY is set in Vercel project settings.'
    });
  }

  let officialsData = {};
  try {
    const civicResponse = await axios.get(
      `https://www.googleapis.com/civicinfo/v2/representatives?address=${zip}&key=${GOOGLE_CIVIC_API_KEY}`
    );
    officialsData = civicResponse.data;
  } catch (error) {
    console.error('Error fetching data from Google Civic API:', error.message);
    if (error.response) {
      console.error('Google API Error Data:', error.response.data);
      // Example: error.response.status and error.response.headers for more context
    }
    return res.status(500).json({
      error: 'Failed to fetch civic information from Google API.',
      details: error.message,
      googleApiError: error.response ? error.response.data : 'No specific Google API error data available.'
    });
  }

  // --- This is where we will start braiding your local data soon! ---
  res.status(200).json({
    message: 'Data from Google Civic API fetched!',
    receivedZip: zip,
    officials: officialsData, // This will contain all the raw data for officials
    status: 'Google Civic API integrated, local data braiding next!'
  });
};