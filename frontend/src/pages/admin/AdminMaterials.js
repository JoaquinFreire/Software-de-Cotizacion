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
	// solo mantenemos la verificación de usuario y el layout aquí
	const navigate = useNavigate();

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

	// ---------- Render ----------
	return (
		<div className="dashboard-container">
			<ToastContainer autoClose={4000} theme="dark" position="bottom-right" />
			<Navigation />
			<div className="admin-materials-header">
				<h2>Administrar Materiales</h2>
				<p style={{ color: "#cfd8d8", marginTop: 6 }}>Seleccione una sección para administrar categorías específicas</p>
			</div>

			{/* Contenedor: mostrar enlaces hacia las páginas separadas */}
			<div className="admin-materials-content">
				<div className="materials-links" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
					<Link to="/admin/materiales/tratamientos" className="btn update" style={{ display: "block", padding: 18, textAlign: "center", textDecoration: "none" }}>
						Tratamientos de Aluminio
					</Link>
					<Link to="/admin/materiales/revestimientos" className="btn update" style={{ display: "block", padding: 18, textAlign: "center", textDecoration: "none" }}>
						Revestimientos
					</Link>
					<Link to="/admin/materiales/complementos" className="btn update" style={{ display: "block", padding: 18, textAlign: "center", textDecoration: "none" }}>
						Complementos (Puerta / Tabique / Baranda)
					</Link>
					<Link to="/admin/materiales/tipos-vidrio" className="btn update" style={{ display: "block", padding: 18, textAlign: "center", textDecoration: "none" }}>
						Tipos de Vidrio
					</Link>
					<Link to="/admin/materiales/accesorios" className="btn update" style={{ display: "block", padding: 18, textAlign: "center", textDecoration: "none" }}>
						Accesorios
					</Link>
				</div>
			</div>

			<Footer />
		</div>
	);
};

export default AdminMaterials;