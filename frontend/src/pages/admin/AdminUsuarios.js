import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import "../../styles/adminUsuarios.css";
import { TailSpin } from "react-loader-spinner";
import { validateUser } from "../../validation/userValidation"; // Asumiendo que existe

const API_URL = process.env.REACT_APP_API_URL;
const AdminUsuarios = () => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        lastName: "",
        legajo: "",
        mail: "",
        status: 0, // Siempre inactivo al crear
        role_id: "", // Agrega role_id
    });
    const [validationErrors, setValidationErrors] = useState({});

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        const token = localStorage.getItem("token");
        try {
            const response = await axios.get(`${API_URL}/api/users`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUsers(response.data);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
        setLoading(false);
    };

    const fetchRoles = async () => {
        const token = localStorage.getItem("token");
        try {
            const response = await axios.get(`${API_URL}/api/userroles`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setRoles(response.data);
        } catch (error) {
            console.error("Error fetching roles:", error);
        }
    };

    const handleOpenModal = (user = null) => {
        setEditingUser(user);
        setValidationErrors({});
        setFormData(
            user
                ? {
                      ...user,
                      role_id: user.role_id || (user.role && user.role.id) || "",
                      // Eliminar password_hash y role si existen
                      password_hash: undefined,
                      role: undefined
                  }
                : {
                      name: "",
                      lastName: "",
                      legajo: "",
                      mail: "",
                      status: 0,
                      role_id: "",
                  }
        );
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingUser(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setValidationErrors({});
        // Validar antes de enviar
        const errors = validateUser({
            ...formData,
            status: editingUser ? formData.status : 0,
        });
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }
        const token = localStorage.getItem("token");
        setLoading(true);
        try {
            // Solo los campos permitidos y sin undefined/null
            const payload = {
                name: formData.name,
                lastName: formData.lastName,
                legajo: formData.legajo,
                mail: formData.mail,
                status: editingUser ? formData.status : 0,
                role_id: typeof formData.role_id === "string" ? parseInt(formData.role_id) : formData.role_id
            };
            if (editingUser) {
                payload.id = editingUser.id;
                // Elimina cualquier campo extra que pueda venir del backend
                // (por ejemplo, password_hash, role, etc.)
            }

            // Limpieza final: elimina cualquier campo undefined o null
            Object.keys(payload).forEach(
                (key) => (payload[key] === undefined || payload[key] === null) && delete payload[key]
            );

            if (editingUser) {
                await axios.put(
                    `${API_URL}/api/users/${editingUser.id}`,
                    payload,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } else {
                await axios.post(`${API_URL}/api/users`, payload, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }
            fetchUsers();
            handleCloseModal();
        } catch (error) {
            setValidationErrors({
                general: "Error al guardar el usuario. Verifique los datos o contacte al administrador.",
            });
            console.error("Error saving user:", error);
        }
        setLoading(false);
    };

    const handleToggleStatus = async (user) => {
        const token = localStorage.getItem("token");
        setLoading(true);
        try {
            await axios.put(
                `${API_URL}/api/users/${user.id}/status`,
                { status: user.status === 1 ? 0 : 1 },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            await fetchUsers();
        } catch (error) {
            console.error("Error toggling user status:", error);
        }
        setLoading(false);
    };
    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    return (
        <>
            <div className="dashboard-container">
                <Navigation onLogout={handleLogout} />
                <div className="admin-usuarios-header">
                    <h2>Administrar Usuarios</h2>
                    <button className="create-user-button" onClick={() => handleOpenModal()}>
                        Crear Usuario
                    </button>
                </div>
                <div className="users-table-wrapper" style={{ minHeight: 320 }}>
                    {loading ? (
                        <div className="loader-center">
                            <TailSpin
                                height={60}
                                width={60}
                                color="#1cb5e0"
                                ariaLabel="tail-spin-loading"
                                radius="1"
                                visible={true}
                            />
                        </div>
                    ) : (
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Apellido</th>
                                    <th>Legajo</th>
                                    <th>Email</th>
                                    <th>Status</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id}>
                                        <td>{user.name}</td>
                                        <td>{user.lastName}</td>
                                        <td>{user.legajo}</td>
                                        <td>{user.mail}</td>
                                        <td>
                                            <span className={user.status === 1 ? "status-active" : "status-inactive"}>
                                                {user.status === 1 ? "Activo" : "Inactivo"}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="actions-group">
                                                <button
                                                    className="edit-button"
                                                    onClick={() => handleOpenModal(user)}
                                                >
                                                    Actualizar
                                                </button>
                                                <button
                                                    className="status-button"
                                                    onClick={() => handleToggleStatus(user)}
                                                >
                                                    {user.status === 1 ? "Desactivar" : "Activar"}
                                                </button>
                                                <button className="details-button">Detalles</button>
                                                <button
                                                    className="invite-button"
                                                    onClick={async () => {
                                                        setLoading(true);
                                                        try {
                                                            await fetch(`${API_URL}/api/user-invitations/invite`, {
                                                                method: "POST",
                                                                headers: {
                                                                    "Content-Type": "application/json",
                                                                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                                                                },
                                                                body: JSON.stringify({ userId: user.id }),
                                                            });
                                                            alert("Invitación enviada por email.");
                                                        } catch (err) {
                                                            alert("Error al enviar la invitación.");
                                                        }
                                                        setLoading(false);
                                                    }}
                                                >
                                                    Invitar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                {showModal && (
                    <div className="modal">
                        <div className="modal-content modal-user-form">
                            <h3 style={{ textAlign: "center", color: "#4f8cff", marginBottom: 18 }}>
                                {editingUser ? "Actualizar Usuario" : "Crear Usuario"}
                            </h3>
                            <form onSubmit={handleSubmit} noValidate>
                                {validationErrors.general && (
                                    <div className="validation-error">{validationErrors.general}</div>
                                )}
                                <label>
                                    Nombre:
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        className={validationErrors.name ? "input-error" : ""}
                                    />
                                    {validationErrors.name && (
                                        <span className="validation-error">{validationErrors.name}</span>
                                    )}
                                </label>
                                <label>
                                    Apellido:
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                        required
                                        className={validationErrors.lastName ? "input-error" : ""}
                                    />
                                    {validationErrors.lastName && (
                                        <span className="validation-error">{validationErrors.lastName}</span>
                                    )}
                                </label>
                                <label>
                                    Legajo (DNI):
                                    <input
                                        type="text"
                                        name="legajo"
                                        value={formData.legajo}
                                        onChange={handleInputChange}
                                        required
                                        className={validationErrors.legajo ? "input-error" : ""}
                                    />
                                    {validationErrors.legajo && (
                                        <span className="validation-error">{validationErrors.legajo}</span>
                                    )}
                                </label>
                                <label>
                                    Email:
                                    <input
                                        type="email"
                                        name="mail"
                                        value={formData.mail}
                                        onChange={handleInputChange}
                                        required
                                        className={validationErrors.mail ? "input-error" : ""}
                                    />
                                    {validationErrors.mail && (
                                        <span className="validation-error">{validationErrors.mail}</span>
                                    )}
                                </label>
                                <label>
                                    Rol:
                                    <select
                                        name="role_id"
                                        value={formData.role_id}
                                        onChange={handleInputChange}
                                        required
                                        className={validationErrors.role_id ? "input-error" : ""}
                                    >
                                        <option value="">Seleccione un rol</option>
                                        {roles.map((role) => (
                                            <option key={role.id} value={role.id}>
                                                {role.role_name}
                                            </option>
                                        ))}
                                    </select>
                                    {validationErrors.role_id && (
                                        <span className="validation-error">{validationErrors.role_id}</span>
                                    )}
                                </label>
                                <div className="modal-actions">
                                    <button
                                        type="submit"
                                        className="modal-submit-btn"
                                        disabled={loading}
                                    >
                                        {loading
                                            ? "Guardando..."
                                            : editingUser
                                            ? "Actualizar"
                                            : "Crear"}
                                    </button>
                                    <button type="button" onClick={handleCloseModal} className="modal-cancel-btn">
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                <Footer />
            </div>
        </>
    );
};

export default AdminUsuarios;
