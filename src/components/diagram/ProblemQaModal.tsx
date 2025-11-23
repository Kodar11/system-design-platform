'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Save, X, CheckCircle, Mic, MicOff, Trash2, Send } from 'lucide-react';
import { useDiagramStore } from '@/store/diagramStore';
import { interactWithInterviewer } from '@/app/actions';

/* ---------- Type Declarations ---------- */
interface ExtendedSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}
declare global {
  interface Window {
    SpeechRecognition: new () => ExtendedSpeechRecognition;
    webkitSpeechRecognition: new () => ExtendedSpeechRecognition;
  }
}

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
  forceLock?: boolean;
}

/* ---------- Component ---------- */
export const ProblemQaModal: React.FC<ProblemQaModalProps> = ({
  qaData,
  problemTitle,
  problemId,
  isOpen,
  onOpenChange,
  forceLock = false,
}) => {
  const {
    interviewMode,
    transcriptHistory,
    addTranscriptEntry,
    interviewPhase,
    clarifyingQuestionCount,
    maxClarifyingQuestions,
    componentBatchQueue,
    globalCooldownTime,
    lastInterruptionTime,
    setGlobalCooldownTime,
    setInterviewPhase,
    incrementClarifyingQuestionCount,
    isAIPaused,
    setIsAIPaused,
    clearComponentBatch,
  } = useDiagramStore();

  const [activeListeningIndex, setActiveListeningIndex] = useState<number | null>(null);
  const activeListeningIndexRef = useRef<number | null>(null);
  const [recognitionSupported, setRecognitionSupported] = useState(false);
  const recognitionRef = useRef<ExtendedSpeechRecognition | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  
  const [mockCurrentMessage, setMockCurrentMessage] = useState('');
  const [mockIsLoading, setMockIsLoading] = useState(false);
  const [canCloseModal, setCanCloseModal] = useState(true);
  const [pendingInterrupt, setPendingInterrupt] = useState<{ trigger: string; timestamp: number } | null>(null);

  const safeQaData = qaData
    ? {
        initialRequirementsQa: qaData.initialRequirementsQa ?? [],
        interviewQuestions: qaData.interviewQuestions ?? [],
      }
    : null;

  const numQuestions = safeQaData?.interviewQuestions.length ?? 0;

  // Choose which questions to show in practice mode:
  // Prefer interviewQuestions only if they contain at least one non-empty Q field.
  const questionsToShow: QaItem[] = (safeQaData && safeQaData.interviewQuestions && safeQaData.interviewQuestions.some(q => (q.Q || '').toString().trim().length > 0))
    ? safeQaData.interviewQuestions
    : (safeQaData?.initialRequirementsQa ?? []);

  const { control, watch, setValue } = useForm<FormData>({
    defaultValues: { answers: new Array(numQuestions).fill('') },
  });
  const watchedAnswers = watch('answers');

  const { memoizedAnswers, completedAnswers } = useMemo(() => {
    const answers = watchedAnswers || [];
    const completed = answers.filter((a) => a.trim().length > 0).length;
    return { memoizedAnswers: answers, completedAnswers: completed };
  }, [watchedAnswers]);

  // keep a ref copy to avoid recreating SpeechRecognition handlers on every change
  const memoizedAnswersRef = useRef<any[]>([]);
  useEffect(() => {
    memoizedAnswersRef.current = memoizedAnswers;
  }, [memoizedAnswers]);
  const toggleLockedRef = useRef(false);
  // Track ephemeral interim text per question (shown in UI but not persisted)
  const [interimMap, setInterimMap] = useState<Record<number, string>>({});
  // Track last final chunk per question to avoid double-appending
  const lastFinalMapRef = useRef<Record<number, string>>({});

  /* ---------- Init Speech Recognition ---------- */
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();

      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
        const idx = activeListeningIndexRef.current;
        if (idx === null) return;
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPart = event.results[i][0].transcript;
          // DEBUG: log each chunk the browser returns for inspection
          // Includes index in results and whether it's final/interim
          // Remove these logs after diagnosis
          // eslint-disable-next-line no-console
          console.log('[SR] resultPart', { questionIdx: idx, resultIndex: i, isFinal: event.results[i].isFinal, transcriptPart });
          if (event.results[i].isFinal) finalTranscript += transcriptPart;
          else interimTranscript += transcriptPart;
        }

        // Trim fragments
        const finalTrim = finalTranscript.trim();
        const interimTrim = interimTranscript.trim();

        // Update ephemeral interim display (do not persist)
        if (interimTrim) {
          setInterimMap((m) => ({ ...m, [idx]: interimTrim }));
        } else {
          setInterimMap((m) => {
            if (!(idx in m)) return m;
            const copy = { ...m };
            delete copy[idx];
            return copy;
          });
        }

        // If there's a final transcript, append it to the persisted answer only if it's not already present
        if (finalTrim) {
          const base = (memoizedAnswersRef.current[idx] || '').trim();
          // DEBUG: show base, final and interim before writing
          // eslint-disable-next-line no-console
          console.log('[SR] beforeSetValue', { questionIdx: idx, base, finalTrim, interimTrim, eventResultIndex: event.resultIndex, eventResultsLength: event.results.length });

          const lastFinal = lastFinalMapRef.current[idx] || '';
          // If base already ends with finalTrim or we already appended this final, skip
          if (!base.endsWith(finalTrim) && lastFinal !== finalTrim) {
            const newVal = (base ? base + ' ' : '') + finalTrim;
            // eslint-disable-next-line no-console
            console.log('[SR] appendingFinal', { questionIdx: idx, newVal });
            setValue(`answers.${idx}`, newVal.trim());
            lastFinalMapRef.current[idx] = finalTrim;
          } else {
            // eslint-disable-next-line no-console
            console.log('[SR] skippingAppend', { questionIdx: idx, base, finalTrim, lastFinal });
          }

          // After committing final, clear ephemeral interim for this question
          setInterimMap((m) => {
            if (!(idx in m)) return m;
            const copy = { ...m };
            delete copy[idx];
            return copy;
          });
        }
      };

      recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        activeListeningIndexRef.current = null;
        setActiveListeningIndex(null);

        const err = event.error;
        if (err === 'network') setMicError('Network error: Check your internet connection and retry.');
        else if (err === 'not-allowed') setMicError('Microphone access denied. Click "Enable Microphone" to grant permission.');
        else if (err === 'service-not-allowed') setMicError('Speech service blocked. Try a different browser.');
        else if (err === 'audio-capture') setMicError('No microphone found or audio device is unavailable. Check your system settings.');
        else setMicError(`Speech recognition error: ${err}`);
      };

      recognitionInstance.onstart = () => {
        console.log('SpeechRecognition started');
        // DEBUG: log start event with current active index
        // eslint-disable-next-line no-console
        console.log('[SR] onstart', { activeListeningIndex: activeListeningIndexRef.current, time: Date.now() });
        // rely on onstart to set listening state
        setIsListening(true);
        setMicError(null);
      };

      recognitionInstance.onend = () => {
        // DEBUG: log end event with current active index
        // eslint-disable-next-line no-console
        console.log('[SR] onend', { activeListeningIndex: activeListeningIndexRef.current, time: Date.now() });
        console.log('SpeechRecognition ended');
        setIsListening(false);
        activeListeningIndexRef.current = null;
        setActiveListeningIndex(null);
      };

      recognitionRef.current = recognitionInstance;
      setRecognitionSupported(true);
    } else {
      setRecognitionSupported(false);
    }

    return () => {
      console.log('Cleaning up SpeechRecognition');
      try { recognitionRef.current?.stop(); } catch (e) {}
      recognitionRef.current = null;
    };
    // initialize once on mount
  }, []);

  /* ---------- Voice Controls ---------- */
  const startListening = (index: number) => {
    if (!recognitionSupported || !recognitionRef.current) {
      alert('Speech recognition not supported in this browser.');
      return;
    }
    try {
      setActiveListeningIndex(index);
      activeListeningIndexRef.current = index;
      // stop any previous instance before starting to reduce 'aborted' errors
      try { recognitionRef.current.stop(); } catch (e) {}
      recognitionRef.current.start();
      setIsListening(true);
      // clear any previous mic error when user intentionally starts listening
      setMicError(null);
    } catch (e) {
      console.error('Failed to start recognition:', e);
      // Common DOM exceptions for permissions
      // @ts-ignore
      if (e && (e.name === 'NotAllowedError' || e.name === 'SecurityError')) {
        setMicError('Microphone permission denied. Click "Enable Microphone" to grant permission.');
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      setIsListening(false);
      activeListeningIndexRef.current = null;
      setActiveListeningIndex(null);
    }
  };

  const toggleListening = (index: number) => {
    if (toggleLockedRef.current) return;
    toggleLockedRef.current = true;
    setTimeout(() => { toggleLockedRef.current = false; }, 600);

    if (activeListeningIndex === index && isListening) stopListening();
    else startListening(index);
  };

  const requestMicAccess = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicError('Microphone API not available in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Immediately stop tracks - we just wanted permission
      stream.getTracks().forEach((t) => t.stop());
      setMicError(null);
      // If recognition was previously initialized, try to re-enable
      if (recognitionRef.current) {
        const idx = activeListeningIndexRef.current;
        if (idx !== null && !isListening) {
          try {
            recognitionRef.current.start();
            setIsListening(true);
            setActiveListeningIndex(idx);
          } catch (err) {
            console.warn('Failed to start recognition after granting permission', err);
          }
        }
      }
    } catch (err: unknown) {
      console.error('getUserMedia error:', err);
      // @ts-ignore
      const name = err && err.name ? err.name : String(err);
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setMicError('Microphone permission denied. Please allow microphone access in your browser.');
      } else {
        setMicError('Unable to access microphone. Check that a microphone is connected and not in use by another app.');
      }
    }
  };

  const clearAnswer = (index: number) => setValue(`answers.${index}`, '');
  
  const handleClose = () => {
    stopListening();
    
    // During clarification phase, user can always close (except when AI is responding)
    if (interviewPhase === 'clarification' && !isAIPaused && !mockIsLoading) {
      onOpenChange(false);
      return;
    }
    
    // During design phase, check if modal is locked
    if (!canCloseModal || forceLock || isAIPaused) {
      console.log('Cannot close modal:', { canCloseModal, forceLock, isAIPaused });
      return;
    }
    
    onOpenChange(false);
  };

  const handleMockSendMessage = async () => {
    if (!mockCurrentMessage.trim() || mockIsLoading) return;

    const userMessage = mockCurrentMessage.trim();
    setMockCurrentMessage('');
    addTranscriptEntry('User', userMessage);

    const questionPattern = /[?]/g;
    const questionCount = userMessage.match(questionPattern)?.length || 0;
    
    if (interviewPhase === 'clarification' && questionCount > 0) {
      for (let i = 0; i < questionCount; i++) {
        incrementClarifyingQuestionCount();
      }
    }

    setMockIsLoading(true);
    setIsAIPaused(true);
    setCanCloseModal(false);

    try {
      const response = await interactWithInterviewer({
        problemId,
        transcriptHistory,
        interviewPhase,
        clarifyingQuestionCount,
        maxClarifyingQuestions,
        componentBatchQueue,
        globalCooldownTime,
        lastInterruptionTime,
        trigger: 'user_message',
        userMessage,
      });

      await new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 2000));

      addTranscriptEntry('AI', response.aiMessage, 'response');

      if (response.transitionToDesign) {
        setInterviewPhase('design');
        console.log('✅ Transitioned to design phase - user can now close modal and start designing');
      }

      const cooldownEnd = Date.now() + response.cooldownDuration;
      setGlobalCooldownTime(cooldownEnd);

      setTimeout(() => {
        setGlobalCooldownTime(null);
        setIsAIPaused(false);
        // In design phase or after transition, always allow closing unless it's an interrupt question
        setCanCloseModal(true);
      }, response.cooldownDuration);

      clearComponentBatch();

    } catch (error: unknown) {
      console.error('Mock interview error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to communicate with interviewer';
      addTranscriptEntry('AI', `[Error: ${errorMessage}]`, 'error');
      setIsAIPaused(false);
      setCanCloseModal(true);
    } finally {
      setMockIsLoading(false);
    }
  };

  useEffect(() => {
    if (interviewMode === 'mock' && isOpen && transcriptHistory.length === 0) {
      const initializeMockInterview = async () => {
        setIsAIPaused(true);
        setCanCloseModal(false);
        
        try {
          const response = await interactWithInterviewer({
            problemId,
            transcriptHistory: [],
            interviewPhase: 'clarification',
            clarifyingQuestionCount: 0,
            maxClarifyingQuestions,
            componentBatchQueue: [],
            globalCooldownTime: null,
            lastInterruptionTime: null,
            trigger: 'initial',
          });

          addTranscriptEntry('AI', response.aiMessage, 'greeting');
          
          setIsAIPaused(false);
          // Allow user to close after initial greeting - they can ask questions when ready
          setCanCloseModal(true);
          console.log('✅ Initial greeting complete - user can close modal or ask questions');
        } catch (error: unknown) {
          console.error('Failed to initialize mock interview:', error);
          setIsAIPaused(false);
          setCanCloseModal(true);
        }
      };

      initializeMockInterview();
    }
  }, [interviewMode, isOpen, transcriptHistory.length, problemId, maxClarifyingQuestions, addTranscriptEntry, setIsAIPaused]);

  // Listen for interruptions globally (even when modal is closed)
  useEffect(() => {
    if (interviewMode !== 'mock' || interviewPhase !== 'design') {
      console.log('Not setting up interrupt listener:', { interviewMode, interviewPhase });
      return;
    }

    const handleInterrupt = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { trigger } = customEvent.detail;
      
      console.log('🔔 Interrupt received in ProblemQaModal:', { 
        trigger, 
        modalOpen: isOpen, 
        currentPhase: interviewPhase,
        transcriptLength: transcriptHistory.length 
      });
      
      // Store the pending interrupt
      setPendingInterrupt({ trigger, timestamp: Date.now() });
    };

    window.addEventListener('mockInterviewInterrupt', handleInterrupt);
    console.log('✅ Interrupt listener added to ProblemQaModal');

    return () => {
      window.removeEventListener('mockInterviewInterrupt', handleInterrupt);
      console.log('❌ Interrupt listener removed from ProblemQaModal');
    };
  }, [interviewMode, interviewPhase, isOpen, transcriptHistory.length]);

  // Process pending interrupts when modal opens
  useEffect(() => {
    console.log('Checking for pending interrupt:', {
      isOpen,
      hasPendingInterrupt: !!pendingInterrupt,
      mockIsLoading,
      interviewMode,
      interviewPhase,
      pendingInterruptDetails: pendingInterrupt
    });

    if (!isOpen || !pendingInterrupt || mockIsLoading || interviewMode !== 'mock' || interviewPhase !== 'design') {
      return;
    }

    const processPendingInterrupt = async () => {
      const { trigger } = pendingInterrupt;
      
      console.log('🚀 Processing pending interrupt:', trigger);
      
      // Clear the pending interrupt immediately
      setPendingInterrupt(null);
      
      setMockIsLoading(true);
      setIsAIPaused(true);
      setCanCloseModal(false);

      try {
        console.log('📞 Calling interactWithInterviewer with:', {
          trigger,
          transcriptLength: transcriptHistory.length,
          componentBatchLength: componentBatchQueue.length
        });

        const response = await interactWithInterviewer({
          problemId,
          transcriptHistory,
          interviewPhase,
          clarifyingQuestionCount,
          maxClarifyingQuestions,
          componentBatchQueue,
          globalCooldownTime,
          lastInterruptionTime,
          trigger: trigger as 'component_added' | 'structured_time' | 'idle_timeout',
        });

        console.log('✅ AI Response received:', response.aiMessage.substring(0, 100) + '...');

        // Simulate thinking delay
        await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));

        addTranscriptEntry('AI', response.aiMessage, 'question');
        console.log('✅ AI message added to transcript');

        const cooldownEnd = Date.now() + response.cooldownDuration;
        setGlobalCooldownTime(cooldownEnd);

        // Lock modal only while AI is asking the question - user must answer
        setCanCloseModal(false);

        setTimeout(() => {
          setGlobalCooldownTime(null);
          setIsAIPaused(false);
          // After cooldown, allow closing ONLY after user has answered
          // We'll unlock when they send their answer
        }, response.cooldownDuration);

        clearComponentBatch();

      } catch (error: unknown) {
        console.error('Interrupt question error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to get AI question';
        addTranscriptEntry('AI', `[Error: ${errorMessage}]`, 'error');
        setIsAIPaused(false);
        setCanCloseModal(true);
      } finally {
        setMockIsLoading(false);
      }
    };

    processPendingInterrupt();
  }, [isOpen, pendingInterrupt, mockIsLoading, interviewMode, interviewPhase, problemId, transcriptHistory, clarifyingQuestionCount, maxClarifyingQuestions, componentBatchQueue, globalCooldownTime, lastInterruptionTime, addTranscriptEntry, setIsAIPaused, setGlobalCooldownTime, clearComponentBatch]);

  if (!isOpen || !safeQaData) return null;

  /* ---------- UI ---------- */
  if (interviewMode === 'mock') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border-2 border-blue-500 dark:border-blue-600 max-w-4xl max-h-[85vh] w-full flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b-2 border-blue-500 dark:border-blue-600 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    🎤 Mock Interview Mode
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {interviewPhase === 'clarification' 
                      ? `Clarification Phase (${clarifyingQuestionCount}/${maxClarifyingQuestions} questions asked)`
                      : 'High-Level Design Phase - Answer AI questions about your design'}
                  </p>
                </div>
              </div>
              {/* Show close button based on phase and AI state */}
              {(interviewPhase === 'clarification' && !isAIPaused && !mockIsLoading) || 
               (interviewPhase === 'design' && canCloseModal && !isAIPaused && !forceLock) ? (
                <button
                  onClick={handleClose}
                  className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  title="Close"
                >
                  <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </button>
              ) : (
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg" title="Cannot close - AI is asking a question">
                  <X className="w-5 h-5 text-red-600 dark:text-red-400 opacity-50" />
                </div>
              )}
            </div>
          </div>

          {/* Body - Transcript */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-gray-800">
            {transcriptHistory.map((entry, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl ${
                  entry.role === 'AI'
                    ? 'bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-600'
                    : 'bg-green-100 dark:bg-green-900/30 border-l-4 border-green-600 ml-8'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`font-bold text-sm ${
                    entry.role === 'AI' ? 'text-blue-700 dark:text-blue-300' : 'text-green-700 dark:text-green-300'
                  }`}>
                    {entry.role === 'AI' ? '🤖 Interviewer' : '👤 You'}
                  </div>
                  <div className="flex-1 text-gray-900 dark:text-gray-100">
                    {entry.message}
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
            
            {mockIsLoading && (
              <div className="p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    AI
                  </span>
                  <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    Thinking...
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer - Input */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-3">
              <textarea
                value={mockCurrentMessage}
                onChange={(e) => setMockCurrentMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleMockSendMessage();
                  }
                }}
                placeholder={isAIPaused ? "Waiting for AI response..." : "Type your message..."}
                disabled={mockIsLoading || isAIPaused}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent min-h-[44px] max-h-32 resize-y disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              />
              <button
                onClick={handleMockSendMessage}
                disabled={!mockCurrentMessage.trim() || mockIsLoading || isAIPaused}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm h-[44px]"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </div>
            {isAIPaused && (
              <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
                Waiting for AI response...
              </div>
            )}
          </div>
          {micError && (
            <div className="p-3 mt-2 mx-4 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-sm text-red-700 dark:text-red-300 flex items-center justify-between">
              <div>{micError}</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={requestMicAccess}
                  className="px-3 py-1.5 bg-white dark:bg-gray-800 text-sm rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-100"
                >
                  Enable Microphone
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-4xl max-h-[85vh] w-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <CheckCircle className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-2xl font-bold">{problemTitle}</h2>
                <p className="text-sm text-gray-500">
                  📝 Practice Mode - Answer the questions below (type or use voice)
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Problem Statement (show requirements/answers) */}
          {safeQaData.initialRequirementsQa && safeQaData.initialRequirementsQa.length > 0 && (
            <div className="p-4 border rounded-xl dark:border-gray-700 shadow-sm bg-gray-50 dark:bg-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Problem Statement</h3>
              {safeQaData.initialRequirementsQa.map((item, idx) => (
                <p key={idx} className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                  {item.A || item.Q}
                </p>
              ))}
            </div>
          )}

          {questionsToShow.map((item, index) => (
            <div
              key={index}
              className="p-4 border rounded-xl dark:border-gray-700 shadow-sm space-y-3"
            >
              <h4 className="font-semibold text-gray-900 dark:text-white">
                Q{index + 1}: {item.Q || item.A}
              </h4>

              <Controller
                name={`answers.${index}`}
                control={control}
                render={({ field }) => {
                  const persisted = (field.value || '').trim();
                  const interim = interimMap[index] || '';
                  const display = interim ? (persisted ? persisted + ' ' + interim : interim) : persisted;

                  return (
                    <textarea
                      value={display}
                      onChange={(e) => {
                        // When user types, persist only their typed value (strip ephemeral interim if present)
                        let v = e.target.value || '';
                        if (interim) {
                          const suffix = persisted ? ' ' + interim : interim;
                          if (v.endsWith(suffix)) {
                            v = v.slice(0, v.length - suffix.length).trimEnd();
                          }
                        }
                        setValue(`answers.${index}`, v);
                      }}
                      onBlur={field.onBlur}
                      name={field.name}
                      placeholder={`Type or speak your answer...`}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 min-h-[120px] resize-y"
                    />
                  );
                }}
              />

              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleListening(index)}
                  disabled={!recognitionSupported}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium border ${
                    activeListeningIndex === index && isListening
                      ? 'bg-red-100 border-red-300 text-red-700'
                      : 'bg-green-100 border-green-300 text-green-700'
                  }`}
                >
                  {activeListeningIndex === index && isListening ? (
                    <>
                      <MicOff className="w-4 h-4" /> Stop
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" /> Speak
                    </>
                  )}
                </button>

                <button
                  onClick={() => clearAnswer(index)}
                  className="px-4 py-2 text-sm bg-red-100 border border-red-300 text-red-700 rounded-lg flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" /> Clear
                </button>

                {activeListeningIndex === index && isListening && (
                  <span className="text-sm text-red-500 animate-pulse">● Listening...</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <Mic className="w-4 h-4" />
            {recognitionSupported
              ? 'Voice input active — speak to answer'
              : 'Voice input not supported'}
          </div>
          <button
            onClick={handleClose}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Close
          </button>
        </div>
        {micError && (
          <div className="p-3 mx-6 mb-6 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-sm text-red-700 dark:text-red-300 flex items-center justify-between">
            <div>{micError}</div>
            <div>
              <button
                onClick={requestMicAccess}
                className="px-3 py-1.5 bg-white dark:bg-gray-800 text-sm rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-100"
              >
                Enable Microphone
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
