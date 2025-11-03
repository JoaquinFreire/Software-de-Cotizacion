import React, { useEffect, useContext, useState, useRef } from 'react';
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import "../styles/clientes.css";
import { useNavigate } from "react-router-dom";
import Skeleton from "react-loading-skeleton";
import 'react-loading-skeleton/dist/skeleton.css';
import { CustomerContext } from "../context/customerContext";
import { safeArray } from "../utils/safeArray";
import ReactLoading from "react-loading";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


const Customers = () => {
  const handleLogout = () => {
          localStorage.removeItem("token");
          navigate("/");
      };
  const {
    customers, page, total, loading, PAGE_SIZE,
    goToCustomerPage, switchToCustomers,
    createCustomer, updateCustomer, fetchCustomerByDni, fetchCustomers
  } = useContext(CustomerContext);

  const [searchTerm] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState([]);

  // new: DNI search state
  const [searchDni, setSearchDni] = useState("");
  const [searchResult, setSearchResult] = useState(undefined); // undefined = no search yet, null = not found, object = found

  // modal/form state
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState("create"); // "create" | "update"
  const [formData, setFormData] = useState({
    name: "", lastname: "", dni: "", tel: "", mail: "", address: ""
  });
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // Contact menu state
  const [contactMenu, setContactMenu] = useState({ visible: false, cliente: null, x: 0, y: 0 });
  const contactMenuRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    switchToCustomers();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  useEffect(() => {
    if (!customers) {
      setFilteredCustomers([]);
      return;
    }
    const arr = safeArray(customers); // <-- Normaliza aquí
    setFilteredCustomers(
      arr.filter((cliente) =>
        `${cliente.name} ${cliente.lastname}`.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [customers, searchTerm]);

  // handlers for modal form
  const openCreateForm = () => {
    setFormMode("create");
    setFormData({ name: "", lastname: "", dni: "", tel: "", mail: "", address: "" });
    setShowForm(true);
  };

  const handleUpdate = (cliente) => {
    // if called from map we pass the whole cliente
    const c = cliente || {};
    setFormMode("update");
    setFormData({
      name: c.name ?? "",
      lastname: c.lastname ?? "",
      dni: c.dni ?? "",
      tel: c.tel ?? "",
      mail: c.mail ?? "",
      address: c.address ?? ""
    });
    setShowForm(true);
  };

  const handleDetails = (id) => {
    navigate(`/customers/${id}/detalle`);
  };

  const handleAgent = (agent) => {
    if (agent && agent.id) {
      navigate(`/agentes/${agent.id}`);
    }
  };

  // Open create modal (used by + Nuevo Cliente button)
  const handleCreate = () => {
    openCreateForm();
  };

  // Wrapper used by Contact buttons to open the contact menu and
  // prevent event bubbling from triggering other click handlers
  const handleContact = (cliente, event) => {
    if (event && typeof event.stopPropagation === "function") event.stopPropagation();
    openContactMenu(cliente, event);
  };

  // Open contact menu (position is optional; we'll center if not provided)
  const openContactMenu = (cliente, event) => {
    const x = event?.clientX ?? window.innerWidth / 2;
    const y = event?.clientY ?? window.innerHeight / 2;
    setContactMenu({ visible: true, cliente, x, y });
  };

  const closeContactMenu = () => setContactMenu({ visible: false, cliente: null, x: 0, y: 0 });

  // contact actions
  const contactByMail = (cliente) => {
    if (!cliente?.mail) return;
    window.open(`mailto:${cliente.mail}`, "_blank");
    closeContactMenu();
  };

  const contactByWhatsapp = (cliente) => {
    if (!cliente?.tel) return;
    // Normalize phone: keep only digits and plus sign if present at start
    let tel = String(cliente.tel || "");
    tel = tel.replace(/\s+/g, "");
    // allow leading +, then digits
    const plus = tel.startsWith("+") ? "+" : "";
    tel = plus + tel.replace(/\D/g, "");
    // wa.me requires no plus, country code must be present; remove leading +
    const waNumber = tel.replace(/^\+/, "");
    if (!/^\d+$/.test(waNumber)) {
      toast.error("Número inválido para WhatsApp.");
      closeContactMenu();
      return;
    }
    window.open(`https://wa.me/${waNumber}`, "_blank");
    closeContactMenu();
  };

  // submit form
  const submitForm = async (e) => {
    e.preventDefault();
    setModalSubmitting(true);
    try {
      if (formMode === "create") {
        const payload = {
          name: formData.name,
          lastname: formData.lastname,
          dni: formData.dni,
          tel: formData.tel,
          mail: formData.mail,
          address: formData.address
        };
        const res = await createCustomer(payload);
        if (res.success) {
          toast.success(res.data?.Message ?? "Cliente creado correctamente.");
          setShowForm(false);
          setSearchResult(undefined);
        } else {
          toast.error("Error al crear cliente: " + (typeof res.error === "string" ? res.error : JSON.stringify(res.error)));
        }
      } else {
        const payload = {
          tel: formData.tel,
          mail: formData.mail,
          address: formData.address
        };
        const dni = formData.dni;
        const res = await updateCustomer(dni, payload);
        if (res.success) {
          toast.success(res.data?.Message ?? "Cliente actualizado correctamente.");
          setShowForm(false);
          setSearchResult(undefined);
        } else {
          toast.error("Error al actualizar cliente: " + (typeof res.error === "string" ? res.error : JSON.stringify(res.error)));
        }
      }
    } catch (err) {
      toast.error("Error inesperado: " + (err?.message || String(err)));
    } finally {
      setModalSubmitting(false);
    }
  };

  // search by DNI
  const handleSearchDni = async (e) => {
    e && e.preventDefault();
    if (!searchDni || searchDni.trim() === "") {
      setSearchResult(undefined);
      // volver a cargar listado si estaba filtrado
      await fetchCustomers(1);
      return;
    }
    const res = await fetchCustomerByDni(searchDni.trim());
    setSearchResult(res); // null = not found, object = found
  };
  

  return (
    <div className="dashboard-container">
      <Navigation onLogout={handleLogout} />
      <ToastContainer position="bottom-right" autoClose={3000} />
      <div className="materials-header">
          <h2 className="materials-title">Gestión de Clientes</h2>
          <p className="materials-subtitle">
            Administre y consulte la información de los clientes, realizando busquedas rápidas y manteniendo sus datos actualizados</p>
          </div>
      <div className="clientes-header">


        <form className="search-container" onSubmit={handleSearchDni}>
          <input
            className="search-input"
            type="text"
            placeholder="Buscar por DNI..."
            value={searchDni}
            onChange={(e) => setSearchDni(e.target.value)}
          />
          <div className="search-buttons">
            <button className="btn-search" type="submit">Buscar</button>
            <button className="btn-clear" type="button" onClick={async () => { setSearchDni(""); setSearchResult(undefined); await fetchCustomers(1); }}>
              Limpiar
            </button>
          </div>
        </form>
        <div className="clientes-btn-container">
          <button className="btn-nuevo-cliente" onClick={handleCreate}>
            + Nuevo Cliente
          </button>
        </div>
      </div>

      <div className="clientes-list-container">
        {loading ? (
          <div className="clientes-list">
            {[...Array(PAGE_SIZE)].map((_, i) => (
              <div className="cliente-card skeleton" key={i}>
                <Skeleton height={30} width="60%" />
                <Skeleton height={20} width="40%" />
                <Skeleton height={20} width="50%" />
                <div className="cliente-actions">
                  <Skeleton width={90} height={28} />
                  <Skeleton width={90} height={28} />
                  <Skeleton width={90} height={28} />
                  <Skeleton width={90} height={28} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="clientes-list">
            {/* if a search was performed */}
            {typeof searchResult !== "undefined" ? (
              searchResult === null ? (
                <div className="no-clientes">No se encontró cliente con DNI {searchDni}.</div>
              ) : (
                <div className="cliente-card" key={searchResult.id ?? searchResult.dni}>
                  <div className="cliente-info">
                    <div className="cliente-nombre">
                      <strong>{searchResult.name} {searchResult.lastname}</strong>
                    </div>
                    <div className="cliente-datos">
                      <span><u><b>DNI: </b></u>{searchResult.dni}</span>
                      <span><u><b>Tel: </b></u>{searchResult.tel}</span>
                      <span><u><b>Mail: </b></u>{searchResult.mail}</span>
                      <span><u><b>Dirección: </b></u>{searchResult.address}</span>
                    </div>
                  </div>
                  <div className="cliente-actions">
                    <button className="btn-detalle" onClick={() => handleDetails(searchResult.id)}>
                      <b>Detalles</b>
                    </button>
                    <button className="btn-actualizar" onClick={() => handleUpdate(searchResult)}>
                      <b>Actualizar</b>
                    </button>
                    <button className="btn-agente" onClick={() => handleAgent(searchResult.agent)}>
                      <b>Ver Agente</b>
                    </button>
                    <button className="btn-contactar" onClick={(e) => handleContact(searchResult, e)}>
                      <b>Contactar</b>
                    </button>
                  </div>
                </div>
              )
            ) : (
              // default: paged list
              (!filteredCustomers || filteredCustomers.length === 0) ? (
                <div className="no-clientes">No hay clientes para mostrar.</div>
              ) : (
                safeArray(filteredCustomers).map((cliente) => (
                  <div className="cliente-card" key={cliente.id}>
                    <div className="cliente-info">
                      <div className="cliente-nombre">
                        <strong>{cliente.name} {cliente.lastname}</strong>
                      </div>
                      <div className="cliente-datos">
                        <span><u><b>DNI: </b></u>{cliente.dni}</span>
                        <span><u><b>Tel: </b></u>{cliente.tel}</span>
                        <span><u><b>Mail: </b></u>{cliente.mail}</span>
                        <span><u><b>Dirección: </b></u>{cliente.address}</span>
                      </div>
                    </div>
                    <div className="cliente-actions">
                      <button className="btn-detalle" onClick={() => handleDetails(cliente.id)}>
                        <b>Detalles</b>
                      </button>
                      <button className="btn-actualizar" onClick={() => handleUpdate(cliente)}>
                        <b>Actualizar</b>
                      </button>
                      <button className="btn-agente" onClick={() => handleAgent(cliente.agent)}>
                        <b>Ver Agente</b>
                      </button>
                      <button className="btn-contactar" onClick={(e) => handleContact(cliente, e)}>
                        <b>Contactar</b>
                      </button>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        )}
      </div>

      <div className="pagination-nav">
        <button
          onClick={() => goToCustomerPage(page - 1)}
          disabled={page <= 1}
        >Anterior</button>
        <span>
          Página {page} de {Math.max(1, Math.ceil(total / PAGE_SIZE))}
        </span>
        <button
          onClick={() => goToCustomerPage(page + 1)}
          disabled={page >= Math.ceil(total / PAGE_SIZE)}
        >Siguiente</button>
      </div>

      {/* Contact menu */}
      {contactMenu.visible && (
        <div
          className="contact-menu-overlay"
          role="dialog"
          aria-modal="true"
          onClick={(e) => { /* clicking overlay closes via doc listener */ }}
        >
          <div
            className="contact-menu"
            ref={contactMenuRef}
            style={{ left: Math.min(contactMenu.x, window.innerWidth - 220), top: Math.min(contactMenu.y, window.innerHeight - 140) }}
          >
            <div className="contact-menu-title">Contactar a {contactMenu.cliente?.name ?? ""} {contactMenu.cliente?.lastname ?? ""}</div>
            <div className="contact-menu-actions">
              <button className="btn-mail" onClick={() => contactByMail(contactMenu.cliente)}>Enviar mail</button>
              <button className="btn-wsp" onClick={() => contactByWhatsapp(contactMenu.cliente)}>Enviar WhatsApp</button>
              <button className="btn-cancel" onClick={closeContactMenu}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal / Form: render different fields for create vs update */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{formMode === "create" ? "Crear Cliente" : "Actualizar Cliente"}</h3>
            <form onSubmit={submitForm} className="client-form">
              {formMode === "create" ? (
                <>
                  <input placeholder="Nombre" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                  <input placeholder="Apellido" value={formData.lastname} onChange={(e) => setFormData({ ...formData, lastname: e.target.value })} required />
                  <input placeholder="DNI" value={formData.dni} onChange={(e) => setFormData({ ...formData, dni: e.target.value })} required />
                </>
              ) : (
                <>
                  <div className="readonly-field"><label>Nombre</label><div className="readonly-value">{formData.name}</div></div>
                  <div className="readonly-field"><label>Apellido</label><div className="readonly-value">{formData.lastname}</div></div>
                  <div className="readonly-field"><label>DNI</label><div className="readonly-value">{formData.dni}</div></div>
                </>
              )}

              {/* Editable fields for both modes */}
              <input placeholder="Tel" value={formData.tel} onChange={(e) => setFormData({ ...formData, tel: e.target.value })} required />
              <input placeholder="Mail" value={formData.mail} onChange={(e) => setFormData({ ...formData, mail: e.target.value })} required />
              <input placeholder="Dirección" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} required />

              <div className="form-actions">
                <button type="button" onClick={() => setShowForm(false)} disabled={modalSubmitting}>Cancelar</button>
                <button type="submit" disabled={modalSubmitting}>
                  {modalSubmitting ? <ReactLoading type="spin" color="#fff" height={16} width={16} /> : (formMode === "create" ? "Crear" : "Actualizar")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Customers;

