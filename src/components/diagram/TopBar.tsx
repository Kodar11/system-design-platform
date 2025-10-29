// Updated src/components/diagram/TopBar.tsx
// (Fixed TS error: Safe length access with explicit guard)

'use client';

import React, { useEffect, useState } from 'react';
import { useDiagramStore } from '@/store/diagramStore';
import { useReactFlow } from 'reactflow';
import { useRouter, usePathname } from 'next/navigation';
import { submitProblemSolution } from '@/app/actions';
import { getProblem } from '@/app/actions';
import Link from 'next/link';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { ProblemQaModal } from '@/components/diagram/ProblemQaModal'; // UPDATED: Import from diagram folder

export const TopBar = () => {
  const { nodes, edges, totalCost, budget, hasCriticalErrors, computeCostsAndErrors, setProblemData, setBudget, setConfigurationTargets } = useDiagramStore();
  const reactFlowInstance = useReactFlow();
  const router = useRouter();
  const pathname = usePathname();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [problemMode, setProblemMode] = useState(false);
  const [problemId, setProblemId] = useState<string | null>(null);
  const [qaData, setQaData] = useState<{ initialRequirementsQa: any[]; interviewQuestions: any[] } | null>(null); // NEW: QA data
  const [showQaModal, setShowQaModal] = useState(false); // NEW: Modal state

  const { undo, redo, pastStates, futureStates } = useDiagramStore.temporal.getState();

  // Detect problem mode based on URL
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

  // Load problem data (UPDATED: Include QA fields)
  useEffect(() => {
    if (problemId) {
      getProblem(problemId)
        .then((problem) => {
          if (problem && problem.requirements) {
            const reqs = problem.requirements as any;
            setProblemData(reqs);
            setBudget(reqs.budget_usd);
            setConfigurationTargets(reqs.configuration_targets || {});
            
            // NEW: Set QA data (TS safe cast)
            setQaData({
              initialRequirementsQa: (problem.initialRequirementsQa as any[]) || [],
              interviewQuestions: (problem.interviewQuestions as any[]) || [],
            });
            
            computeCostsAndErrors();
          }
        })
        .catch((error) => {
          console.error('Failed to load problem:', error);
        });
    }
  }, [problemId, setProblemData, setBudget, setConfigurationTargets, computeCostsAndErrors]);

  // NEW: Get submitted answers from localStorage on submit
  const getSubmittedAnswers = (): string[] => {
    if (!problemId || !qaData?.interviewQuestions) return [];
    const saved = localStorage.getItem(`qaAnswers_${problemId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const handleSave = () => {
    if (reactFlowInstance) {
      const flow = reactFlowInstance.toObject();
      console.log('Saved flow:', flow);
      alert('Diagram state saved to console!');
    }
  };

  const handleFitView = () => reactFlowInstance?.fitView();

  // UPDATED: Handle submit to include answers
  const handleSubmit = async () => {
    if (!problemId) {
      alert('Problem ID not found. Please return to problem page and try again.');
      return;
    }
    if (nodes.length === 0) {
      alert('Please add at least one component to your diagram before submitting.');
      return;
    }
    const submittedAnswers = getSubmittedAnswers(); // NEW: Get answers
    
    // TS Fix: Safe length calculation
    const numQuestions = qaData?.interviewQuestions?.length || 0;
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
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data,
        width: node.width,
        height: node.height,
      })),
      edges: edges.map(edge => ({
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
      viewport: reactFlowInstance?.getViewport() || { x: 0, y: 0, zoom: 1 },
      metadata: {
        componentCount: nodes.length,
        connectionCount: edges.length,
        submittedAt: new Date().toISOString(),
      },
    };

    try {
      setIsSubmitting(true);
      console.log('Submitting diagram with data and answers:', { diagramData, submittedAnswers });
      const submissionId = await submitProblemSolution(problemId, diagramData, submittedAnswers); // UPDATED: Pass answers
      console.log('Submission successful, redirecting to result page:', submissionId);
      router.push(`/problems/${problemId}/result/${submissionId}`);
    } catch (error) {
      console.error('Submission error:', error);
      alert(`Submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ... (rest of the shared handlers remain the same: handleZoomToSelection, hasSelection, sharedControls)

  const handleZoomToSelection = () => {
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
        title="Redo (Ctrl+Y / Ctrl+Shift+Z)"
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

  if (problemMode) {
    const isOverBudget = budget !== undefined && totalCost > budget;
    const submitDisabled = isSubmitting || nodes.length === 0 || (budget !== undefined && isOverBudget) || hasCriticalErrors;

    // NEW: Problem title for modal
    const problemTitle =  problemId || 'Problem';

    return (
      <div className="top-bar p-4 bg-card border-b border-border flex justify-between items-center shadow-sm">
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
            <p className="text-xs text-muted-foreground">Design your solution using the diagram editor</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* NEW: Q&A Button/Modal Trigger */}
          {qaData && (
            <button
              onClick={() => setShowQaModal(true)}
              className="px-4 py-2 border border-input bg-background text-foreground rounded-lg hover:bg-accent transition-colors"
            >
              Q&A Interview
            </button>
          )}

          {/* Stats */}
          <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
            <div className="flex items-center gap-1 text-sm text-foreground">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <span className="font-medium">{nodes.length}</span>
            </div>
            <span className="text-muted-foreground">|</span>
            <div className="flex items-center gap-1 text-sm text-foreground">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span className="font-medium">{edges.length}</span>
            </div>
          </div>
          <Link
            href="/docs"
            className="p-2 rounded hover:bg-accent transition-colors"
            title="Documentation"
          >
            <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </Link>
          {budget !== undefined && (
            <div className="flex items-center gap-4 px-3 py-2 bg-muted rounded-lg">
              <div className={`text-sm font-medium ${isOverBudget ? 'text-destructive' : 'text-green-600'}`}>
                Total: ${totalCost.toFixed(2)}
              </div>
              <span className="text-muted-foreground">/</span>
              <div className={`text-sm ${isOverBudget ? 'text-destructive' : 'text-muted-foreground'}`}>
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
            title={submitDisabled ? (isOverBudget ? 'Over budget' : hasCriticalErrors ? 'Resolve configuration errors' : 'Add components first') : ''}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        {/* NEW: Render the modal */}
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

  // === Normal mode toolbar (unchanged) ===
  return (
    <div className="top-bar p-4 bg-secondary flex justify-between items-center">
      <Link
        href="/docs"
        className="p-2 rounded hover:bg-accent transition-colors"
        title="Documentation"
      >
        <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </Link>
      <input
        type="text"
        placeholder="Diagram Title"
        className="p-2 rounded border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <div className="flex gap-2">
        <button onClick={handleSave} className="p-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
          Save
        </button>
        {sharedControls}
        <ThemeToggle />
      </div>
    </div>
  );
};