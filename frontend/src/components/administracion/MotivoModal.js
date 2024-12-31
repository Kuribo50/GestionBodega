// src/components/administracion/MotivoModal.js

import React, { useState, useEffect,useCallback } from 'react';
import Modal from 'react-modal';
import { FaEdit, FaSave, FaTimes, FaTrash, FaSearch, FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { 
  fetchMotivos, 
  createMotivo, 
  updateMotivo, 
  deleteMotivo, 
  fetchArticulos 
} from '@/services/api'; // Asegúrate de que las rutas sean correctas

// Configurar SweetAlert2 con React Content
const MySwal = withReactContent(Swal);

// Configurar el elemento raíz para accesibilidad
Modal.setAppElement('#__next');

const MotivoModal = ({ isOpen, onRequestClose }) => {
  // Estados para el Modal Principal
  const [motivos, setMotivos] = useState([]);
  const [articulos, setArticulos] = useState([]); // Para verificar el uso de motivos
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null); // ID del motivo a eliminar
  const [associatedArticulos, setAssociatedArticulos] = useState([]); // Artículos asociados

  // Estados para el Modal de Creación
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Efecto para cargar motivos y artículos al abrir el modal
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
      const [motivoData, artData] = await Promise.all([
        fetchMotivos(),
        fetchArticulos()
      ]);
      setMotivos(motivoData.results || motivoData); // Ajuste para paginación
      setArticulos(artData.results || artData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('No se pudieron cargar los motivos o artículos.', { position: 'top-center' });
    } finally {
      setLoading(false);
    }
  };

  // Función para resetear los formularios y estados
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

  // Función para manejar la edición de un motivo
  const handleEdit = (motivo) => {
    setEditingId(motivo.id);
    setEditedName(motivo.nombre);
    setEditedDescription(motivo.descripcion || '');
  };

  // Función para guardar los cambios de un motivo
  const handleSave = async (id) => {
    if (!editedName.trim()) {
      toast.error('El nombre no puede estar vacío.', { position: 'top-center' });
      return;
    }

    // Validación: Verificar si el nombre ya existe en otro motivo
    const nameExists = motivos.some(
      (motivo) => motivo.nombre.toLowerCase() === editedName.trim().toLowerCase() && motivo.id !== id
    );

    if (nameExists) {
      toast.error('Ya existe un motivo con este nombre.', { position: 'top-center' });
      return;
    }

    try {
      const payload = {
        nombre: editedName.trim(),
        descripcion: editedDescription.trim() ? editedDescription.trim() : 'Sin descripción',
      };

      console.log('Actualizando Motivo con datos:', payload); // Loguear datos enviados

      const updatedMotivo = await updateMotivo(id, payload);
      toast.success('Motivo actualizado exitosamente.', { position: 'top-center' });
      setMotivos(
        motivos.map((motivo) =>
          motivo.id === id ? updatedMotivo : motivo
        )
      );
      setEditingId(null);
      setEditedName('');
      setEditedDescription('');
    } catch (error) {
      console.error('Error al actualizar el motivo:', error);
      if (error.response) {
        console.log('Detalles del error:', error.response.data); // Loguear detalles del error
        const errors = error.response.data;
        Object.keys(errors).forEach((key) => {
          if (Array.isArray(errors[key])) {
            errors[key].forEach((msg) => {
              toast.error(`Error en ${capitalize(key)}: ${msg}`, { position: 'top-center' });
            });
          } else {
            toast.error(`Error en ${capitalize(key)}: ${errors[key]}`, { position: 'top-center' });
          }
        });
      } else {
        toast.error('Error al actualizar el motivo.', { position: 'top-center' });
      }
    }
  };

  // Función para manejar la eliminación de un motivo
  const handleDelete = async (id) => {
    try {
      // Verificar si el motivo está asociado a algún artículo
      const asociados = articulos.filter((articulo) => articulo.motivo === id);
      if (asociados.length > 0) {
        setAssociatedArticulos(asociados);
        setDeletingId(id);
        return;
      }

      // Si no está asociado, proceder con la eliminación utilizando SweetAlert2
      const result = await MySwal.fire({
        title: '¿Estás seguro?',
        text: "¿Deseas eliminar este motivo?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
      });

      if (result.isConfirmed) {
        await deleteMotivo(id);
        toast.success('Motivo eliminado exitosamente.', { position: 'top-center' });
        setMotivos(
          motivos.filter((motivo) => motivo.id !== id)
        );
      }
    } catch (error) {
      console.error('Error al eliminar el motivo:', error);
      if (error.response) {
        console.log('Detalles del error:', error.response.data); // Loguear detalles del error
        const errors = error.response.data;
        Object.keys(errors).forEach((key) => {
          if (Array.isArray(errors[key])) {
            errors[key].forEach((msg) => {
              toast.error(`Error en ${capitalize(key)}: ${msg}`, { position: 'top-center' });
            });
          } else {
            toast.error(`Error en ${capitalize(key)}: ${errors[key]}`, { position: 'top-center' });
          }
        });
      } else {
        toast.error('Error al eliminar el motivo.', { position: 'top-center' });
      }
    }
  };

  // Función para confirmar eliminación cuando el motivo está asociado a artículos
  const confirmDeleteWithArticulos = async () => {
    if (!deletingId) return;

    // Formatear la lista de artículos relacionados
    const articuloList = associatedArticulos.map((articulo) => {
      return `• Nombre: ${articulo.nombre}, Stock: ${articulo.stock_actual}, Código Minvu: ${articulo.codigo_minvu || 'N/A'}, Código Interno: ${articulo.codigo_interno || 'N/A'}, Nº Serie: ${articulo.numero_serie || 'N/A'}`;
    }).join('<br/>');

    const result = await MySwal.fire({
      title: '¿Estás seguro?',
      html: `
        <p>El motivo seleccionado está asociado a ${associatedArticulos.length} artículo(s):</p>
        <div style="max-height: 200px; overflow-y: auto; text-align: left;">
          ${articuloList}
        </div>
        <p>¿Deseas eliminarlo? Los artículos asociados tendrán su motivo establecido en 'Sin motivo'.</p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      customClass: {
        popup: 'swal2-overflow' // Clase para manejar contenido largo
      },
    });

    if (result.isConfirmed) {
      try {
        // Eliminar el motivo
        await deleteMotivo(deletingId);

        // Actualizar los artículos asociados para establecer 'Sin motivo' (asumiendo que 'motivo' puede ser null)
        const actualizarArticulosPromises = associatedArticulos.map((articulo) => {
          return updateArticulo(articulo.id, { motivo: null });
        });

        await Promise.all(actualizarArticulosPromises);

        toast.success('Motivo eliminado exitosamente y artículos actualizados.', { position: 'top-center' });
        setMotivos(
          motivos.filter((motivo) => motivo.id !== deletingId)
        );
      } catch (error) {
        console.error('Error al eliminar motivo con artículos asociados:', error);
        if (error.response) {
          console.log('Detalles del error:', error.response.data); // Loguear detalles del error
          const errors = error.response.data;
          Object.keys(errors).forEach((key) => {
            if (Array.isArray(errors[key])) {
              errors[key].forEach((msg) => {
                toast.error(`Error en ${capitalize(key)}: ${msg}`, { position: 'top-center' });
              });
            } else {
              toast.error(`Error en ${capitalize(key)}: ${errors[key]}`, { position: 'top-center' });
            }
          });
        } else {
          toast.error('Error al eliminar el motivo.', { position: 'top-center' });
        }
      } finally {
        setDeletingId(null);
        setAssociatedArticulos([]);
      }
    } else {
      // Si el usuario cancela, resetear estados
      setDeletingId(null);
      setAssociatedArticulos([]);
    }
  };

  // Función auxiliar para actualizar artículos asociados
  const updateMotivoArticulo = async (articuloId, data) => {
    try {
      await updateArticulo(articuloId, data);
    } catch (error) {
      console.error(`Error al actualizar el artículo ID ${articuloId}:`, error);
      throw error;
    }
  };

  // Efecto para manejar la confirmación de eliminación cuando hay artículos asociados
  useEffect(() => {
    if (deletingId && associatedArticulos.length > 0) {
      confirmDeleteWithArticulos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deletingId]);

  // Función para manejar la creación de un nuevo motivo
  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error('El nombre del motivo no puede estar vacío.', { position: 'top-center' });
      return;
    }

    // Validación: Verificar si el nombre ya existe
    const nameExists = motivos.some(
      (motivo) => motivo.nombre.toLowerCase() === newName.trim().toLowerCase()
    );

    if (nameExists) {
      toast.error('Ya existe un motivo con este nombre.', { position: 'top-center' });
      return;
    }

    const payload = {
      nombre: newName.trim(),
      descripcion: newDescription.trim() ? newDescription.trim() : 'Sin descripción',
    };

    console.log('Creando Motivo con datos:', payload); // Loguear los datos enviados

    try {
      const createdMotivo = await createMotivo(payload);
      toast.success('Motivo creado exitosamente.', { position: 'top-center' });
      setMotivos([...motivos, createdMotivo]);
      // Resetear campos de creación
      setIsCreateModalOpen(false);
      setNewName('');
      setNewDescription('');
    } catch (error) {
      console.error('Error al crear motivo:', error);
      if (error.response) {
        console.log('Detalles del error:', error.response.data); // Loguear detalles del error
        const errors = error.response.data;
        Object.keys(errors).forEach((key) => {
          if (Array.isArray(errors[key])) {
            errors[key].forEach((msg) => {
              toast.error(`Error en ${capitalize(key)}: ${msg}`, { position: 'top-center' });
            });
          } else {
            toast.error(`Error en ${capitalize(key)}: ${errors[key]}`, { position: 'top-center' });
          }
        });
      } else {
        toast.error('Error al crear el motivo.', { position: 'top-center' });
      }
    }
  };

  // Función para cancelar la creación de un nuevo motivo
  const handleCancelCreate = () => {
    setIsCreateModalOpen(false);
    setNewName('');
    setNewDescription('');
  };

  // Filtrar motivos según el término de búsqueda
  const filteredMotivos = motivos.filter((motivo) =>
    motivo.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Modal Principal: Administrar Motivos */}
      <Modal
        isOpen={isOpen}
        onRequestClose={onRequestClose}
        contentLabel="Administrar Motivos"
        className="bg-white rounded-lg shadow-xl w-full max-w-5xl mx-auto my-8 p-6 outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      >
        {/* Encabezado del Modal */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Administrar Motivos</h2>
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
            title="Crear Nuevo Motivo"
          >
            <FaPlus className="mr-2" /> Crear Motivo
          </button>
        </div>

        {/* Campo de búsqueda */}
        <div className="mb-4 flex items-center">
          <input
            type="text"
            placeholder="Buscar Motivo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-3 border border-gray-300 rounded-md w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <FaSearch className="ml-2 text-gray-500" />
        </div>

        {/* Tabla de Motivos */}
        {loading ? (
          <p className="text-center text-lg text-gray-600">Cargando motivos...</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="overflow-y-auto max-h-96">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-blue-100 sticky top-0"> {/* Sticky header */}
                    <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">Nombre</th>
                    <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">Descripción</th>
                    <th className="py-3 px-6 text-center text-sm font-medium text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMotivos.length > 0 ? (
                    filteredMotivos.map((motivo) => (
                      <tr key={motivo.id} className="hover:bg-gray-50">
                        <td className="py-3 px-6 text-sm text-gray-700">
                          {editingId === motivo.id ? (
                            <input
                              type="text"
                              value={editedName}
                              onChange={(e) => setEditedName(e.target.value)}
                              className="p-2 border border-gray-300 rounded-md w-full"
                              placeholder="Nombre del motivo"
                            />
                          ) : (
                            motivo.nombre
                          )}
                        </td>
                        <td className="py-3 px-6 text-sm text-gray-700">
                          {editingId === motivo.id ? (
                            <textarea
                              value={editedDescription}
                              onChange={(e) => setEditedDescription(e.target.value)}
                              className="p-2 border border-gray-300 rounded-md w-full"
                              placeholder="Descripción del motivo (opcional)"
                            />
                          ) : (
                            motivo.descripcion || 'Sin descripción'
                          )}
                        </td>
                        <td className="py-3 px-6 text-center space-x-4">
                          {editingId === motivo.id ? (
                            <>
                              <button
                                onClick={() => handleSave(motivo.id)}
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
                                onClick={() => handleEdit(motivo)}
                                className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                                title="Editar Motivo"
                              >
                                <FaEdit size={18} />
                              </button>
                              <button
                                onClick={() => handleDelete(motivo.id)}
                                className="text-red-600 hover:text-red-800 transition-colors duration-200"
                                title="Eliminar Motivo"
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
                      <td colSpan="3" className="text-center py-4 text-gray-500">No se encontraron motivos</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Secundario: Crear Motivo */}
      <Modal
        isOpen={isCreateModalOpen}
        onRequestClose={() => setIsCreateModalOpen(false)}
        contentLabel="Crear Nuevo Motivo"
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto my-8 p-6 outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      >
        {/* Encabezado del Modal de Creación */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Crear Nuevo Motivo</h3>
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
          <label className="block text-gray-700 mb-2">Nombre<span className="text-red-500">*</span>:</label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nombre del motivo"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Descripción:</label>
          <textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Descripción del motivo (opcional)"
          />
        </div>
        <div className="flex justify-end space-x-2">
          <button
            onClick={handleCreate}
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors duration-200"
          >
            Guardar
          </button>
          <button
            onClick={handleCancelCreate}
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors duration-200"
          >
            Cancelar
          </button>
        </div>
      </Modal>
    </>
  );
};

export default MotivoModal;
