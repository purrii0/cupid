// main server logic

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const app = express();
const server = http.createServer(app);

const {signup, signin} = require("./controllers/auth.controller.js");
const authRoutes = require("./routes/auth.routes.js");
const userRoutes = require("./routes/user.routes.js");
const messageRoutes = require("./routes/message.routes.js");
const swipeRoutes = require("./routes/swipe.routes.js");
const { initializeWebSocket } = require("./sockets/ws.js");

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, '.env') });

const port = process.env.PORT || 8080;

// Only log in development
if (process.env.NODE_ENV !== 'production') {
    console.log("Port from env:", process.env.PORT);
    console.log("Using port:", port);
}

const cors = require('cors');
const helmet = require('helmet');
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*', // Set CORS_ORIGIN in .env for production
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

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Auth routes
app.use('/auth', authRoutes);
// Legacy auth routes for backward compatibility
app.post("/signup", signup);
app.post("/signin", signin);

// User routes
app.use("/api", userRoutes);

// Message routes
app.use("/api", messageRoutes);

// Swipe routes
app.use("/api", swipeRoutes);

// Moderation routes
const moderationRoutes = require("./routes/moderation.routes.js");
app.use("/api/moderation", moderationRoutes);

// Enhanced global error handler for production
app.use((err, req, res, next) => {
  // Log error details in development only
  if (process.env.NODE_ENV !== 'production') {
    console.error('Global error:', err);
  }
  
  // Send appropriate error response
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

app.get("/", (req, res)=>{
    res.status(200).send("Cupid API Server is running!");
});

// Check required environment variables for production
const requiredEnv = [
  'PORT', 'HOST', 'USER', 'PASSWORD', 'DATABASE', 'JWT_SECRET', 'CORS_ORIGIN'
];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  console.error('Missing required environment variables:', missingEnv.join(', '));
  process.exit(1);
}

server.listen(port, () => {
    if (process.env.NODE_ENV !== 'production') {
        console.log(`Cupid server listening on port: ${port}`);
    }
});
