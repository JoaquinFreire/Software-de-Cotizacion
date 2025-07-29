import React from "react";
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import "../../styles/adminGeneral.css";

const Administrar = () => (
    <div className="dashboard-container">
        <Navigation />
        <div className="admin-general-header">
            <h2>Administrar General</h2>
        </div>
        {/* ...contenido de administración general... */}
        <Footer />
    </div>
);

export default Administrar;
