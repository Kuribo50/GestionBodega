import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirige al Dashboard
    router.replace('/dashboard');
  }, [router]);

  return null; // Puedes mostrar un spinner o mensaje de "Loading" aquí si lo deseas
}
