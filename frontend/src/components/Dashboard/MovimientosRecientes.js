// src/components/Dashboard/MovimientosRecientes.js

import { useState, useEffect, useRef } from "react";
import { fetchMovimientos, fetchArticulos } from "../../services/api"; // Asegúrate de que la ruta es correcta
import { 
  FaArrowCircleDown, 
  FaArrowCircleUp, 
  FaBoxOpen, 
  FaHandHolding, 
  FaUndoAlt, 
  FaExchangeAlt,
  FaChevronLeft,
  FaChevronRight
} from "react-icons/fa"; // Importar iconos
import { IconContext } from "react-icons"; // Para configurar el contexto de los iconos

const MOVIMIENTO_TABS = {
  RECENTES: "Recientes",
  ENTRADA: "Entrada",
  SALIDA: "Salida",
  CAMBIO_ESTADO: "Cambio de Estado",
  NUEVO_ARTICULO: "Nuevo Articulo",
  PRESTAMO: "Prestamo",
  REGRESADO: "Regresado",
};

// Mapeo de iconos por tipo de movimiento
const ICONOS_MOVIMIENTO = {
  Entrada: <FaArrowCircleDown />,
  Salida: <FaArrowCircleUp />,
  "Nuevo Articulo": <FaBoxOpen />, // Clave con espacio en comillas
  Prestamo: <FaHandHolding />,
  Regresado: <FaUndoAlt />,
  "Cambio de Estado": <FaExchangeAlt />, // Clave con espacio en comillas
};

// Mapeo de colores por tipo de movimiento (sin el sufijo)
const CLASES_COLORS = {
  Entrada: "green",
  Salida: "red",
  "Nuevo Articulo": "blue",
  Prestamo: "purple",
  Regresado: "orange",
  "Cambio de Estado": "yellow",
};

export default function MovimientosRecientes() {
  const [movimientos, setMovimientos] = useState([]);
  const [articulos, setArticulos] = useState([]);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(MOVIMIENTO_TABS.RECENTES);
  
  // Ref para el contenedor de las pestañas
  const tabsRef = useRef(null);

  // Función para cargar movimientos desde la API usando api.js
  const loadMovimientos = async () => {
    try {
      const data = await fetchMovimientos();
      // Ordenar movimientos por fecha (más recientes primero)
      const movimientosOrdenados = data.sort(
        (a, b) => new Date(b.fecha) - new Date(a.fecha)
      );
      setMovimientos(movimientosOrdenados);
      setError(null);
    } catch (err) {
      console.error("Error al cargar movimientos:", err);
      setError(`Error al cargar los movimientos: ${err.message}`);
      // La notificación de error ya está manejada en fetchMovimientos
    }
  };

  // Función para cargar artículos desde la API usando api.js
  const loadArticulos = async () => {
    try {
      const data = await fetchArticulos();
      setArticulos(data);
      setError(null);
    } catch (err) {
      console.error("Error al cargar artículos:", err);
      setError(`Error al cargar los artículos: ${err.message}`);
      // La notificación de error ya está manejada en fetchArticulos
    }
  };

  // Hook de efecto para cargar datos
  useEffect(() => {
    loadMovimientos();
    loadArticulos();

    const interval = setInterval(() => {
      loadMovimientos();
      loadArticulos();
    }, 10000); // Actualizar cada 10 segundos

    return () => clearInterval(interval); // Limpiar intervalo al desmontar el componente
  }, []);

  // Hook de efecto para manejar el desplazamiento horizontal con el mouse
  useEffect(() => {
    const tabsElement = tabsRef.current;
    if (!tabsElement) return;

    const handleWheel = (e) => {
      // Verificar si el desplazamiento es vertical
      if (e.deltaY === 0) return;
      e.preventDefault();
      tabsElement.scrollBy({
        left: e.deltaY < 0 ? -100 : 100, // Ajusta la cantidad según tus necesidades
        behavior: "smooth",
      });
    };

    tabsElement.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      tabsElement.removeEventListener("wheel", handleWheel);
    };
  }, []);

  // Filtrar los movimientos según la pestaña activa
  const getFilteredMovimientos = () => {
    switch (activeTab) {
      case MOVIMIENTO_TABS.ENTRADA:
      case MOVIMIENTO_TABS.SALIDA:
      case MOVIMIENTO_TABS.CAMBIO_ESTADO:
      case MOVIMIENTO_TABS.NUEVO_ARTICULO:
      case MOVIMIENTO_TABS.PRESTAMO:
      case MOVIMIENTO_TABS.REGRESADO:
        return movimientos
          .filter((mov) => mov.tipo_movimiento === activeTab)
          .slice(0, 5);
      case MOVIMIENTO_TABS.RECENTES:
      default:
        return movimientos.slice(0, 5);
    }
  };

  const filteredMovimientos = getFilteredMovimientos();

  // Función para obtener el nombre del artículo
  const getArticuloNombre = (articuloId) => {
    const articulo = articulos.find((art) => art.id === articuloId);
    return articulo ? articulo.nombre : "Desconocido";
  };

  // Función para obtener el estado del artículo
  const getArticuloEstado = (articuloId) => {
    const articulo = articulos.find((art) => art.id === articuloId);
    if (articulo) {
      switch (articulo.estado) {
        case 1:
          return "Bueno";
        case 2:
          return "Malo";
        case 3:
          return "De Baja"; // Cambiar "Baja" por "De Baja"
        default:
          return "Desconocido";
      }
    }
    return "Desconocido";
  };

  // Función para obtener el color del estado
  const getArticuloEstadoColor = (estado) => {
    switch (estado) {
      case "Bueno":
        return "text-green-500";
      case "Malo":
        return "text-red-500";
      case "De Baja":
        return "text-yellow-500";
      default:
        return "text-gray-500";
    }
  };

  // Función para obtener el color según el tipo de movimiento
  const getMovimientoColor = (tipoMovimiento) => {
    return CLASES_COLORS[tipoMovimiento] || "text-gray-500";
  };

  // Función para obtener el icono según el tipo de movimiento
  const getMovimientoIcon = (tipoMovimiento) => {
    return ICONOS_MOVIMIENTO[tipoMovimiento] || <FaExchangeAlt />;
  };

  // Funciones para manejar el clic en las flechas de desplazamiento
  const scrollTabsLeft = () => {
    if (tabsRef.current) {
      tabsRef.current.scrollBy({
        left: -150, // Ajusta la cantidad de desplazamiento
        behavior: "smooth",
      });
    }
  };

  const scrollTabsRight = () => {
    if (tabsRef.current) {
      tabsRef.current.scrollBy({
        left: 150, // Ajusta la cantidad de desplazamiento
        behavior: "smooth",
      });
    }
  };

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow h-full relative">
      <h3 className="text-lg font-semibold mb-4">Movimientos</h3>

      {/* Contenedor de las Tabs con flechas de desplazamiento */}
      <div className="relative mb-4">
        {/* Flecha Izquierda */}
        <button
          onClick={scrollTabsLeft}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-75 hover:bg-opacity-100 text-black rounded-full p-1 shadow focus:outline-none"
          style={{ top: '50%', left: '-15px' }}
          aria-label="Desplazar hacia la izquierda"
        >
          <FaChevronLeft size={14} />
        </button>

        {/* Tabs */}
        <div 
          className="flex flex-nowrap overflow-x-auto no-scrollbar cursor-grab"
          ref={tabsRef}
        >
          {Object.values(MOVIMIENTO_TABS).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center px-4 py-2 text-sm font-medium whitespace-nowrap transition ${
                activeTab === tab
                  ? (CLASES_COLORS[tab]
                      ? `border-b-2 text-${CLASES_COLORS[tab]}-600 border-${CLASES_COLORS[tab]}-600`
                      : "text-blue-600 border-blue-600")
                  : "text-gray-600 hover:text-blue-600"
              }`}
              aria-label={`Mostrar movimientos de ${tab}`}
            >
              {/* Icono */}
              <IconContext.Provider value={{ className: "mr-2" }}>
                {getMovimientoIcon(tab)}
              </IconContext.Provider>
              {/* Nombre de la pestaña */}
              {tab}
            </button>
          ))}
        </div>

        {/* Flecha Derecha */}
        <button
          onClick={scrollTabsRight}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-75 hover:bg-opacity-100 text-black rounded-full p-1 shadow focus:outline-none"
          style={{ top: '50%', right: '-15px' }}
          aria-label="Desplazar hacia la derecha"
        >
          <FaChevronRight size={14} />
        </button>
      </div>

      {/* Lista de Movimientos */}
      <div className="overflow-y-auto max-h-60 md:max-h-80">
        <ul className="divide-y divide-gray-200">
          {filteredMovimientos.length > 0 ? (
            filteredMovimientos.map((mov, index) => (
              <li
                key={mov.id || index}
                className="flex justify-between items-center py-2"
              >
                <div className="flex items-center">
                  {/* Icono del movimiento */}
                  <IconContext.Provider value={{ className: `mr-3 text-${CLASES_COLORS[mov.tipo_movimiento] || 'gray'}-500` }}>
                    {getMovimientoIcon(mov.tipo_movimiento)}
                  </IconContext.Provider>
                  <div>
                    <p className="font-medium">
                      {/* Mostrar el nombre del artículo */}
                      {getArticuloNombre(mov.articulo)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {`${mov.tipo_movimiento} - ${new Date(
                        mov.fecha
                      ).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`}
                    </p>
                  </div>
                </div>
                {/* Mostrar el estado en lugar de la cantidad solo si el tipo de movimiento es "Cambio de Estado" */}
                {mov.tipo_movimiento === MOVIMIENTO_TABS.CAMBIO_ESTADO ? (
                  <p
                    className={`text-lg font-semibold ${getArticuloEstadoColor(
                      getArticuloEstado(mov.articulo)
                    )}`}
                  >
                    {getArticuloEstado(mov.articulo)}
                  </p>
                ) : (
                  <p
                    className={`text-lg font-semibold ${getMovimientoColor(
                      mov.tipo_movimiento
                    )}`}
                  >
                    {mov.cantidad || 0}
                  </p>
                )}
              </li>
            ))
          ) : (
            <li className="text-gray-500 text-sm text-center py-4">
              No hay movimientos en esta categoría.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
