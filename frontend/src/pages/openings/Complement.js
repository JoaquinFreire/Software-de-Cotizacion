import React, { useEffect, useState, useMemo } from 'react';
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import { DoorOpen, Grid3X3, Ruler, Building, Search, X, Filter, Check } from 'lucide-react';
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

    const [complements, setComplements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Estados para filtros
    const [query, setQuery] = useState('');
    const [selectedTypes, setSelectedTypes] = useState({ door: true, partition: true, railing: true });
    const [selectedItems, setSelectedItems] = useState({});
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    const currency = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // pedir los tres endpoints en paralelo con axios y token
        Promise.all([
            axios.get(`${API_URL}/api/door`, { headers }).then(r => r.data).catch(err => { throw err }),
            axios.get(`${API_URL}/api/partition`, { headers }).then(r => r.data).catch(err => { throw err }),
            axios.get(`${API_URL}/api/railing`, { headers }).then(r => r.data).catch(err => { throw err })
        ])
            .then(([doorsResp, partitionsResp, railingsResp]) => {
                if (!mounted) return;
                const doors = safeArray(doorsResp);
                const partitions = safeArray(partitionsResp);
                const railings = safeArray(railingsResp);

                const mapped = [];

                // Mapear puertas
                if (Array.isArray(doors)) {
                    doors.forEach(d => {
                        mapped.push({
                            key: `door-${d.id ?? d._id ?? Math.random()}`,
                            type: 'door',
                            icon: <DoorOpen size={32} />,
                            title: d.name ?? 'Puerta',
                            price: d.price ?? 0,
                            material: d.Material ?? d.material ?? null,
                            features: [
                                d.Material ? `Material: ${d.Material}` : null,
                                d.price ? `Precio: ${currency.format(d.price)}` : null
                            ].filter(Boolean),
                            color: '#ef4444'
                        });
                    });
                }

                // Mapear tabiques (partitions)
                if (Array.isArray(partitions)) {
                    partitions.forEach(p => {
                        mapped.push({
                            key: `partition-${p.id ?? p._id ?? Math.random()}`,
                            type: 'partition',
                            icon: <Grid3X3 size={32} />,
                            title: p.name ?? 'Tabique Tecno',
                            price: p.price ?? 0,
                            material: null,
                            features: [
                                `Precio: ${currency.format(p.price ?? 0)}`,
                                "Compatible con vidrio simple/doble y panelería alterna",
                                "Fácil colocación y opciones estéticas (rectas/curvas)"
                            ],
                            color: '#3b82f6'
                        });
                    });
                }

                // Mapear barandas (railings)
                if (Array.isArray(railings)) {
                    railings.forEach(r => {
                        // Distinción entre distintos diseños -> poner títulos sugeridos según nombre
                        const titleGuess = (r.name || '').toLowerCase().includes('imperia') ? 'Baranda Imperia' :
                            (r.name || '').toLowerCase().includes('city') ? 'Baranda City' :
                                r.name ?? 'Baranda';
                        mapped.push({
                            key: `railing-${r.id ?? r._id ?? Math.random()}`,
                            type: 'railing',
                            icon: (titleGuess.toLowerCase().includes('imperia') ? <Ruler size={32} /> : <Building size={32} />),
                            title: titleGuess,
                            name: r.name,
                            price: r.price ?? 0,
                            material: null,
                            features: [
                                r.price ? `Precio: ${currency.format(r.price)}` : null,
                                titleGuess.toLowerCase().includes('imperia') ? "Vidrio empotrado sin parantes verticales" : "Perfilería de aluminio a la vista",
                                "Posibilidad de colocación en frente de losa"
                            ].filter(Boolean),
                            color: titleGuess.toLowerCase().includes('imperia') ? '#10b981' : '#f59e0b'
                        });
                    });
                }

                setComplements(mapped);
            })
            .catch(err => {
                if (!mounted) return;
                // si es axios y 401 -> redirigir como en TypeLine
                if (axios.isAxiosError(err) && err.response?.status === 401) {
                    console.warn("No autorizado, redirigiendo al login");
                    localStorage.removeItem("token");
                    navigate("/");
                    return;
                }
                console.error(err);
                setError('No se pudo cargar los complementos. Verifique la conexión con el servidor.');
            })
            .finally(() => {
                if (!mounted) return;
                setLoading(false);
            });

        return () => { mounted = false; };
    }, [navigate]);

    // Mantener selección inicial cuando se cargan complements
    useEffect(() => {
        if (!complements || complements.length === 0) return;
        const map = {};
        complements.forEach(c => { map[c.key] = selectedItems[c.key] ?? true; });
        setSelectedItems(map);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [complements]);

    // Conteos por tipo para mostrar en toggles
    const counts = useMemo(() => {
        return complements.reduce((acc, c) => {
            acc[c.type] = (acc[c.type] || 0) + 1;
            return acc;
        }, { door: 0, partition: 0, railing: 0 });
    }, [complements]);

    // Filtrado en memoria: por tipo, por query (title/name/features) y por selección individual
    const visibleComplements = useMemo(() => {
        const q = (query || '').trim().toLowerCase();
        return complements.filter(c => {
            if (!selectedTypes[c.type]) return false;
            if (!selectedItems[c.key]) return false;
            if (!q) return true;
            const hay = [
                c.title, c.name, ...(c.features || [])
            ].filter(Boolean).some(s => String(s).toLowerCase().includes(q));
            return hay;
        });
    }, [complements, query, selectedTypes, selectedItems]);

    const totalSelected = useMemo(() => Object.values(selectedItems).filter(Boolean).length, [selectedItems]);

    // Handlers para toggles y selección
    const toggleType = (type) => setSelectedTypes(prev => ({ ...prev, [type]: !prev[type] }));
    const toggleItem = (key) => setSelectedItems(prev => ({ ...prev, [key]: !prev[key] }));
    const clearSearch = () => setQuery('');

    // 🔥 NUEVOS HANDLERS QUE FALTABAN
    const selectAll = () => {
        const newSelection = {};
        complements.forEach(c => {
            newSelection[c.key] = true;
        });
        setSelectedItems(newSelection);
    };

    const clearAll = () => {
        setSelectedItems({});
    };

    const selectAllByType = (type) => {
        const newSelection = { ...selectedItems };
        complements
            .filter(c => c.type === type)
            .forEach(c => {
                newSelection[c.key] = true;
            });
        setSelectedItems(newSelection);
    };

    const clearAllByType = (type) => {
        const newSelection = { ...selectedItems };
        complements
            .filter(c => c.type === type)
            .forEach(c => {
                newSelection[c.key] = false;
            });
        setSelectedItems(newSelection);
    };

    // Handler para el botón de filtros móviles
    const toggleMobileFilters = () => {
        setShowMobileFilters(prev => !prev);
    };

    // Handler para cerrar filtros móviles
    const closeMobileFilters = () => {
        setShowMobileFilters(false);
    };

    return (
        <div className="dashboard-container">
            <Navigation onLogout={handleLogout} />

            <div className="materials-header">
                <h2 className="materials-title">Tipos de Complementos</h2>
                <p className="materials-subtitle">
                    Descubra nuestra gama completa de complementos especializados
                </p>
            </div>

            {/* 🔥 NUEVO SISTEMA DE FILTROS - MEJORADO */}
            <div className="filters-container">
                {/* Barra superior de búsqueda y controles */}
                <div className="filters-top-bar">
                    <div className="search-container">
                        <Search size={20} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Buscar complementos..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="search-input"
                        />
                        {query && (
                            <button onClick={clearSearch} className="clear-search-btn">
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    <div className="filters-controls">
                        <div className="selection-counter">
                            <Check size={16} />
                            <span>{totalSelected} seleccionados</span>
                        </div>

                        <button
                            className="mobile-filter-btn"
                            onClick={() => setShowMobileFilters(!showMobileFilters)}
                        >
                            <Filter size={18} />
                            Filtros
                        </button>
                    </div>
                </div>

                {/* Filtros por tipo - Desktop */}
                <div className="type-filters-desktop">
                    <div className="filter-group">
                        <span className="filter-label">Filtrar por tipo:</span>
                        <div className="type-buttons">
                            <button
                                className={`type-btn ${selectedTypes.door ? 'active' : ''}`}
                                onClick={() => toggleType('door')}
                            >
                                <DoorOpen size={16} />
                                Puertas ({counts.door})
                            </button>
                            <button
                                className={`type-btn ${selectedTypes.partition ? 'active' : ''}`}
                                onClick={() => toggleType('partition')}
                            >
                                <Grid3X3 size={16} />
                                Tabiques ({counts.partition})
                            </button>
                            <button
                                className={`type-btn ${selectedTypes.railing ? 'active' : ''}`}
                                onClick={() => toggleType('railing')}
                            >
                                <Ruler size={16} />
                                Barandas ({counts.railing})
                            </button>
                        </div>
                    </div>

                    <div className="bulk-actions">
                        <span className="filter-label">Acciones rápidas:</span>
                        <div className="action-buttons">
                            <button
                                className="action-btn select-all"
                                onClick={() => setSelectedItems(Object.fromEntries(complements.map(c => [c.key, true])))}
                            >
                                Seleccionar todos
                            </button>
                            <button
                                className="action-btn clear-all"
                                onClick={() => setSelectedItems({})}
                            >
                                Limpiar selección
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filtros móviles */}
                {showMobileFilters && (
                    <div className="type-filters-mobile">
                        <div className="mobile-filter-header">
                            <h3>Filtros</h3>
                            <button onClick={() => setShowMobileFilters(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="mobile-filter-content">
                            <div className="filter-section">
                                <label className="filter-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={selectedTypes.door}
                                        onChange={() => toggleType('door')}
                                    />
                                    <span className="checkmark"></span>
                                    Puertas ({counts.door})
                                </label>
                                <label className="filter-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={selectedTypes.partition}
                                        onChange={() => toggleType('partition')}
                                    />
                                    <span className="checkmark"></span>
                                    Tabiques ({counts.partition})
                                </label>
                                <label className="filter-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={selectedTypes.railing}
                                        onChange={() => toggleType('railing')}
                                    />
                                    <span className="checkmark"></span>
                                    Barandas ({counts.railing})
                                </label>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Estados de carga / error */}
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

            {/* Grid de complementos */}
            {!loading && !error && (
                <div className="complements-grid">
                    {complements.length === 0 && (
                        <div className="empty-state">No hay complementos para mostrar.</div>
                    )}

                    {complements.length > 0 && visibleComplements.length === 0 && (
                        <div className="empty-state">No hay resultados para tu búsqueda/selección.</div>
                    )}

                    {visibleComplements.map((complement) => (
                        <div key={complement.key} className="complement-card">
                            <div className="complement-header">
                                <div className="complement-icon" style={{ color: complement.color }}>
                                    {complement.icon}
                                </div>
                                <div className="complement-info">
                                    <h3 className="complement-title">
                                        {complement.title}
                                        {complement.name && <span className="complement-subtitle"> — {complement.name}</span>}
                                    </h3>
                                    <div className="complement-type">{complement.type.toUpperCase()}</div>
                                </div>
                                <div className="complement-price">
                                    <div className="price">{currency.format(complement.price ?? 0)}</div>
                                    {complement.material && <div className="material">{complement.material}</div>}
                                </div>
                            </div>

                            <div className="complement-features">
                                <ul>
                                    {complement.features?.slice(0, 3).map((f, idx) => (
                                        <li key={idx}>{f}</li>
                                    ))}
                                    {complement.features && complement.features.length > 3 && (
                                        <li className="more-features">+{complement.features.length - 3} más</li>
                                    )}
                                </ul>
                            </div>

                            <div className="complement-actions">
                                <label className="selection-toggle">
                                    <input
                                        type="checkbox"
                                        checked={!!selectedItems[complement.key]}
                                        onChange={() => toggleItem(complement.key)}
                                    />
                                    <span className="toggle-slider"></span>
                                    <span className="toggle-label">
                                        {selectedItems[complement.key] ? 'Seleccionado' : 'Incluir'}
                                    </span>
                                </label>
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