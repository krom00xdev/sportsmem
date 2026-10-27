import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ayfkiofamrnnsmerfcpf.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_67CCvUlVyJCJukihrXheHg_CNCiP5VM'

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)

// Fetch function to get posts for your feed
export async function fetchSportsMemes(sportFilter = 'all') {
  let query = supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })

  if (sportFilter !== 'all') {
    query = query.eq('sport', sportFilter)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching posts:', error.message)
    return []
  }

  return data
}
