<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // Check if the table exists and has the correct structure
        if (Schema::hasTable('conversation_user')) {
            // Add timestamps if they don't exist
            if (!Schema::hasColumns('conversation_user', ['created_at', 'updated_at'])) {
                Schema::table('conversation_user', function (Blueprint $table) {
                    $table->timestamps();
                });
            }
        }
    }

    public function down()
    {
        // No need to reverse this migration
    }
}; 