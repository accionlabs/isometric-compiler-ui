
import { useKeycloak } from "@react-keycloak/web";
import App from "./App";
import Login from "./components/ui/login";
import keycloak from "./services/keycloak";
export default function Root() {
    const { keycloak : kc, initialized } = useKeycloak();
    console.log("root page rendered********************************",kc)
    console.log("root page keycloak",keycloak)
    if(!initialized){ 
        return <div>Loading...</div>
    }

    return (
        <>
            { keycloak.authenticated ? <App /> : <Login /> }
        </>
    )

}