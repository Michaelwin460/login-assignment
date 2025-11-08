import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginRequest, sendOtp } from "../api";

export default function LoginForm({ setEmail }) {
  const navigate = useNavigate();

  const [emailLocal, setEmailLocal] = useState("");
  const [password, setPassword] = useState("");

  const [errorEmail, setErrorEmail] = useState("");
  const [errorPassword, setErrorPassword] = useState("");
  const [topError, setTopError] = useState("");

  const validateEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleLoginClick = async () => {
    setErrorEmail("");
    setErrorPassword("");
    setTopError("");

    if (!emailLocal) {
      setErrorEmail("* Required Field");
      return;
    }
    if (!validateEmail(emailLocal)) {
      setErrorEmail("* Invalid Email");
      return;
    }

    if (!password) {
      setErrorPassword("* Required Field");
      return;
    }
    if (password.length < 8) {
      setErrorPassword("* Password must be 8+ characters");
      return;
    }

    const result = await loginRequest(emailLocal, password);

    if (result.status === "ok") {
      localStorage.setItem("token", result.token);
      setEmail(emailLocal);
      return navigate("/welcome");
    }

    if (result.status === "invalid_password") {
      setTopError("* Invalid email or password");
      return;
    }

    if (result.status === "not_verified") {
      await sendOtp(emailLocal, password);
      setEmail(emailLocal);
      return navigate("/otp");
    }

    if (result.status === "not_found") {
      const yes = window.confirm(
        "We don't have you in our systems. Would you like to sign up?"
      );
      if (!yes) return;

      await sendOtp(emailLocal, password);
      setEmail(emailLocal);
      return navigate("/otp");
    }

    if (result.status) {
      setTopError("* " + result.status);
    } else {
      setTopError("* Something went wrong");
    }
  };

  return (
    <div className="form-wrapper">
      <h2 className="form-title">Login</h2>

      {topError && <div className="top-error">{topError}</div>}

      <label>Email</label>
      <input
        type="text"
        value={emailLocal}
        placeholder="email"
        onChange={(e) => setEmailLocal(e.target.value)}
      />
      {errorEmail && <div className="error">{errorEmail}</div>}

      <label>Password</label>
      <input
        type="password"
        value={password}
        placeholder="password"
        onChange={(e) => setPassword(e.target.value)}
      />
      {errorPassword && <div className="error">{errorPassword}</div>}

      <button onClick={handleLoginClick} className="primary-btn">
        Login
      </button>
    </div>
  );
}
