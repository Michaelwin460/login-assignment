const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { sendEmail } = require("../utils/sendEmail");

const router = express.Router();


function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ status: "bad_request" });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ status: "bad_email" });
    }
    if (password.length < 8) {
      return res.status(400).json({ status: "weak_password" });
    }

    const e = email.toLowerCase().trim();
    const user = await User.findOne({ email: e });

    if (!user) {
      return res.status(404).json({ status: "not_found" });
    }

    if (!user.verified) {
      return res.status(403).json({ status: "not_verified" });
    }

    const passwordCorrect = await bcrypt.compare(password, user.password);
    if (!passwordCorrect) {
      return res.status(401).json({ status: "invalid_password" });
    }

    const token = jwt.sign(
      { sub: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );

    return res.json({ status: "ok", token });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ status: "server_error" });
  }
});


router.post("/send-otp", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const e = (email || "").toLowerCase().trim();

    if (!e || !password) {
      return res.status(400).json({ status: "bad_request" });
    }
    if (!validateEmail(e)) {
      return res.status(400).json({ status: "bad_email" });
    }
    if (password.length < 8) {
      return res.status(400).json({ status: "weak_password" });
    }

    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    const signupPasswordHash = await bcrypt.hash(password, 10);

    let user = await User.findOne({ email: e });

    if (user && user.verified) {
      return res.status(409).json({ status: "exists" });
    }

    if (!user) {
      user = await User.create({
        email: e,
        signupPasswordHash,
        otp,
        otpExpires,
        verified: false,
        otpAttempts: 0
      });
    } else {
      user.signupPasswordHash = signupPasswordHash;
      user.otp = otp;
      user.otpExpires = otpExpires;
      user.verified = false;
      user.otpAttempts = 0;
      await user.save();
    }

    try {
      const html = `
        <div style="font-family: Arial, sans-serif;">
          <h2>Your Verification Code</h2>
          <h1 style="letter-spacing: 4px;">${otp}</h1>
          <p>This code expires in 5 minutes.</p>
        </div>
      `;
      await sendEmail(e, "Your OTP Code", html);
    } catch (err) {
      console.error("Email send failed:", err);
      return res.status(502).json({ status: "email_failed" });
    }

    return res.json({ status: "sent" });

  } catch (err) {
    console.error("send-otp error:", err);
    return res.status(500).json({ status: "server_error" });
  }
});


router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body || {};
    const e = (email || "").toLowerCase().trim();
    const providedOtp = (otp || "").toString().trim();

    if (!e || !providedOtp) {
      return res.status(400).json({ status: "bad_request" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      return res.status(400).json({ status: "bad_email" });
    }
    if (!/^\d{6}$/.test(providedOtp)) { 
      return res.status(400).json({ status: "bad_otp_format" });
    }

    const user = await User.findOne({ email: e });
    if (!user) {
      return res.status(400).json({ status: "invalid_otp" });
    }

    if (user.verified) {
      return res.status(400).json({ status: "already_verified" });
    }

    if (!user.otp || !user.otpExpires) {
      return res.status(400).json({ status: "invalid_otp" });
    }

    const attempts = user.otpAttempts || 0;
    const MAX_ATTEMPTS = 6;
    if (attempts >= MAX_ATTEMPTS) {
      return res.status(429).json({ status: "too_many_attempts" });
    }

    const now = Date.now();
    const otpStillValid = user.otpExpires.getTime() > now;
    const otpMatches = user.otp === providedOtp;

    if (!otpStillValid || !otpMatches) {
      user.otpAttempts = attempts + 1;
      if (user.otpAttempts >= MAX_ATTEMPTS) {
        user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      }
      await user.save();
      return res.status(400).json({ status: "invalid_otp" });
    }

    if (!user.signupPasswordHash) {
      return res.status(500).json({ status: "server_error" });
    }

    user.password = user.signupPasswordHash;
    user.signupPasswordHash = undefined;
    user.otp = undefined;
    user.otpExpires = undefined;
    user.otpAttempts = 0;
    user.verified = true;

    await user.save();

    const token = jwt.sign(
      { sub: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );

    return res.json({ status: "ok", token });
  } catch (err) {
    console.error("verify-otp error:", err);
    return res.status(500).json({ status: "server_error" });
  }
});


router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({ authenticated: false });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ authenticated: false });
    }

    const user = await User.findById(decoded.sub).lean();
    if (!user || !user.verified) {
      return res.status(401).json({ authenticated: false });
    }

    return res.json({
      authenticated: true,
      email: decoded.email
    });

  } catch (err) {
    console.error("ME ERROR:", err);
    return res.status(500).json({ authenticated: false });
  }
});


module.exports = router;
