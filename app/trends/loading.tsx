export default function TrendsLoading() {
  return (
    <div className="scoreboardPage">
      <div className="loadingHeader skeleton" />
      <div className="gameGrid">
        {Array.from({ length: 6 }).map((_, index) => (
          <div className="gameCard skeletonCard" key={index}>
            <div className="skeleton skeletonLine medium" />
            <div className="skeleton skeletonLine" />
            <div className="skeleton skeletonLine short" />
          </div>
        ))}
      </div>
    </div>
  );
}
