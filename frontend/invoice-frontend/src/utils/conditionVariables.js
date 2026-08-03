export const NUMERIC_CONDITION_VARS = [
  { key: 'total', label: 'Total TTC' },
  { key: 'subtotal', label: 'Sous-total' },
  { key: 'tax_total', label: 'TVA' },
  { key: 'amount_paid', label: 'Montant payé', factureOnly: true },
  { key: 'remaining_balance', label: 'Reste à payer', factureOnly: true },
  { key: 'line_quantity', label: 'Quantité (ligne)' },
  { key: 'line_unit_price', label: 'Prix unitaire (ligne)' },
  { key: 'line_tva_rate', label: 'Taux TVA (ligne)' },
  { key: 'line_total_ht', label: 'Total HT (ligne)' },
  { key: 'line_unit_price_ttc', label: 'Prix unitaire TTC (ligne)' },
  { key: 'line_total_ttc', label: 'Total TTC (ligne)' },
];

export const CATEGORICAL_CONDITION_VARS = [
  {
    key: 'status', label: 'Statut (devis)', devisOnly: true,
    options: [
      { value: 'draft', label: 'Brouillon' }, { value: 'sent', label: 'Envoyé' },
      { value: 'accepted', label: 'Accepté' }, { value: 'rejected', label: 'Refusé' },
    ],
  },
  {
    key: 'payment_status', label: 'Statut de paiement (facture)', factureOnly: true,
    options: [
      { value: 'unpaid', label: 'Impayé' }, { value: 'partial', label: 'Partiel' }, { value: 'paid', label: 'Payé' },
    ],
  },
  { key: 'line_unit', label: 'Unité (ligne)', dynamicOptions: true },
];