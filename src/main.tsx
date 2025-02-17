import ReactDOM from "react-dom/client";
import "./index.css";
import "@fontsource/roboto";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ReactKeycloakProvider } from "@react-keycloak/web";
import keycloak from "./services/keycloak";
import Root from "./root";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false
        }
    }
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    // <React.StrictMode>
    <QueryClientProvider client={queryClient}>
        <ReactKeycloakProvider
            authClient={keycloak}
            initOptions={{
                onLoad: "check-sso",
                silentCheckSsoRedirectUri:
                    window.location.origin + "/silent-check-sso.html",
                pkceMethod: "S256",
                checkLoginIframe: true,
                silentCheckSsoFallback: true,
                enableLogging: true
            }}
        >
            <Root />
        </ReactKeycloakProvider>
        <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
    // </React.StrictMode>
);
