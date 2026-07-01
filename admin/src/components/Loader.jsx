export default function Loader({ text = 'Loading…' }) {
  return (
    <div className="loading">
      <div className="spinner" />
      <div style={{ marginTop: 12 }}>{text}</div>
    </div>
  );
}
