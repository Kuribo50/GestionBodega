import React from 'react';

const Modal = ({ isOpen, onClose, articulos }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 md:w-1/3">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">Artículos Bajo Stock</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
        </div>
        <ul className="mt-4 space-y-4">
          {articulos.map((articulo) => (
            <li key={articulo.id} className="border-b py-2">
              <p className="font-semibold">{articulo.nombre}</p>
              <p className="text-gray-600">Stock: {articulo.stock_actual}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Modal;
