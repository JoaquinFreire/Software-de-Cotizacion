import React, { useEffect, useState } from 'react';
import { safeArray } from '../../utils/safeArray'; // agrega este import

const Extras = ({ comment, setComment, setDollarReference, setLabourReference }) => {
    const [dolarVenta, setDolarVenta] = useState(null);
    const [dolarCompra, setDolarCompra] = useState(null);
    const [labour, setLabour] = useState(null);
    const [loading, setLoading] = useState(true);

    const defaultComment = `[Aquí escriba la observación correspondiente por el cotizador]

Validez de la cotización
El precio y los plazos de entrega especificados en la presente cotización son válidos durante el período indicado en ella. En caso de no estar especificado, la validez será de 15 días corridos a partir de la fecha de emisión. Todo pedido queda sujeto a confirmación y aceptación por parte de Anodal Aberturas de Aluminio.

Precio de los materiales
Los precios presupuestados se calculan en base al costo actual de los materiales. En caso de producirse variaciones en la lista de precios de fábrica o insumos, Anodal podrá actualizar los valores al momento de la confirmación del pedido.

Fuerza mayor
Anodal no será responsable por demoras en la entrega o incumplimientos derivados de causas de fuerza mayor tales como conflictos laborales, incendios, inundaciones, cortes de energía, falta de insumos por parte de proveedores, disposiciones gubernamentales u otras causas ajenas a nuestro control.

Solicitudes de cambios del cliente
Una vez aceptado el pedido, cualquier modificación en medidas, cantidades, fechas de entrega o características deberá solicitarse por escrito. Dichos cambios podrán implicar ajustes en precios y plazos previamente cotizados.

Impuestos
Los precios cotizados no incluyen impuestos adicionales que puedan ser exigidos por autoridades nacionales, provinciales o municipales, los cuales estarán a cargo del cliente.`;

    setComment(defaultComment);
    useEffect(() => {
        setLoading(true);
        fetch('https://dolarapi.com/v1/dolares/oficial')
            .then(res => res.json())
            .then(data => {
                setDolarVenta(data.venta);
                setDolarCompra(data.compra);
                if (setDollarReference) setDollarReference(data.venta);
            })
            .catch((err) => {
            })
            .finally(() => setLoading(false));

        // Obtener mano de obra desde la API interna
        const token = localStorage.getItem('token');
        fetch(`${process.env.REACT_APP_API_URL}/api/prices`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(pricesRaw => {
                const prices = safeArray(pricesRaw);
                const labourObj = prices.find(p =>
                    p.name?.toLowerCase().includes("manoobra") ||
                    p.name?.toLowerCase().includes("manodeobra") ||
                    p.name?.toLowerCase().includes("mano de obra")
                );
                if (labourObj) {
                    setLabour(labourObj.price);
                    if (setLabourReference) setLabourReference(labourObj.price);
                } else {
                    setLabour(null);
                    if (setLabourReference) setLabourReference(null);
                }
            })
            .catch((err) => {
                console.log("Error obteniendo precios de mano de obra:", err);
            });
    }, [setDollarReference, setLabourReference]);

    return (
        <div>
            <h3>Datos extras de cotización</h3>
            <div className="form-group">
                <label>Comentario:</label>
                <textarea
                    type="text"
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Ingrese un comentario"
                    rows={18}   // más alto
                    cols={80}   // más ancho
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
