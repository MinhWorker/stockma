'use client';

import { useState } from 'react';
import { PrimaryActionCard } from './primary-action-card';
import { OutboundPickerDrawer } from './outbound-picker-drawer';

interface PrimaryActionsSectionProps {
  stockInLabel: string;
  stockInDesc: string;
  stockOutLabel: string;
  stockOutDesc: string;
}

export function PrimaryActionsSection({
  stockInLabel,
  stockInDesc,
  stockOutLabel,
  stockOutDesc,
}: PrimaryActionsSectionProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <section className="space-y-3">
      <PrimaryActionCard
        href="/menu/stock-in"
        intent="stock_in"
        label={stockInLabel}
        description={stockInDesc}
        variant="inbound"
      />
      <PrimaryActionCard
        label={stockOutLabel}
        description={stockOutDesc}
        variant="outbound"
        onClick={() => setDrawerOpen(true)}
      />
      <OutboundPickerDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </section>
  );
}
