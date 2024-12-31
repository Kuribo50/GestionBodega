import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Image from "next/image";
import {
  FaHome,
  FaBoxOpen,
  FaUsers,
  FaCog,
  FaBox,
  FaHistory,
  FaBars,
  FaArrowAltCircleUp,
  FaArrowAltCircleDown,
  FaExchangeAlt,
  FaRegClock,
  FaClipboardList,
  FaSignOutAlt,
  // FaUserCircle, // Eliminado según requerimiento
} from "react-icons/fa";
import { logout } from "../services/api"; // Importa la función logout

export default function Sidebar({ isModalOpen, username, role }) {
  // 'username' y 'role' como props
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isStockOpen, setIsStockOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const router = useRouter();

  // Persistir el estado de la sidebar y submenús en localStorage
  useEffect(() => {
    const storedMobileOpen = localStorage.getItem("isMobileOpen");
    const storedStockOpen = localStorage.getItem("isStockOpen");
    const storedHistoryOpen = localStorage.getItem("isHistoryOpen");

    if (storedMobileOpen !== null) {
      setIsMobileOpen(storedMobileOpen === "true");
    }
    if (storedStockOpen !== null) {
      setIsStockOpen(storedStockOpen === "true");
    }
    if (storedHistoryOpen !== null) {
      setIsHistoryOpen(storedHistoryOpen === "true");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("isMobileOpen", isMobileOpen);
  }, [isMobileOpen]);

  useEffect(() => {
    localStorage.setItem("isStockOpen", isStockOpen);
  }, [isStockOpen]);

  useEffect(() => {
    localStorage.setItem("isHistoryOpen", isHistoryOpen);
  }, [isHistoryOpen]);

  const isActive = (path) => router.pathname === path;

  return (
    <>
      {/* Botón para abrir el menú en dispositivos móviles */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="sm:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition duration-200"
        aria-label="Abrir menú"
      >
        <FaBars className="text-gray-800 text-xl" />
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 w-64 h-screen bg-white shadow-lg transition-transform duration-300 ease-in-out ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        } sm:translate-x-0 sm:w-64 ${
          isModalOpen
            ? "z-30 opacity-0 pointer-events-none"
            : "z-40 opacity-100"
        }`}
      >
        <div className="h-full flex flex-col justify-between">
          {/* Parte superior de la sidebar */}
          <div>
            {/* Branding con logo y nombre de usuario */}
            <div className="flex flex-col items-center py-6 bg-white">
              <Image
                src="/logo.jpg" // Asegúrate de que esta ruta sea correcta
                alt="Logo"
                width={100}
                height={80} // Ajustado para un tamaño adecuado
                className="mb-2"
              />
              <span className="text-lg font-semibold">{username}</span>
            </div>

            {/* Navegación */}
            <nav className="space-y-2 px-4 py-6">
              {/* Inicio */}
              <Link
                href="/dashboard"
                className={`flex items-center space-x-4 p-3 rounded-lg transition ${
                  isActive("/dashboard")
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <FaHome className="text-blue-500" />
                <span className="font-medium">Inicio</span>
              </Link>

              {/* Control de Stock con submenu */}
              <div>
                <button
                  onClick={() => setIsStockOpen(!isStockOpen)}
                  className="flex items-center justify-between w-full p-3 rounded-lg text-gray-700 hover:bg-gray-100 transition"
                  aria-expanded={isStockOpen ? "true" : "false"}
                >
                  <div className="flex items-center space-x-4">
                    <FaBoxOpen className="text-green-500" />
                    <span className="font-medium">Control de Stock</span>
                  </div>
                  <span className="text-lg">
                    {isStockOpen ? (
                      <FaArrowAltCircleUp className="text-gray-500" />
                    ) : (
                      <FaArrowAltCircleDown className="text-gray-500" />
                    )}
                  </span>
                </button>
                {isStockOpen && (
                  <div className="ml-6 mt-2 space-y-2">
                    <Link
                      href="/stock/ingreso"
                      className={`flex items-center space-x-4 p-2 rounded-lg transition ${
                        isActive("/stock/ingreso")
                          ? "bg-green-100 text-green-600"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <FaArrowAltCircleDown className="text-green-500" />
                      <span>Ingreso de Stock</span>
                    </Link>
                    <Link
                      href="/stock/salida"
                      className={`flex items-center space-x-4 p-2 rounded-lg transition ${
                        isActive("/stock/salida")
                          ? "bg-red-100 text-red-600"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <FaArrowAltCircleUp className="text-red-500" />
                      <span>Salida de Stock</span>
                    </Link>
                    <Link
                      href="/stock/cambio-estado"
                      className={`flex items-center space-x-4 p-2 rounded-lg transition ${
                        isActive("/stock/cambio-estado")
                          ? "bg-yellow-100 text-yellow-600"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <FaExchangeAlt className="text-yellow-500" />
                      <span>Cambio de Estado</span>
                    </Link>
                    {/* Ingreso de Artículos Nuevos */}
                    <Link
                      href="/stock/IngresoNuevoArticulo"
                      className={`flex items-center space-x-4 p-2 rounded-lg transition ${
                        isActive("/stock/IngresoNuevoArticulo")
                          ? "bg-blue-100 text-blue-600"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <FaBox className="text-blue-500" />
                      <span>Ingreso de Artículos Nuevos</span>
                    </Link>


                  </div>
                )}
              </div>

              {/* Historial con submenu */}
              <div>
                <button
                  onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                  className="flex items-center justify-between w-full p-3 rounded-lg text-gray-700 hover:bg-gray-100 transition"
                  aria-expanded={isHistoryOpen ? "true" : "false"}
                >
                  <div className="flex items-center space-x-4">
                    <FaHistory className="text-purple-500" />
                    <span className="font-medium">Historial</span>
                  </div>
                  <span className="text-lg">
                    {isHistoryOpen ? (
                      <FaArrowAltCircleUp className="text-gray-500" />
                    ) : (
                      <FaArrowAltCircleDown className="text-gray-500" />
                    )}
                  </span>
                </button>
                {isHistoryOpen && (
                  <div className="ml-6 mt-2 space-y-2">
                    <Link
                      href="/stock/historial-stock"
                      className={`flex items-center space-x-4 p-2 rounded-lg transition ${
                        isActive("/stock/historial-stock")
                          ? "bg-purple-100 text-purple-600"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <FaRegClock className="text-purple-500" />
                      <span>Historial de Stock</span>
                    </Link>

                    <Link
                      href="/stock/historial-movimientos"
                      className={`flex items-center space-x-4 p-2 rounded-lg transition ${
                        isActive("/stock/historial-movimientos")
                          ? "bg-purple-100 text-purple-600"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <FaHistory className="text-purple-500" />
                      <span>Historial de Movimientos</span>
                    </Link>
                  </div>
                )}

                <div>


            {/* Préstamo */}
              <Link
                href="/stock/prestamo"
                className={`flex items-center space-x-4 p-2 rounded-lg transition ${
                  isActive("/stock/prestamo")
                    ? "bg-purple-100 text-purple-600"
                    : "text-gray-700 hover:bg-gray-100"}`}>
                <FaClipboardList className="text-purple-500" />
                <span>Préstamo</span>
              </Link>
                </div>

              </div>

              {/* Administración */}
              <Link
                href="/stock/administracion"
                className={`flex items-center space-x-4 p-3 rounded-lg transition ${
                  isActive("/stock/administracion")
                    ? "bg-indigo-100 text-indigo-600"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <FaCog className="text-indigo-500" /> {/* Nuevo Icono */}
                <span className="font-medium">Administración</span>
              </Link>

              {/* Usuarios */}
              <Link
                href="/usuarios"
                className={`flex items-center space-x-4 p-3 rounded-lg transition ${
                  isActive("/usuarios")
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <FaUsers className="text-indigo-500" />
                <span className="font-medium">Usuarios</span>
              </Link>
            </nav>
          </div>

          {/* Parte inferior de la sidebar */}
          <div className="px-4 py-6 border-t border-gray-200">
            {/* Botón de cerrar sesión */}
            <button
              onClick={logout} // Llama a la función logout directamente
              className="flex items-center space-x-4 p-3 rounded-lg text-gray-700 hover:bg-gray-100 transition w-full"
            >
              <FaSignOutAlt className="text-red-500" />
              <span className="font-medium">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
