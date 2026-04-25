import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hcmbuqxuopxybfrnuugy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjbWJ1cXh1b3B4eWJmcm51dWd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNDU5MzIsImV4cCI6MjA5MjYyMTkzMn0.nxRY2cbuY5PzkLI0cf2gCbJOlnvv4QjG_AuqKrYX13k'

export const supabase = createClient(supabaseUrl, supabaseKey)
