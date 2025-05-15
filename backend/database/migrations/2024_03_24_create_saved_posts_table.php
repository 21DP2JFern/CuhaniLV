<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        if (!Schema::hasTable('saved_posts')) {
            Schema::create('saved_posts', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->foreignId('post_id')->constrained()->onDelete('cascade');
                $table->timestamps();

                // Ensure a user can't save the same post twice
                $table->unique(['user_id', 'post_id']);
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('saved_posts');
    }
}; 