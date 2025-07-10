import React, { createContext, useState, useCallback } from "react";
import axios from "axios";

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
            setCustomers(Array.isArray(res.data.Items) ? res.data.Items : []);
            setTotal(typeof res.data.Total === "number" ? res.data.Total : 0);
            setPage(pageToLoad);
        } catch (err) {
            setCustomers([]);
            setTotal(0);
        }
        setLoading(false);
    }, []);

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
            fetchCustomers, goToCustomerPage, switchToCustomers
        }}>
            {children}
        </CustomerContext.Provider>
    );
};
