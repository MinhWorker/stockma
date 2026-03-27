import { ReactNode, Suspense } from 'react';
import { MainHeader } from './_components/main-header';
import { BottomNav } from './_components/bottom-nav';

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-background">
      <Suspense fallback={<div className="min-h-[56px] border-b border-border" />}>
        <MainHeader />
      </Suspense>
      <main className="flex-1 overflow-y-auto pb-24">{children}</main>
      <BottomNav />
    </div>
  );
}
