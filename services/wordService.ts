import { Word, TestResult, Lesson, EvaluationState } from '../types';
import { p1Lessons } from '../data/p1Lessons';
import { p2Lessons } from '../data/p2Lessons';
import { p3Lessons } from '../data/p3Lessons';
import { p4Lessons } from '../data/p4Lessons';


const INITIAL_WORDS: Omit<Word, 'id'>[] = [
    { character: '你', pinyin: 'ni3' },
    { character: '好', pinyin: 'hao3' },
    { character: '我', pinyin: 'wo3' },
    { character: '是', pinyin: 'shi4' },
    { character: '不', pinyin: 'bu4' },
    { character: '人', pinyin: 'ren2' },
];

const LESSONS_KEY = 'lessons';
const MISTAKES_KEY = 'mistakes'; // Stored as Record<string, number> { wordId: count }
const SEEN_WORDS_KEY = 'seenWords';
const LAST_WORD_ID_KEY = 'lastWordId';
const LESSON_STATS_KEY = 'lessonStats';

interface LessonTestRecord {
    timestamp: number;
    score: number;
    total: number;
}

const PREDEFINED_LESSONS: Lesson[] = [...p1Lessons, ...p2Lessons, ...p3Lessons, ...p4Lessons];

const shuffleArray = <T,>(array: T[]): T[] => {
    return [...array].sort(() => Math.random() - 0.5);
};

const getFromStorage = <T,>(key: string, defaultValue: T): T => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
        console.error(`Error reading from localStorage key "${key}":`, e);
        return defaultValue;
    }
};

const saveToStorage = <T,>(key: string, value: T) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e)
        {
        console.error(`Error saving to localStorage key "${key}":`, e);
    }
};

const getAllWordsFromLessons = (lessons: Lesson[]): Word[] => {
    return lessons.flatMap(lesson => lesson.words);
};


export const wordService = {
    initializeWords: () => {
        const lessons = getFromStorage<Lesson[]>(LESSONS_KEY, []);
        if (lessons.length === 0) {
            let lastId = 0;
            const initialWordsWithIds = INITIAL_WORDS.map((word, index) => {
                lastId = index + 1;
                return { ...word, id: lastId.toString() };
            });
            const defaultLesson: Lesson = {
                id: "1",
                name: "Default Lesson",
                words: initialWordsWithIds
            };
            saveToStorage(LESSONS_KEY, [defaultLesson]);
            saveToStorage(LAST_WORD_ID_KEY, lastId);
        }
    },
    
    getCustomLessons: (): Lesson[] => {
        return getFromStorage<Lesson[]>(LESSONS_KEY, []);
    },

    getPredefinedLessons: (): Lesson[] => {
        return PREDEFINED_LESSONS;
    },

    getAllLessons: (): Lesson[] => {
        return [...wordService.getPredefinedLessons(), ...wordService.getCustomLessons()];
    },

    deleteLesson: (lessonId: string): void => {
        let lessons = getFromStorage<Lesson[]>(LESSONS_KEY, []);
        lessons = lessons.filter(lesson => lesson.id !== lessonId);
        saveToStorage(LESSONS_KEY, lessons);
    },

    getDailyTestWords: (lessonIds: string[], count: number = 5): Word[] => {
        const testSizeTarget = count;
        // Aim for around 40% revision words, but at least 1 if possible.
        const MISTAKE_COUNT = Math.max(1, Math.floor(testSizeTarget * 0.4));

        const allLessons = wordService.getAllLessons();
        const selectedLessons = allLessons.filter(lesson => lessonIds.includes(lesson.id));
        const wordPool = getAllWordsFromLessons(selectedLessons);

        if (wordPool.length === 0) return [];
        
        const actualTestSize = Math.min(testSizeTarget, wordPool.length);

        const mistakes = getFromStorage<Record<string, number>>(MISTAKES_KEY, {});
        
        // Get all words from the pool that are marked as mistakes
        const mistakeWords = wordPool.filter(word => mistakes[word.id] > 0);
        const shuffledMistakes = shuffleArray(mistakeWords);

        // Select some mistakes to revise, up to MISTAKE_COUNT
        const revisionMistakes = shuffledMistakes.slice(0, MISTAKE_COUNT);
        const revisionMistakeIds = new Set(revisionMistakes.map(w => w.id));

        // Get other words from the pool that are not in our revision list
        const otherWords = wordPool.filter(word => !revisionMistakeIds.has(word.id));
        const shuffledOtherWords = shuffleArray(otherWords);

        // Fill the rest of the test with other words
        const remainingCount = actualTestSize - revisionMistakes.length;
        const randomWords = shuffledOtherWords.slice(0, remainingCount);
        
        // Combine and shuffle for the final test list
        const testWords = [...revisionMistakes, ...randomWords];
        return shuffleArray(testWords);
    },
    
    saveTestResults: (results: TestResult[]) => {
        let mistakes = getFromStorage<Record<string, number>>(MISTAKES_KEY, {});
        let seenWordIds = getFromStorage<string[]>(SEEN_WORDS_KEY, []);
        
        results.forEach(result => {
            const wordId = result.word.id;
            
            if (!seenWordIds.includes(wordId)) {
                seenWordIds.push(wordId);
            }
            
            if (result.correct) {
                if (mistakes[wordId]) {
                    mistakes[wordId]--;
                    if (mistakes[wordId] <= 0) {
                        delete mistakes[wordId];
                    }
                }
            } else {
                mistakes[wordId] = (mistakes[wordId] || 0) + 1;
            }
        });
        
        const MISTAKES_LIMIT = 1000;
        let mistakeEntries = Object.entries(mistakes);
        if (mistakeEntries.length > MISTAKES_LIMIT) {
            // Sort by count, ascending. Lowest counts will be at the start.
            mistakeEntries.sort(([, countA], [, countB]) => countA - countB);
            const toRemoveCount = mistakeEntries.length - MISTAKES_LIMIT;
            const mistakesToRemove = mistakeEntries.slice(0, toRemoveCount);
            for (const [id] of mistakesToRemove) {
                delete mistakes[id];
            }
        }

        saveToStorage(MISTAKES_KEY, mistakes);
        saveToStorage(SEEN_WORDS_KEY, seenWordIds);
    },

    getTopMistakes: (count: number): (Word & { mistakeCount: number })[] => {
        const allWords = getAllWordsFromLessons(wordService.getAllLessons());
        const mistakes = getFromStorage<Record<string, number>>(MISTAKES_KEY, {});
        
        const sortedMistakeIds = Object.keys(mistakes)
            .sort((a, b) => mistakes[b] - mistakes[a]);
        
        const wordMap = new Map(allWords.map(w => [w.id, w]));

        return sortedMistakeIds
            .map(id => {
                const word = wordMap.get(id);
                if (!word) return null;
                return { ...word, mistakeCount: mistakes[id] };
            })
            .filter((w): w is Word & { mistakeCount: number } => w !== null)
            .slice(0, count);
    },

    getMistakeWordsForTest: (count: number = 5): Word[] => {
        const mistakes = getFromStorage<Record<string, number>>(MISTAKES_KEY, {});
        // Prioritize words with higher mistake counts
        const mistakeEntries = Object.entries(mistakes).sort(([, a], [, b]) => b - a);
        
        const topMistakeIds = mistakeEntries.map(([id]) => id);
        
        if (topMistakeIds.length === 0) return [];
        
        const allWords = getAllWordsFromLessons(wordService.getAllLessons());
        const wordMap = new Map(allWords.map(w => [w.id, w]));
        
        // Take top N mistakes first, then shuffle them for the test
        const topMistakeWords = topMistakeIds
            .slice(0, count)
            .map(id => wordMap.get(id))
            .filter((w): w is Word => w !== undefined);

        return shuffleArray(topMistakeWords);
    },

    saveLesson: (lessonName: string, wordsText: string, lessonIdToUpdate?: string): { success: boolean, message: string } => {
        if (!lessonName.trim()) {
            return { success: false, message: "Lesson name cannot be empty." };
        }
        
        const lines = wordsText.trim().split('\n');
        const newWords: Omit<Word, 'id'>[] = [];

        for (const line of lines) {
            if (!line.trim()) continue;
            const parts = line.split(/[,，]/);
            if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim()) {
                return { success: false, message: `Invalid format on line: "${line}". Please use "character,pinyin".` };
            }
            newWords.push({ character: parts[0].trim(), pinyin: parts[1].trim() });
        }

        if (newWords.length === 0) {
            return { success: false, message: "No valid words found to import." };
        }

        let lessons = getFromStorage<Lesson[]>(LESSONS_KEY, []);
        let lastId = getFromStorage<number>(LAST_WORD_ID_KEY, 0);

        if (lessonIdToUpdate) { // Updating existing lesson
            const lessonIndex = lessons.findIndex(l => l.id === lessonIdToUpdate);
            if (lessonIndex === -1) {
                return { success: false, message: "Lesson not found for updating." };
            }
            // Keep existing word IDs if possible, create new ones for new words
            const existingWords = lessons[lessonIndex].words;
            const wordsWithIds = newWords.map((word, index) => {
                const existing = existingWords.find(ew => ew.character === word.character && ew.pinyin === word.pinyin);
                if (existing) return existing;
                lastId++;
                return { ...word, id: lastId.toString() };
            });

            lessons[lessonIndex].name = lessonName.trim();
            lessons[lessonIndex].words = wordsWithIds;
            saveToStorage(LESSONS_KEY, lessons);
            saveToStorage(LAST_WORD_ID_KEY, lastId);
            return { success: true, message: `Successfully updated lesson "${lessonName}".` };
        } else { // Creating new lesson
            const wordsWithIds = newWords.map(word => {
                lastId++;
                return { ...word, id: lastId.toString() };
            });

            const newLesson: Lesson = {
                id: Date.now().toString(), // Simple unique ID
                name: lessonName.trim(),
                words: wordsWithIds,
            };

            lessons.push(newLesson);
            saveToStorage(LESSONS_KEY, lessons);
            saveToStorage(LAST_WORD_ID_KEY, lastId);
            return { success: true, message: `Successfully imported ${newWords.length} words into "${newLesson.name}".` };
        }
    },

    analyzeImportData: (importedLessons: unknown): { success: boolean, message: string, newLessons: Lesson[], duplicates: Lesson[] } => {
        if (!Array.isArray(importedLessons)) {
            return { success: false, message: "Import failed: File content is not a valid lesson array.", newLessons: [], duplicates: [] };
        }
    
        const currentLessons = getFromStorage<Lesson[]>(LESSONS_KEY, []);
        const newLessons: Lesson[] = [];
        const duplicates: Lesson[] = [];
    
        for (const importedLesson of importedLessons) {
            if (typeof importedLesson !== 'object' || importedLesson === null || !importedLesson.name || !Array.isArray(importedLesson.words)) {
                console.warn("Skipping invalid lesson object during import analysis:", importedLesson);
                continue;
            }
    
            const lessonWithMinimalValidation = {
                name: importedLesson.name,
                words: importedLesson.words.filter((w: any) => w.character && w.pinyin)
            } as Omit<Lesson, 'id'>;
    
            if (lessonWithMinimalValidation.words.length === 0) continue;
    
            if (currentLessons.some(l => l.name === lessonWithMinimalValidation.name)) {
                duplicates.push(lessonWithMinimalValidation as Lesson);
            } else {
                newLessons.push(lessonWithMinimalValidation as Lesson);
            }
        }
        
        if (newLessons.length === 0 && duplicates.length === 0) {
            return { success: false, message: "No new or overlapping lessons found. The file might be empty, invalid, or contain only existing data.", newLessons: [], duplicates: []};
        }
    
        return { success: true, message: "Analysis complete.", newLessons, duplicates };
    },
    
    saveImportedLessons: (options: { newLessonsToSave: Lesson[], lessonsToOverwrite: Lesson[] }): { success: boolean, message: string } => {
        const { newLessonsToSave, lessonsToOverwrite } = options;
        let lessons = getFromStorage<Lesson[]>(LESSONS_KEY, []);
        let lastWordId = getFromStorage<number>(LAST_WORD_ID_KEY, 0);
    
        let addedCount = 0;
        let overwrittenCount = 0;
    
        // Overwrite existing lessons
        for (const lessonToOverwrite of lessonsToOverwrite) {
            const index = lessons.findIndex(l => l.name === lessonToOverwrite.name);
            if (index !== -1) {
                const wordsWithIds = lessonToOverwrite.words.map((word: any) => {
                    lastWordId++;
                    return { id: lastWordId.toString(), character: word.character || '', pinyin: word.pinyin || '' };
                });
                lessons[index].words = wordsWithIds;
                overwrittenCount++;
            }
        }
    
        // Add new lessons
        for (const newLesson of newLessonsToSave) {
            if (!lessons.some(l => l.name === newLesson.name)) {
                const wordsWithIds = newLesson.words.map((word: any) => {
                    lastWordId++;
                    return { id: lastWordId.toString(), character: word.character || '', pinyin: word.pinyin || '' };
                });
                lessons.push({
                    id: (Date.now() + addedCount).toString(),
                    name: newLesson.name,
                    words: wordsWithIds
                });
                addedCount++;
            }
        }
    
        if (addedCount === 0 && overwrittenCount === 0) {
            return { success: false, message: "No new lessons were imported. They might be duplicates or invalid." };
        }
    
        saveToStorage(LESSONS_KEY, lessons);
        saveToStorage(LAST_WORD_ID_KEY, lastWordId);
    
        const messageParts = [];
        if(addedCount > 0) messageParts.push(`Successfully imported ${addedCount} new lesson(s).`);
        if(overwrittenCount > 0) messageParts.push(`Successfully overwrote ${overwrittenCount} lesson(s).`);
    
        return { success: true, message: messageParts.join(' ') };
    },

    // --- Statistics and Evaluation Status ---

    saveLessonStats: (lessonId: string, score: number, total: number) => {
        const stats = getFromStorage<Record<string, LessonTestRecord[]>>(LESSON_STATS_KEY, {});
        if (!stats[lessonId]) stats[lessonId] = [];
        
        // Add new record to the beginning
        stats[lessonId].unshift({
            timestamp: Date.now(),
            score,
            total
        });
        
        // Keep only recent history to save space, but enough for calculation (20 is safe)
        if (stats[lessonId].length > 20) {
            stats[lessonId] = stats[lessonId].slice(0, 20);
        }
        
        saveToStorage(LESSON_STATS_KEY, stats);
    },

    getLessonEvaluationState: (lessonId: string): EvaluationState => {
        const stats = getFromStorage<Record<string, LessonTestRecord[]>>(LESSON_STATS_KEY, {});
        const history = stats[lessonId] || [];
        
        if (history.length === 0) return 'not_started';
        
        // Helper to calculate average percentage over the last N tests
        const getAveragePercentage = (n: number) => {
            if (history.length < n) return -1; // Not enough data
            const recent = history.slice(0, n);
            const sumPercentage = recent.reduce((acc, curr) => {
                const percentage = curr.total === 0 ? 0 : (curr.score / curr.total) * 100;
                return acc + percentage;
            }, 0);
            return sumPercentage / n;
        };

        // 1) Expert: average of 95% correct over the last 5 tests
        const avg5 = getAveragePercentage(5);
        if (avg5 >= 95) return 'expert';

        // 2) Competent: average of 80% correct over the last 5 tests
        if (avg5 >= 80) return 'competent';

        // 3) Learning: average of 50% correct over the last 3 tests
        const avg3 = getAveragePercentage(3);
        if (avg3 >= 50) return 'learning';

        // 4) Beginner: user has played the test lesson at least once (implied if history > 0)
        return 'beginner';
    },

    getAllLessonStates: (): Record<string, EvaluationState> => {
        const lessons = wordService.getAllLessons();
        const stateMap: Record<string, EvaluationState> = {};
        lessons.forEach(lesson => {
            stateMap[lesson.id] = wordService.getLessonEvaluationState(lesson.id);
        });
        return stateMap;
    },

    debugIncrementLessonStatus: (lessonId: string) => {
        const stats = getFromStorage<Record<string, LessonTestRecord[]>>(LESSON_STATS_KEY, {});
        const currentState = wordService.getLessonEvaluationState(lessonId);
        let history: LessonTestRecord[] = stats[lessonId] || [];

        // Cycle through states: not_started -> beginner -> learning -> competent -> expert -> reset
        if (currentState === 'not_started') {
            // Move to beginner: 1 test
            history = [{ timestamp: Date.now(), score: 1, total: 10 }];
        } else if (currentState === 'beginner') {
            // Move to learning: 3 tests avg >= 50
            history = Array(3).fill(null).map(() => ({ timestamp: Date.now(), score: 5, total: 10 }));
        } else if (currentState === 'learning') {
            // Move to competent: 5 tests avg >= 80
            history = Array(5).fill(null).map(() => ({ timestamp: Date.now(), score: 8, total: 10 }));
        } else if (currentState === 'competent') {
            // Move to expert: 5 tests avg >= 95
            history = Array(5).fill(null).map(() => ({ timestamp: Date.now(), score: 10, total: 10 }));
        } else {
            // Expert or other: reset
            history = [];
        }

        stats[lessonId] = history;
        saveToStorage(LESSON_STATS_KEY, stats);
    }
};