'use client';

import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { CheckCircle2, AlertTriangle, Info, Trash2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  isAlertOnly?: boolean;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  variant = 'info',
  isAlertOnly = false,
  isLoading = false,
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <Trash2 className="w-7 h-7 text-rose-600" />;
      case 'warning':
        return <AlertTriangle className="w-7 h-7 text-amber-600" />;
      case 'success':
        return <CheckCircle2 className="w-7 h-7 text-emerald-600" />;
      default:
        return <Info className="w-7 h-7 text-blue-600" />;
    }
  };

  const getBgClass = () => {
    switch (variant) {
      case 'danger':
        return 'bg-rose-50 border-rose-100';
      case 'warning':
        return 'bg-amber-50 border-amber-100';
      case 'success':
        return 'bg-emerald-50 border-emerald-100';
      default:
        return 'bg-blue-50 border-blue-100';
    }
  };

  const defaultTitle = isAlertOnly ? 'Notice' : 'Confirm Action';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || defaultTitle} maxWidth="max-w-sm">
      <div className="space-y-5 text-center py-2">
        <div className={`w-14 h-14 rounded-3xl mx-auto border flex items-center justify-center ${getBgClass()}`}>
          {getIcon()}
        </div>

        <div className="space-y-1 px-2">
          {title && <h4 className="text-base font-extrabold text-slate-900">{title}</h4>}
          <p className="text-xs text-slate-600 font-medium leading-relaxed">{message}</p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          {!isAlertOnly && (
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 rounded-2xl py-2.5 text-xs font-bold"
            >
              {cancelText}
            </Button>
          )}
          <Button
            type="button"
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={() => {
              if (onConfirm) onConfirm();
              onClose();
            }}
            isLoading={isLoading}
            className="flex-1 rounded-2xl py-2.5 text-xs font-bold shadow-md"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
