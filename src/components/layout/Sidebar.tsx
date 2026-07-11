'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Shield, LayoutDashboard, Clock, History, User, ScanFace, 
  Users, ClipboardList, Settings, BarChart3, X
} from 'lucide-react';
import { NavItem } from '@/types';
import { useAuthContext } from '@/contexts/AuthContext';
import Avatar from '../ui/Avatar';
import { cn } from '@/lib/utils/helpers';

interface SidebarProps {
  items: NavItem[];
  collapsed?: boolean;
  onClose?: () => void;
  mobile?: boolean;
}

const getIcon = (name?: string) => {
  switch (name) {
    case 'LayoutDashboard': return LayoutDashboard;
    case 'Clock': return Clock;
    case 'History': return History;
    case 'User': return User;
    case 'ScanFace': return ScanFace;
    case 'Users': return Users;
    case 'ClipboardList': return ClipboardList;
    case 'Settings': return Settings;
    case 'BarChart3': return BarChart3;
    default: return LayoutDashboard;
  }
};

export default function Sidebar({ items, collapsed = false, onClose, mobile = false }: SidebarProps) {
  const pathname = usePathname();
  const { userData } = useAuthContext();

  return (
    <div className={cn(
      "flex flex-col h-full bg-[#111] border-r border-white/10 transition-all duration-300",
      collapsed ? "w-20" : "w-64"
    )}>
      {/* Header */}
      <div className="h-16 flex items-center px-4 border-b border-white/10 shrink-0">
        <Link href="/" className={cn("flex items-center gap-2", collapsed && "justify-center w-full")}>
          <div className="p-1.5 bg-blue-500/10 rounded-lg shrink-0">
            <Shield className="w-6 h-6 text-blue-500" />
          </div>
          {!collapsed && <span className="font-bold text-xl tracking-tight text-white truncate">AttendGuard</span>}
        </Link>
        {mobile && onClose && (
          <button onClick={onClose} className="ml-auto p-2 text-gray-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav Items */}
      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1 scrollbar-hide">
        {items.map((item) => {
          const Icon = getIcon(item.icon);
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={mobile ? onClose : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                isActive 
                  ? "bg-blue-500/10 text-blue-400" 
                  : "text-gray-400 hover:bg-white/5 hover:text-white",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? item.label : undefined}
            >
              {isActive && (
                <motion.div 
                  layoutId="sidebar-active"
                  className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full" 
                />
              )}
              <Icon className={cn("w-5 h-5 shrink-0 transition-colors", isActive ? "text-blue-500" : "group-hover:text-gray-300")} />
              {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
            </Link>
          );
        })}
      </div>

      {/* User Footer */}
      {userData && (
        <div className="p-4 border-t border-white/10 shrink-0">
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            <Avatar src={userData.photoURL} name={userData.name} size="sm" />
            {!collapsed && (
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-white truncate">{userData.name}</p>
                <p className="text-xs text-gray-500 truncate capitalize">{userData.role}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
