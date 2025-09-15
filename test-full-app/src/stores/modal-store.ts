import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface Modal {
  id: string;
  component: React.ComponentType<any>;
  props?: any;
  isOpen: boolean;
  onClose?: () => void;
}

interface ModalState {
  modals: Modal[];
  
  // Actions
  openModal: (modal: Omit<Modal, 'isOpen'>) => string;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  updateModal: (id: string, updates: Partial<Modal>) => void;
  getModal: (id: string) => Modal | undefined;
  isModalOpen: (id: string) => boolean;
}

export const useModalStore = create<ModalState>()(
  devtools(
    (set, get) => ({
      modals: [],

      openModal: (modal: Omit<Modal, 'isOpen'>) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newModal: Modal = {
          ...modal,
          id,
          isOpen: true,
        };

        set((state) => ({
          modals: [...state.modals, newModal],
        }));

        return id;
      },

      closeModal: (id: string) => {
        set((state) => ({
          modals: state.modals.map(modal =>
            modal.id === id ? { ...modal, isOpen: false } : modal
          ),
        }));

        // Remove modal after animation
        setTimeout(() => {
          set((state) => ({
            modals: state.modals.filter(modal => modal.id !== id),
          }));
        }, 300);
      },

      closeAllModals: () => {
        set((state) => ({
          modals: state.modals.map(modal => ({ ...modal, isOpen: false })),
        }));

        // Remove all modals after animation
        setTimeout(() => {
          set({ modals: [] });
        }, 300);
      },

      updateModal: (id: string, updates: Partial<Modal>) => {
        set((state) => ({
          modals: state.modals.map(modal =>
            modal.id === id ? { ...modal, ...updates } : modal
          ),
        }));
      },

      getModal: (id: string) => {
        return get().modals.find(modal => modal.id === id);
      },

      isModalOpen: (id: string) => {
        return get().modals.some(modal => modal.id === id && modal.isOpen);
      },
    }),
    {
      name: 'modal-store',
    }
  )
);
