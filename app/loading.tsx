export default function Loading() {
  return (
    <section aria-label="Loading MLB games">
      <div className="loadingHeader skeleton" />
      <div className="gameGrid">
        {Array.from({ length: 6 }).map((_, index) => (
          <div className="gameCard skeletonCard" key={index}>
            <div className="skeleton skeletonLine short" />
            <div className="skeleton skeletonLine" />
            <div className="skeleton skeletonLine" />
            <div className="skeleton skeletonLine medium" />
          </div>
        ))}
      </div>
    </section>
  );
}
