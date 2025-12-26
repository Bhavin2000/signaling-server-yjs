const WebSocket = require('ws');
const http = require('http');
const wss = new WebSocket.Server({ noServer: true });
const setupWSConnection = require('./utils').setupWSConnection;

const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end('✅ Yjs Data Relay (Tunnel) is running!');
});

server.on('upgrade', (request, socket, head) => {
  // Pass the connection to the Yjs handler
  // This handles the "Tunneling" logic automatically
  wss.handleUpgrade(request, socket, head, (ws) => {
    setupWSConnection(ws, request);
  });
});

const port = process.env.PORT || 4444;
server.listen(port, () => {
  console.log(`🚀 Relay Tunnel running on port ${port}`);
});