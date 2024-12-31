// src/pages/login.js
import { useState } from "react";
import { useUser } from "../context/UserContext"; // Asegúrate de que la ruta sea correcta
import { useRouter } from 'next/router'; // Para redirigir al dashboard
import Image from 'next/image'; // Importa el componente de Next.js

export default function Login() {
  const [username, setUsername] = useState(""); // Estado para el usuario
  const [password, setPassword] = useState(""); // Estado para la contraseña
  const [showPassword, setShowPassword] = useState(false); // Estado para mostrar/ocultar contraseña
  const [isLoading, setIsLoading] = useState(false); // Estado para indicar si está cargando

  const { login } = useUser(); // Obtiene la función login del contexto
  const router = useRouter(); // Hook de Next.js para navegación

  // Función para alternar la visibilidad de la contraseña
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Función para manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault(); // Previene el comportamiento por defecto del formulario
    setIsLoading(true); // Indica que se está procesando el login

    const result = await login(username, password); // Llama a la función login del contexto

    if (result) {
      // Si el login es exitoso, redirige al dashboard
      router.push("/dashboard");
    }
    // Si falla, las notificaciones ya se manejan en el contexto

    setIsLoading(false); // Finaliza el estado de carga
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Fondo degradado animado */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "linear-gradient(-45deg, #004E92, #397EDC, #81B3FF, #1A237E)",
          backgroundSize: "400% 400%",
          animation: "gradient-animation 15s ease infinite",
        }}
      ></div>

      {/* Opcional: Añadir un overlay sutil para mayor contraste */}
      <div
        className="absolute inset-0 z-0 bg-black opacity-20"
        style={{
          animation: "overlay-animation 20s ease infinite",
        }}
      ></div>

      <div className="flex flex-col lg:flex-row shadow-md w-full max-w-4xl z-10 relative">
        {/* Sección Formulario de Login */}
        <div className="flex flex-wrap content-center justify-center bg-white rounded-lg lg:rounded-l-lg p-6 w-full lg:w-1/2">
          <div className="w-full max-w-sm">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center lg:text-left">
              Bienvenido de vuelta
            </h1>
            <small className="text-lg text-gray-600 block text-center lg:text-left">
              Por favor, ingresa tus credenciales
            </small>

            <form className="mt-6" onSubmit={handleSubmit}>
              {/* Campo de Usuario */}
              <div className="mb-4">
                <label className="mb-2 block text-lg font-semibold">
                  Usuario
                </label>
                <input
                  type="text"
                  placeholder="Ingresa tu usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 py-2 px-3 text-lg text-gray-700"
                  required
                />
              </div>

              {/* Campo de Contraseña */}
              <div className="mb-4">
                <label className="mb-2 block text-lg font-semibold">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"} // Tipo de input según el estado
                    placeholder="******"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-md border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 py-2 px-3 text-lg text-gray-700"
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility} // Alterna la visibilidad
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-blue-500 focus:outline-none"
                    aria-label="Mostrar u ocultar contraseña"
                  >
                    {showPassword ? (
                      // Ícono de "mostrar contraseña"
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
                           viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-3.315 0-6.315-1.254-8.575-3.325A10.05 10.05 0 013.5 15m16.5-6a10.05 10.05 0 00-1.125-1.325m-3.75 7.875a2.25 2.25 0 01-3-3m-6-2.25c-.746 0-1.5.576-2.25 1.25a9.827 9.827 0 011.375-2.25M3 3l18 18" />
                      </svg>
                    ) : (
                      // Ícono de "ocultar contraseña"
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
                           viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                              d="M15 13.5a3 3 0 11-6 0 3 3 0 016 0zm9-2.25c0 1.5-3 6.75-9 6.75s-9-5.25-9-6.75 3-6.75 9-6.75 9 5.25 9 6.75z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Botón de Envío */}
              <div className="mb-4">
                <button
                  type="submit"
                  className="mb-1.5 block w-full text-center text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-lg font-semibold transform transition-all duration-300 hover:scale-105"
                  disabled={isLoading} 
                >
                  {isLoading ? "Cargando..." : "Iniciar sesión"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sección Banner lateral (imagen) */}
        <div className="hidden lg:flex flex-wrap content-center justify-center rounded-r-lg w-1/2 relative">
          <div className="w-full h-full relative overflow-hidden">
            <Image
              className="rounded-r-lg object-cover"
              src="/logo.jpg" // Asegúrate de que la imagen esté en la carpeta public/
              alt="Bodega"
              layout="fill"
              priority
            />
          </div>
        </div>
      </div>

      {/* Estilos de animación personalizados */}
      <style jsx>{`
        @keyframes gradient-animation {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        @keyframes overlay-animation {
          0% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.25;
          }
          100% {
            opacity: 0.2;
          }
        }
      `}</style>
    </div>
  );
}
