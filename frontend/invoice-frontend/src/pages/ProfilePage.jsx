import { useEffect, useState } from 'react';
import { Save, Upload, KeyRound } from 'lucide-react';
import apiClient, { unwrap } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import ReferencePatternForm from '../components/settings/ReferencePatternForm';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { canEditCompanySettings } from '../utils/permissions';
function TextField({ label, ...props }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input {...props} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { showToast } = useToast();
const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const canEditCompany = canEditCompanySettings(user);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('');
  const [passwordErrors, setPasswordErrors] = useState({});
  const [savingPassword, setSavingPassword] = useState(false);

  const [company, setCompany] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [companyErrors, setCompanyErrors] = useState({});
  const [savingCompany, setSavingCompany] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/company-settings')
      .then((res) => setCompany(unwrap(res)))
      .catch(() => showToast('Could not load company settings.', 'error'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleCompanyChange(field, value) {
    setCompany((prev) => ({ ...prev, [field]: value }));
  }

  function handleLogoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setSavingPassword(true);
    setPasswordErrors({});
    try {
      await apiClient.put('/auth/password', {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: newPasswordConfirmation,
      });
      showToast('Password updated.');
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirmation('');
    } catch (err) {
      if (err.response?.status === 422) {
        setPasswordErrors(err.response.data.errors ?? {});
      } else {
        showToast('Could not update password.', 'error');
      }
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleCompanySubmit(e) {
    e.preventDefault();
    setSavingCompany(true);
    setCompanyErrors({});

    const formData = new FormData();
    formData.append('company_name', company.company_name ?? '');
    formData.append('address', company.address ?? '');
    formData.append('phone', company.phone ?? '');
    formData.append('email', company.email ?? '');
    formData.append('ice', company.ice ?? '');
    formData.append('default_currency', company.default_currency ?? 'MAD');
    formData.append('default_tva_rate', company.default_tva_rate ?? 20);
    formData.append('show_unit_on_documents', company.show_unit_on_documents ? '1' : '0');
    formData.append('invoice_footer_note', company.invoice_footer_note ?? '');
    if (logoFile) {
      formData.append('logo', logoFile);
    }

    ['devis_ref', 'facture_ref'].forEach((p) => {
      formData.append(`${p}_prefix`, company[`${p}_prefix`] ?? '');
      formData.append(`${p}_separator_1`, company[`${p}_separator_1`] ?? '');
      formData.append(`${p}_include_year`, company[`${p}_include_year`] ? '1' : '0');
      formData.append(`${p}_year_position`, company[`${p}_year_position`] ?? 'middle');
      formData.append(`${p}_number_digits`, company[`${p}_number_digits`] ?? 6);
      formData.append(`${p}_separator_2`, company[`${p}_separator_2`] ?? '');
      formData.append(`${p}_reset_yearly`, company[`${p}_reset_yearly`] ? '1' : '0');
      formData.append(`${p}_start_number`, company[`${p}_start_number`] ?? 1);
    });

    try {
      const res = await apiClient.post('/company-settings', formData);
      setCompany(unwrap(res));
      setLogoFile(null);
      setLogoPreview(null);
      showToast('Company settings saved.');
    } catch (err) {
      if (err.response?.status === 422) {
        setCompanyErrors(err.response.data.errors ?? {});
      } else {
        showToast('Could not save company settings.', 'error');
      }
    } finally {
      setSavingCompany(false);
    }
  }

  function fieldError(errors, field) {
    return errors[field]?.[0];
  }

  if (loading || !company) {
    return <p className="text-sm text-slate-500">Loading...</p>;
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
  <div>
        <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
        <p className="text-sm text-slate-500">Your account and the company identity printed on every PDF.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-1 text-sm font-semibold text-slate-900">{t('settings.language')}</h2>
        <p className="mb-4 text-xs text-slate-400">{t('settings.languageDescription')}</p>
        <div className="flex flex-wrap gap-2">
        {[
            { code: 'fr', native: 'Français' },
            { code: 'en', native: 'English' },
          ].map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLanguage(lang.code)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                language === lang.code
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {lang.native}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">My account</h2>
        <div className="mb-5 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-500">Name</p>
            <p className="font-medium text-slate-900">{user?.name}</p>
          </div>
          <div>
            <p className="text-slate-500">Email</p>
            <p className="font-medium text-slate-900">{user?.email}</p>
          </div>
        </div>

        <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-500">
          <KeyRound size={13} /> Change password
        </h3>
        <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3">
          <div>
            <TextField
              label="Current password" type="password" required
              value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
            />
            {fieldError(passwordErrors, 'current_password') && (
              <p className="mt-1 text-xs text-red-600">{fieldError(passwordErrors, 'current_password')}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="New password" type="password" required
              value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
            />
            <TextField
              label="Confirm new password" type="password" required
              value={newPasswordConfirmation} onChange={(e) => setNewPasswordConfirmation(e.target.value)}
            />
          </div>
          {fieldError(passwordErrors, 'password') && (
            <p className="text-xs text-red-600">{fieldError(passwordErrors, 'password')}</p>
          )}
          <button
            type="submit"
            disabled={savingPassword}
            className="mt-1 flex w-fit items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {savingPassword ? 'Saving...' : 'Update password'}
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Company info (shown on every PDF)</h2>
        {!canEditCompany && (
          <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            You don't have permission to change company settings — this section is shown for reference only.
          </p>
        )}
        <fieldset disabled={!canEditCompany} className="contents">
        <form onSubmit={handleCompanySubmit} className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
              {logoPreview || company.logo_url ? (
                <img src={logoPreview || company.logo_url} alt="Logo" className="h-full w-full object-contain" />
              ) : (
                <span className="text-xs text-slate-400">No logo</span>
              )}
            </div>
            <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <Upload size={15} />
              Upload logo
              <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
            </label>
          </div>

          <div>
            <TextField
              label="Company name *" required
              value={company.company_name ?? ''} onChange={(e) => handleCompanyChange('company_name', e.target.value)}
            />
            {fieldError(companyErrors, 'company_name') && <p className="mt-1 text-xs text-red-600">{fieldError(companyErrors, 'company_name')}</p>}
          </div>

          <TextField
            label="Address"
            value={company.address ?? ''} onChange={(e) => handleCompanyChange('address', e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Phone"
              value={company.phone ?? ''} onChange={(e) => handleCompanyChange('phone', e.target.value)}
            />
            <TextField
              label="ICE"
              value={company.ice ?? ''} onChange={(e) => handleCompanyChange('ice', e.target.value)}
            />
          </div>

          <TextField
            label="Email" type="email"
            value={company.email ?? ''} onChange={(e) => handleCompanyChange('email', e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Default currency"
              value={company.default_currency ?? 'MAD'} onChange={(e) => handleCompanyChange('default_currency', e.target.value)}
            />
            <TextField
              label="Default TVA rate (%)" type="number" step="0.01" min="0" max="100"
              value={company.default_tva_rate ?? 20} onChange={(e) => handleCompanyChange('default_tva_rate', e.target.value)}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={Boolean(company.show_unit_on_documents)}
              onChange={(e) => handleCompanyChange('show_unit_on_documents', e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            Show unit of measure on PDF documents
          </label>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">PDF footer note</label>
            <textarea
              rows={2}
              value={company.invoice_footer_note ?? ''}
              onChange={(e) => handleCompanyChange('invoice_footer_note', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <p className="mt-1 text-xs text-slate-400">e.g. payment terms or bank details — printed at the bottom of every quote and invoice.</p>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <h3 className="mb-1 text-xs font-semibold uppercase text-slate-500">Numérotation des références</h3>
            <p className="mb-3 text-xs text-slate-400">
              Configurez le format pour les devis et les factures. Les documents déjà créés gardent leur ancienne référence.
            </p>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ReferencePatternForm label="Devis" fieldPrefix="devis_ref" values={company} onChange={handleCompanyChange} />
              <ReferencePatternForm label="Facture" fieldPrefix="facture_ref" values={company} onChange={handleCompanyChange} />
            </div>
          </div>

          {canEditCompany && (
            <button
              type="submit"
              disabled={savingCompany}
              className="mt-1 flex w-fit items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              <Save size={15} />
              {savingCompany ? 'Saving...' : 'Save company info'}
            </button>
          )}
        </form>
        </fieldset>
      </div>
    </div>
  );
}