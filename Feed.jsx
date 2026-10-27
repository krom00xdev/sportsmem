import React, { useEffect, useState } from 'react';
import { fetchSportsMemes } from './supabaseClient';

export default function MemeFeed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMemes() {
      setLoading(true);
      const data = await fetchSportsMemes('all'); // can be 'soccer', 'basketball', or 'all'
      setPosts(data);
      setLoading(false);
    }
    loadMemes();
  }, []);

  if (loading) return <div>Loading memes from around the world...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
      {posts.map((post) => (
        <div key={post.id} className="bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800">
          <img src={post.media_url} alt={post.title} className="w-full h-48 object-cover" />
          <div className="p-3">
            <h3 className="text-white font-medium text-sm">{post.title}</h3>
            <span className="text-xs text-emerald-400 uppercase font-semibold">{post.sport}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
