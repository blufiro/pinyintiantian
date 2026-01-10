
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

// Helper to normalize pinyin input
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
        // This case should ideally be handled before navigating to this screen
        alert("No words were provided for the test.");
        onGoHome();
    }
  }, [words, onGoHome]);

  useEffect(() => {
    // Automatically focus the input when the word changes and we are not showing feedback
    if (!answerStatus) {
      inputRef.current?.focus();
    }
  }, [currentIndex, answerStatus]);
  
  const handleExit = () => {
    if (window.confirm("Are you sure you want to exit? Your progress in this test will be lost.")) {
        onGoHome();
    }
  };
  
  // This effect handles the logic for moving to the next word after a delay.
  useEffect(() => {
    if (!answerStatus) {
      return;
    }

    // Set a timer to show the result feedback for 1.5 seconds.
    const timer = setTimeout(() => {
      // If there are more words, move to the next one.
      if (currentIndex < words.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setInputValue('');
        setAnswerStatus(null); // Reset for the next word.
      } else {
        // Otherwise, the test is over. The `results` state already has all the answers.
        const score = results.filter(r => r.correct).length;
        onTestComplete(results, score);
      }
    }, 1500);

    // Clean up the timer if the component unmounts or dependencies change.
    return () => clearTimeout(timer);
  }, [answerStatus, currentIndex, words, results, onTestComplete]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (answerStatus || !words[currentIndex]) return;

    const currentWord = words[currentIndex];
    const isCorrect = normalizePinyin(inputValue) === normalizePinyin(currentWord.pinyin);
    
    setResults(prev => [...prev, { word: currentWord, userInput: inputValue, correct: isCorrect }]);
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
    <div className="flex flex-col items-center p-0 xl:p-4 space-y-3 xl:space-y-6 relative">
       <button 
          onClick={handleExit} 
          className="absolute top-0 right-0 p-1 xl:p-2 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
          aria-label="Exit Test"
        >
          <XMarkIcon className="w-5 h-5 xl:w-6 xl:h-6"/>
        </button>
      <div className="w-full flex justify-between items-center px-1">
        <span className="text-sm xl:text-lg font-semibold text-gray-500">
          Word {currentIndex + 1} / {words.length}
        </span>
        <button 
          onClick={handleSpeak} 
          disabled={isSpeaking}
          className="p-1.5 xl:p-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <SpeakerIcon className="w-5 h-5 xl:w-6 xl:h-6"/>
        </button>
      </div>

      <div className="relative w-full h-32 xl:h-56 bg-gray-100 rounded-xl flex items-center justify-center mb-1 xl:mb-4 border border-gray-200 shadow-sm">
        <p className="text-6xl xl:text-8xl font-bold tracking-widest">{currentWord.character}</p>
        {answerStatus && (
            <div className={`absolute inset-0 rounded-xl flex items-center justify-center text-white font-bold text-xl xl:text-2xl transition-opacity duration-300 ${answerStatus === 'correct' ? 'bg-green-500/90' : 'bg-red-500/90'}`}>
                {answerStatus === 'correct' ? 'Correct! 🎉' : 'Oops!'}
            </div>
        )}
      </div>
        {answerStatus === 'incorrect' && (
            <p className="text-center text-red-600 font-semibold text-base xl:text-lg">
                Correct: <span className="font-mono">{currentWord.pinyin}</span>
            </p>
        )}

      <form onSubmit={handleSubmit} className="w-full flex flex-col items-center space-y-2 xl:space-y-4">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={!!answerStatus}
          placeholder="Type pinyin here"
          className="w-full text-center p-3 xl:p-4 bg-gray-100 border-2 border-gray-300 rounded-lg text-lg xl:text-xl focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors disabled:bg-gray-200"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
        />
        <button
          type="submit"
          disabled={!!answerStatus || inputValue.trim() === ''}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg text-lg shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed transform active:scale-95 transition-all duration-200"
        >
          {answerStatus ? 'Checking...' : 'Check Answer'}
        </button>
      </form>
    </div>
  );
};

export default TestScreen;
