import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import { ReactKeycloakProvider } from '@react-keycloak/web'
import App from './App'
import Login from './components/login/login'
import keycloak from "./services/keycloak"
import Root from './root'
import { oidcConfig } from "./services/oidcConfig";
import { AuthProvider } from 'react-oidc-context'


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false
    },
  },
})
console.log(localStorage.getItem("oidc.state")); // Log stored state
console.log(window.location.href);
console.log(oidcConfig,'oidcConfig')
const handleKeycloakEvent = (event: string) => {
  console.log(event, 'event')

  // if (event === 'onReady') {
  //   setKeycloakInitialized(true);
  //   setIsUserLoggedIn(!!keycloak.authenticated);
  // } else if (event === 'onAuthSuccess') {
  //   setIsUserLoggedIn(true);
  // } else if (event === 'onAuthLogout') {
  //   setIsUserLoggedIn(false);
  // }
};

const handleKeycloakTokens = (tokens: any) => {
  // Optionally store tokens in localStorage or sessionStorage
  console.log(tokens,'tokens')
  // localStorage.setItem('keycloakToken', tokens.token);
  // localStorage.setItem('keycloakRefreshToken', tokens.refreshToken);
  // localStorage.setItem('keycloakIdToken', tokens.idToken); 
};


ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  // <React.StrictMode>
  // <ReactKeycloakProvider 
  //   authClient={keycloak}
  //   initOptions={{
  //     onLoad: 'check-sso', // Avoid repeated login checks
  //     silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
  //     pkceMethod: 'S256'
  //   }}
  //   isLoadingCheck={(keyClok)=>{console.log(keyClok, 'isLoadingCheck')
  //     return !keyClok.authenticated
  //   } }
  //   // isLoadingCheck={() => !keycloak.authenticated}>
  //     onEvent={(event, error) => {
  //       console.log(error, 'error')
  //       handleKeycloakEvent(event)}}
  //     onTokens={(tokens) => handleKeycloakTokens(tokens)}>

      
  // <React.StrictMode>
     <AuthProvider {...oidcConfig}>
      {/* <React.StrictMode> */}
        <QueryClientProvider client={queryClient}>
          <Root />
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      {/* </React.StrictMode> */}
    </AuthProvider>
    // </React.StrictMode>  
)
