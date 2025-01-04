// src/components/Dashboard/Calendar.js

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import moment from 'moment';
import DatePicker from 'react-datepicker';
import { FiPlus, FiArrowLeft, FiArrowRight, FiEdit } from 'react-icons/fi';
import 'react-datepicker/dist/react-datepicker.css';
import MySwal from '@/utils/swalConfig';
import Holidays from 'date-holidays';
import { useUser } from '@/context/UserContext';
import { 
  fetchTasks, 
  createTask, 
  updateTask, 
  deleteTask as deleteTaskAPI 
} from '@/services/api';
import 'moment/locale/es'; // Importar el idioma español

moment.locale('es'); // Configurar Moment.js en español

// ------------------------------------------------------------------
// Funciones Auxiliares
// ------------------------------------------------------------------
function dayIsBetween(dayStr, startStr, endStr) {
  const dayMoment = moment(dayStr, 'YYYY-MM-DD');
  const startMoment = moment(startStr, 'YYYY-MM-DD');
  const endMoment = moment(endStr, 'YYYY-MM-DD');
  return (
    dayMoment.isSameOrAfter(startMoment, 'day') &&
    dayMoment.isSameOrBefore(endMoment, 'day')
  );
}

// ------------------------------------------------------------------
// Modal de CREAR TAREA
// ------------------------------------------------------------------
function TaskModal({ isOpen, onClose, onSave, defaultDay }) {
  const [title, setTitle] = useState('');
  const [task_type, setTaskType] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  useEffect(() => {
    if (isOpen && defaultDay) {
      const clickedDate = moment(defaultDay, 'YYYY-MM-DD').toDate();
      setStartDate(clickedDate);
      setEndDate(null);
      setTitle('');
      setTaskType('');
    }
  }, [isOpen, defaultDay]);

  function handleSave() {
    if (!title.trim()) {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor, ingresa un título.',
      });
      return;
    }
    if (!startDate) {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Selecciona al menos la fecha de inicio.',
      });
      return;
    }
    const finalEnd = endDate || startDate;
    const newTask = {
      title: title.trim(),
      task_type: task_type.trim(),
      start: moment(startDate).format('YYYY-MM-DD'),
      end: moment(finalEnd).format('YYYY-MM-DD'),
      completed: false,
    };
    onSave(newTask);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md sm:max-w-lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          {defaultDay
            ? `Crear Tarea para el Día ${moment(defaultDay).format('DD/MM/YYYY')}`
            : 'Crear Tarea'}
        </h2>

        {/* Título */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Título
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: Reunión de equipo"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Tipo de Tarea */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Tarea
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: Reunión, Desarrollo, etc."
            value={task_type}
            onChange={(e) => setTaskType(e.target.value)}
          />
        </div>

        {/* Fechas */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Selecciona fecha de inicio y fin (la de inicio ya está seleccionada)
          </p>
          <div className="flex flex-col sm:flex-row sm:space-x-2">
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              dateFormat="dd/MM/yyyy"
              className="w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 sm:mb-0"
              placeholderText="Fecha de Inicio"
            />
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              dateFormat="dd/MM/yyyy"
              className="w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholderText="Fecha de Fin (Opcional)"
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Modal de VER/MANEJAR TAREAS (Segundo modal) con scrollbar
// ------------------------------------------------------------------
function ViewTasksModal({
  isOpen,
  onClose,
  tasks,
  clickedDay,
  clickedHoliday,
  onUpdate,
  onDelete,
}) {
  // Filtrar tareas para este día
  const filteredTasks = useMemo(() => {
    if (!clickedDay) return [];
    return tasks.filter((t) => dayIsBetween(clickedDay, t.start, t.end));
  }, [tasks, clickedDay]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
      <div
        className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl sm:max-w-xl lg:max-w-2xl 
                  overflow-y-auto max-h-[90vh]"
      >
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          Tareas Pendientes - {moment(clickedDay).format('DD/MM/YYYY')}
        </h2>

        {/* Feriado */}
        {clickedHoliday && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 rounded-md">
            <h3 className="text-lg font-semibold text-red-700">
              Feriado: {clickedHoliday.name}
            </h3>
            <p className="text-sm text-red-600">
              {clickedHoliday.description || 'Este es un día feriado oficial.'}
            </p>
          </div>
        )}

        {/* Lista de Tareas */}
        {filteredTasks.length === 0 && !clickedHoliday ? (
          <p className="text-sm text-gray-500">
            No hay tareas pendientes para este día.
          </p>
        ) : (
          <ul className="space-y-4">
            {filteredTasks.map((task) => (
              <li
                key={task.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-2"
              >
                <div className="mb-2 sm:mb-0">
                  <h3
                    className={`text-lg ${
                      task.completed ? 'line-through text-green-500' : 'text-gray-800'
                    }`}
                  >
                    {task.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Tipo de Tarea: {task.task_type}
                  </p>
                  <p className="text-sm text-gray-600">
                    Fecha: {moment(task.start).format('DD/MM/YYYY')}{' '}
                    {task.start !== task.end &&
                      ` - ${moment(task.end).format('DD/MM/YYYY')}`}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onUpdate(task.id)}
                    className={`px-3 py-1 text-sm rounded-md focus:outline-none ${
                      task.completed
                        ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    {task.completed ? 'Marcar Incompleta' : 'Completar'}
                  </button>
                  <button
                    onClick={() => onDelete(task.id)}
                    className="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded-md focus:outline-none"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Botón Cerrar */}
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ------------------------------------------------------------------
export default function CalendarComponent() {
  const { user, loading } = useUser();
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [clickedDay, setClickedDay] = useState(null);
  const [clickedHoliday, setClickedHoliday] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(moment());
  const [holidays, setHolidays] = useState([]);

  useEffect(() => {
    moment.locale('es');
  }, []);

  const year = currentMonth.year();
  useEffect(() => {
    const hd = new Holidays('CL');
    const holidaysData = hd.getHolidays(year);
    setHolidays(holidaysData);
    // console.log('Feriados cargados:', holidaysData);
  }, [year]);

  // Elimina logs consecutivos de "Día: 2025-01-01, Tareas: 0", etc.
  // => Quitamos console.log para que no aparezcan esas notificaciones.
  const countTasks = useMemo(() => {
    return (d) => {
      const dayStr = currentMonth.clone().date(d).format('YYYY-MM-DD');
      const count = tasks.filter((t) => dayIsBetween(dayStr, t.start, t.end)).length;
      // No console.log, para evitar notificaciones seguidas
      return count;
    };
  }, [tasks, currentMonth]);

  function generateEmptyCells(startDay) {
    const cells = [];
    for (let i = 0; i < startDay; i++) {
      cells.push(<div key={`empty-${i}`} className="hidden sm:block" />);
    }
    return cells;
  }

  function generateDayCells(daysInMonth) {
    const cells = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const taskCount = countTasks(d);
      const dateMoment = currentMonth.clone().date(d);
      const dateStr = dateMoment.format('YYYY-MM-DD');

      const holiday = holidays.find((h) => h.date === dateStr);
      const isHoliday = !!holiday;
      const holidayName = holiday ? holiday.name : '';

      const isSunday = dateMoment.day() === 0;

      cells.push(
        <div
          key={d}
          className={`p-2 border border-gray-200 text-center relative cursor-pointer 
                     hover:bg-gray-100 rounded-lg h-24 flex flex-col justify-between 
                     ${isHoliday ? 'bg-red-100 text-red-700' : isSunday ? 'text-red-500' : 'bg-white text-gray-800'}`}
          onClick={() => {
            setClickedDay(dateStr);
            setClickedHoliday(isHoliday ? holiday : null);
            setViewModalOpen(true);
          }}
          title={isHoliday ? holidayName : undefined}
        >
          <div className="font-semibold">{d}</div>
          <div className="flex items-center justify-center space-x-1">
            {taskCount > 0 && (
              <span
                className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full"
                title={`Hay ${taskCount} tarea(s)`}
              >
                {taskCount}
              </span>
            )}
            {isHoliday && (
              <span
                className="w-3 h-3 bg-red-500 rounded-full"
                title={`Feriado: ${holidayName}`}
              ></span>
            )}
          </div>
        </div>
      );
    }
    return cells;
  }

  function prevMonth() {
    setCurrentMonth(currentMonth.clone().subtract(1, 'months'));
  }

  function nextMonth() {
    setCurrentMonth(currentMonth.clone().add(1, 'months'));
  }

  useEffect(() => {
    if (user && user.id) {
      fetchTasks(user.id)
        .then((fetchedTasks) => {
          setTasks(fetchedTasks);
        })
        .catch((error) => {
          console.error('Error al cargar tareas:', error);
        });
    } else {
      setTasks([]);
    }
  }, [user]);

  // Guardar una nueva tarea
  async function handleSaveTask(newTask) {
    try {
      const createdTask = await createTask(newTask);
      setTasks((prev) => [...prev, createdTask]);
      setModalOpen(false);
      MySwal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Tarea creada correctamente.',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error al guardar la tarea:', error);
    }
  }

  // Marcar tarea como completada o incompleta
  async function toggleCompleteTask(taskId) {
    try {
      const taskToUpdate = tasks.find((task) => task.id === taskId);
      if (!taskToUpdate) throw new Error('Tarea no encontrada');

      const updatedTask = await updateTask(taskId, {
        completed: !taskToUpdate.completed,
      });
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? updatedTask : task))
      );
      MySwal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Tarea actualizada correctamente.',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error al actualizar tarea:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo actualizar la tarea. Por favor, inténtalo de nuevo.',
      });
    }
  }

  // Eliminar una tarea
  async function handleDeleteTask(taskId) {
    try {
      const success = await deleteTaskAPI(taskId);
      if (success) {
        setTasks((prev) => prev.filter((task) => task.id !== taskId));
        MySwal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: 'La tarea ha sido eliminada.',
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error('Error al eliminar tarea:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo eliminar la tarea. Por favor, inténtalo de nuevo.',
      });
    }
  }

  const firstDayOfMonth = currentMonth.clone().startOf('month');
  const startDay = (firstDayOfMonth.day() + 6) % 7; // Ajuste para que la semana comience en lunes
  const daysInMonth = currentMonth.daysInMonth();

  const emptyCells = generateEmptyCells(startDay);
  const dayCells = generateDayCells(daysInMonth);

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!user) {
    return <div>No estás autenticado. Por favor, inicia sesión.</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
      {/* Encabezado del Calendario */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-4 sm:space-y-0">
        {/* Navegación Mes */}
        <div className="flex items-center space-x-2">
          <button
            onClick={prevMonth}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors focus:outline-none"
            title="Mes Anterior"
          >
            <FiArrowLeft />
          </button>
          <h3 className="text-lg font-semibold text-gray-700">
            {currentMonth.format('MMMM YYYY')}
          </h3>
          <button
            onClick={nextMonth}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors focus:outline-none"
            title="Mes Siguiente"
          >
            <FiArrowRight />
          </button>
        </div>

        {/* Botón Añadir Tarea Hoy */}
        <button
          onClick={() => {
            const today = moment();
            setClickedDay(today.format('YYYY-MM-DD'));
            setClickedHoliday(null);
            setModalOpen(true);
          }}
          className="flex items-center bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors focus:outline-none"
        >
          <FiPlus className="mr-2" />
          Añadir Tarea
        </button>
      </div>

      {/* Encabezado de Días (Lun - Dom) */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((ds, i) => (
          <div
            key={i}
            className="font-bold text-center bg-gray-200 p-2 rounded-md text-sm"
          >
            {ds}
          </div>
        ))}
      </div>

      {/* Celdas del Calendario */}
      <div className="grid grid-cols-7 gap-1">{emptyCells}{dayCells}</div>

      <p className="text-sm text-gray-500 mt-2">
        *Haz clic en un día para ver las tareas pendientes o usa el botón &quot;Añadir Tarea&quot; para agregar una tarea para hoy.
      </p>

      {/* Modal Crear Tarea */}
      <TaskModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveTask}
        defaultDay={clickedDay}
      />

      {/* Modal Ver Tareas (Segundo modal, responsivo con scrollbar) */}
      <ViewTasksModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        tasks={tasks}
        clickedDay={clickedDay}
        clickedHoliday={clickedHoliday}
        onUpdate={toggleCompleteTask}
        onDelete={handleDeleteTask}
      />
    </div>
  );
}
