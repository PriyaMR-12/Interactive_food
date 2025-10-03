import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRouter from './routes/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const DEFAULT_ORIGINS = ['http://localhost:5500', 'http://127.0.0.1:5500'];
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || DEFAULT_ORIGINS.join(',');
const ALLOWED_ORIGINS = Array.from(new Set([...DEFAULT_ORIGINS, ...CLIENT_ORIGIN.split(',').map(o => o.trim()).filter(Boolean)]));

app.use(helmet());

const corsOptions = {
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
};

app.options('*', cors(corsOptions));
app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRouter);

async function start() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/recipe_finder';
  await mongoose.connect(uri);
  console.log('MongoDB connected');
  app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
}

start().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});


