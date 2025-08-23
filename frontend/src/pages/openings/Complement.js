import React from 'react';
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";

const Aberturas = () => {
  return (
    <div className="dashboard-container">
      <Navigation />
      <h2 className="title">Tipos de Complementos</h2>

      <div className="Conteiner">
        <div className="Descritions">
          <h3>Puerta de Ingreso</h3>
          <ul>
            <li>Estructura portante de hierro con amplia gama de revestimientos</li>
            <li>Bisagras reforzadas para hojas de hasta 120 kg</li>
            <li>Sistema de cierre multipunto</li>
            <li>Posibilidad de cerraduras digitales con código y huella digital</li>
            <li>Alta hermeticidad mediante burletes de doble contacto en EPDM y felpas interiores</li>
          </ul>
        </div>

        <div className="Descritions">
          <h3>Tabique Tecno</h3>
          <ul>
            <li>Compatible con vidrio simple o doble de 6–10 mm</li>
            <li>Admite otro tipo de panelería</li>
            <li>Sistema de burlería interna</li>
            <li>Tornillería escondida en el armado y fijación</li>
            <li>Opción de piso a techo o media altura con cantos rectos</li>
            <li>Posibilidad de usar dos colores (interno y externo)</li>
            <li>Admite cortinillas entre vidrios</li>
            <li>Opciones estéticas rectas y curvas</li>
            <li>Fácil colocación y montaje</li>
          </ul>
        </div>

        <div className="Descritions">
          <h3>Baranda Imperia</h3>
          <ul>
            <li>Vidrio empotrado sin parantes verticales ni pasamanos</li>
            <li>Visión limpia y sin obstáculos</li>
            <li>Posibilidad de colocación en frente de losa</li>
          </ul>
        </div>

        <div className="Descritions">
          <h3>Baranda City</h3>
          <ul>
            <li>Perfilería de aluminio a la vista</li>
            <li>Variedad de diseños de pasamanos</li>
            <li>Posibilidad de refuerzos interiores para mayor resistencia en barandas altas y vientos fuertes</li>
            <li>Posibilidad de colocación en frente de losa</li>
          </ul>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Aberturas;
