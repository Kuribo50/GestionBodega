// components/EntradaProducto.jsx

import React, { useState, useEffect } from "react";
import Swal from "sweetalert2"; // SweetAlert2 para notificaciones
import Sidebar from "@/components/Sidebar";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import api from '../services/api'; // Importar el módulo api.js

export default function EntradaProducto() {
  const [formData, setFormData] = useState({
    nombre: "",
    articulo_id: "",
    categoria: "",
    cantidad: "",
    modelo: "",
    marca: "",
    numero_serie: "",
    codigo_minvu: "",
    codigo_interno: "",
    mac: "",
    descripcion: "",
    ubicacion: "",
    motivo: "",
  });

  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [articulos, setArticulos] = useState([]);
  const [motivos, setMotivos] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stockActual, setStockActual] = useState(null);
  const [isArticuloExistente, setIsArticuloExistente] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Realizar solicitudes paralelas usando api.js
      const [
        categoriaData,
        marcaData,
        modeloData,
        ubicacionData,
        articuloData,
        motivoData,
      ] = await Promise.all([
        api.get('/categorias/').then(res => res.data),
        api.get('/marcas/').then(res => res.data),
        api.get('/modelos/').then(res => res.data),
        api.get('/ubicaciones/').then(res => res.data),
        api.get('/articulos/').then(res => res.data),
        api.get('/motivos/').then(res => res.data),
      ]);

      setCategorias(categoriaData);
      setMarcas(marcaData);
      setModelos(modeloData);
      setUbicaciones(ubicacionData);

      // Redefinir la estructura de las opciones del Select
      setArticulos(
        articuloData.map((articulo) => ({
          value: String(articulo.id), // Asegurar que el ID sea una cadena
          nombre: articulo.nombre, // Nombre del artículo
          stock: articulo.stock_actual, // Stock actual
          codes: [
            { label: "Código MINVU", value: articulo.codigo_minvu || "N/A" },
            { label: "Código Interno", value: articulo.codigo_interno || "N/A" },
            { label: "Número de Serie", value: articulo.numero_serie || "N/A" },
            { label: "MAC Address", value: articulo.mac || "N/A" },
          ].filter(code => code.value !== "N/A"), // Filtrar códigos que existen
          categoria: articulo.categoria,
          marca: articulo.marca,
          modelo: articulo.modelo,
          ubicacion: articulo.ubicacion,
          descripcion: articulo.descripcion,
        }))
      );

      setMotivos(
        motivoData.map((motivo) => ({
          label: motivo.nombre,
          value: String(motivo.id), // Asegurar que el ID sea una cadena
        }))
      );
    } catch (error) {
      console.error("Error al cargar los datos de la API:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al cargar los datos de la API.",
        position: "center",
        buttonsStyling: false, // Desactiva los estilos predeterminados
        customClass: {
          confirmButton:
            "bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  const handleNombreChange = (selectedOption) => {
    if (selectedOption) {
      const articulo = articulos.find((a) => a.value === selectedOption.value);
      if (articulo) {
        setFormData({
          ...formData,
          nombre: articulo.nombre,
          articulo_id: articulo.value,
          categoria: articulo.categoria,
          marca: articulo.marca,
          modelo: articulo.modelo,
          ubicacion: articulo.ubicacion,
          numero_serie: articulo.codes.find(code => code.label === "Número de Serie")?.value || "",
          codigo_minvu: articulo.codes.find(code => code.label === "Código MINVU")?.value || "",
          codigo_interno: articulo.codes.find(code => code.label === "Código Interno")?.value || "",
          mac: articulo.codes.find(code => code.label === "MAC Address")?.value || "",
          descripcion: articulo.descripcion || "",
          motivo: "", // Resetear motivo al seleccionar un nuevo artículo
        });
        setStockActual(articulo.stock || 0);
        setIsArticuloExistente(true);
      }
    } else {
      resetForm();
    }
  };

  const handleMotivoChange = async (selectedOption) => {
    if (selectedOption) {
      if (selectedOption.__isNew__) {
        try {
          const response = await api.post('/motivos/', { nombre: selectedOption.label });
          const nuevoMotivo = response.data;
          setMotivos((prevMotivos) => [
            ...prevMotivos,
            { label: nuevoMotivo.nombre, value: String(nuevoMotivo.id) },
          ]);
          setFormData((prev) => ({ ...prev, motivo: String(nuevoMotivo.id) }));
          Swal.fire({
            icon: "success",
            title: "¡Éxito!",
            text: "Motivo creado correctamente.",
            timer: 1500,
            showConfirmButton: false,
            toast: true,
            position: "center",
          });
        } catch (error) {
          console.error("Error al crear el motivo:", error);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Hubo un problema al crear el motivo.",
            position: "center",
            buttonsStyling: false, // Desactiva los estilos predeterminados
            customClass: {
              confirmButton:
                "bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded",
            },
          });
        }
      } else {
        setFormData((prev) => ({ ...prev, motivo: String(selectedOption.value) }));
      }
    } else {
      setFormData((prev) => ({ ...prev, motivo: "" }));
    }
  };

  const validateForm = () => {
    if (!formData.nombre || !formData.cantidad ) {
      Swal.fire({
        icon: "warning",
        title: "Campos requeridos",
        text: "Todos los campos son obligatorios.",
        position: "center",
        buttonsStyling: false, // Desactiva los estilos predeterminados
        customClass: {
          confirmButton:
            "bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded",
        },
      });
      return false;
    }

    // Validación adicional: cantidad debe ser positiva
    const cantidadInt = parseInt(formData.cantidad, 10);
    if (isNaN(cantidadInt) || cantidadInt <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Cantidad inválida",
        text: "La cantidad debe ser un número positivo.",
        position: "center",
        buttonsStyling: false,
        customClass: {
          confirmButton:
            "bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded",
        },
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    try {
      const cantidadInt = parseInt(formData.cantidad, 10);
      let motivoFinal = formData.motivo;

      // Si no se selecciona un motivo, asignar "Entrada de Stock"
      if (!motivoFinal) {
        // Intentar encontrar un motivo existente llamado "Entrada de Stock"
        const entradaMotivo = motivos.find(
          (motivo) => motivo.label.toLowerCase() === "entrada de stock"
        );

        if (entradaMotivo) {
          motivoFinal = entradaMotivo.value;
        } else {
          // Si no existe, crear uno nuevo
          const response = await api.post('/motivos/', { nombre: "Entrada de Stock" });
          const nuevoMotivo = response.data;
          setMotivos((prevMotivos) => [
            ...prevMotivos,
            { label: nuevoMotivo.nombre, value: String(nuevoMotivo.id) },
          ]);
          motivoFinal = String(nuevoMotivo.id);
        }
      }

      const movimientoPayload = {
        articulo: formData.articulo_id,
        tipo_movimiento: "Entrada",
        cantidad: cantidadInt,
        fecha: new Date().toISOString(),
        ubicacion: formData.ubicacion,
        comentario: "Entrada de stock",
        motivo: motivoFinal,
      };

      const response = await api.post('/movimientos/', movimientoPayload);

      if (response.status === 201) { // Asegúrate de que la API devuelve 201 en creación exitosa
        Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          text: "Entrada de stock registrada correctamente.",
          timer: 1500,
          showConfirmButton: false,
          position: "center",
          buttonsStyling: false, // Desactiva los estilos predeterminados
          customClass: {
            confirmButton:
              "bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded",
          },
        });

        // Actualizar el stock actual en el input
        setStockActual((prevStock) => prevStock + cantidadInt);

        // Actualizar el stock en el estado 'articulos'
        setArticulos((prevArticulos) =>
          prevArticulos.map((articulo) =>
            articulo.value === formData.articulo_id
              ? { ...articulo, stock: (articulo.stock || 0) + cantidadInt }
              : articulo
          )
        );

        resetForm();
      } else {
        const errorData = response.data;
        Swal.fire({
          icon: "error",
          title: "Error",
          text: `Hubo un error al registrar la entrada de stock: ${JSON.stringify(
            errorData
          )}`,
          position: "center",
          buttonsStyling: false, // Desactiva los estilos predeterminados
          customClass: {
            confirmButton:
              "bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded",
          },
        });
      }
    } catch (error) {
      console.error("Error al registrar la entrada de stock:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al comunicarse con el servidor.",
        position: "center",
        buttonsStyling: false, // Desactiva los estilos predeterminados
        customClass: {
          confirmButton:
            "bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded",
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    Swal.fire({
      title: "¿Cancelar ingreso?",
      text: "Todos los datos ingresados se perderán.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, cancelar",
      confirmButtonColor: "#d33",
      cancelButtonText: "No, continuar",
      cancelButtonColor: "#3085d6",
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
        Swal.fire({
          icon: "success",
          title: "Cancelado",
          text: "El ingreso fue cancelado.",
          position: "center",
          buttonsStyling: false, // Desactiva los estilos predeterminados
          customClass: {
            confirmButton:
              "bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded",
          },
        });
      }
    });
  };

  const resetForm = () => {
    setFormData({
      nombre: "",
      articulo_id: "",
      categoria: "",
      cantidad: "",
      modelo: "",
      marca: "",
      numero_serie: "",
      codigo_minvu: "",
      codigo_interno: "",
      mac: "",
      descripcion: "",
      ubicacion: "",
      motivo: "",
    });
    setStockActual(null);
    setIsArticuloExistente(false);
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 sm:ml-64 bg-gray-100">
        <h1 className="text-2xl font-bold mb-6">Entrada de Producto</h1>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow mb-6 space-y-4"
        >
          {/* Primera fila: Nombre, Categoría, Cantidad y Stock Actual */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <Select
                options={articulos}
                onChange={handleNombreChange}
                className="w-full"
                placeholder="Seleccionar Producto"
                isLoading={loading}
                value={
                  formData.articulo_id
                    ? articulos.find((art) => art.value === formData.articulo_id) || null
                    : null
                }
                isDisabled={isSubmitting}
                formatOptionLabel={(option) => (
                  <div className="flex flex-col">
                    <span className="font-semibold">{option.nombre}</span>
                    {option.codes.length > 0 && (
                      <span className="text-sm text-gray-500">
                        {option.codes.map((code, index) => (
                          <span key={index}>
                            {code.label}: {code.value}
                            {index < option.codes.length - 1 && " | "}
                          </span>
                        ))}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      Stock: {option.stock}
                    </span>
                  </div>
                )}
                filterOption={(option, inputValue) =>
                  option.data.nombre.toLowerCase().includes(inputValue.toLowerCase())
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría
              </label>
              <input
                type="text"
                value={
                  formData.categoria
                    ? categorias.find((c) => c.id === formData.categoria)?.nombre ||
                      ""
                    : ""
                }
                disabled
                className="w-full border-gray-300 rounded-lg bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad
              </label>
              <input
                type="number"
                name="cantidad"
                value={formData.cantidad}
                onChange={handleChange}
                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                min="1"
                disabled={isSubmitting}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Actual
              </label>
              <input
                type="text"
                value={stockActual !== null ? stockActual : "Sin información"}
                disabled
                className="w-full border-gray-300 rounded-lg bg-gray-100"
              />
            </div>
          </div>

          {/* Segunda fila: Modelo, Marca y Ubicación */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Modelo
              </label>
              <input
                type="text"
                value={
                  formData.modelo
                    ? modelos.find((m) => m.id === formData.modelo)?.nombre || ""
                    : ""
                }
                disabled
                className="w-full border-gray-300 rounded-lg bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Marca
              </label>
              <input
                type="text"
                value={
                  formData.marca
                    ? marcas.find((ma) => ma.id === formData.marca)?.nombre || ""
                    : ""
                }
                disabled
                className="w-full border-gray-300 rounded-lg bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ubicación
              </label>
              <input
                type="text"
                value={
                  formData.ubicacion
                    ? ubicaciones.find((u) => u.id === formData.ubicacion)?.nombre ||
                      ""
                    : ""
                }
                disabled
                className="w-full border-gray-300 rounded-lg bg-gray-100"
              />
            </div>
          </div>

          {/* Tercera fila: Códigos y Descripción */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Serie
              </label>
              <input
                type="text"
                value={formData.numero_serie || ""}
                disabled
                className="w-full border-gray-300 rounded-lg bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                MAC Address
              </label>
              <input
                type="text"
                value={formData.mac || ""}
                disabled
                className="w-full border-gray-300 rounded-lg bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código Interno
              </label>
              <input
                type="text"
                value={formData.codigo_interno || ""}
                disabled
                className="w-full border-gray-300 rounded-lg bg-gray-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código MINVU
              </label>
              <input
                type="text"
                value={formData.codigo_minvu || ""}
                disabled
                className="w-full border-gray-300 rounded-lg bg-gray-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={formData.descripcion || ""}
                disabled
                className="w-full border-gray-300 rounded-lg bg-gray-100"
                rows="2"
              ></textarea>
            </div>
          </div>

          {/* Cuarta fila: Motivo */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo
            </label>
            <CreatableSelect
              name="motivo"
              options={motivos}
              onChange={handleMotivoChange}
              className="w-full"
              isClearable
              placeholder="Seleccionar o Crear Motivo"
              isLoading={loading}
              formatCreateLabel={(inputValue) => `Crear "${inputValue}"`}
              value={
                formData.motivo
                  ? motivos.find((motivo) => motivo.value === formData.motivo) ||
                    null
                  : null
              }
              isDisabled={isSubmitting}
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="mr-4 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 ${
                isSubmitting ? "bg-blue-300 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting ? "Registrando..." : "Registrar Entrada"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
