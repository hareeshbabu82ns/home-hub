import { db } from "../src/lib/db";

const sampleExercises = [
  {
    exerciseId: 10231,
    title: "180 / Twisting Jump Squats",
    titleRaw: "180 / Twisting Jump Squats",
    img: {
      male: "https://workoutlabs.com/train/wp-content/uploads/2023/05/180_Jump_Squats-c.svg",
      female:
        "https://workoutlabs.com/train/wp-content/uploads/2023/05/180_Jump_Squats-1-c.svg",
      mid: "83952",
      fid: "84738",
    },
    imgPng: {
      male: null,
      female: null,
    },
    anim: {
      female:
        "https://workoutlabs.com/train/wp-content/uploads/2023/05/180_Jump_Squats-1_anim-c.svg",
      female_id: "85341",
      male: "https://workoutlabs.com/train/wp-content/uploads/2023/05/180_Jump_Squats_anim-c.svg",
      male_id: "83423",
    },
    singleAnim: {
      female:
        "https://workoutlabs.com/train/wp-content/uploads/2023/05/180_Jump_Squats-1_anim-c.gif",
      female_id: "89329",
      male: "https://workoutlabs.com/train/wp-content/uploads/2023/05/180_Jump_Squats_anim-c.gif",
      male_id: "89328",
    },
    permalink:
      "https://workoutlabs.com/fit/exercise-guide/180-twisting-jump-squats/",
    type: "Work Out",
    tags: "legs",
    isCardio: false,
    isNewEx: false,
    presetNotes:
      "Be sure to land softly. Alternate directions, and use your arms for momentum. Keep that core tight!",
    isPersonalPresetNote: false,
    isYoga: false,
    sanskrit: "",
    sanskritRaw: "",
    alignmentCues: "",
    commonName: "Twisting Jump Squats",
    eet: "",
    isYogaPremium: false,
    audio: "",
    isFav: false,
  },
  {
    exerciseId: 10232,
    title: "Push-ups",
    titleRaw: "Push-ups",
    img: {
      male: "https://example.com/pushup-male.svg",
      female: "https://example.com/pushup-female.svg",
    },
    type: "Strength",
    tags: "chest, arms, core",
    isCardio: false,
    isNewEx: false,
    presetNotes:
      "Keep your body in a straight line from head to toe. Lower until your chest nearly touches the ground.",
    isPersonalPresetNote: false,
    isYoga: false,
    commonName: "Standard Push-up",
    isFav: true,
  },
  {
    exerciseId: 10233,
    title: "Downward Dog",
    titleRaw: "Downward Dog",
    img: {
      male: "https://example.com/downward-dog-male.svg",
      female: "https://example.com/downward-dog-female.svg",
    },
    type: "Yoga",
    tags: "flexibility, strength",
    isCardio: false,
    isNewEx: false,
    presetNotes:
      "Create an inverted V shape with your body. Keep your hands shoulder-width apart.",
    isPersonalPresetNote: false,
    isYoga: true,
    sanskrit: "Adho Mukha Svanasana",
    sanskritRaw: "Adho Mukha Svanasana",
    commonName: "Downward Facing Dog",
    isFav: false,
  },
  {
    exerciseId: 10234,
    title: "Burpees",
    titleRaw: "Burpees",
    img: {
      male: "https://example.com/burpee-male.svg",
      female: "https://example.com/burpee-female.svg",
    },
    type: "Cardio",
    tags: "full body, cardio",
    isCardio: true,
    isNewEx: false,
    presetNotes:
      "Start standing, squat down, jump back to plank, do a push-up, jump feet back to squat, then jump up.",
    isPersonalPresetNote: false,
    isYoga: false,
    commonName: "Squat Thrust",
    isFav: false,
  },
  {
    exerciseId: 10235,
    title: "Mountain Climbers",
    titleRaw: "Mountain Climbers",
    img: {
      male: "https://example.com/mountain-climber-male.svg",
      female: "https://example.com/mountain-climber-female.svg",
    },
    type: "Cardio",
    tags: "core, cardio, legs",
    isCardio: true,
    isNewEx: true,
    presetNotes:
      "Start in plank position and alternate bringing knees to chest rapidly.",
    isPersonalPresetNote: false,
    isYoga: false,
    commonName: "Running Plank",
    isFav: true,
  },
];

async function main() {
  console.log("Seeding exercises...");

  for (const exercise of sampleExercises) {
    await db.exercise.upsert({
      where: { exerciseId: exercise.exerciseId },
      update: exercise,
      create: exercise,
    });
  }

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
