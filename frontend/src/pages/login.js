// src/pages/login.js

import { useState } from "react";
import { useUser } from "../context/UserContext";
import { useRouter } from "next/router";
import Image from "next/image";
import { FaEye, FaEyeSlash, FaLock, FaUserAlt } from "react-icons/fa";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useUser();
  const router = useRouter();

  // Alternar visibilidad de la contraseña
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await login(username, password);
    if (result) {
      router.push("/dashboard");
    }
    setIsLoading(false);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Fondo degradado animado */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "linear-gradient(-45deg, #001f4c, #1c449c, #3c6fe5, #0a1852)",
          backgroundSize: "400% 400%",
          animation: "gradient-animation 15s ease infinite",
        }}
      ></div>

      {/* Overlay para mayor contraste */}
      <div
        className="absolute inset-0 z-0 bg-black opacity-25"
        style={{
          animation: "overlay-animation 20s ease infinite",
        }}
      ></div>

      {/* Contenedor principal con sombra y bordes redondeados */}
      <div className="relative z-10 w-full max-w-5xl rounded-lg shadow-xl border border-gray-200 overflow-hidden flex flex-col lg:flex-row">
        {/* Sección Formulario de Login */}
        <div className="bg-white w-full lg:w-1/2 p-6 flex flex-col justify-center">
          <div className="max-w-sm mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center lg:text-left">
              Bienvenido de Vuelta
            </h1>
            <p className="text-lg text-gray-600 mb-6 text-center lg:text-left">
              Ingresa tus credenciales para continuar
            </p>

            <form onSubmit={handleSubmit}>
              {/* Campo de Usuario */}
              <div className="mb-4">
                <label
                  htmlFor="username"
                  className="mb-2 block text-lg font-semibold text-gray-700 flex items-center"
                >
                  <FaUserAlt className="mr-2 text-blue-500" />
                  Usuario
                </label>
                <input
                  id="username"
                  type="text"
                  placeholder="Ingresa tu usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 py-2 px-3 text-lg text-gray-700 placeholder-gray-400 transition-colors"
                  required
                />
              </div>

              {/* Campo de Contraseña */}
              <div className="mb-6">
                <label
                  htmlFor="password"
                  className="mb-2 block text-lg font-semibold text-gray-700 flex items-center"
                >
                  <FaLock className="mr-2 text-blue-500" />
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="******"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 py-2 px-3 text-lg text-gray-700 placeholder-gray-400 transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-blue-500 focus:outline-none"
                    aria-label={
                      showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                  >
                    {showPassword ? (
                      <FaEyeSlash className="h-5 w-5" />
                    ) : (
                      <FaEye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Botón de Iniciar Sesión */}
              <button
                type="submit"
                className={`block w-full text-center text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-lg font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={isLoading}
              >
                {isLoading ? "Cargando..." : "Iniciar sesión"}
              </button>
            </form>
          </div>
        </div>

        {/* Sección Banner lateral (imagen ocupa todo el espacio disponible) */}
        <div className="hidden lg:block w-full lg:w-1/2 relative">
          <Image
            className="object-cover h-full w-full"
            src="/logo.jpg" // Asegúrate de que esta imagen esté en /public con el nombre exacto
            alt="Imagen de Bodega"
            layout="responsive" // Ocupa todo el contenedor
            width={500} // Ancho de la imagen
            height={500} // Alto de la imagen
            priority
          />
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
            opacity: 0.25;
          }
          50% {
            opacity: 0.3;
          }
          100% {
            opacity: 0.25;
          }
        }

        /* Estilos personalizados para la scrollbar */
        /* Asegúrate de tener instalado el plugin de scrollbar de Tailwind CSS si deseas usar estas clases */
        /* Si no lo tienes, puedes instalarlo siguiendo las instrucciones en: https://github.com/AnandChowdhary/tailwind-scrollbar */

        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }

        .scrollbar-thumb-gray-300::-webkit-scrollbar-thumb {
          background-color: #d1d5db; /* gray-300 */
          border-radius: 9999px;
        }

        .scrollbar-track-gray-100::-webkit-scrollbar-track {
          background-color: #f3f4f6; /* gray-100 */
        }

        /* Firefox */
        .scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: #d1d5db #f3f4f6;
        }
      `}</style>
    </div>
  );
}
