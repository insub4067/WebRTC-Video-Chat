import express from "express";
import path from "path";
import SocketIO from "socket.io";
import http from "http";

const handleListen = () => console.log("Listen on http://localhost:3000");

const __dirname = path.resolve();

const app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use("/static", express.static(__dirname + "/static"));

app.get("/", (req, res) => {
  res.render("home");
});

// 서버 만들고
const httpServer = http.createServer(app);
// 소켓 서버랑 합치기
const wsServer = SocketIO(httpServer);

//소켓 연결시
wsServer.on("connection", (socket) => {
  // join Room
  socket.on("join_room", (roomName) => {
    socket.join(roomName);
    socket.to(roomName).emit("welcome");
  });

  // offer
  socket.on("offer", (offer, roomName) => {
    socket.to(roomName).emit("offer", offer);
  });

  // answer
  socket.on("answer", (answer, roomName) => {
    socket.to(roomName).emit("answer", answer);
  });

  //ice
  socket.on("ice", (ice, roomName) => {
    socket.to(roomName).emit("ice", ice);
  });
});

httpServer.listen(3000, handleListen);
