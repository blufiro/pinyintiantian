// FIX: Import React to make the React namespace available for type definitions like React.RefObject.
import React, { useEffect, useRef } from 'react';
import { wordService } from '../services/wordService';

interface UseDebugCheatsProps {
  setScreenTime: (val: (prev: number) => number) => void;
  highlightedLessonIdRef: React.RefObject<string | null>;
  onStatusChanged: () => void;
}

const useDebugCheats = ({ setScreenTime, highlightedLessonIdRef, onStatusChanged }: UseDebugCheatsProps) => {
  const pressedKeys = useRef<Set<string>>(new Set());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      pressedKeys.current.add(key);

      // Q + P = Points Cheat
      if (pressedKeys.current.has('q') && pressedKeys.current.has('p')) {
        setScreenTime(prev => prev + 50);
        console.debug('Cheat: Added 50 points');
        pressedKeys.current.delete('q');
        pressedKeys.current.delete('p');
      }

      // L + S = Lesson Status Cheat
      if (pressedKeys.current.has('l') && pressedKeys.current.has('s')) {
        const lessonId = highlightedLessonIdRef.current;
        if (lessonId) {
          wordService.debugIncrementLessonStatus(lessonId);
          onStatusChanged();
          console.debug(`Cheat: Incremented status for lesson ${lessonId}`);
        } else {
          console.debug('Cheat: No lesson highlighted to increment');
        }
        pressedKeys.current.delete('l');
        pressedKeys.current.delete('s');
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
  }, [setScreenTime, highlightedLessonIdRef, onStatusChanged]);
};

export default useDebugCheats;