<?php

namespace App\Services;

use App\Models\CompanySetting;
use App\Models\Devis;
use App\Models\Facture;
use App\Models\ReferenceCounter;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ReferenceGeneratorService
{
    public function next(string $documentType): array
    {
        $organizationId = Auth::user()->organizationId();
        $config = $this->configFor($documentType);
        $year = now()->year;
        $yearKey = $config['reset_yearly'] ? $year : 0;

        return DB::transaction(function () use ($organizationId, $documentType, $yearKey, $config, $year) {
            $counter = ReferenceCounter::where('organization_id', $organizationId)
                ->where('document_type', $documentType)
                ->where('year', $yearKey)
                ->lockForUpdate()
                ->first();

            if (! $counter) {
                $counter = $this->createCounter($organizationId, $documentType, $yearKey, $config['start_number'] - 1);
            }

            do {
                $nextNumber = $counter->last_number + 1;
                $reference = $this->build($config, $nextNumber, $year);
                $counter->update(['last_number' => $nextNumber]);
            } while ($this->exists($documentType, $reference));

            return ['reference' => $reference, 'number' => $nextNumber];
        });
    }

    public function peekNext(string $documentType): array
    {
        $organizationId = Auth::user()->organizationId();
        $config = $this->configFor($documentType);
        $year = now()->year;
        $yearKey = $config['reset_yearly'] ? $year : 0;

        $counter = ReferenceCounter::where('organization_id', $organizationId)
            ->where('document_type', $documentType)
            ->where('year', $yearKey)
            ->first();

        $number = $counter ? $counter->last_number + 1 : $config['start_number'];

        return ['reference' => $this->build($config, $number, $year), 'number' => $number];
    }

    public function buildFromNumber(string $documentType, int $number): string
    {
        $config = $this->configFor($documentType);
        return $this->build($config, $number, now()->year);
    }

    public function ensureCounterAtLeast(string $documentType, int $number): void
    {
        $organizationId = Auth::user()->organizationId();
        $config = $this->configFor($documentType);
        $year = now()->year;
        $yearKey = $config['reset_yearly'] ? $year : 0;

        DB::transaction(function () use ($organizationId, $documentType, $yearKey, $number) {
            $counter = ReferenceCounter::where('organization_id', $organizationId)
                ->where('document_type', $documentType)
                ->where('year', $yearKey)
                ->lockForUpdate()
                ->first();

            if (! $counter) {
                $this->createCounter($organizationId, $documentType, $yearKey, $number);
                return;
            }

            if ($number > $counter->last_number) {
                $counter->update(['last_number' => $number]);
            }
        });
    }

    public function setNextNumber(string $documentType, int $number): array
    {
        $organizationId = Auth::user()->organizationId();
        $config = $this->configFor($documentType);
        $year = now()->year;
        $yearKey = $config['reset_yearly'] ? $year : 0;

        return DB::transaction(function () use ($organizationId, $documentType, $yearKey, $number) {
            $counter = ReferenceCounter::where('organization_id', $organizationId)
                ->where('document_type', $documentType)
                ->where('year', $yearKey)
                ->lockForUpdate()
                ->first();

            if (! $counter) {
                $this->createCounter($organizationId, $documentType, $yearKey, $number - 1);
            } else {
                $counter->update(['last_number' => $number - 1]);
            }

            return $this->peekNext($documentType);
        });
    }

    public function exists(string $documentType, string $reference, ?int $excludeId = null): bool
    {
        $model = $documentType === 'devis' ? Devis::class : Facture::class;

        return $model::where('reference', $reference)
            ->when($excludeId, fn ($q) => $q->where('id', '!=', $excludeId))
            ->exists();
    }

    private function createCounter(int $organizationId, string $documentType, int $yearKey, int $lastNumber): ReferenceCounter
    {
        try {
            return ReferenceCounter::create([
                'organization_id' => $organizationId,
                'document_type' => $documentType,
                'year' => $yearKey,
                'last_number' => $lastNumber,
            ]);
        } catch (QueryException $e) {
            return ReferenceCounter::where('organization_id', $organizationId)
                ->where('document_type', $documentType)
                ->where('year', $yearKey)
                ->lockForUpdate()
                ->firstOrFail();
        }
    }

    private function configFor(string $documentType): array
    {
        $company = CompanySetting::current();
        $p = "{$documentType}_ref_";

        return [
            'prefix' => $company->{$p.'prefix'},
            'separator_1' => $company->{$p.'separator_1'} ?? '',
            'include_year' => (bool) $company->{$p.'include_year'},
            'year_position' => $company->{$p.'year_position'} ?? 'middle',
            'number_digits' => (int) ($company->{$p.'number_digits'} ?: 6),
            'separator_2' => $company->{$p.'separator_2'} ?? '',
            'reset_yearly' => (bool) $company->{$p.'reset_yearly'},
            'start_number' => (int) ($company->{$p.'start_number'} ?: 1),
        ];
    }

    private function build(array $config, int $number, int $year): string
    {
        $hasPrefix = filled($config['prefix']);
        $paddedNumber = str_pad((string) $number, $config['number_digits'], '0', STR_PAD_LEFT);

        if (! $config['include_year']) {
            return $hasPrefix
                ? $config['prefix'].$config['separator_1'].$paddedNumber
                : $paddedNumber;
        }

        if ($hasPrefix) {
            return match ($config['year_position']) {
                'start' => $year.$config['separator_1'].$config['prefix'].$config['separator_2'].$paddedNumber,
                'end' => $config['prefix'].$config['separator_1'].$paddedNumber.$config['separator_2'].$year,
                default => $config['prefix'].$config['separator_1'].$year.$config['separator_2'].$paddedNumber,
            };
        }

        return match ($config['year_position']) {
            'end' => $paddedNumber.$config['separator_1'].$year,
            default => $year.$config['separator_1'].$paddedNumber,
        };
    }
}