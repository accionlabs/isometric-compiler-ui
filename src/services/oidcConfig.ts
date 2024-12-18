class LocalStorageStore {
    get(key: string): string | null {
        return localStorage.getItem(key);
      }
    
      set(key: string, value: string): void {
        localStorage.setItem(key, value);
      }
    
      remove(key: string): void {
        localStorage.removeItem(key);
      }
      
    getAllKeys(): string[] {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          keys.push(key);
        }
      }
      return keys;
    }
  }
  

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
    stateStore: new LocalStorageStore(), 
  };

  
  