import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'node:url';
import { requestLogger } from './src/middleware/logger.js';
import itemsRouter from './src/routes/items.js';
import { notFound, errorHandler } from './src/middleware/errorHandler.js';

const app = express();


const allowedOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5500';
app.use(cors({ origin: allowedOrigin }));

app.use(express.json()); 
app.use(requestLogger);


app.use(express.static(fileURLToPath(new URL('./frontend', import.meta.url))));

app.get('/api', (req, res) => {
  res.json({ message: 'Bean & Brew API. Try GET /api/items' });
});


app.get('/api/debug/error', () => {
  throw new Error('Simulated server failure');
});

app.use('/api/items', itemsRouter);

app.use(notFound); 
app.use(errorHandler); 

export default app;
