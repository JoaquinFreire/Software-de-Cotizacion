import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "./Navigation";
import Footer from "./Footer";
import "../styles/dashboard.css";
import "../styles/Home.css";
import Banner from "../images/Banner.webp";
import BannerBlanco from "../images/BannerBlanco.webp";
import { FilePlus2, FileText, Clock3, PieChart, Users, Layers, BrickWall, MonitorCog } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();

  // Lee 1 sola vez al montar
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const lastThemeRef = useRef(theme);

  useEffect(() => {
    const readTheme = () => localStorage.getItem("theme") || "light";

    const applyThemeIfChanged = (next) => {
      if (next !== lastThemeRef.current) {
        lastThemeRef.current = next;
        setTheme(next);
      }
    };

    // Cambios desde otras pestañas
    const onStorage = (e) => {
      if (e.key === "theme") applyThemeIfChanged(readTheme());
    };

    // Evento custom (disparalo cuando hagas toggle: window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: 'dark' } }))
    const onThemeChange = (e) => {
      const next = e?.detail?.theme ?? readTheme();
      applyThemeIfChanged(next);
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("themechange", onThemeChange);

    // Fallback: detecta cambios en esta misma pestaña aunque no dispares el evento custom
    const intervalId = setInterval(() => applyThemeIfChanged(readTheme()), 2);

    // Sincroniza una vez al montar (por si se cambió antes)
    applyThemeIfChanged(readTheme());

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("themechange", onThemeChange);
      clearInterval(intervalId);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="dashboard-container">
      <Navigation onLogout={handleLogout} />
      <img
        src={theme === "light" ? BannerBlanco : Banner}
        alt="Logo"
        className="home-logo"
      />
      <div className="home-buttons-container">

        <button
          className="new-quote newqoutation"
          onClick={() => navigate("/quotation")}
        >
          <div className="quote-overlay">
            <FilePlus2 size={24} className="home-btn-icon" />
            <b>Nueva Cotización</b>
          </div>
        </button>

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
            <BrickWall size={22} className="home-btn-icon" />
            <b>Aberturas</b>
          </div>
        </button>
        <button className="new-quote admin" onClick={() => navigate("/admin")}>
          <div className="quote-overlay">
            <MonitorCog size={22} className="home-btn-icon" />
            <b>Administrar</b>
          </div>
        </button>
      </div>
      <Footer />
    </div>
  );
};

export default Home;
