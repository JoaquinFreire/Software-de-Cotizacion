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

    // NUEVO: helper para obtener headers Authorization de forma segura
    const getAuthHeaders = () => {
        let token = localStorage.getItem("token");
        if (!token) return null;
        // Normalizar token (quitar comillas envolventes posibles y espacios)
        token = token?.toString().trim();
        if (token.startsWith('"') && token.endsWith('"')) {
            token = token.slice(1, -1);
        }
        if (!token) return null;
        return { Authorization: `Bearer ${token}` };
    };

    const fetchCustomers = useCallback(async (pageToLoad = 1) => {
        setLoading(true);
        try {
            const headers = getAuthHeaders();
            if (!headers) {
                // no hay token -> no intentar la llamada
                setCustomers([]);
                setTotal(0);
                setPage(1);
                setLoading(false);
                return;
            }
            const res = await axios.get(
                `${API_URL}/api/customers/paged?page=${pageToLoad}&pageSize=${PAGE_SIZE}`,
                { headers }
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
            const headers = getAuthHeaders();
            if (!headers) return null;
            const res = await axios.get(
                `${API_URL}/api/customers/dni/${encodeURIComponent(dni)}`,
                { headers }
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
            const headers = getAuthHeaders();
            if (!headers) return { success: false, error: "No auth token" };
            const res = await axios.post(
                `${API_URL}/api/customers`,
                newCustomer,
                { headers }
            );
            if (res.status === 200 || res.status === 201) {
                // intentar obtener el objeto creado (por DNI) y añadirlo localmente
                let created = null;
                try {
                    const getRes = await axios.get(`${API_URL}/api/customers/dni/${encodeURIComponent(newCustomer.dni)}`, { headers });
                    created = normalizeOne(getRes.data);
                } catch (e) {
                    created = null;
                }
                setCustomers(prev => {
                    const next = [...(prev || [])];
                    if (created) {
                        const idx = next.findIndex(c => String(c.dni) === String(created.dni));
                        if (idx >= 0) next[idx] = created;
                        else next.unshift(created);
                    } else {
                        const stub = { ...newCustomer };
                        if (!stub.id && newCustomer.dni) stub.id = newCustomer.dni;
                        next.unshift(stub);
                    }
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
            const headers = getAuthHeaders();
            if (!headers) return { success: false, error: "No auth token" };
            const safeDni = encodeURIComponent(dni);
            const res = await axios.put(
                `${API_URL}/api/customers/${safeDni}`,
                updatedCustomer,
                { headers }
            );
            if (res.status === 200) {
                try {
                    const getRes = await axios.get(`${API_URL}/api/customers/dni/${safeDni}`, { headers });
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
                    // ignore fetch error
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
