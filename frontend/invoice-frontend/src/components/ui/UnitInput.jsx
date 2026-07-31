import { COMMON_UNITS } from '../../utils/units';

export default function UnitInput({ value, onChange, className, listId = 'unit-suggestions' }) {
  return (
    <>
      <input
        list={listId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Unité"
        className={className}
      />
      <datalist id={listId}>
        {COMMON_UNITS.map((u) => <option key={u} value={u} />)}
      </datalist>
    </>
  );
}