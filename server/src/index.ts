import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import path from 'path';
import { handleConnection } from './signaling';

const app = express();
const server = createServer(app);

// CORS: allow localhost dev + the public tunnel
const allowedOrigins = [
  'http://localhost:5173',
  'https://ptt-demo.kdessinger.com',
];
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// Serve built React client
app.use(express.static(path.join(__dirname, '../../client/dist')));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Catch-all: serve index.html for React Router
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  handleConnection(ws);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`HTTP health: http://localhost:${PORT}/health`);
  console.log(`WebSocket: ws://localhost:${PORT}`);
});
