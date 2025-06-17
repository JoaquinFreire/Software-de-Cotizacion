import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/createPassword.css";

const API_URL = process.env.REACT_APP_API_URL;

const CreatePassword = () => {
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Obtener token de la URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!token) {
            setMessage("Token inválido.");
            return;
        }
        if (password !== confirm) {
            setMessage("Las contraseñas no coinciden.");
            return;
        }
        setLoading(true);
        try {
            await axios.post(`${API_URL}/api/user-invitations/set-password`, {
                token,
                newPassword: password,
            });
            setMessage("¡Contraseña creada con éxito! Ya podés iniciar sesión.");
            setTimeout(() => {
                navigate("/");
            }, 1500);
        } catch (err) {
            setMessage(
                err.response?.data || "Error al crear la contraseña. El link puede estar expirado."
            );
        }
        setLoading(false);
    };

    return (
        <div className="create-password-container">
            <h2>Crear Contraseña</h2>
            <form onSubmit={handleSubmit} className="create-password-form">
                <label>
                    Nueva contraseña:
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </label>
                <label>
                    Confirmar contraseña:
                    <input
                        type="password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        required
                    />
                </label>
                <button type="submit" disabled={loading}>
                    {loading ? "Guardando..." : "Crear contraseña"}
                </button>
            </form>
            {message && <div className="create-password-message">{message}</div>}
        </div>
    );
};

export default CreatePassword;