import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ReactKeycloakProvider } from "@react-keycloak/web";
import keycloak from "./services/keycloak";
import Root from "./root";
import { login } from "./services/users";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false
        }
    }
});

const onEvent = async (event: string, error?: any) => {
  if (event === 'onAuthSuccess') {
    const token = keycloak.token;
    if (token) {
      try {
        const user = await queryClient.fetchQuery({ 
            queryKey: ['user'],
            queryFn: () => login(token),
            staleTime: 30 * 60 * 1000,
            retry: false, // Don't retry on failure
        });

        if (!user) {
            throw new Error('User validation failed');
          }
  
      } catch { 
        keycloak.logout(); // Logout if user validation fails
      }
    }
  }
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    // <React.StrictMode>
        <QueryClientProvider client={queryClient}>
        <ReactKeycloakProvider authClient={keycloak} initOptions={{ 
            onLoad: "check-sso",  
            silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
            pkceMethod: 'S256',
            checkLoginIframe: true,
            silentCheckSsoFallback: true,
            enableLogging: true
            }}
            onEvent={onEvent}
            >
             <Root />
            </ReactKeycloakProvider>
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    // </React.StrictMode>
);
