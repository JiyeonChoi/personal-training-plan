// ─────────────────────────────────────────────────────────────
//  YOUR WORKOUTS — this is the only file you need to edit.
// ─────────────────────────────────────────────────────────────
//
//  Each workout shows up as a tab at the top of the page.
//  Each exercise has these fields (only `name` is required):
//
//    no         "1", "7.1", "7.2"…  Exercises sharing the same number before
//               the dot (7.1, 7.2, 7.3) are grouped as a superset.
//    name       Exercise name.
//    component  "warmup" | "activation" | "resistance" | "cooldown"
//    target     "Stretch", "Abs", "Glute"… (any text)
//    min        Minutes.
//    sets, reps Numbers. Use `reps: "30s"` for timed holds.
//    notes      Coaching cues, shown under the exercise.
//    image      One image, or a list: ["media/a.svg", "media/b.svg"].
//               Put image files in the media/ folder, or use a full https:// link.
//    video      A YouTube or Vimeo link, or a video file like "media/swing.mp4".
//
//  Example with media:
//    { no: "3", name: "Kettlebell Swings", component: "warmup", target: "Stretch",
//      min: 3, sets: 2, reps: 5,
//      notes: "Hinge at the hips, squeeze glutes at the top.",
//      image: "media/kb-swing.svg",
//      video: "https://www.youtube.com/watch?v=XXXXXXXXXXX" },

window.WORKOUTS = [
  {
    id: "8",
    title: "Workout 8",
    intro: "Go at your own pace. Tap an exercise to see the demo, tick it off when you're done.",
    exercises: [
      { no: "1", name: "90/90 Hip Rotation", component: "warmup", target: "Stretch", min: 5, sets: 2, reps: 3,
        image: ["media/hip-rotation-1.svg", "media/hip-rotation-2.svg"] },
      { no: "2", name: "Standing Leg Circle", component: "warmup", target: "Stretch", min: 5, sets: 2, reps: 10,
        image: ["media/standing-leg-circle-1.svg", "media/standing-leg-circle-2.svg"] },
      { no: "3", name: "Arm Circles", component: "warmup", target: "Stretch", min: 5, sets: 2, reps: 10,
        image: ["media/arm-circles-1.svg", "media/arm-circles-2.svg"] },

      { no: "4", name: "Leg Raises", component: "activation", target: "Abs", min: 5, sets: 3, reps: 5,
        image: ["media/leg-raises-1.svg", "media/leg-raises-2.svg"] },
      { no: "5", name: "Plank Dips", component: "activation", target: "Abs", min: 5, sets: 3, reps: 10,
        image: ["media/plank-1.svg", "media/plank-2.svg"] },

      { no: "6.1", name: "Goblet Squat", component: "resistance", target: "Glute · Quad", min: 5, sets: 3, reps: 10, notes: "10 - 15 lbs",
        image: ["media/goblet-squat-1.svg", "media/goblet-squat-2.svg"] },
      { no: "6.2", name: "Russian Twist", component: "resistance", target: "Abs", min: 5, sets: 3, reps: 10, notes: "5 - 10 lbs",
        image: ["media/russian-twist-1.svg", "media/russian-twist-2.svg"] },
      { no: "6.3", name: "DB Tricep Extension", component: "resistance", target: "Triceps", min: 5, sets: 3, reps: 10, notes: "5 lbs",
        image: ["media/db-tricep-extension-1.svg", "media/db-tricep-extension-2.svg"] },

      { no: "7", name: "DB Shoulder Press", component: "resistance", target: "Shoulder", min: 5, sets: 3, reps: 10, notes: "5 lbs x 2",
        image: ["media/db-shoulder-press-1.svg", "media/db-shoulder-press-2.svg"] },
      { no: "8", name: "Lat Pulldown", component: "resistance", target: "Back", min: 5, sets: 3, reps: 10, notes: "30 - 40 lbs?",
        image: ["media/lat-pulldown-1.svg", "media/lat-pulldown-2.svg"] },
      { no: "9", name: "Abductor Machine", component: "resistance", target: "Glute", min: 5, sets: 3, reps: 10,
        image: ["media/abductor-machine-1.svg", "media/abductor-machine-2.svg"] },

      { no: "10", name: "Cool Down Stretches", component: "cooldown", target: "Stretch", min: 5, sets: 1, reps: 10,
        notes: "1. Hip flexor stretch\n2. Shoulder stretch\n3. Arms up\n4. Upward dog\n5. Downward dog\n6. Forward fold\n7. Cat cow\n8. Superman\n9. Child’s pose\n10. Seated forward fold\n11. Knee to chest stretch",
        image: ["media/cooldown-1.svg", "media/cooldown-2.svg", "media/cooldown-3.svg", "media/cooldown-4.svg", "media/cooldown-5.svg", "media/cooldown-6.svg", "media/cooldown-7.svg", "media/cooldown-8.svg", "media/cooldown-9.svg", "media/cooldown-10.svg", "media/cooldown-11.svg"] },
    ],
  },
];

// Section names and colours. Change the labels if you like.
window.COMPONENTS = {
  warmup:     { label: "Warm-up",             color: "#2f6feb" },
  activation: { label: "Activation",          color: "#d9701a" },
  resistance: { label: "Resistance Training", color: "#6b5bd6" },
  cooldown:   { label: "Cool-down",           color: "#dc2626" },
};
