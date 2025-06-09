import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;
export const QuotationContext = createContext();
export const QuotationProvider = ({ children }) => {
    const [quotations, setQuotations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQuotations = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                setLoading(false); // Detener el estado de carga si no hay token
                return;
            }
            try {
                const response = await axios.get(`${API_URL}/api/quotations`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setQuotations(response.data);
            } catch (error) {
                console.error("Error fetching quotations:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchQuotations();
    }, []);

    return (
        <QuotationContext.Provider value={{ quotations, setQuotations, loading }}>
            {children}
        </QuotationContext.Provider>
    );
};
