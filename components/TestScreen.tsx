
import React, { useState, useEffect, useRef } from 'react';
import { Word, TestResult } from '../types';
import { geminiService } from '../services/geminiService';
import { SpeakerIcon } from './icons/SpeakerIcon';
import { XMarkIcon } from './icons/XMarkIcon';

interface TestScreenProps {
  onTestComplete: (results: TestResult[], score: number) => void;
  onGoHome: () => void;
  words: Word[];
}

const LoadingSpinner: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const normalizePinyin = (pinyin: string): string => {
    return pinyin.toLowerCase().replace(/\s+/g, ' ').trim();
};

const TestScreen: React.FC<TestScreenProps> = ({ onTestComplete, onGoHome, words }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [results, setResults] = useState<TestResult[]>([]);
  const [answerStatus, setAnswerStatus] = useState<'correct' | 'incorrect' | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (words.length === 0) {
        alert("No words were provided for the test.");
        onGoHome();
    }
  }, [words, onGoHome]);

  useEffect(() => {
    if (!answerStatus) {
      inputRef.current?.focus();
    }
  }, [currentIndex, answerStatus]);
  
  const handleExit = () => {
    if (window.confirm("Exit test? Progress will be lost.")) {
        onGoHome();
    }
  };
  
  useEffect(() => {
    if (!answerStatus) return;

    const timer = setTimeout(() => {
      if (currentIndex < words.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setInputValue('');
        setAnswerStatus(null);
      } else {
        const score = results.filter(r => r.correct).length;
        onTestComplete(results, score);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [answerStatus, currentIndex, words, results, onTestComplete]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (answerStatus || !words[currentIndex]) return;

    const currentWord = words[currentIndex];
    const isCorrect = normalizePinyin(inputValue) === normalizePinyin(currentWord.pinyin);
    
    const newResults = [...results, { word: currentWord, userInput: inputValue, correct: isCorrect }];
    setResults(newResults);
    setAnswerStatus(isCorrect ? 'correct' : 'incorrect');
  };
  
  const handleSpeak = async () => {
    if (isSpeaking || !words[currentIndex]) return;
    setIsSpeaking(true);
    try {
      await geminiService.speak(words[currentIndex].character);
    } finally {
      setIsSpeaking(false);
    }
  };

  if (words.length === 0 || !words[currentIndex]) {
    return <div className="text-center p-8">Loading your words...</div>;
  }

  const currentWord = words[currentIndex];

  return (
    <div className="flex flex-col landscape:flex-row h-full w-full gap-4 sm:gap-6 relative max-w-4xl mx-auto overflow-hidden">
       {/* Exit Button - Stays top right */}
       <button 
          onClick={handleExit} 
          className="absolute top-0 right-0 p-1.5 rounded-full text-gray-300 hover:bg-gray-100 hover:text-gray-500 transition-colors z-20"
          aria-label="Exit Test"
        >
          <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6"/>
        </button>
        
      {/* Left Column (Landscape) / Top Area (Portrait) */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-3 sm:space-y-4">
        {/* Progress Badge - Compact on Landscape */}
        <div className="bg-blue-50 px-4 py-1 rounded-full border border-blue-100 landscape:py-0.5">
          <span className="text-[10px] sm:text-sm font-black text-blue-500 uppercase tracking-widest">
            {currentIndex + 1} / {words.length}
          </span>
        </div>

        {/* Character Card - Responsive sizing */}
        <div className="relative w-full aspect-square max-w-[240px] sm:max-w-none sm:h-64 bg-white rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center border border-blue-50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          <p className="text-7xl sm:text-9xl font-bold font-chinese tracking-tighter text-gray-800">{currentWord.character}</p>
          
          {/* Audio trigger inside or near card for landscape efficiency */}
          <button 
            onClick={handleSpeak} 
            disabled={isSpeaking}
            className="absolute bottom-3 right-3 p-2.5 sm:p-4 rounded-2xl bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white disabled:opacity-30 transition-all transform active:scale-90"
          >
            {isSpeaking ? <LoadingSpinner className="w-5 h-5" /> : <SpeakerIcon className="w-5 h-5 sm:w-6 sm:h-6"/>}
          </button>

          {answerStatus && (
              <div className={`absolute inset-0 flex items-center justify-center text-white font-black text-xl sm:text-4xl transition-all duration-300 animate-fade-in ${answerStatus === 'correct' ? 'bg-green-500/95' : 'bg-rose-500/95'}`}>
                  {answerStatus === 'correct' ? 'EXCELLENT!' : 'OOPS!'}
              </div>
          )}
        </div>
      </div>

      {/* Right Column (Landscape) / Bottom Area (Portrait) */}
      <div className="flex-1 flex flex-col justify-center space-y-3 sm:space-y-4">
        
        {/* Correction Feedback - Conditional Height */}
        <div className={`transition-all duration-300 ${answerStatus === 'incorrect' ? 'opacity-100 h-auto' : 'opacity-0 h-0 pointer-events-none'}`}>
            <div className="text-center p-2 sm:p-3 bg-rose-50 rounded-2xl border border-rose-100 animate-bounce-short">
                <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-0.5">Correction</p>
                <span className="font-mono text-lg sm:text-xl text-rose-600 font-bold">{currentWord.pinyin}</span>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3 sm:gap-4">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={!!answerStatus}
              placeholder="Type pinyin..."
              className="w-full text-center py-3 sm:py-4 px-4 sm:px-6 bg-white border-2 border-blue-50 rounded-2xl sm:rounded-[1.5rem] text-lg sm:text-2xl font-mono focus:border-blue-400 focus:ring-0 focus:shadow-lg transition-all disabled:bg-gray-50 placeholder:text-gray-200"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>
          
          <button
            type="submit"
            disabled={!!answerStatus || inputValue.trim() === ''}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-black py-3 sm:py-4 rounded-2xl text-sm sm:text-lg shadow-xl disabled:from-gray-300 disabled:to-gray-400 disabled:shadow-none transform active:scale-[0.98] transition-all uppercase tracking-widest"
          >
            {answerStatus ? 'Validating...' : 'Check Answer! ✨'}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes bounce-short {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-bounce-short {
          animation: bounce-short 0.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default TestScreen;
