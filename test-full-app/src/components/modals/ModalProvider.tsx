'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useModalStore } from '@/stores/modal-store';
import { Modal } from './Modal';

interface ModalContextType {
  modalStore: ReturnType<typeof useModalStore>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

interface ModalProviderProps {
  children: ReactNode;
}

export function ModalProvider({ children }: ModalProviderProps) {
  const modalStore = useModalStore();

  return (
    <ModalContext.Provider value={{ modalStore }}>
      {children}
      {modalStore.modals.map((modal) => (
        <Modal
          key={modal.id}
          id={modal.id}
          component={modal.component}
          props={modal.props}
          isOpen={modal.isOpen}
          onClose={() => modalStore.closeModal(modal.id)}
        />
      ))}
    </ModalContext.Provider>
  );
}

export function useModalContext() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModalContext must be used within a ModalProvider');
  }
  return context;
}
