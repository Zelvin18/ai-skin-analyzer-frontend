import React from 'react';
import { useQuestionnaire } from '../contexts/QuestionnaireContext';
import { Question } from '../types/questionnaire';

interface QuestionnaireProps {
  questions: Question[];
  onComplete: (answers: Record<string, string>) => void;
}

const Questionnaire: React.FC<QuestionnaireProps> = ({ questions, onComplete }) => {
  const { state, setAnswer, completeQuestionnaire, setError } = useQuestionnaire();

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswer(questionId, answer);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const unansweredQuestions = questions.filter(
      (q) => !state.answers[q.id]
    );

    if (unansweredQuestions.length > 0) {
      setError('Please answer all questions before submitting.');
      return;
    }

    completeQuestionnaire();
    onComplete(state.answers);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-8">
        {questions.map((question) => (
          <div key={question.id} className="space-y-4">
            <label className="block text-lg font-medium text-gray-900">
              {question.text}
            </label>
            <div className="space-y-2">
              {question.options.map((option) => (
                <div key={option.value} className="flex items-center">
                  <input
                    type="radio"
                    id={`${question.id}-${option.value}`}
                    name={question.id}
                    value={option.value}
                    checked={state.answers[question.id] === option.value}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor={`${question.id}-${option.value}`}
                    className="ml-3 block text-sm font-medium text-gray-700"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}

        {state.error && (
          <div className="text-red-600 text-sm">{state.error}</div>
        )}

        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default Questionnaire; 