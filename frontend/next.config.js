/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'localhost',
      '127.0.0.1',
      'cdn.thefpsreview.com',
      'images.unsplash.com',
      'i.imgur.com',
      'media.rawg.io',
      'www.nvidia.com',
      'www.notebookcheck.net',
      'steamcdn-a.akamaihd.net',
      'cdn.akamai.steamstatic.com',
      'cdn.cloudflare.steamstatic.com',
      'cdn.steamstatic.com',
      'cdn.steamcommunity.com',
      'cdn.steamusercontent.com',
      'cdn.steamcontent.com',
      'cdn.steamstore.com',
      'cdn.steamworks.com',
      'cdn.steamgames.com'
    ],
  },
  // ... rest of your config
}

module.exports = nextConfig 