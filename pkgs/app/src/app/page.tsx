import { LandingHeader } from "@/components/landing/LandingHeader";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { TechStack } from "@/components/landing/TechStack";
import { PrivacyFirst } from "@/components/landing/PrivacyFirst";
import { Footer } from "@/components/Footer";

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <LandingHeader />
      <Hero />
      <HowItWorks />
      <TechStack />
      <PrivacyFirst />
      <Footer />
    </main>
  );
}
