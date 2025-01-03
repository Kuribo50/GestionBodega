// src/pages/prestamos.js

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Swal from "sweetalert2";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import Modal from "react-modal";
import Sidebar from "@/components/Sidebar";
import {
  fetchArticulos,
  fetchMotivos,
  fetchPersonal,
  fetchMovimientos,
  createPrestamo,
  createRegresado,
  createMotivo,
  createPersonal,
} from "@/services/api";
import { useTable, useSortBy, usePagination } from "react-table";
import { ClipLoader } from "react-spinners";

// Importación de React Icons
import {
  FaPlus,
  FaTimes,
  FaCheck,
  FaSort,
  FaSortUp,
  FaSortDown,
} from "react-icons/fa";
import { FiArrowLeft, FiArrowRight, FiMenu } from "react-icons/fi";

Modal.setAppElement("#__next");

export default function Prestamos() {
  // Estados de datos
  const [articulos, setArticulos] = useState([]);
  const [filteredArticulos, setFilteredArticulos] = useState([]);
  const [motivos, setMotivos] = useState([]);
  const [personalOptions, setPersonalOptions] = useState([]);
  const [historial, setHistorial] = useState([]);

  // Estados de formulario
  const [selectedArticulos, setSelectedArticulos] = useState([]);
  const [cantidades, setCantidades] = useState({});
  const [selectedPersonal, setSelectedPersonal] = useState(null);
  const [formData, setFormData] = useState({
    tipoMovimiento: "Prestamo",
    fecha: new Date().toISOString().split("T")[0],
    motivo: "", // Se establecerá por defecto en fetchData
  });

  // Modal agregar personal
  const [isAddPersonalModalOpen, setIsAddPersonalModalOpen] = useState(false);
  const [newPersonalData, setNewPersonalData] = useState({
    correo_institucional: "",
    nombre: "",
    seccion: "",
  });

  // Estados de envío y carga
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false); // Nuevo estado para indicar re-fetching

  // Tabla
  const itemsPerPageOptions = [5, 10, 20, "Todos"];
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");

  // Estado para controlar el tipo de movimiento a mostrar en la tabla
  const [filterTipoMovimiento, setFilterTipoMovimiento] = useState("Todos"); // "Todos", "Prestamo", "Regresado"

  // Estado para manejar la visibilidad de la sidebar en pantallas pequeñas
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Función para formatear el label de los artículos
  const formatArticuloLabel = useCallback((articulo) => {
    let label = articulo.nombre || "Sin Nombre";
    if (articulo.modelo_nombre && articulo.modelo_nombre !== null)
      label += ` - Modelo: ${articulo.modelo_nombre}`;
    if (articulo.marca_nombre && articulo.marca_nombre !== null)
      label += ` - Marca: ${articulo.marca_nombre}`;
    if (articulo.codigo_interno)
      label += ` - Código Interno: ${articulo.codigo_interno}`;
    if (articulo.codigo_minvu)
      label += ` - Código MINVU: ${articulo.codigo_minvu}`;
    if (articulo.numero_serie)
      label += ` - Nº Serie: ${articulo.numero_serie}`;
    if (articulo.mac) label += ` - MAC: ${articulo.mac}`;
    return label;
  }, []);

  // Función para obtener los artículos prestados por el personal seleccionado con sus cantidades
  const getLoanedArticlesForPersonal = useCallback(
    (personalId) => {
      const loans = {};
      historial.forEach((mov) => {
        if (mov.personal_id === personalId) {
          const cantidad = Number(mov.cantidad) || 0;
          if (mov.tipo_movimiento === "Prestamo") {
            loans[mov.articulo_id] =
              (loans[mov.articulo_id] || 0) + cantidad;
          } else if (mov.tipo_movimiento === "Regresado") {
            loans[mov.articulo_id] =
              (loans[mov.articulo_id] || 0) - cantidad;
          }
        }
      });

      console.log(`Préstamos Netos para Personal ${personalId}:`, loans);

      const loanedArticles = Object.keys(loans)
        .filter((articuloId) => loans[articuloId] > 0)
        .map((articuloId) => ({
          articuloId: Number(articuloId),
          cantidadPrestada: loans[articuloId],
        }));

      console.log(
        `Artículos con préstamos pendientes para Personal ${personalId}:`,
        loanedArticles
      );

      return loanedArticles;
    },
    [historial]
  );

  // Función para formatear la duración en minutos, horas o días
  const formatDuration = (diffTime) => {
    const minutes = Math.floor(diffTime / (1000 * 60));
    const hours = Math.floor(diffTime / (1000 * 60 * 60));
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes} minuto(s)`;
    if (hours < 24) return `${hours} hora(s)`;
    return `${days} día(s)`;
  };

  // Función para obtener datos al montar el componente
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Cargar datos de formularios
      const [
        articulosData,
        motivosData,
        personalData,
        movimientosData,
      ] = await Promise.all([
        fetchArticulos(),
        fetchMotivos(),
        fetchPersonal(),
        fetchMovimientos(),
      ]);

      console.log("Artículos Obtenidos:", articulosData); // Log de depuración

      // 2. Formatear y establecer artículos
      const formattedArticulos = articulosData
        .filter(
          (articulo) =>
            articulo.stock_total > 0 || articulo.stock_prestado > 0
        ) // Excluir artículos con stock_total y stock_prestado igual a 0
        .map((articulo) => ({
          label: formatArticuloLabel(articulo),
          value: articulo.id,
          stock_total: articulo.stock_actual || 0, // Asegúrate de que el campo es correcto
          stock_prestado: articulo.stock_prestado || 0, // Asegúrate de que el campo es correcto
          prestado: (articulo.stock_prestado || 0) > 0,
          modelo_nombre: articulo.modelo_nombre || "Sin Modelo", // Asegúrate de que la API retorna 'modelo_nombre'
          marca_nombre: articulo.marca_nombre || "Sin Marca", // Asegúrate de que la API retorna 'marca_nombre'
        }));
      setArticulos(formattedArticulos);

      // 3. Formatear y establecer motivos
      const formattedMotivos = motivosData.map((motivo) => ({
        label: motivo.nombre,
        value: motivo.id,
      }));
      setMotivos(formattedMotivos);

      // Establecer "Solicitud de personal" como motivo por defecto si existe
      const defaultMotivo = formattedMotivos.find(
        (m) => m.label.toLowerCase() === "solicitud de personal"
      );
      if (defaultMotivo) {
        setFormData((prev) => ({
          ...prev,
          motivo: defaultMotivo.value,
        }));
      }

      // 4. Formatear y establecer opciones de personal
      const uniquePersonal = [
        ...new Map(personalData.map((item) => [item.correo_institucional, item]))
          .values(),
      ];
      const formattedPersonalOptions = uniquePersonal.map((personal) => ({
        label: `${personal.correo_institucional}${
          personal.nombre ? " - " + personal.nombre : ""
        }${personal.seccion ? " - " + personal.seccion : " - Sin Sección"}`, // Mostrar "Sin Sección" si es null
        value: personal.id,
        correo_institucional: personal.correo_institucional || "Sin Correo",
        nombre: personal.nombre || "Sin Nombre",
        seccion: personal.seccion || "Sin Sección",
      }));
      setPersonalOptions(formattedPersonalOptions);

      // 5. Cargar movimientos
      // Ya se ha cargado `movimientosData` con `fetchMovimientos()`

      console.log("Movimientos Obtenidos:", movimientosData); // Log de depuración

      // 6. Filtrar movimientos para incluir solo "Prestamo" y "Regresado"
      const filteredMovimientos = movimientosData.filter(
        (mov) =>
          mov.tipo_movimiento === "Prestamo" ||
          mov.tipo_movimiento === "Regresado"
      );
      console.log("Movimientos Filtrados:", filteredMovimientos); // Log de depuración

      // 7. Mapear movimientos utilizando los datos cargados
      // Primero, ordenar los movimientos por fecha ASCENDENTE
      filteredMovimientos.sort(
        (a, b) => new Date(a.fecha) - new Date(b.fecha)
      );

      // Crear un mapa para asociar Prestamos y Regresados
      const prestamosMap = {}; // { [articuloId_personalId]: [{ mov_id, cantidad_restante }] }
      const mappedHistorial = [];

      filteredMovimientos.forEach((mov) => {
        const articuloObj =
          formattedArticulos.find((a) => a.value === mov.articulo) || {};
        const personalObj =
          formattedPersonalOptions.find((p) => p.value === mov.personal) || {};

        const key = `${mov.articulo}_${mov.personal}`;

        if (mov.tipo_movimiento === "Prestamo") {
          // Inicializar el array si no existe
          if (!prestamosMap[key]) {
            prestamosMap[key] = [];
          }
          // Agregar el préstamo al mapa
          prestamosMap[key].push({
            mov_id: mov.id,
            cantidad_restante: mov.cantidad,
            fecha_prestamo: mov.fecha,
          });

          // Agregar una nueva fila al historial
          mappedHistorial.push({
            id: mov.id,
            articulo_id: mov.articulo,
            articulo: articuloObj.label || "Artículo no encontrado",
            personal_id: mov.personal,
            correo_institucional:
              personalObj.correo_institucional || "Sin Correo",
            nombre: personalObj.nombre || "Sin Nombre",
            seccion: personalObj.seccion || "Sin Sección",
            tipo_movimiento: "Prestamo", // Siempre "Prestamo"
            cantidad: mov.cantidad || 0,
            fecha_prestamo: new Date(mov.fecha).toLocaleString(), // Renombrado y formateado
            fecha_regreso: "-", // Aún no se ha regresado
            duracion: "Aún no se ha regresado",
          });
        } else if (mov.tipo_movimiento === "Regresado") {
          if (prestamosMap[key] && prestamosMap[key].length > 0) {
            // Encontrar el primer préstamo pendiente
            const prestamoPendiente = prestamosMap[key].find(
              (p) => p.cantidad_restante >= mov.cantidad
            );

            if (prestamoPendiente) {
              // Calcular duración
              const fechaPrestamo = new Date(
                prestamoPendiente.fecha_prestamo
              );
              const fechaRegreso = new Date(mov.fecha);
              const diffTime = fechaRegreso - fechaPrestamo;
              const formattedDuration = formatDuration(diffTime); // Usar la función de formateo

              // Actualizar la cantidad restante en el préstamo
              prestamoPendiente.cantidad_restante -= mov.cantidad;

              // Encontrar la fila correspondiente en el historial y actualizarla
              const filaPrestamo = mappedHistorial.find(
                (fila) => fila.id === prestamoPendiente.mov_id
              );
              if (filaPrestamo) {
                filaPrestamo.fecha_regreso = new Date(mov.fecha).toLocaleString();
                filaPrestamo.duracion = formattedDuration; // Actualizar con duración formateada
              }

              // Agregar una nueva fila de "Regresado" al historial
              mappedHistorial.push({
                id: mov.id,
                articulo_id: mov.articulo,
                articulo: articuloObj.label || "Artículo no encontrado",
                personal_id: mov.personal,
                correo_institucional:
                  personalObj.correo_institucional || "Sin Correo",
                nombre: personalObj.nombre || "Sin Nombre",
                seccion: personalObj.seccion || "Sin Sección",
                tipo_movimiento: "Regresado", // Correcto
                cantidad: mov.cantidad || 0,
                fecha_prestamo: new Date(
                  prestamoPendiente.fecha_prestamo
                ).toLocaleString(),
                fecha_regreso: new Date(mov.fecha).toLocaleString(),
                duracion: formattedDuration, // Usar duración formateada
              });
            } else {
              // No se encontró un préstamo adecuado para esta devolución
              mappedHistorial.push({
                id: mov.id,
                articulo_id: mov.articulo,
                articulo: articuloObj.label || "Artículo no encontrado",
                personal_id: mov.personal,
                correo_institucional:
                  personalObj.correo_institucional || "Sin Correo",
                nombre: personalObj.nombre || "Sin Nombre",
                seccion: personalObj.seccion || "Sin Sección",
                tipo_movimiento: "Regresado", // Correcto
                cantidad: mov.cantidad || 0,
                fecha_prestamo: "-",
                fecha_regreso: new Date(mov.fecha).toLocaleString(),
                duracion: "No se encontró el Prestamo",
              });
            }
          } else {
            // No hay Prestamo correspondiente, agregar una fila de Regresado sin Prestamo
            mappedHistorial.push({
              id: mov.id,
              articulo_id: mov.articulo,
              articulo: articuloObj.label || "Artículo no encontrado",
              personal_id: mov.personal,
              correo_institucional:
                personalObj.correo_institucional || "Sin Correo",
              nombre: personalObj.nombre || "Sin Nombre",
              seccion: personalObj.seccion || "Sin Sección",
              tipo_movimiento: "Regresado", // Correcto
              cantidad: mov.cantidad || 0,
              fecha_prestamo: "-",
              fecha_regreso: new Date(mov.fecha).toLocaleString(),
              duracion: "No se encontró el Prestamo",
            });
          }
        }
      });

      console.log("Historial Mapeado:", mappedHistorial); // Log de depuración

      // 8. Establecer el historial mapeado en el estado
      setHistorial(mappedHistorial);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo cargar la información.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [formatArticuloLabel]); // Solo 'formatArticuloLabel' como dependencia

  // Ejecutar fetchData al montar el componente
  useEffect(() => {
    fetchData();
  }, [fetchData]); // Incluir 'fetchData' en las dependencias

  // useEffect para actualizar filteredArticulos cuando cambia selectedPersonal o tipoMovimiento
  useEffect(() => {
    if (selectedPersonal) {
      if (formData.tipoMovimiento === "Prestamo") {
        setFilteredArticulos(
          articulos.filter((articulo) => articulo.stock_total > 0)
        );
      } else if (formData.tipoMovimiento === "Regresado") {
        const loanedArticles = getLoanedArticlesForPersonal(
          selectedPersonal.value
        );
        const loanedIds = loanedArticles.map((l) => l.articuloId);
        const loanedMap = {};
        loanedArticles.forEach((loan) => {
          loanedMap[loan.articuloId] = loan.cantidadPrestada;
        });
        setFilteredArticulos(
          articulos
            .filter((articulo) => loanedIds.includes(articulo.value))
            .map((articulo) => ({
              ...articulo,
              cantidadPrestada: loanedMap[articulo.value] || 0,
            }))
        );
      }
    } else {
      setFilteredArticulos([]);
    }
  }, [
    selectedPersonal,
    formData.tipoMovimiento,
    articulos,
    historial,
    getLoanedArticlesForPersonal,
  ]);

  // Manejo de cambio en el motivo
  const handleMotivoChange = async (newValue) => {
    if (newValue?.__isNew__) {
      try {
        const createdMotivo = await createMotivo({ nombre: newValue.label });
        setMotivos((prev) => [
          ...prev,
          { label: createdMotivo.nombre, value: createdMotivo.id },
        ]);
        setFormData((prev) => ({ ...prev, motivo: createdMotivo.id }));
        Swal.fire({
          icon: "success",
          title: "Éxito",
          text: "Motivo creado correctamente.",
        });
      } catch (error) {
        console.error("Error al crear motivo:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Error al crear el motivo.",
        });
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        motivo: newValue ? newValue.value : "",
      }));
    }
  };

  // Manejo de cambio en el formulario de nueva persona
  const handleNewPersonalChange = (e) => {
    const { name, value } = e.target;
    setNewPersonalData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Manejo de selección de personal
  const handlePersonalSelect = (selectedOption) => {
    setSelectedPersonal(selectedOption);
    // Resetear motivo al cambiar de personal para evitar inconsistencias
    setFormData((prev) => ({ ...prev, motivo: "" }));
    // Resetear artículos seleccionados
    setSelectedArticulos([]);
    setCantidades({});
  };

  // Manejo de selección de artículos
  const handleArticuloSelect = (selectedOptions) => {
    setSelectedArticulos(selectedOptions || []);
    const nuevasCantidades = {};
    (selectedOptions || []).forEach((articulo) => {
      // Si en Regresado, establecer el valor máximo como la cantidad prestada
      if (
        formData.tipoMovimiento === "Regresado" &&
        articulo.cantidadPrestada
      ) {
        nuevasCantidades[articulo.value] = Math.min(
          cantidades[articulo.value] || 1,
          articulo.cantidadPrestada
        );
      } else {
        nuevasCantidades[articulo.value] = cantidades[articulo.value] || 1;
      }
    });
    setCantidades(nuevasCantidades);
  };

  // Manejo de cambio en las cantidades
  const handleCantidadChange = (articuloId, value) => {
    setCantidades((prev) => ({
      ...prev,
      [articuloId]: value,
    }));
  };

  // Validación del formulario
  const validateForm = () => {
    if (!selectedPersonal || selectedArticulos.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Campos requeridos",
        text: "Todos los campos obligatorios deben estar completos.",
      });
      return false;
    }

    // "Motivo" no es obligatorio, se manejará en handleSubmit

    for (const articulo of selectedArticulos) {
      const cantidad = cantidades[articulo.value];
      if (!cantidad || cantidad <= 0) {
        Swal.fire({
          icon: "warning",
          title: "Cantidad inválida",
          text: `La cantidad para el artículo "${articulo.label}" debe ser un número positivo.`,
        });
        return false;
      }

      const articuloData = articulos.find((a) => a.value === articulo.value);
      if (!articuloData) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: `No se encontró información para el artículo "${articulo.label}".`,
        });
        return false;
      }

      if (formData.tipoMovimiento === "Prestamo") {
        if (cantidad > articuloData.stock_total) {
          Swal.fire({
            icon: "warning",
            title: "Stock insuficiente",
            text: `No hay suficiente stock disponible para el artículo "${articulo.label}". Stock actual: ${articuloData.stock_total}.`,
          });
          return false;
        }
      } else if (formData.tipoMovimiento === "Regresado") {
        const cantidadPrestada = articulo.cantidadPrestada || 0;

        if (cantidad > cantidadPrestada) {
          Swal.fire({
            icon: "warning",
            title: "Cantidad excedida",
            text: `La cantidad a devolver para el artículo "${articulo.label}" excede la cantidad prestada por este personal. Cantidad prestada: ${cantidadPrestada}.`,
          });
          return false;
        }

        // Validación de Fecha
        const lastPrestamo = historial
          .filter(
            (mov) =>
              mov.articulo_id === articulo.value &&
              mov.personal_id === selectedPersonal.value &&
              mov.tipo_movimiento === "Prestamo" &&
              mov.fecha_regreso === "-"
          )
          .sort(
            (a, b) => new Date(a.fecha_prestamo) - new Date(b.fecha_prestamo)
          )[0];

        if (lastPrestamo) {
          const fechaPrestamo = new Date(lastPrestamo.fecha_prestamo);
          const fechaRegreso = new Date(formData.fecha);
          if (fechaRegreso < fechaPrestamo) {
            Swal.fire({
              icon: "warning",
              title: "Fecha inválida",
              text: `La fecha de regreso no puede ser anterior a la fecha de préstamo (${lastPrestamo.fecha_prestamo}).`,
            });
            return false;
          }
        }
      }
    }

    return true;
  };

  // Manejo de envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setIsRefreshing(true); // Indica que se está re-fetching
    try {
      // Si 'motivo' no está seleccionado, asignar el motivo por defecto
      const motivoFinal =
        formData.motivo ||
        motivos.find(
          (m) => m.label.toLowerCase() === "solicitud de personal"
        )?.value;

      // Dividir movimientos en solicitudes individuales para manejar errores por movimiento
      for (const articulo of selectedArticulos) {
        const cantidad = cantidades[articulo.value];
        const esPrestamo = formData.tipoMovimiento === "Prestamo";

        let movimientoPayload = {
          articulo: articulo.value,
          tipo_movimiento: esPrestamo ? "Prestamo" : "Regresado",
          cantidad: cantidad,
          personal: selectedPersonal.value,
          motivo: motivoFinal,
          fecha: new Date().toISOString(),
        };

        console.log(`Payload de Movimiento:`, movimientoPayload); // Log de depuración

        try {
          let mov;
          if (esPrestamo) {
            mov = await createPrestamo(movimientoPayload);
            console.log("Movimiento de Prestamo creado:", mov);
          } else {
            mov = await createRegresado(movimientoPayload);
            console.log("Movimiento de Regresado creado:", mov);
          }
        } catch (error) {
          console.error(
            `Error al registrar movimiento para el artículo "${articulo.label}":`,
            error
          );
          // Ajustar el mensaje de error para devoluciones
          if (!esPrestamo) {
            Swal.fire({
              icon: "error",
              title: "Error",
              text: `No se pudo registrar la devolución para el artículo "${articulo.label}". Por favor, regrese los artículos uno a uno.`,
            });
          } else {
            Swal.fire({
              icon: "error",
              title: "Error",
              text: `No se pudo registrar el préstamo para el artículo "${articulo.label}".`,
            });
          }
        }
      }

      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "Movimiento registrado correctamente.",
      });

      // Resetear el formulario
      setFormData({
        tipoMovimiento: "Prestamo",
        fecha: new Date().toISOString().split("T")[0],
        motivo: "",
      });
      setSelectedArticulos([]);
      setSelectedPersonal(null);
      setCantidades({});
      setSearchTerm("");

      // Re-fetch los datos para actualizar articulos y historial
      await fetchData();
    } catch (error) {
      console.error("Error al registrar movimiento:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo registrar el movimiento.",
      });
    } finally {
      setIsSubmitting(false);
      setIsRefreshing(false);
    }
  };

  // Filtrado del historial basado en el término de búsqueda y tipo de movimiento
  const filteredHistorial = useMemo(() => {
    let data = historial;

    if (filterTipoMovimiento !== "Todos") {
      data = data.filter(
        (mov) => mov.tipo_movimiento === filterTipoMovimiento
      );
    }

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      data = data.filter((mov) =>
        [
          mov.articulo,
          mov.correo_institucional,
          mov.nombre,
          mov.seccion,
          mov.tipo_movimiento,
          mov.cantidad.toString(),
          mov.fecha_prestamo,
          mov.fecha_regreso,
          mov.duracion,
        ].some((field) => field.toLowerCase().includes(lowerSearch))
      );
    }

    return data;
  }, [historial, searchTerm, filterTipoMovimiento]);

  // Definición de las columnas para react-table
  const columns = useMemo(
    () => [
      {
        Header: "Artículo",
        accessor: "articulo",
      },
      {
        Header: "Correo Institucional",
        accessor: "correo_institucional",
      },
      {
        Header: "Nombre",
        accessor: "nombre",
      },
      {
        Header: "Sección",
        accessor: "seccion",
      },
      {
        Header: "Tipo de Movimiento",
        accessor: "tipo_movimiento",
        Cell: ({ row }) => {
          const { tipo_movimiento } = row.original;
          if (tipo_movimiento === "Regresado") {
            return (
              <span className="text-green-500 font-semibold flex items-center">
                Regresado
              </span>
            );
          } else {
            return (
              <span className="text-blue-500 font-semibold flex items-center">
                Prestamo
              </span>
            );
          }
        },
      },
      {
        Header: "Cantidad",
        accessor: "cantidad",
      },
      {
        Header: "Fecha de Préstamo",
        accessor: "fecha_prestamo",
      },
      {
        Header: "Fecha de Regreso",
        accessor: "fecha_regreso",
      },
      {
        Header: "Duración",
        accessor: "duracion",
      },
    ],
    []
  );

  // Configuración de react-table
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page, // En lugar de rows, usamos page para paginación
    canPreviousPage,
    canNextPage,
    pageOptions,
    state: { pageIndex, pageSize },
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
  } = useTable(
    {
      columns,
      data: filteredHistorial,
      initialState: {
        pageIndex: 0,
        pageSize:
          itemsPerPage === "Todos" ? filteredHistorial.length : itemsPerPage,
        sortBy: [
          {
            id: "fecha_prestamo",
            desc: true, // Orden descendente por defecto
          },
        ],
      },
      manualPagination: false,
    },
    useSortBy,
    usePagination
  );

  // Manejo de cambios en el número de items por página
  useEffect(() => {
    if (itemsPerPage === "Todos") {
      setPageSize(filteredHistorial.length);
    } else {
      setPageSize(itemsPerPage);
    }
  }, [itemsPerPage, setPageSize, filteredHistorial.length]);

  const handleItemsPerPageChange = (selectedOption) => {
    const value = selectedOption.value;
    setItemsPerPage(value);
  };

  return (
    <div className="flex bg-gray-100 min-h-screen">
      {/* Botón de menú para pantallas pequeñas */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="text-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          aria-label="Abrir menú"
        >
          <FiMenu size={24} />
        </button>
      </div>

      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Contenedor principal */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto ml-0 md:ml-64">
        {/* Título */}
        <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center sm:text-left">
          Préstamos y Devoluciones
        </h1>

        {/* Formulario */}
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow-lg space-y-6"
        >
          {/* Primera fila: Personal y botón Agregar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Personal <span className="text-red-500">*</span>
              </label>
              <Select
                options={personalOptions}
                value={selectedPersonal}
                onChange={handlePersonalSelect}
                placeholder="Seleccionar Personal"
                isClearable
                instanceId="select-personal"
              />
            </div>
            <div>
              <button
                type="button"
                onClick={() => setIsAddPersonalModalOpen(true)}
                className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-300 flex items-center justify-center space-x-2"
              >
                <FaPlus />
                <span>Agregar Personal</span>
              </button>
            </div>
          </div>

          {/* Segunda fila: Tipo de Movimiento, Motivo y Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Movimiento <span className="text-red-500">*</span>
              </label>
              <Select
                options={[
                  { label: "Préstamo", value: "Prestamo" },
                  { label: "Regresado", value: "Regresado" },
                ]}
                value={{
                  label: formData.tipoMovimiento,
                  value: formData.tipoMovimiento,
                }}
                onChange={(selectedOption) =>
                  setFormData((prev) => ({
                    ...prev,
                    tipoMovimiento: selectedOption.value,
                    motivo: "", // Resetear motivo al cambiar tipo de movimiento
                  }))
                }
                placeholder="Seleccionar Tipo de Movimiento"
                instanceId="select-tipo-movimiento"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo
              </label>
              <CreatableSelect
                options={motivos}
                onChange={handleMotivoChange}
                placeholder="Seleccionar o Crear Motivo"
                isClearable
                instanceId="create-motivo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de{" "}
                {formData.tipoMovimiento === "Prestamo"
                  ? "Préstamo"
                  : "Regreso"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, fecha: e.target.value }))
                  }
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                {/* Eliminado el ícono de calendario */}
              </div>
            </div>
          </div>

          {/* Tercera fila: Artículos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Artículos <span className="text-red-500">*</span>
            </label>
            <Select
              isMulti
              options={filteredArticulos}
              value={selectedArticulos}
              onChange={handleArticuloSelect}
              placeholder={
                formData.tipoMovimiento === "Prestamo"
                  ? "Seleccionar Artículos para Prestar"
                  : "Seleccionar Artículos para Devolver"
              }
              instanceId="select-articulos"
              formatOptionLabel={(option) => (
                <div className="flex justify-between items-center">
                  <span>{option.label}</span>
                  <span className="ml-2 text-xs text-gray-500">
                    {formData.tipoMovimiento === "Prestamo"
                      ? `Stock Disponible: ${option.stock_total}`
                      : `Cantidad Prestada: ${option.cantidadPrestada}`}
                  </span>
                </div>
              )}
            />
            {selectedArticulos.length > 0 && (
              <div className="mt-4 space-y-2">
                {selectedArticulos.map((articulo) => (
                  <div
                    key={articulo.value} // Agrega 'key' aquí
                    className={`flex flex-col md:flex-row justify-between items-center p-2 rounded-md ${
                      formData.tipoMovimiento === "Prestamo"
                        ? "bg-red-100"
                        : "bg-green-100"
                    }`}
                  >
                    <span className="text-sm">{articulo.label}</span>
                    <div className="flex items-center space-x-2 mt-2 md:mt-0">
                      <label className="text-sm text-gray-700">Cantidad:</label>
                      <input
                        type="number"
                        value={cantidades[articulo.value] || 1}
                        min="1"
                        max={
                          formData.tipoMovimiento === "Prestamo"
                            ? articulo.stock_total
                            : articulo.cantidadPrestada
                        }
                        onChange={(e) =>
                          handleCantidadChange(
                            articulo.value,
                            parseInt(e.target.value, 10)
                          )
                        }
                        className="w-20 px-2 py-1 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-4">
            <button
              type="button"
              onClick={() => {
                setFormData({
                  tipoMovimiento: "Prestamo",
                  fecha: new Date().toISOString().split("T")[0],
                  motivo: "",
                });
                setSelectedArticulos([]);
                setSelectedPersonal(null);
                setCantidades({});
                setSearchTerm("");
                setFilterTipoMovimiento("Todos"); // Resetear filtro de la tabla
              }}
              className="w-full sm:w-auto px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors duration-300 flex items-center justify-center space-x-2"
            >
              <FaTimes />
              <span>Cancelar</span>
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isRefreshing} // Deshabilitar durante el re-fetching
              className={`w-full sm:w-auto px-4 py-2 text-white rounded-md ${
                isSubmitting || isRefreshing
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              } flex items-center justify-center space-x-2`}
            >
              {isSubmitting || isRefreshing ? (
                <>
                  <ClipLoader size={20} color={"#ffffff"} loading={true} />
                  <span>Registrando...</span>
                </>
              ) : (
                <>
                  <FaCheck />
                  <span>Registrar Movimiento</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Historial de Movimientos */}
        <div className="bg-white p-6 rounded-lg shadow-lg space-y-6 mt-6 overflow-x-auto">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">
            Historial de Movimientos
          </h2>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
            <div className="flex items-center space-x-2 mb-2 sm:mb-0 w-full sm:w-1/2">
              <input
                type="text"
                placeholder="Buscar en todos los campos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-lg"
              />
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-700 flex items-center">
                Mostrar:
              </label>
              <Select
                options={itemsPerPageOptions.map((opt) => ({
                  label: typeof opt === "number" ? `${opt}` : opt,
                  value: opt,
                }))}
                value={
                  typeof itemsPerPage === "number"
                    ? { label: `${itemsPerPage}`, value: itemsPerPage }
                    : { label: itemsPerPage, value: itemsPerPage }
                }
                onChange={handleItemsPerPageChange}
                placeholder="Seleccionar"
                isClearable={false}
                className="w-24"
                instanceId="select-items-per-page"
              />
              {/* Filtro por tipo de movimiento */}
              <Select
                options={[
                  { label: "Todos", value: "Todos" },
                  { label: "Préstamos", value: "Prestamo" },
                  { label: "Devoluciones", value: "Regresado" },
                ]}
                value={
                  filterTipoMovimiento === "Todos"
                    ? { label: "Todos", value: "Todos" }
                    : filterTipoMovimiento === "Prestamo"
                    ? { label: "Préstamos", value: "Prestamo" }
                    : { label: "Devoluciones", value: "Regresado" }
                }
                onChange={(selectedOption) =>
                  setFilterTipoMovimiento(selectedOption.value)
                }
                placeholder="Tipo de Movimiento"
                isClearable={false}
                className="w-40"
                instanceId="select-tipo-movimiento-filtro"
              />
            </div>
          </div>

          {isLoading || isRefreshing ? (
            <div className="flex justify-center items-center h-32">
              <ClipLoader size={50} color={"#4A90E2"} loading={true} />
            </div>
          ) : (
            <>
              {filteredHistorial.length === 0 ? (
                <p className="text-center text-gray-500">
                  No hay movimientos registrados.
                </p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table
                      {...getTableProps()}
                      className="min-w-full border-collapse border border-gray-300 rounded-lg shadow-md bg-white text-sm"
                    >
                      <thead className="bg-gray-200 text-gray-700 uppercase text-sm">
                        {headerGroups.map((headerGroup) => (
                          <tr
                            {...headerGroup.getHeaderGroupProps()}
                            key={headerGroup.id} // Agrega 'key' aquí
                          >
                            {headerGroup.headers.map((column) => (
                              <th
                                {...column.getHeaderProps(
                                  column.getSortByToggleProps()
                                )}
                                key={column.id} // Agrega 'key' aquí
                                className="py-2 px-4 border border-gray-300 text-left tracking-wider font-semibold"
                              >
                                <div className="flex items-center">
                                  <span>{column.render("Header")}</span>
                                  {/* Íconos de sort */}
                                  <span className="ml-2">
                                    {column.isSorted ? (
                                      column.isSortedDesc ? (
                                        <FaSortDown className="text-gray-600" />
                                      ) : (
                                        <FaSortUp className="text-gray-600" />
                                      )
                                    ) : (
                                      <FaSort className="text-gray-600" />
                                    )}
                                  </span>
                                </div>
                              </th>
                            ))}
                          </tr>
                        ))}
                      </thead>
                      <tbody {...getTableBodyProps()} className="text-gray-700">
                        {page.map((row) => {
                          prepareRow(row);
                          return (
                            <tr
                              {...row.getRowProps()}
                              key={row.id} // Agrega 'key' aquí
                              className="hover:bg-gray-100 transition-all duration-150"
                            >
                              {row.cells.map((cell) => (
                                <td
                                  {...cell.getCellProps()}
                                  key={cell.column.id} // Agrega 'key' aquí
                                  className="py-2 px-4 border border-gray-300"
                                >
                                  {cell.render("Cell")}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Controles de Paginación */}
                  <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-sm">
                    <div className="flex space-x-2 mb-2 sm:mb-0">
                      <button
                        onClick={() => gotoPage(0)}
                        disabled={!canPreviousPage}
                        className={`px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors ${
                          !canPreviousPage ? "bg-gray-300 cursor-not-allowed" : ""
                        }`}
                        title="Primera Página"
                      >
                        <FiArrowLeft />
                        {/* Se eliminó el segundo icono para evitar duplicación */}
                      </button>
                      <button
                        onClick={() => previousPage()}
                        disabled={!canPreviousPage}
                        className={`px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors ${
                          !canPreviousPage ? "bg-gray-300 cursor-not-allowed" : ""
                        }`}
                        title="Página Anterior"
                      >
                        <FiArrowLeft />
                      </button>
                      <button
                        onClick={() => nextPage()}
                        disabled={!canNextPage}
                        className={`px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors ${
                          !canNextPage ? "bg-gray-300 cursor-not-allowed" : ""
                        }`}
                        title="Página Siguiente"
                      >
                        <FiArrowRight />
                      </button>
                      <button
                        onClick={() => gotoPage(pageOptions.length - 1)}
                        disabled={!canNextPage}
                        className={`px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors ${
                          !canNextPage ? "bg-gray-300 cursor-not-allowed" : ""
                        }`}
                        title="Última Página"
                      >
                        <FiArrowRight />
                        {/* Se eliminó el segundo icono para evitar duplicación */}
                      </button>
                    </div>
                    <span className="text-gray-700 mb-2 sm:mb-0">
                      Página <strong>{pageIndex + 1}</strong> de{" "}
                      <strong>{pageOptions.length}</strong>
                    </span>
                    <div className="flex items-center space-x-2">
                      {/* Botones adicionales eliminados para evitar duplicación */}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Modal Agregar Nueva Persona */}
        <Modal
          isOpen={isAddPersonalModalOpen}
          onRequestClose={() => setIsAddPersonalModalOpen(false)}
          contentLabel="Agregar Nueva Persona"
          className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center px-4 sm:px-6 lg:px-8"
          overlayClassName="fixed inset-0 bg-gray-600 bg-opacity-50"
        >
          <div className="bg-white p-6 sm:p-8 lg:p-10 rounded-lg shadow-lg w-full max-w-md sm:max-w-lg space-y-6">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center mb-4">
              <FaPlus className="mr-2" />
              Agregar Nueva Persona
            </h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const { correo_institucional, nombre, seccion } = newPersonalData;

                if (!correo_institucional) {
                  Swal.fire({
                    icon: "warning",
                    title: "Correo requerido",
                    text: "Por favor, ingresa el correo institucional.",
                  });
                  return;
                }

                // Expresión regular para validar el formato de correo
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(correo_institucional)) {
                  Swal.fire({
                    icon: "warning",
                    title: "Correo inválido",
                    text: "Por favor, ingresa un correo institucional válido.",
                  });
                  return;
                }

                try {
                  const payload = {
                    correo_institucional,
                    nombre: nombre.trim() === "" ? null : nombre, // Convertir a null si está vacío
                    seccion: seccion.trim() === "" ? null : seccion, // Convertir a null si está vacío
                  };

                  const createdPersonal = await createPersonal(payload);
                  const newOption = {
                    label: `${createdPersonal.correo_institucional}${
                      createdPersonal.nombre ? " - " + createdPersonal.nombre : ""
                    }${createdPersonal.seccion ? " - " + createdPersonal.seccion : " - Sin Sección"}`, // Mostrar "Sin Sección" si es null
                    value: createdPersonal.id,
                    correo_institucional:
                      createdPersonal.correo_institucional || "Sin Correo",
                    nombre: createdPersonal.nombre || "Sin Nombre",
                    seccion: createdPersonal.seccion || "Sin Sección",
                  };
                  setPersonalOptions((prev) => [...prev, newOption]);
                  setSelectedPersonal(newOption);
                  setNewPersonalData({
                    correo_institucional: "",
                    nombre: "",
                    seccion: "",
                  });
                  setIsAddPersonalModalOpen(false);
                  Swal.fire({
                    icon: "success",
                    title: "Éxito",
                    text: "Persona agregada correctamente.",
                  });
                } catch (error) {
                  console.error("Error al crear persona:", error);
                  Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "No se pudo crear la persona.",
                  });
                }
              }}
              className="space-y-6"
            >
              {/* Campos del formulario */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo Institucional <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="correo_institucional"
                  value={newPersonalData.correo_institucional}
                  onChange={handleNewPersonalChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={newPersonalData.nombre}
                  onChange={handleNewPersonalChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sección
                </label>
                <input
                  type="text"
                  name="seccion"
                  value={newPersonalData.seccion}
                  onChange={handleNewPersonalChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-base"
                />
              </div>

              {/* Botones del Modal */}
              <div className="flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-4">
                <button
                  type="button"
                  onClick={() => setIsAddPersonalModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors duration-300 flex items-center justify-center space-x-2"
                >
                  <FaTimes />
                  <span>Cancelar</span>
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-300 flex items-center justify-center space-x-2"
                >
                  <FaCheck />
                  <span>Agregar</span>
                </button>
              </div>
            </form>
          </div>
        </Modal>
      </main>
    </div>
  );
}
