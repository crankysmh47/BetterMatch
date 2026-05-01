import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

export type Toast = {
  id: string;
  type: ToastType;
  title: string;
  detail?: string;
  createdAt: number;
};

type ToastState = {
  toasts: Toast[];
  push: (t: Omit<Toast, 'id' | 'createdAt'> & { id?: string }) => void;
  remove: (id: string) => void;
};

function uid() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (t) => {
    const toast: Toast = { id: t.id ?? uid(), createdAt: Date.now(), ...t };
    set((s) => ({ toasts: [toast, ...s.toasts].slice(0, 3) }));
    // auto-dismiss 4s
    setTimeout(() => get().remove(toast.id), 4000);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

