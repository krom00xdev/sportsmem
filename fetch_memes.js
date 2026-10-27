import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables!");
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
    console.log(`\n--- Fetching r/${sub.name} ---`);
    
    try {
      const res = await fetch(`https://www.reddit.com/r/${sub.name}/hot.json?limit=30`, {
        headers: {
          'User-Agent': 'script:sports-meme-aggregator:v1.0 (by /u/SportsMemeApp)'
        }
      });

      if (!res.ok) {
        console.error(`Reddit HTTP Error (${sub.name}): ${res.status} ${res.statusText}`);
        continue;
      }

      const data = await res.json();
      const posts = data?.data?.children || [];
      console.log(`Retrieved ${posts.length} raw posts from r/${sub.name}`);

      for (const item of posts) {
        const post = item.data;

        // Extract media URL
        let mediaUrl = post.url;
        if (!mediaUrl) continue;

        // Resolve imgur / reddit direct images
        if (mediaUrl.includes('imgur.com') && !mediaUrl.endsWith('.jpg') && !mediaUrl.endsWith('.png') && !mediaUrl.endsWith('.gif')) {
          mediaUrl += '.jpg';
        }

        // Check if it's an image or gif
        const isImage = mediaUrl.match(/\.(jpeg|jpg|png)$/i) || post.post_hint === 'image';
        const isGif = mediaUrl.match(/\.gif$/i) || mediaUrl.includes('gfycat.com');

        if (!isImage && !isGif) continue;

        const mediaType = isGif ? 'gif' : 'image';

        // Upsert into Supabase
        const { data: insertedData, error } = await supabase.from('posts').upsert(
          {
            title: post.title,
            media_url: mediaUrl,
            type: mediaType,      // Matches 'media_type' ENUM ('image', 'gif', 'video')
            sport: sub.sport,    // Matches 'sport_type' ENUM ('soccer', 'basketball')
            source: 'Reddit',
            created_at: new Date(post.created_utc * 1000).toISOString()
          },
          { onConflict: 'media_url', ignoreDuplicates: true }
        );

        if (error) {
          console.error(`Supabase Insert Error ("${post.title.substring(0, 30)}..."):`, error.message);
        } else {
          totalSaved++;
        }
      }
    } catch (err) {
      console.error(`Error processing r/${sub.name}:`, err.message);
    }
  }

  console.log(`\nDone! Successfully saved/processed ${totalSaved} items in Supabase.`);
}

fetchRedditMemes();
