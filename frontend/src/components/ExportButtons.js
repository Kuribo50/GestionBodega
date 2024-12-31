// src/components/ExportButtons.js

import React from 'react';
import {
  exportHistorialStockExcel,
  exportHistorialStockPDF,
  exportHistorialMovimientosExcel,
  exportHistorialMovimientosPDF,
  exportHistorialPrestamosExcel,
  exportHistorialPrestamosPDF,
} from '../services/api';

const ExportButtons = ({ filtros }) => {
  return (
    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
      {/* Historial de Stock */}
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <button
          onClick={() => exportHistorialStockExcel(filtros)}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
          Exportar Stock Excel
        </button>
        <button
          onClick={() => exportHistorialStockPDF(filtros)}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
          Exportar Stock PDF
        </button>
      </div>

      {/* Historial de Movimientos */}
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <button
          onClick={() => exportHistorialMovimientosExcel(filtros)}
          className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
        >
          Exportar Movimientos Excel
        </button>
        <button
          onClick={() => exportHistorialMovimientosPDF(filtros)}
          className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
        >
          Exportar Movimientos PDF
        </button>
      </div>

      {/* Historial de Préstamos */}
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <button
          onClick={() => exportHistorialPrestamosExcel(filtros)}
          className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
        >
          Exportar Préstamos Excel
        </button>
        <button
          onClick={() => exportHistorialPrestamosPDF(filtros)}
          className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
        >
          Exportar Préstamos PDF
        </button>
      </div>
    </div>
  );
};

export default ExportButtons;
