import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';

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
            </Routes>
        </Router>
    );
}

export default App;
