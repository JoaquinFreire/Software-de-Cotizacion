import React from 'react';
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";

const Aberturas = () => {
  return (
    <div className="dashboard-container">
      <Navigation />
      <h2 className="title">Tipos de Lineas</h2>

      <div className='Conteiner'>

        <div className='Descritions'>
          <h3>Linea Tecno 1</h3>
          <ul>
            <li>Compacta y hermética</li>
            <li>Gran variedad de sistemas de apertura</li>
            <li>Ensambles de marco y hojas a 45°</li>
            <li>Corredizas con cierres laterales</li>
            <li>Ventanas de abrir con doble contacto en burletes de EPDM</li>
            <li>Uniformidad visual en todas las combinaciones</li>
          </ul>
        </div>

        <div className='Descritions'>
          <h3>Linea Tecno 2</h3>
          <ul>
            <li>Simple y sobria</li>
            <li>Puertas y ventanas corredizas, puertas de abrir y paños fijos</li>
            <li>Ensambles de marcos a 45° y hojas a 45/90° (opcional)</li>
            <li>Cierre central o lateral (opcional)</li>
            <li>Excelente relación precio – producto</li>
          </ul>
        </div>

        <div className='Descritions'>
          <h3>Linea Tecno 3</h3>
          <ul>
            <li>Alta prestación</li>
            <li>Hermeticidad con burletes de triple contacto</li>
            <li>Variedad completa de sistemas de apertura</li>
            <li>Tapajuntas rectos o curvos (opcional)</li>
            <li>Ensambles de marco y hojas a 45°</li>
            <li>Corredizas con cierres laterales multipunto</li>
            <li>Herrajes y accesorios de diseño exclusivo</li>
            <li>Posibilidad de cerraduras electrónicas</li>
            <li>Sistema oscilobatiente con bisagra oculta</li>
            <li>Vidrios simples (VS) o doble vidriado hermético (DVH)</li>
            <li>Mosquiteros reforzados con felpas y ruedas regulables</li>
          </ul>
        </div>

        <div className='Descritions'>
          <h3>Linea Tecno 4</h3>
          <ul>
            <li>Alta prestación para grandes luces</li>
            <li>Resistencia a grandes presiones de viento</li>
            <li>Hermeticidad con burletes de triple contacto</li>
            <li>Tapajuntas rectos o curvos</li>
            <li>Ensambles de marco y hojas a 45°</li>
            <li>Posibilidad de acople ilimitado de hojas</li>
            <li>Cierres laterales multipunto de acero inoxidable</li>
            <li>Ruedas que soportan hasta 350 kg</li>
            <li>Cerraduras electrónicas opcionales</li>
            <li>Puertas de abrir reforzadas para grandes luces</li>
            <li>Oscilobatiente con bisagra oculta</li>
            <li>Vidrios simples (VS) o DVH</li>
            <li>Mosquiteros reforzados con felpas y escuadras de tracción</li>
          </ul>
        </div>
      </div>

      <div className='Conteiner'>
        <div className='Descritions'>
          <h3>Linea Tecno 4 RPT</h3>
          <ul>
            <li>Sistema de Ruptura de Puente Térmico</li>
            <li>Mayor control térmico, acústico y ahorro energético</li>
            <li>Alta prestación para grandes luces</li>
            <li>Hermeticidad con burletes de triple contacto</li>
            <li>Ensambles de marco y hojas a 45°</li>
            <li>Acople ilimitado de hojas corredizas</li>
            <li>Cierres multipunto de acero inoxidable</li>
            <li>Ruedas que soportan hasta 350 kg</li>
            <li>Cerraduras electrónicas opcionales</li>
            <li>Puertas reforzadas para grandes luces</li>
            <li>Oscilobatiente con bisagra oculta</li>
            <li>Vidrios simples (VS) o DVH</li>
            <li>Mosquiteros reforzados con felpas y escuadras de tracción</li>
          </ul>
        </div>

        <div className='Descritions'>
          <h3>Linea Tecno 5</h3>
          <ul>
            <li>Prestación alta</li>
            <li>Especial para grandes luces</li>
            <li>Suave y liviano desplazamiento</li>
            <li>Ensambles a 90°</li>
            <li>Cerrojos laterales de tres niveles de seguridad</li>
            <li>Sistema de guías embutidas colgantes</li>
            <li>Resistencia a grandes presiones de viento</li>
          </ul>
        </div>

        <div className='Descritions'>
          <h3>Linea Tecno 6</h3>
          <ul>
            <li>Sistema corredizo con hoja oculta para vidrio de 10mm</li>
            <li>Visión panorámica sin interrupciones</li>
            <li>Deslizamientos y hermetización ocultos</li>
            <li>Resistencia a altas presiones de viento</li>
            <li>Posibilidad de acople ilimitado de hojas</li>
            <li>Deslizamiento suave y liviano</li>
          </ul>
        </div>

        <div className='Descritions'>
          <h3>Linea Tecno 7</h3>
          <ul>
            <li>Sistema corredizo con hoja oculta para DVH</li>
            <li>Paisajes sin interrupciones</li>
            <li>Hermetización totalmente oculta</li>
            <li>Corrediza reforzada para grandes luces</li>
            <li>Resistencia a altas presiones de viento</li>
            <li>Caja de agua con salida a pluviales</li>
            <li>Posibilidad de acople ilimitado de hojas</li>
            <li>Micro accesorios de acero inoxidable</li>
          </ul>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Aberturas;
