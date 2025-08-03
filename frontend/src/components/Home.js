import React from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "./Navigation";
import Footer from "./Footer";
import "../styles/dashboard.css";
import "../styles/Home.css";
import {FilePlus2 , FileText, Clock3, PieChart, Users, Layers, BrickWall , MonitorCog  } from 'lucide-react';

const Home = () => {
    const navigate = useNavigate();

    // Simula logout para Navigation
    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    return (
        <div className="dashboard-container">
            <Navigation onLogout={handleLogout} />
            <i><h1  className="title">Bienvenido</h1></i>
            <div className="home-buttons-container">
                <div className="home-main-action">
                <button
                    className="new-quote newqoutation "
                    onClick={() => navigate("/quotation")}
                >
                    <div className="quote-overlay">
                    <FilePlus2 size={24} className="home-btn-icon" />
                    <b>Nueva Cotización</b>
                    </div>
                </button>
                </div>
                <button className="new-quote pending" onClick={() => navigate("/cotizaciones")}>
                    <div className="quote-overlay">
                    <FileText size={22} className="home-btn-icon" />
                    <b>Cotizaciones Pendientes</b> 
                    </div>
                </button>
                <button className="new-quote historial" onClick={() => navigate("/historial")}>
                    <div className="quote-overlay">
                    <Clock3 size={22} className="home-btn-icon" />
                    <b>Todas las Cotizaciones</b>
                    </div>
                </button>
                <button className="new-quote report" onClick={() => navigate("/reportes")}>
                    <div className="quote-overlay">
                    <PieChart size={22} className="home-btn-icon" />
                    <b>Reportes</b>
                    </div>
                </button>
                <button className="new-quote client" onClick={() => navigate("/customers")}>
                    <div className="quote-overlay">
                    <Users size={22} className="home-btn-icon" />
                    <b>Clientes</b>
                    </div>
                </button>
                <button className="new-quote material" onClick={() => navigate("/materiales")}>
                    <div className="quote-overlay">
                    <Layers size={22} className="home-btn-icon" />
                    <b>Materiales</b>
                    </div>
                </button>
                <button className="new-quote openings" onClick={() => navigate("/aberturas")}>
                    <div className="quote-overlay">
                    <BrickWall  size={22} className="home-btn-icon" />
                    <b>Aberturas</b>
                    </div>
                </button>
                <button className="new-quote admin" onClick={() => navigate("/admin")}>
                    <div className="quote-overlay">
                    <MonitorCog  size={22} className="home-btn-icon" />
                    <b>Configuración de Administrador</b>
                    </div>
                </button>
            </div>
            
            <Footer />
        </div>
    );
};

export default Home;
