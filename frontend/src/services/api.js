const BASE_URL = "/api";

const getHeaders = () => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${localStorage.getItem('token')}`
});

export const api = {

    get: async (url) => {
        const r = await fetch(`${BASE_URL}${url}`, { headers: getHeaders() });
        return r.json();
    },

    post: async (url, body) => {
        const r = await fetch(`${BASE_URL}${url}`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(body)
        });
        return r.json();
    },

    put: async (url, body) => {
        const r = await fetch(`${BASE_URL}${url}`, {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify(body)
        });
        return r.json();
    },

    delete: async (url) => {
        const r = await fetch(`${BASE_URL}${url}`, {
            method: "DELETE",
            headers: getHeaders()
        });
        return r.json();
    }
};