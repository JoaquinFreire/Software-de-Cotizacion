import React, { useEffect, useContext } from 'react';
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import "../styles/clientes.css";
import { useNavigate } from "react-router-dom";
import Skeleton from "react-loading-skeleton";
import 'react-loading-skeleton/dist/skeleton.css';
import { CustomerContext } from "../context/customerContext";

const Customers = () => {
  const {
    customers, page, total, loading, PAGE_SIZE,
    goToCustomerPage, switchToCustomers
  } = useContext(CustomerContext);

  const navigate = useNavigate();

  useEffect(() => {
    switchToCustomers();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  const handleUpdate = (id) => {
    navigate(`/customers/${id}/editar`);
  };

  const handleDetails = (id) => {
    navigate(`/customers/${id}/detalle`);
  };

  const handleAgent = (agent) => {
    if (agent && agent.id) {
      navigate(`/agentes/${agent.id}`);
    }
  };

  const handleContact = (cliente) => {
    if (cliente.mail) {
      window.open(`mailto:${cliente.mail}`, "_blank");
    }
  };

  const handleCreate = () => {
    navigate("/customers/nuevo");
  };

  return (
    <div className="dashboard-container">
      <Navigation />
      <h2 className="title clientes-title-centered">Clientes</h2>
      <div className="clientes-btn-container">
        <button className="btn-nuevo-cliente" onClick={handleCreate}>
          + Nuevo Cliente
        </button>
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
            {(!customers || customers.length === 0) ? (
              <div className="no-clientes">No hay clientes para mostrar.</div>
            ) : (
              customers.map((cliente) => (
                <div className="cliente-card" key={cliente.id}>
                  <div className="cliente-info">
                    <div className="cliente-nombre">
                      <strong>{cliente.name} {cliente.lastname}</strong>
                    </div>
                    <div className="cliente-datos">
                      <span>DNI: {cliente.dni}</span>
                      <span>Tel: {cliente.tel}</span>
                      <span>Mail: {cliente.mail}</span>
                      <span>Dirección: {cliente.address}</span>
                    </div>
                  </div>
                  <div className="cliente-actions">
                    <button className="btn-detalle" onClick={() => handleDetails(cliente.id)}>
                      Detalles
                    </button>
                    <button className="btn-actualizar" onClick={() => handleUpdate(cliente.id)}>
                      Actualizar
                    </button>
                    <button className="btn-agente" onClick={() => handleAgent(cliente.agent)}>
                      Ver Agente
                    </button>
                    <button className="btn-contactar" onClick={() => handleContact(cliente)}>
                      Contactar
                    </button>
                  </div>
                </div>
              ))
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
      <Footer />
    </div>
  );
};

export default Customers;

         