import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import Navigation from "./Navigation";
import Footer from "./Footer";
import "../styles/UserConfig.css";

const API_URL = process.env.REACT_APP_API_URL;

export default function ConfigCliente() {
	const { user: ctxUser, setUser: setCtxUser } = useContext(UserContext || {});
	const navigate = useNavigate();

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState(null);
	const [profileImage, setProfileImage] = useState(null);
	const [imagePreview, setImagePreview] = useState(null);
	const [form, setForm] = useState({
		id: null,
		name: "",
		lastName: "",
		legajo: "",
		mail: "",
		birthdate: "",
		gender: "",
		emails: [],
		phones: [],
		addresses: [],
		status: 0,
		role: null,
	});

	useEffect(() => {
		fetchCurrentUser();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const fetchCurrentUser = async () => {
		setLoading(true);
		const token = localStorage.getItem("token");
		try {
			if (API_URL && token) {
				const resp = await axios.get(`${API_URL}/api/auth/me`, {
					headers: { Authorization: `Bearer ${token}` },
				});
				const u = resp.data?.user || resp.data;
				applyUserToForm(u);
				
				// Cargar imagen de perfil si existe
				if (u.profileImage) {
					setImagePreview(u.profileImage);
				}
			} else if (ctxUser) {
				applyUserToForm(ctxUser);
				if (ctxUser.profileImage) {
					setImagePreview(ctxUser.profileImage);
				}
			} else {
				navigate("/");
			}
		} catch (err) {
			console.error("Error fetching current user:", err);
			if (ctxUser) applyUserToForm(ctxUser);
			else navigate("/");
		} finally {
			setLoading(false);
		}
	};

	const applyUserToForm = (u = {}) => {
		setForm({
			id: u.id || u.user_id || null,
			name: u.name || "",
			lastName: u.lastName || u.last_name || u.lastname || "",
			legajo: u.legajo || u.dni || "",
			mail: u.mail || u.email || "",
			birthdate: u.birthdate || "",
			gender: u.gender || "",
			emails: u.emails || (u.email ? [u.email] : []),
			phones: u.phones || [],
			addresses: u.addresses || [],
			status: typeof u.status !== "undefined" ? u.status : 0,
			role: u.role || null,
		});
		
		if (setCtxUser && (u.id || u.user_id)) {
			try { setCtxUser(u); } catch (e) { /* ignore */ }
		}
	};

	const handleImageChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			setProfileImage(file);
			
			// Crear preview
			const reader = new FileReader();
			reader.onload = (e) => {
				setImagePreview(e.target.result);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleRemoveImage = () => {
		setProfileImage(null);
		setImagePreview(null);
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	const updateArrayField = (field, index, value) => {
		setForm(prev => {
			const arr = [...(prev[field] || [])];
			arr[index] = value;
			return { ...prev, [field]: arr };
		});
	};

	const addArrayItem = (field) => {
		setForm(prev => ({ ...prev, [field]: [...(prev[field] || []), ""] }));
	};
    const getInitials = (name, lastName) => {
  const firstInitial = name ? name.charAt(0).toUpperCase() : '';
  const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
  return `${firstInitial}${lastInitial}`;
};

	const removeArrayItem = (field, index) => {
		setForm(prev => {
			const arr = [...(prev[field] || [])];
			arr.splice(index, 1);
			return { ...prev, [field]: arr };
		});
	};

	const handleSave = async (e) => {
		e.preventDefault();
		setSaving(true);
		setMessage(null);

		if (!form.name || !form.lastName || !form.mail) {
			setMessage({ type: "error", text: "Nombre, Apellido y Email son requeridos." });
			setSaving(false);
			return;
		}

		try {
			const token = localStorage.getItem("token");
			const payload = new FormData();
			
			// Agregar datos del formulario
			payload.append('name', form.name);
			payload.append('lastName', form.lastName);
			payload.append('legajo', form.legajo);
			payload.append('mail', form.mail);
			payload.append('birthdate', form.birthdate);
			payload.append('gender', form.gender);
			payload.append('status', form.status);
			payload.append('emails', JSON.stringify(form.emails));
			payload.append('phones', JSON.stringify(form.phones));
			payload.append('addresses', JSON.stringify(form.addresses));
			
			// Agregar imagen si hay una nueva
			if (profileImage) {
				payload.append('profileImage', profileImage);
			} else if (imagePreview === null) {
				// Si se eliminó la imagen
				payload.append('removeProfileImage', 'true');
			}

			if (API_URL && token && form.id) {
				await axios.put(`${API_URL}/api/users/${form.id}`, payload, {
					headers: { 
						Authorization: `Bearer ${token}`,
						'Content-Type': 'multipart/form-data'
					},
				});
				setMessage({ type: "success", text: "Datos guardados exitosamente." });

				if (setCtxUser) {
					const updated = { ...(ctxUser || {}), ...form, profileImage: imagePreview };
					try { setCtxUser(updated); } catch (err) { /* ignore */ }
				}
			} else if (API_URL && token && !form.id) {
				await axios.put(`${API_URL}/api/users/me`, payload, {
					headers: { 
						Authorization: `Bearer ${token}`,
						'Content-Type': 'multipart/form-data'
					},
				});
				setMessage({ type: "success", text: "Datos guardados exitosamente." });
			} else {
				setMessage({ type: "info", text: "Cambios guardados localmente (sin API)." });
			}
		} catch (err) {
			console.error("Error saving user:", err);
			setMessage({ type: "error", text: "Error al guardar. Revise los datos o intente más tarde." });
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

			<div className="user-config-root">
				<div className="config-header">
					<h1 className="materials-title">Configuración de cuenta</h1>
					<p className="config-subtitle">Gestiona tu información personal y preferencias</p>
				</div>

				{loading ? (
					<div className="loading-container">
						<div className="loading-spinner"></div>
						<p>Cargando información...</p>
					</div>
				) : (
					<form className="user-config-form" onSubmit={handleSave}>
						{/* Sección de Foto de Perfil */}
						<section className="profile-image-section">
                             <div className="profile-image-container">
                                <div className="profile-image-wrapper">
                                 <div className="profile-image-circle">
                                  <div className="profile-initials">
                                      {getInitials(form.name, form.lastName)}
                                  </div>
                                </div>
                             </div>
                                <div className="profile-image-info">
                             <h2>{form.name} {form.lastName}</h2>
                            </div>
                            </div>
                        </section>

						{/* Información Básica */}
						<section className="config-section">
							<h2 className="section-title">Información personal</h2>
							<div className="form-grid">
								<div className="form-group">
									<label className="form-label">Nombre *</label>
									<input 
										name="name" 
										value={form.name} 
										onChange={handleChange}
										className="form-input"
										required
									/>
								</div>

								<div className="form-group">
									<label className="form-label">Apellido *</label>
									<input 
										name="lastName" 
										value={form.lastName} 
										onChange={handleChange}
										className="form-input"
										required
									/>
								</div>

								<div className="form-group">
									<label className="form-label">Legajo</label>
									<input 
										name="legajo" 
										value={form.legajo} 
										onChange={handleChange}
										className="form-input"
									/>
								</div>

								<div className="form-group">
									<label className="form-label">Email principal *</label>
									<input 
										name="mail" 
										type="email" 
										value={form.mail} 
										onChange={handleChange}
										className="form-input"
										required
									/>
								</div>

								<div className="form-group">
									<label className="form-label">Fecha de nacimiento</label>
									<input 
										type="date" 
										name="birthdate" 
										value={form.birthdate} 
										onChange={handleChange}
										className="form-input"
									/>
								</div>

								<div className="form-group">
									<label className="form-label">Género</label>
									<select 
										name="gender" 
										value={form.gender} 
										onChange={handleChange}
										className="form-select"
									>
										<option value="">Seleccionar</option>
										<option value="Masculino">Masculino</option>
										<option value="Femenino">Femenino</option>
										<option value="Otro">Otro</option>
										<option value="Prefiero no decir">Prefiero no decir</option>
									</select>
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

						{/* Información de Contacto */}
						<section className="config-section">
							<h2 className="section-title">Información de contacto</h2>
							
							<div className="dynamic-field-group">
								<label className="form-label">Correos electrónicos adicionales</label>
								{(form.emails || []).map((em, i) => (
									<div key={i} className="dynamic-field-row">
										<input 
											type="email"
											value={em} 
											onChange={(e) => updateArrayField("emails", i, e.target.value)}
											className="form-input"
											placeholder="correo@ejemplo.com"
										/>
										<button 
											type="button" 
											className="remove-item-btn"
											onClick={() => removeArrayItem("emails", i)}
										>
											<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
												<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
											</svg>
										</button>
									</div>
								))}
								<button 
									type="button" 
									className="add-item-btn"
									onClick={() => addArrayItem("emails")}
								>
									<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
										<path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
									</svg>
									Agregar correo
								</button>
							</div>

							<div className="dynamic-field-group">
								<label className="form-label">Teléfonos</label>
								{(form.phones || []).map((p, i) => (
									<div key={i} className="dynamic-field-row">
										<input 
											value={p} 
											onChange={(e) => updateArrayField("phones", i, e.target.value)}
											className="form-input"
											placeholder="+54 11 1234-5678"
										/>
										<button 
											type="button" 
											className="remove-item-btn"
											onClick={() => removeArrayItem("phones", i)}
										>
											<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
												<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
											</svg>
										</button>
									</div>
								))}
								<button 
									type="button" 
									className="add-item-btn"
									onClick={() => addArrayItem("phones")}
								>
									<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
										<path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
									</svg>
									Agregar teléfono
								</button>
							</div>
						</section>

						{/* Direcciones */}
						<section className="config-section">
							<h2 className="section-title">Direcciones</h2>
							<div className="dynamic-field-group">
								{(form.addresses || []).map((a, i) => (
									<div key={i} className="dynamic-field-row">
										<input 
											value={a} 
											onChange={(e) => updateArrayField("addresses", i, e.target.value)}
											className="form-input"
											placeholder="Calle, número, ciudad, código postal"
										/>
										<button 
											type="button" 
											className="remove-item-btn"
											onClick={() => removeArrayItem("addresses", i)}
										>
											<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
												<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
											</svg>
										</button>
									</div>
								))}
								<button 
									type="button" 
									className="add-item-btn"
									onClick={() => addArrayItem("addresses")}
								>
									<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
										<path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
									</svg>
									Agregar dirección
								</button>
							</div>
						</section>

						{/* Acciones */}
						<div className="form-actions">
							<button 
								type="submit" 
								className="primary-btn"
								disabled={saving}
							>
								{saving ? (
									<>
										<div className="button-spinner"></div>
										Guardando...
									</>
								) : (
									"Guardar cambios"
								)}
							</button>
							<button 
								type="button" 
								className="secondary-btn"
								onClick={() => window.history.back()}
							>
								Cancelar
							</button>
						</div>

						{message && (
							<div className={`message ${message.type}`}>
								{message.text}
							</div>
						)}
					</form>
				)}
			</div>

			<Footer />
		</div>
	);
}