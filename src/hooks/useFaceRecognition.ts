'use client';

import { useState, useRef, useCallback } from 'react';
import { MODELS_URL, FACE_MATCH_THRESHOLD } from '@/lib/constants';
import { compareFaceDescriptors } from '@/lib/services/face.service';

type FaceApiModule = typeof import('@vladmandic/face-api');

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
      const descriptor = await detectFace(videoElement);
      if (!descriptor) {
        setError('No face detected. Please face the camera.');
        return null;
      }

      const result = compareFaceDescriptors(
        descriptor,
        storedDescriptors,
        FACE_MATCH_THRESHOLD
      );

      return { matched: result.matched, distance: result.distance };
    } catch (err) {
      console.error('Face verification error:', err);
      setError('Face verification failed. Please try again.');
      return null;
    } finally {
      setIsDetecting(false);
    }
  }, [detectFace]);

  return {
    modelsLoaded,
    isDetecting,
    error,
    loadingProgress,
    loadModels,
    detectFace,
    registerFace,
    verifyFace,
  };
}
