// contexts/WorkoutContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Exercise = {
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  time?: number;
  notes?: string;
};

export type WorkoutPlanType = {
  _id: string;
  user: string;
  day: string;
  title: string;
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  notes?: string;
};

type WorkoutContextType = {
  workouts: WorkoutPlanType[];
  refreshWorkouts: () => void;
  setWorkouts: (workouts: WorkoutPlanType[]) => void;
  shouldRefresh: boolean;
};

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export const WorkoutProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [workouts, setWorkouts] = useState<WorkoutPlanType[]>([]);
  const [shouldRefresh, setShouldRefresh] = useState(false);

  const refreshWorkouts = () => {
    setShouldRefresh(prev => !prev); // Toggle to trigger refresh
  };

  const contextValue: WorkoutContextType = {
    workouts,
    setWorkouts,
    refreshWorkouts,
    shouldRefresh
  };

  return (
    <WorkoutContext.Provider value={contextValue}>
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (context === undefined) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
};