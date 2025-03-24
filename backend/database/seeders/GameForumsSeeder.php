<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class GameForumsSeeder extends Seeder
{
    public function run()
    {
        $games = [
            [
                'name' => 'Fortnite',
                'description' => 'Discuss everything about Fortnite - battle royale strategies, building techniques, updates, and more. Share your victories, discuss meta changes, and connect with other players.',
                'image_url' => '/storage/forum_images/fortnite.jpg'
            ],
            [
                'name' => 'Counter-Strike 2',
                'description' => 'The ultimate CS2 community. Share strategies, discuss maps, weapons, and competitive play. Get tips from experienced players and discuss the latest updates.',
                'image_url' => '/storage/forum_images/cs2.jpg'
            ],
            [
                'name' => 'Valorant',
                'description' => 'Join the Valorant community to discuss agents, abilities, strategies, and competitive play. Share your experiences and learn from others.',
                'image_url' => '/storage/forum_images/valorant.jpg'
            ],
            [
                'name' => 'BeamNG.drive',
                'description' => 'A community for BeamNG.drive enthusiasts. Share mods, discuss vehicle physics, showcase your creations, and get help with technical issues.',
                'image_url' => '/storage/forum_images/beamng.jpg'
            ],
            [
                'name' => 'Forza Horizon 5',
                'description' => 'The perfect place for Forza Horizon 5 fans. Discuss cars, racing strategies, customization, and share your best moments from the game.',
                'image_url' => '/storage/forum_images/forza.jpg'
            ],
            [
                'name' => 'Minecraft',
                'description' => 'A community for Minecraft players of all types. Share builds, discuss survival strategies, redstone contraptions, and connect with other players.',
                'image_url' => '/storage/forum_images/minecraft.jpg'
            ]
        ];

        // Get the first user to be the owner of all forums
        $userId = DB::table('users')->first()->id;

        foreach ($games as $game) {
            DB::table('forums')->insert([
                'user_id' => $userId,
                'name' => $game['name'],
                'slug' => Str::slug($game['name']),
                'description' => $game['description'],
                'image_url' => $game['image_url'],
                'member_count' => 0,
                'post_count' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
} 