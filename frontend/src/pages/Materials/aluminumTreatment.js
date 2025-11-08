import React, { useEffect, useState } from 'react';
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import { Shield, Zap, Palette, Droplets, Waves, Brush } from 'lucide-react';
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

    const [treatments, setTreatments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        axios.get(`${API_URL}/api/alum-treatments`, { headers })
            .then(resp => {
                if (!mounted) return;
                const items = safeArray(resp.data);
                const mapped = items.map((it, i) => ({
                    id: it.id ?? it._id ?? i,
                    name: it.name,
                    pricePercentage: it.pricePercentage ?? it.price ?? 0,
                    description: it.description ?? '',
                    icon: <Brush size={32} />,
                    color: "#8b5cf6"
                }));
                setTreatments(mapped);
            })
            .catch(err => {
                console.error('Error GET /api/alum-treatments', err);
                if (axios.isAxiosError(err)) {
                    const resp = err.response;
                    const detail = resp?.data?.Message ?? resp?.data ?? resp?.statusText ?? err.message;
                    setError(`Error servidor ${resp?.status ?? ''}: ${detail}`);
                } else {
                    setError('Error desconocido al cargar los tratamientos de aluminio.');
                }
            })
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, []);

    return (
        <div className="dashboard-container">
            <Navigation onLogout={handleLogout} />

            <div className="materials-header">
                <h2 className="materials-title">Tratamiento de Aluminio</h2>
                <p className="materials-subtitle">
                    Descubra los diferentes procesos de tratamiento que mejoran la durabilidad, estética y resistencia del aluminio
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
                    {treatments.map((treatment) => (
                        <div key={treatment.id} className="treatment-card" style={{ '--card-color': treatment.color }}>
                            <div className="card-header">
                                <div className="icon-wrapper">{treatment.icon}</div>
                                <h3 className="card-title">{treatment.name}</h3>
                            </div>
                            <div className="card-content">
                                <p className="card-description">{treatment.description}</p>
                                <div style={{ marginTop: 8, fontWeight: 700 }}>{treatment.pricePercentage}%</div>
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