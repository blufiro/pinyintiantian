
import React, { useState } from 'react';
import { Lesson, Word, Definition } from '../types';
import { XMarkIcon } from './icons/XMarkIcon';
import { SpeakerIcon } from './icons/SpeakerIcon';
import { InformationCircleIcon } from './icons/InformationCircleIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { geminiService } from '../services/geminiService';

interface StudyModeModalProps {
  lesson: Lesson;
  onClose: () => void;
  onStartTest: () => void;
  testSize: number;
  onSetTestSize: (size: number) => void;
}

const LoadingSpinner: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const SentenceControls: React.FC<{ sentence: string; targetWord: string }> = ({ sentence, targetWord }) => {
  const [loading, setLoading] = useState<'hear' | 'explain' | null>(null);

  const handleHear = async () => {
    setLoading('hear');
    try {
      await geminiService.speak(sentence);
    } finally {
      setLoading(null);
    }
  };

  const handleExplain = async () => {
    setLoading('explain');
    try {
      await geminiService.explainAndSpeak(sentence, targetWord);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex gap-2 mt-2 pl-6">
      <button 
        onClick={handleHear}
        disabled={!!loading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm disabled:opacity-50"
      >
        {loading === 'hear' ? <LoadingSpinner className="w-3 h-3" /> : <SpeakerIcon className="w-3.5 h-3.5" />}
        {loading === 'hear' ? 'Loading...' : 'Hear'}
      </button>
      <button 
        onClick={handleExplain}
        disabled={!!loading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white transition-all shadow-sm disabled:opacity-50"
      >
        {loading === 'explain' ? <LoadingSpinner className="w-3 h-3 text-purple-600" /> : <InformationCircleIcon className="w-3.5 h-3.5" />}
        {loading === 'explain' ? 'Thinking...' : 'Explain'}
      </button>
    </div>
  );
};

const StudyWordCard: React.FC<{ 
  word: Word; 
  hidePinyin: boolean; 
  hideCharacter: boolean;
}> = ({ word, hidePinyin, hideCharacter }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPinyinOverride, setShowPinyinOverride] = useState(false);
  const [showCharOverride, setShowCharOverride] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSpeak = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      await geminiService.speak(word.character);
    } finally {
      setIsSpeaking(false);
    }
  };

  const displayMeaning = word.definitions && word.definitions.length > 0
    ? word.definitions.map(d => d.meaning).join('; ')
    : word.meaning || 'Tap to learn meaning';

  return (
    <div className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden transition-all duration-300">
      <div className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 overflow-hidden">
          <button 
            onClick={handleSpeak}
            disabled={isSpeaking}
            className="p-2 bg-purple-50 text-purple-600 rounded-full hover:bg-purple-100 transition-colors shrink-0 min-w-[40px] flex items-center justify-center"
          >
            {isSpeaking ? <LoadingSpinner className="w-5 h-5 text-purple-600" /> : <SpeakerIcon className="w-5 h-5" />}
          </button>
          
          <div className="flex flex-col min-w-0">
            <div className="flex items-baseline gap-2">
              <span 
                onClick={() => setShowCharOverride(!showCharOverride)}
                className={`text-3xl font-bold font-chinese cursor-pointer transition-all ${
                  hideCharacter && !showCharOverride ? 'bg-gray-200 text-transparent rounded px-2' : 'text-gray-800'
                }`}
              >
                {word.character}
              </span>
              <span 
                onClick={() => setShowPinyinOverride(!showPinyinOverride)}
                className={`font-mono text-sm cursor-pointer transition-all ${
                  hidePinyin && !showPinyinOverride ? 'bg-purple-100 text-transparent rounded px-2' : 'text-purple-500'
                }`}
              >
                {word.pinyin}
              </span>
            </div>
            <p className="text-gray-500 text-sm font-medium truncate italic" title={displayMeaning}>
              {displayMeaning}
            </p>
          </div>
        </div>

        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className={`p-2 text-gray-400 hover:text-purple-600 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
        >
          <ChevronDownIcon className="w-5 h-5" />
        </button>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 pt-2 bg-purple-50/30 border-t border-purple-50 animate-slide-down">
          {word.definitions && word.definitions.length > 0 ? (
            <div className="space-y-4">
              {word.definitions.map((def, idx) => (
                <div key={idx} className="flex flex-col space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-4 h-4 rounded-full bg-purple-200 text-purple-700 text-[10px] font-black">{idx + 1}</span>
                    <span className="text-xs font-black text-purple-400 uppercase tracking-widest">{def.meaning}</span>
                  </div>
                  <p className="text-gray-700 font-chinese text-lg leading-relaxed pl-6">
                    {def.example}
                  </p>
                  <SentenceControls sentence={def.example} targetWord={word.character} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col space-y-2">
              <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Example Sentence</span>
              <p className="text-gray-700 font-chinese text-lg leading-relaxed">
                {word.exampleSentence || "Let's use this word in a sentence!"}
              </p>
              {word.exampleSentence && <SentenceControls sentence={word.exampleSentence} targetWord={word.character} />}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const StudyModeModal: React.FC<StudyModeModalProps> = ({ lesson, onClose, onStartTest, testSize, onSetTestSize }) => {
  const [hidePinyin, setHidePinyin] = useState(false);
  const [hideCharacter, setHideCharacter] = useState(false);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-purple-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-xl h-[85vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border-4 border-white">
        {/* Sticky Header */}
        <div className="p-6 pb-4 bg-gradient-to-br from-purple-50 to-white border-b border-purple-100 shrink-0">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-black text-purple-600 font-chinese mb-1">{lesson.name}</h2>
              <p className="text-xs font-bold text-purple-400 uppercase tracking-widest">Study Mode • {lesson.words.length} Words</p>
            </div>
            <button onClick={onClose} className="p-2 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition-colors">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setHidePinyin(!hidePinyin)}
              className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${
                hidePinyin ? 'bg-purple-600 text-white shadow-lg' : 'bg-white text-purple-600 border border-purple-200'
              }`}
            >
              {hidePinyin ? 'Showing Pinyin...' : 'Hide Pinyin'}
            </button>
            <button 
              onClick={() => setHideCharacter(!hideCharacter)}
              className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${
                hideCharacter ? 'bg-purple-600 text-white shadow-lg' : 'bg-white text-purple-600 border border-purple-200'
              }`}
            >
              {hideCharacter ? 'Showing Chinese...' : 'Hide Chinese'}
            </button>
          </div>
        </div>

        {/* Word List Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
          {lesson.words.map((word) => (
            <StudyWordCard 
              key={word.id} 
              word={word} 
              hidePinyin={hidePinyin} 
              hideCharacter={hideCharacter}
            />
          ))}
          <div className="py-8 text-center">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">You've reached the end! 🎉</p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="p-6 bg-white border-t border-gray-100 shrink-0 space-y-4">
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 bg-purple-50 p-1.5 rounded-2xl border border-purple-100">
                <span className="text-[10px] font-black text-purple-400 px-2 uppercase tracking-widest">Test Length</span>
                <div className="flex gap-1.5">
                  {[5, 10, 20].map(size => (
                    <button
                      key={size}
                      onClick={() => onSetTestSize(size)}
                      className={`w-10 h-10 rounded-xl text-sm font-black transition-all ${
                        testSize === size 
                        ? 'bg-purple-600 text-white shadow-lg scale-110' 
                        : 'bg-white text-purple-400 hover:text-purple-600'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={onStartTest}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-4 rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-widest text-lg"
              >
                I'M READY TO PLAY! 🚀
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default StudyModeModal;
