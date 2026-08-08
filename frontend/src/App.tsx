import React, { useState } from 'react';
import { ChatScreen } from './components/ChatScreen';
import { ScorecardScreen } from './components/ScorecardScreen';

export const App: React.FC = () => {
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [feedbackData, setFeedbackData] = useState<any>(null);
  const [completedCandidate, setCompletedCandidate] = useState<any>(null);
  const [turnsCount, setTurnsCount] = useState<number>(0);

  const handleInterviewComplete = (feedback: any, candidate: any, turns: number) => {
    setFeedbackData(feedback);
    setCompletedCandidate(candidate);
    setTurnsCount(turns);
    setIsCompleted(true);
  };

  const handleReset = () => {
    setIsCompleted(false);
    setFeedbackData(null);
    setCompletedCandidate(null);
    setTurnsCount(0);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0b0f19' }}>
      {!isCompleted ? (
        <ChatScreen onInterviewComplete={handleInterviewComplete} />
      ) : (
        <ScorecardScreen
          feedback={feedbackData}
          candidate={completedCandidate}
          turnsCount={turnsCount}
          onReset={handleReset}
        />
      )}
    </div>
  );
};

export default App;
