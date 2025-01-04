// src/components/administracion/ModificarStockModal.js

import React, { useState, useEffect, useCallback } from 'react';
import Modal from 'react-modal';
import Select from 'react-select';
import { FaSave, FaTimes, FaEdit } from 'react-icons/fa';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

import {
  fetchCategorias,
  fetchMarcas,
  fetchModelos,
  fetchUbicaciones,
  fetchEstados,
  fetchArticulos,
  updateArticulos, // Nombre exacto de la función en tu api
} from '../../services/api';

const MySwal = withReactContent(Swal);

Modal.setAppElement('#__next');

// Capitalizar strings (p.ej., al mostrar errores)
const capitalize = (s) =>
  typeof s === 'string' ? s.charAt(0).toUpperCase() + s.slice(1) : s;

const ModificarStockModal = ({ isOpen, onRequestClose }) => {
  // Datos de la API
  const [articulos, setArticulos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [estados, setEstados] = useState([]);

  // Búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Edición
  const [isEditing, setIsEditing] = useState(false);
  const [selectedArticulo, setSelectedArticulo] = useState(null);

  // Campos editados
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
    stock_actual: '',
    // Removido "estado" para que no se edite aquí
  });

  // Errores (duplicados, etc.)
  const [errors, setErrors] = useState({
    codigo_minvu: false,
    codigo_interno: false,
    numero_serie: false,
    mac: false,
  });

  // Indicador de carga
  const [isProcessing, setIsProcessing] = useState(false);

  // Cargar datos cuando se abre el modal principal
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

          // Mapeo a react-select
          setCategorias(
            (categoriasData.results || categoriasData).map((c) => ({
              value: c.id,
              label: c.nombre,
            }))
          );
          setMarcas(
            (marcasData.results || marcasData).map((m) => ({
              value: m.id,
              label: m.nombre,
            }))
          );
          setModelos(
            (modelosData.results || modelosData).map((md) => ({
              value: md.id,
              label: md.nombre,
            }))
          );
          setUbicaciones(
            (ubicacionesData.results || ubicacionesData).map((ub) => ({
              value: ub.id,
              label: ub.nombre,
            }))
          );
          setEstados(
            (estadosData.results || estadosData).map((es) => ({
              value: es.id,
              label: es.nombre,
            }))
          );
        } catch (error) {
          MySwal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al cargar datos.',
            customClass: {
              confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
            },
            buttonsStyling: false,
          });
        } finally {
          setLoading(false);
        }
      };
      cargarDatos();
    }
  }, [isOpen]);

  // Manejadores de formularios
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedFields((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (selectedOption, actionMeta) => {
    const { name } = actionMeta;
    setEditedFields((prev) => ({
      ...prev,
      [name]: selectedOption ? selectedOption.value : '',
    }));
  };

  // Búsqueda local
  const filterArticulos = useCallback(
    (list, term) => {
      if (!term) return list;
      const lowerTerm = term.toLowerCase();

      return list.filter((art) => {
        const catLabel = categorias.find((cat) => cat.value === art.categoria)?.label || '';
        const marcaLabel = marcas.find((m) => m.value === art.marca)?.label || '';
        const modeloLabel = modelos.find((md) => md.value === art.modelo)?.label || '';
        const ubicLabel = ubicaciones.find((ub) => ub.value === art.ubicacion)?.label || '';
        const estadoLabel = estados.find((es) => es.value === art.estado)?.label || '';
        const desc = art.descripcion || '';

        return (
          (art.nombre && art.nombre.toLowerCase().includes(lowerTerm)) ||
          catLabel.toLowerCase().includes(lowerTerm) ||
          marcaLabel.toLowerCase().includes(lowerTerm) ||
          modeloLabel.toLowerCase().includes(lowerTerm) ||
          ubicLabel.toLowerCase().includes(lowerTerm) ||
          estadoLabel.toLowerCase().includes(lowerTerm) ||
          (art.numero_serie && art.numero_serie.toLowerCase().includes(lowerTerm)) ||
          (art.codigo_minvu && art.codigo_minvu.toLowerCase().includes(lowerTerm)) ||
          (art.codigo_interno && art.codigo_interno.toLowerCase().includes(lowerTerm)) ||
          (art.mac && art.mac.toLowerCase().includes(lowerTerm)) ||
          desc.toLowerCase().includes(lowerTerm)
        );
      });
    },
    [categorias, marcas, modelos, ubicaciones, estados]
  );

  // Inicia edición
  const handleEdit = (art) => {
    setSelectedArticulo(art);
    setEditedFields({
      nombre: art.nombre || '',
      categoria: art.categoria || '',
      marca: art.marca || '',
      modelo: art.modelo || '',
      descripcion: art.descripcion || '',
      codigo_interno: art.codigo_interno || '',
      codigo_minvu: art.codigo_minvu || '',
      numero_serie: art.numero_serie || '',
      mac: art.mac || '',
      ubicacion: art.ubicacion || '',
      stock_actual: art.stock_actual != null ? String(art.stock_actual) : '',
      // estado removido
    });
    setErrors({
      codigo_minvu: false,
      codigo_interno: false,
      numero_serie: false,
      mac: false,
    });
    setIsEditing(true);
  };

  // Guardar cambios
  const handleSave = async () => {
    // Si la categoría es 'PC', mac es obligatorio
    const categoriaObj = categorias.find(
      (cat) => cat.value === editedFields.categoria
    );
    if (categoriaObj?.label === 'PC' && !editedFields.mac.trim()) {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'La categoría "PC" requiere MAC Address.',
        customClass: {
          confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });
      return;
    }

    // Verificar duplicados
    const fieldsToCheck = ['codigo_minvu', 'codigo_interno', 'numero_serie', 'mac'];
    const duplicateFields = [];
    const newErrors = {
      codigo_minvu: false,
      codigo_interno: false,
      numero_serie: false,
      mac: false,
    };

    fieldsToCheck.forEach((field) => {
      const val = editedFields[field];
      if (typeof val === 'string' && val.trim() !== '') {
        const lowerVal = val.trim().toLowerCase();
        const isDuplicate = articulos.some(
          (a) => a[field]?.toLowerCase() === lowerVal && a.id !== selectedArticulo.id
        );
        if (isDuplicate) {
          duplicateFields.push(field.replace('_', ' '));
          newErrors[field] = true;
        }
      }
    });
    setErrors(newErrors);

    // Construir payload
    const updatedPayload = {};
    Object.keys(editedFields).forEach((field) => {
      const originalValue = selectedArticulo[field] || '';
      let currentValue = editedFields[field];
      if (typeof currentValue === 'string') {
        currentValue = currentValue.trim();
      }

      // Omitir campos duplicados
      if (fieldsToCheck.includes(field) && newErrors[field] === true) {
        return; // no lo actualizamos
      }

      // Actualizar solo si cambió
      if (currentValue !== originalValue) {
        updatedPayload[field] = currentValue;
      }
    });

    // Sin cambios
    if (Object.keys(updatedPayload).length === 0) {
      if (duplicateFields.length > 0) {
        // Solo hubo duplicados
        MySwal.fire({
          icon: 'error',
          title: 'Errores de Duplicación',
          html: `No se actualizaron campos por duplicación en: <b>${duplicateFields.join(', ')}</b>.`,
          customClass: {
            confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
          },
          buttonsStyling: false,
        });
      } else {
        // Nada cambió
        MySwal.fire({
          icon: 'info',
          title: 'Sin cambios',
          text: 'No se realizaron modificaciones.',
          customClass: {
            confirmButton: 'bg-blue-600 text-white px-4 py-2 rounded-md',
          },
          buttonsStyling: false,
        });
      }
      return;
    }

    // Si la categoría no es 'PC', remover mac
    if (categoriaObj?.label !== 'PC' && typeof updatedPayload.mac === 'string') {
      MySwal.fire({
        icon: 'warning',
        title: 'Advertencia',
        text: 'La categoría no es "PC". Se eliminará el campo MAC Address.',
        customClass: {
          confirmButton: 'bg-yellow-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });
      delete updatedPayload.mac;
    }

    if (Object.keys(updatedPayload).length === 0) return;

    // Llamar a la API
    try {
      setIsProcessing(true);
      await updateArticulos(selectedArticulo.id, updatedPayload);

      MySwal.fire({
        icon: 'success',
        title: 'Éxito',
        html:
          duplicateFields.length > 0
            ? `Cambios guardados, excepto los duplicados: <b>${duplicateFields.join(', ')}</b>.`
            : 'Cambios guardados correctamente.',
        customClass: {
          confirmButton: 'bg-green-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });

      // Actualizar local
      setArticulos((prev) =>
        prev.map((a) =>
          a.id === selectedArticulo.id ? { ...a, ...updatedPayload } : a
        )
      );
      setIsEditing(false);
      setSelectedArticulo(null);
    } catch (err) {
      console.error('Error al guardar los cambios:', err);
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ocurrió un error al intentar actualizar el artículo.',
        customClass: {
          confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Cancelar edición
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
      stock_actual: '',
    });
    setErrors({
      codigo_minvu: false,
      codigo_interno: false,
      numero_serie: false,
      mac: false,
    });
  };

  return (
    <>
      {/* Modal - Lista de Artículos */}
      <Modal
        isOpen={isOpen}
        onRequestClose={onRequestClose}
        contentLabel="Lista de Artículos"
        className="bg-white rounded-lg shadow-xl w-full max-w-5xl mx-auto p-6 overflow-auto relative"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      >
        {/* Overlay de Carga */}
        {isProcessing && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex justify-center items-center z-50">
            <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-16 w-16"></div>
          </div>
        )}

        {/* Encabezado */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-blue-800">Lista de Artículos</h2>
          <button
            onClick={onRequestClose}
            className="text-gray-600 hover:text-gray-800"
            title="Cerrar Modal"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Campo de Búsqueda */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar artículo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Tabla con todas las columnas (Acciones primero) */}
        {loading ? (
          <p className="text-center text-lg text-gray-600">Cargando artículos...</p>
        ) : articulos.length === 0 ? (
          <p className="text-center text-lg text-gray-600">No se encontraron artículos.</p>
        ) : (
          <div className="overflow-y-auto max-h-96">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-blue-100 sticky top-0">
                  {/* Acciones primero */}
                  <th className="py-3 px-6 text-center text-sm font-medium text-blue-700">
                    Acciones
                  </th>
                  <th className="py-3 px-6 text-left text-sm font-medium text-blue-700">Nombre</th>
                  <th className="py-3 px-6 text-left text-sm font-medium text-blue-700">Categoría</th>
                  <th className="py-3 px-6 text-left text-sm font-medium text-blue-700">
                    Stock Actual
                  </th>
                  <th className="py-3 px-6 text-left text-sm font-medium text-blue-700">Marca</th>
                  <th className="py-3 px-6 text-left text-sm font-medium text-blue-700">Modelo</th>
                  <th className="py-3 px-6 text-left text-sm font-medium text-blue-700">
                    Ubicación
                  </th>
                  <th className="py-3 px-6 text-left text-sm font-medium text-blue-700">Estado</th>
                  <th className="py-3 px-6 text-left text-sm font-medium text-blue-700">
                    Cód. MINVU
                  </th>
                  <th className="py-3 px-6 text-left text-sm font-medium text-blue-700">
                    Cód. Interno
                  </th>
                  <th className="py-3 px-6 text-left text-sm font-medium text-blue-700">
                    Nº Serie
                  </th>
                  <th className="py-3 px-6 text-left text-sm font-medium text-blue-700">MAC</th>
                  <th className="py-3 px-6 text-left text-sm font-medium text-blue-700">
                    Descripción
                  </th>
                </tr>
              </thead>
              <tbody>
                {filterArticulos(articulos, searchTerm).map((art) => {
                  const catLabel =
                    categorias.find((c) => c.value === art.categoria)?.label || 'N/A';
                  const marcaLabel =
                    marcas.find((m) => m.value === art.marca)?.label || 'N/A';
                  const modeloLabel =
                    modelos.find((md) => md.value === art.modelo)?.label || 'N/A';
                  const ubiLabel =
                    ubicaciones.find((ub) => ub.value === art.ubicacion)?.label || 'N/A';
                  const estLabel =
                    estados.find((es) => es.value === art.estado)?.label || 'N/A';

                  return (
                    <tr key={art.id} className="hover:bg-gray-50">
                      {/* Acciones primero */}
                      <td className="py-3 px-6 text-center">
                        <button
                          onClick={() => handleEdit(art)}
                          className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                          title="Editar Artículo"
                        >
                          <FaEdit size={18} />
                        </button>
                      </td>
                      <td className="py-3 px-6 text-sm text-gray-700">{art.nombre || 'N/A'}</td>
                      <td className="py-3 px-6 text-sm text-gray-700">{catLabel}</td>
                      <td className="py-3 px-6 text-sm text-gray-700">
                        {art.stock_actual != null ? art.stock_actual : '0'}
                      </td>
                      <td className="py-3 px-6 text-sm text-gray-700">{marcaLabel}</td>
                      <td className="py-3 px-6 text-sm text-gray-700">{modeloLabel}</td>
                      <td className="py-3 px-6 text-sm text-gray-700">{ubiLabel}</td>
                      <td className="py-3 px-6 text-sm text-gray-700">{estLabel}</td>
                      <td className="py-3 px-6 text-sm text-gray-700">
                        {art.codigo_minvu || 'N/A'}
                      </td>
                      <td className="py-3 px-6 text-sm text-gray-700">
                        {art.codigo_interno || 'N/A'}
                      </td>
                      <td className="py-3 px-6 text-sm text-gray-700">
                        {art.numero_serie || 'N/A'}
                      </td>
                      <td className="py-3 px-6 text-sm text-gray-700">{art.mac || 'N/A'}</td>
                      <td className="py-3 px-6 text-sm text-gray-700">
                        {art.descripcion || 'N/A'}
                      </td>
                    </tr>
                  );
                })}
                {filterArticulos(articulos, searchTerm).length === 0 && (
                  <tr>
                    <td colSpan="13" className="py-4 text-center text-gray-600">
                      No se encontraron artículos con ese criterio.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Loader Spinner CSS */}
        <style jsx>{`
          .loader {
            border-top-color: #3498db;
            animation: spinner 1.5s linear infinite;
          }
          @keyframes spinner {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </Modal>

      {/* Segundo Modal: Edición (Responsivo con scrollbar) */}
      {isEditing && selectedArticulo && (
        <Modal
          isOpen={isEditing}
          onRequestClose={handleCancel}
          contentLabel="Editar Artículo"
          className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-auto p-6 outline-none relative
                     max-h-[90vh] overflow-y-auto" 
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
        >
          {/* Overlay de Carga */}
          {isProcessing && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex justify-center items-center z-50">
              <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-16 w-16"></div>
            </div>
          )}

          {/* Encabezado */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-blue-800">Editar Artículo</h2>
            <button onClick={handleCancel} className="text-gray-600 hover:text-gray-800">
              <FaTimes size={24} />
            </button>
          </div>

          {/* Formulario de Edición con Scroll y Responsivo */}
          <form className="space-y-6">
            {/* Fila 1: Nombre, Categoría, Stock Actual */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={editedFields.nombre}
                  onChange={handleInputChange}
                  className="mt-1 block w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ingrese nombre"
                />
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Categoría</label>
                <Select
                  name="categoria"
                  value={categorias.find((cat) => cat.value === editedFields.categoria)}
                  onChange={handleSelectChange}
                  options={categorias}
                  placeholder="Ingrese categoría"
                  className="mt-1"
                />
              </div>

              {/* Stock Actual (Solo lectura) */}
              <div>
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

            {/* Fila 2: Marca, Modelo, Ubicación (Estado no se edita) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Marca</label>
                <Select
                  name="marca"
                  value={marcas.find((m) => m.value === editedFields.marca)}
                  onChange={handleSelectChange}
                  options={marcas}
                  placeholder="Ingrese marca"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Modelo</label>
                <Select
                  name="modelo"
                  value={modelos.find((md) => md.value === editedFields.modelo)}
                  onChange={handleSelectChange}
                  options={modelos}
                  placeholder="Ingrese modelo"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Ubicación</label>
                <Select
                  name="ubicacion"
                  value={ubicaciones.find((ub) => ub.value === editedFields.ubicacion)}
                  onChange={handleSelectChange}
                  options={ubicaciones}
                  placeholder="Ingrese ubicación"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Fila 3: Codigo MINVU, Codigo Interno, Numero de Serie, MAC */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Código MINVU</label>
                <input
                  type="text"
                  name="codigo_minvu"
                  value={editedFields.codigo_minvu}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full p-3 border ${
                    errors.codigo_minvu ? 'border-red-500' : 'border-gray-300'
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Ingrese código MINVU"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Código Interno</label>
                <input
                  type="text"
                  name="codigo_interno"
                  value={editedFields.codigo_interno}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full p-3 border ${
                    errors.codigo_interno ? 'border-red-500' : 'border-gray-300'
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Ingrese código interno"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Número de Serie</label>
                <input
                  type="text"
                  name="numero_serie"
                  value={editedFields.numero_serie}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full p-3 border ${
                    errors.numero_serie ? 'border-red-500' : 'border-gray-300'
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Ingrese número de serie"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">MAC Address</label>
                <input
                  type="text"
                  name="mac"
                  value={editedFields.mac}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full p-3 border ${
                    errors.mac ? 'border-red-500' : 'border-gray-300'
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Ingrese MAC"
                />
              </div>
            </div>

            {/* Fila 4: Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Descripción</label>
              <textarea
                name="descripcion"
                value={editedFields.descripcion}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Ingrese descripción"
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

          {/* Loader CSS */}
          <style jsx>{`
            .loader {
              border-top-color: #3498db;
              animation: spinner 1.5s linear infinite;
            }

            @keyframes spinner {
              to {
                transform: rotate(360deg);
              }
            }
          `}</style>
        </Modal>
      )}
    </>
  );
};

export default ModificarStockModal;
