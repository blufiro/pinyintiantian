
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import HomeScreen from './components/HomeScreen';
import TestScreen from './components/TestScreen';
import ResultsScreen from './components/ResultsScreen';
import ImportScreen from './components/ImportScreen';
import TestLessonSelectionModal from './components/TestLessonSelectionModal';
import ShopScreen from './components/ShopScreen';
import { TestResult, HistoricalScore, Word, Lesson, Background, EvaluationState } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import { wordService } from './services/wordService';
import { backgrounds, defaultBackground } from './data/backgrounds';

type View = 'home' | 'test' | 'results' | 'import' | 'shop';

const DAILY_GOAL = 30;

const App: React.FC = () => {
  const [view, setView] = useState<View>('home');
  const [lastTestResults, setLastTestResults] = useState<TestResult[]>([]);
  const [score, setScore] = useState(0);
  const [screenTime, setScreenTime] = useLocalStorage<number>('screenTime', 0);
  const [historicalScores, setHistoricalScores] = useLocalStorage<HistoricalScore[]>('historicalScores', []);
  const [topMistakes, setTopMistakes] = useState<(Word & { mistakeCount: number })[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonStatusMap, setLessonStatusMap] = useState<Record<string, EvaluationState>>({});
  const [isLessonSelectionOpen, setLessonSelectionOpen] = useState(false);
  const [lessonToEdit, setLessonToEdit] = useState<Lesson | null>(null);
  
  const [testWords, setTestWords] = useState<Word[]>([]);
  const [lastTestConfig, setLastTestConfig] = useState<{type: 'lessons', ids: string[]} | {type: 'mistakes'} | {type: 'specific_words'} | null>(null);

  const [purchasedBackgroundIds, setPurchasedBackgroundIds] = useLocalStorage<string[]>('purchasedBackgrounds', [defaultBackground.id]);
  const [activeBackgroundId, setActiveBackgroundId] = useLocalStorage<string>('activeBackground', defaultBackground.id);
  const [allBackgrounds] = useState<Background[]>([defaultBackground, ...backgrounds]);

  const [testSize, setTestSize] = useLocalStorage<number>('testSize', 10);
  const [streak, setStreak] = useLocalStorage<number>('dailyStreak', 0);
  const [lastPracticeDate, setLastPracticeDate] = useLocalStorage<string>('lastPracticeDate', '');
          
  const activeBackground = allBackgrounds.find(bg => bg.id === activeBackgroundId) || defaultBackground;

  const pressedKeys = useRef<Set<string>>(new Set());

  const refreshData = useCallback(() => {
    const allLessons = wordService.getAllLessons();
    setLessons(allLessons);
    setTopMistakes(wordService.getTopMistakes(10)); 
    setLessonStatusMap(wordService.getAllLessonStates());
  }, []);
  
  useEffect(() => {
    wordService.initializeWords();
    refreshData();
    checkStreak();
  }, [refreshData]);

  // Cheat code effect
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      pressedKeys.current.add(e.key.toLowerCase());
      if (pressedKeys.current.has('q') && pressedKeys.current.has('p')) {
        setScreenTime(prev => prev + 50);
        pressedKeys.current.delete('q');
        pressedKeys.current.delete('p');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      pressedKeys.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setScreenTime]);

  const checkStreak = () => {
    const today = new Date().toLocaleDateString();
    if (lastPracticeDate === '') return;
    
    const last = new Date(lastPracticeDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - last.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 1) {
      setStreak(0); 
    }
  };

  const dailyPointsEarned = useMemo(() => {
    const today = new Date().toLocaleDateString();
    return historicalScores
      .filter(s => s.date === today)
      .reduce((sum, s) => sum + s.score, 0);
  }, [historicalScores]);

  const handleStartTestRequest = () => {
    setLessonSelectionOpen(true);
  };
  
  const handleTestStart = (ids: string[]) => {
    if (ids.length === 0) return;
    const words = wordService.getDailyTestWords(ids, testSize);
    if (words.length === 0) {
      alert("No words available in selected lessons.");
      return;
    }
    setTestWords(words);
    setLastTestConfig({ type: 'lessons', ids });
    setLessonSelectionOpen(false);
    setView('test');
  }

  const handleStartSingleLessonTest = (lessonId: string) => {
    handleTestStart([lessonId]);
  };

  const handleStartTopMistakesTest = () => {
    const mistakeWords = wordService.getMistakeWordsForTest(testSize);
    if (mistakeWords.length === 0) {
      alert("No mistakes to review! Excellent!");
      return;
    }
    setTestWords(mistakeWords);
    setLastTestConfig({ type: 'mistakes' });
    setView('test');
  };

  const finishTest = useCallback((results: TestResult[], finalScore: number) => {
    const correctAnswers = results.filter(r => r.correct).length;
    setLastTestResults(results);
    setScore(correctAnswers);
    wordService.saveTestResults(results);
    setScreenTime(prevTime => prevTime + correctAnswers);
    
    if (lastTestConfig?.type === 'lessons' && lastTestConfig.ids.length === 1) {
        wordService.saveLessonStats(lastTestConfig.ids[0], correctAnswers, results.length);
    }

    const today = new Date().toLocaleDateString();
    if (lastPracticeDate !== today) {
      setStreak(prev => prev + 1);
      setLastPracticeDate(today);
    }

    let lessonNames: string[] = [];
    if (lastTestConfig?.type === 'lessons') {
        lessonNames = lessons
            .filter(lesson => lastTestConfig.ids.includes(lesson.id))
            .map(lesson => lesson.name);
    } else if (lastTestConfig?.type === 'mistakes') {
        lessonNames = ["Mistakes Revision"];
    } else if (lastTestConfig?.type === 'specific_words') {
        lessonNames = ["Mistakes Retry"];
    }

    const newScore: HistoricalScore = {
        date: today,
        score: correctAnswers,
        total: results.length,
        lessonNames: lessonNames,
    };
    setHistoricalScores(prevScores => [newScore, ...prevScores].slice(0, 15)); 
    setView('results');
  }, [setScreenTime, setHistoricalScores, lessons, lastTestConfig, lastPracticeDate, setLastPracticeDate, setStreak]);

  const handleRetry = () => {
    if (!lastTestConfig) {
        goHome();
        return;
    }
    if (lastTestConfig.type === 'lessons') {
        handleTestStart(lastTestConfig.ids);
    } else if (lastTestConfig.type === 'mistakes') {
        handleStartTopMistakesTest();
    } else {
        setTestWords([...testWords]);
        setView('test');
    }
  };

  const handleRetryMistakes = () => {
    const incorrectWords = lastTestResults.filter(r => !r.correct).map(r => r.word);
    if (incorrectWords.length === 0) return;
    
    setTestWords([...incorrectWords].sort(() => Math.random() - 0.5));
    setLastTestConfig({ type: 'specific_words' });
    setView('test');
  };

  const goHome = () => {
    setLessonToEdit(null);
    setView('home');
    refreshData();
  };

  const goToImport = () => setView('import');
  const goToShop = () => setView('shop');

  const handlePurchaseBackground = (background: Background) => {
    if (screenTime >= background.cost && !purchasedBackgroundIds.includes(background.id)) {
        setScreenTime(prev => prev - background.cost);
        setPurchasedBackgroundIds(prev => [...prev, background.id]);
    }
  };

  const handleApplyBackground = (backgroundId: string) => {
      if (purchasedBackgroundIds.includes(backgroundId)) {
          setActiveBackgroundId(backgroundId);
      }
  };

  const renderContent = () => {
    const homeProps = {
      onStartTestRequest: handleStartTestRequest, 
      onGoToImport: goToImport, 
      screenTime, 
      historicalScores, 
      topMistakes,
      lessons,
      lessonStatusMap,
      onEditLesson: (l: Lesson) => { setLessonToEdit(l); setView('import'); },
      onDeleteLesson: (id: string) => { if(confirm("Delete?")) { wordService.deleteLesson(id); refreshData(); } },
      onGoToShop: goToShop,
      onStartSingleLessonTest: handleStartSingleLessonTest,
      onStartTopMistakesTest: handleStartTopMistakesTest,
      testSize,
      onSetTestSize: setTestSize,
      streak,
      dailyPoints: dailyPointsEarned,
      dailyGoal: DAILY_GOAL
    };

    switch(view) {
        case 'home': return <HomeScreen {...homeProps} />;
        case 'test': return <TestScreen onTestComplete={finishTest} onGoHome={goHome} words={testWords}/>;
        case 'results': return <ResultsScreen score={score} totalQuestions={lastTestResults.length} results={lastTestResults} onRetry={handleRetry} onRetryMistakes={handleRetryMistakes} onHome={goHome} />;
        case 'import': return <ImportScreen onGoHome={goHome} lessonToEdit={lessonToEdit} />;
        case 'shop': return <ShopScreen onGoHome={goHome} screenTime={screenTime} backgrounds={allBackgrounds} purchasedIds={purchasedBackgroundIds} activeId={activeBackgroundId} onPurchase={handlePurchaseBackground} onApply={handleApplyBackground} />;
        default: return <HomeScreen {...homeProps} />;
    }
  }

  return (
    <div className="h-[100dvh] w-full font-sans flex items-center justify-center p-0 sm:p-2 lg:p-6 transition-all duration-500 overflow-hidden" style={activeBackground.style}>
      <div className="w-full max-w-4xl h-full sm:h-auto sm:max-h-[98dvh] bg-white/90 backdrop-blur-md rounded-none sm:rounded-[2rem] shadow-2xl p-2 sm:p-4 md:p-6 text-gray-800 border border-white/50 flex flex-col overflow-hidden">
        {renderContent()}
        {isLessonSelectionOpen && (
            <TestLessonSelectionModal 
                lessons={lessons}
                onStart={handleTestStart}
                onClose={() => setLessonSelectionOpen(false)}
            />
        )}
      </div>
    </div>
  );
};

export default App;
