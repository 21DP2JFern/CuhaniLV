<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MessageController extends Controller
{
    public function conversations()
    {
        try {
            \Log::info('Fetching conversations for user: ' . Auth::id());
            
            $conversations = Auth::user()
                ->conversations()
                ->with(['users', 'lastMessage'])
                ->get()
                ->map(function ($conversation) {
                    \Log::info('Processing conversation: ' . $conversation->id);
                    $otherUser = $conversation->otherUser();
                    $lastMessage = $conversation->lastMessage;
                    return [
                        'id' => $conversation->id,
                        'other_user' => $otherUser ? [
                            'id' => $otherUser->id,
                            'username' => $otherUser->username,
                            'profile_picture' => $otherUser->profile_picture,
                        ] : null,
                        'last_message' => $lastMessage ? [
                            'content' => $lastMessage->content,
                            'created_at' => $lastMessage->created_at,
                        ] : null,
                        'unread_count' => $conversation->unread_count,
                    ];
                });

            \Log::info('Successfully fetched ' . count($conversations) . ' conversations');
            return response()->json($conversations);
        } catch (\Exception $e) {
            \Log::error('Error fetching conversations: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json(['error' => 'Failed to fetch conversations', 'details' => $e->getMessage()], 500);
        }
    }

    public function messages(Conversation $conversation)
    {
        try {
            if (!$conversation->users->contains(Auth::id())) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            // Mark messages as read
            $conversation->messages()
                ->where('user_id', '!=', Auth::id())
                ->where('is_read', false)
                ->update(['is_read' => true]);

            $messages = $conversation->messages()
                ->with('user:id,username,profile_picture')
                ->get()
                ->map(function ($message) {
                    return [
                        'id' => $message->id,
                        'content' => $message->content,
                        'created_at' => $message->created_at,
                        'user' => [
                            'id' => $message->user->id,
                            'username' => $message->user->username,
                            'profile_picture' => $message->user->profile_picture,
                        ],
                    ];
                });

            return response()->json($messages);
        } catch (\Exception $e) {
            \Log::error('Error fetching messages: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch messages'], 500);
        }
    }

    public function sendMessage(Request $request, $username)
    {
        try {
            \Log::info('Attempting to send message to user: ' . $username);
            
            $request->validate([
                'content' => 'required|string|max:1000',
            ]);

            // Find the user by username
            $user = User::where('username', $username)->first();
            
            if (!$user) {
                \Log::error('User not found with username: ' . $username);
                return response()->json([
                    'error' => 'User not found',
                    'details' => 'No user found with username: ' . $username
                ], 404);
            }
            
            \Log::info('Found user: ' . $user->id);

            // Find or create conversation
            $conversation = Conversation::whereHas('users', function ($query) use ($user) {
                $query->where('users.id', Auth::id());
            })->whereHas('users', function ($query) use ($user) {
                $query->where('users.id', $user->id);
            })->first();

            if (!$conversation) {
                \Log::info('Creating new conversation');
                $conversation = Conversation::create();
                $conversation->users()->attach([Auth::id(), $user->id]);
            }

            // Create message
            \Log::info('Creating new message');
            $message = $conversation->messages()->create([
                'user_id' => Auth::id(),
                'content' => $request->content,
            ]);

            \Log::info('Message created successfully: ' . $message->id);

            return response()->json([
                'message' => $message->load('user:id,username,profile_picture'),
            ]);
        } catch (\Exception $e) {
            \Log::error('Error sending message: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'error' => 'Failed to send message',
                'details' => $e->getMessage()
            ], 500);
        }
    }
} 