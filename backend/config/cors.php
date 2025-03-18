<?php

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'oauth/*'], // 🔥 Include 'oauth/*' for Passport
    'allowed_methods' => ['*'],
    'allowed_origins' => ['http://localhost:3000'], // 🔥 Change this to your frontend URL
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],  // Allow all headers
    'exposed_headers' => ['*'],  // Expose all headers
    'max_age' => 0,
    'supports_credentials' => true, // 🔥 REQUIRED for authentication
];
