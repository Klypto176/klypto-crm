import { useEffect } from 'react';

export const useKeyboardShortcuts = (shortcuts) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      shortcuts.forEach(({ key, ctrlKey, action }) => {
        const isCtrlPressed = ctrlKey ? (event.ctrlKey || event.metaKey) : true;
        if (event.key.toLowerCase() === key.toLowerCase() && isCtrlPressed) {
          event.preventDefault();
          action();
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};
