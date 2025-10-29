// src/components/diagram/ProblemQaModal.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Save, X, CheckCircle, Mic, MicOff, Trash2 } from 'lucide-react';

interface QaItem {
  Q: string;
  A: string;
}

interface ProblemQaData {
  initialRequirementsQa: QaItem[];
  interviewQuestions: QaItem[];
}

interface FormData {
  answers: string[];
}

interface ProblemQaModalProps {
  qaData: ProblemQaData | null;
  problemTitle: string;
  problemId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProblemQaModal: React.FC<ProblemQaModalProps> = ({
  qaData,
  problemTitle,
  problemId,
  isOpen,
  onOpenChange,
}) => {
  const [activeListeningIndex, setActiveListeningIndex] = useState<number | null>(null);
  const [recognitionSupported, setRecognitionSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);

  // Cast qaData fields properly
  const safeQaData = qaData ? {
    initialRequirementsQa: (qaData.initialRequirementsQa as QaItem[]) || [],
    interviewQuestions: (qaData.interviewQuestions as QaItem[]) || [],
  } : null;

  const numQuestions = safeQaData?.interviewQuestions.length || 0;

  // Use react-hook-form for answers management
  const { control, watch, setValue } = useForm<FormData>({
    defaultValues: {
      answers: new Array(numQuestions).fill(''),
    },
  });

  // Watch answers for progress
  const watchedAnswers = watch('answers') || [];
  const completedAnswers = watchedAnswers.filter(a => a.trim().length > 0).length;

  // Check SpeechRecognition support on mount
  useEffect(() => {
    const supported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    setRecognitionSupported(supported);
  }, []);

  // Stable onResult callback
  const onResultCallback = useCallback((event: any) => {
    if (activeListeningIndex === null) return;

    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    
    const currentAnswer = watchedAnswers[activeListeningIndex] || '';
    const updatedAnswer = currentAnswer ? currentAnswer + ' ' + transcript.trim() : transcript.trim();
    setValue(`answers.${activeListeningIndex}`, updatedAnswer);

    // Auto-resize and focus textarea
    setTimeout(() => {
      const textarea = document.querySelector(`textarea[data-question="${activeListeningIndex}"]`) as HTMLTextAreaElement;
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 300) + 'px';
      }
    }, 50);
  }, [activeListeningIndex, setValue, watchedAnswers]);

  // Speech Recognition setup
  useEffect(() => {
    if (!recognitionSupported) return;

    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) return;

    recognitionRef.current = new SpeechRecognitionClass();
    const recognition = recognitionRef.current;

    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = onResultCallback;

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      
      // Handle specific errors gracefully
      if (event.error === 'not-allowed') {
        alert('Microphone access denied. Please allow microphone permission in your browser settings and reload the page.');
      } else if (event.error === 'network') {
        // Network error - typically happens on HTTP (not HTTPS)
        console.warn('Speech recognition requires HTTPS. Continuing without voice input.');
        setRecognitionSupported(false);
      } else if (event.error === 'no-speech') {
        // User didn't speak - just log it, don't alert
        console.log('No speech detected, continuing...');
        return; // Don't stop listening
      } else if (event.error === 'aborted') {
        // User manually stopped - normal behavior
        console.log('Speech recognition aborted by user');
      } else {
        console.warn(`Speech recognition error: ${event.error}`);
      }
      
      stopListening();
    };

    recognition.onend = () => {
      if (isListeningRef.current && activeListeningIndex !== null) {
        // Restart if still supposed to be listening
        try {
          recognition.start();
        } catch (e) {
          console.error('Error restarting recognition:', e);
          stopListening();
        }
      } else {
        stopListening();
      }
    };

    return () => {
      if (recognition) {
        try {
          recognition.stop();
        } catch (e) {
          console.error('Error stopping recognition on cleanup:', e);
        }
      }
    };
  }, [recognitionSupported, onResultCallback, activeListeningIndex]);

  const startListening = (questionIndex: number) => {
    const recognition = recognitionRef.current;
    if (!recognitionSupported) {
      alert('Speech recognition is not supported. On localhost, you need HTTPS. Use: npm run dev -- --experimental-https\n\nAlternatively, type your answers manually.');
      return;
    }

    if (recognition && !isListeningRef.current) {
      try {
        setActiveListeningIndex(questionIndex);
        isListeningRef.current = true;
        recognition.start();
      } catch (e) {
        console.error('Error starting recognition:', e);
        alert('Failed to start microphone. Please check your permissions and ensure you are using HTTPS.');
        stopListening();
      }
    }
  };

  const stopListening = () => {
    const recognition = recognitionRef.current;
    if (recognition && isListeningRef.current) {
      try {
        isListeningRef.current = false;
        recognition.stop();
      } catch (e) {
        console.error('Error stopping recognition:', e);
      }
    }
    setActiveListeningIndex(null);
  };

  const toggleListening = (questionIndex: number) => {
    if (activeListeningIndex === questionIndex) {
      stopListening();
    } else {
      if (activeListeningIndex !== null) {
        stopListening();
      }
      setTimeout(() => startListening(questionIndex), 100);
    }
  };

  const clearAnswer = (index: number) => {
    setValue(`answers.${index}`, '');
  };

  const handleClose = () => {
    stopListening();
    onOpenChange(false);
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      stopListening();
    };
  }, []);

  if (!isOpen || !safeQaData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-4xl max-h-[85vh] w-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{problemTitle}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Interview Preparation - Answer questions to simulate a real interview</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Progress Bar */}
          {numQuestions > 0 && (
            <div className="mt-6 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500 ease-out shadow-sm" 
                style={{ width: `${(completedAnswers / numQuestions) * 100}%` }}
              />
            </div>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-right">
            {completedAnswers}/{numQuestions} answers completed
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Initial Requirements (Read-only) */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-200">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Initial Requirements (Reference)
            </h3>
            <div className="space-y-4">
              {safeQaData.initialRequirementsQa.map((item, index) => (
                <div key={`initial-${index}`} className="border-l-4 border-blue-400 dark:border-blue-500 pl-4 bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
                  <p className="font-semibold text-gray-900 dark:text-white">{item.Q}</p>
                  <p className="text-gray-600 dark:text-gray-300 mt-2">{item.A}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Interview Questions */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-200">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Interview Questions (Your Answers)
            </h3>
            <div className="space-y-6">
              {safeQaData.interviewQuestions.map((item, index) => (
                <div key={`interview-${index}`} className="space-y-4 p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-start justify-between">
                    <h4 className="font-semibold text-gray-900 dark:text-white flex-1 text-lg">
                      Q{index + 1}: {item.Q}
                    </h4>
                  </div>
                  <Controller
                    name={`answers.${index}`}
                    control={control}
                    render={({ field }) => (
                      <textarea
                        {...field}
                        data-question={index}
                        placeholder={`Type your detailed answer for Q${index + 1}... or click the mic button to speak`}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px] resize-y text-base leading-relaxed shadow-sm"
                        rows={4}
                      />
                    )}
                  />
                  <div className="flex flex-wrap gap-3 items-center">
                    {/* Mic Button */}
                    <button
                      onClick={() => toggleListening(index)}
                      disabled={!recognitionSupported}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 border shadow-sm flex items-center gap-2 ${
                        activeListeningIndex === index
                          ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 hover:bg-red-200 dark:hover:bg-red-800 animate-pulse'
                          : recognitionSupported
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 hover:bg-green-200 dark:hover:bg-green-800'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700 cursor-not-allowed'
                      }`}
                      title={!recognitionSupported ? 'Speech recognition not supported in this browser' : activeListeningIndex === index ? 'Stop recording' : 'Start voice input'}
                    >
                      {activeListeningIndex === index ? (
                        <>
                          <MicOff className="w-4 h-4" />
                          Stop Recording
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4" />
                          Voice Input
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => clearAnswer(index)}
                      className="px-4 py-2 text-sm font-medium bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-all duration-200 border border-red-200 dark:border-red-800 shadow-sm flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear
                    </button>

                    {activeListeningIndex === index && (
                      <span className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1 animate-pulse">
                        <span className="w-2 h-2 bg-red-600 dark:bg-red-400 rounded-full"></span>
                        Listening...
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
                    {watchedAnswers[index]?.length || 0} / 1000 characters
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-6 flex justify-between items-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {recognitionSupported ? (
              <span className="flex items-center gap-2">
                <Mic className="w-4 h-4" />
                Click the mic button to use voice input
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Mic className="w-4 h-4 opacity-50" />
                Voice input requires HTTPS connection
              </span>
            )}
          </div>
          <button 
            onClick={handleClose} 
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Close
          </button>
        </div>
      </div>
    </div>
  );
};