const { Server } = require('socket.io');
const http = require('http');

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

io.on('connection', socket => {
  console.log('Client connected');

  setInterval(() => {
    socket.emit('stats', {
      viewers: Math.floor(Math.random() * 500),
      messages: Math.floor(Math.random() * 1000),
    });
  }, 5000);

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

server.listen(4000, () => {
  console.log('WebSocket server running on port 4000');
});
