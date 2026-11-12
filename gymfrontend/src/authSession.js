export function clearAuthSession() {
  ['token', 'name', 'email', 'role'].forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
}

export function getAuthRole() {
  return localStorage.getItem('role') ||
    sessionStorage.getItem('role') ||
    '';
}

export function handleAuthenticationFailure(response) {
  if (response.status !== 401) {
    return false;
  }

  clearAuthSession();
  window.dispatchEvent(new Event('gym:auth-expired'));
  return true;
}

export async function authenticatedFetch(...args) {
  const response = await fetch(...args);
  handleAuthenticationFailure(response);
  return response;
}