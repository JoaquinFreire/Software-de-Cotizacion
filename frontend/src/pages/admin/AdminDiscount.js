import React from "react";
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import "../../styles/adminDiscount.css";

const AdminDiscount = () => (
    <div className="dashboard-container">
        <Navigation />
        <div className="admin-discount-header">
            <h2>Administrar Descuentos</h2>
        </div>
        {/* ...contenido de administración de descuentos... */}
        <Footer />
    </div>
);

export default AdminDiscount;
