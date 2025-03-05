import React from 'react';
import logoSecundario from '../images/logo_secundario.png'; // Importar la imagen
import '../styles/footerLogo.css'; // Importar los estilos

const FooterLogo = () => {
    return (
        <div className="footer-logo">
            <img src={logoSecundario} alt="Logo Secundario" />
        </div>
    );
};

export default FooterLogo;
