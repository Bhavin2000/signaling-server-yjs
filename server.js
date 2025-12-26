const WebSocket = require('ws');
const http = require('http');

// 1. Create the HTTP Server
const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end('✅ Custom Signaling Server is running!');
});

// 2. Create the WebSocket Server
const wss = new WebSocket.Server({ server });

// 3. The "Phonebook" (Tracks who is in which room)
const rooms = new Map();

wss.on('connection', (conn) => {
  conn.topics = new Set(); // Track which rooms this user is in

  conn.on('message', (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (e) { return; }

    if (data && data.type) {
      switch (data.type) {
        case 'subscribe':
          // User wants to join rooms
          (data.topics || []).forEach(topicName => {
            conn.topics.add(topicName);
            
            // Add to room map
            if (!rooms.has(topicName)) {
              rooms.set(topicName, new Set());
            }
            rooms.get(topicName).add(conn);
          });
          break;

        case 'unsubscribe':
          // User leaving rooms
          (data.topics || []).forEach(topicName => {
            conn.topics.delete(topicName);
            if (rooms.has(topicName)) {
              rooms.get(topicName).delete(conn);
            }
          });
          break;

        case 'publish':
          // User sending data to a room (e.g. "Here is my IP")
          if (data.topic && rooms.has(data.topic)) {
            const receivers = rooms.get(data.topic);
            receivers.forEach(receiver => {
              // Send to everyone else in the room
              if (receiver !== conn && receiver.readyState === WebSocket.OPEN) {
                receiver.send(message);
              }
            });
          }
          break;
        
        case 'ping':
          conn.send(JSON.stringify({ type: 'pong' }));
          break;
      }
    }
  });

  // Cleanup on disconnect
  conn.on('close', () => {
    conn.topics.forEach(topicName => {
      if (rooms.has(topicName)) {
        const room = rooms.get(topicName);
        room.delete(conn);
        if (room.size === 0) {
          rooms.delete(topicName); // Delete empty room
        }
      }
    });
  });
});

// 4. Start Listening
const port = process.env.PORT || 4444;
server.listen(port, () => {
  console.log(`🚀 Signaling server running on port ${port}`);
});