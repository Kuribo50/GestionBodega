import React, { useState } from "react";
import { 
  FaBoxOpen, 
  FaTags, 
  FaCogs, 
  FaMapMarkedAlt, 
  FaBullhorn, 
  FaFlag, 
  FaEdit, 
  FaExclamation, 
  FaUserTie 
} from 'react-icons/fa';
import Sidebar from "@/components/Sidebar";
import Card from '@/components/Card';
import CategoriaModal from '@/components/administracion/CategoriaModal';
import MarcaModal from '@/components/administracion/MarcaModal';
import ModeloModal from '@/components/administracion/ModeloModal';
import UbicacionModal from '@/components/administracion/UbicacionModal';
import MotivoModal from '@/components/administracion/MotivoModal';
import EstadoModal from '@/components/administracion/EstadoModal';
import ActualizarStockMinimoModal from '@/components/administracion/ActualizarStockMinimoModal';
import ModificarStockModal from '@/components/administracion/ModificarStockModal';
import PersonalModal from '@/components/administracion/PersonalModal'; // Modal para administrar personal
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Administracion = () => {
  const [isCategoriaModalOpen, setIsCategoriaModalOpen] = useState(false);
  const [isMarcaModalOpen, setIsMarcaModalOpen] = useState(false);
  const [isModeloModalOpen, setIsModeloModalOpen] = useState(false);
  const [isUbicacionModalOpen, setIsUbicacionModalOpen] = useState(false);
  const [isMotivoModalOpen, setIsMotivoModalOpen] = useState(false);
  const [isEstadoModalOpen, setIsEstadoModalOpen] = useState(false);
  const [isActualizarStockMinimoModalOpen, setIsActualizarStockMinimoModalOpen] = useState(false);
  const [isModificarStockModalOpen, setIsModificarStockModalOpen] = useState(false);
  const [isPersonalModalOpen, setIsPersonalModalOpen] = useState(false); // Estado para abrir el modal de personal

  return (
    <div className="flex">
      {/* Sidebar para navegación */}
      <Sidebar />

      {/* Contenido principal */}
      <main className="flex-1 p-6 bg-gray-100 sm:ml-64">
        <h1 className="text-3xl font-bold mb-6">Administración General</h1>

        {/* Grid de tarjetas para las distintas funcionalidades */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <Card
            title="Categorías"
            description="Agregar, editar o desactivar categorías de productos."
            icon={FaTags}
            color="text-yellow-500"
            onClick={() => setIsCategoriaModalOpen(true)}
          />
          <Card
            title="Marcas"
            description="Gestionar marcas asociadas a los productos."
            icon={FaBoxOpen}
            color="text-blue-500"
            onClick={() => setIsMarcaModalOpen(true)}
          />
          <Card
            title="Modelos"
            description="Administrar los modelos disponibles de cada marca."
            icon={FaCogs}
            color="text-green-500"
            onClick={() => setIsModeloModalOpen(true)}
          />
          <Card
            title="Ubicaciones"
            description="Configurar y gestionar ubicaciones de almacenamiento."
            icon={FaMapMarkedAlt}
            color="text-red-500"
            onClick={() => setIsUbicacionModalOpen(true)}
          />
          <Card
            title="Motivos"
            description="Administrar motivos de movimientos de inventario."
            icon={FaBullhorn}
            color="text-purple-500"
            onClick={() => setIsMotivoModalOpen(true)}
          />
          <Card
            title="Estados"
            description="Configurar estados de artículos y movimientos."
            icon={FaFlag}
            color="text-indigo-500"
            onClick={() => setIsEstadoModalOpen(true)}
          />
          <Card
            title="Modificación de Stock"
            description="Editar o corregir artículos en el inventario."
            icon={FaEdit}
            color="text-orange-500"
            onClick={() => setIsModificarStockModalOpen(true)}
          />
          <Card
            title="Actualizar Stock Mínimo"
            description="Editar el stock mínimo de cada artículo."
            icon={FaExclamation}
            color="text-red-500"
            onClick={() => setIsActualizarStockMinimoModalOpen(true)}
          />
          <Card
            title="Administrar Personal"
            description="Gestionar información y roles del personal."
            icon={FaUserTie}
            color="text-teal-500"
            onClick={() => setIsPersonalModalOpen(true)}
          />
        </div>

        {/* Modales para cada funcionalidad */}
        <CategoriaModal isOpen={isCategoriaModalOpen} onRequestClose={() => setIsCategoriaModalOpen(false)} />
        <MarcaModal isOpen={isMarcaModalOpen} onRequestClose={() => setIsMarcaModalOpen(false)} />
        <ModeloModal isOpen={isModeloModalOpen} onRequestClose={() => setIsModeloModalOpen(false)} />
        <UbicacionModal isOpen={isUbicacionModalOpen} onRequestClose={() => setIsUbicacionModalOpen(false)} />
        <MotivoModal isOpen={isMotivoModalOpen} onRequestClose={() => setIsMotivoModalOpen(false)} />
        <EstadoModal isOpen={isEstadoModalOpen} onRequestClose={() => setIsEstadoModalOpen(false)} />
        <ActualizarStockMinimoModal isOpen={isActualizarStockMinimoModalOpen} onRequestClose={() => setIsActualizarStockMinimoModalOpen(false)} />
        <ModificarStockModal isOpen={isModificarStockModalOpen} onRequestClose={() => setIsModificarStockModalOpen(false)} />
        <PersonalModal isOpen={isPersonalModalOpen} onRequestClose={() => setIsPersonalModalOpen(false)} />

        {/* Contenedor para notificaciones */}
        <ToastContainer />
      </main>
    </div>
  );
};

export default Administracion;
