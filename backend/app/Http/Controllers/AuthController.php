<?php

namespace App\Http\Controllers;

abstract class Controller
{
    // Register API (POST)
    public function register(Request $request){
        // Data validation
        $request->validate([
            "email" => "required|email|unique:users",
            "password" => "required|confirmed"
        ]);

        // Create User
        $user = User::create([
            "email" => $request->email,
            "password" => Hash::make($request->password),
            "role" => "user"
        ]);

        return response()->json([
            "status" => true,
            "message" => "User created in successfully.",
            "token" => $token,
            "role" => $user->role // Include user role in the response
        ]);
    }
}