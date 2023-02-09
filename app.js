const PORT = 3000 || process.env.PORT;
console.log("Server running at port " + PORT);

const io = require("socket.io")(PORT, { cors: { origin: "*" } });
const users = {};
let connected = 0;

io.on("connection", (socket) => {
  connected++;
  io.sockets.emit("broadcast", connected);
  console.log("user connected");

  socket.on("start-game", (obj) => {
    console.log(`start game ${obj.playingSide}`);
    socket.broadcast.emit("game-started", obj.playingSide);
  });
  socket.on("roll-complete", (obj) => {
    socket.broadcast.emit("roll-received", obj);
  });
  socket.on("move-played", (move) => {
    // console.log(move);
    socket.broadcast.emit("move-received", move);
  });

  socket.on("disconnect", () => {
    connected--;
    io.sockets.emit("broadcast", connected);

    console.log("user disconnected");
  });
});
