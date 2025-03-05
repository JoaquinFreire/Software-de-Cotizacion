// filepath: /path/to/your/file.js
/*import jsPDF from 'jspdf';

function import jsPDF from 'jspdf';

export function generarPDF(datosCotizacion) {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text('Cotización', 20, 20);

    doc.setFontSize(12);
    let y = 30;
    datosCotizacion.forEach((dato, index) => {
        doc.text(`${dato.label}: ${dato.value}`, 20, y + (index * 10));
    });

    doc.save('cotizacion.pdf');
}import React, { useState } from 'react';
import {generarPDF } from './PDF';

import React, { useState } from 'react';
// import { generarPDF } from './PDF';

const Cotizacion = () => {
    const [datosCotizacion, setDatosCotizacion] = useState({
        cliente: 'Juan Pérez',
        fecha: '03/03/2025',
        total: '$1000',
        // Agrega más campos según sea necesario
    });

    const handleGenerarCotizacion = () => {
        // Aquí iría la lógica para generar la cotización
        // ...

        // Convertir los datos a un formato adecuado para el PDF
        const datosParaPDF = [
            { label: 'Cliente', value: datosCotizacion.cliente },
            { label: 'Fecha', value: datosCotizacion.fecha },
            { label: 'Total', value: datosCotizacion.total },
            // Agrega más datos según sea necesario
        ];

        // Generar y descargar el PDF
        generarPDF(datosParaPDF);
    };

    return (
        <div>
            <h1>Generar Cotización</h1>
            {/* Aquí irían los campos del formulario para la cotización }
            <button onClick={handleGenerarCotizacion}>Generar Cotización y Descargar PDF</button>
        </div>
    );
};

export default Cotizacion;generarPDF(datosCotizacion) {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text('Cotización', 20, 20);

    doc.setFontSize(12);
    let y = 30;
    datosCotizacion.forEach((dato, index) => {
        doc.text(`${dato.label}: ${dato.value}`, 20, y + (index * 10));
    });

    doc.save('cotizacion.pdf');
}

// Ejemplo de uso
const datosCotizacion = [
    { label: 'Cliente', value: 'Juan Pérez' },
    { label: 'Fecha', value: '03/03/2025' },
    { label: 'Total', value: '$1000' },
    // Agrega más datos según sea necesario
];

generarPDF(datosCotizacion);*/