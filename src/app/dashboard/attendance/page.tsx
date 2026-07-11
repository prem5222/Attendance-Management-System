'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAttendance } from '@/hooks/useAttendance';
import { useFaceRecognition, evaluateFaceQuality } from '@/hooks/useFaceRecognition';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { Camera, ScanFace, CheckCircle2, LogIn, LogOut, AlertTriangle, ShieldCheck, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatTime, getGreeting } from '@/lib/utils/helpers';
import { getFaceDescriptors, compareFaceDescriptors } from '@/lib/services/face.service';
import { FACE_MATCH_THRESHOLD } from '@/lib/constants';

const REQUIRED_CONSECUTIVE_MATCHES = 3;
const SCAN_TIMEOUT_MS = 15000;

export default function TodayAttendancePage() {
  const { userData } = useAuthContext();
  const { todayAttendance, canCheckIn, canCheckOut, isComplete, handleCheckIn, handleCheckOut, fetchTodayAttendance, loading: attLoading } = useAttendance();
  const { modelsLoaded, loadModels, detectFaceDetailed } = useFaceRecognition();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [currentAction, setCurrentAction] = useState<'entry' | 'exit' | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState<{latitude: number, longitude: number} | null>(null);
  
  // Verification state
  const [isScanning, setIsScanning] = useState(false);
  const [consecutiveMatches, setConsecutiveMatches] = useState(0);
  const [scanStatus, setScanStatus] = useState<'scanning' | 'matched' | 'failed' | 'nomatch' | 'recording' | null>(null);
  const [lastDistance, setLastDistance] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<string>('');
  
  const scanRef = useRef({ isRunning: false, matches: 0, startTime: 0, storedDescriptors: null as number[][] | null, failedAttempts: 0 });

  useEffect(() => {
    loadModels();
    if (userData?.uid) {
      fetchTodayAttendance(userData.uid);
    }
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => {}
      );
    }

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [loadModels, userData, fetchTodayAttendance]);

  const stopCamera = useCallback(() => {
    scanRef.current.isRunning = false;
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
    setCurrentAction(null);
    setIsScanning(false);
  }, []);

  const recordAttendance = useCallback(async () => {
    if (!userData) return;
    setIsRecording(true);
    setScanStatus('recording');
    
    try {
      if (currentAction === 'entry') {
        await handleCheckIn(userData.uid, userData.employeeID, userData.name, true, location || undefined);
      } else if (currentAction === 'exit' && todayAttendance) {
        await handleCheckOut(todayAttendance.id, todayAttendance.checkIn);
      }
      
      setScanStatus('matched');
      
      setTimeout(() => {
        stopCamera();
        if (userData?.uid) {
          fetchTodayAttendance(userData.uid);
        }
      }, 1500);
    } catch (error: any) {
      toast.error(error.message || 'Failed to record attendance.');
      setScanStatus('failed');
    } finally {
      setIsRecording(false);
    }
  }, [userData, currentAction, todayAttendance, handleCheckIn, handleCheckOut, stopCamera, fetchTodayAttendance, location]);

  const runAutoVerifyLoop = useCallback(async () => {
    if (!videoRef.current || !scanRef.current.isRunning || !scanRef.current.storedDescriptors) return;
    
    // Check timeout
    if (Date.now() - scanRef.current.startTime > SCAN_TIMEOUT_MS) {
      scanRef.current.isRunning = false;
      setScanStatus('nomatch');
      setIsScanning(false);
      setScanFeedback('Face does not match. Your face did not match the registered biometrics.');
      return;
    }
    
    try {
      const { detection, allFaces } = await detectFaceDetailed(videoRef.current);
      
      if (!scanRef.current.isRunning) return;
      
      const quality = evaluateFaceQuality(detection, videoRef.current, allFaces);
      
      if (!quality.valid || !detection) {
        scanRef.current.matches = 0;
        setConsecutiveMatches(0);
        setLastDistance(null);
        setScanFeedback(quality.reason || 'Position your face in the frame');
      } else {
        const result = compareFaceDescriptors(
          detection.descriptor,
          scanRef.current.storedDescriptors,
          FACE_MATCH_THRESHOLD
        );
        
        setLastDistance(result.distance);
        
        if (result.matched) {
          scanRef.current.matches++;
          scanRef.current.failedAttempts = 0;
          setConsecutiveMatches(scanRef.current.matches);
          setScanFeedback('Face recognized — verifying...');
          
          if (scanRef.current.matches >= REQUIRED_CONSECUTIVE_MATCHES) {
            scanRef.current.isRunning = false;
            setIsScanning(false);
            recordAttendance();
            return;
          }
        } else {
          // Face detected but does NOT match
          scanRef.current.matches = 0;
          scanRef.current.failedAttempts++;
          setConsecutiveMatches(0);
          setScanFeedback('Face does not match. Please ensure this is your registered face.');
          
          // After 10 consecutive non-matching detections, show hard failure
          if (scanRef.current.failedAttempts >= 10) {
            scanRef.current.isRunning = false;
            setScanStatus('nomatch');
            setIsScanning(false);
            setScanFeedback('Face does not match. The detected face does not match your registered biometrics.');
            return;
          }
        }
      }
    } catch (err) {
      console.error('Scan error:', err);
    }
    
    if (scanRef.current.isRunning) {
      setTimeout(runAutoVerifyLoop, 200);
    }
  }, [detectFaceDetailed, recordAttendance]);

  const startCamera = async (action: 'entry' | 'exit') => {
    setCurrentAction(action);
    setScanStatus(null);
    setConsecutiveMatches(0);
    setLastDistance(null);
    setScanFeedback('');
    
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Camera access is not supported. Please use HTTPS or localhost.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
        },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (err) {
          console.error('Video play error:', err);
        }
        setIsCameraOn(true);
        
        // Pre-load stored descriptors and start auto-scan
        if (userData?.uid) {
          const descriptors = await getFaceDescriptors(userData.uid);
          if (!descriptors) {
            toast.error('No facial data found. Please register your face first.');
            return;
          }
          scanRef.current = { isRunning: true, matches: 0, startTime: Date.now(), storedDescriptors: descriptors, failedAttempts: 0 };
          setIsScanning(true);
          setScanStatus('scanning');
          // Small delay for camera to stabilize
          setTimeout(() => runAutoVerifyLoop(), 500);
        }
      }
    } catch (error: any) {
      toast.error(`Camera error: ${error.name || error.message}`);
    }
  };

  const retryVerification = () => {
    setConsecutiveMatches(0);
    setLastDistance(null);
    setScanStatus('scanning');
    setScanFeedback('');
    setIsScanning(true);
    scanRef.current = { ...scanRef.current, isRunning: true, matches: 0, startTime: Date.now(), failedAttempts: 0 };
    runAutoVerifyLoop();
  };

  if (!userData) return null;

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
  const matchConfidence = lastDistance !== null ? Math.max(0, Math.round((1 - lastDistance / 1.0) * 100)) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white">{getGreeting()}, {userData.name.split(' ')[0]}</h1>
        <p className="text-gray-400">{dateStr}</p>
        <p className="text-4xl font-mono font-bold text-blue-400 mt-4">{timeStr}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Status & Actions Card */}
        <Card className="flex flex-col justify-center text-center p-8 space-y-6">
          <h2 className="text-lg font-semibold text-white">Today&apos;s Attendance</h2>
          
          {attLoading ? <Spinner /> : isComplete ? (
            <div className="space-y-6">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-emerald-400">Today&apos;s attendance has been completed.</h3>
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
            <div className="space-y-6">
              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                <p className="text-sm text-blue-400">✅ Office entry recorded.</p>
                <p className="text-xs text-gray-500 mt-1">Entry: {todayAttendance?.checkIn ? formatTime(todayAttendance.checkIn) : '--'}</p>
              </div>
              
              {!modelsLoaded ? (
                <div className="flex items-center justify-center gap-2 text-blue-400 bg-blue-500/10 p-4 rounded-xl">
                  <Spinner size="sm" /> Loading AI Models...
                </div>
              ) : !isCameraOn ? (
                <Button className="w-full" size="lg" icon={<LogOut className="w-5 h-5"/>} onClick={() => startCamera('exit')}>
                  Scan Face — Exit Office
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="space-y-6">
              {!modelsLoaded ? (
                <div className="flex items-center justify-center gap-2 text-blue-400 bg-blue-500/10 p-4 rounded-xl">
                  <Spinner size="sm" /> Loading AI Models...
                </div>
              ) : !isCameraOn ? (
                <Button className="w-full" size="lg" icon={<LogIn className="w-5 h-5"/>} onClick={() => startCamera('entry')}>
                  Scan Face — Enter Office
                </Button>
              ) : null}
            </div>
          )}
          
          {/* Live verification status */}
          {isCameraOn && scanStatus === 'scanning' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <ScanFace className="w-6 h-6 text-blue-400 animate-pulse flex-shrink-0" />
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-white">Verifying Identity...</p>
                  <p className="text-xs text-gray-400">Look directly at the camera — scanning automatically</p>
                </div>
              </div>
              
              {/* Match progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Match Progress</span>
                  <span className="text-blue-400 font-medium">{consecutiveMatches}/{REQUIRED_CONSECUTIVE_MATCHES}</span>
                </div>
                <div className="flex gap-2">
                  {Array.from({ length: REQUIRED_CONSECUTIVE_MATCHES }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                        i < consecutiveMatches ? 'bg-emerald-500' : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              {/* Live feedback */}
              {scanFeedback && (
                <p className={`text-xs text-center font-medium ${
                  scanFeedback.includes('does not match') ? 'text-red-400' :
                  scanFeedback.includes('recognized') ? 'text-emerald-400' :
                  'text-gray-400'
                }`}>
                  {scanFeedback}
                </p>
              )}
              
              {lastDistance !== null && (
                <div className="text-xs text-gray-500 text-center">
                  Similarity: <span className={matchConfidence > 70 ? 'text-emerald-400 font-medium' : 'text-amber-400'}>{matchConfidence}%</span>
                </div>
              )}
            </div>
          )}
          
          {scanStatus === 'matched' && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <ShieldCheck className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm font-semibold text-emerald-400">Identity Verified ✅</p>
                <p className="text-xs text-gray-400">{currentAction === 'entry' ? 'Office entry' : 'Office exit'} recorded successfully.</p>
              </div>
            </div>
          )}
          
          {scanStatus === 'recording' && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <Spinner size="sm" />
              <p className="text-sm text-blue-400">Recording attendance...</p>
            </div>
          )}
          
          {/* FACE DOES NOT MATCH ERROR */}
          {scanStatus === 'nomatch' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <XCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-red-400">Face Does Not Match</p>
                  <p className="text-xs text-gray-400">The scanned face does not match your registered biometrics. Only the registered person can mark attendance.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={stopCamera} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={retryVerification} className="flex-1">
                  Try Again
                </Button>
              </div>
            </div>
          )}
          
          {scanStatus === 'failed' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <XCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-red-400">Verification Failed</p>
                  <p className="text-xs text-gray-400">An error occurred while recording attendance. Please try again.</p>
                </div>
              </div>
              <Button onClick={retryVerification} className="w-full">
                Try Again
              </Button>
            </div>
          )}
        </Card>

        {/* Camera Card */}
        <Card className="overflow-hidden p-0 relative bg-black flex flex-col">
          <div className="absolute top-4 left-4 z-10 flex gap-2 flex-wrap">
            {modelsLoaded && <div className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded border border-emerald-500/30">AI Ready</div>}
            {isCameraOn && <div className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded border border-blue-500/30">{currentAction === 'entry' ? 'Office Entry' : 'Office Exit'}</div>}
            {isScanning && <div className="bg-purple-500/20 text-purple-400 text-xs px-2 py-1 rounded border border-purple-500/30 animate-pulse">Auto-Scanning</div>}
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
                {/* Scanning oval with dynamic color */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-72 border-[3px] rounded-[40%] transition-all duration-500 ${
                  scanStatus === 'matched' ? 'border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.4)]' :
                  scanStatus === 'nomatch' || scanStatus === 'failed' ? 'border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.4)]' :
                  consecutiveMatches > 0 ? 'border-emerald-500/70 shadow-[0_0_20px_rgba(16,185,129,0.2)]' :
                  'border-white/50 border-dashed'
                }`}>
                  {isScanning && scanStatus === 'scanning' && (
                    <div className="absolute inset-0 bg-blue-500/10 rounded-[40%] animate-pulse" />
                  )}
                  {scanStatus === 'matched' && (
                    <div className="absolute inset-0 bg-emerald-500/10 rounded-[40%]" />
                  )}
                  {scanStatus === 'nomatch' && (
                    <div className="absolute inset-0 bg-red-500/10 rounded-[40%]" />
                  )}
                </div>
                
                {/* Corner markers */}
                <div className="absolute top-[14%] left-[18%] w-6 h-6 border-t-2 border-l-2 border-white/50 rounded-tl-lg" />
                <div className="absolute top-[14%] right-[18%] w-6 h-6 border-t-2 border-r-2 border-white/50 rounded-tr-lg" />
                <div className="absolute bottom-[14%] left-[18%] w-6 h-6 border-b-2 border-l-2 border-white/50 rounded-bl-lg" />
                <div className="absolute bottom-[14%] right-[18%] w-6 h-6 border-b-2 border-r-2 border-white/50 rounded-br-lg" />
              </div>
            )}
            
            {scanStatus === 'matched' && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-20">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center">
                    <ShieldCheck className="w-10 h-10 text-emerald-500" />
                  </div>
                  <span className="text-white font-semibold text-lg">Identity Confirmed</span>
                </div>
              </div>
            )}
            
            {scanStatus === 'nomatch' && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-20">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
                    <XCircle className="w-10 h-10 text-red-500" />
                  </div>
                  <span className="text-white font-semibold text-lg">Face Does Not Match</span>
                </div>
              </div>
            )}
          </div>
          
          {isCameraOn && scanStatus !== 'matched' && scanStatus !== 'recording' && scanStatus !== 'nomatch' && (
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
