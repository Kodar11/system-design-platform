'use client';

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useDiagramStore } from '@/store/diagramStore';
import { useReactFlow } from 'reactflow';
import { useRouter, usePathname } from 'next/navigation';
import { submitProblemSolution, getProblem } from '@/app/actions';
import Link from 'next/link';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { ProblemQaModal } from '@/components/diagram/ProblemQaModal';
import { ConfigurationTarget } from '@/types/configuration';
import { debounce } from '@/lib/utils/debounce';



interface RequirementData {
  budget_usd?: number | null;
  configuration_targets?: Record<
    string,
    ConfigurationTarget | Record<string, ConfigurationTarget>
  > | null;
}

/**
 * Top-level problem type (safe wrapper for unknown data).
 */
interface ProblemDataSafe {
  id?: string;
  requirements?: RequirementData | null;
  initialRequirementsQa?: unknown;
  interviewQuestions?: unknown;
}

/**
 * The shape ProblemQaModal expects: array of objects with Q and A fields.
 */
interface QaItem {
  Q: string;
  A: string;
}

interface ProblemQaData {
  initialRequirementsQa: QaItem[];
  interviewQuestions: QaItem[];
}

// ------------------------------------------------ //

export const TopBar: React.FC = () => {
  const {
    nodes,
    edges,
    totalCost,
    budget,
    hasCriticalErrors,
    computeCostsAndErrors,
    setProblemData,
    setBudget,
    setConfigurationTargets,
  } = useDiagramStore();

  const reactFlowInstance = useReactFlow();
  const router = useRouter();
  const pathname = usePathname();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [problemMode, setProblemMode] = useState(false);
  const [problemId, setProblemId] = useState<string | null>(null);
  const [qaData, setQaData] = useState<ProblemQaData | null>(null);
  const [showQaModal, setShowQaModal] = useState(false);
  
  // Auto-save state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const debouncedSaveRef = useRef<ReturnType<typeof debounce> | null>(null);

  const { undo, redo, pastStates, futureStates } = useDiagramStore.temporal.getState();

  // ✅ Optimized: Selective subscriptions - only re-render when these specific values change
  const interviewMode = useDiagramStore((state) => state.interviewMode);
  const transcriptHistory = useDiagramStore((state) => state.transcriptHistory);
  const componentBatchQueue = useDiagramStore((state) => state.componentBatchQueue);
  const interviewPhase = useDiagramStore((state) => state.interviewPhase);

  // Detect problem mode from URL
  useEffect(() => {
    const match = pathname.match(/^\/problems\/([^\/]+)(?:\/|$)/);
    if (match && match[1]) {
      const id = match[1];
      setProblemMode(true);
      setProblemId(id);
      sessionStorage.setItem('currentProblemId', id);
    } else {
      setProblemMode(false);
      setProblemId(null);
    }
  }, [pathname]);

  // Listen for mock interview interrupts from Editor
  useEffect(() => {
    if (interviewMode !== 'mock' || interviewPhase !== 'design') return;

    const handleInterrupt = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('Mock interview interrupt received:', customEvent.detail);
      
      // Open the modal automatically
      setShowQaModal(true);
    };

    window.addEventListener('mockInterviewInterrupt', handleInterrupt);

    return () => {
      window.removeEventListener('mockInterviewInterrupt', handleInterrupt);
    };
  }, [interviewMode, interviewPhase]);

  // Normalize unknown QA arrays into QaItem[]
  const normalizeToQaItems = (value: unknown): QaItem[] => {
    if (!value) return [];
    if (!Array.isArray(value)) return [];

    return value.map((raw): QaItem => {
      if (raw && typeof raw === 'object' && 'Q' in raw && 'A' in (raw as Record<string, unknown>)) {
        const r = raw as Record<string, unknown>;
        return {
          Q: typeof r.Q === 'string' ? r.Q : String(r.Q ?? ''),
          A: typeof r.A === 'string' ? r.A : String(r.A ?? ''),
        };
      }

      if (raw && typeof raw === 'object') {
        const r = raw as Record<string, unknown>;
        const q =
          (typeof r.question === 'string' && r.question) ||
          (typeof r.questionText === 'string' && r.questionText) ||
          (typeof r.q === 'string' && r.q) ||
          '';
        const a =
          (typeof r.answer === 'string' && r.answer) ||
          (typeof r.answerText === 'string' && r.answerText) ||
          (typeof r.a === 'string' && r.a) ||
          '';
        return { Q: q, A: a };
      }

      return { Q: String(raw ?? ''), A: '' };
    });
  };

  useEffect(() => {
    if (!problemId) return;

    getProblem(problemId)
      .then((res: unknown): void => {
        if (!res || typeof res !== 'object') return;

        const problem = res as ProblemDataSafe;
        const requirements = problem.requirements ?? null;

        if (requirements && typeof requirements === 'object') {
          setProblemData(requirements as Record<string, unknown>);

          if (typeof requirements.budget_usd === 'number') {
            setBudget(requirements.budget_usd);
          }

          if (
            requirements.configuration_targets &&
            typeof requirements.configuration_targets === 'object'
          ) {
            setConfigurationTargets(
              requirements.configuration_targets as Record<
                string,
                ConfigurationTarget | Record<string, ConfigurationTarget>
              >
            );
          }
        }

        const normalizedQa: ProblemQaData = {
          initialRequirementsQa: normalizeToQaItems(problem.initialRequirementsQa),
          interviewQuestions: normalizeToQaItems(problem.interviewQuestions),
        };

        setQaData(normalizedQa);
        computeCostsAndErrors();

        if (interviewMode === 'mock') {
          setShowQaModal(true);
        }
      })
      .catch((err: unknown) => {
        console.error('Failed to load problem:', err);
      });
  }, [problemId, setProblemData, setBudget, setConfigurationTargets, computeCostsAndErrors, interviewMode]);

  // Retrieve submitted answers safely
  const getSubmittedAnswers = (): string[] => {
    if (!problemId || !qaData?.interviewQuestions) return [];
    const saved = localStorage.getItem(`qaAnswers_${problemId}`);
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed)
        ? parsed.filter((v) => typeof v === 'string') as string[]
        : [];
    } catch {
      return [];
    }
  };

  // Auto-save function
  const saveToLocalStorage = useCallback(async () => {
    if (!reactFlowInstance) return;
    
    try {
      setIsSaving(true);
      const flow = reactFlowInstance.toObject();
      const key = problemId ? `diagram_${problemId}` : 'diagram_autosave';
      
      localStorage.setItem(key, JSON.stringify({
        ...flow,
        savedAt: new Date().toISOString(),
      }));
      
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      console.log('✅ Auto-saved diagram to localStorage');
    } catch (error) {
      console.error('❌ Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [reactFlowInstance, problemId]);

  // Create debounced save function
  useEffect(() => {
    debouncedSaveRef.current = debounce(saveToLocalStorage, 2000);
    
    return () => {
      // Cleanup: flush any pending save on unmount
      debouncedSaveRef.current?.flush();
    };
  }, [saveToLocalStorage]);

  // Track changes to nodes/edges
  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      setHasUnsavedChanges(true);
      debouncedSaveRef.current?.();
    }
  }, [nodes, edges]);

  // Emergency save on page unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        debouncedSaveRef.current?.flush();
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Save immediately when leaving the page
  useEffect(() => {
    const handleRouteChange = () => {
      debouncedSaveRef.current?.flush();
    };

    return () => {
      handleRouteChange();
    };
  }, []);

  const handleSave = (): void => {
    debouncedSaveRef.current?.flush();
    alert('Diagram saved successfully!');
  };

  const handleFitView = (): void => {
    reactFlowInstance?.fitView();
  };

  const handleSubmit = async (): Promise<void> => {
    if (!problemId) {
      alert('Problem ID not found. Please return to the problem page and try again.');
      return;
    }
    if (nodes.length === 0) {
      alert('Please add at least one component to your diagram before submitting.');
      return;
    }

    const submittedAnswers = getSubmittedAnswers();
    const numQuestions = qaData?.interviewQuestions.length ?? 0;

    if (submittedAnswers.length === 0 && numQuestions > 0) {
      const confirmNoAnswers = window.confirm(
        'No answers provided for interview questions. Proceed without verbal explanations?'
      );
      if (!confirmNoAnswers) return;
    }

    const confirmed = window.confirm(
      `You are about to submit your solution with ${nodes.length} components, ${edges.length} connections, and ${submittedAnswers.length}/${numQuestions} answers. Continue?`
    );
    if (!confirmed) return;

    const diagramData = {
      nodes: nodes.map((node) => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data,
        width: node.width,
        height: node.height,
      })),
      edges: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        label: typeof edge.label === 'string' ? edge.label : edge.label?.toString() || undefined,
        type: edge.type,
        animated: edge.animated,
        style: edge.style,
      })),
      viewport: reactFlowInstance?.getViewport() ?? { x: 0, y: 0, zoom: 1 },
      metadata: {
        componentCount: nodes.length,
        connectionCount: edges.length,
        submittedAt: new Date().toISOString(),
      },
    };

    try {
      setIsSubmitting(true);
      console.log('Submitting diagram with data and answers:', { 
        diagramData, 
        submittedAnswers, 
        transcriptHistory: interviewMode === 'mock' ? transcriptHistory : undefined,
        interviewMode 
      });
      
      const submissionId = await submitProblemSolution(
        problemId, 
        diagramData, 
        submittedAnswers,
        interviewMode === 'mock' ? transcriptHistory : undefined,
        interviewMode || undefined
      );
      
      router.push(`/problems/${problemId}/result/${submissionId}`);
    } catch (err: unknown) {
      console.error('Submission error:', err);
      alert(`Submission failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleZoomToSelection = (): void => {
    const selected = nodes.filter((n) => n.selected);
    if (selected.length > 0 && reactFlowInstance) {
      reactFlowInstance.fitView({ nodes: selected, padding: 0.25, duration: 600 });
    } else {
      handleFitView();
    }
  };

  const hasSelection = nodes.some((n) => n.selected);

  const sharedControls = (
    <>
      <button
        onClick={() => undo()}
        className="p-2 rounded bg-muted text-muted-foreground hover:bg-accent transition-colors disabled:opacity-50"
        disabled={pastStates.length === 0}
        title="Undo (Ctrl+Z)"
      >
        ⤺
      </button>
      <button
        onClick={() => redo()}
        className="p-2 rounded bg-muted text-muted-foreground hover:bg-accent disabled:opacity-50 transition-colors"
        disabled={futureStates.length === 0}
        title="Redo (Ctrl+Y)"
      >
        ⤼
      </button>
      <button
        onClick={handleFitView}
        className="p-2 rounded bg-muted text-muted-foreground hover:bg-accent transition-colors"
        title="Fit View"
      >
        ⤢
      </button>
      <button
        onClick={handleZoomToSelection}
        disabled={!hasSelection}
        className="p-2 rounded bg-muted text-muted-foreground hover:bg-accent disabled:opacity-50 transition-colors"
        title="Zoom to Selection"
      >
        🔍
      </button>
    </>
  );

  // ---------------- Problem Mode ----------------
  if (problemMode) {
    const isOverBudget =
      budget !== undefined && totalCost > budget;
    const submitDisabled =
      isSubmitting ||
      nodes.length === 0 ||
      (budget !== undefined && isOverBudget) ||
      hasCriticalErrors;

    const problemTitle = problemId || 'Problem';

    return (
      <div className="top-bar p-4 bg-card border-b border-border flex justify-between items-center shadow-sm">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <Link
            href="/problems"
            className="p-2 rounded hover:bg-accent transition-colors"
            title="Back to Problems"
          >
            <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>

          <div>
            <h1 className="text-lg font-semibold text-foreground">
              Problem: {problemId}
            </h1>
            <p className="text-xs text-muted-foreground">
              Design your solution using the diagram editor
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Auto-save Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg text-xs">
            {isSaving ? (
              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Saving...
              </span>
            ) : hasUnsavedChanges ? (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <span className="h-2 w-2 rounded-full bg-amber-600 dark:bg-amber-400 animate-pulse"></span>
                Unsaved
              </span>
            ) : lastSaved ? (
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Saved
              </span>
            ) : null}
          </div>

          {/* Q&A Modal */}
          {qaData && (
            <button
              onClick={() => setShowQaModal(true)}
              className="px-4 py-2 border border-input bg-background text-foreground rounded-lg hover:bg-accent transition-colors"
            >
              Q&A Interview
            </button>
          )}

          {/* Diagram Stats */}
          <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
            <div className="flex items-center gap-1 text-sm text-foreground">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className="font-medium">{nodes.length}</span>
            </div>
            <span className="text-muted-foreground">|</span>
            <div className="flex items-center gap-1 text-sm text-foreground">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="font-medium">{edges.length}</span>
            </div>
          </div>

          <Link href="/docs" className="p-2 rounded hover:bg-accent transition-colors" title="Documentation">
            <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </Link>

          {budget !== undefined && (
            <div className="flex items-center gap-4 px-3 py-2 bg-muted rounded-lg">
              <div
                className={`text-sm font-medium ${
                  isOverBudget ? 'text-destructive' : 'text-green-600'
                }`}
              >
                Total: ${totalCost.toFixed(2)}
              </div>
              <span className="text-muted-foreground">/</span>
              <div
                className={`text-sm ${
                  isOverBudget ? 'text-destructive' : 'text-muted-foreground'
                }`}
              >
                ${budget}
              </div>
            </div>
          )}

          <div className="h-8 w-px bg-border"></div>

          {sharedControls}

          <div className="h-8 w-px bg-border"></div>

          <ThemeToggle />

          <button
            onClick={handleSubmit}
            disabled={submitDisabled}
            className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
            title={
              submitDisabled
                ? isOverBudget
                  ? 'Over budget'
                  : hasCriticalErrors
                  ? 'Resolve configuration errors'
                  : 'Add components first'
                : ''
            }
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  ></path>
                </svg>
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Submit Solution</span>
              </>
            )}
          </button>
        </div>

        {qaData && problemId && (
          <ProblemQaModal
            qaData={qaData}
            problemTitle={problemTitle}
            problemId={problemId}
            isOpen={showQaModal}
            onOpenChange={setShowQaModal}
          />
        )}
      </div>
    );
  }

  // === Normal mode toolbar ===
  return (
    <div className="top-bar p-4 bg-secondary flex justify-between items-center">
      <Link
        href="/docs"
        className="p-2 rounded hover:bg-accent transition-colors"
        title="Documentation"
      >
        📘
      </Link>
      <div className="flex items-center gap-3">
        {sharedControls}
        <div className="h-8 w-px bg-border"></div>
        <ThemeToggle />
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/80 transition-colors"
        >
          Save Diagram
        </button>
      </div>
    </div>
  );
};
