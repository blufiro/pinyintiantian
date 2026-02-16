import React, { useState, useMemo } from 'react';
import { CoinIcon } from './icons/CoinIcon';
import { ImportIcon } from './icons/ImportIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { ShopIcon } from './icons/ShopIcon';
import { FlagIcon } from './icons/FlagIcon';
import { HistoricalScore, Word, Lesson, EvaluationState } from '../types';
import { wordService } from '../services/wordService';
import { PlayIcon } from './icons/PlayIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { TrophyIcon } from './icons/TrophyIcon';
import { MedalIcon } from './icons/MedalIcon';
import { LeafIcon } from './icons/LeafIcon';
import { FootprintIcon } from './icons/FootprintIcon';
import StudyModeModal from './StudyModeModal';

interface HomeScreenProps {
  onStartTestRequest: () => void;
  onGoToImport: () => void;
  onGoToShop: () => void;
  screenTime: number;
  historicalScores: HistoricalScore[];
  topMistakes: (Word & { mistakeCount: number })[]|any[];
  lessons: Lesson[];
  lessonStatusMap: Record<string, EvaluationState>;
  onEditLesson: (lesson: Lesson) => void;
  onDeleteLesson: (lessonId: string) => void;
  onStartSingleLessonTest: (lessonId: string) => void;
  onStartTopMistakesTest: () => void;
  testSize: number;
  onSetTestSize: (size: number) => void;
  streak: number;
  dailyPoints: number;
  dailyGoal: number;
  setHighlightedLessonId?: (id: string | null) => void;
}

const TABS = [
    { id: 'my', label: 'My Lists' },
    { id: 'p1', label: 'P1' },
    { id: 'p2', label: 'P2' },
    { id: 'p3', label: 'P3' },
    { id: 'p4', label: 'P4' },
];

const HomeScreen: React.FC<HomeScreenProps> = ({ 
    onStartTestRequest, 
    onGoToImport, 
    onGoToShop, 
    screenTime, 
    historicalScores, 
    topMistakes, 
    lessons, 
    lessonStatusMap,
    onEditLesson, 
    onDeleteLesson, 
    onStartSingleLessonTest, 
    onStartTopMistakesTest,
    testSize,
    onSetTestSize,
    streak,
    dailyPoints,
    dailyGoal,
    setHighlightedLessonId
}) => {
  const [activeTab, setActiveTab] = useState('my');
  const [studyLesson, setStudyLesson] = useState<Lesson | null>(null);

  const lessonsToDisplay = useMemo(() => {
    if (activeTab === 'my') {
      return lessons.filter(l => !l.isPredefined);
    }
    return lessons.filter(l => l.level === activeTab);
  }, [activeTab, lessons]);

  const renderStatusIcon = (lessonId: string) => {
      const status = lessonStatusMap[lessonId];
      switch(status) {
          case 'expert': return <TrophyIcon className="w-4 h-4 text-yellow-500" />;
          case 'competent': return <MedalIcon className="w-4 h-4 text-blue-400" />;
          case 'learning': return <LeafIcon className="w-4 h-4 text-green-500" />;
          case 'beginner': return <FootprintIcon className="w-4 h-4 text-gray-400" />;
          default: return null;
      }
  };
  
  const handleExport = () => {
    const allLessons = wordService.getCustomLessons();
    if (allLessons.length === 0) return;
    const blob = new Blob([JSON.stringify(allLessons, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pinyin-lessons-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const goalPercent = Math.min(100, (dailyPoints / dailyGoal) * 100);

  return (
    <div className="flex flex-col h-full gap-1.5 animate-fade-in overflow-hidden">
      {/* Header Section - Minimal Height */}
      <div className="shrink-0 flex justify-between items-center px-1 py-0.5">
         <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-black text-blue-600 font-chinese leading-none">拼音天天练</h1>
            <p className="text-[8px] uppercase tracking-wider text-gray-300 font-black hidden xs:inline">Pinyin Practice</p>
         </div>
         <span className="text-[8px] text-gray-300 font-mono opacity-40">v0.9</span>
      </div>

      {/* Top Dash Cards - Compressed Row */}
      <div className="shrink-0">
          <div className="w-full flex gap-1.5 sm:gap-3 bg-white/80 p-1.5 sm:p-2 rounded-xl sm:rounded-[1.5rem] border border-blue-50 shadow-sm items-center">
              {/* Points */}
              <div className="flex-1 bg-yellow-50 border border-yellow-200 rounded-lg sm:rounded-xl px-1.5 py-1.5 flex items-center justify-center gap-1 sm:gap-1.5 shadow-sm min-h-[42px]">
                <CoinIcon className="w-3.5 h-3.5 text-yellow-500" />
                <span className="text-base sm:text-lg font-black text-yellow-700 leading-none">{screenTime}</span>
              </div>

              {/* Streak */}
              <div className={`flex-1 flex items-center justify-center gap-1 px-1.5 py-1.5 rounded-lg sm:rounded-xl bg-orange-50 border border-orange-200 text-orange-600 font-black min-h-[42px] ${streak > 0 ? 'streak-active' : ''}`}>
                  <span className="text-base sm:text-lg">🔥</span>
                  <div className="flex flex-col items-center">
                    <span className="text-sm sm:text-base leading-none">{streak}</span>
                    <span className="text-[6px] uppercase tracking-tighter hidden xs:inline">Days</span>
                  </div>
              </div>

              {/* Goal Bar - Compact */}
              <div className="hidden sm:flex flex-[2] bg-white rounded-xl px-2 py-1.5 shadow-sm border border-blue-50 items-center gap-2 min-h-[42px]">
                  <FlagIcon className="w-3 h-3 text-blue-500 shrink-0" />
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600" style={{ width: `${goalPercent}%` }}></div>
                  </div>
                  <span className="text-[8px] font-black text-blue-600 whitespace-nowrap">{dailyPoints}/{dailyGoal}</span>
              </div>

              {/* Shop */}
              <button
                onClick={onGoToShop}
                className="flex-[0.5] sm:flex-1 bg-gradient-to-tr from-pink-500 to-rose-400 text-white rounded-lg sm:rounded-xl p-1.5 shadow-md transform active:scale-95 transition-all min-h-[42px] flex items-center justify-center"
              >
                <ShopIcon className="w-4 h-4 sm:w-5 sm:h-5"/>
              </button>
          </div>
          
          {/* Goal bar for small mobile views */}
          <div className="sm:hidden w-full bg-white rounded-lg px-2 py-1 shadow-sm border border-blue-50 flex items-center gap-1.5 mt-1">
              <FlagIcon className="w-2.5 h-2.5 text-blue-500 shrink-0" />
              <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600" style={{ width: `${goalPercent}%` }}></div>
              </div>
              <span className="text-[7px] font-black text-blue-600">{dailyPoints}/{dailyGoal}</span>
          </div>
      </div>

      {/* Main Content Area - Flexible Height */}
      <div className="flex-1 flex flex-col lg:flex-row gap-2 overflow-hidden">
        
        {/* Lesson List Column */}
        <div className="flex-[3] flex flex-col min-h-0 bg-gray-50/50 p-1.5 sm:p-2.5 rounded-xl sm:rounded-[2rem] border border-gray-100 shadow-inner overflow-hidden">
            <div className="shrink-0 flex flex-col gap-1.5 mb-2">
                <div className="flex space-x-0.5 bg-gray-200/50 p-0.5 rounded-lg sm:rounded-xl">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-1 px-0.5 text-[8px] sm:text-[10px] font-black rounded-md sm:rounded-lg transition-all ${
                                activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                
                <div className="flex items-center justify-between gap-2 px-0.5">
                    <div className="flex items-center gap-1 bg-white/80 rounded-full p-0.5 border border-blue-50 shadow-sm shrink-0">
                        {[5, 10, 20].map(size => (
                            <button
                                key={size}
                                onClick={() => onSetTestSize(size)}
                                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full text-[8px] sm:text-[9px] font-black transition-all ${
                                    testSize === size ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-blue-400'
                                }`}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                        <button
                            onClick={onStartTestRequest}
                            className="bg-green-500 hover:bg-green-600 text-white font-black py-1 px-2.5 rounded-md text-[8px] sm:text-[9px] shadow-sm uppercase tracking-wider transition-all transform active:scale-95"
                        >
                            Test 🚀
                        </button>
                        <button
                            onClick={onStartTopMistakesTest}
                            disabled={topMistakes.length === 0}
                            className="bg-rose-500 hover:bg-rose-600 text-white font-black py-1 px-2.5 rounded-md text-[8px] sm:text-[9px] shadow-sm disabled:opacity-50 transition-all transform active:scale-95"
                            title="Test Mistakes"
                        >
                            🎯
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar-thin scroll-smooth">
                {lessonsToDisplay.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-1.5">
                    {lessonsToDisplay.map(lesson => (
                        <div 
                          key={lesson.id} 
                          className="flex justify-between items-center p-2 bg-white rounded-lg sm:rounded-xl border border-gray-100 shadow-sm hover:border-blue-200 transition-all cursor-default"
                          onMouseEnter={() => setHighlightedLessonId?.(lesson.id)}
                          onMouseLeave={() => setHighlightedLessonId?.(null)}
                        >
                        <div className="flex items-center gap-1.5 sm:gap-2 overflow-hidden flex-1">
                             {renderStatusIcon(lesson.id) || <div className="w-3 h-3 rounded-full border border-dashed border-gray-200" />}
                             <span className="font-bold text-gray-700 truncate text-[11px] sm:text-[13px]">{lesson.name}</span>
                        </div>
                        
                        <div className="flex items-center gap-1 shrink-0">
                            {activeTab === 'my' && (
                                <>
                                    <button onClick={() => onEditLesson(lesson)} className="p-0.5 text-gray-300 hover:text-blue-500"><PencilIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" /></button>
                                    <button onClick={() => onDeleteLesson(lesson.id)} className="p-0.5 text-gray-300 hover:text-red-500"><TrashIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" /></button>
                                </>
                            )}
                            <button 
                              onClick={() => setStudyLesson(lesson)}
                              className="bg-purple-50 text-purple-600 p-1 rounded-md hover:bg-purple-600 hover:text-white transition-all shadow-sm"
                            >
                              <BookOpenIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </button>
                            <button onClick={() => onStartSingleLessonTest(lesson.id)} className="bg-blue-50 text-blue-600 p-1 rounded-md hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                              <PlayIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </button>
                        </div>
                        </div>
                    ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-200">
                        <div className="text-2xl mb-1 opacity-20">📥</div>
                        <p className="text-[8px] font-black uppercase tracking-widest">No lists found</p>
                    </div>
                )}
            </div>

            {activeTab === 'my' && (
                <div className="shrink-0 flex justify-center gap-4 mt-1.5 pt-1.5 border-t border-gray-100">
                    <button onClick={onGoToImport} className="flex items-center gap-1 text-[8px] sm:text-[9px] font-black text-purple-600 uppercase hover:bg-purple-50 px-2 py-0.5 rounded-md">
                        <ImportIcon className="w-2.5 h-2.5" /> Add
                    </button>
                    <button onClick={handleExport} className="flex items-center gap-1 text-[8px] sm:text-[9px] font-black text-blue-600 uppercase hover:bg-blue-50 px-2 py-0.5 rounded-md">
                        <DownloadIcon className="w-2.5 h-2.5" /> Backup
                    </button>
                </div>
            )}
        </div>

        {/* Stats Section */}
        <div className="flex-1 grid grid-cols-2 lg:grid-cols-1 gap-1.5 lg:gap-2 lg:max-w-[180px] shrink-0 min-h-[110px] sm:min-h-0 overflow-hidden">
          {/* Mistakes Box */}
          <div className="bg-rose-50/30 p-1.5 sm:p-2 rounded-xl border border-rose-100 flex flex-col overflow-hidden">
            <h3 className="text-[8px] font-black text-rose-700 uppercase mb-1 shrink-0">🎯 Mistakes</h3>
            <div className="flex-1 overflow-y-auto pr-0.5 custom-scrollbar-thin">
              {topMistakes.length > 0 ? (
                <div className="grid grid-cols-2 gap-1 sm:gap-2">
                  {topMistakes.slice(0, 10).map(word => (
                    <div key={word.id} className="flex flex-col items-center justify-center p-1.5 bg-white rounded-lg border border-rose-50 shadow-sm hover:shadow-md transition-all">
                        <span className="font-black font-chinese text-2xl sm:text-3xl text-gray-800 leading-none mb-0.5">{word.character}</span>
                        <div className="bg-rose-50 px-1.5 rounded-full flex items-center gap-0.5">
                           <span className="font-black text-rose-500 text-[10px] sm:text-xs">{word.mistakeCount}</span>
                           <span className="text-[6px] font-black text-rose-300 uppercase tracking-tighter">x</span>
                        </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="h-full flex items-center justify-center text-[7px] text-rose-300 font-bold uppercase">Perfect! 🌟</p>
              )}
            </div>
          </div>

          {/* History Box */}
          <div className="bg-blue-50/30 p-1.5 sm:p-2 rounded-xl border border-blue-100 flex flex-col overflow-hidden">
            <h3 className="text-[8px] font-black text-blue-700 uppercase mb-1 shrink-0">📅 History</h3>
            <div className="flex-1 overflow-y-auto pr-0.5 space-y-0.5 custom-scrollbar-thin">
              {historicalScores.length > 0 ? (
                historicalScores.slice(0, 5).map((s, i) => (
                  <div key={i} className="flex justify-between items-center p-1 bg-white rounded-md text-[8px] border border-blue-50 shadow-sm">
                    <span className="font-bold text-gray-300">{s.date.split('/')[1]}/{s.date.split('/')[0]}</span>
                    <span className="font-black text-blue-500">{s.score}/{s.total}</span>
                  </div>
                ))
              ) : (
                <p className="h-full flex items-center justify-center text-[7px] text-blue-300 font-bold uppercase">No data 🏁</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Study Mode Overlay */}
      {studyLesson && (
        <StudyModeModal 
          lesson={studyLesson} 
          onClose={() => setStudyLesson(null)}
          testSize={testSize}
          onSetTestSize={onSetTestSize}
          onStartTest={() => {
              onStartSingleLessonTest(studyLesson.id);
              setStudyLesson(null);
          }}
        />
      )}
      
      <style>{`
        .custom-scrollbar-thin::-webkit-scrollbar { width: 2px; }
        .custom-scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.04); border-radius: 10px; }
        @media (max-height: 450px) {
           .xs\\:inline { display: inline !important; }
        }
      `}</style>
    </div>
  );
};

export default HomeScreen;