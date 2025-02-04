import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
    url: import.meta.env.VITE_KEYCLOAK_URL,
    realm: import.meta.env.VITE_REALM_NAME,
    clientId: import.meta.env.VITE_CLIENT_ID
});

export default keycloak;
