import { LandingNavbar } from "./sections/LandingNavbar";
import { LandingHero } from "./sections/LandingHero";
import { LandingMarquee } from "./sections/LandingMarquee";
import { FeaturedProductsSection } from "./sections/FeaturedProductsSection";
import { FeaturesSection } from "./sections/FeaturesSection";
import { TestimonialsSection } from "./sections/TestimonialsSection";
import { StoryBanner } from "./sections/StoryBanner";
import { StatsSection } from "./sections/StatsSection";
import { NewsletterSection } from "./sections/NewsletterSection";
import { LandingFooter } from "./sections/LandingFooter";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden">
      <LandingNavbar />
      <LandingHero />
      <LandingMarquee />
      <FeaturedProductsSection />
      <FeaturesSection />
      <TestimonialsSection />
      <StoryBanner />
      <StatsSection />
      <NewsletterSection />
      <LandingFooter />
    </div>
  );
}
