import React, { useEffect, useState } from 'react';
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import { Palette, TreePine, Layers, Brush, Sticker } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { safeArray } from '../../utils/safeArray';
import ReactLoading from 'react-loading';
const API_URL = process.env.REACT_APP_API_URL ?? '';

const Materiales = () => {
    const navigate = useNavigate();
    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    const [coatings, setCoatings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const currency = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        axios.get(`${API_URL}/api/coating`, { headers })
            .then(resp => {
                if (!mounted) return;
                const items = safeArray(resp.data);
                const mapped = items.map(it => ({
                    id: it.id ?? it._id,
                    name: it.name,
                    price: it.price ?? 0,
                    description: it.description ?? '',
                    icon: <Palette size={32} />,
                    color: "#8b5cf6"
                }));
                setCoatings(mapped);
            })
            .catch(err => {
                // Mejor logging y mensaje para el usuario
                console.error('Error GET /api/coating', err);
                if (axios.isAxiosError(err)) {
                    const resp = err.response;
                    console.error('Backend response:', resp?.data ?? resp);
                    const detail = resp?.data?.Message ?? resp?.data ?? resp?.statusText ?? err.message;
                    setError(`Error servidor ${resp?.status ?? ''}: ${detail}`);
                } else {
                    setError('Error desconocido al cargar los revestimientos.');
                }
            })
            .finally(() => { if (mounted) setLoading(false); });

        return () => { mounted = false; };
    }, []);

    return (
        <div className="dashboard-container">
            <Navigation onLogout={handleLogout} />

            <div className="materials-header">
                <h2 className="materials-title">Revestimientos</h2>
                <p className="materials-subtitle">
                    Descubra nuestra variedad de revestimientos que combinan estética, durabilidad y funcionalidad para cada necesidad
                </p>
            </div>

            {loading ? (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 48
                }}>
                    <ReactLoading type="spin" color="#26b7cd" height={40} width={40} />
                </div>
            ) : error ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#ef4444' }}>{error}</div>
            ) : (
                <div className="treatments-grid">
                    {coatings.map((coating, index) => (
                        <div
                            key={coating.id ?? index}
                            className="treatment-card"
                            style={{ '--card-color': coating.color }}
                        >
                            <div className="card-header">
                                <div className="icon-wrapper">
                                    {coating.icon}
                                </div>
                                <h3 className="card-title">{coating.name}</h3>
                            </div>
                            <div className="card-content">
                                <p className="card-description">{coating.description}</p>
                                <div style={{ marginTop: 8, fontWeight: 700 }}>{currency.format(coating.price ?? 0)}</div>
                            </div>
                            <div className="card-hover-effect"></div>
                        </div>
                    ))}
                </div>
            )}

            <Footer />
        </div>
    );
};

export default Materiales;