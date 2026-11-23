
import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { diagramRouter } from './routes/diagram.routes.js';

export const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));

// Root health check
app.get('/', (_req, res) => {
  res.json({
    name: 'Udhi Science Diagram Maker API',
    version: '1.0.0',
    provider: 'Groq',
    model: config.groq.model,
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

// Mount routes
app.use('/api', diagramRouter);

// Start server when run directly
if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log('=======================================================');
    console.log(
      `🚀 Udhi Science Diagram Maker Backend running on port ${config.port}`
    );
    console.log(`📡 Environment: ${config.nodeEnv}`);
    console.log(`🤖 Groq Model: ${config.groq.model}`);
    console.log(
      `🔑 Groq API Key Configured: ${Boolean(config.groq.apiKey)}`
    );
    console.log('=======================================================');
  });
}
