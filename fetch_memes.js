import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("CRITICAL ERROR: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables are missing!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TARGET_SOURCES = [
  { name: 'soccer', sport: 'soccer' },
  { name: 'nba', sport: 'basketball' },
  { name: 'SportsMeme', sport: 'soccer' }
];

async function fetchAndPopulateMemes() {
  let totalInserted = 0;

  for (const source of TARGET_SOURCES) {
    console.log(`\n=== Fetching items for ${source.name} (${source.sport}) ===`);

    try {
      // 1. Fetch from Reddit JSON
      const redditRes = await fetch(`https://www.reddit.com/r/${source.name}/hot.json?limit=25`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SportsMemeApp/1.0' }
      });

      if (redditRes.ok) {
        const redditData = await redditRes.json();
        const posts = redditData?.data?.children || [];
        console.log(`Found ${posts.length} raw posts from Reddit r/${source.name}`);

        for (const item of posts) {
          const post = item.data;
          let mediaUrl = post.url;

          if (!mediaUrl || post.is_self) continue;

          // Format check for direct images and gifs
          const isGif = mediaUrl.match(/\.gif$/i) || mediaUrl.includes('gfycat.com');
          const isImage = mediaUrl.match(/\.(jpeg|jpg|png)$/i) || post.post_hint === 'image';

          if (!isImage && !isGif) continue;

          // Prepare clean record payload matching Supabase schema
          const payload = {
            title: post.title ? post.title.substring(0, 250) : 'Sports Meme',
            media_url: mediaUrl,
            type: isGif ? 'gif' : 'image',  // Matches 'media_type' ENUM ('image', 'gif', 'video')
            sport: source.sport,            // Matches 'sport_type' ENUM ('soccer', 'basketball')
            competition: source.name === 'nba' ? 'NBA' : 'Champions League',
            country_code: 'US',
            upvotes: post.score || 0,
            source: 'Reddit',
            created_at: new Date(post.created_utc * 1000).toISOString()
          };

          const { error } = await supabase.from('posts').upsert(payload, {
            onConflict: 'media_url',
            ignoreDuplicates: true
          });

          if (error) {
            console.error(`Supabase Insert Error: ${error.message}`);
          } else {
            totalInserted++;
          }
        }
      } else {
        console.warn(`Reddit response not OK for r/${source.name}: ${redditRes.status}`);
      }

    } catch (err) {
      console.error(`Error processing ${source.name}:`, err.message);
    }
  }

  console.log(`\n==========================================`);
  console.log(`SUCCESS: Inserted/Verified ${totalInserted} items into Supabase posts table.`);
  console.log(`==========================================\n`);
}

fetchAndPopulateMemes();
