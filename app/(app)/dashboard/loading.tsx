import { Skeleton } from '@/components/ui/surface';

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
