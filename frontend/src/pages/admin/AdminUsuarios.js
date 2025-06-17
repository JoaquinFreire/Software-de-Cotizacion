import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navigation from "../../components/Navigation";
import "../../styles/adminUsuarios.css";
import { TailSpin } from "react-loader-spinner";

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
        status: 1,
        role_id: "", // Agrega role_id
    });

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
        setFormData(
            user
                ? {
                      ...user,
                      role_id: user.role_id || (user.role && user.role.id) || "",
                  }
                : {
                      name: "",
                      lastName: "",
                      legajo: "",
                      mail: "",
                      status: 1,
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
        const token = localStorage.getItem("token");
        setLoading(true);
        try {
            // Elimina la propiedad 'role' si existe en formData antes de enviar
            const payload = { ...formData };
            delete payload.role;

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
                        <div className="modal-content">
                            <h3>{editingUser ? "Actualizar Usuario" : "Crear Usuario"}</h3>
                            <form onSubmit={handleSubmit}>
                                <label>
                                    Nombre:
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </label>
                                <label>
                                    Apellido:
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </label>
                                <label>
                                    Legajo:
                                    <input
                                        type="text"
                                        name="legajo"
                                        value={formData.legajo}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </label>
                                <label>
                                    Email:
                                    <input
                                        type="email"
                                        name="mail"
                                        value={formData.mail}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </label>
                                <label>
                                    Status:
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                    >
                                        <option value={1}>Activo</option>
                                        <option value={0}>Inactivo</option>
                                    </select>
                                </label>
                                <label>
                                    Rol:
                                    <select
                                        name="role_id"
                                        value={formData.role_id}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Seleccione un rol</option>
                                        {roles.map((role) => (
                                            <option key={role.id} value={role.id}>
                                                {role.role_name}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <div className="modal-actions">
                                    <button type="submit">
                                        {editingUser ? "Actualizar" : "Crear"}
                                    </button>
                                    <button type="button" onClick={handleCloseModal}>
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default AdminUsuarios;
