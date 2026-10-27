import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TARGET_SUBREDDITS = [
  { name: 'soccer', sport: 'soccer' },
  { name: 'nba', sport: 'basketball' },
  { name: 'SportsMeme', sport: 'soccer' }
];

async function fetchRedditMemes() {
  let totalSaved = 0;

  for (const sub of TARGET_SUBREDDITS) {
    console.log(`Fetching r/${sub.name}...`);
    
    try {
      const res = await fetch(`https://www.reddit.com/r/${sub.name}/hot.json?limit=25`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SportsMemeBot/1.0' }
      });

      if (!res.ok) {
        console.error(`Failed to fetch r/${sub.name}: ${res.status}`);
        continue;
      }

      const data = await res.json();
      const posts = data?.data?.children || [];

      for (const item of posts) {
        const post = item.data;
        let mediaUrl = post.url;

        // Skip text-only self posts or empty urls
        if (!mediaUrl || post.is_self) continue;

        // Format check: accept anything that looks like an image, gif, or video link
        let mediaType = 'image';
        if (mediaUrl.endsWith('.gif') || mediaUrl.includes('gifv')) {
          mediaType = 'gif';
        } else if (mediaUrl.includes('youtube.com') || mediaUrl.includes('youtu.be') || mediaUrl.includes('v.redd.it') || mediaUrl.endsWith('.mp4')) {
          mediaType = 'video';
        }

        // Clean up Imgur links missing extensions
        if (mediaUrl.includes('imgur.com') && !mediaUrl.match(/\.(jpg|png|gif)$/i)) {
          mediaUrl += '.jpg';
        }

        // Insert into Supabase
        const { error } = await supabase.from('posts').upsert(
          {
            title: post.title || 'Untitled Meme',
            media_url: mediaUrl,
            type: mediaType,
            sport: sub.sport,
            source: 'Reddit',
            created_at: new Date(post.created_utc * 1000).toISOString()
          },
          { onConflict: 'media_url', ignoreDuplicates: true }
        );

        if (error) {
          console.error('Supabase error:', error.message);
        } else {
          totalSaved++;
        }
      }
    } catch (err) {
      console.error(`Error in r/${sub.name}:`, err.message);
    }
  }

  console.log(`Total items successfully saved: ${totalSaved}`);
}

fetchRedditMemes();
