import React from 'react';

const WorkPlace = ({ workPlace, setWorkPlace, workTypes }) => {
    return (
        <div className="workplace-container">
            <h3>Espacio de Trabajo</h3>
            <div className="form-group">
                <label>Nombre:</label>
                <input
                    type="text"
                    value={workPlace.name}
                    onChange={(e) => setWorkPlace({ ...workPlace, name: e.target.value })}
                    placeholder="Ingrese el nombre del espacio de trabajo"
                    required
                />
            </div>
            <div className="form-group">
                <label>Dirección:</label>
                <input
                    type="text"
                    value={workPlace.address}
                    onChange={(e) => setWorkPlace({ ...workPlace, address: e.target.value })}
                    placeholder="Ingrese la dirección"
                    required
                />
            </div>
            <div className="form-group">
                <label>Tipo de Trabajo:</label>
                <select
                    value={workPlace.workTypeId}
                    onChange={(e) => setWorkPlace({ ...workPlace, workTypeId: e.target.value })}
                    required
                >
                    <option value="">Seleccionar tipo de trabajo</option>
                    {workTypes.map((workType) => (
                        <option key={workType.id} value={workType.id}>
                            {workType.type}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default WorkPlace;
