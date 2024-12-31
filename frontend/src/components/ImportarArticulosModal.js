import React, { useState } from 'react';
import Modal from 'react-modal';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import { saveAs } from 'file-saver';
import axios from 'axios';

// Asegúrate de configurar Modal
Modal.setAppElement('#root');

const ImportarArticulosModal = ({ isOpen, onClose }) => {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Opciones para react-dropzone
  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'text/csv': ['.csv'] },
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
        toast.success('Archivo cargado correctamente.');
      }
    },
  });

  // Descargar plantilla
  const handleDownloadTemplate = () => {
    const templateData = [
      ['nombre', 'cantidad', 'categoria', 'ubicacion', 'marca', 'modelo', 'estado', 'numero_serie', 'mac', 'codigo_interno', 'codigo_minvu', 'descripcion', 'stock_minimo'],
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, 'Plantilla_Articulos.xlsx');
  };

  // Procesar importación
  const handleImport = async () => {
    if (!file) {
      toast.error('Por favor, selecciona un archivo para importar.');
      return;
    }

    setIsProcessing(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/api/articulos/importar/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
        },
      });

      if (response.status === 200) {
        toast.success('Importación completada correctamente.');
        setFile(null);
        setProgress(0);
        onClose();
      } else {
        toast.error('Error durante la importación.');
      }
    } catch (error) {
      console.error('Error en la importación:', error);
      toast.error('Error al procesar la importación.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="fixed inset-0 flex items-center justify-center p-4 bg-gray-800 bg-opacity-75"
    >
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Importar Artículos</h2>

        {/* Paso a Paso */}
        <div className="mb-4">
          <p className="text-gray-700 mb-2">Sigue estos pasos para importar correctamente:</p>
          <ol className="list-decimal ml-6 text-gray-600 space-y-1">
            <li>Descarga la plantilla de importación.</li>
            <li>Llena la plantilla con los datos requeridos.</li>
            <li>Guarda el archivo como .xlsx o .csv.</li>
            <li>Arrastra el archivo aquí o haz clic para seleccionarlo.</li>
            <li>Presiona &quot;Procesar Importación&quot;.</li>
            </ol>
          <button
            onClick={handleDownloadTemplate}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Descargar Plantilla
          </button>
        </div>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className="border-2 border-dashed border-gray-400 rounded-lg p-6 text-center cursor-pointer bg-gray-50"
        >
          <input {...getInputProps()} />
          {file ? (
            <p className="text-green-600">{file.name}</p>
          ) : (
            <p className="text-gray-600">Arrastra aquí tu archivo o haz clic para seleccionarlo.</p>
          )}
        </div>

        {/* Barra de Progreso */}
        {isProcessing && (
          <div className="mt-4">
            <div className="relative w-full bg-gray-200 rounded">
              <div
                className="absolute top-0 left-0 h-2 bg-blue-500 rounded"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-2">Procesando: {progress}%</p>
          </div>
        )}

        {/* Botones */}
        <div className="mt-6 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
            disabled={isProcessing}
          >
            Cancelar
          </button>
          <button
            onClick={handleImport}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            disabled={isProcessing}
          >
            Procesar Importación
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ImportarArticulosModal;
