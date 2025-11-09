'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  VolumeX, 
  Settings,
  CheckCircle,
  AlertCircle,
  Info,
  X,
  Zap,
  Clock,
  Waveform,
  SkipBack,
  SkipForward,
  RotateCcw
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
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export interface VoiceOutputProps {
  className?: string;
  text: string;
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
  autoPlay?: boolean;
  showControls?: boolean;
  showSettings?: boolean;
  showProgress?: boolean;
  showWaveform?: boolean;
}

export interface VoiceSettings {
  voice: string;
  rate: number;
  pitch: number;
  volume: number;
  language: string;
  autoPlay: boolean;
  highlightText: boolean;
  pauseOnHover: boolean;
  skipSilence: boolean;
  chunkSize: number;
}

export function VoiceOutput({
  className,
  text,
  onPlay,
  onPause,
  onStop,
  onComplete,
  onError,
  disabled = false,
  autoPlay = false,
  showControls = true,
  showSettings = true,
  showProgress = true,
  showWaveform = false,
}: VoiceOutputProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [highlightedText, setHighlightedText] = useState('');
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const [settings, setSettings] = useState<VoiceSettings>({
    voice: 'default',
    rate: 1,
    pitch: 1,
    volume: 1,
    language: 'en-US',
    autoPlay: false,
    highlightText: true,
    pauseOnHover: false,
    skipSilence: true,
    chunkSize: 200,
  });

  // Available voices
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Check for speech synthesis support
  useEffect(() => {
    if ('speechSynthesis' in window) {
      setIsSupported(true);
      loadVoices();
    } else {
      setIsSupported(false);
      setError('Text-to-speech is not supported in this browser');
    }

    // Load voices when they become available
    const handleVoicesChanged = () => {
      loadVoices();
    };

    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      cleanup();
    };
  }, []);

  // Load available voices
  const loadVoices = useCallback(() => {
    const availableVoices = window.speechSynthesis.getVoices();
    setVoices(availableVoices);
    
    // Set default voice if not set
    if (settings.voice === 'default' && availableVoices.length > 0) {
      const defaultVoice = availableVoices.find(voice => 
        voice.lang.startsWith(settings.language)
      ) || availableVoices[0];
      
      setSettings(prev => ({ ...prev, voice: defaultVoice.name }));
    }
  }, [settings.language, settings.voice]);

  // Setup speech synthesis
  const setupSpeech = useCallback(() => {
    if (!text.trim()) return;

    // Cancel any existing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Set voice
    const selectedVoice = voices.find(voice => voice.name === settings.voice);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    // Set properties
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.volume = settings.volume;
    utterance.lang = settings.language;

    // Event handlers
    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      setError(null);
      onPlay?.();
      startTimeRef.current = Date.now();
      startProgressTimer();
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(100);
      setCurrentTime(duration);
      onComplete?.();
      stopProgressTimer();
    };

    utterance.onerror = (event) => {
      const errorMessage = getErrorMessage(event.error);
      setError(errorMessage);
      setIsPlaying(false);
      setIsPaused(false);
      onError?.(new Error(errorMessage));
      stopProgressTimer();
    };

    utterance.onpause = () => {
      setIsPaused(true);
      onPause?.();
    };

    utterance.onresume = () => {
      setIsPaused(false);
      onPlay?.();
    };

    // Calculate estimated duration
    const estimatedDuration = (text.length / 200) * 1000; // Rough estimate
    setDuration(estimatedDuration);

    return utterance;
  }, [text, voices, settings, onPlay, onPause, onComplete, onError]);

  // Start progress timer
  const startProgressTimer = useCallback(() => {
    progressIntervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Date.now() - startTimeRef.current;
        const progressPercent = Math.min((elapsed / duration) * 100, 100);
        setProgress(progressPercent);
        setCurrentTime(elapsed);
      }
    }, 100);
  }, [duration]);

  // Stop progress timer
  const stopProgressTimer = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  // Get error message
  const getErrorMessage = (error: string): string => {
    switch (error) {
      case 'network':
        return 'Network error occurred. Please check your connection.';
      case 'synthesis-failed':
        return 'Speech synthesis failed. Please try again.';
      case 'synthesis-unavailable':
        return 'Speech synthesis is not available.';
      case 'language-unavailable':
        return 'The selected language is not available.';
      case 'voice-unavailable':
        return 'The selected voice is not available.';
      case 'text-too-long':
        return 'Text is too long to synthesize.';
      case 'invalid-argument':
        return 'Invalid argument provided.';
      default:
        return `Speech synthesis error: ${error}`;
    }
  };

  // Play speech
  const playSpeech = useCallback(() => {
    if (isPlaying || disabled) return;

    try {
      setError(null);
      setIsProcessing(true);
      
      const utterance = setupSpeech();
      if (utterance) {
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start speech synthesis';
      setError(errorMessage);
      onError?.(new Error(errorMessage));
    } finally {
      setIsProcessing(false);
    }
  }, [isPlaying, disabled, setupSpeech, onError]);

  // Pause speech
  const pauseSpeech = useCallback(() => {
    if (isPlaying && !isPaused) {
      window.speechSynthesis.pause();
    }
  }, [isPlaying, isPaused]);

  // Resume speech
  const resumeSpeech = useCallback(() => {
    if (isPaused) {
      window.speechSynthesis.resume();
    }
  }, [isPaused]);

  // Stop speech
  const stopSpeech = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
    setCurrentTime(0);
    onStop?.();
    stopProgressTimer();
  }, [onStop, stopProgressTimer]);

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      if (isPaused) {
        resumeSpeech();
      } else {
        pauseSpeech();
      }
    } else {
      playSpeech();
    }
  }, [isPlaying, isPaused, playSpeech, pauseSpeech, resumeSpeech]);

  // Handle settings change
  const handleSettingsChange = useCallback((updates: Partial<VoiceSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  // Format time
  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Cleanup
  const cleanup = useCallback(() => {
    window.speechSynthesis.cancel();
    stopProgressTimer();
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, [stopProgressTimer]);

  // Auto-play effect
  useEffect(() => {
    if (autoPlay && isSupported && !disabled && text.trim()) {
      playSpeech();
    }
  }, [autoPlay, isSupported, disabled, text, playSpeech]);

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
            <h3 className="font-semibold mb-2">Voice Output Not Supported</h3>
            <p className="text-sm text-muted-foreground">
              Your browser doesn't support text-to-speech. Please use a modern browser like Chrome or Edge.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Voice Output */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Text Display */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Text to Speech</h4>
              <div className="text-sm text-muted-foreground max-h-32 overflow-y-auto">
                {text}
              </div>
            </div>

            {/* Controls */}
            {showControls && (
              <div className="flex items-center gap-2">
                <Button
                  size="lg"
                  variant={isPlaying ? "default" : "outline"}
                  onClick={togglePlayPause}
                  disabled={disabled || !text.trim()}
                  className={cn(
                    'h-10 w-10 rounded-full',
                    isPlaying && !isPaused && 'animate-pulse'
                  )}
                >
                  {isPlaying ? (
                    isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={stopSpeech}
                  disabled={!isPlaying && !isPaused}
                >
                  <Square className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentText('');
                    setHighlightedText('');
                    setProgress(0);
                    setCurrentTime(0);
                  }}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>

                {/* Status */}
                <div className="flex items-center gap-2 ml-auto">
                  <Badge variant={isPlaying ? "default" : "secondary"}>
                    {isPlaying ? (isPaused ? 'Paused' : 'Playing') : 'Ready'}
                  </Badge>
                  {isPlaying && (
                    <Badge variant="outline">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </Badge>
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
                        <DialogTitle>Voice Output Settings</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Voice</Label>
                          <Select
                            value={settings.voice}
                            onValueChange={(value) => handleSettingsChange({ voice: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {voices.map((voice, index) => (
                                <SelectItem key={index} value={voice.name}>
                                  {voice.name} ({voice.lang})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

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
                          <Label>Rate: {settings.rate}x</Label>
                          <Slider
                            value={[settings.rate]}
                            onValueChange={([value]) => handleSettingsChange({ rate: value })}
                            min={0.5}
                            max={2}
                            step={0.1}
                            className="mt-2"
                          />
                        </div>

                        <div>
                          <Label>Pitch: {settings.pitch}x</Label>
                          <Slider
                            value={[settings.pitch]}
                            onValueChange={([value]) => handleSettingsChange({ pitch: value })}
                            min={0.5}
                            max={2}
                            step={0.1}
                            className="mt-2"
                          />
                        </div>

                        <div>
                          <Label>Volume: {Math.round(settings.volume * 100)}%</Label>
                          <Slider
                            value={[settings.volume]}
                            onValueChange={([value]) => handleSettingsChange({ volume: value })}
                            min={0}
                            max={1}
                            step={0.1}
                            className="mt-2"
                          />
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label>Auto Play</Label>
                            <Switch
                              checked={settings.autoPlay}
                              onCheckedChange={(checked) => handleSettingsChange({ autoPlay: checked })}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <Label>Highlight Text</Label>
                            <Switch
                              checked={settings.highlightText}
                              onCheckedChange={(checked) => handleSettingsChange({ highlightText: checked })}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <Label>Pause on Hover</Label>
                            <Switch
                              checked={settings.pauseOnHover}
                              onCheckedChange={(checked) => handleSettingsChange({ pauseOnHover: checked })}
                            />
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            )}

            {/* Progress Bar */}
            {showProgress && isPlaying && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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

export default VoiceOutput;