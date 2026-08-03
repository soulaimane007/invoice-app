import { getTemplateVariables } from '../../utils/templateVariables';

export default function VariablePalette({ documentType, editor }) {
  const groups = getTemplateVariables(documentType);

  function insert(variable) {
    if (!editor) return;
    if (variable.type === 'image') {
      editor.chain().focus().insertContent({ type: 'variableImage', attrs: { variableKey: variable.key } }).run();
    } else {
      editor.chain().focus().insertContent(`<span data-variable="${variable.key}">${variable.label}</span>`).run();
    }
  }

  return (
    <div className="flex w-64 shrink-0 flex-col gap-4 overflow-y-auto border-r border-noir-200 bg-white p-3">
      <p className="text-xs text-noir-400">
        Cliquez sur une variable pour l'insérer à l'endroit du curseur. Les variables « ligne » doivent être placées dans le tableau des lignes pour se répéter correctement.
      </p>
      <p className="text-xs text-noir-400">
        Un tableau en pointillés sert seulement à positionner les éléments — il ne s'affiche jamais au téléchargement. Activez « Bordures visibles » pour qu'un tableau apparaisse réellement dans le document final.
      </p>
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-1.5 text-xs font-semibold uppercase text-noir-400">{group.label}</p>
          <div className="flex flex-col gap-1">
            {group.variables.map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => insert(v)}
                className="rounded-md border border-noir-200 px-2 py-1.5 text-left text-xs text-noir-700 hover:border-gold-400 hover:bg-gold-50"
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}