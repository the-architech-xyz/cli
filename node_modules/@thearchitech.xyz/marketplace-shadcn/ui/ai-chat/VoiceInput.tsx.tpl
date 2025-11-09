'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Square, 
  RotateCcw,
  Settings,
  CheckCircle,
  AlertCircle,
  Info,
  X,
  Zap,
  Clock,
  Waveform
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

export interface VoiceInputProps {
  className?: string;
  onTranscription?: (text: string) => void;
  onError?: (error: Error) => void;
  onStart?: () => void;
  onStop?: () => void;
  disabled?: boolean;
  autoStart?: boolean;
  continuous?: boolean;
  language?: string;
  maxDuration?: number;
  showSettings?: boolean;
  showWaveform?: boolean;
}

export interface VoiceSettings {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  maxDuration: number;
  sensitivity: number;
  noiseReduction: boolean;
  autoPunctuation: boolean;
}

export function VoiceInput({
  className,
  onTranscription,
  onError,
  onStart,
  onStop,
  disabled = false,
  autoStart = false,
  continuous = false,
  language = 'en-US',
  maxDuration = 30000, // 30 seconds
  showSettings = true,
  showWaveform = true,
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [volume, setVolume] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [settings, setSettings] = useState<VoiceSettings>({
    language,
    continuous,
    interimResults: true,
    maxAlternatives: 1,
    maxDuration,
    sensitivity: 0.5,
    noiseReduction: true,
    autoPunctuation: true,
  });

  // Check for speech recognition support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      setupRecognition();
    } else {
      setIsSupported(false);
      setError('Speech recognition is not supported in this browser');
    }

    return () => {
      cleanup();
    };
  }, []);

  // Setup speech recognition
  const setupRecognition = useCallback(() => {
    if (!recognitionRef.current) return;

    const recognition = recognitionRef.current;
    
    recognition.continuous = settings.continuous;
    recognition.interimResults = settings.interimResults;
    recognition.lang = settings.language;
    recognition.maxAlternatives = settings.maxAlternatives;

    recognition.onstart = () => {
      setIsListening(true);
      setIsPaused(false);
      setError(null);
      onStart?.();
      startTimeRef.current = Date.now();
      startDurationTimer();
    };

    recognition.onend = () => {
      setIsListening(false);
      setIsPaused(false);
      onStop?.();
      stopDurationTimer();
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (finalTranscript) {
        setTranscript(prev => prev + finalTranscript);
        onTranscription?.(finalTranscript);
      }

      setInterimTranscript(interimTranscript);
    };

    recognition.onerror = (event) => {
      const errorMessage = getErrorMessage(event.error);
      setError(errorMessage);
      setIsListening(false);
      setIsPaused(false);
      onError?.(new Error(errorMessage));
      stopDurationTimer();
    };

    recognition.onnomatch = () => {
      setError('No speech was detected. Please try again.');
    };
  }, [settings, onTranscription, onError, onStart, onStop]);

  // Start duration timer
  const startDurationTimer = useCallback(() => {
    durationIntervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Date.now() - startTimeRef.current;
        setDuration(elapsed);
        
        if (elapsed >= settings.maxDuration) {
          stopListening();
        }
      }
    }, 100);
  }, [settings.maxDuration]);

  // Stop duration timer
  const stopDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    setDuration(0);
  }, []);

  // Get error message
  const getErrorMessage = (error: string): string => {
    switch (error) {
      case 'no-speech':
        return 'No speech was detected. Please try again.';
      case 'audio-capture':
        return 'No microphone was found. Please check your microphone.';
      case 'not-allowed':
        return 'Microphone access was denied. Please allow microphone access.';
      case 'network':
        return 'Network error occurred. Please check your connection.';
      case 'aborted':
        return 'Speech recognition was aborted.';
      case 'language-not-supported':
        return 'The selected language is not supported.';
      default:
        return `Speech recognition error: ${error}`;
    }
  };

  // Start listening
  const startListening = useCallback(async () => {
    if (!recognitionRef.current || isListening || disabled) return;

    try {
      setError(null);
      setTranscript('');
      setInterimTranscript('');
      
      // Request microphone permission
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ 
          audio: { 
            echoCancellation: settings.noiseReduction,
            noiseSuppression: settings.noiseReduction,
            autoGainControl: settings.noiseReduction,
          } 
        });
        
        // Setup audio analysis for waveform
        if (showWaveform) {
          setupAudioAnalysis();
        }
      }

      recognitionRef.current.start();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start voice input';
      setError(errorMessage);
      onError?.(new Error(errorMessage));
    }
  }, [isListening, disabled, settings, onError, showWaveform]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    cleanup();
  }, [isListening]);

  // Pause/Resume listening
  const togglePause = useCallback(() => {
    if (isPaused) {
      // Resume
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
    } else {
      // Pause
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsPaused(true);
    }
  }, [isPaused]);

  // Setup audio analysis for waveform
  const setupAudioAnalysis = useCallback(() => {
    if (!mediaStreamRef.current) return;

    try {
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVolume = () => {
        if (analyserRef.current && isListening) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / bufferLength;
          setVolume(average / 255);
          animationRef.current = requestAnimationFrame(updateVolume);
        }
      };

      updateVolume();
    } catch (err) {
      console.warn('Failed to setup audio analysis:', err);
    }
  }, [isListening]);

  // Cleanup
  const cleanup = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    stopDurationTimer();
    setVolume(0);
  }, [stopDurationTimer]);

  // Handle settings change
  const handleSettingsChange = useCallback((updates: Partial<VoiceSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  // Format duration
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Format remaining time
  const getRemainingTime = (): string => {
    const remaining = settings.maxDuration - duration;
    return formatDuration(Math.max(0, remaining));
  };

  // Auto-start effect
  useEffect(() => {
    if (autoStart && isSupported && !disabled) {
      startListening();
    }
  }, [autoStart, isSupported, disabled, startListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  if (!isSupported) {
    return (
      <div className={cn('flex items-center justify-center p-4', className)}>
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <h3 className="font-semibold mb-2">Voice Input Not Supported</h3>
            <p className="text-sm text-muted-foreground">
              Your browser doesn't support speech recognition. Please use a modern browser like Chrome or Edge.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Voice Input */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Voice Button */}
            <Button
              size="lg"
              variant={isListening ? "destructive" : "default"}
              onClick={isListening ? stopListening : startListening}
              disabled={disabled}
              className={cn(
                'h-12 w-12 rounded-full',
                isListening && 'animate-pulse'
              )}
            >
              {isListening ? (
                <MicOff className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </Button>

            {/* Status and Controls */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={isListening ? "default" : "secondary"}>
                  {isListening ? 'Listening' : 'Ready'}
                </Badge>
                {isListening && (
                  <Badge variant="outline">
                    {formatDuration(duration)}
                  </Badge>
                )}
                {isListening && (
                  <Badge variant="outline">
                    {getRemainingTime()} left
                  </Badge>
                )}
              </div>

              {/* Waveform */}
              {showWaveform && isListening && (
                <div className="flex items-center gap-1 h-4">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-primary rounded-full transition-all duration-100"
                      style={{
                        width: '2px',
                        height: `${Math.max(4, volume * 16)}px`,
                        opacity: volume > 0.1 ? 1 : 0.3,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Progress Bar */}
              {isListening && (
                <Progress 
                  value={(duration / settings.maxDuration) * 100} 
                  className="h-1"
                />
              )}

              {/* Controls */}
              {isListening && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={togglePause}
                  >
                    {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    {isPaused ? 'Resume' : 'Pause'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTranscript('');
                      setInterimTranscript('');
                    }}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Clear
                  </Button>
                </div>
              )}
            </div>

            {/* Settings */}
            {showSettings && (
              <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Voice Input Settings</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Language</Label>
                      <Select
                        value={settings.language}
                        onValueChange={(value) => handleSettingsChange({ language: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en-US">English (US)</SelectItem>
                          <SelectItem value="en-GB">English (UK)</SelectItem>
                          <SelectItem value="es-ES">Spanish</SelectItem>
                          <SelectItem value="fr-FR">French</SelectItem>
                          <SelectItem value="de-DE">German</SelectItem>
                          <SelectItem value="it-IT">Italian</SelectItem>
                          <SelectItem value="pt-BR">Portuguese (Brazil)</SelectItem>
                          <SelectItem value="ja-JP">Japanese</SelectItem>
                          <SelectItem value="ko-KR">Korean</SelectItem>
                          <SelectItem value="zh-CN">Chinese (Simplified)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Max Duration: {settings.maxDuration / 1000}s</Label>
                      <Slider
                        value={[settings.maxDuration / 1000]}
                        onValueChange={([value]) => handleSettingsChange({ maxDuration: value * 1000 })}
                        min={5}
                        max={120}
                        step={5}
                        className="mt-2"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Continuous Mode</Label>
                        <Switch
                          checked={settings.continuous}
                          onCheckedChange={(checked) => handleSettingsChange({ continuous: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Interim Results</Label>
                        <Switch
                          checked={settings.interimResults}
                          onCheckedChange={(checked) => handleSettingsChange({ interimResults: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Noise Reduction</Label>
                        <Switch
                          checked={settings.noiseReduction}
                          onCheckedChange={(checked) => handleSettingsChange({ noiseReduction: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Auto Punctuation</Label>
                        <Switch
                          checked={settings.autoPunctuation}
                          onCheckedChange={(checked) => handleSettingsChange({ autoPunctuation: checked })}
                        />
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transcript Display */}
      {(transcript || interimTranscript) && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Transcript</h4>
              <div className="text-sm">
                {transcript && (
                  <p className="text-foreground">{transcript}</p>
                )}
                {interimTranscript && (
                  <p className="text-muted-foreground italic">{interimTranscript}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 ml-auto"
                onClick={() => setError(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default VoiceInput;