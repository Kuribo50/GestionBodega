// helpers/swal.js
import Swal from "sweetalert2";

// Función para mostrar alertas simples con un botón de confirmación estilizado
export const showAlert = (icon, title, text) => {
  let buttonColor = "bg-blue-600 hover:bg-blue-700"; // Default: blue

  if (icon === "error") {
    buttonColor = "bg-red-600 hover:bg-red-700";
  } else if (icon === "warning") {
    buttonColor = "bg-yellow-500 hover:bg-yellow-600";
  } else if (icon === "info") {
    buttonColor = "bg-blue-600 hover:bg-blue-700";
  } else if (icon === "success") {
    buttonColor = "bg-green-600 hover:bg-green-700";
  }

  Swal.fire({
    icon,
    title,
    text,
    position: "center",
    buttonsStyling: false, // Desactiva los estilos predeterminados
    customClass: {
      confirmButton: `${buttonColor} text-white font-bold py-2 px-4 rounded`,
    },
  });
};

// Función para mostrar confirmaciones con botones de confirmación y cancelación estilizados
export const showConfirmation = (title, text) => {
  return Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, cancelar",
    cancelButtonText: "No, continuar",
    buttonsStyling: false, // Desactiva los estilos predeterminados
    customClass: {
      confirmButton: "bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded",
      cancelButton: "bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded",
    },
    position: "center",
  });
};
