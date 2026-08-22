<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreLeadRequest;
use App\Http\Resources\LeadResource;
use App\Models\Lead;
use App\Models\Notification;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class LeadController extends Controller
{
    public function store(StoreLeadRequest $request): LeadResource
    {
        $lead = Lead::create([
            ...$request->validated(),
            'customer_id' => $request->user()?->id,
            'status' => 'new',
        ]);

        $recipientIds = Role::whereIn('name', ['admin', 'sales'])->first()?->users()->pluck('id') ?? collect();
        foreach ($recipientIds as $recipientId) {
            Notification::create([
                'user_id' => $recipientId,
                'title' => 'Lead baru masuk',
                'message' => "Lead dari {$lead->name} perlu ditindaklanjuti.",
                'type' => 'lead',
            ]);
        }

        return new LeadResource($lead->load('truck'));
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();

        if ($user->isAdmin()) {
            $query = Lead::query();
        } elseif ($user->isSales()) {
            $query = Lead::where('sales_id', $user->id)->orWhereNull('sales_id');
        } else {
            abort(403, 'Anda tidak berhak melihat data lead.');
        }

        $query
            ->with('truck')
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')->toString()))
            ->orderByDesc('created_at');

        return LeadResource::collection($query->paginate($request->integer('per_page', 20))->withQueryString());
    }

    public function show(Request $request, Lead $lead): LeadResource
    {
        $this->authorizeView($request, $lead);

        return new LeadResource($lead->load(['truck', 'sales']));
    }

    public function update(Request $request, Lead $lead): LeadResource
    {
        $user = $request->user();

        if (! $user->isAdmin() && ! $user->isSales()) {
            abort(403, 'Anda tidak berhak mengubah lead.');
        }

        $validated = $request->validate([
            'status' => ['nullable', 'string', 'max:50', 'in:new,contacted,negotiating,won,lost'],
            'sales_id' => ['nullable', 'integer', 'exists:users,id'],
            'notes' => ['nullable', 'string'],
        ]);

        // Sales can only manage leads assigned to them (or unassigned).
        if ($user->isSales() && $lead->sales_id !== $user->id && ! empty($validated['sales_id']) && $validated['sales_id'] !== $user->id) {
            abort(403, 'Lead ini tidak ditugaskan kepada Anda.');
        }

        if ($user->isSales()) {
            $lead->sales_id = $lead->sales_id ?? $user->id;
        }

        $lead->update($validated);

        return new LeadResource($lead->load(['truck', 'sales']));
    }

    public function destroy(Request $request, Lead $lead): JsonResponse
    {
        if (! $request->user()->isAdmin()) {
            abort(403, 'Hanya admin yang dapat menghapus lead.');
        }

        $lead->delete();

        return response()->json([
            'success' => true,
            'message' => 'Lead dihapus.',
        ]);
    }

    private function authorizeView(Request $request, Lead $lead): void
    {
        $user = $request->user();

        if ($user->isAdmin()) {
            return;
        }

        if ($user->isSales() && ($lead->sales_id === $user->id || $lead->sales_id === null)) {
            return;
        }

        if ($user->id === $lead->customer_id) {
            return;
        }

        abort(403, 'Anda tidak berhak melihat lead ini.');
    }
}
