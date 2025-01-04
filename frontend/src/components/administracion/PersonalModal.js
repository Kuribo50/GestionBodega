// src/components/administracion/PersonalModal.js

import React, { useState, useEffect, useCallback } from 'react';
import Modal from 'react-modal';
import { FaSave, FaTimes, FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import {
  fetchPersonal,
  createPersonal,
  updatePersonal,
  deletePersonal,
  fetchArticulos,
  updateArticulos, // Asegúrate de tener esta función para actualizar artículos
} from '../../services/api'; // Asegúrate de que estas funciones están correctamente definidas en tu API

// Configurar SweetAlert2 con React Content
const MySwal = withReactContent(Swal);

// Configurar el elemento raíz para accesibilidad
Modal.setAppElement('#__next');

// Función para capitalizar la primera letra (para mostrar errores)
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const PersonalModal = ({ isOpen, onRequestClose }) => {
  // Estados para el Modal Principal
  const [personal, setPersonal] = useState([]);
  const [articulos, setArticulos] = useState([]); // Para verificar el uso de personal
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editedNombre, setEditedNombre] = useState('');
  const [editedCorreo, setEditedCorreo] = useState('');
  const [editedSeccion, setEditedSeccion] = useState('');
  const [errors, setErrors] = useState({
    correo_institucional: false,
  });

  // Nuevo estado para manejar el indicador de carga durante operaciones críticas
  const [isProcessing, setIsProcessing] = useState(false);

  // Estados para el Modal de Creación
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCorreo, setNewCorreo] = useState('');
  const [createErrors, setCreateErrors] = useState({
    correo_institucional: false,
  });

  // Efecto para cargar personal y artículos al abrir el modal principal
  useEffect(() => {
    if (isOpen) {
      loadData();
      resetEditForm();
      resetCreateForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Función para cargar datos desde la API
  const loadData = async () => {
    setIsProcessing(true);
    try {
      const [personalData, artData] = await Promise.all([
        fetchPersonal(),
        fetchArticulos(),
      ]);
      setPersonal(personalData.results || personalData);
      setArticulos(artData.results || artData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los datos de personal o artículos.',
        customClass: {
          confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Función para resetear el formulario de edición
  const resetEditForm = () => {
    setEditingId(null);
    setEditedNombre('');
    setEditedCorreo('');
    setEditedSeccion('');
    setErrors({
      correo_institucional: false,
    });
  };

  // Función para resetear el formulario de creación
  const resetCreateForm = () => {
    setNewCorreo('');
    setCreateErrors({
      correo_institucional: false,
    });
  };

  // Función para manejar la edición de un personal
  const handleEdit = (p) => {
    setEditingId(p.id);
    setEditedNombre(p.nombre);
    setEditedCorreo(p.correo_institucional);
    setEditedSeccion(p.seccion);
    setErrors({
      correo_institucional: false,
    });
  };

  // Función para guardar los cambios de edición
  const handleSaveEdit = async () => {
    // Validaciones de correo_institucional
    const newErrors = {
      correo_institucional: !editedCorreo.trim(),
    };

    if (Object.values(newErrors).some((err) => err)) {
      setErrors(newErrors);
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor, complete el correo institucional.',
        customClass: {
          confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });
      return;
    }

    // Validar duplicados en el correo institucional
    const correoDuplicado = personal.some(
      (p) =>
        p.correo_institucional.toLowerCase() === editedCorreo.trim().toLowerCase() &&
        p.id !== editingId
    );

    if (correoDuplicado) {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El correo institucional ya está registrado.',
        customClass: {
          confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });
      setErrors({ ...newErrors, correo_institucional: true });
      return;
    }

    // Asignar valores predeterminados si están en blanco
    const payload = {
      nombre: editedNombre.trim() || 'Sin nombre',
      correo_institucional: editedCorreo.trim(),
      seccion: editedSeccion.trim() || 'Sin sección',
    };

    // Guardar los datos
    try {
      setIsProcessing(true);
      const updatedPersonal = await updatePersonal(editingId, payload);
      setPersonal((prev) =>
        prev.map((p) => (p.id === editingId ? { ...p, ...updatedPersonal } : p))
      );

      MySwal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'El personal se actualizó correctamente.',
        customClass: {
          confirmButton: 'bg-green-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });

      resetEditForm();
    } catch (error) {
      console.error('Error al actualizar el personal:', error);
      if (error.response && error.response.data) {
        const errors = error.response.data;
        let errorMessages = '';
        Object.keys(errors).forEach((key) => {
          if (Array.isArray(errors[key])) {
            errors[key].forEach((msg) => {
              errorMessages += `Error en ${capitalize(key)}: ${msg}<br/>`;
            });
          } else {
            errorMessages += `Error en ${capitalize(key)}: ${errors[key]}<br/>`;
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
          text: 'Ocurrió un error al actualizar el personal.',
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

  // Función para manejar la eliminación de un personal
  const handleDelete = async (id) => {
    try {
      // Verificar si el personal tiene préstamos activos
      const hasActiveLoans = await checkActiveLoans(id); // Implementa esta función según tu lógica de negocio
      if (hasActiveLoans) {
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Este personal tiene préstamos activos y no puede ser eliminado.',
          customClass: {
            confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
          },
          buttonsStyling: false,
        });
        return;
      }

      const result = await MySwal.fire({
        title: '¿Estás seguro?',
        text: 'Esta acción eliminará el registro de forma permanente.',
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
        await deletePersonal(id);
        setPersonal((prev) => prev.filter((p) => p.id !== id));

        MySwal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'El personal fue eliminado correctamente.',
          customClass: {
            confirmButton: 'bg-green-600 text-white px-4 py-2 rounded-md',
          },
          buttonsStyling: false,
        });
      }
    } catch (error) {
      console.error('Error al eliminar el personal:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ocurrió un error al eliminar el personal.',
        customClass: {
          confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Función para verificar si el personal tiene préstamos activos
  const checkActiveLoans = async (id) => {
    // Implementa la lógica para verificar préstamos activos
    // Por ejemplo, podrías tener un endpoint como /api/personal/{id}/prestamos_activos/
    try {
      const response = await fetch(`/api/personal/${id}/prestamos_activos/`);
      if (response.ok) {
        const data = await response.json();
        return data.has_active_loans;
      }
      return false;
    } catch (error) {
      console.error('Error al verificar préstamos activos:', error);
      return false;
    }
  };

  // Función para manejar la apertura del modal de creación
  const openCreateModal = () => {
    setIsCreateModalOpen(true);
    resetCreateForm();
  };

  // Función para manejar la creación de un nuevo personal
  const handleCreate = async () => {
    // Validaciones de correo_institucional
    const newErrors = {
      correo_institucional: !newCorreo.trim(),
    };

    if (Object.values(newErrors).some((err) => err)) {
      setCreateErrors(newErrors);
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor, complete el correo institucional.',
        customClass: {
          confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });
      return;
    }

    // Validar duplicados en el correo institucional
    const correoDuplicado = personal.some(
      (p) => p.correo_institucional.toLowerCase() === newCorreo.trim().toLowerCase()
    );

    if (correoDuplicado) {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El correo institucional ya está registrado.',
        customClass: {
          confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });
      setCreateErrors({ ...newErrors, correo_institucional: true });
      return;
    }

    // Asignar valores predeterminados si están en blanco
    const payload = {
      nombre: 'Sin nombre', // Valor predeterminado
      correo_institucional: newCorreo.trim(),
      seccion: 'Sin sección', // Valor predeterminado
    };

    // Crear el nuevo personal
    try {
      setIsProcessing(true);
      const createdPersonal = await createPersonal(payload);
      setPersonal((prev) => [...prev, createdPersonal]);

      MySwal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Nuevo personal agregado correctamente.',
        customClass: {
          confirmButton: 'bg-green-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });

      setIsCreateModalOpen(false);
      resetCreateForm();
    } catch (error) {
      console.error('Error al crear personal:', error);
      if (error.response && error.response.data) {
        const errors = error.response.data;
        let errorMessages = '';
        Object.keys(errors).forEach((key) => {
          if (Array.isArray(errors[key])) {
            errors[key].forEach((msg) => {
              errorMessages += `Error en ${capitalize(key)}: ${msg}<br/>`;
            });
          } else {
            errorMessages += `Error en ${capitalize(key)}: ${errors[key]}<br/>`;
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
          text: 'Ocurrió un error al crear el personal.',
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

  // Función para cancelar la creación
  const handleCancelCreate = () => {
    setIsCreateModalOpen(false);
    resetCreateForm();
  };

  // Filtrar personal basado en la búsqueda
  const filterPersonal = useCallback(
    (personal, term) => {
      if (!term) return personal;
      const termLower = term.toLowerCase();
      return personal.filter(
        (p) =>
          p.nombre.toLowerCase().includes(termLower) ||
          p.correo_institucional.toLowerCase().includes(termLower) ||
          p.seccion.toLowerCase().includes(termLower)
      );
    },
    []
  );

  return (
    <>
      {/* Modal Principal: Administrar Personal */}
      <Modal
        isOpen={isOpen}
        onRequestClose={onRequestClose}
        contentLabel="Administrar Personal"
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
          <h2 className="text-2xl font-semibold text-blue-800">Administrar Personal</h2>
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
            title="Crear Nuevo Personal"
          >
            <FaPlus className="mr-2" /> Crear Personal
          </button>
        </div>

        {/* Campo de búsqueda */}
        <div className="mb-4 flex items-center">
          <input
            type="text"
            placeholder="Buscar personal..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-3 border border-gray-300 rounded-md w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <FaTimes className="ml-2 text-gray-500" />
        </div>

        {/* Tabla de Personal */}
        {isProcessing ? (
          <p className="text-center text-lg text-gray-600">Procesando...</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="overflow-y-auto max-h-96">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-blue-100 sticky top-0">
                    <th className="py-3 px-6 text-left text-sm font-medium text-blue-700">Nombre</th>
                    <th className="py-3 px-6 text-left text-sm font-medium text-blue-700">Correo Institucional</th>
                    <th className="py-3 px-6 text-left text-sm font-medium text-blue-700">Sección</th>
                    <th className="py-3 px-6 text-center text-sm font-medium text-blue-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filterPersonal(personal, searchTerm).length > 0 ? (
                    filterPersonal(personal, searchTerm).map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="py-3 px-6 text-sm text-gray-700">
                          {editingId === p.id ? (
                            <input
                              type="text"
                              value={editedNombre}
                              onChange={(e) => setEditedNombre(e.target.value)}
                              className={`p-2 border ${
                                editedNombre.trim() === '' ? 'border-red-500' : 'border-gray-300'
                              } rounded-md w-full`}
                              placeholder="Nombre del personal"
                            />
                          ) : (
                            p.nombre
                          )}
                        </td>
                        <td className="py-3 px-6 text-sm text-gray-700">
                          {editingId === p.id ? (
                            <input
                              type="email"
                              value={editedCorreo}
                              onChange={(e) => setEditedCorreo(e.target.value)}
                              className={`p-2 border ${
                                errors.correo_institucional ? 'border-red-500' : 'border-gray-300'
                              } rounded-md w-full`}
                              placeholder="Correo institucional"
                            />
                          ) : (
                            p.correo_institucional
                          )}
                        </td>
                        <td className="py-3 px-6 text-sm text-gray-700">
                          {editingId === p.id ? (
                            <input
                              type="text"
                              value={editedSeccion}
                              onChange={(e) => setEditedSeccion(e.target.value)}
                              className="p-2 border border-gray-300 rounded-md w-full"
                              placeholder="Sección"
                            />
                          ) : (
                            p.seccion
                          )}
                        </td>
                        <td className="py-3 px-6 text-center space-x-4">
                          {editingId === p.id ? (
                            <>
                              <button
                                onClick={handleSaveEdit}
                                className="text-green-600 hover:text-green-800 transition-colors duration-200"
                                title="Guardar cambios"
                              >
                                <FaSave size={18} />
                              </button>
                              <button
                                onClick={resetEditForm}
                                className="text-red-600 hover:text-red-800 transition-colors duration-200"
                                title="Cancelar edición"
                              >
                                <FaTimes size={18} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEdit(p)}
                                className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                                title="Editar Personal"
                              >
                                <FaEdit size={18} />
                              </button>
                              <button
                                onClick={() => handleDelete(p.id)}
                                className="text-red-600 hover:text-red-800 transition-colors duration-200"
                                title="Eliminar Personal"
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
                      <td colSpan="4" className="text-center py-4 text-gray-500">
                        No se encontraron registros.
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

      {/* Modal Secundario: Crear Personal */}
      <Modal
        isOpen={isCreateModalOpen}
        onRequestClose={handleCancelCreate}
        contentLabel="Crear Nuevo Personal"
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto p-6 overflow-auto relative"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      >
        {/* Encabezado del Modal de Creación */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-blue-800">Crear Nuevo Personal</h3>
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
            Correo Institucional<span className="text-red-500">*</span>:
          </label>
          <input
            type="email"
            value={newCorreo}
            onChange={(e) => setNewCorreo(e.target.value)}
            className={`w-full p-2 border ${
              createErrors.correo_institucional ? 'border-red-500' : 'border-gray-300'
            } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="Correo institucional"
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

export default PersonalModal;
