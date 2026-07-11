'use client';

import { useState, useRef, useEffect } from 'react';
import { useFaceRecognition } from '@/hooks/useFaceRecognition';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { Camera, ScanFace, CheckCircle2, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { storeFaceDescriptors } from '@/lib/services/face.service';
import { getActiveEmployees, updateUserDoc } from '@/lib/services/user.service';
import { User } from '@/types';

export default function AdminFaceRegistrationPage() {
  const { modelsLoaded, loadModels, registerFace } = useFaceRecognition();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [employees, setEmployees] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadModels();
    loadEmployees();
  }, [loadModels]);

  const loadEmployees = async () => {
    try {
      const emps = await getActiveEmployees();
      setEmployees(emps);
    } catch (error) {
      toast.error('Failed to load employees');
    }
  };

  const startCamera = async () => {
    if (!selectedUser) {
      toast.error('Please select an employee first');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraOn(true);
      }
    } catch (error) {
      toast.error('Could not access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraOn(false);
    }
  };

  const handleRegister = async () => {
    if (!videoRef.current || !selectedUser) return;
    
    setIsRegistering(true);
    setProgress(10);
    
    try {
      const interval = setInterval(() => {
        setProgress(p => Math.min(p + 15, 90));
      }, 500);

      const descriptors = await registerFace(videoRef.current);
      if (!descriptors) throw new Error('Registration failed');
      
      await storeFaceDescriptors(selectedUser.uid, descriptors);
      await updateUserDoc(selectedUser.uid, { faceRegistered: true });
      
      clearInterval(interval);
      setProgress(100);
      toast.success(`Face registered for ${selectedUser.name}!`);
      stopCamera();
      
      // Update local list
      setEmployees(prev => prev.map(emp => 
        emp.uid === selectedUser.uid ? { ...emp, faceRegistered: true } : emp
      ));
      setSelectedUser(prev => prev ? { ...prev, faceRegistered: true } : null);
      
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
      setProgress(0);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Face Registration</h1>
          <p className="text-gray-400">Register employee faces for attendance tracking.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="flex flex-col justify-start space-y-6">
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Select Employee</label>
            <select
              className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              value={selectedUser?.uid || ''}
              onChange={(e) => {
                const user = employees.find(emp => emp.uid === e.target.value);
                setSelectedUser(user || null);
                if (isCameraOn) stopCamera();
              }}
              disabled={isCameraOn}
            >
              <option value="">-- Choose an employee --</option>
              {employees.map(emp => (
                <option key={emp.uid} value={emp.uid}>
                  {emp.name} ({emp.employeeID}) {emp.faceRegistered ? ' - Registered' : ''}
                </option>
              ))}
            </select>
          </div>

          {selectedUser && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-blue-400" /> Registration Guidelines
              </h2>
              <ul className="space-y-3 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
                  Ensure the employee is well-lit and facing the camera.
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
                  Have them remove glasses, hats, or masks.
                </li>
              </ul>
            </div>
          )}

          <div className="pt-6 border-t border-white/10">
            {!modelsLoaded ? (
              <div className="flex items-center gap-3 text-blue-400 bg-blue-500/10 p-4 rounded-xl">
                <Spinner size="sm" /> Initializing AI Models...
              </div>
            ) : !selectedUser ? (
              <div className="text-gray-500 text-sm">Please select an employee to begin.</div>
            ) : !isCameraOn ? (
              <Button className="w-full" size="lg" icon={<Camera className="w-5 h-5"/>} onClick={startCamera}>
                {selectedUser.faceRegistered ? 'Re-register Face' : 'Start Registration'}
              </Button>
            ) : (
              <div className="space-y-4">
                <Button 
                  className="w-full" 
                  size="lg"
                  disabled={isRegistering}
                  onClick={handleRegister}
                >
                  {isRegistering ? 'Scanning Face...' : 'Capture Face'}
                </Button>
                {isRegistering && (
                  <div className="space-y-2">
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-center text-xs text-gray-400">{progress}% Complete</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        <Card className="overflow-hidden p-0 relative bg-black flex flex-col min-h-[400px]">
          <div className="absolute inset-0 flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transition-opacity duration-300 ${isCameraOn ? 'opacity-100' : 'opacity-0'}`}
            />
            {!isCameraOn && (
              <div className="text-center text-gray-500 flex flex-col items-center gap-3">
                <ScanFace className="w-12 h-12 opacity-50" />
                <span>Camera Preview</span>
              </div>
            )}
            
            {isCameraOn && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-72 border-2 border-dashed border-white/50 rounded-[40%] flex items-center justify-center">
                   {isRegistering && (
                     <div className="absolute inset-0 bg-blue-500/20 rounded-[40%] animate-pulse" />
                   )}
                </div>
              </div>
            )}
          </div>
          
          {isCameraOn && !isRegistering && (
            <div className="absolute bottom-4 right-4 z-20">
              <Button variant="danger" size="sm" onClick={stopCamera}>
                Cancel
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
