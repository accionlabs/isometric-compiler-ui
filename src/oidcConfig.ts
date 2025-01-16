
export const oidcConfig = {
    monitorSession: true, // Monitor session status changes

    authority: "https://login-new.accionbreeze.com/auth/realms/accionlabswebsite",
    client_id: "isometric",
    redirect_uri: window.location.origin,
    post_logout_redirect_uri: window.location.origin,
    response_type: "code",
    scope: "openid profile email", // Add any additional scopes here
    automaticSilentRenew: true, // Enables silent token renewal
    silent_redirect_uri: `${window.location.origin}/silent-renew.html`,
    loadUserInfo: true,
  };