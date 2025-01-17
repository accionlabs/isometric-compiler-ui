
import { useKeycloak } from "@react-keycloak/web";
import App from "./App";
import Login from "./components/ui/login";
export default function Root() {
    const { keycloak, initialized } = useKeycloak();
    if(!initialized){ 
        return <div>Loading...</div>
    }

    return (
        <>
            { keycloak.authenticated ? <App /> : <Login /> }
        </>
    )

}