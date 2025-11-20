import React, { useEffect } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import "../../styles/adminMaterials.css";
import { ToastContainer, toast } from "react-toastify"; // añadida la importación de toast
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "";

const AdminMaterials = () => {
	// HOOKS primero
	const navigate = useNavigate();
	const handleLogout = () => { localStorage.removeItem("token"); navigate("/"); };

	// helper para decodificar payload JWT (base64url)
	const decodeJwtPayload = (token) => {
		try {
			const parts = token.split('.');
			if (parts.length < 2) return null;
			const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
			const json = decodeURIComponent(
				atob(payload)
					.split('')
					.map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
					.join('')
			);
			return JSON.parse(json);
		} catch (e) {
			return null;
		}
	};

	// Verificación adicional en mount (opcional toast)
	// -- ESTE useEffect se declara aquí junto a los hooks para que no sea condicional --
	useEffect(() => {
		const token = localStorage.getItem("token");
		if (!token) { navigate("/"); return; }
		const payload = decodeJwtPayload(token);
		if (!payload) { navigate("/"); return; }
		let role = payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || payload["role"] || payload["role_name"] || payload["roles"] || payload["userRole"] || payload["roleName"];
		if (role && typeof role === "object") role = role.role_name || role.name || "";
		role = String(role || "").toLowerCase();
		if (role !== "coordinator" && role !== "manager") {
			toast.error("No tiene permisos para acceder a esta sección.");
			navigate("/");
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// comprobación SÍNCRONA después de declarar hooks (evita flash y mantiene redirect inmediato)
	const _token = localStorage.getItem("token");
	if (!_token) return <Navigate to="/" replace />;
	const _payload = decodeJwtPayload(_token);
	if (!_payload) return <Navigate to="/" replace />;
	let _role = _payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]
		|| _payload["role"]
		|| _payload["role_name"]
		|| _payload["roles"]
		|| _payload["userRole"]
		|| _payload["roleName"] || "";
	if (typeof _role === "object") _role = _role.role_name || _role.name || "";
	_role = String(_role || "").toLowerCase();
	if (_role !== "coordinator" && _role !== "manager") return <Navigate to="/" replace />;

	return (
		<div className="dashboard-container">
			<ToastContainer autoClose={4000} theme="dark" position="bottom-right" />
            <Navigation onLogout={handleLogout} />
			
			<div className="admin-materials-header">
				<h2 className="materials-title">Gestionar Materiales</h2>
				<p className="admin-subtitle">Seleccione una sección para gestionar categorías específicas</p>
			</div>

			<div className="admin-materials-content">
				<div className="materials-grid">
					<Link to="/gestion/materiales/tratamientos" className="material-card">
						<div className="card-icon">⚗️</div>
						<h3>Tratamientos de Aluminio</h3>
						<p>Gestionar procesos y acabados</p>
					</Link>
					
					<Link to="/gestion/materiales/revestimientos" className="material-card">
						<div className="card-icon">🎨</div>
						<h3>Revestimientos</h3>
						<p>Gestionar superficies y texturas</p>
					</Link>
					
					<Link to="/gestion/materiales/complementos" className="material-card">
						<div className="card-icon">🚪</div>
						<h3>Complementos</h3>
						<p>Puertas, Tabiques y Barandas</p>
					</Link>
					
					<Link to="/gestion/materiales/tipos-vidrio" className="material-card">
						<div className="card-icon">🔍</div>
						<h3>Tipos de Vidrio</h3>
						<p>Variedades y especificaciones</p>
					</Link>
					
					<Link to="/gestion/materiales/accesorios" className="material-card">
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