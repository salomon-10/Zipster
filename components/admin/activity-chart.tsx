import type { ActivityPoint } from '@/lib/db/types';

const WIDTH = 600;
const HEIGHT = 120;
const GAP = 3;

function label(day: string) {
  return new Date(`${day}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Plain SVG bars. Colours come from the theme tokens, so light and dark both
 *  work, and it renders on the server: no chart library in the browser. */
export function ActivityChart({ data }: { data: ActivityPoint[] }) {
  const max = Math.max(1, ...data.map((point) => point.generations));
  const barWidth = data.length > 0 ? (WIDTH - GAP * (data.length - 1)) / data.length : 0;
  const first = data[0];
  const last = data[data.length - 1];

  return (
    <figure>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Generations per day, peak ${max}`}
        className="h-32 w-full"
      >
        {data.map((point, index) => {
          const height = Math.max(2, (point.generations / max) * (HEIGHT - 4));
          return (
            <rect
              key={point.day}
              x={index * (barWidth + GAP)}
              y={HEIGHT - height}
              width={barWidth}
              height={height}
              rx={1}
              fill={point.generations > 0 ? 'rgb(var(--accent))' : 'rgb(var(--rail))'}
            >
              <title>{`${label(point.day)}: ${point.generations}`}</title>
            </rect>
          );
        })}
      </svg>
      {first && last ? (
        <figcaption className="mt-1.5 flex justify-between font-mono text-2xs text-muted">
          <span>{label(first.day)}</span>
          <span>peak {max}/day</span>
          <span>{label(last.day)}</span>
        </figcaption>
      ) : null}
    </figure>
  );
}
