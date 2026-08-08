import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, RefreshCw } from 'lucide-react';
import { ALL_CANDIDATES } from '../candidates';

export interface ChatMessage {
  id: string;
  sender: 'agent' | 'user';
  text: string;
  timestamp: string;
}

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

interface ChatScreenProps {
  onInterviewComplete: (feedback: any, candidate: any, turnsCount: number) => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ onInterviewComplete }) => {
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('CAND-016');
  const [sessionId, setSessionId] = useState<string>(() => `session-${Date.now()}`);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const currentCandidate = ALL_CANDIDATES.find(c => (c as any).member?.id === selectedCandidateId || c.id === selectedCandidateId) || ALL_CANDIDATES[0];
  const candidateMember = (currentCandidate as any).member || currentCandidate;
  const candidateSignals = currentCandidate.signals || { commitDays: 0, missionsCompleted: 0, missionsFirstTry: 0 };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Start interview automatically when candidate selected / on mount
  const startInterview = async (cand: any = currentCandidate) => {
    setIsLoading(true);
    setError(null);
    const newSessionId = `session-${(cand.member?.id || cand.id)}-${Date.now()}`;
    setSessionId(newSessionId);
    setMessages([]);

    try {
      const res = await fetch(`${API_BASE}/api/interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: newSessionId,
          candidate: cand,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      setMessages([
        {
          id: `msg-${Date.now()}`,
          sender: 'agent',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      setError(err.message || 'Failed to start interview.');
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  useEffect(() => {
    startInterview(currentCandidate);
  }, [selectedCandidateId]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = inputText.trim();
    setInputText('');

    const newMessages: ChatMessage[] = [
      ...messages,
      {
        id: `msg-${Date.now()}`,
        sender: 'user',
        text: userMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
    setMessages(newMessages);
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: userMessage,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.statusText}`);
      }

      const data = await res.json();

      if (data.done && data.feedback) {
        setMessages(prev => [
          ...prev,
          {
            id: `msg-done-${Date.now()}`,
            sender: 'agent',
            text: data.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setTimeout(() => {
          onInterviewComplete(data.feedback, currentCandidate, newMessages.length + 1);
        }, 1200);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: `msg-${Date.now()}`,
            sender: 'agent',
            text: data.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send message.');
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', maxWidth: '1000px', margin: '0 auto', padding: '16px' }}>
      {/* Header bar: Minimal candidate status & selector */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 18px',
        backgroundColor: '#111827',
        borderRadius: '12px',
        border: '1px solid #1e293b',
        marginBottom: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={20} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '15px', fontWeight: 600, color: '#f8fafc' }}>Technical Interview Agent</h1>
              <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#1e293b', color: '#94a3b8' }}>
                AI Cohort
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8' }}>
              Interviewing: <strong style={{ color: '#f8fafc' }}>{candidateMember.name}</strong> ({candidateMember.jobRole} · {candidateMember.yearsExperience} yrs exp)
            </p>
          </div>
        </div>

        {/* Candidate Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ textAlign: 'right', display: 'flex', gap: '12px', fontSize: '12px', color: '#94a3b8' }}>
            <div>
              <span>Commit: </span>
              <strong style={{ color: '#38bdf8' }}>{candidateSignals.commitDays}/31d</strong>
            </div>
            <div>
              <span>1st-Try: </span>
              <strong style={{ color: '#4ade80' }}>
                {candidateSignals.missionsCompleted > 0 ? Math.round((candidateSignals.missionsFirstTry / candidateSignals.missionsCompleted) * 100) : 0}%
              </strong>
            </div>
          </div>

          <select
            value={selectedCandidateId}
            onChange={(e) => setSelectedCandidateId(e.target.value)}
            disabled={isLoading}
            style={{
              backgroundColor: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #334155',
              padding: '6px 10px',
              borderRadius: '8px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            {ALL_CANDIDATES.map(c => {
              const m = (c as any).member || c;
              return (
                <option key={m.id} value={m.id}>
                  {m.id}: {m.name} ({m.jobRole})
                </option>
              );
            })}
          </select>

          <button
            onClick={() => startInterview(currentCandidate)}
            title="Restart interview"
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              color: '#94a3b8',
              borderRadius: '8px',
              padding: '6px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </header>

      {/* Messages area */}
      <main style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {messages.map((msg) => {
          const isAgent = msg.sender === 'agent';
          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                flexDirection: isAgent ? 'row' : 'row-reverse',
                maxWidth: '85%',
                alignSelf: isAgent ? 'flex-start' : 'flex-end',
              }}
              className="animate-fade-in"
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: isAgent ? '#1e293b' : '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '2px',
                border: isAgent ? '1px solid #334155' : 'none'
              }}>
                {isAgent ? <Bot size={16} color="#38bdf8" /> : <User size={16} color="#fff" />}
              </div>

              <div>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: isAgent ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
                  backgroundColor: isAgent ? '#1e293b' : '#2563eb',
                  color: isAgent ? '#f1f5f9' : '#ffffff',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  border: isAgent ? '1px solid #334155' : 'none',
                  whiteSpace: 'pre-wrap',
                }}>
                  {msg.text}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#64748b',
                  marginTop: '4px',
                  textAlign: isAgent ? 'left' : 'right',
                  paddingLeft: '4px',
                  paddingRight: '4px'
                }}>
                  {isAgent ? 'Interviewer' : candidateMember.name} · {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #334155' }}>
              <Bot size={16} color="#38bdf8" />
            </div>
            <div style={{
              padding: '10px 16px',
              borderRadius: '4px 14px 14px 14px',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
            </div>
          </div>
        )}

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Input bar */}
      <footer style={{
        padding: '12px 16px',
        backgroundColor: '#111827',
        borderRadius: '12px',
        border: '1px solid #1e293b',
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-end'
      }}>
        <textarea
          ref={inputRef}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Answer the question as ${candidateMember.name}... (Press Enter to send, Shift+Enter for new line)`}
          rows={2}
          disabled={isLoading}
          style={{
            flex: 1,
            backgroundColor: '#1e293b',
            color: '#f8fafc',
            border: '1px solid #334155',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '14px',
            resize: 'none',
            outline: 'none',
            fontFamily: 'inherit'
          }}
        />
        <button
          onClick={handleSendMessage}
          disabled={isLoading || !inputText.trim()}
          style={{
            backgroundColor: !inputText.trim() || isLoading ? '#334155' : '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 18px',
            cursor: !inputText.trim() || isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 500,
            fontSize: '14px',
            transition: 'background-color 0.15s ease'
          }}
        >
          <Send size={16} />
          Send
        </button>
      </footer>
    </div>
  );
};
