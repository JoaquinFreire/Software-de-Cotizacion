import React, { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import "../../styles/adminMaterials.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "";

const AdminMaterials = () => {
	const navigate = useNavigate();
		const handleLogout = () => {
				localStorage.removeItem("token");
				navigate("/");
		}
	useEffect(() => {
		fetchCurrentUser();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const fetchCurrentUser = async () => {
		const token = localStorage.getItem("token");
		if (!token) {
			navigate("/");
			return;
		}
		try {
			const resp = await axios.get(`${API_URL}/api/auth/me`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			const role = resp.data?.user?.role;
			const allowed = role === "coordinator" || role === "manager";
			if (!allowed) {
				console.warn("No tiene permisos para ver AdminMaterials, redirigiendo.");
				navigate("/");
				return;
			}
		} catch (err) {
			console.error("Error fetching current user:", String(err));
			localStorage.removeItem("token");
			navigate("/");
		}
	};

	return (
		<div className="dashboard-container">
			<ToastContainer autoClose={4000} theme="dark" position="bottom-right" />
            <Navigation onLogout={handleLogout} />
			
			<div className="admin-materials-header">
				<h2 className="materials-title">Administrar Materiales</h2>
				<p className="admin-subtitle">Seleccione una sección para administrar categorías específicas</p>
			</div>

			<div className="admin-materials-content">
				<div className="materials-grid">
					<Link to="/admin/materiales/tratamientos" className="material-card">
						<div className="card-icon">⚗️</div>
						<h3>Tratamientos de Aluminio</h3>
						<p>Gestionar procesos y acabados</p>
					</Link>
					
					<Link to="/admin/materiales/revestimientos" className="material-card">
						<div className="card-icon">🎨</div>
						<h3>Revestimientos</h3>
						<p>Administrar superficies y texturas</p>
					</Link>
					
					<Link to="/admin/materiales/complementos" className="material-card">
						<div className="card-icon">🚪</div>
						<h3>Complementos</h3>
						<p>Puertas, Tabiques y Barandas</p>
					</Link>
					
					<Link to="/admin/materiales/tipos-vidrio" className="material-card">
						<div className="card-icon">🔍</div>
						<h3>Tipos de Vidrio</h3>
						<p>Variedades y especificaciones</p>
					</Link>
					
					<Link to="/admin/materiales/accesorios" className="material-card">
						<div className="card-icon">🔩</div>
						<h3>Accesorios</h3>
						<p>Componentes adicionales</p>
					</Link>
				</div>
			</div>

			<Footer />
		</div>
	);
};

export default AdminMaterials;