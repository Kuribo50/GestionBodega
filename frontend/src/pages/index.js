import { useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../context/AuthContext'; // Asegúrate de que la ruta sea correcta
import { FaSpinner } from 'react-icons/fa';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, loading } = useContext(AuthContext);

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="flex flex-col items-center">
          <FaSpinner className="animate-spin text-blue-500 text-4xl mb-4" />
          <div className="text-xl text-gray-700">Verificando autenticación...</div>
        </div>
      </div>
    );
  }

  return null;
}
