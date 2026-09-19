import { ALL_OUTPUTS, type Session } from "./types";

/** The one text a patient receives: what was prepared for them, and a single link to all of it. */
export function patientMessage(session: Session, link: string) {
  const o = session.outputs ?? ALL_OUTPUTS;
  const items = [o.video && "a short video", o.images && "pictures", o.report && "an easy-to-read report"].filter(Boolean) as string[];
  const list = items.length > 1 ? `${items.slice(0, -1).join(", ")} and ${items.at(-1)}` : items[0];
  const greeting = session.patientName ? `Hi ${session.patientName}, ` : "Hi, ";
  return `${greeting}${session.doctorName} prepared ${list} explaining your procedure: ${link}`;
}
