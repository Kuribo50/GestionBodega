// src/components/Notificaciones.js
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { fetchNotificaciones } from "../services/api"; // Ajusta la ruta según tu estructura

const Notificaciones = () => {
    const [notificaciones, setNotificaciones] = useState([]);

    // Función para obtener notificaciones del backend usando api.js
    const getNotificaciones = async () => {
        try {
            const data = await fetchNotificaciones();
            setNotificaciones(data);

            // Mostrar notificaciones
            data.forEach(notif => {
                toast(notif.mensaje, {
                    type: 'info',
                    autoClose: 5000,
                    position: toast.POSITION.TOP_RIGHT,
                });
            });
        } catch (error) {
            console.error('Error al obtener notificaciones:', error);
            // La notificación de error ya está manejada en fetchNotificaciones
        }
    };

    useEffect(() => {
        getNotificaciones();
    }, []);  // Solo se ejecuta al cargar el componente

    return (
        <div>
            <h3>Notificaciones</h3>
            <ul>
                {notificaciones.map(notif => (
                    <li key={notif.id}>
                        <p>{notif.mensaje}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Notificaciones;
