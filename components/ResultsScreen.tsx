
import React, { useState } from 'react';
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

const LoadingSpinner: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const MistakeItem: React.FC<{ word: { character: string, pinyin: string, id: string }, userInput: string, hideAllPinyin: boolean }> = ({ word, userInput, hideAllPinyin }) => {
  const [revealed, setRevealed] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const isPinyinHidden = hideAllPinyin && !revealed;

  const handleSpeak = async () => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      await geminiService.speak(word.character);
    } finally {
      setIsSpeaking(false);
    }
  };

  return (
    <li className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center gap-4">
        <button 
          onClick={handleSpeak}
          disabled={isSpeaking}
          className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors shadow-sm active:scale-95 min-w-[36px] flex items-center justify-center"
          title="Hear pronunciation"
        >
          {isSpeaking ? <LoadingSpinner className="w-5 h-5 text-blue-600" /> : <SpeakerIcon className="w-5 h-5" />}
        </button>
        <span className="text-3xl font-bold text-gray-800 font-chinese">{word.character}</span>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-xs text-gray-400 font-medium line-through decoration-red-300">{userInput || 'no answer'}</span>
        <span 
          onClick={() => setRevealed(!revealed)}
          className={`text-sm font-mono px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
            isPinyinHidden 
              ? 'bg-gray-100 text-transparent border-gray-200 select-none' 
              : 'bg-green-50 text-green-600 border-green-100'
          }`}
          title={isPinyinHidden ? "Click to reveal" : ""}
        >
          {word.pinyin}
        </span>
      </div>
    </li>
  );
};

const ResultsScreen: React.FC<ResultsScreenProps> = ({ score, totalQuestions, results, onRetry, onHome }) => {
  const [hidePinyin, setHidePinyin] = useState(false);
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  
  const getFeedback = () => {
    if (percentage === 100) return "Perfect! You're a Pinyin master! ✨";
    if (percentage >= 80) return "Great job! Keep up the excellent work! 👍";
    if (percentage >= 60) return "Good effort! Practice makes perfect. 💪";
    return "Don't worry, let's try again! You can do it! 😊";
  };

  const mistakes = results.filter(r => !r.correct);

  return (
    <div className="text-center flex flex-col items-center justify-center p-4 space-y-6 animate-fade-in">
      <h2 className="text-3xl font-black text-blue-600 uppercase tracking-tight">Test Complete!</h2>
      
      <div className="bg-yellow-100 text-yellow-800 font-bold py-2 px-6 rounded-full shadow-sm border border-yellow-200">
        You earned {score} {score === 1 ? 'point' : 'points'} of screen time! ⭐
      </div>

      <div className="w-48 h-48 bg-blue-100 rounded-full flex flex-col items-center justify-center border-8 border-blue-200 shadow-inner">
        <span className="text-5xl font-black text-blue-700">{score}/{totalQuestions}</span>
        <span className="text-xl text-blue-500 font-bold">{percentage}%</span>
      </div>
      
      <p className="text-xl font-bold text-gray-700 max-w-xs">{getFeedback()}</p>

      {mistakes.length > 0 && (
        <div className="w-full max-w-md bg-gray-50 p-5 rounded-3xl shadow-inner border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest">Review Mistakes</h3>
            <button 
              onClick={() => setHidePinyin(!hidePinyin)}
              className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-full transition-all border ${
                hidePinyin 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white text-blue-600 border-blue-200 hover:border-blue-400'
              }`}
            >
              {hidePinyin ? 'Show Pinyin' : 'Hide Pinyin'}
            </button>
          </div>
          
          <ul className="space-y-3 text-left">
            {mistakes.map((result) => (
              <MistakeItem 
                key={result.word.id} 
                word={result.word} 
                userInput={result.userInput} 
                hideAllPinyin={hidePinyin}
              />
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm pt-4">
        <button
          onClick={onRetry}
          className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-black py-4 px-6 rounded-2xl text-lg shadow-lg transition-all transform hover:scale-105 active:scale-95"
        >
          <RestartIcon className="w-6 h-6" />
          <span>Try Again</span>
        </button>
        <button
          onClick={onHome}
          className="flex-1 flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white font-black py-4 px-6 rounded-2xl text-lg shadow-lg transition-all transform hover:scale-105 active:scale-95"
        >
          <HomeIcon className="w-6 h-6" />
          <span>Home</span>
        </button>
      </div>
    </div>
  );
};

export default ResultsScreen;
