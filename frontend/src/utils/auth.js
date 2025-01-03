// src/utils/auth.js

export const logoutUser = () => {
  if (typeof window !== 'undefined') { // Asegurarse de que corremos en el cliente
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    window.location.href = "/login"; // Redirige al usuario al login
  }
};
