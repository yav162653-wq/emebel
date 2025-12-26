import { HeroHeader } from "./sections/HeroHeader";
import { HeroProducts } from "./sections/HeroProducts";

export default function HeroPage() {
  return (
    <div className="min-h-screen bg-background">
      <HeroHeader />
      
      <main className="container py-12 space-y-16">
        <section>
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-display text-4xl font-medium tracking-tight">New Arrivals</h2>
              <p className="text-muted-foreground mt-2">Discover our latest collection of premium furniture.</p>
            </div>
            
            <div className="hidden sm:flex gap-2">
              <span className="px-4 py-1 bg-primary text-primary-foreground rounded-full text-xs font-medium uppercase tracking-wider">All</span>
              <span className="px-4 py-1 hover:bg-secondary rounded-full text-xs font-medium uppercase tracking-wider cursor-pointer text-muted-foreground transition-colors">Chairs</span>
              <span className="px-4 py-1 hover:bg-secondary rounded-full text-xs font-medium uppercase tracking-wider cursor-pointer text-muted-foreground transition-colors">Tables</span>
              <span className="px-4 py-1 hover:bg-secondary rounded-full text-xs font-medium uppercase tracking-wider cursor-pointer text-muted-foreground transition-colors">Lighting</span>
            </div>
          </div>
          
          <HeroProducts />
        </section>

        <section className="bg-secondary/30 rounded-3xl p-12 text-center space-y-6">
          <h2 className="font-display text-3xl font-medium">Join the Designer Club</h2>
          <p className="max-w-2xl mx-auto text-muted-foreground">Get exclusive access to limited editions, early sales access, and personalized design consultation.</p>
          <div className="flex max-w-sm mx-auto gap-2">
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="flex-1 px-4 py-2 rounded-md border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button className="px-6 py-2 bg-primary text-white rounded-md font-medium text-sm">Subscribe</button>
          </div>
        </section>
      </main>
    </div>
  );
}
