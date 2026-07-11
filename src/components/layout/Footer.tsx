import Link from 'next/link';
import { Shield, MessageCircle, Globe, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#0a0a0a] border-t border-white/10 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Shield className="w-6 h-6 text-blue-500" />
              <span className="font-bold text-xl text-white">AttendGuard</span>
            </Link>
            <p className="text-gray-400 text-sm max-w-sm mb-6 leading-relaxed">
              Modern employee attendance management system with state-of-the-art face recognition, 
              real-time analytics, and comprehensive reporting.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg">
                <Globe className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg">
                <MessageCircle className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-white mb-4">Company</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/about" className="text-gray-400 hover:text-blue-400 transition-colors">About</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Careers</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Product</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/#features" className="text-gray-400 hover:text-blue-400 transition-colors">Features</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Pricing</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Security</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Resources</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Docs</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Blog</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Support</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} AttendGuard. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-gray-300 transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-gray-300 transition-colors">Terms</Link>
            <Link href="#" className="hover:text-gray-300 transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
