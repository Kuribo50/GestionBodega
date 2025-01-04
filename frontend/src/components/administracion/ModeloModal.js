// src/components/administracion/ModeloModal.js

import React, { useState, useEffect, useCallback } from 'react';
import Modal from 'react-modal';
import { FaEdit, FaSave, FaTimes, FaTrash, FaSearch, FaPlus } from 'react-icons/fa';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import {
  fetchModelos,
  fetchArticulos,
  createModelo,
  updateModelo,
  deleteModelo,
  updateArticulos, // Asegúrate de tener esta función para actualizar artículos
} from '@/services/api';

const MySwal = withReactContent(Swal);

// Configurar el elemento raíz para accesibilidad
Modal.setAppElement('#__next');

// Función para capitalizar la primera letra (para mostrar errores)
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const ModeloModal = ({ isOpen, onRequestClose }) => {
  // Estados para el Modal Principal
  const [modelos, setModelos] = useState([]);
  const [articulos, setArticulos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [associatedArticulos, setAssociatedArticulos] = useState([]);

  // Nuevo estado para manejar el indicador de carga durante la eliminación
  const [isDeleting, setIsDeleting] = useState(false);

  // Estados para el Modal de Creación
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Cargar los datos al abrir el modal principal
  useEffect(() => {
    if (isOpen) {
      loadData();
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Función para cargar datos desde la API
  const loadData = async () => {
    setLoading(true);
    try {
      const [modeloData, artData] = await Promise.all([
        fetchModelos(),
        fetchArticulos(),
      ]);
      setModelos(modeloData.results || modeloData);
      setArticulos(artData.results || artData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los modelos o artículos.',
        customClass: {
          confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para resetear el formulario
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

  // Función para manejar la edición de un modelo
  const handleEdit = (modelo) => {
    setEditingId(modelo.id);
    setEditedName(modelo.nombre);
    setEditedDescription(modelo.descripcion || '');
  };

  // Función para guardar los cambios de edición
  const handleSave = async (id) => {
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

    const nameExists = modelos.some(
      (m) => m.nombre.toLowerCase() === editedName.trim().toLowerCase() && m.id !== id
    );

    if (nameExists) {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ya existe un modelo con este nombre.',
        customClass: {
          confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });
      return;
    }

    try {
      const updated = await updateModelo(id, {
        nombre: editedName.trim() || '',
        descripcion: editedDescription.trim() || 'Sin descripción',
      });
      setModelos((prevModelos) =>
        prevModelos.map((m) => (m.id === id ? updated : m))
      );

      MySwal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Modelo actualizado correctamente.',
        customClass: {
          confirmButton: 'bg-green-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });

      setEditingId(null);
      setEditedName('');
      setEditedDescription('');
    } catch (error) {
      console.error('Error al actualizar el modelo:', error);
      if (error.response && error.response.data) {
        const errors = error.response.data;
        const errorMessages = Object.keys(errors)
          .map((key) => {
            return Array.isArray(errors[key])
              ? errors[key].map((msg) => `${capitalize(key)}: ${msg}`).join('<br/>')
              : `${capitalize(key)}: ${errors[key]}`;
          })
          .join('<br/>');
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
          text: 'Ocurrió un error al actualizar el modelo.',
          customClass: {
            confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
          },
          buttonsStyling: false,
        });
      }
    }
  };

  // Función para manejar la eliminación de un modelo
  const handleDelete = async (id) => {
    const asociados = articulos.filter((a) => a.modelo === id);
    if (asociados.length > 0) {
      setAssociatedArticulos(asociados);
      setDeletingId(id);
      return;
    }

    confirmDelete(id, []);
  };

  // Función de confirmación de eliminación
  const confirmDelete = useCallback(async (id, asociadosList) => {
    const hasAsociados = asociadosList.length > 0;

    const result = await MySwal.fire({
      title: '¿Estás seguro?',
      text: hasAsociados
        ? `Esta acción eliminará el modelo y dejará ${asociadosList.length} artículo(s) sin modelo.`
        : 'Esta acción eliminará el modelo de forma permanente.',
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
        // Establecer el estado de carga
        setIsDeleting(true);

        // Si hay artículos asociados, actualizarlos para que no tengan modelo
        if (hasAsociados) {
          // Usar la forma funcional para evitar depender de 'articulos'
          await Promise.all(
            asociadosList.map((articulo) =>
              updateArticulos(articulo.id, { modelo: "" }) // O usa null según tu API
            )
          );

          MySwal.fire({
            icon: 'success',
            title: 'Actualizado',
            text: 'Los artículos asociados ahora están sin modelo.',
            customClass: {
              confirmButton: 'bg-green-600 text-white px-4 py-2 rounded-md',
            },
            buttonsStyling: false,
          });
        }

        // Eliminar el modelo
        await deleteModelo(id);
        MySwal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'El modelo fue eliminado correctamente.',
          customClass: {
            confirmButton: 'bg-green-600 text-white px-4 py-2 rounded-md',
          },
          buttonsStyling: false,
        });

        // Actualizar el estado de 'modelos' usando la forma funcional
        setModelos((prevModelos) => prevModelos.filter((m) => m.id !== id));
      } catch (error) {
        console.error('Error al eliminar el modelo:', error);
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un error al eliminar el modelo.',
          customClass: {
            confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
          },
          buttonsStyling: false,
        });
      } finally {
        // Finalizar el estado de carga
        setIsDeleting(false);
      }
    }
  }, []); // Eliminamos 'deleteModelo' y 'updateArticulos' de las dependencias

  // Función para confirmar la eliminación con artículos asociados
  const confirmDeleteWithArticulos = useCallback(async () => {
    if (!deletingId) return;

    const asociadosList = associatedArticulos;

    // Construir la lista HTML de artículos afectados
    const articuloListHTML = asociadosList.map((articulo) => {
      return `• Nombre: ${articulo.nombre}, Stock: ${articulo.stock_actual}, Código Minvu: ${articulo.codigo_minvu || 'N/A'}, Código Interno: ${articulo.codigo_interno || 'N/A'}, Nº Serie: ${articulo.numero_serie || 'N/A'}`;
    }).join('<br/>');

    const result = await MySwal.fire({
      title: '¿Estás seguro?',
      html: `
        <p>El modelo seleccionado está asociado a <strong>${asociadosList.length}</strong> artículo(s):</p>
        <div style="max-height: 200px; overflow-y: auto; text-align: left;">
          ${articuloListHTML}
        </div>
        <p>¿Deseas eliminarlo? Los artículos asociados tendrán su modelo establecido en blanco.</p>
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
      confirmDelete(deletingId, asociadosList);
    } else {
      setDeletingId(null);
      setAssociatedArticulos([]);
    }
  }, [deletingId, associatedArticulos, confirmDelete]); // 'confirmDelete' ya no depende de 'deleteModelo' y 'updateArticulos'

  // Manejar el efecto de eliminación con artículos asociados
  useEffect(() => {
    if (deletingId && associatedArticulos.length > 0) {
      confirmDeleteWithArticulos();
    }
  }, [deletingId, associatedArticulos.length, confirmDeleteWithArticulos]);

  // Función para manejar la apertura del modal de creación
  const openCreateModal = () => {
    setIsCreateModalOpen(true);
    resetCreateForm();
  };

  // Función para resetear el formulario de creación
  const resetCreateForm = () => {
    setNewName('');
    setNewDescription('');
  };

  // Función para manejar la creación de un nuevo modelo
  const handleCreate = async () => {
    if (!newName.trim()) {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El nombre del modelo no puede estar vacío.',
        customClass: {
          confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });
      return;
    }

    const nameExists = modelos.some(
      (m) => m.nombre.toLowerCase() === newName.trim().toLowerCase()
    );

    if (nameExists) {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ya existe un modelo con este nombre.',
        customClass: {
          confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });
      return;
    }

    try {
      const created = await createModelo({
        nombre: newName.trim() || '',
        descripcion: newDescription.trim() || 'Sin descripción',
      });
      setModelos((prevModelos) => [...prevModelos, created]);

      MySwal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Modelo creado correctamente.',
        customClass: {
          confirmButton: 'bg-green-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });

      setIsCreateModalOpen(false);
      setNewName('');
      setNewDescription('');
    } catch (error) {
      console.error('Error al crear modelo:', error);
      if (error.response && error.response.data) {
        const errors = error.response.data;
        const errorMessages = Object.keys(errors)
          .map((key) => {
            return Array.isArray(errors[key])
              ? errors[key].map((msg) => `${capitalize(key)}: ${msg}`).join('<br/>')
              : `${capitalize(key)}: ${errors[key]}`;
          })
          .join('<br/>');
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
          text: 'Ocurrió un error al crear el modelo.',
          customClass: {
            confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
          },
          buttonsStyling: false,
        });
      }
    }
  };

  // Función para cancelar la creación
  const handleCancelCreate = () => {
    setIsCreateModalOpen(false);
    setNewName('');
    setNewDescription('');
  };

  // Filtrar modelos basado en la búsqueda
  const filteredModelos = modelos.filter((m) =>
    m.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Modal Principal: Administrar Modelos */}
      <Modal
        isOpen={isOpen}
        onRequestClose={onRequestClose}
        contentLabel="Administrar Modelos"
        className="bg-white rounded-lg shadow-xl w-full max-w-5xl mx-auto p-6 overflow-auto relative"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      >
        {/* Indicador de Carga durante la Eliminación */}
        {isDeleting && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex justify-center items-center z-50">
            <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-16 w-16"></div>
          </div>
        )}

        {/* Encabezado del Modal */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-blue-800">Administrar Modelos</h2>
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
            onClick={openCreateModal}
            className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors duration-200"
            title="Crear Nuevo Modelo"
          >
            <FaPlus className="mr-2" /> Crear Modelo
          </button>
        </div>

        {/* Campo de búsqueda */}
        <div className="mb-4 flex items-center">
          <input
            type="text"
            placeholder="Buscar Modelo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-3 border border-gray-300 rounded-md w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <FaSearch className="ml-2 text-gray-500" />
        </div>

        {/* Tabla de Modelos */}
        {loading ? (
          <p className="text-center text-lg text-gray-600">Cargando modelos...</p>
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
                  {filteredModelos.length > 0 ? (
                    filteredModelos.map((modelo) => (
                      <tr key={modelo.id} className="hover:bg-gray-50">
                        <td className="py-3 px-6 text-sm text-gray-700">
                          {editingId === modelo.id ? (
                            <input
                              type="text"
                              value={editedName}
                              onChange={(e) => setEditedName(e.target.value)}
                              className={`p-2 border ${
                                editedName.trim() === '' ? 'border-red-500' : 'border-gray-300'
                              } rounded-md w-full`}
                              placeholder="Nombre del modelo"
                            />
                          ) : (
                            modelo.nombre
                          )}
                        </td>
                        <td className="py-3 px-6 text-sm text-gray-700">
                          {editingId === modelo.id ? (
                            <textarea
                              value={editedDescription}
                              onChange={(e) => setEditedDescription(e.target.value)}
                              className="p-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500"
                              placeholder="Descripción del modelo (opcional)"
                            />
                          ) : (
                            modelo.descripcion || 'Sin descripción'
                          )}
                        </td>
                        <td className="py-3 px-6 text-center space-x-4">
                          {editingId === modelo.id ? (
                            <>
                              <button
                                onClick={() => handleSave(modelo.id)}
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
                                onClick={() => handleEdit(modelo)}
                                className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                                title="Editar Modelo"
                              >
                                <FaEdit size={18} />
                              </button>
                              <button
                                onClick={() => handleDelete(modelo.id)}
                                className="text-red-600 hover:text-red-800 transition-colors duration-200"
                                title="Eliminar Modelo"
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
                        No se encontraron modelos
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

      {/* Modal Secundario: Crear Modelo */}
      <Modal
        isOpen={isCreateModalOpen}
        onRequestClose={handleCancelCreate}
        contentLabel="Crear Nuevo Modelo"
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto p-6 overflow-auto relative"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      >
        {/* Encabezado del Modal de Creación */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-blue-800">Crear Nuevo Modelo</h3>
          <button
            onClick={handleCancelCreate}
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
            className={`w-full p-2 border ${
              newName.trim() === '' ? 'border-red-500' : 'border-gray-300'
            } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="Nombre del modelo"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Descripción:</label>
          <textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="Descripción del modelo (opcional)"
          />
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={handleCreate}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
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

export default ModeloModal;
