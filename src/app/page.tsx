import Hero from "@/components/Hero";
import Sections from "@/components/Sections";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="w-full flex-1" style={{ background: "#FCE8EE", color: "var(--color-text)", fontFamily: "var(--font-body)" }}>
      <Hero />
      <Sections />
      <Footer />
    </div>
  );
}
