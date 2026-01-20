export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const api = {
    async get(endpoint: string, token?: string) {
        const headers: any = { 'Content-Type': 'application/json' };
        if (token) headers['x-auth-token'] = token;
        const res = await fetch(`${API_URL}${endpoint}`, { headers });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },
    async getPopularProjects() {
        return this.get('/projects/popular');
    },
    async getProjects(search?: string, tags?: string[]) {
        let query = '';
        if (search) query += `?search=${encodeURIComponent(search)}`;
        if (tags && tags.length > 0) {
            query += `${query ? '&' : '?'}tags=${tags.map(t => encodeURIComponent(t)).join(',')}`;
        }
        return this.get(`/projects${query}`);
    },
    async post(endpoint: string, body: any, token?: string) {
        const headers: any = { 'Content-Type': 'application/json' };
        if (token) headers['x-auth-token'] = token;
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });
        if (!res.ok) {
            let errorMsg = 'Something went wrong';
            try {
                const err = await res.json();
                errorMsg = err.msg || errorMsg;
            } catch (e) {
                // If json parse fails, it's likely a text response or HTML
                errorMsg = 'Server error: Invalid response from server';
            }
            throw new Error(errorMsg);
        }
        return res.json();
    },
    async getBrowsingHistory(token: string) {
        return this.get('/history', token);
    },
    async recordProjectView(projectId: string, token: string) {
        return this.post('/history', { projectId }, token);
    },
    async uploadFiles(projectId: string, files: any[], token: string) {
        return this.post('/projects/upload', { projectId, files }, token);
    },
    async getProjectFiles(projectId: string, token?: string) {
        return this.get(`/projects/${projectId}/files`, token);
    },
    async getFileContent(projectId: string, path: string, token?: string) {
        return this.get(`/projects/${projectId}/file?path=${encodeURIComponent(path)}`, token);
    },
    async starProject(projectId: string, token: string) {
        return this.put(`/projects/${projectId}/star`, {}, token);
    },
    async adminLogin(data: any) {
        const response = await fetch(`${API_URL}/auth/admin/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.msg || 'Login failed');
        }
        return response.json();
    },
    async downloadProject(projectId: string, token: string) {
        return this.get(`/projects/${projectId}/download`, token);
    },
    async getProjectsByUser(userId: string, token?: string) {
        return this.get(`/projects/user/${userId}`, token);
    },
    async getPublicProfile(userId: string, token?: string) {
        return this.get(`/users/${userId}`, token);
    },
    async toggleFollowUser(userId: string, token: string) {
        return this.put(`/users/${userId}/follow`, {}, token);
    },
    async banUser(userId: string, duration: string, token: string, reason?: string, customDate?: string) {
        return this.put(`/users/${userId}/ban`, { duration, reason, customDate }, token);
    },
    async getDashboardStats(token: string, range: string = '7d') {
        return this.get(`/dashboard/stats?range=${range}`, token);
    },
    async getAdminDashboardStats(token: string) {
        return this.get('/dashboard/admin-stats', token);
    },
    async getProjectStats(token: string) {
        return this.get('/projects/stats', token);
    },

    // --- News ---
    async getNews() {
        return this.get('/news');
    },

    async getNewsById(id: string) {
        return this.get(`/news/${id}`);
    },
    async updateProfile(data: any, token: string) {
        // Using PUT for profile update
        const headers: any = { 'Content-Type': 'application/json', 'x-auth-token': token };
        const res = await fetch(`${API_URL}/users/profile`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },
    async togglePinProject(projectId: string, token: string) {
        const headers: any = { 'Content-Type': 'application/json', 'x-auth-token': token };
        const res = await fetch(`${API_URL}/users/pin`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ projectId })
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },
    async updateProject(projectId: string, data: any, token: string) {
        const headers: any = { 'Content-Type': 'application/json', 'x-auth-token': token };
        const res = await fetch(`${API_URL}/projects/${projectId}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },
    async put(endpoint: string, body: any, token?: string) {
        const headers: any = { 'Content-Type': 'application/json' };
        if (token) headers['x-auth-token'] = token;
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(body)
        });
        if (!res.ok) {
            const text = await res.text();
            try {
                const err = JSON.parse(text);
                throw new Error(err.msg || 'Something went wrong');
            } catch (e) {
                throw new Error(text || 'Server Error');
            }
        }
        return res.json();
    },
    async delete(endpoint: string, token?: string) {
        const headers: any = { 'x-auth-token': token };
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'DELETE',
            headers
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },
    async deleteProject(projectId: string, token: string) {
        return this.delete(`/projects/${projectId}`, token);
    },
    async deleteFile(projectId: string, path: string, token: string) {
        return this.delete(`/projects/${projectId}/files?path=${encodeURIComponent(path)}`, token);
    },
    // Contact
    // Contact
    async submitContact(data: any) {
        return this.post('/contact', data);
    },
    async getContacts(token: string) {
        return this.get('/contact', token);
    },
    async markContactAsRead(id: string, token: string) {
        return this.put(`/contact/${id}/read`, {}, token);
    },
    async deleteContact(id: string, token: string) {
        return this.delete(`/contact/${id}`, token);
    },
    async deleteMyAccount(token: string) {
        return this.delete('/users/me', token);
    },
    async changePassword(data: any, token: string) {
        return this.post('/auth/change-password', data, token);
    },
    async forgotPassword(email: string) {
        return this.post('/auth/forgot-password', { email });
    },
    async resetPassword(data: any) {
        return this.post('/auth/reset-password', data);
    },
    async verifyPasswordOTP(email: string, otp: string) {
        return this.post('/auth/verify-password-otp', { email, otp });
    }
};
