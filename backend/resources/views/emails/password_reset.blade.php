<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kode Reset Password</title>
</head>
<body style="margin:0;padding:0;background-color:#f6f4ef;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6f4ef;padding:32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #eadfc9;">
                    <tr>
                        <td style="padding:32px 32px 8px;text-align:center;">
                            <div style="display:inline-block;background-color:#b8860b;color:#ffffff;font-size:18px;font-weight:bold;width:48px;height:48px;line-height:48px;border-radius:12px;">DM</div>
                            <h1 style="margin:16px 0 4px;font-size:20px;color:#1e3f36;">Kode Reset Password</h1>
                            <p style="margin:0;font-size:14px;color:#888888;">{{ \Illuminate\Support\Str::of(config('app.name'))->upper() }}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:24px 32px;text-align:center;">
                            <p style="margin:0 0 8px;font-size:14px;color:#555555;line-height:1.6;">
                                Gunakan kode berikut untuk mereset password Anda. Kode berlaku selama
                                {{ config('auth.otp.expiry_minutes') }} menit.
                            </p>
                            <div style="margin:24px 0;padding:18px;background-color:#faf7f0;border:1px dashed #d8c9a3;border-radius:12px;font-size:32px;font-weight:bold;letter-spacing:12px;color:#1e3f36;">{{ chunk_split($code, 3, ' ') }}</div>
                            <p style="margin:0;font-size:13px;color:#999999;line-height:1.6;">
                                Abaikan email ini jika Anda tidak meminta reset password. Jangan bagikan kode ini kepada siapa pun.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:16px 32px 32px;text-align:center;">
                            <p style="margin:0;font-size:12px;color:#bbbbbb;">&copy; {{ date('Y') }} {{ config('app.name') }}. Seluruh hak cipta dilindungi.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
