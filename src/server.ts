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

// Serve frontend static build if present
const publicPaths = [
  path.resolve(__dirname, '../dist/public'),
  path.resolve(process.cwd(), 'dist/public'),
  path.resolve(__dirname, 'public'),
];

for (const p of publicPaths) {
  if (fs.existsSync(p)) {
    app.use(express.static(p));
    app.use((req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(p, 'index.html'));
    });
    break;
  }
}

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[AgentX] AI Interview Agent running on http://localhost:${PORT}`);
    console.log(`[AgentX] Endpoint: POST http://localhost:${PORT}/api/interview`);
  });
}

export { app };
