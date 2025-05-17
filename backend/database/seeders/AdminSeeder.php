<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::where('username', 'JFernats')->first();
        if ($user) {
            $user->update(['role' => 'admin']);
        }
    }
} 