// src/components/Footer.jsx
import React, { useEffect, useRef, useState } from "react";
import "../styles/footer.css";
import anodalLogo from "../images/anodal_logo.webp";         // Logo blanco (para fondo oscuro)
import Logonegro from "../images/anodal_logo_Negro.webp";    // Logo negro (para fondo claro)
import { SiGooglemaps } from "react-icons/si";
import { MdOutlinePhoneInTalk } from "react-icons/md";
import { IoMdMailOpen } from "react-icons/io";




const Footer = () => {
  // Helper: lee el tema actual desde varias fuentes
  const readTheme = () => {
    // 1) localStorage si existe
    const fromLS = localStorage.getItem("theme");
    if (fromLS === "light" || fromLS === "dark") return fromLS;

    // 2) clase del body que vos ya manejás en Navigation
    if (typeof document !== "undefined") {
      if (document.body.classList.contains("light-mode")) return "light";
      return "dark";
    }

    // 3) preferencia del SO (fallback)
    const prefersLight =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: light)").matches;
    return prefersLight ? "light" : "dark";
  };

  const [theme, setTheme] = useState(readTheme);
  const lastThemeRef = useRef(theme);

  // Aplica cambios si el tema realmente cambió
  const applyThemeIfChanged = (next) => {
    if (next && next !== lastThemeRef.current) {
      lastThemeRef.current = next;
      setTheme(next);
    }
  };

  // --- Sincronización del tema ---
  useEffect(() => {
    // 1) Observer del body para detectar light-mode agregado/quitado por Navigation
    const body = document.body;
    const observer = new MutationObserver(() => {
      const next = body.classList.contains("light-mode") ? "light" : "dark";
      applyThemeIfChanged(next);
    });
    observer.observe(body, { attributes: true, attributeFilter: ["class"] });

    // 2) Evento custom (si en algún momento lo disparás)
    const onThemeChange = (e) => {
      const next = e?.detail?.theme || readTheme();
      applyThemeIfChanged(next);
    };
    window.addEventListener("themechange", onThemeChange);

    // 3) Cambios de localStorage en otras pestañas
    const onStorage = (e) => {
      if (e.key === "theme") applyThemeIfChanged(readTheme());
    };
    window.addEventListener("storage", onStorage);

    // 4) Poll suave para detectar setItem en la MISMA pestaña (no dispara "storage")
    const intervalId = setInterval(() => {
      applyThemeIfChanged(readTheme());
    }, 100); // 100ms es liviano y responsivo

    // Sync inicial (por si cambió antes de montar)
    applyThemeIfChanged(readTheme());

    return () => {
      observer.disconnect();
      window.removeEventListener("themechange", onThemeChange);
      window.removeEventListener("storage", onStorage);
      clearInterval(intervalId);
    };
  }, []);

  return (
    <footer className="main-footer">
      <div className="footer-container">
        {/* Logo + contacto */}
        <div className="footer-top">
          <img
            src={theme === "light" ? Logonegro : anodalLogo}
            alt="Logo Anodal"
            className="footer-logo"
          />

          <div className="footer-contact-info">
            <div className="footer-contact-item">
              <span className="icon"><SiGooglemaps /></span>
              <a
                href="https://goo.gl/maps/Fs3X9rhw9YPbT7Xn6"
                target="_blank"
                rel="noopener noreferrer"
              >
                Av. Japón 1292 / Córdoba / Argentina
              </a>
            </div>
            <div className="footer-contact-item">
             <span className="icon"><MdOutlinePhoneInTalk /></span>
              <span>0351 4995870</span>
            </div>
            <div className="footer-contact-item">
              <span className="icon"><IoMdMailOpen /></span>
              <a href="mailto:info@anodal.com.ar">info@anodal.com.ar</a>
            </div>
          </div>
        </div>

        {/* Separador */}
        <hr className="footer-divider" />

        {/* Sección inferior */}
        <div className="footer-bottom">
          <span className="footer-logo-circle">SC</span>
          <span className="footer-title">Software de Cotización</span>
          <span className="footer-copy">
            &copy; {new Date().getFullYear()} UNC - Todos los derechos reservados
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
