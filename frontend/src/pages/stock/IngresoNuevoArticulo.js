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
  const { user, loading: userLoading } = useUser();

  const [formData, setFormData] = useState({
    nombre: "",
    categoria: "",
    cantidad: "",
    usuario: "",
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

  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [articulos, setArticulos] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMacEnabled, setIsMacEnabled] = useState(false);

  const isSubmittingRef = useRef(false);
  const [errors, setErrors] = useState({});

  const showSuccess = useCallback((title, text, timer = 1500) => {
    Swal.fire({
      icon: "success",
      title,
      text,
      timer,
      showConfirmButton: false,
      toast: false,
      position: "center",
      buttonsStyling: false,
      customClass: {
        confirmButton: "bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded",
      },
    });
  }, []);

  const showError = useCallback((title, text, timer = 2000) => {
    Swal.fire({
      icon: "error",
      title,
      text,
      timer,
      showConfirmButton: false,
      toast: false,
      position: "center",
      buttonsStyling: false,
      customClass: {
        confirmButton: "bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded",
      },
    });
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      if (!token) {
        showError("Autenticación requerida", "No se encontró un token válido. Redirigiendo al login...");
        setTimeout(() => router.push("/login"), 2000);
        return;
      }

      // Múltiples fetch en paralelo:
      const [catRes, marRes, modRes, estRes, artRes, ubiRes] = await Promise.all([
        fetch("https://web-production-1f58.up.railway.app/api/categorias/", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("https://web-production-1f58.up.railway.app/api/marcas/", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("https://web-production-1f58.up.railway.app/api/modelos/", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("https://web-production-1f58.up.railway.app/api/estados/", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("https://web-production-1f58.up.railway.app/api/articulos/", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("https://web-production-1f58.up.railway.app/api/ubicaciones/", { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const checkUnauthorized = (res) => {
        if (res.status === 401) throw new Error("Unauthorized");
        return res;
      };

      const [catData, marData, modData, estData, artData, ubiData] = await Promise.all([
        checkUnauthorized(catRes).json(),
        checkUnauthorized(marRes).json(),
        checkUnauthorized(modRes).json(),
        checkUnauthorized(estRes).json(),
        checkUnauthorized(artRes).json(),
        checkUnauthorized(ubiRes).json(),
      ]);

      setCategorias(catData.map((c) => ({ label: c.nombre, value: c.id })));
      setMarcas(marData.map((m) => ({ label: m.nombre, value: m.id })));
      setModelos(modData.map((mo) => ({ label: mo.nombre, value: mo.id })));
      setEstados(estData.map((e) => ({ label: e.nombre, value: e.id })));
      setUbicaciones(ubiData.map((u) => ({ label: u.nombre, value: u.id })));

      // Filtra artículos únicos basados en el nombre
      const uniqueArticulos = Array.from(
        new Map(
          artData
            .filter((a) => !!a.nombre)
            .map((a) => [a.nombre.toLowerCase(), a])
        ).values()
      );
      const mappedArticulos = uniqueArticulos.map((a) => ({
        label: a.nombre,
        value: a.id,
        categoria: a.categoria,
        marca: a.marca,
        modelo: a.modelo,
        ubicacion: a.ubicacion,
        // (agrega si necesitas mas campos para "auto-fill")
      }));
      setArticulos(mappedArticulos);
    } catch (error) {
      console.error("Error en fetchData:", error);
      if (error.message === "Unauthorized") {
        showError("Autenticación requerida", "Sesión expirada. Redirigiendo al login...");
        setTimeout(() => router.push("/login"), 2000);
      } else {
        showError("Error", "Error al cargar los datos de la API.");
      }
    } finally {
      setLoading(false);
    }
  }, [router, showError]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const { userLoading: usrLoad, user: usr } = useUser();
  useEffect(() => {
    if (!usrLoad && usr) {
      setFormData((prev) => ({
        ...prev,
        usuario: usr.username || usr.first_name || "",
      }));
    }
  }, [usr, usrLoad]);

  useEffect(() => {
    const categoriasMac = ["pc", "torre", "notebook", "laptop", "desktop"];
    const catSel = categorias.find((c) => c.value === formData.categoria);
    if (catSel && categoriasMac.includes(catSel.label.toLowerCase())) {
      setIsMacEnabled(true);
    } else {
      setIsMacEnabled(false);
      setFormData((prev) => ({ ...prev, mac: "" }));
    }
  }, [formData.categoria, categorias]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleCreateOption = useCallback(
    async (inputValue, apiUrl, setState, fieldName) => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          showError("Autenticación requerida", "No se encontró un token válido. Redirigiendo al login...");
          setTimeout(() => router.push("/login"), 2000);
          return null;
        }

        const resp = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ nombre: inputValue }),
        });
        if (resp.status === 401) {
          showError("Autenticación requerida", "Sesión expirada. Redirigiendo al login...");
          setTimeout(() => router.push("/login"), 2000);
          return null;
        }
        if (resp.ok) {
          const newItem = await resp.json();
          const newOption = { label: newItem.nombre, value: newItem.id };
          setState((prev) => [...prev, newOption]);
          setFormData((prev) => ({ ...prev, [fieldName]: newItem.id }));
          if (fieldName !== "nombre") {
            showSuccess("¡Éxito!", `${inputValue} creado correctamente.`);
          }
          return newItem.id;
        } else {
          const errorData = await resp.json();
          if (
            errorData.nombre &&
            ((typeof errorData.nombre === "string" && errorData.nombre.toLowerCase().includes("unique")) ||
              (Array.isArray(errorData.nombre) &&
                errorData.nombre.some((msg) => typeof msg === "string" && msg.toLowerCase().includes("unique"))))
          ) {
            setErrors((prev) => ({ ...prev, [fieldName]: "Este nombre ya está en uso." }));
          } else {
            showError("Error", `Error al crear el elemento: ${errorData.detail || "Información adicional."}`);
          }
          return null;
        }
      } catch (err) {
        console.error("Error en handleCreateOption:", err);
        showError("Error", "No se pudo crear el elemento.");
        return null;
      }
    },
    [router, showError, showSuccess]
  );

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
    if (isMacEnabled && (!mac || !mac.trim())) {
      newErrors.mac = "El campo MAC Address es obligatorio para la categoría seleccionada.";
      valid = false;
    }

    const duplicateField = articulos.find(
      (a) =>
        a.numero_serie === numero_serie ||
        a.mac === mac ||
        a.codigo_interno === codigo_interno ||
        a.codigo_minvu === codigo_minvu
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

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (isSubmittingRef.current) {
        console.warn("Formulario ya está siendo enviado.");
        return;
      }
      isSubmittingRef.current = true;
      setIsSubmitting(true);
      setErrors({});

      if (!validateForm()) {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
        return;
      }

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
        const response = await fetch("https://web-production-1f58.up.railway.app/api/articulos/", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(finalFormData),
        });

        if (response.ok) {
          showSuccess("¡Éxito!", "Artículo registrado correctamente.");
          resetForm();
        } else if (response.status === 400) {
          const errorData = await response.json();
          let newErrors = {};

          const checkUniqueError = (field, errorMsg) => {
            if (
              errorData[field] &&
              ((typeof errorData[field] === "string" && errorData[field].toLowerCase().includes("unique")) ||
                (Array.isArray(errorData[field]) &&
                  errorData[field].some((msg) => typeof msg === "string" && msg.toLowerCase().includes("unique"))))
            ) {
              newErrors[field] = errorMsg;
            }
          };

          checkUniqueError("nombre", "Este nombre ya está en uso.");
          checkUniqueError("numero_serie", "El número de serie ya está en uso.");
          checkUniqueError("mac", "El MAC Address ya está en uso.");
          checkUniqueError("codigo_interno", "El Código Interno ya está en uso.");
          checkUniqueError("codigo_minvu", "El Código MINVU ya está en uso.");

          setErrors(newErrors);
          if (Object.keys(newErrors).length > 0) {
            showError("Error de Validación", "Por favor, corrige los errores en el formulario.");
          } else {
            showError("Error", errorData.detail || "Hubo un error al registrar el artículo.");
          }
        } else {
          const errorData = await response.json();
          showError("Error", errorData.detail || "Hubo un error al registrar el artículo.");
        }
      } catch (err) {
        console.error("Error en handleSubmit:", err);
        showError("Error", "Error de red o comunicación con el servidor.");
      } finally {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    },
    [formData, validateForm, estados, resetForm, showSuccess, showError]
  );

  const handleCancel = useCallback(() => {
    Swal.fire({
      title: "¿Cancelar ingreso?",
      text: "Todos los datos ingresados se perderán.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "No, continuar",
      position: "center",
      buttonsStyling: false,
      customClass: {
        confirmButton: "bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded",
        cancelButton: "bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        resetForm();
        showSuccess("Cancelado", "El ingreso fue cancelado.");
      }
    });
  }, [resetForm, showSuccess]);

  const handleNombreChange = useCallback((selectedOption) => {
    if (selectedOption) {
      setFormData((prev) => ({
        ...prev,
        nombre: selectedOption.label,
        categoria: selectedOption.categoria || "",
        marca: selectedOption.marca || "",
        modelo: selectedOption.modelo || "",
        ubicacion: selectedOption.ubicacion || "",
      }));
    } else {
      resetForm();
    }
  }, [resetForm]);

  return (
    <>
      {/* Contenedor con bg-gray-100 para que todo tenga el mismo color de fondo */}
      <div className="flex min-h-screen bg-gray-100">
        {/* Sidebar sin bg-white, así no se muestra barra blanca extra */}
        <aside className="hidden md:block w-64 flex-none">
          <Sidebar />
        </aside>

        {/* Contenido principal con p-6, sin margen a la izquierda porque ya es flex */}
        <main className="flex-1 p-6">
          <h1 className="text-2xl font-bold mb-6">Ingresar nuevo artículo</h1>

          {/* Formulario con fondo blanco (card) */}
          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-lg shadow space-y-4"
          >
            {/* Fila 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nombre
                </label>
                <CreatableSelect
                  isClearable
                  isLoading={loading}
                  options={articulos}
                  onChange={handleNombreChange}
                  onCreateOption={(inputValue) =>
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
                  <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>
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
                  onChange={(opt) =>
                    setFormData({
                      ...formData,
                      categoria: opt ? opt.value : "",
                    })
                  }
                  onCreateOption={(inputValue) =>
                    handleCreateOption(
                      inputValue,
                      "https://web-production-1f58.up.railway.app/api/categorias/",
                      setCategorias,
                      "categoria"
                    )
                  }
                  value={
                    formData.categoria
                      ? categorias.find((c) => c.value === formData.categoria) || null
                      : null
                  }
                  placeholder="Seleccionar o crear categoría"
                />
                {errors.categoria && (
                  <p className="text-red-500 text-xs mt-1">{errors.categoria}</p>
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
                  <p className="text-red-500 text-xs mt-1">{errors.cantidad}</p>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Modelo
                </label>
                <CreatableSelect
                  isClearable
                  isLoading={loading}
                  options={modelos}
                  onChange={(opt) =>
                    setFormData({
                      ...formData,
                      modelo: opt ? opt.value : "",
                    })
                  }
                  onCreateOption={(inputValue) =>
                    handleCreateOption(
                      inputValue,
                      "https://web-production-1f58.up.railway.app/api/modelos/",
                      setModelos,
                      "modelo"
                    )
                  }
                  value={
                    formData.modelo
                      ? modelos.find((m) => m.value === formData.modelo) || null
                      : null
                  }
                  placeholder="Seleccionar o crear modelo"
                />
                {errors.modelo && (
                  <p className="text-red-500 text-xs mt-1">{errors.modelo}</p>
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
                  onChange={(opt) =>
                    setFormData({
                      ...formData,
                      marca: opt ? opt.value : "",
                    })
                  }
                  onCreateOption={(inputValue) =>
                    handleCreateOption(
                      inputValue,
                      "https://web-production-1f58.up.railway.app/api/marcas/",
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
                  <p className="text-red-500 text-xs mt-1">{errors.marca}</p>
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
                  onChange={(opt) =>
                    setFormData({
                      ...formData,
                      ubicacion: opt ? opt.value : "",
                    })
                  }
                  onCreateOption={(inputValue) =>
                    handleCreateOption(
                      inputValue,
                      "https://web-production-1f58.up.railway.app/api/ubicaciones/",
                      setUbicaciones,
                      "ubicacion"
                    )
                  }
                  value={
                    formData.ubicacion
                      ? ubicaciones.find((u) => u.value === formData.ubicacion) || null
                      : null
                  }
                  placeholder="Seleccionar o crear ubicación"
                />
                {errors.ubicacion && (
                  <p className="text-red-500 text-xs mt-1">{errors.ubicacion}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Estado
                </label>
                <Select
                  options={estados}
                  onChange={(opt) =>
                    setFormData({
                      ...formData,
                      estado: opt ? opt.value : "",
                    })
                  }
                  value={estados.find((e) => e.value === formData.estado) || null}
                  placeholder="Seleccionar Estado"
                />
                <p className="text-xs text-gray-500 mt-1">
                  * Si no se selecciona nada, se ingresará como &apos;Bueno&apos;.
                </p>
              </div>
            </div>

            {/* Fila 3 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <p className="text-red-500 text-xs mt-1">{errors.numero_serie}</p>
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
                  <p className="text-red-500 text-xs mt-1">{errors.codigo_interno}</p>
                )}
              </div>
            </div>

            {/* Fila 4 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <p className="text-red-500 text-xs mt-1">{errors.codigo_minvu}</p>
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
                />
                {errors.descripcion && (
                  <p className="text-red-500 text-xs mt-1">{errors.descripcion}</p>
                )}
              </div>
            </div>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
              <button
                type="button"
                className="w-full sm:w-auto px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                onClick={handleCancel}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={`w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ${
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
    </>
  );
}
