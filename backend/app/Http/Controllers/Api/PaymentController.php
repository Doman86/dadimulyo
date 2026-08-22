<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PaymentController extends Controller
{
    public function store(Request $request, Order $order): JsonResponse
    {
        abort_unless($order->customer_id === $request->user()->id, 403);
        $validated = $request->validate([
            'payment_method' => ['required', 'string', 'in:transfer,cod'],
            'amount' => ['required', 'numeric', 'min:0'],
            'proof' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
        ]);

        $path = $request->file('proof')?->store('payments', 'public');
        $payment = $order->payments()->create([
            'payment_method' => $validated['payment_method'],
            'amount' => $validated['amount'],
            'proof_path' => $path,
            'status' => 'pending',
        ]);

        return response()->json(['success' => true, 'message' => 'Pembayaran dikirim untuk verifikasi.', 'data' => [
            'payment' => [...$payment->toArray(), 'proof_url' => $path ? Storage::disk('public')->url($path) : null],
        ]], 201);
    }
}
