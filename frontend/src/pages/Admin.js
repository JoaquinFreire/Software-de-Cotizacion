import React from 'react';
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import "../styles/admin.css";
import { Users, Layers, Clock3, PieChart } from "lucide-react";

const Admin = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    const adminItems = [
        {
            path: "/admin/usuarios",
            className: "AdminUser",
            icon: <Users size={32} />,
            title: "Administrar Usuarios",
            description: "Gestión de usuarios y permisos",
            color: "#3b82f6"
        },
        {
            path: "/admin/materiales",
            className: "AdminMaterials",
            icon: <Layers size={32} />,
            title: "Administrar Materiales",
            description: "Configuración de materiales",
            color: "#10b981"
        },
        {
            path: "/admin/descuentos",
            className: "AdminDescuent",
            icon: <Clock3 size={32} />,
            title: "Administrar Descuentos",
            description: "Gestión de promociones",
            color: "#f59e0b"
        },
        {
            path: "/admin/aberturas",
            className: "AdminLine",
            icon: <PieChart size={32} />,
            title: "Administrar Aberturas",
            description: "Configuración de líneas",
            color: "#ef4444"
        }
    ];

    return (
        <div className="dashboard-container">
            <Navigation onLogout={handleLogout} />
            
            <div className="materials-header">
                <h2 className="materials-title">Panel de Administración</h2>
                <p className="materials-subtitle">
                    Gestione y configure todos los aspectos del sistema desde un solo lugar
                </p>
            </div>
            
            <div className="materials-grid">
                {adminItems.map((item, index) => (
                    <button 
                        key={index}
                        className={`material-card ${item.className}`}
                        onClick={() => navigate(item.path)}
                        style={{ '--card-color': item.color }}
                    >
                        <div className="card-background"></div>
                        <div className="card-content">
                            <div className="card-icon-wrapper">
                                {item.icon}
                            </div>
                            <h3 className="card-title">{item.title}</h3>
                            <p className="card-description">{item.description}</p>
                            <div className="card-arrow">→</div>
                        </div>
                    </button>
                ))}
            </div>
            
            <Footer />
        </div>
    );
};

export default Admin;