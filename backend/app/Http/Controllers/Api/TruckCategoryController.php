<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TruckCategoryResource;
use App\Models\TruckCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TruckCategoryController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return TruckCategoryResource::collection(TruckCategory::orderBy('name')->get());
    }

    public function store(Request $request): TruckCategoryResource
    {
        $this->authorizeAdmin($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:truck_categories,name'],
            'description' => ['nullable', 'string'],
        ]);

        return new TruckCategoryResource(TruckCategory::create($validated));
    }

    public function update(Request $request, TruckCategory $category): TruckCategoryResource
    {
        $this->authorizeAdmin($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:truck_categories,name,' . $category->id],
            'description' => ['nullable', 'string'],
        ]);

        $category->update($validated);

        return new TruckCategoryResource($category);
    }

    public function destroy(Request $request, TruckCategory $category): JsonResponse
    {
        $this->authorizeAdmin($request);

        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Kategori dihapus.',
        ]);
    }

    private function authorizeAdmin(Request $request): void
    {
        if (! $request->user()?->isAdmin()) {
            abort(403, 'Hanya admin yang dapat mengelola kategori.');
        }
    }
}
