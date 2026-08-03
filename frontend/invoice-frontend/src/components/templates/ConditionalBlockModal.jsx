import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import apiClient from '../../api/client';
import { NUMERIC_CONDITION_VARS, CATEGORICAL_CONDITION_VARS } from '../../utils/conditionVariables';

const NUMERIC_OPS = [
  { value: 'gt', label: 'est supérieur à' },
  { value: 'gte', label: 'est supérieur ou égal à' },
  { value: 'lt', label: 'est inférieur à' },
  { value: 'lte', label: 'est inférieur ou égal à' },
  { value: 'eq', label: 'est égal à' },
  { value: 'neq', label: "n'est pas égal à" },
];
const CATEGORICAL_OPS = [
  { value: 'eq', label: 'est égal à' },
  { value: 'neq', label: "n'est pas égal à" },
];

export default function ConditionalBlockModal({ open, onClose, documentType, onConfirm }) {
  const [varKey, setVarKey] = useState('total');
  const [op, setOp] = useState('gt');
  const [value, setValue] = useState('');
  const [dynamicUnits, setDynamicUnits] = useState([]);

  const numericVars = NUMERIC_CONDITION_VARS.filter((v) => !v.factureOnly || documentType === 'facture');
  const categoricalVars = CATEGORICAL_CONDITION_VARS.filter((v) => (!v.devisOnly || documentType === 'devis') && (!v.factureOnly || documentType === 'facture'));
  const allVars = [...numericVars, ...categoricalVars];
  const selected = allVars.find((v) => v.key === varKey);
  const isCategorical = categoricalVars.some((v) => v.key === varKey);

  useEffect(() => {
    if (open && selected?.dynamicOptions) {
      apiClient.get('/articles/distinct-units').then((res) => setDynamicUnits(res.data.units || []));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, varKey]);

  useEffect(() => {
    if (open) {
      setVarKey('total');
      setOp('gt');
      setValue('');
    }
  }, [open]);

  function handleConfirm() {
    if (!value) return;
    onConfirm({ conditionVar: varKey, conditionOp: op, conditionValue: value });
    onClose();
  }

  const options = selected?.options || (selected?.dynamicOptions ? dynamicUnits.map((u) => ({ value: u, label: u })) : null);

  return (
    <Modal open={open} onClose={onClose} title="Affichage conditionnel" maxWidth="max-w-sm">
      <div className="flex flex-col gap-3">
        <p className="text-xs text-noir-500">
          Placez le curseur dans le paragraphe à rendre conditionnel avant d'ouvrir cet outil — il ne s'affichera au téléchargement que si la condition ci-dessous est vraie.
        </p>
        <div>
          <label className="mb-1 block text-xs font-medium text-noir-500">Variable</label>
          <select
            value={varKey}
            onChange={(e) => {
              const newVarKey = e.target.value;
              const willBeCategorical = categoricalVars.some((v) => v.key === newVarKey);
              setVarKey(newVarKey);
              setOp(willBeCategorical ? 'eq' : 'gt'); // must match a real option in whichever operator list this switches to
              setValue('');
            }}
            className="w-full rounded-lg border border-noir-300 px-3 py-2 text-sm"
          >
            <optgroup label="Numérique">
              {numericVars.map((v) => <option key={v.key} value={v.key}>{v.label}</option>)}
            </optgroup>
            <optgroup label="Catégorie">
              {categoricalVars.map((v) => <option key={v.key} value={v.key}>{v.label}</option>)}
            </optgroup>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-noir-500">Condition</label>
          <select value={op} onChange={(e) => setOp(e.target.value)} className="w-full rounded-lg border border-noir-300 px-3 py-2 text-sm">
            {(isCategorical ? CATEGORICAL_OPS : NUMERIC_OPS).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-noir-500">Valeur</label>
          {options ? (
            <select value={value} onChange={(e) => setValue(e.target.value)} className="w-full rounded-lg border border-noir-300 px-3 py-2 text-sm">
              <option value="">Choisir...</option>
              {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ) : (
            <input type="number" value={value} onChange={(e) => setValue(e.target.value)} className="w-full rounded-lg border border-noir-300 px-3 py-2 text-sm" />
          )}
        </div>
        <div className="mt-1 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-noir-300 px-4 py-2 text-sm font-medium text-noir-700 hover:bg-noir-50">Annuler</button>
          <button onClick={handleConfirm} disabled={!value} className="rounded-lg bg-gold-600 px-4 py-2 text-sm font-medium text-white hover:bg-gold-500 disabled:opacity-50">Appliquer</button>
        </div>
      </div>
    </Modal>
  );
}