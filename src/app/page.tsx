import { Hero } from "@/components/Hero";
import { RegistrationForm } from "@/components/RegistrationForm";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Hero />
      
      <section id="register" className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-primary">Register for the Conference</h2>
          <div className="p-1 border border-white/10 rounded-2xl bg-gradient-to-b from-white/5 to-transparent backdrop-blur-sm">
             <RegistrationForm />
          </div>
        </div>
      </section>
    </main>
  );
}
