// src/components/Dashboard/GraficaIngresos.js

import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { 
  format, 
  isWithinInterval, 
  startOfWeek, 
  addDays, 
  eachDayOfInterval 
} from 'date-fns';
import { es } from 'date-fns/locale'; // Importar la localización en español

// Registro de componentes de Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

/**
 * Filtra los movimientos para incluir solo aquellos de lunes a viernes.
 * Excluye los movimientos de tipo "Cambio de Estado".
 * @param {Array} movimientos - Lista completa de movimientos
 * @returns {Array} - Movimientos filtrados
 */
const filtrarMovimientosDiaADia = (movimientos) => {
  const diasSemana = eachDayOfInterval({
    start: startOfWeek(new Date(), { weekStartsOn: 1 }), // Lunes
    end: addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 6), // Domingo
  }).filter(date => {
    const day = date.getDay();
    return day >= 1 && day <= 5; // Lunes a Viernes
  });

  const diasLabels = diasSemana.map(date => format(date, 'EEEE dd/MM', { locale: es })); // Ejemplo: "lunes 01/04"

  const tiposMovimiento = ['Entrada', 'Salida', 'Nuevo Articulo', 'Prestamo', 'Regresado'];

  // Inicializar un objeto para almacenar los datos por tipo y por día
  const datos = {};
  tiposMovimiento.forEach(tipo => {
    datos[tipo] = diasLabels.map(() => 0); // Inicializar con 0 para cada día
  });

  movimientos.forEach(mov => {
    if (!tiposMovimiento.includes(mov.tipo_movimiento)) {
      return; // Excluir tipos no especificados
    }

    const fechaMov = new Date(mov.fecha);
    const inicioSemana = startOfWeek(fechaMov, { weekStartsOn: 1 }); // Lunes de la semana
    const diasSemanaActual = eachDayOfInterval({
      start: inicioSemana,
      end: addDays(inicioSemana, 6), // Domingo
    }).filter(date => {
      const day = date.getDay();
      return day >= 1 && day <= 5; // Lunes a Viernes
    });

    const indiceDia = diasSemanaActual.findIndex(date => 
      format(date, 'yyyy-MM-dd') === format(fechaMov, 'yyyy-MM-dd')
    );
    if (indiceDia !== -1) {
      datos[mov.tipo_movimiento][indiceDia] += mov.cantidad;
    }
  });

  // Crear datasets para Chart.js con colores específicos
  const colores = {
    'Entrada': 'rgba(75, 192, 192, 0.7)',       // Verde
    'Salida': 'rgba(255, 99, 132, 0.7)',        // Rojo
    'Nuevo Articulo': 'rgba(54, 162, 235, 0.7)', // Azul
    'Prestamo': 'rgba(153, 102, 255, 0.7)',     // Morado
    'Regresado': 'rgba(255, 159, 64, 0.7)',     // Naranja
  };

  const datasets = tiposMovimiento.map(tipo => ({
    label: tipo,
    data: datos[tipo],
    backgroundColor: colores[tipo] || 'rgba(0, 0, 0, 0.7)', // Color predeterminado si no se encuentra
  }));

  return {
    labels: diasLabels,
    datasets,
  };
};

export default function GraficaIngresos({ movimientos }) {
  const datosAgrupados = useMemo(() => filtrarMovimientosDiaADia(movimientos), [movimientos]);

  const data = {
    labels: datosAgrupados.labels,
    datasets: datosAgrupados.datasets,
  };

  const options = {
    responsive: true, // Asegura que la gráfica sea responsiva
    maintainAspectRatio: false, // Permite que la gráfica se adapte al contenedor
    plugins: {
      legend: { position: 'top' },
      title: {
        display: true,
        text: 'Movimientos Diarios (Lunes a Viernes)',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Cantidad',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Día',
        },
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md" style={{ height: '500px' }}>
      <Bar data={data} options={options} />
    </div>
  );
}
