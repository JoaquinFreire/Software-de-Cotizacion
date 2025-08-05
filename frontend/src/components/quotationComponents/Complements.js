import React, { useState, useEffect } from 'react';
import axios from 'axios';

const COMPLEMENT_TYPES = [
    { key: 'door', label: 'Complemento de puerta' },
    { key: 'partition', label: 'Complemento de tabique' },
    { key: 'railing', label: 'Complemento de baranda' }
];

const initialRow = { type: '', complementId: '', quantity: '', custom: {} };

const Complements = ({
    complementDoors = [],
    complementPartitions = [],
    complementRailings = [],
    selectedComplements,
    setSelectedComplements
}) => {
    const [rows, setRows] = useState(selectedComplements.length > 0 ? selectedComplements : [ { ...initialRow } ]);
    const [errors, setErrors] = useState([]);
    const [coatings, setCoatings] = useState([]);
    const [alumTreatments, setAlumTreatments] = useState([]);
    const emptyAcc = { name: '', quantity: 1, price: '' };

    // Sincroniza con el estado externo
    useEffect(() => {
        setSelectedComplements(
            rows.filter(row => row.type && row.complementId && Number(row.quantity) > 0)
        );
    }, [rows, setSelectedComplements]);

    const getComplementsByType = (type) => {
        if (type === 'door') return complementDoors;
        if (type === 'partition') return complementPartitions;
        if (type === 'railing') return complementRailings;
        return [];
    };

    const getComplementById = (type, id) => {
        // Soporta id o Id
        return getComplementsByType(type).find(
            c => String(c.id ?? c.Id) === String(id)
        );
    };

    const handleRowChange = (idx, field, value) => {
        setRows(rows =>
            rows.map((row, i) =>
                i === idx ? { ...row, [field]: value } : row
            )
        );
    };

    const handleCustomChange = (idx, field, value) => {
        setRows(rows =>
            rows.map((row, i) =>
                i === idx ? { ...row, custom: { ...row.custom, [field]: value } } : row
            )
        );
    };

    const handleAddRow = () => {
        setRows(rows => [...rows, { ...initialRow }]);
    };

    const handleRemoveRow = (idx) => {
        setRows(rows => rows.filter((_, i) => i !== idx));
    };

    // Accesorios para doors
    const handleAddAcc = (rowIdx) => {
        setRows(rows =>
            rows.map((row, i) =>
                i === rowIdx
                    ? { ...row, custom: { ...row.custom, accesories: [ ...(row.custom.accesories || []), { ...emptyAcc } ] } }
                    : row
            )
        );
    };
    const handleRemoveAcc = (rowIdx, accIdx) => {
        setRows(rows =>
            rows.map((row, i) =>
                i === rowIdx
                    ? { ...row, custom: { ...row.custom, accesories: (row.custom.accesories || []).filter((_, j) => j !== accIdx) } }
                    : row
            )
        );
    };
    const handleAccChange = (rowIdx, accIdx, field, value) => {
        setRows(rows =>
            rows.map((row, i) =>
                i === rowIdx
                    ? {
                        ...row,
                        custom: {
                            ...row.custom,
                            accesories: (row.custom.accesories || []).map((acc, j) =>
                                j === accIdx ? { ...acc, [field]: value } : acc
                            )
                        }
                    }
                    : row
            )
        );
    };

    const validateRow = (row) => {
        if (!row.type) return 'Seleccione el tipo de complemento';
        if (!row.complementId) return 'Seleccione el complemento';
        if (!row.quantity || Number(row.quantity) <= 0) return 'Ingrese una cantidad/medida válida';
        if (row.type === 'door' && !Number.isInteger(Number(row.quantity))) return 'La cantidad debe ser un número entero';
        // Validaciones personalizadas por tipo
        if (row.type === 'door') {
            if (!row.custom.width || !row.custom.height) return 'Ingrese ancho y alto';
            if (!row.custom.coating) return 'Seleccione un revestimiento';
        }
        if (row.type === 'partition') {
            if (!row.custom.height) return 'Ingrese alto';
            if (!row.custom.glassMilimeters) return 'Ingrese espesor de vidrio';
        }
        if (row.type === 'railing') {
            if (!row.custom.treatment) return 'Seleccione tratamiento';
        }
        return '';
    };

    useEffect(() => {
        setErrors(rows.map(validateRow));
    }, [rows]);

    // Traer revestimientos desde la API
    useEffect(() => {
        const fetchCoatings = async () => {
            try {
                const token = localStorage.getItem('token');
                const API_URL = process.env.REACT_APP_API_URL;
                const res = await axios.get(`${API_URL}/api/coating`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCoatings(res.data);
            } catch (err) {
                setCoatings([]);
            }
        };
        fetchCoatings();
    }, []);

    // Traer tratamientos de aluminio desde la API
    useEffect(() => {
        const fetchAlumTreatments = async () => {
            try {
                const token = localStorage.getItem('token');
                const API_URL = process.env.REACT_APP_API_URL;
                const res = await axios.get(`${API_URL}/api/alum-treatments`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAlumTreatments(res.data);
            } catch (err) {
                setAlumTreatments([]);
            }
        };
        fetchAlumTreatments();
    }, []);

    return (
        <div className="complements-container">
            <h3>Complementos</h3>
            <div>
                {rows.map((row, idx) => {
                    const complement = getComplementById(row.type, row.complementId);
                    return (
                        <div key={idx} className="complement-row" style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12, border: '1px solid #eee', padding: 8, borderRadius: 6 }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                {/* Tipo de complemento */}
                                <select
                                    value={row.type}
                                    onChange={e => {
                                        handleRowChange(idx, 'type', e.target.value);
                                        handleRowChange(idx, 'complementId', '');
                                        handleRowChange(idx, 'custom', {});
                                    }}
                                >
                                    <option value="">Tipo</option>
                                    {COMPLEMENT_TYPES.map(opt => (
                                        <option key={opt.key} value={opt.key}>{opt.label}</option>
                                    ))}
                                </select>
                                {/* Complemento */}
                                <select
                                    value={row.complementId}
                                    onChange={e => handleRowChange(idx, 'complementId', e.target.value)}
                                    disabled={!row.type}
                                >
                                    <option value="">Complemento</option>
                                    {getComplementsByType(row.type).map(c => (
                                        <option
                                            key={c.id ?? c.Id}
                                            value={c.id ?? c.Id}
                                        >
                                            {c.name} - ${c.price}{row.type === 'door' && c.Material ? ` - ${c.Material}` : ''}
                                        </option>
                                    ))}
                                </select>
                                {/* Eliminar fila */}
                                <button type="button" onClick={() => handleRemoveRow(idx)} disabled={rows.length === 1}>🗑️</button>
                                {/* Error */}
                                {errors[idx] && <span style={{ color: 'red', fontSize: 12 }}>{errors[idx]}</span>}
                            </div>
                            {/* Campos personalizados por tipo */}
                            {row.type === 'door' && complement && (
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        placeholder="Cantidad"
                                        value={row.quantity}
                                        onChange={e => handleRowChange(idx, 'quantity', e.target.value)}
                                        style={{ width: 80 }}
                                    />
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        placeholder="Ancho (cm)"
                                        value={row.custom.width || ''}
                                        onChange={e => handleCustomChange(idx, 'width', e.target.value)}
                                        style={{ width: 100 }}
                                    />
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        placeholder="Alto (cm)"
                                        value={row.custom.height || ''}
                                        onChange={e => handleCustomChange(idx, 'height', e.target.value)}
                                        style={{ width: 100 }}
                                    />
                                    <select
                                        value={row.custom.coating || ''}
                                        onChange={e => handleCustomChange(idx, 'coating', e.target.value)}
                                    >
                                        <option value="">Revestimiento</option>
                                        {coatings.map(c => (
                                            <option key={c.id} value={c.id}>{c.name} - ${c.price}</option>
                                        ))}
                                    </select>
                                    {/* Accesorios */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <span>Accesorios:</span>
                                        {(row.custom.accesories || []).map((acc, accIdx) => (
                                            <div key={accIdx} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                                <input
                                                    type="text"
                                                    placeholder="Nombre"
                                                    value={acc.name}
                                                    onChange={e => handleAccChange(idx, accIdx, 'name', e.target.value)}
                                                    style={{ width: 90 }}
                                                />
                                                <input
                                                    type="number"
                                                    min="1"
                                                    step="1"
                                                    placeholder="Cantidad"
                                                    value={acc.quantity}
                                                    onChange={e => handleAccChange(idx, accIdx, 'quantity', e.target.value)}
                                                    style={{ width: 60 }}
                                                />
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    placeholder="Precio"
                                                    value={acc.price}
                                                    onChange={e => handleAccChange(idx, accIdx, 'price', e.target.value)}
                                                    style={{ width: 70 }}
                                                />
                                                <button type="button" onClick={() => handleRemoveAcc(idx, accIdx)}>🗑️</button>
                                            </div>
                                        ))}
                                        <button type="button" onClick={() => handleAddAcc(idx)}>+ Accesorio</button>
                                    </div>
                                </div>
                            )}
                            {row.type === 'partition' && complement && (
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                    {/* Alto */}
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        placeholder="Alto (cm)"
                                        value={row.custom.height || ''}
                                        onChange={e => handleCustomChange(idx, 'height', e.target.value)}
                                        style={{ width: 100 }}
                                    />
                                    {/* Cantidad */}
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        placeholder="Cantidad"
                                        value={row.quantity}
                                        onChange={e => handleRowChange(idx, 'quantity', e.target.value)}
                                        style={{ width: 80 }}
                                    />
                                    {/* Simple */}
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={!!row.custom.simple}
                                            onChange={e => handleCustomChange(idx, 'simple', e.target.checked)}
                                        />
                                        Simple
                                    </label>
                                    {/* Espesor vidrio */}
                                    <select
                                        value={row.custom.glassMilimeters || ''}
                                        onChange={e => handleCustomChange(idx, 'glassMilimeters', e.target.value)}
                                        style={{ width: 120 }}
                                    >
                                        <option value="">Espesor vidrio (mm)</option>
                                        <option value="6">6 mm</option>
                                        <option value="8">8 mm</option>
                                        <option value="10">10 mm</option>
                                    </select>
                                </div>
                            )}
                            {row.type === 'railing' && complement && (
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        placeholder="Cantidad"
                                        value={row.quantity}
                                        onChange={e => handleRowChange(idx, 'quantity', e.target.value)}
                                        style={{ width: 80 }}
                                    />
                                    <select
                                        value={row.custom.treatment || ''}
                                        onChange={e => handleCustomChange(idx, 'treatment', e.target.value)}
                                    >
                                        <option value="">Tratamiento</option>
                                        {alumTreatments.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={!!row.custom.reinforced}
                                            onChange={e => handleCustomChange(idx, 'reinforced', e.target.checked)}
                                        />
                                        Reforzado
                                    </label>
                                </div>
                            )}
                        </div>
                    );
                })}
                <button type="button" className="botton-carusel" onClick={handleAddRow}>
                    + Agregar complemento
                </button>
            </div>
        </div>
    );
};

export default Complements;