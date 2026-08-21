import React, { useState, useEffect } from 'react';
import { 
  X, 
  HelpCircle, 
  Sparkles, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Award, 
  Brain, 
  BookOpen, 
  ArrowRight, 
  ArrowLeft,
  ChevronRight,
  Flame,
  Check,
  RefreshCw
} from 'lucide-react';
import { RoadmapTopic, InterviewQnA } from '../types';

interface QuizFlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic: RoadmapTopic;
  topics: RoadmapTopic[];
  onSelectTopic: (topicId: number) => void;
}

interface QuizOption {
  text: string;
  isCorrect: boolean;
}

interface GeneratedQuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
  explanation: string;
  difficulty: string;
}

export const QuizFlashcardModal: React.FC<QuizFlashcardModalProps> = ({
  isOpen,
  onClose,
  topic,
  topics,
  onSelectTopic
}) => {
  const [activeTab, setActiveTab] = useState<'flashcards' | 'quiz'>('flashcards');

  // Flashcards State
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [flashcardScore, setFlashcardScore] = useState(0);
  const [reviewedCards, setReviewedCards] = useState<Record<number, boolean>>({});

  // Quiz State
  const [quizQuestions, setQuizQuestions] = useState<GeneratedQuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);

  // Generate flashcards & quiz questions whenever topic changes
  useEffect(() => {
    if (!topic) return;

    // Reset Flashcard state
    setCardIndex(0);
    setIsFlipped(false);
    setFlashcardScore(0);
    setReviewedCards({});

    // Generate Quiz Questions from Interview Questions & Core Concepts
    const questions: GeneratedQuizQuestion[] = (topic.interviewQuestions || []).map((q, idx) => {
      const wrongOptions = [
        "It increases parameters without improving model convergence.",
        "It is only applicable to CPU environments and lacks GPU acceleration.",
        "It eliminates gradient updates entirely during backpropagation.",
        "It is a legacy method replaced by basic linear regression."
      ];

      const options: QuizOption[] = [
        { text: q.answerSummary, isCorrect: true },
        { text: wrongOptions[(idx) % wrongOptions.length], isCorrect: false },
        { text: wrongOptions[(idx + 1) % wrongOptions.length], isCorrect: false },
        { text: wrongOptions[(idx + 2) % wrongOptions.length], isCorrect: false }
      ].sort(() => Math.random() - 0.5);

      return {
        id: `q-${idx}`,
        question: q.question,
        options,
        explanation: q.keyTakeaway || q.answerSummary,
        difficulty: q.difficulty
      };
    });

    setQuizQuestions(questions);
    setQuizIndex(0);
    setSelectedOptionIndex(null);
    setQuizScore(0);
    setIsQuizCompleted(false);
  }, [topic?.id, isOpen]);

  if (!isOpen || !topic) return null;

  const currentFlashcard = (topic.interviewQuestions && topic.interviewQuestions[cardIndex]) || {
    question: `What is the core objective of ${topic.title}?`,
    answerSummary: topic.overview,
    difficulty: 'Mid-Level',
    keyTakeaway: `Key concepts: ${topic.coreConcepts.map(c => c.title).join(', ')}`
  };

  const handleFlashcardRating = (gotItRight: boolean) => {
    if (gotItRight) {
      setFlashcardScore((prev) => prev + 1);
    }
    setReviewedCards((prev) => ({ ...prev, [cardIndex]: gotItRight }));
    setIsFlipped(false);

    if (cardIndex < (topic.interviewQuestions?.length || 1) - 1) {
      setCardIndex((prev) => prev + 1);
    }
  };

  const handleSelectQuizOption = (optionIndex: number) => {
    if (selectedOptionIndex !== null) return; // Prevent double answer
    setSelectedOptionIndex(optionIndex);

    const currentQ = quizQuestions[quizIndex];
    if (currentQ && currentQ.options[optionIndex].isCorrect) {
      setQuizScore((prev) => prev + 1);
    }
  };

  const handleNextQuizQuestion = () => {
    if (quizIndex < quizQuestions.length - 1) {
      setQuizIndex((prev) => prev + 1);
      setSelectedOptionIndex(null);
    } else {
      setIsQuizCompleted(true);
    }
  };

  const currentQuizQ = quizQuestions[quizIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn font-sans select-none">
      <div className="w-full max-w-2xl bg-[#0D1117] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-slate-950 shadow-md">
              <Brain className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">Active Recall & Quiz Hub</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Step {topic.stepNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium truncate max-w-sm">
                Topic: <span className="text-amber-300 font-bold">{topic.title}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab & Step Switcher */}
        <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('flashcards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'flashcards'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🎴 Flashcards</span>
            </button>

            <button
              onClick={() => setActiveTab('quiz')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'quiz'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>📝 MCQ Quiz</span>
              {quizQuestions.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-slate-900 text-amber-300">
                  {quizQuestions.length}
                </span>
              )}
            </button>
          </div>

          {/* Context Topic Selector */}
          <select
            value={topic.id}
            onChange={(e) => onSelectTopic(Number(e.target.value))}
            className="bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-amber-300 px-3 py-1.5 focus:outline-none focus:border-amber-400 truncate max-w-[210px]"
          >
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                Step {t.stepNumber}: {t.title}
              </option>
            ))}
          </select>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto custom-scrollbar">
          {/* ======================================================== */}
          {/* TAB 1: 🎴 ACTIVE RECALL FLASHCARDS MODE */}
          {/* ======================================================== */}
          {activeTab === 'flashcards' && (
            <div className="flex flex-col items-center justify-between min-h-[380px] space-y-4">
              {/* Progress & Counter Bar */}
              <div className="w-full flex items-center justify-between text-xs font-mono font-bold text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>Card {cardIndex + 1} of {topic.interviewQuestions?.length || 1}</span>
                </span>

                <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Score: {flashcardScore} / {topic.interviewQuestions?.length || 1}
                </span>
              </div>

              {/* 3D Flip Flashcard */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className={`w-full min-h-[260px] rounded-3xl p-6 border-2 cursor-pointer transition-all duration-500 shadow-2xl flex flex-col justify-between relative overflow-hidden ${
                  isFlipped
                    ? 'bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-950 border-cyan-400/80 shadow-[0_0_35px_rgba(6,182,212,0.2)]'
                    : 'bg-gradient-to-br from-slate-900 via-[#0D1117] to-slate-950 border-amber-500/60 hover:border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.25)]'
                }`}
              >
                {/* Top Badge */}
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                    isFlipped ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}>
                    {isFlipped ? 'ANSWER & KEY TAKEAWAYS' : `QUESTION • ${currentFlashcard.difficulty}`}
                  </span>

                  <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 text-amber-400 animate-spin-slow" />
                    <span>Click card to flip</span>
                  </span>
                </div>

                {/* Card Main Text */}
                <div className="my-4">
                  {!isFlipped ? (
                    <div>
                      <h4 className="text-lg md:text-xl font-black text-white leading-snug">
                        {currentFlashcard.question}
                      </h4>
                      <p className="text-xs text-slate-400 mt-2">
                        Try to explain the answer in your head before flipping the card!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-sm font-semibold text-slate-100 leading-relaxed">
                        {currentFlashcard.answerSummary}
                      </div>

                      {currentFlashcard.keyTakeaway && (
                        <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200">
                          <span className="font-bold text-cyan-400 block mb-1">💡 Key Takeaway:</span>
                          {currentFlashcard.keyTakeaway}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Card Footer */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Step {topic.stepNumber}: {topic.categoryLabel}</span>
                  <span className="text-amber-400 font-bold">{isFlipped ? 'Back' : 'Front'}</span>
                </div>
              </div>

              {/* Action Rating Buttons */}
              <div className="w-full grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => handleFlashcardRating(false)}
                  className="py-2.5 px-4 rounded-2xl bg-slate-900 hover:bg-red-500/20 border border-slate-800 hover:border-red-500/40 text-slate-300 hover:text-red-300 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span>Need Review</span>
                </button>

                <button
                  onClick={() => handleFlashcardRating(true)}
                  className="py-2.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                  <span>Got It Right! (+1)</span>
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: 📝 MULTIPLE-CHOICE QUIZ MODE */}
          {/* ======================================================== */}
          {activeTab === 'quiz' && (
            <div className="min-h-[380px] flex flex-col justify-between space-y-4">
              {!isQuizCompleted && currentQuizQ ? (
                <>
                  {/* Quiz Header Info */}
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400">
                    <span>Question {quizIndex + 1} of {quizQuestions.length}</span>
                    <span className="px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      Score: {quizScore} / {quizQuestions.length}
                    </span>
                  </div>

                  {/* Question Box */}
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                      {currentQuizQ.difficulty} Question
                    </span>
                    <h4 className="text-base font-bold text-white mt-2 leading-relaxed">
                      {currentQuizQ.question}
                    </h4>
                  </div>

                  {/* 4 Options Grid */}
                  <div className="space-y-2">
                    {currentQuizQ.options.map((opt, idx) => {
                      const isSelected = selectedOptionIndex === idx;
                      const isAnswered = selectedOptionIndex !== null;

                      let btnStyle = 'bg-slate-900 border-slate-800 text-slate-200 hover:border-amber-400 hover:bg-slate-850';
                      if (isAnswered) {
                        if (opt.isCorrect) {
                          btnStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-200 font-bold';
                        } else if (isSelected) {
                          btnStyle = 'bg-red-500/20 border-red-500 text-red-200 font-bold';
                        } else {
                          btnStyle = 'bg-slate-950 border-slate-900 text-slate-500 opacity-60';
                        }
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => handleSelectQuizOption(idx)}
                          disabled={isAnswered}
                          className={`w-full p-3 rounded-2xl border text-xs text-left transition-all flex items-center justify-between gap-3 ${btnStyle}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center font-mono font-bold shrink-0">
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span className="leading-relaxed">{opt.text}</span>
                          </div>

                          {isAnswered && opt.isCorrect && (
                            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation Box when answered */}
                  {selectedOptionIndex !== null && (
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs animate-fadeIn space-y-2">
                      <div className="font-bold text-amber-400 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" />
                        <span>Explanation & Rationale:</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed font-sans">
                        {currentQuizQ.explanation}
                      </p>

                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={handleNextQuizQuestion}
                          className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md transition-all"
                        >
                          <span>{quizIndex < quizQuestions.length - 1 ? 'Next Question' : 'View Results'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Quiz Complete Card */
                <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-indigo-600 p-0.5 shadow-2xl flex items-center justify-center">
                    <div className="w-full h-full rounded-full bg-[#0D1117] flex items-center justify-center text-amber-400">
                      <Award className="w-8 h-8" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-white">Topic Quiz Completed!</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      You mastered Step {topic.stepNumber}: <span className="text-amber-300 font-bold">{topic.title}</span>
                    </p>
                  </div>

                  <div className="px-6 py-4 rounded-3xl bg-slate-900 border border-slate-800 text-center font-mono">
                    <span className="text-3xl font-black text-amber-400">
                      {Math.round((quizScore / (quizQuestions.length || 1)) * 100)}%
                    </span>
                    <span className="block text-xs text-slate-400 mt-1">
                      Final Score: {quizScore} / {quizQuestions.length}
                    </span>
                  </div>

                  <div className="pt-4 flex items-center gap-3">
                    <button
                      onClick={() => {
                        setQuizIndex(0);
                        setSelectedOptionIndex(null);
                        setQuizScore(0);
                        setIsQuizCompleted(false);
                      }}
                      className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 transition-colors flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4 text-amber-400" />
                      <span>Retake Quiz</span>
                    </button>

                    <button
                      onClick={onClose}
                      className="px-5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-400/20"
                    >
                      Continue Roadmap
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
