import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Historial from './pages/Historial';
import Reportes from './pages/Reportes';
import Admin from './pages/Admin';

const PrivateRoute = ({ element }) => {
    const token = localStorage.getItem('token');
    return token ? element : <Navigate to="/" />;
};
const PublicRoute = ({ element }) => {
    const token = localStorage.getItem('token');
    return token ? <Navigate to="/dashboard" /> : element;
};

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<PublicRoute element={<Login />} />} />
                <Route path="/dashboard" element={<PrivateRoute element={<Dashboard />} />} />
                <Route path="/historial" element={<PrivateRoute element={<Historial />} />} />
                <Route path="/reportes" element={<PrivateRoute element={<Reportes />} />} />
                <Route path="/actualizar" element={<PrivateRoute element={<Admin />} />} />
            </Routes>
        </Router>
    );
}

export default App;
