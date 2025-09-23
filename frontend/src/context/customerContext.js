import React, { createContext, useState, useCallback } from "react";
import axios from "axios";
import { safeArray } from "../utils/safeArray"; // agrega este import

const API_URL = process.env.REACT_APP_API_URL;
export const CustomerContext = createContext();

export const CustomerProvider = ({ children }) => {
    const [customers, setCustomers] = useState([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const PAGE_SIZE = 10;

    const fetchCustomers = useCallback(async (pageToLoad = 1) => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(
                `${API_URL}/api/customers/paged?page=${pageToLoad}&pageSize=${PAGE_SIZE}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Normaliza el array aquí
            setCustomers(safeArray(res.data.Items));
            setTotal(typeof res.data.Total === "number" ? res.data.Total : 0);
            setPage(pageToLoad);
        } catch (err) {
            setCustomers([]);
            setTotal(0);
        }
        setLoading(false);
    }, []);

    // helper local: normaliza id/_id
    const normalizeOne = (obj) => {
        if (!obj) return null;
        if (obj._id && obj.id === undefined) obj.id = obj._id;
        return obj;
    };

    // fetch by DNI (público)
    const fetchCustomerByDni = async (dni) => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(
                `${API_URL}/api/customers/dni/${encodeURIComponent(dni)}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return res.data || null;
        } catch (err) {
            return null;
        } finally {
            setLoading(false);
        }
    };

    // new: create customer (optimista -> actualiza estado local sin recargar todo)
    const createCustomer = async (newCustomer) => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(
                `${API_URL}/api/customers`,
                newCustomer,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.status === 200 || res.status === 201) {
                // intentar obtener el objeto creado (por DNI) y añadirlo localmente
                let created = null;
                try {
                    const getRes = await axios.get(`${API_URL}/api/customers/dni/${encodeURIComponent(newCustomer.dni)}`, { headers: { Authorization: `Bearer ${token}` } });
                    created = normalizeOne(getRes.data);
                } catch (e) {
                    created = null;
                }
                setCustomers(prev => {
                    const next = [...(prev || [])];
                    if (created) {
                        // si ya existe en la página actual, reemplaza; si no, añade al inicio
                        const idx = next.findIndex(c => String(c.dni) === String(created.dni));
                        if (idx >= 0) next[idx] = created;
                        else next.unshift(created);
                    } else {
                        // fallback: insertar un stub con al menos DNI y nombre si no obtenemos objeto completo
                        const stub = { ...newCustomer };
                        if (!stub.id && newCustomer.dni) stub.id = newCustomer.dni;
                        next.unshift(stub);
                    }
                    // mantener tamaño razonable (no necesitamos eliminar)
                    return next;
                });
                setTotal(prev => (typeof prev === "number" ? prev + 1 : 1));
                return { success: true, data: res.data };
            }
            return { success: false, error: res.data || "Unexpected response" };
        } catch (err) {
            const serverMessage = err?.response?.data || err.message || "Network error";
            return { success: false, error: serverMessage };
        } finally {
            setLoading(false);
        }
    };

    // new: update customer by dni (optimista -> obtener actualización y reemplazar localmente)
    const updateCustomer = async (dni, updatedCustomer) => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const safeDni = encodeURIComponent(dni);
            const res = await axios.put(
                `${API_URL}/api/customers/${safeDni}`,
                updatedCustomer,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.status === 200) {
                // obtener el cliente actualizado y reemplazar en array local
                try {
                    const getRes = await axios.get(`${API_URL}/api/customers/dni/${safeDni}`, { headers: { Authorization: `Bearer ${token}` } });
                    const updatedObj = normalizeOne(getRes.data);
                    if (updatedObj) {
                        setCustomers(prev => {
                            const next = [...(prev || [])];
                            const idx = next.findIndex(c => String(c.dni) === String(updatedObj.dni));
                            if (idx >= 0) next[idx] = updatedObj;
                            else next.unshift(updatedObj);
                            return next;
                        });
                    }
                } catch (e) {
                    // si no pudimos obtener el actualizado, no rompemos: retornamos éxito igual
                }
                return { success: true, data: res.data };
            }
            return { success: false, error: res.data || "Unexpected response" };
        } catch (err) {
            const serverMessage = err?.response?.data || err.message || "Network error";
            return { success: false, error: serverMessage };
        } finally {
            setLoading(false);
        }
    };

    const goToCustomerPage = (newPage) => {
        if (newPage < 1 || newPage > Math.ceil(total / PAGE_SIZE)) return;
        fetchCustomers(newPage);
    };

    const switchToCustomers = () => {
        // Si ya hay datos, no recarga; si no, carga la página 1
        if (customers.length === 0) fetchCustomers(1);
    };

    return (
        <CustomerContext.Provider value={{
            customers, page, total, loading, PAGE_SIZE,
            fetchCustomers, goToCustomerPage, switchToCustomers,
            createCustomer, updateCustomer, fetchCustomerByDni // <-- exportadas
        }}>
            {children}
        </CustomerContext.Provider>
    );
};
