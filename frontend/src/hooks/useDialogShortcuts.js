import { useEffect, useRef } from 'react';

export function useDialogShortcuts(onClose) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const dialog = dialogRef.current;
    if (dialog && !dialog.contains(document.activeElement)) {
      dialog.querySelector('input:not(:disabled), textarea:not(:disabled), select:not(:disabled), button:not(:disabled)')?.focus();
    }
    return () => { if (previousFocus?.isConnected) previousFocus.focus(); };
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.isComposing) return;
      const dialogs = document.querySelectorAll('.dialog-surface');
      if (dialogs[dialogs.length - 1] !== dialogRef.current) return;
      if (event.key === 'Tab') {
        const controls = [...dialogRef.current.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]')].filter(el => el.getClientRects().length);
        const target = event.shiftKey ? controls.at(-1) : controls[0];
        const edge = event.shiftKey ? controls[0] : controls.at(-1);
        if (target && (document.activeElement === edge || !dialogRef.current.contains(document.activeElement))) {
          event.preventDefault();
          target.focus();
        }
        return;
      }
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      onClose();
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [onClose]);

  return dialogRef;
}
