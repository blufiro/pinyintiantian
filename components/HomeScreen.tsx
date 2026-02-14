
import React, { useState, useMemo } from 'react';
import { CoinIcon } from './icons/CoinIcon';
import { ImportIcon } from './icons/ImportIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { ShopIcon } from './icons/ShopIcon';
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
  topMistakes: (Word & { mistakeCount: number })[];
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
    <div className="relative text-center flex flex-col items-center space-y-6 animate-fade-in">
      {/* Streak on Top Left */}
      <div className="absolute -top-2 -left-2 flex items-center gap-2">
         <div className={`flex items-center gap-1 px-3 py-1 rounded-full bg-orange-100 border border-orange-200 text-orange-600 font-bold ${streak > 0 ? 'streak-active' : ''}`}>
            <span>🔥</span>
            <span>{streak} Days</span>
         </div>
      </div>

      {/* Version on Top Right */}
      <div className="absolute -top-2 -right-2">
        <span className="text-[10px] text-gray-400 font-mono opacity-50 bg-gray-100/50 px-2 py-0.5 rounded-full">v0.7</span>
      </div>

      <div className="pt-4 flex flex-col items-center">
        <h1 className="text-5xl font-bold text-blue-600 font-chinese mb-1">拼音天天练</h1>
        <p className="text-sm uppercase tracking-widest text-gray-400 font-bold">Pinyin Daily Practice</p>
      </div>
      
      {/* Daily Progress */}
      <div className="w-full max-w-md bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
         <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-bold text-gray-500">Today's Goal</span>
            <span className="text-xs font-bold text-blue-500">{dailyPoints} / {dailyGoal} pts</span>
         </div>
         <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-1000" 
              style={{ width: `${goalPercent}%` }}
            ></div>
         </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <div className="bg-yellow-100 border-2 border-yellow-300 rounded-full pl-5 pr-4 py-2 flex items-center space-x-2 shadow-sm">
          <CoinIcon className="w-7 h-7 text-yellow-500" />
          <span className="text-xl font-black text-yellow-700">{screenTime}</span>
        </div>
        
        <div className="bg-white/80 rounded-full p-1 shadow-sm flex items-center border border-gray-100">
            <span className="text-[10px] font-black text-gray-400 px-2 uppercase tracking-tighter">Length</span>
            {[5, 10, 20].map(size => (
                <button
                    key={size}
                    onClick={() => onSetTestSize(size)}
                    className={`w-9 h-9 rounded-full text-sm font-black transition-all ${
                        testSize === size 
                        ? 'bg-blue-500 text-white shadow-md scale-110' 
                        : 'text-gray-400 hover:text-blue-500'
                    }`}
                >
                    {size}
                </button>
            ))}
        </div>

        <button
          onClick={onGoToShop}
          className="bg-gradient-to-tr from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white rounded-full p-3 shadow-lg transform hover:scale-110 transition-all"
        >
          <ShopIcon className="w-7 h-7"/>
        </button>
      </div>
      
      <button
        onClick={onStartTestRequest}
        className="w-full bg-gradient-to-b from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white font-black py-4 px-4 rounded-2xl text-xl shadow-xl transform active:scale-95 transition-all"
      >
        PLAY DAILY TEST! 🚀
      </button>

      {/* Lists Tab Section */}
      <div className="w-full bg-gray-50/50 p-4 rounded-3xl border border-gray-100">
        <div className="flex space-x-1 bg-gray-200/50 p-1 rounded-xl mb-4">
            {TABS.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-2 px-1 text-[11px] md:text-xs font-black rounded-lg transition-all ${
                        activeTab === tab.id
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>

        <div className="min-h-[160px]">
            {lessonsToDisplay.length > 0 ? (
                <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
                {lessonsToDisplay.map(lesson => (
                    <div key={lesson.id} className="flex justify-between items-center p-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-blue-200 transition-colors">
                    <div className="flex items-center gap-3 overflow-hidden">
                         {renderStatusIcon(lesson.id) || <div className="w-5 h-5 rounded-full border-2 border-dashed border-gray-200" />}
                         <span className="font-bold text-gray-700 truncate text-sm" title={lesson.name}>{lesson.name}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                        {activeTab === 'my' && (
                            <>
                                <button onClick={() => onEditLesson(lesson)} className="p-2 text-gray-400 hover:text-blue-500"><PencilIcon className="w-4 h-4" /></button>
                                <button onClick={() => onDeleteLesson(lesson.id)} className="p-2 text-gray-400 hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
                            </>
                        )}
                        <button 
                          onClick={() => setStudyLesson(lesson)}
                          className="bg-purple-50 text-purple-600 p-2 rounded-lg hover:bg-purple-600 hover:text-white transition-colors"
                          title="Study words"
                        >
                          <BookOpenIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => onStartSingleLessonTest(lesson.id)} className="ml-1 bg-blue-50 text-blue-600 p-2 rounded-lg hover:bg-blue-600 hover:text-white transition-colors">
                          <PlayIcon className="w-4 h-4" />
                        </button>
                    </div>
                    </div>
                ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <div className="text-4xl mb-2">📥</div>
                    <p className="text-xs font-bold uppercase tracking-widest">No lists here yet!</p>
                </div>
            )}

            {activeTab === 'my' && (
                <div className="flex justify-center gap-4 mt-4 pt-4 border-t border-gray-100">
                    <button onClick={onGoToImport} className="flex items-center gap-1.5 text-[11px] font-black text-purple-600 uppercase tracking-wider hover:bg-purple-50 px-3 py-2 rounded-lg transition-colors">
                        <ImportIcon className="w-4 h-4" /> Add List
                    </button>
                    <button handleExport={handleExport} className="flex items-center gap-1.5 text-[11px] font-black text-blue-600 uppercase tracking-wider hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors">
                        <DownloadIcon className="w-4 h-4" /> Backup
                    </button>
                </div>
            )}
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-rose-50/50 p-4 rounded-3xl border border-rose-100 text-left">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-black text-rose-700 uppercase tracking-wider">Mistakes</h3>
                {topMistakes.length > 0 && (
                  <button onClick={onStartTopMistakesTest} className="text-rose-500 hover:scale-110 transition-transform"><PlayIcon className="w-5 h-5" /></button>
                )}
            </div>
          {topMistakes.length > 0 ? (
            <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
              {topMistakes.map(word => (
                <div key={word.id} className="flex justify-between items-center p-2 bg-white rounded-xl text-xs border border-rose-100">
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">{word.character}</span>
                        <span className="font-mono text-gray-400">{word.pinyin}</span>
                    </div>
                    <span className="font-bold text-rose-500">{word.mistakeCount}❌</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-rose-400 font-bold text-center py-4">PERFECT SCORE SO FAR! 🌟</p>
          )}
        </div>

        <div className="bg-blue-50/50 p-4 rounded-3xl border border-blue-100 text-left">
          <h3 className="text-sm font-black text-blue-700 uppercase tracking-wider mb-3">Recent Scores</h3>
          {historicalScores.length > 0 ? (
            <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
              {historicalScores.map((s, i) => (
                <div key={i} className="flex justify-between items-center p-2 bg-white rounded-xl text-[10px] border border-blue-100">
                  <span className="font-bold text-gray-400">{s.date.split('/')[1]}/{s.date.split('/')[0]}</span>
                  <span className="flex-1 px-2 truncate font-bold text-gray-600">{s.lessonNames?.[0] || '...'}</span>
                  <span className="font-black text-blue-600">{s.score}/{s.total}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-blue-400 font-bold text-center py-4">NO TESTS YET. LET'S GO! 🎯</p>
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
