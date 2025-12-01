import { PropsWithChildren } from 'react';
import { EscrowProvider } from '@/context/EscrowContext';
export default function GiftLayout({ children }: PropsWithChildren) {
  return <EscrowProvider>{children}</EscrowProvider>;
}
