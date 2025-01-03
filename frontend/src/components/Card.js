// src/components/Card.js

import React from 'react';

const Card = ({ title, description, icon: Icon, color, onClick }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-6 flex flex-col items-center text-center border hover:shadow-xl transition-shadow">
      <div className={`text-4xl mb-4 ${color}`}>
        <Icon />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <button
        onClick={onClick}
        className="mt-auto bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors flex items-center space-x-2"
      >
        Abrir
      </button>
    </div>
  );
};

export default Card;
