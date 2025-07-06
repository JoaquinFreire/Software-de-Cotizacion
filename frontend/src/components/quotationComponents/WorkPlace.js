import React from 'react';

const WorkPlace = ({ workPlace, setWorkPlace, workTypes, errors = {} }) => {
    const handleInputChange = (field, value) => {
        setWorkPlace({ ...workPlace, [field]: value });
        if (errors[field]) {
            errors[field] = undefined;
        }
    };

    return (
        <div className="workplace-container">
            <h3>Espacio de Trabajo</h3>
            <div className="form-group">
                <label>Nombre:</label>
                <input
                    type="text"
                    value={workPlace.name}
                    onChange={e => handleInputChange("name", e.target.value)}
                    className={errors.name ? "input-error" : ""}
                    placeholder="Ingrese el nombre del espacio de trabajo"
                    required
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
            </div>
            <div className="form-group">
                <label>Dirección:</label>
                <input
                    type="text"
                    value={workPlace.address}
                    onChange={e => handleInputChange("address", e.target.value)}
                    className={errors.address ? "input-error" : ""}
                    placeholder="Ingrese la dirección"
                    required
                />
                {errors.address && <span className="error-message">{errors.address}</span>}
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
