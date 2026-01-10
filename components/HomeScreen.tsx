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
import { TrophyIcon } from './icons/TrophyIcon';
import { MedalIcon } from './icons/MedalIcon';
import { LeafIcon } from './icons/LeafIcon';
import { FootprintIcon } from './icons/FootprintIcon';

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
}

const TABS = [
    { id: 'my', label: 'My Lessons' },
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
    onSetTestSize
}) => {
  const [activeTab, setActiveTab] = useState('my');

  const lessonsToDisplay = useMemo(() => {
    if (activeTab === 'my') {
      return lessons.filter(l => !l.isPredefined);
    }
    return lessons.filter(l => l.level === activeTab);
  }, [activeTab, lessons]);

  const renderStatusIcon = (lessonId: string) => {
      const status = lessonStatusMap[lessonId];
      switch(status) {
          case 'expert':
              return <TrophyIcon className="w-5 h-5 text-yellow-500" aria-label="Expert status" />;
          case 'competent':
              return <MedalIcon className="w-5 h-5 text-blue-400" aria-label="Competent status" />;
          case 'learning':
              return <LeafIcon className="w-5 h-5 text-green-500" aria-label="Learning status" />;
          case 'beginner':
              return <FootprintIcon className="w-5 h-5 text-gray-400" aria-label="Beginner status" />;
          default:
              return null; // Not started - no icon
      }
  };
  
  const handleExport = () => {
    const allLessons = wordService.getCustomLessons();
    if (allLessons.length === 0) {
      alert("There are no custom lessons to export.");
      return;
    }
    const jsonString = JSON.stringify(allLessons, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const date = new Date().toISOString().slice(0, 10);
    link.download = `pinyin-lessons-backup-${date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="relative text-center flex flex-col items-center justify-center h-full space-y-6">
      <span className="absolute top-0 right-0 text-xs text-gray-400 p-2">v0.6</span>
      <div>
        <h1 className="text-4xl md:text-5xl font-bold text-blue-600">拼音天天练</h1>
        <p className="text-lg text-gray-600">Pinyin Daily Practice</p>
      </div>
      
      <div className="flex flex-col md:flex-row items-center justify-center gap-4">
        <div className="bg-yellow-100 border-2 border-yellow-300 rounded-full pl-6 pr-4 py-3 flex items-center space-x-3 shadow-md">
          <CoinIcon className="w-8 h-8 text-yellow-500" />
          <span className="text-2xl font-bold text-yellow-700">{screenTime}</span>
          <span className="text-lg text-yellow-600">Points</span>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-full p-1.5 shadow-md flex items-center border border-gray-200">
                <span className="text-xs font-bold text-gray-400 px-2 uppercase tracking-wider">Words</span>
                {[5, 10, 20].map(size => (
                    <button
                        key={size}
                        onClick={() => onSetTestSize(size)}
                        className={`w-8 h-8 rounded-full text-sm font-bold transition-all duration-200 ${
                            testSize === size 
                            ? 'bg-blue-500 text-white shadow-sm scale-110' 
                            : 'text-gray-500 hover:text-blue-500 hover:bg-blue-50'
                        }`}
                    >
                        {size}
                    </button>
                ))}
            </div>

            <button
            onClick={onGoToShop}
            className="bg-pink-500 hover:bg-pink-600 text-white rounded-full p-4 shadow-lg transform hover:scale-110 transition-transform duration-200"
            aria-label="Open Shop"
            >
            <ShopIcon className="w-8 h-8"/>
            </button>
        </div>
      </div>
      
      <button
        onClick={onStartTestRequest}
        className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-full text-lg shadow-lg transform hover:scale-105 transition-transform duration-200"
      >
        Start Daily Test (Mix & Match)
      </button>

      {/* Lessons Section */}
      <div className="w-full bg-gray-50 p-4 rounded-lg shadow-inner">
        <div className="flex border-b border-gray-200">
            {TABS.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`-mb-px py-2 px-4 text-sm font-semibold transition-colors duration-200 ${
                        activeTab === tab.id
                        ? 'border-b-2 border-blue-500 text-blue-600'
                        : 'text-gray-500 hover:text-blue-500'
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>

        <div className="pt-4">
            {lessonsToDisplay.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {lessonsToDisplay.map(lesson => (
                    <div key={lesson.id} className="flex justify-between items-center p-2 bg-white rounded-lg border">
                    <div className="flex items-center gap-2 overflow-hidden">
                         <div className="flex-shrink-0 w-6 flex justify-center">
                            {renderStatusIcon(lesson.id)}
                         </div>
                         <span className="font-semibold text-gray-800 truncate" title={lesson.name}>{lesson.name}</span>
                         <span className="text-gray-400 text-sm">({lesson.words.length})</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 flex-shrink-0">
                        {activeTab === 'my' && (
                            <>
                                <button onClick={() => onEditLesson(lesson)} className="p-2 text-blue-500 hover:text-blue-700" aria-label={`Edit ${lesson.name}`}>
                                    <PencilIcon className="w-5 h-5" />
                                </button>
                                <button onClick={() => onDeleteLesson(lesson.id)} className="p-2 text-red-500 hover:text-red-700" aria-label={`Delete ${lesson.name}`}>
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </>
                        )}
                        <button onClick={() => onStartSingleLessonTest(lesson.id)} className="p-2 text-green-500 hover:text-green-700" aria-label={`Start test for ${lesson.name}`}>
                        <PlayIcon className="w-5 h-5" />
                        </button>
                    </div>
                    </div>
                ))}
                </div>
            ) : (
                <p className="text-gray-500 italic py-4">
                    {activeTab === 'my' ? "You have no custom lessons. Import one to get started!" : "No lessons available for this level yet."}
                </p>
            )}

            {activeTab === 'my' && (
                <div className="flex justify-center items-center gap-6 text-center mt-4 pt-3 border-t">
                    <button
                        onClick={onGoToImport}
                        className="flex items-center justify-center gap-2 text-sm text-purple-600 hover:text-purple-800 hover:underline"
                    >
                        <ImportIcon className="w-4 h-4" />
                        Import New Lesson
                    </button>
                    <button 
                        onClick={handleExport}
                        className="flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    >
                        <DownloadIcon className="w-4 h-4" />
                        Export My Lessons
                    </button>
                </div>
            )}
        </div>
      </div>


      <div className="w-full grid grid-cols-1 md:grid-cols-5 gap-6 pt-4">
        {/* Top Mistakes */}
        <div className="bg-red-50 p-4 rounded-lg shadow-inner md:col-span-2">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-bold text-red-700">Top Mistakes</h3>
                {topMistakes.length > 0 && (
                <button onClick={onStartTopMistakesTest} className="p-2 text-green-500 hover:text-green-700" aria-label="Start test for Top Mistakes">
                    <PlayIcon className="w-5 h-5" />
                </button>
                )}
            </div>
          {topMistakes.length > 0 ? (
            <ul className="space-y-1 text-left max-h-40 overflow-y-auto pr-2">
              {topMistakes.map(word => (
                <li key={word.id} className="flex justify-between items-center p-1 bg-white rounded gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-xl font-semibold">{word.character}</span>
                        <span className="font-mono text-gray-600 truncate">{word.pinyin}</span>
                    </div>
                    <span className="text-xs font-bold text-red-500 bg-red-100 rounded-full px-2 py-0.5 whitespace-nowrap">{word.mistakeCount} wrong</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">No mistakes recorded yet. Great job!</p>
          )}
        </div>

        {/* Recent Scores */}
        <div className="bg-blue-50 p-4 rounded-lg shadow-inner md:col-span-3">
          <h3 className="text-lg font-bold mb-2 text-blue-700">Recent Scores</h3>
          {historicalScores.length > 0 ? (
            <ul className="space-y-1 text-left max-h-40 overflow-y-auto pr-2">
              {historicalScores.map((s, i) => (
                <li key={i} className="flex justify-between items-center p-1 bg-white rounded gap-2">
                  <span className="text-sm text-gray-500">{s.date}</span>
                  <span className="text-sm text-gray-600 text-center flex-1 truncate" title={s.lessonNames?.join(', ')}>
                    {s.lessonNames?.join(', ') || '...'}
                  </span>
                  <span className="font-bold text-blue-600 whitespace-nowrap">{s.score} / {s.total}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">No tests taken yet. Let's start!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;