<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Symfony\Component\HttpFoundation\Response;

class DownloadController extends \App\Http\Controllers\Controller
{
    public function apk()
    {
        $path = 'D:/laragon/www/dadimulyo/mobile/build/app/outputs/flutter-apk/app-release.apk';

        if (!File::exists($path)) {
            return response()->json([
                'success' => false,
                'message' => 'APK file not found. Build release first.',
            ], 404);
        }

        $filename = 'dadi_mulyo_mobile_' . substr(time(), -6) . '.apk';

        $response = Response::create(File::get($path), 200);
        $response->header('Content-Type', 'application/vnd.android.package-archive');
        $response->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
        $response->header('Cache-Control', 'no-cache, no-store, must-revalidate');
        $response->header('Pragma', 'no-cache');
        $response->header('Expires', '0');

        return $response;
    }
}