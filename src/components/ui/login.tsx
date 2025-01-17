import { useKeycloak } from "@react-keycloak/web";
// import keycloak from "../../services/keycloak";

const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  };
  
  const popupStyle: React.CSSProperties = {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    position: 'relative',
  };

export default function Login(){
    // const auth = useAuth();

    const { keycloak, initialized } = useKeycloak();

    console.log("login page rendered",keycloak.authenticated)
    return (
        <div style={overlayStyle}>
              <div style={popupStyle}>
        <div style={{height:'500', width: '800'}}>
                <h1>click to login</h1>
                <button
                onClick={() => keycloak.login({
                    prompt: 'login',
                    idpHint: 'google', // Replace 'google' with your IDP alias in Keycloak
                  })}
                >login</button>
                {/* <button
                onClick={()=>{
                    keycloak.logout().then(() => {
                        console.log('Logout successful');
                        localStorage.removeItem('keycloakToken');
                        localStorage.removeItem('keycloakRefreshToken');
                      });
                    
                }}>logout</button> */}
        </div>
        </div>
        </div>
    )
}