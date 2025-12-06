import React, { useState, useEffect } from 'react';
import { PlannerFormData, WorkoutPlan } from '../types';
import { generateStructuredPlan } from '../services/geminiService';
import { generateWorkoutPDF, generateAnalysisPDF } from '../services/pdfService';

interface PlanGeneratorProps {
  pendingData?: Partial<PlannerFormData> | null;
}

const PlanGenerator: React.FC<PlanGeneratorProps> = ({ pendingData }) => {
  const [step, setStep] = useState<'form' | 'loading' | 'result'>('form');
  const [formData, setFormData] = useState<PlannerFormData>({
    goal: 'Improve Hyrox Time',
    fitnessLevel: 'Intermediate',
    daysPerWeek: 4,
    equipment: 'Full Gym (CrossFit Box)',
    injuries: '',
  });
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);

  // If pending data comes from chat, populate and auto-submit
  useEffect(() => {
    if (pendingData) {
      setFormData(prev => ({
        ...prev,
        ...pendingData,
        // Ensure defaults if AI sends partial data
        daysPerWeek: pendingData.daysPerWeek || prev.daysPerWeek,
        goal: pendingData.goal || prev.goal,
      }));
      
      // Auto trigger generation
      triggerGeneration({
        ...formData,
        ...pendingData,
        daysPerWeek: pendingData.daysPerWeek || formData.daysPerWeek,
        goal: pendingData.goal || formData.goal,
      });
    }
  }, [pendingData]);

  const triggerGeneration = async (data: PlannerFormData) => {
    setStep('loading');
    try {
      const generatedPlan = await generateStructuredPlan(data);
      setPlan(generatedPlan);
      setStep('result');
    } catch (error) {
      console.error(error);
      setStep('form');
      alert("Failed to generate plan. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerGeneration(formData);
  };

  const handleDownloadSchedule = () => {
    if (plan) {
      generateWorkoutPDF(plan);
    }
  };

  const handleDownloadAnalysis = () => {
    if (plan) {
      generateAnalysisPDF(plan);
    }
  };

  const safeMap = (data: any, render: (item: string, index: number) => React.ReactNode) => {
    if (!data || !Array.isArray(data)) return null;
    return data.map(render);
  };

  if (step === 'loading') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="w-16 h-16 border-4 border-hybrid-dark border-t-hybrid-accent rounded-full animate-spin"></div>
        <h2 className="text-xl font-bold text-white">Constructing Program...</h2>
        <p className="text-gray-400 text-sm">Analyzing training volume, intensity zones, and recovery needs.</p>
        <p className="text-gray-500 text-xs">Writing scientific analysis...</p>
        {pendingData && <p className="text-hybrid-accent text-xs">Received instruction from Coach Chat</p>}
      </div>
    );
  }

  if (step === 'result' && plan) {
    return (
      <div className="h-full overflow-y-auto p-4 space-y-6">
        <div className="bg-hybrid-dark border border-gray-700 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <i className="fa-solid fa-dumbbell text-6xl text-white"></i>
            </div>
          <h2 className="text-2xl font-bold text-hybrid-accent mb-2">{plan.title || 'Custom Plan'}</h2>
          <div className="flex gap-4 text-xs text-gray-400 uppercase tracking-wider mb-4">
            <span><i className="fa-regular fa-clock mr-1"></i> {plan.durationWeeks} Weeks</span>
            <span><i className="fa-solid fa-bullseye mr-1"></i> {plan.goal}</span>
          </div>
          
          {/* Download Buttons Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
             <button
              onClick={handleDownloadSchedule}
              className="bg-hybrid-accent hover:bg-hybrid-accent-hover text-hybrid-black font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors active:scale-95"
            >
              <i className="fa-regular fa-calendar-days"></i> Download Schedule (PDF)
            </button>
            <button
              onClick={handleDownloadAnalysis}
              className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors border border-gray-600 active:scale-95"
            >
              <i className="fa-solid fa-microscope"></i> Download Analysis (PDF)
            </button>
          </div>
          
          <button
                onClick={() => setStep('form')}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-300 mt-2 underline"
            >
                Start New Plan
            </button>
        </div>
        
        {/* On-screen Analysis Preview (Optional, but good for UX) */}
        {plan.analysis && (
            <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-5">
                <h3 className="text-hybrid-accent font-bold mb-2 uppercase text-xs tracking-wider">Scientific Rationale Highlight</h3>
                <p className="text-gray-400 text-sm italic line-clamp-3">{plan.analysis}</p>
            </div>
        )}

        <div className="space-y-4 pb-8">
          {(Array.isArray(plan.sessions) ? plan.sessions : []).map((session, idx) => (
            <div key={idx} className="bg-gray-900/50 border border-gray-800 rounded-lg p-5">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-800">
                <h3 className="font-bold text-white">{session.day}</h3>
                <span className="text-xs bg-hybrid-accent/10 text-hybrid-accent px-2 py-1 rounded">
                  {session.focus}
                </span>
              </div>

              {/* Workout Sections */}
              <div className="space-y-4 text-sm">
                {(session.warmup && Array.isArray(session.warmup) && session.warmup.length > 0) && (
                  <div>
                    <h4 className="text-gray-500 text-xs uppercase font-bold mb-2">Warmup</h4>
                    <ul className="list-disc pl-4 text-gray-300 space-y-1">
                      {safeMap(session.warmup, (w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                )}
                
                {(session.mainWork && Array.isArray(session.mainWork) && session.mainWork.length > 0) && (
                  <div>
                    <h4 className="text-hybrid-accent text-xs uppercase font-bold mb-2">Main Work</h4>
                    <ul className="space-y-2">
                      {safeMap(session.mainWork, (w, i) => (
                        <li key={i} className="flex items-start gap-2 text-white">
                          <i className="fa-solid fa-caret-right text-hybrid-accent mt-1 text-[10px]"></i>
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {(session.accessory && Array.isArray(session.accessory) && session.accessory.length > 0) && (
                  <div>
                    <h4 className="text-gray-500 text-xs uppercase font-bold mb-2">Accessory / Engine</h4>
                    <ul className="list-disc pl-4 text-gray-300 space-y-1">
                        {safeMap(session.accessory, (w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                )}
                
                {session.notes && (
                    <div className="bg-blue-900/20 p-3 rounded border border-blue-900/50 mt-2">
                        <p className="text-blue-200 text-xs italic"><i className="fa-solid fa-circle-info mr-1"></i> {session.notes}</p>
                    </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Program Builder</h2>
        <p className="text-gray-400 text-sm">Generate a specialized Hybrid/Hyrox/CrossFit program tailored to your stats.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 pb-8">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Training Goal</label>
          <input
            type="text"
            required
            value={formData.goal}
            onChange={(e) => setFormData({...formData, goal: e.target.value})}
            className="w-full bg-hybrid-dark border border-gray-700 rounded-lg p-3 text-white focus:border-hybrid-accent focus:outline-none text-base md:text-sm"
            placeholder="e.g., Sub 1:10 Hyrox, Increase 1RM Snatch"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Days / Week</label>
            <select
              value={formData.daysPerWeek}
              onChange={(e) => setFormData({...formData, daysPerWeek: Number(e.target.value)})}
              className="w-full bg-hybrid-dark border border-gray-700 rounded-lg p-3 text-white focus:border-hybrid-accent focus:outline-none text-base md:text-sm"
            >
              {[3, 4, 5, 6].map(n => <option key={n} value={n}>{n} Days</option>)}
            </select>
          </div>
          <div className="space-y-2">
             <label className="text-sm font-medium text-gray-300">Fitness Level</label>
            <select
              value={formData.fitnessLevel}
              onChange={(e) => setFormData({...formData, fitnessLevel: e.target.value})}
              className="w-full bg-hybrid-dark border border-gray-700 rounded-lg p-3 text-white focus:border-hybrid-accent focus:outline-none text-base md:text-sm"
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
              <option>Elite</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Available Equipment</label>
          <input
            type="text"
            value={formData.equipment}
            onChange={(e) => setFormData({...formData, equipment: e.target.value})}
            className="w-full bg-hybrid-dark border border-gray-700 rounded-lg p-3 text-white focus:border-hybrid-accent focus:outline-none text-base md:text-sm"
            placeholder="e.g., Full Gym, Dumbbells only, Running Track"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Injuries or Limitations</label>
          <textarea
            value={formData.injuries}
            onChange={(e) => setFormData({...formData, injuries: e.target.value})}
            className="w-full bg-hybrid-dark border border-gray-700 rounded-lg p-3 text-white focus:border-hybrid-accent focus:outline-none h-20 resize-none text-base md:text-sm"
            placeholder="e.g., Lower back sensitivity, left shoulder impingement"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-hybrid-accent hover:bg-hybrid-accent-hover text-hybrid-black font-bold py-4 rounded-xl shadow-lg shadow-lime-900/20 transition-all transform active:scale-95"
        >
          GENERATE PROGRAM
        </button>
      </form>
    </div>
  );
};

export default PlanGenerator;