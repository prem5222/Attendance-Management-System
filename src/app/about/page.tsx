'use client';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { motion } from 'framer-motion';
import Card from '@/components/ui/Card';
import { Lightbulb, ShieldCheck, Zap } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">About AttendGuard</h1>
          <p className="text-xl text-gray-400">
            We're building the future of workplace attendance with secure, 
            frictionless, AI-powered solutions.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {[
            { icon: Lightbulb, title: 'Innovation', desc: 'Pushing boundaries with cutting-edge face recognition technology.' },
            { icon: ShieldCheck, title: 'Security', desc: 'Enterprise-grade protection for all your sensitive employee data.' },
            { icon: Zap, title: 'Simplicity', desc: 'Intuitive interfaces that require zero training to use effectively.' }
          ].map((v, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="text-center h-full">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10 mb-4">
                  <v.icon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{v.title}</h3>
                <p className="text-gray-400">{v.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="bg-[#111] border border-white/5 rounded-3xl p-8 md:p-12 text-center"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">Our Tech Stack</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {['Next.js 15', 'React 19', 'TypeScript', 'Tailwind CSS', 'Firebase', 'Face-api.js'].map(tech => (
              <span key={tech} className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-gray-300 font-medium">
                {tech}
              </span>
            ))}
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
