export default function LeadersLoading() {
  return (
    <div className="scoreboardPage">
      <div className="loadingHeader skeleton" />
      <div className="gameGrid">
        {Array.from({ length: 6 }).map((_, index) => (
          <div className="skeleton skeletonCard" key={index}>
            <div className="skeletonLine medium" />
            <div className="skeletonLine" />
            <div className="skeletonLine" />
            <div className="skeletonLine short" />
          </div>
        ))}
      </div>
    </div>
  );
}
