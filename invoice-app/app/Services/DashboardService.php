<?php

namespace App\Services;

use App\Models\Article;
use App\Models\Client;
use App\Models\Devis;
use App\Models\Facture;
use Carbon\Carbon;

class DashboardService
{
    public function getStats(): array
    {
        $thisMonthCollected = $this->collectedForMonth(now());
        $lastMonthCollected = $this->collectedForMonth(now()->subMonthNoOverflow());

        return [
            'totals' => [
                'invoices' => Facture::count(),
                'quotations' => Devis::count(),
                'clients' => Client::count(),
                'articles' => Article::count(),
            ],
            'revenue' => [
                'total' => (float) Facture::sum('amount_paid'),
                'this_month' => $thisMonthCollected,
                'last_month' => $lastMonthCollected,
                'month_over_month_change' => $this->percentChange($lastMonthCollected, $thisMonthCollected),
                'outstanding' => (float) (Facture::where('payment_status', '!=', 'paid')
                    ->selectRaw('COALESCE(SUM(total - amount_paid), 0) as outstanding')
                    ->value('outstanding') ?? 0),
                'overdue' => (float) (Facture::where('payment_status', '!=', 'paid')
                    ->whereNotNull('due_date')
                    ->where('due_date', '<', now()->toDateString())
                    ->selectRaw('COALESCE(SUM(total - amount_paid), 0) as overdue')
                    ->value('overdue') ?? 0),
                'average_invoice_value' => (float) (Facture::avg('total') ?? 0),
                'average_days_to_payment' => $this->averageDaysToPayment(),
            ],
            'new_clients_this_month' => Client::whereYear('created_at', now()->year)
                ->whereMonth('created_at', now()->month)
                ->count(),
            'devis_funnel' => $this->devisFunnel(),
            'payment_status_breakdown' => $this->paymentStatusBreakdown(),
            'attention' => [
                'overdue_invoices' => $this->overdueInvoices(),
                'pending_quotations' => $this->pendingQuotations(),
                'low_stock_articles' => $this->lowStockArticles(),
            ],
            'top_clients' => $this->topClients(),
            'best_selling_articles' => $this->bestSellingArticles(),
            'dead_stock_articles' => $this->deadStockArticles(),
            'latest_invoices' => Facture::with('client')->latest('date')->limit(5)->get(),
            'latest_quotations' => Devis::with('client')->latest('date')->limit(5)->get(),
            'monthly_revenue' => $this->monthlyRevenue(12),
            'recent_activity' => $this->recentActivity(),
        ];
    }

    public function dailyRevenue(string $month): array
    {
        $start = Carbon::parse($month.'-01')->startOfMonth();
        $end = $start->copy()->endOfMonth();

        $invoicedRows = Facture::whereBetween('date', [$start->toDateString(), $end->toDateString()])
            ->selectRaw('date, SUM(total) as total')
            ->groupBy('date')
            ->pluck('total', 'date');

        // Sums actual amount_paid regardless of status, so a partially
        // paid invoice's real collected amount shows up here too —
        // this was the bug: it used to only count fully "paid" invoices.
        $collectedRows = Facture::whereBetween('date', [$start->toDateString(), $end->toDateString()])
            ->selectRaw('date, SUM(amount_paid) as total')
            ->groupBy('date')
            ->pluck('total', 'date');

        $days = [];
        for ($cursor = $start->copy(); $cursor->lte($end); $cursor->addDay()) {
            $key = $cursor->toDateString();
            $days[] = [
                'date' => $key,
                'day' => $cursor->day,
                'invoiced' => (float) ($invoicedRows[$key] ?? 0),
                'collected' => (float) ($collectedRows[$key] ?? 0),
            ];
        }

        return [
            'month' => $start->format('Y-m'),
            'days' => $days,
            'totals' => [
                'invoiced' => (float) $invoicedRows->sum(),
                'collected' => (float) $collectedRows->sum(),
            ],
        ];
    }

    private function collectedForMonth(Carbon $month): float
    {
        return (float) Facture::whereYear('date', $month->year)
            ->whereMonth('date', $month->month)
            ->sum('amount_paid');
    }

    private function percentChange(float $previous, float $current): float
    {
        if ($previous <= 0) {
            return $current > 0 ? 100.0 : 0.0;
        }

        return round((($current - $previous) / $previous) * 100, 1);
    }

    private function averageDaysToPayment(): ?float
    {
        $avg = Facture::whereNotNull('paid_at')
            ->selectRaw('AVG(DATEDIFF(paid_at, date)) as avg_days')
            ->value('avg_days');

        return $avg !== null ? round((float) $avg, 1) : null;
    }

    private function devisFunnel(): array
    {
        $counts = Devis::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        $draft = (int) ($counts['draft'] ?? 0);
        $sent = (int) ($counts['sent'] ?? 0);
        $accepted = (int) ($counts['accepted'] ?? 0);
        $rejected = (int) ($counts['rejected'] ?? 0);
        $sentOut = $sent + $accepted + $rejected;

        $convertedCount = Devis::whereNotNull('converted_to_facture_id')->count();

        $avgDaysToConvert = Devis::whereNotNull('converted_to_facture_id')
            ->join('facture', 'devis.converted_to_facture_id', '=', 'facture.id')
            ->selectRaw('AVG(DATEDIFF(facture.date, devis.date)) as avg_days')
            ->value('avg_days');

        return [
            'draft' => $draft,
            'sent' => $sent,
            'accepted' => $accepted,
            'rejected' => $rejected,
            'converted' => $convertedCount,
            'conversion_rate' => $sentOut > 0 ? round(($convertedCount / $sentOut) * 100, 1) : 0.0,
            'average_days_to_convert' => $avgDaysToConvert !== null ? round((float) $avgDaysToConvert, 1) : null,
        ];
    }

    private function paymentStatusBreakdown(): array
    {
        $rows = Facture::selectRaw('payment_status, COUNT(*) as count, SUM(total) as total')
            ->groupBy('payment_status')
            ->get()
            ->keyBy('payment_status');

        $result = [];
        foreach (['unpaid', 'partial', 'paid'] as $status) {
            $result[$status] = [
                'count' => (int) ($rows[$status]->count ?? 0),
                'total' => (float) ($rows[$status]->total ?? 0),
            ];
        }

        return $result;
    }

    private function overdueInvoices(int $limit = 5): array
    {
        return Facture::with('client')
            ->where('payment_status', '!=', 'paid')
            ->whereNotNull('due_date')
            ->where('due_date', '<', now()->toDateString())
            ->orderBy('due_date')
            ->limit($limit)
            ->get()
            ->map(fn ($f) => [
                'id' => $f->id,
                'reference' => $f->reference,
                'client_name' => $f->client_name,
                'total' => (float) $f->total,
                'remaining_balance' => (float) $f->remaining_balance,
                'due_date' => $f->due_date?->toDateString(),
                'days_overdue' => (int) $f->due_date->diffInDays(now()),
            ])
            ->all();
    }

    private function pendingQuotations(int $limit = 5): array
    {
        return Devis::with('client')
            ->where('status', 'sent')
            ->orderBy('date')
            ->limit($limit)
            ->get()
            ->map(fn ($d) => [
                'id' => $d->id,
                'reference' => $d->reference,
                'client_name' => $d->client_name,
                'total' => (float) $d->total,
                'date' => $d->date?->toDateString(),
                'days_pending' => (int) $d->date->diffInDays(now()),
            ])
            ->all();
    }

    private function lowStockArticles(int $limit = 5): array
    {
        return Article::where('is_active', true)
            ->whereColumn('quantity_in_stock', '<=', 'stock_alert_threshold')
            ->orderBy('quantity_in_stock')
            ->limit($limit)
            ->get(['id', 'name', 'reference', 'quantity_in_stock', 'stock_alert_threshold'])
            ->toArray();
    }

    private function topClients(int $limit = 5): array
    {
        return Client::query()
            ->select('clients.id', 'clients.name')
            ->selectRaw('SUM(facture.amount_paid) as total_revenue')
            ->selectRaw('COUNT(facture.id) as invoice_count')
            ->join('facture', 'facture.client_id', '=', 'clients.id')
            ->groupBy('clients.id', 'clients.name')
            ->havingRaw('SUM(facture.amount_paid) > 0')
            ->orderByDesc('total_revenue')
            ->limit($limit)
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'total_revenue' => (float) $c->total_revenue,
                'invoice_count' => (int) $c->invoice_count,
            ])
            ->all();
    }

    private function bestSellingArticles(int $limit = 5)
    {
        return Article::query()
            ->select('articles.id', 'articles.name', 'articles.reference')
            ->selectRaw('SUM(facture_lignes.quantity) as total_sold')
            ->join('facture_lignes', 'facture_lignes.article_id', '=', 'articles.id')
            ->groupBy('articles.id', 'articles.name', 'articles.reference')
            ->orderByDesc('total_sold')
            ->limit($limit)
            ->get();
    }

    private function deadStockArticles(int $limit = 5): array
    {
        return Article::where('is_active', true)
            ->whereDoesntHave('factureLignes')
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get(['id', 'name', 'reference', 'quantity_in_stock'])
            ->toArray();
    }

    private function monthlyRevenue(int $months = 12): array
    {
        $start = now()->subMonths($months - 1)->startOfMonth();

        $rows = Facture::where('date', '>=', $start)
            ->selectRaw('DATE_FORMAT(date, "%Y-%m") as month, SUM(amount_paid) as revenue')
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->keyBy('month');

        $result = [];
        for ($i = $months - 1; $i >= 0; $i--) {
            $key = now()->subMonths($i)->format('Y-m');
            $result[] = [
                'month' => $key,
                'revenue' => (float) ($rows[$key]->revenue ?? 0),
            ];
        }

        return $result;
    }

    private function recentActivity(int $limit = 10): array
    {
        $devisActivity = Devis::query()
            ->latest('updated_at')
            ->limit($limit)
            ->get()
            ->map(fn ($d) => [
                'type' => 'devis',
                'reference' => $d->reference,
                'status' => $d->status,
                'date' => $d->updated_at,
            ]);

        $factureActivity = Facture::query()
            ->latest('updated_at')
            ->limit($limit)
            ->get()
            ->map(fn ($f) => [
                'type' => 'facture',
                'reference' => $f->reference,
                'status' => $f->payment_status,
                'date' => $f->updated_at,
            ]);

        return $devisActivity->concat($factureActivity)
            ->sortByDesc('date')
            ->take($limit)
            ->values()
            ->all();
    }
}