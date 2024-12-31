// pages/_app.js
import '../styles/globals.css';
import { Chart as ChartJS, registerables } from 'chart.js';
import { NextUIProvider } from '@nextui-org/react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { UserProvider } from '@/context/UserContext'; // Importar el UserProvider

// Registrar los elementos de Chart.js globalmente
ChartJS.register(...registerables);

function MyApp({ Component, pageProps }) {
  return (
    <NextUIProvider>
      <UserProvider> {/* Envolvemos toda la aplicación con UserProvider */}
        <Component {...pageProps} />
      </UserProvider>
      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </NextUIProvider>
  );
}

export default MyApp;
