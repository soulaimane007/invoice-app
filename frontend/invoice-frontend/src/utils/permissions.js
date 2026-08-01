export function canEditDocument(user, document, { isDevis = false } = {}) {
  if (!user) return false;
  if (user.role !== 'user') return true;
  if (isDevis && document?.status === 'draft') return true;
  return Boolean(user.can_edit_after_sent);
}

export function canDeleteDocuments(user) {
  if (!user) return false;
  if (user.role !== 'user') return true;
  return Boolean(user.can_delete_documents);
}

export function canEditReference(user) {
  if (!user) return false;
  if (user.role !== 'user') return true;
  return Boolean(user.can_edit_reference);
}

export function canEditCompanySettings(user) {
  if (!user) return false;
  if (user.role !== 'user') return true;
  return Boolean(user.can_edit_company_settings);
}

export function canDeleteRecords(user) {
  if (!user) return false;
  if (user.role !== 'user') return true;
  return Boolean(user.can_delete_records);
}