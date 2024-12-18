import { useEffect, useState } from "react";
import App from "./App";
import Login from "./components/login/login";
import keycloak from "./services/keycloak"
import { useAuth, AuthProvider } from 'react-oidc-context';
import { oidcConfig } from "./services/oidcConfig";

import { ReactKeycloakProvider, useKeycloak } from '@react-keycloak/web'

export default function Root(){
    const auth = useAuth();
console.log(auth,'auth.......')    
// const [isUserLoggedIn, setIsUserLoggedIn] = useState(false); // Initial state for user login
// // const {keycloak,initialized}=useKeycloak()
// useEffect(()=>{
//     console.log(keycloak.authenticated,'keycloak.authenticated inside useEffect')
// },[keycloak.authenticated])
// console.log(keycloak.authenticated,'keycloak.authenticated')

// const handleLoginSuccess = () => {
//     setIsUserLoggedIn(true); // Set the user as logged in
//   };
    return (
        <>
        {!auth.isAuthenticated && <Login/>}
        
        <App/>
        </>
    )

}

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