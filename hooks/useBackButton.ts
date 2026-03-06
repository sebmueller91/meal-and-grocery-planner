import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook for Android back button / browser back support in modals.
 *
 * When `isOpen` becomes true, pushes a history state.
 * If the user presses back (popstate), calls `onBack` to close the modal.
 * When the modal closes normally (via UI), pops the state automatically.
 */
export function useBackButton(isOpen: boolean, onBack: () => void) {
  const stateKeyRef = useRef<string | null>(null);
  const stableOnBack = useCallback(onBack, [onBack]);

  useEffect(() => {
    if (!isOpen) {
      stateKeyRef.current = null;
      return;
    }

    // Push a state so back button has something to pop
    const stateKey = `modal-${Date.now()}`;
    stateKeyRef.current = stateKey;
    window.history.pushState({ modal: stateKey }, '');

    const handlePopState = () => {
      // Back button was pressed — close the modal
      stateKeyRef.current = null;
      stableOnBack();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);

      // If modal closes normally (not via back button),
      // pop the history state we pushed
      if (stateKeyRef.current === stateKey) {
        stateKeyRef.current = null;
        window.history.back();
      }
    };
  }, [isOpen, stableOnBack]);
}
