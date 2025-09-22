import React from "react";
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import "../../styles/adminPrices.css";

const AdminPrices = () => (
    <div className="dashboard-container">
        <Navigation />
        <div className="admin-prices-header">
            <h2>Administrar Precios</h2>
        </div>
        {/* ...contenido de administración de descuentos... */}
        <Footer />
    </div>
);

export default AdminPrices;
