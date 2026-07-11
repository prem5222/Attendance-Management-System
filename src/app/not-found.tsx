import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-blue-800">
          404
        </h1>
        <h2 className="text-2xl font-bold text-white">Page Not Found</h2>
        <p className="text-gray-400">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <div className="pt-4">
          <Link href="/">
            <Button size="lg">Go Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
