// main server logic

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const app = express();
const server = http.createServer(app);

const {signup, signin} = require("./controllers/auth.controller.js");
const userRoutes = require("./routes/user.routes.js");
const messageRoutes = require("./routes/message.routes.js");
const { initializeWebSocket } = require("./sockets/ws.js");

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, '.env') });

const port = process.env.PORT || 8080;
console.log("Port from env:", process.env.PORT);
console.log("Using port:", port);

const cors = require('cors');
app.use(cors({
  origin: "*", // In production, specify your frontend domain
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// Initialize Socket.IO with CORS
const io = socketIo(server, {
  cors: {
    origin: "*", // In production, specify your frontend domain
    methods: ["GET", "POST"]
  }
});

// Initialize WebSocket functionality
initializeWebSocket(io);

app.use(express.json());

// Auth routes
app.post("/signup", signup);
app.post("/signin", signin);

// User routes
app.use("/api", userRoutes);

// Message routes
app.use("/api", messageRoutes);

app.get("/", (req, res)=>{
    res.status(200).send("Cupid API Server is running!");
});

server.listen(port, () => {
    console.log(`Cupid server listening on port: ${port}`); 
});
