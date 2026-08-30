<?php

use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->api(prepend: [
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);

        // Rate limiting untuk login & register (throttle:60,1 = 60 request per menit)
        $middleware->api(prepend: [
            \Illuminate\Routing\Middleware\ThrottleRequests::class.':60,1',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Semua response API harus JSON
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        // 401 — Unauthenticated → JSON (bukan redirect)
        $exceptions->renderable(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated.',
                ], 401);
            }
        });

        // 422 — Validation Error → JSON yang rapi
        $exceptions->renderable(function (ValidationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal.',
                    'errors' => $e->errors(),
                ], 422);
            }
        });

        // 404 — Model Not Found → JSON
        $exceptions->renderable(function (ModelNotFoundException $e, Request $request) {
            if ($request->is('api/*')) {
                $model = class_basename($e->getModel());
                return response()->json([
                    'success' => false,
                    'message' => "{$model} tidak ditemukan.",
                ], 404);
            }
        });

        // 429 — Throttle / Rate Limit → JSON
        $exceptions->renderable(function (ThrottleRequestsException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Terlalu banyak percobaan. Silakan tunggu beberapa saat lagi.',
                ], 429);
            }
        });

        // 500 — Server Error → JSON (bukan stack trace di production)
        $exceptions->renderable(function (\Throwable $e, Request $request) {
            if ($request->is('api/*') && ! app()->hasDebugModeEnabled()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Terjadi kesalahan server. Silakan coba lagi.',
                ], 500);
            }
        });
    })->create();
