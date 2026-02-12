import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchKoreanNews } from './newsProvider.js';
import { groupNewsHierarchy } from './newsAggregator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '..', 'public');

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (url.pathname === '/api/news') {
    const query = url.searchParams.get('query') || '';
    const from = url.searchParams.get('from') || '';
    const to = url.searchParams.get('to') || '';

    if (!query || !from || !to) {
      res.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('query, from, to 파라미터가 필요합니다.');
      return;
    }

    try {
      const articles = await fetchKoreanNews({ query, from, to });
      const grouped = groupNewsHierarchy(articles, 0.8);
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ count: articles.length, data: grouped }, null, 2));
    } catch (error) {
      res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
      res.end(error.message);
    }
    return;
  }

  const filePath = url.pathname === '/' ? path.join(publicDir, 'index.html') : path.join(publicDir, url.pathname);

  try {
    const body = await fs.readFile(filePath);
    const ext = path.extname(filePath);
    const typeByExt = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
    };

    res.writeHead(200, { 'content-type': typeByExt[ext] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
});

const port = Number(process.env.PORT || 3000);
server.listen(port, '0.0.0.0', () => {
  console.log(`Server running: http://localhost:${port}`);
});
