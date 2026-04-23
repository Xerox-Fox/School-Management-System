import { users } from "./users.js";

export function login(email, password) {
  const user = users.find(
    u => u.email === email && u.password === password
  );

  if (!user) {
    throw new Error("Invalid credentials");
  }

  // save session
  localStorage.setItem("user", JSON.stringify(user));

  return user;
}

export function getUser() {
  return JSON.parse(localStorage.getItem("user"));
}

export function logout() {
  localStorage.removeItem("user");
  window.location.href = "../index.html";
}