<?php

namespace App\Services;

use App\Models\Client;
use App\Models\Devis;
use App\Models\Facture;

class ClientService
{
    /**
     * Used when creating/editing a devis or facture: if `id` is present
     * and matches an existing client, reuse it (and let any edited
     * fields from the form patch the client record too). Otherwise
     * create a brand new client from whatever details were typed in.
     */
    public function findOrCreate(array $details): Client
    {
        if (! empty($details['id'])) {
            $client = Client::findOrFail($details['id']);

            $client->fill(array_filter([
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

    /**
     * Updates the client, then propagates name/address/phone/email/ICE
     * onto every devis and facture already linked to it. This is a
     * deliberate choice: historical documents show the client's current
     * details, not a frozen snapshot from when each one was issued.
     */
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