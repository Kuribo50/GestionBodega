// src/context/UserContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api'; // Asegúrate de que la ruta sea correcta

// Crear el contexto
const UserContext = createContext();

// Proveedor del contexto
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Estado para almacenar la información del usuario
  const [loading, setLoading] = useState(true); // Estado de carga
  const [error, setError] = useState(null); // Estado de error

  // Cargar usuario desde localStorage al montar el componente
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const accessToken = localStorage.getItem('access_token');

    console.log('Stored User:', storedUser);
    console.log('Access Token:', accessToken);

    if (storedUser && accessToken) {
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);
  }, []);

  // Función para iniciar sesión
  const login = async (username, password) => {
    setLoading(true);
    setError(null);

    try {
      // Obtener tokens desde el backend
      const tokenResponse = await api.post('/token/', { username, password });
      const { access, refresh } = tokenResponse.data;

      // Guardar tokens en localStorage
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);

      // Obtener datos del usuario logueado
      const userResponse = await api.get('/user/', {
        headers: {
          Authorization: `Bearer ${access}`,
        },
      }); // Asegúrate de que /user/ devuelva la info del usuario logueado

      if (userResponse.status === 200) {
        const userData = userResponse.data;

        // Guardar la información del usuario
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);

        // Mostrar mensaje de bienvenida personalizado
        const displayName = userData.full_name || userData.username || 'Usuario';
        toast.success(`¡Bienvenido, ${displayName}!`, {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: false,
          progress: undefined,
        });

        return true; // Login exitoso
      } else {
        throw new Error('No se pudo obtener la información del usuario.');
      }
    } catch (err) {
      console.error('Error en login:', err);
      setError('Credenciales incorrectas o error en el servidor.');
      toast.error('Credenciales incorrectas o error en el servidor.', {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      return false; // Login fallido
    } finally {
      setLoading(false);
    }
  };

  // Función para cerrar sesión
  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    toast.info('Has cerrado sesión.', {
      position: "top-center",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: false,
      progress: undefined,
    });
  };

  return (
    <UserContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

// Hook personalizado para consumir el contexto
export const useUser = () => {
  return useContext(UserContext);
};
