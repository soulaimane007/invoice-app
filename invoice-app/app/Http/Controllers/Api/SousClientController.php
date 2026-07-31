<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SousClientRequest;
use App\Http\Resources\SousClientResource;
use App\Models\Client;
use App\Models\SousClient;

class SousClientController extends Controller
{
    public function index(Client $client)
    {
        $this->authorize('view', $client);

        $sousClients = $client->sousClients()->orderBy('name')->get();

        return SousClientResource::collection($sousClients);
    }

    public function store(SousClientRequest $request, Client $client)
    {
        $this->authorize('update', $client);

        $sousClient = $client->sousClients()->create($request->validated());

        return new SousClientResource($sousClient);
    }

    public function update(SousClientRequest $request, SousClient $sousClient)
    {
        $this->authorize('update', $sousClient->client);

        $sousClient->update($request->validated());

        return new SousClientResource($sousClient);
    }

    public function destroy(SousClient $sousClient)
    {
        $this->authorize('update', $sousClient->client);

        $sousClient->delete();

        return response()->json(['message' => 'Sous-client deleted.']);
    }
}