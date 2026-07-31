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
                <div class="doc-title">DEVIS</div>
                <div class="doc-meta">
                    N&#176; {{ $devis->reference }}<br>
                    Date : {{ $devis->date->format('d/m/Y') }}<br>
                    <span class="status-badge">{{ strtoupper($devis->status) }}</span>
                </div>
            </td>
        </tr>
    </table>

    <div class="client-box">
        <div class="client-box-label">Client</div>
<div class="client-name">{{ $devis->client_name }}</div>
@if($devis->sous_client_name)<div style="font-style: italic; color: #4b5563;">{{ $devis->sous_client_name }}{{ $devis->sous_client_reference ? ' — '.$devis->sous_client_reference : '' }}</div>@endif        @if($devis->client_phone)<div>Tel : {{ $devis->client_phone }}</div>@endif
        @if($devis->client_email)<div>{{ $devis->client_email }}</div>@endif
        @if($devis->client_ice)<div>ICE : {{ $devis->client_ice }}</div>@endif
    </div>

    <table class="lines-table">
        <thead>
            <tr>
                <th style="width: {{ $company->show_unit_on_documents ? '30' : '35' }}%;">Description</th>
                <th class="text-right" style="width: 10%;">Qte</th>
                @if($company->show_unit_on_documents)
                    <th style="width: 10%;">Unité</th>
                @endif
                <th class="text-right" style="width: 15%;">P.U.</th>
                <th class="text-right" style="width: 10%;">TVA</th>
                <th class="text-right" style="width: 15%;">Total HT</th>
            </tr>
        </thead>
        <tbody>
            @foreach($devis->lignes as $ligne)
                <tr>
                    <td>{{ $ligne->description }}</td>
                    <td class="text-right">{{ number_format($ligne->quantity, 2) }}</td>
                    @if($company->show_unit_on_documents)
                        <td>{{ $ligne->unit }}</td>
                    @endif
                    <td class="text-right">{{ number_format($ligne->unit_price, 2) }}</td>
                    <td class="text-right">{{ number_format($ligne->tva_rate, 1) }}%</td>
                    <td class="text-right">{{ number_format($ligne->total_ht, 2) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals-table">
        <tr>
            <td>Sous-total</td>
            <td class="text-right">{{ number_format($devis->subtotal, 2) }} {{ $devis->currency }}</td>
        </tr>
        
        <tr>
            <td>TVA</td>
            <td class="text-right">{{ number_format($devis->tax_total, 2) }} {{ $devis->currency }}</td>
        </tr>
        <tr class="grand-total">
            <td>Total TTC</td>
            <td class="text-right">{{ number_format($devis->total, 2) }} {{ $devis->currency }}</td>
        </tr>
    </table>

    @if($devis->comment)
        <div class="comment-box">
            <strong>Commentaire :</strong><br>
            {{ $devis->comment }}
        </div>
    @endif

    @if($company->invoice_footer_note)
        <div class="footer">{{ $company->invoice_footer_note }}</div>
    @endif

</body>
</html>