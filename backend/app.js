import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiRouter from "./routes/index.js";
import { connectDB } from "./dbConfig/index.js";
import { createClient } from "redis";
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ credentials: true, origin: true }));
app.use(express.json());

// Sample Route
app.get("/", (req, res) => {
  res.send("Hello, World!");
});

// API Routes
apiRouter(app);

// Create HTTP server and Socket.IO
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { 
    origin: process.env.FRONTEND_URL || "http://localhost:5173", 
    credentials: true 
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Make io accessible to routes/controllers
app.set("io", io);

// Socket handlers (NO AUTH FOR NOW)
io.on("connection", (socket) => {
  console.log(`✅ Socket connected: ${socket.id}`);

  // Store user info from handshake (you'll pass from frontend)
  const userId = socket.handshake.query.userId;
  const userName = socket.handshake.query.userName || "Anonymous";
  
  socket.userId = userId;
  socket.userName = userName;

  if (userId) {
    socket.join(`user:${userId}`);
  }

  // Join group
  socket.on("join-group", (groupId) => {
    socket.join(`group:${groupId}`);
    console.log(`📥 ${userName} joined group: ${groupId}`);
    
    socket.to(`group:${groupId}`).emit("user-joined", {
      userId,
      userName,
      timestamp: new Date()
    });
    
    socket.emit("joined-group", { groupId });
  });

  // Leave group
  socket.on("leave-group", (groupId) => {
    socket.leave(`group:${groupId}`);
    console.log(`📤 ${userName} left group: ${groupId}`);
    
    socket.to(`group:${groupId}`).emit("user-left", {
      userId,
      userName,
      timestamp: new Date()
    });
  });

  // Typing indicator
  socket.on("typing", ({ groupId, isTyping }) => {
    socket.to(`group:${groupId}`).emit("user-typing", {
      userId,
      userName,
      isTyping,
      timestamp: new Date()
    });
  });

  // Message read
  socket.on("message-read", ({ groupId, messageId }) => {
    socket.to(`group:${groupId}`).emit("message-read-by", {
      messageId,
      userId,
      userName,
      timestamp: new Date()
    });
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log(`❌ Socket disconnected: ${socket.id}`);
  });

  // Error handling
  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });
});

// Connect to Database and Start Server
const client = createClient();
connectDB()
  .then(() => {
    client
      .connect()
      .then(() => console.log("Connected to Redis"))
      .catch((err) => console.error("Redis connection error:", err));

    httpServer.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Socket.IO enabled (NO AUTH - development only)`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to the database:", error);
  });

export default app;