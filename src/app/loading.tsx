export default function Loading() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent" />
        <p className="text-sm text-[var(--muted-foreground)]">로딩 중...</p>
      </div>
    </div>
  );
}
