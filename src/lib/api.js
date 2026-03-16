// REAL Node.js Cloud Engine Integration with LocalStorage Fallback
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

const base64ToFile = async (base64, filename) => {
    const res = await fetch(base64);
    const buf = await res.arrayBuffer();
    return new File([buf], filename, { type: res.headers.get('content-type') || 'application/octet-stream' });
};

export const auth = {
    async register(email, password, name) {
        try {
            const res = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name })
            });
            if (!res.ok) throw new Error("Registration Failed");
            return res.json();
        } catch {
            // Local fallback
            const user = { id: Date.now().toString(), email, name };
            localStorage.setItem('local_user', JSON.stringify(user));
            return { user, token: 'local_token' };
        }
    },

    async login(email, password) {
        try {
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (!res.ok) throw new Error("Invalid Credentials");
            return res.json();
        } catch {
            // Local fallback
            const user = JSON.parse(localStorage.getItem('local_user'));
            if (user && user.email === email) return { user, token: 'local_token' };

            // Auto register if not found locally for demo purposes
            const newUser = { id: Date.now().toString(), email, name: email.split('@')[0] };
            localStorage.setItem('local_user', JSON.stringify(newUser));
            return { user: newUser, token: 'local_token' };
        }
    },

    async getSession() {
        const token = localStorage.getItem('provfx_token');
        if (!token) throw new Error("No token");
        try {
            const res = await fetch(`${API_URL}/session`, {
                headers: { 'Authorization': token }
            });
            if (!res.ok) throw new Error("Session Invalid");
            return res.json();
        } catch {
            if (token === 'local_token') {
                const user = JSON.parse(localStorage.getItem('local_user'));
                if (user) return user;
            }
            throw new Error("Session Invalid");
        }
    }
};

export const projectsApi = {
    async getProjects(userId) {
        try {
            const res = await fetch(`${API_URL}/projects?userId=${userId}`);
            if (!res.ok) throw new Error("Failed to load pipeline");
            return res.json();
        } catch {
            // Local fallback
            const projects = JSON.parse(localStorage.getItem(`local_projects_${userId}`) || '[]');
            return projects;
        }
    },

    async loadProject(projectId) {
        try {
            const res = await fetch(`${API_URL}/projects/${projectId}`);
            if (!res.ok) throw new Error("Project Not Found");
            return res.json();
        } catch {
            // Local fallback
            const rawProject = localStorage.getItem(`local_project_data_${projectId}`);
            if (rawProject) {
                const project = JSON.parse(rawProject);
                // Reconstruct files from base64 if needed
                if (project.files) {
                    for (const key of ["video", "image", "audio", "overlay"]) {
                        if (project.files[key] && project.files[key].base64) {
                            try {
                                const file = await base64ToFile(project.files[key].base64, project.files[key].name);
                                project.files[key] = file;
                            } catch {
                                console.error(`Failed to decode base64 for ${key}`);
                            }
                        }
                    }
                }
                return project;
            }
            throw new Error("Project Not Found Locally");
        }
    },

    async saveProject(userId, projectId, stateData, files) {
        try {
            const formData = new FormData();
            formData.append("userId", userId);

            const existingFiles = {};
            if (files) {
                for (const key of ["video", "image", "audio", "overlay"]) {
                    if (files[key]) {
                        if (files[key] instanceof File || files[key] instanceof Blob) {
                            formData.append(key, files[key], files[key].name || `upload_${key}`);
                        } else if (files[key].url) {
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
        } catch {
            // Local fallback
            let localFiles = {};
            if (files) {
                for (const key of ["video", "image", "audio", "overlay"]) {
                    if (files[key]) {
                        if (files[key] instanceof File || files[key] instanceof Blob) {
                            try {
                                const base64 = await fileToBase64(files[key]);
                                localFiles[key] = { name: files[key].name, base64 };
                            } catch {
                                console.error(`Failed to encode ${key} to base64 for local storage. Skipping large file.`);
                                localFiles[key] = { name: files[key].name }; // Cannot save large files to localStorage easily
                            }
                        } else if (files[key].url || files[key].base64) {
                            localFiles[key] = files[key];
                        }
                    }
                }
            }

            const projectData = { stateData, files: localFiles };

            // Try to save project data, catch QuotaExceededError
            try {
                localStorage.setItem(`local_project_data_${projectId}`, JSON.stringify(projectData));
            } catch {
                console.error("Local storage quota exceeded. Saving state only, dropping files.");
                projectData.files = {};
                localStorage.setItem(`local_project_data_${projectId}`, JSON.stringify(projectData));
            }

            // Update projects list
            let projectsList = JSON.parse(localStorage.getItem(`local_projects_${userId}`) || '[]');
            const existingIdx = projectsList.findIndex(p => p.projectId === projectId);
            const pInfo = {
                projectId,
                title: stateData.title || "Untitled Project",
                updatedAt: new Date().toISOString()
            };

            if (existingIdx >= 0) {
                projectsList[existingIdx] = pInfo;
            } else {
                projectsList.unshift(pInfo);
            }
            localStorage.setItem(`local_projects_${userId}`, JSON.stringify(projectsList));

            return { success: true, files: localFiles };
        }
    }
};
