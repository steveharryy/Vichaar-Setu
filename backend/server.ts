import './load-env';
import express from 'express';
import cors from 'cors';

import generateIdeaHandler from './api/generate-idea';
import generatePitchHandler from './api/generate-pitch';
import predictSuccessHandler from './api/predict-success';
import dbHandler from './api/db';
import investorMatchHandler from './api/investor-match';

const app = express();

// Enable CORS for frontend running on localhost:8080 or other dev ports
app.use(cors());
app.use(express.json());

// Health check route
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Vichaar Setu Backend is running! The frontend will communicate with the /api routes automatically.' });
});

// Map Vercel serverless function paths to Express routes
app.all('/api/generate-idea', async (req, res) => {
  try {
    // Vercel serverless functions expect standard req, res
    await generateIdeaHandler(req, res);
  } catch (error) {
    console.error('Error in route handler:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/generate-pitch', async (req, res) => {
  try {
    await generatePitchHandler(req, res);
  } catch (error) {
    console.error('Error in generate-pitch handler:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/predict-success', async (req, res) => {
  try {
    await predictSuccessHandler(req, res);
  } catch (error) {
    console.error('Error in predict-success handler:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/db', async (req, res) => {
  try {
    await dbHandler(req, res);
  } catch (error) {
    console.error('Error in db handler:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/investor-match', async (req, res) => {
  try {
    await investorMatchHandler(req, res);
  } catch (error) {
    console.error('Error in investor-match handler:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Dedicated local development backend running on http://localhost:${PORT}`);
  console.log(`Connected APIs will now work securely without Vercel CLI login.`);
});
