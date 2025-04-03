import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navigation from "../../components/Navigation";
import "../../styles/adminUsuarios.css";

const AdminUsuarios = () => {
    const [users, setUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        lastName: "",
        legajo: "",
        mail: "",
        status: 1,
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        const token = localStorage.getItem("token");
        try {
            const response = await axios.get("http://localhost:5187/api/users", {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log(response.data);
            setUsers(response.data);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    const handleOpenModal = (user = null) => {
        setEditingUser(user);
        setFormData(
            user || {
                name: "",
                lastName: "",
                legajo: "",
                mail: "",
                status: 1,
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
        try {
            if (editingUser) {
                // Actualizar usuario
                await axios.put(
                    `http://localhost:5187/api/users/${editingUser.id}`,
                    formData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } else {
                // Crear usuario
                await axios.post("http://localhost:5187/api/users", formData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }
            fetchUsers();
            handleCloseModal();
        } catch (error) {
            console.error("Error saving user:", error);
        }
    };

    const handleToggleStatus = async (user) => {
        const token = localStorage.getItem("token");
        try {
            await axios.put(
                `http://localhost:5187/api/users/${user.id}/status`,
                { status: user.status === 1 ? 0 : 1 },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchUsers();
        } catch (error) {
            console.error("Error toggling user status:", error);
        }
    };
    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    return (
        <>
            <div className="dashboard-container">
                <Navigation onLogout={handleLogout} />
                <h2>Administrar Usuarios</h2>
                <button className="create-user-button" onClick={() => handleOpenModal()}>
                    Crear Usuario
                </button>

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
                                <td>{user.status === 1 ? "Activo" : "Inactivo"}</td>
                                <td>
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
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

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
