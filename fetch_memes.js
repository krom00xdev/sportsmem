import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing credentials!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const sampleMemes = [
  {
    title: "When your team wins in the 93rd minute",
    media_url: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80",
    type: "image",
    sport: "soccer",
    competition: "Champions League",
    country_code: "GB",
    upvotes: 1420,
    source: "Manual Seed"
  },
  {
    title: "Unstoppable buzzer beater in the finals",
    media_url: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80",
    type: "image",
    sport: "basketball",
    competition: "NBA",
    country_code: "US",
    upvotes: 3200,
    source: "Manual Seed"
  },
  {
    title: "VAR decision takes 10 minutes",
    media_url: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80",
    type: "image",
    sport: "soccer",
    competition: "Premier League",
    country_code: "GB",
    upvotes: 890,
    source: "Manual Seed"
  }
];

async function seedDatabase() {
  console.log("Seeding sports memes into Supabase...");

  for (const meme of sampleMemes) {
    const { error } = await supabase.from('posts').upsert(meme, {
      onConflict: 'media_url',
      ignoreDuplicates: true
    });

    if (error) {
      console.error("Error inserting seed data:", error.message);
    } else {
      console.log(`Inserted: "${meme.title}"`);
    }
  }

  console.log("Seeding complete!");
}

seedDatabase();
