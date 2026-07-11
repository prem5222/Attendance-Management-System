'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAttendance } from '@/hooks/useAttendance';
import { useFaceRecognition } from '@/hooks/useFaceRecognition';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { Camera, ScanFace, CheckCircle2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatTime } from '@/lib/utils/helpers';
import { getFaceDescriptors } from '@/lib/services/face.service';

export default function AttendancePage() {
  const { userData } = useAuthContext();
  const { todayAttendance, canCheckIn, canCheckOut, isComplete, handleCheckIn, handleCheckOut, loading: attLoading } = useAttendance();
  const { modelsLoaded, loadModels, verifyFace } = useFaceRecognition();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [location, setLocation] = useState<{latitude: number, longitude: number} | null>(null);

  useEffect(() => {
    loadModels();
    
    // Get location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => console.log('Location error:', err)
      );
    }
  }, [loadModels]);

  const startCamera = async () => {
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

  const handleAction = async (action: 'in' | 'out') => {
    if (!videoRef.current) return;
    
    setIsVerifying(true);
    try {
      const storedDescriptors = await getFaceDescriptors(userData!.uid);
      if (!storedDescriptors) {
        toast.error('No face data found. Please register first.');
        setIsVerifying(false);
        return;
      }

      const matchResult = await verifyFace(videoRef.current, storedDescriptors);
      if (!matchResult?.matched) {
        toast.error('Face verification failed. Please try again.');
        setIsVerifying(false);
        return;
      }

      if (action === 'in') {
        await handleCheckIn(userData!.uid, userData!.employeeID, userData!.name, true, location || undefined);
        toast.success('Check-in successful!');
      } else {
        await handleCheckOut(todayAttendance!.id, todayAttendance!.checkIn);
        toast.success('Check-out successful!');
      }
      stopCamera();
    } catch (error: any) {
      toast.error(error.message || 'Action failed');
    } finally {
      setIsVerifying(false);
    }
  };

  if (!userData?.faceRegistered) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="text-center py-12">
          <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <ScanFace className="w-8 h-8 text-orange-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Face Not Registered</h2>
          <p className="text-gray-400 mb-6">You need to register your face before you can mark attendance.</p>
          <Button onClick={() => window.location.href = '/dashboard/face-registration'}>
            Register Face Now
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Mark Attendance</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="flex flex-col items-center justify-center text-center p-8">
          <h2 className="text-lg font-semibold text-white mb-6">Today's Status</h2>
          
          {attLoading ? <Spinner /> : isComplete ? (
            <div className="space-y-4">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-emerald-400">Shift Completed</h3>
              <div className="text-gray-400 text-sm space-y-1">
                <p>In: {todayAttendance?.checkIn ? formatTime(todayAttendance.checkIn) : '--:--'}</p>
                <p>Out: {todayAttendance?.checkOut ? formatTime(todayAttendance.checkOut) : '--:--'}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 w-full">
              <div className="flex justify-center gap-4 text-center">
                <div className="bg-white/5 p-4 rounded-xl flex-1 border border-white/10">
                  <p className="text-xs text-gray-500 mb-1">Check In</p>
                  <p className="text-lg font-semibold text-white">
                    {todayAttendance?.checkIn ? formatTime(todayAttendance.checkIn) : '--:--'}
                  </p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl flex-1 border border-white/10">
                  <p className="text-xs text-gray-500 mb-1">Check Out</p>
                  <p className="text-lg font-semibold text-white">
                    {todayAttendance?.checkOut ? formatTime(todayAttendance.checkOut) : '--:--'}
                  </p>
                </div>
              </div>

              {!modelsLoaded ? (
                <div className="flex items-center justify-center gap-2 text-blue-400 bg-blue-500/10 p-4 rounded-xl">
                  <Spinner size="sm" /> Loading AI Models...
                </div>
              ) : !isCameraOn ? (
                <Button className="w-full" size="lg" icon={<Camera className="w-5 h-5"/>} onClick={startCamera}>
                  Turn on Camera
                </Button>
              ) : (
                <div className="flex gap-4">
                  <Button 
                    className="flex-1" 
                    variant={canCheckIn ? 'primary' : 'secondary'}
                    disabled={!canCheckIn || isVerifying}
                    loading={isVerifying && canCheckIn}
                    onClick={() => handleAction('in')}
                  >
                    Check In
                  </Button>
                  <Button 
                    className="flex-1"
                    variant={canCheckOut ? 'primary' : 'secondary'}
                    disabled={!canCheckOut || isVerifying}
                    loading={isVerifying && canCheckOut}
                    onClick={() => handleAction('out')}
                  >
                    Check Out
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>

        <Card className="overflow-hidden p-0 relative bg-black flex flex-col">
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            {modelsLoaded && <div className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded border border-emerald-500/30">AI Ready</div>}
            {isCameraOn && <div className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded border border-blue-500/30">Camera Active</div>}
          </div>
          
          <div className="relative flex-1 min-h-[300px] w-full bg-[#111] flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isCameraOn ? 'opacity-100' : 'opacity-0'}`}
            />
            {!isCameraOn && (
              <div className="text-center text-gray-500 flex flex-col items-center gap-2">
                <Camera className="w-8 h-8 opacity-50" />
                <span>Camera is off</span>
              </div>
            )}
            
            {isVerifying && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-20">
                <div className="flex flex-col items-center gap-4">
                  <ScanFace className="w-12 h-12 text-blue-500 animate-pulse" />
                  <span className="text-white font-medium">Verifying Face...</span>
                </div>
              </div>
            )}
          </div>
          
          {isCameraOn && (
            <div className="p-4 border-t border-white/10 flex justify-end">
              <Button variant="ghost" size="sm" onClick={stopCamera}>
                Cancel
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
