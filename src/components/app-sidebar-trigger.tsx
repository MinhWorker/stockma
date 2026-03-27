'use client';

import { useSidebar } from '@/components/ui/sidebar';
import { Columns2 } from 'lucide-react';

export function AppSidebarTrigger() {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      data-slot="sidebar-trigger"
      data-variant="ghost"
      data-size="icon"
      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-all cursor-pointer text-sm disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 size-10"
      data-sidebar="trigger"
      onClick={toggleSidebar}
    >
      <Columns2 className={'size-7'} />
      <span className="sr-only">Toggle Sidebar</span>
    </button>
  );
}
