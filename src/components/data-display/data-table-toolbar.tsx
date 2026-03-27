'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/use-debounce';

interface DataTableToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  placeholder?: string;
  filters?: React.ReactNode;
  selectedCount?: number;
  bulkActions?: React.ReactNode;
}

export function DataTableToolbar({
  search,
  onSearchChange,
  placeholder = 'Search...',
  filters,
  selectedCount = 0,
  bulkActions,
}: DataTableToolbarProps) {
  const [inputValue, setInputValue] = React.useState(search);
  const debouncedValue = useDebounce(inputValue, 300);

  React.useEffect(() => {
    onSearchChange(debouncedValue);
  }, [debouncedValue, onSearchChange]);

  React.useEffect(() => {
    setInputValue(search);
  }, [search]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={placeholder}
            className="pl-8"
          />
        </div>
        {filters}
      </div>
      {selectedCount > 0 && (
        <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm">
          <span className="text-muted-foreground">{selectedCount} selected</span>
          {bulkActions}
        </div>
      )}
    </div>
  );
}
