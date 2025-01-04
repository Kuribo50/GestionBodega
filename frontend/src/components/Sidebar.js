// src/components/Sidebar.js

import { useState, useEffect } from "react";
import Link from "next/link"; // Importación correcta de Link
import { useRouter } from "next/router";
import Image from "next/image";
import {
  FaHome,
  FaBoxOpen,
  FaUsers,
  FaCog,
  FaHistory,
  FaBars,
  FaArrowAltCircleUp,
  FaArrowAltCircleDown,
  FaExchangeAlt,
  FaClock,
  FaHandshake, // Ícono más intuitivo para "Préstamo"
  FaSignOutAlt,
} from "react-icons/fa";
import { logout } from "../services/api"; // Asegúrate de que esta función maneje el logout correctamente

export default function Sidebar({ username }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isStockOpen, setIsStockOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const router = useRouter();

  // Cargar estados desde localStorage al montar
  useEffect(() => {
    const storedMobileOpen = localStorage.getItem("isMobileOpen") === "true";
    const storedStockOpen = localStorage.getItem("isStockOpen") === "true";
    const storedHistoryOpen = localStorage.getItem("isHistoryOpen") === "true";

    setIsMobileOpen(storedMobileOpen);
    setIsStockOpen(storedStockOpen);
    setIsHistoryOpen(storedHistoryOpen);
  }, []);

  // Guardar estados en localStorage cuando cambian
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

  // Función para cerrar el Sidebar en dispositivos móviles después de seleccionar un enlace
  const handleLinkClick = () => {
    if (isMobileOpen) setIsMobileOpen(false);
  };

  return (
    <>
      {/* Botón para abrir el menú en dispositivos móviles */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="sm:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Abrir menú"
        aria-expanded={isMobileOpen ? "true" : "false"}
      >
        <FaBars className="text-gray-800 text-xl" />
      </button>

      {/* Overlay para cerrar el Sidebar al hacer clic fuera en móviles */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-30 sm:hidden"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 w-64 h-screen bg-white shadow-lg transition-transform duration-300 ease-in-out z-40 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        } sm:translate-x-0`}
      >
        <div className="h-full flex flex-col justify-between">
          {/* Parte superior de la sidebar */}
          <div>
            {/* Branding con logo y nombre de usuario */}
            <div className="flex flex-col items-center py-6 bg-white border-b border-gray-200">
              <Image
                src="/logo.jpg" // Asegúrate de que esta ruta sea correcta
                alt="Logo"
                width={80}
                height={80}
                className="mb-2 rounded-md"
              />
              <span className="text-lg font-semibold text-gray-800">{username}</span>
            </div>

            {/* Navegación */}
            <nav className="flex-1 px-4 py-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <ul className="space-y-2">
                {/* Inicio */}
                <li>
                  <Link
                    href="/dashboard"
                    className={`flex items-center space-x-4 p-3 rounded-lg transition-colors ${
                      isActive("/dashboard")
                        ? "bg-blue-100 text-blue-600"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={handleLinkClick}
                  >
                    <FaHome className="text-blue-500 w-5 h-5" />
                    <span className="font-medium">Inicio</span>
                  </Link>
                </li>

                {/* Control de Stock con submenu */}
                <li>
                  <button
                    onClick={() => setIsStockOpen(!isStockOpen)}
                    className="flex items-center justify-between w-full p-3 rounded-lg text-gray-700 hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-expanded={isStockOpen ? "true" : "false"}
                  >
                    <div className="flex items-center space-x-4">
                      <FaBoxOpen className="text-green-500 w-5 h-5" />
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
                    <ul className="ml-6 mt-2 space-y-2">
                      <li>
                        <Link
                          href="/stock/ingreso"
                          className={`flex items-center space-x-4 p-2 rounded-lg transition-colors ${
                            isActive("/stock/ingreso")
                              ? "bg-green-100 text-green-600"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                          onClick={handleLinkClick}
                        >
                          <FaArrowAltCircleDown className="text-green-500 w-4 h-4" />
                          <span>Ingreso de Stock</span>
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/stock/salida"
                          className={`flex items-center space-x-4 p-2 rounded-lg transition-colors ${
                            isActive("/stock/salida")
                              ? "bg-red-100 text-red-600"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                          onClick={handleLinkClick}
                        >
                          <FaArrowAltCircleUp className="text-red-500 w-4 h-4" />
                          <span>Salida de Stock</span>
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/stock/cambio-estado"
                          className={`flex items-center space-x-4 p-2 rounded-lg transition-colors ${
                            isActive("/stock/cambio-estado")
                              ? "bg-yellow-100 text-yellow-600"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                          onClick={handleLinkClick}
                        >
                          <FaExchangeAlt className="text-yellow-500 w-5 h-5" />
                          <span>Cambio de Estado</span>
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/stock/IngresoNuevoArticulo"
                          className={`flex items-center space-x-4 p-2 rounded-lg transition-colors ${
                            isActive("/stock/IngresoNuevoArticulo")
                              ? "bg-blue-100 text-blue-600"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                          onClick={handleLinkClick}
                        >
                          <FaBoxOpen className="text-blue-500 w-5 h-5" />
                          <span>Ingreso de Artículos Nuevos</span>
                        </Link>
                      </li>
                    </ul>
                  )}
                </li>

                {/* Historial con submenu */}
                <li>
                  <button
                    onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                    className="flex items-center justify-between w-full p-3 rounded-lg text-gray-700 hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-expanded={isHistoryOpen ? "true" : "false"}
                  >
                    <div className="flex items-center space-x-4">
                      <FaHistory className="text-purple-500 w-5 h-5" />
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
                    <ul className="ml-6 mt-2 space-y-2">
                      <li>
                        <Link
                          href="/stock/historial-stock"
                          className={`flex items-center space-x-4 p-2 rounded-lg transition-colors ${
                            isActive("/stock/historial-stock")
                              ? "bg-purple-100 text-purple-600"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                          onClick={handleLinkClick}
                        >
                          <FaClock className="text-purple-500 w-5 h-5" />
                          <span>Historial de Stock</span>
                        </Link>
                      </li>

                      <li>
                        <Link
                          href="/stock/historial-movimientos"
                          className={`flex items-center space-x-4 p-2 rounded-lg transition-colors ${
                            isActive("/stock/historial-movimientos")
                              ? "bg-purple-100 text-purple-600"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                          onClick={handleLinkClick}
                        >
                          <FaHistory className="text-purple-500 w-5 h-5" />
                          <span>Historial de Movimientos</span>
                        </Link>
                      </li>
                    </ul>
                  )}
                </li>

                {/* Préstamo */}
                <li>
                  <Link
                    href="/stock/prestamo"
                    className={`flex items-center space-x-4 p-3 rounded-lg transition-colors ${
                      isActive("/stock/prestamo")
                        ? "bg-green-100 text-green-600"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={handleLinkClick}
                  >
                    <FaHandshake className="text-green-500 w-5 h-5" /> {/* Ícono más intuitivo */}
                    <span className="font-medium">Préstamo</span>
                  </Link>
                </li>

                {/* Administración */}
                <li>
                  <Link
                    href="/stock/administracion"
                    className={`flex items-center space-x-4 p-3 rounded-lg transition-colors ${
                      isActive("/stock/administracion")
                        ? "bg-indigo-100 text-indigo-600"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={handleLinkClick}
                  >
                    <FaCog className="text-indigo-500 w-5 h-5" />
                    <span className="font-medium">Administración</span>
                  </Link>
                </li>

                {/* Usuarios */}
                <li>
                  <Link
                    href="/usuarios"
                    className={`flex items-center space-x-4 p-3 rounded-lg transition-colors ${
                      isActive("/usuarios")
                        ? "bg-blue-100 text-blue-600"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={handleLinkClick}
                  >
                    <FaUsers className="text-indigo-500 w-5 h-5" />
                    <span className="font-medium">Usuarios</span>
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Parte inferior de la sidebar */}
          <div className="px-4 py-6 border-t border-gray-200">
            {/* Nombre del usuario */}
            <div className="mb-4 text-center">
              <span className="text-gray-700 font-medium">{username}</span>
            </div>
            {/* Botón de cerrar sesión */}
            <button
              onClick={() => {
                logout();
                handleLinkClick();
              }}
              className="flex items-center space-x-4 p-3 rounded-lg text-gray-700 hover:bg-gray-100 transition w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <FaSignOutAlt className="text-red-500 w-5 h-5" />
              <span className="font-medium">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
