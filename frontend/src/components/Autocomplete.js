// src/components/Autocomplete.js

import React, { useState, useRef, useEffect } from 'react';

const Autocomplete = ({ options, selected, onSelect, label }) => {
  const [inputValue, setInputValue] = useState('');
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [showOptions, setShowOptions] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    // Filtrar opciones basadas en el input del usuario
    const filtered = options.filter(option =>
      option.nombre.toLowerCase().includes(inputValue.toLowerCase())
    );
    setFilteredOptions(filtered);
  }, [inputValue, options]);

  useEffect(() => {
    // Manejar clics fuera del componente para cerrar las sugerencias
    const handleClickOutside = event => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Reset inputValue cuando 'selected' cambia a vacío
    if (!selected) {
      setInputValue('');
    } else {
      // Si 'selected' tiene un valor, actualizar inputValue con el nombre correspondiente
      const selectedOption = options.find(option => option.id === selected);
      if (selectedOption) {
        setInputValue(selectedOption.nombre);
      }
    }
  }, [selected, options]);

  const handleChange = (e) => {
    setInputValue(e.target.value);
    setShowOptions(true);
    if (e.target.value === '') {
      onSelect(''); // Resetear la selección si el usuario borra el input
    }
  };

  const handleOptionClick = (option) => {
    setInputValue(option.nombre);
    setShowOptions(false);
    onSelect(option.id);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        onFocus={() => setShowOptions(true)}
        placeholder={`Selecciona una ${label.toLowerCase()}`}
        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 text-black"
      />
      {showOptions && filteredOptions.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md max-h-60 overflow-y-auto mt-1">
          {filteredOptions.map(option => (
            <li
              key={option.id}
              onClick={() => handleOptionClick(option)}
              className="cursor-pointer p-2 hover:bg-gray-100"
            >
              {option.nombre}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Autocomplete;
