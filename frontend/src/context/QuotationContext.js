import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const QuotationContext = createContext();

export const QuotationProvider = ({ children }) => {
    const [quotations, setQuotations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQuotations = async () => {
            const token = localStorage.getItem("token");
            try {
                const response = await axios.get("http://localhost:5187/api/quotations", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setQuotations(response.data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching quotations:", error);
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
