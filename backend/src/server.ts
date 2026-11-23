import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { diagramRouter } from './routes/diagram.routes.js';

export const app = express();

// Middlewares
app.use(cors({
  origin: '*', // Allow frontend requests
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));

// Health check root
app.get('/', (_req, res) => {
  res.json({
    name: 'Udhi Science Diagram Maker API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      concepts: 'GET /api/concepts',
      diagrams: 'GET /api/diagrams',
      generate: 'POST /api/generate',
      validate: 'POST /api/validate',
      reviews: 'POST /api/reviews',
    },
  });
});

// Mount Routes
app.use('/api', diagramRouter);

// Start server when run directly
if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Udhi Science Diagram Maker Backend running on port ${config.port}`);
    console.log(`📡 Environment: ${config.nodeEnv}`);
    console.log(`🤖 Gemini Model: ${config.gemini.model}`);
    console.log(`🔑 API Key Configured: ${Boolean(process.env.GEMINI_API_KEY)}`);
    console.log(`=======================================================`);
  });
}
