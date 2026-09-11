# Admin Login - Localhost Setup

## Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@dadimulyo.my.id` | `password` |
| Sales | `sales@dadimulyo.my.id` | `password` |
| Truck Seller | `seller@dadimulyo.my.id` | `password` |
| Orange Seller | `orangeseller@dadimulyo.my.id` | `password` |
| Customer | `customer@dadimulyo.my.id` | `password` |

## Setup for Localhost

1. **Ensure database is seeded:**
   ```bash
   cd backend
   php artisan db:seed --force
   ```

2. **Configure .env for localhost:**
   - `APP_ENV=local`
   - `APP_DEBUG=true`
   - `AUTH_OTP_REQUIRED=false` (allows direct login without OTP)

3. **Clear config cache if needed:**
   ```bash
   php artisan config:clear
   ```

## API Login Endpoint

```
POST /api/login
Content-Type: application/json

{
  "email": "admin@dadimulyo.my.id",
  "password": "password"
}
```

### Response (OTP disabled)

```json
{
  "success": true,
  "message": "Login berhasil.",
  "data": {
    "needs_otp": false,
    "user": { ... },
    "token": "1|abc123..."
  }
}
```

## Troubleshooting

### "Email atau password salah"
- Verify the user exists: `php artisan tinker --execute="App\\Models\\User::where('email','admin@dadimulyo.my.id')->first()"`
- Check password: The default password is `password`
- Ensure `AUTH_OTP_REQUIRED=false` in .env

### Database connection issues
- Verify MySQL is running: `mysql -u root -e "SELECT 1"`
- Check .env DB settings match your MySQL configuration

### Token not working
- After login, store the token in localStorage: `auth_token`
- Include it in requests: `Authorization: Bearer <token>`
