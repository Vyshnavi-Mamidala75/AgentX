import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { interviewRouter } from './routes/interviewRouter.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Single required endpoint path prefix
app.use('/api', interviewRouter);

// Health check / info
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'AI Interview Agent API' });
});

// Locate static frontend build directory
const possiblePublicDirs = [
  path.resolve(process.cwd(), 'dist/public'),
  path.resolve(__dirname, 'public'),
  path.resolve(__dirname, '../dist/public'),
  path.resolve(__dirname, '../public'),
];

let publicDir: string | null = null;
for (const dir of possiblePublicDirs) {
  if (fs.existsSync(path.join(dir, 'index.html'))) {
    publicDir = dir;
    break;
  }
}

if (publicDir) {
  console.log(`[AgentX] Serving static frontend from: ${publicDir}`);
  app.use(express.static(publicDir));

  // Explicit root handler
  app.get('/', (req, res) => {
    res.sendFile(path.join(publicDir!, 'index.html'));
  });

  // Fallback for client-side routing
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health' || req.method !== 'GET') {
      return next();
    }
    res.sendFile(path.join(publicDir!, 'index.html'));
  });
} else {
  console.warn('[AgentX] Frontend build (dist/public/index.html) not found. Run npm run build:frontend');
}

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[AgentX] AI Interview Agent running on http://localhost:${PORT}`);
    console.log(`[AgentX] Endpoint: POST http://localhost:${PORT}/api/interview`);
  });
}

export { app };
