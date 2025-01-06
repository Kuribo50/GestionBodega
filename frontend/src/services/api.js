// services/api.js

import axios from "axios";
import Swal from "sweetalert2";
import { saveAs } from "file-saver"; // Asegúrate de importar saveAs

// Función para capitalizar la primera letra de una cadena
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Configuración base de la API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://web-production-1f58.up.railway.app/api/";

// Instancia de Axios con configuración base
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    accept: "application/json",
  },
});

// Variable para evitar múltiples alertas de sesión expirada
let isSessionExpired = false;

// Interceptor para agregar el token de autorización a cada solicitud
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Manejo de error 401 (token vencido o no autorizado)
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;
        console.log('Refresh Token Obtenido:', refreshToken);
        if (!refreshToken) {
          throw new Error("No se encontró el refresh token.");
        }

        // Intento de refrescar el token usando la instancia 'api'
        const response = await api.post(`/token/refresh/`, { refresh: refreshToken });
        console.log('Nuevo Access Token:', response.data.access);

        const { access } = response.data;
        if (access) {
          typeof window !== "undefined" && localStorage.setItem("access_token", access);
          api.defaults.headers["Authorization"] = `Bearer ${access}`;
          originalRequest.headers["Authorization"] = `Bearer ${access}`;
          return api(originalRequest);
        } else {
          throw new Error("No se pudo obtener el nuevo access_token.");
        }
      } catch (err) {
        // Si falla el refresh, se notifica que la sesión expiró
        if (!isSessionExpired) {
          isSessionExpired = true;
          Swal.fire({
            title: 'Sesión Expirada',
            text: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
            icon: 'warning',
            confirmButtonText: 'Aceptar',
          }).then(() => {
            typeof window !== "undefined" && localStorage.removeItem("access_token");
            typeof window !== "undefined" && localStorage.removeItem("refresh_token");
            typeof window !== "undefined" && localStorage.removeItem("user");
            typeof window !== "undefined" && (window.location.href = "/login");
          });
        }
        return Promise.reject(err);
      }
    }

    // Manejo de errores genéricos (excluyendo solicitudes de login/registro)
    const isLoginRequest = originalRequest.url.includes('/auth/') || originalRequest.url.includes('/token/');
    if (!isLoginRequest && error.response && error.response.data) {
      const errorMessages = [];
      for (const key in error.response.data) {
        if (Array.isArray(error.response.data[key])) {
          error.response.data[key].forEach((msg) => errorMessages.push(`${capitalize(key)}: ${msg}`));
        } else {
          errorMessages.push(`${capitalize(key)}: ${error.response.data[key]}`);
        }
      }
      if (errorMessages.length > 0) {
        Swal.fire({
          icon: "error",
          title: "Error",
          html: errorMessages.join("<br/>"),
        });
      }
    } else if (!isLoginRequest && !error.response) {
      // Error de conexión con el servidor
      Swal.fire({
        icon: "error",
        title: "Error",
        text: `No se pudo conectar con el servidor.`,
      });
    }

    return Promise.reject(error);
  }
);

// Función genérica para eliminar entidades (DELETE)
const deleteEntity = async (endpoint, id) => {
  try {
    const response = await api.delete(`/${endpoint}/${id}/`);
    if (response.status === 204) {
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: `El ${endpoint.slice(0, -1)} se eliminó correctamente.`,
      });
      return true;
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: `No se pudo eliminar el ${endpoint.slice(0, -1)}.`,
      });
      return false;
    }
  } catch (error) {
    console.error(`Error al eliminar ${endpoint}:`, error.response?.data || error.message);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: `No se pudo eliminar el ${endpoint.slice(0, -1)}.`,
    });
    return false;
  }
};

/* --------------------------------------------------------------------------
       FUNCIONES PARA AUTENTICACIÓN Y USUARIOS
-------------------------------------------------------------------------- */
export const logout = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  }
};

/* --------------------------------------------------------------------------
       FUNCIONES PARA TAREAS
-------------------------------------------------------------------------- */
export const fetchTasks = async (userId) => {
  try {
    const response = await api.get(`/tasks/?user=${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener tareas:", error.response?.data || error.message);
    throw error;
  }
};

export const updateTask = async (taskId, updatedData) => {
  try {
    const response = await api.patch(`/tasks/${taskId}/`, updatedData);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar tarea:', error.response?.data || error.message);
    throw error;
  }
};

export const createTask = async (taskData) => {
  try {
    console.log('Creando tarea con los siguientes datos:', taskData);
    const response = await api.post(`/tasks/`, taskData);
    if (response.data && response.data.id) {
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "Tarea creada correctamente.",
      });
      return response.data;
    } else {
      throw new Error("No se pudo crear la tarea correctamente.");
    }
  } catch (error) {
    if (error.response) {
      console.error("Error al crear tarea:", error.response.data);
      let errorMessage = 'No se pudo crear la tarea: ';
      if (typeof error.response.data === 'object') {
        const messages = [];
        for (const key in error.response.data) {
          if (Array.isArray(error.response.data[key])) {
            error.response.data[key].forEach(msg => messages.push(`${capitalize(key)}: ${msg}`));
          } else {
            messages.push(`${capitalize(key)}: ${error.response.data[key]}`);
          }
        }
        if (messages.length > 0) {
          errorMessage += messages.join('<br/>');
        }
      } else if (typeof error.response.data === 'string') {
        errorMessage += error.response.data;
      } else {
        errorMessage += 'Ocurrió un error desconocido.';
      }

      Swal.fire({
        icon: "error",
        title: "Error",
        html: errorMessage,
      });
    } else if (error.request) {
      console.error("Error al crear tarea: No se recibió respuesta del servidor.");
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se recibió respuesta del servidor.",
      });
    } else {
      console.error("Error al crear tarea:", error.message);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: `No se pudo crear la tarea: ${error.message}`,
      });
    }
    throw error;
  }
};

export const deleteTask = async (taskId) => {
  return await deleteEntity("tasks", taskId);
};

/* --------------------------------------------------------------------------
       FUNCIONES PARA ARTÍCULOS
-------------------------------------------------------------------------- */
export const fetchArticulos = async () => {
  try {
    const response = await api.get("/articulos/");
    // Mapeo de stock_actual a stock_total (opcional si lo usas en frontend)
    const articulosConStockTotal = response.data.map(articulo => ({
      ...articulo,
      stock_total: articulo.stock_actual,
    }));
    return articulosConStockTotal;
  } catch (error) {
    console.error('Error al obtener artículos:', error);
    throw error;
  }
};

export const createArticulo = async (data) => {
  try {
    const response = await api.post("/articulos/", data);
    if (response.data && response.data.id) {
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "Artículo creado correctamente.",
      });
      return response.data;
    } else {
      throw new Error("No se pudo crear el artículo correctamente.");
    }
  } catch (error) {
    console.error('Error al crear artículo:', error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: `No se pudo crear el artículo: ${error.response?.data?.detail || error.message}`,
    });
    throw error;
  }
};

export const actualizarStockMinimo = async (id, stockMinimo) => {
  try {
    const response = await api.put(`/articulos/${id}/actualizar-stock-minimo/`, {
      stock_minimo: stockMinimo,
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response.data.error || "Ocurrió un error al actualizar el stock mínimo.",
      });
    } else if (error.request) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se recibió respuesta del servidor.",
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: `Error: ${error.message}`,
      });
    }
    throw error;
  }
};

export const updateArticulos = async (id, data) => {
  try {
    const response = await api.patch(`/articulos/${id}/`, data);
    Swal.fire({
      icon: "success",
      title: "Éxito",
      text: "Artículo actualizado correctamente.",
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar artículo:', error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: `No se pudo actualizar el artículo: ${error.response?.data?.detail || error.message}`,
    });
    throw error;
  }
};

export const deleteArticulo = async (id) => {
  return await deleteEntity('articulos', id);
};

export const fetchArticuloByNumeroSerie = async (numero_serie) => {
  try {
    const response = await api.get(`/articulos/?numero_serie=${encodeURIComponent(numero_serie)}`);
    return response.data;
  } catch (error) {
    console.error('Error al buscar artículo por número de serie:', error);
    throw error;
  }
};

export const fetchArticuloByCodigoMinvu = async (codigo_minvu) => {
  try {
    const response = await api.get(`/articulos/?codigo_minvu=${encodeURIComponent(codigo_minvu)}`);
    return response.data;
  } catch (error) {
    console.error('Error al buscar artículo por código Minvu:', error);
    throw error;
  }
};

export const fetchArticuloByCodigoInterno = async (codigo_interno) => {
  try {
    const response = await api.get(`/articulos/?codigo_interno=${encodeURIComponent(codigo_interno)}`);
    return response.data;
  } catch (error) {
    console.error('Error al buscar artículo por código interno:', error);
    throw error;
  }
};

export const fetchArticuloByMac = async (mac) => {
  try {
    const response = await api.get(`/articulos/?mac=${encodeURIComponent(mac)}`);
    return response.data;
  } catch (error) {
    console.error('Error al buscar artículo por MAC:', error);
    throw error;
  }
};

/* --------------------------------------------------------------------------
       FUNCIONES PARA ESTADOS
-------------------------------------------------------------------------- */
export const fetchEstados = async () => {
  try {
    const response = await api.get("/estados/");
    return response.data;
  } catch (error) {
    console.error('Error al obtener estados:', error);
    throw error;
  }
};

export const createEstado = async (nombre) => {
  try {
    const response = await api.post("/estados/", { nombre });
    Swal.fire({
      icon: "success",
      title: "Éxito",
      text: "Estado creado correctamente.",
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear estado:', error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: `No se pudo crear el estado: ${error.response?.data?.detail || error.message}`,
    });
    throw error;
  }
};

export const updateEstado = async (id, nombre) => {
  try {
    const response = await api.patch(`/estados/${id}/`, { nombre });
    Swal.fire({
      icon: "success",
      title: "Éxito",
      text: "Estado actualizado correctamente.",
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: `No se pudo actualizar el estado: ${error.response?.data?.detail || error.message}`,
    });
    throw error;
  }
};

export const deleteEstado = async (id) => {
  return await deleteEntity('estados', id);
};

/* --------------------------------------------------------------------------
       FUNCIONES PARA MARCAS
-------------------------------------------------------------------------- */
export const fetchMarcas = async () => {
  try {
    const response = await api.get("/marcas/");
    return response.data;
  } catch (error) {
    console.error('Error al obtener marcas:', error);
    throw error;
  }
};

export const createMarca = async (nombre, descripcion) => {
  try {
    const response = await api.post("/marcas/", { nombre, descripcion });
    Swal.fire({
      icon: "success",
      title: "Éxito",
      text: "Marca creada correctamente.",
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear marca:', error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: `No se pudo crear la marca: ${error.response?.data?.detail || error.message}`,
    });
    throw error;
  }
};

export const updateMarca = async (id, nombre, descripcion) => {
  try {
    const response = await api.patch(`/marcas/${id}/`, { nombre, descripcion });
    Swal.fire({
      icon: "success",
      title: "Éxito",
      text: "Marca actualizada correctamente.",
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar marca:', error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: `No se pudo actualizar la marca: ${error.response?.data?.detail || error.message}`,
    });
    throw error;
  }
};

export const deleteMarca = async (id) => {
  return await deleteEntity('marcas', id);
};

/* --------------------------------------------------------------------------
       FUNCIONES PARA MODELOS
-------------------------------------------------------------------------- */
export const fetchModelos = async () => {
  try {
    const response = await api.get("/modelos/");
    return response.data;
  } catch (error) {
    console.error('Error al obtener modelos:', error);
    throw error;
  }
};

export const createModelo = async (data) => {
  try {
    const response = await api.post("/modelos/", data);
    Swal.fire({
      icon: "success",
      title: "Éxito",
      text: "Modelo creado correctamente.",
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear modelo:', error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: `No se pudo crear el modelo: ${error.response?.data?.detail || error.message}`,
    });
    throw error;
  }
};

export const updateModelo = async (id, data) => {
  try {
    const response = await api.patch(`/modelos/${id}/`, data);
    Swal.fire({
      icon: "success",
      title: "Éxito",
      text: "Modelo actualizado correctamente.",
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar modelo:', error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: `No se pudo actualizar el modelo: ${error.response?.data?.detail || error.message}`,
    });
    throw error;
  }
};

export const deleteModelo = async (id) => {
  return await deleteEntity('modelos', id);
};

/* --------------------------------------------------------------------------
       FUNCIONES PARA MOTIVOS
-------------------------------------------------------------------------- */
export const fetchMotivos = async () => {
  try {
    const response = await api.get("/motivos/");
    return response.data;
  } catch (error) {
    console.error('Error al obtener motivos:', error);
    throw error;
  }
};

export const createMotivo = async (data) => {
  try {
    const response = await api.post("/motivos/", data);
    Swal.fire({
      icon: "success",
      title: "Éxito",
      text: "Motivo creado correctamente.",
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear motivo:', error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: `No se pudo crear el motivo: ${error.response?.data?.detail || error.message}`,
    });
    throw error;
  }
};

export const updateMotivo = async (id, data) => {
  try {
    const response = await api.patch(`/motivos/${id}/`, data);
    Swal.fire({
      icon: "success",
      title: "Éxito",
      text: "Motivo actualizado correctamente.",
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar motivo:', error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: `No se pudo actualizar el motivo: ${error.response?.data?.detail || error.message}`,
    });
    throw error;
  }
};

export const deleteMotivo = async (id) => {
  return await deleteEntity('motivos', id);
};

/* --------------------------------------------------------------------------
       FUNCIONES PARA UBICACIONES
-------------------------------------------------------------------------- */
export const fetchUbicaciones = async () => {
  try {
    const response = await api.get("/ubicaciones/");
    return response.data;
  } catch (error) {
    console.error('Error al obtener ubicaciones:', error);
    throw error;
  }
};

export const createUbicacion = async (data) => {
  try {
    const response = await api.post("/ubicaciones/", data);
    Swal.fire({
      icon: "success",
      title: "Éxito",
      text: "Ubicación creada correctamente.",
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear ubicación:', error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: `No se pudo crear la ubicación: ${error.response?.data?.detail || error.message}`,
    });
    throw error;
  }
};

export const updateUbicacion = async (id, data) => {
  try {
    const response = await api.patch(`/ubicaciones/${id}/`, data);
    Swal.fire({
      icon: "success",
      title: "Éxito",
      text: "Ubicación actualizada correctamente.",
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar ubicación:', error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: `No se pudo actualizar la ubicación: ${error.response?.data?.detail || error.message}`,
    });
    throw error;
  }
};

export const deleteUbicacion = async (id) => {
  return await deleteEntity('ubicaciones', id);
};

/* --------------------------------------------------------------------------
       FUNCIONES PARA USUARIOS
-------------------------------------------------------------------------- */
export const fetchUsuarios = async () => {
  try {
    const response = await api.get("/usuarios/");
    return response.data;
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    throw error;
  }
};

export const createUsuario = async (data) => {
  try {
    const response = await api.post("/usuarios/", data);
    Swal.fire({
      icon: "success",
      title: "Éxito",
      text: "Usuario creado correctamente.",
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear usuario:', error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: `No se pudo crear el usuario: ${error.response?.data?.detail || error.message}`,
    });
    throw error;
  }
};

export const updateUsuario = async (id, data) => {
  try {
    const response = await api.patch(`/usuarios/${id}/`, data);
    Swal.fire({
      icon: "success",
      title: "Éxito",
      text: "Usuario actualizado correctamente.",
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: `No se pudo actualizar el usuario: ${error.response?.data?.detail || error.message}`,
    });
    throw error;
  }
};

export const deleteUsuario = async (id) => {
  return await deleteEntity('usuarios', id);
};

/* --------------------------------------------------------------------------
       FUNCIONES PARA MOVIMIENTOS
-------------------------------------------------------------------------- */
export const fetchMovimientos = async () => {
  try {
    const response = await api.get("/movimientos/");
    return response.data;
  } catch (error) {
    console.error('Error al obtener movimientos:', error);
    throw error;
  }
};

// Función genérica para crear movimientos (POST)
export const createMovimiento = async (data) => {
  try {
    // Definir los campos requeridos según el tipo de movimiento
    const { tipo_movimiento } = data;
    let requiredFields = ['articulo', 'tipo_movimiento', 'cantidad'];
    
    if (tipo_movimiento === 'Prestamo' || tipo_movimiento === 'Regresado') {
      requiredFields.push('personal');
    }
    
    const missingFields = requiredFields.filter(field => !(field in data) || data[field] === null || data[field] === undefined);
    if (missingFields.length > 0) {
      throw new Error(`Faltan los siguientes campos requeridos: ${missingFields.join(", ")}`);
    }

    console.log('Enviando datos a createMovimiento:', data);

    // Eliminar 'fecha' del payload si no es necesario
    const { fecha, ...payload } = data;

    const response = await api.post("/movimientos/", payload);
    if (response.data && response.data.id) {
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: `Movimiento de ${data.tipo_movimiento} creado correctamente.`,
      });
      return response.data;
    } else {
      throw new Error("No se pudo crear el movimiento correctamente.");
    }
  } catch (error) {
    console.error('Error al crear movimiento:', error.response?.data || error.message);
    
    let errorText = 'No se pudo crear el movimiento.';
    if (error.response && error.response.data) {
      if (typeof error.response.data === 'string') {
        errorText = error.response.data;
      } else {
        const messages = [];
        for (const key in error.response.data) {
          if (Array.isArray(error.response.data[key])) {
            error.response.data[key].forEach(msg => messages.push(`${capitalize(key)}: ${msg}`));
          } else {
            messages.push(`${capitalize(key)}: ${error.response.data[key]}`);
          }
        }
        if (messages.length > 0) {
          errorText = messages.join('<br/>');
        }
      }
    } else if (error.message) {
      errorText = error.message;
    }

    Swal.fire({
      icon: "error",
      title: "Error",
      html: errorText,
    });
    throw error;
  }
};

export const updateMovimiento = async (id, data) => {
  try {
    const response = await api.patch(`/movimientos/${id}/`, data);
    Swal.fire({
      icon: "success",
      title: "Éxito",
      text: "Movimiento actualizado correctamente.",
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar movimiento:', error.response?.data || error.message);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: `No se pudo actualizar el movimiento: ${error.response?.data?.detail || error.message}`,
    });
    throw error;
  }
};

export const deleteMovimiento = async (id) => {
  return await deleteEntity('movimientos', id);
};

/* --------------------------------------------------------------------------
       FUNCIONES PARA PERSONAL
-------------------------------------------------------------------------- */
export const fetchPersonal = async () => {
  try {
    const response = await api.get("/personal/");
    return response.data;
  } catch (error) {
    console.error('Error al obtener personal:', error);
    throw error;
  }
};

export const createPersonal = async (data) => {
  try {
    const response = await api.post("/personal/", data);
    Swal.fire({
      icon: "success",
      title: "Éxito",
      text: "Personal creado correctamente.",
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear personal:', error.response?.data || error.message);
    let errorMessage = `No se pudo crear el personal: ${error.response?.data?.detail || error.message}`;
    
    // Manejar errores específicos de campos únicos
    if (error.response && error.response.data) {
      if (error.response.data.correo_institucional) {
        errorMessage = `Correo Institucional: ${error.response.data.correo_institucional.join(", ")}`;
      }
    }
    
    Swal.fire({
      icon: "error",
      title: "Error",
      text: errorMessage,
    });
    throw error;
  }
};

export const updatePersonal = async (id, data) => {
  try {
    const response = await api.patch(`/personal/${id}/`, data);
    Swal.fire({
      icon: "success",
      title: "Éxito",
      text: "Personal actualizado correctamente.",
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar personal:', error.response?.data || error.message);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: `No se pudo actualizar el personal: ${error.response?.data?.detail || error.message}`,
    });
    throw error;
  }
};

export const deletePersonal = async (id) => {
  return await deleteEntity('personal', id);
};

/* --------------------------------------------------------------------------
       FUNCIONES PARA HISTORIAL DE STOCK
-------------------------------------------------------------------------- */
export const fetchHistorialStock = async () => {
  try {
    const response = await api.get("/historial-stock/");
    return response.data;
  } catch (error) {
    console.error('Error al obtener historial de stock:', error);
    throw error;
  }
};

/* --------------------------------------------------------------------------
       FUNCIONES PARA HISTORIAL DE PRESTAMO
-------------------------------------------------------------------------- */
export const fetchHistorialPrestamo = async () => {
  try {
    const response = await api.get("/historial-prestamo/");
    return response.data;
  } catch (error) {
    console.error('Error al obtener historial de préstamo:', error);
    throw error;
  }
};

export const createHistorialPrestamo = async (data) => {
  try {
    const response = await api.post("/historial-prestamo/", data);
    Swal.fire({
      icon: "success",
      title: "Éxito",
      text: "Historial de préstamo creado correctamente.",
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear historial de préstamo:', error.response?.data || error.message);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: `No se pudo crear el historial de préstamo: ${error.response?.data?.detail || error.message}`,
    });
    throw error;
  }
};

export const updateHistorialPrestamo = async (id, data) => {
  try {
    const response = await api.patch(`/historial-prestamo/${id}/`, data);
    Swal.fire({
      icon: "success",
      title: "Éxito",
      text: "Historial de préstamo actualizado correctamente.",
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar historial de préstamo:', error.response?.data || error.message);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: `No se pudo actualizar el historial de préstamo: ${error.response?.data?.detail || error.message}`,
    });
    throw error;
  }
};

export const deleteHistorialPrestamo = async (id) => {
  return await deleteEntity('historial-prestamo', id);
};

/* --------------------------------------------------------------------------
       PRESTAMOS Y DEVOLUCIONES
-------------------------------------------------------------------------- */
export const crearPrestamo = async ({ articulo, cantidad, personal, motivo }) => {
  try {
    const data = {
      articulo: articulo, // ID del artículo
      tipo_movimiento: 'Prestamo',
      cantidad: cantidad,
      personal: personal, // ID del personal
      motivo: motivo, // ID del motivo
    };
    const response = await createMovimiento(data);
    return response;
  } catch (error) {
    console.error('Error al crear préstamo:', error);
    throw error;
  }
};

export const crearRegresado = async ({ articulo, cantidad, personal, motivo }) => {
  try {
    const data = {
      articulo: articulo,
      tipo_movimiento: 'Regresado',
      cantidad: cantidad,
      personal: personal,
      motivo: motivo,
    };
    const response = await createMovimiento(data);
    return response;
  } catch (error) {
    console.error('Error al registrar devolución:', error);
    throw error;
  }
};

// Alias de funciones
export const createPrestamo = crearPrestamo;
export const createRegresado = crearRegresado;

/* --------------------------------------------------------------------------
       FUNCIONES PARA IMPORTACIÓN Y DESCARGA DE PLANTILLAS
-------------------------------------------------------------------------- */
// Función para importar artículos desde un archivo (por ejemplo, Excel)
export const importArticulos = async (formData) => {
  try {
    const response = await api.post('/articulos/importar/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    Swal.fire({
      icon: "success",
      title: "Éxito",
      text: "Artículos importados correctamente.",
    });
    return response.data;
  } catch (error) {
    console.error('Error al importar artículos:', error.response?.data || error.message);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: `No se pudo importar los artículos: ${error.response?.data?.detail || error.message}`,
    });
    throw error;
  }
};

// Función para descargar la plantilla desde el backend (si existe)
export const downloadPlantillaArticulos = async () => {
  try {
    const response = await api.get('/articulos/plantilla/', {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'plantilla_articulos.xlsx'); // Reemplaza con el nombre de tu archivo
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
  } catch (error) {
    console.error('Error al descargar la plantilla de artículos:', error.response?.data || error.message);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: `No se pudo descargar la plantilla de artículos: ${error.response?.data?.detail || error.message}`,
    });
    throw error;
  }
};

/* --------------------------------------------------------------------------
       FUNCIONES ESPECÍFICAS PARA "CAMBIO DE ESTADO POR UNIDAD"
-------------------------------------------------------------------------- */

// Función específica para crear "Cambio de Estado por Unidad" (POST)
export const createCambioEstadoPorUnidad = async ({ articulo, cantidad, estado_nuevo, comentario }) => {
  try {
    // Validaciones básicas en el frontend
    if (!articulo || !cantidad || !estado_nuevo) {
      throw new Error("Los campos 'articulo', 'cantidad' y 'estado_nuevo' son requeridos.");
    }

    // Preparar los datos para la solicitud
    const data = {
      tipo_movimiento: "Cambio de Estado por Unidad",
      articulo: articulo,          // ID del artículo
      cantidad: cantidad,          // Cantidad a transferir
      estado_nuevo: estado_nuevo,  // ID del nuevo estado
      comentario: comentario || `Transferencia de ${cantidad} unidad(es).`,
      motivo: null,                // Puedes asignar un motivo si es necesario
      personal: null,              // No es necesario para este tipo de movimiento
    };

    // Enviar la solicitud POST al backend
    const response = await createMovimiento(data);
    return response;
  } catch (error) {
    console.error('Error al crear Cambio de Estado por Unidad:', error);
    throw error;
  }
};

/* --------------------------------------------------------------------------
       FUNCIONES PARA EXPORTACIÓN DE HISTORIAL DE STOCK (OPCIONAL)
-------------------------------------------------------------------------- */
// Ejemplo de función para exportar historial de stock a un archivo Excel
export const exportHistorialStock = async () => {
  try {
    const response = await api.get('/historial-stock/export/', {
      responseType: 'blob',
    });
    saveAs(response.data, 'historial_stock.xlsx');
    Swal.fire({
      icon: "success",
      title: "Éxito",
      text: "Historial de stock exportado correctamente.",
    });
  } catch (error) {
    console.error('Error al exportar historial de stock:', error.response?.data || error.message);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: `No se pudo exportar el historial de stock: ${error.response?.data?.detail || error.message}`,
    });
    throw error;
  }
};

/* --------------------------------------------------------------------------
       FUNCIONES PARA CATEGORÍAS
-------------------------------------------------------------------------- */
export const fetchCategorias = async () => {
  try {
    const response = await api.get("/categorias/");
    return response.data;
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    throw error;
  }
};

export const createCategoria = async (data) => {
  try {
    const response = await api.post("/categorias/", data);
    Swal.fire({
      icon: "success",
      title: "Éxito",
      text: "Categoría creada correctamente.",
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear categoría:', error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: `No se pudo crear la categoría: ${error.response?.data?.detail || error.message}`,
    });
    throw error;
  }
};

export const updateCategoria = async (id, data) => {
  try {
    const response = await api.patch(`/categorias/${id}/`, data);
    Swal.fire({
      icon: "success",
      title: "Éxito",
      text: "Categoría actualizada correctamente.",
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar categoría:', error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: `No se pudo actualizar la categoría: ${error.response?.data?.detail || error.message}`,
    });
    throw error;
  }
};

export const deleteCategoria = async (id) => {
  return await deleteEntity('categorias', id);
};


/* --------------------------------------------------------------------------
       EXPORTACIÓN DE API
-------------------------------------------------------------------------- */
export default api;
