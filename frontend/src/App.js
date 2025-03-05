import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Historial from './pages/Historial';
import Reportes from './pages/Reportes';
import Admin from './pages/Admin';
import Quotation from './pages/Quotation';
import UpdateQuotation from './pages/UpdateQuotation'; // Importar la nueva página

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
                <Route path="/admin" element={<PrivateRoute element={<Admin />} />} />
                <Route path="/new-quotation" element={<PrivateRoute element={<Quotation />} />} />
                <Route path="/update-quotation/:id" element={<PrivateRoute element={<UpdateQuotation />} />} /> {/* Nueva ruta */}
            </Routes>
        </Router>
    );
}

export default App;
