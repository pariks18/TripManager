const { createServer } = require('http');
const parse = require('url').parse;
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    path: '/api/socket/io',
    addTrailingSlash: false,
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Load TypeScript compiled socket handlers via ts-node/register or direct require if available
  try {
    require('ts-node').register({
      transpileOnly: true,
      compilerOptions: { module: 'commonjs' },
    });
    const { initSocketServer } = require('./lib/socketServer');
    initSocketServer(io);
  } catch (err) {
    console.error('Failed to register ts-node for socketServer:', err.message);
  }

  httpServer.listen(port, () => {
    console.log(`> TripManager custom server ready on http://${hostname}:${port}`);
    console.log(`> Socket.IO server listening on /api/socket/io`);
  });
});
