const express = require("express");
const app = express();
const server = require("http").createServer(app);
const socketIo = require("socket.io");
const io = socketIo(server, {
	cors: {
		origin: "*",
	},
}).of("/socket_connection");

const PORT = 4321;

io.on("connection", (socket) => {
	console.log("User connected:", socket.id);

	socket.on("message", (message) => {
		console.log(message);
		socket.broadcast.emit(`message`, message);
	});

	socket.emit("me", socket.id);
	socket.on("disconnect", () => {
		socket.broadcast.emit("callEnded");
	});
	socket.on("callUser", ({ userToCall, signalData, from, name }) => {
		console.log("name=> ", name);
		io.to(userToCall).emit("callUser", { signal: signalData, from, name });
	});
	socket.on("answerCall", (data) => {
		console.log("data=> ", data);
		io.to(data.to).emit("callAccepted", data.signal);
	});
});

app.get("/api", (req, res) => {
	res.send({ msg: "Backend Server is Running!" });
});

server.listen(PORT, function () {
	console.log(`Server running on port ${PORT}`);
});
