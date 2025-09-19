export function safeArray(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.$values)) return data.$values;
    return [];

}

// Nuevo helper: invoca una función solo si realmente es una función
export function safeCall(fn, ...args) {
    if (typeof fn === 'function') {
        try {
            return fn(...args);
        } catch (err) {
            // opcional: loguear en dev para facilitar debugging
            if (process && process.env && process.env.NODE_ENV !== 'production') {
                // eslint-disable-next-line no-console
                console.error('safeCall error:', err);
            }
            return undefined;
        }
    }
    return undefined;
}

// Nuevo helper: devuelve una función segura (noop si no es función)
export function safeFn(maybeFn) {
    if (typeof maybeFn === 'function') return maybeFn;
    return () => {}; // noop
}
