import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchAndPopulateAll() {
  let totalSaved = 0;
  console.log("Starting multi-source ingestion...");

  // 1. Fetch from Giphy (Public Beta Key)
  try {
    const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=dc6zaTOxFJmzC&q=soccer+meme+football&limit=5&rating=g`);
    if (res.ok) {
      const data = await res.json();
      for (const gif of data.data) {
        const mediaUrl = gif.images?.fixed_height?.url;
        if (!mediaUrl) continue;

        const { error } = await supabase.from('posts').upsert({
          title: gif.title || 'Viral Football Reaction',
          media_url: mediaUrl,
          type: 'gif',
          sport: 'soccer',
          competition: 'Champions League',
          country_code: 'GB',
          upvotes: Math.floor(Math.random() * 2000) + 100,
          source: 'Giphy',
          created_at: new Date().toISOString()
        }, { onConflict: 'media_url', ignoreDuplicates: true });

        if (!error) totalSaved++;
      }
    }
  } catch (err) {
    console.error('Giphy error:', err.message);
  }

  // 2. Fetch from Tenor (Public Test Key)
  try {
    const res = await fetch(`https://tenor.googleapis.com/v2/search?q=nba+basketball+meme&key=LIVDSRZULELA&client_key=sportsmem&limit=5`);
    if (res.ok) {
      const data = await res.json();
      for (const item of data.results) {
        const mediaUrl = item.media_formats?.gif?.url;
        if (!mediaUrl) continue;

        const { error } = await supabase.from('posts').upsert({
          title: item.content_description || 'NBA TikTok/Reels Highlight',
          media_url: mediaUrl,
          type: 'gif',
          sport: 'basketball',
          competition: 'NBA',
          country_code: 'US',
          upvotes: Math.floor(Math.random() * 3000) + 500,
          source: 'Tenor / Social',
          created_at: new Date().toISOString()
        }, { onConflict: 'media_url', ignoreDuplicates: true });

        if (!error) totalSaved++;
      }
    }
  } catch (err) {
    console.error('Tenor error:', err.message);
  }

  // 3. Add curated viral Instagram/TikTok style sports graphics
  const socialMemes = [
    {
      title: "POV: When your striker misses an open net in the 90th minute [Instagram Reel]",
      media_url: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=800&q=80",
      type: "image",
      sport: "soccer",
      competition: "Premier League",
      country_code: "GB",
      upvotes: 4820,
      source: "Instagram"
    },
    {
      title: "LeBron explanation meme going viral on TikTok",
      media_url: "https://images.unsplash.com/photo-1519766304817-4f37bda74a29?auto=format&fit=crop&w=800&q=80",
      type: "image",
      sport: "basketball",
      competition: "NBA",
      country_code: "US",
      upvotes: 6150,
      source: "TikTok"
    },
    {
      title: "Sunday League defenders vs professional wingers [Facebook Video Clip]",
      media_url: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80",
      type: "image",
      sport: "soccer",
      competition: "Local League",
      country_code: "ES",
      upvotes: 2190,
      source: "Facebook"
    }
  ];

  for (const meme of socialMemes) {
    const { error } = await supabase.from('posts').upsert(meme, {
      onConflict: 'media_url',
      ignoreDuplicates: true
    });

    if (!error) totalSaved++;
  }

  console.log(`Ingestion completed successfully! Total items added/verified: ${totalSaved}`);
}

fetchAndPopulateAll();
