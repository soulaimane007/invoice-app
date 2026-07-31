<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    @include('pdf.partials.styles')
</head>
<body>

    <table class="header-table">
        <tr>
            <td style="width: 55%;">
               @if($company->logo_full_path)
                    <img src="{{ $company->logo_full_path }}" style="max-height: 60px; margin-bottom: 8px;">
                @endif
                <div class="company-name">{{ $company->company_name }}</div>
                <div class="company-details">
                    @if($company->address){{ $company->address }}<br>@endif
                    @if($company->phone)Tel : {{ $company->phone }}<br>@endif
                    @if($company->email){{ $company->email }}<br>@endif
                    @if($company->ice)ICE : {{ $company->ice }}@endif
                </div>
            </td>
            <td style="width: 45%;">
                <div class="doc-title">FACTURE</div>
                <div class="doc-meta">
                    N&#176; {{ $facture->reference }}<br>
                    Date : {{ $facture->date->format('d/m/Y') }}<br>
                    @if($facture->due_date)
                        Echeance : {{ $facture->due_date->format('d/m/Y') }}<br>
                    @endif
                    <span class="status-badge">{{ strtoupper($facture->payment_status) }}</span>
                </div>
            </td>
        </tr>
    </table>

    <div class="client-box">
        <div class="client-box-label">Client</div>
        <div class="client-name">{{ $facture->client_name }}</div>
        @if($facture->sous_client_name)<div style="font-style: italic; color: #4b5563;">{{ $facture->sous_client_name }}{{ $facture->sous_client_reference ? ' — '.$facture->sous_client_reference : '' }}</div>@endif
        @if($facture->client_address)<div>{{ $facture->client_address }}</div>@endif
        @if($facture->client_phone)<div>Tel : {{ $facture->client_phone }}</div>@endif
        @if($facture->client_email)<div>{{ $facture->client_email }}</div>@endif
        @if($facture->client_ice)<div>ICE : {{ $facture->client_ice }}</div>@endif
    </div>

    <table class="lines-table">
        <thead>
            <tr>
                <th style="width: 40%;">Description</th>
                <th class="text-right" style="width: 10%;">Qte</th>
                <th class="text-right" style="width: 15%;">P.U.</th>
                <th class="text-right" style="width: 10%;">Remise</th>
                <th class="text-right" style="width: 10%;">TVA</th>
                <th class="text-right" style="width: 15%;">Total HT</th>
            </tr>
        </thead>
        <tbody>
            @foreach($facture->lignes as $ligne)
                <tr>
                    <td>{{ $ligne->description }}</td>
                    <td class="text-right">{{ number_format($ligne->quantity, 2) }}</td>
                    <td class="text-right">{{ number_format($ligne->unit_price, 2) }}</td>
                    <td class="text-right">{{ $ligne->discount_percent > 0 ? number_format($ligne->discount_percent, 1).'%' : '-' }}</td>
                    <td class="text-right">{{ number_format($ligne->tva_rate, 1) }}%</td>
                    <td class="text-right">{{ number_format($ligne->total_ht, 2) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals-table">
        <tr>
            <td>Sous-total</td>
            <td class="text-right">{{ number_format($facture->subtotal, 2) }} {{ $facture->currency }}</td>
        </tr>
        @if($facture->discount_total > 0)
        <tr>
            <td>Remise</td>
            <td class="text-right">-{{ number_format($facture->discount_total, 2) }} {{ $facture->currency }}</td>
        </tr>
        @endif
        <tr>
            <td>TVA</td>
            <td class="text-right">{{ number_format($facture->tax_total, 2) }} {{ $facture->currency }}</td>
        </tr>
        <tr class="grand-total">
            <td>Total TTC</td>
            <td class="text-right">{{ number_format($facture->total, 2) }} {{ $facture->currency }}</td>
        </tr>
        <tr>
            <td>Montant paye</td>
            <td class="text-right">{{ number_format($facture->amount_paid, 2) }} {{ $facture->currency }}</td>
        </tr>
        <tr>
            <td><strong>Reste a payer</strong></td>
            <td class="text-right"><strong>{{ number_format($facture->remaining_balance, 2) }} {{ $facture->currency }}</strong></td>
        </tr>
    </table>

    @if($facture->comment)
        <div class="comment-box">
            <strong>Commentaire :</strong><br>
            {{ $facture->comment }}
        </div>
    @endif

    @if($company->invoice_footer_note)
        <div class="footer">{{ $company->invoice_footer_note }}</div>
    @endif

</body>
</html>