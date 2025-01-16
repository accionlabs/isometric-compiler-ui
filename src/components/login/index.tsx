import React from "react";
import { useAuth } from "react-oidc-context";

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 999,
};

const popupStyle: React.CSSProperties = {
  backgroundColor: "#fff",
  padding: "20px",
  borderRadius: "8px",
  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
  textAlign: "center",
};

export default function Login() {
  const auth = useAuth();

  const handleLogin = () => {
    auth.signinRedirect({
      extraQueryParams: { kc_idp_hint: "google" }, // Optional: Specify IDP
    });
  };

  return (
    <div style={overlayStyle}>
      <div style={popupStyle}>
        <h1>Login to Continue</h1>
        <button onClick={handleLogin}>Login</button>
      </div>
    </div>
  );
}
