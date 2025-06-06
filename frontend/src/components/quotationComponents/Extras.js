import React, { useEffect, useState } from 'react';

const Extras = ({ comment, setComment }) => {
    const [dolarVenta, setDolarVenta] = useState(null);
    const [dolarCompra, setDolarCompra] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('https://dolarapi.com/v1/dolares/oficial')
            .then(res => res.json())
            .then(data => {
                setDolarVenta(data.venta);
                setDolarCompra(data.compra);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    return (
        <div>
            <h3>Datos extras de cotización</h3>
            <div className="form-group">
                <label>Comentario:</label>
                <input
                    type="text"
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Ingrese un comentario"
                />
            </div>
            <div className="form-group">
                <div>
                    <label>Dólar compra oficial actual:</label>
                    <span style={{ marginLeft: 8 }}>
                        {loading ? "Cargando..." : dolarCompra ? `$${dolarCompra}` : "No disponible"}
                    </span>
                </div>
                <div>
                    <label>Dólar venta oficial actual:</label>
                    <span style={{ marginLeft: 8 }}>
                        {loading ? "Cargando..." : dolarVenta ? `$${dolarVenta}` : "No disponible"}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default Extras;
