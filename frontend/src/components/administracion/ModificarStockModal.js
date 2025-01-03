// src/components/administracion/ModificarStockModal.js

import React, { useState, useEffect, useCallback } from 'react';
import Modal from 'react-modal';
import Select from 'react-select';
import { FaSave, FaTimes, FaEdit } from 'react-icons/fa';
import Swal from 'sweetalert2';
import {
  fetchCategorias,
  fetchMarcas,
  fetchModelos,
  fetchUbicaciones,
  fetchEstados,
  fetchArticulos,
  updateArticulos,
} from '../../services/api';

Modal.setAppElement('#__next');

const ModificarStockModal = ({ isOpen, onRequestClose }) => {
  // Estados para almacenar datos
  const [articulos, setArticulos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [estados, setEstados] = useState([]);

  // Estados para manejo de UI y formularios
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedArticulo, setSelectedArticulo] = useState(null);
  const [editedFields, setEditedFields] = useState({
    nombre: '',
    categoria: '',
    marca: '',
    modelo: '',
    descripcion: '',
    codigo_interno: '',
    codigo_minvu: '',
    numero_serie: '',
    mac: '',
    ubicacion: '',
    estado: '',
    stock_actual: '',
  });

  // Estado para manejar errores de duplicación
  const [errors, setErrors] = useState({
    codigo_minvu: false,
    codigo_interno: false,
    numero_serie: false,
    mac: false,
  });

  // Cargar datos cuando el modal se abre
  useEffect(() => {
    if (isOpen) {
      const cargarDatos = async () => {
        setLoading(true);
        try {
          const [
            articulosData,
            categoriasData,
            marcasData,
            modelosData,
            ubicacionesData,
            estadosData,
          ] = await Promise.all([
            fetchArticulos(),
            fetchCategorias(),
            fetchMarcas(),
            fetchModelos(),
            fetchUbicaciones(),
            fetchEstados(),
          ]);

          setArticulos(articulosData.results || articulosData);
          setCategorias(categoriasData.map((cat) => ({ value: cat.id, label: cat.nombre })));
          setMarcas(marcasData.map((marca) => ({ value: marca.id, label: marca.nombre })));
          setModelos(modelosData.map((modelo) => ({ value: modelo.id, label: modelo.nombre })));
          setUbicaciones(ubicacionesData.map((ubicacion) => ({ value: ubicacion.id, label: ubicacion.nombre })));
          setEstados(estadosData.map((estado) => ({ value: estado.id, label: estado.nombre })));
        } catch (error) {
          Swal.fire('Error', 'Error al cargar datos.', 'error');
        } finally {
          setLoading(false);
        }
      };
      cargarDatos();
    }
  }, [isOpen]);

  // Manejar cambios en inputs de texto
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedFields((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Manejar cambios en selectores
  const handleSelectChange = (selectedOption, actionMeta) => {
    const { name } = actionMeta;

    if (name === 'categoria') {
      const categoriaSeleccionada = categorias.find((cat) => cat.value === selectedOption?.value);
      if (categoriaSeleccionada?.label !== 'PC' && editedFields.mac) {
        Swal.fire({
          title: 'Advertencia',
          text: 'El cambio de categoría eliminará el valor de MAC Address.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Continuar',
          cancelButtonText: 'Cancelar',
        }).then((result) => {
          if (result.isConfirmed) {
            setEditedFields((prev) => ({
              ...prev,
              mac: '',
              categoria: selectedOption ? selectedOption.value : '',
            }));
          } else {
            // Revertir selección si el usuario cancela
            setEditedFields((prev) => ({
              ...prev,
              categoria: selectedArticulo ? selectedArticulo.categoria : '',
            }));
          }
        });
      } else {
        setEditedFields((prev) => ({
          ...prev,
          categoria: selectedOption ? selectedOption.value : '',
        }));
      }
    } else {
      setEditedFields((prev) => ({
        ...prev,
        [name]: selectedOption ? selectedOption.value : '',
      }));
    }
  };

  // Manejar la acción de editar un artículo
  const handleEdit = (articulo) => {
    setSelectedArticulo(articulo);
    setEditedFields({
      nombre: articulo.nombre,
      categoria: articulo.categoria,
      marca: articulo.marca,
      modelo: articulo.modelo,
      descripcion: articulo.descripcion,
      codigo_interno: articulo.codigo_interno,
      codigo_minvu: articulo.codigo_minvu,
      numero_serie: articulo.numero_serie,
      mac: articulo.mac,
      ubicacion: articulo.ubicacion,
      estado: articulo.estado,
      stock_actual: articulo.stock_actual,
    });
    setErrors({
      codigo_minvu: false,
      codigo_interno: false,
      numero_serie: false,
      mac: false,
    });
    setIsEditing(true);
  };

  // Función para manejar el guardado de cambios
  const handleSave = async () => {
    // Validaciones en el frontend
    if (!editedFields.nombre.trim()) {
      Swal.fire('Error', 'El nombre del artículo no puede estar vacío.', 'error');
      return;
    }

    if (!editedFields.categoria) {
      Swal.fire('Error', 'Seleccione una categoría.', 'error');
      return;
    }

    if (!editedFields.marca) {
      Swal.fire('Error', 'Seleccione una marca.', 'error');
      return;
    }

    if (!editedFields.modelo) {
      Swal.fire('Error', 'Seleccione un modelo.', 'error');
      return;
    }

    if (!editedFields.ubicacion) {
      Swal.fire('Error', 'Seleccione una ubicación.', 'error');
      return;
    }

    if (!editedFields.estado) {
      Swal.fire('Error', 'Seleccione un estado.', 'error');
      return;
    }

    // Validación de duplicados
    const duplicateFields = [];
    const newErrors = {
      codigo_minvu: false,
      codigo_interno: false,
      numero_serie: false,
      mac: false,
    };

    ['codigo_minvu', 'codigo_interno', 'numero_serie', 'mac'].forEach((field) => {
      const value = editedFields[field].trim().toLowerCase();
      if (value) {
        const isDuplicate = articulos.some(
          (articulo) =>
            articulo[field]?.toLowerCase() === value && articulo.id !== selectedArticulo.id
        );
        if (isDuplicate) {
          duplicateFields.push(field.replace('_', ' '));
          newErrors[field] = true;
        }
      }
    });

    if (duplicateFields.length > 0) {
      setErrors(newErrors);
      Swal.fire(
        'Errores de Duplicación',
        `Los siguientes campos ya existen: ${duplicateFields.join(', ')}.`,
        'error'
      );
      return;
    } else {
      setErrors({
        codigo_minvu: false,
        codigo_interno: false,
        numero_serie: false,
        mac: false,
      });
    }

    // Si la categoría no es 'PC', limpiar el campo MAC
    const categoriaSeleccionada = categorias.find((cat) => cat.value === editedFields.categoria);
    if (categoriaSeleccionada?.label !== 'PC' && editedFields.mac) {
      Swal.fire(
        'Advertencia',
        'La categoría seleccionada no requiere MAC Address. El campo se eliminará.',
        'warning'
      );
      setEditedFields((prev) => ({
        ...prev,
        mac: '',
      }));
    }

    // Intentar actualizar el artículo
    try {
      await updateArticulo(selectedArticulo.id, editedFields);
      Swal.fire('Éxito', 'Cambios guardados correctamente.', 'success');
      setIsEditing(false);

      // Actualizar la lista de artículos en el estado
      setArticulos((prev) =>
        prev.map((art) =>
          art.id === selectedArticulo.id ? { ...art, ...editedFields } : art
        )
      );
    } catch (error) {
      // Los errores ya están manejados en la función updateArticulo
      console.error('Error al guardar los cambios:', error);
    }
  };

  // Función para cancelar la edición
  const handleCancel = () => {
    setIsEditing(false);
    setSelectedArticulo(null);
    setEditedFields({
      nombre: '',
      categoria: '',
      marca: '',
      modelo: '',
      descripcion: '',
      codigo_interno: '',
      codigo_minvu: '',
      numero_serie: '',
      mac: '',
      ubicacion: '',
      estado: '',
      stock_actual: '',
    });
    setErrors({
      codigo_minvu: false,
      codigo_interno: false,
      numero_serie: false,
      mac: false,
    });
  };

  // Definir categoriaSeleccionada para uso en el formulario
  const categoriaSeleccionada = categorias.find((cat) => cat.value === editedFields.categoria);

  // Función para filtrar artículos basado en todos los campos
  const filterArticulos = useCallback((articulos, term) => {
    if (!term) return articulos;
    return articulos.filter((articulo) => {
      const termLower = term.toLowerCase();
      return (
        (articulo.nombre && articulo.nombre.toLowerCase().includes(termLower)) ||
        (categorias.find((cat) => cat.value === articulo.categoria)?.label
          .toLowerCase()
          .includes(termLower)) ||
        (marcas.find((marca) => marca.value === articulo.marca)?.label
          .toLowerCase()
          .includes(termLower)) ||
        (modelos.find((modelo) => modelo.value === articulo.modelo)?.label
          .toLowerCase()
          .includes(termLower)) ||
        (articulo.numero_serie && articulo.numero_serie.toLowerCase().includes(termLower)) ||
        (articulo.codigo_minvu && articulo.codigo_minvu.toLowerCase().includes(termLower)) ||
        (articulo.codigo_interno && articulo.codigo_interno.toLowerCase().includes(termLower)) ||
        (articulo.mac && articulo.mac.toLowerCase().includes(termLower))
      );
    });
  }, [categorias, marcas, modelos]);

  return (
    <>
      {/* Modal de Lista de Artículos */}
      <Modal
        isOpen={isOpen}
        onRequestClose={onRequestClose}
        contentLabel="Lista de Artículos"
        className="bg-white rounded-lg shadow-xl w-full max-w-5xl mx-auto p-6 overflow-auto"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      >
        {/* Encabezado */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Lista de Artículos</h2>
          <button onClick={onRequestClose} className="text-gray-600 hover:text-gray-800">
            <FaTimes size={24} />
          </button>
        </div>

        {/* Campo de Búsqueda */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Buscar artículo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Tabla de Artículos con Scrollbar Vertical */}
        <div className="overflow-y-auto max-h-96">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-blue-100 sticky top-0">
                <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">Nombre</th>
                <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">Categoría</th>
                <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">Marca</th>
                <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">Modelo</th>
                <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">Número de Serie</th>
                <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">Código MINVU</th>
                <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">Código Interno</th>
                <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">MAC</th>
                <th className="py-3 px-6 text-center text-sm font-medium text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-4 text-center text-gray-600">
                    Cargando artículos...
                  </td>
                </tr>
              ) : articulos.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-4 text-center text-gray-600">
                    No se encontraron artículos.
                  </td>
                </tr>
              ) : (
                filterArticulos(articulos, searchTerm).map((articulo) => (
                  <tr key={articulo.id} className="hover:bg-gray-50">
                    <td className="py-3 px-6 text-sm text-gray-700">{articulo.nombre}</td>
                    <td className="py-3 px-6 text-sm text-gray-700">
                      {categorias.find((cat) => cat.value === articulo.categoria)?.label || 'N/A'}
                    </td>
                    <td className="py-3 px-6 text-sm text-gray-700">
                      {marcas.find((marca) => marca.value === articulo.marca)?.label || 'N/A'}
                    </td>
                    <td className="py-3 px-6 text-sm text-gray-700">
                      {modelos.find((modelo) => modelo.value === articulo.modelo)?.label || 'N/A'}
                    </td>
                    <td className="py-3 px-6 text-sm text-gray-700">{articulo.numero_serie || 'N/A'}</td>
                    <td className="py-3 px-6 text-sm text-gray-700">{articulo.codigo_minvu || 'N/A'}</td>
                    <td className="py-3 px-6 text-sm text-gray-700">{articulo.codigo_interno || 'N/A'}</td>
                    <td className="py-3 px-6 text-sm text-gray-700">{articulo.mac || 'N/A'}</td>
                    <td className="py-3 px-6 text-center">
                      <button
                        onClick={() => handleEdit(articulo)}
                        className="text-blue-500 hover:text-blue-700"
                        title="Editar Artículo"
                      >
                        <FaEdit size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* Modal de Edición de Artículo */}
      {isEditing && selectedArticulo && (
        <Modal
          isOpen={isEditing}
          onRequestClose={handleCancel}
          contentLabel="Editar Artículo"
          className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-auto p-6 overflow-auto"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
        >
          {/* Encabezado */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">Editar Artículo</h2>
            <button onClick={handleCancel} className="text-gray-600 hover:text-gray-800">
              <FaTimes size={24} />
            </button>
          </div>

          {/* Formulario de Edición en Diseño Horizontal */}
          <form className="space-y-6">
            {/* Primera Fila: Nombre, Categoría, Stock Actual */}
            <div className="flex flex-col md:flex-row md:space-x-6">
              {/* Nombre */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={editedFields.nombre}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full p-3 border ${
                    errors.nombre ? 'border-red-500' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Nombre del artículo"
                />
              </div>

              {/* Categoría */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Categoría</label>
                <Select
                  name="categoria"
                  value={categorias.find((cat) => cat.value === editedFields.categoria)}
                  onChange={(option) => handleSelectChange(option, { name: 'categoria' })}
                  options={categorias}
                  placeholder="Seleccione una categoría"
                  className="mt-1"
                />
              </div>

              {/* Stock Actual */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Stock Actual</label>
                <input
                  type="text"
                  name="stock_actual"
                  value={editedFields.stock_actual}
                  readOnly
                  className="mt-1 block w-full p-3 border border-gray-300 bg-gray-100 rounded-md cursor-not-allowed"
                />
              </div>
            </div>

            {/* Segunda Fila: Marca, Modelo, Ubicación, Estado */}
            <div className="flex flex-col md:flex-row md:space-x-6">
              {/* Marca */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Marca</label>
                <Select
                  name="marca"
                  value={marcas.find((marca) => marca.value === editedFields.marca)}
                  onChange={(option) => handleSelectChange(option, { name: 'marca' })}
                  options={marcas}
                  placeholder="Seleccione una marca"
                  className="mt-1"
                />
              </div>

              {/* Modelo */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Modelo</label>
                <Select
                  name="modelo"
                  value={modelos.find((modelo) => modelo.value === editedFields.modelo)}
                  onChange={(option) => handleSelectChange(option, { name: 'modelo' })}
                  options={modelos}
                  placeholder="Seleccione un modelo"
                  className="mt-1"
                />
              </div>

              {/* Ubicación */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Ubicación</label>
                <Select
                  name="ubicacion"
                  value={ubicaciones.find((ubicacion) => ubicacion.value === editedFields.ubicacion)}
                  onChange={(option) => handleSelectChange(option, { name: 'ubicacion' })}
                  options={ubicaciones}
                  placeholder="Seleccione una ubicación"
                  className="mt-1"
                />
              </div>

              {/* Estado */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Estado</label>
                <Select
                  name="estado"
                  value={estados.find((estado) => estado.value === editedFields.estado)}
                  onChange={(option) => handleSelectChange(option, { name: 'estado' })}
                  options={estados}
                  placeholder="Seleccione un estado"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Tercera Fila: Código MINVU, Código Interno, Número de Serie, MAC Address */}
            <div className="flex flex-col md:flex-row md:space-x-6">
              {/* Código MINVU */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Código MINVU</label>
                <input
                  type="text"
                  name="codigo_minvu"
                  value={editedFields.codigo_minvu}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full p-3 border ${
                    errors.codigo_minvu ? 'border-red-500' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Código MINVU"
                />
              </div>

              {/* Código Interno */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Código Interno</label>
                <input
                  type="text"
                  name="codigo_interno"
                  value={editedFields.codigo_interno}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full p-3 border ${
                    errors.codigo_interno ? 'border-red-500' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Código Interno"
                />
              </div>

              {/* Número de Serie */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Número de Serie</label>
                <input
                  type="text"
                  name="numero_serie"
                  value={editedFields.numero_serie}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full p-3 border ${
                    errors.numero_serie ? 'border-red-500' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Número de Serie"
                />
              </div>

              {/* MAC Address */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">MAC Address</label>
                <input
                  type="text"
                  name="mac"
                  value={editedFields.mac}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full p-3 border ${
                    errors.mac
                      ? 'border-red-500'
                      : categoriaSeleccionada?.label !== 'PC'
                      ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
                      : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="MAC Address"
                  disabled={categoriaSeleccionada?.label !== 'PC'}
                />
              </div>
            </div>

            {/* Cuarta Fila: Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Descripción</label>
              <textarea
                name="descripcion"
                value={editedFields.descripcion}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Descripción del artículo"
                rows="3"
              />
            </div>

            {/* Botones de Acción */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
              >
                <FaSave className="mr-2" />
                Guardar
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
              >
                <FaTimes className="mr-2" />
                Salir
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
};

export default ModificarStockModal;
