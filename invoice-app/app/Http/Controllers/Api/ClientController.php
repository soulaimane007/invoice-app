<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ClientRequest;
use App\Http\Resources\ClientResource;
use App\Models\Client;
use App\Services\ClientService;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function __construct(private readonly ClientService $clientService)
    {
    }

    public function index(Request $request)
    {
        $this->authorize('viewAny', Client::class);

        $sortable = ['name', 'created_at', 'updated_at'];
        $sortBy = in_array($request->query('sort_by'), $sortable, true) ? $request->query('sort_by') : 'name';
        $sortDir = $request->query('sort_dir') === 'desc' ? 'desc' : 'asc';

        $clients = Client::withStats()
            ->when($request->filled('search'), function ($query) use ($request) {
                $term = '%'.$request->query('search').'%';
                $query->where(function ($q) use ($term) {
                    $q->where('name', 'like', $term)
                        ->orWhere('email', 'like', $term)
                        ->orWhere('ice', 'like', $term)
                        ->orWhere('phone', 'like', $term);
                });
            })
            ->orderBy($sortBy, $sortDir)
            ->paginate(min($request->integer('per_page', 10), 100));

        return ClientResource::collection($clients);
    }

    public function autocomplete(Request $request)
    {
        $term = '%'.$request->query('q').'%';

        $clients = Client::query()
            ->where(function ($q) use ($term) {
                $q->where('name', 'like', $term)
                    ->orWhere('email', 'like', $term)
                    ->orWhere('ice', 'like', $term);
            })
            ->limit(10)
            ->get(['id', 'name', 'address', 'phone', 'email', 'ice']);

        return ClientResource::collection($clients);
    }

    public function store(ClientRequest $request)
    {
        $this->authorize('create', Client::class);

        $client = Client::create($request->validated());

        return new ClientResource($client);
    }

    public function show(Client $client)
    {
        $this->authorize('view', $client);

        return new ClientResource(
            $client->loadCount(['devis', 'factures'])->loadSum('factures as total_billed', 'total')
        );
    }

    public function update(ClientRequest $request, Client $client)
    {
        $this->authorize('update', $client);

        $client = $this->clientService->update($client, $request->validated());

        return new ClientResource($client);
    }
public function checkMatch(Request $request, ClientService $clientService): \Illuminate\Http\JsonResponse
    {
        $data = $request->validate(['name' => 'required|string', 'ice' => 'nullable|string']);

        return response()->json($clientService->checkManualEntryMatch($data['name'], $data['ice'] ?? null));
    }
    public function destroy(Request $request, Client $client)
    {
        $this->authorize('delete', $client);

        if (! $request->user()->hasPermission('can_delete_records')) {
            abort(403, "You don't have permission to delete clients.");
        }

        $client->delete();

        return response()->json(['message' => 'Client deleted.']);
    }
}