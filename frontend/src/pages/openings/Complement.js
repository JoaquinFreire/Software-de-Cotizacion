import React from 'react';
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import { DoorOpen, Grid3X3, Ruler, Building } from 'lucide-react';
import { useNavigate } from "react-router-dom";


const Aberturas = () => {
    const navigate = useNavigate();
        
            const handleLogout = () => {
                localStorage.removeItem("token");
                navigate("/");
            };
    
    const complements = [
        {
            icon: <DoorOpen size={32} />,
            title: "Puerta de Ingreso",
            features: [
                "Estructura portante de hierro con amplia gama de revestimientos",
                "Bisagras reforzadas para hojas de hasta 120 kg",
                "Sistema de cierre multipunto",
                "Posibilidad de cerraduras digitales con código y huella digital",
                "Alta hermeticidad mediante burletes de doble contacto en EPDM y felpas interiores"
            ],
            color: "#ef4444"
        },
        {
            icon: <Grid3X3 size={32} />,
            title: "Tabique Tecno",
            features: [
                "Compatible con vidrio simple o doble de 6–10 mm",
                "Admite otro tipo de panelería",
                "Sistema de burlería interna",
                "Tornillería escondida en el armado y fijación",
                "Opción de piso a techo o media altura con cantos rectos",
                "Posibilidad de usar dos colores (interno y externo)",
                "Admite cortinillas entre vidrios",
                "Opciones estéticas rectas y curvas",
                "Fácil colocación y montaje"
            ],
            color: "#3b82f6"
        },
        {
            icon: <Ruler size={32} />,
            title: "Baranda Imperia",
            features: [
                "Vidrio empotrado sin parantes verticales ni pasamanos",
                "Visión limpia y sin obstáculos",
                "Posibilidad de colocación en frente de losa"
            ],
            color: "#10b981"
        },
        {
            icon: <Building size={32} />,
            title: "Baranda City",
            features: [
                "Perfilería de aluminio a la vista",
                "Variedad de diseños de pasamanos",
                "Posibilidad de refuerzos interiores para mayor resistencia en barandas altas y vientos fuertes",
                "Posibilidad de colocación en frente de losa"
            ],
            color: "#f59e0b"
        }
    ];

    return (
        <div className="dashboard-container">
            <Navigation onLogout={handleLogout} />
            
            <div className="materials-header">
                <h2 className="materials-title">Tipos de Complementos</h2>
                <p className="materials-subtitle">
                    Descubra nuestra gama de complementos especializados que mejoran la funcionalidad y seguridad de sus aberturas
                </p>
            </div>
            
            <div className="treatments-grid">
                {complements.map((complement, index) => (
                    <div 
                        key={index}
                        className="treatment-card"
                        style={{ '--card-color': complement.color }}
                    >
                        <div className="card-header">
                            <div className="icon-wrapper">
                                {complement.icon}
                            </div>
                            <h3 className="card-title">{complement.title}</h3>
                        </div>
                        <div className="card-content">
                            <ul className="features-list">
                                {complement.features.map((feature, featureIndex) => (
                                    <li key={featureIndex} className="feature-item">
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="card-hover-effect"></div>
                    </div>
                ))}
            </div>
            
            <Footer />
        </div>
    );
};

export default Aberturas;