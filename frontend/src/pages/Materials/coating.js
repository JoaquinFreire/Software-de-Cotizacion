import React from 'react';
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";

const Materiales = () => {
  return (
    <div className="dashboard-container">
      <Navigation />
      <h2 className="title">Revestimientos</h2>
        <div className='Conteiner'>
        <div className='Descritions'>
        <h3> Melamina Texturada</h3>
        <p> 
          Ideal para muebles modernos, este revestimiento combina estética y resistencia. Su textura imita la madera real, es fácil de limpiar y tiene excelente relación precio-calidad. Perfecta para ambientes interiores elegantes y duraderos.
        </p>
        </div>
        <div className='Descritions'>
        <h3>PVC Madera Natural</h3>
        <p> 
         Alternativa liviana y económica a la madera. Es resistente a la humedad, no se deforma con el tiempo y su apariencia natural aporta calidez al ambiente. Ideal para cocinas, baños o muebles que requieran bajo mantenimiento.
        </p>
        </div>
        <div className='Descritions'>
        <h3>Laminado HPL Gris Grafito</h3>
        <p> 
        Revestimiento de alta resistencia para superficies exigentes. El color grafito aporta un diseño moderno y sobrio. Es muy duradero, antihumedad y fácil de limpiar. Perfecto para oficinas, cocinas o espacios comerciales.
        </p>
        </div>
        <div className='Descritions'>
        <h3>Chapa Pintada Blanca</h3>
        <p> 
        Revestimiento metálico ideal para zonas donde se requiere alta resistencia y limpieza visual. Su terminación blanca aporta prolijidad, es lavable y muy durable. Ideal para frentes de muebles, estructuras o cerramientos.
        </p>
        </div>
        <div className='Descritions'>
        <h3>Vinilo Autoadhesivo Decorativo</h3>
        <p> 
        Solución práctica y rápida para renovar superficies. Se aplica fácilmente, sin herramientas especiales. Viene con diseños decorativos y se puede cambiar sin dañar el material original. Ideal para decorar sin obras.
        </p>
        </div>
        </div>
      <Footer />
    </div>
  );
};

export default Materiales;
