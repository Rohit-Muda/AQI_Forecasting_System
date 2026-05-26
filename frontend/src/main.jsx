import React from "react";
import ReactDOM from "react-dom/client";
import { applyTheme, getInitialTheme } from "./hooks/useTheme";
import App from "./App";
import "./styles/app.css";

applyTheme(getInitialTheme());

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
