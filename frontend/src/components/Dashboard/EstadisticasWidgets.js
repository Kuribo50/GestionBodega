// src/components/Dashboard/EstadisticasWidgets.js

import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import { FiBox, FiAlertTriangle, FiUserCheck, FiSearch, FiDownload } from "react-icons/fi"; // Añadido FiDownload para ícono de exportación
import { useRouter } from 'next/router'; 
import { fetchArticulos, fetchHistorialPrestamo } from "@/services/api"; 
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import jsPDF from "jspdf";
import "jspdf-autotable";

const MySwal = withReactContent(Swal);

// Configurar el elemento raíz para accesibilidad con react-modal
Modal.setAppElement('#__next');

// Función para exportar Artículos con Bajo Stock a PDF
const exportArticulosBajoStockToPDF = (data) => {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text("Artículos con Bajo Stock", 14, 22);
  
  const tableColumn = ["Artículo", "Stock Actual", "Stock Mínimo"];
  const tableRows = [];

  data.forEach(art => {
    const artData = [
      art.nombre,
      art.stock_actual.toString(),
      art.stock_minimo.toString()
    ];
    tableRows.push(artData);
  });

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 30,
    styles: { fontSize: 12 },
    headStyles: { fillColor: [22, 160, 133] },
  });

  doc.save("articulos_bajo_stock.pdf");
};

// Función para exportar Préstamos Activos a PDF
const exportPrestamosActivosToPDF = (data) => {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text("Préstamos Activos", 14, 22);
  
  const tableColumn = ["Artículo", "Cantidad Prestada", "Prestado a", "Fecha de Préstamo", "Motivo"];
  const tableRows = [];

  data.forEach(p => {
    const rowData = [
      p.articulo ? p.articulo.nombre : "N/D",
      p.cantidad_restante.toString(),
      p.personal ? p.personal.nombre : "N/D",
      new Date(p.fecha_prestamo).toLocaleDateString("es-CL"),
      p.motivo?.nombre || "N/D"
    ];
    tableRows.push(rowData);
  });

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 30,
    styles: { fontSize: 12 },
    headStyles: { fillColor: [22, 160, 133] },
  });

  doc.save("prestamos_activos.pdf");
};

export default function EstadisticasWidgets() {
  const router = useRouter();

  // Estados para estadísticas
  const [totalProductos, setTotalProductos] = useState(0);
  const [productosBajoStock, setProductosBajoStock] = useState(0);
  const [articulosBajoStock, setArticulosBajoStock] = useState([]);
  const [prestamosCount, setPrestamosCount] = useState(0);
  const [prestamosDetalles, setPrestamosDetalles] = useState([]);

  // Estados para modales
  const [isModalBajoStockOpen, setIsModalBajoStockOpen] = useState(false);
  const [isModalPrestamosOpen, setIsModalPrestamosOpen] = useState(false);

  // Estados para búsqueda
  const [searchTermBajoStock, setSearchTermBajoStock] = useState("");
  const [searchTermPrestamos, setSearchTermPrestamos] = useState("");

  // Función para cargar datos de artículos y préstamos
  const fetchDatos = async () => {
    try {
      // 1. Obtener todos los artículos
      const articulos = await fetchArticulos();
      const total = articulos.length;

      // 2. Filtrar artículos con stock por debajo del mínimo
      const bajoStock = articulos.filter(
        (art) => art.stock_actual < art.stock_minimo
      );

      setTotalProductos(total);
      setProductosBajoStock(bajoStock.length);
      setArticulosBajoStock(bajoStock);

      // 3. Obtener historial de préstamos
      const historialPrestamo = await fetchHistorialPrestamo();
      console.log("Historial de Préstamo:", historialPrestamo); // Log del historial

      // Filtrar préstamos activos (cantidad_restante > 0 y sin fecha_devolucion)
      const prestamosActivos = historialPrestamo.filter(
        (p) => p.cantidad_restante > 0 && !p.fecha_devolucion
      );
      console.log("Préstamos Activos Filtrados:", prestamosActivos); // Log de préstamos activos filtrados

      // Calcular la cantidad total prestada sumando la cantidad_restante
      const totalPrestado = prestamosActivos.reduce(
        (acc, p) => acc + p.cantidad_restante,
        0
      );

      setPrestamosCount(totalPrestado);
      setPrestamosDetalles(prestamosActivos);
    } catch (error) {
      console.error("Error al cargar datos en EstadisticasWidgets:", error);
      MySwal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los datos de estadísticas.",
      });
    }
  };

  // Se ejecuta al montar el componente
  useEffect(() => {
    fetchDatos();
  }, []);

  // Handlers para abrir/cerrar modales con actualización de datos
  const handleOpenModalBajoStock = async () => {
    await fetchDatos(); // Actualizar datos antes de abrir el modal
    if (articulosBajoStock.length === 0) {
      MySwal.fire({
        icon: "info",
        title: "Sin Artículos con Bajo Stock",
        text: "No hay artículos con stock por debajo del mínimo.",
      });
      return;
    }
    setIsModalBajoStockOpen(true);
  };

  const handleCloseModalBajoStock = () => {
    setIsModalBajoStockOpen(false);
  };

  const handleOpenModalPrestamos = async () => {
    await fetchDatos(); // Actualizar datos antes de abrir el modal
    if (prestamosDetalles.length === 0) {
      MySwal.fire({
        icon: "info",
        title: "Sin Préstamos Activos",
        text: "No hay artículos prestados en este momento.",
      });
      return;
    }
    setIsModalPrestamosOpen(true);
  };

  const handleCloseModalPrestamos = () => {
    setIsModalPrestamosOpen(false);
  };

  // Filtrar artículos con bajo stock basado en el término de búsqueda
  const filteredArticulosBajoStock = articulosBajoStock.filter(art => 
    art.nombre.toLowerCase().includes(searchTermBajoStock.toLowerCase())
  );

  // Filtrar préstamos activos basado en el término de búsqueda
  const filteredPrestamosDetalles = prestamosDetalles.filter(p => {
    const articuloNombre = p.articulo ? p.articulo.nombre.toLowerCase() : "n/d";
    const personalNombre = p.personal ? p.personal.nombre.toLowerCase() : "n/d";
    const motivoNombre = p.motivo?.nombre ? p.motivo.nombre.toLowerCase() : "n/d";
    const fecha = new Date(p.fecha_prestamo).toLocaleDateString("es-CL").toLowerCase();
    const term = searchTermPrestamos.toLowerCase();
    return (
      articuloNombre.includes(term) ||
      personalNombre.includes(term) ||
      motivoNombre.includes(term) ||
      fecha.includes(term)
    );
  });

  // Render principal: widgets y modales
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        {/* WIDGET: TOTAL PRODUCTOS */}
        <div
          className="flex items-center bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => router.push("/stock/historial-stock")}
        >
          <FiBox className="text-4xl text-blue-500 mr-4" />
          <div>
            <h3 className="text-xl font-semibold text-gray-700">Total Productos</h3>
            <p className="text-3xl font-bold text-gray-800">{totalProductos}</p>
          </div>
        </div>

        {/* WIDGET: PRODUCTOS BAJO STOCK */}
        <div
          className="flex items-center bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
          onClick={handleOpenModalBajoStock}
        >
          <FiAlertTriangle className="text-4xl text-red-500 mr-4" />
          <div>
            <h3 className="text-xl font-semibold text-gray-700">Bajo Stock</h3>
            <p className="text-3xl font-bold text-red-600">{productosBajoStock}</p>
          </div>
        </div>

        {/* WIDGET: PRÉSTAMOS */}
        <div
          className="flex items-center bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
          onClick={handleOpenModalPrestamos}
        >
          <FiUserCheck className="text-4xl text-purple-500 mr-4" />
          <div>
            <h3 className="text-xl font-semibold text-gray-700">Préstamos</h3>
            <p className="text-3xl font-bold text-purple-600">{prestamosCount}</p>
          </div>
        </div>
      </div>

      {/* Modal para Artículos con Bajo Stock */}
      <Modal
        isOpen={isModalBajoStockOpen}
        onRequestClose={handleCloseModalBajoStock}
        contentLabel="Artículos con Bajo Stock"
        className="bg-white rounded-lg shadow-lg max-w-4xl mx-auto p-6 overflow-auto"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Artículos con Bajo Stock</h2>
          <button onClick={handleCloseModalBajoStock} className="text-gray-600 hover:text-gray-800">
            <FiAlertTriangle size={24} />
          </button>
        </div>

        {/* Buscador y Botones de Exportación */}
        <div className="mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
          {/* Buscador */}
          <div className="flex items-center">
            <FiSearch className="text-gray-500 mr-2" />
            <input
              type="text"
              placeholder="Buscar artículo..."
              value={searchTermBajoStock}
              onChange={(e) => setSearchTermBajoStock(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Botones de Exportación */}
          <div className="flex space-x-2">
            <button
              onClick={() => exportArticulosBajoStockToPDF(filteredArticulosBajoStock)}
              className="flex items-center bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700"
            >
              <FiDownload className="mr-2" />
              Exportar a PDF
            </button>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-y-auto max-h-96">
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-200">
                <th className="py-2 px-4 border border-black text-left">Artículo</th>
                <th className="py-2 px-4 border border-black text-left">Stock Actual</th>
                <th className="py-2 px-4 border border-black text-left">Stock Mínimo</th>
              </tr>
            </thead>
            <tbody>
              {filteredArticulosBajoStock.map((art) => (
                <tr key={art.id}>
                  <td className="py-2 px-4 border border-black">{art.nombre}</td>
                  <td className="py-2 px-4 border border-black">{art.stock_actual}</td>
                  <td className="py-2 px-4 border border-black">{art.stock_minimo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* Modal para Préstamos Activos */}
      <Modal
        isOpen={isModalPrestamosOpen}
        onRequestClose={handleCloseModalPrestamos}
        contentLabel="Préstamos Activos"
        className="bg-white rounded-lg shadow-lg max-w-6xl mx-auto p-6 overflow-auto"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Préstamos Activos</h2>
          <button onClick={handleCloseModalPrestamos} className="text-gray-600 hover:text-gray-800">
            <FiUserCheck size={24} />
          </button>
        </div>

        {/* Buscador y Botones de Exportación */}
        <div className="mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
          {/* Buscador */}
          <div className="flex items-center">
            <FiSearch className="text-gray-500 mr-2" />
            <input
              type="text"
              placeholder="Buscar préstamo..."
              value={searchTermPrestamos}
              onChange={(e) => setSearchTermPrestamos(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Botones de Exportación */}
          <div className="flex space-x-2">
            <button
              onClick={() => exportPrestamosActivosToPDF(filteredPrestamosDetalles)}
              className="flex items-center bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700"
            >
              <FiDownload className="mr-2" />
              Exportar a PDF
            </button>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-y-auto max-h-96">
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-200">
                <th className="py-2 px-4 border border-black text-left">Artículo</th>
                <th className="py-2 px-4 border border-black text-left">Cantidad Prestada</th>
                <th className="py-2 px-4 border border-black text-left">Prestado a</th>
                <th className="py-2 px-4 border border-black text-left">Fecha de Préstamo</th>
                <th className="py-2 px-4 border border-black text-left">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {filteredPrestamosDetalles.map((p) => {
                const articuloNombre = p.articulo ? p.articulo.nombre : "N/D";
                const personalNombre = p.personal ? p.personal.nombre : "N/D";
                const personalCorreo = p.personal ? p.personal.correo_institucional : "";
                const fecha = new Date(p.fecha_prestamo).toLocaleDateString("es-CL");
                const motivoNombre = p.motivo?.nombre ? p.motivo.nombre : "N/D";

                return (
                  <tr key={p.id}>
                    <td className="py-2 px-4 border border-black">{articuloNombre}</td>
                    <td className="py-2 px-4 border border-black">{p.cantidad_restante}</td>
                    <td className="py-2 px-4 border border-black">
                      {personalNombre}
                      {personalCorreo && <div className="text-xs text-gray-500">{personalCorreo}</div>}
                    </td>
                    <td className="py-2 px-4 border border-black">{fecha}</td>
                    <td className="py-2 px-4 border border-black">{motivoNombre}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
}
