import React from "react";
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import "../../styles/adminOpening.css";

const AdminOpening = () => (
    <div className="dashboard-container">
        <Navigation />
        <div className="admin-opening-header">
            <h2>Administrar Aberturas</h2>
        </div>
        {/* ...contenido de administración de aberturas... */}
        <Footer />
    </div>
);

export default AdminOpening;
