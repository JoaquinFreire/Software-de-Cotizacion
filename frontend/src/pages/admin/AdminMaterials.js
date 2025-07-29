import React from "react";
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import "../../styles/adminMaterials.css";

const AdminMaterials = () => (
    <div className="dashboard-container">
        <Navigation />
        <div className="admin-materials-header">
            <h2>Administrar Materiales</h2>
        </div>
        {/* ...contenido de administración de materiales... */}
        <Footer />
    </div>
);

export default AdminMaterials;
