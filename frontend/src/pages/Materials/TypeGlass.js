import React from 'react';
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import { Square, Shield, Zap, Thermometer, Gem } from 'lucide-react';
import { useNavigate } from "react-router-dom";


const Materiales = () => {
    const navigate = useNavigate();
    
        const handleLogout = () => {
            localStorage.removeItem("token");
            navigate("/");
        };
    const glasses = [
        {
            icon: <Square size={32} />,
            title: "Vidrio Simple",
            description: "Es el vidrio más básico y económico. Recomendado para interiores o zonas donde no se requiera aislamiento térmico o acústico. Brinda una apariencia limpia y moderna, ideal para puertas, estanterías o vitrinas.",
            color: "#06b6d4"
        },
        {
            icon: <Shield size={32} />,
            title: "Vidrio Laminado",
            description: "Compuesto por dos o más láminas unidas con una capa plástica que evita que se rompa en fragmentos peligrosos. Es una excelente opción para seguridad, aislamiento acústico y filtrado UV. Muy usado en frentes, puertas y ventanas.",
            color: "#10b981"
        },
        {
            icon: <Zap size={32} />,
            title: "Vidrio Templado",
            description: "Hasta cinco veces más resistente que un vidrio común. En caso de rotura, se fragmenta en trozos pequeños no cortantes, lo que lo hace muy seguro. Ideal para mamparas, mesas, puertas de vidrio y zonas de alto tránsito.",
            color: "#f59e0b"
        },
        {
            icon: <Thermometer size={32} />,
            title: "Vidrio DVH",
            description: "Vidrio compuesto por dos paneles separados por una cámara de aire o gas. Brinda gran aislamiento térmico y acústico, ideal para viviendas o espacios que requieren eficiencia energética y confort.",
            color: "#3b82f6"
        },
        {
            icon: <Gem size={32} />,
            title: "Vidrio Flotado",
            description: "Es el vidrio base de mayor calidad, con superficie perfectamente lisa y uniforme. Sirve como materia prima para templados, laminados o espejados. También puede usarse solo en ventanas, muebles o decoración.",
            color: "#8b5cf6"
        }
    ];

    return (
        <div className="dashboard-container">
            <Navigation onLogout={handleLogout} />
            
            <div className="materials-header">
                <h2 className="materials-title">Tipos de Vidrios</h2>
                <p className="materials-subtitle">
                    Explore nuestra gama de vidrios especializados que ofrecen seguridad, eficiencia energética y diseño para cada proyecto
                </p>
            </div>
            
            <div className="treatments-grid">
                {glasses.map((glass, index) => (
                    <div 
                        key={index}
                        className="treatment-card"
                        style={{ '--card-color': glass.color }}
                    >
                        <div className="card-header">
                            <div className="icon-wrapper">
                                {glass.icon}
                            </div>
                            <h3 className="card-title">{glass.title}</h3>
                        </div>
                        <div className="card-content">
                            <p className="card-description">{glass.description}</p>
                        </div>
                        <div className="card-hover-effect"></div>
                    </div>
                ))}
            </div>
            
            <Footer />
        </div>
    );
};

export default Materiales;