import React, { useEffect, useState } from 'react';

const Extras = ({ comment, setComment, setDollarReference, setLabourReference }) => {
    const [dolarVenta, setDolarVenta] = useState(null);
    const [dolarCompra, setDolarCompra] = useState(null);
    const [labour, setLabour] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let labourValue = null;
        setLoading(true);
        fetch('https://dolarapi.com/v1/dolares/oficial')
            .then(res => res.json())
            .then(data => {
                setDolarVenta(data.venta);
                setDolarCompra(data.compra);
                if (setDollarReference) setDollarReference(data.venta);
            })
            .catch(() => {})
            .finally(() => setLoading(false));

        // Obtener mano de obra desde la API interna
        const token = localStorage.getItem('token');
        fetch(`${process.env.REACT_APP_API_URL}/api/prices`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(prices => {
                const labourObj = prices.find(p => p.name?.toLowerCase().includes("manoobra") || p.name?.toLowerCase().includes("manodeobra") || p.name?.toLowerCase().includes("mano de obra"));
                if (labourObj) {
                    setLabour(labourObj.price);
                    if (setLabourReference) setLabourReference(labourObj.price);
                }
            })
            .catch(() => {});
    }, [setDollarReference, setLabourReference]);

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
                <div>
                    <label>Mano de obra actual:</label>
                    <span style={{ marginLeft: 8 }}>
                        {labour !== null ? `$${labour}` : "No disponible"}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default Extras;
