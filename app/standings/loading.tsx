export default function StandingsLoading() {
  return (
    <div className="standingsPage" aria-label="Loading MLB standings">
      <div className="pageHero skeleton standingsHeroSkeleton" />
      <div className="standingsGrid">
        {Array.from({ length: 6 }).map((_, index) => (
          <div className="standingsCard standingsSkeleton" key={index}>
            <div className="skeleton skeletonLine medium" />
            {Array.from({ length: 5 }).map((__, row) => (
              <div className="skeleton skeletonLine" key={row} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}