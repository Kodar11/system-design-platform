'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Save, X, CheckCircle, Mic, MicOff, Trash2 } from 'lucide-react';

/* ---------- Type Declarations ---------- */
interface ExtendedSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
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
}

/* ---------- Component ---------- */
export const ProblemQaModal: React.FC<ProblemQaModalProps> = ({
  qaData,
  problemTitle,
  isOpen,
  onOpenChange,
}) => {
  const [activeListeningIndex, setActiveListeningIndex] = useState<number | null>(null);
  const [recognitionSupported, setRecognitionSupported] = useState(false);
  const recognitionRef = useRef<ExtendedSpeechRecognition | null>(null);
  const [isListening, setIsListening] = useState(false);

  const safeQaData = qaData
    ? {
        initialRequirementsQa: qaData.initialRequirementsQa ?? [],
        interviewQuestions: qaData.interviewQuestions ?? [],
      }
    : null;

  const numQuestions = safeQaData?.interviewQuestions.length ?? 0;

  const { control, watch, setValue } = useForm<FormData>({
    defaultValues: { answers: new Array(numQuestions).fill('') },
  });
  const watchedAnswers = watch('answers');

  const { memoizedAnswers, completedAnswers } = useMemo(() => {
    const answers = watchedAnswers || [];
    const completed = answers.filter((a) => a.trim().length > 0).length;
    return { memoizedAnswers: answers, completedAnswers: completed };
  }, [watchedAnswers]);

  /* ---------- Init Speech Recognition ---------- */
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();

      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event) => {
        if (activeListeningIndex === null) return;
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          const updated = (memoizedAnswers[activeListeningIndex] || '') + ' ' + finalTranscript;
          setValue(`answers.${activeListeningIndex}`, updated.trim());
        }
      };

      recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setActiveListeningIndex(null);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
        setActiveListeningIndex(null);
      };

      recognitionRef.current = recognitionInstance;
      setRecognitionSupported(true);
    } else {
      setRecognitionSupported(false);
    }

    return () => {
      recognitionRef.current?.stop();
    };
  }, [activeListeningIndex, setValue, memoizedAnswers]);

  /* ---------- Voice Controls ---------- */
  const startListening = (index: number) => {
    if (!recognitionSupported || !recognitionRef.current) {
      alert('Speech recognition not supported in this browser.');
      return;
    }
    try {
      setActiveListeningIndex(index);
      setIsListening(true);
      recognitionRef.current.start();
    } catch (e) {
      console.error('Failed to start recognition:', e);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      setActiveListeningIndex(null);
    }
  };

  const toggleListening = (index: number) => {
    if (activeListeningIndex === index && isListening) stopListening();
    else startListening(index);
  };

  const clearAnswer = (index: number) => setValue(`answers.${index}`, '');
  const handleClose = () => {
    stopListening();
    onOpenChange(false);
  };

  if (!isOpen || !safeQaData) return null;

  /* ---------- UI ---------- */
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
                  Answer the questions below — you can type or use voice.
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
          {safeQaData.interviewQuestions.map((item, index) => (
            <div
              key={index}
              className="p-4 border rounded-xl dark:border-gray-700 shadow-sm space-y-3"
            >
              <h4 className="font-semibold text-gray-900 dark:text-white">
                Q{index + 1}: {item.Q}
              </h4>

              <Controller
                name={`answers.${index}`}
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    placeholder={`Type or speak your answer...`}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 min-h-[120px] resize-y"
                  />
                )}
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
      </div>
    </div>
  );
};
