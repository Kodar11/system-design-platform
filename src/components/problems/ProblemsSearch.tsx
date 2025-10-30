// src/components/problems/ProblemsSearch.tsx
"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';

interface Problem {
  id: string;
  title: string;
  difficulty: string;
  requirements: unknown;
}

interface ProblemsSearchProps {
  problems: Problem[];
}

export default function ProblemsSearch({ problems }: ProblemsSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'text-green-900 dark:text-green-400 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800';
      case 'MEDIUM': return 'text-yellow-900 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800';
      case 'HARD': return 'text-red-900 dark:text-red-400 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800';
      default: return 'text-gray-900 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800';
    }
  };

  // Filter problems
  const filteredProblems = useMemo(() => {
    return problems.filter((problem) => {
      const matchesSearch = problem.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDifficulty = filterDifficulty === 'all' || problem.difficulty === filterDifficulty;
      return matchesSearch && matchesDifficulty;
    });
  }, [problems, searchTerm, filterDifficulty]);

  return (
    <>
      {/* Search and Filter Bar */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search problems..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
          />
        </div>
        <select
          value={filterDifficulty}
          onChange={(e) => setFilterDifficulty(e.target.value)}
          className="px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
        >
          <option value="all">All Difficulties</option>
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </select>
      </div>

      {/* Results Count */}
      <p className="text-sm text-muted-foreground mb-4">
        Showing {filteredProblems.length} of {problems.length} problems
      </p>

      {/* Problems Grid */}
      {filteredProblems.length === 0 ? (
        <div className="bg-card rounded-lg shadow-lg p-12 text-center border-2 border-border">
          <p className="text-muted-foreground text-lg">No problems found matching your search.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProblems.map((problem) => (
            <Link
              key={problem.id}
              href={`/problems/${problem.id}`}
              className="bg-card rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 p-6 border-2 border-border hover:border-primary/30 hover:bg-accent/30"
            >
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground flex-1">
                  {problem.title}
                </h2>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(problem.difficulty)}`}>
                  {problem.difficulty}
                </span>
              </div>
              
              <div className="text-sm text-muted-foreground mb-4">
                {typeof problem.requirements === 'object' && problem.requirements !== null && 
                  'description' in problem.requirements
                  ? String((problem.requirements as { description?: string }).description).slice(0, 150) + '...'
                  : 'Click to view problem details'}
              </div>

              <div className="flex items-center text-primary font-medium text-sm">
                View Problem
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
