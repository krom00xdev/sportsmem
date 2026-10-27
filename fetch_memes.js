import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TARGET_SUBREDDITS = [
  { name: 'soccer', sport: 'soccer' },
  { name: 'nba', sport: 'basketball' },
  { name: 'SportsMeme', sport: 'soccer' }
];

async function fetchRedditMemes() {
  for (const sub of TARGET_SUBREDDITS) {
    console.log(`Fetching memes from r/${sub.name}...`);
    
    try {
      const res = await fetch(`https://www.reddit.com/r/${sub.name}/hot.json?limit=25`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      
      if (!res.ok) {
        console.error(`Failed to fetch r/${sub.name}: ${res.statusText}`);
        continue;
      }

      const data = await res.json();
      const posts = data?.data?.children || [];

      for (const item of posts) {
        const post = item.data;
        
        const isMedia = post.url && (
          post.url.endsWith('.jpg') || 
          post.url.endsWith('.png') || 
          post.url.endsWith('.gif') || 
          post.post_hint === 'image'
        );

        if (!isMedia) continue;

        const mediaType = post.url.endsWith('.gif') ? 'gif' : 'image';

        const { error } = await supabase.from('posts').upsert(
          {
            title: post.title,
            media_url: post.url,
            type: mediaType,
            sport: sub.sport,
            source: 'Reddit',
            created_at: new Date(post.created_utc * 1000).toISOString()
          },
          { onConflict: 'media_url', ignoreDuplicates: true }
        );

        if (error) console.error('Error saving post:', error.message);
      }
    } catch (err) {
      console.error(`Error processing r/${sub.name}:`, err.message);
    }
  }
  console.log('Automated ingestion complete!');
}

fetchRedditMemes();
