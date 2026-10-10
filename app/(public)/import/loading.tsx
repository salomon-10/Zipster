import { Skeleton } from '@/components/ui/surface';

export default function Loading() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
