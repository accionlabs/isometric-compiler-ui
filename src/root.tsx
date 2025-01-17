
import { useKeycloak } from "@react-keycloak/web";
import App from "./App";
import Login from "./components/ui/login";
import Loader from "./components/ui/Loader";
export default function Root() {
    const { keycloak, initialized } = useKeycloak();
    if(!initialized){ 
        return <Loader />
    }

    return (
        <>
            { keycloak.authenticated ? <App /> : <Login /> }
        </>
    )

}