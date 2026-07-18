export default function StatcastLoading() {
  return (
    <div className="pageShell">
      <div className="skeleton loadingHeader" />
      <div className="cardGrid cardGrid3">
        {[0, 1, 2].map((item) => <div key={item} className="card skeleton" style={{ minHeight: 180 }} />)}
      </div>
      <div className="card skeleton" style={{ minHeight: 420 }} />
    </div>
  );
}
