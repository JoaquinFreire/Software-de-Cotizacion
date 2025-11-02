import React from 'react';
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import { Settings, Zap, Shield, Thermometer, Star, Award, Crown } from 'lucide-react';
import { useNavigate } from "react-router-dom";

const Aberturas = () => {

    const navigate = useNavigate();
        
            const handleLogout = () => {
                localStorage.removeItem("token");
                navigate("/");
            }

    const lines = [
        {
            icon: <Settings size={32} />,
            title: "Línea Tecno 1",
            features: [
                "Compacta y hermética",
                "Gran variedad de sistemas de apertura",
                "Ensambles de marco y hojas a 45°",
                "Corredizas con cierres laterales",
                "Ventanas de abrir con doble contacto en burletes de EPDM",
                "Uniformidad visual en todas las combinaciones"
            ],
            color: "#06b6d4"
        },
        {
            icon: <Zap size={32} />,
            title: "Línea Tecno 2",
            features: [
                "Simple y sobria",
                "Puertas y ventanas corredizas, puertas de abrir y paños fijos",
                "Ensambles de marcos a 45° y hojas a 45/90° (opcional)",
                "Cierre central o lateral (opcional)",
                "Excelente relación precio – producto"
            ],
            color: "#8b5cf6"
        },
        {
            icon: <Shield size={32} />,
            title: "Línea Tecno 3",
            features: [
                "Alta prestación",
                "Hermeticidad con burletes de triple contacto",
                "Variedad completa de sistemas de apertura",
                "Tapajuntas rectos o curvos (opcional)",
                "Ensambles de marco y hojas a 45°",
                "Corredizas con cierres laterales multipunto",
                "Herrajes y accesorios de diseño exclusivo",
                "Posibilidad de cerraduras electrónicas",
                "Sistema oscilobatiente con bisagra oculta",
                "Vidrios simples (VS) o doble vidriado hermético (DVH)",
                "Mosquiteros reforzados con felpas y ruedas regulables"
            ],
            color: "#10b981"
        },
        {
            icon: <Award size={32} />,
            title: "Línea Tecno 4",
            features: [
                "Alta prestación para grandes luces",
                "Resistencia a grandes presiones de viento",
                "Hermeticidad con burletes de triple contacto",
                "Tapajuntas rectos o curvos",
                "Ensambles de marco y hojas a 45°",
                "Posibilidad de acople ilimitado de hojas",
                "Cierres laterales multipunto de acero inoxidable",
                "Ruedas que soportan hasta 350 kg",
                "Cerraduras electrónicas opcionales",
                "Puertas de abrir reforzadas para grandes luces",
                "Oscilobatiente con bisagra oculta",
                "Vidrios simples (VS) o DVH",
                "Mosquiteros reforzados con felpas y escuadras de tracción"
            ],
            color: "#f59e0b"
        },
        {
            icon: <Thermometer size={32} />,
            title: "Línea Tecno 4 RPT",
            features: [
                "Sistema de Ruptura de Puente Térmico",
                "Mayor control térmico, acústico y ahorro energético",
                "Alta prestación para grandes luces",
                "Hermeticidad con burletes de triple contacto",
                "Ensambles de marco y hojas a 45°",
                "Acople ilimitado de hojas corredizas",
                "Cierres multipunto de acero inoxidable",
                "Ruedas que soportan hasta 350 kg",
                "Cerraduras electrónicas opcionales",
                "Puertas reforzadas para grandes luces",
                "Oscilobatiente con bisagra oculta",
                "Vidrios simples (VS) o DVH",
                "Mosquiteros reforzados con felpas y escuadras de tracción"
            ],
            color: "#3b82f6"
        },
        {
            icon: <Star size={32} />,
            title: "Línea Tecno 5",
            features: [
                "Prestación alta",
                "Especial para grandes luces",
                "Suave y liviano desplazamiento",
                "Ensambles a 90°",
                "Cerrojos laterales de tres niveles de seguridad",
                "Sistema de guías embutidas colgantes",
                "Resistencia a grandes presiones de viento"
            ],
            color: "#ec4899"
        },
        {
            icon: <Crown size={32} />,
            title: "Línea Tecno 6",
            features: [
                "Sistema corredizo con hoja oculta para vidrio de 10mm",
                "Visión panorámica sin interrupciones",
                "Deslizamientos y hermetización ocultos",
                "Resistencia a altas presiones de viento",
                "Posibilidad de acople ilimitado de hojas",
                "Deslizamiento suave y liviano"
            ],
            color: "#8b5cf6"
        },
        {
            icon: <Award size={32} />,
            title: "Línea Tecno 7",
            features: [
                "Sistema corredizo con hoja oculta para DVH",
                "Paisajes sin interrupciones",
                "Hermetización totalmente oculta",
                "Corrediza reforzada para grandes luces",
                "Resistencia a altas presiones de viento",
                "Caja de agua con salida a pluviales",
                "Posibilidad de acople ilimitado de hojas",
                "Micro accesorios de acero inoxidable"
            ],
            color: "#f59e0b"
        }
    ];

    return (
        <div className="dashboard-container">
            <Navigation onLogout={handleLogout} />
            
            <div className="materials-header">
                <h2 className="materials-title">Tipos de Líneas</h2>
                <p className="materials-subtitle">
                    Explore nuestra completa gama de líneas de aberturas, cada una diseñada para necesidades específicas de prestación, diseño y funcionalidad
                </p>
            </div>
            
            <div className="treatments-grid">
                {lines.map((line, index) => (
                    <div 
                        key={index}
                        className="treatment-card"
                        style={{ '--card-color': line.color }}
                    >
                        <div className="card-header">
                            <div className="icon-wrapper">
                                {line.icon}
                            </div>
                            <h3 className="card-title">{line.title}</h3>
                        </div>
                        <div className="card-content">
                            <ul className="features-list">
                                {line.features.map((feature, featureIndex) => (
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