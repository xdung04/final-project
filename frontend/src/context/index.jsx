// AppProviders.jsx
import { AuthProvider } from "./AuthContext";
import { ToastProvider } from "./ToastContext";
import { GoogleOAuthProvider } from "@react-oauth/google";

export default function AppProviders({ children }) {
  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || "674533103182-p8uo13f8aroihmintmepsphd5krihf5d.apps.googleusercontent.com";
  return (
    <AuthProvider>
      <GoogleOAuthProvider clientId={googleClientId}>
        <ToastProvider>{children}</ToastProvider>
      </GoogleOAuthProvider>
    </AuthProvider>
  );
}
