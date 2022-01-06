import express from "express";
import path from "path";
import SocketIO from "socket.io";
import http from "http"; 

const __dirname = path.resolve();
const app = express();

// APP

app.set("views", path.join(__dirname, "views"))
app.set("view engine", "pug")
app.use('/static', express.static(__dirname+"/static"));

app.get("/",(req, res) => { 
    res.render('home')
})

// Server
const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);

// Connect Socket
wsServer.on("connection", socket => {

    // join Room
    socket.on("join_room", (roomName) => {
        socket.join(roomName)
        socket.to(roomName).emit('welcome')
    })

    // offer
    socket.on('offer', (offer, roomName) => {
        socket.to(roomName).emit('offer', offer)
    })

    // answer
    socket.on('answer', (answer, roomName) => {
        socket.to(roomName).emit('answer', answer)
    })

    //ice
    socket.on('ice', (ice, roomName) => {
        socket.to(roomName).emit('ice', ice)
    })
})

// Listen

const handleListen = () => console.log("Listen on http://localhost:3000")

httpServer.listen(3000, handleListen); 
