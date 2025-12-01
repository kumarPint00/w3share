import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import contractRoutes from './routes/contract.routes';
import { config, validateConfig } from './config';
import logger from './config/logger';

// Validate configuration
const configValidation = validateConfig();
if (!configValidation.valid) {
  logger.error('Configuration errors:', configValidation.errors);
  process.exit(1);
}

// Create Express application
const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: config.allowedOrigins,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'x-api-key']
}));
app.use(express.json());
app.use(morgan('combined'));

// Routes
app.use('/api/v1', contractRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Not found: ${req.method} ${req.path}`
  });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  logger.info(`Contract Admin Service running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
