// components/CambioEstadoArticulo.jsx

import React, { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import Sidebar from "@/components/Sidebar";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";

// Función para obtener clases de color según el estado (solo texto)
const getEstadoColor = (estado) => {
  if (estado === "Bueno") return "text-green-600 font-bold";
  if (estado === "Malo") return "text-red-600 font-bold";
  if (estado === "En reparación") return "text-orange-600 font-bold";
  if (estado === "De baja") return "text-red-600 font-bold";
  return "text-gray-600 font-bold";
};

export default function CambioEstadoArticulo() {
  // Estado para el formulario
  const [formData, setFormData] = useState({
    articulo_id: "",
    estado_id: "",
    motivo_id: "", // Nuevo campo para motivo
    cantidad_transferir: "1", // Inicialmente 1
  });

  // Estado para seleccionar el tipo de movimiento
  const [tipoMovimientoSeleccionado, setTipoMovimientoSeleccionado] = useState("Cambio de Estado");

  // Estados para las opciones de los selects
  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [articulos, setArticulos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [motivos, setMotivos] = useState([]); // Nuevo estado para motivos
  const [historiaStock, setHistoriaStock] = useState([]);

  // Estado para manejar la carga
  const [loading, setLoading] = useState(true);

  // Estado para el artículo seleccionado (almacena solo el ID)
  const [articuloSeleccionado, setArticuloSeleccionado] = useState(null);

  // Estado para los detalles del artículo
  const [detalleArticulo, setDetalleArticulo] = useState({
    categoria: "N/A",
    marca: "N/A",
    modelo: "N/A",
    ubicacion: "N/A",
    estado: "N/A",
    nombre: "N/A",
    stock_minimo: "N/A",
    stock_actual: "N/A",
    descripcion: "N/A",
    codigo_interno: "N/A",
    codigo_minvu: "N/A",
    numero_serie: "N/A",
    mac: "N/A",
  });

  // Funciones separadas para fetch de cada entidad
  const fetchCategorias = useCallback(async (token) => {
    const response = await fetch("https://web-production-1f58.up.railway.app/api/categorias/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    // Ordenar alfabéticamente
    const sortedData = data.sort((a, b) => a.nombre.localeCompare(b.nombre));
    return sortedData.map((c) => ({ label: c.nombre, value: c.id }));
  }, []);

  const fetchMarcas = useCallback(async (token) => {
    const response = await fetch("https://web-production-1f58.up.railway.app/api/marcas/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    const sortedData = data.sort((a, b) => a.nombre.localeCompare(b.nombre));
    return sortedData.map((m) => ({ label: m.nombre, value: m.id }));
  }, []);

  const fetchModelos = useCallback(async (token) => {
    const response = await fetch("https://web-production-1f58.up.railway.app/api/modelos/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    const sortedData = data.sort((a, b) => a.nombre.localeCompare(b.nombre));
    return sortedData.map((m) => ({ label: m.nombre, value: m.id }));
  }, []);

  const fetchUbicaciones = useCallback(async (token) => {
    const response = await fetch("https://web-production-1f58.up.railway.app/api/ubicaciones/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    const sortedData = data.sort((a, b) => a.nombre.localeCompare(b.nombre));
    return sortedData.map((u) => ({ label: u.nombre, value: u.id }));
  }, []);

  const fetchArticulos = useCallback(async (token) => {
    const response = await fetch("https://web-production-1f58.up.railway.app/api/articulos/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    const sortedData = data.sort((a, b) => a.nombre.localeCompare(b.nombre));
    return sortedData.map((a) => ({
      nombre: a.nombre, // Agregado
      value: a.id, // Mantener como número
      categoria_id: a.categoria,
      marca_id: a.marca,
      modelo_id: a.modelo,
      ubicacion_id: a.ubicacion,
      estado_id: a.estado,
      stock_minimo: a.stock_minimo,
      stock_actual: a.stock_actual,
      descripcion: a.descripcion,
      codigo_interno: a.codigo_interno,
      codigo_minvu: a.codigo_minvu,
      numero_serie: a.numero_serie,
      mac: a.mac,
      codes: [ // Agregado
        { label: "Código MINVU", value: a.codigo_minvu || "N/A" },
        { label: "Código Interno", value: a.codigo_interno || "N/A" },
        { label: "Número de Serie", value: a.numero_serie || "N/A" },
        { label: "MAC Address", value: a.mac || "N/A" },
      ].filter((code) => code.value !== "N/A"), // Filtrar códigos que existen
    }));
  }, []);

  const fetchEstados = useCallback(async (token) => {
    const response = await fetch("https://web-production-1f58.up.railway.app/api/estados/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    const sortedData = data.sort((a, b) => a.nombre.localeCompare(b.nombre));
    return sortedData.map((est) => ({ label: est.nombre, value: est.id }));
  }, []);

  const fetchMotivos = useCallback(async (token) => { // Nuevo
    const response = await fetch("https://web-production-1f58.up.railway.app/api/motivos/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    const sortedData = data.sort((a, b) => a.nombre.localeCompare(b.nombre));
    return sortedData.map((m) => ({ label: m.nombre, value: m.id }));
  }, []);

  // Función principal para obtener todos los datos
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");

      const [
        categoriasData,
        marcasData,
        modelosData,
        ubicacionesData,
        articulosData,
        estadosData,
        motivosData, // Nuevo
        historiaStockData,
      ] = await Promise.all([
        fetchCategorias(token),
        fetchMarcas(token),
        fetchModelos(token),
        fetchUbicaciones(token),
        fetchArticulos(token),
        fetchEstados(token),
        fetchMotivos(token), // Nuevo
        fetch("https://web-production-1f58.up.railway.app/api/historial-stock/", {
          headers: { Authorization: `Bearer ${token}` },
        }).then((res) => res.json()),
      ]);

      setCategorias(categoriasData);
      setMarcas(marcasData);
      setModelos(modelosData);
      setUbicaciones(ubicacionesData);
      setArticulos(articulosData);
      setEstados(estadosData);
      setMotivos(motivosData); // Nuevo
      setHistoriaStock(historiaStockData);
      console.log("Artículos:", articulosData); // Para depuración
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al cargar los datos de la API.",
        position: "center",
        confirmButtonColor: "#2563EB", // Tailwind blue-600
        customClass: {
          confirmButton:
            "bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded",
        },
      });
    } finally {
      setLoading(false);
    }
  }, [fetchCategorias, fetchMarcas, fetchModelos, fetchUbicaciones, fetchArticulos, fetchEstados, fetchMotivos]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Función para obtener el nombre de una entidad por su ID
  const getNombrePorId = (id, lista) => {
    const item = lista.find((elemento) => elemento.value === id);
    return item ? item.label : "N/A";
  };

  // Manejar el cambio de artículo
  const handleArticuloChange = (selectedOption) => {
    if (selectedOption) {
      setArticuloSeleccionado(selectedOption.value);
      setFormData({ 
        ...formData, 
        articulo_id: selectedOption.value,
        estado_id: "", // Resetear estado_id al cambiar de artículo
        motivo_id: "", // Resetear motivo_id al cambiar de artículo
      });

      // Obtener detalles del artículo seleccionado
      const detalles = articulos.find(
        (articulo) => articulo.value === selectedOption.value
      );
      if (detalles) {
        const estado = estados.find((est) => est.value === detalles.estado_id);
        setDetalleArticulo({
          categoria: getNombrePorId(detalles.categoria_id, categorias),
          marca: getNombrePorId(detalles.marca_id, marcas),
          modelo: getNombrePorId(detalles.modelo_id, modelos),
          ubicacion: getNombrePorId(detalles.ubicacion_id, ubicaciones),
          estado: estado ? estado.label : "N/A",
          nombre: detalles.nombre || "N/A",
          stock_minimo:
            detalles.stock_minimo !== null ? detalles.stock_minimo : "N/A",
          stock_actual:
            detalles.stock_actual !== null ? detalles.stock_actual : "N/A",
          descripcion: detalles.descripcion || "N/A",
          codigo_interno: detalles.codigo_interno || "N/A",
          codigo_minvu: detalles.codigo_minvu || "N/A",
          numero_serie: detalles.numero_serie || "N/A",
          mac: detalles.mac || "N/A",
        });
      }
    } else {
      setArticuloSeleccionado(null);
      setFormData({ ...formData, articulo_id: "", estado_id: "", motivo_id: "", cantidad_transferir: "1" });
      setDetalleArticulo({
        categoria: "N/A",
        marca: "N/A",
        modelo: "N/A",
        ubicacion: "N/A",
        estado: "N/A",
        nombre: "N/A",
        stock_minimo: "N/A",
        stock_actual: "N/A",
        descripcion: "N/A",
        codigo_interno: "N/A",
        codigo_minvu: "N/A",
        numero_serie: "N/A",
        mac: "N/A",
      });
    }
  };

  // Manejar el cambio de estado
  const handleEstadoChange = (selectedOption) => {
    setFormData({
      ...formData,
      estado_id: selectedOption ? selectedOption.value : "",
    });
  };

  // Manejar la creación de un nuevo estado
  const handleEstadoCreate = async (inputValue) => {
    const token = localStorage.getItem("access_token");
    try {
      const response = await fetch("https://web-production-1f58.up.railway.app/api/estados/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nombre: inputValue }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al crear el nuevo estado.");
      }
      const nuevoEstado = await response.json();
      const nuevoEstadoFormateado = {
        label: nuevoEstado.nombre,
        value: nuevoEstado.id,
      };
      setEstados((prev) => [...prev, nuevoEstadoFormateado]);
      setFormData({ ...formData, estado_id: nuevoEstado.id });
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: `Estado "${nuevoEstado.nombre}" creado correctamente.`,
        position: "center",
        confirmButtonColor: "#2563EB", // Tailwind blue-600
        customClass: {
          confirmButton:
            "bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded",
        },
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "No se pudo crear el estado.",
        position: "center",
        confirmButtonColor: "#DC2626", // Tailwind red-600
        customClass: {
          confirmButton:
            "bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded",
        },
      });
    }
  };

  // Manejar la creación de un nuevo motivo
  const handleMotivoCreate = async (inputValue) => {
    const token = localStorage.getItem("access_token");
    try {
      const response = await fetch("https://web-production-1f58.up.railway.app/api/motivos/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nombre: inputValue }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al crear el nuevo motivo.");
      }
      const nuevoMotivo = await response.json();
      const nuevoMotivoFormateado = {
        label: nuevoMotivo.nombre,
        value: nuevoMotivo.id,
      };
      setMotivos((prev) => [...prev, nuevoMotivoFormateado]);
      setFormData({ ...formData, motivo_id: nuevoMotivo.id });
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: `Motivo "${nuevoMotivo.nombre}" creado correctamente.`,
        position: "center",
        confirmButtonColor: "#2563EB", // Tailwind blue-600
        customClass: {
          confirmButton:
            "bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded",
        },
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "No se pudo crear el motivo.",
        position: "center",
        confirmButtonColor: "#DC2626", // Tailwind red-600
        customClass: {
          confirmButton:
            "bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded",
        },
      });
    }
  };

  // Función auxiliar para mostrar alertas con botones personalizados
  const showAlert = (icon, title, text) => {
    let buttonColor = "bg-blue-600 hover:bg-blue-700"; // Default: blue

    if (icon === "error") {
      buttonColor = "bg-red-600 hover:bg-red-700";
    } else if (icon === "warning") {
      buttonColor = "bg-yellow-500 hover:bg-yellow-600";
    } else if (icon === "info") {
      buttonColor = "bg-blue-600 hover:bg-blue-700";
    } else if (icon === "success") {
      buttonColor = "bg-green-600 hover:bg-green-700";
    }

    Swal.fire({
      icon,
      title,
      text,
      position: "center",
      buttonsStyling: false, // Desactiva los estilos predeterminados
      customClass: {
        confirmButton: `${buttonColor} text-white font-bold py-2 px-4 rounded`,
      },
    });
  };

  // Manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar campos requeridos
    if (!formData.articulo_id || !formData.estado_id || !formData.motivo_id) {
      showAlert(
        "warning",
        "Campos incompletos",
        "Debes seleccionar un artículo, un estado y un motivo."
      );
      return;
    }

    // Obtener el artículo actual
    const articuloActual = articulos.find(
      (articulo) => articulo.value === formData.articulo_id
    );

    // Obtener el token de autenticación
    const token = localStorage.getItem("access_token");
    if (!token) {
      showAlert("error", "Error", "No se encontró el token de autenticación.");
      return;
    }

    // Crear el payload según el tipo de movimiento
    let payloadMovimiento = {
      articulo: formData.articulo_id,
      tipo_movimiento: tipoMovimientoSeleccionado,
      comentario: tipoMovimientoSeleccionado === "Cambio de Estado" 
        ? `Cambio de estado a "${getNombrePorId(formData.estado_id, estados)}" por motivo "${getNombrePorId(formData.motivo_id, motivos)}"`
        : `Cambio de estado por unidad a "${getNombrePorId(formData.estado_id, estados)}" por motivo "${getNombrePorId(formData.motivo_id, motivos)}"`,
      estado_nuevo: formData.estado_id,
      motivo: formData.motivo_id, // Nuevo campo
    };

    if (tipoMovimientoSeleccionado === "Cambio de Estado por Unidad") {
      payloadMovimiento.cantidad = parseInt(formData.cantidad_transferir, 10);
    }

    // Validaciones específicas
    if (tipoMovimientoSeleccionado === "Cambio de Estado por Unidad") {
      const cantidadInt = parseInt(formData.cantidad_transferir, 10);
      if (isNaN(cantidadInt) || cantidadInt <= 0) {
        showAlert(
          "warning",
          "Cantidad Inválida",
          "La cantidad a transferir debe ser un número válido mayor a cero."
        );
        return;
      }

      if (cantidadInt > detalleArticulo.stock_actual && cantidadInt > 0) {
        showAlert(
          "warning",
          "Stock Insuficiente",
          `La cantidad a transferir (${cantidadInt}) excede el stock actual (${detalleArticulo.stock_actual}).`
        );
        return;
      }
    }

    // Loggear el payload para depuración
    console.log("Payload enviado al backend:", payloadMovimiento);

    try {
      // Registrar el movimiento
      const respuestaMovimiento = await fetch(
        "https://web-production-1f58.up.railway.app/api/movimientos/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payloadMovimiento),
        }
      );

      if (respuestaMovimiento.ok) {
        showAlert(
          "success",
          "Éxito",
          "Movimiento registrado correctamente."
        );

        const movimientoCreado = await respuestaMovimiento.json();

        // Actualizar el estado en la lista local de artículos si fue un cambio de estado
        if (tipoMovimientoSeleccionado === "Cambio de Estado") {
          setArticulos((prevArticulos) =>
            prevArticulos.map((articulo) =>
              articulo.value === formData.articulo_id
                ? { ...articulo, estado_id: formData.estado_id }
                : articulo
            )
          );

          // Actualizar el estado en detalleArticulo
          const estadoNuevoNombre = getNombrePorId(formData.estado_id, estados);
          setDetalleArticulo((prev) => ({
            ...prev,
            estado: estadoNuevoNombre,
          }));
        }

        // Actualizar el stock_actual si fue un cambio de estado por unidad
        if (tipoMovimientoSeleccionado === "Cambio de Estado por Unidad") {
          const cantidadInt = parseInt(formData.cantidad_transferir, 10);
          setDetalleArticulo((prev) => ({
            ...prev,
            stock_actual:
              prev.stock_actual !== "N/A"
                ? prev.stock_actual - cantidadInt
                : prev.stock_actual,
          }));
        }

        // Limpiar el formulario
        setFormData({ articulo_id: "", estado_id: "", motivo_id: "", cantidad_transferir: "1" });
        setArticuloSeleccionado(null);
        setTipoMovimientoSeleccionado("Cambio de Estado");

        // Limpiar la tarjeta de detalles después de 5 segundos
        setTimeout(() => {
          setDetalleArticulo({
            categoria: "N/A",
            marca: "N/A",
            modelo: "N/A",
            ubicacion: "N/A",
            estado: "N/A",
            nombre: "N/A",
            stock_minimo: "N/A",
            stock_actual: "N/A",
            descripcion: "N/A",
            codigo_interno: "N/A",
            codigo_minvu: "N/A",
            numero_serie: "N/A",
            mac: "N/A",
          });
        }, 5000);
      } else {
        const errorData = await respuestaMovimiento.json();
        showAlert(
          "error",
          "Error al registrar el movimiento",
          errorData.detail || "No se pudo registrar el movimiento."
        );
        console.error("Error al registrar el movimiento:", errorData);
      }
    } catch (error) {
      showAlert(
        "error",
        "Error",
        "Error al comunicarse con el servidor."
      );
      console.error("Error al comunicarse con el servidor:", error);
    }
  };

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 sm:ml-64">
        <h1 className="text-2xl font-bold mb-6">Gestión de Movimientos de Artículo</h1>
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow mb-6 space-y-4"
        >
          {/* Selección del Tipo de Movimiento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Movimiento
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="tipoMovimiento"
                  value="Cambio de Estado"
                  checked={tipoMovimientoSeleccionado === "Cambio de Estado"}
                  onChange={(e) => setTipoMovimientoSeleccionado(e.target.value)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <span className="ml-2">Cambio de Estado</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="tipoMovimiento"
                  value="Cambio de Estado por Unidad"
                  checked={tipoMovimientoSeleccionado === "Cambio de Estado por Unidad"}
                  onChange={(e) => setTipoMovimientoSeleccionado(e.target.value)}
                  className="h-4 w-4 text-purple-600 border-gray-300 rounded"
                />
                <span className="ml-2">Cambio de Estado por Unidad</span>
              </label>
            </div>
          </div>

          {/* Selector de Artículo */}
          <div>
            <label
              htmlFor="articulo"
              className="block text-sm font-medium text-gray-700"
            >
              Artículo
            </label>
            <Select
              id="articulo"
              value={
                articulos.find((a) => a.value === articuloSeleccionado) ||
                null
              }
              options={articulos}
              onChange={handleArticuloChange}
              className="mt-2"
              placeholder={
                loading ? "Cargando artículos..." : "Seleccione un artículo"
              }
              isDisabled={loading || articulos.length === 0}
              noOptionsMessage={() => "No hay artículos disponibles"}
              formatOptionLabel={(option) => {
                const estado = estados.find((est) => est.value === option.estado_id);
                return (
                  <div className="flex flex-col">
                    <span className="font-semibold">{option.nombre}</span>
                    {option.codes && option.codes.length > 0 && (
                      <span className="text-sm text-gray-500">
                        {option.codes.map((code, index) => (
                          <span key={index}>
                            {code.label}: {code.value}
                            {index < option.codes.length - 1 && " | "}
                          </span>
                        ))}
                      </span>
                    )}
                    <span className={`${getEstadoColor(estado?.label)}`}>
                      {estado ? estado.label : "N/A"}
                    </span>
                  </div>
                );
              }}
              filterOption={(option, inputValue) => {
                const nombre = option.data.nombre.toLowerCase();
                const codigoMinvu = option.data.codigo_minvu
                  ? option.data.codigo_minvu.toLowerCase()
                  : "";
                const codigoInterno = option.data.codigo_interno
                  ? option.data.codigo_interno.toLowerCase()
                  : "";
                const numeroSerie = option.data.numero_serie
                  ? option.data.numero_serie.toLowerCase()
                  : "";
                const mac = option.data.mac ? option.data.mac.toLowerCase() : "";

                return (
                  nombre.includes(inputValue.toLowerCase()) ||
                  codigoMinvu.includes(inputValue.toLowerCase()) ||
                  codigoInterno.includes(inputValue.toLowerCase()) ||
                  numeroSerie.includes(inputValue.toLowerCase()) ||
                  mac.includes(inputValue.toLowerCase())
                );
              }}
            />
          </div>

          {/* Selector de Estado y Motivo (Solo para Cambio de Estado y Cambio de Estado por Unidad) */}
          {(tipoMovimientoSeleccionado === "Cambio de Estado" || tipoMovimientoSeleccionado === "Cambio de Estado por Unidad") && (
            <>
              <div>
                <label
                  htmlFor="estado"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nuevo Estado
                </label>
                <CreatableSelect
                  id="estado"
                  value={
                    estados.find((est) => est.value === formData.estado_id) ||
                    null
                  }
                  options={estados}
                  onChange={handleEstadoChange}
                  onCreateOption={handleEstadoCreate}
                  className="mt-2"
                  placeholder={
                    loading ? "Cargando estados..." : "Seleccione o cree un estado"
                  }
                  isDisabled={loading || estados.length === 0}
                  noOptionsMessage={() => "No hay estados disponibles"}
                  formatOptionLabel={(option) => (
                    <span className={`${getEstadoColor(option.label)}`}>
                      {option.label}
                    </span>
                  )}
                />
              </div>

              <div>
                <label
                  htmlFor="motivo"
                  className="block text-sm font-medium text-gray-700"
                >
                  Motivo
                </label>
                <CreatableSelect
                  id="motivo"
                  value={
                    motivos.find((mot) => mot.value === formData.motivo_id) ||
                    null
                  }
                  options={motivos}
                  onChange={(selectedOption) =>
                    setFormData({ ...formData, motivo_id: selectedOption ? selectedOption.value : "" })
                  }
                  onCreateOption={handleMotivoCreate}
                  className="mt-2"
                  placeholder={
                    loading ? "Cargando motivos..." : "Seleccione o cree un motivo"
                  }
                  isDisabled={loading || motivos.length === 0}
                  noOptionsMessage={() => "No hay motivos disponibles"}
                  formatOptionLabel={(option) => (
                    <span className={`${getEstadoColor(option.label)}`}>
                      {option.label}
                    </span>
                  )}
                />
              </div>
            </>
          )}

          {/* Campo de Cantidad a Transferir (Solo para Cambio de Estado por Unidad) */}
          {tipoMovimientoSeleccionado === "Cambio de Estado por Unidad" && (
            <div>
              <label
                htmlFor="cantidad_transferir"
                className="block text-sm font-medium text-gray-700"
              >
                Cantidad a Transferir
              </label>
              <input
                type="number"
                name="cantidad_transferir"
                id="cantidad_transferir"
                value={formData.cantidad_transferir}
                onChange={(e) => setFormData({ ...formData, cantidad_transferir: e.target.value })}
                className={`mt-2 w-full border border-gray-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500`}
                min="1"
                max={detalleArticulo.stock_actual !== "N/A" ? detalleArticulo.stock_actual : undefined}
                required={tipoMovimientoSeleccionado === "Cambio de Estado por Unidad"}
              />
            </div>
          )}

          {/* Botón de Enviar */}
          <div className="mt-6">
            <button
              type="submit"
              className={`w-full bg-purple-600 text-white py-2 rounded-md shadow hover:bg-purple-700 ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={loading}
            >
              {loading ? "Procesando..." : "Registrar Movimiento"}
            </button>
          </div>
        </form>

        {/* Detalles del Artículo */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold">Detalles del Artículo</h2>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <strong>Nombre:</strong> {detalleArticulo.nombre}
            </div>
            <div>
              <strong>Categoría:</strong> {detalleArticulo.categoria}
            </div>
            <div>
              <strong>Marca:</strong> {detalleArticulo.marca}
            </div>
            <div>
              <strong>Modelo:</strong> {detalleArticulo.modelo}
            </div>
            <div>
              <strong>Ubicación:</strong> {detalleArticulo.ubicacion}
            </div>
            <div>
              <strong>Estado:</strong>{" "}
              <span className={`${getEstadoColor(detalleArticulo.estado)}`}>
                {detalleArticulo.estado}
              </span>
            </div>
            <div>
              <strong>Descripción:</strong> {detalleArticulo.descripcion}
            </div>
            <div>
              <strong>Stock Mínimo:</strong> {detalleArticulo.stock_minimo}
            </div>
            <div>
              <strong>Stock Actual:</strong> {detalleArticulo.stock_actual}
            </div>
            <div>
              <strong>Código Interno:</strong> {detalleArticulo.codigo_interno}
            </div>
            <div>
              <strong>Código Minvu:</strong> {detalleArticulo.codigo_minvu}
            </div>
            <div>
              <strong>Número de Serie:</strong> {detalleArticulo.numero_serie}
            </div>
            <div>
              <strong>MAC:</strong> {detalleArticulo.mac}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
