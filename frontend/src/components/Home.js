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
            <h1 className="title">Bienvenido</h1>
            <div className="home-buttons-container">
                <div className="home-main-action">
                <button className="new-quote newqoutation" onClick={() => navigate("/quotation")}>
                    <FilePlus2  size={24} className="home-btn-icon" />
                    Nueva Cotización
                </button>
            </div>
                <button className="new-quote pending" onClick={() => navigate("/cotizaciones")}>
                    <FileText size={22} className="home-btn-icon" />
                    Cotizaciones Pendientes
                </button>
                <button className="new-quote historial" onClick={() => navigate("/historial")}>
                    <Clock3 size={22} className="home-btn-icon" />
                    Todas las Cotizaciones
                </button>
                <button className="new-quote report" onClick={() => navigate("/reportes")}>
                    <PieChart size={22} className="home-btn-icon" />
                    Reportes
                </button>
                <button className="new-quote cLient" onClick={() => navigate("/customers")}>
                    <Users size={22} className="home-btn-icon" />
                    Clientes
                </button>
                <button className="new-quote material" onClick={() => navigate("/materiales")}>
                    <Layers size={22} className="home-btn-icon" />
                    Materiales
                </button>
                <button className="new-quote openings" onClick={() => navigate("/aberturas")}>
                    <BrickWall  size={22} className="home-btn-icon" />
                    Aberturas
                </button>
                <button className="new-quote admin" onClick={() => navigate("/admin")}>
                    <MonitorCog  size={22} className="home-btn-icon" />
                    Configuración de Administrador
                </button>
            </div>
            
            <Footer />
        </div>
    );
};

export default Home;
