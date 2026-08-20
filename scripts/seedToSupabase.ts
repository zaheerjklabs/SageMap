import { createClient } from '@supabase/supabase-js';
import { ROADMAP_TOPICS } from '../src/data/roadmapData';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env.local if present
dotenv.config({ path: '.env.local' });

const DEFAULT_SUPABASE_URL = 'https://hiwotginlufpiorvyddu.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable__t-xihpRheZNMWskvARjWg_R6Ntkcie';

const supabaseUrl = process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedData() {
  console.log(`Connecting to Supabase at: ${supabaseUrl}`);

  const allStaticResources = ROADMAP_TOPICS.flatMap((topic) => topic.resources);
  console.log(`Found ${allStaticResources.length} resources across ${ROADMAP_TOPICS.length} topics in codebase.`);

  if (allStaticResources.length === 0) {
    console.log('No resources found to seed.');
    process.exit(0);
  }

  const chunkSize = 25;
  let successCount = 0;

  for (let i = 0; i < allStaticResources.length; i += chunkSize) {
    const chunk = allStaticResources.slice(i, i + chunkSize);
    const rows = chunk.map((r) => ({
      id: r.id,
      topic_id: r.topicId,
      data: r,
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('resources')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      console.error(`Error uploading batch ${i / chunkSize + 1}:`, error.message);
    } else {
      successCount += chunk.length;
      console.log(`Uploaded ${successCount}/${allStaticResources.length} resources...`);
    }
  }

  // Set system metadata row as initialized
  const METADATA_ROW_ID = '__sagemap_system_metadata__';
  const { error: metaErr } = await supabase
    .from('resources')
    .upsert(
      {
        id: METADATA_ROW_ID,
        topic_id: 0,
        data: {
          isInitialized: true,
          deletedResourceIds: [],
          lastSyncedAt: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      },
      { onConflict: 'id' }
    );

  if (metaErr) {
    console.warn('Metadata upsert error:', metaErr.message);
  } else {
    console.log('Successfully set system metadata initialized status in Supabase!');
  }

  console.log(`\nDONE! Seeded ${successCount} resources to Supabase table 'resources'.`);
}

seedData().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
