import React from 'react';
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";

const Aberturas = () => {
  return (
    <div className="dashboard-container">
      <Navigation />
      <h2 className="title">Tipos de Accesorios</h2>
        <div className='Conteiner'>
        <div className='Descritions'>
        <h3> En Proceso </h3>
        <p> 
          En Proceso
        </p>
        </div>
        </div>
      <Footer />
    </div>
  );
};

export default Aberturas;
