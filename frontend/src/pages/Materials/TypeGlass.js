import React from 'react';
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";

const Materiales = () => {
  return (
    <div className="dashboard-container">
      <Navigation />
      <h2 className="title">Tipos de Vidrios</h2>
        <div className='Conteiner'>
        <div className='Descritions'>
        <h3> Vidrio Simple</h3>
        <p> 
        Es el vidrio más básico y económico. Recomendado para interiores o zonas donde no se requiera aislamiento térmico o acústico. Brinda una apariencia limpia y moderna, ideal para puertas, estanterías o vitrinas.
        </p>
        </div>
        <div className='Descritions'>
        <h3>Vidrio Laminado</h3>
        <p> 
        Compuesto por dos o más láminas unidas con una capa plástica que evita que se rompa en fragmentos peligrosos. Es una excelente opción para seguridad, aislamiento acústico y filtrado UV. Muy usado en frentes, puertas y ventanas.
        </p>
        </div>
        <div className='Descritions'>
        <h3>Vidrio Templado</h3>
        <p> 
        Hasta cinco veces más resistente que un vidrio común. En caso de rotura, se fragmenta en trozos pequeños no cortantes, lo que lo hace muy seguro. Ideal para mamparas, mesas, puertas de vidrio y zonas de alto tránsito.  </p>
        </div>
        <div className='Descritions'>
        <h3>Vidrio DVH</h3>
        <p> 
       Vidrio compuesto por dos paneles separados por una cámara de aire o gas. Brinda gran aislamiento térmico y acústico, ideal para viviendas o espacios que requieren eficiencia energética y confort.   </p>
        </div>
        <div className='Descritions'>
        <h3>Vidrio Flotado</h3>
        <p> 
        Es el vidrio base de mayor calidad, con superficie perfectamente lisa y uniforme. Sirve como materia prima para templados, laminados o espejados. También puede usarse solo en ventanas, muebles o decoración.    </p>
        </div>
        </div>
      <Footer />
    </div>
  );
};

export default Materiales;
