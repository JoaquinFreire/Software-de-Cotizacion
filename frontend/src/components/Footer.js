import React from "react";
import "../styles/footer.css";
import anodalLogo from "../images/anodal_logo.png";

const Footer = () => (
    <footer className="main-footer">
        <div className="footer-content-vertical">
            <div className="footer-anodal-block">
                <img src={anodalLogo} alt="Logo Anodal" className="footer-anodal-logo" />
                <div className="footer-contact-info">
                    <div className="footer-contact-item">
                        <img
                            className="footer-icon"
                            src="http://anodal.com.ar/wp-content/uploads/2022/01/anodal_icon-map.svg"
                            alt="Dirección"
                            width="18"
                            height="23"
                        />
                        <a
                            href="https://goo.gl/maps/Fs3X9rhw9YPbT7Xn6"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Av. Japón 1292 / Córdoba / Argentina
                        </a>
                    </div>
                    <div className="footer-contact-item">
                        <img
                            className="footer-icon"
                            src="http://anodal.com.ar/wp-content/uploads/2022/01/anodal_icon-cel.svg"
                            alt="Teléfono"
                            width="16"
                            height="23"
                        />
                        <span>0351 4995870</span>
                    </div>
                    <div className="footer-contact-item">
                        <img
                            className="footer-icon"
                            src="http://anodal.com.ar/wp-content/uploads/2022/01/anodal_icon-mail.svg"
                            alt="Email"
                            width="19"
                            height="15"
                        />
                        <a href="mailto:info@anodal.com.ar">info@anodal.com.ar</a>
                    </div>
                </div>
            </div>
            <hr className="footer-horizontal-divider" />
            <div className="footer-bottom-block">
                <span className="footer-logo-circle">SC</span>
                <span className="footer-title">Software de Cotización</span>
                <span className="footer-copy">
                    &copy; {new Date().getFullYear()} UNC - Todos los derechos reservados
                </span>
            </div>
        </div>
    </footer>
);

export default Footer;
