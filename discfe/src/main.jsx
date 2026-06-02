import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router";
import routes from "./routes/routes.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { BrandingProvider } from "./context/BrandingContext.jsx";
import { SettingsProvider } from "./context/SettingsContext.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google";

import "./index.css";

import { Toaster } from "react-hot-toast";

const googleClientId =
  import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ||
  "1054488037691-cit14s0iorh4m4ubuteu54b9u45330d3.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SettingsProvider>
      <Toaster position="top-right" />
      <BrandingProvider>
        <AuthProvider>
          <GoogleOAuthProvider clientId={googleClientId}>
            <RouterProvider router={routes} />
          </GoogleOAuthProvider>
        </AuthProvider>
      </BrandingProvider>

    </SettingsProvider>
  </React.StrictMode>
);
