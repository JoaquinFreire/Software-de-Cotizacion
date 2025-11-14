import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import Navigation from "./Navigation";
import Footer from "./Footer";
import "../styles/UserConfig.css";
import ReactLoading from "react-loading";
import { ToastContainer, toast, Slide } from 'react-toastify'; // Agregar notificaciones

const API_URL = process.env.REACT_APP_API_URL;

export default function ConfigUser() {
	const { user: ctxUser, setUser: setCtxUser } = useContext(UserContext || {});
	const navigate = useNavigate();

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	// NOTE: theme removed from here. Navigation controla body.light-mode.

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

	const canEditRoleOrStatus = () => {
		const r = ctxUser?.role;
		const roleName = typeof r === "string" ? r : r?.role_name;
		return roleName === "manager" || roleName === "coordinator";
	};

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

			// Build payload following backend UpdateUserDTO
			const payload = {};
			// Only send email (campo permitido para todos)
			if (form.mail) payload.mail = form.mail;

			// Only include status/role_id if current user has permission
			if (canEditRoleOrStatus()) {
				if (form.status !== undefined && form.status !== null) payload.status = form.status;
				if (form.role_id) payload.role_id = form.role_id;
			}

			// Use the backend endpoint for updating the current user (safer for own profile)
			await axios.put(`${API_URL}/api/users/me`, payload, {
				headers: { Authorization: `Bearer ${token}` },
			});

			toast.success("Datos guardados correctamente.");

			// Actualizar contexto: sólo campos editables por el usuario
			if (setCtxUser) {
				setCtxUser({
					...ctxUser,
					mail: form.mail,
					// name/lastName intentionally not updated in context because backend may reject changes
				});
			}
		} catch (err) {
			console.error("Error al actualizar el usuario:", err.response?.data || err.message);

			// Manejo específico para permisos
			if (err.response?.status === 403 || err.response?.status === 401) {
				toast.error("No tienes permisos para modificar esos campos. Contacta al administrador.");
			} else if (err.response?.status === 400 && err.response.data?.errors) {
				// ProblemDetails errors: combinar mensajes de cada campo
				const errors = err.response.data.errors;
				const messages = [];
				for (const k in errors) {
					if (Array.isArray(errors[k])) messages.push(...errors[k]);
					else messages.push(String(errors[k]));
				}
				toast.error(messages.join(" — "));
			} else {
				const errorMessage = err.response?.data?.message || "No se pudo actualizar la información.";
				toast.error(errorMessage);
			}
		} finally {
			setSaving(false);
		}
	};

	const handleLogout = () => {
		localStorage.removeItem("token");
		navigate("/");
	};

	// Helper to get initials for avatar
	const getInitials = (n, ln) => {
		const a = (n || "").trim().split(" ")[0] || "";
		const b = (ln || "").trim().split(" ")[0] || "";
		return (a.charAt(0) + (b.charAt(0) || "")).toUpperCase();
	};

	return (
		<div className="dashboard-container">
			<Navigation onLogout={handleLogout} />
			<ToastContainer autoClose={4000} theme="dark" transition={Slide} position="bottom-right" />
			<div className="user-config-root">
				<div className="config-header">
					<h1 className="materials-title">Configuración de cuenta</h1>
					<p className="config-subtitle">Puedes modificar tu información personal</p>
					{/* El control de tema está centralizado en Navigation; no mostrar toggle aquí */}
				</div>

				{loading ? (
					<div className="spinner-container-dashboard">
						<ReactLoading type="spin" color="#26b7cd" height={34} width={34} 
						display={"flex"} alignItems={"center"} justifyContent={"center"}
						/>
					</div>
				) : (
					<form className="user-config-form" onSubmit={handleSave}>
						<section className="profile-image-section">
							<div className="profile-image-container">
								<div className="profile-image-wrapper">
									<div className="profile-image-circle" title="Avatar">
										{/* Simple initials avatar */}
										<div className="profile-initials">
											{getInitials(form.name, form.lastName)}
										</div>
									</div>
								</div>
								<div className="profile-image-info">
									<h3>{form.name} {form.lastName}</h3>
									<p>{form.mail}</p>
								</div>
							</div>
						</section>

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
										readOnly
									/>
								</div>

								<div className="form-group">
									<label className="form-label">Apellido</label>
									<input
										name="lastName"
										value={form.lastName}
										onChange={handleChange}
										className="form-input"
										readOnly
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
											value={form.role === 'manager' ? 'Gerente' : form.role === 'coordinator' ? 'Coordinador' : form.role === 'qoutator' ? 'Cotizadores' : form.role.role_name || ''}
											readOnly
											className="form-input readonly"
										/>
									</div>
								)}
							</div>
							{/* Nota sobre permisos */}
							<p style={{ marginTop: 12, color: "var(--muted-color)" }}>
								Solo el email puede modificarse desde aquí. Cambios de rol o estado solo están permitidos para coordinadores/administradores.
							</p>
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