<?php

namespace App\Services;

use Intervention\Image\Facades\Image;
use Illuminate\Support\Facades\Storage;

class ImageService
{
    /**
     * Compress and store an image
     *
     * @param \Illuminate\Http\UploadedFile $file
     * @param string $path
     * @param int $quality
     * @param int $maxWidth
     * @param int $maxHeight
     * @return string
     */
    public static function compressAndStore($file, $path, $quality = 80, $maxWidth = 1200, $maxHeight = 1200)
    {
        // Create image instance
        $image = Image::make($file);

        // Resize image if it's larger than max dimensions while maintaining aspect ratio
        if ($image->width() > $maxWidth || $image->height() > $maxHeight) {
            $image->resize($maxWidth, $maxHeight, function ($constraint) {
                $constraint->aspectRatio();
                $constraint->upsize();
            });
        }

        // Generate unique filename
        $filename = uniqid() . '.' . $file->getClientOriginalExtension();
        $fullPath = $path . '/' . $filename;

        // Save compressed image
        $image->save(storage_path('app/public/' . $fullPath), $quality);

        return '/storage/' . $fullPath;
    }

    /**
     * Delete an image from storage
     *
     * @param string $path
     * @return bool
     */
    public static function deleteImage($path)
    {
        if ($path) {
            $storagePath = str_replace('/storage/', '', $path);
            return Storage::delete('public/' . $storagePath);
        }
        return false;
    }
} 