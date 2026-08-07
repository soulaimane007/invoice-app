import { Fragment, useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
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
import MatriculeSlotInput from '../components/facture/MatriculeSlotInput';
import EntityMatchModal from '../components/shared/EntityMatchModal';
import UnitInput from '../components/ui/UnitInput';

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
    matricules: [],
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

export default function FactureFormPage() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { id } = useParams();
  const location = useLocation();
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
  const [dueDate, setDueDate] = useState('');
  const [comment, setComment] = useState('');
  const [lines, setLines] = useState([emptyLine()]);

  useEffect(() => {
    if (isEdit) {
      apiClient.get(`/facture/${id}`)
        .then((res) => {
          const facture = unwrap(res);
          setClient({
            id: facture.client.id,
            name: facture.client.name ?? '',
            address: facture.client.address ?? '',
            phone: facture.client.phone ?? '',
            email: facture.client.email ?? '',
            ice: facture.client.ice ?? '',
          });
          setClientSnapshot({ name: facture.client.name ?? '', ice: facture.client.ice ?? '' });
          setSousClientId(facture.sous_client?.id ?? null);
          setSousClientName(facture.sous_client?.name ?? '');
          setSousClientReference(facture.sous_client?.reference ?? '');
          setSousClientSnapshot(facture.sous_client ? { name: facture.sous_client.name ?? '', reference: facture.sous_client.reference ?? '' } : null);
          setReferenceNumber(facture.reference_number ? String(facture.reference_number) : '');
          setDate(facture.date ?? todayISO());
          setDueDate(facture.due_date ?? '');
          setComment(facture.comment ?? '');
          const loadedLines = facture.lines.length > 0
            ? facture.lines.map((l) => ({
                tempId: generateTempId(),
                article_id: l.article_id,
                description: l.description,
                unit: l.unit ?? 'Unité',
                is_service: Boolean(l.is_service),
                quantity: l.quantity === null || l.quantity === undefined ? '' : String(l.quantity),
                unit_price: String(l.unit_price),
                tva_rate: String(l.tva_rate),
                matricules: (l.matricules || []).map((m) => m.matricule),
              }))
            : [emptyLine()];
          setLines(loadedLines);
          const snapshots = {};
          loadedLines.forEach((l) => { if (l.article_id) snapshots[l.tempId] = { description: l.description }; });
          setArticleLineSnapshots(snapshots);
        })
        .catch(() => showToast(t('form.couldNotLoadInvoice'), 'error'))
        .finally(() => setLoading(false));
    } else {
      const copySource = location.state?.copyFrom;
      if (copySource) {
        setClient({
          id: copySource.client.id,
          name: copySource.client.name ?? '',
          address: copySource.client.address ?? '',
          phone: copySource.client.phone ?? '',
          email: copySource.client.email ?? '',
          ice: copySource.client.ice ?? '',
        });
        setSousClientId(copySource.sous_client?.id ?? null);
        setSousClientName(copySource.sous_client?.name ?? '');
        setSousClientReference(copySource.sous_client?.reference ?? '');
        setComment(copySource.comment ?? '');
        setLines(copySource.lines.length > 0
          ? copySource.lines.map((l) => ({
              tempId: generateTempId(),
              article_id: l.article_id,
              description: l.description,
              unit: l.unit ?? 'Unité',
              is_service: Boolean(l.is_service),
              quantity: l.quantity === null || l.quantity === undefined ? '' : String(l.quantity),
              unit_price: String(l.unit_price),
              tva_rate: String(l.tva_rate),
              matricules: [], // never copied — each matricule belongs to the unit sold on the original invoice
            }))
          : [emptyLine()]);
      }
      apiClient.get('/facture/next-reference')
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

  function clientWasEditedAfterSelection() {
    return Boolean(client.id) && clientSnapshot && (client.name !== clientSnapshot.name || client.ice !== clientSnapshot.ice);
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

  function sousClientWasEditedAfterSelection() {
    return Boolean(sousClientId) && sousClientSnapshot && (sousClientName !== sousClientSnapshot.name || sousClientReference !== sousClientSnapshot.reference);
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
        matricules: [],
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

  // Quantity itself is left untouched here on purpose — the field is
  // simply hidden/disabled while is_service is true (see the value=
  // ternaries below), so toggling Service back off restores whatever
  // quantity was there before, rather than losing it.
  function toggleLineService(tempId, checked) {
    setLines((prev) => prev.map((l) => (
      l.tempId === tempId
        ? { ...l, is_service: checked, article_id: checked ? null : l.article_id, matricules: checked ? [] : l.matricules }
        : l
    )));
  }

  function updateLineMatricule(tempId, index, value) {
    setLines((prev) => prev.map((l) => {
      if (l.tempId !== tempId) return l;
      const matricules = [...(l.matricules || [])];
      matricules[index] = value;
      return { ...l, matricules };
    }));
  }

  function removeLine(tempId) {
    setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.tempId !== tempId) : prev));
  }

  const totals = calculateTotals(lines);

  async function handleSubmit(e) {
    e.preventDefault();
    await runChecksAndSubmit();
  }

  async function runChecksAndSubmit() {
    if (clientWasEditedAfterSelection()) {
      setWorkflowAModal('client');
      return;
    }
    if (sousClientWasEditedAfterSelection()) {
      setWorkflowAModal('sousClient');
      return;
    }

    if (!client.id && client.name.trim()) {
      try {
        const res = await apiClient.post('/clients/check-match', { name: client.name, ice: client.ice });
        if (res.data.type === 'ice_match_name_differs' || res.data.type === 'name_match_ice_differs') {
          setPendingClientMatch(res.data);
          return;
        }
        if (res.data.type === 'exact') {
          setClient((prev) => ({ ...prev, id: res.data.client_id }));
        }
      } catch (err) {
        console.error('[check-match] Client duplicate check failed:', err.response?.status, err.response?.data);
        showToast('Could not verify this client against existing records — please try again.', 'error');
        return; // stop here instead of silently proceeding to creation
      }
    }

    if (client.id && !sousClientId && sousClientName.trim()) {
      try {
        const res = await apiClient.post(`/clients/${client.id}/sous-clients/check-match`, { matricule: sousClientReference });
        if (res.data.type === 'matricule_match') {
          setPendingSousClientMatch(res.data);
          return;
        }
      } catch { /* fail open */ }
    }

    if (isEdit) {
      const flagged = lines.find((l) => l.article_id && articleLineSnapshots[l.tempId] && l.description !== articleLineSnapshots[l.tempId].description);
      if (flagged) {
        setPendingArticleRename({ tempId: flagged.tempId, oldDescription: articleLineSnapshots[flagged.tempId].description, newDescription: flagged.description });
        return;
      }
    }

    await actualSubmit();
  }

  async function actualSubmit() {
    setSubmitting(true);
    setErrors({});

    const payload = {
      client: client.id
        ? { id: client.id, name: client.name, address: client.address, phone: client.phone, email: client.email, ice: client.ice }
        : { name: client.name, address: client.address, phone: client.phone, email: client.email, ice: client.ice },
      sous_client: sousClientName.trim()
        ? { id: sousClientId, name: sousClientName.trim(), reference: sousClientReference || null }
        : null,
      reference_number: referenceNumber ? parseInt(referenceNumber, 10) : null,
      date,
      due_date: dueDate || undefined,
      comment,
      lines: lines
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
          matricules: (l.matricules || []).filter((m) => m && m.trim() !== ''),
        })),
    };

    try {
      const res = isEdit
        ? await apiClient.put(`/facture/${id}`, payload)
        : await apiClient.post('/facture', payload);

      const warnings = res.data.stock_warnings || [];
      showToast(isEdit ? t('form.invoiceUpdated') : t('form.invoiceCreated'));
      warnings.forEach((w) => showToast(`${w.article} — demandé ${w.requested}, disponible avant vente ${w.available_before}. Stock désormais à ${w.resulting_stock}.`, 'warning'));

      const saved = unwrap(res);
      navigate(`/factures/${saved.id}`, { state: { stockWarnings: warnings } });
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
        <button onClick={() => navigate('/factures')} className="-m-2 rounded-lg p-2 text-noir-500 hover:bg-noir-100">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-semibold text-noir-900">{isEdit ? t('form.editInvoice') : t('form.newInvoice')}</h1>
      </div>

      {!isEdit && location.state?.copyFrom && (
        <p className="-mt-4 text-sm text-noir-500">
          {t('form.preFilledFrom', { reference: location.state.copyFrom.reference })}
        </p>
      )}

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
            <h2 className="mb-4 text-sm font-semibold text-noir-900">{t('form.invoiceInfo')}</h2>
            <div className="flex flex-col gap-3">
              <ReferenceNumberField documentType="facture" value={referenceNumber} onChange={setReferenceNumber} error={fieldError('reference_number')} label={t('form.reference')} />
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
                  <label className="mb-1 block text-xs font-medium text-noir-500">{t('form.dueDate')}</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-lg border border-noir-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
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
                  const slotCount = (!line.is_service && line.description.trim())
                    ? Math.max(0, Math.floor(parseFloat(line.quantity) || 0))
                    : 0;
                  return (
                    <Fragment key={line.tempId}>
                      <tr className={line.is_service ? 'bg-gold-50/60' : ''}>
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
                      {slotCount > 0 && (
                        <tr>
                          <td colSpan={7} className="bg-noir-50/60 px-2 pb-3 pt-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="mr-1 shrink-0 text-xs font-medium text-noir-400">{t('form.matriculesOptional')} :</span>
                              {Array.from({ length: slotCount }).map((_, i) => (
                                <div key={i} className="min-w-[5.5rem] flex-1">
                                  <MatriculeSlotInput
                                    articleId={line.article_id}
                                    value={line.matricules?.[i] ?? ''}
                                    onChange={(v) => updateLineMatricule(line.tempId, i, v)}
                                    placeholder={t('form.matriculeSlotLabel', { n: i + 1 })}
                                    excludeValues={(line.matricules || []).filter((_, idx) => idx !== i)}
                                  />
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 lg:hidden">
            {lines.map((line) => {
              const { totalHt } = calculateLine(line);
              const slotCount = (!line.is_service && line.description.trim())
                ? Math.max(0, Math.floor(parseFloat(line.quantity) || 0))
                : 0;
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

                  {slotCount > 0 && (
                    <div className="mt-2 border-t border-noir-100 pt-2">
                      <span className="mb-1 block text-xs font-medium text-noir-400">{t('form.matriculesOptional')}</span>
                      <div className="flex flex-wrap gap-1.5">
                        {Array.from({ length: slotCount }).map((_, i) => (
                          <div key={i} className="min-w-[5.5rem] flex-1">
                            <MatriculeSlotInput
                              articleId={line.article_id}
                              value={line.matricules?.[i] ?? ''}
                              onChange={(v) => updateLineMatricule(line.tempId, i, v)}
                              placeholder={t('form.matriculeSlotLabel', { n: i + 1 })}
                              excludeValues={(line.matricules || []).filter((_, idx) => idx !== i)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-2 flex items-center justify-end gap-1 border-t border-noir-100 pt-2 text-sm">
                    <span className="text-noir-500">{t('form.totalHt')} :</span>
                    <span className="font-medium text-noir-800">{currency(totalHt)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <button type="button" onClick={addBlankLine} className="mt-3 flex items-center gap-1.5 text-sm font-medium text-gold-700 hover:text-gold-800">
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
          <button type="button" onClick={() => navigate('/factures')} className="rounded-lg border border-noir-300 px-4 py-2 text-sm font-medium text-noir-700 hover:bg-noir-50">
            {t('form.cancel')}
          </button>
          <button type="submit" disabled={submitting} className="rounded-lg bg-gold-600 px-5 py-2 text-sm font-medium text-white hover:bg-gold-500 disabled:opacity-60">
            {submitting ? t('form.saving') : isEdit ? t('form.saveChanges') : t('form.createInvoice')}
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
        onKeep={() => { setClient((prev) => ({ ...prev, id: null })); setWorkflowAModal(null); actualSubmit(); }}
        onChange={() => { setWorkflowAModal(null); actualSubmit(); }}
      />
      <EntityMatchModal
        open={workflowAModal === 'sousClient'}
        onClose={() => setWorkflowAModal(null)}
        title="Le sous-client existant a été modifié"
        message={`Vous avez modifié les informations de "${sousClientSnapshot?.name}".`}
        keepLabel="Créer un nouveau sous-client"
        changeLabel="Modifier le sous-client existant"
        onKeep={() => { setSousClientId(null); setWorkflowAModal(null); actualSubmit(); }}
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
        onKeep={() => { setClient((prev) => ({ ...prev, id: pendingClientMatch.client_id })); setPendingClientMatch(null); actualSubmit(); }}
        onChange={() => { setClient((prev) => ({ ...prev, id: pendingClientMatch.client_id })); setPendingClientMatch(null); actualSubmit(); }}
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
          setLines((prev) => prev.map((l) => (l.tempId === tempId ? { ...l, article_id: null, rename_article: false } : l)));
          setArticleLineSnapshots((prev) => { const next = { ...prev }; delete next[tempId]; return next; });
          setPendingArticleRename(null);
          runChecksAndSubmit();
        }}
        onChange={() => {
          const { tempId, newDescription } = pendingArticleRename;
          setLines((prev) => prev.map((l) => (l.tempId === tempId ? { ...l, rename_article: true } : l)));
          setArticleLineSnapshots((prev) => ({ ...prev, [tempId]: { description: newDescription } }));
          setPendingArticleRename(null);
          runChecksAndSubmit();
        }}
      />
      <EntityMatchModal
        open={Boolean(pendingSousClientMatch)}
        onClose={() => setPendingSousClientMatch(null)}
        title="Ce matricule existe déjà"
        message="Un sous-client avec ce matricule existe déjà pour ce client. Utiliser le sous-client existant ?"
        keepLabel="Utiliser l'existant"
        changeLabel="Utiliser l'existant"
        onKeep={() => { setSousClientId(pendingSousClientMatch.sous_client_id); setPendingSousClientMatch(null); actualSubmit(); }}
        onChange={() => { setSousClientId(pendingSousClientMatch.sous_client_id); setPendingSousClientMatch(null); actualSubmit(); }}
      />
    </div>
  );
}
