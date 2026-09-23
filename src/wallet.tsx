import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, useWalletModal } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { RPC_URL } from './payments';

function WalletModalAccessibility() {
  const { visible } = useWalletModal();
  const trigger = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!visible) {
      if (trigger.current?.isConnected) trigger.current.focus({ preventScroll: true });
      trigger.current = null;
      return;
    }
    trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // Supply the missing initial focus and label for every upstream modal entry point.
    const frame = requestAnimationFrame(() => {
      const modal = document.querySelector('.receivables-wallet-modal');
      const close = modal?.querySelector<HTMLButtonElement>('.wallet-adapter-modal-button-close');
      const title = modal?.querySelector('.wallet-adapter-modal-title');
      close?.setAttribute('aria-label', 'Close wallet selection');
      if (title) title.id = 'wallet-adapter-modal-title';
      close?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [visible]);
  return null;
}

export function Wallets({ children }: { children: ReactNode }) {
  const wallets = useMemo(() => [new PhantomWalletAdapter({ network: WalletAdapterNetwork.Devnet })], []);
  return <ConnectionProvider endpoint={RPC_URL}><WalletProvider wallets={wallets} autoConnect={false}><WalletModalProvider className="receivables-wallet-modal"><WalletModalAccessibility />{children}</WalletModalProvider></WalletProvider></ConnectionProvider>;
}
