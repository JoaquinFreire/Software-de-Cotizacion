import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { jwtDecode } from "jwt-decode";
import axios from 'axios';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Historial from './pages/Historial';
import Admin from './pages/Admin';
import Quotation from './pages/Quotation';
import QuotationNewVersion from './pages/QuotationNewVersion';
import UpdateQuotation from './pages/UpdateQuotation';
import AdminUsuarios from './pages/admin/AdminUsuarios';
import Reportes from './pages/Reportes';
import ReporteEstadoCotizaciones from './pages/reportes/ReporteEstadoCotizaciones';
import AnalisisDeProyectoPorUbicacionGeografica from './pages/reportes/AnalisisDeProyectoPorUbicacionGeografica';
import LineaDeTiempoCotizaciones from './pages/reportes/LineaDeTiempoCotizaciones';
import DashboardEficienciaOperativa from './pages/reportes/DashboardEficienciaOperativa';
import ReporteDeOportunidadesPerdidas from './pages/reportes/ReporteOportunidadesPerdidas';
import BeneficioEnCotizaciocionesPorTipoDeLinea from './pages/reportes/BeneficioEnCotizaciocionesPorTipoDeLinea';
import ReporteDeProductividadPorCotizador from './pages/reportes/ReporteDeProductividadPorCotizador';
import DashboardMetricasPersonales from './pages/reportes/DashboardMetricasPersonales';
import DashboardSostenibilidad from './pages/reportes/DashboardSostenibilidad';
import ReporteConsumoComplementos from './pages/reportes/ReporteConsumoComplementos';
import ReporteDeTendenciasDeCotizacionPorMes from './pages/reportes/ReporteDeTendenciasDeCotizacionPorMes';
import ReportesMaterialesUsados from './pages/reportes/ReporteMaterialesUsados';
import BudgetDetail from './pages/BudgetDetail';
import CreatePassword from './pages/CreatePassword';
import SessionModal from './components/SessionModal';
import Customers from './pages/Customers';
import Materiales from './pages/Materials/Materiales';
import Aberturas from './pages/openings/Aberturas';
import { QuotationProvider } from './context/QuotationContext'; 
import { CustomerProvider } from './context/customerContext';
import Home from "./components/Home";
import AdminMaterials from "./pages/admin/AdminMaterials";
import AdminPrices from "./pages/admin/AdminPrices";
import AdminOpening from "./pages/admin/AdminOpening";
import Administrar from "./pages/admin/Administrar";
import Coating from './pages/Materials/coating';
import AluminumTreatment from './pages/Materials/aluminumTreatment'; 
import TypeGlass from './pages/Materials/TypeGlass';
import Accesories from './pages/openings/Accesories';
import TypeLine from './pages/openings/TypeLine';
import Complement from './pages/openings/Complement';
import AnalisisSatisfaccionCliente from './pages/reportes/AnalisisSatisfaccionCliente';
import ConfigUser from './components/ConfigUser';
import ClienteConMayorVolumen from './pages/reportes/ClienteConMayorVolumen';
// nuevos imports: páginas separadas de admin/materiales
import AdminTreatment from "./pages/admin/materiales/AdminTreatment";
import AdminCoating from "./pages/admin/materiales/AdminCoating";
import AdminComplements from "./pages/admin/materiales/AdminComplements";
import AdminGlass from "./pages/admin/materiales/AdminGlass";
import AdminAccesory from "./pages/admin/materiales/AdminAccesory";

const API_URL = process.env.REACT_APP_API_URL;

const PrivateRoute = ({ element }) => {
    const token = localStorage.getItem('token');
    return token ? element : <Navigate to="/" />;
};

const PublicRoute = ({ element }) => {
    const token = localStorage.getItem('token');
    return token ? <Navigate to="/home" /> : element;
};

function App() {
    // Estado para controlar la visibilidad del modal de sesión
    const [showSessionModal, setShowSessionModal] = useState(false);
    // Estado para almacenar el identificador del intervalo
    const [intervalId, setIntervalId] = useState(null);
    /* const [sessionExpired, setSessionExpired] = useState(false); */


    useEffect(() => {
        // Aplica un filtro visual si está activado en el localStorage
        const savedFilterState = localStorage.getItem("blueLightFilter");
        if (savedFilterState === null || savedFilterState === "true") {
            document.body.classList.add("filtro");
        }

        // Obtiene el token del localStorage
        const token = localStorage.getItem('token');
        if (token) {
            const decodedToken = jwtDecode(token); // Decodifica el token para obtener su tiempo de expiración
            const expirationTime = decodedToken.exp * 1000; // Convierte de segundos a milisegundos
            const currentTime = Date.now(); // Obtiene la hora actual en milisegundos
            const timeLeft = expirationTime - currentTime; // Calcula cuánto tiempo queda antes de que expire

            if (timeLeft <= 0) {
                // Si ya expiró, cierra la sesión
                handleLogout();
            } else {
                const warningTime = 10 * 60 * 1000; // Tiempo de advertencia (5 minutos antes de la expiración)

                if (timeLeft <= warningTime) {
                    // Si el tiempo restante es menor al de advertencia, muestra el modal
                    setShowSessionModal(true);
                }

                // Crea un intervalo que revisa cada segundo el tiempo restante
                const id = setInterval(() => {
                    const currentTime = Date.now();
                    const timeLeft = expirationTime - currentTime;
                    if (timeLeft <= 0) {
                        // Si ya expiró, cierra sesión
                        handleLogout();
                        /* setSessionExpired(true); */ // Force re-render
                        return <Navigate to="/" />;
                    } else if (timeLeft <= warningTime) {
                        // Si está dentro del período de advertencia, muestra el modal
                        setShowSessionModal(true);
                    }
                }, 1000); // Se ejecuta cada segundo

                setIntervalId(id); // Guarda el identificador del intervalo

                // Limpia el intervalo cuando el componente se desmonta
                return () => clearInterval(id);
            }
        }
    }, []);

    // Función para extender la sesión
    const handleExtendSession = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_URL}/api/auth/extend-session`,
                {}, // No envía datos en el cuerpo
                { headers: { Authorization: `Bearer ${token}` } } // Adjunta el token en la cabecera
            );

            // Guarda el nuevo token en el localStorage
            localStorage.setItem('token', response.data.token);
            setShowSessionModal(false); // Oculta el modal

            // Reinicia la verificación de sesión
            clearInterval(intervalId);
            startSessionCheck();
        } catch (error) {
            console.error('Error extending session:', error);
            handleLogout(); // Si hay un error, cierra la sesión
        }
    };

    // Inicia la verificación de sesión nuevamente después de extenderla
    const startSessionCheck = () => {
        const token = localStorage.getItem('token');
        if (token) {
            const decodedToken = jwtDecode(token);
            const expirationTime = decodedToken.exp * 1000;
            const currentTime = Date.now();
            const timeLeft = expirationTime - currentTime;

            const warningTime = 2 * 60 * 1000; // Tiempo de advertencia de 2 minutos
            if (timeLeft <= warningTime) {
                setShowSessionModal(true);
            }

            const id = setInterval(() => {
                const currentTime = Date.now();
                const timeLeft = expirationTime - currentTime;

                if (timeLeft <= 0) {
                    handleLogout();
                } else if (timeLeft <= warningTime) {
                    setShowSessionModal(true);
                }
            }, 1000);

            setIntervalId(id);
        }
    };

    // Cierra la sesión eliminando el token y redirigiendo al login
    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/';
    };

    return (
        <QuotationProvider>
            <CustomerProvider>
                <Router>
                    <Routes>
                        <Route path="/" element={<PublicRoute element={<Login />} />} />
                        <Route path="/home" element={<PrivateRoute element={<Home />} />} />
                        <Route path="/cotizaciones" element={<PrivateRoute element={<Dashboard />}/>} />
                        <Route path="/historial" element={<PrivateRoute element={<Historial />} />} />
                        <Route path="/new-quotation" element={<PrivateRoute element={<Quotation />} />} />
                        <Route path="/update-quotation/:id" element={<PrivateRoute element={<UpdateQuotation />} />} />
                        <Route path="/admin" element={<PrivateRoute element={<Admin />} />} />
                        <Route path="/admin/usuarios" element={<PrivateRoute element={<AdminUsuarios />} />} />
                        <Route path="/admin/materiales" element={<PrivateRoute element={<AdminMaterials />} />} />
                        <Route path="/admin/materiales/tratamientos" element={<PrivateRoute element={<AdminTreatment />} />} />
                        <Route path="/admin/materiales/revestimientos" element={<PrivateRoute element={<AdminCoating />} />} />
                        <Route path="/admin/materiales/complementos" element={<PrivateRoute element={<AdminComplements />} />} />
                        <Route path="/admin/materiales/tipos-vidrio" element={<PrivateRoute element={<AdminGlass />} />} />
                        <Route path="/admin/materiales/accesorios" element={<PrivateRoute element={<AdminAccesory />} />} />
                        <Route path="/admin/prices" element={<PrivateRoute element={<AdminPrices />} />} />
                        <Route path="/admin/aberturas" element={<PrivateRoute element={<AdminOpening />} />} />
                        <Route path="/admin/Administrar" element={<PrivateRoute element={<Administrar />} />} />
                        <Route path="/reportes" element={<PrivateRoute element={<Reportes />} />} />
                        <Route path="/reportes/estado-cotizaciones" element={<PrivateRoute element={<ReporteEstadoCotizaciones />} />} />
                        <Route path="/reportes/ubicacion-geografica" element={<PrivateRoute element={<AnalisisDeProyectoPorUbicacionGeografica />} />} />
                        <Route path="/reportes/analisis-satisfaccion-cliente" element={<AnalisisSatisfaccionCliente />} />
                        <Route path="/reportes/LineaDeTiempoCotizaciones" element={<PrivateRoute element={<LineaDeTiempoCotizaciones />} />} />
                        <Route path="/reportes/Oportunidades-Perdidas" element={<PrivateRoute element={<ReporteDeOportunidadesPerdidas />} />} />
                        <Route path="/reportes/beneficio-proyecto" element={<PrivateRoute element={<BeneficioEnCotizaciocionesPorTipoDeLinea />} />} />
                        <Route path="/reportes/productividad-cotizador" element={<PrivateRoute element={<ReporteDeProductividadPorCotizador />} />} />
                        <Route path="/reportes/metrica-personal" element={<PrivateRoute element={<DashboardMetricasPersonales />} />} />
                        <Route path="/reportes/sostenibilidad" element={<PrivateRoute element={<DashboardSostenibilidad />} />} />
                        <Route path="/reportes/consumo-complementos" element={<PrivateRoute element={<ReporteConsumoComplementos />} />} />
                        <Route path="/reportes/tendencias-mensuales" element={<PrivateRoute element={<ReporteDeTendenciasDeCotizacionPorMes />} />} />
                        <Route path="/reportes/cliente-mayor-volumen"element={<PrivateRoute element={<ClienteConMayorVolumen />} />}/>
                        <Route path="/reportes/materiales-mas-utilizados" element={<PrivateRoute element={<ReportesMaterialesUsados />} />} />
                        <Route path="/operational-dashboard" element={<PrivateRoute element={<DashboardEficienciaOperativa />} />} />
                        <Route path="/quotation" element={<PrivateRoute element={<Quotation />} />} />
                        <Route path="/quotation/:id" element={<PrivateRoute element={<BudgetDetail />} />} />
                        <Route path="/quotation-new-version/:id" element={<PrivateRoute element={<QuotationNewVersion />} />} />
                        <Route path="/crear-password" element={<PublicRoute element={<CreatePassword />} />} />
                        <Route path="/customers" element={<PrivateRoute element={<Customers />} />} />
                        <Route path="/materiales" element={<PrivateRoute element={<Materiales />} />} />
                        <Route path="/aberturas" element={<PrivateRoute element={<Aberturas />} />} />
                        <Route path="/openings/accessories" element={<PrivateRoute element={<Accesories />} />} />
                        <Route path="/openings/Complement" element={<PrivateRoute element={<Complement />} />} />
                        <Route path="/openings/typesLines" element={<PrivateRoute element={<TypeLine />} />} />
                        <Route path="/materials/coating" element={<PrivateRoute element={<Coating />} />} />
                        <Route path="/materials/aluminumTreatment" element={<PrivateRoute element={<AluminumTreatment />} />} />
                        <Route path="/materials/typeglass" element={<PrivateRoute element={<TypeGlass />} />} />
                        <Route path="/config-user" element={<PrivateRoute element={<ConfigUser />} />} />

                        {/* Ruta catch-all para redirigir a la página principal */}
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                    <SessionModal show={showSessionModal} onExtend={handleExtendSession} onLogout={handleLogout} />
                </Router>
            </CustomerProvider>
        </QuotationProvider>
    );
}

export default App;