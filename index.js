import express from "express";
import path from "path";
import SocketIO from "socket.io";
import http from "http"; 

const handleListen = () => console.log("Listen on http://localhost:3000")


const __dirname = path.resolve();

const app = express();

app.set("views", path.join(__dirname, "views"))
app.set("view engine", "pug")
app.use('/static', express.static(__dirname+"/static"));


app.get("/",(req, res) => { 
    res.render('home')
})

// 서버 만들고
const httpServer = http.createServer(app);
// 소켓 서버랑 합치기 
const wsServer = SocketIO(httpServer);

httpServer.listen(3000, handleListen); 
