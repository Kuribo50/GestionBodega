// src/pages/stock/ingreso.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import dynamic from 'next/dynamic';
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { ToastContainer, toast } from "react-toastify";
import { FaPlus, FaTrash, FaSave, FaTimes } from "react-icons/fa";
import "react-toastify/dist/ReactToastify.css";
import { components } from 'react-select';

// Importar funciones de la API
import {
  fetchCategorias,
  createCategoria,
  fetchMarcas,
  createMarca,
  fetchModelos,
  createModelo,
  fetchUbicaciones,
  createUbicacion,
  fetchEstados,
  createArticulo,
  searchArticulos,
  createMovimiento,
  fetchArticuloByNumeroSerie,
  fetchArticuloByCodigoMinvu,
  fetchArticuloByCodigoInterno,
  fetchArticuloByMac,
} from "../../services/api"; // Ajusta la ruta según tu estructura de carpetas

// Importar react-select sin SSR
const AsyncCreatableSelect = dynamic(() => import('react-select/async-creatable'), { ssr: false });
const AsyncSelect = dynamic(() => import('react-select/async'), { ssr: false });

// Componente personalizado para mostrar más información en las opciones del select
const Option = (props) => (
  <components.Option {...props}>
    <div>
      <strong>{props.data.label}</strong>
      <div style={{ fontSize: 'small', color: '#555' }}>
        Código Interno: {props.data.codigo_interno || "N/A"} | Código MINVU: {props.data.codigo_minvu || "N/A"}
      </div>
    </div>
  </components.Option>
);

// Función auxiliar para capitalizar cadenas
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export default function IngresoArticulo() {
  // Configuración de react-hook-form
  const { control, register, handleSubmit, reset, setValue, getValues, watch, formState: { errors } } = useForm({
    mode: "onSubmit", // Validación solo al enviar
    defaultValues: {
      products: [
        {
          nombre: null,
          articulo_id: "",
          categoria: null,
          cantidad: "",
          modelo: null,
          marca: null,
          numero_serie: "",
          codigo_minvu: "",
          codigo_interno: "",
          mac: "",
          descripcion: "",
          ubicacion: null,
          estado: null,
          stockActual: null,
          isArticuloExistente: false,
          isMacEnabled: false,
          uniqueFieldsModified: false, // Indica si se han modificado los campos únicos
          // Campos para almacenar los valores originales de los campos únicos
          numero_serie_original: "",
          codigo_minvu_original: "",
          codigo_interno_original: "",
          mac_original: "",
        },
      ],
    },
  });

  // Uso de useFieldArray para manejar múltiples productos
  const { fields, append, remove } = useFieldArray({ control, name: "products" });

  // Estados para almacenar datos obtenidos de la API
  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [estadoOptions, setEstadoOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Ref para scroll automático al agregar un nuevo producto
  const newProductRef = useRef(null);

  // Refs para manejar el debounce en la búsqueda de artículos
  const debounceTimeout = useRef(null);
  const latestInputValue = useRef({});

  // Función para obtener o crear nuevas opciones (categoría, marca, etc.)
  const getOrCreate = async (tipo, inputValue, opcionesActuales) => {
    try {
      const existe = opcionesActuales.find(
        (opcion) => opcion.nombre.toLowerCase() === inputValue.toLowerCase()
      );
      if (existe) return existe.id;

      let nuevaOpcion;
      switch (tipo) {
        case "categorias":
          nuevaOpcion = await createCategoria(inputValue);
          setCategorias((prev) => [...prev, nuevaOpcion]);
          break;
        case "marcas":
          nuevaOpcion = await createMarca(inputValue);
          setMarcas((prev) => [...prev, nuevaOpcion]);
          break;
        case "modelos":
          nuevaOpcion = await createModelo(inputValue);
          setModelos((prev) => [...prev, nuevaOpcion]);
          break;
        case "ubicaciones":
          nuevaOpcion = await createUbicacion(inputValue);
          setUbicaciones((prev) => [...prev, nuevaOpcion]);
          break;
        default:
          throw new Error("Tipo desconocido para crear una nueva opción.");
      }

      return nuevaOpcion.id;
    } catch (error) {
      console.error(`Error al crear ${tipo.slice(0, -1)}:`, error);
      toast.error(
        `Error al crear ${tipo.slice(0, -1)}: ${error.response?.data?.message || "No se pudo crear."}`,
        { position: "top-center", theme: "colored" }
      );
      return null;
    }
  };

  // Función para obtener datos iniciales al cargar el componente
  const fetchData = async () => {
    try {
      setLoading(true);
      const [
        categoriaData,
        marcaData,
        modeloData,
        ubicacionData,
        estadoData
      ] = await Promise.all([
        fetchCategorias(),
        fetchMarcas(),
        fetchModelos(),
        fetchUbicaciones(),
        fetchEstados(),
      ]);

      setCategorias(categoriaData);
      setMarcas(marcaData);
      setModelos(modeloData);
      setUbicaciones(ubicacionData);
      setEstadoOptions(
        estadoData.map((estado) => ({
          value: estado.id,
          label: capitalize(estado.nombre),
        }))
      );

      setLoading(false);
    } catch (error) {
      console.error("Error al cargar los datos:", error);
      toast.error("Error al cargar los datos iniciales.", { position: "top-center", theme: "colored" });
      setLoading(false);
    }
  };

  // useEffect para cargar los datos iniciales al montar el componente
  useEffect(() => {
    fetchData();
  }, []);

  // Función para crear nuevos artículos en el backend
  const createNewArticles = async (data) => {
    const newArticles = data.products.filter((product) => !product.isArticuloExistente);
    for (let product of newArticles) {
      try {
        const articuloPayload = {
          nombre: product.nombre.label,
          codigo_interno: product.codigo_interno || null,
          codigo_minvu: product.codigo_minvu || null,
          categoria: product.categoria,
          marca: product.marca,
          modelo: product.modelo,
          ubicacion: product.ubicacion,
          cantidad: parseInt(product.cantidad, 10),
          descripcion: product.descripcion || "Ingreso inicial de artículo.",
          estado: product.estado ? product.estado : obtenerEstadoPorDefecto(),
          numero_serie: product.numero_serie || null,
          mac: product.isMacEnabled ? product.mac : null,
        };

        console.log(`Artículo ${product.nombre.label} Payload:`, articuloPayload);
        const newArticulo = await createArticulo(articuloPayload);
        if (newArticulo && newArticulo.id) {
          product.articulo_id = newArticulo.id;
          product.isArticuloExistente = true;
          product.isMacEnabled =
            newArticulo.categoria_nombre === "PCs" ||
            newArticulo.categoria_nombre === "PC" ||
            newArticulo.categoria_nombre === "Torre" ||
            newArticulo.categoria_nombre === "Torres" ||
            newArticulo.categoria_nombre === "Notebook";
        } else {
          throw new Error("El artículo creado no tiene un ID.");
        }
      } catch (error) {
        console.error(`Error al crear el artículo "${product.nombre?.label}":`, error);
        // El toast de error ya está manejado en api.js
      }
    }
  };

  // Función para cargar opciones de artículos con debounce personalizado
  const loadOptionsArticulos = useCallback((inputValue, callback) => {
    // Limpiar el timeout anterior
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Guardar el valor actual del input
    latestInputValue.current = inputValue;

    if (!inputValue.trim()) {
      callback([]); // No hacer solicitud si el input está vacío o solo espacios
      return;
    }

    // Establecer un nuevo timeout
    debounceTimeout.current = setTimeout(async () => {
      try {
        const data = await searchArticulos(inputValue);
        const formatted = data.map((articulo) => ({
          label: articulo.nombre,
          value: articulo.id,
          codigo_interno: articulo.codigo_interno || "N/A",
          codigo_minvu: articulo.codigo_minvu || "N/A",
          ...articulo,
        }));
        callback(formatted);
      } catch (error) {
        console.error("Error al cargar articulos:", error);
        callback([]);
      }
    }, 500); // 500ms de espera
  }, []);

  // Función para manejar cambios en la selección de nombre de artículo
  const handleNombreChange = (index, selectedOption) => {
    const updatedProducts = [...getValues("products")];
    if (selectedOption) {
      if (selectedOption.__isNew__) {
        // Creando un nuevo artículo
        updatedProducts[index] = {
          ...updatedProducts[index],
          nombre: selectedOption,
          isArticuloExistente: false,
          uniqueFieldsModified: true, // Necesita validación de unicidad
          articulo_id: "",
          // Limpiar los valores originales
          numero_serie_original: "",
          codigo_minvu_original: "",
          codigo_interno_original: "",
          mac_original: "",
        };
        console.log(`Artículo ${index + 1} está siendo creado como nuevo.`);
      } else {
        // Seleccionando un artículo existente
        const articulo = selectedOption;
        updatedProducts[index] = {
          ...updatedProducts[index],
          nombre: selectedOption,
          articulo_id: articulo.value, // ID del artículo
          categoria: articulo.categoria || null,
          marca: articulo.marca || null,
          modelo: articulo.modelo || null,
          ubicacion: articulo.ubicacion || null,
          cantidad: "",
          numero_serie: articulo.numero_serie || "",
          codigo_minvu: articulo.codigo_minvu || "",
          codigo_interno: articulo.codigo_interno || "",
          mac: articulo.mac || "",
          descripcion: articulo.descripcion || "",
          estado: articulo.estado ? articulo.estado.id : obtenerEstadoPorDefecto(),
          stockActual: articulo.stock_actual || 0,
          isArticuloExistente: true,
          isMacEnabled:
            articulo.categoria_nombre === "PCs" ||
            articulo.categoria_nombre === "PC" ||
            articulo.categoria_nombre === "Torre" ||
            articulo.categoria_nombre === "Torres" ||
            articulo.categoria_nombre === "Notebook",
          uniqueFieldsModified: false, // No necesita validación si no se modifican los campos únicos
          numero_serie_original: articulo.numero_serie || "",
          codigo_minvu_original: articulo.codigo_minvu || "",
          codigo_interno_original: articulo.codigo_interno || "",
          mac_original: articulo.mac || "",
        };
        console.log(`Artículo ${index + 1} seleccionado como existente.`);
      }
    } else {
      // Si se limpia el nombre
      updatedProducts[index] = {
        nombre: null,
        articulo_id: "",
        categoria: null,
        cantidad: "",
        modelo: null,
        marca: null,
        ubicacion: null,
        numero_serie: "",
        codigo_minvu: "",
        codigo_interno: "",
        mac: "",
        descripcion: "",
        estado: null,
        stockActual: null,
        isArticuloExistente: false,
        isMacEnabled: false,
        uniqueFieldsModified: false,
        numero_serie_original: "",
        codigo_minvu_original: "",
        codigo_interno_original: "",
        mac_original: "",
      };
      console.log(`Artículo ${index + 1} limpiado.`);
    }
    setValue("products", updatedProducts);
  };

  // Función para manejar cambios en la selección de categoría
  const handleCategoriaSelect = (index, selectedOption) => {
    const updatedProducts = [...getValues("products")];
    if (selectedOption) {
      updatedProducts[index].categoria = selectedOption.value;
      const categoriaSeleccionada = categorias.find((c) => c.id === selectedOption.value);
      // Definir las categorías que requieren MAC Address
      const categoriasConMac = ["PCs", "PC", "Torre", "Torres", "Notebook"];
      updatedProducts[index].isMacEnabled = categoriasConMac.includes(categoriaSeleccionada?.nombre);
      if (!updatedProducts[index].isMacEnabled) {
        updatedProducts[index].mac = "";
      }
    } else {
      updatedProducts[index].categoria = null;
      updatedProducts[index].isMacEnabled = false;
      updatedProducts[index].mac = "";
    }
    // No es necesario marcar uniqueFieldsModified aquí
    setValue("products", updatedProducts);
  };

  // Función para manejar cambios en la selección de marca
  const handleMarcaSelect = (index, selectedOption) => {
    const updatedProducts = [...getValues("products")];
    updatedProducts[index].marca = selectedOption ? selectedOption.value : null;
    // No es necesario marcar uniqueFieldsModified aquí
    setValue("products", updatedProducts);
  };

  // Función para manejar cambios en la selección de modelo
  const handleModeloSelect = (index, selectedOption) => {
    const updatedProducts = [...getValues("products")];
    updatedProducts[index].modelo = selectedOption ? selectedOption.value : null;
    // No es necesario marcar uniqueFieldsModified aquí
    setValue("products", updatedProducts);
  };

  // Función para manejar cambios en la selección de ubicación
  const handleUbicacionSelect = (index, selectedOption) => {
    const updatedProducts = [...getValues("products")];
    updatedProducts[index].ubicacion = selectedOption ? selectedOption.value : null;
    // No es necesario marcar uniqueFieldsModified aquí
    setValue("products", updatedProducts);
  };

  // Función para manejar cambios en la selección de estado
  const handleEstadoChange = (index, selectedOption) => {
    const updatedProducts = [...getValues("products")];
    updatedProducts[index].estado = selectedOption ? selectedOption.value : obtenerEstadoPorDefecto();
    setValue("products", updatedProducts);
  };

  // Funciones para cargar opciones en los selects
  const loadOptionsCategoria = (inputValue, callback) => {
    const filtered = categorias
      .filter((c) => c.nombre.toLowerCase().includes(inputValue.toLowerCase()))
      .map((c) => ({ label: c.nombre, value: c.id }));
    callback(filtered);
  };

  const loadOptionsMarca = (inputValue, callback) => {
    const filtered = marcas
      .filter((m) => m.nombre.toLowerCase().includes(inputValue.toLowerCase()))
      .map((m) => ({ label: m.nombre, value: m.id }));
    callback(filtered);
  };

  const loadOptionsModelo = (inputValue, callback) => {
    const filtered = modelos
      .filter((m) => m.nombre.toLowerCase().includes(inputValue.toLowerCase()))
      .map((m) => ({ label: m.nombre, value: m.id }));
    callback(filtered);
  };

  const loadOptionsUbicacion = (inputValue, callback) => {
    const filtered = ubicaciones
      .filter((u) => u.nombre.toLowerCase().includes(inputValue.toLowerCase()))
      .map((u) => ({ label: u.nombre, value: u.id }));
    callback(filtered);
  };

  // Función para cargar opciones de estado
  const loadOptionsEstado = async (inputValue, callback) => {
    try {
      // Filtrar estados localmente
      const filtered = estadoOptions
        .filter((e) => e.label.toLowerCase().includes(inputValue.toLowerCase()))
        .map((e) => ({ label: e.label, value: e.value }));
      callback(filtered);
    } catch (error) {
      console.error("Error al cargar estados:", error);
      callback([]);
    }
  };

  // Función para obtener el estado por defecto (Bueno)
  const obtenerEstadoPorDefecto = () => {
    const estadoBueno = estadoOptions.find((estado) => estado.label.toLowerCase() === "bueno");
    return estadoBueno ? estadoBueno.value : null;
  };

  // Función para validar los campos del artículo antes de enviar
  const validateArticle = (product, index, allProducts) => {
    const errorsList = [];
    const isEmpty = (val) => val === null || val === "" || val === undefined;

    // Validaciones de campos obligatorios
    if (isEmpty(product.nombre)) errorsList.push(`Artículo ${index + 1}: El campo Nombre es obligatorio.`);
    if (isEmpty(product.categoria)) errorsList.push(`Artículo ${index + 1}: El campo Categoría es obligatorio.`);
    if (isEmpty(product.marca)) errorsList.push(`Artículo ${index + 1}: El campo Marca es obligatorio.`);
    if (isEmpty(product.modelo)) errorsList.push(`Artículo ${index + 1}: El campo Modelo es obligatorio.`);
    if (isEmpty(product.ubicacion)) errorsList.push(`Artículo ${index + 1}: El campo Ubicación es obligatorio.`);

    // Validación de la cantidad
    if (isEmpty(product.cantidad)) {
      errorsList.push(`Artículo ${index + 1}: El campo Cantidad es obligatorio.`);
    } else if (isNaN(product.cantidad) || parseInt(product.cantidad, 10) < 1) {
      errorsList.push(`Artículo ${index + 1}: La Cantidad debe ser un número mayor o igual a 1.`);
    }

    // Validar campos únicos solo si han sido modificados
    const uniqueFieldCheck = (fieldName, fieldLabel, originalValue) => {
      if (product[fieldName] && product[fieldName] !== originalValue) {
        // Verificar duplicados dentro del formulario actual
        const duplicate = allProducts.some((p, idx) => p[fieldName] === product[fieldName] && idx !== index);
        if (duplicate) errorsList.push(`Artículo ${index + 1}: El ${fieldLabel} "${product[fieldName]}" ya ha sido ingresado.`);
      }
    };

    uniqueFieldCheck("numero_serie", "Número de Serie", product.numero_serie_original);
    uniqueFieldCheck("mac", "MAC Address", product.mac_original);
    uniqueFieldCheck("codigo_interno", "Código Interno", product.codigo_interno_original);
    uniqueFieldCheck("codigo_minvu", "Código MINVU", product.codigo_minvu_original);

    // Validar MAC Address si está habilitado
    if (product.isMacEnabled) {
      if (isEmpty(product.mac)) {
        errorsList.push(`Artículo ${index + 1}: El campo MAC Address es obligatorio para esta categoría.`);
      } else {
        const macRegex = /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/i;
        if (!macRegex.test(product.mac)) {
          errorsList.push(`Artículo ${index + 1}: La MAC Address no tiene un formato válido (ej: 00:1B:44:11:3A:B7).`);
        }
      }
    }

    return errorsList;
  };

  // Función para validar la unicidad de los campos únicos en el backend
  const validateUniqueFields = async (products) => {
    const errorsList = [];

    // Array para almacenar promesas de validación
    const validationPromises = products.map(async (product, index) => {
      if (!product.uniqueFieldsModified) return; // Solo validar si los campos únicos han sido modificados

      const { numero_serie, codigo_minvu, codigo_interno, mac, articulo_id, isMacEnabled } = product;

      // Array para almacenar promesas de búsqueda por cada campo único
      const fieldPromises = [];

      if (numero_serie) {
        fieldPromises.push(
          fetchArticuloByNumeroSerie(numero_serie, articulo_id).then((res) => ({
            field: "Número de Serie",
            value: numero_serie,
            exists: res.length > 0,
          }))
        );
      }

      if (codigo_minvu) {
        fieldPromises.push(
          fetchArticuloByCodigoMinvu(codigo_minvu, articulo_id).then((res) => ({
            field: "Código MINVU",
            value: codigo_minvu,
            exists: res.length > 0,
          }))
        );
      }

      if (codigo_interno) {
        fieldPromises.push(
          fetchArticuloByCodigoInterno(codigo_interno, articulo_id).then((res) => ({
            field: "Código Interno",
            value: codigo_interno,
            exists: res.length > 0,
          }))
        );
      }

      if (mac && isMacEnabled) {
        fieldPromises.push(
          fetchArticuloByMac(mac, articulo_id).then((res) => ({
            field: "MAC Address",
            value: mac,
            exists: res.length > 0,
          }))
        );
      }

      // Ejecutar todas las búsquedas simultáneamente
      const results = await Promise.all(fieldPromises);

      // Verificar resultados
      results.forEach((result) => {
        if (result.exists) {
          errorsList.push(`Artículo ${index + 1}: El ${result.field} "${result.value}" ya está en uso.`);
        }
      });
    });

    // Esperar a que todas las validaciones terminen
    await Promise.all(validationPromises);

    return errorsList;
  };

  // Función para manejar el envío del formulario
  const onSubmit = async (data) => {
    // Verificar si el usuario está autenticado
    const accessToken = localStorage.getItem("access_token"); // Usa 'access_token' según tu UserContext
    if (!accessToken) {
      toast.error("Debes estar autenticado para registrar artículos.");
      setLoading(false);
      return;
    }

    setLoading(true);
    toast.dismiss();

    const allErrors = [];
    const successMessages = [];

    // Validar campos requeridos y duplicados dentro del formulario
    data.products.forEach((product, index) => {
      const validationErrors = validateArticle(product, index, data.products);
      if (validationErrors.length > 0) {
        allErrors.push(...validationErrors);
      }
    });

    // Si hay errores de validación local, mostrar y detener
    if (allErrors.length > 0) {
      toast.error(
        <div>
          <strong>Errores:</strong>
          <ul>{allErrors.map((error, idx) => <li key={idx}>{error}</li>)}</ul>
        </div>,
        { position: "top-center", autoClose: false, theme: "colored" }
      );
      setLoading(false);
      return;
    }

    // Validar unicidad de campos únicos en el backend
    try {
      const uniqueFieldErrors = await validateUniqueFields(data.products);
      if (uniqueFieldErrors.length > 0) {
        allErrors.push(...uniqueFieldErrors);
      }
    } catch (error) {
      console.error("Error al validar campos únicos:", error);
      allErrors.push("Ocurrió un error al validar los campos únicos.");
    }

    // Si hay errores de validación de unicidad, mostrar y detener
    if (allErrors.length > 0) {
      toast.error(
        <div>
          <strong>Errores:</strong>
          <ul>{allErrors.map((error, idx) => <li key={idx}>{error}</li>)}</ul>
        </div>,
        { position: "top-center", autoClose: false, theme: "colored" }
      );
      setLoading(false);
      return;
    }

    try {
      // Crear artículos nuevos si es necesario
      await createNewArticles(data);

      // Luego, crear movimientos para todos los productos
      for (let i = 0; i < data.products.length; i++) {
        const product = data.products[i];
        const { categoria, marca, modelo, ubicacion, estado, isArticuloExistente, articulo_id } = product;

        if (!categoria || !marca || !modelo || !ubicacion) {
          allErrors.push(`Artículo ${i + 1}: Falta información requerida.`);
          continue;
        }

        // Crear movimiento de entrada
        const movimientoPayload = {
          articulo: articulo_id,
          tipo_movimiento: "Entrada",
          cantidad: parseInt(product.cantidad, 10),
          ubicacion: ubicacion,
          comentario: isArticuloExistente ? "Actualización de stock." : "Ingreso de nuevo artículo.",
          motivo: null, // Ajusta si es necesario
          estado: estado ? estado : obtenerEstadoPorDefecto(),
        };

        await createMovimiento(movimientoPayload);

        if (!isArticuloExistente) {
          successMessages.push(`Artículo ${i + 1} - Nuevo artículo "${product.nombre.label}" creado exitosamente.`);
        } else {
          successMessages.push(`Artículo ${i + 1} - Cantidad actualizada exitosamente.`);
        }
      }

      // Mostrar errores si los hay
      if (allErrors.length > 0) {
        toast.error(
          <div>
            <strong>Errores:</strong>
            <ul>{allErrors.map((error, idx) => <li key={idx}>{error}</li>)}</ul>
          </div>,
          { position: "top-center", autoClose: false, theme: "colored" }
        );
      }

      // Mostrar mensajes de éxito si los hay
      if (successMessages.length > 0) {
        successMessages.forEach((msg) => {
          toast.success(msg, { position: "top-center", autoClose: 5000, theme: "colored" });
        });
      }

      // Si no hay errores y hay mensajes de éxito, resetear el formulario
      if (allErrors.length === 0 && successMessages.length > 0) {
        reset({
          products: [
            {
              nombre: null,
              articulo_id: "",
              categoria: null,
              cantidad: "",
              modelo: null,
              marca: null,
              numero_serie: "",
              codigo_minvu: "",
              codigo_interno: "",
              mac: "",
              descripcion: "",
              ubicacion: null,
              estado: null,
              stockActual: null,
              isArticuloExistente: false,
              isMacEnabled: false,
              uniqueFieldsModified: false,
              numero_serie_original: "",
              codigo_minvu_original: "",
              codigo_interno_original: "",
              mac_original: "",
            },
          ],
        });
        fetchData();
        toast.info("Formulario reseteado y datos actualizados.", { position: "top-center", theme: "colored" });
      }
    } catch (error) {
      console.error("Error al procesar el formulario:", error);
      toast.error("Ocurrió un error al procesar el formulario.", { position: "top-center", theme: "colored" });
    }

    setLoading(false);
  };

  // Función para manejar la cancelación del formulario
  const handleCancel = () => {
    reset({
      products: [
        {
          nombre: null,
          articulo_id: "",
          categoria: null,
          cantidad: "",
          modelo: null,
          marca: null,
          numero_serie: "",
          codigo_minvu: "",
          codigo_interno: "",
          mac: "",
          descripcion: "",
          ubicacion: null,
          estado: null,
          stockActual: null,
          isArticuloExistente: false,
          isMacEnabled: false,
          uniqueFieldsModified: false,
          numero_serie_original: "",
          codigo_minvu_original: "",
          codigo_interno_original: "",
          mac_original: "",
        },
      ],
    });
    toast.info("Formulario reseteado.", { position: "top-center", theme: "colored" });
  };

  // Función para agregar un nuevo producto al formulario
  const addProduct = () => {
    append({
      nombre: null,
      articulo_id: "",
      categoria: null,
      cantidad: "",
      modelo: null,
      marca: null,
      numero_serie: "",
      codigo_minvu: "",
      codigo_interno: "",
      mac: "",
      descripcion: "",
      ubicacion: null,
      estado: null,
      stockActual: null,
      isArticuloExistente: false,
      isMacEnabled: false,
      uniqueFieldsModified: false,
      numero_serie_original: "",
      codigo_minvu_original: "",
      codigo_interno_original: "",
      mac_original: "",
    });

    setTimeout(() => {
      if (newProductRef.current) {
        newProductRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 sm:ml-64 bg-gray-100">
        <h1 className="text-2xl font-bold mb-6">Ingreso de Artículos</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-lg shadow mb-6 space-y-6">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="border p-4 mb-4 rounded-lg relative"
              ref={index === fields.length - 1 ? newProductRef : null}
            >
              {/* Botón para eliminar un artículo si hay más de uno */}
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                  title="Eliminar Artículo"
                >
                  <FaTrash size={18} />
                </button>
              )}

              <h2 className="text-lg font-semibold mb-4">Artículo {index + 1}</h2>
              <div className="mb-4">
                {getValues(`products.${index}.isArticuloExistente`) ? (
                  <span className="text-blue-600 font-medium">Ingresando Artículo Existente</span>
                ) : (
                  <span className="text-green-600 font-medium">Ingresando Nuevo Artículo</span>
                )}
              </div>

              {/* Sección de Nombre, Categoría, Cantidad y Stock Actual */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <Controller
                    control={control}
                    name={`products.${index}.nombre`}
                    render={({ field: { onChange, value } }) => (
                      <AsyncCreatableSelect
                        cacheOptions
                        loadOptions={loadOptionsArticulos}
                        onChange={(selectedOption) => {
                          handleNombreChange(index, selectedOption);
                          onChange(selectedOption || null);
                        }}
                        className="w-full"
                        placeholder="Buscar o Crear Nombre de Artículo"
                        isLoading={loading}
                        formatCreateLabel={(inputValue) => `Crear "${inputValue}"`}
                        value={value}
                        isClearable
                        components={{ Option }}
                        defaultOptions
                      />
                    )}
                  />
                  {errors.products?.[index]?.nombre && (
                    <p className="text-red-500 text-xs mt-1">{errors.products[index].nombre.message}</p>
                  )}
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <Controller
                    control={control}
                    name={`products.${index}.categoria`}
                    render={({ field: { onChange, value } }) => (
                      <AsyncSelect
                        isClearable
                        loadOptions={loadOptionsCategoria}
                        onChange={(selectedOption) => {
                          handleCategoriaSelect(index, selectedOption);
                          onChange(selectedOption ? selectedOption.value : null);
                        }}
                        className="w-full"
                        placeholder="Seleccionar Categoría"
                        isLoading={loading}
                        defaultOptions={categorias.map((c) => ({ label: c.nombre, value: c.id }))}
                        value={
                          value
                            ? {
                                label: categorias.find((c) => c.id === value)?.nombre || "Nueva Categoría",
                                value: value,
                              }
                            : null
                        }
                      />
                    )}
                  />
                  {errors.products?.[index]?.categoria && (
                    <p className="text-red-500 text-xs mt-1">{errors.products[index].categoria.message}</p>
                  )}
                </div>

                {/* Cantidad */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                  <input
                    type="number"
                    {...register(`products.${index}.cantidad`, {
                      required: "El campo Cantidad es obligatorio.",
                      min: { value: 1, message: "La Cantidad debe ser un número mayor o igual a 1." },
                      validate: {
                        isInteger: (value) => Number.isInteger(Number(value)) || "La Cantidad debe ser un entero.",
                      },
                    })}
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                    placeholder="Cantidad"
                    disabled={loading}
                  />
                  {errors.products?.[index]?.cantidad && (
                    <p className="text-red-500 text-xs mt-1">{errors.products[index].cantidad.message}</p>
                  )}
                </div>

                {/* Stock Actual */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Actual</label>
                  <input
                    type="text"
                    value={
                      getValues(`products.${index}.stockActual`) !== null
                        ? getValues(`products.${index}.stockActual`)
                        : "Sin información"
                    }
                    disabled
                    className="w-full border-gray-300 rounded-lg shadow-sm bg-gray-100 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Sección de Modelo, Marca y Ubicación */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                {/* Modelo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
                  <Controller
                    control={control}
                    name={`products.${index}.modelo`}
                    render={({ field: { onChange, value } }) => (
                      <AsyncSelect
                        isClearable
                        loadOptions={loadOptionsModelo}
                        onChange={(selectedOption) => {
                          handleModeloSelect(index, selectedOption);
                          onChange(selectedOption ? selectedOption.value : null);
                        }}
                        className="w-full"
                        placeholder="Seleccionar Modelo"
                        isLoading={loading}
                        defaultOptions={modelos.map((m) => ({ label: m.nombre, value: m.id }))}
                        value={
                          value
                            ? { label: modelos.find((m) => m.id === value)?.nombre || "Nuevo Modelo", value: value }
                            : null
                        }
                      />
                    )}
                  />
                  {errors.products?.[index]?.modelo && (
                    <p className="text-red-500 text-xs mt-1">{errors.products[index].modelo.message}</p>
                  )}
                </div>

                {/* Marca */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                  <Controller
                    control={control}
                    name={`products.${index}.marca`}
                    render={({ field: { onChange, value } }) => (
                      <AsyncSelect
                        isClearable
                        loadOptions={loadOptionsMarca}
                        onChange={(selectedOption) => {
                          handleMarcaSelect(index, selectedOption);
                          onChange(selectedOption ? selectedOption.value : null);
                        }}
                        className="w-full"
                        placeholder="Seleccionar Marca"
                        isLoading={loading}
                        defaultOptions={marcas.map((m) => ({ label: m.nombre, value: m.id }))}
                        value={
                          value
                            ? { label: marcas.find((m) => m.id === value)?.nombre || "Nueva Marca", value: value }
                            : null
                        }
                      />
                    )}
                  />
                  {errors.products?.[index]?.marca && (
                    <p className="text-red-500 text-xs mt-1">{errors.products[index].marca.message}</p>
                  )}
                </div>

                {/* Ubicación */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                  <Controller
                    control={control}
                    name={`products.${index}.ubicacion`}
                    render={({ field: { onChange, value } }) => (
                      <AsyncSelect
                        isClearable
                        loadOptions={loadOptionsUbicacion}
                        onChange={(selectedOption) => {
                          handleUbicacionSelect(index, selectedOption);
                          onChange(selectedOption ? selectedOption.value : null);
                        }}
                        className="w-full"
                        placeholder="Seleccionar Ubicación"
                        isLoading={loading}
                        defaultOptions={ubicaciones.map((u) => ({ label: u.nombre, value: u.id }))}
                        value={
                          value
                            ? { label: ubicaciones.find((u) => u.id === value)?.nombre || "Nueva Ubicación", value: value }
                            : null
                        }
                      />
                    )}
                  />
                  {errors.products?.[index]?.ubicacion && (
                    <p className="text-red-500 text-xs mt-1">{errors.products[index].ubicacion.message}</p>
                  )}
                </div>
              </div>

              {/* Sección de Número de Serie, MAC Address y Código Interno */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                {/* Número de Serie */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número de Serie</label>
                  <input
                    type="text"
                    {...register(`products.${index}.numero_serie`, {
                      onChange: () => {
                        const updatedProducts = [...getValues("products")];
                        updatedProducts[index].uniqueFieldsModified = true;
                        setValue("products", updatedProducts);
                      },
                    })}
                    className={`w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                      getValues(`products.${index}.isArticuloExistente`) ? 'bg-gray-200 cursor-not-allowed' : ''
                    }`}
                    placeholder="Número de Serie"
                    disabled={getValues(`products.${index}.isArticuloExistente`) || loading}
                  />
                </div>

                {/* MAC Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">MAC Address</label>
                  {getValues(`products.${index}.isMacEnabled`) && (
                    <input
                      type="text"
                      {...register(`products.${index}.mac`, {
                        onChange: () => {
                          const updatedProducts = [...getValues("products")];
                          updatedProducts[index].uniqueFieldsModified = true;
                          setValue("products", updatedProducts);
                        },
                      })}
                      className={`w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                        getValues(`products.${index}.isArticuloExistente`) ? 'bg-gray-200 cursor-not-allowed' : ''
                      }`}
                      placeholder="00:1B:44:11:3A:B7"
                      disabled={getValues(`products.${index}.isArticuloExistente`) || loading}
                    />
                  )}
                  {getValues(`products.${index}.isMacEnabled`) && errors.products?.[index]?.mac && (
                    <p className="text-red-500 text-xs mt-1">{errors.products[index].mac.message}</p>
                  )}
                </div>

                {/* Código Interno */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código Interno</label>
                  <input
                    type="text"
                    {...register(`products.${index}.codigo_interno`, {
                      onChange: () => {
                        const updatedProducts = [...getValues("products")];
                        updatedProducts[index].uniqueFieldsModified = true;
                        setValue("products", updatedProducts);
                      },
                    })}
                    className={`w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                      getValues(`products.${index}.isArticuloExistente`) ? 'bg-gray-200 cursor-not-allowed' : ''
                    }`}
                    placeholder="Código Interno"
                    disabled={getValues(`products.${index}.isArticuloExistente`) || loading}
                  />
                </div>
              </div>

              {/* Sección de Código MINVU y Descripción */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                {/* Código MINVU */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código MINVU</label>
                  <input
                    type="text"
                    {...register(`products.${index}.codigo_minvu`, {
                      onChange: () => {
                        const updatedProducts = [...getValues("products")];
                        updatedProducts[index].uniqueFieldsModified = true;
                        setValue("products", updatedProducts);
                      },
                    })}
                    className={`w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                      getValues(`products.${index}.isArticuloExistente`) ? 'bg-gray-200 cursor-not-allowed' : ''
                    }`}
                    placeholder="Código MINVU"
                    disabled={getValues(`products.${index}.isArticuloExistente`) || loading}
                  />
                </div>

                {/* Descripción */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea
                    {...register(`products.${index}.descripcion`)}
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    rows="2"
                    placeholder="Descripción adicional del artículo"
                    disabled={loading}
                  ></textarea>
                  <small className="text-gray-500 text-xs">
                    Si no se ingresa nada, se usará un mensaje por defecto.
                  </small>
                </div>
              </div>

              {/* Sección de Estado */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <Controller
                  control={control}
                  name={`products.${index}.estado`}
                  render={({ field: { onChange, value } }) => (
                    <AsyncSelect
                      isClearable
                      loadOptions={loadOptionsEstado}
                      onChange={(selectedOption) => {
                        handleEstadoChange(index, selectedOption);
                        onChange(selectedOption ? selectedOption.value : null);
                      }}
                      className="w-full"
                      placeholder="Seleccionar Estado"
                      isDisabled={loading}
                      defaultOptions={estadoOptions}
                      value={value ? { label: estadoOptions.find((e) => e.value === value)?.label, value } : null}
                      // Deshabilitar la creación de nuevos estados
                      isCreatable={false}
                      noOptionsMessage={() => "No hay opciones"}
                    />
                  )}
                />
                <small className="text-gray-500 text-xs">
                  Si no se selecciona nada, será "Bueno".
                </small>
              </div>
            </div>
          ))}

          {/* Botón para agregar un nuevo artículo */}
          <button
            type="button"
            onClick={addProduct}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            title="Agregar Nuevo Artículo"
            disabled={loading}
          >
            <FaPlus className="mr-2" /> Agregar Artículo
          </button>

          {/* Botones de Cancelar y Registrar */}
          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={handleCancel}
              className="mr-4 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
              disabled={loading}
            >
              <FaTimes className="inline mr-1" /> Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
            >
              <FaSave className="mr-2" /> Registrar Artículos
            </button>
          </div>
        </form>
      </main>
      <ToastContainer />
    </div>
  );
}
