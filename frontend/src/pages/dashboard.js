// src/pages/dashboard.js

import { useEffect, useState , useCallback} from "react";
import { useRouter } from "next/router";
import Swal from "sweetalert2"; // Importar SweetAlert2
import Sidebar from "@/components/Sidebar";
import EstadisticasWidgets from "@/components/Dashboard/EstadisticasWidgets";
import MovimientosRecientes from "@/components/Dashboard/MovimientosRecientes";
import GraficaIngresos from "@/components/Dashboard/GraficaIngresos";
import CalendarRange from "@/components/Dashboard/Calendar";

import { fetchArticulos, fetchMovimientos } from "@/services/api";
import { FiLogOut, FiAlertCircle, FiUser } from "react-icons/fi";

export default function Dashboard() {
  const [articulos, setArticulos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alerta, setAlerta] = useState(false); // Cambiado a booleano
  const [usuario, setUsuario] = useState(null);

  const router = useRouter();

  // Cargar datos para el dashboard
  const loadData = useCallback(async () => {
    try {
      const [articulosData, movimientosData] = await Promise.all([
        fetchArticulos(),
        fetchMovimientos(),
      ]);
  
      setArticulos(articulosData);
      setMovimientos(movimientosData);
  
      // Verificar stock bajo
      const productosBajoStock = articulosData.filter(
        (art) => art.stock_actual < art.stock_minimo
      ).length;
  
      if (productosBajoStock > 0 && !alerta) {
        const mensaje = `Tienes ${productosBajoStock} producto(s) con stock por debajo del mínimo`;
        setAlerta(true); // Solo mostrar una vez
        Swal.fire({
          icon: "warning",
          title: "Stock bajo",
          text: mensaje,
          confirmButtonText: "Entendido",
        });
      }
    } catch (error) {
      console.error("Error al cargar datos:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al cargar los datos del dashboard.",
      });
    } finally {
      setLoading(false);
    }
  }, [alerta]);

  // Cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    Swal.fire({
      icon: "success",
      title: "Sesión cerrada",
      text: "Has cerrado sesión correctamente.",
    }).then(() => {
      router.replace("/login");
    });
  };

  // Efecto para verificar el token y cargar datos
  useEffect(() => {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      router.replace("/login");
      return;
    }
    const userData = localStorage.getItem("user");
    if (userData) {
      setUsuario(JSON.parse(userData));
    }
    loadData();
  }, [router, loadData]);
  

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Contenido Principal */}
      <main className="flex-1 p-6 sm:ml-64">
        {/* Encabezado */}
        <div className="flex items-center justify-between mb-6">
          {usuario && (
            <div className="flex items-center space-x-2">
              <FiUser className="text-2xl text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  ¡Hola, {usuario.username}!
                </h1>
                <p className="text-sm text-gray-600">
                  Bienvenido a tu panel de control.
                </p>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
          >
            <FiLogOut className="mr-2" />
            Cerrar Sesión
          </button>
        </div>

        {/* Widgets Estadísticos */}
        <EstadisticasWidgets />

        {/* Gráfica + Movimientos (lado a lado) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Gráfica */}
          <section className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <FiAlertCircle className="text-2xl text-blue-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-700">
                Entradas, Salidas, Préstamos, etc. (Semana)
              </h2>
            </div>
            <GraficaIngresos movimientos={movimientos} />
          </section>

          {/* Movimientos Recientes con Tabs */}
          <MovimientosRecientes />
        </div>

        {/* Calendario con Rango de Fechas */}
        <div className="mt-6">
          <CalendarRange />
        </div>
      </main>
    </div>
  );
}
