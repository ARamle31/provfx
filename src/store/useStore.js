import { create } from 'zustand';
import { auth } from '../lib/api';

const useStore = create((set) => ({
    user: null,
    isAuth: false,
    isLoading: true, // Init sequence loading state

    initAuth: async () => {
        try {
            set({ isLoading: true });
            const user = await auth.getSession();
            set({ user, isAuth: true, isLoading: false });
        } catch {
            set({ user: null, isAuth: false, isLoading: false });
        }
    },

    login: async (email, password) => {
        const data = await auth.login(email, password);
        set({ user: data.user, isAuth: true });
    },

    register: async (email, password, name) => {
        const data = await auth.register(email, password, name);
        set({ user: data.user, isAuth: true });
    },

    logout: () => {
        set({ user: null, isAuth: false });
    }
}));

export default useStore;
