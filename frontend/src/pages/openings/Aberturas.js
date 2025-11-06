import React from 'react';
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import { useNavigate } from "react-router-dom";
import { Layers, Grid3X3, Puzzle, Wrench } from "lucide-react";
import "../../styles/Aberturas.css";

const Aberturas = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    const openings = [
        {
            path: "/openings/TypesLines",
            className: "Line",
            icon: <Grid3X3 size={32} />,
            title: "Tipos de Líneas",
            color: "#f59e0b"
        },
        {
            path: "/openings/Complement",
            className: "Complement",
            icon: <Puzzle size={32} />,
            title: "Complementos",
            color: "#ef4444"
        },
        {
            path: "/openings/Accessories",
            className: "Accesories",
            icon: <Wrench size={32} />,
            title: "Accesorios",
            color: "#3b82f6"
        }
    ];

    return (
        <div className="dashboard-container">
            <Navigation onLogout={handleLogout} />
            
            <div className="materials-header">
                <h2 className="materials-title">Panel de gamas</h2>
                <p className="materials-subtitle">
                    Visualice los diferentes tipos de líenas y sus componentes
                </p>
            </div>
            
            <div className="materials-grid">
                {openings.map((opening, index) => (
                    <button 
                        key={index}
                        className={`material-card ${opening.className}`}
                        onClick={() => navigate(opening.path)}
                        style={{ '--card-color': opening.color }}
                    >
                        <div className="card-background"></div>
                        <div className="card-content">
                            <div className="card-icon-wrapper">
                                {opening.icon}
                            </div>
                            <h3 className="card-title">{opening.title}</h3>
                            <p className="card-description">{opening.description}</p>
                            <div className="card-arrow">→</div>
                        </div>
                    </button>
                ))}
            </div>
            
            <Footer />
        </div>
    );
};

export default Aberturas;