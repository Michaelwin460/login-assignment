import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { verifyOtp } from "../api";

export default function OtpForm({ email, setEmail }) {
  const navigate = useNavigate();

  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [topError, setTopError] = useState("");

  const handleVerify = async () => {
    setOtpError("");
    setTopError("");

    if (!otp) {
      setOtpError("* Required Field");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setOtpError("* OTP must be 6 digits");
      return;
    }

    const result = await verifyOtp(email, otp);

    if (result.status === "ok") {
      localStorage.setItem("token", result.token);
      setEmail(email);
      return navigate("/welcome");
    }

    if (result.status === "too_many_attempts") {
      setTopError("* Too many attempts. Try again later.");
      return;
    }

    if (result.status === "already_verified") {
      alert("This account is already verified. Please login.");
      return navigate("/login");
    }

    if (result.status === "invalid_otp") {
      setOtpError("* Invalid or expired OTP");
      return;
    }

    setTopError("* " + (result.status || "Something went wrong"));
  };

  return (
    <div className="form-wrapper">
      <h2 className="form-title">Verify OTP</h2>

      {topError && <div className="top-error">{topError}</div>}

      <p style={{ marginBottom: "10px" }}>
        We sent an OTP to <b>{email}</b>
      </p>

      <label>OTP Code</label>
      <input
        type="text"
        placeholder="Enter OTP"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
      />
      {otpError && <div className="error">{otpError}</div>}

      <button onClick={handleVerify} className="primary-btn">
        Verify
      </button>
    </div>
  );
}
