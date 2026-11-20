const express = require("express");

const http = require("http");
const { Server } = require("socket.io");



const app = express();

const httpserver = http.createServer(app);

const io = new Server(httpserver);

io.on("connection", (socket) => {

    socket.emit("Hi", "Hello dear");


    socket.on("Kuchbhi", (msg) => {
        console.log(msg);

    })
})

httpserver.listen(8010, () => {
    console.log("port number 8010 is started");
})