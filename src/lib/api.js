// REAL Node.js Cloud Engine Integration
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const auth = {
    async register(email, password, name) {
        const res = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name })
        });
        if (!res.ok) throw new Error("Registration Failed");
        return res.json();
    },

    async login(email, password) {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!res.ok) throw new Error("Invalid Credentials");
        return res.json();
    },

    async getSession() {
        const token = localStorage.getItem('provfx_token');
        if (!token) throw new Error("No token");
        const res = await fetch(`${API_URL}/session`, {
            headers: { 'Authorization': token }
        });
        if (!res.ok) throw new Error("Session Invalid");
        return res.json();
    }
};

export const projectsApi = {
    async getProjects(userId) {
        const res = await fetch(`${API_URL}/projects?userId=${userId}`);
        if (!res.ok) throw new Error("Failed to load pipeline");
        return res.json();
    },

    async loadProject(projectId) {
        const res = await fetch(`${API_URL}/projects/${projectId}`);
        if (!res.ok) throw new Error("Project Not Found");
        return res.json(); // Returns { stateData: {}, files: { video: { url, name }, ... } }
    },

    async saveProject(userId, projectId, stateData, files) {
        const formData = new FormData();
        formData.append("userId", userId);

        const existingFiles = {};
        if (files) {
            for (const key of ["video", "image", "audio", "overlay"]) {
                if (files[key]) {
                    // If it is a fresh local file, append to Multipart
                    if (files[key] instanceof File || files[key] instanceof Blob) {
                        formData.append(key, files[key], files[key].name || `upload_${key}`);
                    } else if (files[key].url) {
                        // Inherit already synced cloud files
                        existingFiles[key] = files[key];
                    }
                }
            }
        }

        formData.append("stateData", JSON.stringify({ state: stateData, files: existingFiles }));

        const res = await fetch(`${API_URL}/projects/${projectId}`, {
            method: 'POST',
            body: formData
        });

        if (!res.ok) throw new Error("Cloud sync failed");
        return res.json();
    }
};
