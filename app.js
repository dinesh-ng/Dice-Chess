const express = require("express");
const PORT = 3000 || process.env.PORT;

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const http = require("http").Server(app);
const io = require("socket.io")(http);
const users = {};
let connected = 0;

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

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

http.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
