// app/page.tsx
import { getServerSession } from "next-auth"; 
import { NEXT_AUTH_CONFIG } from "@/lib/nextAuthConfig"; 
import Link from "next/link";
import Particles from "@/components/ui/Particles";
import { Sparkles, Zap, DollarSign, Layout, BookOpen, Users } from "lucide-react";
import NavBar from "@/components/ui/NavBar";
import Footer from "@/components/ui/Footer";

export default async function Home() {
  const session = await getServerSession(NEXT_AUTH_CONFIG);

  const features = [
    {
      icon: Sparkles,
      title: "AI That Challenges You",
      description:
        "Receive carefully crafted prompts, counter-questions, and critiques designed to push your thinking — not just generate answers."
    },
    {
      icon: Layout,
      title: "Visual System Designer",
      description:
        "Drag, drop, and connect components to build real-world architectures while instantly seeing improvement suggestions."
    },
    {
      icon: BookOpen,
      title: "Learn by Solving",
      description:
        "Work on beginner to advanced problems, architecture breakdowns, scalability exercises, and real system case studies."
    },
    {
      icon: Users,
      title: "Interview-Ready Framework",
      description:
        "Follow guided templates and mental models to structure responses clearly — perfect for FAANG-style interviews."
    },
    {
      icon: Zap,
      title: "Smart Knowledge Retrieval",
      description:
        "Get factual insights powered by curated system design knowledge, not generic or outdated internet content."
    },
    {
      icon: DollarSign,
      title: "Build & Evaluate Systems",
      description:
        "Configure storage, caching, APIs, load balancers, queues, consistency models, and more — just like production engineers."
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Understand the Problem",
      description:
        "Start with requirements and constraints — the foundation of all real system design thinking."
    },
    {
      number: "02",
      title: "Design & Visualize",
      description:
        "Use the editor to map architecture, choose technologies, and explore trade-offs interactively."
    },
    {
      number: "03",
      title: "Get AI Evaluation",
      description:
        "Receive structured feedback, alternative approaches, scalability insights, and improvement suggestions."
    },
    {
      number: "04",
      title: "Practice & Master",
      description:
        "Solve new problems, refine your thought process, acquired new skills and develop confidence to build at any scale."
    }
  ];

  return (
    <> <NavBar/>
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Animated Particles Background */}
      <div className="fixed inset-0 z-0 w-full h-full">
        <Particles
          particleColors={['#ffffff', '#ffffff', '#ffffff']}
          particleCount={400}
          particleSpread={12}
          speed={0.08}
          particleBaseSize={80}
          moveParticlesOnHover={true}
          particleHoverFactor={1.5}
          alphaParticles={true}
          sizeRandomness={1.2}
          cameraDistance={20}
          disableRotation={false}
        />
      </div>

      {/* Gradient Overlay for better readability */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-background/90 via-background/80 to-background/90"></div>

      {/* Content */}
      <div className="relative z-20">
        {/* Hero Section */}
        <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
              Learn System Design
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-500 to-purple-600">
                Through Real Thinking & Practice
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
              Build your judgment, improve reasoning, and learn scalable architecture the way
              real engineers do: by designing, breaking, improving, and understanding systems—
              with AI guiding you through every decision.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {session ? (
                <>
                  <Link
                    href="/design"
                    className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    Start Designing
                    <Sparkles className="ml-2 h-5 w-5" />
                  </Link>
                  <Link
                    href="/problems"
                    className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-xl border-2 border-primary text-foreground hover:bg-primary/10 transition-all hover:scale-105 backdrop-blur-sm bg-background/40"
                  >
                    Practice Problems
                    <BookOpen className="ml-2 h-5 w-5" />
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    Get Started Free
                    <Zap className="ml-2 h-5 w-5" />
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-xl border-2 border-primary text-foreground hover:bg-primary/10 transition-all hover:scale-105 backdrop-blur-sm bg-background/40"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-foreground mb-4">
                Everything You Need to Excel
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Our platform combines cutting-edge AI with practical tools to make system design accessible and efficient.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="group relative bg-card/80 backdrop-blur-md border-2 border-border/70 rounded-2xl p-8 hover:border-primary/50 transition-all hover:shadow-xl hover:scale-105"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative">
                      <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                        <Icon className="h-7 w-7 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-foreground mb-4">
                How It Works
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                From concept to implementation in four simple steps.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step, index) => (
                  <div key={index} className="relative">
                    <div className="bg-card/80 backdrop-blur-md border-2 border-border/70 rounded-2xl p-8 hover:border-primary/50 transition-all hover:shadow-lg">
                    <div className="text-6xl font-bold text-primary/20 mb-4">
                      {step.number}
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary to-transparent"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>



        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-br from-primary/10 via-transparent to-blue-500/10 border border-primary/20 rounded-3xl p-12 backdrop-blur-md">
              <h2 className="text-4xl font-bold text-foreground mb-6">
                Ready to Think Like a Systems Engineer?
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Start learning the way real architects grow — by solving meaningful problems,
                visualizing ideas, and improving through feedback and iteration.
              </p>
              {!session && (
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Start Your Journey
                  <Sparkles className="ml-2 h-5 w-5" />
                </Link>
              )}
            </div>
          </div>
        </section>          
      </div>
    </div>
    <Footer/>
    </>
  );
}