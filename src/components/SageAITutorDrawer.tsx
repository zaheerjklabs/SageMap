import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Code2, 
  HelpCircle, 
  Zap, 
  BookOpen, 
  Copy, 
  Check, 
  RotateCcw,
  MessageSquare,
  Lightbulb,
  ChevronRight,
  Terminal
} from 'lucide-react';
import { RoadmapTopic } from '../types';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  codeSnippet?: string;
  codeLanguage?: string;
  timestamp: string;
}

interface SageAITutorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  topic: RoadmapTopic;
  topics: RoadmapTopic[];
  onSelectTopic: (topicId: number) => void;
}

export const SageAITutorDrawer: React.FC<SageAITutorDrawerProps> = ({
  isOpen,
  onClose,
  topic,
  topics,
  onSelectTopic
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize welcoming message whenever the active topic changes or drawer opens
  useEffect(() => {
    if (isOpen && topic) {
      setMessages([
        {
          id: `welcome-${topic.id}`,
          sender: 'ai',
          text: `Welcome to **Step ${topic.stepNumber}: ${topic.title}**!\n\nI am your **SageAI Learning Assistant**. Ask me anything about this milestone—whether you need a simplified explanation, PyTorch code implementation, or interview advice.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [isOpen, topic?.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  if (!isOpen || !topic) return null;

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const generateAIResponse = (userPrompt: string) => {
    setIsGenerating(true);

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');

    // Simulate intelligent context-aware AI response calculation
    setTimeout(() => {
      let responseText = '';
      let codeSnippet = '';
      let codeLanguage = 'python';

      const promptLower = userPrompt.toLowerCase();

      if (
        promptLower.includes('want to learn') ||
        promptLower.includes('learn ml') ||
        promptLower.includes('learn ai') ||
        promptLower.includes('resource') ||
        promptLower.includes('order') ||
        promptLower.includes('where to start') ||
        promptLower.includes('recommend') ||
        promptLower.includes('roadmap') ||
        promptLower.includes('study')
      ) {
        const ytRes = topic.resources.filter((r) => r.type === 'youtube');
        const courseRes = topic.resources.filter((r) => r.type === 'course');
        const projRes = topic.resources.filter((r) => r.type === 'github' || r.type === 'project');
        const docRes = topic.resources.filter((r) => r.type === 'documentation');
        const theoryRes = topic.resources.filter((r) => r.type === 'paper' || r.type === 'book' || r.type === 'article');

        let resText = `### 📚 Curated Learning Path & Ordered Resources for Step ${topic.stepNumber}: ${topic.title}\n\nHere are the top resources from our **SageMap Resources Section** listed in exact recommended study order:\n\n`;

        let sectionNum = 1;
        if (ytRes.length > 0) {
          resText += `#### ${sectionNum++}. 🎬 Video Courses & Deep-Dives (YouTube)\n`;
          ytRes.forEach((r) => {
            const author = r.channelName || r.author || 'Curated Channel';
            resText += `* **[${r.title}](${r.url})**\n  * *Author/Channel:* ${author} • *Difficulty:* ${r.difficulty || 'All Levels'}\n  * *Summary:* ${r.description}\n\n`;
          });
        }

        if (courseRes.length > 0) {
          resText += `#### ${sectionNum++}. 🎓 Structured Courses\n`;
          courseRes.forEach((r) => {
            const inst = r.instructor || r.platform || 'Udemy / Coursera';
            resText += `* **[${r.title}](${r.url})**\n  * *Platform/Instructor:* ${inst} • *Difficulty:* ${r.difficulty || 'Intermediate'}\n  * *Summary:* ${r.description}\n\n`;
          });
        }

        if (projRes.length > 0) {
          resText += `#### ${sectionNum++}. 💻 Hands-on Code & GitHub Repositories\n`;
          projRes.forEach((r) => {
            const stars = r.stars ? ` (${r.stars} stars)` : '';
            resText += `* **[${r.title}](${r.url})**${stars}\n  * *Author:* ${r.author || 'Open Source'} • *Summary:* ${r.description}\n\n`;
          });
        }

        if (docRes.length > 0) {
          resText += `#### ${sectionNum++}. 🌐 Official Documentation & Sandboxes\n`;
          docRes.forEach((r) => {
            resText += `* **[${r.title}](${r.url})**\n  * *Reference:* ${r.siteName || 'Official Reference'} • *Summary:* ${r.description}\n\n`;
          });
        }

        if (theoryRes.length > 0) {
          resText += `#### ${sectionNum++}. 📄 Papers & Essential Books\n`;
          theoryRes.forEach((r) => {
            resText += `* **[${r.title}](${r.url})**\n  * *Author/Venue:* ${r.authors || r.bookAuthor || r.publication || 'Curated Text'} • *Summary:* ${r.description}\n\n`;
          });
        }

        if (topic.resources.length === 0) {
          resText += `No custom resources added yet for this topic. Use the **Add Resource** button to contribute!`;
        } else {
          resText += `💡 **Study Tip:** Complete Section 1 (Videos) & Section 2 (Courses) first, then build hands-on skills with Section 3 (GitHub Projects)!`;
        }

        responseText = resText;
      } else if (promptLower.includes('like i\'m 5') || promptLower.includes('simple') || promptLower.includes('eli5')) {
        responseText = `### 💡 ${topic.title} explained simply:\n\nImagine you have a super-smart assistant sitting next to you. Instead of guessing blindly, **${topic.title}** provides the exact framework needed to break down complex tasks.\n\n* **Core Idea:** ${topic.overview}\n* **Key Takeaway:** Master the key concepts first: ${topic.coreConcepts.map(c => c.title).slice(0, 3).join(', ')} before scaling up!`;
      } else if (promptLower.includes('code') || promptLower.includes('pytorch') || promptLower.includes('python') || promptLower.includes('implementation')) {
        responseText = `### ⚡ PyTorch / Python Code Implementation for ${topic.title}:\n\nHere is a clean, production-ready snippet demonstrating the core architecture pattern:`;
        codeLanguage = 'python';
        codeSnippet = `# SageMap Production Snippet: ${topic.title}
import torch
import torch.nn as nn
import torch.nn.functional as F

class ${topic.title.replace(/[^a-zA-Z0-9]/g, '')}Module(nn.Module):
    """
    Implementation pattern for ${topic.title}
    Category: ${topic.categoryLabel}
    """
    def __init__(self, in_features: int = 512, hidden_dim: int = 1024):
        super().__init__()
        self.fc1 = nn.Linear(in_features, hidden_dim)
        self.norm = nn.LayerNorm(hidden_dim)
        self.fc2 = nn.Linear(hidden_dim, in_features)
        self.dropout = nn.Dropout(0.1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # Residual connection with layer normalization
        residual = x
        x = F.gelu(self.fc1(x))
        x = self.dropout(self.fc2(x))
        return self.norm(x + residual)

# Example Instantiation
if __name__ == "__main__":
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = ${topic.title.replace(/[^a-zA-Z0-9]/g, '')}Module().to(device)
    dummy_input = torch.randn(8, 512).to(device)
    output = model(dummy_input)
    print(f"✅ Executed ${topic.title} module forward pass! Output shape: {output.shape}")`;
      } else if (promptLower.includes('interview') || promptLower.includes('trap') || promptLower.includes('question')) {
        const topQ = topic.interviewQuestions[0] || {
          question: `What is the core architectural principle of ${topic.title}?`,
          answerSummary: `Focus on mathematical guarantees, computational complexity, and gradient flow stability.`,
          difficulty: 'Senior'
        };
        responseText = `### 🧠 Key Interview Question for ${topic.title} (${topQ.difficulty}):\n\n**Q: ${topQ.question}**\n\n**Best Answer:**\n${topQ.answerSummary}\n\n**💡 Pro Tip:** Interviewers often check if you understand gradient stability and practical memory trade-offs in GPU memory.`;
      } else if (promptLower.includes('production') || promptLower.includes('agent') || promptLower.includes('real-world')) {
        responseText = `### 🚀 Real-World Production Usage of ${topic.title}:\n\nIn industry environments (OpenAI, Anthropic, Google DeepMind), **${topic.title}** is critical for:\n\n1. **Scalability:** Handles high-throughput vector processing.\n2. **Tools & Ecosystem:** Primary tools used include ${topic.toolsAndFrameworks.map(t => t.name).join(', ') || 'PyTorch, HuggingFace & Ray'}.\n3. **Best Practice:** Keep subtopics organized: ${topic.subtopics.map(s => s.title).join(', ')}.`;
      } else {
        responseText = `### 🎯 Insights on ${topic.title}:\n\n${topic.overview}\n\n**Recommended Learning Order:**\n${topic.recommendedOrder.map((step, i) => `${i + 1}. ${step}`).join('\n')}\n\nFeel free to click any quick prompt below to dive deeper into code or interview questions!`;
      }

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: responseText,
        codeSnippet,
        codeLanguage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsGenerating(false);
    }, 650);
  };

  const handlePromptClick = (promptText: string) => {
    if (isGenerating) return;
    generateAIResponse(promptText);
  };

  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, lIdx) => {
      if (line.startsWith('### ')) {
        return (
          <h3 key={lIdx} className="text-sm font-black text-amber-300 mt-2 mb-1">
            {line.replace('### ', '')}
          </h3>
        );
      }
      if (line.startsWith('#### ')) {
        return (
          <h4 key={lIdx} className="text-xs font-bold text-cyan-300 mt-2 mb-1">
            {line.replace('#### ', '')}
          </h4>
        );
      }

      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      const parts: React.ReactNode[] = [];
      let lastIdx = 0;
      let match: RegExpExecArray | null;

      while ((match = linkRegex.exec(line)) !== null) {
        if (match.index > lastIdx) {
          parts.push(line.substring(lastIdx, match.index));
        }
        const title = match[1];
        const url = match[2];
        parts.push(
          <a
            key={`link-${lIdx}-${match.index}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-300 hover:text-cyan-200 font-bold underline transition-colors inline-flex items-center gap-0.5"
          >
            <span>{title}</span>
            <span className="text-[10px]">↗</span>
          </a>
        );
        lastIdx = linkRegex.lastIndex;
      }

      if (lastIdx < line.length) {
        parts.push(line.substring(lastIdx));
      }

      return (
        <div key={lIdx} className={line.trim() === '' ? 'h-1.5' : 'min-h-[1.25em]'}>
          {parts.length > 0 ? parts : line}
        </div>
      );
    });
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[450px] md:w-[480px] bg-[#0D1117]/95 border-l border-slate-700/80 shadow-2xl backdrop-blur-xl flex flex-col font-sans text-slate-100 animate-slideInRight select-none">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-950/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-indigo-600 text-slate-950 shadow-lg shadow-amber-500/20">
            <Sparkles className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white tracking-tight">SageAI Assistant</h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                PRO AI
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Step {topic.stepNumber}: <span className="text-amber-300 font-bold">{topic.title}</span>
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

      {/* Topic Switcher Bar */}
      <div className="px-4 py-2 bg-slate-900/80 border-b border-slate-800/60 flex items-center justify-between text-xs">
        <span className="text-slate-400 font-bold flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
          <span>Active Context:</span>
        </span>
        <select
          value={topic.id}
          onChange={(e) => onSelectTopic(Number(e.target.value))}
          className="bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-amber-300 px-2 py-1 focus:outline-none focus:border-amber-400 truncate max-w-[200px]"
        >
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              Step {t.stepNumber}: {t.title}
            </option>
          ))}
        </select>
      </div>

      {/* Messages Scroll View */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'ai' && (
              <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-lg ${
              msg.sender === 'user'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold rounded-tr-none'
                : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none'
            }`}>
              <div className="font-sans font-medium">
                {renderFormattedText(msg.text)}
              </div>

              {msg.codeSnippet && (
                <div className="mt-3 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden font-mono text-[11px]">
                  <div className="px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400">
                      <Terminal className="w-3 h-3 text-amber-400" />
                      <span>{msg.codeLanguage || 'python'}</span>
                    </span>
                    <button
                      onClick={() => handleCopyCode(msg.codeSnippet!, msg.id)}
                      className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-amber-300 transition-colors"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-3 overflow-x-auto text-cyan-300 leading-relaxed custom-scrollbar">
                    <code>{msg.codeSnippet}</code>
                  </pre>
                </div>
              )}

              <span className={`text-[9px] block mt-2 ${msg.sender === 'user' ? 'text-slate-900/70 font-mono text-right' : 'text-slate-500 font-mono'}`}>
                {msg.timestamp}
              </span>
            </div>

            {msg.sender === 'user' && (
              <div className="w-7 h-7 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isGenerating && (
          <div className="flex gap-3 items-center">
            <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-amber-300 font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>SageAI is generating response...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="p-3 bg-slate-950/90 border-t border-slate-800/80 space-y-2">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          <span>Quick Topic Prompts:</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
          <button
            onClick={() => handlePromptClick(`Explain ${topic.title} like I'm 5`)}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-400/50 text-left text-slate-300 hover:text-amber-300 transition-all font-medium flex items-center gap-1.5 truncate"
          >
            <span>💡</span>
            <span className="truncate">Explain like I'm 5</span>
          </button>

          <button
            onClick={() => handlePromptClick(`Show PyTorch code for ${topic.title}`)}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-400/50 text-left text-slate-300 hover:text-cyan-300 transition-all font-medium flex items-center gap-1.5 truncate"
          >
            <span>⚡</span>
            <span className="truncate">PyTorch Code Snippet</span>
          </button>

          <button
            onClick={() => handlePromptClick(`What are interview traps for ${topic.title}?`)}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-indigo-400/50 text-left text-slate-300 hover:text-indigo-300 transition-all font-medium flex items-center gap-1.5 truncate"
          >
            <span>🧠</span>
            <span className="truncate">Interview Questions</span>
          </button>

          <button
            onClick={() => handlePromptClick(`How is ${topic.title} used in Production AI?`)}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-400/50 text-left text-slate-300 hover:text-emerald-300 transition-all font-medium flex items-center gap-1.5 truncate"
          >
            <span>🚀</span>
            <span className="truncate">Production Usage</span>
          </button>
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (inputQuery.trim() && !isGenerating) {
              generateAIResponse(inputQuery.trim());
            }
          }}
          className="flex items-center gap-2 pt-1"
        >
          <input
            type="text"
            placeholder={`Ask SageAI about ${topic.title}...`}
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 font-medium"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isGenerating}
            className="p-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-bold transition-all shadow-md shrink-0"
          >
            <Send className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>
      </div>
    </div>
  );
};
