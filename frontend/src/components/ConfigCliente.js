import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import Navigation from "./Navigation";
import Footer from "./Footer";
import "../styles/UserConfig.css";
import { ToastContainer, toast, Slide } from 'react-toastify'; // Agregar notificaciones

const API_URL = process.env.REACT_APP_API_URL;

export default function ConfigCliente() {
	const { user: ctxUser, setUser: setCtxUser } = useContext(UserContext || {});
	const navigate = useNavigate();

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [form, setForm] = useState({
		id: null,
		name: "",
		lastName: "",
		legajo: "",
		mail: "",
		status: 1,
		role_id: null,
		role: null,
	});

	useEffect(() => {
		fetchCurrentUser();
	}, []);

	const fetchCurrentUser = async () => {
		setLoading(true);
		const token = localStorage.getItem("token");
		try {
			const resp = await axios.get(`${API_URL}/api/auth/me`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			const u = resp.data?.user || resp.data;
			setForm({
				id: u.id || u.user_id,
				name: u.name || "",
				lastName: u.lastName || u.last_name || "",
				legajo: u.legajo || u.dni || "",
				mail: u.mail || u.email || "",
				status: u.status || 1,
				role_id: u.role_id || u.role?.id,
				role: u.role || null,
			});
			if (setCtxUser) setCtxUser(u);
		} catch (err) {
			console.error("Error fetching current user:", err);
			navigate("/");
		} finally {
			setLoading(false);
		}
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	const handleSave = async (e) => {
		e.preventDefault();
		setSaving(true);

		try {
			const token = localStorage.getItem("token");

			const payload = {
				name: form.name,
				lastName: form.lastName,
				legajo: form.legajo,
				mail: form.mail,
				status: form.status ?? 1,
				role_id: form.role_id ?? form.role?.id,
			};

			// Usar el endpoint para el usuario actual
			await axios.put(`${API_URL}/api/users/me`, payload, {
				headers: { Authorization: `Bearer ${token}` },
			});

			// Usar toast para notificaciones consistentes
			toast.success("Email actualizado correctamente.");

			// Actualizar contexto
			if (setCtxUser) {
				setCtxUser({ 
					...ctxUser, 
					mail: form.mail,
					name: form.name,
					lastName: form.lastName 
				});
			}
		} catch (err) {
			console.error("Error al actualizar el usuario:", err.response?.data || err.message);
			
			// Mensajes de error más específicos
			const errorMessage = err.response?.data?.message || "No se pudo actualizar el email.";
			toast.error(errorMessage);
		} finally {
			setSaving(false);
		}
	};

	const handleLogout = () => {
		localStorage.removeItem("token");
		navigate("/");
	};

	return (
		<div className="dashboard-container">
			<Navigation onLogout={handleLogout} />
			<ToastContainer autoClose={4000} theme="dark" transition={Slide} position="bottom-right" />
			<div className="user-config-root">
				<div className="config-header">
					<h1 className="materials-title">Configuración de cuenta</h1>
					<p className="config-subtitle">Puedes modificar tu información personal</p>
				</div>

				{loading ? (
					<div className="loading-container">
						<div className="loading-spinner"></div>
						<p>Cargando información...</p>
					</div>
				) : (
					<form className="user-config-form" onSubmit={handleSave}>
						<section className="config-section">
							<h2 className="section-title">Datos del usuario</h2>
							<div className="form-grid">
								<div className="form-group">
									<label className="form-label">Nombre</label>
									<input 
										name="name" 
										value={form.name} 
										onChange={handleChange}
										className="form-input" 
									/>
								</div>

								<div className="form-group">
									<label className="form-label">Apellido</label>
									<input 
										name="lastName" 
										value={form.lastName} 
										onChange={handleChange}
										className="form-input" 
									/>
								</div>

								<div className="form-group">
									<label className="form-label">Legajo</label>
									<input 
										name="legajo" 
										value={form.legajo} 
										readOnly 
										className="form-input readonly" 
									/>
								</div>

								<div className="form-group">
									<label className="form-label">Email principal *</label>
									<input
										type="email"
										name="mail"
										value={form.mail}
										onChange={handleChange}
										className="form-input"
										required
									/>
								</div>

								{form.role && (
									<div className="form-group">
										<label className="form-label">Rol</label>
										<input
											value={form.role.role_name || form.role}
											readOnly
											className="form-input readonly"
										/>
									</div>
								)}
							</div>
						</section>

						<div className="form-actions">
							<button type="submit" className="primary-btn" disabled={saving}>
								{saving ? "Guardando..." : "Actualizar Datos"}
							</button>
							<button type="button" className="secondary-btn" onClick={() => window.history.back()}>
								Cancelar
							</button>
						</div>
					</form>
				)}
			</div>
			<Footer />
		</div>
	);
}