import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { handleApiRequest } from './api/handler';

// 루트 및 현재 위치의 .env 파일 로드
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

app.all('/api/*', async (req, res) => {
  const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  const init: RequestInit = {
    method: req.method,
    headers: { 'Content-Type': 'application/json' },
  };

  if (req.method !== 'GET' && req.method !== 'HEAD' && req.body && Object.keys(req.body).length > 0) {
    init.body = JSON.stringify(req.body);
  }

  const response = await handleApiRequest(new Request(url, init));
  const body = await response.text();

  res.status(response.status);
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'transfer-encoding') {
      res.setHeader(key, value);
    }
  });
  res.send(body);
});

app.listen(PORT, () => {
  console.log(`[FleetSync Backend] Server running on http://localhost:${PORT}`);
});
