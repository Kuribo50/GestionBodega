import { useState } from 'react';

const initialFormData = {
  nombre: "",
  categoria: "",
  cantidad: "",
  modelo: "",
  marca: "",
  numero_serie: "",
  codigo_minvu: "",
  codigo_interno: "",
  mac: "",
  descripcion: "",
  ubicacion: "",
  tipo_movimiento: "Ingreso",
};

export const useFormData = () => {
  const [formData, setFormData] = useState(initialFormData);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (field, selectedOption) => {
    setFormData({
      ...formData,
      [field]: selectedOption ? selectedOption.value : "",
    });
  };

  const resetForm = () => {
    setFormData(initialFormData);
  };

  return {
    formData,
    handleChange,
    handleSelectChange,
    resetForm,
  };
};