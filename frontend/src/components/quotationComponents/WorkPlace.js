import React, { useState, useEffect } from 'react';
import ciudadesBarriosRaw from '../../json/ciudadesBarriosCordoba.json';

// Accede correctamente a la propiedad ciudades
const ciudadesBarrios = ciudadesBarriosRaw?.default || ciudadesBarriosRaw;
const ciudades = Array.isArray(ciudadesBarrios?.Cordoba?.ciudades) ? ciudadesBarrios.Cordoba.ciudades : [];
console.log(ciudadesBarrios, "ciudades1");
console.log(ciudades, "ciudades2");

const WorkPlace = ({ workPlace, setWorkPlace, workTypes, errors = {} }) => {
    const [selectedCiudad, setSelectedCiudad] = useState('');
    const [selectedBarrio, setSelectedBarrio] = useState('');
    const [calle, setCalle] = useState('');
    const [numero, setNumero] = useState('');

    useEffect(() => {
        // Actualiza la dirección combinando calle y número
        setWorkPlace(prev => ({
            ...prev,
            address: calle && numero ? `${calle} ${numero}` : ''
        }));
    }, [calle, numero, setWorkPlace]);

    // Nuevo: Actualiza location cuando cambia ciudad o barrio
    useEffect(() => {
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
    }, [selectedCiudad, selectedBarrio, setWorkPlace]);

    const handleInputChange = (field, value) => {
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
                    onChange={e => setWorkPlace(prev => ({ ...prev, name: e.target.value }))}
                    className={errors.name ? "input-error" : ""}
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
                        setSelectedCiudad(e.target.value);
                        setSelectedBarrio('');
                        // Limpiar location si cambia ciudad
                        setWorkPlace(prev => ({ ...prev, location: '' }));
                    }}
                    className={errors.ciudad ? "input-error" : ""}
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
                        onChange={e => setSelectedBarrio(e.target.value)}
                        className={errors.barrio ? "input-error" : ""}
                        required
                    >
                        <option value="">Seleccione barrio</option>
                        {barrios.map(barrio => (
                            <option key={barrio} value={barrio}>
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
                    onChange={e => setCalle(e.target.value)}
                    className={errors.address ? "input-error" : ""}
                    placeholder="Ingrese la calle"
                    required
                />
            </div>
            <div className="form-group">
                <label>Número:</label>
                <input
                    type="text"
                    value={numero}
                    onChange={e => setNumero(e.target.value)}
                    className={errors.address ? "input-error" : ""}
                    placeholder="Ingrese el número"
                    required
                />
            </div>
            <div className="form-group">
                <label>Tipo de Trabajo:</label>
                <select
                    value={workPlace.workTypeId}
                    onChange={e => handleInputChange("workTypeId", e.target.value)}
                    className={errors.workTypeId ? "input-error" : ""}
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