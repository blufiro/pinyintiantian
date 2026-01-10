import React, { useState, useCallback, useEffect } from 'react';
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
  const [lastTestConfig, setLastTestConfig] = useState<{type: 'lessons', ids: string[]} | {type: 'mistakes'} | null>(null);

  const [purchasedBackgroundIds, setPurchasedBackgroundIds] = useLocalStorage<string[]>('purchasedBackgrounds', [defaultBackground.id]);
  const [activeBackgroundId, setActiveBackgroundId] = useLocalStorage<string>('activeBackground', defaultBackground.id);
  const [allBackgrounds] = useState<Background[]>([defaultBackground, ...backgrounds]);

  const [testSize, setTestSize] = useLocalStorage<number>('testSize', 5);
          
  const activeBackground = allBackgrounds.find(bg => bg.id === activeBackgroundId) || defaultBackground;


  const refreshData = useCallback(() => {
    const allLessons = wordService.getAllLessons();
    setLessons(allLessons);
    setTopMistakes(wordService.getTopMistakes(1000)); // Display up to 1000 mistakes on home
    setLessonStatusMap(wordService.getAllLessonStates());
  }, []);
  
  useEffect(() => {
    wordService.initializeWords();
    refreshData();
  }, [refreshData]);
  
  useEffect(() => {
    if (view === 'home') {
        refreshData();
    }
  }, [view, refreshData]);

  // Secret debug key press to add points
  useEffect(() => {
    const pressedKeys = new Set<string>();

    const handleKeyDown = (event: KeyboardEvent) => {
      pressedKeys.add(event.key.toLowerCase());
      if (pressedKeys.has('q') && pressedKeys.has('p')) {
        setScreenTime(prevTime => prevTime + 50);
        pressedKeys.clear(); // Prevents continuous adding
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      pressedKeys.delete(event.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setScreenTime]);

  const handleStartTestRequest = () => {
    setLessonSelectionOpen(true);
  };
  
  const handleTestStart = (ids: string[]) => {
    if (ids.length === 0) return;
    const words = wordService.getDailyTestWords(ids, testSize);
    if (words.length === 0) {
      alert("No words available for the test in the selected lessons.");
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
      alert("You have no mistakes to review. Great job!");
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
    
    // Save stats specifically if it was a single lesson test
    if (lastTestConfig?.type === 'lessons' && lastTestConfig.ids.length === 1) {
        wordService.saveLessonStats(lastTestConfig.ids[0], correctAnswers, results.length);
    }

    let lessonNames: string[] = [];
    if (lastTestConfig?.type === 'lessons') {
        lessonNames = lessons
            .filter(lesson => lastTestConfig.ids.includes(lesson.id))
            .map(lesson => lesson.name);
    } else if (lastTestConfig?.type === 'mistakes') {
        lessonNames = ["Mistakes Revision"];
    }


    const newScore: HistoricalScore = {
        date: new Date().toLocaleDateString(),
        score: correctAnswers,
        total: results.length,
        lessonNames: lessonNames,
    };
    setHistoricalScores(prevScores => [newScore, ...prevScores].slice(0, 10)); // Keep last 10 scores
    
    setView('results');
  }, [setScreenTime, setHistoricalScores, lessons, lastTestConfig]);

  const handleRetry = () => {
    if (!lastTestConfig) {
        goHome();
        return;
    }
    if (lastTestConfig.type === 'lessons') {
        handleTestStart(lastTestConfig.ids);
    } else {
        handleStartTopMistakesTest();
    }
  };

  const goHome = () => {
    setLessonToEdit(null);
    setView('home');
  };

  const goToImport = () => {
    setLessonToEdit(null);
    setView('import');
  };

  const goToShop = () => {
    setView('shop');
  };

  const handlePurchaseBackground = (background: Background) => {
    if (screenTime >= background.cost && !purchasedBackgroundIds.includes(background.id)) {
        setScreenTime(prev => prev - background.cost);
        setPurchasedBackgroundIds(prev => [...prev, background.id]);
    } else {
        console.error("Cannot purchase background. Not enough points or already owned.");
    }
  };

  const handleApplyBackground = (backgroundId: string) => {
      if (purchasedBackgroundIds.includes(backgroundId)) {
          setActiveBackgroundId(backgroundId);
      }
  };

  const handleEditLesson = (lesson: Lesson) => {
    setLessonToEdit(lesson);
    setView('import');
  };

  const handleDeleteLesson = (lessonId: string) => {
    if (window.confirm("Are you sure you want to delete this lesson? This cannot be undone.")) {
      wordService.deleteLesson(lessonId);
      refreshData();
    }
  };

  const renderContent = () => {
    switch(view) {
        case 'home':
            return <HomeScreen 
                        onStartTestRequest={handleStartTestRequest} 
                        onGoToImport={goToImport} 
                        screenTime={screenTime} 
                        historicalScores={historicalScores} 
                        topMistakes={topMistakes}
                        lessons={lessons}
                        lessonStatusMap={lessonStatusMap}
                        onEditLesson={handleEditLesson}
                        onDeleteLesson={handleDeleteLesson}
                        onGoToShop={goToShop}
                        onStartSingleLessonTest={handleStartSingleLessonTest}
                        onStartTopMistakesTest={handleStartTopMistakesTest}
                        testSize={testSize}
                        onSetTestSize={setTestSize}
                    />;
        case 'test':
            return <TestScreen onTestComplete={finishTest} onGoHome={goHome} words={testWords}/>;
        case 'results':
            return <ResultsScreen score={score} totalQuestions={lastTestResults.length} results={lastTestResults} onRetry={handleRetry} onHome={goHome} />;
        case 'import':
            return <ImportScreen onGoHome={goHome} lessonToEdit={lessonToEdit} />;
        case 'shop':
            return <ShopScreen
                        onGoHome={goHome}
                        screenTime={screenTime}
                        backgrounds={allBackgrounds}
                        purchasedIds={purchasedBackgroundIds}
                        activeId={activeBackgroundId}
                        onPurchase={handlePurchaseBackground}
                        onApply={handleApplyBackground}
                    />;
        default:
            return <HomeScreen 
                        onStartTestRequest={handleStartTestRequest} 
                        onGoToImport={goToImport} 
                        screenTime={screenTime} 
                        historicalScores={historicalScores} 
                        topMistakes={topMistakes}
                        lessons={lessons}
                        lessonStatusMap={lessonStatusMap}
                        onEditLesson={handleEditLesson}
                        onDeleteLesson={handleDeleteLesson}
                        onGoToShop={goToShop}
                        onStartSingleLessonTest={handleStartSingleLessonTest}
                        onStartTopMistakesTest={handleStartTopMistakesTest}
                        testSize={testSize}
                        onSetTestSize={setTestSize}
                    />;
    }
  }

  return (
    <div className="min-h-screen font-sans flex items-start xl:items-center justify-center p-2 xl:p-4 transition-all duration-500" style={activeBackground.style}>
      <div className="w-full max-w-2xl mx-auto bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-4 xl:p-8 text-gray-800">
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