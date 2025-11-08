import React, { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";

import LoginForm from "./components/LoginForm";
import OtpForm from "./components/OtpForm";
import Welcome from "./components/Welcome";

import { checkMe } from "./api";
import "./style.css";

export default function App() {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      navigate("/login");
      return;
    }

    checkMe(token).then((res) => {
      if (res.authenticated) {
        setEmail(res.email);
        navigate("/welcome");
      } else {
        localStorage.removeItem("token");
        navigate("/login");
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={<LoginForm setEmail={setEmail} />}
      />

      <Route
        path="/otp"
        element={<OtpForm email={email} setEmail={setEmail} />}
      />

      <Route
        path="/welcome"
        element={<Welcome email={email} />}
      />

      <Route
        path="*"
        element={<LoginForm setEmail={setEmail} />}
      />
    </Routes>
  );
}
