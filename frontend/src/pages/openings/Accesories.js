import React, { useEffect, useState } from 'react';
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import { Key, DoorClosed, Eye, Lock, Anchor, RotateCcw, Wrench } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { safeArray } from '../../utils/safeArray';
import ReactLoading from 'react-loading';
const API_URL = process.env.REACT_APP_API_URL ?? '';

const Aberturas = () => {
    const navigate = useNavigate();
        
    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    // estados
    const [accessories, setAccessories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // formateador de precio
    const currency = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

    // icon mapper sencillo por nombre
    const getIcon = (name) => {
        const n = (name || '').toLowerCase();
        if (n.includes('cerradur') || n.includes('electr')) return <Key size={32} />;
        if (n.includes('bisagr')) return <DoorClosed size={32} />;
        if (n.includes('mirill') || n.includes('ojo')) return <Eye size={32} />;
        if (n.includes('pestill') || n.includes('cerroj') || n.includes('cerradur')) return <Lock size={32} />;
        if (n.includes('tope') || n.includes('ancla') || n.includes('ancl')) return <Anchor size={32} />;
        if (n.includes('cierrapuerta') || n.includes('cierrapuerta')) return <RotateCcw size={32} />;
        return <Wrench size={32} />;
    };

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        axios.get(`${API_URL}/api/accessories`, { headers })
            .then(resp => {
                if (!mounted) return;
                const items = safeArray(resp.data);
                // normalizar estructura mínima para renderizar
                const mapped = items.map(a => ({
                    key: `accessory-${a.id ?? a._id ?? Math.random()}`,
                    id: a.id,
                    title: a.name,
                    price: a.price ?? 0,
                    icon: getIcon(a.name),
                    color: '#06b6d4', // color uniforme o según tipo si se desea
                    description: a.description ?? ''
                }));
                setAccessories(mapped);
            })
            .catch(err => {
                if (!mounted) return;
                if (axios.isAxiosError(err) && err.response?.status === 401) {
                    localStorage.removeItem("token");
                    navigate("/");
                    return;
                }
                console.error(err);
                setError('No se pudieron cargar los accesorios. Verifique la conexión con el servidor.');
            })
            .finally(() => {
                if (!mounted) return;
                setLoading(false);
            });

        return () => { mounted = false; };
    }, [navigate]);

    return (
        <div className="dashboard-container">
            <Navigation onLogout={handleLogout} />
            
            <div className="materials-header">
                <h2 className="materials-title">Tipos de Accesorios</h2>
                <p className="materials-subtitle">
                    Conozca nuestra selección de accesorios que mejoran la seguridad, funcionalidad y durabilidad
                </p>
            </div>

            {loading && (
                <div className="spinner-container">
                    <ReactLoading type="spin" color="#26b7cd" height={34} width={34} />
                </div>
            )}

            {error && (
                <div className="error-state">
                    {error}
                </div>
            )}

            {!loading && !error && (
                <div className="complements-grid">
                    {accessories.length === 0 && (
                        <div className="empty-state">No hay accesorios para mostrar.</div>
                    )}

                    {accessories.map((acc) => (
                        <div key={acc.key} className="complement-card">
                            <div className="complement-header">
                                <div className="complement-icon" style={{ color: acc.color }}>
                                    {acc.icon}
                                </div>
                                <div className="complement-info">
                                    <h3 className="complement-title">{acc.title}</h3>
                                    <div className="complement-type">ACCESORIO</div>
                                </div>
                                <div className="complement-price">
                                    <div className="price">{currency.format(acc.price)}</div>
                                </div>
                            </div>

                            <div className="complement-features">
                                {acc.description ? (
                                    <p style={{ margin: 0, color: '#cbd5e1' }}>{acc.description}</p>
                                ) : (
                                    <ul>
                                        <li>Alta calidad y durabilidad</li>
                                        <li>Compatibilidad con nuestras aberturas</li>
                                    </ul>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            <Footer />
        </div>
    );
};

export default Aberturas;