// Every key here must match TemplateRendererService::buildScalarValues() /
// resolveLineValue() in the backend exactly, or that variable silently
// renders as empty text at PDF time.

const COMPANY = {
  label: 'Entreprise',
  variables: [
    { key: 'company_name', label: "Nom de l'entreprise" },
    { key: 'company_address', label: "Adresse de l'entreprise" },
    { key: 'company_phone', label: "Téléphone de l'entreprise" },
    { key: 'company_email', label: "Email de l'entreprise" },
    { key: 'company_ice', label: "ICE de l'entreprise" },
    { key: 'company_logo', label: "Logo de l'entreprise", type: 'image' },
    { key: 'footer_note', label: 'Note de bas de page' },
  ],
};

const CLIENT = {
  label: 'Client',
  variables: [
    { key: 'client_name', label: 'Nom du client' },
    { key: 'client_address', label: 'Adresse du client' },
    { key: 'client_phone', label: 'Téléphone du client' },
    { key: 'client_email', label: 'Email du client' },
    { key: 'client_ice', label: 'ICE du client' },
    { key: 'sous_client_name', label: 'Nom du sous-client' },
    { key: 'sous_client_reference', label: 'Matricule du sous-client' },
  ],
};

function documentGroup(documentType) {
  const base = [
    { key: 'reference', label: 'Référence' },
    { key: 'date', label: 'Date' },
    { key: 'comment', label: 'Commentaire' },
  ];
  if (documentType === 'devis') {
    return { label: 'Devis', variables: [...base, { key: 'status', label: 'Statut' }] };
  }
  return {
    label: 'Facture',
    variables: [
      ...base,
      { key: 'due_date', label: "Date d'échéance" },
      { key: 'payment_status', label: 'Statut de paiement' },
      { key: 'amount_paid', label: 'Montant payé' },
      { key: 'remaining_balance', label: 'Reste à payer' },
    ],
  };
}

function linesGroup(documentType) {
  const base = [
    { key: 'line_description', label: 'Description' },
    { key: 'line_quantity', label: 'Quantité' },
    { key: 'line_unit', label: 'Unité' },
    { key: 'line_unit_price', label: 'Prix unitaire' },
    { key: 'line_tva_rate', label: 'Taux TVA' },
    { key: 'line_total_ht', label: 'Total HT' },
    { key: 'line_unit_price_ttc', label: 'Prix unitaire TTC' },
    { key: 'line_total_ttc', label: 'Total TTC' },
  ];
  if (documentType === 'facture') {
    base.push({ key: 'line_matricules', label: 'Matricules' });
  }
  return { label: 'Lignes (à placer dans le tableau)', variables: base };
}

const TOTALS = {
  label: 'Totaux',
  variables: [
    { key: 'subtotal', label: 'Sous-total' },
    { key: 'tax_total', label: 'TVA' },
    { key: 'total', label: 'Total TTC' },
  ],
};

export function getTemplateVariables(documentType) {
  return [COMPANY, CLIENT, documentGroup(documentType), linesGroup(documentType), TOTALS];
}