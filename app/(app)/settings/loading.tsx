import { Skeleton } from '@/components/ui/surface';

export default function Loading() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-56 w-full" />
      <Skeleton className="h-44 w-full" />
    </div>
  );
}
