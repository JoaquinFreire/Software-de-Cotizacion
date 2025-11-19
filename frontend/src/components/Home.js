import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "./Navigation";
import Footer from "./Footer";
import "../styles/dashboard.css";
import "../styles/Home.css";
import Banner from "../images/Banner.webp";
import BannerBlanco from "../images/BannerBlanco.webp";
import { 
    FilePlus2, 
    FileText, 
    Clock3, 
    PieChart, 
    Users, 
    Layers, 
    BrickWall, 
    MonitorCog 
} from "lucide-react";

const Home = () => {
    const navigate = useNavigate();
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

        const onStorage = (e) => {
            if (e.key === "theme") applyThemeIfChanged(readTheme());
        };

        const onThemeChange = (e) => {
            const next = e?.detail?.theme ?? readTheme();
            applyThemeIfChanged(next);
        };

        window.addEventListener("storage", onStorage);
        window.addEventListener("themechange", onThemeChange);

        const intervalId = setInterval(() => applyThemeIfChanged(readTheme()), 2);
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

    const menuItems = [
        {
            path: "/quotation",
            className: "newqoutation",
            icon: FilePlus2,
            title: "Nueva Cotización",
            description: "Crear nueva cotización"
        },
        {
            path: "/cotizaciones",
            className: "pending",
            icon: FileText,
            title: "Cotizaciones Pendientes",
            description: "Ver pendientes"
        },
        {
            path: "/historial",
            className: "historial",
            icon: Clock3,
            title: "Todas las Cotizaciones",
            description: "Historial completo"
        },
        {
            path: "/reportes",
            className: "report",
            icon: PieChart,
            title: "Reportes",
            description: "Estadísticas e informes"
        },
        {
            path: "/customers",
            className: "client",
            icon: Users,
            title: "Clientes",
            description: "Gestión de clientes"
        },
        {
            path: "/materiales",
            className: "materiales",
            icon: Layers,
            title: "Materiales",
            description: "Catálogo de materiales"
        },
        {
            path: "/aberturas",
            className: "openings",
            icon: BrickWall,
            title: "Aberturas",
            description: "Tipos de aberturas"
        },
        {
            path: "/admin",
            className: "admin",
            icon: MonitorCog,
            title: "Gestión",
            description: "Panel de administración"
        }
    ];

    return (
        <div className="dashboard-container">
            <Navigation onLogout={handleLogout} />
            
            <img
                src={theme === "light" ? BannerBlanco : Banner}
                alt="Logo"
                className="home-logo"
            />
            
            <div className="home-buttons-container">
                {menuItems.map((item, index) => (
                    <button
                        key={index}
                        className={`new-quote ${item.className}`}
                        onClick={() => navigate(item.path)}
                    >
                        <div className="quote-overlay">
                            <item.icon size={28} className="home-btn-icon" />
                            <b>{item.title}</b>
                            <small style={{ 
                                fontSize: '0.75rem', 
                                opacity: 0.9, 
                                marginTop: '4px',
                                fontWeight: 'normal'
                            }}>
                                {item.description}
                            </small>
                        </div>
                    </button>
                ))}
            </div>
            
            <Footer />
        </div>
    );
};

export default Home;