const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");

const app = express();

const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "*",
  },
});

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

let connected = 0;
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/users");

// app.get("/", (req, res) => {
//   res.sendFile(__dirname + "/index.html");
// });

io.on("connection", (socket) => {
  connected++;
  io.sockets.emit("broadcast", connected);
  console.log("user connected");
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    socket.join(user.room);

    //Send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });

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
  });
  //client disconnects
  socket.on("disconnect", () => {
    connected--;
    io.sockets.emit("broadcast", connected);
    console.log("Disconnect.");
    const user = userLeave(socket.id);
    if (user) {
      //Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
