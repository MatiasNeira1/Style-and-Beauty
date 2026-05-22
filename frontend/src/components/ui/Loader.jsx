export function Loader() {
  return (
    <div className="loader-container">
      <div className="loader" aria-label="Cargando">
        <div className="loader-ring" />
        <div className="loader-ring" />
        <div className="loader-ring" />
      </div>
    </div>
  );
}
