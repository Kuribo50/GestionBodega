// src/components/administracion/UbicacionModal.js

import React, { useState, useEffect, useCallback } from 'react';
import Modal from 'react-modal';
import { FaEdit, FaSave, FaTimes, FaTrash, FaSearch, FaPlus } from 'react-icons/fa';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import {
  fetchUbicaciones,
  createUbicacion,
  updateUbicacion,
  deleteUbicacion,
  fetchArticulos,
  updateArticulos, // Asegúrate de tener esta función correctamente definida en tu API
} from '@/services/api';

const MySwal = withReactContent(Swal);

// Configurar el elemento raíz para accesibilidad
Modal.setAppElement('#__next');

// Función para capitalizar la primera letra de un string (para mostrar errores)
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const UbicacionModal = ({ isOpen, onRequestClose }) => {
  // Estados para el Modal Principal
  const [ubicaciones, setUbicaciones] = useState([]);
  const [articulos, setArticulos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [associatedArticulos, setAssociatedArticulos] = useState([]);
  const [loading, setLoading] = useState(false);

  // Nuevo estado para manejar el indicador de carga durante operaciones críticas
  const [isProcessing, setIsProcessing] = useState(false);

  // Estados para el Modal de Creación
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Efecto para cargar ubicaciones y artículos al abrir el modal
  useEffect(() => {
    if (isOpen) {
      loadData();
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Función para cargar datos desde la API
  const loadData = async () => {
    setIsProcessing(true);
    try {
      const [ubicacionData, artData] = await Promise.all([
        fetchUbicaciones(),
        fetchArticulos(),
      ]);
      setUbicaciones(ubicacionData.results || ubicacionData);
      setArticulos(artData.results || artData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar las ubicaciones o artículos.',
        customClass: {
          confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Función para resetear estados y formularios
  const resetForm = () => {
    setSearchTerm('');
    setEditingId(null);
    setEditedName('');
    setEditedDescription('');
    setDeletingId(null);
    setAssociatedArticulos([]);
    setNewName('');
    setNewDescription('');
  };

  // Manejar edición de una ubicación
  const handleEdit = (ubicacion) => {
    setEditingId(ubicacion.id);
    setEditedName(ubicacion.nombre);
    setEditedDescription(ubicacion.descripcion || '');
  };

  // Guardar cambios de edición
  const handleSave = async (id) => {
    // Validación básica
    if (!editedName.trim()) {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El nombre no puede estar vacío.',
        customClass: {
          confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });
      return;
    }

    // Verificar si ya existe una ubicación con ese nombre
    const nameExists = ubicaciones.some(
      (u) => u.nombre.toLowerCase() === editedName.trim().toLowerCase() && u.id !== id
    );

    if (nameExists) {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ya existe una ubicación con este nombre.',
        customClass: {
          confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });
      return;
    }

    const payload = {
      nombre: editedName.trim(),
      descripcion: editedDescription.trim() || 'Sin descripción',
    };

    try {
      setIsProcessing(true);
      const updatedUbicacion = await updateUbicacion(id, payload);

      MySwal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Ubicación actualizada exitosamente.',
        customClass: {
          confirmButton: 'bg-green-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });

      setUbicaciones((prev) =>
        prev.map((ubicacion) => (ubicacion.id === id ? updatedUbicacion : ubicacion))
      );
      setEditingId(null);
      setEditedName('');
      setEditedDescription('');
    } catch (error) {
      console.error('Error al actualizar la ubicación:', error);
      if (error.response && error.response.data) {
        const errors = error.response.data;
        let errorMessages = '';
        Object.keys(errors).forEach((key) => {
          if (Array.isArray(errors[key])) {
            errors[key].forEach((msg) => {
              errorMessages += `${capitalize(key)}: ${msg}<br/>`;
            });
          } else {
            errorMessages += `${capitalize(key)}: ${errors[key]}<br/>`;
          }
        });

        MySwal.fire({
          icon: 'error',
          title: 'Error',
          html: errorMessages,
          customClass: {
            confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
          },
          buttonsStyling: false,
        });
      } else {
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al actualizar la ubicación.',
          customClass: {
            confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
          },
          buttonsStyling: false,
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Manejar eliminación de una ubicación
  const handleDelete = async (id) => {
    try {
      // Verificar si hay artículos asociados a esta ubicación
      const asociados = articulos.filter((a) => a.ubicacion === id);
      if (asociados.length > 0) {
        setAssociatedArticulos(asociados);
        setDeletingId(id);
        return;
      }

      const result = await MySwal.fire({
        title: '¿Estás seguro?',
        text: '¿Deseas eliminar esta ubicación?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        reverseButtons: true,
        focusCancel: true,
        customClass: {
          confirmButton: 'bg-green-600 text-white px-4 py-2 rounded-md',
          cancelButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });

      if (result.isConfirmed) {
        setIsProcessing(true);
        await deleteUbicacion(id);

        MySwal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: 'Ubicación eliminada exitosamente.',
          customClass: {
            confirmButton: 'bg-green-600 text-white px-4 py-2 rounded-md',
          },
          buttonsStyling: false,
        });

        setUbicaciones((prev) => prev.filter((ubicacion) => ubicacion.id !== id));
      }
    } catch (error) {
      console.error('Error al eliminar la ubicación:', error);
      if (error.response && error.response.data) {
        const errors = error.response.data;
        let errorMessages = '';
        Object.keys(errors).forEach((key) => {
          if (Array.isArray(errors[key])) {
            errors[key].forEach((msg) => {
              errorMessages += `${capitalize(key)}: ${msg}<br/>`;
            });
          } else {
            errorMessages += `${capitalize(key)}: ${errors[key]}<br/>`;
          }
        });

        MySwal.fire({
          icon: 'error',
          title: 'Error',
          html: errorMessages,
          customClass: {
            confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
          },
          buttonsStyling: false,
        });
      } else {
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al eliminar la ubicación.',
          customClass: {
            confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
          },
          buttonsStyling: false,
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Manejar eliminación con artículos asociados (cambia ubicación de artículos a null)
  const confirmDeleteWithArticulos = useCallback(async () => {
    if (!deletingId) return;

    const articuloListHTML = associatedArticulos
      .map(
        (articulo) =>
          `• Nombre: ${articulo.nombre}, Stock: ${articulo.stock_actual}, Código Minvu: ${
            articulo.codigo_minvu || 'N/A'
          }, Código Interno: ${articulo.codigo_interno || 'N/A'}, Nº Serie: ${
            articulo.numero_serie || 'N/A'
          }`
      )
      .join('<br/>');

    const result = await MySwal.fire({
      title: '¿Estás seguro?',
      html: `
        <p>La ubicación seleccionada está asociada a <strong>${associatedArticulos.length}</strong> artículo(s):</p>
        <div style="max-height: 200px; overflow-y: auto; text-align: left;">
          ${articuloListHTML}
        </div>
        <p>¿Deseas eliminarla? Los artículos asociados tendrán su ubicación establecida en 'Sin ubicación'.</p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      focusCancel: true,
      customClass: {
        confirmButton: 'bg-green-600 text-white px-4 py-2 rounded-md',
        cancelButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
      },
      buttonsStyling: false,
    });

    if (result.isConfirmed) {
      try {
        setIsProcessing(true);
        await deleteUbicacion(deletingId);

        // Actualizar los artículos para que su ubicación sea null
        const promises = associatedArticulos.map((articulo) =>
          updateArticulos(articulo.id, { ubicacion: null })
        );
        await Promise.all(promises);

        MySwal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: 'Ubicación eliminada y artículos asociados actualizados exitosamente.',
          customClass: {
            confirmButton: 'bg-green-600 text-white px-4 py-2 rounded-md',
          },
          buttonsStyling: false,
        });

        setUbicaciones((prev) => prev.filter((ubicacion) => ubicacion.id !== deletingId));
      } catch (error) {
        console.error('Error al eliminar ubicación con artículos asociados:', error);
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al eliminar la ubicación y actualizar los artículos asociados.',
          customClass: {
            confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
          },
          buttonsStyling: false,
        });
      } finally {
        setIsProcessing(false);
        setDeletingId(null);
        setAssociatedArticulos([]);
      }
    } else {
      setDeletingId(null);
      setAssociatedArticulos([]);
    }
  }, [deletingId, associatedArticulos]); // Eliminamos 'updateArticulos' de las dependencias

  useEffect(() => {
    if (deletingId && associatedArticulos.length > 0) {
      confirmDeleteWithArticulos();
    }
  }, [deletingId, associatedArticulos.length, confirmDeleteWithArticulos]);

  // Manejar creación de nueva ubicación
  const handleCreate = async () => {
    if (!newName.trim()) {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El nombre de la ubicación no puede estar vacío.',
        customClass: {
          confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });
      return;
    }

    const nameExists = ubicaciones.some(
      (u) => u.nombre.toLowerCase() === newName.trim().toLowerCase()
    );

    if (nameExists) {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ya existe una ubicación con este nombre.',
        customClass: {
          confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });
      return;
    }

    const payload = {
      nombre: newName.trim(),
      descripcion: newDescription.trim() || 'Sin descripción',
    };

    try {
      setIsProcessing(true);
      const createdUbicacion = await createUbicacion(payload);

      MySwal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Ubicación creada exitosamente.',
        customClass: {
          confirmButton: 'bg-green-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });

      setUbicaciones((prev) => [...prev, createdUbicacion]);
      setIsCreateModalOpen(false);
      setNewName('');
      setNewDescription('');
    } catch (error) {
      console.error('Error al crear ubicación:', error);
      if (error.response && error.response.data) {
        const errors = error.response.data;
        let errorMessages = '';
        Object.keys(errors).forEach((key) => {
          if (Array.isArray(errors[key])) {
            errors[key].forEach((msg) => {
              errorMessages += `${capitalize(key)}: ${msg}<br/>`;
            });
          } else {
            errorMessages += `${capitalize(key)}: ${errors[key]}<br/>`;
          }
        });

        MySwal.fire({
          icon: 'error',
          title: 'Error',
          html: errorMessages,
          customClass: {
            confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
          },
          buttonsStyling: false,
        });
      } else {
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al crear la ubicación.',
          customClass: {
            confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
          },
          buttonsStyling: false,
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelCreate = () => {
    setIsCreateModalOpen(false);
    setNewName('');
    setNewDescription('');
  };

  // Filtrar ubicaciones basado en la búsqueda
  const filteredUbicaciones = ubicaciones.filter((u) =>
    u.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Modal Principal: Administrar Ubicaciones */}
      <Modal
        isOpen={isOpen}
        onRequestClose={onRequestClose}
        contentLabel="Administrar Ubicaciones"
        className="bg-white rounded-lg shadow-xl w-full max-w-5xl mx-auto p-6 overflow-auto relative"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      >
        {/* Indicador de Carga durante Operaciones Críticas */}
        {isProcessing && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex justify-center items-center z-50">
            <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-16 w-16"></div>
          </div>
        )}

        {/* Encabezado del Modal */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-blue-800">Administrar Ubicaciones</h2>
          <button
            onClick={onRequestClose}
            className="text-gray-500 hover:text-gray-700"
            title="Cerrar Modal"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Botón para Abrir el Modal de Creación */}
        <div className="mb-6">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors duration-200"
            title="Crear Nueva Ubicación"
          >
            <FaPlus className="mr-2" /> Crear Ubicación
          </button>
        </div>

        {/* Campo de búsqueda */}
        <div className="mb-4 flex items-center">
          <input
            type="text"
            placeholder="Buscar Ubicación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-3 border border-gray-300 rounded-md w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <FaSearch className="ml-2 text-gray-500" />
        </div>

        {/* Tabla de Ubicaciones */}
        {loading ? (
          <p className="text-center text-lg text-gray-600">Cargando ubicaciones...</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="overflow-y-auto max-h-96">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-blue-100 sticky top-0">
                    <th className="py-3 px-6 text-left text-sm font-medium text-blue-700">Nombre</th>
                    <th className="py-3 px-6 text-left text-sm font-medium text-blue-700">Descripción</th>
                    <th className="py-3 px-6 text-center text-sm font-medium text-blue-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUbicaciones.length > 0 ? (
                    filteredUbicaciones.map((ubicacion) => (
                      <tr key={ubicacion.id} className="hover:bg-gray-50">
                        <td className="py-3 px-6 text-sm text-gray-700">
                          {editingId === ubicacion.id ? (
                            <input
                              type="text"
                              value={editedName}
                              onChange={(e) => setEditedName(e.target.value)}
                              className="p-2 border border-gray-300 rounded-md w-full"
                              placeholder="Nombre de la ubicación"
                            />
                          ) : (
                            ubicacion.nombre
                          )}
                        </td>
                        <td className="py-3 px-6 text-sm text-gray-700">
                          {editingId === ubicacion.id ? (
                            <textarea
                              value={editedDescription}
                              onChange={(e) => setEditedDescription(e.target.value)}
                              className="p-2 border border-gray-300 rounded-md w-full"
                              placeholder="Descripción de la ubicación (opcional)"
                            />
                          ) : (
                            ubicacion.descripcion || 'Sin descripción'
                          )}
                        </td>
                        <td className="py-3 px-6 text-center space-x-4">
                          {editingId === ubicacion.id ? (
                            <>
                              <button
                                onClick={() => handleSave(ubicacion.id)}
                                className="text-green-600 hover:text-green-800 transition-colors duration-200"
                                title="Guardar cambios"
                              >
                                <FaSave size={18} />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingId(null);
                                  setEditedName('');
                                  setEditedDescription('');
                                }}
                                className="text-red-600 hover:text-red-800 transition-colors duration-200"
                                title="Cancelar edición"
                              >
                                <FaTimes size={18} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEdit(ubicacion)}
                                className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                                title="Editar Ubicación"
                              >
                                <FaEdit size={18} />
                              </button>
                              <button
                                onClick={() => handleDelete(ubicacion.id)}
                                className="text-red-600 hover:text-red-800 transition-colors duration-200"
                                title="Eliminar Ubicación"
                              >
                                <FaTrash size={18} />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="text-center py-4 text-gray-500">
                        No se encontraron ubicaciones
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      {/* Indicador de Carga CSS */}
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

      {/* Modal Secundario: Crear Ubicación */}
      <Modal
        isOpen={isCreateModalOpen}
        onRequestClose={handleCancelCreate}
        contentLabel="Crear Nueva Ubicación"
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto p-6 outline-none relative"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      >
        {/* Encabezado del Modal de Creación */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-blue-800">Crear Nueva Ubicación</h3>
          <button
            onClick={() => setIsCreateModalOpen(false)}
            className="text-gray-500 hover:text-gray-700"
            title="Cerrar Modal"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Formulario de Creación */}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">
            Nombre<span className="text-red-500">*</span>:
          </label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nombre de la ubicación"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Descripción:</label>
          <textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Descripción de la ubicación (opcional)"
          />
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={handleCreate}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
          >
            <FaSave className="mr-2" />
            Guardar
          </button>
          <button
            onClick={handleCancelCreate}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
          >
            <FaTimes className="mr-2" />
            Cancelar
          </button>
        </div>
      </Modal>
    </>
  );
};

export default UbicacionModal;
