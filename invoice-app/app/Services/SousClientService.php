<?php

namespace App\Services;

use App\Models\SousClient;
use RuntimeException;

class SousClientService
{
    /**
     * Mirrors ClientService::findOrCreate. If `id` is present, reuse
     * that sous-client (confirming it actually belongs to $clientId)
     * and let an edited matricule patch its stored reference. If only
     * a name is given, create a new sous-client under that client.
     * Returns null when no sous-client info was submitted at all.
     */
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
}