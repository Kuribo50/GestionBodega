// src/pages/stock/IngresoNuevoArticulo.js

import React, { useState, useEffect, useRef, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import CreatableSelect from "react-select/creatable";
import Select from "react-select";
import Swal from "sweetalert2";
import { useUser } from "@/context/UserContext"; // Asegúrate de que la ruta y mayúsculas sean correctas
import { useRouter } from "next/router";

export default function IngresoNuevoArticulo() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser(); // Obtiene 'user' y 'loading' del contexto

  // Estado del formulario, inicializando 'usuario' desde el contexto
  const [formData, setFormData] = useState({
    nombre: "",
    categoria: "",
    cantidad: "",
    usuario: "", // Se actualizará con el username del contexto
    modelo: "",
    marca: "",
    ubicacion: "",
    numero_serie: "",
    mac: "",
    codigo_interno: "",
    codigo_minvu: "",
    descripcion: "",
    estado: "", // Campo "Estado"
  });

  // Estados para opciones de select
  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [articulos, setArticulos] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]); // Estado para ubicaciones

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMacEnabled, setIsMacEnabled] = useState(false); // Estado para habilitar/deshabilitar MAC Address

  const isSubmittingRef = useRef(false); // Referencia para prevenir doble envío

  // Estado para manejar errores específicos de campos
  const [errors, setErrors] = useState({});

  // Funciones de Notificación Estándar
  const showSuccess = useCallback((title, text, timer = 1500) => {
    Swal.fire({
      icon: "success",
      title: title,
      text: text,
      timer: timer,
      showConfirmButton: false,
      toast: false,
      position: "center",
      buttonsStyling: false,
      customClass: {
        confirmButton:
          "bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded",
      },
    });
  }, []);

  const showError = useCallback((title, text, timer = 2000) => {
    Swal.fire({
      icon: "error",
      title: title,
      text: text,
      timer: timer,
      showConfirmButton: false,
      toast: false,
      position: "center",
      buttonsStyling: false,
      customClass: {
        confirmButton:
          "bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded",
      },
    });
  }, []);

  const showWarning = useCallback((title, text, timer = 2000) => {
    Swal.fire({
      icon: "warning",
      title: title,
      text: text,
      timer: timer,
      showConfirmButton: false,
      toast: false,
      position: "center",
      buttonsStyling: false,
      customClass: {
        confirmButton:
          "bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded",
      },
    });
  }, []);

  // Función para obtener datos de la API
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      console.log("Token obtenido:", token); // Log del token
  
      // Verifica si el token existe
      if (!token) {
        showError(
          "Autenticación requerida",
          "No se encontró un token válido. Redirigiendo al login..."
        );
        setTimeout(() => {
          router.push("/login"); // Redirige al login después de mostrar la notificación
        }, 2000); // Tiempo debe coincidir con el timer de la notificación
        return;
      }
  
      // Realiza múltiples solicitudes en paralelo
      const [
        categoriaRes,
        marcaRes,
        modeloRes,
        estadoRes,
        articuloRes,
        ubicacionRes,
      ] = await Promise.all([
        fetch("http://127.0.0.1:8000/api/categorias/", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://127.0.0.1:8000/api/marcas/", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://127.0.0.1:8000/api/modelos/", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://127.0.0.1:8000/api/estados/", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://127.0.0.1:8000/api/articulos/", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://127.0.0.1:8000/api/ubicaciones/", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
  
      // Maneja respuestas de 401 (no autorizado)
      const checkUnauthorized = (res) => {
        if (res.status === 401) {
          throw new Error("Unauthorized");
        }
        return res;
      };
  
      // Obtiene los datos JSON de las respuestas
      const [
        categoriaData,
        marcaData,
        modeloData,
        estadoData,
        articuloData,
        ubicacionData,
      ] = await Promise.all([
        checkUnauthorized(categoriaRes).json(),
        checkUnauthorized(marcaRes).json(),
        checkUnauthorized(modeloRes).json(),
        checkUnauthorized(estadoRes).json(),
        checkUnauthorized(articuloRes).json(),
        checkUnauthorized(ubicacionRes).json(),
      ]);
  
      console.log("Categorías obtenidas:", categoriaData);
      console.log("Marcas obtenidas:", marcaData);
      console.log("Modelos obtenidos:", modeloData);
      console.log("Estados obtenidos:", estadoData);
      console.log("Artículos obtenidos:", articuloData);
      console.log("Ubicaciones obtenidas:", ubicacionData);
  
      // Mapea los datos a las opciones esperadas por react-select
      setCategorias(categoriaData.map((c) => ({ label: c.nombre, value: c.id })));
      setMarcas(marcaData.map((m) => ({ label: m.nombre, value: m.id })));
      setModelos(modeloData.map((mo) => ({ label: mo.nombre, value: mo.id })));
      setEstados(estadoData.map((estado) => ({ label: estado.nombre, value: estado.id })));
      setUbicaciones(ubicacionData.map((u) => ({ label: u.nombre, value: u.id })));
  
      // Filtra artículos únicos basados en el nombre (ignorando mayúsculas/minúsculas)
      const uniqueArticulos = Array.from(
        new Map(
          articuloData
            .filter((articulo) => {
              if (!articulo.nombre) {
                console.warn("Artículo sin nombre encontrado:", articulo);
                return false; // Filtrar artículos sin nombre
              }
              return true;
            })
            .map((articulo) => [articulo.nombre.toLowerCase(), articulo])
        ).values()
      );
  
      // Mapea los artículos a las opciones esperadas por react-select
      const mappedArticulos = uniqueArticulos.map((articulo) => ({
        label: articulo.nombre,
        value: articulo.id,
        categoria: articulo.categoria,
        marca: articulo.marca,
        modelo: articulo.modelo,
        ubicacion: articulo.ubicacion,
      }));
  
      setArticulos(mappedArticulos);
      console.log("Artículos procesados para el select:", mappedArticulos);
    } catch (error) {
      console.error("Error en fetchData:", error); // Log de errores
      if (error.message === "Unauthorized") {
        showError(
          "Autenticación requerida",
          "Sesión expirada. Redirigiendo al login..."
        );
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        showError("Error", "Error al cargar los datos de la API.");
      }
    } finally {
      setLoading(false);
      console.log("Loading completado."); // Removed 'loading' from log
    }
  }, [router, showError]); // 'loading' no está incluido
  

  // Llama a fetchData al montar el componente
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Actualiza 'usuario' en formData cuando cambia el usuario del contexto
  useEffect(() => {
    if (!userLoading && user) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        usuario: user.username || user.first_name || "",
      }));
    }
  }, [user, userLoading]);

  // Monitorea cambios en 'categoria' para habilitar/deshabilitar el campo 'mac'
  useEffect(() => {
    const categoriasQueRequierenMac = ["pc", "torre", "notebook", "laptop", "desktop"];
    if (formData.categoria) {
      const categoriaSeleccionada = categorias.find((c) => c.value === formData.categoria);
      if (
        categoriaSeleccionada &&
        categoriasQueRequierenMac.includes(categoriaSeleccionada.label.toLowerCase())
      ) {
        setIsMacEnabled(true);
      } else {
        setIsMacEnabled(false);
        setFormData((prevFormData) => ({
          ...prevFormData,
          mac: "", // Limpia el campo 'mac' si se deshabilita
        }));
      }
    } else {
      setIsMacEnabled(false);
    }
  }, [formData.categoria, categorias]);

  // Maneja cambios en los inputs de texto
  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setFormData((prevFormData) => ({
        ...prevFormData,
        [name]: value,
      }));
    },
    []
  );

  /**
   * Maneja la creación de nuevas opciones para los selects.
   * @param {string} inputValue - El valor ingresado por el usuario.
   * @param {string} apiUrl - La URL de la API para crear el nuevo elemento.
   * @param {function} setState - La función para actualizar el estado correspondiente.
   * @param {string} fieldName - El nombre del campo en formData.
   */
  const handleCreateOption = useCallback(
    async (inputValue, apiUrl, setState, fieldName) => {
      try {
        const token = localStorage.getItem("access_token");

        if (!token) {
          showError(
            "Autenticación requerida",
            "No se encontró un token válido. Redirigiendo al login..."
          );
          setTimeout(() => {
            router.push("/login");
          }, 2000);
          return null;
        }

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ nombre: inputValue }),
        });

        if (response.status === 401) {
          showError("Autenticación requerida", "Sesión expirada. Redirigiendo al login...");
          setTimeout(() => {
            router.push("/login");
          }, 2000);
          return null;
        }

        if (response.ok) {
          const newItem = await response.json();
          const newOption = { label: newItem.nombre, value: newItem.id };
          setState((prevItems) => [...prevItems, newOption]);

          setFormData((prevFormData) => ({
            ...prevFormData,
            [fieldName]: newItem.id,
          }));

          // Mostrar notificación solo si el campo no es 'nombre'
          if (fieldName !== "nombre") {
            showSuccess("¡Éxito!", `${inputValue} creado correctamente.`);
          }

          return newItem.id;
        } else {
          const errorData = await response.json();
          // Manejar errores de validación específicos
          if (
            errorData.nombre &&
            ((typeof errorData.nombre === "string" &&
              errorData.nombre.toLowerCase().includes("unique")) ||
              (Array.isArray(errorData.nombre) &&
                errorData.nombre.some(
                  (msg) =>
                    typeof msg === "string" && msg.toLowerCase().includes("unique")
                )))
          ) {
            setErrors((prevErrors) => ({
              ...prevErrors,
              [fieldName]: "Este nombre ya está en uso.",
            }));
          } else {
            showError(
              "Error",
              `Error al crear el elemento: ${
                errorData.detail || "Información adicional."
              }`
            );
          }
          return null;
        }
      } catch (error) {
        console.error("Error en handleCreateOption:", error); // Log de errores
        showError("Error", "No se pudo crear el elemento.");
        return null;
      }
    },
    [router, showError, showSuccess]
  );

  // Valida el formulario antes de enviar
  const validateForm = useCallback(() => {
    const {
      nombre,
      categoria,
      cantidad,
      ubicacion,
      numero_serie,
      mac,
      codigo_interno,
      codigo_minvu,
    } = formData;

    let valid = true;
    let newErrors = {};

    // Validación de campos obligatorios
    if (!nombre.trim()) {
      newErrors.nombre = "El campo Nombre es obligatorio.";
      valid = false;
    }
    if (!categoria) {
      newErrors.categoria = "El campo Categoría es obligatorio.";
      valid = false;
    }
    if (!ubicacion) {
      newErrors.ubicacion = "El campo Ubicación es obligatorio.";
      valid = false;
    }
    if (!cantidad || isNaN(cantidad) || cantidad <= 0) {
      newErrors.cantidad = "El campo Cantidad debe ser un número mayor a 0.";
      valid = false;
    }
    // Verificar que MAC Address sea obligatorio si está habilitado
    if (isMacEnabled && (!mac || !mac.trim())) {
      newErrors.mac =
        "El campo MAC Address es obligatorio para la categoría seleccionada.";
      valid = false;
    }

    // Verifica unicidad de los campos específicos
    const duplicateField = articulos.find(
      (articulo) =>
        articulo.numero_serie === numero_serie ||
        articulo.mac === mac ||
        articulo.codigo_interno === codigo_interno ||
        articulo.codigo_minvu === codigo_minvu
    );

    if (duplicateField) {
      if (duplicateField.numero_serie === numero_serie) {
        newErrors.numero_serie = "El número de serie ya está en uso.";
      }
      if (duplicateField.mac === mac) {
        newErrors.mac = "El MAC Address ya está en uso.";
      }
      if (duplicateField.codigo_interno === codigo_interno) {
        newErrors.codigo_interno = "El Código Interno ya está en uso.";
      }
      if (duplicateField.codigo_minvu === codigo_minvu) {
        newErrors.codigo_minvu = "El Código MINVU ya está en uso.";
      }
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  }, [formData, articulos, isMacEnabled]);

  // Resetea el formulario a los valores iniciales
  const resetForm = useCallback(() => {
    setFormData({
      nombre: "",
      categoria: "",
      cantidad: "",
      usuario: user ? user.username || user.first_name || "" : "",
      modelo: "",
      marca: "",
      ubicacion: "",
      numero_serie: "",
      mac: "",
      codigo_interno: "",
      codigo_minvu: "",
      descripcion: "",
      estado: "",
    });
    setIsMacEnabled(false);
    setErrors({});
  }, [user]);

  // Maneja el envío del formulario
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      console.log("Formulario enviado");

      if (isSubmittingRef.current) {
        console.warn("Formulario ya está siendo enviado.");
        return;
      }

      isSubmittingRef.current = true;
      setIsSubmitting(true);
      setErrors({}); // Resetear errores anteriores

      if (!validateForm()) {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
        return;
      }

      // Asegurarse de que el estado sea "Bueno" si no se selecciona ninguno
      const finalFormData = {
        ...formData,
        numero_serie: formData.numero_serie || null,
        mac: formData.mac || null,
        codigo_interno: formData.codigo_interno || null,
        codigo_minvu: formData.codigo_minvu || null,
        estado:
          formData.estado ||
          estados.find((e) => e.label.toLowerCase() === "bueno")?.value ||
          null,
      };

      try {
        const token = localStorage.getItem("access_token");
        const response = await fetch("http://127.0.0.1:8000/api/articulos/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(finalFormData),
        });

        if (response.ok) {
          showSuccess("¡Éxito!", "Artículo registrado correctamente.");
          resetForm(); // Limpia el formulario tras crear el artículo
        } else if (response.status === 400) {
          const errorData = await response.json();
          let newErrors = {};

          // Manejar errores de validación específicos con tipo de dato chequeado
          if (
            errorData.nombre &&
            ((typeof errorData.nombre === "string" &&
              errorData.nombre.toLowerCase().includes("unique")) ||
              (Array.isArray(errorData.nombre) &&
                errorData.nombre.some(
                  (msg) =>
                    typeof msg === "string" && msg.toLowerCase().includes("unique")
                )))
          ) {
            newErrors.nombre = "Este nombre ya está en uso.";
          }
          if (
            errorData.numero_serie &&
            ((typeof errorData.numero_serie === "string" &&
              errorData.numero_serie.toLowerCase().includes("unique")) ||
              (Array.isArray(errorData.numero_serie) &&
                errorData.numero_serie.some(
                  (msg) =>
                    typeof msg === "string" && msg.toLowerCase().includes("unique")
                )))
          ) {
            newErrors.numero_serie = "El número de serie ya está en uso.";
          }
          if (
            errorData.mac &&
            ((typeof errorData.mac === "string" &&
              errorData.mac.toLowerCase().includes("unique")) ||
              (Array.isArray(errorData.mac) &&
                errorData.mac.some(
                  (msg) =>
                    typeof msg === "string" && msg.toLowerCase().includes("unique")
                )))
          ) {
            newErrors.mac = "El MAC Address ya está en uso.";
          }
          if (
            errorData.codigo_interno &&
            ((typeof errorData.codigo_interno === "string" &&
              errorData.codigo_interno.toLowerCase().includes("unique")) ||
              (Array.isArray(errorData.codigo_interno) &&
                errorData.codigo_interno.some(
                  (msg) =>
                    typeof msg === "string" && msg.toLowerCase().includes("unique")
                )))
          ) {
            newErrors.codigo_interno = "El Código Interno ya está en uso.";
          }
          if (
            errorData.codigo_minvu &&
            ((typeof errorData.codigo_minvu === "string" &&
              errorData.codigo_minvu.toLowerCase().includes("unique")) ||
              (Array.isArray(errorData.codigo_minvu) &&
                errorData.codigo_minvu.some(
                  (msg) =>
                    typeof msg === "string" && msg.toLowerCase().includes("unique")
                )))
          ) {
            newErrors.codigo_minvu = "El Código MINVU ya está en uso.";
          }

          setErrors(newErrors);

          if (Object.keys(newErrors).length > 0) {
            showError(
              "Error de Validación",
              "Por favor, corrige los errores en el formulario."
            );
          } else {
            showError(
              "Error",
              errorData.detail ||
                "Hubo un error al registrar el artículo."
            );
          }
        } else {
          const errorData = await response.json();
          showError(
            "Error",
            errorData.detail ||
              "Hubo un error al registrar el artículo."
          );
        }
      } catch (error) {
        console.error("Error en handleSubmit:", error);
        showError(
          "Error",
          "Error de red o comunicación con el servidor."
        );
      } finally {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    },
    [formData, validateForm, estados, resetForm, showSuccess, showError]
  );

  // Maneja la cancelación del formulario
  const handleCancel = useCallback(() => {
    Swal.fire({
      title: "¿Cancelar ingreso?",
      text: "Todos los datos ingresados se perderán.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "No, continuar",
      position: "center",
      buttonsStyling: false, // Desactiva los estilos predeterminados
      customClass: {
        confirmButton:
          "bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded",
        cancelButton:
          "bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        resetForm();
        showSuccess("Cancelado", "El ingreso fue cancelado.");
      }
    });
  }, [resetForm, showSuccess]);

  // Maneja cambios en el campo 'nombre'
  const handleNombreChange = useCallback(
    (selectedOption) => {
      if (selectedOption) {
        setFormData((prevFormData) => ({
          ...prevFormData,
          nombre: selectedOption.label,
          categoria: selectedOption.categoria || "",
          marca: selectedOption.marca || "",
          modelo: selectedOption.modelo || "",
          ubicacion: selectedOption.ubicacion || "",
          numero_serie: selectedOption.numero_serie || "",
          codigo_minvu: selectedOption.codigo_minvu || "",
          codigo_interno: selectedOption.codigo_interno || "",
          mac: selectedOption.mac || "",
          descripcion: selectedOption.descripcion || "",
        }));
      } else {
        resetForm();
      }
    },
    [resetForm]
  );

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 sm:ml-64 bg-gray-100">
        <h1 className="text-2xl font-bold mb-6">Ingresar nuevo artículo</h1>
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow space-y-4"
        >
          {/* Fila 1 */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nombre
              </label>
              <CreatableSelect
                isClearable
                isLoading={loading}
                options={articulos}
                onChange={handleNombreChange}
                onCreateOption={async (inputValue) =>
                  setFormData((prev) => ({ ...prev, nombre: inputValue }))
                }
                value={
                  formData.nombre
                    ? { label: formData.nombre, value: formData.nombre }
                    : null
                }
                placeholder="Seleccionar o crear producto"
              />
              {errors.nombre && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.nombre}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Categoría
              </label>
              <CreatableSelect
                isClearable
                isLoading={loading}
                options={categorias}
                onChange={(selectedOption) =>
                  setFormData({
                    ...formData,
                    categoria: selectedOption ? selectedOption.value : "",
                  })
                }
                onCreateOption={(inputValue) =>
                  handleCreateOption(
                    inputValue,
                    "http://127.0.0.1:8000/api/categorias/",
                    setCategorias,
                    "categoria"
                  )
                }
                value={
                  formData.categoria
                    ? categorias.find((c) => c.value === formData.categoria) ||
                      null
                    : null
                }
                placeholder="Seleccionar o crear categoría"
              />
              {errors.categoria && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.categoria}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Cantidad
              </label>
              <input
                type="number"
                name="cantidad"
                value={formData.cantidad}
                onChange={handleChange}
                className={`w-full border-gray-300 rounded-lg ${
                  errors.cantidad ? "border-red-500" : ""
                }`}
                min="1"
              />
              {errors.cantidad && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.cantidad}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Usuario
              </label>
              <input
                type="text"
                name="usuario"
                value={formData.usuario}
                className="w-full border-gray-300 rounded-lg"
                disabled
              />
            </div>
          </div>

          {/* Fila 2 */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Modelo
              </label>
              <CreatableSelect
                isClearable
                isLoading={loading}
                options={modelos}
                onChange={(selectedOption) =>
                  setFormData({
                    ...formData,
                    modelo: selectedOption ? selectedOption.value : "",
                  })
                }
                onCreateOption={(inputValue) =>
                  handleCreateOption(
                    inputValue,
                    "http://127.0.0.1:8000/api/modelos/",
                    setModelos,
                    "modelo"
                  )
                }
                value={
                  formData.modelo
                    ? modelos.find((mo) => mo.value === formData.modelo) ||
                      null
                    : null
                }
                placeholder="Seleccionar o crear modelo"
              />
              {errors.modelo && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.modelo}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Marca
              </label>
              <CreatableSelect
                isClearable
                isLoading={loading}
                options={marcas}
                onChange={(selectedOption) =>
                  setFormData({
                    ...formData,
                    marca: selectedOption ? selectedOption.value : "",
                  })
                }
                onCreateOption={(inputValue) =>
                  handleCreateOption(
                    inputValue,
                    "http://127.0.0.1:8000/api/marcas/",
                    setMarcas,
                    "marca"
                  )
                }
                value={
                  formData.marca
                    ? marcas.find((m) => m.value === formData.marca) || null
                    : null
                }
                placeholder="Seleccionar o crear marca"
              />
              {errors.marca && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.marca}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Ubicación
              </label>
              <CreatableSelect
                isClearable
                isLoading={loading}
                options={ubicaciones}
                onChange={(selectedOption) =>
                  setFormData({
                    ...formData,
                    ubicacion: selectedOption ? selectedOption.value : "",
                  })
                }
                onCreateOption={(inputValue) =>
                  handleCreateOption(
                    inputValue,
                    "http://127.0.0.1:8000/api/ubicaciones/",
                    setUbicaciones,
                    "ubicacion"
                  )
                }
                value={
                  formData.ubicacion
                    ? ubicaciones.find((u) => u.value === formData.ubicacion) ||
                      null
                    : null
                }
                placeholder="Seleccionar o crear ubicación"
              />
              {errors.ubicacion && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.ubicacion}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Estado
              </label>
              <Select
                options={estados}
                onChange={(selectedOption) =>
                  setFormData({
                    ...formData,
                    estado: selectedOption ? selectedOption.value : "",
                  })
                }
                value={
                  estados.find((e) => e.value === formData.estado) || null
                }
                placeholder="Seleccionar Estado"
              />
              <p className="text-xs text-gray-500 mt-1">
                * Si no se selecciona nada, se ingresará como &apos;Bueno&apos;.
              </p>
              {errors.estado && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.estado}
                </p>
              )}
            </div>
          </div>

          {/* Fila 3 */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Número de Serie
              </label>
              <input
                type="text"
                name="numero_serie"
                value={formData.numero_serie}
                onChange={handleChange}
                className={`w-full border-gray-300 rounded-lg ${
                  errors.numero_serie ? "border-red-500" : ""
                }`}
              />
              {errors.numero_serie && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.numero_serie}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                MAC Address
              </label>
              <input
                type="text"
                name="mac"
                value={formData.mac}
                onChange={handleChange}
                className={`w-full border-gray-300 rounded-lg ${
                  errors.mac ? "border-red-500" : ""
                }`}
                disabled={!isMacEnabled}
                placeholder={isMacEnabled ? "Ingrese MAC Address" : "No aplica"}
              />
              {errors.mac && (
                <p className="text-red-500 text-xs mt-1">{errors.mac}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Código Interno
              </label>
              <input
                type="text"
                name="codigo_interno"
                value={formData.codigo_interno}
                onChange={handleChange}
                className={`w-full border-gray-300 rounded-lg ${
                  errors.codigo_interno ? "border-red-500" : ""
                }`}
              />
              {errors.codigo_interno && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.codigo_interno}
                </p>
              )}
            </div>
          </div>

          {/* Fila 4 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Código MINVU
              </label>
              <input
                type="text"
                name="codigo_minvu"
                value={formData.codigo_minvu}
                onChange={handleChange}
                className={`w-full border-gray-300 rounded-lg ${
                  errors.codigo_minvu ? "border-red-500" : ""
                }`}
              />
              {errors.codigo_minvu && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.codigo_minvu}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Descripción
              </label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                className={`w-full border-gray-300 rounded-lg ${
                  errors.descripcion ? "border-red-500" : ""
                }`}
                rows="2"
              ></textarea>
              {errors.descripcion && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.descripcion}
                </p>
              )}
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
              onClick={handleCancel}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 ${
                isSubmitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Guardando..." : "Registrar Entrada"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
