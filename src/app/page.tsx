import { redirect } from "next/navigation";
import Hero from "@/components/Hero";
import Sections from "@/components/Sections";
import Footer from "@/components/Footer";
import { getSignedInEmail } from "@/lib/session";

export default async function Home() {
  // Signed-in doctors go straight to their dashboard; the landing page is for visitors.
  if (await getSignedInEmail()) redirect("/dashboard");
  return (
    <div className="w-full flex-1" style={{ background: "#FCE8EE", color: "var(--color-text)", fontFamily: "var(--font-body)" }}>
      <Hero />
      <Sections />
      <Footer />
    </div>
  );
}
