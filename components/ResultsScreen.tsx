
import React from 'react';
import { TestResult } from '../types';
import { HomeIcon } from './icons/HomeIcon';
import { RestartIcon } from './icons/RestartIcon';
import { SpeakerIcon } from './icons/SpeakerIcon';
import { geminiService } from '../services/geminiService';

interface ResultsScreenProps {
  score: number;
  totalQuestions: number;
  results: TestResult[];
  onRetry: () => void;
  onHome: () => void;
}

const ResultsScreen: React.FC<ResultsScreenProps> = ({ score, totalQuestions, results, onRetry, onHome }) => {
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  
  const getFeedback = () => {
    if (percentage === 100) return "Perfect! You're a Pinyin master! ✨";
    if (percentage >= 80) return "Great job! Keep up the excellent work! 👍";
    if (percentage >= 60) return "Good effort! Practice makes perfect. 💪";
    return "Don't worry, let's try again! You can do it! 😊";
  };

  return (
    <div className="text-center flex flex-col items-center justify-center p-4 space-y-6">
      <h2 className="text-3xl font-bold text-blue-600">Test Complete!</h2>
      
      <div className="bg-yellow-100 text-yellow-800 font-bold py-2 px-6 rounded-full shadow-sm border border-yellow-200">
        You earned {score} {score === 1 ? 'point' : 'points'} of screen time! ⭐
      </div>

      <div className="w-48 h-48 bg-blue-100 rounded-full flex flex-col items-center justify-center border-8 border-blue-200 shadow-inner">
        <span className="text-5xl font-bold text-blue-700">{score}/{totalQuestions}</span>
        <span className="text-xl text-blue-500 font-medium">{percentage}%</span>
      </div>
      
      <p className="text-xl font-semibold text-gray-700 max-w-xs">{getFeedback()}</p>

      {results.some(r => !r.correct) && (
        <div className="w-full max-w-md bg-gray-50 p-5 rounded-2xl shadow-inner border border-gray-100">
          <h3 className="text-lg font-bold mb-4 text-left text-gray-800">Review your mistakes:</h3>
          <ul className="space-y-3 text-left">
            {results.filter(r => !r.correct).map(({ word, userInput }) => (
              <li key={word.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => geminiService.speak(word.character)}
                        className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors shadow-sm active:scale-95"
                        title="Hear pronunciation"
                    >
                        <SpeakerIcon className="w-5 h-5" />
                    </button>
                    <span className="text-3xl font-bold text-gray-800">{word.character}</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <span className="text-lg text-red-500 font-mono font-medium">{userInput || 'no answer'}</span>
                    <span className="text-sm text-green-600 font-mono bg-green-50 px-2.5 py-1 rounded-md border border-green-100">{word.pinyin}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm pt-4">
        <button
          onClick={onRetry}
          className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-full text-lg shadow-lg transition-all transform hover:scale-105 active:scale-95"
        >
          <RestartIcon className="w-6 h-6" />
          <span>Try Again</span>
        </button>
        <button
          onClick={onHome}
          className="flex-1 flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white font-bold py-4 px-6 rounded-full text-lg shadow-lg transition-all transform hover:scale-105 active:scale-95"
        >
          <HomeIcon className="w-6 h-6" />
          <span>Home</span>
        </button>
      </div>
    </div>
  );
};

export default ResultsScreen;
