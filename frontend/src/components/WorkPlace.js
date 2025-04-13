import React from 'react';

const WorkPlace = ({ workPlace, setWorkPlace, workTypes }) => {
    return (
        <div className="form-group">
            <h3>Work Place</h3>
            <label>Name:</label>
            <input
                type="text"
                value={workPlace.name}
                onChange={(e) => setWorkPlace({ ...workPlace, name: e.target.value })}
                required
            />
            <label>Address:</label>
            <input
                type="text"
                value={workPlace.address}
                onChange={(e) => setWorkPlace({ ...workPlace, address: e.target.value })}
                required
            />
            <label>Work Type:</label>
            <select
                value={workPlace.workTypeId}
                onChange={(e) => setWorkPlace({ ...workPlace, workTypeId: e.target.value })}
                required
            >
                <option value="">Select work type</option>
                {workTypes.map(workType => (
                    <option key={workType.id} value={workType.id}>
                        {workType.type}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default WorkPlace;
