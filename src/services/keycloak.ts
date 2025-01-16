import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
    url: 'https://login-new.accionbreeze.com/auth',
    realm: 'accionlabswebsite',
    clientId: 'isometric',
    // tokenStorage: 'localStorage'
});

keycloak.onAuthSuccess = () => console.log('Authentication successful');
keycloak.onAuthError = (error) => console.error('Authentication error:', error);
keycloak.onAuthLogout = () => console.log('User logged out');
keycloak.onTokenExpired = () => console.log('Token expired');

const initKeycloak = async () => {
    try {
      const authenticated = await keycloak.init({
        onLoad: 'check-sso', // Checks if the user is already logged in
        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html', // For silent SSO
        pkceMethod: 'S256', // Optional: Enable PKCE for security
      });
  
      if (authenticated) {
        console.log('User is authenticated');
      } else {
        console.log('User is not authenticated');
      }
    } catch (error) {
      console.error('Keycloak initialization failed:', error);
    }
  };

  
  
  
//   initKeycloak();


// Check if tokens are stored in localStorage and set them in Keycloak
// const storedToken = localStorage.getItem('keycloakToken');
// const storedRefreshToken = localStorage.getItem('keycloakRefreshToken');
// const storedKeycloakIdToken = localStorage.getItem('keycloakIdToken')

// if (storedToken && storedRefreshToken && storedKeycloakIdToken) {

//     keycloak.token = storedToken;
//     keycloak.refreshToken = storedRefreshToken;
//     keycloak.idToken = storedKeycloakIdToken
//     console.log("token check")
//     keycloak.authenticated = true
// }

// keycloak.onTokenExpired = () => {
//     keycloak
//       .updateToken(30) // Refresh 30 seconds before expiration
//       .then((refreshed) => {
//         if (refreshed) {
//           console.log('Token refreshed');
//         //   localStorage.setItem('keycloakToken', keycloak.token || '');
//         //   localStorage.setItem('keycloakRefreshToken', keycloak.refreshToken || '');
//         //   localStorage.setItem('keycloakIdToken', keycloak.idToken || '');
//         } else {
//           console.warn('Token is still valid, no refresh needed');
//         }
//       })
//       .catch((error) => {
//         console.error('Failed to refresh token', error);
//         keycloak.logout();
//       });
//   };

// setInterval(() => {
//     keycloak.updateToken(30).then((refreshed) => {
//       if (refreshed) {
//         console.log('Token refreshed');
//       }
//     }).catch((error) => {
//       console.error('Failed to refresh token:', error);
//     });
//   }, 60000);
export default keycloak;