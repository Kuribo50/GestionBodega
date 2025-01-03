import React, { useState, useEffect,useCallback } from 'react';
import Modal from 'react-modal';
import { FaEdit, FaSave, FaTimes, FaTrash, FaSearch, FaPlus } from 'react-icons/fa';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { fetchModelos, fetchArticulos, createModelo, updateModelo, deleteModelo } from '@/services/api';

const MySwal = withReactContent(Swal);
Modal.setAppElement('#__next');

const ModeloModal = ({ isOpen, onRequestClose }) => {
  const [modelos, setModelos] = useState([]);
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
      const modeloData = await fetchModelos();
      setModelos(modeloData.results || modeloData);

      const artData = await fetchArticulos();
      setArticulos(artData.results || artData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los modelos o artículos.',
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

  const handleEdit = (modelo) => {
    setEditingId(modelo.id);
    setEditedName(modelo.nombre);
    setEditedDescription(modelo.descripcion || '');
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

    const nameExists = modelos.some(
      (m) => m.nombre.toLowerCase() === editedName.trim().toLowerCase() && m.id !== id
    );

    if (nameExists) {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ya existe un modelo con este nombre.',
      });
      return;
    }

    const data = {
      nombre: editedName.trim() || '',
      descripcion: editedDescription.trim() || 'Sin descripción'
    };

    try {
      const updated = await updateModelo(id, data);
      setModelos(modelos.map((m) => (m.id === id ? updated : m)));

      MySwal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Modelo actualizado correctamente.',
      });

      setEditingId(null);
      setEditedName('');
      setEditedDescription('');
    } catch (error) {
      console.error('Error al actualizar el modelo:', error);
      if (error.response && error.response.data) {
        const errorMessages = Object.values(error.response.data).flat();
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          html: errorMessages.map(msg => `<p>${msg}</p>`).join(''),
        });
      } else {
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un error al actualizar el modelo.',
        });
      }
    }
  };

  const handleDelete = async (id) => {
    const asociados = articulos.filter((a) => a.modelo === id);
    if (asociados.length > 0) {
      setAssociatedArticulos(asociados);
      setDeletingId(id);
      return;
    }

    const result = await MySwal.fire({
      title: '¿Estás seguro?',
      text: "¿Deseas eliminar este modelo?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      try {
        const success = await deleteModelo(id);
        if (success) {
          setModelos(modelos.filter((m) => m.id !== id));
          MySwal.fire({
            icon: 'success',
            title: 'Eliminado',
            text: 'El modelo ha sido eliminado correctamente.',
          });
        }
      } catch (error) {
        console.error('Error al eliminar modelo:', error);
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un error al eliminar el modelo.',
        });
      }
    }
  };

  const confirmDeleteWithArticulos = async () => {
    if (!deletingId) return;

    const articuloList = associatedArticulos.map((articulo) => {
      return `• Nombre: ${articulo.nombre}, Stock: ${articulo.stock_actual}, Código Minvu: ${articulo.codigo_minvu || 'N/A'}, Código Interno: ${articulo.codigo_interno || 'N/A'}, Nº Serie: ${articulo.numero_serie || 'N/A'}`;
    }).join('<br/>');

    const result = await MySwal.fire({
      title: '¿Estás seguro?',
      html: `
        <p>El modelo seleccionado está asociado a ${associatedArticulos.length} artículo(s):</p>
        <div style="max-height: 200px; overflow-y: auto; text-align: left;">
          ${articuloList}
        </div>
        <p>¿Deseas eliminarlo? Los artículos asociados tendrán su modelo establecido en 'Sin modelo'.</p>
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
        const success = await deleteModelo(deletingId);
        if (success) {
          setModelos(modelos.filter((m) => m.id !== deletingId));
          MySwal.fire({
            icon: 'success',
            title: 'Eliminado',
            text: 'El modelo y las asociaciones han sido eliminadas correctamente.',
          });
        }
      } catch (error) {
        console.error('Error al eliminar modelo con artículos asociados:', error);
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un error al eliminar el modelo y actualizar los artículos asociados.',
        });
      } finally {
        setDeletingId(null);
        setAssociatedArticulos([]);
      }
    } else {
      setDeletingId(null);
      setAssociatedArticulos([]);
    }
  };

  useEffect(() => {
    if (deletingId && associatedArticulos.length > 0) {
      confirmDeleteWithArticulos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deletingId]);

  const handleCreate = async () => {
    if (!newName.trim()) {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El nombre del modelo no puede estar vacío.',
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
      });
      return;
    }

    const data = {
      nombre: newName.trim() || '',
      descripcion: newDescription.trim() || 'Sin descripción'
    };

    try {
      const created = await createModelo(data);
      setModelos([...modelos, created]);

      MySwal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Modelo creado correctamente.',
      });

      setIsCreateModalOpen(false);
      setNewName('');
      setNewDescription('');
    } catch (error) {
      console.error('Error al crear modelo:', error);
      if (error.response && error.response.data) {
        const errorMessages = Object.values(error.response.data).flat();
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          html: errorMessages.map(msg => `<p>${msg}</p>`).join(''),
        });
      } else {
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un error al crear el modelo.',
        });
      }
    }
  };

  const handleCancelCreate = () => {
    setIsCreateModalOpen(false);
    setNewName('');
    setNewDescription('');
  };

  const filteredModelos = modelos.filter((m) =>
    m.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onRequestClose={onRequestClose}
        contentLabel="Administrar Modelos"
        className="bg-white rounded-lg shadow-xl w-full max-w-5xl mx-auto my-8 p-6 outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Administrar Modelos</h2>
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
            className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            title="Crear Nuevo Modelo"
          >
            <FaPlus className="mr-2" /> Crear Modelo
          </button>
        </div>

        <div className="mb-4 flex items-center">
          <input
            type="text"
            placeholder="Buscar Modelo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-3 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500"
          />
          <FaSearch className="ml-2 text-gray-500" />
        </div>

        {loading ? (
          <p className="text-center text-lg text-gray-600">Cargando modelos...</p>
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
                  {filteredModelos.length > 0 ? (
                    filteredModelos.map((modelo) => (
                      <tr key={modelo.id} className="hover:bg-gray-50">
                        <td className="py-3 px-6 text-sm text-gray-700">
                          {editingId === modelo.id ? (
                            <input
                              type="text"
                              value={editedName}
                              onChange={(e) => setEditedName(e.target.value)}
                              className="p-2 border border-gray-300 rounded-md w-full"
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
                              className="p-2 border border-gray-300 rounded-md w-full"
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
                                className="text-green-600 hover:text-green-800"
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
                                className="text-red-600 hover:text-red-800"
                                title="Cancelar edición"
                              >
                                <FaTimes size={18} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEdit(modelo)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Editar Modelo"
                              >
                                <FaEdit size={18} />
                              </button>
                              <button
                                onClick={() => handleDelete(modelo.id)}
                                className="text-red-600 hover:text-red-800"
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
                      <td colSpan="3" className="text-center py-4 text-gray-500">No se encontraron modelos</td>
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
        contentLabel="Crear Nuevo Modelo"
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto my-8 p-6 outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Crear Nuevo Modelo</h3>
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
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
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
        <div className="flex justify-end space-x-2">
          <button
            onClick={handleCreate}
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
          >
            Guardar
          </button>
          <button
            onClick={handleCancelCreate}
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
          >
            Cancelar
          </button>
        </div>
      </Modal>
    </>
  );
};

export default ModeloModal;
