import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.resolve(__dirname, '../../apps/web/public/assets');
const TILES_DIR = path.join(ASSETS_DIR, 'tiles');
const SPRITES_DIR = path.join(ASSETS_DIR, 'sprites');
const MONSTERS_DIR = path.join(ASSETS_DIR, 'monsters');
const EFFECTS_DIR = path.join(ASSETS_DIR, 'effects');
const SPRITE_EDITOR_DIR = path.resolve(__dirname, '../sprite-editor');

const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.json': 'application/json',
};

function serveFile(res, filePath) {
  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
    return true;
  }
  return false;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');

  // === API: save map PNG ===
  if (url.pathname === '/api/save' && req.method === 'POST') {
    let body = [];
    req.on('data', chunk => body.push(chunk));
    req.on('end', () => {
      const data = Buffer.concat(body);
      const base64 = data.toString().replace(/^data:image\/png;base64,/, '');
      const savePath = path.join(ASSETS_DIR, 'map_bg.png');
      fs.writeFileSync(savePath, Buffer.from(base64, 'base64'));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, path: savePath }));
      console.log(`Saved map to ${savePath}`);
    });
    return;
  }

  // === API: list tile textures ===
  if (url.pathname === '/api/tiles') {
    const files = fs.readdirSync(TILES_DIR).filter(f => f.endsWith('.png') || f.endsWith('.jpg'));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(files));
    return;
  }

  // === Serve tile assets ===
  if (url.pathname.startsWith('/tiles/')) {
    if (serveFile(res, path.join(TILES_DIR, url.pathname.slice(7)))) return;
  }

  // === Serve sprite assets (characters) ===
  if (url.pathname.startsWith('/sprites/sprites/')) {
    if (serveFile(res, path.join(SPRITES_DIR, url.pathname.slice(17)))) return;
  }

  // === Serve monster assets ===
  if (url.pathname.startsWith('/sprites/monsters/')) {
    if (serveFile(res, path.join(MONSTERS_DIR, url.pathname.slice(18)))) return;
  }

  // === Serve effect assets ===
  if (url.pathname.startsWith('/sprites/effects/')) {
    if (serveFile(res, path.join(EFFECTS_DIR, url.pathname.slice(17)))) return;
  }

  // === Sprite Editor page ===
  if (url.pathname === '/sprites' || url.pathname === '/sprites/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream(path.join(SPRITE_EDITOR_DIR, 'index.html')).pipe(res);
    return;
  }

  // === Map Designer page (default) ===
  if (url.pathname === '/' || url.pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream(path.join(__dirname, 'index.html')).pipe(res);
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(4000, () => {
  console.log('');
  console.log('  RO PvP Design Tools');
  console.log('  --------------------');
  console.log('  Map Designer:    http://localhost:4000/');
  console.log('  Sprite Editor:   http://localhost:4000/sprites');
  console.log('');
});
