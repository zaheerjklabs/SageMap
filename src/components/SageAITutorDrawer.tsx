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
  Terminal,
  Settings,
  Key,
  ExternalLink,
  ShieldCheck,
  Minus
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
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

  // LLM API Key Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(() => {
    try {
      return (
        localStorage.getItem('sagemap_gemini_api_key') ||
        import.meta.env.VITE_GEMINI_API_KEY ||
        import.meta.env.GEMINI_API_KEY ||
        ''
      );
    } catch {
      return '';
    }
  });
  const [activeApiKey, setActiveApiKey] = useState(apiKeyInput);
  const [apiKeySavedNotice, setApiKeySavedNotice] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Save API key handler
  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = apiKeyInput.trim();
    setActiveApiKey(cleanKey);
    try {
      if (cleanKey) {
        localStorage.setItem('sagemap_gemini_api_key', cleanKey);
      } else {
        localStorage.removeItem('sagemap_gemini_api_key');
      }
    } catch {
      // ignore storage errors
    }
    setApiKeySavedNotice(true);
    setTimeout(() => setApiKeySavedNotice(false), 2500);
    setShowSettings(false);
  };

  // Initialize welcoming message whenever the active topic changes or drawer opens
  useEffect(() => {
    if (isOpen && topic) {
      setMessages([
        {
          id: `welcome-${topic.id}`,
          sender: 'ai',
          text: `Welcome to **Step ${topic.stepNumber}: ${topic.title}**!\n\nI am your **SageAI Learning Assistant**. Ask me how to learn Machine Learning, Deep Learning, request PyTorch code, or ask for **Books, Courses, and Projects** recommendations from our resources section.`,
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

  const generateAIResponse = async (userPrompt: string) => {
    setIsGenerating(true);

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');

    const apiKey =
      activeApiKey ||
      import.meta.env.VITE_GEMINI_API_KEY ||
      import.meta.env.GEMINI_API_KEY ||
      '';

    if (!apiKey || apiKey.length < 5) {
      setShowSettings(true);
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `### 🔑 Enter Gemini API Key to Activate SageAI\n\nTo receive dynamic, live AI responses generated directly by **Google Gemini LLM**, please paste your free **Gemini API Key** in the settings panel above!\n\n> Get a free API key at [aistudio.google.com](https://aistudio.google.com).`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsGenerating(false);
      return;
    }

    const ragContext = topic.resources.map((r) => ({
      title: r.title,
      type: r.type,
      url: r.url,
      description: r.description,
      author: r.author || r.channelName || r.instructor || r.bookAuthor || 'SageMap Resource'
    }));

    const systemInstructionText = `You are SageAI, the flagship AI & Machine Learning tutor embedded in SageMap.
Your primary directive is to directly, dynamically, and thoroughly answer the user's specific prompt:
1. If the user asks to explain a concept or algorithm (e.g., gradient descent, random forest, logistic regression, overfitting, backprop, transformers), explain that EXACT concept directly using clear math equations, bullet points, and practical examples.
2. If the user asks for PyTorch code or implementation, generate a clean, production-grade Python snippet wrapped in markdown code blocks (\`\`\`python ... \`\`\`).
3. If recommending learning materials, cite relevant uploaded SageMap RAG resources from the context above or top industry resources using clickable markdown links [Resource Title](URL).
4. Format all responses in clean, beautifully structured Markdown with headers (###, ####), bold emphasis (**text**), and blockquotes (> note).`;

    const promptText = `User Query: "${userPrompt}"\n\nContext:\nActive Step ${topic.stepNumber}: ${topic.title} (${topic.categoryLabel})\nOverview: ${topic.overview}\nCore Concepts: ${topic.coreConcepts.map((c) => c.title).join(', ')}\nSubtopics: ${topic.subtopics.map((s) => s.title).join(', ')}\n\nUploaded SageMap RAG Resources:\n${JSON.stringify(ragContext, null, 2)}`;

    // Try REST API endpoints across candidate model aliases
    const modelCandidates = [
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-2.0-flash',
      'gemini-2.0-flash-exp',
      'gemini-2.5-flash',
      'gemini-3.6-flash'
    ];

    let responseText = '';
    let lastApiErrorMessage = '';

    for (const modelName of modelCandidates) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [{ text: promptText }]
                }
              ],
              systemInstruction: {
                parts: [{ text: systemInstructionText }]
              }
            })
          }
        );

        if (res.ok) {
          const data = await res.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            responseText = text;
            break;
          }
        } else {
          const errBody = await res.json().catch(() => null);
          lastApiErrorMessage = errBody?.error?.message || `HTTP ${res.status}`;
          console.warn(`Model ${modelName} call returned ${res.status}:`, errBody);
        }
      } catch (err: any) {
        lastApiErrorMessage = err.message || 'Network error';
        console.warn(`Fetch error for ${modelName}:`, err);
      }
    }

    // Fallback to SDK if REST fetch was blocked
    if (!responseText) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        for (const modelName of ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash']) {
          try {
            const sdkRes = await ai.models.generateContent({
              model: modelName,
              contents: promptText,
              config: { systemInstruction: systemInstructionText }
            });
            if (sdkRes && sdkRes.text) {
              responseText = sdkRes.text;
              break;
            }
          } catch (e) {
            // ignore
          }
        }
      } catch (e) {
        // ignore
      }
    }

    if (!responseText) {
      setIsGenerating(false);
      setShowSettings(true);
      const errorMsg: Message = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: `### ⚠️ Gemini API Notice\n\nCould not fetch response from Google Gemini API: **${lastApiErrorMessage || 'API Key Invalid or Quota Exceeded'}**\n\nPlease check your Gemini API key in the settings panel above (⚙️). Get a free key at [aistudio.google.com](https://aistudio.google.com).`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
      return;
    }

    let codeSnippet: string | undefined = undefined;
    let codeLanguage: string | undefined = undefined;

    const codeMatch = responseText.match(/```(\w*)\n([\s\S]*?)```/);
    if (codeMatch) {
      codeLanguage = codeMatch[1] || 'python';
      codeSnippet = codeMatch[2].trim();
    }

    const cleanText = responseText.replace(/```(\w*)\n[\s\S]*?```/g, '').trim();

    const aiMsg: Message = {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: cleanText || responseText,
      codeSnippet,
      codeLanguage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, aiMsg]);
    setIsGenerating(false);
  };

  const handlePromptClick = (promptText: string) => {
    if (isGenerating) return;
    generateAIResponse(promptText);
  };

  const parseInlineMarkdown = (lineText: string, lIdx: number): React.ReactNode => {
    // Regex matching bold **text**, links [title](url), code `snippet`, and italics *text*
    const tokenRegex = /(\*\*.*?\*\*|\[.*?\]\(.*?\)|`.*?`|\*.*?\*)/g;
    const parts: React.ReactNode[] = [];
    let lastIdx = 0;
    let match: RegExpExecArray | null;

    while ((match = tokenRegex.exec(lineText)) !== null) {
      if (match.index > lastIdx) {
        parts.push(lineText.substring(lastIdx, match.index));
      }
      const token = match[0];
      const key = `inline-${lIdx}-${match.index}`;

      if (token.startsWith('**') && token.endsWith('**') && token.length >= 4) {
        const content = token.slice(2, -2);
        parts.push(
          <strong key={key} className="font-black text-amber-200">
            {parseInlineMarkdown(content, lIdx)}
          </strong>
        );
      } else if (token.startsWith('[') && token.includes('](') && token.endsWith(')')) {
        const titleMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (titleMatch) {
          const title = titleMatch[1];
          const url = titleMatch[2];
          parts.push(
            <a
              key={key}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-300 hover:text-cyan-200 font-bold underline transition-colors inline-flex items-center gap-0.5"
            >
              <span>{title}</span>
              <span className="text-[10px]">↗</span>
            </a>
          );
        } else {
          parts.push(token);
        }
      } else if (token.startsWith('`') && token.endsWith('`') && token.length >= 2) {
        const content = token.slice(1, -1);
        parts.push(
          <code key={key} className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono text-cyan-300 text-[11px]">
            {content}
          </code>
        );
      } else if (token.startsWith('*') && token.endsWith('*') && token.length >= 2) {
        const content = token.slice(1, -1);
        parts.push(
          <em key={key} className="italic text-slate-300 font-medium">
            {content}
          </em>
        );
      } else {
        parts.push(token);
      }

      lastIdx = tokenRegex.lastIndex;
    }

    if (lastIdx < lineText.length) {
      parts.push(lineText.substring(lastIdx));
    }

    return parts.length > 0 ? parts : lineText;
  };

  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, lIdx) => {
      // H3 Headers
      if (line.startsWith('### ')) {
        return (
          <h3 key={lIdx} className="text-sm font-black text-amber-300 mt-3 mb-1.5 flex items-center gap-1.5">
            <span>{line.replace('### ', '')}</span>
          </h3>
        );
      }
      // H4 Subheaders
      if (line.startsWith('#### ')) {
        return (
          <h4 key={lIdx} className="text-xs font-bold text-cyan-300 mt-2 mb-1">
            {line.replace('#### ', '')}
          </h4>
        );
      }
      // Blockquotes
      if (line.startsWith('> ')) {
        const content = line.replace('> ', '');
        return (
          <blockquote key={lIdx} className="my-1.5 p-2 rounded-xl bg-amber-500/10 border-l-2 border-amber-400 text-[11px] text-amber-200/90 italic">
            {parseInlineMarkdown(content, lIdx)}
          </blockquote>
        );
      }
      // Bullet list items (* or -)
      if (line.startsWith('* ') || line.startsWith('- ')) {
        const content = line.slice(2);
        return (
          <div key={lIdx} className="flex items-start gap-1.5 my-0.5 pl-1 text-slate-200">
            <span className="text-amber-400 font-bold text-xs leading-relaxed shrink-0">•</span>
            <div className="flex-1 min-w-0">{parseInlineMarkdown(content, lIdx)}</div>
          </div>
        );
      }

      return (
        <div key={lIdx} className={line.trim() === '' ? 'h-1.5' : 'min-h-[1.25em]'}>
          {parseInlineMarkdown(line, lIdx)}
        </div>
      );
    });
  };

  const highlightCodeSyntax = (code: string, language: string = 'python'): React.ReactNode => {
    const lines = code.split('\n');

    return lines.map((line, lIdx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('#')) {
        return (
          <div key={lIdx} className="text-slate-500 italic font-mono leading-snug">
            {line}
          </div>
        );
      }
      if (trimmed.startsWith('"""') || trimmed.startsWith("'''")) {
        return (
          <div key={lIdx} className="text-emerald-400/80 italic font-mono leading-snug">
            {line}
          </div>
        );
      }

      const tokenRegex = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b(?:class|def|import|from|return|if|else|elif|for|while|in|as|is|not|and|or|try|except|finally|raise|pass|break|continue|lambda|yield|async|await|with|assert)\b|\b(?:self|super|True|False|None)\b|\b\d+(?:\.\d+)?\b|\b[A-Z][a-zA-Z0-9_]*\b|\b[a-z_][a-zA-Z0-9_]*(?=\s*\()|[#].*)/g;

      const tokens: React.ReactNode[] = [];
      let lastIdx = 0;
      let match: RegExpExecArray | null;

      while ((match = tokenRegex.exec(line)) !== null) {
        if (match.index > lastIdx) {
          tokens.push(line.substring(lastIdx, match.index));
        }
        const token = match[0];
        const key = `code-tok-${lIdx}-${match.index}`;

        if (token.startsWith('#')) {
          tokens.push(
            <span key={key} className="text-slate-500 italic font-mono">
              {token}
            </span>
          );
        } else if (token.startsWith('"') || token.startsWith("'")) {
          tokens.push(
            <span key={key} className="text-emerald-300 font-medium">
              {token}
            </span>
          );
        } else if (
          /^(class|def|import|from|return|if|else|elif|for|while|in|as|is|not|and|or|try|except|finally|raise|pass|break|continue|lambda|yield|async|await|with|assert)$/.test(
            token
          )
        ) {
          tokens.push(
            <span key={key} className="text-rose-400 font-bold">
              {token}
            </span>
          );
        } else if (/^(self|super|True|False|None)$/.test(token)) {
          tokens.push(
            <span key={key} className="text-purple-300 font-bold">
              {token}
            </span>
          );
        } else if (/^[A-Z][a-zA-Z0-9_]*$/.test(token)) {
          tokens.push(
            <span key={key} className="text-amber-300 font-bold">
              {token}
            </span>
          );
        } else if (/^\d+(?:\.\d+)?$/.test(token)) {
          tokens.push(
            <span key={key} className="text-orange-300 font-mono">
              {token}
            </span>
          );
        } else if (/^[a-z_][a-zA-Z0-9_]*$/.test(token)) {
          tokens.push(
            <span key={key} className="text-cyan-300 font-semibold">
              {token}
            </span>
          );
        } else {
          tokens.push(token);
        }

        lastIdx = tokenRegex.lastIndex;
      }

      if (lastIdx < line.length) {
        tokens.push(line.substring(lastIdx));
      }

      return (
        <div key={lIdx} className="leading-snug font-mono whitespace-pre">
          {tokens.length > 0 ? tokens : line}
        </div>
      );
    });
  };

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2.5rem)] sm:w-[420px] md:w-[450px] h-[560px] max-h-[calc(100vh-5rem)] bg-[#0D1117]/98 border border-slate-800/90 rounded-3xl shadow-2xl backdrop-blur-2xl flex flex-col font-sans text-slate-100 animate-fadeIn overflow-hidden">
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

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded-xl border transition-colors ${showSettings || activeApiKey
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
              }`}
            title="Configure LLM API Key (Google Gemini)"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-amber-300 border border-slate-800 transition-colors"
            title="Minimize / Hide Assistant (Conversation & background process preserved)"
          >
            <Minus className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition-colors"
            title="Close Assistant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* LLM API Key Settings Panel */}
      {showSettings && (
        <form onSubmit={handleSaveApiKey} className="p-4 bg-slate-950 border-b border-slate-800 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Configure Gemini LLM API Key</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-cyan-300 border border-slate-800">
              Model: gemini-1.5-flash
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Enter your Google Gemini API key to enable live LLM responses. Get a free key at{' '}
            <a
              href="https://aistudio.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-300 hover:underline inline-flex items-center gap-0.5 font-bold"
            >
              <span>aistudio.google.com</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            {' '}or set <code className="text-amber-300 font-mono text-[10px]">VITE_GEMINI_API_KEY</code> in <code className="text-amber-300 font-mono text-[10px]">.env.local</code>.
          </p>

          <div className="flex items-center gap-2">
            <input
              type="password"
              placeholder="Paste AI Studio Gemini Key (AIzaSy...)"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs shadow-md transition-colors whitespace-nowrap"
            >
              Save Key
            </button>
          </div>

          {activeApiKey && (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Gemini API Key active for live LLM queries!</span>
            </div>
          )}
        </form>
      )}

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

            <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-lg ${msg.sender === 'user'
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
                  <pre className="p-3 overflow-x-auto text-slate-200 leading-relaxed custom-scrollbar">
                    <code>{highlightCodeSyntax(msg.codeSnippet, msg.codeLanguage)}</code>
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

      {/* Input Footer */}
      <div className="p-3 bg-slate-950/90 border-t border-slate-800/80">
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
