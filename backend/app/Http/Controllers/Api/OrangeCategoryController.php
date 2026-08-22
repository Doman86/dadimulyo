<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrangeCategoryResource;
use App\Models\OrangeCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class OrangeCategoryController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return OrangeCategoryResource::collection(OrangeCategory::orderBy('name')->get());
    }

    public function store(Request $request): OrangeCategoryResource
    {
        $this->authorizeAdmin($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:orange_categories,name'],
            'description' => ['nullable', 'string'],
        ]);

        return new OrangeCategoryResource(OrangeCategory::create($validated));
    }

    public function update(Request $request, OrangeCategory $category): OrangeCategoryResource
    {
        $this->authorizeAdmin($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:orange_categories,name,' . $category->id],
            'description' => ['nullable', 'string'],
        ]);

        $category->update($validated);

        return new OrangeCategoryResource($category);
    }

    public function destroy(Request $request, OrangeCategory $category): JsonResponse
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
