import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarTrigger } from '@/components/app-sidebar-trigger';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppSidebarTrigger />
        <main className="p-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
