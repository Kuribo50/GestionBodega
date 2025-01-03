// src/components/administracion/CategoriaModal.js

import React, { useState, useEffect, useCallback } from 'react';
import Modal from 'react-modal';
import { FaSave, FaTimes, FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import {
  fetchCategorias,
  createCategoria,
  updateCategoria,
  deleteCategoria,
  fetchArticulos, // Para verificar artículos asociados
  updateArticulos, // Para actualizar categorías de artículos
} from '../../services/api'; // Asegúrate de que estas funciones están correctamente definidas en tu API

// Configurar SweetAlert2 con React Content
const MySwal = withReactContent(Swal);

// Configurar el elemento raíz para accesibilidad
Modal.setAppElement('#__next');

const CategoriaModal = ({ isOpen, onRequestClose }) => {
  // Estados para el Modal Principal
  const [categorias, setCategorias] = useState([]);
  const [articulos, setArticulos] = useState([]); // Para verificar artículos asociados
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editedNombre, setEditedNombre] = useState('');
  const [editedDescripcion, setEditedDescripcion] = useState('');
  const [errors, setErrors] = useState({
    nombre: false,
  });

  // Estados para el Modal de Creación
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const [newDescripcion, setNewDescripcion] = useState('');
  const [createErrors, setCreateErrors] = useState({
    nombre: false,
  });

  // Cargar los datos al abrir el modal principal
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
    setLoading(true);
    try {
      const [categoriaData, articuloData] = await Promise.all([
        fetchCategorias(),
        fetchArticulos(),
      ]);
      setCategorias(categoriaData.results || categoriaData);
      setArticulos(articuloData.results || articuloData);
    } catch (error) {
      Swal.fire('Error', 'Error al cargar los datos de categorías o artículos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Función para resetear el formulario de edición
  const resetEditForm = () => {
    setEditingId(null);
    setEditedNombre('');
    setEditedDescripcion('');
    setErrors({
      nombre: false,
    });
  };

  // Función para resetear el formulario de creación
  const resetCreateForm = () => {
    setNewNombre('');
    setNewDescripcion('');
    setCreateErrors({
      nombre: false,
    });
  };

  // Función para manejar la edición de una categoría
  const handleEdit = (c) => {
    setEditingId(c.id);
    setEditedNombre(c.nombre);
    setEditedDescripcion(c.descripcion || '');
    setErrors({
      nombre: false,
    });
  };

  // Función para guardar los cambios de edición
  const handleSaveEdit = async () => {
    // Validaciones de nombre
    const newErrors = {
      nombre: !editedNombre.trim(),
    };

    if (Object.values(newErrors).some((err) => err)) {
      setErrors(newErrors);
      Swal.fire('Error', 'Por favor, complete el nombre de la categoría.', 'error');
      return;
    }

    // Validar duplicados en el nombre de categoría
    const nombreDuplicado = categorias.some(
      (c) =>
        c.nombre.toLowerCase() === editedNombre.trim().toLowerCase() &&
        c.id !== editingId
    );

    if (nombreDuplicado) {
      Swal.fire('Error', 'Ya existe una categoría con este nombre.', 'error');
      setErrors({ ...newErrors, nombre: true });
      return;
    }

    // Asignar valor predeterminado si está en blanco
    const payload = {
      nombre: editedNombre.trim(),
      descripcion: editedDescripcion.trim() || '',
    };

    // Guardar los datos
    try {
      const updatedCategoria = await updateCategoria(editingId, payload);
      Swal.fire('Éxito', 'La categoría se actualizó correctamente.', 'success');
      setCategorias((prev) =>
        prev.map((c) => (c.id === editingId ? { ...c, ...updatedCategoria } : c))
      );
      resetEditForm();
    } catch (error) {
      Swal.fire('Error', 'Ocurrió un error al actualizar la categoría.', 'error');
    }
  };

  // Función para manejar la eliminación de una categoría
  const handleDelete = async (id) => {
    try {
      // Verificar si la categoría está asociada a algún artículo
      const asociados = articulos.filter((articulo) => articulo.categoria === id);
      if (asociados.length > 0) {
        // Mostrar alerta con la cantidad de artículos asociados
        const result = await MySwal.fire({
          title: 'Categoría Asociada',
          html: `
            <p>Esta categoría está asociada a ${asociados.length} artículo(s).</p>
            <p>¿Deseas cambiar la categoría de estos artículos a "Sin categoría" o dejarla en blanco?</p>
          `,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Sin categoría',
          cancelButtonText: 'Dejar en blanco',
        });

        if (result.isConfirmed) {
          // Cambiar a "Sin categoría" (asumiendo que existe una categoría con nombre "Sin categoría")
          await updateArticulos(asociados.map((a) => a.id), { categoria: null });
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          // Dejar en blanco (null)
          await updateArticulos(asociados.map((a) => a.id), { categoria: null });
        } else {
          // Cancelar eliminación
          return;
        }
      }

      // Confirmar eliminación
      const confirm = await MySwal.fire({
        title: '¿Estás seguro?',
        text: 'Esta acción eliminará la categoría de forma permanente.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
      });

      if (confirm.isConfirmed) {
        await deleteCategoria(id);
        Swal.fire('Éxito', 'La categoría fue eliminada correctamente.', 'success');
        setCategorias((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (error) {
      Swal.fire('Error', 'Ocurrió un error al eliminar la categoría.', 'error');
    }
  };

  // Función para manejar la apertura del modal de creación
  const openCreateModal = () => {
    setIsCreateModalOpen(true);
    resetCreateForm();
  };

  // Función para manejar la creación de una nueva categoría
  const handleCreate = async () => {
    // Validaciones de nombre
    const newErrors = {
      nombre: !newNombre.trim(),
    };

    if (Object.values(newErrors).some((err) => err)) {
      setCreateErrors(newErrors);
      Swal.fire('Error', 'Por favor, complete el nombre de la categoría.', 'error');
      return;
    }

    // Validar duplicados en el nombre de categoría
    const nombreDuplicado = categorias.some(
      (c) => c.nombre.toLowerCase() === newNombre.trim().toLowerCase()
    );

    if (nombreDuplicado) {
      Swal.fire('Error', 'Ya existe una categoría con este nombre.', 'error');
      setCreateErrors({ ...newErrors, nombre: true });
      return;
    }

    // Asignar valor predeterminado si está en blanco
    const payload = {
      nombre: newNombre.trim(),
      descripcion: newDescripcion.trim() || '',
    };

    // Crear la nueva categoría
    try {
      const createdCategoria = await createCategoria(payload);
      Swal.fire('Éxito', 'Nueva categoría agregada correctamente.', 'success');
      setCategorias((prev) => [...prev, createdCategoria]);
      setIsCreateModalOpen(false);
      resetCreateForm();
    } catch (error) {
      Swal.fire('Error', 'Ocurrió un error al crear la categoría.', 'error');
    }
  };

  // Función para cancelar la creación
  const handleCancelCreate = () => {
    setIsCreateModalOpen(false);
    resetCreateForm();
  };

  // Filtrar categorías basado en la búsqueda
  const filterCategorias = useCallback(
    (categorias, term) => {
      if (!term) return categorias;
      const termLower = term.toLowerCase();
      return categorias.filter(
        (c) =>
          c.nombre.toLowerCase().includes(termLower) ||
          c.descripcion.toLowerCase().includes(termLower)
      );
    },
    []
  );

  return (
    <>
      {/* Modal Principal: Administrar Categorías */}
      <Modal
        isOpen={isOpen}
        onRequestClose={onRequestClose}
        contentLabel="Administrar Categorías"
        className="bg-white rounded-lg shadow-xl w-full max-w-5xl mx-auto p-6 overflow-auto"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      >
        {/* Encabezado del Modal */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Administrar Categorías</h2>
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
            title="Crear Nueva Categoría"
          >
            <FaPlus className="mr-2" /> Crear Categoría
          </button>
        </div>

        {/* Campo de búsqueda */}
        <div className="mb-4 flex items-center">
          <input
            type="text"
            placeholder="Buscar categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-3 border border-gray-300 rounded-md w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <FaSave className="ml-2 text-gray-500" />
        </div>

        {/* Tabla de Categorías */}
        {loading ? (
          <p className="text-center text-lg text-gray-600">Cargando datos...</p>
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
                  {filterCategorias(categorias, searchTerm).length > 0 ? (
                    filterCategorias(categorias, searchTerm).map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="py-3 px-6 text-sm text-gray-700">
                          {editingId === c.id ? (
                            <input
                              type="text"
                              value={editedNombre}
                              onChange={(e) => setEditedNombre(e.target.value)}
                              className="p-2 border border-gray-300 rounded-md w-full"
                              placeholder="Nombre de la categoría"
                            />
                          ) : (
                            c.nombre
                          )}
                        </td>
                        <td className="py-3 px-6 text-sm text-gray-700">
                          {editingId === c.id ? (
                            <textarea
                              value={editedDescripcion}
                              onChange={(e) => setEditedDescripcion(e.target.value)}
                              className="p-2 border border-gray-300 rounded-md w-full"
                              placeholder="Descripción de la categoría"
                            />
                          ) : (
                            c.descripcion || 'Sin descripción'
                          )}
                        </td>
                        <td className="py-3 px-6 text-center space-x-4">
                          {editingId === c.id ? (
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
                                onClick={() => handleEdit(c)}
                                className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                                title="Editar Categoría"
                              >
                                <FaEdit size={18} />
                              </button>
                              <button
                                onClick={() => handleDelete(c.id)}
                                className="text-red-600 hover:text-red-800 transition-colors duration-200"
                                title="Eliminar Categoría"
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

      {/* Modal Secundario: Crear Categoría */}
      <Modal
        isOpen={isCreateModalOpen}
        onRequestClose={handleCancelCreate}
        contentLabel="Crear Nueva Categoría"
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto p-6 overflow-auto"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      >
        {/* Encabezado del Modal de Creación */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Crear Nueva Categoría</h3>
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
          <label className="block text-gray-700 mb-2">Nombre<span className="text-red-500">*</span>:</label>
          <input
            type="text"
            value={newNombre}
            onChange={(e) => setNewNombre(e.target.value)}
            className={`w-full p-2 border ${createErrors.nombre ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="Nombre de la categoría"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Descripción:</label>
          <textarea
            value={newDescripcion}
            onChange={(e) => setNewDescripcion(e.target.value)}
            className={`w-full p-2 border ${createErrors.descripcion ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="Descripción de la categoría (opcional)"
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

export default CategoriaModal;
