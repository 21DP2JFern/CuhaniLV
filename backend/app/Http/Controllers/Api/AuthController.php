<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Password;
use Illuminate\Auth\Events\Registered;


class AuthController extends Controller
{
    // Register API (POST)
    public function register(Request $request){
        // Data validation
        $request->validate([
            "email" => "required|email|unique:users",
            "username" => "required|unique:users",
            "password" => "required|confirmed"
        ]);

        // Create User
        $user = User::create([
            "email" => $request->email,
            "username" => $request->username,
            "password" => Hash::make($request->password),
            "role" => "user"
        ]);

        return response()->json([
            "status" => true,
            "message" => "User created in successfully.",
            "role" => $user->role // Include user role in the response
        ]);
    }

    public function login(Request $request){
        // Data validation
        $request->validate([
            "email" => "required|email",
            "password" => "required"
        ]);

        // Check if user exists and credentials are correct
        if(Auth::attempt([
            "email" => $request->email,
            "password" => $request->password
        ])){
            $user = Auth::user();

            // Generate token if verified
            $token = $user->createToken("userToken")->accessToken;

            return response()->json([
                "status" => true,
                "message" => "User logged in successfully",
                "token" => $token,
                "role" => $user->role // Include user role in the response
            ]);
        }else{
            return response()->json([
                "status" => false,
                "message" => "Invalid login details"
            ]);
        }
    }

    public function logout(){
        auth()->user()->token()->revoke();
        return response()->json([
            "status" => true,
            "message" => "User Logged out"
        ]);
    }

    public function profile(){
        $user = Auth::user();

        return response()->json([
            "status" => true,
            "message" => "Profile information",
            "data" => $user, // User data,
            
        ]);
    }

}