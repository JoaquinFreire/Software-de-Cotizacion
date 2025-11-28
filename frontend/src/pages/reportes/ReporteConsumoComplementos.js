import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Bar, Line } from 'react-chartjs-2';
import 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import html2pdf from 'html2pdf.js';
import ReactLoading from 'react-loading';
import {
    TrendingUp,
    RefreshCw,
    DollarSign,
    BarChart3,
    Calendar,
    Filter,
    ChevronLeft,
    ChevronRight,
    TrendingDown,
    MoveRight
} from 'lucide-react';
import logoAnodal from '../../images/logo_secundario.webp';
import '../../styles/ReporteConsumoComplementos.css';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import ScrollToTopButton from '../../components/ScrollToTopButton';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL;

const formatFecha = (fecha) => {
    if (!fecha) return '';
    const [datePart] = fecha.split('T');
    const [y, m, d] = datePart.split('-');
    return `${d}-${m}-${y.slice(2)}`;
};

// Función para obtener nombres de complementos
const normalizeArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (val.$values && Array.isArray(val.$values)) return val.$values;
    return [val];
};

const extractName = (item) => {
    if (!item) return null;
    return item.name ?? item.Name ?? item.Nombre ?? item.Title ?? null;
};

const extractNamesFromSection = (section) => {
    const arr = normalizeArray(section);
    const out = [];
    arr.forEach(it => {
        if (!it) return;
        if (it.$values && Array.isArray(it.$values)) {
            it.$values.forEach(inner => {
                const n = extractName(inner);
                if (n) out.push(n);
            });
        } else {
            const n = extractName(it);
            if (n) out.push(n);
        }
    });
    return out;
};

const pickSection = (obj, keys) => {
    if (!obj) return null;
    for (const k of keys) {
        if (obj[k]) return obj[k];
    }
    return null;
};

const getComplementNames = (complement) => {
    if (!complement) return [];
    const items = Array.isArray(complement) ? complement : (complement.$values && Array.isArray(complement.$values) ? complement.$values : [complement]);
    const names = [];
    items.forEach(c => {
        if (!c) return;
        const door = pickSection(c, ['ComplementDoor', 'complementDoor', 'ComplementDoorItems', 'ComplementDoors']);
        const railing = pickSection(c, ['ComplementRailing', 'complementRailing', 'ComplementRailingItems', 'ComplementRailings']);
        const partition = pickSection(c, ['ComplementPartition', 'complementPartition', 'ComplementPartitionItems', 'ComplementPartitions']);
        names.push(...extractNamesFromSection(door));
        names.push(...extractNamesFromSection(railing));
        names.push(...extractNamesFromSection(partition));
        const direct = extractName(c);
        if (direct) names.push(direct);
    });
    return names;
};

// Utilidades para fechas
const getDefaultDates = () => {
    const date = new Date();
    const year = date.getFullYear();
    return {
        desde: `${year}-01-01`,
        hasta: `${year}-12-31`
    };
};

const parseDateString = (s) => {
    if (!s) return null;
    const d = new Date(s);
    return isNaN(d) ? null : d;
};

// Función para calcular evolución temporal basada en datos reales
const calcularEvolucionTemporal = (budgets) => {
    const meses = [
        'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
        'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];

    // Agrupar por mes y año
    const datosPorMes = {};

    budgets.forEach(budget => {
        if (!budget.creationDate) return;

        const fecha = new Date(budget.creationDate);
        const mes = fecha.getMonth(); // 0-11
        const año = fecha.getFullYear();
        const clave = `${año}-${mes.toString().padStart(2, '0')}`;

        if (!datosPorMes[clave]) {
            datosPorMes[clave] = {
                año,
                mes,
                complementos: 0,
                cotizaciones: 0
            };
        }

        // Contar complementos de esta cotización
        const complementos = getComplementNames(budget.Complement || budget.complement || budget.Complemento);
        datosPorMes[clave].complementos += complementos.length;
        datosPorMes[clave].cotizaciones += 1;
    });

    // Ordenar por fecha y limitar a últimos 6 meses
    const clavesOrdenadas = Object.keys(datosPorMes).sort().reverse().slice(0, 6);
    const datosOrdenados = clavesOrdenadas.map(clave => datosPorMes[clave]).reverse();

    // Calcular tendencias
    const datosConTendencia = datosOrdenados.map((dato, index, array) => {
        let tendencia = 'stable';
        if (index > 0) {
            const anterior = array[index - 1].complementos;
            const actual = dato.complementos;
            const diferencia = actual - anterior;
            const porcentaje = anterior > 0 ? (diferencia / anterior) * 100 : 0;

            if (porcentaje > 10) tendencia = 'up';
            else if (porcentaje < -10) tendencia = 'down';
            else tendencia = 'stable';
        }

        return {
            ...dato,
            mesNombre: meses[dato.mes],
            tendencia
        };
    });

    return datosConTendencia;
};

// Función para calcular análisis monetario basado en datos reales
const calcularAnalisisMonetario = (budgets, complementCounts) => {
    // Calcular valor total de complementos (usando el precio de complementos si está disponible)
    let valorTotalComplementos = 0;
    let valorPorTipo = { puertas: 0, tabiques: 0, barandas: 0, otros: 0 };
    let cantidadPorTipo = { puertas: 0, tabiques: 0, barandas: 0, otros: 0 };

    budgets.forEach(budget => {
        const complementData = budget.Complement || budget.complement || budget.Complemento;
        if (!complementData) return;

        const complementosArray = Array.isArray(complementData) ? complementData :
            (complementData.$values && Array.isArray(complementData.$values) ? complementData.$values : [complementData]);

        complementosArray.forEach(complement => {
            // Sumar el precio del complemento si está disponible
            if (complement.price && typeof complement.price === 'number') {
                valorTotalComplementos += complement.price;
            }

            // Clasificar por tipo y sumar valores
            const nombresComplementos = getComplementNames([complement]);
            nombresComplementos.forEach(nombre => {
                let tipo = 'otros';
                if (nombre.toLowerCase().includes('puerta')) tipo = 'puertas';
                else if (nombre.toLowerCase().includes('tabique')) tipo = 'tabiques';
                else if (nombre.toLowerCase().includes('baranda')) tipo = 'barandas';

                cantidadPorTipo[tipo] += 1;

                // Estimación de valor por tipo (ajustar según lógica de negocio)
                const valoresEstimados = {
                    puertas: 1500,
                    tabiques: 2200,
                    barandas: 900,
                    otros: 800
                };

                if (!complement.price) {
                    valorPorTipo[tipo] += valoresEstimados[tipo];
                }
            });
        });
    });

    // Si no hay precios en los datos, usar valores estimados
    if (valorTotalComplementos === 0) {
        valorTotalComplementos = Object.values(valorPorTipo).reduce((sum, val) => sum + val, 0);
    } else {
        // Si hay precios reales, distribuir proporcionalmente
        const totalCount = Object.values(cantidadPorTipo).reduce((sum, count) => sum + count, 0);
        if (totalCount > 0) {
            Object.keys(valorPorTipo).forEach(tipo => {
                valorPorTipo[tipo] = (cantidadPorTipo[tipo] / totalCount) * valorTotalComplementos;
            });
        }
    }

    // Calcular porcentaje sobre total de cotizaciones
    const totalCotizaciones = budgets.reduce((sum, b) => sum + (b.Total || 0), 0);
    const porcentajeSobreTotal = totalCotizaciones > 0 ? (valorTotalComplementos / totalCotizaciones) * 100 : 0;

    // Calcular valor promedio por complemento
    const totalComplementos = Object.values(complementCounts).reduce((sum, count) => sum + count, 0);
    const valorPromedio = totalComplementos > 0 ? valorTotalComplementos / totalComplementos : 0;

    // Margenes estimados por tipo (ajustar según datos reales)
    const margenesPorTipo = {
        puertas: 0.28,
        tabiques: 0.35,
        barandas: 0.30,
        otros: 0.25
    };

    return {
        valorTotal: valorTotalComplementos,
        porcentajeSobreTotal,
        valorPromedio,
        valorPorTipo,
        margenesPorTipo,
        cantidadPorTipo
    };
};

const ReporteConsumoComplementos = () => {
    const [loading, setLoading] = useState(false);
    const [budgets, setBudgets] = useState([]);
    const [complementCounts, setComplementCounts] = useState({});
    const [generar, setGenerar] = useState(false);

    // Estados para filtros
    const defaultDates = getDefaultDates();
    const [fechaDesde, setFechaDesde] = useState(defaultDates.desde);
    const [fechaHasta, setFechaHasta] = useState(defaultDates.hasta);
    const [tipoComplemento, setTipoComplemento] = useState('todos');

    // Estados para paginación
    const [paginaActual, setPaginaActual] = useState(1);
    const [itemsPorPagina] = useState(10);

    // Estados para datos de evolución y análisis
    const [datosEvolucion, setDatosEvolucion] = useState([]);
    const [analisisMonetario, setAnalisisMonetario] = useState(null);

    // Estados para validación de roles
    const [userRole, setUserRole] = useState(null);
    const [roleLoading, setRoleLoading] = useState(true);
    const requiredRoles = ['coordinator', 'manager']; // Coordinador y gerente pueden ver este reporte

    const pdfRef = useRef();
    const navigate = useNavigate();

    // Verificación de rol
    useEffect(() => {
        const checkUserRole = () => {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/");
                return;
            }

            try {
                // Decodificar el JWT directamente - INSTANTÁNEO
                const payload = JSON.parse(atob(token.split('.')[1]));
                const role = payload?.role?.toLowerCase() ||
                    payload?.Role?.toLowerCase() ||
                    payload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']?.toLowerCase();

                if (role) {
                    setUserRole(role);
                    setRoleLoading(false);
                    return; // ¡No hace falta llamar a la API!
                }
            } catch (error) {
                console.debug('No se pudo decodificar JWT');
            }

            // Fallback: llamar a la API solo si falla el JWT
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
    };

    // Loading mientras verifica rol
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

    // Usuario no autorizado
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
                        Este reporte está disponible únicamente para los roles de Supervisor y Gerente.
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

    // Validación de rango de fechas
    const invalidRange = (() => {
        const d = parseDateString(fechaDesde);
        const h = parseDateString(fechaHasta);
        if (!d || !h) return true;
        return d.getTime() > h.getTime();
    })();

    // Función para obtener datos
    const fetchData = async (fromStr, toStr) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const url = `${API_URL}/api/Mongo/GetAllBudgetsWithComplements?from=${encodeURIComponent(fromStr)}&to=${encodeURIComponent(toStr)}`;

            const res = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Normalizar respuesta
            let data = [];
            if (Array.isArray(res.data)) data = res.data;
            else if (res.data && Array.isArray(res.data.$values)) data = res.data.$values;
            else if (res.data && Array.isArray(res.data.values)) data = res.data.values;
            else if (res.data && typeof res.data === 'object') {
                const possible = Object.values(res.data).find(v => Array.isArray(v));
                data = Array.isArray(possible) ? possible : [];
            }

            // Filtrar solo cotizaciones aprobadas
            const approvedBudgets = data.filter(budget => budget.status === 'Approved');
            setBudgets(approvedBudgets);

            // Contar complementos
            const counts = {};
            approvedBudgets.forEach(b => {
                const names = getComplementNames(b.Complement || b.complement || b.Complements || b.Complemento);
                names.forEach(name => {
                    counts[name] = (counts[name] || 0) + 1;
                });
            });
            setComplementCounts(counts);

            // Calcular evolución temporal con datos reales
            setDatosEvolucion(calcularEvolucionTemporal(approvedBudgets));

            // Calcular análisis monetario con datos reales
            setAnalisisMonetario(calcularAnalisisMonetario(approvedBudgets, counts));

        } catch (err) {
            console.error('Error fetching budgets with complements:', err);
            alert('Error al obtener cotizaciones con complementos.');
            setBudgets([]);
            setAnalisisMonetario(null);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerarReporte = () => {
        if (!fechaDesde || !fechaHasta || invalidRange) {
            alert('Rango inválido: Verifique las fechas Desde/Hasta.');
            return;
        }
        setGenerar(true);
        setPaginaActual(1); // Resetear a primera página
        fetchData(fechaDesde, fechaHasta);
    };

    const handleImprimir = () => window.print();
    const handleDescargarPDF = () => {
        if (!pdfRef.current) return;
        const scrollBtn = document.querySelector('.scroll-to-top-btn');
        if (scrollBtn) scrollBtn.style.display = 'none';
        const opt = {
            margin: [0.2, 0.2, 0.2, 0.2],
            filename: `reporte_consumo_complementos.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0 },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };
        setTimeout(() => {
            html2pdf().set(opt).from(pdfRef.current).save().then(() => {
                if (scrollBtn) scrollBtn.style.display = '';
            });
        }, 100);
    };

    // Imprimir solo el área del reporte
    const handlePrint = () => {
        document.body.classList.add('print-consumo-complementos-only');
        setTimeout(() => {
            window.print();
            setTimeout(() => {
                document.body.classList.remove('print-consumo-complementos-only');
            }, 100);
        }, 50);
    };

    // Filtrar complementos por tipo
    const filtrarPorTipo = (complementos) => {
        if (tipoComplemento === 'todos') return complementos;

        const tipos = {
            'puertas': ['puerta', 'door', 'puerta interior', 'puerta exterior', 'puerta de servicio', 'puerta reforzada'],
            'tabiques': ['tabique', 'partition', 'tabique tecno'],
            'barandas': ['baranda', 'railing', 'baranda city', 'baranda imperia']
        };

        return complementos.filter(comp =>
            tipos[tipoComplemento].some(palabra =>
                comp.toLowerCase().includes(palabra)
            )
        );
    };

    // Calcular métricas para KPIs
    const calcularMetricas = () => {
        const totalComplementos = Object.values(complementCounts).reduce((sum, count) => sum + count, 0);
        const complementoMasUsado = Object.keys(complementCounts).reduce((a, b) =>
            complementCounts[a] > complementCounts[b] ? a : b, '');
        const cotizacionesConComplementos = budgets.filter(b => {
            const comps = getComplementNames(b.Complement || b.complement || b.Complemento);
            return comps.length > 0;
        }).length;
        const tasaUso = budgets.length > 0 ? (cotizacionesConComplementos / budgets.length * 100).toFixed(1) : 0;

        return {
            totalComplementos,
            complementoMasUsado,
            usosComplementoMasUsado: complementCounts[complementoMasUsado] || 0,
            cotizacionesConComplementos,
            tasaUso,
            valorPromedio: analisisMonetario ? analisisMonetario.valorPromedio : 0
        };
    };

    const metricas = calcularMetricas();

    // Datos para el gráfico de barras (filtrando por tipo)
    const complementNamesFiltrados = Object.keys(complementCounts)
        .filter(name => {
            const comps = [name];
            return filtrarPorTipo(comps).length > 0;
        })
        .sort((a, b) => complementCounts[b] - complementCounts[a])
        .slice(0, 10); // Top 10

    const complementValuesFiltrados = complementNamesFiltrados.map(name => complementCounts[name]);

    const chartData = {
        labels: complementNamesFiltrados,
        datasets: [{
            label: 'Cantidad de usos',
            data: complementValuesFiltrados,
            backgroundColor: [
                '#26b7cd', '#2dd4bf', '#3b82f6', '#8b5cf6', '#ec4899',
                '#f59e0b', '#84cc16', '#ef4444', '#06b6d4', '#8b5cf6'
            ],
            borderColor: '#1e293b',
            borderWidth: 2,
        }]
    };

    const chartOptions = {
        plugins: {
            datalabels: {
                color: '#222',
                font: { weight: 'bold', size: 12 },
                anchor: 'end',
                align: 'right',
                formatter: (value) => value,
            },
            legend: { display: false }
        },
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 8, bottom: 8, left: 8, right: 8 } },
        scales: {
            x: {
                beginAtZero: true,
                precision: 0,
                grid: { display: true },
                ticks: {
                    callback: function (value) {
                        return value;
                    }
                }
            },
            y: {
                ticks: {
                    autoSkip: false,
                    maxRotation: 0,
                    minRotation: 0,
                    callback: function (value, index) {
                        const label = this.getLabelForValue(index);
                        return label.length > 25 ? label.substring(0, 25) + '...' : label;
                    }
                },
                grid: { display: false }
            }
        }
    };

    // Datos para el gráfico de evolución temporal (con datos reales)
    const evolucionChartData = {
        labels: datosEvolucion.map(d => `${d.mesNombre} ${d.año}`),
        datasets: [{
            label: 'Complementos por Mes',
            data: datosEvolucion.map(d => d.complementos),
            borderColor: '#26b7cd',
            backgroundColor: 'rgba(38, 183, 205, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
        }]
    };

    const evolucionChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                    label: function (context) {
                        return `Complementos: ${context.parsed.y}`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                },
                ticks: {
                    color: '#94a3b8',
                    precision: 0
                }
            },
            x: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                },
                ticks: {
                    color: '#94a3b8'
                }
            }
        }
    };

    // Paginación para la tabla
    const budgetsConComplementos = budgets.filter(b => {
        const comps = getComplementNames(b.Complement || b.complement || b.Complemento);
        return comps.length > 0;
    });

    const indiceUltimoItem = paginaActual * itemsPorPagina;
    const indicePrimerItem = indiceUltimoItem - itemsPorPagina;
    const budgetsPaginados = budgetsConComplementos.slice(indicePrimerItem, indiceUltimoItem);
    const totalPaginas = Math.ceil(budgetsConComplementos.length / itemsPorPagina);

    const cambiarPagina = (numeroPagina) => {
        setPaginaActual(numeroPagina);
    };

    const handleOpenQuotation = (b) => {
        const qId = b.budgetId || b._id || b.id || null;
        if (qId) {
            window.open(`/quotation/${qId}`);
        } else {
            alert('No se encontró ID de cotización para abrir.');
        }
    };

    // Función para obtener icono según tipo de complemento
    const getIconoTipo = (complemento) => {
        if (complemento.toLowerCase().includes('puerta')) return '🚪';
        if (complemento.toLowerCase().includes('tabique')) return '🏗️';
        if (complemento.toLowerCase().includes('baranda')) return '🎯';
        return '📦';
    };

    // Función para obtener icono de tendencia
    const getIconoTendencia = (tendencia) => {
        switch (tendencia) {
            case 'up': return <TrendingUp size={16} />;
            case 'down': return <TrendingDown size={16} />;
            default: return <MoveRight size={16} />;
        }
    };

    return (
        <div className="dashboard-container">
            <Navigation onLogout={handleLogout} />

            <div className="consumo-complementos-content">
                {/* Header */}
                <div className="consumo-complementos-header">
                    <div className="consumo-complementos-title">
                        <BarChart3 size={32} />
                        <div>
                            <h2 className="estado-header-title">Reporte de Consumo de Complementos</h2>
                            <p>Análisis integral del uso y rentabilidad de complementos en proyectos</p>
                        </div>
                    </div>
                    <div className="consumo-complementos-actions">
                        <button className="cc-btn cc-btn-primary" onClick={handleGenerarReporte} disabled={loading || generar || invalidRange}>
                            <RefreshCw size={18} />
                            {loading ? 'Cargando...' : 'Generar Reporte'}
                        </button>
                        {/* Botón Imprimir */}
                        <button
                            className="cc-btn cc-btn-secondary"
                            style={{ marginLeft: 8 }}
                            onClick={handlePrint}
                            disabled={loading}
                            type="button"
                        >
                            🖨️ Imprimir
                        </button>
                    </div>
                </div>

                {/* Filtros */}
                <div className="consumo-complementos-filtros">
                    <div className="cc-filtros-group">
                        <div className="cc-filtro">
                            <label>Desde:</label>
                            <input
                                type="date"
                                value={fechaDesde}
                                onChange={e => setFechaDesde(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                        <div className="cc-filtro">
                            <label>Hasta:</label>
                            <input
                                type="date"
                                value={fechaHasta}
                                onChange={e => setFechaHasta(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                        <div className="cc-filtro">
                            <label>Tipo de Complemento:</label>
                            <select
                                value={tipoComplemento}
                                onChange={e => setTipoComplemento(e.target.value)}
                                disabled={loading}
                                className="cc-select"
                            >
                                <option value="todos">Todos los tipos</option>
                                <option value="puertas">Puertas</option>
                                <option value="tabiques">Tabiques</option>
                                <option value="barandas">Barandas</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Contenido del Reporte */}
                <div className="consumo-complementos-reporte" ref={pdfRef}>
                    {loading && generar ? (
                        <div className="cc-loading">
                            <ReactLoading type="spin" color="#26b7cd" height={80} width={80} />
                            <div>Cargando reporte...</div>
                        </div>
                    ) : !generar ? (
                        <div className="cc-placeholder">
                            <BarChart3 size={64} />
                            <h3>Reporte no generado</h3>
                            <p>Presione "Generar Reporte" para ver el consumo de complementos</p>
                        </div>
                    ) : (
                        <div className="cc-reporte-content">
                            {/* KPIs */}
                            <div className="cc-kpis-grid">
                                <div className="cc-kpi-card">
                                    <div className="cc-kpi-icon" style={{ background: '#26b7cd' }}>
                                        <TrendingUp size={24} />
                                    </div>
                                    <div className="cc-kpi-content">
                                        <div className="cc-kpi-value">{metricas.totalComplementos}</div>
                                        <div className="cc-kpi-label">Total Complementos</div>
                                        {datosEvolucion.length > 1 && (
                                            <div className="cc-kpi-trend positivo">
                                                {datosEvolucion[datosEvolucion.length - 1].complementos > datosEvolucion[0].complementos ? '+↗️' : '→'}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="cc-kpi-card">
                                    <div className="cc-kpi-icon" style={{ background: '#ef4444' }}>
                                        <BarChart3 size={24} />
                                    </div>
                                    <div className="cc-kpi-content">
                                        <div className="cc-kpi-value">
                                            {metricas.complementoMasUsado.length > 20
                                                ? metricas.complementoMasUsado.substring(0, 20) + '...'
                                                : metricas.complementoMasUsado
                                            }
                                        </div>
                                        <div className="cc-kpi-label">Más Usado</div>
                                        <div className="cc-kpi-subtext">{metricas.usosComplementoMasUsado} usos</div>
                                    </div>
                                </div>

                                <div className="cc-kpi-card">
                                    <div className="cc-kpi-icon" style={{ background: '#10b981' }}>
                                        <Calendar size={24} />
                                    </div>
                                    <div className="cc-kpi-content">
                                        <div className="cc-kpi-value">{metricas.cotizacionesConComplementos}</div>
                                        <div className="cc-kpi-label">Cotiz. con Complementos</div>
                                        <div className="cc-kpi-subtext">{metricas.tasaUso}% de tasa de uso</div>
                                    </div>
                                </div>

                                <div className="cc-kpi-card">
                                    <div className="cc-kpi-icon" style={{ background: '#f59e0b' }}>
                                        <DollarSign size={24} />
                                    </div>
                                    <div className="cc-kpi-content">
                                        <div className="cc-kpi-value">${analisisMonetario ? Math.round(analisisMonetario.valorPromedio).toLocaleString() : '0'}</div>
                                        <div className="cc-kpi-label">Valor Promedio</div>
                                        <div className="cc-kpi-subtext">por complemento</div>
                                    </div>
                                </div>
                            </div>

                            {/* Evolución Temporal */}
                            {datosEvolucion.length > 0 && (
                                <div className="cc-evolucion-section">
                                    <h3>📈 Evolución Temporal del Consumo</h3>
                                    <div className="cc-evolucion-content">
                                        <div className="cc-evolucion-chart">
                                            <Line data={evolucionChartData} options={evolucionChartOptions} />
                                        </div>
                                        <div className="cc-evolucion-detalle">
                                            <h4>Resumen por Mes</h4>
                                            <div className="cc-evolucion-lista">
                                                {datosEvolucion.map((mes, index) => (
                                                    <div key={index} className="cc-evolucion-item">
                                                        <span className="cc-evolucion-mes">{mes.mesNombre} {mes.año}</span>
                                                        <span className="cc-evolucion-valor">{mes.complementos} complementos</span>
                                                        <span className={`cc-evolucion-tendencia ${mes.tendencia}`}>
                                                            {getIconoTendencia(mes.tendencia)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Análisis Monetario */}
                            {analisisMonetario && (
                                <div className="cc-analisis-section">
                                    <h3>💰 Análisis Monetario y Rentabilidad</h3>
                                    <div className="cc-analisis-grid">
                                        <div className="cc-analisis-card">
                                            <h4>Valor Total</h4>
                                            <div className="cc-analisis-valor">
                                                ${Math.round(analisisMonetario.valorTotal).toLocaleString()}
                                            </div>
                                            <div className="cc-analisis-subtext">
                                                {analisisMonetario.porcentajeSobreTotal.toFixed(1)}% del total de cotizaciones
                                            </div>
                                        </div>

                                        <div className="cc-analisis-card">
                                            <h4>Distribución por Tipo</h4>
                                            <div className="cc-distribucion-tipos">
                                                <div className="cc-tipo-item">
                                                    <span className="cc-tipo-nombre">🚪 Puertas</span>
                                                    <span className="cc-tipo-valor">
                                                        ${Math.round(analisisMonetario.valorPorTipo.puertas).toLocaleString()}
                                                    </span>
                                                    <span className="cc-tipo-margen">
                                                        Margen: {(analisisMonetario.margenesPorTipo.puertas * 100).toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div className="cc-tipo-item">
                                                    <span className="cc-tipo-nombre">🏗️ Tabiques</span>
                                                    <span className="cc-tipo-valor">
                                                        ${Math.round(analisisMonetario.valorPorTipo.tabiques).toLocaleString()}
                                                    </span>
                                                    <span className="cc-tipo-margen">
                                                        Margen: {(analisisMonetario.margenesPorTipo.tabiques * 100).toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div className="cc-tipo-item">
                                                    <span className="cc-tipo-nombre">🎯 Barandas</span>
                                                    <span className="cc-tipo-valor">
                                                        ${Math.round(analisisMonetario.valorPorTipo.barandas).toLocaleString()}
                                                    </span>
                                                    <span className="cc-tipo-margen">
                                                        Margen: {(analisisMonetario.margenesPorTipo.barandas * 100).toFixed(1)}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Gráfico de Complementos */}
                            {complementNamesFiltrados.length > 0 && (
                                <div className="cc-grafico-section">
                                    <h3>🔥 Complementos Más Utilizados (Top 10)</h3>
                                    <div className="cc-grafico-container">
                                        <Bar data={chartData} options={chartOptions} />
                                    </div>
                                </div>
                            )}

                            {/* Tabla de Cotizaciones */}
                            <div className="cc-tabla-section">
                                <div className="cc-tabla-header">
                                    <h3>📋 Detalle de Cotizaciones con Complementos</h3>
                                    <span className="cc-tabla-count">
                                        {budgetsConComplementos.length} cotizaciones encontradas
                                    </span>
                                </div>

                                {budgetsPaginados.length > 0 ? (
                                    <>
                                        <div className="cc-tabla-container">
                                            <table className="cc-tabla">
                                                <thead>
                                                    <tr>
                                                        <th>ID</th>
                                                        <th>Cliente</th>
                                                        <th>Fecha</th>
                                                        <th>Complementos</th>
                                                        <th>Valor</th>
                                                        <th>Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {budgetsPaginados.map((b, idx) => {
                                                        const complementos = getComplementNames(b.Complement || b.complement || b.Complemento);
                                                        const complementosFiltrados = filtrarPorTipo(complementos);
                                                        if (complementosFiltrados.length === 0) return null;

                                                        const qId = b.budgetId || b._id || b.id || '';
                                                        return (
                                                            <tr key={`${qId}-${idx}`}>
                                                                <td className="cc-id">{qId}</td>
                                                                <td className="cc-cliente">
                                                                    {b.customer?.name || b.customer?.lastname ?
                                                                        `${b.customer?.name || ''} ${b.customer?.lastname || ''}` :
                                                                        'N/A'
                                                                    }
                                                                </td>
                                                                <td className="cc-fecha">
                                                                    {b.creationDate ? formatFecha(b.creationDate) :
                                                                        (b.creationDateString ? formatFecha(b.creationDateString) : '')}
                                                                </td>
                                                                <td className="cc-complementos">
                                                                    <div className="cc-complementos-list">
                                                                        {complementosFiltrados.slice(0, 3).map((comp, compIdx) => (
                                                                            <span key={compIdx} className="cc-complemento-tag">
                                                                                {getIconoTipo(comp)} {comp}
                                                                            </span>
                                                                        ))}
                                                                        {complementosFiltrados.length > 3 && (
                                                                            <span className="cc-complemento-more">
                                                                                +{complementosFiltrados.length - 3} más
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="cc-valor">
                                                                    ${b.Total ? Math.round(b.Total).toLocaleString() : 'N/A'}
                                                                </td>
                                                                <td className="cc-acciones">
                                                                    <button
                                                                        className="cc-btn cc-btn-small"
                                                                        onClick={() => handleOpenQuotation(b)}
                                                                        disabled={!qId}
                                                                    >
                                                                        Ver
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Paginación */}
                                        {totalPaginas > 1 && (
                                            <div className="cc-paginacion">
                                                <button
                                                    className="cc-paginacion-btn"
                                                    onClick={() => cambiarPagina(paginaActual - 1)}
                                                    disabled={paginaActual === 1}
                                                >
                                                    <ChevronLeft size={16} />
                                                    Anterior
                                                </button>

                                                <div className="cc-paginacion-numeros">
                                                    {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(numero => (
                                                        <button
                                                            key={numero}
                                                            className={`cc-paginacion-numero ${paginaActual === numero ? 'activo' : ''}`}
                                                            onClick={() => cambiarPagina(numero)}
                                                        >
                                                            {numero}
                                                        </button>
                                                    ))}
                                                </div>

                                                <button
                                                    className="cc-paginacion-btn"
                                                    onClick={() => cambiarPagina(paginaActual + 1)}
                                                    disabled={paginaActual === totalPaginas}
                                                >
                                                    Siguiente
                                                    <ChevronRight size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="cc-no-data">
                                        No se encontraron cotizaciones con complementos para los filtros seleccionados.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Acciones de Exportación */}
                {/*{generar && !loading && (*/}
                {/*    <div className="cc-acciones-export">*/}
                {/*        <button className="cc-btn cc-btn-secondary" onClick={handleDescargarPDF}>*/}
                {/*            Descargar PDF*/}
                {/*        </button>*/}
                {/*        <button className="cc-btn cc-btn-secondary" onClick={handleImprimir}>*/}
                {/*            Imprimir Reporte*/}
                {/*        </button>*/}
                {/*    </div>*/}
                {/*)}*/}
            </div>

            <ScrollToTopButton />
            <Footer />
        </div>
    );
};

export default ReporteConsumoComplementos;