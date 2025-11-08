import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Welcome({ email }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!email) navigate("/login");
  }, [email, navigate]);

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="form-wrapper welcome-container">
      <h2 className="form-title">Welcome</h2>

      <p className="welcome-text">You are logged in as:</p>

      <h3 className="welcome-email">{email}</h3>

      <button onClick={logout} className="primary-btn">
        Logout
      </button>
    </div>
  );
}
