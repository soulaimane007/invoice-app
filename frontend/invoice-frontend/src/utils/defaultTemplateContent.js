export function getDefaultTemplateContent(documentType) {
  return documentType === 'facture' ? FACTURE_DEFAULT : DEVIS_DEFAULT;
}

const DEVIS_DEFAULT = `
<table>
  <tbody>
    <tr>
      <td>
        <img data-variable-image="company_logo" style="width:140px;" />
        <p><strong><span data-variable="company_name">Nom de l'entreprise</span></strong></p>
        <p><span data-variable="company_address">Adresse de l'entreprise</span></p>
        <p>Tél : <span data-variable="company_phone">Téléphone de l'entreprise</span></p>
        <p>Email : <span data-variable="company_email">Email de l'entreprise</span></p>
        <p>ICE : <span data-variable="company_ice">ICE de l'entreprise</span></p>
      </td>
      <td>
        <h2>DEVIS</h2>
        <p>N° <span data-variable="reference">Référence</span></p>
        <p>Date : <span data-variable="date">Date</span></p>
        <p><strong><span data-variable="status">Statut</span></strong></p>
      </td>
    </tr>
  </tbody>
</table>
<table>
  <tbody>
    <tr>
      <td>
        <p><strong>CLIENT</strong></p>
        <p><span data-variable="client_name">Nom du client</span></p>
        <p><em><span data-variable="sous_client_name">Nom du sous-client</span> — <span data-variable="sous_client_reference">Matricule du sous-client</span></em></p>
        <p><span data-variable="client_address">Adresse du client</span></p>
        <p><span data-variable="client_phone">Téléphone du client</span> — <span data-variable="client_email">Email du client</span></p>
        <p>ICE : <span data-variable="client_ice">ICE du client</span></p>
      </td>
    </tr>
  </tbody>
</table>
<table class="tpl-bordered">
  <tbody>
    <tr>
      <th><p>Description</p></th><th><p>Qté</p></th><th><p>Unité</p></th>
      <th><p>Prix U.</p></th><th><p>TVA</p></th><th><p>Total HT</p></th>
    </tr>
    <tr>
      <td><p><span data-variable="line_description">Description</span></p></td>
      <td><p><span data-variable="line_quantity">Quantité</span></p></td>
      <td><p><span data-variable="line_unit">Unité</span></p></td>
      <td><p><span data-variable="line_unit_price">Prix unitaire</span></p></td>
      <td><p><span data-variable="line_tva_rate">TVA</span></p></td>
      <td><p><span data-variable="line_total_ht">Total HT</span></p></td>
    </tr>
  </tbody>
</table>
<table>
  <tbody>
    <tr><td>Sous-total</td><td style="text-align:right"><span data-variable="subtotal">Sous-total</span></td></tr>
    <tr><td>TVA</td><td style="text-align:right"><span data-variable="tax_total">TVA</span></td></tr>
    <tr><td><strong>Total TTC</strong></td><td style="text-align:right"><strong><span data-variable="total">Total TTC</span></strong></td></tr>
  </tbody>
</table>
<p><span data-variable="comment">Commentaire</span></p>
<p><em><span data-variable="footer_note">Note de bas de page</span></em></p>
`;

const FACTURE_DEFAULT = `
<table>
  <tbody>
    <tr>
      <td>
        <img data-variable-image="company_logo" style="width:140px;" />
        <p><strong><span data-variable="company_name">Nom de l'entreprise</span></strong></p>
        <p><span data-variable="company_address">Adresse de l'entreprise</span></p>
        <p>Tél : <span data-variable="company_phone">Téléphone de l'entreprise</span></p>
        <p>Email : <span data-variable="company_email">Email de l'entreprise</span></p>
        <p>ICE : <span data-variable="company_ice">ICE de l'entreprise</span></p>
      </td>
      <td>
        <h2>FACTURE</h2>
        <p>N° <span data-variable="reference">Référence</span></p>
        <p>Date : <span data-variable="date">Date</span></p>
        <p>Échéance : <span data-variable="due_date">Date d'échéance</span></p>
        <p><strong><span data-variable="payment_status">Statut de paiement</span></strong></p>
      </td>
    </tr>
  </tbody>
</table>
<table>
  <tbody>
    <tr>
      <td>
        <p><strong>CLIENT</strong></p>
        <p><span data-variable="client_name">Nom du client</span></p>
        <p><em><span data-variable="sous_client_name">Nom du sous-client</span> — <span data-variable="sous_client_reference">Matricule du sous-client</span></em></p>
        <p><span data-variable="client_address">Adresse du client</span></p>
        <p><span data-variable="client_phone">Téléphone du client</span> — <span data-variable="client_email">Email du client</span></p>
        <p>ICE : <span data-variable="client_ice">ICE du client</span></p>
      </td>
    </tr>
  </tbody>
</table>
<table class="tpl-bordered">
  <tbody>
    <tr>
      <th><p>Description</p></th><th><p>Qté</p></th><th><p>Unité</p></th>
      <th><p>Prix U.</p></th><th><p>TVA</p></th><th><p>Total HT</p></th>
    </tr>
    <tr>
      <td><p><span data-variable="line_description">Description</span></p></td>
      <td><p><span data-variable="line_quantity">Quantité</span></p></td>
      <td><p><span data-variable="line_unit">Unité</span></p></td>
      <td><p><span data-variable="line_unit_price">Prix unitaire</span></p></td>
      <td><p><span data-variable="line_tva_rate">TVA</span></p></td>
      <td><p><span data-variable="line_total_ht">Total HT</span></p></td>
    </tr>
  </tbody>
</table>
<table>
  <tbody>
    <tr><td>Sous-total</td><td style="text-align:right"><span data-variable="subtotal">Sous-total</span></td></tr>
    <tr><td>TVA</td><td style="text-align:right"><span data-variable="tax_total">TVA</span></td></tr>
    <tr><td><strong>Total TTC</strong></td><td style="text-align:right"><strong><span data-variable="total">Total TTC</span></strong></td></tr>
    <tr><td>Montant payé</td><td style="text-align:right"><span data-variable="amount_paid">Montant payé</span></td></tr>
    <tr><td><strong>Reste à payer</strong></td><td style="text-align:right"><strong><span data-variable="remaining_balance">Reste à payer</span></strong></td></tr>
  </tbody>
</table>
<p><span data-variable="comment">Commentaire</span></p>
<p><em><span data-variable="footer_note">Note de bas de page</span></em></p>
`;