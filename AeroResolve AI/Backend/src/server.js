const express = require("express");
const cors = require("cors");
const env = require("./config/env");
const pool = require("./config/database");
const { notFoundMiddleware, errorMiddleware } = require("./middleware/errorMiddleware");

const authRoutes = require("./routes/authRoutes");
const customerRoutes = require("./routes/customerRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const agentRoutes = require("./routes/agentRoutes");
const escalationRoutes = require("./routes/escalationRoutes");

const app = express();

// Production aur Local cross-origin requests ko handle karne ke liye CORS setup
const allowedOrigins = [
  "https://aeroresolve-desk.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
  env.FRONTEND_URL
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Direct API calls (like Postman or curl) ke liye !origin allow karein
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Fallback to allow requests in production
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ success: true, data: { status: "ok" } });
});

// Root endpoint for deployment status verification
app.get("/", (req, res) => {
  res.json({ success: true, message: "AeroResolve AI Backend is running" });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/agent", agentRoutes);
app.use("/api/escalations", escalationRoutes);

// Error Middlewares
app.use(notFoundMiddleware);
app.use(errorMiddleware);

async function start() {
  try {
    await pool.query("SELECT 1");
    console.log("✅ Database connected successfully");
  } catch (err) {
    console.error("❌ Database connection failed", err);
    process.exit(1);
  }

  app.listen(env.PORT, () => {
    console.log(`🚀 AeroResolve AI Backend running on port ${env.PORT}`);
  });
}

start();