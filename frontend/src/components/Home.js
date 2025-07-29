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
                <button
                    className="new-quote newqoutation main-bg-btn"
                    onClick={() => navigate("/quotation")}
                >
                    <FilePlus2 size={24} className="home-btn-icon" />
                    <b>Nueva Cotización</b>
                </button>
                </div>
                <button className="new-quote pending" onClick={() => navigate("/cotizaciones")}>
                    <FileText size={22} className="home-btn-icon" />
                    <b>Cotizaciones Pendientes</b>
                </button>
                <button className="new-quote historial" onClick={() => navigate("/historial")}>
                    <Clock3 size={22} className="home-btn-icon" />
                    <b>Todas las Cotizaciones</b>
                </button>
                <button className="new-quote report" onClick={() => navigate("/reportes")}>
                    <PieChart size={22} className="home-btn-icon" />
                    <b>Reportes</b>
                </button>
                <button className="new-quote cLient" onClick={() => navigate("/customers")}>
                    <Users size={22} className="home-btn-icon" />
                    <b>Clientes</b>
                </button>
                <button className="new-quote material" onClick={() => navigate("/materiales")}>
                    <Layers size={22} className="home-btn-icon" />
                    <b>Materiales</b>
                </button>
                <button className="new-quote openings" onClick={() => navigate("/aberturas")}>
                    <BrickWall  size={22} className="home-btn-icon" />
                    <b>Aberturas</b>
                </button>
                <button className="new-quote admin" onClick={() => navigate("/admin")}>
                    <MonitorCog  size={22} className="home-btn-icon" />
                    <b>Configuración de Administrador</b>
                </button>
            </div>
            
            <Footer />
        </div>
    );
};

export default Home;
