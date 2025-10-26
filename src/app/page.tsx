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
      title: "AI-Powered Architecture",
      description: "Generate optimized system designs using our hybrid AI approach with fine-tuned models and knowledge-based systems."
    },
    {
      icon: DollarSign,
      title: "Accurate Cost Estimates",
      description: "Get real-time cost calculations for your infrastructure with our advanced algorithmic pricing engine."
    },
    {
      icon: Layout,
      title: "Interactive Editor",
      description: "Drag-and-drop components to visualize and modify your system architecture in real-time."
    },
    {
      icon: BookOpen,
      title: "Learn by Doing",
      description: "Solve curated system design problems and learn best practices through hands-on experience."
    },
    {
      icon: Zap,
      title: "RAG-Powered Insights",
      description: "Benefit from Retrieval Augmented Generation for factually accurate and up-to-date recommendations."
    },
    {
      icon: Users,
      title: "Built for Everyone",
      description: "Whether you're a student or professional developer, our platform adapts to your learning journey."
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Sign Up & Get Credits",
      description: "Create your account and receive daily credits for designs and problem-solving."
    },
    {
      number: "02",
      title: "Describe Your System",
      description: "Tell us your requirements and let our AI generate an optimized architecture."
    },
    {
      number: "03",
      title: "Customize & Visualize",
      description: "Use the interactive editor to refine your design and see cost estimates in real-time."
    },
    {
      number: "04",
      title: "Learn & Iterate",
      description: "Solve practice problems, get feedback, and master system design principles."
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
              Master System Design
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-500 to-purple-600">
                with AI Guidance
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
              Transform complex architecture decisions into intuitive, optimized solutions. 
              Learn by doing with our AI-powered platform that combines intelligent reasoning 
              with precise cost calculations.
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

        {/* Stats Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center bg-card/80 backdrop-blur-md border-2 border-border/70 rounded-2xl p-8">
                <div className="text-5xl font-bold text-primary mb-2">10K+</div>
                <div className="text-lg text-muted-foreground">Active Users</div>
              </div>
              <div className="text-center bg-card/80 backdrop-blur-md border-2 border-border/70 rounded-2xl p-8">
                <div className="text-5xl font-bold text-primary mb-2">50K+</div>
                <div className="text-lg text-muted-foreground">Designs Generated</div>
              </div>
              <div className="text-center bg-card/80 backdrop-blur-md border-2 border-border/70 rounded-2xl p-8">
                <div className="text-5xl font-bold text-primary mb-2">95%</div>
                <div className="text-lg text-muted-foreground">Success Rate</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-br from-primary/10 via-transparent to-blue-500/10 border border-primary/20 rounded-3xl p-12 backdrop-blur-md">
              <h2 className="text-4xl font-bold text-foreground mb-6">
                Ready to Transform Your System Design Skills?
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of developers and students who are mastering system design with AI-powered guidance.
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