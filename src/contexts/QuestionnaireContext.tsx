import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { QuestionnaireState, Question } from '../types/questionnaire';

interface QuestionnaireContextType {
  state: QuestionnaireState;
  setAnswer: (questionId: string, answer: string) => void;
  completeQuestionnaire: () => void;
  setError: (error: string | null) => void;
}

const initialState: QuestionnaireState = {
  answers: {},
  isComplete: false,
  error: null,
};

type Action =
  | { type: 'SET_ANSWER'; payload: { questionId: string; answer: string } }
  | { type: 'COMPLETE_QUESTIONNAIRE' }
  | { type: 'SET_ERROR'; payload: string | null };

const questionnaireReducer = (state: QuestionnaireState, action: Action): QuestionnaireState => {
  switch (action.type) {
    case 'SET_ANSWER':
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.payload.questionId]: action.payload.answer,
        },
      };
    case 'COMPLETE_QUESTIONNAIRE':
      return {
        ...state,
        isComplete: true,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    default:
      return state;
  }
};

const QuestionnaireContext = createContext<QuestionnaireContextType | undefined>(undefined);

export const QuestionnaireProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(questionnaireReducer, initialState);

  const setAnswer = (questionId: string, answer: string) => {
    dispatch({ type: 'SET_ANSWER', payload: { questionId, answer } });
  };

  const completeQuestionnaire = () => {
    dispatch({ type: 'COMPLETE_QUESTIONNAIRE' });
  };

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  return (
    <QuestionnaireContext.Provider
      value={{
        state,
        setAnswer,
        completeQuestionnaire,
        setError,
      }}
    >
      {children}
    </QuestionnaireContext.Provider>
  );
};

export const useQuestionnaire = () => {
  const context = useContext(QuestionnaireContext);
  if (context === undefined) {
    throw new Error('useQuestionnaire must be used within a QuestionnaireProvider');
  }
  return context;
}; 