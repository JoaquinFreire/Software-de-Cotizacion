import React from 'react';
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import { Palette, TreePine, Layers, Brush, Sticker } from 'lucide-react';

const Materiales = () => {
    const coatings = [
        {
            icon: <Palette size={32} />,
            title: "Melamina Texturada",
            description: "Ideal para muebles modernos, este revestimiento combina estética y resistencia. Su textura imita la madera real, es fácil de limpiar y tiene excelente relación precio-calidad. Perfecta para ambientes interiores elegantes y duraderos.",
            color: "#8b5cf6"
        },
        {
            icon: <TreePine size={32} />,
            title: "PVC Madera Natural",
            description: "Alternativa liviana y económica a la madera. Es resistente a la humedad, no se deforma con el tiempo y su apariencia natural aporta calidez al ambiente. Ideal para cocinas, baños o muebles que requieran bajo mantenimiento.",
            color: "#f59e0b"
        },
        {
            icon: <Layers size={32} />,
            title: "Laminado HPL Gris Grafito",
            description: "Revestimiento de alta resistencia para superficies exigentes. El color grafito aporta un diseño moderno y sobrio. Es muy duradero, antihumedad y fácil de limpiar. Perfecto para oficinas, cocinas o espacios comerciales.",
            color: "#64748b"
        },
        {
            icon: <Brush size={32} />,
            title: "Chapa Pintada Blanca",
            description: "Revestimiento metálico ideal para zonas donde se requiere alta resistencia y limpieza visual. Su terminación blanca aporta prolijidad, es lavable y muy durable. Ideal para frentes de muebles, estructuras o cerramientos.",
            color: "#f8fafc"
        },
        {
            icon: <Sticker size={32} />,
            title: "Vinilo Autoadhesivo Decorativo",
            description: "Solución práctica y rápida para renovar superficies. Se aplica fácilmente, sin herramientas especiales. Viene con diseños decorativos y se puede cambiar sin dañar el material original. Ideal para decorar sin obras.",
            color: "#ec4899"
        }
    ];

    return (
        <div className="dashboard-container">
            <Navigation />
            
            <div className="materials-header">
                <h2 className="materials-title">Revestimientos</h2>
                <p className="materials-subtitle">
                    Descubra nuestra variedad de revestimientos que combinan estética, durabilidad y funcionalidad para cada necesidad
                </p>
            </div>
            
            <div className="treatments-grid">
                {coatings.map((coating, index) => (
                    <div 
                        key={index}
                        className="treatment-card"
                        style={{ '--card-color': coating.color }}
                    >
                        <div className="card-header">
                            <div className="icon-wrapper">
                                {coating.icon}
                            </div>
                            <h3 className="card-title">{coating.title}</h3>
                        </div>
                        <div className="card-content">
                            <p className="card-description">{coating.description}</p>
                        </div>
                        <div className="card-hover-effect"></div>
                    </div>
                ))}
            </div>
            
            <Footer />
        </div>
    );
};

export default Materiales;