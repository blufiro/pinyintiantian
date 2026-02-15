
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
    dailyGoal
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
          case 'expert': return <TrophyIcon className="w-5 h-5 text-yellow-500" />;
          case 'competent': return <MedalIcon className="w-5 h-5 text-blue-400" />;
          case 'learning': return <LeafIcon className="w-5 h-5 text-green-500" />;
          case 'beginner': return <FootprintIcon className="w-5 h-5 text-gray-400" />;
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
    <div className="text-center flex flex-col items-center space-y-3 animate-fade-in relative px-1">
      {/* Header Row: Compact Title & Version */}
      <div className="w-full flex justify-between items-center pt-1 px-1">
         <div className="flex flex-col items-start">
            <h1 className="text-xl font-bold text-blue-600 font-chinese leading-tight">拼音天天练</h1>
            <p className="text-[9px] uppercase tracking-widest text-gray-400 font-black">Pinyin Practice</p>
         </div>
         <span className="text-[10px] text-gray-400 font-mono opacity-50 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">v0.8.1</span>
      </div>
      
      {/* Toolbar: Points | Streak | Goal Bar | Shop - EXTRA LARGE VERSION */}
      <div className="w-full flex items-center justify-between gap-2.5 bg-white/60 p-3 rounded-[2.5rem] border border-gray-100 shadow-sm">
        {/* Points - Extra Large */}
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-[1.5rem] px-4 py-3 flex items-center space-x-2.5 shadow-sm shrink-0 min-h-[80px]">
          <CoinIcon className="w-8 h-8 text-yellow-500" />
          <span className="text-2xl font-black text-yellow-700 leading-none">{screenTime}</span>
        </div>

        {/* Streak - Extra Large */}
        <div className={`flex items-center gap-1.5 px-4 py-3 rounded-[1.5rem] bg-orange-50 border-2 border-orange-200 text-orange-600 font-black shrink-0 min-h-[80px] ${streak > 0 ? 'streak-active' : ''}`}>
            <span className="text-2xl">🔥</span>
            <div className="flex flex-col items-center">
              <span className="text-xl leading-none">{streak}</span>
              <span className="text-[8px] uppercase tracking-tighter">Days</span>
            </div>
        </div>

        {/* Goal Box - Extra Large but Narrower Bar */}
        <div className="flex-1 bg-white rounded-[1.5rem] px-3 py-3 shadow-sm border-2 border-gray-100 flex flex-col items-center justify-center gap-1.5 min-w-0 min-h-[80px]">
            <div className="flex items-center gap-1.5 w-full">
              <FlagIcon className="w-6 h-6 text-blue-500 shrink-0" />
              <div className="flex-1 h-3.5 bg-gray-100 rounded-full overflow-hidden border border-gray-50">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-1000" 
                    style={{ width: `${goalPercent}%` }}
                  ></div>
              </div>
            </div>
            <span className="text-xs font-black text-blue-600 whitespace-nowrap">{dailyPoints} / {dailyGoal}</span>
        </div>

        {/* Shop - Extra Large */}
        <button
          onClick={onGoToShop}
          className="bg-gradient-to-tr from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white rounded-[1.5rem] p-4 shadow-md transform active:scale-95 transition-all shrink-0 min-h-[80px] w-[80px] flex items-center justify-center"
        >
          <ShopIcon className="w-8 h-8"/>
        </button>
      </div>

      {/* Grouped Actions: Length + Play Buttons */}
      <div className="w-full bg-blue-50/40 p-2 rounded-2xl border border-blue-100 flex flex-col gap-2 shadow-sm">
        <div className="flex items-center justify-center gap-3">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Length</span>
            <div className="bg-white/80 rounded-full p-0.5 shadow-sm flex items-center border border-gray-100">
                {[5, 10, 20].map(size => (
                    <button
                        key={size}
                        onClick={() => onSetTestSize(size)}
                        className={`w-7 h-7 rounded-full text-[10px] font-black transition-all ${
                            testSize === size 
                            ? 'bg-blue-500 text-white shadow-sm' 
                            : 'text-gray-400 hover:text-blue-500'
                        }`}
                    >
                        {size}
                    </button>
                ))}
            </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onStartTestRequest}
              className="bg-gradient-to-b from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white font-black py-2 rounded-xl text-[10px] shadow-md transform active:scale-95 transition-all uppercase tracking-tight"
            >
              Mixed Lessons 🚀
            </button>
            <button
              onClick={onStartTopMistakesTest}
              disabled={topMistakes.length === 0}
              className="bg-gradient-to-b from-rose-400 to-rose-600 hover:from-rose-500 hover:to-rose-700 text-white font-black py-2 rounded-xl text-[10px] shadow-md transform active:scale-95 transition-all disabled:opacity-50 disabled:from-gray-300 disabled:to-gray-400 uppercase tracking-tight"
            >
              Mistakes 🎯
            </button>
        </div>
      </div>

      {/* Lists Tab Section */}
      <div className="w-full bg-gray-50/50 p-2 rounded-2xl border border-gray-100">
        <div className="flex space-x-1 bg-gray-200/50 p-1 rounded-xl mb-2">
            {TABS.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-1.5 px-1 text-[9px] font-black rounded-lg transition-all ${
                        activeTab === tab.id
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500'
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>

        <div className="min-h-[120px]">
            {lessonsToDisplay.length > 0 ? (
                <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto pr-1">
                {lessonsToDisplay.map(lesson => (
                    <div key={lesson.id} className="flex justify-between items-center p-2 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-blue-200 transition-colors">
                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                         {renderStatusIcon(lesson.id) || <div className="w-3.5 h-3.5 rounded-full border-2 border-dashed border-gray-200" />}
                         <span className="font-bold text-gray-700 truncate text-[12px]" title={lesson.name}>{lesson.name}</span>
                    </div>
                    
                    <div className="flex items-center gap-0.5">
                        {activeTab === 'my' && (
                            <>
                                <button onClick={() => onEditLesson(lesson)} className="p-1 text-gray-400 hover:text-blue-500"><PencilIcon className="w-3.5 h-3.5" /></button>
                                <button onClick={() => onDeleteLesson(lesson.id)} className="p-1 text-gray-400 hover:text-red-500"><TrashIcon className="w-3.5 h-3.5" /></button>
                            </>
                        )}
                        <button 
                          onClick={() => setStudyLesson(lesson)}
                          className="bg-purple-50 text-purple-600 p-1.5 rounded-lg hover:bg-purple-600 hover:text-white transition-colors"
                          title="Study words"
                        >
                          <BookOpenIcon className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => onStartSingleLessonTest(lesson.id)} className="ml-1 bg-blue-50 text-blue-600 p-1.5 rounded-lg hover:bg-blue-600 hover:text-white transition-colors">
                          <PlayIcon className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    </div>
                ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-6 text-gray-400">
                    <div className="text-2xl mb-1">📥</div>
                    <p className="text-[10px] font-bold uppercase tracking-widest">No lists</p>
                </div>
            )}

            {activeTab === 'my' && (
                <div className="flex justify-center gap-3 mt-2 pt-2 border-t border-gray-100">
                    <button onClick={onGoToImport} className="flex items-center gap-1 text-[9px] font-black text-purple-600 uppercase tracking-wider hover:bg-purple-50 px-2 py-1 rounded-lg transition-colors">
                        <ImportIcon className="w-3.5 h-3.5" /> Add List
                    </button>
                    <button onClick={handleExport} className="flex items-center gap-1 text-[9px] font-black text-blue-600 uppercase tracking-wider hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors">
                        <DownloadIcon className="w-3.5 h-3.5" /> Backup
                    </button>
                </div>
            )}
        </div>
      </div>

      {/* Stats Quick View - Double height boxes */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Mistakes Box */}
        <div className="bg-rose-50/50 p-2.5 rounded-2xl border border-rose-100 text-left flex flex-col">
          <h3 className="text-[10px] font-black text-rose-700 uppercase tracking-wider mb-2 shrink-0">Mistakes Focus</h3>
          {topMistakes.length > 0 ? (
            <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1 flex-1">
              {topMistakes.map(word => (
                <div key={word.id} className="flex justify-between items-center p-2 bg-white rounded-xl text-xs border border-rose-100 shadow-sm">
                    <div className="flex items-center gap-2">
                        <span className="text-base font-bold font-chinese leading-none">{word.character}</span>
                        <span className="font-mono text-[9px] text-gray-400">{word.pinyin}</span>
                    </div>
                    <span className="font-black text-rose-500 text-[10px]">{word.mistakeCount}❌</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center py-8">
              <p className="text-[10px] text-rose-400 font-bold text-center">PERFECT SCORE! 🌟</p>
            </div>
          )}
        </div>

        {/* Recent Scores Box */}
        <div className="bg-blue-50/50 p-2.5 rounded-2xl border border-blue-100 text-left flex flex-col">
          <h3 className="text-[10px] font-black text-blue-700 uppercase tracking-wider mb-2 shrink-0">History</h3>
          {historicalScores.length > 0 ? (
            <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1 flex-1">
              {historicalScores.map((s, i) => (
                <div key={i} className="flex justify-between items-center p-2 bg-white rounded-xl text-[9px] border border-blue-100 shadow-sm">
                  <span className="font-bold text-gray-400 shrink-0">{s.date.split('/')[1]}/{s.date.split('/')[0]}</span>
                  <span className="flex-1 px-2 truncate font-bold text-gray-600">{s.lessonNames?.[0] || '...'}</span>
                  <span className="font-black text-blue-600 shrink-0">{s.score}/{s.total}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center py-8">
              <p className="text-[10px] text-blue-400 font-bold text-center">NO TESTS YET 🎯</p>
            </div>
          )}
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
    </div>
  );
};

export default HomeScreen;
