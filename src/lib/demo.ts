import type { Plan, Session } from "./types";

export const SAMPLE_NOTES = `Pt: 46F, symptomatic cholelithiasis w/ recurrent biliary colic. Plan: elective laparoscopic cholecystectomy under general anesthesia.
Procedure: Pneumoperitoneum established via Veress needle, insufflation of the peritoneal cavity with CO2 to 15 mmHg. Four trocar ports placed (umbilical 12mm, epigastric 5mm, two RUQ 5mm). Critical view of safety obtained, cystic duct and cystic artery clipped and divided. Gallbladder dissected from liver bed with electrocautery and extracted via umbilical port in retrieval bag. Hemostasis confirmed. Fascia closed, skin closed with absorbable subcuticular sutures + skin glue.
Pre-op: NPO after midnight. Hold aspirin 7 days prior. Arrive 2h early.
Post-op: Expected same-day discharge after PACU monitoring. Shoulder tip pain from residual CO2 is common, resolves 24-48h. Walk frequently. No lifting >10 lbs for 2 weeks. May shower after 24h, no baths/swimming for 2 weeks. Low-fat diet first week. Acetaminophen as needed.
Return precautions: fever >101F, jaundice, worsening abdominal pain, redness or discharge at port sites, persistent vomiting.`;

const L = (calm: string, standard: string, detailed: string) => ({ calm, standard, detailed });

export const DEMO_PLAN: Plan = {
  procedureName: "Gallbladder removal (keyhole surgery)",
  summary: L(
    "Your doctor will gently take out your gallbladder while you sleep, and you can usually go home the same day.",
    "Your gallbladder has been causing you pain. Your doctor will take it out through a few tiny openings while you are fully asleep. Most people go home the same day.",
    "Your gallbladder is a small pouch under your liver. Little stones inside it have been causing your pain. Your doctor will remove it using keyhole surgery: a few tiny openings, a small camera, and special tools. You will be fully asleep, and most people go home the same day. Your body works just fine without a gallbladder."
  ),
  condition: {
    name: "Gallstones",
    explanation: L(
      "Small stones in your gallbladder have been causing your pain. This is very common and very treatable.",
      "Your gallbladder is a small pouch under your liver that helps you digest fatty food. Little stones, called gallstones, have formed inside it. When they block the way out, they cause the pain attacks you've been feeling. This is very common, and nothing you did wrong.",
      "Your gallbladder is a small pouch tucked under your liver. It stores a liquid that helps you digest fatty food. Sometimes tiny stones, called gallstones, form inside it. When a stone blocks the small exit tube, the gallbladder squeezes against it, and that causes the pain attacks you've been having. Gallstones are very common, they are nobody's fault, and they are very treatable."
    ),
  },
  approach: {
    whyThisPlan: [
      "The pain attacks keep coming back, and taking the gallbladder out stops them.",
      "Keyhole surgery uses a few tiny openings instead of one large one.",
      "Most people go home the same day.",
    ],
    otherOptions: [],
    outlook: "Most people go home the same day and feel much better once they've healed, and your body works just fine without a gallbladder.",
  },
  steps: [
    {
      title: "Welcome — here's the plan",
      scene: "welcome",
      region: "upper-abdomen",
      text: L(
        "Your care team will look after you the whole time.",
        "Today your doctor will take out your gallbladder, a small pouch under your liver that has been causing pain.",
        "Your gallbladder sits on the right side of your belly, under your liver. Small stones inside it have been causing your pain. Taking it out stops that pain, and your body works well without it."
      ),
      narration: L(
        "Hi there. Your care team is going to look after you the whole time. Let's walk through it together, one small step at a time.",
        "Hi there. Today your doctor is going to take out your gallbladder. It's a small pouch that sits under your liver, and it has been causing you pain. Let's walk through what happens, one gentle step at a time.",
        "Hi there. Let's walk through your procedure together. Your gallbladder is a small pouch on the right side of your belly, tucked under your liver. Little stones inside it have been causing your pain. Taking it out stops that pain, and your body works perfectly well without it."
      ),
    },
    {
      title: "You'll be fully asleep",
      scene: "sleep",
      region: "head",
      text: L(
        "You will sleep through everything and feel nothing.",
        "A special doctor will give you medicine so you are in a deep, safe sleep. You won't feel or remember anything.",
        "An anesthesia doctor will give you medicine that puts you in a deep, safe sleep. They stay with you the entire time, watching your breathing and heart. You won't feel or remember the procedure."
      ),
      narration: L(
        "First, you'll drift into a deep, comfortable sleep. You won't feel anything at all.",
        "First, a special doctor will give you medicine so you fall into a deep, safe sleep. You won't feel anything, and you won't remember it afterwards.",
        "First, an anesthesia doctor will give you medicine that places you in a deep, safe sleep. They stay right beside you the whole time, keeping an eye on your breathing and your heart. You won't feel anything, and you won't remember the procedure."
      ),
    },
    {
      title: "A little room to see",
      scene: "inflate",
      region: "lower-abdomen",
      text: L(
        "Your doctor makes a little space so they can see clearly.",
        "Your belly is gently filled with a harmless gas, like a balloon, so your doctor has room to see and work.",
        "Your doctor gently fills your belly with carbon dioxide, a harmless gas. It lifts things up like a small balloon so there's room to see and work safely. Afterwards, a little leftover gas can cause a shoulder ache for a day or two."
      ),
      narration: L(
        "Next, your doctor makes a little room inside so they can see clearly.",
        "Next, your belly is gently filled with a harmless gas, a bit like blowing up a small balloon. This gives your doctor room to see and work safely.",
        "Next, your doctor gently fills your belly with a harmless gas called carbon dioxide. It's a bit like blowing up a small balloon, which lifts things apart so there's room to see and work safely. Some people notice a shoulder ache from the leftover gas for a day or two. That's normal and goes away on its own."
      ),
    },
    {
      title: "Tiny openings and a small camera",
      scene: "camera",
      region: "upper-abdomen",
      text: L(
        "A tiny camera helps your doctor see.",
        "Your doctor makes four small, clean openings and uses a tiny camera to see inside on a screen.",
        "Your doctor makes four small, clean openings, the biggest near your belly button. A thin camera goes through one, showing a clear picture on a screen, and slim tools go through the others."
      ),
      narration: L(
        "A tiny camera helps your doctor see everything clearly on a screen.",
        "Your doctor makes four small, clean openings. A tiny camera goes through one of them, so your doctor can see everything clearly on a screen.",
        "Your doctor makes four small, clean openings. The biggest one is near your belly button. A thin camera goes through one opening and shows a clear picture on a screen, and slim tools go through the others. This is why it's called keyhole surgery."
      ),
    },
    {
      title: "Taking out the gallbladder",
      scene: "remove",
      region: "upper-abdomen",
      text: L(
        "Your doctor gently takes out the gallbladder.",
        "Your doctor carefully closes off the gallbladder and lifts it out through the opening by your belly button.",
        "Your doctor carefully closes off the small tubes connected to the gallbladder, then gently separates it and places it in a little pouch. The pouch comes out through the opening by your belly button."
      ),
      narration: L(
        "Then, your doctor gently takes out the gallbladder.",
        "Then your doctor carefully closes off the gallbladder and lifts it out through the small opening near your belly button.",
        "Then your doctor carefully closes off the small tubes connected to your gallbladder. They gently separate it, place it in a little pouch, and lift it out through the small opening near your belly button."
      ),
    },
    {
      title: "Closing up neatly",
      scene: "close",
      region: "lower-abdomen",
      text: L(
        "The small openings are closed neatly.",
        "The small openings are closed with stitches that dissolve by themselves, plus a skin glue.",
        "The gas is let out and the small openings are closed with stitches under the skin that dissolve on their own, so nothing needs to be removed later. A clear skin glue seals the top."
      ),
      narration: L(
        "Finally, the small openings are closed up neatly.",
        "Finally, the small openings are closed with stitches that dissolve by themselves, sealed with a clear skin glue.",
        "Finally, the gas is let out and the small openings are closed with stitches under the skin. They dissolve by themselves, so nothing needs to be taken out later. A clear skin glue seals everything on top."
      ),
    },
    {
      title: "Waking up",
      scene: "monitor",
      region: "chest",
      text: L(
        "You'll wake up in a calm room with nurses nearby.",
        "You'll wake up in a recovery room where nurses check on you. Most people go home the same day.",
        "You'll wake up in a recovery room where nurses check your breathing, heart and comfort. Once you're awake and comfortable, most people go home the same day."
      ),
      narration: L(
        "You'll wake up in a calm room, with nurses right beside you.",
        "You'll wake up in a quiet recovery room, where nurses check on you. Most people are ready to go home the same day.",
        "You'll wake up in a quiet recovery room. Nurses will check your breathing, your heart, and how comfortable you feel. Once you're awake and settled, most people are ready to go home the same day."
      ),
    },
    {
      title: "Healing at home",
      scene: "home",
      region: "whole-body",
      text: L(
        "Rest, take short walks, and follow your care tips below.",
        "Take short walks, avoid lifting heavy things for 2 weeks, and eat low-fat food for the first week.",
        "Walk often to help your body heal. Don't lift anything heavier than 10 pounds for 2 weeks. You can shower after 24 hours, but no baths or swimming for 2 weeks. Eat low-fat food for the first week."
      ),
      narration: L(
        "At home, rest, take short walks, and follow the care tips below. You're doing great.",
        "At home, take short walks often and avoid lifting heavy things for two weeks. Eat low-fat food for the first week. You're doing great.",
        "At home, take short walks often. It really helps you heal. Don't lift anything heavier than ten pounds for two weeks. You can shower after a day, but skip baths and swimming for two weeks. And eat low-fat food for the first week. You're doing great."
      ),
    },
  ],
  glossary: [
    { term: "laparoscopic cholecystectomy", friendly: "keyhole surgery to take out the gallbladder" },
    { term: "cholelithiasis", friendly: "gallstones" },
    { term: "biliary colic", friendly: "gallbladder pain attacks" },
    { term: "general anesthesia", friendly: "a deep, safe sleep" },
    { term: "Pneumoperitoneum", friendly: "making a little room inside the belly with air" },
    { term: "Veress needle", friendly: "a tiny tube to let the air in" },
    { term: "insufflation of the peritoneal cavity", friendly: "filling your belly with a little air, like a balloon" },
    { term: "trocar ports", friendly: "small, clean openings" },
    { term: "cystic duct and cystic artery clipped and divided", friendly: "the gallbladder's small tubes are closed off" },
    { term: "dissected from liver bed with electrocautery", friendly: "gently separated from the liver" },
    { term: "retrieval bag", friendly: "a little pouch" },
    { term: "Hemostasis", friendly: "everything is calm and settled" },
    { term: "absorbable subcuticular sutures", friendly: "stitches that dissolve on their own" },
    { term: "NPO after midnight", friendly: "nothing to eat or drink after midnight" },
    { term: "PACU", friendly: "the recovery room" },
    { term: "jaundice", friendly: "yellowing of the skin or eyes" },
  ],
  instructions: {
    before: [
      "Don't eat or drink anything after midnight the night before.",
      "Stop taking aspirin 7 days before your surgery.",
      "Arrive 2 hours before your surgery time.",
    ],
    after: [
      "A shoulder ache from leftover gas is common and goes away in 1–2 days.",
      "Take short walks often.",
      "Don't lift anything heavier than 10 pounds for 2 weeks.",
      "You can shower after 24 hours. No baths or swimming for 2 weeks.",
      "Eat low-fat food for the first week.",
      "You may take acetaminophen (Tylenol) if you need it.",
    ],
    callDoctorIf: [
      "You have a fever over 101°F (38.3°C).",
      "Your skin or eyes turn yellow.",
      "Your belly pain gets worse.",
      "An opening looks red or has fluid coming out.",
      "You keep throwing up.",
    ],
  },
};

/** Keyword retrieval over the approved instructions — used only when no Gemini key is configured. */
export function demoAnswer(session: Session, question: string) {
  const q = question.toLowerCase();
  if (/(can't breathe|cannot breathe|chest pain|faint|bleeding a lot|emergency)/.test(q)) {
    return "This could be serious. Please call emergency services or your care team right away.";
  }
  const all = [
    ...session.plan.instructions.before,
    ...session.plan.instructions.after,
    ...session.plan.instructions.callDoctorIf.map((s) => `Call your doctor if: ${s}`),
  ];
  if (/(watch out|worry|warning|signs?|call (the|my) doctor)/.test(q)) {
    return `Call ${session.doctorName} if: ${session.plan.instructions.callDoctorIf.join(" ")}`;
  }
  const STOP = new Set(["when", "what", "will", "have", "does", "should", "this", "that", "after", "before", "next", "week", "weeks", "much", "long", "okay", "able", "there", "your", "with", "from", "about"]);
  const words = q.split(/\W+/).filter((w) => w.length > 3 && !STOP.has(w));
  const scored = all
    .map((line) => ({ line, score: words.filter((w) => line.toLowerCase().includes(w)).length / (words.length || 1) }))
    .filter((x) => x.score > 0.5)
    .sort((a, b) => b.score - a.score);
  if (scored.length) return scored.slice(0, 2).map((x) => x.line).join(" ");
  return `${session.doctorName} didn't cover that in your instructions. Please ask your care team — they'll be happy to help.`;
}
