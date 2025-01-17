import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
    url: 'https://login-new.accionbreeze.com',
    realm: 'accionlabswebsite',
    clientId: 'isometric'
});

export default keycloak;