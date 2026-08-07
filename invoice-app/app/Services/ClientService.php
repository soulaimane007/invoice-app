<?php

namespace App\Services;

use App\Models\Client;
use App\Models\Devis;
use App\Models\Facture;

class ClientService
{
    public function findOrCreate(array $details): Client
    {
        if (! empty($details['id'])) {
            $client = Client::findOrFail($details['id']);

            $client->fill(array_filter([
                'name' => $details['name'] ?? null,
                'address' => $details['address'] ?? null,
                'phone' => $details['phone'] ?? null,
                'email' => $details['email'] ?? null,
                'ice' => $details['ice'] ?? null,
            ], fn ($value) => $value !== null))->save();

            return $client;
        }

        return Client::create([
            'name' => $details['name'],
            'address' => $details['address'] ?? null,
            'phone' => $details['phone'] ?? null,
            'email' => $details['email'] ?? null,
            'ice' => $details['ice'] ?? null,
        ]);
    }

    public function checkManualEntryMatch(string $name, ?string $ice): array
    {
        $name = trim($name);
        $ice = ($ice !== null && trim($ice) !== '') ? trim($ice) : null;

        if ($ice !== null) {
            $iceMatch = Client::whereRaw('LOWER(ice) = ?', [mb_strtolower($ice)])->first();
            if ($iceMatch) {
                if (mb_strtolower($iceMatch->name) === mb_strtolower($name)) {
                    return ['type' => 'exact', 'client_id' => $iceMatch->id];
                }

                return [
                    'type' => 'ice_match_name_differs',
                    'client_id' => $iceMatch->id,
                    'existing_name' => $iceMatch->name,
                    'submitted_name' => $name,
                ];
            }
        }

        $nameMatch = Client::whereRaw('LOWER(name) = ?', [mb_strtolower($name)])->first();
        if ($nameMatch) {
            $existingIce = ($nameMatch->ice && trim($nameMatch->ice) !== '') ? trim($nameMatch->ice) : null;
            if ($existingIce === null || $ice === null || mb_strtolower($existingIce) === mb_strtolower($ice)) {
                return ['type' => 'exact', 'client_id' => $nameMatch->id];
            }

            return [
                'type' => 'name_match_ice_differs',
                'client_id' => $nameMatch->id,
                'existing_ice' => $nameMatch->ice,
                'submitted_ice' => $ice,
            ];
        }

        return ['type' => 'no_match'];
    }

    public function update(Client $client, array $data): Client
    {
        $client->update($data);

        $snapshot = [
            'client_name' => $client->name,
            'client_address' => $client->address,
            'client_phone' => $client->phone,
            'client_email' => $client->email,
            'client_ice' => $client->ice,
        ];

        Devis::where('client_id', $client->id)->update($snapshot);
        Facture::where('client_id', $client->id)->update($snapshot);

        return $client;
    }
}