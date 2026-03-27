'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  ArrowLeftRight,
  BarChart3,
  LayoutDashboard,
  Package,
  Settings,
  Warehouse,
} from 'lucide-react';
import Image from 'next/image';
import { Link, usePathname } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import logo from '../../public/web-app-manifest-192x192.png';

export function AppSidebar() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const t = useTranslations('nav');

  const navGroups = [
    {
      label: t('overview'),
      items: [{ label: t('dashboard'), href: '/dashboard', icon: LayoutDashboard }],
    },
    {
      label: t('catalog'),
      items: [{ label: t('products'), href: '/products', icon: Package }],
    },
    {
      label: t('warehouse'),
      items: [
        { label: t('inventory'), href: '/inventory', icon: Warehouse },
        { label: t('transactions'), href: '/transactions', icon: ArrowLeftRight },
      ],
    },
    {
      label: t('analytics'),
      items: [{ label: t('reports'), href: '/reports', icon: BarChart3 }],
    },
    {
      label: t('system'),
      items: [{ label: t('settings'), href: '/settings', icon: Settings }],
    },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="STOCKMA">
              <Link href="/dashboard">
                <Image src={logo} alt="logo" height={32} width={32} className="shrink-0" />
                <span style={{ fontWeight: 'bold', fontSize: 'large', letterSpacing: 4 }}>
                  STOCKMA
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.includes(item.href)}
                      tooltip={item.label}
                    >
                      <Link href={item.href} onClick={() => isMobile && setOpenMobile(false)}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
