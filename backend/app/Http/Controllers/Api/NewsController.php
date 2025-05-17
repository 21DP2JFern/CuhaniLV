<?php

namespace App\Http\Controllers\Api;

use App\Models\News;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;

class NewsController extends Controller
{
    public function index()
    {
        $news = News::with('author')->orderBy('created_at', 'desc')->get();
        return response()->json($news);
    }

    public function show($id)
    {
        $news = News::with('author')->findOrFail($id);
        return response()->json($news);
    }

    public function store(Request $request)
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'category' => 'required|string|max:50',
            'image_url' => 'nullable|url|max:255'
        ]);

        $news = News::create([
            'title' => $request->title,
            'content' => $request->content,
            'category' => $request->category,
            'image_url' => $request->image_url,
            'author_id' => Auth::id()
        ]);

        return response()->json($news->load('author'), 201);
    }

    public function update(Request $request, $id)
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $news = News::findOrFail($id);

        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'category' => 'required|string|max:50',
            'image_url' => 'nullable|url|max:255'
        ]);

        $news->update([
            'title' => $request->title,
            'content' => $request->content,
            'category' => $request->category,
            'image_url' => $request->image_url
        ]);

        return response()->json($news->load('author'));
    }

    public function destroy($id)
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $news = News::findOrFail($id);
        $news->delete();

        return response()->json(['message' => 'News article deleted successfully']);
    }
} 