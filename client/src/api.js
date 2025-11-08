const BASE = "http://localhost:5000";

export async function loginRequest(email, password) {
  const res = await fetch(BASE + "/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  return res.json();
}

export async function sendOtp(email, password) {
  const res = await fetch(BASE + "/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  return res.json();
}

export async function verifyOtp(email, otp) {
  const res = await fetch(BASE + "/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp })
  });
  return res.json();
}

export async function checkMe(token) {
  const res = await fetch(BASE + "/me", {
    method: "GET",
    headers: { Authorization: "Bearer " + token }
  });
  return res.json();
}
