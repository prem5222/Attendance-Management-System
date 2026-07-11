'use client';

import { useState, useRef, useCallback } from 'react';
import { MODELS_URL, FACE_MATCH_THRESHOLD } from '@/lib/constants';
import { compareFaceDescriptors } from '@/lib/services/face.service';

type FaceApiModule = typeof import('@vladmandic/face-api');

export type HeadPose = 'FRONT' | 'LEFT' | 'RIGHT' | 'UP' | 'DOWN';

export function getHeadPose(landmarks: any): HeadPose {
  const nose = landmarks.getNose()[3]; // tip of nose
  const jawOutline = landmarks.getJawOutline();
  const leftJaw = jawOutline[0]; 
  const rightJaw = jawOutline[16]; 
  
  const leftDist = nose.x - leftJaw.x;
  const rightDist = rightJaw.x - nose.x;
  const yawRatio = leftDist / (rightDist || 1);
  
  const topNose = landmarks.getNose()[0]; // bridge
  const chin = jawOutline[8]; // bottom chin
  
  const topDist = nose.y - topNose.y;
  const bottomDist = chin.y - nose.y;
  const pitchRatio = topDist / (bottomDist || 1);

  if (yawRatio < 0.6) return 'RIGHT';
  if (yawRatio > 1.6) return 'LEFT';
  if (pitchRatio < 0.5) return 'DOWN';
  if (pitchRatio > 1.2) return 'UP';
  return 'FRONT';
}

export function evaluateFaceQuality(
  detection: any, 
  videoElement: HTMLVideoElement,
  allFaces: any[]
): { valid: boolean; reason?: string } {
  if (allFaces.length > 1) {
    return { valid: false, reason: 'Multiple faces detected. Please ensure only you are in frame.' };
  }
  if (!detection) {
    return { valid: false, reason: 'No face detected.' };
  }

  const box = detection.detection.box;
  const videoWidth = videoElement.videoWidth;
  const videoHeight = videoElement.videoHeight;

  if (box.width < videoWidth * 0.15) {
    return { valid: false, reason: 'Face is too far. Please move closer.' };
  }

  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  
  const isCenteredX = centerX > videoWidth * 0.25 && centerX < videoWidth * 0.75;
  const isCenteredY = centerY > videoHeight * 0.25 && centerY < videoHeight * 0.75;
  
  if (!isCenteredX || !isCenteredY) {
    return { valid: false, reason: 'Face is not centered. Please center your face.' };
  }
  
  if (detection.landmarks.positions.length !== 68) {
     return { valid: false, reason: 'Face is partially obscured. Please remove masks/sunglasses.' };
  }
  
  if (detection.detection.score < 0.7) {
    return { valid: false, reason: 'Face image quality is too low or blurry.' };
  }

  return { valid: true };
}

export function useFaceRecognition() {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState('');
  const faceapiRef = useRef<FaceApiModule | null>(null);

  const loadModels = useCallback(async () => {
    if (modelsLoaded && faceapiRef.current) return;
    
    try {
      setLoadingProgress('Loading face recognition library...');
      const faceapi = await import('@vladmandic/face-api');
      faceapiRef.current = faceapi;

      setLoadingProgress('Loading face detection model...');
      await faceapi.nets.ssdMobilenetv1.loadFromUri(MODELS_URL);
      
      setLoadingProgress('Loading landmark detection model...');
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL);
      
      setLoadingProgress('Loading face recognition model...');
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URL);
      
      setModelsLoaded(true);
      setLoadingProgress('');
      setError(null);
    } catch (err) {
      console.error('Error loading face models:', err);
      setError('Failed to load face recognition models. Please check your internet connection.');
      setLoadingProgress('');
    }
  }, [modelsLoaded]);

  const detectFace = useCallback(async (
    videoElement: HTMLVideoElement
  ): Promise<Float32Array | null> => {
    const faceapi = faceapiRef.current;
    if (!faceapi || !modelsLoaded) {
      setError('Models not loaded');
      return null;
    }

    setIsDetecting(true);
    try {
      const detection = await faceapi
        .detectSingleFace(videoElement)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        return null;
      }

      return detection.descriptor;
    } catch (err) {
      console.error('Face detection error:', err);
      return null;
    } finally {
      setIsDetecting(false);
    }
  }, [modelsLoaded]);

  const detectFaceDetailed = useCallback(async (
    videoElement: HTMLVideoElement
  ) => {
    const faceapi = faceapiRef.current;
    if (!faceapi || !modelsLoaded) return { detection: null, allFaces: [] };

    try {
      const allFaces = await faceapi.detectAllFaces(videoElement).withFaceLandmarks();
      const detection = await faceapi
        .detectSingleFace(videoElement)
        .withFaceLandmarks()
        .withFaceDescriptor();

      return { detection, allFaces };
    } catch (err) {
      console.error('Face detection error:', err);
      return { detection: null, allFaces: [] };
    }
  }, [modelsLoaded]);

  const registerFace = useCallback(async (
    videoElement: HTMLVideoElement,
    captureCount: number = 5
  ): Promise<number[][] | null> => {
    const descriptors: number[][] = [];
    setIsDetecting(true);
    setError(null);

    try {
      for (let i = 0; i < captureCount; i++) {
        // Wait a moment between captures to get different angles
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const descriptor = await detectFace(videoElement);
        if (descriptor) {
          descriptors.push(Array.from(descriptor));
        } else {
          // Retry this capture
          i--;
          if (descriptors.length === 0 && i < -3) {
            setError('Unable to detect face. Please ensure good lighting and face the camera.');
            return null;
          }
          continue;
        }
      }

      if (descriptors.length < 3) {
        setError('Not enough face captures. Please try again.');
        return null;
      }

      return descriptors;
    } catch (err) {
      console.error('Face registration error:', err);
      setError('Face registration failed. Please try again.');
      return null;
    } finally {
      setIsDetecting(false);
    }
  }, [detectFace]);

  const verifyFace = useCallback(async (
    videoElement: HTMLVideoElement,
    storedDescriptors: number[][]
  ): Promise<{ matched: boolean; distance: number } | null> => {
    setIsDetecting(true);
    setError(null);

    try {
      const { detection, allFaces } = await detectFaceDetailed(videoElement);
      
      const quality = evaluateFaceQuality(detection, videoElement, allFaces);
      if (!quality.valid || !detection) {
        throw new Error(quality.reason || 'Invalid face capture.');
      }

      const result = compareFaceDescriptors(
        detection.descriptor,
        storedDescriptors,
        FACE_MATCH_THRESHOLD
      );

      return { matched: result.matched, distance: result.distance };
    } catch (err: any) {
      console.error('Face verification error:', err);
      throw err;
    } finally {
      setIsDetecting(false);
    }
  }, [detectFaceDetailed]);

  return {
    modelsLoaded,
    isDetecting,
    error,
    loadingProgress,
    loadModels,
    detectFace,
    detectFaceDetailed,
    registerFace,
    verifyFace,
  };
}
