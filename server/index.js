require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");
const slowDown = require("express-slow-down");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err.message));


  const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 70,
  standardHeaders: true
});


const authSlowDown = slowDown({
  windowMs: 60 * 1000,
  delayAfter: 5,
  delayMs: () => 250,
  validate: { delayMs: false }
});


app.use(["/login", "/send-otp", "/verify-otp"], authSlowDown, authLimiter);


app.use("/", authRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running: http://localhost:${PORT}`);
});
