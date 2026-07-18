export default function GameCenterLoading() {
  return (
    <div className="gameCenter" aria-label="Loading Game Center">
      <div className="loadingHeader skeleton" />
      <div className="detailCard skeletonCard">
        <div className="skeleton skeletonLine short" />
        <div className="skeleton skeletonLine" />
        <div className="skeleton skeletonLine medium" />
      </div>
      <div className="detailGrid">
        <div className="detailCard skeletonCard" />
        <div className="detailCard skeletonCard" />
      </div>
    </div>
  );
}
