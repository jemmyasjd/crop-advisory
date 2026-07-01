import Modal from './Modal';

export default function ConfirmDialog({
  title = 'Confirm',
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onClose,
  busy,
}) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={busy}>
            {busy ? 'Working…' : confirmLabel}
          </button>
        </>
      }
    >
      <p style={{ color: 'var(--gray-600)' }}>{message}</p>
    </Modal>
  );
}
