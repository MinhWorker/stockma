'use client';

import { useState, useMemo, useRef } from 'react';
import { Check, ChevronDown, ExternalLink, Loader2, Plus, Search, X } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Option {
  value: string;
  label: string;
}

interface MobileSelectSheetProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  title?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  'aria-invalid'?: boolean;
  /** Inline quick-add: shows an input row at the bottom */
  onAddNew?: (name: string) => Promise<{ value: string; label: string } | null>;
  addNewPlaceholder?: string;
  addNewLabel?: string;
  /** Navigate-away action: shows a confirm dialog then calls the callback */
  onNavigate?: () => void;
  navigateLabel?: string;
  navigateConfirmTitle?: string;
  navigateConfirmDesc?: string;
  navigateConfirmAction?: string;
  navigateCancelLabel?: string;
}

export function MobileSelectSheet({
  value,
  onChange,
  options,
  placeholder = 'Chọn...',
  title = 'Chọn',
  searchPlaceholder = 'Tìm kiếm...',
  emptyText = 'Không tìm thấy',
  disabled,
  'aria-invalid': ariaInvalid,
  onAddNew,
  addNewPlaceholder = 'Tên mới...',
  addNewLabel = 'Thêm',
  onNavigate,
  navigateLabel = 'Quản lý',
  navigateConfirmTitle = 'Rời khỏi trang?',
  navigateConfirmDesc = 'Dữ liệu form sẽ được lưu lại.',
  navigateConfirmAction = 'Tiếp tục',
  navigateCancelLabel = 'Hủy',
}: MobileSelectSheetProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Quick-add state
  const [addingNew, setAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const newInputRef = useRef<HTMLInputElement>(null);

  // Navigate-away confirm dialog
  const [navConfirmOpen, setNavConfirmOpen] = useState(false);

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search]);

  function handleSelect(val: string) {
    onChange(val);
    setOpen(false);
    setSearch('');
    setAddingNew(false);
    setNewName('');
  }

  function handleClose() {
    setOpen(false);
    setSearch('');
    setAddingNew(false);
    setNewName('');
  }

  function handleStartAdding() {
    setAddingNew(true);
    setSearch('');
    setTimeout(() => newInputRef.current?.focus(), 50);
  }

  async function handleSaveNew() {
    const trimmed = newName.trim();
    if (!trimmed || !onAddNew) return;
    setIsSaving(true);
    try {
      const result = await onAddNew(trimmed);
      if (result) {
        onChange(result.value);
        setOpen(false);
        setSearch('');
      }
    } finally {
      setIsSaving(false);
      setAddingNew(false);
      setNewName('');
    }
  }

  function handleNavigateRequest() {
    setOpen(false);
    setNavConfirmOpen(true);
  }

  function handleNavigateConfirm() {
    setNavConfirmOpen(false);
    onNavigate?.();
  }

  // Whether to show the footer actions bar
  const hasFooterActions = (onAddNew && !addingNew) || onNavigate;

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setOpen(true)}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        className={cn(
          'border-input bg-background ring-offset-background flex h-9 w-full items-center justify-between rounded-md border px-3 py-2 text-sm shadow-xs transition-[color,box-shadow]',
          'focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:border-ring focus-visible:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
          ariaInvalid && 'border-destructive ring-destructive/20',
          !selected && 'text-muted-foreground',
        )}
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {/* Bottom sheet */}
      <Drawer open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
        <DrawerContent className="max-h-[75vh]">
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>

          {/* Search — hidden while adding new */}
          {!addingNew && (
            <div className="relative px-4 pb-2">
              <Search className="absolute left-7 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-9"
              />
            </div>
          )}

          {/* Inline add-new form */}
          {addingNew && (
            <div className="flex items-center gap-2 px-4 pb-3">
              <Input
                ref={newInputRef}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={addNewPlaceholder}
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveNew();
                  if (e.key === 'Escape') { setAddingNew(false); setNewName(''); }
                }}
                disabled={isSaving}
              />
              <Button
                type="button"
                size="sm"
                onClick={handleSaveNew}
                disabled={!newName.trim() || isSaving}
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : addNewLabel}
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="shrink-0"
                onClick={() => { setAddingNew(false); setNewName(''); }}
                disabled={isSaving}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Options list */}
          <div className="overflow-y-auto flex-1">
            {!addingNew && filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{emptyText}</p>
            ) : !addingNew ? (
              <div className="divide-y divide-border">
                {filtered.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className="flex w-full items-center justify-between px-4 py-3.5 text-sm text-left active:bg-muted transition-colors"
                  >
                    <span>{opt.label}</span>
                    {opt.value === value && (
                      <Check className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {/* Footer actions */}
          {hasFooterActions && (
            <div className="border-t border-border px-4 py-3 pb-safe flex items-center gap-4">
              {onAddNew && !addingNew && (
                <button
                  type="button"
                  onClick={handleStartAdding}
                  className="flex items-center gap-1.5 text-sm text-primary font-medium"
                >
                  <Plus className="h-4 w-4" />
                  {addNewLabel}
                </button>
              )}
              {onNavigate && (
                <button
                  type="button"
                  onClick={handleNavigateRequest}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground ml-auto"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {navigateLabel}
                </button>
              )}
            </div>
          )}
        </DrawerContent>
      </Drawer>

      {/* Navigate-away confirm dialog */}
      <Dialog open={navConfirmOpen} onOpenChange={(o) => { if (!o) setNavConfirmOpen(false); }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{navigateConfirmTitle}</DialogTitle>
            <DialogDescription>{navigateConfirmDesc}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNavConfirmOpen(false)}>
              {navigateCancelLabel}
            </Button>
            <Button onClick={handleNavigateConfirm}>
              {navigateConfirmAction}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
