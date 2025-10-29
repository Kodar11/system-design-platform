'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Save, X, CheckCircle, Mic, MicOff, Trash2 } from 'lucide-react';

// ✅ Custom speech recognition type declarations
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  0: SpeechRecognitionAlternative;
  length: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error:
    | 'no-speech'
    | 'aborted'
    | 'audio-capture'
    | 'network'
    | 'not-allowed'
    | 'service-not-allowed'
    | 'bad-grammar'
    | 'language-not-supported';
}

interface ExtendedSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
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

// ---------------------- Interfaces ----------------------

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

// ---------------------- Component ----------------------

export const ProblemQaModal: React.FC<ProblemQaModalProps> = ({
  qaData,
  problemTitle,
  isOpen,
  onOpenChange,
}) => {
  const [activeListeningIndex, setActiveListeningIndex] = useState<number | null>(null);
  const [recognitionSupported, setRecognitionSupported] = useState(false);
  const recognitionRef = useRef<ExtendedSpeechRecognition | null>(null);
  const isListeningRef = useRef<boolean>(false);

  const safeQaData = qaData
    ? {
        initialRequirementsQa: qaData.initialRequirementsQa ?? [],
        interviewQuestions: qaData.interviewQuestions ?? [],
      }
    : null;

  const numQuestions = safeQaData?.interviewQuestions.length ?? 0;

  const { control, watch, setValue } = useForm<FormData>({
    defaultValues: {
      answers: new Array(numQuestions).fill(''),
    },
  });

  const { answers: watchedAnswers } = watch();

const { memoizedAnswers, completedAnswers } = useMemo(() => {
  const answers = watchedAnswers || [];
  const completed = answers.filter(a => a.trim().length > 0).length;
  return {
    memoizedAnswers: answers,
    completedAnswers: completed,
  };
}, [watchedAnswers]);


  // ✅ Detect browser speech recognition support
  useEffect(() => {
    const supported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    setRecognitionSupported(supported);
  }, []);

  // ✅ Speech result callback
  const onResultCallback = useCallback(
    (event: SpeechRecognitionEvent) => {
      if (activeListeningIndex === null) return;

      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      const currentAnswer = memoizedAnswers[activeListeningIndex] || '';
      const updatedAnswer = currentAnswer
        ? `${currentAnswer} ${transcript.trim()}`
        : transcript.trim();
      setValue(`answers.${activeListeningIndex}`, updatedAnswer);

      setTimeout(() => {
        const textarea = document.querySelector(
          `textarea[data-question="${activeListeningIndex}"]`
        ) as HTMLTextAreaElement | null;
        if (textarea) {
          textarea.style.height = 'auto';
          textarea.style.height = `${Math.min(textarea.scrollHeight, 300)}px`;
        }
      }, 50);
    },
    [activeListeningIndex, setValue, memoizedAnswers]
  );

  // ✅ Setup speech recognition instance
  useEffect(() => {
    if (!recognitionSupported) return;

    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) return;

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = onResultCallback;
    recognitionRef.current = recognition;

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        alert('Microphone access denied. Please allow microphone permissions.');
      } else if (event.error === 'network') {
        alert('Speech recognition requires HTTPS. Continuing without voice input.');
        setRecognitionSupported(false);
      } else if (event.error === 'no-speech') {
        console.log('No speech detected.');
      }
      stopListening();
    };

    recognition.onend = () => {
      if (isListeningRef.current && activeListeningIndex !== null) {
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
      try {
        recognition.stop();
      } catch {
        /* ignore */
      }
    };
  }, [recognitionSupported, onResultCallback, activeListeningIndex]);

  // ---------------------- Voice Controls ----------------------

  const startListening = (questionIndex: number) => {
    if (!recognitionSupported) {
      alert('Speech recognition not supported or not on HTTPS.');
      return;
    }

    const recognition = recognitionRef.current;
    if (recognition && !isListeningRef.current) {
      try {
        setActiveListeningIndex(questionIndex);
        isListeningRef.current = true;
        recognition.start();
      } catch (e) {
        console.error('Error starting recognition:', e);
        alert('Could not start microphone. Check permissions.');
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
      if (activeListeningIndex !== null) stopListening();
      setTimeout(() => startListening(questionIndex), 100);
    }
  };

  const clearAnswer = (index: number) => setValue(`answers.${index}`, '');
  const handleClose = () => {
    stopListening();
    onOpenChange(false);
  };

  useEffect(() => () => stopListening(), []);

  // ---------------------- UI ----------------------

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
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {problemTitle}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Interview Preparation — Answer questions to simulate a real interview
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress */}
          {numQuestions > 0 && (
            <>
              <div className="mt-6 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500 ease-out shadow-sm"
                  style={{ width: `${(completedAnswers / numQuestions) * 100}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-right">
                {completedAnswers}/{numQuestions} answers completed
              </p>
            </>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Initial Requirements */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
              Initial Requirements (Reference)
            </h3>
            <div className="space-y-4">
              {safeQaData.initialRequirementsQa.map((item, i) => (
                <div
                  key={`init-${i}`}
                  className="border-l-4 border-blue-400 dark:border-blue-500 pl-4 bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg"
                >
                  <p className="font-semibold text-gray-900 dark:text-white">{item.Q}</p>
                  <p className="text-gray-600 dark:text-gray-300 mt-2">{item.A}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Interview Questions */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
              Interview Questions (Your Answers)
            </h3>
            <div className="space-y-6">
              {safeQaData.interviewQuestions.map((item, index) => (
                <div
                  key={`interview-${index}`}
                  className="space-y-4 p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all"
                >
                  <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                    Q{index + 1}: {item.Q}
                  </h4>
                  <Controller
                    name={`answers.${index}`}
                    control={control}
                    render={({ field }) => (
                      <textarea
                        {...field}
                        data-question={index}
                        placeholder={`Type your detailed answer for Q${index + 1}...`}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 min-h-[120px] resize-y"
                      />
                    )}
                  />
                  <div className="flex flex-wrap gap-3 items-center">
                    {/* Mic */}
                    <button
                      onClick={() => toggleListening(index)}
                      disabled={!recognitionSupported}
                      className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 border shadow-sm transition-all ${
                        activeListeningIndex === index
                          ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 animate-pulse'
                          : recognitionSupported
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700 cursor-not-allowed'
                      }`}
                    >
                      {activeListeningIndex === index ? (
                        <>
                          <MicOff className="w-4 h-4" /> Stop Recording
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4" /> Voice Input
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => clearAnswer(index)}
                      className="px-4 py-2 text-sm font-medium bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800 shadow-sm flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" /> Clear
                    </button>

                    {activeListeningIndex === index && (
                      <span className="text-sm text-red-600 dark:text-red-400 animate-pulse">
                        ● Listening...
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
                    {memoizedAnswers[index]?.length || 0} / 1000 characters
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-6 flex justify-between items-center">
          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <Mic className="w-4 h-4" />
            {recognitionSupported
              ? 'Click the mic button to use voice input'
              : 'Voice input requires HTTPS'}
          </div>
          <button
            onClick={handleClose}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-md flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Close
          </button>
        </div>
      </div>
    </div>
  );
};
