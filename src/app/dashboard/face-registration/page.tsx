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
import { Camera, ScanFace, CheckCircle2, Shield, Eye, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

const TOTAL_CAPTURES = 8;

const GUIDANCE_MESSAGES = [
  'Look straight at the camera',
  'Turn your head slightly to the left',
  'Turn your head slightly to the right',
  'Tilt your head up a little',
  'Tilt your head down a little',
  'Look straight again',
  'Smile naturally',
  'Neutral expression — hold still',
];

export default function FaceRegistrationPage() {
  const router = useRouter();
  const { userData } = useAuthContext();
  const { modelsLoaded, loadModels, detectFaceDetailed } = useFaceRecognition();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  
  const [capturedDescriptors, setCapturedDescriptors] = useState<number[][]>([]);
  const [qualityFeedback, setQualityFeedback] = useState<string | null>(null);
  const [qualityScore, setQualityScore] = useState<number>(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessingFinal, setIsProcessingFinal] = useState(false);
  const [avgConfidence, setAvgConfidence] = useState(0);
  
  const analysisRef = useRef({ isRunning: false, capturedCount: 0, descriptors: [] as number[][], confidences: [] as number[] });

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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
        },
      });
      toast.success('Camera connected in HD mode.', { id: 'camera-toast' });
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

  const computeAverageDescriptor = (descriptors: number[][]): number[] => {
    const len = descriptors[0].length;
    const avg = new Array(len).fill(0);
    for (const desc of descriptors) {
      for (let i = 0; i < len; i++) {
        avg[i] += desc[i];
      }
    }
    for (let i = 0; i < len; i++) {
      avg[i] /= descriptors.length;
    }
    return avg;
  };

  const finishRegistration = async (finalDescriptors: number[][]) => {
    if (!userData) return;
    setIsProcessingFinal(true);
    
    try {
      // Compute average descriptor for robust matching
      const avgDescriptor = computeAverageDescriptor(finalDescriptors);
      const allDescriptors = [...finalDescriptors, avgDescriptor];
      
      await storeFaceDescriptors(userData.uid, allDescriptors);
      await updateUserDoc(userData.uid, { faceRegistered: true });
      
      const avgConf = analysisRef.current.confidences.length > 0
        ? Math.round((analysisRef.current.confidences.reduce((a, b) => a + b, 0) / analysisRef.current.confidences.length) * 100)
        : 0;
      setAvgConfidence(avgConf);
      
      toast.success('Facial biometrics have been securely registered!');
      setRegistrationComplete(true);
      stopCamera();
    } catch (error: any) {
      toast.error(error.message || 'Facial registration failed. Please try again.');
      setIsCapturing(false);
      setCapturedDescriptors([]);
      analysisRef.current = { isRunning: false, capturedCount: 0, descriptors: [], confidences: [] };
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
        setQualityFeedback(quality.reason || 'No face detected');
        setQualityScore(0);
      } else {
        const confidence = detection.detection.score;
        const scorePercent = Math.round(confidence * 100);
        setQualityScore(scorePercent);
        
        if (confidence < 0.8) {
          setQualityFeedback('Low quality — improve lighting or move closer');
        } else {
          const box = detection.detection.box;
          const videoWidth = videoRef.current!.videoWidth;
          if (box.width < videoWidth * 0.20) {
            setQualityFeedback('Face too small — please move closer to the camera');
          } else {
            const currentGuidance = GUIDANCE_MESSAGES[analysisRef.current.capturedCount] || 'Hold still...';
            setQualityFeedback(`✅ ${currentGuidance}`);
            
            analysisRef.current.descriptors.push(Array.from(detection.descriptor));
            analysisRef.current.confidences.push(confidence);
            analysisRef.current.capturedCount++;
            
            setCapturedDescriptors([...analysisRef.current.descriptors]);
            
            if (analysisRef.current.capturedCount >= TOTAL_CAPTURES) {
              analysisRef.current.isRunning = false;
              finishRegistration(analysisRef.current.descriptors);
              return;
            } else {
              await new Promise(r => setTimeout(r, 400));
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
    
    if (analysisRef.current.isRunning) {
      setTimeout(runAnalysisLoop, 120);
    }
  };

  const startAutoCapture = () => {
    if (isCapturing) return;
    setIsCapturing(true);
    setCapturedDescriptors([]);
    setQualityFeedback(null);
    setQualityScore(0);
    
    analysisRef.current = { isRunning: true, capturedCount: 0, descriptors: [], confidences: [] };
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
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Your facial biometrics have been securely stored with {TOTAL_CAPTURES} high-quality captures and an averaged template for maximum accuracy.
          </p>
          
          {avgConfidence > 0 && (
            <div className="inline-flex items-center gap-6 bg-white/5 border border-white/10 rounded-xl px-6 py-3 mb-8">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-400" />
                <div className="text-left">
                  <p className="text-xs text-gray-500">Avg Quality</p>
                  <p className="text-lg font-bold text-white">{avgConfidence}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <div className="text-left">
                  <p className="text-xs text-gray-500">Templates</p>
                  <p className="text-lg font-bold text-white">{TOTAL_CAPTURES + 1}</p>
                </div>
              </div>
            </div>
          )}
          
          <Button onClick={() => router.push('/dashboard/attendance')} size="lg">
            Continue to Attendance
          </Button>
        </Card>
      </div>
    );
  }

  const progress = (capturedDescriptors.length / TOTAL_CAPTURES) * 100;
  const qualityColor = qualityScore >= 80 ? 'border-emerald-500' : qualityScore >= 50 ? 'border-amber-500' : 'border-red-500';
  const qualityBgPulse = qualityScore >= 80 ? 'bg-emerald-500/10' : qualityScore >= 50 ? 'bg-amber-500/10' : 'bg-red-500/10';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10 mb-2">
          <ScanFace className="w-6 h-6 text-blue-500" />
        </div>
        <h1 className="text-2xl font-bold text-white">Register Your Face</h1>
        <p className="text-gray-400 max-w-lg mx-auto">
          We&apos;ll capture {TOTAL_CAPTURES} high-resolution scans of your face from multiple angles. Follow the on-screen guidance for the best results.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="space-y-6 flex flex-col">
          <h2 className="text-lg font-semibold text-white">Capture Progress</h2>
          
          {/* Live Quality Score */}
          {isCapturing && (
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="relative w-14 h-14 flex-shrink-0">
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                  <circle 
                    cx="28" cy="28" r="24" fill="none" 
                    stroke={qualityScore >= 80 ? '#10b981' : qualityScore >= 50 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="4" 
                    strokeDasharray={`${(qualityScore / 100) * 150.8} 150.8`}
                    strokeLinecap="round"
                    className="transition-all duration-300"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">{qualityScore}%</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Face Quality</p>
                <p className="text-xs text-gray-500">{qualityScore >= 80 ? 'Excellent' : qualityScore >= 50 ? 'Acceptable' : 'Poor'}</p>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            {Array.from({ length: TOTAL_CAPTURES }).map((_, index) => {
              const isCompleted = index < capturedDescriptors.length;
              const isCurrent = index === capturedDescriptors.length && isCapturing;
              
              return (
                <div 
                  key={index} 
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 ${
                    isCompleted ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                    isCurrent ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 scale-[1.02]' :
                    'bg-white/5 border-white/10 text-gray-500'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted ? 'bg-emerald-500 text-black' :
                    isCurrent ? 'bg-blue-500 text-white animate-pulse' :
                    'bg-white/10'
                  }`}>
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <span className="font-medium text-sm">
                    {isCompleted ? `Scan ${index + 1} — Captured` : isCurrent ? GUIDANCE_MESSAGES[index] : `Scan ${index + 1}`}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-auto pt-6 border-t border-white/10">
            <div className="flex items-start gap-3 bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
              <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-blue-400 font-semibold mb-1">Strict Biometric Capture</p>
                <p className="text-gray-400">Remove masks, glasses, and hats. Keep your face well-lit and centered. {TOTAL_CAPTURES} scans + 1 averaged template are stored for strict identity matching.</p>
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
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[70%] border-[3px] rounded-[40%] transition-all duration-500 ${
                  isCapturing ? qualityColor : 'border-white/40 border-dashed'
                } ${isCapturing && qualityScore >= 80 ? 'shadow-[0_0_30px_rgba(16,185,129,0.3)]' : ''}`}>
                  {isCapturing && (
                    <div className={`absolute inset-0 rounded-[40%] animate-pulse ${qualityBgPulse}`} />
                  )}
                  
                  {isCapturing && qualityFeedback && (
                    <div className={`absolute -bottom-14 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full whitespace-nowrap text-sm font-semibold shadow-lg border ${
                      qualityFeedback.startsWith('✅') 
                        ? 'bg-emerald-500/90 text-black border-emerald-400/50'
                        : 'bg-amber-500/90 text-black border-amber-400/50'
                    }`}>
                      {qualityFeedback}
                    </div>
                  )}
                </div>
                
                {/* Corner markers */}
                <div className="absolute top-[15%] left-[20%] w-6 h-6 border-t-2 border-l-2 border-white/60 rounded-tl-lg" />
                <div className="absolute top-[15%] right-[20%] w-6 h-6 border-t-2 border-r-2 border-white/60 rounded-tr-lg" />
                <div className="absolute bottom-[15%] left-[20%] w-6 h-6 border-b-2 border-l-2 border-white/60 rounded-bl-lg" />
                <div className="absolute bottom-[15%] right-[20%] w-6 h-6 border-b-2 border-r-2 border-white/60 rounded-br-lg" />
              </div>
            )}

            {isProcessingFinal && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-20 px-8">
                <ScanFace className="w-16 h-16 text-blue-500 animate-pulse mb-6" />
                <h3 className="text-xl font-bold text-white mb-2">Generating Secure Biometric Template...</h3>
                <p className="text-gray-400 text-sm">Computing averaged face descriptor from {TOTAL_CAPTURES} scans</p>
              </div>
            )}
          </div>

          {isCameraOn && !isProcessingFinal && (
            <div className="p-4 bg-[#111] border-t border-white/10 flex flex-col gap-4 relative z-20">
              {isCapturing && (
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500 ease-out rounded-full"
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
                    Start HD Registration
                  </Button>
                ) : (
                  <Button disabled className="flex-1 text-base bg-blue-500/20 text-blue-400">
                    Scanning... ({capturedDescriptors.length}/{TOTAL_CAPTURES})
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
