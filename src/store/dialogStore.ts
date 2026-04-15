import { create } from 'zustand';

export interface DialogButton {
  label: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

export interface DialogState {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  buttons?: DialogButton[];
}

interface DialogStore {
  dialog: DialogState;
  showDialog: (options: Partial<DialogState>) => void;
  showAlert: (message: string, title?: string) => void;
  showConfirm: (message: string, onConfirm: () => void, title?: string) => void;
  closeDialog: () => void;
}

const initialState: DialogState = {
  isOpen: false,
  title: '',
  message: '',
  type: 'info',
  buttons: [],
};

export const useDialogStore = create<DialogStore>((set, get) => ({
  dialog: initialState,
  
  showDialog: (options) => set({
    dialog: {
      ...initialState,
      ...options,
      isOpen: true,
    },
  }),
  
  showAlert: (message, title = '提示') => set({
    dialog: {
      isOpen: true,
      title,
      message,
      type: 'info',
      buttons: [
        {
          label: '确定',
          variant: 'primary',
          onClick: () => get().closeDialog(),
        },
      ],
    },
  }),
  
  showConfirm: (message, onConfirm, title = '确认') => set({
    dialog: {
      isOpen: true,
      title,
      message,
      type: 'warning',
      buttons: [
        {
          label: '取消',
          variant: 'secondary',
          onClick: () => get().closeDialog(),
        },
        {
          label: '确定',
          variant: 'primary',
          onClick: () => {
            onConfirm();
            get().closeDialog();
          },
        },
      ],
    },
  }),
  
  closeDialog: () => set({
    dialog: initialState,
  }),
}));
