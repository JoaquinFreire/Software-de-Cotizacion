import React from "react";
import "../styles/footer.css";

const Footer = () => (
    <footer className="main-footer">
        <div className="footer-content">
            <div className="footer-brand">
                <span className="footer-logo-circle">SC</span>
                <span className="footer-title">Software de Cotización</span>
            </div>
            <span className="footer-divider">|</span>
            <span className="footer-copy">
                &copy; {new Date().getFullYear()} UNC - Todos los derechos reservados
            </span>
        </div>
    </footer>
);

export default Footer;
