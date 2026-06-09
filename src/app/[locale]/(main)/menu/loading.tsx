function ListLoadingRows() {
  return (
    <div className="space-y-px">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 px-4 py-3">
          <div className="h-10 w-10 shrink-0 rounded-xl animate-shimmer" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-3/5 rounded-md animate-shimmer" />
            <div className="h-2.5 w-2/5 rounded-md animate-shimmer" />
          </div>
          <div className="h-8 w-12 shrink-0 rounded-lg animate-shimmer" />
        </div>
      ))}
    </div>
  );
}

export default function MenuLoading() {
  return <ListLoadingRows />;
}
