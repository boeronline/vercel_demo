const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 3000;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon'
};

function sendJson(res, data) {
  const body = JSON.stringify(data);
  res.writeHead(200, {
    'Content-Type': mimeTypes['.json'],
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

function serveStaticFile(res, filePath) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Internal server error');
      }
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
}

const server = http.createServer((req, res) => {
  const { url, method } = req;

  if (method === 'GET' && url === '/api/hello') {
    sendJson(res, {
      message: 'Hello from the local development server!',
      timestamp: new Date().toISOString()
    });
    return;
  }

  // sanitize path to prevent directory traversal
  const safePath = path.normalize(decodeURIComponent(url)).replace(/^\.\//, '').replace(/^\/+/, '');
  const requestedPath = safePath === '' ? 'index.html' : safePath;
  const filePath = path.join(__dirname, requestedPath);

  serveStaticFile(res, filePath);
});

server.listen(port, () => {
  console.log(`Development server running at http://localhost:${port}`);
});
