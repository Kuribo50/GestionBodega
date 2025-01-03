// src/pages/usuarios.js

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import {
  fetchUsuarios,
  createUsuario,
  updateUsuario,
  deleteUsuario,
} from "@/services/api";
import Swal from "sweetalert2";
import {
  FaEdit,
  FaTrash,
  FaSave,
  FaSort,
  FaAngleDoubleLeft,
  FaAngleLeft,
  FaAngleRight,
  FaAngleDoubleRight,
  FaSortUp,
  FaSortDown,
  FaTimes,
  FaEye,
  FaEyeSlash,
  FaBars,
} from "react-icons/fa";
import Modal from "react-modal";
import { useTable, useSortBy, useGlobalFilter, usePagination } from "react-table";

// Configuración de react-modal
Modal.setAppElement("#__next");

// Componente de filtro global
const GlobalFilter = ({ globalFilter, setGlobalFilter }) => {
  return (
    <input
      value={globalFilter || ""}
      onChange={(e) => setGlobalFilter(e.target.value)}
      placeholder="Buscar en todos los campos..."
      className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black text-sm"
    />
  );
};

const UsersPage = () => {
  // Estados para almacenar usuarios
  const [users, setUsers] = useState([]);

  // Estados para el formulario de creación
  const [createFormData, setCreateFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    confirm_password: "",
  });

  const [createErrors, setCreateErrors] = useState({
    username: false,
    email: false,
    password: false,
    confirm_password: false,
  });

  // Estados para el modal de edición
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: null,
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    confirm_password: "",
  });

  const [editErrors, setEditErrors] = useState({
    username: false,
    email: false,
    password: false,
    confirm_password: false,
  });

  // Estados para manejar la visibilidad de las contraseñas
  const [createShowPassword, setCreateShowPassword] = useState(false);
  const [createShowConfirmPassword, setCreateShowConfirmPassword] = useState(false);
  const [editShowPassword, setEditShowPassword] = useState(false);
  const [editShowConfirmPassword, setEditShowConfirmPassword] = useState(false);

  // Estado para carga y errores
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estado para el filtro global
  const [globalFilter, setGlobalFilter] = useState("");

  // Estado para manejo de envío de formularios
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado para manejar la visibilidad de la sidebar en pantallas pequeñas
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Función para obtener usuarios desde el backend
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchUsuarios();
      setUsers(data);
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      Swal.fire("Error", "Error al obtener usuarios.", "error");
      setError("Error al obtener usuarios.");
    } finally {
      setLoading(false);
    }
  }, []); // Dependencias vacías si 'fetchUsuarios' es estable

  // Ejecutar fetchData al montar el componente
  useEffect(() => {
    fetchData();
  }, [fetchData]); // Incluir 'fetchData' en las dependencias

  // Función para manejar cambios en el formulario de creación
  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    setCreateFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Resetear errores al cambiar campos
    setCreateErrors((prev) => ({
      ...prev,
      [name]: false,
    }));
  };

  // Función para manejar la creación de usuarios
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validar campos obligatorios
    if (!createFormData.username.trim()) {
      Swal.fire({
        icon: "error",
        title: "Campo obligatorio",
        text: "El nombre de usuario es obligatorio.",
      });
      setCreateErrors((prev) => ({ ...prev, username: true }));
      setIsSubmitting(false);
      return;
    }

    // Validar contraseñas si se proporcionan
    if (createFormData.password || createFormData.confirm_password) {
      if (createFormData.password !== createFormData.confirm_password) {
        Swal.fire({
          icon: "error",
          title: "Contraseñas no coinciden",
          text: "Las contraseñas ingresadas no coinciden.",
        });
        setCreateErrors((prev) => ({
          ...prev,
          password: true,
          confirm_password: true,
        }));
        setIsSubmitting(false);
        return;
      }
    }

    // Manejar creación sin correo electrónico
    if (!createFormData.email.trim()) {
      const { isConfirmed } = await Swal.fire({
        icon: "warning",
        title: "Correo no proporcionado",
        text: "¿Deseas crear el usuario sin correo electrónico?",
        showCancelButton: true,
        confirmButtonText: "Sí, crear",
        cancelButtonText: "Cancelar",
      });

      if (!isConfirmed) {
        setIsSubmitting(false);
        return;
      }
    }

    try {
      // Validar duplicados antes de crear
      const duplicateFields = validateDuplicates(createFormData);
      if (duplicateFields.length > 0) {
        setCreateErrors(
          duplicateFields.reduce((acc, field) => ({ ...acc, [field]: true }), {})
        );
        Swal.fire({
          icon: "error",
          title: "Errores de Duplicación",
          text: `Los siguientes campos ya existen: ${duplicateFields
            .map((field) => field.replace("_", " "))
            .join(", ")}.`,
        });
        setIsSubmitting(false);
        return;
      }

      // Preparar datos para enviar
      const payload = {
        username: createFormData.username,
        email: createFormData.email,
        first_name: createFormData.first_name,
        last_name: createFormData.last_name,
        password: createFormData.password, // Siempre se envía la contraseña ya que es requerida
      };

      // Crear usuario
      await createUsuario(payload);
      Swal.fire("Éxito", "Usuario creado correctamente.", "success");
      fetchData();
      resetCreateForm();
    } catch (error) {
      console.error("Error al crear usuario:", error);
      if (error.response) {
        console.log("Detalles del error:", error.response.data);
        Swal.fire("Error", JSON.stringify(error.response.data), "error");
      } else {
        Swal.fire("Error", "Ocurrió un error al crear el usuario.", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función para reiniciar el formulario de creación
  const resetCreateForm = () => {
    setCreateFormData({
      username: "",
      email: "",
      first_name: "",
      last_name: "",
      password: "",
      confirm_password: "",
    });
    setCreateErrors({
      username: false,
      email: false,
      password: false,
      confirm_password: false,
    });
    setCreateShowPassword(false);
    setCreateShowConfirmPassword(false);
  };

  // Función para manejar la apertura del modal de edición
  const openEditModal = useCallback((user) => {
    if (user.username === "admin") {
      Swal.fire({
        icon: "error",
        title: "Acción no permitida",
        text: 'No se permite modificar el usuario "admin".',
      });
      return;
    }

    setEditFormData({
      id: user.id,
      username: user.username,
      email: user.email || "",
      first_name: user.first_name,
      last_name: user.last_name,
      password: "",
      confirm_password: "",
    });
    setEditErrors({
      username: false,
      email: false,
      password: false,
      confirm_password: false,
    });
    setEditShowPassword(false);
    setEditShowConfirmPassword(false);
    setIsModalOpen(true);
  }, []); // Dependencias vacías ya que no depende de nada externo

  // Función para manejar cambios en el formulario de edición
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Resetear errores al cambiar campos
    setEditErrors((prev) => ({
      ...prev,
      [name]: false,
    }));
  };

  // Función para manejar la edición de usuarios
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validar campos obligatorios
    if (!editFormData.username.trim()) {
      Swal.fire({
        icon: "error",
        title: "Campo obligatorio",
        text: "El nombre de usuario es obligatorio.",
      });
      setEditErrors((prev) => ({ ...prev, username: true }));
      setIsSubmitting(false);
      return;
    }

    // Validar contraseñas si se proporcionan
    if (editFormData.password || editFormData.confirm_password) {
      if (editFormData.password !== editFormData.confirm_password) {
        Swal.fire({
          icon: "error",
          title: "Contraseñas no coinciden",
          text: "Las contraseñas ingresadas no coinciden.",
        });
        setEditErrors((prev) => ({
          ...prev,
          password: true,
          confirm_password: true,
        }));
        setIsSubmitting(false);
        return;
      }
    }

    // Manejar edición sin correo electrónico
    if (!editFormData.email.trim()) {
      const { isConfirmed } = await Swal.fire({
        icon: "warning",
        title: "Correo no proporcionado",
        text: "¿Deseas actualizar el usuario sin correo electrónico?",
        showCancelButton: true,
        confirmButtonText: "Sí, actualizar",
        cancelButtonText: "Cancelar",
      });

      if (!isConfirmed) {
        setIsSubmitting(false);
        return;
      }
    }

    try {
      // Validar duplicados antes de actualizar
      const duplicateFields = validateDuplicates(editFormData, editFormData.id);
      if (duplicateFields.length > 0) {
        setEditErrors(
          duplicateFields.reduce((acc, field) => ({ ...acc, [field]: true }), {})
        );
        Swal.fire({
          icon: "error",
          title: "Errores de Duplicación",
          text: `Los siguientes campos ya existen: ${duplicateFields
            .map((field) => field.replace("_", " "))
            .join(", ")}.`,
        });
        setIsSubmitting(false);
        return;
      }

      // Preparar datos para enviar
      const payload = {
        username: editFormData.username,
        email: editFormData.email,
        first_name: editFormData.first_name,
        last_name: editFormData.last_name,
      };

      if (editFormData.password) {
        payload.password = editFormData.password;
      }

      // Actualizar usuario
      await updateUsuario(editFormData.id, payload);
      Swal.fire("Éxito", "Usuario actualizado correctamente.", "success");
      fetchData();
      closeEditModal();
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      if (error.response) {
        console.log("Detalles del error:", error.response.data);
        Swal.fire("Error", JSON.stringify(error.response.data), "error");
      } else {
        Swal.fire("Error", "Ocurrió un error al actualizar el usuario.", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función para cerrar el modal de edición
  const closeEditModal = () => {
    setIsModalOpen(false);
    setEditFormData({
      id: null,
      username: "",
      email: "",
      first_name: "",
      last_name: "",
      password: "",
      confirm_password: "",
    });
    setEditErrors({
      username: false,
      email: false,
      password: false,
      confirm_password: false,
    });
    setEditShowPassword(false);
    setEditShowConfirmPassword(false);
  };

  // Función para manejar la eliminación de usuarios
  const handleDelete = useCallback(async (userId) => {
    const userToDelete = users.find((user) => user.id === userId);

    if (userToDelete.username === "admin") {
      Swal.fire({
        icon: "error",
        title: "Acción no permitida",
        text: 'No se permite eliminar el usuario "admin".',
      });
      return;
    }

    Swal.fire({
      title: "¿Estás seguro?",
      text: `¿Quieres eliminar al usuario "${userToDelete.username}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e74c3c",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteUsuario(userId);
          Swal.fire("Éxito", "Usuario eliminado correctamente.", "success");
          setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
        } catch (error) {
          Swal.fire("Error", "No se pudo eliminar el usuario.", "error");
        }
      }
    });
  }, [users]); // 'deleteUsuario' eliminado de las dependencias

  // Función para validar duplicados
  const validateDuplicates = (data, userId = null) => {
    const duplicateFields = [];

    // Validar Username
    const isUsernameDuplicate = users.some(
      (user) =>
        user.username.toLowerCase() === data.username.toLowerCase() &&
        user.id !== userId
    );
    if (isUsernameDuplicate) duplicateFields.push("username");

    // Validar Email
    if (data.email) {
      const isEmailDuplicate = users.some(
        (user) =>
          user.email.toLowerCase() === data.email.toLowerCase() &&
          user.id !== userId
      );
      if (isEmailDuplicate) duplicateFields.push("email");
    }

    return duplicateFields;
  };

  // Definir columnas para react-table
  const columns = useMemo(
    () => [
      {
        Header: "ID",
        accessor: "id",
      },
      {
        Header: "Usuario",
        accessor: "username",
      },
      {
        Header: "Email",
        accessor: "email",
        Cell: ({ value }) => (value ? value : "Sin correo"),
      },
      {
        Header: "Nombre",
        accessor: "first_name",
      },
      {
        Header: "Apellido",
        accessor: "last_name",
      },
      {
        Header: "Acciones",
        accessor: "acciones",
        disableSortBy: true,
        Cell: ({ row }) => (
          <div className="flex justify-center space-x-2">
            <button
              onClick={() => openEditModal(row.original)}
              className="text-blue-600 hover:text-blue-900"
              title="Editar Usuario"
            >
              <FaEdit />
            </button>
            <button
              onClick={() => handleDelete(row.original.id)}
              className="text-red-600 hover:text-red-900"
              title="Eliminar Usuario"
            >
              <FaTrash />
            </button>
          </div>
        ),
      },
    ],
    [openEditModal, handleDelete] // Incluir las funciones en las dependencias
  );

  const data = useMemo(() => users, [users]);

  // Configurar react-table
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    // Paginación
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    state: { pageIndex, pageSize },
    setGlobalFilter: setTableGlobalFilter,
    nextPage,
    previousPage,
    setPageSize,
    gotoPage,
  } = useTable(
    {
      columns,
      data,
      initialState: { pageIndex: 0, pageSize: 5 }, // Configuración inicial de la paginación a 5
    },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  useEffect(() => {
    setTableGlobalFilter(globalFilter);
  }, [globalFilter, setTableGlobalFilter]);

  // Función para limpiar el formulario de creación
  const clearCreateForm = () => {
    resetCreateForm();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="text-xl text-blue-500">Cargando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="text-xl text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Botón de menú para pantallas pequeñas */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="text-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          aria-label="Abrir menú"
        >
          <FaBars size={24} />
        </button>
      </div>

      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Contenedor principal */}
      <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto ml-0 md:ml-64">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Gestión de Usuarios
        </h1>

        {/* Formulario de Creación de Usuarios */}
        <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md mb-8">
          <form onSubmit={handleCreateSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nombre de Usuario */}
              <div>
                <label
                  htmlFor="create_username"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nombre de Usuario *
                </label>
                <input
                  type="text"
                  name="username"
                  id="create_username"
                  value={createFormData.username}
                  onChange={handleCreateChange}
                  required
                  className={`mt-1 block w-full px-4 py-2 border ${
                    createErrors.username ? "border-red-500" : "border-gray-300"
                  } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Nombre de usuario"
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="create_email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  name="email"
                  id="create_email"
                  value={createFormData.email}
                  onChange={handleCreateChange}
                  className={`mt-1 block w-full px-4 py-2 border ${
                    createErrors.email ? "border-red-500" : "border-gray-300"
                  } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Correo electrónico"
                />
              </div>

              {/* Nombre */}
              <div>
                <label
                  htmlFor="create_first_name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nombre
                </label>
                <input
                  type="text"
                  name="first_name"
                  id="create_first_name"
                  value={createFormData.first_name}
                  onChange={handleCreateChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nombre"
                />
              </div>

              {/* Apellido */}
              <div>
                <label
                  htmlFor="create_last_name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Apellido
                </label>
                <input
                  type="text"
                  name="last_name"
                  id="create_last_name"
                  value={createFormData.last_name}
                  onChange={handleCreateChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Apellido"
                />
              </div>

              {/* Contraseña */}
              <div className="relative">
                <label
                  htmlFor="create_password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Contraseña *
                </label>
                <input
                  type={createShowPassword ? "text" : "password"}
                  name="password"
                  id="create_password"
                  value={createFormData.password}
                  onChange={handleCreateChange}
                  required
                  className={`mt-1 block w-full px-4 py-2 border ${
                    createErrors.password ? "border-red-500" : "border-gray-300"
                  } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Contraseña"
                />
                {/* Botón para mostrar/ocultar contraseña */}
                <button
                  type="button"
                  onClick={() => setCreateShowPassword(!createShowPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                  title={createShowPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {createShowPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              {/* Confirmar Contraseña */}
              <div className="relative">
                <label
                  htmlFor="create_confirm_password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Confirmar Contraseña *
                </label>
                <input
                  type={createShowConfirmPassword ? "text" : "password"}
                  name="confirm_password"
                  id="create_confirm_password"
                  value={createFormData.confirm_password}
                  onChange={handleCreateChange}
                  required
                  className={`mt-1 block w-full px-4 py-2 border ${
                    createErrors.confirm_password ? "border-red-500" : "border-gray-300"
                  } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Confirmar contraseña"
                />
                {/* Botón para mostrar/ocultar confirmación de contraseña */}
                <button
                  type="button"
                  onClick={() => setCreateShowConfirmPassword(!createShowConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                  title={
                    createShowConfirmPassword
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                >
                  {createShowConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 ${
                  isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <FaSave className="mr-2" />
                {isSubmitting ? "Creando..." : "Crear Usuario"}
              </button>
              <button
                type="button"
                onClick={clearCreateForm}
                className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
              >
                <FaTimes className="mr-2" />
                Cancelar
              </button>
            </div>
          </form>
        </div>

        {/* Tabla de Usuarios con react-table */}
        <div className="max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-md overflow-x-auto">
          <div className="mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center">
            <GlobalFilter globalFilter={globalFilter} setGlobalFilter={setGlobalFilter} />
            {/* Puedes agregar otros controles aquí si los necesitas */}
          </div>
          <div className="overflow-x-auto">
            <table {...getTableProps()} className="min-w-full bg-white border border-gray-300 rounded-lg shadow-md">
              <thead className="bg-gray-200">
                {headerGroups.map((headerGroup) => (
                  <tr {...headerGroup.getHeaderGroupProps()} key={headerGroup.id}>
                    {headerGroup.headers.map((column) => (
                      <th
                        {...column.getHeaderProps(column.getSortByToggleProps())}
                        className="px-4 py-3 text-left font-semibold uppercase text-gray-700 border border-gray-300"
                        key={column.id}
                      >
                        <div className="flex items-center">
                          {column.render("Header")}
                          <span className="ml-2">
                            {column.isSorted ? (
                              column.isSortedDesc ? (
                                <FaSortDown />
                              ) : (
                                <FaSortUp />
                              )
                            ) : (
                              <FaSort className="opacity-50" />
                            )}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody {...getTableBodyProps()}>
                {page.map((row, i) => {
                  prepareRow(row);
                  return (
                    <tr
                      {...row.getRowProps()}
                      key={row.id}
                      className={`${
                        i % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } hover:bg-gray-100 whitespace-nowrap`}
                    >
                      {row.cells.map((cell) => (
                        <td
                          {...cell.getCellProps()}
                          key={cell.column.id}
                          className="px-4 py-2 border border-gray-300"
                        >
                          {cell.render("Cell")}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                {users.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-4 py-2 whitespace-nowrap text-sm text-center text-gray-600 border border-gray-300"
                    >
                      No hay usuarios disponibles.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-sm">
            <div className="flex space-x-2 mb-2 sm:mb-0">
              <button
                onClick={() => gotoPage(0)}
                disabled={!canPreviousPage}
                className={`px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors ${
                  !canPreviousPage ? "bg-gray-300 cursor-not-allowed" : ""
                }`}
                title="Primera Página"
              >
                <FaAngleDoubleLeft />
              </button>
              <button
                onClick={() => previousPage()}
                disabled={!canPreviousPage}
                className={`px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors ${
                  !canPreviousPage ? "bg-gray-300 cursor-not-allowed" : ""
                }`}
                title="Página Anterior"
              >
                <FaAngleLeft />
              </button>
              <button
                onClick={() => nextPage()}
                disabled={!canNextPage}
                className={`px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors ${
                  !canNextPage ? "bg-gray-300 cursor-not-allowed" : ""
                }`}
                title="Página Siguiente"
              >
                <FaAngleRight />
              </button>
              <button
                onClick={() => gotoPage(pageOptions.length - 1)}
                disabled={!canNextPage}
                className={`px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors ${
                  !canNextPage ? "bg-gray-300 cursor-not-allowed" : ""
                }`}
                title="Última Página"
              >
                <FaAngleDoubleRight />
              </button>
            </div>
            <span className="text-gray-700 mb-2 sm:mb-0">
              Página <strong>{pageIndex + 1}</strong> de{" "}
              <strong>{pageOptions.length}</strong>
            </span>
            <div className="flex items-center space-x-2">
              <label htmlFor="pageSize" className="text-gray-700">
                Mostrar:
              </label>
              <select
                id="pageSize"
                value={pageSize}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setPageSize(value);
                }}
                className="border border-gray-300 rounded-md p-2 text-black bg-white shadow focus:ring-2 focus:ring-blue-500 focus:outline-none hover:bg-gray-50"
              >
                {[5, 10, 20, 30, 50].map((sizeOption) => (
                  <option key={sizeOption} value={sizeOption}>
                    {sizeOption} por página
                  </option>
                ))}
                <option value={data.length}>Mostrar todos los usuarios</option>
              </select>
            </div>
          </div>
        </div>

        {/* Modal para Editar Usuarios */}
        <Modal
          isOpen={isModalOpen}
          onRequestClose={closeEditModal}
          contentLabel="Editar Usuario"
          className="bg-white rounded-lg shadow-xl w-11/12 max-w-lg mx-auto p-6 overflow-auto"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-800">Editar Usuario</h2>
            <button onClick={closeEditModal} className="text-gray-600 hover:text-gray-800">
              <FaTimes size={24} />
            </button>
          </div>

          <form onSubmit={handleEditSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nombre de Usuario */}
              <div>
                <label
                  htmlFor="edit_username"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nombre de Usuario *
                </label>
                <input
                  type="text"
                  name="username"
                  id="edit_username"
                  value={editFormData.username}
                  onChange={handleEditChange}
                  required
                  className={`mt-1 block w-full px-4 py-2 border ${
                    editErrors.username ? "border-red-500" : "border-gray-300"
                  } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Nombre de usuario"
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="edit_email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  name="email"
                  id="edit_email"
                  value={editFormData.email}
                  onChange={handleEditChange}
                  className={`mt-1 block w-full px-4 py-2 border ${
                    editErrors.email ? "border-red-500" : "border-gray-300"
                  } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Correo electrónico"
                />
              </div>

              {/* Nombre */}
              <div>
                <label
                  htmlFor="edit_first_name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nombre
                </label>
                <input
                  type="text"
                  name="first_name"
                  id="edit_first_name"
                  value={editFormData.first_name}
                  onChange={handleEditChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nombre"
                />
              </div>

              {/* Apellido */}
              <div>
                <label
                  htmlFor="edit_last_name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Apellido
                </label>
                <input
                  type="text"
                  name="last_name"
                  id="edit_last_name"
                  value={editFormData.last_name}
                  onChange={handleEditChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Apellido"
                />
              </div>

              {/* Contraseña */}
              <div className="relative">
                <label
                  htmlFor="edit_password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Contraseña
                </label>
                <input
                  type={editShowPassword ? "text" : "password"}
                  name="password"
                  id="edit_password"
                  value={editFormData.password}
                  onChange={handleEditChange}
                  className={`mt-1 block w-full px-4 py-2 border ${
                    editErrors.password ? "border-red-500" : "border-gray-300"
                  } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Nueva contraseña"
                />
                {/* Botón para mostrar/ocultar contraseña */}
                <button
                  type="button"
                  onClick={() => setEditShowPassword(!editShowPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                  title={editShowPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {editShowPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              {/* Confirmar Contraseña */}
              <div className="relative">
                <label
                  htmlFor="edit_confirm_password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Confirmar Contraseña
                </label>
                <input
                  type={editShowConfirmPassword ? "text" : "password"}
                  name="confirm_password"
                  id="edit_confirm_password"
                  value={editFormData.confirm_password}
                  onChange={handleEditChange}
                  className={`mt-1 block w-full px-4 py-2 border ${
                    editErrors.confirm_password ? "border-red-500" : "border-gray-300"
                  } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Confirmar nueva contraseña"
                />
                {/* Botón para mostrar/ocultar confirmación de contraseña */}
                <button
                  type="button"
                  onClick={() => setEditShowConfirmPassword(!editShowConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                  title={
                    editShowConfirmPassword
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                >
                  {editShowConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 ${
                  isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <FaSave className="mr-2" />
                {isSubmitting ? "Guardando..." : "Guardar Cambios"}
              </button>
              <button
                type="button"
                onClick={closeEditModal}
                className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
              >
                <FaTimes className="mr-2" />
                Cancelar
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default UsersPage;
