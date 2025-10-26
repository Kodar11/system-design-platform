// src/components/ui/Footer.tsx
import Link from 'next/link';
import { Mail, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-muted/50 border-t border-border py-8 mt-auto">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-6">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-semibold text-foreground mb-4">System Design Platform</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Empowering engineers to design scalable systems with interactive tools and AI-powered feedback.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-foreground mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/problems" className="text-muted-foreground hover:text-foreground transition-colors">
                  Problems
                </Link>
              </li>
              <li>
                <Link href="/docs" className="text-muted-foreground hover:text-foreground transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/design" className="text-muted-foreground hover:text-foreground transition-colors">
                  Free Design
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium text-foreground mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
                <Mail className="w-4 h-4 mr-2" />
                <a href="mailto:dummy@example.com">dummy@example.com</a>
              </li>
              <li className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
                <Linkedin className="w-4 h-4 mr-2" />
                <a href="https://linkedin.com/in/dummyuser" target="_blank" rel="noopener noreferrer">
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-6 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 System Design Platform. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;