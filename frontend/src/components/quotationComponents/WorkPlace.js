import React, { useState, useEffect } from 'react';
import ciudadesBarriosRaw from '../../json/ciudadesBarriosCordoba.json';

const ciudadesBarrios = ciudadesBarriosRaw?.default || ciudadesBarriosRaw;
const ciudades = Array.isArray(ciudadesBarrios?.Cordoba?.ciudades) ? ciudadesBarrios.Cordoba.ciudades : [];

const WorkPlace = ({ workPlace, setWorkPlace, workTypes, errors = {}, readOnlyFields = [] }) => {
    const [selectedCiudad, setSelectedCiudad] = useState('');
    const [selectedBarrio, setSelectedBarrio] = useState('');
    const [calle, setCalle] = useState('');
    const [numero, setNumero] = useState('');

    const isFieldReadOnly = (fieldName) => readOnlyFields.includes(fieldName);

    useEffect(() => {
        if (isFieldReadOnly('address')) return;
        setWorkPlace(prev => ({
            ...prev,
            address: calle && numero ? `${calle} ${numero}` : ''
        }));
    }, [calle, numero, setWorkPlace, isFieldReadOnly]);

    useEffect(() => {
        if (isFieldReadOnly('location')) return;
        if (selectedCiudad && selectedBarrio) {
            setWorkPlace(prev => ({
                ...prev,
                location: `${selectedCiudad} - ${selectedBarrio}`
            }));
        } else {
            setWorkPlace(prev => ({
                ...prev,
                location: ''
            }));
        }
    }, [selectedCiudad, selectedBarrio, setWorkPlace, isFieldReadOnly]);

    const handleInputChange = (field, value) => {
        if (isFieldReadOnly(field)) return;
        setWorkPlace({ ...workPlace, [field]: value });
        if (errors[field]) {
            errors[field] = undefined;
        }
    };

    const barrios = selectedCiudad
        ? (ciudades.find(c => c.nombre === selectedCiudad)?.barrios || [])
        : [];

    return (
        <div className="workplace-container">
            <h3>Espacio de Trabajo</h3>
            <div className="form-group">
                <label>Nombre del espacio de trabajo:</label>
                <input
                    type="text"
                    value={workPlace.name}
                    onChange={e => !isFieldReadOnly('name') && setWorkPlace(prev => ({ ...prev, name: e.target.value }))}
                    disabled={isFieldReadOnly('name')}
                    className={`${errors.name ? "input-error" : ""} ${isFieldReadOnly('name') ? 'read-only-field' : ''}`}
                    placeholder="Ej: Obra Barrio Centro, Casa Sra. Pérez"
                    required
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
            </div>
            <div className="form-group">
                <label>Ciudad de Córdoba:</label>
                <select
                    value={selectedCiudad}
                    onChange={e => {
                        if (isFieldReadOnly('location')) return;
                        setSelectedCiudad(e.target.value);
                        setSelectedBarrio('');
                        setWorkPlace(prev => ({ ...prev, location: '' }));
                    }}
                    disabled={isFieldReadOnly('location')}
                    className={`${errors.ciudad ? "input-error" : ""} ${isFieldReadOnly('location') ? 'read-only-field' : ''}`}
                    required
                >
                    <option value="">Seleccione ciudad</option>
                    {ciudades.map(ciudad => (
                        <option key={ciudad.nombre} value={ciudad.nombre}>
                            {ciudad.nombre}
                        </option>
                    ))}
                </select>
                {errors.ciudad && <span className="error-message">{errors.ciudad}</span>}
            </div>
            {selectedCiudad && (
                <div className="form-group">
                    <label>Barrio:</label>
                    <select
                        value={selectedBarrio}
                        onChange={e => !isFieldReadOnly('location') && setSelectedBarrio(e.target.value)}
                        disabled={isFieldReadOnly('location')}
                        className={`${errors.barrio ? "input-error" : ""} ${isFieldReadOnly('location') ? 'read-only-field' : ''}`}
                        required
                    >
                        <option value="">Seleccione barrio</option>
                        {barrios.map((barrio, idx) => (
                            <option key={barrio + '-' + idx} value={barrio}>
                                {barrio}
                            </option>
                        ))}
                    </select>
                    {errors.barrio && <span className="error-message">{errors.barrio}</span>}
                </div>
            )}
            <div className="form-group">
                <label>Calle:</label>
                <input
                    type="text"
                    value={calle}
                    onChange={e => !isFieldReadOnly('address') && setCalle(e.target.value)}
                    disabled={isFieldReadOnly('address')}
                    className={`${errors.address ? "input-error" : ""} ${isFieldReadOnly('address') ? 'read-only-field' : ''}`}
                    placeholder="Ingrese la calle"
                    required
                />
            </div>
            <div className="form-group">
                <label>Número:</label>
                <input
                    type="text"
                    value={numero}
                    onChange={e => !isFieldReadOnly('address') && setNumero(e.target.value)}
                    disabled={isFieldReadOnly('address')}
                    className={`${errors.address ? "input-error" : ""} ${isFieldReadOnly('address') ? 'read-only-field' : ''}`}
                    placeholder="Ingrese el número"
                    required
                />
            </div>
            <div className="form-group">
                <label>Tipo de Trabajo:</label>
                <select
                    value={workPlace.workTypeId}
                    onChange={e => !isFieldReadOnly('workTypeId') && handleInputChange("workTypeId", e.target.value)}
                    disabled={isFieldReadOnly('workTypeId')}
                    className={`${errors.workTypeId ? "input-error" : ""} ${isFieldReadOnly('workTypeId') ? 'read-only-field' : ''}`}
                    required
                >
                    <option value="">Seleccionar tipo de trabajo</option>
                    {workTypes.map((workType) => (
                        <option key={workType.id} value={workType.id}>
                            {workType.type}
                        </option>
                    ))}
                </select>
                {errors.workTypeId && <span className="error-message">{errors.workTypeId}</span>}
            </div>
        </div>
    );
};

export default WorkPlace;