import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { SmartAccountProvider } from "./context/SmartAccountContext"; 
import "leaflet-defaulticon-compatibility";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SmartAccountProvider>
          <App />
        </SmartAccountProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);