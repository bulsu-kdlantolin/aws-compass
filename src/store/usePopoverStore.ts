import { create } from 'zustand';

interface PopoverStore {
  activePopoverId: string | null;
  openPopover: (id: string) => void;
  closePopover: (id?: string) => void;
  togglePopover: (id: string) => void;
  isOpen: (id: string) => boolean;
}

export const usePopoverStore = create<PopoverStore>((set, get) => ({
  activePopoverId: null,
  openPopover: (id: string) => set({ activePopoverId: id }),
  closePopover: (id?: string) => {
    if (!id || get().activePopoverId === id) {
      set({ activePopoverId: null });
    }
  },
  togglePopover: (id: string) =>
    set((state) => ({ activePopoverId: state.activePopoverId === id ? null : id })),
  isOpen: (id: string) => get().activePopoverId === id,
}));
