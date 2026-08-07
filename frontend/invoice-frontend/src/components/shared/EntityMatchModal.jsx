import Modal from '../ui/Modal';

export default function EntityMatchModal({ open, onClose, title, message, keepLabel, changeLabel, onKeep, onChange }) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
      <p className="mb-4 whitespace-pre-line text-sm text-noir-600">{message}</p>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onKeep} className="rounded-lg border border-noir-300 px-4 py-2 text-sm font-medium text-noir-700 hover:bg-noir-50">
          {keepLabel}
        </button>
        <button type="button" onClick={onChange} className="rounded-lg bg-gold-600 px-4 py-2 text-sm font-medium text-white hover:bg-gold-500">
          {changeLabel}
        </button>
      </div>
    </Modal>
  );
}