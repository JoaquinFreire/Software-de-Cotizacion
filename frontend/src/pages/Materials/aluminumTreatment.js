import React from 'react';
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import { Shield, Zap, Palette, Droplets, Waves, Brush } from 'lucide-react';

const Materiales = () => {
    const treatments = [
        {
            icon: <Zap size={32} />,
            title: "Electroquímico",
            description: "Tratamiento que mejora la resistencia del aluminio mediante procesos eléctricos y químicos. Brinda mayor durabilidad, protección contra la corrosión y una mejor adhesión para recubrimientos. Ideal para perfiles expuestos al clima.",
            color: "#3b82f6"
        },
        {
            icon: <Palette size={32} />,
            title: "Anodizado Bronce",
            description: "Tratamiento decorativo y protector que le da al aluminio un acabado en tono bronce. Aumenta su resistencia al desgaste y la corrosión. Muy elegido por su estética elegante y sobria para aberturas y frentes.",
            color: "#f59e0b"
        },
        {
            icon: <Shield size={32} />,
            title: "Anodizado Negro",
            description: "Brinda al aluminio un acabado negro uniforme, elegante y moderno. Además de su estética, ofrece gran resistencia al paso del tiempo, a rayaduras y agentes climáticos. Ideal para fachadas, marcos y detalles sofisticados.",
            color: "#1f2937"
        },
        {
            icon: <Droplets size={32} />,
            title: "Lacado PVDF",
            description: "Recubrimiento con pintura de alta tecnología (fluoropolímero) que brinda excelente resistencia al sol, lluvia, humedad y contaminación. No se decolora con el tiempo. Muy usado en zonas costeras o industriales.",
            color: "#06b6d4"
        },
        {
            icon: <Waves size={32} />,
            title: "Anticorrosivo Marino",
            description: "Tratamiento especialmente formulado para proteger el aluminio en ambientes altamente corrosivos, como zonas marítimas. Prolonga la vida útil del producto incluso frente a la salinidad y humedad constante.",
            color: "#0ea5e9"
        },
        {
            icon: <Brush size={32} />,
            title: "Cepillado",
            description: "Acabado mecánico que genera una textura lineal sobre la superficie del aluminio, dándole un aspecto moderno y elegante. Muy utilizado en aplicaciones decorativas como manijas, frentes o accesorios.",
            color: "#8b5cf6"
        }
    ];

    return (
        <div className="dashboard-container">
            <Navigation />
            
            <div className="materials-header">
                <h2 className="materials-title">Tratamiento de Aluminio</h2>
                <p className="materials-subtitle">
                    Descubra los diferentes procesos de tratamiento que mejoran la durabilidad, estética y resistencia del aluminio
                </p>
            </div>
            
            <div className="treatments-grid">
                {treatments.map((treatment, index) => (
                    <div 
                        key={index}
                        className="treatment-card"
                        style={{ '--card-color': treatment.color }}
                    >
                        <div className="card-header">
                            <div className="icon-wrapper">
                                {treatment.icon}
                            </div>
                            <h3 className="card-title">{treatment.title}</h3>
                        </div>
                        <div className="card-content">
                            <p className="card-description">{treatment.description}</p>
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