'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { useFaceRecognition, evaluateFaceQuality } from '@/hooks/useFaceRecognition';
import { updateUserDoc } from '@/lib/services/user.service';
import { storeFaceDescriptors } from '@/lib/services/face.service';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { Camera, ScanFace, CheckCircle2, Shield, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const TOTAL_CAPTURES = 5;

export default function FaceRegistrationPage() {
  const router = useRouter();
  const { userData } = useAuthContext();
  const { modelsLoaded, loadModels, detectFaceDetailed } = useFaceRecognition();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  
  const [capturedDescriptors, setCapturedDescriptors] = useState<number[][]>([]);
  const [qualityError, setQualityError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessingFinal, setIsProcessingFinal] = useState(false);
  
  const analysisRef = useRef({ isRunning: false, capturedCount: 0, descriptors: [] as number[][] });

  useEffect(() => {
    loadModels();
    if (userData?.faceRegistered) {
      setRegistrationComplete(true);
    }
  }, [loadModels, userData]);

  const startCamera = async () => {
    toast.loading('Requesting camera access...', { id: 'camera-toast' });
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Camera access is not supported in this environment. Please ensure you are using HTTPS or localhost.', { id: 'camera-toast' });
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      toast.success('Camera successfully connected.', { id: 'camera-toast' });
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
      toast.error(`Camera access error: ${error.name || error.message || 'Please check your browser permissions.'}`, { id: 'camera-toast' });
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraOn(false);
      setIsCapturing(false);
      analysisRef.current.isRunning = false;
    }
  };

  const finishRegistration = async (finalDescriptors: number[][]) => {
    if (!userData) return;
    setIsProcessingFinal(true);
    
    try {
      await storeFaceDescriptors(userData.uid, finalDescriptors);
      await updateUserDoc(userData.uid, { faceRegistered: true });
      
      toast.success('Your facial features have been registered successfully!');
      setRegistrationComplete(true);
      stopCamera();
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || 'Facial registration failed. Please try again.');
      setIsCapturing(false);
      setCapturedDescriptors([]);
      analysisRef.current = { isRunning: false, capturedCount: 0, descriptors: [] };
    } finally {
      setIsProcessingFinal(false);
    }
  };

  const runAnalysisLoop = async () => {
    if (!videoRef.current || !analysisRef.current.isRunning) return;

    try {
      const { detection, allFaces } = await detectFaceDetailed(videoRef.current);
      
      if (!analysisRef.current.isRunning) return;

      const quality = evaluateFaceQuality(detection, videoRef.current, allFaces);
      if (!quality.valid || !detection) {
        setQualityError(quality.reason || 'Invalid face');
      } else {
        setQualityError('Great! Hold still...');
        
        analysisRef.current.descriptors.push(Array.from(detection.descriptor));
        analysisRef.current.capturedCount++;
        
        setCapturedDescriptors([...analysisRef.current.descriptors]);
        
        if (analysisRef.current.capturedCount >= TOTAL_CAPTURES) {
          analysisRef.current.isRunning = false;
          finishRegistration(analysisRef.current.descriptors);
          return;
        } else {
          await new Promise(r => setTimeout(r, 600)); // 600ms burst gap
        }
      }
    } catch (err) {
      console.error(err);
    }
    
    if (analysisRef.current.isRunning) {
      setTimeout(runAnalysisLoop, 150);
    }
  };

  const startAutoCapture = () => {
    if (isCapturing) return;
    setIsCapturing(true);
    setCapturedDescriptors([]);
    setQualityError(null);
    
    analysisRef.current = { isRunning: true, capturedCount: 0, descriptors: [] };
    runAnalysisLoop();
  };

  if (!userData) return null;

  if (registrationComplete) {
    return (
      <div className="max-w-2xl mx-auto mt-10">
        <Card className="text-center py-16">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Face Registered Successfully</h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            Your face data has been securely saved. You can now use facial recognition to mark your daily attendance.
          </p>
          <Button onClick={() => router.push('/dashboard')} size="lg">
            Go to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const progress = (capturedDescriptors.length / TOTAL_CAPTURES) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10 mb-2">
          <ScanFace className="w-6 h-6 text-blue-500" />
        </div>
        <h1 className="text-2xl font-bold text-white">Register Your Face</h1>
        <p className="text-gray-400 max-w-lg mx-auto">
          Please look at the camera and slightly move your head. We will quickly capture a few angles to ensure strict identity matching.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="space-y-6 flex flex-col">
          <h2 className="text-lg font-semibold text-white">Capture Progress</h2>
          
          <div className="space-y-3">
            {Array.from({ length: TOTAL_CAPTURES }).map((_, index) => {
              const isCompleted = index < capturedDescriptors.length;
              const isCurrent = index === capturedDescriptors.length && isCapturing;
              
              return (
                <div 
                  key={index} 
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    isCompleted ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                    isCurrent ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                    'bg-white/5 border-white/10 text-gray-500'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isCompleted ? 'bg-emerald-500 text-black' :
                    isCurrent ? 'bg-blue-500 text-white' :
                    'bg-white/10'
                  }`}>
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <span className="font-medium">Scan {index + 1}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-auto pt-6 border-t border-white/10">
            <div className="flex items-start gap-3 bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
              <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-blue-400 font-semibold mb-1">Strict Liveness</p>
                <p className="text-gray-400">Please do not wear masks or sunglasses. Keep your face well-lit and centered.</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden p-0 relative bg-black min-h-[400px] flex flex-col">
          {!modelsLoaded && (
            <div className="absolute inset-0 z-20 bg-black/80 flex flex-col items-center justify-center gap-4">
              <Spinner size="lg" />
              <p className="text-blue-400">Loading AI Models...</p>
            </div>
          )}

          <div className="relative flex-1 w-full bg-[#111] flex items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isCameraOn ? 'opacity-100' : 'opacity-0'}`}
            />
            
            {!isCameraOn ? (
              <div className="relative z-10 text-center text-gray-500 flex flex-col items-center gap-2">
                <Camera className="w-12 h-12 opacity-50 mb-2" />
                <span>Camera is off</span>
                {modelsLoaded && (
                  <Button onClick={startCamera} className="mt-4" icon={<Camera className="w-4 h-4" />}>
                    Turn on Camera
                  </Button>
                )}
              </div>
            ) : (
              <div className="absolute inset-0 pointer-events-none z-10">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[70%] border-2 border-dashed border-white/40 rounded-[40%] transition-colors duration-300">
                  {isCapturing && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-12 bg-black/60 backdrop-blur text-white px-4 py-2 rounded-full whitespace-nowrap text-sm font-semibold border border-white/10">
                      Slowly move your head around
                    </div>
                  )}
                  {qualityError && isCapturing && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-12 bg-amber-500/90 text-black px-4 py-2 rounded-full whitespace-nowrap text-sm font-semibold shadow-lg">
                      {qualityError}
                    </div>
                  )}
                </div>
              </div>
            )}

            {isProcessingFinal && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-20 px-8">
                <ScanFace className="w-16 h-16 text-blue-500 animate-pulse mb-6" />
                <h3 className="text-xl font-bold text-white mb-2">Finalizing Secure Template...</h3>
              </div>
            )}
          </div>

          {isCameraOn && !isProcessingFinal && (
            <div className="p-4 bg-[#111] border-t border-white/10 flex flex-col gap-4 relative z-20">
              {isCapturing && (
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
              <div className="flex justify-between items-center gap-4">
                <Button variant="ghost" onClick={stopCamera}>
                  Cancel
                </Button>
                {!isCapturing ? (
                  <Button onClick={startAutoCapture} className="flex-1 text-base">
                    Start Fast Registration
                  </Button>
                ) : (
                  <Button disabled className="flex-1 text-base bg-blue-500/20 text-blue-400">
                    Capturing... ({capturedDescriptors.length}/{TOTAL_CAPTURES})
                  </Button>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
