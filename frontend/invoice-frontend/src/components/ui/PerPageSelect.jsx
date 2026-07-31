export default function PerPageSelect({ value, onChange, options = [10, 25, 50, 100] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
    >
      {options.map((n) => (
        <option key={n} value={n}>{n} / page</option>
      ))}
    </select>
  );
}