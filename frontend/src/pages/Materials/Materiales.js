import React from 'react';
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import { useNavigate } from "react-router-dom";
import { Layers, Palette, Shield, Gem } from "lucide-react";
import "../../styles/Materials.css";


const Materiales = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    const materials = [
        {
            path: "/Materials/coating",
            className: "coating",
            icon: <Palette size={32} />,
            title: "Revestimientos",
            color: "#8b5cf6"
        },
        {
            path: "/Materials/aluminumTreatment",
            className: "tratamet",
            icon: <Shield size={32} />,
            title: "Tratamiento de Aluminio",
            color: "#06b6d4"
        },
        {
            path: "/Materials/TypeGlass",
            className: "glass",
            icon: <Gem size={32} />,
            title: "Tipos de Vidrio",
            color: "#10b981"
        }
    ];

    return (
        <div className="dashboard-container">
            <Navigation onLogout={handleLogout} />
            
            <div className="materials-header">
                <h2 className="materials-title">Panel de Acabados</h2>
                <p className="materials-subtitle">
                    Descubra los diferentes tipos de acabados disponibles para cotizaciones
                </p>
            </div>
            
            <div className="materials-grid">
                {materials.map((material, index) => (
                    <button 
                        key={index}
                        className={`material-card ${material.className}`}
                        onClick={() => navigate(material.path)}
                        style={{ '--card-color': material.color }}
                    >
                        <div className="card-background"></div>
                        <div className="card-content">
                            <div className="card-icon-wrapper">
                                {material.icon}
                            </div>
                            <h3 className="card-title">{material.title}</h3>
                            <p className="card-description">{material.description}</p>
                            <div className="card-arrow">→</div>
                        </div>
                    </button>
                ))}
            </div>
            
            <Footer />
        </div>
    );
};

export default Materiales;