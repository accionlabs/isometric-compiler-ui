
import { useKeycloak } from "@react-keycloak/web";
import App from "./App";
import Login from "./components/ui/login";
import Loader from "./components/ui/Loader";
import { login } from "./services/users";
import { useQuery } from "@tanstack/react-query";
export default function Root() {
    const { keycloak, initialized } = useKeycloak();
    const { data: user, isLoading } = useQuery({ 
              queryKey: ['user'],
              queryFn: () => login(keycloak.token),
              staleTime: 30 * 60 * 1000,
              retry: false, // Don't retry on failure
              enabled: !!keycloak.authenticated && !!keycloak.token && !!initialized
          })

    if(!initialized || isLoading) { 
        return <Loader />
    }

    return (
        <>
            { user ? <App /> : <Login /> }
        </>
    )

}