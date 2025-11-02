import React, { useState, useEffect } from 'react';
import ciudadesBarriosRaw from '../../json/ciudadesBarriosCordoba.json';

// Accede correctamente a la propiedad ciudades
const ciudadesBarrios = ciudadesBarriosRaw?.default || ciudadesBarriosRaw;
const ciudades = Array.isArray(ciudadesBarrios?.Cordoba?.ciudades) ? ciudadesBarrios.Cordoba.ciudades : [];

const WorkPlace = ({ workPlace, setWorkPlace, workTypes, errors = {} }) => {
    const [selectedCiudad, setSelectedCiudad] = useState(workPlace.selectedCiudad || '');
    const [selectedBarrio, setSelectedBarrio] = useState(workPlace.selectedBarrio || '');
    const [calle, setCalle] = useState(workPlace.calle || '');
    const [numero, setNumero] = useState(workPlace.numero || '');

    // Inicializar valores desde workPlace si existen
    useEffect(() => {
        if (workPlace.selectedCiudad) setSelectedCiudad(workPlace.selectedCiudad);
        if (workPlace.selectedBarrio) setSelectedBarrio(workPlace.selectedBarrio);
        if (workPlace.calle) setCalle(workPlace.calle);
        if (workPlace.numero) setNumero(workPlace.numero);
    }, [workPlace]);

    // Actualiza la dirección combinando calle y número
    useEffect(() => {
        const newAddress = calle && numero ? `${calle} ${numero}` : '';
        setWorkPlace(prev => ({
            ...prev,
            address: newAddress,
            calle: calle,
            numero: numero
        }));
    }, [calle, numero, setWorkPlace]);

    // Actualiza location y datos de ciudad/barrio cuando cambian
    useEffect(() => {
        const newLocation = selectedCiudad && selectedBarrio ? `${selectedCiudad} - ${selectedBarrio}` : '';
        setWorkPlace(prev => ({
            ...prev,
            location: newLocation,
            selectedCiudad: selectedCiudad,
            selectedBarrio: selectedBarrio
        }));
    }, [selectedCiudad, selectedBarrio, setWorkPlace]);

    const handleInputChange = (field, value) => {
        setWorkPlace(prev => ({ ...prev, [field]: value }));
    };

    const handleNameChange = (value) => {
        // Validación en tiempo real para nombre (sin números)
        if (/[0-9]/.test(value)) {
            return; // No actualizar si contiene números
        }
        setWorkPlace(prev => ({ ...prev, name: value }));
    };

    const barrios = selectedCiudad
        ? (ciudades.find(c => c.nombre === selectedCiudad)?.barrios || [])
        : [];

    return (
        <div className="workplace-container">
            <h3>Espacio de Trabajo</h3>
            
            {/* Nombre del espacio de trabajo */}
            <div className="form-group">
                <label>Nombre del espacio de trabajo:</label>
                <input
                    type="text"
                    value={workPlace.name || ''}
                    onChange={e => handleNameChange(e.target.value)}
                    className={errors.name ? "input-error" : ""}
                    placeholder="Ej: Obra Barrio Centro, Casa Sra. Pérez"
                    required
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
                <small className="input-hint">No se permiten números en el nombre</small>
            </div>

            {/* Ciudad */}
            <div className="form-group">
                <label>Ciudad de Córdoba:</label>
                <select
                    value={selectedCiudad}
                    onChange={e => {
                        setSelectedCiudad(e.target.value);
                        setSelectedBarrio('');
                    }}
                    className={errors.selectedCiudad || errors.location ? "input-error" : ""}
                    required
                >
                    <option value="">Seleccione ciudad</option>
                    {ciudades.map(ciudad => (
                        <option key={ciudad.nombre} value={ciudad.nombre}>
                            {ciudad.nombre}
                        </option>
                    ))}
                </select>
                {errors.selectedCiudad && <span className="error-message">{errors.selectedCiudad}</span>}
                {errors.location && !errors.selectedCiudad && <span className="error-message">{errors.location}</span>}
            </div>

            {/* Barrio */}
            {selectedCiudad && (
                <div className="form-group">
                    <label>Barrio:</label>
                    <select
                        value={selectedBarrio}
                        onChange={e => setSelectedBarrio(e.target.value)}
                        className={errors.selectedBarrio || errors.location ? "input-error" : ""}
                        required
                    >
                        <option value="">Seleccione barrio</option>
                        {barrios.map((barrio, idx) => (
                            <option key={barrio + '-' + idx} value={barrio}>
                                {barrio}
                            </option>
                        ))}
                    </select>
                    {errors.selectedBarrio && <span className="error-message">{errors.selectedBarrio}</span>}
                    {errors.location && !errors.selectedBarrio && <span className="error-message">{errors.location}</span>}
                </div>
            )}

            {/* Dirección - Calle y Número */}
            <div className="form-row">
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
                        placeholder="Número"
                        required
                    />
                </div>
            </div>
            {errors.address && <span className="error-message">{errors.address}</span>}

            {/* Tipo de Trabajo */}
            <div className="form-group">
                <label>Tipo de Trabajo:</label>
                <select
                    value={workPlace.workTypeId || ''}
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