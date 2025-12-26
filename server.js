#!/usr/bin/env node

const WebSocket = require('ws');
const http = require('http');
const wss = new WebSocket.Server({ noServer: true });
const setupWSConnection = require('y-webrtc-signaling/src/utils').setupWSConnection;

const host = process.env.HOST || '0.0.0.0';
const port = process.env.PORT || 4444;

const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end('✅ Signaling Server is running');
});

server.on('upgrade', (request, socket, head) => {
  // You can emit 'close' but we want to handle the connection
  wss.handleUpgrade(request, socket, head, (ws) => {
    setupWSConnection(ws, request);
  });
});

server.listen(port, host, () => {
  console.log(`running at '${host}' on port ${port}`);
});