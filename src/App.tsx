import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trash2, 
  Plus,
  HelpCircle,
  Replace,
  ChevronDown
} from 'lucide-react';

import {
  Scissors,
  Undo2,
  RefreshCw,
  Bookmark
} from './components/CustomIcons';

import { ALPHABET_CUBES } from './data';
import { LetterCube } from './components/LetterCube';
import { SpelledLetter, LetterCubeData, SavedWord } from './types';
import { AboutSection } from './components/AboutSection';

export default function App() {
  // Hamburger menu open states and activePage tabs matching Apple systems
  const [activeTab, setActiveTab] = useState<'app' | 'about'>('app');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAboutLoading, setIsAboutLoading] = useState(false);
  // Ref for scrolling to the enter button on landing page
  const enterButtonRef = useRef<HTMLDivElement>(null);

  const handleScrollToButton = (e: React.MouseEvent) => {
    e.stopPropagation();
    enterButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  // MULTI-LINE SPELLING BOARD STATE
  const [spelledRows, setSpelledRows] = useState<SpelledLetter[][]>([[]]);

  // Keep spelling rows neat & automatically append an empty row below when the last one gets spelled
  useEffect(() => {
    const cleaned = spelledRows.filter((row, idx) => {
      return row.length > 0 || idx === spelledRows.length - 1;
    });

    if (cleaned.length === 0) {
      setSpelledRows([[]]);
      setActiveRowIdx(0);
      return;
    }

    const lastRowIndex = cleaned.length - 1;
    const lastRow = cleaned[lastRowIndex];

    if (lastRow.length > 0) {
      const updated = [...cleaned.map(r => [...r]), []];
      setSpelledRows(updated);
    } else {
      const beforeStr = JSON.stringify(spelledRows);
      const afterStr = JSON.stringify(cleaned);
      if (beforeStr !== afterStr) {
        setSpelledRows(cleaned);
      }
    }
  }, [spelledRows]);

  // Which row index is currently focused / active for adding clicked letters (or landing drops in general)
  const [activeRowIdx, setActiveRowIdx] = useState<number>(0);

  // Shelf cubes state supporting custom ordering
  const [shelfCubes, setShelfCubes] = useState<LetterCubeData[]>(ALPHABET_CUBES);

  // Mode status for free shelf cube reordering (substituir)
  const [isReorderCubesActive, setIsReorderCubesActive] = useState(false);
  const [draggedShelfIndex, setDraggedShelfIndex] = useState<number | null>(null);

  // Color customization for spelled rows ('black' | 'blue' | 'red' | 'green')
  const [rowColors, setRowColors] = useState<Record<number, 'black' | 'blue' | 'red' | 'green'>>({});

  // Row modes state ('save' | 'scissors' | 'trash' | null)
  const [rowActiveModes, setRowActiveModes] = useState<Record<number, 'save' | 'scissors' | 'trash' | null>>({});

  // Actually cut/hidden wires for each row
  const [cutWiresRows, setCutWiresRows] = useState<Record<number, boolean>>({});

  // Keep active index in bounds
  useEffect(() => {
    if (activeRowIdx >= spelledRows.length) {
      setActiveRowIdx(Math.max(0, spelledRows.length - 1));
    }
  }, [spelledRows, activeRowIdx]);

  // Modern Dark Glass Removal Instructions Modal state
  const [isRemovePromptOpen, setIsRemovePromptOpen] = useState(false);

  // Word Saving system & prompt state
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [selectedWordsToSave, setSelectedWordsToSave] = useState<Record<number, boolean>>({});
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [isSavingInProgress, setIsSavingInProgress] = useState(false);
  const [isReviewingSaved, setIsReviewingSaved] = useState(false);
  const [deletedRowsHistory, setDeletedRowsHistory] = useState<{ row: SpelledLetter[]; index: number; color?: 'black' | 'blue' | 'red' | 'green' }[]>([]);
  
  // Loaded static saved word list in localStore
  const [savedWordsList, setSavedWordsList] = useState<SavedWord[]>(() => {
    try {
      const saved = localStorage.getItem('savedWords');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => {
          if (typeof item === 'string') {
            // Converts legacy string word into default spelled letter objects for continuity
            const letters: SpelledLetter[] = item.split('').map((char, index) => ({
              id: `legacy-${item}-${index}-${Math.random()}`,
              letter: char,
              originCubeId: `cube-${char.toLowerCase()}`,
              originalOrdinal: `${index + 1}°`
            }));
            return {
              word: item,
              letters
            };
          }
          return item; // already of shape SavedWord
        });
      }
      return [];
    } catch {
      return [];
    }
  });

  // Synchronize savedWordsList with spelledRows to ensure only actual board words can exist in saved list
  useEffect(() => {
    // Collect all valid words currently on the board
    const activeWordsOnBoard = spelledRows
      .map(row => row.map(l => l.letter).join("").trim())
      .filter(w => w.length > 0);

    setSavedWordsList(prev => {
      // Filter out any word that doesn't match a word currently on the board
      const filtered = prev.filter(item => activeWordsOnBoard.includes(item.word));
      if (filtered.length !== prev.length) {
        localStorage.setItem('savedWords', JSON.stringify(filtered));
        return filtered;
      }
      return prev;
    });
  }, [spelledRows]);

  const handleOpenSaveModal = (rIdx: number) => {
    const initialSelected: Record<number, boolean> = {};
    spelledRows.forEach((row, idx) => {
      if (row.length > 0) {
        // Pre-select the row the user double-clicked on
        initialSelected[idx] = (idx === rIdx);
      }
    });
    setSelectedWordsToSave(initialSelected);
    setSaveSuccessMessage(null);
    setIsSavingInProgress(false);
    setIsReviewingSaved(false);
    setIsSaveModalOpen(true);
  };

  // Mobile custom scrollbar state
  const [rowScrollMetrics, setRowScrollMetrics] = useState<Record<number, { scrollLeft: number; scrollWidth: number; clientWidth: number }>>({});
  const [rowOverflows, setRowOverflows] = useState<Record<number, boolean>>({});
  const [activeScrollingRow, setActiveScrollingRow] = useState<number | null>(null);
  const [isDraggingScrollbar, setIsDraggingScrollbar] = useState<number | null>(null);
  const activeScrollingTimeoutRef = useRef<Record<number, NodeJS.Timeout>>({});
  const previousLengthsRef = useRef<number[]>([]);

  // Splash/Landing screen state managers (blank screen first -> smooth fade-in logo -> rest of content)
  const [showLanding, setShowLanding] = useState<boolean>(true);
  const [landingPhase, setLandingPhase] = useState<'blank' | 'logo' | 'text'>('blank');

  useEffect(() => {
    if (showLanding) {
      document.body.style.overflow = 'hidden';
      
      const timer1 = setTimeout(() => {
        setLandingPhase('logo');
      }, 200);

      const timer2 = setTimeout(() => {
         setLandingPhase('text');
      }, 800);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [showLanding]);

  // COUNTRY FLAGS & CORE THEME COLOR SYSTEM
  const [activeFlag, setActiveFlag] = useState<'brazil' | 'germany' | 'italy' | 'usa'>('brazil');

  const themeColor = activeFlag === 'brazil'
    ? '#000000'
    : activeFlag === 'germany'
      ? '#FF0000'
      : activeFlag === 'italy'
        ? '#009246'
        : '#0000FF';

  const getRowColor = (rIdx: number): string => {
    const colorKey = rowColors[rIdx];
    if (colorKey === 'black') return '#000000';
    if (colorKey === 'blue') return '#0000FF';
    if (colorKey === 'red') return '#FF0000';
    if (colorKey === 'green') return '#009246';
    return themeColor;
  };

  // Lock starting color when first letter is spelling
  useEffect(() => {
    let changed = false;
    const newColors = { ...rowColors };
    spelledRows.forEach((row, idx) => {
      if (row.length > 0 && !newColors[idx]) {
        const colorName = themeColor === '#0000FF' ? 'blue' : themeColor === '#FF0000' ? 'red' : themeColor === '#009246' ? 'green' : 'black';
        newColors[idx] = colorName;
        changed = true;
      }
    });
    if (changed) {
      setRowColors(newColors);
    }
  }, [spelledRows]);

  const handleFlagClick = () => {
    setActiveFlag(prev => {
      if (prev === 'brazil') return 'germany';
      if (prev === 'germany') return 'italy';
      if (prev === 'italy') return 'usa';
      return 'brazil';
    });
  };

  const renderFlag = () => {
    switch (activeFlag) {
      case 'brazil':
        return (
          <svg width="24" height="17" viewBox="0 0 40 28" className="rounded-[3px] shadow-[0_1px_3px_rgba(0,0,0,0.15)] border border-gray-150 shrink-0">
            <rect width="40" height="28" fill="#009739" />
            <polygon points="20,3 36,14 20,25 4,14" fill="#FEDD00" />
            <circle cx="20" cy="14" r="5.5" fill="#012169" />
          </svg>
        );
      case 'germany':
        return (
          <svg width="24" height="17" viewBox="0 0 40 28" className="rounded-[3px] shadow-[0_1px_3px_rgba(0,0,0,0.15)] border border-gray-150 shrink-0">
            <rect width="40" height="9.33" fill="#000000" />
            <rect y="9.33" width="40" height="9.33" fill="#DD0000" />
            <rect y="18.66" width="40" height="9.34" fill="#FFCC00" />
          </svg>
        );
      case 'italy':
        return (
          <svg width="24" height="17" viewBox="0 0 40 28" className="rounded-[3px] shadow-[0_1px_3px_rgba(0,0,0,0.15)] border border-gray-150 shrink-0">
            <rect width="13.33" height="28" fill="#009246" />
            <rect x="13.33" width="13.34" height="28" fill="#FFFFFF" />
            <rect x="26.67" width="13.33" height="28" fill="#CE2B37" />
          </svg>
        );
      case 'usa':
        return (
          <svg width="24" height="17" viewBox="0 0 40 28" className="rounded-[3px] shadow-[0_1px_3px_rgba(0,0,0,0.15)] border border-gray-150 shrink-0">
            <rect width="40" height="28" fill="#FFFFFF" />
            <rect y="0" width="40" height="2.15" fill="#B22234" />
            <rect y="4.3" width="40" height="2.15" fill="#B22234" />
            <rect y="8.6" width="40" height="2.15" fill="#B22234" />
            <rect y="12.9" width="40" height="2.15" fill="#B22234" />
            <rect y="17.2" width="40" height="2.15" fill="#B22234" />
            <rect y="21.5" width="40" height="2.15" fill="#B22234" />
            <rect y="25.8" width="40" height="2.15" fill="#B22234" />
            <rect width="18" height="15" fill="#3C3B6E" />
            <circle cx="3.5" cy="3" r="0.65" fill="#FFFFFF" />
            <circle cx="7.5" cy="3" r="0.65" fill="#FFFFFF" />
            <circle cx="11.5" cy="3" r="0.65" fill="#FFFFFF" />
            <circle cx="15.5" cy="3" r="0.65" fill="#FFFFFF" />
            <circle cx="5.5" cy="6.5" r="0.65" fill="#FFFFFF" />
            <circle cx="9.5" cy="6.5" r="0.65" fill="#FFFFFF" />
            <circle cx="13.5" cy="6.5" r="0.65" fill="#FFFFFF" />
            <circle cx="3.5" cy="10" r="0.65" fill="#FFFFFF" />
            <circle cx="7.5" cy="10" r="0.65" fill="#FFFFFF" />
            <circle cx="11.5" cy="10" r="0.65" fill="#FFFFFF" />
            <circle cx="15.5" cy="10" r="0.65" fill="#FFFFFF" />
            <circle cx="5.5" cy="13" r="0.65" fill="#FFFFFF" />
            <circle cx="9.5" cy="13" r="0.65" fill="#FFFFFF" />
            <circle cx="13.5" cy="13" r="0.65" fill="#FFFFFF" />
          </svg>
        );
    }
  };

  const renderSpecificFlag = (flag: string) => {
    switch (flag) {
      case 'brazil':
        return (
          <svg width="100%" height="100%" viewBox="0 0 40 28" preserveAspectRatio="none">
            <rect width="40" height="28" fill="#009739" />
            <polygon points="20,3 36,14 20,25 4,14" fill="#FEDD00" />
            <circle cx="20" cy="14" r="5.5" fill="#012169" />
          </svg>
        );
      case 'germany':
        return (
          <svg width="100%" height="100%" viewBox="0 0 40 28" preserveAspectRatio="none">
            <rect width="40" height="9.33" fill="#000000" />
            <rect y="9.33" width="40" height="9.33" fill="#DD0000" />
            <rect y="18.66" width="40" height="9.34" fill="#FFCC00" />
          </svg>
        );
      case 'italy':
        return (
          <svg width="100%" height="100%" viewBox="0 0 40 28" preserveAspectRatio="none">
            <rect width="13.33" height="28" fill="#009246" />
            <rect x="13.33" width="13.34" height="28" fill="#FFFFFF" />
            <rect x="26.67" width="13.33" height="28" fill="#CE2B37" />
          </svg>
        );
      case 'usa':
        return (
          <svg width="100%" height="100%" viewBox="0 0 40 28" preserveAspectRatio="none">
            <rect width="40" height="28" fill="#FFFFFF" />
            <rect y="0" width="40" height="2.15" fill="#B22234" />
            <rect y="4.3" width="40" height="2.15" fill="#B22234" />
            <rect y="8.6" width="40" height="2.15" fill="#B22234" />
            <rect y="12.9" width="40" height="2.15" fill="#B22234" />
            <rect y="17.2" width="40" height="2.15" fill="#B22234" />
            <rect y="21.5" width="40" height="2.15" fill="#B22234" />
            <rect y="25.8" width="40" height="2.15" fill="#B22234" />
            <rect width="18" height="15" fill="#3C3B6E" />
          </svg>
        );
      default: return null;
    }
  };

  // DRAG AND DROP & CONNECTION LINE STATE
  const [draggedCube, setDraggedCube] = useState<LetterCubeData | null>(null);
  const [draggedLetter, setDraggedLetter] = useState<string | null>(null);
  const [dragHoverInfo, setDragHoverInfo] = useState<{ rIdx: number; type: 'insert' | 'replace'; index: number } | null>(null);
  const [pointerPos, setPointerPos] = useState({ x: 0, y: 0 }); // client viewport coords for floating preview
  const [dragStartPosCenter, setDragStartPosCenter] = useState({ x: 0, y: 0 }); // page-coords
  const [dragScribblePoints, setDragScribblePoints] = useState<{ x: number, y: number }[]>([]); // page-coords

  // TRAY REORDERING SYSTEM STATE (Multi-row support)
  const [draggedTrayIndex, setDraggedTrayIndex] = useState<{ rIdx: number; lIdx: number } | null>(null);
  const [draggedBoardLetter, setDraggedBoardLetter] = useState<SpelledLetter | null>(null);
  const [trayDragStart, setTrayDragStart] = useState<{ index: number; x: number; y: number; letterObj: SpelledLetter; rowIdx: number; time: number } | null>(null);

  // Double tap handler refs
  const lastClicksRef = useRef<Record<string, number>>({});
  const clickTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Velocity-tracking and predictive cursor refs to ensure zero lag / high-speed tracking
  const dragVelocityRef = useRef({ x: 0, y: 0 });
  const dragLastMouseRef = useRef({ x: 0, y: 0 });
  const dragLastTimeRef = useRef(0);

  // Dynamic layout positions of all elements on screen to draw perfect 3D wires
  const [elementPositions, setElementPositions] = useState<Record<string, { x: number; y: number; width?: number; height?: number }>>({});

  // HTML Element Refs
  const trayRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const shelfRef = useRef<HTMLDivElement>(null);

  const isPointerInsideTray = (x?: number, y?: number) => {
    if (!boardRef.current) return false;
    const px = x !== undefined ? x : pointerPos.x;
    const py = y !== undefined ? y : pointerPos.y;
    const rect = boardRef.current.getBoundingClientRect();
    return (
      px >= rect.left &&
      px <= rect.right &&
      py >= rect.top &&
      py <= rect.bottom
    );
  };

  // Measure all elements (source alphabets & spelling slots) to keep connection lines perfectly aligned!
  const updateElementPositions = useCallback(() => {
    const coords: Record<string, { x: number; y: number; width?: number; height?: number }> = {};
    
    // 1. Measure top grid cubes
    shelfCubes.forEach(cube => {
      const domId = `cube-${cube.id}`;
      const el = document.getElementById(domId);
      if (el) {
        const rect = el.getBoundingClientRect();
        coords[domId] = {
          x: rect.left + rect.width / 2 + window.scrollX,
          y: rect.top + rect.height / 2 + window.scrollY,
          width: rect.width,
          height: rect.height
        };
      }
    });

    // 2. Measure active slots inside all spelled rows
    spelledRows.forEach((row, rIdx) => {
      row.forEach((letter, lIdx) => {
        if (!letter || !letter.id) return;
        const domId = letter.id;
        const el = document.getElementById(domId);
        if (el) {
          const rect = el.getBoundingClientRect();
          coords[domId] = {
            x: rect.left + rect.width / 2 + window.scrollX,
            y: rect.top + rect.height / 2 + window.scrollY,
            width: rect.width,
            height: rect.height
          };
        }
      });
    });

    // 3. Measure row scroll containers to get horizontal boundaries for precise wire clipping
    const overflows: Record<number, boolean> = {};
    spelledRows.forEach((row, rIdx) => {
      const domId = `row-scroll-${rIdx}`;
      const el = document.getElementById(domId);
      if (el) {
        const rect = el.getBoundingClientRect();
        coords[`row-clip-${rIdx}`] = {
          x: rect.left + window.scrollX,
          y: rect.right + window.scrollX
        };
        // A container overflows if its scrollWidth exceeds its clientWidth by more than a 2px tolerance and it actually contains blocks
        overflows[rIdx] = row && row.length > 0 && el.scrollWidth > el.clientWidth + 2;
      }
    });
    setRowOverflows(overflows);

    if (trayRef.current) {
      const rect = trayRef.current.getBoundingClientRect();
      coords['tray-bounds'] = {
        x: rect.left + window.scrollX,
        y: rect.top + window.scrollY,
        width: rect.width,
        height: rect.height
      };
    }

    setElementPositions(coords);
  }, [shelfCubes, spelledRows]);

  // Synchronize positions on layout updates, state shifts, scrolls, resizes without layout thrashing infinite loop
  useEffect(() => {
    updateElementPositions();
    // Schedule small delays to capture delayed transitions/animations perfectly
    const timer1 = setTimeout(updateElementPositions, 50);
    const timer2 = setTimeout(updateElementPositions, 150);
    const timer3 = setTimeout(updateElementPositions, 300);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [updateElementPositions, draggedCube, draggedTrayIndex, draggedBoardLetter, activeRowIdx, draggedShelfIndex, isReorderCubesActive]);

  useEffect(() => {
    window.addEventListener('resize', updateElementPositions);
    window.addEventListener('scroll', updateElementPositions, true); // Use capture phase to catch internal row scorlls!

    return () => {
      window.removeEventListener('resize', updateElementPositions);
      window.removeEventListener('scroll', updateElementPositions, true);
    };
  }, [updateElementPositions]);

  // Siga fluidamente e instantaneamente o último bloco adicionado
  useEffect(() => {
    spelledRows.forEach((row, rIdx) => {
      const prevLength = previousLengthsRef.current[rIdx] || 0;
      if (row.length > prevLength) {
        // A block has been added to this row!
        const container = document.getElementById(`row-scroll-${rIdx}`);
        if (container) {
          // Instant scroll to follow the block immediately
          container.scrollLeft = container.scrollWidth;
          
          // Smooth fluid follow during animation
          let start: number | null = null;
          const duration = 250; // Follow during entrance scaling transitions
          const followScroll = (timestamp: number) => {
            if (!start) start = timestamp;
            const elapsed = timestamp - start;
            if (container) {
              container.scrollLeft = container.scrollWidth;
            }
            if (elapsed < duration) {
              requestAnimationFrame(followScroll);
            }
          };
          requestAnimationFrame(followScroll);
        }
      }
    });
    previousLengthsRef.current = spelledRows.map(r => r.length);
  }, [spelledRows]);

  // Continuous measurement loop during active dragging using requestAnimationFrame.
  // This guarantees that other letters sliding/shifting in rows update their wire ends instantly with zero lag!
  useEffect(() => {
    const isDragging = (draggedCube !== null && draggedLetter !== null) || 
                       (draggedTrayIndex !== null && draggedBoardLetter !== null) || 
                       (draggedShelfIndex !== null);
    
    if (!isDragging) return;

    let rAFId: number;
    const loop = () => {
      updateElementPositions();
      rAFId = requestAnimationFrame(loop);
    };
    
    rAFId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rAFId);
    };
  }, [draggedCube, draggedLetter, draggedTrayIndex, draggedBoardLetter, draggedShelfIndex, updateElementPositions]);

  // Lock document touch action when dragging to avoid page shifting on mobile
  useEffect(() => {
    const isDragging = (draggedCube !== null && draggedLetter !== null) || (draggedTrayIndex !== null && draggedBoardLetter !== null) || (draggedShelfIndex !== null);
    if (isDragging) {
      document.body.style.touchAction = 'none';
      document.documentElement.style.touchAction = 'none';
    } else {
      document.body.style.touchAction = '';
      document.documentElement.style.touchAction = '';
    }
    return () => {
      document.body.style.touchAction = '';
      document.documentElement.style.touchAction = '';
    };
  }, [draggedCube, draggedLetter, draggedTrayIndex, draggedBoardLetter, draggedShelfIndex]);

  // Auto-scroll spelling rows smoothly and fluidly when dragging a cube near their horizontal bounds
  useEffect(() => {
    if (!draggedCube && !draggedBoardLetter) return;
    if (!trayRef.current) return;

    let animId: number;
    const scrollStep = () => {
      const scrollers = Array.from(trayRef.current?.querySelectorAll('[id^="row-scroll-"]') || []);
      
      scrollers.forEach((el) => {
        const scrollerEl = el as HTMLElement;
        const rect = scrollerEl.getBoundingClientRect();
        const pointerX = pointerPos.x;
        const pointerY = pointerPos.y;

        // Check if pointer is vertically within/near this row box container (+/- 45px padding)
        const isVerticallyNear = pointerY >= rect.top - 45 && pointerY <= rect.bottom + 45;
        const isHorizontallyInside = pointerX >= rect.left && pointerX <= rect.right;

        if (isVerticallyNear && isHorizontallyInside) {
          const distFromRight = rect.right - pointerX;
          const distFromLeft = pointerX - rect.left;

          // Generous margins with super smooth progressive velocity
          const activeZone = 90; // 90px trigger zone near the edges of the visible scroller
          if (distFromRight < activeZone && distFromRight > 0) {
            const speed = Math.min(14, Math.max(1.2, (activeZone - distFromRight) / 3.5));
            scrollerEl.scrollLeft += speed;
          } else if (distFromLeft < activeZone && distFromLeft > 0) {
            const speed = Math.min(14, Math.max(1.2, (activeZone - distFromLeft) / 3.5));
            scrollerEl.scrollLeft -= speed;
          }
        }
      });

      animId = requestAnimationFrame(scrollStep);
    };

    animId = requestAnimationFrame(scrollStep);
    return () => cancelAnimationFrame(animId);
  }, [draggedCube, draggedBoardLetter, pointerPos]);

  // Auto-scrolling is handled seamlessly during the active drag operation instead of jumping to the end on drops.

  // Pointer move handler to track active drags / lines / reorders
  useEffect(() => {
    const calculatePreciseDropInRow = (
      clientX: number,
      rowEl: Element,
      excludeRowIdx?: number,
      excludeSlotIdx?: number
    ): { type: 'insert' | 'replace'; index: number } => {
      const slotElements = Array.from(rowEl.querySelectorAll('[data-slot-idx]'));
      if (slotElements.length === 0) {
        return { type: 'insert', index: 0 };
      }

      // Order all slots present in DOM by their original slot index
      const orderedSlots = slotElements
        .map(el => ({
          el,
          slotIdx: parseInt(el.getAttribute('data-slot-idx') || '0', 10),
          rowIdx: parseInt(el.getAttribute('data-row-idx') || '0', 10),
          rect: el.getBoundingClientRect()
        }))
        .sort((a, b) => a.slotIdx - b.slotIdx);

      // Check replace first (exclude the currently dragged item to avoid self-replacement loop)
      const replaceCandidates = orderedSlots.filter(s => 
        !(excludeRowIdx !== undefined && excludeSlotIdx !== undefined && s.rowIdx === excludeRowIdx && s.slotIdx === excludeSlotIdx)
      );

      let replaceTarget = null;
      for (const cand of replaceCandidates) {
        const centerX = cand.rect.left + cand.rect.width / 2;
        const threshold = cand.rect.width * 0.35; // 35% around center triggers replace
        if (Math.abs(clientX - centerX) <= threshold) {
          replaceTarget = cand;
          break;
        }
      }

      if (replaceTarget) {
        return { type: 'replace', index: replaceTarget.slotIdx };
      }

      // If not replacing, calculate gap coordinates relative to actual slot boundaries
      const gapXCoords: number[] = [];
      if (orderedSlots.length > 0) {
        // Gap 0: Before the very first element
        gapXCoords.push(orderedSlots[0].rect.left);
        
        // Gaps between consecutive elements
        for (let i = 1; i < orderedSlots.length; i++) {
          const prevRight = orderedSlots[i-1].rect.right;
          const nextLeft = orderedSlots[i].rect.left;
          gapXCoords.push((prevRight + nextLeft) / 2);
        }
        
        // Gap N: After the very last element
        gapXCoords.push(orderedSlots[orderedSlots.length - 1].rect.right);
      }

      let bestGapIdx = 0;
      let minGapDistance = Infinity;
      for (let i = 0; i < gapXCoords.length; i++) {
        const dist = Math.abs(clientX - gapXCoords[i]);
        if (dist < minGapDistance) {
          minGapDistance = dist;
          bestGapIdx = i;
        }
      }

      // Map back to index in the array of items
      if (bestGapIdx === orderedSlots.length) {
        return { type: 'insert', index: orderedSlots.length }; // at the end of the row
      } else {
        return { type: 'insert', index: orderedSlots[bestGapIdx].slotIdx };
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      // Predictive LERP and velocity calculations to completely eliminate input/state tracking latency
      const now = performance.now();
      const dt = now - dragLastTimeRef.current;
      
      let vx = 0;
      let vy = 0;
      if (dt > 1 && dragLastTimeRef.current > 0) {
        vx = (e.clientX - dragLastMouseRef.current.x) / dt;
        vy = (e.clientY - dragLastMouseRef.current.y) / dt;
      }
      
      // Store current velocity with sub-pixel low-pass filter to neutralize noise/hand-jitter
      dragVelocityRef.current = {
        x: dragVelocityRef.current.x * 0.7 + vx * 0.3,
        y: dragVelocityRef.current.y * 0.7 + vy * 0.3,
      };
      
      dragLastMouseRef.current = { x: e.clientX, y: e.clientY };
      dragLastTimeRef.current = now;

      // Predict cursor coordinates slightly ahead (approx 16ms) to neutralize display queues and render latency
      const leadTime = 16;
      const predictedX = e.clientX + dragVelocityRef.current.x * leadTime;
      const predictedY = e.clientY + dragVelocityRef.current.y * leadTime;

      setPointerPos({ x: predictedX, y: predictedY });

      // Free scroll up/down while dragging replacing cubes
      const isDragging = (draggedCube !== null && draggedLetter !== null) || (draggedTrayIndex !== null && draggedBoardLetter !== null) || (draggedShelfIndex !== null);
      if (isDragging) {
        const threshold = 180;
        let speed = 0;
        if (e.clientY < threshold) {
          speed = -Math.max(1, (threshold - e.clientY) / 3);
        } else if (e.clientY > window.innerHeight - threshold) {
          speed = Math.max(1, (e.clientY - (window.innerHeight - threshold)) / 3);
        }

        if (speed !== 0) {
          // If we're dragging a shelf cube for reordering, restrict scroll trigger horizontal area to the container 
          if (draggedShelfIndex !== null && shelfRef.current) {
            const rect = shelfRef.current.getBoundingClientRect();
            // Delimit scroll trigger ONLY to the horizontal bounds of the un-moved cubes grid
            if (e.clientX >= rect.left - 20 && e.clientX <= rect.right + 20) {
              window.scrollBy({ top: speed });
            }
          } else {
            // General drag scrolling
            window.scrollBy({ top: speed });
          }
        }
      }

      if (draggedShelfIndex !== null) {
        // Just let it track pointerPos. Swap of elements in shelfCubes happens on pointerUp!
      } else if (draggedCube && draggedLetter) {
        // Dragging from alphabet grid
        setDragScribblePoints(prev => {
          if (prev.length === 0) return [{ x: e.clientX, y: e.clientY }];
          const last = prev[prev.length - 1];
          const dist = Math.hypot(e.clientX - last.x, e.clientY - last.y);
          if (dist > 3) {
            return [...prev, { x: e.clientX, y: e.clientY }];
          }
          return prev;
        });
      } else if (trayDragStart !== null && draggedTrayIndex === null) {
        // Anti-jitter drag launch
        const dist = Math.hypot(e.clientX - trayDragStart.x, e.clientY - trayDragStart.y);
        if (dist > 8) {
          const deltaX = Math.abs(e.clientX - trayDragStart.x);
          const deltaY = Math.abs(e.clientY - trayDragStart.y);
          
          // On mobile / touch, if deltaX is larger than deltaY, they are scrolling horizontally, let's not launch drag!
          const isMobileDevice = window.matchMedia('(max-width: 1024px)').matches || 
                                 ('ontouchstart' in window) || 
                                 (navigator && navigator.maxTouchPoints > 0);
          if (isMobileDevice && deltaX > deltaY * 1.2) {
            // Let touch scroll happen naturally, do not drag
            return;
          }

          // Launch the drag!
          dragLastTimeRef.current = performance.now();
          dragLastMouseRef.current = { x: e.clientX, y: e.clientY };
          dragVelocityRef.current = { x: 0, y: 0 };
          setDraggedTrayIndex({ rIdx: trayDragStart.rowIdx, lIdx: trayDragStart.index });
          setDraggedBoardLetter(trayDragStart.letterObj);
          // Keep it in spelledRows to show clean empty dashed slot at the original position while dragging,
          // preventing jerky resizing or layout shifting in the scrolling row!
        }
      }

      // Real-time hover tracking for millimeters-level precision
      if ((draggedCube && draggedLetter) || (draggedTrayIndex && draggedBoardLetter)) {
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const rowEl = el?.closest('[data-row-container-idx]');
        if (rowEl && isPointerInsideTray(e.clientX, e.clientY)) {
          const targetRowIdx = parseInt(rowEl.getAttribute('data-row-container-idx') || '', 10);
          if (!isNaN(targetRowIdx)) {
            const dropResult = calculatePreciseDropInRow(
              e.clientX,
              rowEl,
              draggedTrayIndex?.rIdx,
              draggedTrayIndex?.lIdx
            );
            setDragHoverInfo({
              rIdx: targetRowIdx,
              type: dropResult.type,
              index: dropResult.index
            });

            // Smooth horizontal auto-scrolling matching edge coordinates
            const scrollContainer = document.getElementById(`row-scroll-${targetRowIdx}`);
            if (scrollContainer) {
              const rect = scrollContainer.getBoundingClientRect();
              const leftThreshold = rect.left + 75; // 75px zone from left
              const rightThreshold = rect.right - 75; // 75px zone from right
              
              if (e.clientX < leftThreshold) {
                const intensity = Math.max(1, (leftThreshold - e.clientX) / 3.5);
                scrollContainer.scrollLeft -= intensity;
              } else if (e.clientX > rightThreshold) {
                const intensity = Math.max(1, (e.clientX - rightThreshold) / 3.5);
                scrollContainer.scrollLeft += intensity;
              }
            }
          } else {
            setDragHoverInfo(null);
          }
        } else {
          setDragHoverInfo(null);
        }
      } else {
        setDragHoverInfo(null);
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      // 1. DRAG FROM ALPHABET GRID
      if (draggedCube && draggedLetter) {
        if (boardRef.current) {
          let inserted = false;
          
          if (isPointerInsideTray(e.clientX, e.clientY)) {
            // Find the closest row
            const el = document.elementFromPoint(e.clientX, e.clientY);
            const rowEl = el?.closest('[data-row-container-idx]');
            
            if (rowEl) {
              const targetRowIdx = parseInt(rowEl.getAttribute('data-row-container-idx') || '', 10);
              if (!isNaN(targetRowIdx)) {
                // Precision calculation
                const dropResult = calculatePreciseDropInRow(e.clientX, rowEl);
                if (dropResult.type === 'replace') {
                  handleReplaceLetter(draggedLetter, targetRowIdx, dropResult.index);
                  inserted = true;
                } else {
                  handleSelectLetter(draggedLetter, targetRowIdx, dropResult.index);
                  inserted = true;
                }
              }
            } else {
              // Alternate lookup: if they drop anywhere in the board tray but not on a specific row element directly,
              // let's use the activeRowIdx as a fallback and insert at the end.
              handleSelectLetter(draggedLetter, activeRowIdx);
              inserted = true;
            }
          }
        }
        setDraggedCube(null);
        setDraggedLetter(null);
        setDragScribblePoints([]);
      }

      // 2. DRAG EXISTING BOARD CUBE
      if (draggedTrayIndex !== null && draggedBoardLetter !== null) {
        if (boardRef.current) {
          let dropSuccessful = false;

          if (isPointerInsideTray(e.clientX, e.clientY)) {
            const el = document.elementFromPoint(e.clientX, e.clientY);
            const rowEl = el?.closest('[data-row-container-idx]');
            if (rowEl) {
              const targetRowIdx = parseInt(rowEl.getAttribute('data-row-container-idx') || '', 10);
              if (!isNaN(targetRowIdx)) {
                // Calculate precise insertion/replacement index, excluding itself from measurement
                const dropResult = calculatePreciseDropInRow(
                  e.clientX, 
                  rowEl, 
                  draggedTrayIndex.rIdx, 
                  draggedTrayIndex.lIdx
                );
                
                if (dropResult.type === 'replace') {
                  // REPLACE LOGIC
                  setSpelledRows(prev => {
                    const copy = prev.map(r => [...r]);
                    const sourceRow = copy[draggedTrayIndex.rIdx];
                    const targetRow = copy[targetRowIdx];

                    const itemToMove = sourceRow[draggedTrayIndex.lIdx];
                    if (itemToMove) {
                      // Remove from source row first
                      sourceRow.splice(draggedTrayIndex.lIdx, 1);
                      
                      // Handle offset adjustment if replacing on the same row!
                      let finalReplaceIdx = dropResult.index;
                      if (draggedTrayIndex.rIdx === targetRowIdx) {
                        if (draggedTrayIndex.lIdx < dropResult.index) {
                          finalReplaceIdx = Math.max(0, dropResult.index - 1);
                        }
                      }

                      // Create a new item to trigger React key replacement animation cleanly and fluidly
                      const cellId = `letter-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
                      const replacedItem: SpelledLetter = {
                        ...itemToMove,
                        id: cellId, // generate new id to trigger replacement animation!
                        color: targetRow.length > 0 && targetRow[0].color ? targetRow[0].color : themeColor
                      };
                      
                      targetRow[finalReplaceIdx] = replacedItem;
                    }
                    return copy;
                  });
                  setActiveRowIdx(targetRowIdx);
                  dropSuccessful = true;
                } else {
                  // INSERT LOGIC
                  setSpelledRows(prev => {
                    const copy = prev.map(r => [...r]);
                    const sourceRow = copy[draggedTrayIndex.rIdx];
                    const targetRow = copy[targetRowIdx];

                    const itemToMove = sourceRow[draggedTrayIndex.lIdx];
                    if (itemToMove) {
                      // Remove from source row first
                      sourceRow.splice(draggedTrayIndex.lIdx, 1);
                      
                      let finalInsertIdx = dropResult.index;
                      
                      // Handle offset adjustment if inserting in the same row
                      if (draggedTrayIndex.rIdx === targetRowIdx) {
                        if (draggedTrayIndex.lIdx < dropResult.index) {
                          finalInsertIdx = Math.max(0, dropResult.index - 1);
                        }
                      }

                      // Ensure insert index falls in valid range
                      if (finalInsertIdx > targetRow.length) {
                        finalInsertIdx = targetRow.length;
                      }

                      const targetColor = targetRow.length > 0 && targetRow[0].color ? targetRow[0].color : themeColor;
                      targetRow.splice(finalInsertIdx, 0, { ...itemToMove, color: targetColor });
                    }
                    return copy;
                  });
                  
                  setActiveRowIdx(targetRowIdx);
                  dropSuccessful = true;
                }
              }
            }
          } else {
            // ALWAYS delete the letter if dragged outside of the spelling board area on desktop
            const isMobileOrTouch = e.pointerType === 'touch' || 
                                    e.pointerType === 'pen' ||
                                    window.matchMedia('(max-width: 1024px)').matches || 
                                    ('ontouchstart' in window) ||
                                    (navigator && navigator.maxTouchPoints > 0);
            if (!isMobileOrTouch) {
              setSpelledRows(prev => {
                const copy = prev.map(r => [...r]);
                const sourceRow = copy[draggedTrayIndex.rIdx];
                if (sourceRow) {
                  sourceRow.splice(draggedTrayIndex.lIdx, 1);
                }
                return copy;
              });
            }
            dropSuccessful = true;
          }
        }
        setDraggedTrayIndex(null);
        setDraggedBoardLetter(null);
      }

      // 3. FREE SHELF REORDER DROP (SWAP/REPLACE POSITION ON DROP)
      if (draggedShelfIndex !== null) {
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const shelfEl = el?.closest('[data-shelf-idx]');
        if (shelfEl) {
          const targetIdx = parseInt(shelfEl.getAttribute('data-shelf-idx') || '', 10);
          if (!isNaN(targetIdx) && targetIdx !== draggedShelfIndex) {
            setShelfCubes(prev => {
              const copy = [...prev];
              const temp = copy[draggedShelfIndex];
              copy[draggedShelfIndex] = copy[targetIdx];
              copy[targetIdx] = temp;
              return copy;
            });
          }
        }
        setDraggedShelfIndex(null);
      }

      if (trayDragStart !== null && draggedTrayIndex === null) {
        const dist = Math.hypot(e.clientX - trayDragStart.x, e.clientY - trayDragStart.y);
        const timeElapsed = Date.now() - trayDragStart.time;
        // Only trigger color cycle if it was a quick click, not a long press
        if (dist < 10 && timeElapsed < 300) {
          const letterId = trayDragStart.letterObj.id;
          const now = Date.now();
          const lastTime = lastClicksRef.current[letterId] || 0;

          if (now - lastTime < 450) {
            // Double click: remove letter, no color cycle
            if (clickTimeoutsRef.current[letterId]) {
              clearTimeout(clickTimeoutsRef.current[letterId]);
              delete clickTimeoutsRef.current[letterId];
            }
            
            // Remove the letter
            setSpelledRows(prev => {
              const copy = prev.map(r => [...r]);
              if (copy[trayDragStart.rowIdx]) {
                 copy[trayDragStart.rowIdx].splice(trayDragStart.index, 1);
              }
              return copy;
            });
            delete lastClicksRef.current[letterId];
          } else {
            // Single click: wait to see if it becomes a double click before cycling color
            lastClicksRef.current[letterId] = now;
            clickTimeoutsRef.current[letterId] = setTimeout(() => {
              cycleRowColor(trayDragStart.rowIdx);
              delete clickTimeoutsRef.current[letterId];
              delete lastClicksRef.current[letterId];
            }, 300);
          }
        }
      }

      setTrayDragStart(null);
      setDragHoverInfo(null);
    };

    const handlePointerCancel = (e: PointerEvent) => {
      setDraggedCube(null);
      setDraggedLetter(null);
      setDraggedTrayIndex(null);
      setDraggedBoardLetter(null);
      setDraggedShelfIndex(null);
      setTrayDragStart(null);
      setDragHoverInfo(null);
      setDragScribblePoints([]);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerCancel);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerCancel);
    };
  }, [draggedCube, draggedLetter, dragScribblePoints, draggedTrayIndex, draggedBoardLetter, trayDragStart, activeRowIdx, spelledRows, draggedShelfIndex, shelfCubes, themeColor]);

  // Insert a letter onto a specific row and optional slot index
  const handleSelectLetter = (letter: string, targetRowIdx: number = activeRowIdx, insertIdx?: number) => {
    if (!spelledRows[targetRowIdx]) {
      targetRowIdx = 0;
    }

    if (spelledRows[targetRowIdx].length >= 36) { 
      return;
    }

    const cellId = `letter-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const matchCompCube = shelfCubes.find(c => c.primaryLetter === letter || c.secondaryLetter === letter);
    const fallbackId = matchCompCube ? `cube-${matchCompCube.id}` : `cube-cube-${letter.toLowerCase()}`;
    const matchedCubeId = draggedCube ? `cube-${draggedCube.id}` : fallbackId;

    let originalOrdinal = "1°";
    const cubeToUse = draggedCube || shelfCubes.find(c => c.primaryLetter === letter || c.secondaryLetter === letter);
    if (cubeToUse) {
      if (cubeToUse.secondaryLetter === letter) {
        originalOrdinal = cubeToUse.secondaryOrdinal || cubeToUse.primaryOrdinal;
      } else {
        originalOrdinal = cubeToUse.primaryOrdinal;
      }
    }

    const newLetter: SpelledLetter = {
      id: cellId,
      letter,
      originCubeId: matchedCubeId,
      originalOrdinal,
      color: (spelledRows[targetRowIdx] && spelledRows[targetRowIdx].length > 0 && spelledRows[targetRowIdx][0].color) ? spelledRows[targetRowIdx][0].color : themeColor
    };

    setSpelledRows(prev => {
      const copy = prev.map(r => [...r]);
      if (typeof insertIdx === 'number') {
        copy[targetRowIdx].splice(insertIdx, 0, newLetter);
      } else {
        copy[targetRowIdx].push(newLetter);
      }
      return copy;
    });
    
    setActiveRowIdx(targetRowIdx);
  };

  // Replace a letter on a specific row at a target slot index
  const handleReplaceLetter = (letter: string, targetRowIdx: number, targetSlotIdx: number) => {
    if (!spelledRows[targetRowIdx]) return;

    const cellId = `letter-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const matchCompCube = shelfCubes.find(c => c.primaryLetter === letter || c.secondaryLetter === letter);
    const fallbackId = matchCompCube ? `cube-${matchCompCube.id}` : `cube-cube-${letter.toLowerCase()}`;
    const matchedCubeId = draggedCube ? `cube-${draggedCube.id}` : fallbackId;

    let originalOrdinal = "1°";
    const cubeToUse = draggedCube || shelfCubes.find(c => c.primaryLetter === letter || c.secondaryLetter === letter);
    if (cubeToUse) {
      if (cubeToUse.secondaryLetter === letter) {
        originalOrdinal = cubeToUse.secondaryOrdinal || cubeToUse.primaryOrdinal;
      } else {
        originalOrdinal = cubeToUse.primaryOrdinal;
      }
    }

    const newLetter: SpelledLetter = {
      id: cellId,
      letter,
      originCubeId: matchedCubeId,
      originalOrdinal,
      color: (spelledRows[targetRowIdx] && spelledRows[targetRowIdx].length > 0 && spelledRows[targetRowIdx][0].color) ? spelledRows[targetRowIdx][0].color : themeColor
    };

    setSpelledRows(prev => {
      const copy = prev.map(r => [...r]);
      if (copy[targetRowIdx] && copy[targetRowIdx][targetSlotIdx] !== undefined) {
        copy[targetRowIdx][targetSlotIdx] = newLetter;
      }
      return copy;
    });

    setActiveRowIdx(targetRowIdx);
  };

  // Remove a letter at index on a specific row
  const handleRemoveLetter = (rIdx: number, lIdx: number) => {
    setSpelledRows(prev => {
      const copy = prev.map(r => [...r]);
      copy[rIdx].splice(lIdx, 1);
      return copy;
    });
  };

  const handleAddNewRow = () => {
    setSpelledRows(prev => [...prev, []]);
    setActiveRowIdx(spelledRows.length);
  };

  const handleRemoveRow = (rIdx: number) => {
    if (spelledRows.length === 1) {
      setSpelledRows([[]]);
      setRowColors({});
      setActiveRowIdx(0);
      return;
    }
    setSpelledRows(prev => prev.filter((_, idx) => idx !== rIdx));
    setRowColors(prev => {
      const next: Record<number, 'black' | 'blue' | 'red' | 'green'> = {};
      Object.keys(prev).forEach(k => {
        const idx = parseInt(k, 10);
        if (idx < rIdx) {
          next[idx] = prev[idx];
        } else if (idx > rIdx) {
          next[idx - 1] = prev[idx];
        }
      });
      return next;
    });
    setActiveRowIdx(prev => Math.max(0, Math.min(prev, spelledRows.length - 2)));
  };

  const handleDeleteRowWithHistory = (rIdx: number) => {
    const rowToSave = spelledRows[rIdx];
    const colorToSave = rowColors[rIdx];
    
    // Save to history stack
    setDeletedRowsHistory(prev => [
      ...prev,
      { row: rowToSave, index: rIdx, color: colorToSave }
    ]);
    
    handleRemoveRow(rIdx);
  };

  const handleUndoDelete = () => {
    if (deletedRowsHistory.length === 0) return;
    
    const lastDeleted = deletedRowsHistory[deletedRowsHistory.length - 1];
    
    setSpelledRows(prev => {
      const copy = [...prev];
      if (copy.length === 1 && copy[0].length === 0) {
        return [lastDeleted.row];
      }
      const insertIdx = Math.min(lastDeleted.index, copy.length);
      copy.splice(insertIdx, 0, lastDeleted.row);
      return copy;
    });

    if (lastDeleted.color) {
      setRowColors(prev => {
        const next: Record<number, 'black' | 'blue' | 'red' | 'green'> = {};
        Object.entries(prev).forEach(([k, val]) => {
          const idx = parseInt(k, 10);
          const colorVal = val as 'black' | 'blue' | 'red' | 'green';
          if (idx < lastDeleted.index) {
            next[idx] = colorVal;
          } else {
            next[idx + 1] = colorVal;
          }
        });
        next[lastDeleted.index] = lastDeleted.color as 'black' | 'blue' | 'red' | 'green';
        return next;
      });
    }

    setDeletedRowsHistory(prev => prev.slice(0, -1));
  };

  const handleClearAllRows = () => {
    // Collect all rows that actually contain cubes
    const nonKeys = spelledRows
      .map((row, idx) => ({ row, index: idx, color: rowColors[idx] }))
      .filter(item => item.row.length > 0);
    
    if (nonKeys.length > 0) {
      setDeletedRowsHistory(prev => [
        ...prev,
        ...nonKeys
      ]);
    }

    setSpelledRows([[]]);
    setRowColors({});
    setActiveRowIdx(0);
  };

  const cycleRowColor = (rIdx: number) => {
    const current = rowColors[rIdx] || (themeColor === '#000000' ? 'black' : themeColor === '#0000FF' ? 'blue' : themeColor === '#FF0000' ? 'red' : 'green');
    const colorCycle = ['black', 'blue', 'red', 'green'];
    const nextIdx = (colorCycle.indexOf(current) + 1) % colorCycle.length;
    const newColorName = colorCycle[nextIdx] as 'black'|'blue'|'red'|'green';
    
    setRowColors(prev => ({ ...prev, [rIdx]: newColorName }));
    
    const newHex = newColorName === 'black' ? '#000000' : newColorName === 'blue' ? '#0000FF' : newColorName === 'red' ? '#FF0000' : '#009246';
    setSpelledRows(prev => {
        const copy = prev.map(r => [...r]);
        copy[rIdx] = copy[rIdx].map(l => ({ ...l, color: newHex }));
        return copy;
    });
  };

  // Handle pointer down triggers from alphabet cube grid
  const handleCubePointerDown = (e: React.PointerEvent, cube: LetterCubeData, letter: string) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const startX = rect.left + rect.width / 2 + window.scrollX;
    const startY = rect.top + rect.height / 2 + window.scrollY;

    setDraggedCube(cube);
    setDraggedLetter(letter);
    setDragStartPosCenter({ x: startX, y: startY });
    
    // Initialize predictive drag tracking variables
    dragLastTimeRef.current = performance.now();
    dragLastMouseRef.current = { x: e.clientX, y: e.clientY };
    dragVelocityRef.current = { x: 0, y: 0 };
    
    setPointerPos({ x: e.clientX, y: e.clientY });
    setDragScribblePoints([{ x: startX, y: startY }]);

    if (trayRef.current) {
      trayRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  if (activeTab === 'about') {
    return (
      <AboutSection 
        onBack={() => {
          setActiveTab('app');
          window.scrollTo({ top: 0, behavior: 'instant' });
        }} 
      />
    );
  }

  return (
    <div className="relative min-h-screen bg-gray-50 flex flex-col font-sans select-none pb-16">
      
      {/* ARTICLE LOAD TRANSITION SCREEN OVERLAY */}
      <AnimatePresence>
        {isAboutLoading && (
          <motion.div
            key="about-loading-transition"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            className="fixed inset-0 bg-white/98 backdrop-blur-xl z-[10000] flex flex-col items-center justify-center select-none"
          >
            <div className="h-28 flex items-center justify-center scale-110">
              <div className="boxes">
                <div className="box">
                  <div></div>
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
                <div className="box">
                  <div></div>
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
                <div className="box">
                  <div></div>
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
                <div className="box">
                  <div></div>
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
              </div>
            </div>
            
            <motion.h4 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-gray-900 font-display font-extrabold text-xl tracking-tight leading-tight mt-10 text-center"
            >
              Navegando para o Saiba Mais
            </motion.h4>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              transition={{ delay: 0.6 }}
              className="text-xs sm:text-sm text-gray-500 font-medium font-sans mt-2 text-center max-w-xs leading-relaxed"
            >
              Aguarde enquanto preparamos a matéria completa do Ábaco Brasileiro de Alfabetização.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* LANDING / SPLASH SCREEN OVERLAY */}
      <AnimatePresence>
        {showLanding && (
          <motion.div
            key="abba-landing"
            initial={{ opacity: 1 }}
            exit={{ 
              opacity: 0, 
              scale: 1.02,
              filter: "blur(6px)",
              transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } 
            }}
            className="fixed inset-0 bg-white z-[9999] overflow-y-auto flex flex-col items-center py-12 px-6 select-none cursor-default"
            title="Ábaco Brasileiro de Alfabetização"
          >
            {/* Centered Logo and Text Reveal Wrapper with layout projection */}
            <motion.div 
              layout="position"
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center justify-center select-none max-w-xl w-full pt-4 sm:pt-8 pb-16 mt-4"
            >
              
              {/* Logo container - Stays completely stationary or transitions smoothly via layout */}
              <motion.div
                layout="position"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={
                  landingPhase === 'blank' 
                    ? { opacity: 0, scale: 0.85 }
                    : { opacity: 1, scale: 1 }
                }
                transition={{ 
                  layout: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
                  opacity: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
                  scale: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
                }}
                className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 lg:w-72 lg:h-72 flex items-center justify-center z-20"
              >
                <img
                  src="https://res.cloudinary.com/dudmozd8z/image/upload/v1779389284/logo_abba_bmgx5y.svg"
                  alt="ABBA Logo"
                  className="w-full h-full object-contain pointer-events-none"
                />
              </motion.div>

              {/* Exact brand texts from image - beautifully fades in directly underneath, pulled upwards to be snug with the logo */}
              <motion.div 
                layout="position"
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center -mt-5 sm:-mt-9 md:-mt-12 lg:-mt-16 z-10"
              >
                <AnimatePresence mode="wait">
                  {landingPhase === 'text' && (
                    <motion.div
                      key="abba-text-brand"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      transition={{ 
                        duration: 0.8, 
                        ease: [0.16, 1, 0.3, 1]
                      }}
                      className="flex flex-col items-center text-center font-humanist select-none"
                    >
                      <span className="text-[#005ba4] font-black tracking-normal uppercase text-3xl sm:text-4xl md:text-5xl lg:text-[3.15rem] leading-[0.92] whitespace-nowrap">
                        ÁBACO
                      </span>
                      <span className="text-[#006837] font-black tracking-normal uppercase text-3xl sm:text-4xl md:text-5xl lg:text-[3.15rem] leading-[0.92] mt-1 sm:mt-1.5 whitespace-nowrap">
                        BRASILEIRO
                      </span>
                      <span className="text-[#1a1a1a] font-black tracking-normal uppercase text-3xl sm:text-4xl md:text-5xl lg:text-[3.15rem] leading-[0.92] mt-1 sm:mt-1.5 whitespace-nowrap">
                        DE
                      </span>
                      <span className="text-[#b5262c] font-black tracking-normal uppercase text-3xl sm:text-4xl md:text-[2.85rem] lg:text-[3.15rem] leading-[0.92] mt-1 sm:mt-1.5 whitespace-nowrap">
                        AL-FA-BE-TI-ZA-ÇÃO
                      </span>
                      <span className="text-[#1a1a1a] font-black tracking-normal lowercase text-3xl sm:text-4xl md:text-5xl lg:text-[3.15rem] leading-[0.92] mt-0.5 sm:mt-1 whitespace-nowrap">
                        bilingüe
                      </span>
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ 
                          delay: 0.3, 
                          duration: 0.8, 
                          ease: [0.16, 1, 0.3, 1] 
                        }}
                        className="font-corsiva text-[#1a1a1a] text-lg sm:text-xl md:text-2xl lg:text-[1.65rem] mt-5 sm:mt-6 text-center leading-relaxed"
                      >
                        <span className="block sm:inline whitespace-nowrap">
                          em <span className="text-[#006837]">Português</span>, Espanhol, <span className="text-[#b5262c]">Italiano</span>,
                        </span>{" "}
                        <span className="block sm:inline whitespace-nowrap">
                          <span className="text-[#f15a24]">Francês</span>, <span className="text-[#005ba4]">Inglês</span> e <span className="text-[#b5262c]">Alemão</span>
                        </span>
                      </motion.div>

                      {/* Author Credits Block using Inter Custom Regular and Light Fonts */}
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ 
                          delay: 0.6, 
                          duration: 0.8, 
                          ease: [0.16, 1, 0.3, 1] 
                        }}
                        className="flex flex-col items-center text-center mt-4 sm:mt-5 md:mt-6 select-none text-[#1a1a1a]"
                      >
                        <span className="font-inter-reg text-sm sm:text-base md:text-lg lg:text-[1.25rem] xl:text-[1.35rem] tracking-[0.06em] font-normal">
                          AUTOR: JOSÉ DECIO DE ALENCAR
                        </span>
                        <div className="font-inter-light text-[13px] sm:text-sm md:text-base lg:text-[1.05rem] xl:text-[1.15rem] mt-1 sm:mt-1.5 flex flex-col items-center leading-normal text-gray-800">
                          <span>Gestor de PD&I-Projetos de</span>
                          <span className="mt-0.5">desenvolvimento e inovação</span>
                        </div>
                      </motion.div>

                      {/* Slogan block using Freestyle Script webfont */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ 
                          delay: 0.9, 
                          duration: 0.8, 
                          ease: [0.16, 1, 0.3, 1] 
                        }}
                        className="font-freestyle text-[#1a1a1a] text-2xl sm:text-3xl lg:text-[2.25rem] xl:text-[2.5rem] tracking-wide text-center mt-5 sm:mt-6 select-none px-4 leading-[1.1] sm:leading-normal"
                      >
                        <span className="block sm:inline whitespace-nowrap">
                          Inovação Brasileira no Ensino
                        </span>{" "}
                        <span className="block sm:inline whitespace-nowrap">
                          de Línguas Estrangeiras
                        </span>
                      </motion.div>

                      {/* Location details line */}
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ 
                          delay: 1.2, 
                          duration: 0.8, 
                          ease: [0.16, 1, 0.3, 1] 
                        }}
                        className="font-inter-reg text-[11px] sm:text-xs md:text-sm lg:text-[1.05rem] xl:text-[1.15rem] tracking-[0.12em] text-[#1a1a1a] opacity-85 text-center mt-2.5 sm:mt-3 select-none whitespace-nowrap"
                      >
                        BLUMENAU - SANTA CATARINA - BRASIL
                      </motion.div>

                      {/* Animated Bouncing Down Arrow Indicator */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.5, duration: 0.8 }}
                        className="w-full flex flex-col items-center mt-6 sm:mt-8 select-none"
                      >
                        <motion.div
                          onClick={handleScrollToButton}
                          animate={{ y: [0, 8, 0] }}
                          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                          className="flex flex-col items-center cursor-pointer group p-2"
                        >
                          <span className="text-gray-400 font-inter-light text-[10px] sm:text-xs tracking-[0.08em] uppercase mb-1.5 transition-colors group-hover:text-[#005ba4]">
                            Rolar para Baixo
                          </span>
                          <ChevronDown className="w-5.5 h-5.5 sm:w-6.5 sm:h-6.5 text-gray-400 group-hover:text-[#005ba4] transition-colors" />
                        </motion.div>
                      </motion.div>

                      {/* Spacer height to separate and allow genuine scrolling on viewport */}
                      <div className="h-32 sm:h-44 md:h-52" />

                      {/* Entry Call To Action Button at the scroll end point */}
                      <div 
                        ref={enterButtonRef}
                        className="w-full flex flex-col items-center select-none pb-16 pt-4"
                      >
                        <motion.button
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowLanding(false);
                          }}
                          className="font-inter-reg tracking-[0.1em] uppercase text-xs sm:text-sm font-bold bg-[#005ba4] hover:bg-[#004780] text-white px-8 py-3.5 sm:px-10 sm:py-4 rounded-full shadow-lg hover:shadow-xl hover:shadow-[#005ba4]/10 active:scale-95 transition-all cursor-pointer border border-[#005ba4]/20 flex items-center justify-center gap-2"
                        >
                          Entrar no App
                        </motion.button>
                        <span className="font-inter-light text-[10px] sm:text-xs text-gray-400 mt-2.5">
                          Clique para iniciar sua experiência de alfabetização bilingue
                        </span>
                      </div>

                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER SECTION */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-100 py-3.5 px-4 sm:px-6 md:px-8 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-2.5">
            {/* Morphing Hamburger Button - Icon Only */}
            <button
              onClick={() => setIsMenuOpen(prev => !prev)}
              className="p-2 -ml-1 rounded-full text-gray-700 hover:text-gray-950 hover:bg-gray-100 active:scale-95 transition-all cursor-pointer flex items-center justify-center border border-gray-200 shadow-3xs bg-white relative z-50 select-none w-10 h-10"
              title="Menu ABBA"
            >
              <div className="w-4.5 h-4 flex flex-col justify-center items-center relative">
                <span className={`w-4.5 h-0.5 bg-gray-700 rounded-full transition-all duration-300 absolute ${isMenuOpen ? 'rotate-45' : '-translate-y-1'}`} />
                <span className={`w-4.5 h-0.5 bg-gray-700 rounded-full transition-all duration-250 absolute ${isMenuOpen ? 'opacity-0 scale-50' : 'opacity-100'}`} />
                <span className={`w-4.5 h-0.5 bg-gray-700 rounded-full transition-all duration-300 absolute ${isMenuOpen ? '-rotate-45' : 'translate-y-1'}`} />
              </div>
            </button>

            <img src="https://res.cloudinary.com/dudmozd8z/image/upload/v1779315941/logoabra2_kls3we.svg" alt="ABBA Logo" className="w-10 h-10 ml-0.5 object-contain" />
            <div>
              <h1 className="font-display font-extrabold text-xl tracking-tight text-gray-950 flex items-center gap-1.5">
                ABBA DIGITAL
              </h1>
              <p className="text-[10px] font-medium text-gray-500 h-[15px] flex items-center">Ábaco Brasileiro de Alfabetização Bilingue</p>
            </div>
          </div>
        </div>
      </header>

      {/* APPLE-STYLE FLUID NAV OVERLAY */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="fixed top-[71.5px] inset-x-0 bottom-0 bg-white/98 backdrop-blur-xl z-50 overflow-y-auto"
          >
            <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 md:px-8 py-8 md:py-10 text-left">
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsAboutLoading(true);
                    window.scrollTo({ top: 0, behavior: 'instant' });
                    setTimeout(() => {
                      setIsAboutLoading(false);
                      setActiveTab('about');
                    }, 2500);
                  }}
                  className="text-left group cursor-pointer border-none bg-transparent p-0 focus:outline-none max-w-xl"
                >
                  <h3 className="font-display font-black text-2xl sm:text-3xl text-gray-900 group-hover:text-[#005ba4] transition-colors tracking-tight leading-tight">
                    Saiba mais
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-2 font-medium leading-relaxed font-sans max-w-md font-semibold">
                    Clique aqui para acessar a matéria completa sobre o Ábaco Brasileiro de Alfabetização Bilingue por José Décio de Alencar.
                  </p>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BODY CONTENT AREA */}
      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 md:px-8 mt-6 flex flex-col gap-6">
        
        <div className="text-left">
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-gray-950 tracking-tight leading-tight">
            Inovação Brasileira no ensino de línguas estrangeiras.
          </h2>
        </div>

        {/* 1. INTERACTIVE CUBES GRID */}
        <section className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 shadow-xs w-full text-left">
          <div className="mb-4 border-b border-gray-100 pb-2.5 flex items-center justify-between">
            <button
              onClick={handleFlagClick}
              className="inline-flex items-center gap-2 hover:bg-gray-50 active:scale-95 px-2.5 py-1.5 rounded-xl border border-gray-200 shadow-2xs transition-all cursor-pointer bg-white"
              title="Clique para trocar o idioma e as cores do alfabeto"
            >
              {renderFlag()}
            </button>

            <button
              onClick={() => setIsReorderCubesActive(prev => !prev)}
              className={`inline-flex items-center justify-center w-[46px] h-[34px] rounded-xl border shadow-2xs active:scale-95 transition-all cursor-pointer bg-white ${
                isReorderCubesActive
                  ? 'border-green-300 text-green-600 bg-green-50/50'
                  : 'border-gray-200 text-gray-400 bg-white hover:bg-gray-50'
              }`}
              title="Habilitar substituir cubos no painel"
            >
              <RefreshCw className={`w-4.5 h-4.5 shrink-0 transition-all ${isReorderCubesActive ? 'text-green-500 animate-pulse scale-105' : 'text-gray-400'}`} />
            </button>
          </div>

          <div 
            ref={shelfRef}
            className="grid grid-cols-5 gap-3 sm:gap-4 md:gap-5 w-full max-w-sm sm:max-w-md md:max-w-lg mx-auto p-2 rounded-xl border border-transparent"
          >
            {shelfCubes.map((cube, cubeIdx) => (
              <div 
                key={cube.id} 
                className="aspect-square w-full shrink-0 text-left relative z-20"
                data-shelf-idx={cubeIdx}
              >
                <div 
                  className={`touch-none select-none transition-all duration-150 w-full h-full ${
                    draggedShelfIndex === cubeIdx 
                      ? 'opacity-30 scale-95 border-2 border-dashed border-gray-300 rounded-2xl' 
                      : 'active:scale-95 cursor-grab'
                  }`}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    if (isReorderCubesActive) {
                      setDraggedShelfIndex(cubeIdx);
                      dragLastTimeRef.current = performance.now();
                      dragLastMouseRef.current = { x: e.clientX, y: e.clientY };
                      dragVelocityRef.current = { x: 0, y: 0 };
                      setPointerPos({ x: e.clientX, y: e.clientY });
                    } else {
                      let activeLetter = cube.primaryLetter;
                      if (cube.isSplit) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clientX = e.clientX - rect.left;
                        const clientY = e.clientY - rect.top;
                        if (clientY > (rect.height - (rect.width * (rect.height / rect.width)) * (clientX / rect.width))) {
                          activeLetter = cube.secondaryLetter || cube.primaryLetter;
                        }
                      }
                      handleCubePointerDown(e, cube, activeLetter);
                    }
                  }}
                >
                  <LetterCube 
                    data={cube} 
                    interactive={true}
                    themeColor={themeColor}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 2. THE MULTI-LINE SPELLING WORKSPACE */}
        <section 
          ref={trayRef} 
          className="bg-white rounded-3xl border border-gray-150 p-5 sm:p-6 shadow-xs relative overflow-hidden w-full text-left font-sans animate-feed"
        >
          <div className="flex flex-col gap-4 w-full">

            {/* SINGLE BOARD CONTAINER (Original style matching the grey dashed card, growing internally) */}
            <motion.div 
              layout
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30
              }}
              ref={boardRef}
              className="w-full relative rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-4 sm:p-5 flex flex-col gap-5"
            >
              
              <AnimatePresence mode="popLayout">
                {spelledRows.map((row, rIdx) => {
                  const isActiveRow = activeRowIdx === rIdx;
                  const isLastRow = rIdx === spelledRows.length - 1;

                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ 
                        type: "spring",
                        stiffness: 350,
                        damping: 30
                      }}
                      key={`row-box-${rIdx}`}
                      onClick={() => setActiveRowIdx(rIdx)}
                      onPointerDown={(e) => {
                        // Do not trigger scrollbar activation on touch if tapping buttons (like scissors)
                        if ((e.target as HTMLElement).closest('button')) return;
                        // If tapping/dragging actual slots or letters, do not prompt scrollbar
                        if ((e.target as HTMLElement).closest('[data-slot-idx]')) return;
                        if (draggedCube || draggedBoardLetter || draggedTrayIndex) return;
                        if (!rowOverflows[rIdx]) return;
                        
                        setActiveScrollingRow(rIdx);
                        if (activeScrollingTimeoutRef.current[rIdx]) {
                          clearTimeout(activeScrollingTimeoutRef.current[rIdx]);
                        }
                        activeScrollingTimeoutRef.current[rIdx] = setTimeout(() => {
                          setActiveScrollingRow(null);
                        }, 4000); // stay visible for 4 seconds when tapping below/around the word
                      }}
                      onMouseEnter={() => {
                        if (rowOverflows[rIdx]) {
                          setActiveScrollingRow(rIdx);
                        }
                      }}
                      onMouseLeave={() => {
                        if (activeScrollingRow === rIdx) {
                          setActiveScrollingRow(null);
                        }
                      }}
                      data-row-container-idx={rIdx}
                      className={`w-full relative py-2.5 px-3 pb-6 rounded-xl transition-all duration-200 cursor-pointer flex flex-col gap-1.5 ${
                        isActiveRow 
                          ? 'bg-white/70 shadow-sm ring-1 ring-gray-100/80' 
                          : 'hover:bg-white/30'
                      }`}
                    >
                      <div className="w-full flex items-center gap-3">
                        {/* Row Left Controls (Pill Capsule Toggle: Save/Bookmark vs Scissors vs Trash) */}
                        <div className="flex flex-col gap-2 shrink-0">
                          <div 
                            className="w-[40px] h-[114px] bg-[#F9F9F9] rounded-full relative flex flex-col items-center justify-between p-[3px] select-none border border-[#E2E4E6] shadow-[inset_0_1px_3px_rgba(0,0,0,0.06)] shrink-0"
                            title="Selecione um modo: Salvar (2 cliques para confirmar), Cortar conexões, ou Excluir (2 cliques para confirmar)"
                          >
                            {/* Sliding light-green background active indicator */}
                            <motion.div
                              className="absolute bg-[#CAFAE3] rounded-full w-[32px] h-[32px] shadow-[0_1px_3px_rgba(0,170,108,0.15)] left-[3px] top-[3px]"
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{
                                opacity: rowActiveModes[rIdx] ? 1 : 0,
                                scale: rowActiveModes[rIdx] ? 1 : 0,
                                y: rowActiveModes[rIdx] === 'save' 
                                  ? 0 
                                  : rowActiveModes[rIdx] === 'scissors' 
                                  ? 38 
                                  : rowActiveModes[rIdx] === 'trash'
                                  ? 76
                                  : 0
                              }}
                              transition={{
                                type: "spring",
                                stiffness: 450,
                                damping: 28
                              }}
                            />

                            {/* Top Option: Bookmark (ACTIVE when wires are shown / not hidden) */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRowActiveModes(prev => ({
                                  ...prev,
                                  [rIdx]: prev[rIdx] === 'save' ? null : 'save'
                                }));
                              }}
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                handleOpenSaveModal(rIdx);
                              }}
                              className="z-10 w-[32px] h-[32px] flex items-center justify-center rounded-full cursor-pointer focus:outline-none transition-all hover:scale-105 active:scale-95"
                              title="Clique uma vez para focar; 2 cliques rápidos para salvar no histórico!"
                            >
                              <Bookmark 
                                className={`w-[18px] h-[18px] transition-colors duration-200 ${
                                  rowActiveModes[rIdx] === 'save' ? 'text-[#00AA6C] font-semibold' : 'text-[#9CA3AF]'
                                }`} 
                              />
                            </button>

                            {/* Middle Option: Scissors (ACTIVE when wires are hidden) */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRowActiveModes(prev => ({
                                  ...prev,
                                  [rIdx]: prev[rIdx] === 'scissors' ? null : 'scissors'
                                }));
                              }}
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                setCutWiresRows(prev => ({
                                  ...prev,
                                  [rIdx]: !prev[rIdx]
                                }));
                                setRowActiveModes(prev => ({
                                  ...prev,
                                  [rIdx]: 'scissors'
                                }));
                              }}
                              className="z-10 w-[32px] h-[32px] flex items-center justify-center rounded-full cursor-pointer focus:outline-none transition-all hover:scale-105 active:scale-95"
                              title="Clique uma vez para focar; 2 cliques rápidos para cortar/mostrar as linhas desta palavra"
                            >
                              <Scissors 
                                className={`w-[18px] h-[18px] transition-colors duration-200 ${
                                  rowActiveModes[rIdx] === 'scissors' || cutWiresRows[rIdx] ? 'text-[#00AA6C] font-semibold' : 'text-[#9CA3AF]'
                                }`} 
                              />
                            </button>

                            {/* Bottom Option: Trash (Double Click to Delete Individual Row) */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRowActiveModes(prev => ({
                                  ...prev,
                                  [rIdx]: prev[rIdx] === 'trash' ? null : 'trash'
                                }));
                              }}
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                handleDeleteRowWithHistory(rIdx);
                              }}
                              className="z-10 w-[32px] h-[32px] flex items-center justify-center rounded-full cursor-pointer focus:outline-none transition-all hover:scale-105 active:scale-95"
                              title="Clique uma vez para focar; 2 cliques rápidos para excluir esta palavra"
                            >
                              <Trash2 
                                className={`w-[18px] h-[18px] transition-colors duration-200 ${
                                  rowActiveModes[rIdx] === 'trash' ? 'text-red-500 font-semibold md:group-hover:text-red-650' : 'text-[#9CA3AF]'
                                }`} 
                              />
                            </button>
                          </div>
                        </div>

                        {/* Horizontal Scroller Container */}
                        <div 
                          id={`row-scroll-${rIdx}`}
                          onScroll={(e) => {
                            const target = e.currentTarget;
                            setRowScrollMetrics(prev => ({
                              ...prev,
                              [rIdx]: {
                                scrollLeft: target.scrollLeft,
                                scrollWidth: target.scrollWidth,
                                clientWidth: target.clientWidth
                              }
                            }));

                            // Scroll-triggered visibility for custom scrollbars
                            if (rowOverflows[rIdx]) {
                              setActiveScrollingRow(rIdx);
                              if (activeScrollingTimeoutRef.current[rIdx]) {
                                clearTimeout(activeScrollingTimeoutRef.current[rIdx]);
                              }
                              activeScrollingTimeoutRef.current[rIdx] = setTimeout(() => {
                                setActiveScrollingRow(prev => prev === rIdx ? null : prev);
                              }, 2000); // displays for 2 seconds when scrolling is detected
                            }

                            updateElementPositions();
                          }}
                          className="spelling-scroll-container w-full h-[calc((100vw-6rem)/5+8px)] min-h-[calc((100vw-6rem)/5+8px)] max-h-[calc((100vw-6rem)/5+8px)] sm:h-[74px] sm:min-h-[74px] sm:max-h-[74px] md:h-[84px] md:min-h-[84px] md:max-h-[84px] flex flex-nowrap items-center gap-3.5 py-1 px-1 overflow-x-auto no-scrollbar scroll-auto relative"
                        >
                          <AnimatePresence>
                            {row.length === 0 && isLastRow && (
                              <motion.div 
                                key={`placeholder-tip-${rIdx}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.1, ease: "easeOut" }}
                                className="absolute inset-0 text-xs text-gray-400 font-bold uppercase tracking-widest flex items-center justify-center select-none pointer-events-none z-10"
                              >
                                <span>arraste e solte aqui</span>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <AnimatePresence mode="popLayout">
                            {row.length > 0 && (
                              (() => {
                                const renderedItems: React.ReactNode[] = [];
                                row.forEach((filledLetterObj, slotIdx) => {
                                  if (!filledLetterObj || !filledLetterObj.letter) return;
 
                                  const isHoveredRow = dragHoverInfo !== null && dragHoverInfo.rIdx === rIdx;
                                  const showInsertIndicatorBefore = isHoveredRow && dragHoverInfo!.type === 'insert' && dragHoverInfo!.index === slotIdx;
                                  const showInsertIndicatorAfterLast = isHoveredRow && dragHoverInfo!.type === 'insert' && dragHoverInfo!.index === row.length && slotIdx === row.length - 1;
 
                                  const matchedCubeData: LetterCubeData = {
                                    id: filledLetterObj.id,
                                    primaryLetter: filledLetterObj.letter,
                                    primaryOrdinal: filledLetterObj.originalOrdinal || `${slotIdx + 1}°`,
                                  };
 
                                  const isBeingDragged = draggedTrayIndex && draggedTrayIndex.rIdx === rIdx && draggedTrayIndex.lIdx === slotIdx;
                                  const isBeingReplaced = isHoveredRow && dragHoverInfo!.type === 'replace' && dragHoverInfo!.index === slotIdx;
 
                                  if (showInsertIndicatorBefore) {
                                    renderedItems.push(
                                      <motion.div 
                                        layout
                                        key={`insert-indicator-before-${filledLetterObj.id}`}
                                        initial={{ scaleY: 0, opacity: 0, width: 0 }}
                                        animate={{ scaleY: 1, opacity: 1, width: "auto" }}
                                        exit={{ scaleY: 0, opacity: 0, width: 0 }}
                                        transition={{ type: "spring", stiffness: 450, damping: 25 }}
                                        className="relative w-0 h-[calc((100vw-6rem)/5)] sm:h-[66px] md:h-[76px] flex items-center justify-center shrink-0 z-35 select-none pointer-events-none"
                                      >
                                        <motion.div 
                                          initial={{ scaleY: 0, opacity: 0 }}
                                          animate={{ scaleY: 1, opacity: 1 }}
                                          exit={{ scaleY: 0, opacity: 0 }}
                                          transition={{ type: "spring", stiffness: 450, damping: 25 }}
                                          className="absolute w-[3px] h-4/5 rounded-full shadow-lg border"
                                          style={{ backgroundColor: getRowColor(rIdx), borderColor: getRowColor(rIdx) }}
                                        />
                                      </motion.div>
                                    );
                                  }
 
                                  renderedItems.push(
                                    <motion.div 
                                      layout
                                      transition={{
                                        type: "spring",
                                        stiffness: 380,
                                        damping: 32
                                      }}
                                      key={filledLetterObj.id}
                                      id={filledLetterObj.id}
                                      data-row-idx={rIdx}
                                      data-slot-idx={slotIdx}
                                      initial={{ opacity: 0, scale: 0.5, y: -15, rotate: 5 }}
                                      animate={{ 
                                        opacity: isBeingDragged ? 0.35 : 1, 
                                        scale: isBeingReplaced ? 1.08 : (isBeingDragged ? 0.95 : 1), 
                                        y: 0, 
                                        rotate: 0,
                                        boxShadow: isBeingReplaced ? "0px 10px 25px -5px rgba(0,0,0,0.15)" : "0px 2px 8px -3px rgba(0,0,0,0.05)"
                                      }}
                                      exit={{ 
                                        opacity: 0, 
                                        scale: 0.1, 
                                        y: 35,
                                        rotate: -12,
                                        filter: "blur(4px)",
                                        transition: { 
                                          duration: 0.3, 
                                          ease: [0.16, 1, 0.3, 1]
                                        } 
                                      }}
                                      className={`relative z-20 min-w-[calc((100vw-6rem)/5)] w-[calc((100vw-6rem)/5)] sm:min-w-[66px] sm:w-[66px] md:min-w-[76px] md:w-[76px] aspect-square flex items-center justify-center rounded-xl cursor-grab active:cursor-grabbing shrink-0 touch-none transition-shadow transition-colors duration-250 ${
                                        isBeingReplaced 
                                          ? 'ring-4 ring-offset-2' 
                                          : ''
                                      }`}
                                      style={isBeingReplaced ? { ringColor: themeColor } as any : undefined}
                                      onPointerDown={(e) => {
                                        if (isBeingDragged) return;
                                        e.preventDefault();
                                        e.stopPropagation(); // Stop bubbling to prevent showing the scrollbar when grabbing a letter
                                        setTrayDragStart({ 
                                          index: slotIdx, 
                                          x: e.clientX, 
                                          y: e.clientY, 
                                          letterObj: filledLetterObj, 
                                          rowIdx: rIdx,
                                          time: Date.now()
                                        });
                                      }}
                                    >
                                      <motion.div
                                        className="w-full h-full relative"
                                        whileHover={isBeingDragged ? undefined : { scale: 1.05 }}
                                      >
                                        <LetterCube 
                                          data={matchedCubeData}
                                          variant="square"
                                          interactive={false}
                                          sizeClassName="w-full h-full"
                                          themeColor={filledLetterObj.color || getRowColor(rIdx)}
                                        />
                                      </motion.div>
                                    </motion.div>
                                  );
 
                                  if (showInsertIndicatorAfterLast) {
                                    renderedItems.push(
                                      <motion.div 
                                        layout
                                        key={`insert-indicator-after-last-${filledLetterObj.id}`}
                                        initial={{ scaleY: 0, opacity: 0, width: 0 }}
                                        animate={{ scaleY: 1, opacity: 1, width: "auto" }}
                                        exit={{ scaleY: 0, opacity: 0, width: 0 }}
                                        transition={{ type: "spring", stiffness: 450, damping: 25 }}
                                        className="relative w-0 h-[calc((100vw-6rem)/5)] sm:h-[66px] md:h-[76px] flex items-center justify-center shrink-0 z-35 select-none pointer-events-none"
                                      >
                                        <motion.div 
                                          initial={{ scaleY: 0, opacity: 0 }}
                                          animate={{ scaleY: 1, opacity: 1 }}
                                          exit={{ scaleY: 0, opacity: 0 }}
                                          transition={{ type: "spring", stiffness: 450, damping: 25 }}
                                          className="absolute w-[3px] h-4/5 rounded-full shadow-lg border"
                                          style={{ backgroundColor: getRowColor(rIdx), borderColor: getRowColor(rIdx) }}
                                        />
                                      </motion.div>
                                    );
                                  }
                                });
                                return renderedItems;
                              })()
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                        {/* Small modern custom scrollbar for mobile and desktop views */}
                      {rowOverflows[rIdx] && (
                        <div 
                          className={`absolute bottom-1 left-0 right-0 flex justify-center py-0.5 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] z-35 ${
                            (activeScrollingRow === rIdx || isDraggingScrollbar === rIdx) 
                              ? 'opacity-100 scale-100 pointer-events-auto'
                              : 'opacity-0 scale-95 pointer-events-none'
                          }`}
                        >
                          <div 
                            className="w-32 h-1.5 bg-gray-200/60 rounded-full relative cursor-pointer active:h-2 transition-all shadow-inner touch-none"
                            onPointerDown={(e) => {
                              e.preventDefault(); // Prevent text selection and default touch actions
                              e.stopPropagation(); // Prevent parent clicks
                              
                              const trackEl = e.currentTarget;
                              trackEl.setPointerCapture(e.pointerId);
                              setIsDraggingScrollbar(rIdx);
                              setActiveScrollingRow(rIdx);
                              
                              const container = document.getElementById(`row-scroll-${rIdx}`);
                              if (!container) return;
                              
                              const rect = trackEl.getBoundingClientRect();
                              const relativeX = e.clientX - rect.left;
                              const scrollWidth = container.scrollWidth;
                              const clientWidth = container.clientWidth;
                              const maxScroll = scrollWidth - clientWidth;
                              
                              if (maxScroll <= 0) return;
                              
                              const visibleFraction = clientWidth / scrollWidth;
                              const thumbWidthPct = Math.min(80, Math.max(20, visibleFraction * 100));
                              const thumbWidthPx = (thumbWidthPct / 100) * rect.width;
                              const draggableTrackWidth = rect.width - thumbWidthPx;
                              
                              const currentThumbLeft = (container.scrollLeft / maxScroll) * draggableTrackWidth;
                              
                              let grabOffset = thumbWidthPx / 2; // default to center
                              if (relativeX >= currentThumbLeft && relativeX <= currentThumbLeft + thumbWidthPx) {
                                // Gained grab on the thumb exactly, preserve offset to prevent snapping
                                grabOffset = relativeX - currentThumbLeft;
                              } else {
                                // Tapped track outside of thumb, snap thumb center to tap
                                const clickX = relativeX;
                                const newThumbLeft = Math.max(0, Math.min(draggableTrackWidth, clickX - grabOffset));
                                const pct = draggableTrackWidth > 0 ? newThumbLeft / draggableTrackWidth : 0;
                                container.scrollLeft = pct * maxScroll;
                              }
                              
                              const handlePointerMove = (moveEvent: PointerEvent) => {
                                if (moveEvent.cancelable) {
                                  moveEvent.preventDefault();
                                }
                                
                                const currentRect = trackEl.getBoundingClientRect();
                                const currentRelativeX = moveEvent.clientX - currentRect.left;
                                const newThumbLeft = Math.max(0, Math.min(draggableTrackWidth, currentRelativeX - grabOffset));
                                const pct = draggableTrackWidth > 0 ? newThumbLeft / draggableTrackWidth : 0;
                                
                                container.scrollLeft = pct * maxScroll;
                                
                                // Extreme immediate feedback by directly manipulating DOM left style
                                const maxLeftPct = 100 - thumbWidthPct;
                                const thumbLeftPct = pct * maxLeftPct;
                                const thumbEl = document.getElementById(`scrollbar-thumb-${rIdx}`);
                                if (thumbEl) {
                                  thumbEl.style.left = `${thumbLeftPct}%`;
                                }
                                
                                // Dispatch state update fast
                                setRowScrollMetrics(prev => ({
                                  ...prev,
                                  [rIdx]: {
                                    scrollLeft: container.scrollLeft,
                                    scrollWidth,
                                    clientWidth
                                  }
                                }));
                              };
                              
                              const handlePointerUp = (upEvent: PointerEvent) => {
                                trackEl.releasePointerCapture(upEvent.pointerId);
                                setIsDraggingScrollbar(null);
                                
                                // Smooth recovery and post-drag visibility retention
                                setActiveScrollingRow(rIdx);
                                if (activeScrollingTimeoutRef.current[rIdx]) {
                                  clearTimeout(activeScrollingTimeoutRef.current[rIdx]);
                                }
                                activeScrollingTimeoutRef.current[rIdx] = setTimeout(() => {
                                  setActiveScrollingRow(null);
                                }, 3000);
                                
                                trackEl.removeEventListener('pointermove', handlePointerMove);
                                trackEl.removeEventListener('pointerup', handlePointerUp);
                                trackEl.removeEventListener('pointercancel', handlePointerUp);
                              };
                              
                              trackEl.addEventListener('pointermove', handlePointerMove, { passive: false });
                              trackEl.addEventListener('pointerup', handlePointerUp);
                              trackEl.addEventListener('pointercancel', handlePointerUp);
                            }}
                          >
                            <div 
                              id={`scrollbar-thumb-${rIdx}`}
                              className="h-full bg-[#005ba4] rounded-full absolute top-0"
                              style={(() => {
                                const containerEl = document.getElementById(`row-scroll-${rIdx}`);
                                const realScrollLeft = containerEl ? containerEl.scrollLeft : 0;
                                const realScrollWidth = containerEl ? containerEl.scrollWidth : 1;
                                const realClientWidth = containerEl ? containerEl.clientWidth : 1;
                                
                                const metrics = rowScrollMetrics[rIdx] || { 
                                  scrollLeft: realScrollLeft, 
                                  scrollWidth: realScrollWidth, 
                                  clientWidth: realClientWidth 
                                };
                                const maxScroll = metrics.scrollWidth - metrics.clientWidth;
                                const scrollFraction = maxScroll > 0 ? metrics.scrollLeft / maxScroll : 0;
                                const visibleFraction = metrics.scrollWidth > 0 ? metrics.clientWidth / metrics.scrollWidth : 1;
                                
                                const thumbWidthPct = Math.min(80, Math.max(20, visibleFraction * 100));
                                const maxLeftPct = 100 - thumbWidthPct;
                                const thumbLeftPct = scrollFraction * maxLeftPct;
                                
                                return {
                                  width: `${thumbWidthPct}%`,
                                  left: `${thumbLeftPct}%`
                                };
                              })()}
                            />
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* CLEAN CONTROLLERS AT THE BOTTOM RIGHT OF THE BOARD */}
              <div className="flex justify-end items-center gap-3 select-none mt-2">
                {/* Undo Button (Voltar) - disabled if history is empty */}
                <button
                  type="button"
                  onClick={handleUndoDelete}
                  disabled={deletedRowsHistory.length === 0}
                  className={`p-2 sm:p-2.5 border rounded-xl transition-all cursor-pointer shadow-2xs flex items-center justify-center ${
                    deletedRowsHistory.length > 0
                      ? 'bg-white hover:bg-indigo-50 border-indigo-200 hover:border-indigo-300 text-indigo-600 active:scale-95'
                      : 'bg-gray-50 border-gray-150 text-gray-300 cursor-not-allowed opacity-50'
                  }`}
                  title={deletedRowsHistory.length > 0 ? "Desfazer última exclusão de palavra" : "Nada para desfazer"}
                >
                  <Undo2 className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                </button>

                <button
                  onClick={handleClearAllRows}
                  className="p-2 sm:p-2.5 bg-white hover:bg-red-50 border border-red-200 hover:border-red-300 text-red-500 rounded-xl transition-all cursor-pointer shadow-2xs animate-feed"
                  title="Limpar todas as palavras do tabuleiro"
                >
                  <Trash2 className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                </button>
              </div>

            </motion.div>

          </div>
        </section>

      </main>

      {/* ABSOLUTE PAGE-RELATIVE SVG CONNECTION OVERLAY */}
      <svg className="pointer-events-none absolute inset-0 w-full h-full z-10 overflow-visible">
        {(() => {
          if (isReorderCubesActive) return null;

          // Collect visible wires
          const visibleWires: { letter: any; rIdx: number; lIdx: number }[] = [];
          spelledRows.forEach((row, rIdx) => {
            if (cutWiresRows[rIdx]) return;
            row.forEach((letter, lIdx) => {
              if (!letter || !letter.id || !letter.originCubeId) return;
              const isBeingDragged = draggedTrayIndex && rIdx === draggedTrayIndex.rIdx && lIdx === draggedTrayIndex.lIdx;
              if (isBeingDragged) return;
              visibleWires.push({ letter, rIdx, lIdx });
            });
          });

          // Group by origin to spread endpoints
          const originsMap: Record<string, typeof visibleWires> = {};
          visibleWires.forEach(w => {
            const oId = w.letter.originCubeId;
            if (!originsMap[oId]) originsMap[oId] = [];
            originsMap[oId].push(w);
          });
          
          Object.values(originsMap).forEach(list => {
              // Sort by destination X so lines don't cross each other at the source
              list.sort((a, b) => {
                 const endA = elementPositions[a.letter.id];
                 const endB = elementPositions[b.letter.id];
                 if (endA && endB) return endA.x - endB.x;
                 return 0;
              });
          });

          return visibleWires.map((w) => {
            const { letter, rIdx } = w;
            const start = elementPositions[letter.originCubeId];
            const end = elementPositions[letter.id];

            if (!start || !end) return null;

            const peers = originsMap[letter.originCubeId];
            const peerIndex = peers.indexOf(w);
            const totalPeers = peers.length;

            const clip = elementPositions[`row-clip-${rIdx}`];
            const trayBounds = elementPositions['tray-bounds'];

            // Compute outside boundary connection coordinates
            const startW = start.width ?? 66;
            const startH = start.height ?? 66;
            const endW = end.width ?? 66;
            const endH = end.height ?? 66;

            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const dist = Math.hypot(dx, dy) || 1;
            const ux = dx / dist;
            const uy = dy / dist;

            // Base position on the cube boundary
            let baseX = start.x + ux * (startW / 2);
            let baseY = start.y + uy * (startH / 2);
            
            // Add spreading offset based on peers
            if (totalPeers > 1) {
                // If it's mainly going downwards, spread horizontally
                if (Math.abs(uy) > Math.abs(ux)) {
                   const spreadSpan = startW * 0.7; // use 70% of width
                   const offset = ((peerIndex / (totalPeers - 1)) - 0.5) * spreadSpan;
                   baseX = start.x + offset;
                   baseY = start.y + (Math.sign(uy) * startH / 2);
                } else {
                   const spreadSpan = startH * 0.7;
                   const offset = ((peerIndex / (totalPeers - 1)) - 0.5) * spreadSpan;
                   baseX = start.x + (Math.sign(ux) * startW / 2);
                   baseY = start.y + offset;
                }
            }

            const wireStartX = baseX;
            const wireStartY = baseY;
            let wireEndX = end.x - ux * (endW / 2);
            let wireEndY = end.y - uy * (endH / 2);

            if (clip) {
              const buffer = 18;
              if (wireEndX < clip.x + buffer) wireEndX = clip.x + buffer;
              if (wireEndX > clip.y - buffer) wireEndX = clip.y - buffer;
            }
            
            if (trayBounds) {
              const buffer = 18;
              if (wireEndY < trayBounds.y + buffer) wireEndY = trayBounds.y + buffer;
              if (wireEndY > trayBounds.y + (trayBounds.height || 0) - buffer) wireEndY = trayBounds.y + (trayBounds.height || 0) - buffer;
            }

            const midY = wireStartY + (wireEndY - wireStartY) * 0.45;
            const pathData = `M ${wireStartX} ${wireStartY} C ${wireStartX} ${midY}, ${wireEndX} ${wireStartY + (wireEndY - wireStartY) * 0.55}, ${wireEndX} ${wireEndY}`;
            const currentWireColor = letter.color || getRowColor(rIdx);

            const isAnyDragActive = draggedCube !== null || draggedTrayIndex !== null || draggedShelfIndex !== null;
            return (
              <g 
                key={`wire-${letter.id}`}
                className={isAnyDragActive ? "pointer-events-none" : "pointer-events-auto cursor-pointer"}
                onClick={(e) => {
                  if (isAnyDragActive) return;
                  e.stopPropagation();
                  cycleRowColor(rIdx);
                }}
              >
                {/* Thick invisible capture path for easy click/touch targeting */}
                <path
                  d={pathData}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="24"
                  className={isAnyDragActive ? "pointer-events-none" : "cursor-pointer"}
                />
                <path
                  d={pathData}
                  fill="none"
                  stroke={currentWireColor}
                  className="stroke-[3px] opacity-10"
                  strokeLinecap="round"
                />
                <path
                  d={pathData}
                  fill="none"
                  stroke={currentWireColor}
                  className="stroke-[1px] md:stroke-[1.6px]"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.85"
                />
                <circle cx={wireStartX} cy={wireStartY} r="3" fill={currentWireColor} opacity="0.9" />
                <circle cx={wireEndX} cy={wireEndY} r="3" fill={currentWireColor} opacity="0.9" />
              </g>
            );
          });
        })()}

        {/* Real-time board letter dragging elastic wire connection line */}
        {!isReorderCubesActive && draggedBoardLetter && draggedTrayIndex !== null && (
          (() => {
            const startKey = draggedBoardLetter.originCubeId || draggedBoardLetter.id;
            const start = elementPositions[startKey] || elementPositions[draggedBoardLetter.id];
            if (!start) return null;

            const currentDragPageX = pointerPos.x + window.scrollX;
            const currentDragPageY = pointerPos.y + window.scrollY;

            const startW = start.width ?? 66;
            const startH = start.height ?? 66;
            const endW = 66;
            const endH = 66;

            const dx = currentDragPageX - start.x;
            const dy = currentDragPageY - start.y;
            const dist = Math.hypot(dx, dy) || 1;
            const ux = dx / dist;
            const uy = dy / dist;

            const wireStartX = start.x + ux * (startW / 2);
            const wireStartY = start.y + uy * (startH / 2);
            const wireEndX = currentDragPageX - ux * (endW / 2);
            const wireEndY = currentDragPageY - uy * (endH / 2);

            const midY = wireStartY + (wireEndY - wireStartY) * 0.45;
            const pathData = `M ${wireStartX} ${wireStartY} C ${wireStartX} ${midY}, ${wireEndX} ${wireStartY + (wireEndY - wireStartY) * 0.55}, ${wireEndX} ${wireEndY}`;

            const wireColor = draggedBoardLetter.color || getRowColor(draggedTrayIndex.rIdx);

            return (
              <g key={`wire-dragging-board-${draggedBoardLetter.id}`}>
                <path
                  d={pathData}
                  fill="none"
                  stroke={wireColor}
                  strokeWidth="4"
                  strokeLinecap="round"
                  opacity="0.12"
                />
                <path
                  d={pathData}
                  fill="none"
                  stroke={wireColor}
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.85"
                />
                <circle cx={wireStartX} cy={wireStartY} r="3" fill={wireColor} opacity="0.9" />
                <circle cx={wireEndX} cy={wireEndY} r="3" fill={wireColor} opacity="0.9" />
              </g>
            );
          })()
        )}

        {/* Real-time dragging elastic wire connection line */}
        {!isReorderCubesActive && draggedCube && draggedLetter && (
          (() => {
            const currentDragPageX = pointerPos.x + window.scrollX;
            const currentDragPageY = pointerPos.y + window.scrollY;
            const startCubePos = elementPositions[`cube-${draggedCube.id}`];
            const startW = startCubePos?.width ?? 66;
            const startH = startCubePos?.height ?? 66;
            const startX = startCubePos?.x ?? dragStartPosCenter.x;
            const startY = startCubePos?.y ?? dragStartPosCenter.y;

            const dx = currentDragPageX - startX;
            const dy = currentDragPageY - startY;
            const dist = Math.hypot(dx, dy) || 1;
            const ux = dx / dist;
            const uy = dy / dist;

            const edgeStartX = startX + ux * (startW / 2);
            const edgeStartY = startY + uy * (startH / 2);
            const edgeEndX = currentDragPageX - ux * (startW / 2);
            const edgeEndY = currentDragPageY - uy * (startH / 2);

            const dragMidY = edgeStartY + (edgeEndY - edgeStartY) * 0.45;
            const livePathData = `M ${edgeStartX} ${edgeStartY} C ${edgeStartX} ${dragMidY}, ${edgeEndX} ${edgeStartY + (edgeEndY - edgeStartY) * 0.55}, ${edgeEndX} ${edgeEndY}`;

            return (
              <g>
                <path
                  d={livePathData}
                  fill="none"
                  stroke={themeColor}
                  strokeWidth="4"
                  strokeLinecap="round"
                  opacity="0.12"
                />
                <path
                  d={livePathData}
                  fill="none"
                  stroke={themeColor}
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.9"
                />
                <circle cx={edgeStartX} cy={edgeStartY} r="3.5" fill={themeColor} />
                <circle cx={edgeEndX} cy={edgeEndY} r="3.5" fill={themeColor} />
              </g>
            );
          })()
        )}
      </svg>

      {/* DRAG PREVIEWS */}
      <AnimatePresence>
        {((draggedCube && draggedLetter) || (draggedTrayIndex !== null && draggedBoardLetter !== null) || (draggedShelfIndex !== null)) && (
          <div
            className="pointer-events-none fixed z-50 w-[calc((100vw-6rem)/5)] h-[calc((100vw-6rem)/5)] sm:w-[66px] sm:h-[66px] md:w-[76px] md:h-[76px] -translate-x-1/2 -translate-y-1/2 overflow-visible"
            style={{
              left: pointerPos.x,
              top: pointerPos.y,
            }}
          >
            {draggedShelfIndex !== null ? (
              <LetterCube 
                data={{
                  ...shelfCubes[draggedShelfIndex],
                  id: `floating-reorder-shelf-${shelfCubes[draggedShelfIndex].id}`
                }}
                variant="cube"
                interactive={false}
                sizeClassName="w-full h-full text-red-650 opacity-90 shadow-2xl"
                themeColor={themeColor}
              />
            ) : draggedTrayIndex !== null && draggedBoardLetter !== null ? (
              <div className={`relative w-full h-full transition-all duration-200 ${isPointerInsideTray() ? 'opacity-100 scale-100' : 'opacity-40 scale-90'}`}>
                <LetterCube 
                  data={{
                    id: `floating-reorder-${draggedBoardLetter.id}`,
                    primaryLetter: draggedBoardLetter.letter,
                    primaryOrdinal: draggedBoardLetter.originalOrdinal || '1°',
                  }}
                  variant="square"
                  interactive={false}
                  sizeClassName="w-full h-full text-red-650"
                  themeColor={draggedBoardLetter.color || getRowColor(draggedTrayIndex.rIdx)}
                />
                {!isPointerInsideTray() && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-500/15 rounded-2xl border border-red-500/35 backdrop-blur-[1px] animate-pulse">
                    <Trash2 className="w-6 h-6 text-red-500 stroke-[2.5]" />
                  </div>
                )}
              </div>
            ) : draggedCube && draggedLetter ? (
              <LetterCube 
                data={{
                  ...draggedCube,
                  id: `floating-${draggedCube.id}`,
                }}
                variant="cube"
                interactive={false}
                sizeClassName="w-full h-full text-red-650"
                themeColor={themeColor}
              />
            ) : null}
          </div>
        )}
      </AnimatePresence>

      {/* MODERN GLASS-MORPHISM DARK MODAL OVERLAY FOR LETTER REMOVAL */}
      <AnimatePresence>
        {isRemovePromptOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col justify-center items-center shadow-2xl text-center text-white"
            >
              <div className="w-12 h-12 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mb-4 border border-red-500/30">
                <Trash2 className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="font-display font-black text-lg sm:text-xl tracking-tight leading-tight mb-2">
                Remover qualquer Letra
              </h3>
              <p className="text-xs sm:text-sm font-medium text-slate-300 leading-relaxed mb-6">
                Para escolher e remover qualquer letra de qualquer posição das suas palavras, basta dar <strong className="font-black text-white">dois cliques rápidos (duplo clique)</strong> diretamente sobre a letra que você deseja remover no tabuleiro!
              </p>
              <button
                onClick={() => setIsRemovePromptOpen(false)}
                className="w-full sm:w-auto px-6 py-2.5 bg-white hover:bg-slate-100 active:scale-95 text-slate-900 font-extrabold rounded-xl transition-all cursor-pointer text-xs shadow-xs font-sans"
              >
                Entendi!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WHITE GLASS-MORPHISM MODAL OVERLAY FOR WORD SAVING */}
      <AnimatePresence>
        {isSaveModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/30 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-white/75 backdrop-blur-2xl border border-white/45 rounded-3xl p-6 sm:p-8 flex flex-col shadow-[0_25px_50px_-12px_rgba(0,0,0,0.12)] text-slate-800"
            >
              {isSavingInProgress ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="loader">
                    <svg viewBox="0 0 80 80">
                      <rect height="64" width="64" y="8" x="8"></rect>
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-slate-650 mt-6 animate-pulse">
                    Salvando palavras...
                  </p>
                </div>
              ) : isReviewingSaved ? (
                <div className="flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-[#CAFAE3]/60 text-[#00AA6C] rounded-full flex items-center justify-center border border-[#00AA6C]/10 shrink-0">
                      <Bookmark className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 font-display leading-tight">
                        Histórico de Palavras
                      </h3>
                      <p className="text-xs text-slate-500 font-semibold">Palavras salvas por você</p>
                    </div>
                  </div>

                  <div className="my-2 max-h-65 overflow-y-auto pr-1 flex flex-col gap-2.5">
                    {savedWordsList.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 text-sm italic font-semibold">
                        Nenhuma palavra salva ainda.
                      </div>
                    ) : (
                      <AnimatePresence mode="popLayout">
                        {savedWordsList.map((savedWordObj, wIdx) => (
                          <motion.div 
                            key={savedWordObj.word}
                            layout
                            initial={{ opacity: 0, y: 15, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -15, scale: 0.92 }}
                            transition={{ 
                              type: "spring",
                              stiffness: 450,
                              damping: 32,
                              layout: { duration: 0.3 }
                            }}
                            className="w-full flex items-center justify-between p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-xs"
                          >
                            {/* Horizontal mini cubes layout for reviewed word */}
                            <div className="flex flex-row flex-wrap items-center gap-1.5 overflow-hidden max-w-[80%]">
                              {savedWordObj.letters.map((filledLetterObj, slotIdx) => {
                                if (!filledLetterObj || !filledLetterObj.letter) return null;
                                const matchedCubeData: LetterCubeData = {
                                  id: `${filledLetterObj.id}-review-${slotIdx}`,
                                  primaryLetter: filledLetterObj.letter,
                                  primaryOrdinal: filledLetterObj.originalOrdinal || `${slotIdx + 1}°`,
                                };
                                return (
                                  <div key={`${filledLetterObj.id}-review-${slotIdx}`} className="w-[32px] h-[32px] sm:w-[38px] sm:h-[38px] shrink-0">
                                    <LetterCube 
                                      data={matchedCubeData}
                                      variant="square"
                                      interactive={false}
                                      sizeClassName="w-full h-full"
                                      themeColor={filledLetterObj.color || savedWordObj.themeColor || themeColor}
                                    />
                                  </div>
                                );
                              })}
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                const updated = savedWordsList.filter((_, i) => i !== wIdx);
                                setSavedWordsList(updated);
                                localStorage.setItem('savedWords', JSON.stringify(updated));
                              }}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90 shrink-0 ml-3 cursor-pointer"
                              title="Remover"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsSaveModalOpen(false);
                    }}
                    className="w-full mt-6 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all cursor-pointer text-center active:scale-95 shadow-md"
                  >
                    Fechar
                  </button>
                </div>
              ) : saveSuccessMessage ? (
                <div className="flex flex-col items-center justify-center py-6">
                  <motion.div 
                    initial={{ scale: 0.5, rotate: -15 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    className="w-16 h-16 bg-[#CAFAE3] text-[#00AA6C] rounded-full flex items-center justify-center mb-5 shadow-[0_6px_20px_rgba(0,170,108,0.25)] border border-[#00AA6C]/10"
                  >
                    <svg className="w-8 h-8 stroke-[3.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                  <h4 className="text-xl font-bold text-slate-900 mb-2 font-display">Pronto!</h4>
                  <p className="text-sm text-slate-650 font-bold text-center mb-6 leading-relaxed">
                    {saveSuccessMessage}
                  </p>
                  
                  <div className="w-full bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 mb-1.5 shadow-inner">
                    <p className="text-xs sm:text-sm font-bold text-slate-700 text-center mb-4">
                      Revisar palavras salvas?
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setIsReviewingSaved(true);
                        }}
                        className="flex-1 py-3 px-4 rounded-xl bg-[#00aa6c] text-white font-bold text-xs transition-all cursor-pointer shadow-[0_4px_14px_rgba(0,170,108,0.2)] hover:bg-[#00925c] active:scale-95 text-center"
                      >
                        Sim
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsSaveModalOpen(false);
                        }}
                        className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-700 font-bold text-xs transition-all cursor-pointer shadow-xs active:scale-95 text-center"
                      >
                        não, não quero revisar
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 bg-[#CAFAE3]/50 text-[#00AA6C] rounded-full flex items-center justify-center mb-4 border border-[#00AA6C]/20 self-center">
                    <Bookmark className="w-6 h-6" />
                  </div>

                  <h3 className="text-xl font-semibold text-center text-slate-900 mb-2 font-display">
                    Salvar Palavras
                  </h3>
                  
                  <p className="text-xs sm:text-sm text-slate-650 text-center mb-6">
                    Quais palavras que você fez deseja salvar no seu histórico?
                  </p>

                  {/* List of spelled words */}
                  <div className="flex flex-col gap-3 max-h-60 overflow-y-auto mb-6 pr-3.5">
                    {(() => {
                      const items = spelledRows
                        .map((row, idx) => ({
                          rIdx: idx,
                          row,
                          word: row.map(l => l.letter).join("").trim()
                        }))
                        .filter(item => item.word.length > 0);

                      if (items.length === 0) {
                        return (
                          <div className="text-center py-6 text-slate-400 text-xs sm:text-sm italic">
                            Nenhuma palavra construída para salvar.
                          </div>
                        );
                      }

                      return items.map(({ rIdx, row, word }) => {
                        const isSelected = selectedWordsToSave[rIdx] || false;
                        return (
                          <div 
                            key={`save-word-row-${rIdx}`}
                            onClick={() => {
                              setSelectedWordsToSave(prev => ({
                                ...prev,
                                [rIdx]: !prev[rIdx]
                              }));
                            }}
                            className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer select-none transition-all ${
                              isSelected 
                                ? 'bg-white border-[#00AA6C] shadow-[0_4px_12px_rgba(0,170,108,0.1)] text-[#00AA6C]' 
                                : 'bg-white/40 border-slate-200/80 hover:bg-white/60 text-slate-650'
                            }`}
                          >
                            {/* Horizontal mini cubes layout */}
                            <div className="flex flex-row flex-wrap items-center gap-1.5 overflow-hidden max-w-[80%]">
                              {row.map((filledLetterObj, slotIdx) => {
                                if (!filledLetterObj || !filledLetterObj.letter) return null;
                                const matchedCubeData: LetterCubeData = {
                                  id: `${filledLetterObj.id}-modal-${slotIdx}`,
                                  primaryLetter: filledLetterObj.letter,
                                  primaryOrdinal: filledLetterObj.originalOrdinal || `${slotIdx + 1}°`,
                                };
                                return (
                                  <div key={`${filledLetterObj.id}-modal-${slotIdx}`} className="w-[32px] h-[32px] sm:w-[38px] sm:h-[38px] shrink-0">
                                    <LetterCube 
                                      data={matchedCubeData}
                                      variant="square"
                                      interactive={false}
                                      sizeClassName="w-full h-full"
                                      themeColor={filledLetterObj.color || getRowColor(rIdx)}
                                    />
                                  </div>
                                );
                              })}
                            </div>

                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ml-3 ${
                              isSelected 
                                ? 'border-[#00AA6C] bg-[#00AA6C]' 
                                : 'border-slate-300'
                            }`}>
                              {isSelected && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {/* Footer Actions */}
                  <div className="flex gap-3 mt-auto">
                    <button
                      type="button"
                      onClick={() => setIsSaveModalOpen(false)}
                      className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-700 font-bold text-xs transition-all cursor-pointer shadow-xs active:scale-95"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={!Object.values(selectedWordsToSave).some(Boolean)}
                      onClick={() => {
                        const wordsToSave: SavedWord[] = [];
                        spelledRows.forEach((row, idx) => {
                          if (selectedWordsToSave[idx]) {
                            const wordstr = row.map(l => l.letter).join("").trim();
                            if (wordstr) {
                              wordsToSave.push({
                                word: wordstr,
                                letters: row.filter(l => l && l.letter),
                                themeColor: getRowColor(idx)
                              });
                            }
                          }
                        });

                        if (wordsToSave.length > 0) {
                          setIsSavingInProgress(true);
                          setTimeout(() => {
                            const newList = [...savedWordsList];
                            wordsToSave.forEach(item => {
                              if (!newList.some(exist => exist.word === item.word)) {
                                newList.push(item);
                              }
                            });
                            setSavedWordsList(newList);
                            localStorage.setItem('savedWords', JSON.stringify(newList));
                            setIsSavingInProgress(false);
                            setSaveSuccessMessage("As palavras foram salvas com sucesso");
                          }, 2000);
                        }
                      }}
                      className="flex-1 py-3 px-4 rounded-xl bg-[#00aa6c] text-white font-bold text-xs transition-all cursor-pointer shadow-[0_4px_14px_rgba(0,170,108,0.2)] hover:bg-[#00925c] active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                    >
                      Salvar
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>



    </div>
  );
}
