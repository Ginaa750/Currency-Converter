import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// If no saved theme, respect system preference on first load
if (!localStorage.getItem("theme")) {
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
  document.documentElement.classList.toggle("dark", prefersDark);
} else {
  document.documentElement.classList.toggle("dark", localStorage.getItem("theme") === "dark");
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode><App /></React.StrictMode>
);
