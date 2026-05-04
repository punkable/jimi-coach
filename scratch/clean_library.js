
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function cleanAndEnhance() {
  console.log('Fetching exercises...');
  const { data: exercises, error } = await supabase.from('exercises').select('*');
  if (error) {
    console.error('Error fetching exercises:', error);
    return;
  }

  const groups = {};
  exercises.forEach(ex => {
    const name = ex.name.toLowerCase().trim();
    if (!groups[name]) groups[name] = [];
    groups[name].push(ex);
  });

  for (const name in groups) {
    const list = groups[name];
    if (list.length > 1) {
      list.sort((a, b) => {
        if (a.video_url && !b.video_url) return -1;
        if (!a.video_url && b.video_url) return 1;
        return new Date(b.created_at) - new Date(a.created_at);
      });

      const keep = list[0];
      const others = list.slice(1);
      
      console.log(`Cleaning duplicates for "${keep.name}"...`);
      for (const other of others) {
        console.log(`  Redirecting movements from ${other.id} to ${keep.id}...`);
        const { error: updErr } = await supabase.from('workout_movements').update({ exercise_id: keep.id }).eq('exercise_id', other.id);
        if (updErr) console.error(`  Error redirecting movements:`, updErr);
        
        console.log(`  Deleting duplicate ${other.id}...`);
        const { error: delErr } = await supabase.from('exercises').delete().eq('id', other.id);
        if (delErr) console.error(`  Error deleting exercise:`, delErr);
      }
    }
  }

  // 2. Add descriptions
  const descriptions = {
    "air squat": "Sentadilla básica sin peso. Mantén el pecho arriba y rompe el paralelo.",
    "back squat": "Sentadilla con barra en la espalda. Enfoque en fuerza de piernas y estabilidad central.",
    "front squat": "Sentadilla con barra en posición de rack frontal. Exige mayor verticalidad y fuerza de core.",
    "overhead squat": "Sentadilla con barra sobre la cabeza. Prueba máxima de movilidad y estabilidad.",
    "deadlift": "Peso muerto. Levantamiento fundamental de fuerza desde el suelo.",
    "clean & jerk": "Cargada y envión. Movimiento olímpico de potencia y técnica.",
    "snatch": "Arrancada. El movimiento más técnico del levantamiento olímpico.",
    "power clean": "Cargada de potencia sin recibir en sentadilla profunda.",
    "power snatch": "Arrancada de potencia sin recibir en sentadilla profunda.",
    "burpee": "Movimiento de cuerpo completo que combina flexión y salto. Cardiovascular intenso.",
    "pull ups": "Dominadas. Tracción vertical para fuerza de espalda y brazos.",
    "chest to bar pull ups": "Dominadas tocando el pecho con la barra. Exigencia técnica superior.",
    "muscle up (ring)": "Movimiento gimnástico avanzado en anillas. De tracción a empuje.",
    "muscle up (bar)": "Movimiento gimnástico avanzado en barra. Explosividad pura.",
    "double under": "Salto doble de comba. Requiere ritmo y coordinación.",
    "box jump": "Salto al cajón. Enfoque en potencia explosiva de piernas.",
    "push ups": "Flexiones de brazos. Empuje horizontal para pecho y tríceps.",
    "handstand push up": "Flexiones haciendo el pino. Fuerza de hombros y equilibrio.",
    "thruster": "Combinación de sentadilla frontal y press de hombros en un solo movimiento fluido.",
    "wall ball": "Lanzamiento de balón medicinal a un objetivo tras una sentadilla.",
    "kettlebell swing": "Balanceo de pesa rusa. Potencia de cadera y cadena posterior.",
    "toes to bar": "Pies a la barra. Trabajo abdominal y de agarre gimnástico.",
    "sit ups": "Abdominales básicos de CrossFit, usualmente con AbMat.",
    "row": "Remo en máquina. Trabajo cardiovascular de cuerpo completo.",
    "bike": "Bicicleta estática (Eco/Assault). Intensidad metabólica extrema.",
    "run": "Carrera. Resistencia cardiovascular básica.",
    "pistol squat": "Sentadilla a una pierna. Equilibrio, fuerza y movilidad extrema.",
    "rope climb": "Escalada de cuerda. Fuerza de agarre y tracción.",
    "mobility": "Ejercicio enfocado en mejorar el rango de movimiento y salud articular.",
    "stretching": "Estiramiento para recuperación y flexibilidad."
  };

  const { data: remainingExercises, error: fetchErr } = await supabase.from('exercises').select('id, name, description');
  if (fetchErr) {
    console.error('Error fetching remaining exercises:', fetchErr);
    return;
  }
  
  console.log('Updating descriptions...');
  for (const ex of remainingExercises) {
    if (ex.description && ex.description !== "Ejercicio funcional para mejorar el rendimiento físico.") continue;

    const name = ex.name.toLowerCase();
    let desc = "";

    for (const key in descriptions) {
      if (name.includes(key)) {
        desc = descriptions[key];
        break;
      }
    }

    if (desc) {
      await supabase.from('exercises').update({ description: desc }).eq('id', ex.id);
    } else {
      await supabase.from('exercises').update({ description: "Ejercicio funcional para mejorar el rendimiento físico." }).eq('id', ex.id);
    }
  }

  console.log('Cleaning and enhancement complete!');
}

cleanAndEnhance();
