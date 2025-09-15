import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import "../../styles/adminUsuarios.css";
import { TailSpin } from "react-loader-spinner";
import { validateUser } from "../../validation/userValidation"; // Asumiendo que existe
import { safeArray } from "../../utils/safeArray"; // agrega este import

const API_URL = process.env.REACT_APP_API_URL;

const AdminUsuarios = () => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState(null);
    const [notificationType, setNotificationType] = useState("success");
    const [currentUserRole, setCurrentUserRole] = useState(null); // <-- added
    const [unauthorized, setUnauthorized] = useState(false); // <-- added
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        lastName: "",
        legajo: "",
        mail: "",
        status: 0,
        role_id: "",
    });

    const [validationErrors, setValidationErrors] = useState({});

    useEffect(() => {
        fetchCurrentUser();
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
            setCurrentUserRole(role);
            const allowed = role === "coordinator" || role === "manager";
            if (allowed) {
                await fetchUsers();
                await fetchRoles();
            } else {
                // No permitido -> notificar y redirigir inmediatamente
                setUnauthorized(true);
                setNotificationMessage("No tiene permisos para ver o crear usuarios.");
                setNotificationType("error");
                setTimeout(() => setNotificationMessage(null), 3000);
                navigate("/"); // <-- redirección inmediata para evitar acceso manual
                return;
            }
        } catch (err) {
            console.error("Error fetching current user:", err);
            navigate("/");
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        const token = localStorage.getItem("token");
        try {
            const response = await axios.get(`${API_URL}/api/users`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUsers(safeArray(response.data)); // <-- Normaliza aquí
        } catch (error) {
            console.error("Error fetching users:", error);
        }
        setLoading(false);
    };

    const fetchRoles = async () => {
        const token = localStorage.getItem("token");
        try {
            const response = await axios.get(`${API_URL}/api/users/userroles`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setRoles(safeArray(response.data)); // <-- Normaliza aquí
        } catch (error) {
            console.error("Error fetching roles:", error);
        }
    };

    const handleOpenModal = (user = null) => {
        // Prevent creating a user when current user is not allowed
        if (!user && !(currentUserRole === "coordinator" || currentUserRole === "manager")) {
            setNotificationMessage("No tiene permisos para crear usuarios.");
            setNotificationType("error");
            setTimeout(() => setNotificationMessage(null), 3000);
            return;
        }
        setEditingUser(user);
        setValidationErrors({});
        setFormData(
            user
                ? {
                      ...user,
                      role_id: user.role_id || (user.role && user.role.id) || "",
                      password_hash: undefined,
                      role: undefined,
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
            const payload = {
                name: formData.name,
                lastName: formData.lastName,
                legajo: formData.legajo,
                mail: formData.mail,
                status: editingUser ? formData.status : 0,
                role_id: typeof formData.role_id === "string" ? parseInt(formData.role_id) : formData.role_id,
            };
            if (editingUser) {
                payload.id = editingUser.id;
            }
            Object.keys(payload).forEach(
                (key) => (payload[key] === undefined || payload[key] === null) && delete payload[key]
            );

            if (editingUser) {
                await axios.put(`${API_URL}/api/users/${editingUser.id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` },
                });
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
        const newStatus = user.status === 1 ? 0 : 1;
        await axios.put(
            `${API_URL}/api/users/${user.id}/status`,
            { status: newStatus },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        await fetchUsers();

        setNotificationMessage(
            newStatus === 1 ? "Usuario activado correctamente." : "Usuario desactivado correctamente."
        );
        setNotificationType("success");
    } catch (error) {
        console.error("Error toggling user status:", error);
        setNotificationMessage("Error al cambiar el estado del usuario.");
        setNotificationType("error");
    }
    setLoading(false);

    setTimeout(() => {
        setNotificationMessage(null);
    }, 3000);
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
                    {(currentUserRole === "coordinator" || currentUserRole === "manager") && (
                        <button className="create-user-button" onClick={() => handleOpenModal()}>
                            Crear Usuario
                        </button>
                    )}
                </div>

                {unauthorized && (
                    <div style={{ textAlign: "center", marginTop: 20, color: "#721c24" }}>
                        No autorizado para ver esta sección.
                    </div>  
                )}

                {/* Notificación interna */}
                {notificationMessage && (
                    <div
                        style={{
                            marginBottom: "15px",
                            padding: "10px",
                            borderRadius: "5px",
                            backgroundColor: notificationType === "success" ? "#d4edda" : "#f8d7da",
                            color: notificationType === "success" ? "#155724" : "#721c24",
                            border: notificationType === "success" ? "1px solid #c3e6cb" : "1px solid #f5c6cb",
                            textAlign: "center",
                            maxWidth: "600px",
                            marginInline: "auto",
                        }}
                    >
                        {notificationMessage}
                    </div>
                )}

                <div className="users-table-wrapper" style={{ minHeight: 320 }}>
                    {loading ? (
                         <div className="loader-center">
                             <TailSpin height={60} width={60} color="#1cb5e0" ariaLabel="tail-spin-loading" radius="1" visible={true} />
                         </div>
                     ) : (
                        !unauthorized && (
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
                                 {safeArray(users).map((user) => (
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
                                                 <button className="edit-button" onClick={() => handleOpenModal(user)}>
                                                     Actualizar
                                                 </button>
                                                 <button className="status-button" onClick={() => handleToggleStatus(user)}>
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
                                                             setNotificationMessage("Invitación enviada por email.");
                                                             setNotificationType("success");
                                                         } catch (err) {
                                                             setNotificationMessage("Error al enviar la invitación.");
                                                             setNotificationType("error");
                                                         }
                                                         setLoading(false);
                                                         setTimeout(() => {
                                                             setNotificationMessage(null);
                                                         }, 3000);
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
                        )
                     )}
                 </div>

                {showModal && (
                    <div className="modal">
                        <div className="modal-content modal-user-form">
                            <h3 style={{ textAlign: "center", color: "#26b7cd", marginBottom: 18 }}>
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
                                        {safeArray(roles).map((role) => (
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
                                        {loading ? "Guardando..." : editingUser ? "Actualizar" : "Crear"}
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
