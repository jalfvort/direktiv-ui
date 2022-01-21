import React from "react"
import { UNSAFE_NavigationContext } from "react-router";

export function useBlocker(blocker, when = true) {
    const { navigator } = React.useContext(UNSAFE_NavigationContext);

    React.useEffect(() => {
      if (!when) return;
  
      const unblock = navigator.block((tx) => {
        const autoUnblockingTx = {
          ...tx,
          retry() {
            unblock();
            tx.retry();
          }
        };
  
        blocker(autoUnblockingTx);
      });
  
      return unblock;
    }, [navigator, blocker, when]);
  }
  
  export default function usePrompt(message, when = true) {
    const blocker = React.useCallback(
      (tx) => {
        if (window.confirm(message)) tx.retry();
      },
      [message]
    );
  
    useBlocker(blocker, when);
  }
  