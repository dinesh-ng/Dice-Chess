const express = require("express");
const PORT = 3000 || process.env.PORT;

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const http = require("http").Server(app);
const io = require("socket.io")(http);

const users = {};

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

io.on("connection", (socket) => {
  console.log("user connected");

  socket.on("start-game", (val) => {
    console.log(`start game`);
    users[socket.id] = val.uname;
    socket.broadcast.emit("game-started");
  });
  socket.on("move-played", (move) => {
    console.log(move);
    socket.broadcast.emit("move-received", move);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

http.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
