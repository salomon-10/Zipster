import { Skeleton } from '@/components/ui/surface';

export default function Loading() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-56 w-full" />
    </div>
  );
}
