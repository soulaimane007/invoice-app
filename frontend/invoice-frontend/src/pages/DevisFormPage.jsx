import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import apiClient, { unwrap } from '../api/client';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatCurrency } from '../utils/format';
import ClientAutocomplete from '../components/devis/ClientAutocomplete';
import ArticleSearchInput from '../components/devis/ArticleSearchInput';
import SousClientAutocomplete from '../components/devis/SousClientAutocomplete';
import ReferenceNumberField from '../components/devis/ReferenceNumberField';
import UnitInput from '../components/ui/UnitInput';
import EntityMatchModal from '../components/shared/EntityMatchModal';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function generateTempId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
function emptyLine() {
  return {
    tempId: generateTempId(),
    article_id: null,
    description: '',
    unit: 'Unité',
    is_service: false,
    quantity: '1',
    unit_price: '0',
    tva_rate: '20',
  };
}

// A service line has no quantity concept at all — its total is simply
// the price entered, never multiplied by anything. Everything else
// still multiplies quantity × price as usual.
function calculateLine(line) {
  const unitPrice = parseFloat(line.unit_price) || 0;
  const tvaRate = parseFloat(line.tva_rate) || 0;
  const totalHt = line.is_service ? unitPrice : (parseFloat(line.quantity) || 0) * unitPrice;
  const totalTtc = totalHt * (1 + tvaRate / 100);

  return { totalHt, totalTtc };
}

function calculateTotals(lines) {
  return lines.reduce(
    (acc, line) => {
      const { totalHt, totalTtc } = calculateLine(line);
      acc.subtotal += totalHt;
      acc.taxTotal += totalTtc - totalHt;
      acc.total += totalTtc;
      return acc;
    },
    { subtotal: 0, taxTotal: 0, total: 0 }
  );
}

export default function DevisFormPage() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const currency = (value) => `${formatCurrency(value, language)} MAD`;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [client, setClient] = useState({ id: null, name: '', address: '', phone: '', email: '', ice: '' });
  const [clientSnapshot, setClientSnapshot] = useState(null);
  const [workflowAModal, setWorkflowAModal] = useState(null);
  const [pendingClientMatch, setPendingClientMatch] = useState(null);
  const [sousClientId, setSousClientId] = useState(null);
  const [sousClientSnapshot, setSousClientSnapshot] = useState(null);
  const [pendingSousClientMatch, setPendingSousClientMatch] = useState(null);
  const [articleLineSnapshots, setArticleLineSnapshots] = useState({});
  const [pendingArticleRename, setPendingArticleRename] = useState(null);
  const [sousClientName, setSousClientName] = useState('');
  const [sousClientReference, setSousClientReference] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [date, setDate] = useState(todayISO());
  const [status, setStatus] = useState('draft');
  const [comment, setComment] = useState('');
  const [lines, setLines] = useState([emptyLine()]);

  useEffect(() => {
    if (isEdit) {
      apiClient.get(`/devis/${id}`)
        .then((res) => {
          const devis = unwrap(res);
          setClient({
            id: devis.client.id,
            name: devis.client.name ?? '',
            address: devis.client.address ?? '',
            phone: devis.client.phone ?? '',
            email: devis.client.email ?? '',
            ice: devis.client.ice ?? '',
          });
          setClientSnapshot({ name: devis.client.name ?? '', ice: devis.client.ice ?? '' });
          setSousClientId(devis.sous_client?.id ?? null);
          setSousClientName(devis.sous_client?.name ?? '');
          setSousClientReference(devis.sous_client?.reference ?? '');
          setSousClientSnapshot(devis.sous_client ? { name: devis.sous_client.name ?? '', reference: devis.sous_client.reference ?? '' } : null);
          setReferenceNumber(devis.reference_number ? String(devis.reference_number) : '');
          setDate(devis.date ?? todayISO());
          setStatus(devis.status ?? 'draft');
          setComment(devis.comment ?? '');
          const loadedLines = devis.lines.length > 0
            ? devis.lines.map((l) => ({
                tempId: generateTempId(),
                article_id: l.article_id,
                description: l.description,
                unit: l.unit ?? 'Unité',
                is_service: Boolean(l.is_service),
                quantity: l.quantity === null || l.quantity === undefined ? '' : String(l.quantity),
                unit_price: String(l.unit_price),
                tva_rate: String(l.tva_rate),
              }))
            : [emptyLine()];
          setLines(loadedLines);
          const snapshots = {};
          loadedLines.forEach((l) => { if (l.article_id) snapshots[l.tempId] = { description: l.description }; });
          setArticleLineSnapshots(snapshots);
        })
        .catch(() => showToast(t('form.couldNotLoadQuotation'), 'error'))
        .finally(() => setLoading(false));
    } else {
      apiClient.get('/devis/next-reference')
        .then((res) => setReferenceNumber(String(res.data.number)))
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function resetSousClient() {
    setSousClientId(null);
    setSousClientName('');
    setSousClientReference('');
  }

  function handleClientNameChange(name) {
    setClient((prev) => ({ ...prev, name, id: name.trim() === '' ? null : prev.id }));
    resetSousClient();
  }

  function handleClientPick(picked) {
    setClient({
      id: picked.id,
      name: picked.name,
      address: picked.address ?? '',
      phone: picked.phone ?? '',
      email: picked.email ?? '',
      ice: picked.ice ?? '',
    });
    setClientSnapshot({ name: picked.name, ice: picked.ice ?? '' });
    resetSousClient();
  }

  function handleSousClientNameChange(name) {
    setSousClientName(name);
    setSousClientId(name.trim() === '' ? null : sousClientId);
  }

  function handleSousClientPick(item) {
    setSousClientId(item.id);
    setSousClientName(item.name);
    setSousClientReference(item.reference ?? '');
    setSousClientSnapshot({ name: item.name, reference: item.reference ?? '' });
  }

  function addArticleLine(article) {
    const tempId = generateTempId();
    setLines((prev) => [
      ...prev,
      {
        tempId,
        article_id: article.id,
        description: article.description || article.name,
        unit: article.unit || 'Unité',
        is_service: false,
        quantity: '1',
        unit_price: String(article.unit_price ?? 0),
        tva_rate: String(article.tva_rate ?? 20),
      },
    ]);
    if (isEdit) {
      setArticleLineSnapshots((prev) => ({ ...prev, [tempId]: { description: article.description || article.name } }));
    }
  }

  function addBlankLine() {
    setLines((prev) => [...prev, emptyLine()]);
  }

  function updateLine(tempId, field, value) {
    setLines((prev) => prev.map((l) => (l.tempId === tempId ? { ...l, [field]: value } : l)));
  }

  function toggleLineService(tempId, checked) {
    setLines((prev) => prev.map((l) => (
      l.tempId === tempId ? { ...l, is_service: checked, article_id: checked ? null : l.article_id } : l
    )));
  }

  function removeLine(tempId) {
    setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.tempId !== tempId) : prev));
  }

  const totals = calculateTotals(lines);

  async function handleSubmit(e) {
    e.preventDefault();
    await runChecksAndSubmit();
  }

  // Single entry point for every path that can lead to a save — a fresh
  // manual entry, "create new" out of either confirmation modal, or a
  // resubmit after resolving an article rename. Always takes the CURRENT
  // client/sous-client id as an explicit argument rather than trusting
  // component state, since React state updates aren't visible until the
  // next render. Because "create new" now routes back through this same
  // function, the duplicate check always runs no matter which door the
  // user came in through.
  async function runChecksAndSubmit(overrides = {}) {
    let resolvedClientId = 'clientId' in overrides ? overrides.clientId : client.id;
    let resolvedSousClientId = 'sousClientId' in overrides ? overrides.sousClientId : sousClientId;
    const effectiveLines = overrides.lines ?? lines;

    if (resolvedClientId && clientSnapshot && (client.name !== clientSnapshot.name || client.ice !== clientSnapshot.ice)) {
      setWorkflowAModal('client');
      return;
    }
    if (resolvedSousClientId && sousClientSnapshot && (sousClientName !== sousClientSnapshot.name || sousClientReference !== sousClientSnapshot.reference)) {
      setWorkflowAModal('sousClient');
      return;
    }

    if (!resolvedClientId && client.name.trim()) {
      try {
        const res = await apiClient.post('/clients/check-match', { name: client.name, ice: client.ice });
        if (res.data.type === 'ice_match_name_differs' || res.data.type === 'name_match_ice_differs') {
          setPendingClientMatch(res.data);
          return;
        }
        if (res.data.type === 'exact') {
          resolvedClientId = res.data.client_id;
          setClient((prev) => ({ ...prev, id: resolvedClientId }));
        }
      } catch (err) {
        console.error('[check-match] Client duplicate check failed:', err.response?.status, err.response?.data);
        showToast('Could not verify this client against existing records — please try again.', 'error');
        return;
      }
    }

    if (resolvedClientId && !resolvedSousClientId && sousClientName.trim()) {
      try {
        const res = await apiClient.post(`/clients/${resolvedClientId}/sous-clients/check-match`, { matricule: sousClientReference });
        if (res.data.type === 'matricule_match') {
          setPendingSousClientMatch(res.data);
          return;
        }
      } catch { /* fail open */ }
    }

    if (isEdit) {
      const flagged = effectiveLines.find((l) => l.article_id && articleLineSnapshots[l.tempId] && l.description !== articleLineSnapshots[l.tempId].description);
      if (flagged) {
        setPendingArticleRename({ tempId: flagged.tempId, oldDescription: articleLineSnapshots[flagged.tempId].description, newDescription: flagged.description });
        return;
      }
    }

    await actualSubmit({ clientId: resolvedClientId, sousClientId: resolvedSousClientId, lines: effectiveLines });
  }

  async function actualSubmit(overrides = {}) {
    setSubmitting(true);
    setErrors({});

    const effectiveClientId = 'clientId' in overrides ? overrides.clientId : client.id;
    const effectiveSousClientId = 'sousClientId' in overrides ? overrides.sousClientId : sousClientId;
    const effectiveLines = overrides.lines ?? lines;

    const payload = {
      client: effectiveClientId
        ? { id: effectiveClientId, name: client.name, address: client.address, phone: client.phone, email: client.email, ice: client.ice }
        : { name: client.name, address: client.address, phone: client.phone, email: client.email, ice: client.ice },
      sous_client: sousClientName.trim()
        ? { id: effectiveSousClientId, name: sousClientName.trim(), reference: sousClientReference || null }
        : null,
      reference_number: referenceNumber ? parseInt(referenceNumber, 10) : null,
      date,
      status,
      comment,
      lines: effectiveLines
        .filter((l) => l.description.trim() !== '')
        .map((l) => ({
          article_id: l.article_id,
          description: l.description,
          unit: l.unit || 'Unité',
          is_service: l.is_service,
          rename_article: Boolean(l.rename_article),
          quantity: l.is_service ? null : (parseFloat(l.quantity) || 0),
          unit_price: parseFloat(l.unit_price) || 0,
          tva_rate: parseFloat(l.tva_rate) || 0,
        })),
    };

    try {
      if (isEdit) {
        await apiClient.put(`/devis/${id}`, payload);
        showToast(t('form.quotationUpdated'));
        navigate(`/devis/${id}`);
      } else {
        const res = await apiClient.post('/devis', payload);
        const created = unwrap(res);
        showToast(t('form.quotationCreated'));
        navigate(`/devis/${created.id}`);
      }
    } catch (err) {
      if (err.response?.status === 422) {
        const validationErrors = err.response.data.errors ?? {};
        setErrors(validationErrors);
        if (validationErrors.reference_number) {
          showToast(validationErrors.reference_number[0], 'error');
        } else {
          showToast(t('form.fixErrorsBelow'), 'error');
        }
      } else {
        showToast(err.response?.data?.message ?? t('form.somethingWrong'), 'error');
      }
    } finally {
      setSubmitting(false);
    }
  }

  function fieldError(field) {
    return errors[field]?.[0];
  }

  if (loading) {
    return <p className="text-sm text-noir-500">{t('common.loading')}</p>;
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/devis')} className="-m-2 rounded-lg p-2 text-noir-500 hover:bg-noir-100">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-semibold text-noir-900">{isEdit ? t('form.editQuotation') : t('form.newQuotation')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-noir-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-noir-900">{t('form.clientSection')}</h2>
            <div className="flex flex-col gap-3">
              <ClientAutocomplete value={client.name} onChange={handleClientNameChange} onPick={handleClientPick} />
              {fieldError('client.name') && <p className="text-xs text-red-600">{fieldError('client.name')}</p>}
              <input
                placeholder={t('form.address')}
                value={client.address}
                onChange={(e) => setClient((prev) => ({ ...prev, address: e.target.value }))}
                className="w-full rounded-lg border border-noir-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder={t('form.phone')}
                  value={client.phone}
                  onChange={(e) => setClient((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full rounded-lg border border-noir-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
                <input
                  placeholder={t('form.ice')}
                  value={client.ice}
                  onChange={(e) => setClient((prev) => ({ ...prev, ice: e.target.value }))}
                  className="w-full rounded-lg border border-noir-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>
              <input
                placeholder={t('form.email')}
                type="email"
                value={client.email}
                onChange={(e) => setClient((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full rounded-lg border border-noir-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
              />

              <div className="mt-1 grid grid-cols-2 gap-3 border-t border-noir-100 pt-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-noir-500">{t('form.sousClient')}</label>
                  <SousClientAutocomplete
                    clientId={client.id}
                    value={sousClientName}
                    onChange={handleSousClientNameChange}
                    onPick={handleSousClientPick}
                    disabled={!client.name.trim()}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-noir-500">{t('form.matricule')}</label>
                  <input
                    disabled={!client.name.trim()}
                    value={sousClientReference}
                    onChange={(e) => setSousClientReference(e.target.value)}
                    placeholder={t('form.matriculePlaceholder')}
                    className="w-full rounded-lg border border-noir-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 disabled:bg-noir-50 disabled:text-noir-400"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-noir-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-noir-900">{t('form.quotationInfo')}</h2>
            <div className="flex flex-col gap-3">
              <ReferenceNumberField documentType="devis" value={referenceNumber} onChange={setReferenceNumber} error={fieldError('reference_number')} label={t('form.reference')} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-noir-500">{t('form.date')}</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-lg border border-noir-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-noir-500">{t('form.status')}</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-lg border border-noir-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                  >
                    <option value="draft">{t('form.statusDraft')}</option>
                    <option value="sent">{t('form.statusSent')}</option>
                    <option value="accepted">{t('form.statusAccepted')}</option>
                    <option value="rejected">{t('form.statusRejected')}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-noir-500">{t('form.comment')}</label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full rounded-lg border border-noir-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-noir-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-noir-900">{t('form.products')}</h2>
            <ArticleSearchInput onSelect={addArticleLine} placeholder={t('form.searchArticle')} />
          </div>
          <p className="mb-3 text-xs text-noir-400">{t('form.manualArticleHint')}</p>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-noir-500">
                <tr>
                  <th className="py-2 pr-2 font-medium" style={{ width: '28%' }}>{t('form.description')}</th>
                  <th className="px-2 py-2 text-right font-medium">{t('form.qty')}</th>
                  <th className="px-2 py-2 font-medium">{t('form.unit')}</th>
                  <th className="px-2 py-2 text-right font-medium">{t('form.unitPrice')}</th>
                  <th className="px-2 py-2 text-right font-medium">{t('form.tvaPercent')}</th>
                  <th className="px-2 py-2 text-right font-medium">{t('form.totalHt')}</th>
                  <th className="w-8 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-noir-100">
                {lines.map((line) => {
                  const { totalHt } = calculateLine(line);
                  return (
                    <tr key={line.tempId} className={line.is_service ? 'bg-gold-50/60' : ''}>
                      <td className="py-2 pr-2 align-top">
                        <input
                          value={line.description}
                          onChange={(e) => updateLine(line.tempId, 'description', e.target.value)}
                          placeholder={t('form.description')}
                          className="w-full rounded-lg border border-noir-300 px-2 py-1.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                        />
                        <label className="mt-1.5 flex items-center gap-1.5 text-xs text-noir-500">
                          <input
                            type="checkbox"
                            checked={line.is_service}
                            onChange={(e) => toggleLineService(line.tempId, e.target.checked)}
                            className="rounded border-noir-300 text-gold-600 focus:ring-gold-500"
                          />
                          {t('form.service')}
                        </label>
                      </td>
                      <td className="px-2 py-2 align-top">
                        <input
                          type="number" min="0" step="0.01"
                          value={line.is_service ? '' : line.quantity}
                          onChange={(e) => updateLine(line.tempId, 'quantity', e.target.value)}
                          disabled={line.is_service}
                          placeholder={line.is_service ? '—' : undefined}
                          title={line.is_service ? "Sans objet pour un service — le montant est ajouté tel quel." : undefined}
                          className="w-20 rounded-lg border border-noir-300 px-2 py-1.5 text-right text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 disabled:cursor-not-allowed disabled:border-noir-200 disabled:bg-noir-50 disabled:text-noir-300"
                        />
                      </td>
                      <td className="px-2 py-2 align-top">
                        <UnitInput
                          value={line.unit}
                          onChange={(v) => updateLine(line.tempId, 'unit', v)}
                          listId={`unit-list-${line.tempId}`}
                          className="w-24 rounded-lg border border-noir-300 px-2 py-1.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                        />
                      </td>
                      <td className="px-2 py-2 align-top">
                        <input
                          type="number" min="0" step="0.01"
                          value={line.unit_price}
                          onChange={(e) => updateLine(line.tempId, 'unit_price', e.target.value)}
                          className="w-24 rounded-lg border border-noir-300 px-2 py-1.5 text-right text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                        />
                      </td>
                      <td className="px-2 py-2 align-top">
                        <input
                          type="number" min="0" max="100" step="0.1"
                          value={line.tva_rate}
                          onChange={(e) => updateLine(line.tempId, 'tva_rate', e.target.value)}
                          className="w-16 rounded-lg border border-noir-300 px-2 py-1.5 text-right text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                        />
                      </td>
                      <td className="px-2 py-2 text-right align-top font-medium text-noir-700">{currency(totalHt)}</td>
                      <td className="py-2 text-right align-top">
                        <button type="button" onClick={() => removeLine(line.tempId)} className="rounded-lg p-1.5 text-noir-400 hover:bg-noir-100 hover:text-red-600">
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 lg:hidden">
            {lines.map((line) => {
              const { totalHt } = calculateLine(line);
              return (
                <div key={line.tempId} className={`rounded-lg border p-3 ${line.is_service ? 'border-gold-300 bg-gold-50/60' : 'border-noir-200'}`}>
                  <div className="mb-2 flex items-start gap-2">
                    <input
                      value={line.description}
                      onChange={(e) => updateLine(line.tempId, 'description', e.target.value)}
                      placeholder={t('form.description')}
                      className="flex-1 rounded-lg border border-noir-300 px-2 py-1.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                    />
                    <button type="button" onClick={() => removeLine(line.tempId)} className="shrink-0 rounded-lg p-1.5 text-noir-400 hover:bg-noir-100 hover:text-red-600">
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <label className="mb-2 flex items-center gap-1.5 text-xs text-noir-500">
                    <input
                      type="checkbox"
                      checked={line.is_service}
                      onChange={(e) => toggleLineService(line.tempId, e.target.checked)}
                      className="rounded border-noir-300 text-gold-600 focus:ring-gold-500"
                    />
                    {t('form.service')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-0.5 block text-xs text-noir-500">{t('form.qty')}</label>
                      <input
                        type="number" min="0" step="0.01"
                        value={line.is_service ? '' : line.quantity}
                        onChange={(e) => updateLine(line.tempId, 'quantity', e.target.value)}
                        disabled={line.is_service}
                        placeholder={line.is_service ? '—' : undefined}
                        className="w-full rounded-lg border border-noir-300 px-2 py-1.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 disabled:cursor-not-allowed disabled:border-noir-200 disabled:bg-noir-50 disabled:text-noir-300"
                      />
                    </div>
                    <div>
                      <label className="mb-0.5 block text-xs text-noir-500">{t('form.unit')}</label>
                      <UnitInput
                        value={line.unit}
                        onChange={(v) => updateLine(line.tempId, 'unit', v)}
                        listId={`unit-list-m-${line.tempId}`}
                        className="w-full rounded-lg border border-noir-300 px-2 py-1.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                      />
                    </div>
                    <div>
                      <label className="mb-0.5 block text-xs text-noir-500">{t('form.unitPrice')}</label>
                      <input
                        type="number" min="0" step="0.01"
                        value={line.unit_price}
                        onChange={(e) => updateLine(line.tempId, 'unit_price', e.target.value)}
                        className="w-full rounded-lg border border-noir-300 px-2 py-1.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                      />
                    </div>
                    <div>
                      <label className="mb-0.5 block text-xs text-noir-500">{t('form.tvaPercent')}</label>
                      <input
                        type="number" min="0" max="100" step="0.1"
                        value={line.tva_rate}
                        onChange={(e) => updateLine(line.tempId, 'tva_rate', e.target.value)}
                        className="w-full rounded-lg border border-noir-300 px-2 py-1.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                      />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-end gap-1 border-t border-noir-100 pt-2 text-sm">
                    <span className="text-noir-500">{t('form.totalHt')} :</span>
                    <span className="font-medium text-noir-800">{currency(totalHt)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={addBlankLine}
            className="mt-3 flex items-center gap-1.5 text-sm font-medium text-gold-700 hover:text-gold-800"
          >
            <Plus size={15} /> {t('form.addEmptyLine')}
          </button>
          {fieldError('lines') && <p className="mt-2 text-xs text-red-600">{fieldError('lines')}</p>}

          <div className="mt-5 flex justify-end">
            <div className="w-full max-w-xs text-sm">
              <div className="flex justify-between border-b border-noir-100 py-1.5 text-noir-600">
                <span>{t('form.subtotal')}</span>
                <span>{currency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between border-b border-noir-100 py-1.5 text-noir-600">
                <span>{t('form.tva')}</span>
                <span>{currency(totals.taxTotal)}</span>
              </div>
              <div className="flex justify-between pt-2 text-base font-semibold text-noir-900">
                <span>{t('form.total')}</span>
                <span>{currency(totals.total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => navigate('/devis')} className="rounded-lg border border-noir-300 px-4 py-2 text-sm font-medium text-noir-700 hover:bg-noir-50">
            {t('form.cancel')}
          </button>
          <button type="submit" disabled={submitting} className="rounded-lg bg-gold-600 px-5 py-2 text-sm font-medium text-white hover:bg-gold-500 disabled:opacity-60">
            {submitting ? t('form.saving') : isEdit ? t('form.saveChanges') : t('form.createQuotation')}
          </button>
        </div>
      </form>

      <EntityMatchModal
        open={workflowAModal === 'client'}
        onClose={() => setWorkflowAModal(null)}
        title="Le client existant a été modifié"
        message={`Vous avez modifié les informations de "${clientSnapshot?.name}".`}
        keepLabel="Créer un nouveau client"
        changeLabel="Modifier le client existant"
        onKeep={() => { setClient((prev) => ({ ...prev, id: null })); setWorkflowAModal(null); runChecksAndSubmit({ clientId: null }); }}
        onChange={async () => {
          setWorkflowAModal(null);
          try {
            const res = await apiClient.post(`/clients/${client.id}/check-ice-conflict`, { ice: client.ice });
            if (res.data.conflict) {
              showToast(`Cette ICE appartient déjà à "${res.data.conflicting_client_name}" — impossible de l'attribuer à ce client aussi.`, 'error');
              return;
            }
          } catch { /* fail open — don't block a legitimate save over a network hiccup */ }
          actualSubmit();
        }}
      />
      <EntityMatchModal
        open={workflowAModal === 'sousClient'}
        onClose={() => setWorkflowAModal(null)}
        title="Le sous-client existant a été modifié"
        message={`Vous avez modifié les informations de "${sousClientSnapshot?.name}".`}
        keepLabel="Créer un nouveau sous-client"
        changeLabel="Modifier le sous-client existant"
        onKeep={() => { setSousClientId(null); setWorkflowAModal(null); runChecksAndSubmit({ sousClientId: null }); }}
        onChange={() => { setWorkflowAModal(null); actualSubmit(); }}
      />
      <EntityMatchModal
        open={Boolean(pendingClientMatch)}
        onClose={() => setPendingClientMatch(null)}
        title={pendingClientMatch?.type === 'ice_match_name_differs' ? "L'ICE existe déjà" : `Le client "${client.name}" existe déjà`}
        message={
          pendingClientMatch?.type === 'ice_match_name_differs'
            ? `Nom enregistré :\n${pendingClientMatch?.existing_name}\n\nNom saisi :\n${pendingClientMatch?.submitted_name}`
            : `ICE enregistré :\n${pendingClientMatch?.existing_ice || '—'}\n\nICE saisi :\n${pendingClientMatch?.submitted_ice}`
        }
        keepLabel={pendingClientMatch?.type === 'ice_match_name_differs' ? 'Conserver le nom enregistré' : "Conserver l'ICE enregistré"}
        changeLabel={pendingClientMatch?.type === 'ice_match_name_differs' ? 'Modifier le nom' : "Modifier l'ICE"}
        onKeep={() => { const cid = pendingClientMatch.client_id; setClient((prev) => ({ ...prev, id: cid })); setPendingClientMatch(null); actualSubmit({ clientId: cid }); }}
        onChange={() => { const cid = pendingClientMatch.client_id; setClient((prev) => ({ ...prev, id: cid })); setPendingClientMatch(null); actualSubmit({ clientId: cid }); }}
      />
      <EntityMatchModal
        open={Boolean(pendingArticleRename)}
        onClose={() => setPendingArticleRename(null)}
        title="Le nom de l'article a été modifié"
        message={`Ancien nom :\n${pendingArticleRename?.oldDescription}\n\nNouveau nom :\n${pendingArticleRename?.newDescription}`}
        keepLabel="Créer un nouvel article"
        changeLabel="Modifier l'article existant"
        onKeep={() => {
          const { tempId } = pendingArticleRename;
          const newLines = lines.map((l) => (l.tempId === tempId ? { ...l, article_id: null, rename_article: false } : l));
          setLines(newLines);
          setArticleLineSnapshots((prev) => { const next = { ...prev }; delete next[tempId]; return next; });
          setPendingArticleRename(null);
          runChecksAndSubmit({ lines: newLines });
        }}
        onChange={() => {
          const { tempId, newDescription } = pendingArticleRename;
          const newLines = lines.map((l) => (l.tempId === tempId ? { ...l, rename_article: true } : l));
          setLines(newLines);
          setArticleLineSnapshots((prev) => ({ ...prev, [tempId]: { description: newDescription } }));
          setPendingArticleRename(null);
          runChecksAndSubmit({ lines: newLines });
        }}
      />
      <EntityMatchModal
        open={Boolean(pendingSousClientMatch)}
        onClose={() => setPendingSousClientMatch(null)}
        title="Ce matricule existe déjà"
        message="Un sous-client avec ce matricule existe déjà pour ce client. Utiliser le sous-client existant ?"
        keepLabel="Utiliser l'existant"
        changeLabel="Utiliser l'existant"
        onKeep={() => { const scid = pendingSousClientMatch.sous_client_id; setSousClientId(scid); setPendingSousClientMatch(null); actualSubmit({ sousClientId: scid }); }}
        onChange={() => { const scid = pendingSousClientMatch.sous_client_id; setSousClientId(scid); setPendingSousClientMatch(null); actualSubmit({ sousClientId: scid }); }}
      />
    </div>
  );
}