import React from 'react';
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";

const Materiales = () => {
  return (
    <div className="dashboard-container">
      <Navigation />
      <h2 className="title">Tratamiento de Aluminio</h2>
        <div className='Conteiner'>
        <div className='Descritions'>
        <h3> Electroquímico</h3>
        <p> 
         Tratamiento que mejora la resistencia del aluminio mediante procesos eléctricos y químicos. Brinda mayor durabilidad, protección contra la corrosión y una mejor adhesión para recubrimientos. Ideal para perfiles expuestos al clima.
        </p>
        </div>
        <div className='Descritions'>
        <h3>Anodizado bronce</h3>
        <p> 
        Tratamiento decorativo y protector que le da al aluminio un acabado en tono bronce. Aumenta su resistencia al desgaste y la corrosión. Muy elegido por su estética elegante y sobria para aberturas y frentes.    </p>
        </div>
        <div className='Descritions'>
        <h3>Anodizado negro</h3>
        <p> 
        Brinda al aluminio un acabado negro uniforme, elegante y moderno. Además de su estética, ofrece gran resistencia al paso del tiempo, a rayaduras y agentes climáticos. Ideal para fachadas, marcos y detalles sofisticados.  </p>
        </div>
        <div className='Descritions'>
        <h3>Lacado PVDF </h3>
        <p> 
        Recubrimiento con pintura de alta tecnología (fluoropolímero) que brinda excelente resistencia al sol, lluvia, humedad y contaminación. No se decolora con el tiempo. Muy usado en zonas costeras o industriales.  </p>
        </div>
        <div className='Descritions'>
        <h3>Anticorrosivo marino</h3>
        <p> 
        Tratamiento especialmente formulado para proteger el aluminio en ambientes altamente corrosivos, como zonas marítimas. Prolonga la vida útil del producto incluso frente a la salinidad y humedad constante.   </p>
        </div>
        <div className='Descritions'>
        <h3>Cepillado</h3>
        <p> 
        Acabado mecánico que genera una textura lineal sobre la superficie del aluminio, dándole un aspecto moderno y elegante. Muy utilizado en aplicaciones decorativas como manijas, frentes o accesorios.  </p>
        </div>
        </div>
      <Footer />
    </div>
  );
};

export default Materiales;
