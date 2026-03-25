const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const API_URL = `${BASE_URL}/api/ventas`;

export const registrarVenta = async (datosVenta) => {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosVenta)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Error del servidor:", errorText);
            return null;
        }
        
        return await response.json(); 
    } catch (error) {
        console.error("Error de conexión:", error);
        return null;
    }
};

export const obtenerVentas = async () => {
    try {
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }
        
        return await response.json(); 
    } catch (error) {
        console.error("Error al obtener el historial de ventas:", error);
        return []; 
    }
};
```

