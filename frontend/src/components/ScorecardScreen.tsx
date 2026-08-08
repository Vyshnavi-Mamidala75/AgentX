import React from 'react';
import { CheckCircle, AlertTriangle, ArrowRight, Award, Calendar, Target, RotateCcw } from 'lucide-react';

interface ScorecardScreenProps {
  feedback: {
    summary: string;
    strengths: string[];
    gaps: string[];
    next: string[];
  };
  candidate: any;
  turnsCount: number;
  onReset: () => void;
}

export const ScorecardScreen: React.FC<ScorecardScreenProps> = ({
  feedback,
  candidate,
  turnsCount,
  onReset,
}) => {
  const member = candidate?.member || candidate || {};
  const signals = candidate?.signals || { commitDays: 0, missionsCompleted: 0, missionsFirstTry: 0 };
  const firstTryRate = signals.missionsCompleted > 0
    ? Math.round((signals.missionsFirstTry / signals.missionsCompleted) * 100)
    : 0;

  // Category competencies computed from candidate signals
  const isHighPerformer = firstTryRate >= 80;
  const categories = [
    {
      title: 'Embeddings & Vector Search',
      score: isHighPerformer ? 95 : 65,
      detail: isHighPerformer ? 'Mastered 1st try' : 'Required retries / dimension adjustments',
      color: isHighPerformer ? '#10b981' : '#f59e0b',
    },
    {
      title: 'LLM Prompting & Function Calling',
      score: isHighPerformer ? 98 : 60,
      detail: isHighPerformer ? 'Pydantic strict schema validation' : 'Troubleshooting JSON syntax leaking',
      color: isHighPerformer ? '#10b981' : '#f59e0b',
    },
    {
      title: 'Multi-Agent Orchestration & MCP',
      score: isHighPerformer ? 92 : 55,
      detail: isHighPerformer ? 'State machines & circuit breakers' : 'Looping prevention & checkpoints',
      color: isHighPerformer ? '#10b981' : '#f59e0b',
    },
    {
      title: 'Production, Security & Deployment',
      score: isHighPerformer ? 90 : 50,
      detail: isHighPerformer ? 'K8s HPA autoscaling & Docker' : 'Skipped submissions; conceptual review needed',
      color: isHighPerformer ? '#10b981' : '#ef4444',
    },
  ];

  return (
    <div style={{
      maxWidth: '1000px',
      margin: '0 auto',
      padding: '24px 16px',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      {/* Top Banner */}
      <div style={{
        backgroundColor: '#111827',
        border: '1px solid #1e293b',
        borderRadius: '16px',
        padding: '20px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: '#1e293b',
            border: '1px solid #3b82f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Award size={26} color="#38bdf8" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#f8fafc' }}>
                Technical Interview Scorecard
              </h1>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: '6px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                INTERVIEW COMPLETED
              </span>
            </div>
            <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '2px' }}>
              Candidate: <strong style={{ color: '#f8fafc' }}>{member.name}</strong> · {member.jobRole} ({member.yearsExperience} yrs exp)
            </p>
          </div>
        </div>

        <button
          onClick={onReset}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 18px',
            fontWeight: 500,
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          <RotateCcw size={15} />
          Start New Interview
        </button>
      </div>

      {/* Cohort Stats Ribbon */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px'
      }}>
        <div style={{ backgroundColor: '#111827', border: '1px solid #1e293b', borderRadius: '12px', padding: '14px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '12px' }}>
            <Calendar size={15} color="#38bdf8" /> Cohort Active Days
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>
            {signals.commitDays} <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 400 }}>/ 31 days</span>
          </div>
        </div>

        <div style={{ backgroundColor: '#111827', border: '1px solid #1e293b', borderRadius: '12px', padding: '14px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '12px' }}>
            <Target size={15} color="#34d399" /> Missions Completed
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>
            {signals.missionsCompleted} <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 400 }}>missions</span>
          </div>
        </div>

        <div style={{ backgroundColor: '#111827', border: '1px solid #1e293b', borderRadius: '12px', padding: '14px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '12px' }}>
            <Award size={15} color="#fbbf24" /> First-Try Pass Rate
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>
            {firstTryRate}% <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 400 }}>({signals.missionsFirstTry}/{signals.missionsCompleted})</span>
          </div>
        </div>

        <div style={{ backgroundColor: '#111827', border: '1px solid #1e293b', borderRadius: '12px', padding: '14px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '12px' }}>
            <RotateCcw size={15} color="#a855f7" /> Interview Turns
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>
            {turnsCount} <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 400 }}>turns</span>
          </div>
        </div>
      </div>

      {/* Summary Box */}
      <div style={{
        backgroundColor: '#111827',
        border: '1px solid #1e293b',
        borderRadius: '14px',
        padding: '20px'
      }}>
        <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#38bdf8', marginBottom: '8px' }}>
          Executive Assessment Summary
        </h2>
        <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#e2e8f0' }}>
          {feedback.summary}
        </p>
      </div>

      {/* Progress Bars Per Category */}
      <div style={{
        backgroundColor: '#111827',
        border: '1px solid #1e293b',
        borderRadius: '14px',
        padding: '20px'
      }}>
        <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#f8fafc', marginBottom: '16px' }}>
          Curriculum Category Mastery
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {categories.map(cat => (
            <div key={cat.title}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                <span style={{ color: '#f1f5f9', fontWeight: 500 }}>{cat.title}</span>
                <span style={{ color: '#94a3b8' }}>{cat.detail} · <strong style={{ color: cat.color }}>{cat.score}%</strong></span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${cat.score}%`, height: '100%', backgroundColor: cat.color, borderRadius: '4px', transition: 'width 0.6s ease' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths & Gaps 2-column grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '16px'
      }}>
        {/* Strengths */}
        <div style={{
          backgroundColor: '#111827',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '14px',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <CheckCircle size={18} color="#10b981" />
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#34d399' }}>Demonstrated Strengths</h3>
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {feedback.strengths.map((str, i) => (
              <li key={i} style={{ display: 'flex', gap: '8px', fontSize: '13px', lineHeight: '1.6', color: '#e2e8f0' }}>
                <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span>
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Technical Gaps */}
        <div style={{
          backgroundColor: '#111827',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: '14px',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <AlertTriangle size={18} color="#f59e0b" />
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#fbbf24' }}>Identified Technical Gaps</h3>
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {feedback.gaps.map((gap, i) => (
              <li key={i} style={{ display: 'flex', gap: '8px', fontSize: '13px', lineHeight: '1.6', color: '#e2e8f0' }}>
                <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>!</span>
                <span>{gap}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Actionable Next Steps */}
      <div style={{
        backgroundColor: '#111827',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '14px',
        padding: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <ArrowRight size={18} color="#3b82f6" />
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#60a5fa' }}>Actionable Next Steps</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {feedback.next.map((step, i) => (
            <div
              key={i}
              style={{
                backgroundColor: '#1e293b',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                lineHeight: '1.6',
                color: '#f1f5f9',
                borderLeft: '3px solid #3b82f6'
              }}
            >
              <strong>Step {i + 1}:</strong> {step}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
