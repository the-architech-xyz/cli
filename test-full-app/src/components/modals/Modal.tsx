'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ModalProps {
  id: string;
  component: React.ComponentType<any>;
  props?: any;
  isOpen: boolean;
  onClose: () => void;
}

export function Modal({ 
  id, 
  component: Component, 
  props = {}, 
  isOpen, 
  onClose 
}: ModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <Component {...props} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
}
