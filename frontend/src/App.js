import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { jwtDecode } from "jwt-decode";
import axios from 'axios'; 
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Historial from './pages/Historial';
import Reportes from './pages/Reportes';
import Admin from './pages/Admin';
import Quotation from './pages/Quotation';
import UpdateQuotation from './pages/UpdateQuotation';
import SessionModal from './components/SessionModal';

// Ruta privada: Solo permite el acceso si hay un token válido
const PrivateRoute = ({ element }) => {
    const token = localStorage.getItem('token');
    return token ? element : <Navigate to="/" />;
};

// Ruta pública: Si el usuario ya tiene un token, lo redirige al dashboard
const PublicRoute = ({ element }) => {
    const token = localStorage.getItem('token');
    return token ? <Navigate to="/dashboard" /> : element;
};

function App() {
    // Estado para controlar la visibilidad del modal de sesión
    const [showSessionModal, setShowSessionModal] = useState(false);
    // Estado para almacenar el identificador del intervalo
    const [intervalId, setIntervalId] = useState(null);

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
                const warningTime = 2 * 60 * 1000; // Tiempo de advertencia (2 minutos antes de la expiración)

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
                'http://localhost:5187/api/auth/extend-session',
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

    // Cancela el modal sin hacer nada
    const handleCancel = () => {
        setShowSessionModal(false);
        clearInterval(intervalId);
    };

    return (
        <Router>
            <Routes>
                <Route path="/" element={<PublicRoute element={<Login />} />} />
                <Route path="/dashboard" element={<PrivateRoute element={<Dashboard />} />} />
                <Route path="/historial" element={<PrivateRoute element={<Historial />} />} />
                <Route path="/reportes" element={<PrivateRoute element={<Reportes />} />} />
                <Route path="/admin" element={<PrivateRoute element={<Admin />} />} />
                <Route path="/new-quotation" element={<PrivateRoute element={<Quotation />} />} />
                <Route path="/update-quotation/:id" element={<PrivateRoute element={<UpdateQuotation />} />} />
            </Routes>
            
            {/* Modal que aparece cuando la sesión está por expirar */}
            <SessionModal 
                show={showSessionModal} 
                onExtend={handleExtendSession} 
                onLogout={handleLogout} 
                onCancel={handleCancel} 
            />
        </Router>
    );
}

export default App;
