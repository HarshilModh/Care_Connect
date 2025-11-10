import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiRouter from "./routes/index.js";
import { connectDB } from "./dbConfig/index.js";
//redisClient
import { createClient } from "redis";

const client = createClient();

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors({ credentials: true, origin: true }));
app.use(express.json());

// // Sample Route
// app.get('/', (req, res) => {
//   res.send('Hello, World!');
// });
// API Routes
apiRouter(app);
// Connect to Database and Start Server
connectDB()
  .then(() => {
    //redis client connection
    client
      .connect()
      .then(() => {
        console.log("Connected to Redis");
      })
      .catch((err) => {
        console.error("Redis connection error:", err);
      });
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to the database:", error);
  });
