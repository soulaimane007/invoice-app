<?php

namespace App\Services;

use App\Models\SousClient;
use RuntimeException;

class SousClientService
{
    public function findOrCreate(int $clientId, ?array $details): ?SousClient
    {
        if (empty($details) || (empty($details['id']) && empty($details['name']))) {
            return null;
        }

        if (! empty($details['id'])) {
            $sousClient = SousClient::where('id', $details['id'])
                ->where('client_id', $clientId)
                ->first();

            if (! $sousClient) {
                throw new RuntimeException('This sous-client does not belong to the selected client.');
            }

            if (array_key_exists('reference', $details)) {
                $sousClient->update(['reference' => $details['reference']]);
            }

            return $sousClient;
        }

        return SousClient::create([
            'client_id' => $clientId,
            'name' => $details['name'],
            'reference' => $details['reference'] ?? null,
        ]);
    }

    // ASSUMPTION: matricule uniqueness is scoped per-client, matching how
    // findOrCreate above already scopes its lookups — flag if that's wrong.
    public function checkManualEntryMatch(int $clientId, ?string $matricule): array
    {
        $matricule = ($matricule !== null && trim($matricule) !== '') ? trim($matricule) : null;

        if ($matricule !== null) {
            $match = SousClient::where('client_id', $clientId)
                ->whereRaw('LOWER(reference) = ?', [mb_strtolower($matricule)])
                ->first();

            if ($match) {
                return ['type' => 'matricule_match', 'sous_client_id' => $match->id];
            }
        }

        return ['type' => 'create'];
    }
}