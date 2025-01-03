// src/components/administracion/UbicacionModal.js

import React, { useState, useEffect,useCallback} from 'react';
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
  updateArticulos 
} from '@/services/api'; 

const MySwal = withReactContent(Swal);
Modal.setAppElement('#__next');

const UbicacionModal = ({ isOpen, onRequestClose }) => {
  const [ubicaciones, setUbicaciones] = useState([]);
  const [articulos, setArticulos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [associatedArticulos, setAssociatedArticulos] = useState([]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadData();
      resetForm();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ubicacionData, artData] = await Promise.all([
        fetchUbicaciones(),
        fetchArticulos()
      ]);
      setUbicaciones(ubicacionData.results || ubicacionData);
      setArticulos(artData.results || artData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar las ubicaciones o artículos.',
      });
    } finally {
      setLoading(false);
    }
  };

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

  const handleEdit = (ubicacion) => {
    setEditingId(ubicacion.id);
    setEditedName(ubicacion.nombre);
    setEditedDescription(ubicacion.descripcion || '');
  };

  const handleSave = async (id) => {
    if (!editedName.trim()) {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El nombre no puede estar vacío.',
      });
      return;
    }

    const nameExists = ubicaciones.some(
      (u) => u.nombre.toLowerCase() === editedName.trim().toLowerCase() && u.id !== id
    );

    if (nameExists) {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ya existe una ubicación con este nombre.',
      });
      return;
    }

    try {
      const updatedUbicacion = await updateUbicacion(id, {
        nombre: editedName.trim(),
        descripcion: editedDescription.trim() ? editedDescription.trim() : 'Sin descripción',
      });

      MySwal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Ubicación actualizada exitosamente.',
      });

      setUbicaciones(
        ubicaciones.map((ubicacion) =>
          ubicacion.id === id ? updatedUbicacion : ubicacion
        )
      );
      setEditingId(null);
      setEditedName('');
      setEditedDescription('');
    } catch (error) {
      console.error('Error al actualizar la ubicación:', error);
      if (error.response && error.response.data) {
        const errors = error.response.data;
        const errorMessages = Object.keys(errors).map(key => {
          return Array.isArray(errors[key]) 
            ? errors[key].map(msg => `${key}: ${msg}`).join('<br/>')
            : `${key}: ${errors[key]}`
        }).join('<br/>');
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          html: errorMessages,
        });
      } else {
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al actualizar la ubicación.',
        });
      }
    }
  };

  const handleDelete = async (id) => {
    try {
      const asociados = articulos.filter((a) => a.ubicacion === id);
      if (asociados.length > 0) {
        setAssociatedArticulos(asociados);
        setDeletingId(id);
        return;
      }

      const result = await MySwal.fire({
        title: '¿Estás seguro?',
        text: "¿Deseas eliminar esta ubicación?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
      });

      if (result.isConfirmed) {
        await deleteUbicacion(id);
        MySwal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: 'Ubicación eliminada exitosamente.',
        });
        setUbicaciones(
          ubicaciones.filter((ubicacion) => ubicacion.id !== id)
        );
      }
    } catch (error) {
      console.error('Error al eliminar la ubicación:', error);
      if (error.response && error.response.data) {
        const errors = error.response.data;
        const errorMessages = Object.keys(errors).map(key => {
          return Array.isArray(errors[key]) 
            ? errors[key].map(msg => `${key}: ${msg}`).join('<br/>')
            : `${key}: ${errors[key]}`
        }).join('<br/>');
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          html: errorMessages,
        });
      } else {
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al eliminar la ubicación.',
        });
      }
    }
  };

  const confirmDeleteWithArticulos = useCallback(async () => {
    if (!deletingId) return;
  
    const articuloList = associatedArticulos.map((articulo) => {
      return `• Nombre: ${articulo.nombre}, Stock: ${articulo.stock_actual}, Código Minvu: ${articulo.codigo_minvu || 'N/A'}, Código Interno: ${articulo.codigo_interno || 'N/A'}, Nº Serie: ${articulo.numero_serie || 'N/A'}`;
    }).join('<br/>');
  
    const result = await MySwal.fire({
      title: '¿Estás seguro?',
      html: `
        <p>La ubicación seleccionada está asociada a ${associatedArticulos.length} artículo(s):</p>
        <div style="max-height: 200px; overflow-y: auto; text-align: left;">
          ${articuloList}
        </div>
        <p>¿Deseas eliminarla? Los artículos asociados tendrán su ubicación establecida en 'Sin ubicación'.</p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      customClass: { popup: 'swal2-overflow' },
    });
  
    if (result.isConfirmed) {
      try {
        await deleteUbicacion(deletingId);
  
        const actualizarArticulosPromises = associatedArticulos.map((articulo) =>
          updateArticulo(articulo.id, { ubicacion: null })
        );
  
        await Promise.all(actualizarArticulosPromises);
  
        MySwal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: 'Ubicación eliminada y artículos actualizados exitosamente.',
        });
  
        setUbicaciones(
          ubicaciones.filter((ubicacion) => ubicacion.id !== deletingId)
        );
      } catch (error) {
        console.error('Error al eliminar ubicación con artículos asociados:', error);
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al eliminar la ubicación y actualizar los artículos asociados.',
        });
      } finally {
        setDeletingId(null);
        setAssociatedArticulos([]);
      }
    } else {
      setDeletingId(null);
      setAssociatedArticulos([]);
    }
  }, [deletingId, associatedArticulos, ubicaciones]);
  

  const handleCreate = async () => {
    if (!newName.trim()) {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El nombre de la ubicación no puede estar vacío.',
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
      });
      return;
    }

    try {
      const createdUbicacion = await createUbicacion({
        nombre: newName.trim(),
        descripcion: newDescription.trim() ? newDescription.trim() : 'Sin descripción',
      });

      MySwal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Ubicación creada exitosamente.',
      });

      setUbicaciones([...ubicaciones, createdUbicacion]);
      setIsCreateModalOpen(false);
      setNewName('');
      setNewDescription('');
    } catch (error) {
      console.error('Error al crear ubicación:', error);
      if (error.response && error.response.data) {
        const errors = error.response.data;
        const errorMessages = Object.keys(errors).map(key => {
          return Array.isArray(errors[key]) 
            ? errors[key].map(msg => `${key}: ${msg}`).join('<br/>')
            : `${key}: ${errors[key]}`
        }).join('<br/>');
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          html: errorMessages,
        });
      } else {
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al crear la ubicación.',
        });
      }
    }
  };

  const handleCancelCreate = () => {
    setIsCreateModalOpen(false);
    setNewName('');
    setNewDescription('');
  };

  const filteredUbicaciones = ubicaciones.filter((u) =>
    u.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onRequestClose={onRequestClose}
        contentLabel="Administrar Ubicaciones"
        className="bg-white rounded-lg shadow-xl w-full max-w-5xl mx-auto my-8 p-6 outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Administrar Ubicaciones</h2>
          <button
            onClick={onRequestClose}
            className="text-gray-500 hover:text-gray-700"
            title="Cerrar Modal"
          >
            <FaTimes size={24} />
          </button>
        </div>

        <div className="mb-6">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors duration-200"
            title="Crear Nueva Ubicación"
          >
            <FaPlus className="mr-2" /> Crear Ubicación
          </button>
        </div>

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

        {loading ? (
          <p className="text-center text-lg text-gray-600">Cargando ubicaciones...</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="overflow-y-auto max-h-96">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-blue-100 sticky top-0">
                    <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">Nombre</th>
                    <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">Descripción</th>
                    <th className="py-3 px-6 text-center text-sm font-medium text-gray-700">Acciones</th>
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
                      <td colSpan="3" className="text-center py-4 text-gray-500">No se encontraron ubicaciones</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isCreateModalOpen}
        onRequestClose={() => setIsCreateModalOpen(false)}
        contentLabel="Crear Nueva Ubicación"
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto my-8 p-6 outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Crear Nueva Ubicación</h3>
          <button
            onClick={() => setIsCreateModalOpen(false)}
            className="text-gray-500 hover:text-gray-700"
            title="Cerrar Modal"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Nombre<span className="text-red-500">*</span>:</label>
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

export default UbicacionModal;
