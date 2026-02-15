
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
  onRetryMistakes: () => void;
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
    <li className="flex items-center justify-between p-2 sm:p-2.5 bg-white rounded-xl border border-gray-100 shadow-sm transition-all hover:bg-blue-50/30">
      <div className="flex items-center gap-2 sm:gap-3">
        <button 
          onClick={handleSpeak}
          disabled={isSpeaking}
          className="p-1 sm:p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shrink-0 flex items-center justify-center min-w-[28px] sm:min-w-[32px]"
        >
          {isSpeaking ? <LoadingSpinner className="w-3.5 h-3.5 sm:w-4 h-4" /> : <SpeakerIcon className="w-3.5 h-3.5 sm:w-4 h-4" />}
        </button>
        <span className="text-xl sm:text-2xl font-bold text-gray-800 font-chinese leading-none">{word.character}</span>
      </div>
      <div className="flex flex-col items-end gap-0.5 overflow-hidden">
        <span className="text-[8px] sm:text-[9px] text-gray-300 font-bold uppercase truncate max-w-[60px] sm:max-w-[80px] line-through decoration-rose-300">{userInput || '...'}</span>
        <span 
          onClick={() => setRevealed(!revealed)}
          className={`text-[9px] sm:text-[10px] font-black font-mono px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md border transition-all cursor-pointer ${
            isPinyinHidden 
              ? 'bg-gray-100 text-transparent border-gray-100 select-none' 
              : 'bg-green-50 text-green-600 border-green-100'
          }`}
        >
          {word.pinyin}
        </span>
      </div>
    </li>
  );
};

const ResultsScreen: React.FC<ResultsScreenProps> = ({ score, totalQuestions, results, onRetry, onRetryMistakes, onHome }) => {
  const [hidePinyin, setHidePinyin] = useState(false);
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  
  const getFeedback = () => {
    if (percentage === 100) return "Master Class! 💎";
    if (percentage >= 80) return "Super Effort! ⭐";
    if (percentage >= 60) return "Keep Going! 💪";
    return "Try Again! 😊";
  };

  const mistakes = results.filter(r => !r.correct);

  return (
    <div className="flex flex-col h-full animate-fade-in overflow-hidden">
      {/* Header - Fixed */}
      <div className="shrink-0 text-center mb-2 sm:mb-6 landscape:mb-1">
        <h2 className="text-xl sm:text-3xl font-black text-blue-600 uppercase tracking-tighter landscape:text-lg">Test Finished!</h2>
        <p className="text-[8px] sm:text-[9px] font-black text-blue-300 uppercase tracking-[0.3em] landscape:hidden sm:block">Evaluation Complete</p>
      </div>
      
      {/* Main Body - Split Layout on landscape or sm+ screens */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 landscape:grid-cols-2 gap-3 sm:gap-6 min-h-0 items-center">
        
        {/* Left: Score Column */}
        <div className="flex flex-col items-center justify-center space-y-2 sm:space-y-4 landscape:space-y-1">
            <div className="relative group">
                <div className="absolute -inset-3 bg-yellow-400/20 rounded-full blur-xl animate-pulse"></div>
                <div className="relative w-28 h-28 sm:w-44 sm:h-44 landscape:w-24 landscape:h-24 bg-white rounded-full flex flex-col items-center justify-center border-[6px] sm:border-[10px] border-blue-500 shadow-2xl overflow-hidden">
                    <span className="text-2xl sm:text-5xl landscape:text-xl font-black text-blue-600 mb-0.5">{score}/{totalQuestions}</span>
                    <div className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-[8px] sm:text-xs font-black">
                        {percentage}%
                    </div>
                </div>
            </div>
            
            <div className="text-center space-y-1 sm:space-y-2 landscape:space-y-0">
                <p className="text-lg sm:text-2xl landscape:text-base font-black text-gray-700 italic">"{getFeedback()}"</p>
                <div className="inline-flex items-center gap-1.5 bg-yellow-100 text-yellow-800 font-black py-1 px-3 sm:py-1.5 sm:px-5 rounded-2xl text-[8px] sm:text-[10px] uppercase tracking-wider shadow-sm border border-yellow-200">
                    Earned {score} Points 🪙
                </div>
            </div>
        </div>

        {/* Right: Revision Column */}
        <div className="h-full flex flex-col min-h-0 landscape:max-h-full">
            {mistakes.length > 0 ? (
                <div className="flex-1 flex flex-col bg-gray-50/50 p-2 sm:p-4 rounded-[1.5rem] sm:rounded-[2rem] border border-gray-100 shadow-inner min-h-0 overflow-hidden">
                    <div className="shrink-0 flex justify-between items-center mb-1.5 sm:mb-3 px-1">
                        <h3 className="text-[8px] sm:text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Mistakes ({mistakes.length})</h3>
                        <button 
                            onClick={() => setHidePinyin(!hidePinyin)}
                            className={`text-[7px] sm:text-[8px] font-black uppercase px-2 py-0.5 sm:py-1 rounded-lg transition-all shadow-sm border ${
                                hidePinyin 
                                ? 'bg-blue-600 text-white border-blue-600' 
                                : 'bg-white text-blue-600 border-blue-100'
                            }`}
                        >
                            {hidePinyin ? 'Show Pinyin' : 'Hide Pinyin'}
                        </button>
                    </div>
                    
                    <ul className="flex-1 overflow-y-auto space-y-1.5 sm:space-y-2 pr-1 custom-scrollbar-thin scroll-smooth">
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
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-green-50/30 rounded-[1.5rem] sm:rounded-[2rem] border border-green-100 border-dashed p-4 sm:p-6 text-center">
                    <span className="text-3xl sm:text-5xl mb-2 sm:mb-4">✨ 🏆 ✨</span>
                    <h3 className="text-base sm:text-lg font-black text-green-600 uppercase tracking-widest">Perfect Score!</h3>
                    <p className="text-[8px] sm:text-[10px] text-green-400 font-bold max-w-[180px] mt-1 sm:mt-2">You didn't make any mistakes this time. Keep up the amazing work!</p>
                </div>
            )}
        </div>
      </div>

      {/* Footer Actions - Fixed */}
      <div className="shrink-0 mt-3 sm:mt-6 pt-2 sm:pt-4 border-t border-gray-100 landscape:mt-2 landscape:pt-1">
        <div className="flex flex-col sm:flex-row landscape:flex-row gap-2 sm:gap-3 max-w-2xl mx-auto">
            <div className="flex-1 grid grid-cols-2 gap-2 sm:gap-3">
                <button
                    onClick={onRetry}
                    className="flex items-center justify-center gap-1.5 sm:gap-2 bg-green-500 hover:bg-green-600 text-white font-black py-2 sm:py-4 px-3 rounded-xl sm:rounded-2xl text-[9px] sm:text-xs shadow-lg transition-all transform active:scale-95 uppercase tracking-widest"
                >
                    <RestartIcon className="w-3.5 h-3.5 sm:w-4 h-4" />
                    <span>Retry</span>
                </button>
                
                <button
                    onClick={onRetryMistakes}
                    disabled={mistakes.length === 0}
                    className="flex items-center justify-center gap-1.5 sm:gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black py-2 sm:py-4 px-3 rounded-xl sm:rounded-2xl text-[9px] sm:text-xs shadow-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:grayscale uppercase tracking-widest"
                >
                    <RestartIcon className="w-3.5 h-3.5 sm:w-4 h-4" />
                    <span>Fix Errors</span>
                </button>
            </div>

            <button
                onClick={onHome}
                className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 bg-gray-700 hover:bg-gray-800 text-white font-black py-2 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl text-[9px] sm:text-xs shadow-lg transition-all transform active:scale-95 uppercase tracking-[0.1em] sm:tracking-[0.2em]"
            >
                <HomeIcon className="w-3.5 h-3.5 sm:w-4 h-4" />
                <span>Home Menu</span>
            </button>
        </div>
      </div>

      <style>{`
        .custom-scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default ResultsScreen;
