// src/contexts/ModalContext.jsx
import { createContext, useContext, useState, useCallback } from 'react';

const ModalContext = createContext();

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return context;
};

export const ModalProvider = ({ children }) => {
  const [modals, setModals] = useState({});

  const openModal = useCallback((modalId, props = {}) => {
    setModals(prev => ({
      ...prev,
      [modalId]: { isOpen: true, props }
    }));
  }, []);

  const closeModal = useCallback((modalId) => {
    setModals(prev => ({
      ...prev,
      [modalId]: { ...prev[modalId], isOpen: false }
    }));
  }, []);

  const isModalOpen = useCallback((modalId) => {
    return modals[modalId]?.isOpen || false;
  }, [modals]);

  const getModalProps = useCallback((modalId) => {
    return modals[modalId]?.props || {};
  }, [modals]);

  return (
    <ModalContext.Provider value={{ openModal, closeModal, isModalOpen, getModalProps }}>
      {children}
    </ModalContext.Provider>
  );
};