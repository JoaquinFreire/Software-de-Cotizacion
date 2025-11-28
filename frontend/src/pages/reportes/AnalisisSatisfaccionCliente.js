import React, { useState, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import { Pie, Bar } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import html2pdf from 'html2pdf.js';
import ReactLoading from 'react-loading';
import logoAnodal from '../../images/logo_secundario.webp';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import '../../styles/reporte-satisfaccion.css';
import { useNavigate } from "react-router-dom";
import {
    TrendingUp,
    Users,
    Star,
    Filter,
    BarChart3,
    MessageSquare,
    Info
} from 'lucide-react';

Chart.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    ChartDataLabels
);

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT5uVdkf1MHTdCmOK3Lp3A03vrPmKp3H7qyRsbIYRfz8-yNpXlcjtrOIrrL_vS5EZUdH62iF-UL4XB-/pub?output=csv';

const preguntasConfig = {
    "  ¿Cómo calificaría la amabilidad y predisposición del personal que lo atendió?  ": {
        opciones: ["1", "2", "3", "4", "5"],
        tituloCorto: "Amabilidad del personal",
        tipo: "calificacion"
    },
    "  ¿Qué tan clara y comprensible le resultó la información brindada durante la atención?  ": {
        opciones: ["1", "2", "3", "4", "5"],
        tituloCorto: "Claridad de la información",
        tipo: "calificacion"
    },
    "  ¿Cómo evaluaría el tiempo de respuesta desde su consulta hasta recibir la cotización?  ": {
        opciones: ["1", "2", "3", "4", "5"],
        tituloCorto: "Tiempo de respuesta",
        tipo: "calificacion"
    },
    "  ¿La cotización que recibió fue clara, completa y fácil de entender?  ": {
        opciones: ["1", "2", "3", "4", "5"],
        tituloCorto: "Claridad de cotización",
        tipo: "calificacion"
    },
    "  ¿Cómo considera la relación entre el precio y la calidad de los productos cotizados?  ": {
        opciones: ["Muy Alto", "Aceptable", "Muy bueno"],
        tituloCorto: "Relación precio/calidad",
        tipo: "opciones"
    },
    "  ¿El diseño, variedad y opciones disponibles se ajustaron a sus necesidades?  ": {
        opciones: ["Sí", "No", "Podria Mejorar"],
        tituloCorto: "Ajuste a necesidades",
        tipo: "opciones"
    },
    "  ¿Qué tan probable es que recomiende nuestra empresa a otras personas?  ": {
        opciones: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
        tituloCorto: "Probabilidad de recomendación",
        tipo: "recomendacion"
    },
    "  ¿Sintió que el personal comprendió correctamente sus necesidades?  ": {
        opciones: ["Sí", "No"],
        tituloCorto: "Comprensión de necesidades",
        tipo: "si_no"
    },
    "  ¿Recibió la cotización en el plazo estimado?  ": {
        opciones: ["Sí", "No"],
        tituloCorto: "Cumplimiento de plazo",
        tipo: "si_no"
    },
    "  ¿Le resultó fácil comunicarse con el área de ventas o cotizaciones?  ": {
        opciones: ["Sí", "No"],
        tituloCorto: "Facilidad de comunicación",
        tipo: "si_no"
    },
    "  En general, ¿Cómo calificaría su experiencia al solicitar una cotización con nuestra empresa?  ": {
        opciones: ["1", "2", "3", "4", "5"],
        tituloCorto: "Experiencia general",
        tipo: "calificacion"
    }
};

const significadosPuntuacion = {
    "1": "Muy Malo",
    "2": "Malo",
    "3": "Regular",
    "4": "Bueno",
    "5": "Excelente"
};

const coloresPorTipo = {
    calificacion: ['#ef4444', '#f97316', '#eab308', '#84cc16', '#10b981'],
    si_no: ['#10b981', '#ef4444'],
    opciones: ['#26b7cd', '#2dd4bf', '#8b5cf6'],
    recomendacion: ['#ef4444', '#f97316', '#eab308', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316']
};

const getDefaultDates = () => {
    const year = new Date().getFullYear();
    return {
        desde: `${year}-01-01`,
        hasta: `${year}-12-31`
    };
};

function analizarRespuestas(data) {
    console.log('Analizando respuestas con datos:', data);

    return Object.entries(preguntasConfig).map(([pregunta, config]) => {
        const conteo = {};
        config.opciones.forEach(op => { conteo[op] = 0; });

        data.forEach(row => {
            let respuesta = row[pregunta];

            if (respuesta) {
                respuesta = respuesta.toString().trim();

                if (config.tipo === 'si_no') {
                    if (respuesta.toLowerCase() === 'si' || respuesta === 'Sí') {
                        respuesta = 'Sí';
                    } else if (respuesta.toLowerCase() === 'no') {
                        respuesta = 'No';
                    }
                }

                if (config.tipo === 'recomendacion') {
                    const num = parseInt(respuesta);
                    if (!isNaN(num) && num >= 1 && num <= 10) {
                        respuesta = num.toString();
                    }
                }
            }

            if (respuesta && conteo.hasOwnProperty(respuesta)) {
                conteo[respuesta]++;
            } else if (respuesta && respuesta !== '') {
                console.log(`Respuesta no reconocida: "${respuesta}" para pregunta: "${pregunta}"`);
            }
        });

        console.log(`Conteo para "${pregunta}":`, conteo);
        return {
            pregunta,
            opciones: config.opciones,
            conteo,
            tituloCorto: config.tituloCorto,
            tipo: config.tipo
        };
    });
}

function parseFecha(fechaStr) {
    if (!fechaStr) return null;
    try {
        const [d, m, yAndRest] = fechaStr.split('/');
        const [y] = yAndRest.split(' ');
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    } catch {
        return null;
    }
}

function calcularMetricasGlobales(respuestas) {
    const totalRespuestas = respuestas.length;

    if (totalRespuestas === 0) {
        return {
            totalRespuestas: 0,
            satisfaccionGeneral: 0,
            promedioRecomendacion: 0
        };
    }

    const preguntasCalificacion = [
        "  ¿Cómo calificaría la amabilidad y predisposición del personal que lo atendió?  ",
        "  ¿Qué tan clara y comprensible le resultó la información brindada durante la atención?  ",
        "  ¿Cómo evaluaría el tiempo de respuesta desde su consulta hasta recibir la cotización?  ",
        "  ¿La cotización que recibió fue clara, completa y fácil de entender?  ",
        "  En general, ¿Cómo calificaría su experiencia al solicitar una cotización con nuestra empresa?  "
    ];

    let sumaCalificaciones = 0;
    let totalCalificaciones = 0;

    respuestas.forEach(row => {
        preguntasCalificacion.forEach(pregunta => {
            let valor = parseInt(row[pregunta]);

            if (!isNaN(valor) && valor >= 1 && valor <= 5) {
                sumaCalificaciones += valor;
                totalCalificaciones++;
            }
        });
    });

    const satisfaccionGeneral = totalCalificaciones > 0 ? (sumaCalificaciones / totalCalificaciones) : 0;

    let sumaRecomendacion = 0;
    let totalRecomendaciones = 0;
    respuestas.forEach(row => {
        let recomendacion = parseInt(row["  ¿Qué tan probable es que recomiende nuestra empresa a otras personas?  "]);

        if (!isNaN(recomendacion) && recomendacion >= 1 && recomendacion <= 10) {
            sumaRecomendacion += recomendacion;
            totalRecomendaciones++;
        }
    });

    const promedioRecomendacion = totalRecomendaciones > 0 ? (sumaRecomendacion / totalRecomendaciones) : 0;

    return {
        totalRespuestas,
        satisfaccionGeneral: parseFloat(satisfaccionGeneral.toFixed(1)),
        promedioRecomendacion: parseFloat(promedioRecomendacion.toFixed(1))
    };
}

const AnalisisSatisfaccionCliente = () => {
    const defaultDates = getDefaultDates();
    const [fechaDesde, setFechaDesde] = useState(defaultDates.desde);
    const [fechaHasta, setFechaHasta] = useState(defaultDates.hasta);
    const [loading, setLoading] = useState(false);
    const [respuestas, setRespuestas] = useState([]);
    const [resumen, setResumen] = useState([]);
    const [generar, setGenerar] = useState(false);
    const [metricasGlobales, setMetricasGlobales] = useState({});
    const [mostrarLeyenda, setMostrarLeyenda] = useState(false);
    const pdfRef = useRef();
    const reportContainerRef = useRef();

    const [userRole, setUserRole] = useState(null);
    const [roleLoading, setRoleLoading] = useState(true);
    const requiredRoles = ['coordinator']; // Solo coordinadores pueden ver este reporte

    const navigate = useNavigate();

    useEffect(() => {
        const checkUserRole = () => {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/");
                return;
            }

            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const role = payload?.role?.toLowerCase() ||
                    payload?.Role?.toLowerCase() ||
                    payload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']?.toLowerCase();

                if (role) {
                    setUserRole(role);
                    setRoleLoading(false);
                    return;
                }
            } catch (error) {
                console.debug('No se pudo decodificar JWT');
            }

            const fetchUserRoleFromAPI = async () => {
                try {
                    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/me`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const role = data?.user?.role?.toLowerCase();
                        setUserRole(role);
                    }
                } catch (error) {
                    console.error('Error verificando rol:', error);
                }
                setRoleLoading(false);
            };

            fetchUserRoleFromAPI();
        };

        checkUserRole();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    }

    const fetchCSV = async () => {
        setLoading(true);
        try {
            const res = await fetch(CSV_URL);
            const text = await res.text();
            Papa.parse(text, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const desde = new Date(fechaDesde);
                    const hasta = new Date(fechaHasta);
                    const filtradasPorFecha = results.data.filter(row => {
                        const marca = row["Marca temporal"];
                        if (!marca) return false;
                        const fechaStr = parseFecha(marca);
                        if (!fechaStr) return false;
                        const fecha = new Date(fechaStr);
                        return fecha >= desde && fecha <= hasta;
                    });

                    setRespuestas(filtradasPorFecha);
                    const analisis = analizarRespuestas(filtradasPorFecha);
                    setResumen(analisis);
                    setMetricasGlobales(calcularMetricasGlobales(filtradasPorFecha));
                    setLoading(false);
                }
            });
        } catch (err) {
            console.error('Error cargando CSV:', err);
            setRespuestas([]);
            setResumen([]);
            setMetricasGlobales({});
            setLoading(false);
        }
    };

    const handleGenerarReporte = () => {
        setGenerar(true);
        fetchCSV();
    };

    const renderStars = (rating, maxStars = 5) => {
        return Array.from({ length: maxStars }, (_, index) => (
            <Star
                key={index}
                size={16}
                fill={index < rating ? "#FFD700" : "none"}
                color={index < rating ? "#FFD700" : "#ccc"}
            />
        ));
    };

    // Imprimir solo el área del reporte
    const handlePrint = () => {
        document.body.classList.add('print-satisfaccion-only');
        setTimeout(() => {
            window.print();
            setTimeout(() => {
                document.body.classList.remove('print-satisfaccion-only');
            }, 100);
        }, 50);
    };

    if (roleLoading) {
        return (
            <div className="dashboard-container">
                <Navigation onLogout={handleLogout} />
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '50vh',
                    flexDirection: 'column',
                    gap: '1rem'
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid #f3f3f3',
                        borderTop: '4px solid #3b82f6',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }}></div>
                    <p>Verificando acceso...</p>
                </div>
                <Footer />
            </div>
        );
    }

    if (userRole && !requiredRoles.includes(userRole)) {
        return (
            <div className="dashboard-container">
                <Navigation onLogout={handleLogout} />
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '60vh',
                    flexDirection: 'column',
                    textAlign: 'center',
                    padding: '2rem'
                }}>
                    <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>Acceso Denegado</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        No tiene permisos para ver este recurso.
                    </p>
                    <p style={{ marginBottom: '2rem', color: '#6b7280' }}>
                        Este reporte está disponible solo para coordinadores.
                    </p>
                    <button
                        onClick={() => navigate('/reportes')}
                        style={{
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        Volver a Reportes
                    </button>
                </div>
                <Footer />
            </div>
        );
    }

    const graficos = resumen.map((r, idx) => {
        const total = Object.values(r.conteo).reduce((a, b) => a + b, 0);

        const opcionesConDatos = r.opciones.filter(op => r.conteo[op] > 0);
        const datosConDatos = opcionesConDatos.map(op => r.conteo[op]);

        let colores = coloresPorTipo[r.tipo] || coloresPorTipo.opciones;

        if (r.tipo === 'si_no') {
            colores = opcionesConDatos.map(op =>
                op === 'Sí' ? '#10b981' : '#ef4444'
            );
        } else if (r.tipo === 'calificacion') {
            colores = opcionesConDatos.map(op => {
                const puntuacion = parseInt(op);
                if (puntuacion === 1) return '#ef4444'; // Rojo
                if (puntuacion === 2) return '#f97316'; // Naranja
                if (puntuacion === 3) return '#eab308'; // Amarillo
                if (puntuacion === 4) return '#84cc16'; // Verde claro
                if (puntuacion === 5) return '#10b981'; // Verde
                return '#26b7cd'; // Por defecto
            });
        } else if (r.tituloCorto === 'Relación precio/calidad') {
            colores = opcionesConDatos.map(op => {
                if (op === 'Muy Alto') return '#10b981'; // Verde (como 5)
                if (op === 'Muy bueno') return '#84cc16'; // Verde claro (como 4)
                if (op === 'Aceptable') return '#eab308'; // Amarillo (como 3)
                return '#26b7cd'; // Por defecto
            });
        } else if (r.tituloCorto === 'Ajuste a necesidades') {
            colores = opcionesConDatos.map(op => {
                if (op === 'Sí') return '#10b981'; // Verde (como 5)
                if (op === 'No') return '#ef4444'; // Rojo (como 1)
                if (op === 'Podria Mejorar') return '#eab308'; // Amarillo (como 3)
                return '#26b7cd'; // Por defecto
            });
        }


        colores = colores.slice(0, opcionesConDatos.length);

        return {
            pregunta: r.pregunta,
            tituloCorto: r.tituloCorto,
            opciones: opcionesConDatos,
            data: {
                labels: opcionesConDatos.map(op => {
                    if (['1', '2', '3', '4', '5'].includes(op)) {
                        return `${op} (${significadosPuntuacion[op]})`;
                    }
                    return op;
                }),
                datasets: [{
                    data: datosConDatos,
                    backgroundColor: colores,
                    borderColor: '#222',
                    borderWidth: 2,
                }]
            },
            total,
            tipo: r.tipo
        };
    });

    const preguntasCalificacion = graficos.filter(g => g.tipo === 'calificacion' && g.total > 0);

    const barData = {
        labels: preguntasCalificacion.map(g => g.tituloCorto),
        datasets: [
            {
                label: 'Promedio de Calificación',
                data: preguntasCalificacion.map(g => {
                    const valores = g.opciones.map((op, i) => {
                        const valorNumerico = parseInt(op);
                        return isNaN(valorNumerico) ? 0 : valorNumerico * g.data.datasets[0].data[i];
                    });
                    const totalValores = valores.reduce((a, b) => a + b, 0);
                    const totalRespuestas = g.data.datasets[0].data.reduce((a, b) => a + b, 0);
                    return totalRespuestas > 0 ? parseFloat((totalValores / totalRespuestas).toFixed(1)) : 0;
                }),
                backgroundColor: '#26b7cd',
                borderColor: '#1a9cf3e1',
                borderWidth: 2,
                borderRadius: 8,
            }
        ]
    };

    return (
        <div className="dashboard-container">
            <Navigation onLogout={handleLogout} />
            <div className="satisfaction-report-container" ref={reportContainerRef}>
                <div className="satisfaction-dashboard-main">
                    <div className="satisfaction-header">
                        <div className="satisfaction-title">
                            <TrendingUp size={32} />
                            <div>
                                <h1>Análisis de Satisfacción del Cliente</h1>
                                <p>Reporte detallado de las respuestas del formulario de satisfacción</p>
                            </div>
                        </div>
                        {/* Botón Imprimir */}
                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button
                                className="satisfaction-btn satisfaction-btn-secondary"
                                onClick={handlePrint}
                                type="button"
                            >
                                🖨️ Imprimir
                            </button>
                        </div>
                    </div>

                    <div className="satisfaction-filters-inline">
                        <div className="filters-left">
                            <div className="filter-group-inline">
                                <Filter size={18} />
                                <label>Fecha:</label>
                                <input
                                    type="date"
                                    value={fechaDesde}
                                    onChange={e => setFechaDesde(e.target.value)}
                                    className="filter-input"
                                />
                                <span>a</span>
                                <input
                                    type="date"
                                    value={fechaHasta}
                                    onChange={e => setFechaHasta(e.target.value)}
                                    className="filter-input"
                                />
                            </div>
                        </div>

                        <div className="filters-right">
                            <button
                                className="satisfaction-btn satisfaction-btn-primary"
                                onClick={handleGenerarReporte}
                                disabled={loading || !fechaDesde || !fechaHasta}
                            >
                                {loading ? 'Cargando...' : 'Generar Reporte'}
                            </button>
                        </div>
                    </div>

                    <div className="leyenda-puntuaciones">
                        <button
                            className="leyenda-toggle"
                            onClick={() => setMostrarLeyenda(!mostrarLeyenda)}
                        >
                            <Info size={16} />
                            Significado de puntuaciones
                        </button>

                        {mostrarLeyenda && (
                            <div className="leyenda-contenido">
                                <div className="leyenda-item">
                                    <span className="leyenda-color" style={{ backgroundColor: '#ef4444' }}></span>
                                    <span className="leyenda-texto">1 - Muy Malo</span>
                                </div>
                                <div className="leyenda-item">
                                    <span className="leyenda-color" style={{ backgroundColor: '#f59e0b' }}></span>
                                    <span className="leyenda-texto">2 - Malo</span>
                                </div>
                                <div className="leyenda-item">
                                    <span className="leyenda-color" style={{ backgroundColor: '#eab308' }}></span>
                                    <span className="leyenda-texto">3 - Regular</span>
                                </div>
                                <div className="leyenda-item">
                                    <span className="leyenda-color" style={{ backgroundColor: '#84cc16' }}></span>
                                    <span className="leyenda-texto">4 - Bueno</span>
                                </div>
                                <div className="leyenda-item">
                                    <span className="leyenda-color" style={{ backgroundColor: '#10b981' }}></span>
                                    <span className="leyenda-texto">5 - Excelente</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Cuerpo */}
                    <div className="satisfaction-content">
                        {loading && generar ? (
                            <div className="satisfaction-loading">
                                <ReactLoading type="spin" color="#26b7cd" height={80} width={80} />
                                <div className="loading-text">Cargando reporte...</div>
                            </div>
                        ) : !generar ? (
                            <div className="satisfaction-empty">
                                <BarChart3 size={64} />
                                <h3>Reporte no generado</h3>
                                <p>Presione "Generar Reporte" para analizar las respuestas</p>
                            </div>
                        ) : (
                            <div className="satisfaction-report" ref={pdfRef}>
                                <div className="metrics-global">
                                    <div className="metric-card">
                                        <div className="metric-icon">
                                            <Users size={24} />
                                        </div>
                                        <div className="metric-content">
                                            <div className="metric-value">{metricasGlobales.totalRespuestas || 0}</div>
                                            <div className="metric-label">Total Respuestas</div>
                                        </div>
                                    </div>

                                    <div className="metric-card">
                                        <div className="metric-icon">
                                            <Star size={24} />
                                        </div>
                                        <div className="metric-content">
                                            <div className="metric-value">{metricasGlobales.satisfaccionGeneral || 0}/5</div>
                                            <div className="metric-label">Satisfacción General</div>
                                            <div className="metric-stars">
                                                {renderStars(Math.round(metricasGlobales.satisfaccionGeneral || 0))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="metric-card">
                                        <div className="metric-icon">
                                            <MessageSquare size={24} />
                                        </div>
                                        <div className="metric-content">
                                            <div className="metric-value">{metricasGlobales.promedioRecomendacion || 0}/10</div>
                                            <div className="metric-label">Promedio Recomendación</div>
                                        </div>
                                    </div>
                                </div>

                                {preguntasCalificacion.length > 0 && (
                                    <div className="chart-section">
                                        <h3>Comparativa de Preguntas de Calificación</h3>
                                        <div className="bar-chart-container">
                                            <Bar
                                                data={barData}
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: false,
                                                    plugins: {
                                                        legend: {
                                                            display: false
                                                        },
                                                        datalabels: {
                                                            display: false // Ocultar los 0
                                                        }
                                                    },
                                                    scales: {
                                                        y: {
                                                            beginAtZero: true,
                                                            max: 5,
                                                            ticks: {
                                                                color: '#b0b0b0'
                                                            },
                                                            grid: {
                                                                color: '#333'
                                                            }
                                                        },
                                                        x: {
                                                            ticks: {
                                                                color: '#b0b0b0',
                                                                maxRotation: 45,
                                                                minRotation: 45
                                                            },
                                                            grid: {
                                                                display: false
                                                            }
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="charts-grid">
                                    {graficos.filter(g => g.total > 0).map((g, idx) => (
                                        <div key={idx} className="chart-card">
                                            <h4>{g.tituloCorto}</h4>
                                            <div className="chart-container">
                                                <Pie
                                                    data={g.data}
                                                    options={{
                                                        responsive: true,
                                                        maintainAspectRatio: false,
                                                        plugins: {
                                                            legend: {
                                                                position: 'bottom',
                                                                labels: {
                                                                    color: '#b0b0b0',
                                                                    font: {
                                                                        size: 11
                                                                    }
                                                                }
                                                            },
                                                            datalabels: {
                                                                display: false // Ocultar los 0 en los gráficos de torta
                                                            }
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <div className="chart-table">
                                                <table>
                                                    <thead>
                                                        <tr>
                                                            <th>Respuesta</th>
                                                            <th>Cantidad</th>
                                                            <th>Porcentaje</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {g.opciones.map((op, i) => (
                                                            <tr key={op}>
                                                                <td>
                                                                    {op in significadosPuntuacion ?
                                                                        `${op} - ${significadosPuntuacion[op]}` :
                                                                        op
                                                                    }
                                                                </td>
                                                                <td>{g.data.datasets[0].data[i]}</td>
                                                                <td>{g.total ? ((g.data.datasets[0].data[i] / g.total) * 100).toFixed(1) + '%' : '0%'}</td>
                                                            </tr>
                                                        ))}
                                                        <tr className="total-row">
                                                            <td><strong>Total</strong></td>
                                                            <td><strong>{g.total}</strong></td>
                                                            <td><strong>100%</strong></td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="report-info">
                                    <div className="info-section">
                                        <strong>Fuente de datos:</strong> Formulario de Google - Respuestas de satisfacción
                                    </div>
                                    <div className="info-section">
                                        <strong>Fecha de generación:</strong> {new Date().toLocaleString()}
                                    </div>
                                    <div className="info-section">
                                        <strong>Período analizado:</strong> {fechaDesde} a {fechaHasta}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default AnalisisSatisfaccionCliente;