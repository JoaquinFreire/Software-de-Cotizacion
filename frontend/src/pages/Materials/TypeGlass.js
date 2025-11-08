import React, { useEffect, useState } from 'react';
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import { Square, Shield, Zap, Thermometer, Gem } from 'lucide-react';
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

    const [glasses, setGlasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const currency = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        axios.get(`${API_URL}/api/glass-types`, { headers })
            .then(resp => {
                if (!mounted) return;
                const items = safeArray(resp.data);
                const mapped = items.map((it, i) => ({
                    id: it.id ?? it._id ?? i,
                    name: it.name,
                    price: it.price ?? it.precio ?? 0,
                    description: it.description ?? '',
                    icon: <Square size={32} />,
                    color: "#06b6d4"
                }));
                setGlasses(mapped);
            })
            .catch(err => {
                console.error('Error GET /api/glass-types', err);
                if (axios.isAxiosError(err)) {
                    const resp = err.response;
                    const detail = resp?.data?.Message ?? resp?.data ?? resp?.statusText ?? err.message;
                    setError(`Error servidor ${resp?.status ?? ''}: ${detail}`);
                } else {
                    setError('Error desconocido al cargar tipos de vidrio.');
                }
            })
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, []);

    return (
        <div className="dashboard-container">
            <Navigation onLogout={handleLogout} />

            <div className="materials-header">
                <h2 className="materials-title">Tipos de Vidrios</h2>
                <p className="materials-subtitle">
                    Explore nuestra gama de vidrios especializados que ofrecen seguridad, eficiencia energética y diseño para cada proyecto
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
                    {glasses.map((glass) => (
                        <div key={glass.id} className="treatment-card" style={{ '--card-color': glass.color }}>
                            <div className="card-header">
                                <div className="icon-wrapper">{glass.icon}</div>
                                <h3 className="card-title">{glass.name}</h3>
                            </div>
                            <div className="card-content">
                                <p className="card-description">{glass.description}</p>
                                <div style={{ marginTop: 8, fontWeight: 700 }}>{currency.format(glass.price ?? 0)}</div>
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