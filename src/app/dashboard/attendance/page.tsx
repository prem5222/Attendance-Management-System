'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAttendance } from '@/hooks/useAttendance';
import { useFaceRecognition } from '@/hooks/useFaceRecognition';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { Camera, ScanFace, CheckCircle2, Clock, LogIn, LogOut, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatTime, getGreeting } from '@/lib/utils/helpers';
import { getFaceDescriptors } from '@/lib/services/face.service';

export default function TodayAttendancePage() {
  const { userData } = useAuthContext();
  const { todayAttendance, canCheckIn, canCheckOut, isComplete, handleCheckIn, handleCheckOut, fetchTodayAttendance, loading: attLoading } = useAttendance();
  const { modelsLoaded, loadModels, verifyFace } = useFaceRecognition();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [currentAction, setCurrentAction] = useState<'entry' | 'exit' | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState<{latitude: number, longitude: number} | null>(null);

  useEffect(() => {
    loadModels();
    if (userData?.uid) {
      fetchTodayAttendance(userData.uid);
    }
    
    // Get location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => {}
      );
    }

    // Live clock
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [loadModels, userData, fetchTodayAttendance]);

  const startCamera = async (action: 'entry' | 'exit') => {
    setCurrentAction(action);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Camera API is not supported. Use HTTPS or localhost.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (err) {
          console.error('Video play error:', err);
        }
        setIsCameraOn(true);
      }
    } catch (error: any) {
      console.error('Camera error:', error);
      toast.error(`Camera error: ${error.name || error.message || 'Check permissions'}`);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraOn(false);
      setCurrentAction(null);
    }
  };

  const handleVerifyAndRecord = async () => {
    if (!videoRef.current || !userData) return;
    
    setIsVerifying(true);
    try {
      const storedDescriptors = await getFaceDescriptors(userData.uid);
      if (!storedDescriptors) {
        toast.error('No face data found. Please register your face first.');
        return;
      }

      const matchResult = await verifyFace(videoRef.current, storedDescriptors);
      if (!matchResult?.matched) {
        toast.error('Face not recognized. Please try again.');
        return;
      }

      if (currentAction === 'entry') {
        await handleCheckIn(userData.uid, userData.employeeID, userData.name, true, location || undefined);
        toast.success('Office entry recorded successfully. ✅');
      } else if (currentAction === 'exit' && todayAttendance) {
        await handleCheckOut(todayAttendance.id, todayAttendance.checkIn);
        toast.success('Office exit recorded successfully. ✅');
      }
      
      stopCamera();
      if (userData?.uid) {
        await fetchTodayAttendance(userData.uid);
      }
    } catch (error: any) {
      toast.error(error.message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (!userData) return null;

  // Face not registered
  if (!userData.faceRegistered) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="text-center py-12">
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Face Registration Required</h2>
          <p className="text-gray-400 mb-6">Please register your face before marking attendance.</p>
          <Button onClick={() => window.location.href = '/dashboard/face-registration'}>
            Register Face Now
          </Button>
        </Card>
      </div>
    );
  }

  const timeStr = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const dateStr = currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with greeting and time */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white">{getGreeting()}, {userData.name.split(' ')[0]}</h1>
        <p className="text-gray-400">{dateStr}</p>
        <p className="text-4xl font-mono font-bold text-blue-400 mt-4">{timeStr}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Status & Actions Card */}
        <Card className="flex flex-col justify-center text-center p-8 space-y-6">
          <h2 className="text-lg font-semibold text-white">Today's Attendance</h2>
          
          {attLoading ? <Spinner /> : isComplete ? (
            /* Both entry and exit completed */
            <div className="space-y-6">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-emerald-400">Today's attendance has been completed.</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <p className="text-xs text-gray-500 mb-1">Entry</p>
                  <p className="text-sm font-semibold text-white">{todayAttendance?.checkIn ? formatTime(todayAttendance.checkIn) : '--'}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <p className="text-xs text-gray-500 mb-1">Exit</p>
                  <p className="text-sm font-semibold text-white">{todayAttendance?.checkOut ? formatTime(todayAttendance.checkOut) : '--'}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <p className="text-xs text-gray-500 mb-1">Hours</p>
                  <p className="text-sm font-semibold text-white">{todayAttendance?.workingHours || 0}h</p>
                </div>
              </div>
            </div>
          ) : canCheckOut ? (
            /* Entry done, exit pending */
            <div className="space-y-6">
              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                <p className="text-sm text-blue-400">✅ You have already marked your office entry today.</p>
                <p className="text-xs text-gray-500 mt-1">Entry: {todayAttendance?.checkIn ? formatTime(todayAttendance.checkIn) : '--'}</p>
              </div>
              
              {!modelsLoaded ? (
                <div className="flex items-center justify-center gap-2 text-blue-400 bg-blue-500/10 p-4 rounded-xl">
                  <Spinner size="sm" /> Loading AI Models...
                </div>
              ) : !isCameraOn ? (
                <Button className="w-full" size="lg" icon={<LogOut className="w-5 h-5"/>} onClick={() => startCamera('exit')}>
                  Capture Face – Exit Office
                </Button>
              ) : (
                <Button 
                  className="w-full" 
                  size="lg"
                  disabled={isVerifying}
                  loading={isVerifying}
                  onClick={handleVerifyAndRecord}
                >
                  {isVerifying ? 'Verifying Face...' : 'Verify & Record Exit'}
                </Button>
              )}
            </div>
          ) : (
            /* No entry yet */
            <div className="space-y-6">
              {!modelsLoaded ? (
                <div className="flex items-center justify-center gap-2 text-blue-400 bg-blue-500/10 p-4 rounded-xl">
                  <Spinner size="sm" /> Loading AI Models...
                </div>
              ) : !isCameraOn ? (
                <Button className="w-full" size="lg" icon={<LogIn className="w-5 h-5"/>} onClick={() => startCamera('entry')}>
                  Capture Face – Enter Office
                </Button>
              ) : (
                <Button 
                  className="w-full" 
                  size="lg"
                  disabled={isVerifying}
                  loading={isVerifying}
                  onClick={handleVerifyAndRecord}
                >
                  {isVerifying ? 'Verifying Face...' : 'Verify & Record Entry'}
                </Button>
              )}
            </div>
          )}
        </Card>

        {/* Camera Card */}
        <Card className="overflow-hidden p-0 relative bg-black flex flex-col">
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            {modelsLoaded && <div className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded border border-emerald-500/30">AI Ready</div>}
            {isCameraOn && <div className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded border border-blue-500/30">{currentAction === 'entry' ? 'Office Entry' : 'Office Exit'}</div>}
          </div>
          
          <div className="relative flex-1 min-h-[350px] w-full bg-[#111] flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isCameraOn ? 'opacity-100' : 'opacity-0'}`}
            />
            {!isCameraOn && (
              <div className="relative z-10 text-center text-gray-500 flex flex-col items-center gap-2">
                <Camera className="w-8 h-8 opacity-50" />
                <span>Camera is off</span>
              </div>
            )}
            
            {isCameraOn && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-72 border-2 border-dashed border-white/50 rounded-[40%]">
                  {isVerifying && <div className="absolute inset-0 bg-blue-500/20 rounded-[40%] animate-pulse" />}
                </div>
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
          
          {isCameraOn && !isVerifying && (
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
