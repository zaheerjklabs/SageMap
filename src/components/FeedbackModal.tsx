import React, { useState, useEffect } from 'react';
import { 
  X, 
  MessageSquarePlus, 
  Sparkles, 
  Bug, 
  BookOpen, 
  HelpCircle, 
  Star, 
  Send, 
  CheckCircle2, 
  Heart,
  Loader2,
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FeedbackCategory, RoadmapTopic } from '../types';
import { submitFeedback } from '../services/feedbackService';
import { useAuth } from '../contexts/AuthContext';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  topics: RoadmapTopic[];
  initialTopicId?: number;
  onFeedbackSubmitted?: (message: string) => void;
}

const CATEGORIES: { id: FeedbackCategory; label: string; icon: any; color: string; ringColor: string; description: string }[] = [
  {
    id: 'feature',
    label: 'Feature Request',
    icon: Sparkles,
    color: 'from-amber-500/20 to-yellow-500/20 text-amber-300 border-amber-500/40',
    ringColor: 'ring-amber-500/50',
    description: 'Suggest a new roadmap feature, tool, or visualization'
  },
  {
    id: 'content',
    label: 'Resource Suggestion',
    icon: BookOpen,
    color: 'from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/40',
    ringColor: 'ring-cyan-500/50',
    description: 'Recommend a course, paper, video, or GitHub repo'
  },
  {
    id: 'bug',
    label: 'Bug Report',
    icon: Bug,
    color: 'from-rose-500/20 to-red-500/20 text-rose-300 border-rose-500/40',
    ringColor: 'ring-rose-500/50',
    description: 'Report a broken link, typo, or UI issue'
  },
  {
    id: 'question',
    label: 'Question',
    icon: HelpCircle,
    color: 'from-purple-500/20 to-indigo-500/20 text-purple-300 border-purple-500/40',
    ringColor: 'ring-purple-500/50',
    description: 'Ask a question about the curriculum or study guide'
  },
  {
    id: 'general',
    label: 'General Feedback',
    icon: MessageSquarePlus,
    color: 'from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/40',
    ringColor: 'ring-emerald-500/50',
    description: 'Share your thoughts, praise, or overall experience'
  }
];

const RATING_LABELS: Record<number, { text: string; emoji: string }> = {
  1: { text: 'Needs Improvement', emoji: '🙁' },
  2: { text: 'Fair Experience', emoji: '😐' },
  3: { text: 'Good Platform', emoji: '🙂' },
  4: { text: 'Very Impressive!', emoji: '😃' },
  5: { text: 'Outstanding & Loved it!', emoji: '🌟' }
};

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  topics,
  initialTopicId,
  onFeedbackSubmitted
}) => {
  const { user } = useAuth();

  const [category, setCategory] = useState<FeedbackCategory>('feature');
  const [topicId, setTopicId] = useState<number | undefined>(initialTopicId);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pre-fill user data if logged in
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
      const extractedName = user.user_metadata?.full_name || user.email.split('@')[0];
      setName(extractedName);
    }
  }, [user]);

  // Sync initial topic when opened
  useEffect(() => {
    if (initialTopicId) {
      setTopicId(initialTopicId);
    }
  }, [initialTopicId, isOpen]);

  // Reset form when reopened
  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setErrorMessage(null);
      if (!message) {
        setCategory('feature');
        setRating(5);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setErrorMessage('Please enter your feedback message.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await submitFeedback({
        category,
        message,
        topicId: topicId || undefined,
        rating,
        userName: name || undefined,
        userEmail: email || undefined,
        userId: user?.id
      });

      setIsSuccess(true);

      // Trigger celebratory confetti effect
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch {}

      if (onFeedbackSubmitted) {
        onFeedbackSubmitted('Thank you! Your feedback has been sent directly to the SageMap team.');
      }
    } catch (err: any) {
      console.error('Error submitting feedback:', err);
      setErrorMessage(err?.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setMessage('');
    setIsSuccess(false);
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity" 
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col bg-[#0D1117]/95 border border-amber-500/30 rounded-3xl shadow-2xl shadow-amber-500/10 backdrop-blur-2xl overflow-hidden z-10 text-slate-200 font-sans">
        
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-gradient-to-r from-slate-900/90 via-[#0D1117] to-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 p-0.5 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Heart className="w-5 h-5 text-amber-400 fill-amber-400/20" />
              </div>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white font-heading tracking-tight flex items-center gap-2">
                <span>Share Your Feedback</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  SageMap
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Help us improve the curriculum, add resources, or report issues.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar">
          {isSuccess ? (
            <div className="py-8 px-4 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400/50 flex items-center justify-center shadow-xl shadow-emerald-500/20 animate-bounce">
                <CheckCircle2 className="w-9 h-9 text-emerald-400" />
              </div>

              <div className="space-y-1.5 max-w-md">
                <h3 className="text-xl font-black text-white font-heading">
                  Thank You for Your Feedback!
                </h3>
                <p className="text-xs sm:text-sm text-slate-300">
                  Your message has been delivered straight to the SageMap creator's inbox. We review all submissions to refine the curriculum and build new features.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 max-w-sm">
                <p className="font-mono text-amber-300 font-bold mb-0.5">Category: {CATEGORIES.find(c => c.id === category)?.label}</p>
                <p className="line-clamp-2 italic">"{message}"</p>
              </div>

              <div className="pt-2 flex items-center gap-3 w-full max-w-xs">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-all border border-slate-700"
                >
                  Send Another
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-black transition-all shadow-lg shadow-amber-500/25"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                  <Bug className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 1. Category Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  1. What kind of feedback is this?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                          isSelected
                            ? `bg-gradient-to-br ${cat.color} ring-2 ${cat.ringColor} shadow-lg shadow-black/40 font-bold`
                            : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-current' : 'text-slate-400'}`} />
                          <span className="text-xs font-bold truncate">{cat.label}</span>
                        </div>
                        <span className="text-[10px] text-slate-400/90 leading-tight line-clamp-1">
                          {cat.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Rating & Roadmap Context */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Satisfaction Rating */}
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      Overall Rating
                    </label>
                    <span className="text-[11px] font-mono font-bold text-amber-400">
                      {(hoverRating || rating)} / 5 {RATING_LABELS[hoverRating || rating]?.emoji}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 py-1">
                    {[1, 2, 3, 4, 5].map((starVal) => {
                      const active = starVal <= (hoverRating || rating);
                      return (
                        <button
                          key={starVal}
                          type="button"
                          onMouseEnter={() => setHoverRating(starVal)}
                          onMouseLeave={() => setHoverRating(null)}
                          onClick={() => setRating(starVal)}
                          className="p-1 text-slate-600 hover:text-amber-400 transition-transform hover:scale-125 focus:outline-none"
                          title={`${starVal} Star`}
                        >
                          <Star 
                            className={`w-6 h-6 transition-colors ${
                              active ? 'text-amber-400 fill-amber-400 filter drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'text-slate-700'
                            }`} 
                          />
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 italic">
                    {RATING_LABELS[hoverRating || rating]?.text}
                  </p>
                </div>

                {/* Related Roadmap Step (Optional) */}
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-amber-400" />
                      <span>Roadmap Step (Optional)</span>
                    </label>
                    <p className="text-[10.5px] text-slate-400 mb-2">
                      Tie this feedback to a specific curriculum step
                    </p>
                  </div>
                  <select
                    value={topicId || ''}
                    onChange={(e) => setTopicId(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-750 text-xs font-medium text-slate-200 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  >
                    <option value="">Entire Roadmap / General</option>
                    {topics.map((t) => (
                      <option key={t.id} value={t.id}>
                        Step {t.stepNumber}: {t.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3. Feedback Details / Message */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    2. Your Feedback & Suggestions <span className="text-amber-400">*</span>
                  </label>
                  <span className="text-[10px] font-mono text-slate-500">
                    {message.length} chars
                  </span>
                </div>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    category === 'feature'
                      ? 'e.g., Would love an interactive playground for testing agent workflows or a quiz mode for each step!'
                      : category === 'content'
                      ? 'e.g., Highly recommend adding "Deep Learning for Coders" fast.ai course to Step 04!'
                      : category === 'bug'
                      ? 'e.g., Found a 404 broken link on the LangChain starter repository in Step 06.'
                      : category === 'question'
                      ? 'e.g., In what order do you recommend learning PyTorch vs TensorFlow for LLMs?'
                      : 'Tell us what you like or how we can make SageMap even more helpful for your learning...'
                  }
                  className="w-full px-3.5 py-3 rounded-2xl bg-slate-950/90 border border-slate-750 text-xs sm:text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 custom-scrollbar resize-none"
                />
              </div>

              {/* 4. Optional Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-750 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Your Email (Optional, if you want a reply)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. alex@example.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-750 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-300 transition-colors border border-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !message.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-amber-500/25"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 stroke-[2.5]" />
                      <span>Submit Feedback</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
