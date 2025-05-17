<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;

class SetAdminRole extends Command
{
    protected $signature = 'user:set-admin {username}';
    protected $description = 'Set admin role for a user';

    public function handle()
    {
        $username = $this->argument('username');
        $user = User::where('username', $username)->first();

        if (!$user) {
            $this->error("User {$username} not found!");
            return;
        }

        $user->role = 'admin';
        $user->save();

        $this->info("Successfully set admin role for user {$username}");
    }
} 