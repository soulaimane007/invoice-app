<style>
    * { box-sizing: border-box; }
    body {
        font-family: 'DejaVu Sans', sans-serif;
        font-size: 11px;
        color: #1f2937;
        margin: 0;
    }
    .header-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .header-table td { vertical-align: top; }
    .company-name { font-size: 16px; font-weight: bold; color: #111827; }
    .company-details { font-size: 10px; color: #4b5563; line-height: 1.6; }
    .doc-title { font-size: 24px; font-weight: bold; color: #111827; text-align: right; }
    .doc-meta { font-size: 10px; color: #4b5563; text-align: right; line-height: 1.7; }
    .status-badge {
        display: inline-block;
        padding: 3px 10px;
        border-radius: 3px;
        font-size: 9px;
        font-weight: bold;
        text-transform: uppercase;
        background-color: #dbeafe;
        color: #1e40af;
    }
    .client-box {
        background-color: #f9fafb;
        border: 1px solid #e5e7eb;
        padding: 12px 15px;
        margin-bottom: 20px;
        width: 55%;
    }
    .client-box-label { font-size: 9px; text-transform: uppercase; color: #6b7280; margin-bottom: 4px; }
    .client-name { font-size: 13px; font-weight: bold; margin-bottom: 3px; }
    .lines-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .lines-table th {
        background-color: #111827;
        color: #ffffff;
        font-size: 9px;
        text-transform: uppercase;
        padding: 8px 6px;
        text-align: left;
    }
    .lines-table td {
        padding: 8px 6px;
        border-bottom: 1px solid #e5e7eb;
        font-size: 10px;
    }
    .text-right { text-align: right; }
    .totals-table { width: 45%; margin-left: 55%; border-collapse: collapse; }
    .totals-table td { padding: 5px 6px; font-size: 10px; }
    .totals-table .grand-total td {
        border-top: 2px solid #111827;
        font-size: 13px;
        font-weight: bold;
        padding-top: 8px;
    }
    .comment-box {
        margin-top: 25px;
        padding: 10px 15px;
        background-color: #f9fafb;
        border-left: 3px solid #9ca3af;
        font-size: 10px;
    }
    .footer {
        margin-top: 40px;
        padding-top: 10px;
        border-top: 1px solid #e5e7eb;
        font-size: 9px;
        color: #6b7280;
        text-align: center;
    }
</style>