import React from 'react';
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import { Key, DoorClosed, Eye, Lock, Anchor, RotateCcw } from 'lucide-react';

const Aberturas = () => {
    const accessories = [
        {
            icon: <Key size={32} />,
            title: "Cerradura Electrónica",
            description: "Acceso seguro mediante código, tarjeta o huella digital. Sistema de alta seguridad con múltiples opciones de autenticación.",
            color: "#ef4444"
        },
        {
            icon: <DoorClosed size={32} />,
            title: "Bisagras",
            description: "Permiten la apertura y cierre suave de las hojas, con versiones reforzadas para puertas de gran peso y tamaño.",
            color: "#3b82f6"
        },
        {
            icon: <Eye size={32} />,
            title: "Mirillas",
            description: "Visión clara del exterior sin necesidad de abrir la puerta. Diseño discreto y funcional para máxima seguridad.",
            color: "#10b981"
        },
        {
            icon: <Lock size={32} />,
            title: "Pestillos y Cerrojos",
            description: "Sistemas de traba manual simple para reforzar el cierre. Mecanismos adicionales de seguridad con o sin llave.",
            color: "#f59e0b"
        },
        {
            icon: <Anchor size={32} />,
            title: "Topes",
            description: "Evitan que las hojas golpeen paredes u otros objetos. Diseños discretos y funcionales para proteger sus aberturas.",
            color: "#8b5cf6"
        },
        {
            icon: <RotateCcw size={32} />,
            title: "Cierrapuertas",
            description: "Permiten el cierre automático y controlado de la hoja. Regulables para diferentes velocidades y fuerzas de cierre.",
            color: "#06b6d4"
        }
    ];

    return (
        <div className="dashboard-container">
            <Navigation />
            
            <div className="materials-header">
                <h2 className="materials-title">Tipos de Accesorios</h2>
                <p className="materials-subtitle">
                    Conozca nuestra selección de accesorios que mejoran la seguridad, funcionalidad y durabilidad
                </p>
            </div>
            
            <div className="treatments-grid">
                {accessories.map((accessory, index) => (
                    <div 
                        key={index}
                        className="treatment-card"
                        style={{ '--card-color': accessory.color }}
                    >
                        <div className="card-header">
                            <div className="icon-wrapper">
                                {accessory.icon}
                            </div>
                            <h3 className="card-title">{accessory.title}</h3>
                        </div>
                        <div className="card-content">
                            <p className="card-description">{accessory.description}</p>
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