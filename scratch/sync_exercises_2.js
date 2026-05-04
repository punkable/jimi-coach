
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const exercises = [
  { "name": "Front Squat", "video_url": "https://www.youtube.com/watch?v=l3l5yaKk2TQ" },
  { "name": "Front Rack Hold", "video_url": "https://www.youtube.com/watch?v=Ik0_bxw5bUA" },
  { "name": "Forward Lunge", "video_url": "https://www.youtube.com/watch?v=O2pzhnFd70A" },
  { "name": "Flexed Leg Wall Holder", "video_url": "https://www.youtube.com/watch?v=tmoUSSEJHAo" },
  { "name": "Eccentric Ankle Dorsiflexion", "video_url": "https://www.youtube.com/watch?v=dMP9tiAkI9s" },
  { "name": "Lemon Squeeze", "video_url": "https://www.youtube.com/watch?v=g8636xFDxmE" },
  { "name": "Leg Lock Bridge", "video_url": "https://www.youtube.com/watch?v=xhTn7Lwamns" },
  { "name": "Good Morning", "video_url": "https://www.youtube.com/watch?v=LkdtP7Xpn-k" },
  { "name": "Double KB Overhead Hold", "video_url": "https://www.youtube.com/watch?v=boP-3U0UVvA" },
  { "name": "Double KB Front Rack Carry", "video_url": "https://www.youtube.com/watch?v=ASQNgJMh3Cg" },
  { "name": "Half Lotus On Wall", "video_url": "https://www.youtube.com/watch?v=vzZ7pPdYQm0" },
  { "name": "PVC Hip External Rotation", "video_url": "https://www.youtube.com/watch?v=GeIZzv6ck-M" },
  { "name": "Quad Wall Stretch", "video_url": "https://www.youtube.com/watch?v=a5XW6sUNmmE" },
  { "name": "Quadruped Arm Circles", "video_url": "https://www.youtube.com/watch?v=Ev2cqbgfZks" },
  { "name": "Low Pec Stretch", "video_url": "https://www.youtube.com/watch?v=OgUke22ZqEw" },
  { "name": "Lumbar Extensions", "video_url": "https://www.youtube.com/watch?v=vMQNk4oDhpk" },
  { "name": "Mid Pec Stretch", "video_url": "https://www.youtube.com/watch?v=OEd7-k_hC5k" },
  { "name": "One Arm Kneeling Press", "video_url": "https://www.youtube.com/watch?v=BcSwfwL_dYY" },
  { "name": "One Arm Walking Lunge", "video_url": "https://www.youtube.com/watch?v=Ht0yTxXYj6Y" },
  { "name": "Pallof Press Hold", "video_url": "https://www.youtube.com/watch?v=5pC37WWHKCU" },
  { "name": "Half Kneeling Pallof Press Hold", "video_url": "https://www.youtube.com/watch?v=4yOlLJGnS8E" },
  { "name": "Half Kneeling Windmill", "video_url": "https://www.youtube.com/watch?v=N0JY9m45zdQ" },
  { "name": "Upper Pec Stretch", "video_url": "https://www.youtube.com/watch?v=w-LE2t7CRDE" },
  { "name": "Wall Arm Circles", "video_url": "https://www.youtube.com/watch?v=vMZDVlvcpGM" },
  { "name": "Wall Hinge", "video_url": "https://www.youtube.com/watch?v=XdX-9kBacck" },
  { "name": "Wall Holder", "video_url": "https://www.youtube.com/watch?v=jkhyintZoP4" },
  { "name": "Windmill", "video_url": "https://www.youtube.com/watch?v=rneeMaAph50" },
  { "name": "Side Lying External Rotation", "video_url": "https://www.youtube.com/watch?v=GDdY0VB7rCI" },
  { "name": "Side Lying Hip CARs⁣", "video_url": "https://www.youtube.com/watch?v=wrVM86WYfb8" },
  { "name": "Side Plank With Leg Abduction", "video_url": "https://www.youtube.com/watch?v=r1Ronu_MNzg" },
  { "name": "Side to Side Broad Jumps", "video_url": "https://www.youtube.com/watch?v=SOvL0ewCN_I" },
  { "name": "Single KB Single Leg Deadlift", "video_url": "https://www.youtube.com/watch?v=Wn05ndWSwlI" },
  { "name": "Single Leg Deadlift", "video_url": "https://www.youtube.com/watch?v=1q5C4c4gzF4" },
  { "name": "Single Leg Glute Bridge", "video_url": "https://www.youtube.com/watch?v=eT7rZQ9C9x0" },
  { "name": "Sit Ups", "video_url": "https://www.youtube.com/watch?v=AJDFWvp85m8" },
  { "name": "Split Squat Rock Back", "video_url": "https://www.youtube.com/watch?v=WoPVwgsSMJA" },
  { "name": "Squat Walk", "video_url": "https://www.youtube.com/watch?v=kzuEab00bOo" },
  { "name": "Swimmer Hovers", "video_url": "https://www.youtube.com/watch?v=i6-XhItkJOE" },
  { "name": "Reverse Lunge", "video_url": "https://www.youtube.com/watch?v=BE-Foq0Yg70" },
  { "name": "Samson Walking Lunge", "video_url": "https://www.youtube.com/watch?v=vkmM46JiTuA" },
  { "name": "Shoulder Rotation Capsular CARs⁣", "video_url": "https://www.youtube.com/watch?v=o0wSN2-j8bQ" },
  { "name": "Side Lying Arm Bar⁣", "video_url": "https://www.youtube.com/watch?v=6cjj3UZ0qTk" },
  { "name": "Sciatic Nerve Flossing", "video_url": "https://www.youtube.com/watch?v=dbOyrNaMdN8" }
];

async function run() {
  for (const ex of exercises) {
    const { data: existing } = await supabase.from('exercises').select('id').eq('name', ex.name).single();
    if (existing) {
      await supabase.from('exercises').update({ video_url: ex.video_url }).eq('id', existing.id);
    } else {
      await supabase.from('exercises').insert({ name: ex.name, video_url: ex.video_url, category: 'mobility' });
    }
  }
  console.log("Done remaining 43");
}

run();
