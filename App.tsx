import React, { useState } from 'react';
import Layout from './components/Layout';
import ChatView from './components/ChatView';
import PlanGenerator from './components/PlanGenerator';
import { AppMode, PlannerFormData } from './types';

function App() {
  const [currentMode, setCurrentMode] = useState<AppMode>(AppMode.CHAT);
  const [pendingPlanData, setPendingPlanData] = useState<Partial<PlannerFormData> | null>(null);

  const handlePlanRequest = (data: Partial<PlannerFormData>) => {
    setPendingPlanData(data);
    setCurrentMode(AppMode.PLANNER);
  };

  return (
    <Layout currentMode={currentMode} onModeChange={setCurrentMode}>
      {currentMode === AppMode.CHAT ? (
        <ChatView onPlanRequest={handlePlanRequest} />
      ) : (
        <PlanGenerator pendingData={pendingPlanData} />
      )}
    </Layout>
  );
}

export default App;