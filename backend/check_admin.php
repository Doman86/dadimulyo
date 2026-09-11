<?php
require __DIR__.'/vendor/autoload.php';

$app = require __DIR__.'/vendor/laravel/laravel/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Kernel::class);

$search = 'admin@dadimulyo.my.id';
\$users = \$kernel->make('Illuminate\Database\Capsule\Manager')->table('users')->where('email', \$search)->get();

echo count(\$users) . ' admin users found' . PHP_EOL;
foreach (\$users as \$user) {
    echo 'User: ' . \$user->email . ' role_id: ' . \$user->role_id . PHP_EOL;
}