'use client';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  ScanFace, LayoutDashboard, BarChart3, Users, 
  Shield, Smartphone, ArrowRight, CheckCircle2 
} from 'lucide-react';

const features = [
  { icon: ScanFace, title: 'Face Recognition', desc: 'Secure, contactless attendance using advanced AI models' },
  { icon: LayoutDashboard, title: 'Real-time Dashboard', desc: 'Instant insights into employee attendance and status' },
  { icon: BarChart3, title: 'Detailed Reports', desc: 'Exportable CSV/Excel reports and visual analytics' },
  { icon: Users, title: 'Employee Management', desc: 'Easy onboarding and role-based access control' },
  { icon: Shield, title: 'Enterprise Security', desc: 'Bank-grade encryption and secure data storage' },
  { icon: Smartphone, title: 'Mobile Ready', desc: 'Responsive design that works perfectly on any device' }
];

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col overflow-hidden">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none" />
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative z-10 max-w-4xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Next-Gen Attendance System
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-8 leading-tight">
              Smart Attendance with <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600 animate-gradient">
                Face Recognition
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Transform your workplace with AI-powered, contactless check-ins. 
              Secure, fast, and completely automated employee attendance management.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8" onClick={() => router.push('/signup')}>
                Get Started <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="secondary" className="w-full sm:w-auto text-lg px-8" onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}>
                Learn More
              </Button>
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-white/[0.02] border-y border-white/5 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Powerful Features</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">Everything you need to manage your workforce efficiently and securely.</p>
            </motion.div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card hover className="h-full bg-[#111] border-white/5">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6">
                      <feature.icon className="w-6 h-6 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How It Works</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">Three simple steps to seamless attendance.</p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500/0 via-blue-500/20 to-blue-500/0 -translate-y-1/2 -z-10" />
              
              {[
                { step: '01', title: 'Register', desc: 'Create your account and complete your profile setup.' },
                { step: '02', title: 'Scan Face', desc: 'Quick one-time registration of your face for secure matching.' },
                { step: '03', title: 'Mark Attendance', desc: 'Simply face the camera to check in and out instantly.' }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  className="bg-[#111] border border-white/5 p-8 rounded-2xl relative"
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-[#1a1a1a] border-2 border-blue-500/30 rounded-full flex items-center justify-center text-blue-400 font-bold">
                    {item.step}
                  </div>
                  <div className="text-center mt-6">
                    <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                    <p className="text-gray-400">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 to-[#0a0a0a]" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Transform Your Attendance?</h2>
              <p className="text-xl text-gray-400 mb-10">Join thousands of modern companies using AttendGuard.</p>
              <Button size="lg" className="text-lg px-10 py-4 shadow-blue-500/20" onClick={() => router.push('/signup')}>
                Create Free Account
              </Button>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
