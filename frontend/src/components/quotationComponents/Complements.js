import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { safeArray } from '../../utils/safeArray';

const COMPLEMENT_TYPES = [
    { key: 'door', label: 'Complemento de puerta' },
    { key: 'partition', label: 'Complemento de tabique' },
    { key: 'railing', label: 'Complemento de baranda' }
];

const initialRow = { type: '', complementId: '', quantity: 1, custom: {} };

const Complements = ({
    complementDoors = [],
    complementPartitions = [],
    complementRailings = [],
    selectedComplements,
    setSelectedComplements,
    isVersion = false
}) => {
    const [rows, setRows] = useState([{ ...initialRow }]);
    const [errors, setErrors] = useState([]);
    const [coatings, setCoatings] = useState([]);
    const [alumTreatments, setAlumTreatments] = useState([]);
    const [accesories, setAccesories] = useState([]);
    const [touchedRows, setTouchedRows] = useState([]);
    const emptyAcc = { name: '', quantity: 1, price: '' };

    useEffect(() => {
        setTouchedRows(rows.map(() => false));
    }, [rows]);

    const getComplementsByType = (type) => {
        if (type === 'door') return complementDoors;
        if (type === 'partition') return complementPartitions;
        if (type === 'railing') return complementRailings;
        return [];
    };

    const getComplementById = (type, id) => {
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

    const handleAccChange = (rowIdx, accIdx, field, value) => {
        setRows(rows =>
            rows.map((row, i) =>
                i === rowIdx
                    ? {
                        ...row,
                        custom: {
                            ...row.custom,
                            accesories: (row.custom.accesories || []).map((acc, j) => {
                                if (j !== accIdx) return acc;
                                const newAcc = { ...acc, [field]: value };
                                if (field === 'name') {
                                    const found = safeArray(accesories).find(a => a.name === value || String(a.id) === String(value));
                                    newAcc.price = found ? Number(found.price || found.Price || 0) : '';
                                }
                                return newAcc;
                            })
                        }
                    }
                    : row
            )
        );
    };

    const handleAddRow = () => {
        setRows(rows => [...rows, { ...initialRow }]);
        setTouchedRows(touched => [...touched, false]);
    };

    const handleRemoveRow = (idx) => {
        setRows(rows => rows.filter((_, i) => i !== idx));
        setTouchedRows(touched => touched.filter((_, i) => i !== idx));
    };

    const handleTryAddComplement = (idx) => {
        setTouchedRows(touched => touched.map((t, i) => i === idx ? true : t));
    };

    const handleAddAcc = (rowIdx) => {
        setRows(rows =>
            rows.map((row, i) =>
                i === rowIdx
                    ? { ...row, custom: { ...row.custom, accesories: [...(row.custom.accesories || []), { ...emptyAcc }] } }
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

    const validateRow = (row) => {
        if (!row.type) return 'Seleccione el tipo de complemento';
        if (!row.complementId) return 'Seleccione el complemento';
        if (!row.quantity || Number(row.quantity) <= 0) return 'Ingrese una cantidad/medida válida';
        if (row.type === 'door' && !Number.isInteger(Number(row.quantity))) return 'La cantidad debe ser un número entero';
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

    useEffect(() => {
        const fetchCoatings = async () => {
            try {
                const token = localStorage.getItem('token');
                const API_URL = process.env.REACT_APP_API_URL;
                const res = await axios.get(`${API_URL}/api/coating`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCoatings(safeArray(res.data));
            } catch (err) {
                setCoatings([]);
            }
        };
        fetchCoatings();
    }, []);

    useEffect(() => {
        const fetchAlumTreatments = async () => {
            try {
                const token = localStorage.getItem('token');
                const API_URL = process.env.REACT_APP_API_URL;
                const res = await axios.get(`${API_URL}/api/alum-treatments`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAlumTreatments(safeArray(res.data));
            } catch (err) {
                setAlumTreatments([]);
            }
        };
        fetchAlumTreatments();
    }, []);

    useEffect(() => {
        const fetchAccesories = async () => {
            try {
                const token = localStorage.getItem('token');
                const API_URL = process.env.REACT_APP_API_URL;
                const res = await axios.get(`${API_URL}/api/accessories`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAccesories(safeArray(res.data));
            } catch (err) {
                setAccesories([]);
            }
        };
        fetchAccesories();
    }, []);

    const computeDoorUnitPrice = (row, complement) => {
        const basePrice = Number(complement?.price || complement?.Price || 0);
        const baseWidth = 90;
        const baseHeight = 210;
        const areaBase = baseWidth * baseHeight;
        const width = Number(row.custom.width || baseWidth);
        const height = Number(row.custom.height || baseHeight);
        const area = Math.max(1, width * height);
        const unitPriceByArea = basePrice * (area / areaBase);
        const coatingObj = safeArray(coatings).find(c => String(c.id) === String(row.custom.coating));
        const coatingMultiplier = coatingObj ? (1 + (Number(coatingObj.price || 0) / 100)) : 1;
        const priceWithoutAccessories = unitPriceByArea * coatingMultiplier;
        return priceWithoutAccessories;
    };

    const computeAccesoriesTotal = (row) => {
        const accs = row.custom.accesories || [];
        return accs.reduce((acc, a) => {
            const qty = Number(a.quantity || 0);
            const price = Number(a.price || 0);
            return acc + (qty * price);
        }, 0);
    };

    const computeDoorBreakdown = (row, complement) => {
        const basePrice = Number(complement?.price || complement?.Price || 0);
        const baseWidth = 90;
        const baseHeight = 210;
        const areaBase = baseWidth * baseHeight;

        const width = Number(row.custom?.width || baseWidth);
        const height = Number(row.custom?.height || baseHeight);
        const area = Math.max(1, width * height);

        const areaFactor = area / areaBase;
        const areaPrice = basePrice * areaFactor;

        const coatingObj = safeArray(coatings).find(c => String(c.id) === String(row.custom?.coating));
        const coatingPct = coatingObj ? Number(coatingObj.price || 0) : 0;
        const coatingPrice = areaPrice * (coatingPct / 100);

        const accessoriesTotal = computeAccesoriesTotal(row) || 0;

        const unitWithoutAccessories = areaPrice + coatingPrice;
        const quantity = Number(row.quantity || 1);
        const totalPrice = (unitWithoutAccessories * quantity) + accessoriesTotal;

        return {
            basePrice,
            areaFactor,
            areaPrice,
            coatingPct,
            coatingPrice,
            accessoriesTotal,
            unitWithoutAccessories,
            totalPrice,
            width,
            height,
            quantity
        };
    };

    const computePartitionUnitPrice = (row, complement) => {
        const basePrice = Number(complement?.price || complement?.Price || 0);
        const heightCm = Number(row.custom?.height || 100);
        let unit = basePrice * (heightCm / 100);
        const isSimple = !!row.custom?.simple;
        if (!isSimple) {
            unit = unit * 1.15;
        }
        const glassMm = row.custom?.glassMilimeters;
        if (glassMm) {
            if (String(glassMm).includes('6') || String(glassMm) === '6') unit = unit * 1.0;
            if (String(glassMm).includes('8') || String(glassMm) === '8') unit = unit * 1.15;
            if (String(glassMm).includes('10') || String(glassMm) === '10') unit = unit * 1.30;
        }
        return unit;
    };

    const computePartitionBreakdown = (row, complement) => {
        const basePrice = Number(complement?.price || complement?.Price || 0);
        const height = Number(row.custom?.height || 100);
        const factor = height / 100;
        const priceByHeight = basePrice * factor;
        const isSimple = !!row.custom?.simple;
        const simpleLabel = isSimple ? 'Simple' : 'Doble';
        let afterSimple = isSimple ? priceByHeight : priceByHeight * 1.15;
        const glassMm = row.custom?.glassMilimeters;
        let glassPct = 0;
        let afterGlass = afterSimple;
        if (glassMm) {
            if (String(glassMm).includes('6') || String(glassMm) === '6') { glassPct = 0; afterGlass = afterSimple * 1.0; }
            if (String(glassMm).includes('8') || String(glassMm) === '8') { glassPct = 15; afterGlass = afterSimple * 1.15; }
            if (String(glassMm).includes('10') || String(glassMm) === '10') { glassPct = 30; afterGlass = afterSimple * 1.30; }
        }
        const qty = Number(row.quantity || 1);
        const unit = afterGlass;
        const total = unit * qty;
        return { basePrice, height, factor, priceByHeight, simpleLabel, glassMm, glassPct, unit, qty, total };
    };

    const computeRailingUnitPrice = (row, complement) => {
        const basePrice = Number(complement?.price || complement?.Price || 0);
        let unit = basePrice;
        const name = (complement?.name || '').toLowerCase();

        if (row.custom?.reinforced) {
            if (name.includes('city')) {
                unit = unit * 1.05;
            } else if (name.includes('imperia')) {
                unit = unit * 1.15;
            } else {
                unit = unit * 1.05;
            }
        }

        const treatmentObj = safeArray(alumTreatments).find(t => String(t.id) === String(row.custom?.treatment));
        const treatmentPct = treatmentObj ? Number(treatmentObj.pricePercentage || treatmentObj.price || 0) : 0;
        const treatmentCost = unit * (treatmentPct / 100);

        const finalUnit = unit + treatmentCost;
        return Number(finalUnit);
    };

    const computeRailingBreakdown = (row, complement) => {
        const basePrice = Number(complement?.price || complement?.Price || 0);
        const name = (complement?.name || '');
        let afterReinforce = basePrice;
        let reinforcePct = 0;
        if (row.custom?.reinforced) {
            if (name.toLowerCase().includes('city')) { afterReinforce = basePrice * 1.05; reinforcePct = 5; }
            else if (name.toLowerCase().includes('imperia')) { afterReinforce = basePrice * 1.15; reinforcePct = 15; }
            else { afterReinforce = basePrice * 1.05; reinforcePct = 5; }
        }
        const treatmentObj = safeArray(alumTreatments).find(t => String(t.id) === String(row.custom?.treatment));
        const treatmentPct = treatmentObj ? Number(treatmentObj.pricePercentage || treatmentObj.price || 0) : 0;
        const treatmentCost = afterReinforce * (treatmentPct / 100);
        const qty = Number(row.quantity || 1);
        const unit = afterReinforce + treatmentCost;
        const total = unit * qty;
        return {
            basePrice,
            name,
            reinforcePct,
            afterReinforce,
            treatmentPct,
            treatmentCost,
            unit,
            qty,
            total
        };
    };

    const handleCreateComplement = (idx) => {
        const row = rows[idx];
        const err = validateRow(row);
        if (err) {
            setTouchedRows(t => t.map((val, i) => i === idx ? true : val));
            return;
        }

        if (isVersion) {
            // En modo versión, no verificar duplicados
            if (row.type === 'door') {
                const complement = getComplementById('door', row.complementId);
                const unitPrice = computeDoorUnitPrice(row, complement);
                const accessoriesTotal = computeAccesoriesTotal(row);
                const totalPrice = (unitPrice * Number(row.quantity || 1)) + accessoriesTotal;
                const newComp = {
                    type: 'door',
                    complementId: row.complementId,
                    quantity: Number(row.quantity || 1),
                    custom: { ...row.custom },
                    unitPrice: Number(unitPrice.toFixed(2)),
                    totalPrice: Number(totalPrice.toFixed(2)),
                    name: complement ? (complement.name || '') : ''
                };
                setSelectedComplements(prev => [...prev, newComp]);
                handleRemoveRow(idx);
                return;
            }
            if (row.type === 'partition') {
                const complement = getComplementById('partition', row.complementId);
                const unitPrice = computePartitionUnitPrice(row, complement);
                const totalPrice = unitPrice * Number(row.quantity || 1);
                const newComp = {
                    type: 'partition',
                    complementId: row.complementId,
                    quantity: Number(row.quantity || 1),
                    custom: { ...row.custom },
                    unitPrice: Number(unitPrice.toFixed(2)),
                    totalPrice: Number(totalPrice.toFixed(2)),
                    name: complement ? (complement.name || '') : ''
                };
                setSelectedComplements(prev => [...prev, newComp]);
                handleRemoveRow(idx);
                return;
            }
            if (row.type === 'railing') {
                const complement = getComplementById('railing', row.complementId);
                const unitPrice = computeRailingUnitPrice(row, complement);
                const totalPrice = unitPrice * Number(row.quantity || 1);
                const newComp = {
                    type: 'railing',
                    complementId: row.complementId,
                    quantity: Number(row.quantity || 1),
                    custom: { ...row.custom },
                    unitPrice: Number(unitPrice.toFixed(2)),
                    totalPrice: Number(totalPrice.toFixed(2)),
                    name: complement ? (complement.name || '') : ''
                };
                setSelectedComplements(prev => [...prev, newComp]);
                handleRemoveRow(idx);
                return;
            }
        } else {
            // Comportamiento original con verificación de duplicados
            if (row.type === 'door') {
                const complement = getComplementById('door', row.complementId);
                const unitPrice = computeDoorUnitPrice(row, complement);
                const accessoriesTotal = computeAccesoriesTotal(row);
                const totalPrice = (unitPrice * Number(row.quantity || 1)) + accessoriesTotal;
                const newComp = {
                    type: 'door',
                    complementId: row.complementId,
                    quantity: Number(row.quantity || 1),
                    custom: { ...row.custom },
                    unitPrice: Number(unitPrice.toFixed(2)),
                    totalPrice: Number(totalPrice.toFixed(2)),
                    name: complement ? (complement.name || '') : ''
                };
                setSelectedComplements(prev => [...prev, newComp]);
                handleRemoveRow(idx);
                return;
            }
            if (row.type === 'partition') {
                const complement = getComplementById('partition', row.complementId);
                const unitPrice = computePartitionUnitPrice(row, complement);
                const totalPrice = unitPrice * Number(row.quantity || 1);
                const newComp = {
                    type: 'partition',
                    complementId: row.complementId,
                    quantity: Number(row.quantity || 1),
                    custom: { ...row.custom },
                    unitPrice: Number(unitPrice.toFixed(2)),
                    totalPrice: Number(totalPrice.toFixed(2)),
                    name: complement ? (complement.name || '') : ''
                };
                setSelectedComplements(prev => [...prev, newComp]);
                handleRemoveRow(idx);
                return;
            }
            if (row.type === 'railing') {
                const complement = getComplementById('railing', row.complementId);
                const unitPrice = computeRailingUnitPrice(row, complement);
                const totalPrice = unitPrice * Number(row.quantity || 1);
                const newComp = {
                    type: 'railing',
                    complementId: row.complementId,
                    quantity: Number(row.quantity || 1),
                    custom: { ...row.custom },
                    unitPrice: Number(unitPrice.toFixed(2)),
                    totalPrice: Number(totalPrice.toFixed(2)),
                    name: complement ? (complement.name || '') : ''
                };
                setSelectedComplements(prev => [...prev, newComp]);
                handleRemoveRow(idx);
                return;
            }
        }

        const newCompOther = {
            type: row.type,
            complementId: row.complementId,
            quantity: Number(row.quantity || 1),
            custom: { ...row.custom },
            unitPrice: 0,
            totalPrice: 0,
            name: (getComplementById(row.type, row.complementId)?.name) || ''
        };
        setSelectedComplements(prev => [...prev, newCompOther]);
        handleRemoveRow(idx);
    };

    const handleComplementSelect = (idx, type, complementId) => {
        handleRowChange(idx, 'complementId', complementId);
        if (type === 'door') {
            const comp = getComplementById('door', complementId);
            const defaults = {
                width: 90,
                height: 210,
                coating: '',
                accesories: []
            };
            setRows(rows =>
                rows.map((row, i) =>
                    i === idx ? { ...row, quantity: 1, custom: { ...defaults, basePrice: comp ? Number(comp.price || 0) : 0 } } : row
                )
            );
        }
        if (type === 'partition') {
            const comp = getComplementById('partition', complementId);
            const defaults = {
                height: 100,
                simple: false,
                glassMilimeters: ''
            };
            setRows(rows =>
                rows.map((row, i) =>
                    i === idx ? { ...row, quantity: 1, custom: { ...defaults, basePrice: comp ? Number(comp.price || 0) : 0 } } : row
                )
            );
        }
    };

    const handleLoadComplements = async () => {
        try {
            const token = localStorage.getItem('token');
            const API_URL = process.env.REACT_APP_API_URL;
            if (!token || !API_URL) {
                console.warn('No token o API_URL para cargar complementos.');
                return;
            }
            const [coatingsRes, alumRes, accRes] = await Promise.all([
                axios.get(`${API_URL}/api/coating`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/api/alum-treatments`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/api/accessories`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setCoatings(safeArray(coatingsRes.data));
            setAlumTreatments(safeArray(alumRes.data));
            setAccesories(safeArray(accRes.data));
            console.log('Complementos recargados correctamente.');
        } catch (err) {
            console.error('Error al recargar complementos:', err);
        }
    };

    return (
        <div className="App">
            <div className="complements-container">
                <h3>Complementos</h3>
                <div>
                    {rows.map((row, idx) => {
                        const complement = getComplementById(row.type, row.complementId);
                        return (
                            <div key={idx} className="complement-row" style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 18, border: '0.2px solid #26b7cd', padding: 8, borderRadius: 6 }}>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
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
                                    <select
                                        value={row.complementId}
                                        onChange={e => handleComplementSelect(idx, row.type, e.target.value)}
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
                                </div>

                                {row.type === 'door' && complement && (
                                    <div>
                                        <div style={{ display: 'flex', gap: 36, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 }}>
                                            <h5> Cantidad </h5>
                                            <h5> Ancho(cm) </h5>
                                            <h5> Alto(cm) </h5>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
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
                                                {safeArray(coatings).map(c => (
                                                    <option key={c.id} value={c.id}>{c.name} - {c.price}%</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <button type="button" onClick={() => handleAddAcc(idx)} className='BottonAccesories'>+ Accesorio</button>
                                            {row.custom.accesories && row.custom.accesories.length > 0 && (
                                                <>
                                                    {row.custom.accesories.map((acc, accIdx) => (
                                                        <div key={accIdx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                                                            <select
                                                                value={acc.name || ''}
                                                                onChange={e => handleAccChange(idx, accIdx, 'name', e.target.value)}
                                                                style={{ width: 180 }}
                                                            >
                                                                <option value="">Seleccione accesorio</option>
                                                                {safeArray(accesories).map(a => (
                                                                    <option key={a.id} value={a.name}>{a.name} - ${a.price}</option>
                                                                ))}
                                                            </select>
                                                            <input
                                                                type="number"
                                                                placeholder="Cantidad"
                                                                min="1"
                                                                step="1"
                                                                value={acc.quantity}
                                                                onChange={e => handleAccChange(idx, accIdx, 'quantity', e.target.value)}
                                                                style={{ width: 80 }}
                                                            />
                                                            <button type="button" onClick={() => handleRemoveAcc(idx, accIdx)} className='BottonDelete'>🗑️</button>
                                                        </div>
                                                    ))}
                                                </>
                                            )}
                                        </div>

                                        <div style={{ marginTop: 8, padding: 8, borderRadius: 6 }}>
                                            {(() => {
                                                const d = computeDoorBreakdown(row, complement);
                                                return (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                        <div><strong>Base (90×210):</strong> ${d.basePrice.toFixed(2)}</div>
                                                        <div><strong>Tamaño:</strong> {d.width}×{d.height} cm — factor área: {d.areaFactor.toFixed(3)}</div>
                                                        <div><strong>Precio por tamaño (base * factor):</strong> ${d.areaPrice.toFixed(2)}</div>
                                                        <div><strong>Revestimiento:</strong> {d.coatingPct}% → ${d.coatingPrice.toFixed(2)}</div>
                                                        <div><strong>Accesorios (total):</strong> ${d.accessoriesTotal.toFixed(2)}</div>
                                                        <div style={{ borderTop: '1px dashed #cfeef2', paddingTop: 6 }}>
                                                            <strong>Precio unidad (sin accesorios):</strong> ${d.unitWithoutAccessories.toFixed(2)}
                                                        </div>
                                                        <div><strong>Cantidad:</strong> {d.quantity} → <strong>Total (unidad * qty + accesorios):</strong> ${d.totalPrice.toFixed(2)}</div>
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        <div style={{ marginTop: 8 }}>
                                            <button
                                                type="button"
                                                className="botton-carusel"
                                                onClick={() => handleCreateComplement(idx)}
                                                disabled={!!validateRow(row)}
                                            >
                                                Crear complemento
                                            </button>
                                            {touchedRows[idx] && errors[idx] && (
                                                <span className="error-message" style={{ marginLeft: 12 }}>{errors[idx]}</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {row.type === 'partition' && complement && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                            <input
                                                type="number"
                                                min="1"
                                                step="1"
                                                placeholder="Alto (cm)"
                                                value={row.custom.height || ''}
                                                onChange={e => handleCustomChange(idx, 'height', e.target.value)}
                                                style={{ width: 100 }}
                                            />
                                            <input
                                                type="number"
                                                min="1"
                                                step="1"
                                                placeholder="Cantidad"
                                                value={row.quantity}
                                                onChange={e => handleRowChange(idx, 'quantity', e.target.value)}
                                                style={{ width: 80 }}
                                            />
                                            <div>
                                                <label style={{ marginRight: 8 }}>
                                                    <input
                                                        type="radio"
                                                        name={`simple-${idx}`}
                                                        checked={row.custom.simple === true}
                                                        onChange={() => handleCustomChange(idx, 'simple', true)}
                                                    /> Simple
                                                </label>
                                                <label>
                                                    <input
                                                        type="radio"
                                                        name={`simple-${idx}`}
                                                        checked={row.custom.simple === false}
                                                        onChange={() => handleCustomChange(idx, 'simple', false)}
                                                    /> Doble
                                                </label>
                                            </div>
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

                                        <div style={{ marginTop: 6, padding: 8, borderRadius: 6 }}>
                                            {(() => {
                                                const b = computePartitionBreakdown(row, complement);
                                                return (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                        <div><strong>Base (por 100 cm):</strong> ${b.basePrice.toFixed(2)}</div>
                                                        <div><strong>Alto:</strong> {b.height} cm — factor: {b.factor.toFixed(3)}</div>
                                                        <div><strong>Precio por altura:</strong> ${b.priceByHeight.toFixed(2)}</div>
                                                        <div><strong>Tipo:</strong> {b.simpleLabel}</div>
                                                        <div><strong>Recargo vidrio:</strong> {b.glassPct}%</div>
                                                        <div style={{ borderTop: '1px dashed #cfeef2', paddingTop: 6 }}>
                                                            <strong>Precio unidad:</strong> ${b.unit.toFixed(2)}
                                                        </div>
                                                        <div><strong>Cantidad:</strong> {b.qty} → <strong>Total:</strong> ${b.total.toFixed(2)}</div>
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        <div style={{ marginTop: 8 }}>
                                            <button
                                                type="button"
                                                className="botton-carusel"
                                                onClick={() => handleCreateComplement(idx)}
                                                disabled={!!validateRow(row)}
                                            >
                                                Crear complemento
                                            </button>
                                            {touchedRows[idx] && errors[idx] && (
                                                <span className="error-message" style={{ marginLeft: 12 }}>{errors[idx]}</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {row.type === 'railing' && complement && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
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
                                                {safeArray(alumTreatments).map(t => (
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

                                        <div style={{ marginTop: 6, padding: 8, borderRadius: 6 }}>
                                            {(() => {
                                                const r = computeRailingBreakdown(row, complement);
                                                return (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                        <div><strong>Base unit:</strong> ${r.basePrice.toFixed(2)} ({complement?.name || ''})</div>
                                                        <div><strong>Reforzado:</strong> {row.custom.reinforced ? `${r.reinforcePct}% → ${r.afterReinforce.toFixed(2)}` : 'No'}</div>
                                                        <div><strong>Tratamiento alum.:</strong> {r.treatmentPct}% → ${r.treatmentCost.toFixed(2)}</div>
                                                        <div style={{ borderTop: '1px dashed #cfeef2', paddingTop: 6 }}>
                                                            <strong>Precio unidad:</strong> ${r.unit.toFixed(2)}
                                                        </div>
                                                        <div><strong>Cantidad:</strong> {r.qty} → <strong>Total:</strong> ${r.total.toFixed(2)}</div>
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        <div style={{ marginTop: 8 }}>
                                            <button
                                                type="button"
                                                className="botton-carusel"
                                                onClick={() => handleCreateComplement(idx)}
                                                disabled={!!validateRow(row)}
                                            >
                                                Crear complemento
                                            </button>
                                            {touchedRows[idx] && errors[idx] && (
                                                <span className="error-message" style={{ marginLeft: 12 }}>{errors[idx]}</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {touchedRows[idx] && errors[idx] && (
                                    <span className="error-message">{errors[idx]}</span>
                                )}
                            </div>
                        );
                    })}
                    <button type="button" className="botton-carusel" onClick={handleAddRow}>
                        Agregar complemento
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Complements;