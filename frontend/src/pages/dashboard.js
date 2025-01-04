// src/pages/dashboard.js

import { useEffect, useState, useCallback } from "react";
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

      // Verificar si la alerta ya fue mostrada en esta sesión
      const stockAlertShown = sessionStorage.getItem("stockAlertShown");

      if (productosBajoStock > 0 && !stockAlertShown) {
        const mensaje = `Tienes ${productosBajoStock} producto(s) con stock por debajo del mínimo`;

        // Alerta de "Advertencia" (Stock bajo) con botón color verde
        Swal.fire({
          icon: "warning",
          title: "Stock bajo",
          text: mensaje,
          confirmButtonText: "Entendido",
          confirmButtonColor: "#28a745", // Botón verde
        }).then(() => {
          // Marcar que la alerta ya fue mostrada en esta sesión
          sessionStorage.setItem("stockAlertShown", "true");
        });
      }
    } catch (error) {
      console.error("Error al cargar datos:", error);

      // Alerta de "Error" con botón color rojo
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al cargar los datos del dashboard.",
        confirmButtonColor: "#dc3545", // Botón rojo
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("stockAlertShown"); // Limpiar la bandera de la alerta

    // Alerta de "Éxito" (cierre de sesión) con botón color verde
    Swal.fire({
      icon: "success",
      title: "Sesión cerrada",
      text: "Has cerrado sesión correctamente.",
      confirmButtonColor: "#28a745", // Botón verde
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

  // Manejo de carga y errores antes de renderizar la UI
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="flex flex-col items-center">
          <svg
            className="animate-spin h-10 w-10 text-blue-500 mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            ></path>
          </svg>
          <div className="text-xl text-blue-500">Cargando...</div>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="text-xl text-red-500">No se encontró el usuario.</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Contenido Principal */}
      <main className="flex-1 p-6 sm:ml-64">
        {/* Encabezado */}
        <div className="flex items-center justify-between mb-6">
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
