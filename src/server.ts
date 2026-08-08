import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { interviewRouter } from './routes/interviewRouter.js';

dotenv.config();

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

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[AgentX] AI Interview Agent running on http://localhost:${PORT}`);
    console.log(`[AgentX] Endpoint: POST http://localhost:${PORT}/api/interview`);
  });
}

export { app };
