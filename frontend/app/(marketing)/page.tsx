import { Agents, CTA, DashboardPreview, Documents, FAQ, Features, Footer } from "@/components/shared/landing-sections";
import { Hero } from "@/components/shared/hero";
import { Navbar } from "@/components/shared/navbar";

export default function Home() {
  return (
    <main id="top" className="overflow-hidden">
      <Navbar />
      <Hero />
      <Features />
      <Agents />
      <DashboardPreview />
      <Documents />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}
