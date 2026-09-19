import type { Depth, Session } from "@/lib/types";

/**
 * The easy-language report: what's happening in the body, why this plan, what will happen,
 * how to prepare and recover, and when to call.
 * Server-safe (no client hooks) so it renders on the printable /r/[id] page too.
 */
export default function Report({ session, depth = "standard", withImages = true }: { session: Session; depth?: Depth; withImages?: boolean }) {
  const { plan } = session;
  const date = new Date(session.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const list = (items: string[]) => (
    <ul className="space-y-1.5">
      {items.map((t) => (
        <li key={t} className="flex gap-2.5">
          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-current opacity-40" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <article className="space-y-8 text-[15px] leading-relaxed text-[#192837]">
      <header className="border-b border-black/10 pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#4A1D96]">Opero · Your care, explained</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{plan.procedureName}</h1>
        <p className="mt-2 text-sm text-black/55">
          {session.patientName ? `For ${session.patientName} · ` : ""}Prepared by {session.doctorName} · {date}
        </p>
      </header>

      <section>
        <h2 className="mb-2 text-lg font-semibold">In short</h2>
        <p>{plan.summary[depth]}</p>
      </section>

      {plan.condition && (
        <section className="break-inside-avoid rounded-2xl bg-[#F6F1FB] p-5">
          <h2 className="mb-1 text-lg font-semibold">What&apos;s happening in your body</h2>
          <p className="mb-2 text-sm font-medium text-[#4A1D96]">{plan.condition.name}</p>
          <p>{plan.condition.explanation[depth]}</p>
        </section>
      )}

      {plan.approach && (
        <section className="break-inside-avoid">
          <h2 className="mb-2 text-lg font-semibold">Why this plan is right for you</h2>
          {plan.approach.whyThisPlan.length > 0 ? (
            list(plan.approach.whyThisPlan)
          ) : (
            <p className="text-black/70">{session.doctorName} chose this plan for you. You can always ask them why it&apos;s the best fit.</p>
          )}
          {plan.approach.otherOptions.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-2 font-semibold">Other options {session.doctorName} mentioned</h3>
              <ul className="space-y-1.5">
                {plan.approach.otherOptions.map((o) => (
                  <li key={o.name}>
                    <span className="font-medium">{o.name}:</span> <span className="text-black/70">{o.note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {plan.approach.outlook && <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-emerald-950">{plan.approach.outlook}</p>}
        </section>
      )}

      <section>
        <h2 className="mb-4 text-lg font-semibold">What will happen, step by step</h2>
        <ol className="space-y-5">
          {plan.steps.map((s, i) => (
            <li key={i} className="flex gap-4 break-inside-avoid">
              {withImages && session.images?.[i] ? (
                // eslint-disable-next-line @next/next/no-img-element -- data URLs from our own renderer
                <img src={session.images[i]} alt="" className="aspect-[4/3] w-28 shrink-0 rounded-xl object-cover sm:w-36" />
              ) : (
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#4A1D96]/10 text-sm font-semibold text-[#4A1D96]">{i + 1}</span>
              )}
              <div>
                <p className="font-semibold">
                  {i + 1}. {s.title}
                </p>
                <p className="mt-0.5 text-black/70">{s.text[depth]}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {plan.instructions.before.length > 0 && (
        <section className="break-inside-avoid">
          <h2 className="mb-2 text-lg font-semibold">Getting ready</h2>
          {list(plan.instructions.before)}
        </section>
      )}
      {plan.instructions.after.length > 0 && (
        <section className="break-inside-avoid">
          <h2 className="mb-2 text-lg font-semibold">Looking after yourself</h2>
          {list(plan.instructions.after)}
        </section>
      )}
      {plan.instructions.callDoctorIf.length > 0 && (
        <section className="break-inside-avoid rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-950">
          <h2 className="mb-2 text-lg font-semibold">Call {session.doctorName} if</h2>
          {list(plan.instructions.callDoctorIf)}
          <p className="mt-3 text-sm opacity-80">If it feels like an emergency, call your local emergency number.</p>
        </section>
      )}
      {plan.glossary.length > 0 && (
        <section className="break-inside-avoid">
          <h2 className="mb-3 text-lg font-semibold">Words you might hear</h2>
          <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {plan.glossary.map((g) => (
              <div key={g.term} className="text-sm">
                <dt className="font-medium">{g.term}</dt>
                <dd className="text-black/60">{g.friendly}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <footer className="border-t border-black/10 pt-4 text-xs text-black/45">
        This report explains your care in everyday words, based on {session.doctorName}&apos;s notes. It does not replace medical advice. Ask your
        care team if anything is unclear.
      </footer>
    </article>
  );
}
