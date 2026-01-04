import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dvpcjslxzsauaalgtohm.supabase.co';
// The key provided by the user is a publishable key, which is interchangeable with the anon key for the JS client.
const supabaseKey = 'sb_publishable_Jq0HJWJbrN00GJQGWA1G0g_SMUKM5rJ';

export const supabase = createClient(supabaseUrl, supabaseKey);