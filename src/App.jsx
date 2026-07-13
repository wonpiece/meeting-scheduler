import { useCallback, useEffect, useState } from 'react';
import MeetingScheduler from './MeetingScheduler';
import OnboardingIntro from './onboarding/OnboardingIntro';
import OnboardingTour from './onboarding/OnboardingTour';
import {
  isOnboardingComplete,
  markOnboardingComplete,
  readOnboardingEntryState,
  TOUR_REVEAL_DELAY_MS,
} from './onboarding/onboardingCopy';
import './App.css';

const APP_SHELL_STYLE = {
  height: '100vh',
  width: '100%',
  background: '#FFFFFF',
  padding: '24px 24px 0',
  boxSizing: 'border-box',
  overflow: 'hidden',
  position: 'relative',
};

function App() {
  const [entry] = useState(() => readOnboardingEntryState());
  const [finished, setFinished] = useState(entry.finished);
  const [introMounted, setIntroMounted] = useState(entry.introMounted);
  const [introExiting, setIntroExiting] = useState(false);
  const [showTour, setShowTour] = useState(false);

  const handleStartReveal = useCallback(() => {
    setIntroExiting(true);
  }, []);

  const handleExitComplete = useCallback(() => {
    setIntroMounted(false);
  }, []);

  useEffect(() => {
    if (introMounted || finished) return undefined;
    const timer = window.setTimeout(() => setShowTour(true), TOUR_REVEAL_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [introMounted, finished]);

  const finishOnboarding = () => {
    markOnboardingComplete();
    setShowTour(false);
    setFinished(true);
  };

  if (finished) {
    return (
      <div style={APP_SHELL_STYLE}>
        <MeetingScheduler />
      </div>
    );
  }

  return (
    <div style={APP_SHELL_STYLE}>
      {!finished && <MeetingScheduler />}
      {introMounted && (
        <OnboardingIntro
          exiting={introExiting}
          onStartReveal={handleStartReveal}
          onExitComplete={handleExitComplete}
          onSkip={finishOnboarding}
        />
      )}
      {showTour && <OnboardingTour onComplete={finishOnboarding} />}
    </div>
  );
}

export default App;
