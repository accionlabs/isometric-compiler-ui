import React from "react";
import App from "./App";
import Login from "./components/login"
import { useAuth } from "react-oidc-context";

export default function Root() {
  const auth = useAuth();

  if (!auth.isAuthenticated) {
    return <Login />;
  }

  return <App />;
}
