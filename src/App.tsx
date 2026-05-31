import React, { useState, useEffect, useRef, useCallback, type MouseEvent, type SVGProps } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const IconBase: React.FC<SVGProps<SVGSVGElement>> = ({ children, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {children}
  </svg>
);

const Trash2: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <IconBase {...props}>
    <path d="M3 6h18" />
    <path d="M9 6V4h6v2" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </IconBase>
);

const Plus: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <IconBase {...props}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </IconBase>
);

const RefreshCw: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M54.89,26.73A23.52,23.52,0,0,1,15.6,49" />
    <path d="M9,37.17a23.75,23.75,0,0,1-.53-5A23.51,23.51,0,0,1,48.3,15.2" />
    <polyline points="37.73 16.24 48.62 15.44 47.77 5.24" />
    <polyline points="25.91 47.76 15.03 48.56 15.88 58.76" />
  </svg>
);

// Preload high-quality notification sound from public/sons/
const notificationSound = new Audio("/sons/notificacao.mp3");
notificationSound.preload = "auto";

// Global helper to play sound
(window as any).playNotificationSound = () => {
  const isSoundEnabled = localStorage.getItem('abba_settings_sounds') !== 'false';
  if (isSoundEnabled) {
    notificationSound.currentTime = 0;
    notificationSound.play().catch(err => console.log("Audio playback failed:", err));
  }
};

const HelpCircle: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <IconBase {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.82 1c0 2-3 2.5-3 4" />
    <line x1="12" y1="17" x2="12" y2="17" />
  </IconBase>
);

const Replace: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <IconBase {...props}>
    <path d="M3 7V3h4" />
    <path d="M3 3a9 9 0 0 1 9-9" />
    <polyline points="1 8 3 10 5 8" />
  </IconBase>
);

const Scissors: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 256 256"
    fill="currentColor"
    {...props}
  >
    <path d="M157.73193,113.13086a8.00047,8.00047,0,0,1,2.085-11.12012l67.66553-46.29785A8.00013,8.00013,0,0,1,236.51758,68.918l-67.66553,46.29785a7.99794,7.99794,0,0,1-11.12012-2.085Zm80.87061,85.07129a7.99794,7.99794,0,0,1-11.12012,2.085l-91.4826-62.59351L93.49408,166.77686a36.034,36.034,0,1,1-9.05035-13.19458l37.38867-25.582-37.3891-25.582a35.84637,35.84637,0,1,1,9.0506-13.19458L236.51758,187.082A8.00047,8.00047,0,0,1,238.60254,198.20215ZM80,180a20,20,0,1,0-5.85791,14.1416A19.86692,19.86692,0,0,0,80,180ZM74.14209,90.1416a20,20,0,1,0-28.28418,0A19.86692,19.86692,0,0,0,74.14209,90.1416Z"/>
  </svg>
);

const ChevronDown: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <IconBase {...props}>
    <polyline points="6 9 12 15 18 9" />
  </IconBase>
);

const Bookmark: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    {...props}
  >
    <path fillRule="evenodd" clipRule="evenodd" d="M6.75 6L7.5 5.25H16.5L17.25 6V19.3162L12 16.2051L6.75 19.3162V6ZM8.25 6.75V16.6838L12 14.4615L15.75 16.6838V6.75H8.25Z" fill="currentColor"/>
  </svg>
);

const Undo2: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 21 21"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <g fill="none" fillRule="evenodd" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" transform="translate(3 6)">
      <path d="m1.378 1.376 4.243.003v4.242" transform="matrix(-.70710678 .70710678 .70710678 .70710678 3.500179 -1.449821)"/>
      <path d="m5.5 9.49998326h5c2 .00089417 3-.99910025 3-2.99998326s-1-3.00088859-3-3.00001674h-10"/>
    </g>
  </svg>
);

import { ALPHABET_CUBES } from './data';
import { LetterCube } from './components/LetterCube';
import { SpelledLetter, LetterCubeData, SavedWord, User, TaskItem, StudentSubmission } from './types';
import { AboutSection } from './components/AboutSection';
import Loader from './components/Loader';
import styled from 'styled-components';
import { LoginScreen, SignupScreen } from './components/AuthScreens';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { Confetti } from './components/Confetti';
import { supabase, logUserAction } from './supabaseClient';

const getShelfCubeIdForLetter = (letter: string): string => {
  const match = ALPHABET_CUBES.find(c => c.primaryLetter === letter || c.secondaryLetter === letter);
  return match ? `cube-${match.id}` : `cube-cube-${letter.toLowerCase()}`;
};

const normalizeColor = (col: string | undefined): string => {
  if (!col) return '#000000';
  const c = col.toLowerCase().trim();
  if (c === '#3b82f6' || c === '#0000ff' || c === '#0004fd' || c === 'blue') return '#0004FD';
  if (c === '#ef4444' || c === '#ff0000' || c === 'red') return '#FF0000';
  if (c === '#10b981' || c === '#009246' || c === 'green') return '#009246';
  return '#000000';
};

interface StyledHamburgerProps {
  isOpen: boolean;
}

const StyledHamburger = styled.div<StyledHamburgerProps>`
  position: relative;
  width: 24px;
  height: 21px; /* 3px * 3 + 6px * 2 */

  .bar {
    position: absolute;
    left: 0;
    right: 0;
    height: 3px;
    border-radius: 1.5px;
    background: #334155; /* Slate-700 gray */
    color: inherit;
    opacity: 1;
    transition: none 0.35s cubic-bezier(.5,-0.35,.35,1.5) 0s;
  }

  .bar--top {
    bottom: ${props => props.isOpen ? 'calc(50% - 3px / 2)' : 'calc(50% + 6px + 3px / 2)'};
    transform: ${props => props.isOpen ? 'rotate(135deg)' : 'none'};
    transition-property: bottom, transform;
    transition-delay: ${props => props.isOpen ? '0s, 0.35s' : '0.35s, 0s'};
  }

  .bar--middle {
    top: calc(50% - 3px / 2);
    opacity: ${props => props.isOpen ? 0 : 1};
    transition-property: opacity;
    transition-duration: ${props => props.isOpen ? '0s' : '0.35s'};
    transition-delay: 0.35s;
  }

  .bar--bottom {
    top: ${props => props.isOpen ? 'calc(50% - 3px / 2)' : 'calc(50% + 6px + 3px / 2)'};
    transform: ${props => props.isOpen ? 'rotate(225deg)' : 'none'};
    transition-property: top, transform;
    transition-delay: ${props => props.isOpen ? '0s, 0.35s' : '0.35s, 0s'};
  }
`;


export default function App() {
  // Hamburger menu open states and activePage tabs matching Apple systems
  const [activeTab, setActiveTab] = useState<'app' | 'about'>('app');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAboutLoading, setIsAboutLoading] = useState(false);

  // NEW USER PORTAL ROUTING STATES
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('abba_logged_in_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as User;
        if (parsed.codeSession && Date.now() > parsed.codeSession.expiresAt) {
          localStorage.removeItem('abba_logged_in_user');
          return null;
        }
        return parsed;
      } catch {
        return null;
      }
    }
    return null;
  });

  const [currentScreen, setCurrentScreen] = useState<'login' | 'signup' | 'student-dashboard' | 'teacher-dashboard' | 'abacus'>(() => {
    // 1. Check URL hash first
    const hash = window.location.hash.replace('#/', '').replace('#', '');
    if (hash === 'login') return 'login';
    if (hash === 'professor') return 'teacher-dashboard';
    if (hash === 'aluno') return 'student-dashboard';
    
    // 2. Check query params
    const params = new URLSearchParams(window.location.search);
    if (params.has('import')) {
      return 'teacher-dashboard';
    }
    // 3. Check saved session
    const saved = localStorage.getItem('abba_logged_in_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as User;
        if (parsed.role === 'teacher') return 'teacher-dashboard';
        if (parsed.role === 'student') return 'student-dashboard';
      } catch {}
    }
    return 'abacus';
  });

  // State for student task spelling target
  const [activeSpellingTarget, setActiveSpellingTarget] = useState<{ word: string; language: 'pt' | 'en' | 'de'; color: string } | null>(null);
  
  // State for active task title and summary on abacus header
  const [activeTaskInfo, setActiveTaskInfo] = useState<{ title: string; summary: string } | null>(null);
  
  // State for teacher reviewing a submission
  const [activeReviewSubmission, setActiveReviewSubmission] = useState<StudentSubmission | null>(null);
  const [isReviewLoading, setIsReviewLoading] = useState(false);
  const [isTeacherEditingReview, setIsTeacherEditingReview] = useState(false);
  const [teacherReviewSavedChoice, setTeacherReviewSavedChoice] = useState<'teacher' | 'student'>('student');
  const [isTeacherSaveModalOpen, setIsTeacherSaveModalOpen] = useState(false);
  const [isStudentEditing, setIsStudentEditing] = useState(true);

  const isTeacherEditingBlocked = !!activeReviewSubmission && !isTeacherEditingReview;
  const isStudentEditingBlocked = (user?.role === 'student' || !user) && !!activeTaskInfo && !isStudentEditing;
  const isEditingBlocked = isTeacherEditingBlocked || isStudentEditingBlocked;
  
  // State for show Session Expired modal
  const [isSessionExpiredOpen, setIsSessionExpiredOpen] = useState(false);

  // States for active task saving process and success modal
  const [isSavingActivity, setIsSavingActivity] = useState(false);
  const [savingProgressText, setSavingProgressText] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSavedTask, setLastSavedTask] = useState<{ title: string; words: SavedWord[]; code?: string } | null>(null);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [isCubeEditModalOpen, setIsCubeEditModalOpen] = useState(false);
  const [activeEditCube, setActiveEditCube] = useState<{ rIdx: number; slotIdx: number; letterObj: SpelledLetter } | null>(null);
  const [teacherDraftingTask, setTeacherDraftingTask] = useState<TaskItem | null>(null);

  // States for Chat WhatsApp integration
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState<{ studentName: string; taskId: string; taskTitle: string } | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('abba_task_chats');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  useEffect(() => {
    if (isChatModalOpen) {
      try {
        const raw = localStorage.getItem('abba_task_chats');
        setChatMessages(raw ? JSON.parse(raw) : []);
      } catch {}
    }
  }, [isChatModalOpen]);

  // Spelled words list completed by student
  const [completedSpelledWords, setCompletedSpelledWords] = useState<SavedWord[]>(() => {
    const saved = localStorage.getItem('abba_completed_spelled_words');
    return saved ? JSON.parse(saved) : [];
  });

  const [showConfetti, setShowConfetti] = useState(false);

  // Subject Comment states for active tasks / materias
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatSubject, setChatSubject] = useState("");
  const [chatInput, setChatInput] = useState("");

  useEffect(() => {
    if (showChatModal || isChatModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showChatModal, isChatModalOpen]);
  const [chatMessage, setChatMessage] = useState<string | null>(null);
  const [teacherReply, setTeacherReply] = useState<string | null>(null);

  // States for Teacher Review Commenting
  const [reviewCommentText, setReviewCommentText] = useState<string | null>(null);
  const [reviewTeacherReplyInput, setReviewTeacherReplyInput] = useState("");
  const [reviewTeacherReplySaved, setReviewTeacherReplySaved] = useState<string | null>(null);

  // Load subject comment when teacher launches review mode
  useEffect(() => {
    const loadReviewComment = async () => {
      if (!activeReviewSubmission) {
        setReviewCommentText(null);
        setReviewTeacherReplyInput("");
        setReviewTeacherReplySaved(null);
        return;
      }
      
      const studentEmail = activeReviewSubmission.studentEmail || "aluno@abbadigital.com";
      const subject = activeReviewSubmission.taskTitle || "Exercício de Numerais Multilingue";
      
      try {
        // Try fetching the comment from Supabase
        const { data, error } = await supabase
          .from('subject_comments')
          .select('*')
          .eq('student_email', studentEmail)
          .eq('subject', subject)
          .maybeSingle();
        
        if (!error && data) {
          setReviewCommentText(data.comment_text || null);
          setReviewTeacherReplySaved(data.teacher_reply || null);
          setReviewTeacherReplyInput(data.teacher_reply || "");
        } else {
          // Check localStorage as fallback
          const allCommentsRaw = localStorage.getItem('abba_subject_comments');
          const allComments = allCommentsRaw ? JSON.parse(allCommentsRaw) : {};
          const subjectData = allComments[subject];
          if (subjectData) {
            setReviewCommentText(subjectData.comment || null);
            setReviewTeacherReplySaved(subjectData.reply || null);
            setReviewTeacherReplyInput(subjectData.reply || "");
          } else {
            setReviewCommentText(null);
            setReviewTeacherReplySaved(null);
            setReviewTeacherReplyInput("");
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar comentário de revisão:', err);
      }
    };
    
    loadReviewComment();
  }, [activeReviewSubmission]);

  // Handle Save Teacher Reply
  const handleSaveTeacherReply = async () => {
    if (!activeReviewSubmission || !reviewCommentText) return;
    
    const studentEmail = activeReviewSubmission.studentEmail || "aluno@abbadigital.com";
    const studentName = activeReviewSubmission.studentName || "Estudante";
    const subject = activeReviewSubmission.taskTitle || "Exercício de Numerais Multilingue";
    const replyText = reviewTeacherReplyInput.trim();
    
    if (!replyText) {
      alert("Por favor, digite uma resposta.");
      return;
    }
    
    const currentMessages = getConversationMessages(reviewCommentText, reviewTeacherReplySaved);
    const newMsg = {
      role: 'teacher',
      text: replyText,
      senderName: user?.name || "Professor",
      timestamp: new Date().toISOString()
    };
    const updatedMessages = [...currentMessages, newMsg];
    const serialized = JSON.stringify(updatedMessages);

    // 1. Update state
    setReviewCommentText(serialized);
    setReviewTeacherReplySaved(replyText);
    setReviewTeacherReplyInput("");
    
    // 2. Save in Supabase
    try {
      const { error } = await supabase
        .from('subject_comments')
        .upsert({
          student_name: studentName,
          student_email: studentEmail,
          subject: subject,
          comment_text: serialized,
          teacher_reply: replyText,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'student_email,subject'
        });
      
      if (!error) {
        console.log("Resposta do professor salva no Supabase com sucesso!");
      }
    } catch (err) {
      console.warn("Erro ao salvar resposta no Supabase:", err);
    }
    
    // 3. Update localStorage (simulate sync)
    try {
      const allCommentsRaw = localStorage.getItem('abba_subject_comments');
      const allComments = allCommentsRaw ? JSON.parse(allCommentsRaw) : {};
      allComments[subject] = {
        comment: serialized,
        reply: replyText
      };
      localStorage.setItem('abba_subject_comments', JSON.stringify(allComments));
    } catch (e) {
      console.error(e);
    }
    
    // 4. Log Action
    await logUserAction({
      userName: user?.name || "José Décio de Alencar",
      userEmail: user?.email || "inglesdecio@gmail.com",
      role: 'teacher',
      actionType: 'teacher_reply_saved',
      actionDetails: 'Respondeu ao comentário do aluno ' + studentName + ' na matéria "' + subject + '": "' + replyText + '"'
    });
    
    alert("Resposta enviada com sucesso! 🚀");
  };

  const getConversationMessages = (chatMessageVal: string | null, teacherReplyVal: string | null) => {
    if (!chatMessageVal) return [];
    try {
      const parsed = JSON.parse(chatMessageVal);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (e) {
      // Ignore and fallback to legacy parsing
    }
    
    // Legacy fallback: return as student message, followed by teacher message if present
    const list = [{ role: 'student', text: chatMessageVal, senderName: 'Estudante' }];
    if (teacherReplyVal) {
      list.push({ role: 'teacher', text: teacherReplyVal, senderName: 'Professor' });
    }
    return list;
  };

  // Load comment for a subject
  const loadCommentForSubject = async (subject: string) => {
    if (!subject) return;
    try {
      // 1. Read from localStorage
      const allCommentsRaw = localStorage.getItem('abba_subject_comments');
      const allComments = allCommentsRaw ? JSON.parse(allCommentsRaw) : {};
      const subjectData = allComments[subject];
      if (subjectData) {
        setChatMessage(subjectData.comment || null);
        setTeacherReply(subjectData.reply || null);
        setChatInput(""); // Always empty on load!
      } else {
        setChatMessage(null);
        setTeacherReply(null);
        setChatInput("");
      }
      
      // 2. Try fetching from Supabase for real-time online updates!
      const studentEmail = user?.email || "aluno@abbadigital.com";
      const { data, error } = await supabase
        .from('subject_comments')
        .select('*')
        .eq('student_email', studentEmail)
        .eq('subject', subject)
        .maybeSingle();
      
      if (!error && data) {
        setChatMessage(data.comment_text || null);
        setTeacherReply(data.teacher_reply || null);
        setChatInput(""); // Always empty on load!
        
        // Keep localStorage updated
        const updatedComments = {
          ...allComments,
          [subject]: {
            comment: data.comment_text,
            reply: data.teacher_reply
          }
        };
        localStorage.setItem('abba_subject_comments', JSON.stringify(updatedComments));
      }
    } catch (err) {
      console.warn('Erro ao carregar comentário do Supabase:', err);
    }
  };

  // Save comment for a subject
  const handleSaveComment = async (textToSave: string, shouldClose = true) => {
    if (!chatSubject) return;
    if (!textToSave.trim()) {
      if (shouldClose) {
        setShowChatModal(false);
        return;
      }
      alert("Por favor, digite uma mensagem antes de salvar.");
      return;
    }

    const studentName = activeReviewSubmission ? activeReviewSubmission.studentName : (user?.name || "Estudante");
    const studentEmail = activeReviewSubmission ? (activeReviewSubmission.studentEmail || "aluno@abbadigital.com") : (user?.email || "aluno@abbadigital.com");

    const isTeacher = user?.role === 'teacher';

    // 1. Get current list of messages
    const currentMessages = getConversationMessages(chatMessage, teacherReply);

    // 2. Append new message
    const newMsg = {
      role: isTeacher ? 'teacher' : 'student',
      text: textToSave.trim(),
      senderName: isTeacher ? (user?.name || "Professor") : studentName,
      timestamp: new Date().toISOString()
    };
    const updatedMessages = [...currentMessages, newMsg];
    const serialized = JSON.stringify(updatedMessages);

    // 3. Update state
    setChatMessage(serialized);
    setReviewCommentText(serialized);
    if (isTeacher) {
      setTeacherReply(textToSave.trim());
      setReviewTeacherReplySaved(textToSave.trim());
      setReviewTeacherReplyInput("");
    }

    // Always clear text input after saving/sending!
    setChatInput("");

    // 4. Save to localStorage
    try {
      const allCommentsRaw = localStorage.getItem('abba_subject_comments');
      const allComments = allCommentsRaw ? JSON.parse(allCommentsRaw) : {};
      allComments[chatSubject] = {
        comment: serialized,
        reply: isTeacher ? textToSave.trim() : (teacherReply || "")
      };
      localStorage.setItem('abba_subject_comments', JSON.stringify(allComments));
    } catch (e) {
      console.error(e);
    }

    // 5. Try to save to Supabase
    try {
      const { error } = await supabase
        .from('subject_comments')
        .upsert({
          student_name: studentName,
          student_email: studentEmail,
          subject: chatSubject,
          comment_text: serialized,
          teacher_reply: isTeacher ? textToSave.trim() : (teacherReply || ""),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'student_email,subject'
        });
      
      if (!error) {
        console.log("Comentário salvo no Supabase com sucesso!");
      }
    } catch (err) {
      console.warn("Erro ao enviar comentário para o Supabase (silencioso):", err);
    }

    // 6. Log User Action
    await logUserAction({
      userName: user?.name || studentName,
      userEmail: user?.email || studentEmail,
      role: isTeacher ? 'teacher' : 'student',
      actionType: isTeacher ? 'teacher_comment_saved' : 'subject_comment_saved',
      actionDetails: isTeacher 
        ? `Respondeu ao comentário do aluno ${studentName} na matéria "${chatSubject}": "${textToSave.trim()}"`
        : `Comentou na matéria "${chatSubject}": "${textToSave.trim()}"`
    });

    if (shouldClose) {
      alert(isTeacher ? "Resposta salva e enviada com sucesso! 🚀" : "Mensagem salva e enviada com sucesso! 🚀");
      setShowChatModal(false);
    } else {
      console.log("Mensagem adicionada com sucesso no histórico!");
    }
  };

  // Delete comment permanently
  const handleDeleteComment = async () => {
    if (!chatSubject) return;
    if (!chatMessage) {
      alert("Não há mensagem salva para excluir! 📝");
      return;
    }
    if (!window.confirm("Tem certeza que deseja excluir o comentário permanentemente?")) {
      return;
    }

    const studentName = user?.name || "Estudante";
    const studentEmail = user?.email || "aluno@abbadigital.com";

    // 1. Reset state
    setChatMessage(null);
    setTeacherReply(null);
    setChatInput("");

    // 2. Delete from localStorage
    try {
      const allCommentsRaw = localStorage.getItem('abba_subject_comments');
      if (allCommentsRaw) {
        const allComments = JSON.parse(allCommentsRaw);
        delete allComments[chatSubject];
        localStorage.setItem('abba_subject_comments', JSON.stringify(allComments));
      }
    } catch (e) {
      console.error(e);
    }

    // 3. Delete from Supabase
    try {
      const { error } = await supabase
        .from('subject_comments')
        .delete()
        .eq('student_email', studentEmail)
        .eq('subject', chatSubject);
      
      if (!error) {
        console.log("Comentário deletado do Supabase com sucesso!");
      }
    } catch (err) {
      console.warn("Erro ao deletar comentário do Supabase:", err);
    }

    // 4. Log User Action
    await logUserAction({
      userName: studentName,
      userEmail: studentEmail,
      role: 'student',
      actionType: 'subject_comment_deleted',
      actionDetails: `Excluiu o comentário da matéria "${chatSubject}"`
    });

    alert("Comentário removido permanentemente! 🗑️");
  };

  // Review mode board state backup
  const [savedBoardState, setSavedBoardState] = useState<{
    spelledRows: SpelledLetter[][];
    rowColors: Record<number, 'black' | 'blue' | 'red' | 'green'>;
    rowIds: string[];
    cutWiresRows: Record<number, boolean>;
  } | null>(null);

  // Sync URL hash with current screen
  useEffect(() => {
    const screenToHash: Record<string, string> = {
      'login': 'login',
      'signup': 'login',
      'teacher-dashboard': 'professor',
      'student-dashboard': 'aluno',
      'abacus': '',
    };
    const newHash = screenToHash[currentScreen] || '';
    const currentHash = window.location.hash.replace('#/', '').replace('#', '');
    if (newHash !== currentHash) {
      if (newHash) {
        window.history.replaceState(null, '', `#/${newHash}`);
      } else {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
  }, [currentScreen]);

  // Listen for browser back/forward hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '');
      if (hash === 'login') setCurrentScreen('login');
      else if (hash === 'professor') setCurrentScreen('teacher-dashboard');
      else if (hash === 'aluno') setCurrentScreen('student-dashboard');
      else setCurrentScreen('abacus');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Automatically scroll to the top of the viewport when changing screens or viewing submissions/tasks
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentScreen, activeReviewSubmission, activeTaskInfo]);

  useEffect(() => {
    localStorage.setItem('abba_completed_spelled_words', JSON.stringify(completedSpelledWords));
  }, [completedSpelledWords]);



  // Session validation interval for offline unique access code
  useEffect(() => {
    const interval = setInterval(() => {
      if (user && user.codeSession) {
        if (Date.now() > user.codeSession.expiresAt) {
          setUser(null);
          localStorage.removeItem('abba_logged_in_user');
          localStorage.removeItem('abba_completed_spelled_words');
          localStorage.removeItem('abba_student_sent_activities');
          localStorage.removeItem('abba_student_accepted_links');
          localStorage.removeItem('savedWords');
          setCompletedSpelledWords([]);
          setIsSessionExpiredOpen(true);
          setCurrentScreen('login');
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [user]);

  // Protect Teacher and Student Dashboards from unauthorized access
  useEffect(() => {
    if (currentScreen === 'teacher-dashboard') {
      if (!user || user.role !== 'teacher') {
        setCurrentScreen('login');
      }
    } else if (currentScreen === 'student-dashboard') {
      if (!user || user.role !== 'student') {
        setCurrentScreen('login');
      }
    }
  }, [currentScreen, user]);

  // Process import link query parameter or auto fixed code login on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // 1. Fixed codes auto login
    const code = params.get('code');
    if (code) {
      const upperCode = code.trim().toUpperCase();
      if (upperCode === 'PROF123') {
        const teacherUser: User = {
          name: 'José Décio de Alencar',
          email: 'inglesdecio@gmail.com',
          role: 'teacher'
        };
        setUser(teacherUser);
        localStorage.setItem('abba_logged_in_user', JSON.stringify(teacherUser));
        setCurrentScreen('teacher-dashboard');
        setShowLanding(false);
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      } else if (upperCode === 'ALUNO123') {
        const studentUser: User = {
          name: 'Aluno Fixo',
          email: 'alunofixo@gmail.com',
          role: 'student',
          codeSession: {
            code: 'ALUNO123',
            expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
            codeId: 'student-fixed-id'
          }
        };
        setUser(studentUser);
        localStorage.setItem('abba_logged_in_user', JSON.stringify(studentUser));
        setCurrentScreen('student-dashboard');
        setShowLanding(false);
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }
    }

    // 2. Import Magic link
    const importParam = params.get('import');
    if (importParam) {
      try {
        const decodedJson = decodeURIComponent(escape(atob(importParam)));
        const submission = JSON.parse(decodedJson) as StudentSubmission;
        if (submission.studentName && submission.spelledWords) {
          if (!user) {
            const reviewProf: User = {
              name: 'Prof. Revisor Importado',
              email: 'revisor@abba.com',
              role: 'teacher'
            };
            setUser(reviewProf);
            localStorage.setItem('abba_logged_in_user', JSON.stringify(reviewProf));
          }
          
          // Load submission spelled words into spelledRows
          const newSpelledRows: SpelledLetter[][] = [[], [], [], [], [], []];
          const newRowColors: Record<number, 'black' | 'blue' | 'red' | 'green'> = {};
          
          submission.spelledWords.forEach((wordObj, idx) => {
            if (idx < 6) {
              const col = normalizeColor(wordObj.themeColor);
              newSpelledRows[idx] = wordObj.letters.map(l => ({
                ...l,
                color: normalizeColor(l.color || col)
              }));
              if (col === '#0004FD') newRowColors[idx] = 'blue';
              else if (col === '#FF0000') newRowColors[idx] = 'red';
              else if (col === '#009246') newRowColors[idx] = 'green';
              else newRowColors[idx] = 'black';
            }
          });
          
          setSpelledRows(newSpelledRows);
          setRowColors(newRowColors);
          setIsTeacherEditingReview(false);
          setTeacherReviewSavedChoice(submission.teacherSavedChoice || 'student');
          setIsTeacherSaveModalOpen(false);
          setActiveReviewSubmission(submission);
          setCurrentScreen('abacus');
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (err) {
        console.error('Error importing magic link:', err);
      }
    }
  }, []);

  const handleLaunchReviewMode = (submission: StudentSubmission) => {
    setSavedBoardState({
      spelledRows,
      rowColors,
      rowIds,
      cutWiresRows
    });
    
    setIsTeacherEditingReview(false);
    setTeacherReviewSavedChoice(submission.teacherSavedChoice || 'student');
    setIsTeacherSaveModalOpen(false);

    const newSpelledRows: SpelledLetter[][] = [[], [], [], [], [], []];
    const newRowColors: Record<number, 'black' | 'blue' | 'red' | 'green'> = {};
    
    submission.spelledWords.forEach((wordObj, idx) => {
      if (idx < 6) {
        const col = normalizeColor(wordObj.themeColor);
        newSpelledRows[idx] = wordObj.letters.map(l => ({
          ...l,
          color: normalizeColor(l.color || col)
        }));
        if (col === '#0004FD') newRowColors[idx] = 'blue';
        else if (col === '#FF0000') newRowColors[idx] = 'red';
        else if (col === '#009246') newRowColors[idx] = 'green';
        else newRowColors[idx] = 'black';
      }
    });
    
    setSpelledRows(newSpelledRows);
    setRowColors(newRowColors);
    setActiveReviewSubmission(submission);
    setCurrentScreen('abacus');
  };

  const handleSaveAndSubmitActivity = async () => {
    if (!activeTaskInfo) return;
    
    // Build newWords directly from the current live board state spelledRows!
    const newWords: SavedWord[] = [];
    spelledRows.forEach((row, idx) => {
      const wordstr = row.map(l => l.letter).join("").trim();
      if (wordstr.length > 0) {
        const colorKey = rowColors[idx];
        let wireColor = '#0004FD'; // fallback
        if (colorKey === 'black') wireColor = '#000000';
        else if (colorKey === 'blue') wireColor = '#0004FD';
        else if (colorKey === 'red') wireColor = '#FF0000';
        else if (colorKey === 'green') wireColor = '#009246';

        newWords.push({
          word: wordstr,
          letters: row.filter(l => l && l.letter),
          themeColor: wireColor
        });
      }
    });

    setSavedWordsList(newWords);
    localStorage.setItem('savedWords', JSON.stringify(newWords));

    setCompletedSpelledWords(prev => {
      const merged = [...prev];
      newWords.forEach(nw => {
        if (!merged.some(m => m.word.toUpperCase() === nw.word.toUpperCase())) {
          merged.push(nw);
        }
      });
      return merged;
    });

    const studentName = user?.name || "Estudante";
    const studentEmail = user?.email || "aluno@abbadigital.com";
    const taskTitle = activeTaskInfo.title;
    
    const newSentItem = {
      id: `SUB-${Date.now()}`,
      studentName,
      studentEmail,
      taskTitle,
      submittedAt: new Date().toISOString(),
      spelledWordsCount: newWords.length,
      words: newWords
    };

    // Save board state for this task specifically so that when the student opens it next time, they see the edited version!
    try {
      const boardStateObj = {
        spelledRows,
        rowColors,
        rowIds,
        cutWiresRows,
        savedWordsList: newWords
      };
      localStorage.setItem(`abba_board_state_${taskTitle}`, JSON.stringify(boardStateObj));
    } catch (e) {
      console.error(e);
    }

    try {
      const localSent = localStorage.getItem('abba_student_sent_activities');
      let sentList = localSent ? JSON.parse(localSent) : [];
      const existingIdx = sentList.findIndex((item: any) => item.taskTitle === taskTitle);
      if (existingIdx !== -1) {
        sentList[existingIdx] = {
          ...sentList[existingIdx],
          spelledWordsCount: newWords.length,
          words: newWords,
          submittedAt: newSentItem.submittedAt
        };
      } else {
        sentList.unshift(newSentItem);
      }
      localStorage.setItem('abba_student_sent_activities', JSON.stringify(sentList));
    } catch (e) {
      console.error(e);
    }

    // Salvar na fila de não sincronizados para resiliência offline-online total!
    const submissionPayload = {
      student_name: studentName,
      student_email: studentEmail,
      task_title: taskTitle,
      submitted_at: newSentItem.submittedAt,
      spelled_words_count: newSentItem.spelledWordsCount,
      spelled_words: JSON.stringify(newWords),
      task_files: JSON.stringify([])
    };

    try {
      const unsynced = JSON.parse(localStorage.getItem('abba_unsynced_student_submissions') || '[]');
      unsynced.push(submissionPayload);
      localStorage.setItem('abba_unsynced_student_submissions', JSON.stringify(unsynced));
    } catch (e) {
      console.error('Erro ao salvar submissão offline:', e);
    }

    try {
      // Check if submission already exists in Supabase
      const { data: existingSub, error: findError } = await supabase
        .from('student_submissions')
        .select('id')
        .eq('student_email', studentEmail)
        .eq('task_title', taskTitle)
        .maybeSingle();

      let query;
      if (!findError && existingSub) {
        // Update existing submission
        query = supabase
          .from('student_submissions')
          .update({
            submitted_at: submissionPayload.submitted_at,
            spelled_words_count: submissionPayload.spelled_words_count,
            spelled_words: submissionPayload.spelled_words
          })
          .eq('student_email', studentEmail)
          .eq('task_title', taskTitle);
      } else {
        // Insert new submission
        query = supabase
          .from('student_submissions')
          .insert([submissionPayload]);
      }

      const { error } = await query;
      if (!error) {
        await logUserAction({
          userName: studentName,
          userEmail: studentEmail,
          role: 'student',
          actionType: 'task_submission',
          actionDetails: `Concluiu a tarefa ativa "${taskTitle}" com ${newSentItem.spelledWordsCount} palavras soletradas.`
        });
        console.log('⚡ Submission synced with Supabase from active task!');
        
        // Se sincronizou com sucesso, remover da fila
        try {
          const unsynced = JSON.parse(localStorage.getItem('abba_unsynced_student_submissions') || '[]');
          const remaining = unsynced.filter((item: any) => 
            !(item.student_name === studentName && item.task_title === taskTitle)
          );
          localStorage.setItem('abba_unsynced_student_submissions', JSON.stringify(remaining));
        } catch (e) {
          console.error('Erro ao atualizar fila de submissões:', e);
        }
      } else {
        console.warn('Erro ao salvar submissão no Supabase:', error);
      }
    } catch (err) {
      console.warn('Erro ao salvar submissão no Supabase:', err);
    }

    setLastSavedTask({
      title: taskTitle,
      words: newWords,
      code: newSentItem.id
    });
    setIsStudentEditing(false);

    setIsSavingActivity(false);
    
    // Alerta imediato e abertura do modal premium de upload/chat
    alert("Atividade salva com sucesso! 🚀");
    
    setChatSubject(taskTitle);
    await loadCommentForSubject(taskTitle);
    setShowChatModal(true);
  };

  const handleDownloadTaskCode = () => {
    if (!lastSavedTask) return;
    
    try {
      const dateStr = new Date().toLocaleDateString('pt-BR');
      const studentName = user?.name || "Estudante";
      const taskTitle = lastSavedTask.title;
      const completedWords = lastSavedTask.words;
      const submissionCode = lastSavedTask.code || `SUB-${Date.now()}`;

      let spelledWordsText = "";
      if (completedWords.length === 0) {
        spelledWordsText = "Nenhuma palavra gravada ainda no ábaco.";
      } else {
        completedWords.forEach((wordObj, i) => {
          let langName = "Português";
          if (wordObj.themeColor === 'blue' || wordObj.themeColor === '#0052cc') langName = "Inglês";
          else if (wordObj.themeColor === 'red' || wordObj.themeColor === '#ef4444') langName = "Alemão";
          else if (wordObj.themeColor === 'green' || wordObj.themeColor === '#10b981') langName = "Italiano";

          spelledWordsText += `${i + 1}. ${wordObj.word} (${langName})\n`;
        });
      }

      const textContent = `==================================================
        ABBA DIGITAL - CONFIRMAÇÃO DE ATIVIDADE
==================================================

Estudante: ${studentName}
Tarefa: ${taskTitle}
Data de Conclusão: ${dateStr}

--------------------------------------------------
CÓDIGO DE CONFIRMAÇÃO DA ATIVIDADE:
👉 ${submissionCode}
--------------------------------------------------

Palavras Soletradas no Ábaco Digital:
${spelledWordsText}
==================================================
Relatório gerado em tempo real pelo Ábaco Digital.
Acesse: abba-digital.vercel.app | Suporte Pedagógico
==================================================`;

      const element = document.createElement("a");
      const file = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      element.href = URL.createObjectURL(file);
      element.download = `confirmacao-${taskTitle.toLowerCase().replace(/\s+/g, '-')}-${studentName.toLowerCase().replace(/\s+/g, '-')}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (error) {
      console.error("Erro ao gerar arquivo de confirmação:", error);
      alert("Houve um erro ao gerar o arquivo de confirmação. Tente novamente.");
    }
  };

  const handleSaveReviewSubmission = async () => {
    if (!activeReviewSubmission) return;

    const studentOriginalWords = activeReviewSubmission.originalStudentWords || activeReviewSubmission.spelledWords || [];

    // Build words list from current edited board layout
    const newWords: SavedWord[] = [];
    spelledRows.forEach((row, idx) => {
      const wordstr = row.map(l => l.letter).join('');
      if (wordstr) {
        let themeColor = 'black';
        if (rowColors[idx] === 'blue') themeColor = '#0052cc';
        else if (rowColors[idx] === 'red') themeColor = '#ef4444';
        else if (rowColors[idx] === 'green') themeColor = '#10b981';
        
        newWords.push({
          word: wordstr,
          letters: row.filter(l => l && l.letter),
          themeColor: themeColor
        });
      }
    });

    const checkIfDifferent = (a: SavedWord[], b: SavedWord[]) => {
      if (a.length !== b.length) return true;
      for (let i = 0; i < a.length; i++) {
        if (a[i].word !== b[i].word) return true;
        
        // normalize theme colors for perfect comparison
        const colA = normalizeColor(a[i].themeColor);
        const colB = normalizeColor(b[i].themeColor);
        if (colA !== colB) return true;
        
        if (a[i].letters.length !== b[i].letters.length) return true;
        for (let j = 0; j < a[i].letters.length; j++) {
          if (a[i].letters[j].letter !== b[i].letters[j].letter) return true;
          const letterColA = normalizeColor(a[i].letters[j].color);
          const letterColB = normalizeColor(b[i].letters[j].color);
          if (letterColA !== letterColB) return true;
        }
      }
      return false;
    };

    const hasChanges = checkIfDifferent(newWords, studentOriginalWords);

    if (hasChanges) {
      setTeacherReviewSavedChoice('teacher'); // default choice in radio
      setIsTeacherSaveModalOpen(true);
    } else {
      // No changes made or reverted back to student's original, save as student's original directly
      await handleConfirmSaveReview('student');
    }
  };

  const handleConfirmSaveReview = async (choice: 'teacher' | 'student') => {
    if (!activeReviewSubmission) return;

    const studentName = activeReviewSubmission.studentName;
    const studentEmail = activeReviewSubmission.studentEmail || "aluno@abbadigital.com";
    const taskTitle = activeReviewSubmission.taskTitle;
    const studentOriginalWords = activeReviewSubmission.originalStudentWords || activeReviewSubmission.spelledWords || [];

    // Build current board words
    const newWords: SavedWord[] = [];
    spelledRows.forEach((row, idx) => {
      const wordstr = row.map(l => l.letter).join('');
      if (wordstr) {
        let themeColor = 'black';
        if (rowColors[idx] === 'blue') themeColor = '#0052cc';
        else if (rowColors[idx] === 'red') themeColor = '#ef4444';
        else if (rowColors[idx] === 'green') themeColor = '#10b981';
        
        newWords.push({
          word: wordstr,
          letters: row.filter(l => l && l.letter),
          themeColor: themeColor
        });
      }
    });

    const finalWordsToSave = choice === 'teacher' ? newWords : studentOriginalWords;

    const payloadSpelledWords = {
      isTeacherEdited: true,
      teacherSavedChoice: choice,
      originalStudentWords: studentOriginalWords,
      words: finalWordsToSave
    };

    const serialized = JSON.stringify(payloadSpelledWords);

    // 1. Update submissions locally in teacher's list
    try {
      const localSent = localStorage.getItem('abba_student_submissions');
      const sentList = localSent ? JSON.parse(localSent) : [];
      const updatedList = sentList.map((sub: any) => {
        if (sub.id === activeReviewSubmission.id || (sub.studentName === studentName && sub.taskTitle === taskTitle)) {
          return {
            ...sub,
            spelledWords: finalWordsToSave,
            reviewed: true,
            teacherEdited: true,
            teacherSavedChoice: choice,
            originalStudentWords: studentOriginalWords
          };
        }
        return sub;
      });
      localStorage.setItem('abba_student_submissions', JSON.stringify(updatedList));
    } catch (e) {
      console.error(e);
    }
    
    // Also update student's own list locally
    try {
      const localSent = localStorage.getItem('abba_student_sent_activities');
      const sentList = localSent ? JSON.parse(localSent) : [];
      const updatedList = sentList.map((sub: any) => {
        if (sub.id === activeReviewSubmission.id || (sub.studentName === studentName && sub.taskTitle === taskTitle)) {
          return {
            ...sub,
            words: finalWordsToSave,
            spelledWordsCount: finalWordsToSave.length
          };
        }
        return sub;
      });
      localStorage.setItem('abba_student_sent_activities', JSON.stringify(updatedList));
    } catch (e) {
      console.error(e);
    }

    // Save board state for this task specifically so that when the student opens it next time, they see the edited version!
    try {
      const boardStateObj = {
        spelledRows: choice === 'teacher' ? spelledRows : [],
        rowColors: choice === 'teacher' ? rowColors : {},
        rowIds,
        cutWiresRows: choice === 'teacher' ? cutWiresRows : {},
        savedWordsList: finalWordsToSave
      };
      if (choice === 'student') {
        const tempSpelledRows: SpelledLetter[][] = [[], [], [], [], [], []];
        const tempRowColors: Record<number, 'black' | 'blue' | 'red' | 'green'> = {};
        studentOriginalWords.forEach((wordObj, idx) => {
          if (idx < 6) {
            const col = normalizeColor(wordObj.themeColor);
            tempSpelledRows[idx] = wordObj.letters.map(l => ({
              ...l,
              color: normalizeColor(l.color || col)
            }));
            if (col === '#0004FD') tempRowColors[idx] = 'blue';
            else if (col === '#FF0000') tempRowColors[idx] = 'red';
            else if (col === '#009246') tempRowColors[idx] = 'green';
            else tempRowColors[idx] = 'black';
          }
        });
        boardStateObj.spelledRows = tempSpelledRows;
        boardStateObj.rowColors = tempRowColors;
      }
      localStorage.setItem(`abba_board_state_${taskTitle}`, JSON.stringify(boardStateObj));
    } catch (e) {
      console.error(e);
    }

    // 2. Save in Supabase
    try {
      const { error } = await supabase
        .from('student_submissions')
        .update({
          spelled_words: serialized,
          reviewed: true
        })
        .eq('student_email', studentEmail)
        .eq('task_title', taskTitle);
      
      if (!error) {
        console.log("Submissão do aluno revisada e salva no Supabase!");
      }
    } catch (err) {
      console.warn("Erro ao atualizar submissão no Supabase:", err);
    }
    
    // 3. Log Action
    await logUserAction({
      userName: user?.name || "José Décio de Alencar",
      userEmail: user?.email || "inglesdecio@gmail.com",
      role: 'teacher',
      actionType: 'teacher_submission_reviewed',
      actionDetails: choice === 'teacher' 
        ? `Salvou revisão com alterações no tabuleiro para o aluno ${studentName} na tarefa "${taskTitle}".`
        : `Salvou revisão mantendo o original do aluno ${studentName} na tarefa "${taskTitle}".`
    });

    // 4. Alert "Tarefa salva"
    alert("Tarefa salva");

    // 5. If choice was 'student', reload the board to the student's original layout immediately
    if (choice === 'student') {
      const tempSpelledRows: SpelledLetter[][] = [[], [], [], [], [], []];
      const tempRowColors: Record<number, 'black' | 'blue' | 'red' | 'green'> = {};
      studentOriginalWords.forEach((wordObj, idx) => {
        if (idx < 6) {
          const col = normalizeColor(wordObj.themeColor);
          tempSpelledRows[idx] = wordObj.letters.map(l => ({
            ...l,
            color: normalizeColor(l.color || col)
          }));
          if (col === '#0004FD') tempRowColors[idx] = 'blue';
          else if (col === '#FF0000') tempRowColors[idx] = 'red';
          else if (col === '#009246') tempRowColors[idx] = 'green';
          else tempRowColors[idx] = 'black';
        }
      });
      setSpelledRows(tempSpelledRows);
      setRowColors(tempRowColors);
    }

    // 6. Reset editing state
    setIsTeacherEditingReview(false);

    // 7. Open chat modal
    setChatSubject(taskTitle);
    await loadCommentForSubject(taskTitle);
    setShowChatModal(true);
  };

  const handleCloseReviewMode = () => {
    setIsTeacherEditingReview(false);
    setIsTeacherSaveModalOpen(false);
    if (savedBoardState) {
      setSpelledRows(savedBoardState.spelledRows);
      setRowColors(savedBoardState.rowColors);
      setRowIds(savedBoardState.rowIds);
      setCutWiresRows(savedBoardState.cutWiresRows);
    }

    if (activeReviewSubmission) {
      try {
        const local = localStorage.getItem('abba_student_submissions');
        if (local) {
          const subs = JSON.parse(local);
          const updated = subs.map((s: any) => {
            if (s.id === activeReviewSubmission.id || (s.studentName === activeReviewSubmission.studentName && s.taskTitle === activeReviewSubmission.taskTitle)) {
              return { ...s, reviewed: true };
            }
            return s;
          });
          localStorage.setItem('abba_student_submissions', JSON.stringify(updated));
        }
      } catch (err) {
        console.error("Erro ao salvar status de revisado:", err);
      }
    }

    setActiveReviewSubmission(null);
    setCurrentScreen('teacher-dashboard');
  };

  const handleLaunchSpellingTask = (word: string, language: 'pt' | 'en' | 'de', color: string) => {
    setActiveSpellingTarget({ word, language, color });
    
    // Auto-setup active row and thread color
    let targetRowIdx = activeRowIdx;
    for (let i = 0; i < spelledRows.length; i++) {
      if (spelledRows[i].length === 0) {
        targetRowIdx = i;
        break;
      }
    }
    
    setActiveRowIdx(targetRowIdx);
    const colKey = color === '#3b82f6' ? 'blue' : color === '#ef4444' ? 'red' : color === '#10b981' ? 'green' : 'black';
    setRowColors(prev => ({
      ...prev,
      [targetRowIdx]: colKey
    }));
    
    setCurrentScreen('abacus');
  };

  // Ref for scrolling to the enter button on landing page
  const enterButtonRef = useRef<HTMLDivElement>(null);

  const handleScrollToButton = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    enterButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  // MULTI-LINE SPELLING BOARD STATE
  const [spelledRows, setSpelledRows] = useState<SpelledLetter[][]>([[], [], [], [], [], []]);
  const [rowIds, setRowIds] = useState<string[]>(() => [
    'row-initial-1-' + Math.random().toString(36).substring(2, 11),
    'row-initial-2-' + Math.random().toString(36).substring(2, 11),
    'row-initial-3-' + Math.random().toString(36).substring(2, 11),
    'row-initial-4-' + Math.random().toString(36).substring(2, 11),
    'row-initial-5-' + Math.random().toString(36).substring(2, 11),
    'row-initial-6-' + Math.random().toString(36).substring(2, 11)
  ]);

  // Spelling rows dynamic lifecycle useEffect is defined below after drag state declarations.

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
  type UndoHistoryItem = 
    | { type: 'row'; row: SpelledLetter[]; index: number; color?: 'black' | 'blue' | 'red' | 'green'; rowId?: string; cutWires?: boolean; activeMode?: 'save' | 'scissors' | 'trash' | null }
    | { type: 'block'; letter: SpelledLetter; rIdx: number; lIdx: number };

  const [undoHistory, setUndoHistory] = useState<UndoHistoryItem[]>([]);
  const lastActionTimeRef = useRef<number>(0);
  
  // Loaded static saved word list in localStore
  const [savedWordsList, setSavedWordsList] = useState<SavedWord[]>(() => {
    try {
      const saved = localStorage.getItem('savedWords');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.map((item: string | SavedWord) => {
          if (typeof item === 'string') {
            // Converts legacy string word into default spelled letter objects for continuity
            const letters: SpelledLetter[] = item.split('').map((char, index) => ({
              id: `legacy-${item}-${index}-${Math.random()}`,
              letter: char,
              originCubeId: getShelfCubeIdForLetter(char),
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

  // Synchronize savedWordsList with spelledRows in real-time to keep detailed letters and positions in perfect sync
  useEffect(() => {
    const list: SavedWord[] = [];
    spelledRows.forEach((row, idx) => {
      const wordstr = row.map(l => l.letter).join("").trim();
      if (wordstr.length > 0) {
        const colorKey = rowColors[idx];
        let wireColor = '#0004FD'; // fallback
        if (colorKey === 'black') wireColor = '#000000';
        else if (colorKey === 'blue') wireColor = '#0004FD';
        else if (colorKey === 'red') wireColor = '#FF0000';
        else if (colorKey === 'green') wireColor = '#009246';

        list.push({
          word: wordstr,
          letters: row.filter(l => l && l.letter),
          themeColor: wireColor
        });
      }
    });

    setSavedWordsList(list);
    localStorage.setItem('savedWords', JSON.stringify(list));
  }, [spelledRows, rowColors]);

  // Save abacus board progress automatically in real-time when the student is working on a task/subject
  useEffect(() => {
    if (activeTaskInfo && activeTaskInfo.title) {
      const boardStateObj = {
        spelledRows,
        rowColors,
        rowIds,
        cutWiresRows,
        savedWordsList
      };
      localStorage.setItem(`abba_board_state_${activeTaskInfo.title}`, JSON.stringify(boardStateObj));
    }
  }, [spelledRows, rowColors, rowIds, cutWiresRows, savedWordsList, activeTaskInfo]);

  const handleOpenSaveModal = (rIdx: number) => {
    if (teacherDraftingTask) {
      alert("No modo de configuração de rascunho, utilize o botão 'Salvar Palavras' no banner azul localizado no topo do painel para gravar as palavras do rascunho de atividade.");
      return;
    }
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
  const activeScrollingTimeoutRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const previousLengthsRef = useRef<number[]>([]);

  // Splash/Landing screen state managers (blank screen first -> smooth fade-in logo -> rest of content)
  const [showLanding, setShowLanding] = useState<boolean>(() => {
    const hash = window.location.hash.replace('#/', '').replace('#', '');
    if (hash === 'login' || hash === 'professor' || hash === 'aluno') return false;
    const params = new URLSearchParams(window.location.search);
    if (params.has('import') || params.has('code')) return false;
    const saved = localStorage.getItem('abba_logged_in_user');
    if (saved) return false;
    return true;
  });
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
        document.body.style.overflow = '';
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
        : '#0004FD';

  const getRowColor = (rIdx: number): string => {
    const colorKey = rowColors[rIdx];
    if (colorKey === 'black') return '#000000';
    if (colorKey === 'blue') return '#0004FD';
    if (colorKey === 'red') return '#FF0000';
    if (colorKey === 'green') return '#009246';
    return themeColor;
  };

  const getDragPreviewColor = (): string => {
    if (dragHoverInfo !== null) {
      const targetRowIdx = dragHoverInfo.rIdx;
      const targetRow = spelledRows[targetRowIdx];
      if (targetRow && targetRow.length > 0) {
        const existingBlock = targetRow.find(item => {
          if (draggedTrayIndex !== null && draggedTrayIndex.rIdx === targetRowIdx && item.id === draggedBoardLetter?.id) {
            return false;
          }
          return true;
        });
        if (existingBlock) {
          return existingBlock.color || getRowColor(targetRowIdx);
        }
      }
    }
    if (draggedTrayIndex !== null && draggedBoardLetter !== null) {
      return draggedBoardLetter.color || getRowColor(draggedTrayIndex.rIdx);
    }
    return themeColor;
  };


  // Lock starting color when first letter is spelling
  useEffect(() => {
    let changed = false;
    const newColors = { ...rowColors };
    spelledRows.forEach((row, idx) => {
      if (row.length > 0 && !newColors[idx]) {
        const colorName = themeColor === '#0004FD' ? 'blue' : themeColor === '#FF0000' ? 'red' : themeColor === '#009246' ? 'green' : 'black';
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
        return <img src="/icones/BRAZIL FLAG.svg" alt="Brasil" className="w-6 h-[17px] rounded-[3px] shadow-[0_1px_3px_rgba(0,0,0,0.15)] border border-gray-150 shrink-0 object-cover" />;
      case 'germany':
        return <img src="/icones/GERMANY FLAG.svg" alt="Alemanha" className="w-6 h-[17px] rounded-[3px] shadow-[0_1px_3px_rgba(0,0,0,0.15)] border border-gray-150 shrink-0 object-cover" />;
      case 'italy':
        return <img src="/icones/ITALY FLAG.svg" alt="Itália" className="w-6 h-[17px] rounded-[3px] shadow-[0_1px_3px_rgba(0,0,0,0.15)] border border-gray-150 shrink-0 object-cover" />;
      case 'usa':
        return <img src="/icones/EUA FLAG.svg" alt="EUA" className="w-6 h-[17px] rounded-[3px] shadow-[0_1px_3px_rgba(0,0,0,0.15)] border border-gray-150 shrink-0 object-cover" />;
    }
  };

  const renderSpecificFlag = (flag: string) => {
    switch (flag) {
      case 'brazil':
        return <img src="/icones/BRAZIL FLAG.svg" alt="Brasil" className="w-full h-full object-cover" />;
      case 'germany':
        return <img src="/icones/GERMANY FLAG.svg" alt="Alemanha" className="w-full h-full object-cover" />;
      case 'italy':
        return <img src="/icones/ITALY FLAG.svg" alt="Itália" className="w-full h-full object-cover" />;
      case 'usa':
        return <img src="/icones/EUA FLAG.svg" alt="EUA" className="w-full h-full object-cover" />;
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

  // Synchronized refs for high-performance zero-rebound window pointer listeners
  const draggedCubeRef = useRef<LetterCubeData | null>(draggedCube);
  const draggedLetterRef = useRef<string | null>(draggedLetter);
  const draggedTrayIndexRef = useRef<{ rIdx: number; lIdx: number } | null>(draggedTrayIndex);
  const draggedBoardLetterRef = useRef<SpelledLetter | null>(draggedBoardLetter);
  const draggedShelfIndexRef = useRef<number | null>(draggedShelfIndex);
  const trayDragStartRef = useRef<{ index: number; x: number; y: number; letterObj: SpelledLetter; rowIdx: number; time: number } | null>(trayDragStart);
  const activeRowIdxRef = useRef<number>(activeRowIdx);
  const spelledRowsRef = useRef<SpelledLetter[][]>(spelledRows);
  const themeColorRef = useRef<string>(themeColor);

  useEffect(() => { draggedCubeRef.current = draggedCube; }, [draggedCube]);
  useEffect(() => { draggedLetterRef.current = draggedLetter; }, [draggedLetter]);
  useEffect(() => { draggedTrayIndexRef.current = draggedTrayIndex; }, [draggedTrayIndex]);
  useEffect(() => { draggedBoardLetterRef.current = draggedBoardLetter; }, [draggedBoardLetter]);
  useEffect(() => { draggedShelfIndexRef.current = draggedShelfIndex; }, [draggedShelfIndex]);
  useEffect(() => { trayDragStartRef.current = trayDragStart; }, [trayDragStart]);
  useEffect(() => { activeRowIdxRef.current = activeRowIdx; }, [activeRowIdx]);
  useEffect(() => { spelledRowsRef.current = spelledRows; }, [spelledRows]);
  useEffect(() => { themeColorRef.current = themeColor; }, [themeColor]);

  // Keep spelling rows neat & automatically manage empty rows based on drag state
  const isCurrentlyDragging = draggedCube !== null || draggedTrayIndex !== null || draggedShelfIndex !== null;



  // Synchronize rowIds with spelledRows length for dynamic padding/trimming
  useEffect(() => {
    setRowIds(prev => {
      if (prev.length === spelledRows.length) return prev;
      if (spelledRows.length > prev.length) {
        const next = [...prev];
        while (next.length < spelledRows.length) {
          next.push('row-' + Math.random().toString(36).substring(2, 11));
        }
        return next;
      } else {
        return prev.slice(0, spelledRows.length);
      }
    });
  }, [spelledRows.length]);

  // Double tap handler refs
  const lastClicksRef = useRef<Record<string, number>>({});
  const clickTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Velocity-tracking and predictive cursor refs to ensure zero lag / high-speed tracking
  const dragVelocityRef = useRef({ x: 0, y: 0 });
  const dragLastMouseRef = useRef({ x: 0, y: 0 });
  const dragLastTimeRef = useRef(0);
  const pointerPosRef = useRef({ x: 0, y: 0 });

  // Dynamic layout positions of all elements on screen to draw perfect 3D wires
  const [elementPositions, setElementPositions] = useState<Record<string, { x: number; y: number; width?: number; height?: number }>>({});
  
  // Cache shelf positions so we don't query 26 client rects continuously on drag
  const shelfPositionsRef = useRef<Record<string, { x: number; y: number; width?: number; height?: number }>>({});

  // HTML Element Refs
  const trayRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const shelfRef = useRef<HTMLDivElement>(null);

  const isPointerInsideTray = (x?: number, y?: number) => {
    const refEl = boardRef.current || trayRef.current;
    if (!refEl) return false;
    const px = x !== undefined ? x : pointerPos.x;
    const py = y !== undefined ? y : pointerPos.y;
    const rect = refEl.getBoundingClientRect();
    
    const isMobile = window.innerWidth < 768 || ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    const hPadding = 35;
    const vPadding = isMobile ? 320 : 35;
    
    return (
      px >= rect.left - hPadding &&
      px <= rect.right + hPadding &&
      py >= rect.top - vPadding &&
      py <= rect.bottom + vPadding
    );
  };

  // Measure static 26 shelf cubes (only on resize/mount/reorder)
  const updateShelfPositions = useCallback(() => {
    const coords: Record<string, { x: number; y: number; width?: number; height?: number }> = {};
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
    shelfPositionsRef.current = coords;
  }, [shelfCubes]);

  // Measure dynamic spelled rows and board slots, merging in cached static shelf coordinates
  const updateElementPositions = useCallback(() => {
    const coords = { ...shelfPositionsRef.current };

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
  }, [spelledRows]);

  // Synchronize shelf positions on mount, shelf updates, and resize events
  useEffect(() => {
    updateShelfPositions();
    const timer = setTimeout(updateShelfPositions, 100);
    window.addEventListener('resize', updateShelfPositions);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateShelfPositions);
    };
  }, [updateShelfPositions]);

  // Synchronize spelling rows on layout updates and active states
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
  }, [updateElementPositions, spelledRows, draggedCube, draggedTrayIndex, draggedBoardLetter, activeRowIdx, draggedShelfIndex, isReorderCubesActive]);

  // Listen to scrolls for real-time connection wire clipping updates
  useEffect(() => {
    window.addEventListener('scroll', updateElementPositions, true); // Use capture phase to catch internal row scrolls!
    return () => {
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

  // Run continuous tracking for 800ms after spelledRows changes,
  // to ensure layout transitions (spring animations when blocks shift/are deleted) are tracked perfectly in real-time.
  useEffect(() => {
    let rAFId: number;
    const startTime = Date.now();
    const duration = 800; // 800ms covers spring layout transitions

    const loop = () => {
      updateElementPositions();
      if (Date.now() - startTime < duration) {
        rAFId = requestAnimationFrame(loop);
      }
    };

    rAFId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rAFId);
    };
  }, [spelledRows, updateElementPositions]);

  // Lock document touch action when dragging to avoid page shifting on mobile and disable smooth scroll to allow instant scrolling
  useEffect(() => {
    const isDragging = (draggedCube !== null && draggedLetter !== null) || (draggedTrayIndex !== null && draggedBoardLetter !== null) || (draggedShelfIndex !== null);
    if (isDragging) {
      document.documentElement.classList.add('dragging-active');
      document.body.classList.add('dragging-active');
    } else {
      document.documentElement.classList.remove('dragging-active');
      document.body.classList.remove('dragging-active');
    }
    return () => {
      document.documentElement.classList.remove('dragging-active');
      document.body.classList.remove('dragging-active');
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
        const pointerX = pointerPosRef.current.x;
        const pointerY = pointerPosRef.current.y;

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
  }, [draggedCube, draggedBoardLetter]);

  // Window/Viewport fluid and dynamic auto-scrolling when dragging block near the screen edges
  useEffect(() => {
    const isDragging = (draggedCube !== null && draggedLetter !== null) || 
                       (draggedTrayIndex !== null && draggedBoardLetter !== null) || 
                       (draggedShelfIndex !== null);
    if (!isDragging) return;

    let animId: number;
    const scrollWindowStep = () => {
      const pointerY = pointerPosRef.current.y;
      const pointerX = pointerPosRef.current.x;
      const viewHeight = window.innerHeight;
      const viewWidth = window.innerWidth;
      
      const threshold = 170; // 170px zone near the edges of the viewport (increased sensitivity)
      const maxScrollSpeed = 58; // max scroll speed in pixels per frame (increased for extreme speed)

      const isMobile = window.innerWidth < 768 || ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
      const bottomThreshold = isMobile ? (viewHeight * 0.65) : threshold;

      let didScroll = false;
      // Vertical auto-scroll - robustly handle pointer coordinates that go beyond viewport edges (e.g. negative or > viewHeight)
      // Removed the limit (capping) of 1.6 to allow infinite scroll speed when the user drags the block far outside the viewport!
      if (pointerY < threshold) {
        // Dragging near or beyond the top edge -> scroll up
        const intensity = Math.max(0, (threshold - pointerY) / threshold);
        const speed = Math.pow(intensity, 1.1) * maxScrollSpeed;
        if (speed > 0.5) {
          window.scrollBy(0, -speed);
          didScroll = true;
        }
      } else if (pointerY > viewHeight - bottomThreshold) {
        // Dragging near or beyond the bottom edge -> scroll down
        const intensity = Math.max(0, (pointerY - (viewHeight - bottomThreshold)) / bottomThreshold);
        const speed = Math.pow(intensity, 1.1) * maxScrollSpeed;
        if (speed > 0.5) {
          window.scrollBy(0, speed);
          didScroll = true;
        }
      }

      // Horizontal auto-scroll for window - ONLY on desktop (not mobile!)
      if (!isMobile) {
        if (pointerX < threshold) {
          const intensity = Math.max(0, (threshold - pointerX) / threshold);
          const speed = Math.pow(intensity, 1.1) * maxScrollSpeed;
          if (speed > 0.5) {
            window.scrollBy(-speed, 0);
            didScroll = true;
          }
        } else if (pointerX > viewWidth - threshold) {
          const intensity = Math.max(0, (pointerX - (viewWidth - threshold)) / threshold);
          const speed = Math.pow(intensity, 1.1) * maxScrollSpeed;
          if (speed > 0.5) {
            window.scrollBy(speed, 0);
            didScroll = true;
          }
        }
      }

      if (didScroll) {
        // Force synchronous element positions update.
        // This is crucial on mobile viewports since iOS Safari and Android Chrome throttle/defer default 'scroll' events
        // during touch dragging, causing wires and visual bounds to lag behind or drift.
        updateElementPositions();
      }

      animId = requestAnimationFrame(scrollWindowStep);
    };

    animId = requestAnimationFrame(scrollWindowStep);
    return () => cancelAnimationFrame(animId);
  }, [draggedCube, draggedLetter, draggedTrayIndex, draggedBoardLetter, draggedShelfIndex, updateElementPositions]);

  // Auto-scrolling is handled seamlessly during the active drag operation instead of jumping to the end on drops.

  // Pointer move handler to track active drags / lines / reorders
  useEffect(() => {
    const calculatePreciseDropInRow = (
      clientX: number,
      rowEl: Element,
      rowIdx: number,
      excludeRowIdx?: number,
      excludeSlotIdx?: number
    ): { type: 'insert' | 'replace'; index: number } => {
      const activeRowLetters = spelledRowsRef.current[rowIdx] || [];
      const activeIds = new Set(activeRowLetters.map(l => l.id));

      const slotElements = Array.from(rowEl.querySelectorAll('[data-slot-idx]')).filter(el => {
        const id = el.getAttribute('id');
        return id && activeIds.has(id);
      });
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

    // Robust coordinates-based lookup that identifies the active spelling row under a pointer coordinate.
    // Extremely reliable on mobile/tablets regardless of viewport scaling, pinch, or overlapping preview elements,
    // using vertical center proximity of each row container to ensure zero bias and perfect selection.
    const findRowAtCoords = (x: number, y: number): { element: Element; index: number } | null => {
      const rowEls = document.querySelectorAll('[data-row-container-idx]');
      if (rowEls.length === 0) return null;
      
      let closestRowEl: Element | null = null;
      let minDistance = Infinity;
      let closestIdx = -1;
      
      for (let i = 0; i < rowEls.length; i++) {
        const el = rowEls[i];
        const rect = el.getBoundingClientRect();
        
        // Use the vertical center of the spelling row container as the anchor.
        // This is extremely robust and prevents first-match bias when rows are tightly packed or empty.
        const centerY = rect.top + rect.height / 2;
        const distY = Math.abs(y - centerY);
        
        if (distY < minDistance) {
          minDistance = distY;
          closestRowEl = el;
          const rIdx = parseInt(el.getAttribute('data-row-container-idx') || '', 10);
          if (!isNaN(rIdx)) {
            closestIdx = rIdx;
          }
        }
      }
      
      if (closestRowEl && closestIdx !== -1) {
        return { element: closestRowEl, index: closestIdx };
      }
      
      return null;
    };

    const handlePointerMove = (e: PointerEvent) => {
      // Map pointer coordinates directly and milimetrically to eliminate drag latency,
      // ensuring the dragging cube coordinates align instantly with the finger.
      setPointerPos({ x: e.clientX, y: e.clientY });
      pointerPosRef.current = { x: e.clientX, y: e.clientY };



      // Calculate velocity and time intervals
      const now = performance.now();
      const dt = now - dragLastTimeRef.current;
      
      let vx = 0;
      let vy = 0;
      if (dt > 1 && dragLastTimeRef.current > 0) {
        vx = (e.clientX - dragLastMouseRef.current.x) / dt;
        vy = (e.clientY - dragLastMouseRef.current.y) / dt;
      }
      
      dragVelocityRef.current = {
        x: dragVelocityRef.current.x * 0.7 + vx * 0.3,
        y: dragVelocityRef.current.y * 0.7 + vy * 0.3,
      };
      
      dragLastMouseRef.current = { x: e.clientX, y: e.clientY };
      dragLastTimeRef.current = now;



      if (draggedShelfIndexRef.current !== null) {
        // Just let it track pointerPos. Swap of elements in shelfCubes happens on pointerUp!
      } else if (draggedCubeRef.current && draggedLetterRef.current) {
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
      } else if (trayDragStartRef.current !== null && draggedTrayIndexRef.current === null) {
        // Anti-jitter drag launch
        const dist = Math.hypot(e.clientX - trayDragStartRef.current.x, e.clientY - trayDragStartRef.current.y);
        if (dist > 8) {
          const deltaX = Math.abs(e.clientX - trayDragStartRef.current.x);
          const deltaY = Math.abs(e.clientY - trayDragStartRef.current.y);
          
          // Allow extremely fluid and immediate drag launches in any direction on touch and mobile!

          // Launch the drag!
          dragLastTimeRef.current = performance.now();
          dragLastMouseRef.current = { x: e.clientX, y: e.clientY };
          dragVelocityRef.current = { x: 0, y: 0 };
          const dragIdx = { rIdx: trayDragStartRef.current.rowIdx, lIdx: trayDragStartRef.current.index };
          const dragLetterObj = trayDragStartRef.current.letterObj;
          setDraggedTrayIndex(dragIdx);
          draggedTrayIndexRef.current = dragIdx;
          setDraggedBoardLetter(dragLetterObj);
          draggedBoardLetterRef.current = dragLetterObj;
          // Keep it in spelledRows to show clean empty dashed slot at the original position while dragging,
          // preventing jerky resizing or layout shifting in the scrolling row!
        }
      }

      // Real-time hover tracking with coordinates-based lookup
      if ((draggedCubeRef.current && draggedLetterRef.current) || (draggedTrayIndexRef.current && draggedBoardLetterRef.current)) {
        if (isPointerInsideTray(e.clientX, e.clientY)) {
          const rowMatch = findRowAtCoords(e.clientX, e.clientY);
          if (rowMatch) {
            const rowEl = rowMatch.element;
            const targetRowIdx = rowMatch.index;
            const dropResult = calculatePreciseDropInRow(
              e.clientX,
              rowEl,
              targetRowIdx,
              draggedTrayIndexRef.current?.rIdx,
              draggedTrayIndexRef.current?.lIdx
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
      if (draggedCubeRef.current && draggedLetterRef.current) {
        if (boardRef.current) {
          let inserted = false;
          
          if (isPointerInsideTray(e.clientX, e.clientY)) {
            // Find the closest row using exact/closest coordinates
            const rowMatch = findRowAtCoords(e.clientX, e.clientY);
            
            if (rowMatch) {
              const rowEl = rowMatch.element;
              const targetRowIdx = rowMatch.index;
              // Precision calculation
              const dropResult = calculatePreciseDropInRow(e.clientX, rowEl, targetRowIdx);
              if (dropResult.type === 'replace') {
                handleReplaceLetter(draggedLetterRef.current, targetRowIdx, dropResult.index);
                inserted = true;
              } else {
                handleSelectLetter(draggedLetterRef.current, targetRowIdx, dropResult.index);
                inserted = true;
              }
            } else {
              // Alternate lookup: if they drop anywhere in the board tray but not on a specific row element directly,
              // let's use the activeRowIdxRef.current as a fallback and insert at the end.
              handleSelectLetter(draggedLetterRef.current, activeRowIdxRef.current);
              inserted = true;
            }
          }
        }
        setDraggedCube(null);
        draggedCubeRef.current = null;
        setDraggedLetter(null);
        draggedLetterRef.current = null;
        setDragScribblePoints([]);
      }      // 2. DRAG EXISTING BOARD CUBE
      if (draggedTrayIndexRef.current !== null && draggedBoardLetterRef.current !== null) {
        const sourceIdx = draggedTrayIndexRef.current; // Capture local ref value before asynchronous/batched state updates
        if (boardRef.current) {
          let dropSuccessful = false;

          if (isPointerInsideTray(e.clientX, e.clientY)) {
            const rowMatch = findRowAtCoords(e.clientX, e.clientY);
            if (rowMatch) {
              const rowEl = rowMatch.element;
              const targetRowIdx = rowMatch.index;
              
              // Calculate precise insertion/replacement index, excluding itself from measurement
              const dropResult = calculatePreciseDropInRow(
                e.clientX, 
                rowEl, 
                targetRowIdx,
                sourceIdx.rIdx, 
                sourceIdx.lIdx
              );
                
                if (dropResult.type === 'replace') {
                  // REPLACE LOGIC
                  setSpelledRows(prev => {
                    const copy = prev.map(r => [...r]);
                    const sourceRow = copy[sourceIdx.rIdx];
                    const targetRow = copy[targetRowIdx];
 
                    const itemToMove = sourceRow[sourceIdx.lIdx];
                    if (itemToMove) {
                      // Remove from source row first
                      sourceRow.splice(sourceIdx.lIdx, 1);
                      
                      // Handle offset adjustment if replacing on the same row!
                      let finalReplaceIdx = dropResult.index;
                      if (sourceIdx.rIdx === targetRowIdx) {
                        if (sourceIdx.lIdx < dropResult.index) {
                          finalReplaceIdx = Math.max(0, dropResult.index - 1);
                        }
                      }
 
                      const draggedColor = itemToMove.color || getRowColor(sourceIdx.rIdx);
                      // NEW RULE: If target row already contains blocks (other than the item itself), adapt to their color!
                      let finalColor = draggedColor;
                      const remainingBlocksInTarget = targetRow.filter(item => item.id !== itemToMove.id);
                      if (remainingBlocksInTarget.length > 0) {
                        finalColor = remainingBlocksInTarget[0].color || getRowColor(targetRowIdx);
                      }
                      const colorName = finalColor === '#0004FD' || finalColor === 'blue' ? 'blue' :
                                        finalColor === '#FF0000' || finalColor === 'red' ? 'red' :
                                        finalColor === '#009246' || finalColor === 'green' ? 'green' : 'black';
                      const hexColor = colorName === 'blue' ? '#0004FD' :
                                       colorName === 'red' ? '#FF0000' :
                                       colorName === 'green' ? '#009246' : '#000000';

                      // Create a new item to trigger React key replacement animation cleanly and fluidly
                      const cellId = `letter-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
                      const replacedItem: SpelledLetter = {
                        ...itemToMove,
                        id: cellId, // generate new id to trigger replacement animation!
                        color: hexColor
                      };
                      
                      targetRow[finalReplaceIdx] = replacedItem;

                      // Force all items in this target row to have the same color as the dropped block
                      copy[targetRowIdx] = targetRow.map(item => ({
                        ...item,
                        color: hexColor
                      }));

                      // Update row colors state
                      setRowColors(prevColors => ({
                        ...prevColors,
                        [targetRowIdx]: colorName
                      }));
                    }
                    return copy;
                  });
                  setActiveRowIdx(targetRowIdx);
                  dropSuccessful = true;
                } else {
                  // INSERT LOGIC
                  setSpelledRows(prev => {
                    const copy = prev.map(r => [...r]);
                    const sourceRow = copy[sourceIdx.rIdx];
                    const targetRow = copy[targetRowIdx];
 
                    const itemToMove = sourceRow[sourceIdx.lIdx];
                    if (itemToMove) {
                      // Remove from source row first
                      sourceRow.splice(sourceIdx.lIdx, 1);
                      
                      let finalInsertIdx = dropResult.index;
                      
                      // Handle offset adjustment if inserting in the same row
                      if (sourceIdx.rIdx === targetRowIdx) {
                        if (sourceIdx.lIdx < dropResult.index) {
                          finalInsertIdx = Math.max(0, dropResult.index - 1);
                        }
                      }
 
                      // Ensure insert index falls in valid range
                      if (finalInsertIdx > targetRow.length) {
                        finalInsertIdx = targetRow.length;
                      }
 
                      const draggedColor = itemToMove.color || getRowColor(sourceIdx.rIdx);
                      // NEW RULE: If target row already contains blocks (other than the item itself), adapt to their color!
                      let finalColor = draggedColor;
                      const remainingBlocksInTarget = targetRow.filter(item => item.id !== itemToMove.id);
                      if (remainingBlocksInTarget.length > 0) {
                        finalColor = remainingBlocksInTarget[0].color || getRowColor(targetRowIdx);
                      }
                      const colorName = finalColor === '#0004FD' || finalColor === 'blue' ? 'blue' :
                                        finalColor === '#FF0000' || finalColor === 'red' ? 'red' :
                                        finalColor === '#009246' || finalColor === 'green' ? 'green' : 'black';
                      const hexColor = colorName === 'blue' ? '#0004FD' :
                                       colorName === 'red' ? '#FF0000' :
                                       colorName === 'green' ? '#009246' : '#000000';

                      targetRow.splice(finalInsertIdx, 0, { ...itemToMove, color: hexColor });

                      // Force all items in this target row to have the same color as the dropped block
                      copy[targetRowIdx] = targetRow.map(item => ({
                        ...item,
                        color: hexColor
                      }));

                      // Update row colors state
                      setRowColors(prevColors => ({
                        ...prevColors,
                        [targetRowIdx]: colorName
                      }));
                    }
                    return copy;
                  });
                  
                  setActiveRowIdx(targetRowIdx);
                  dropSuccessful = true;
                }
              }
          } else {
            // Dragged outside: delete the letter on all devices (both mobile and desktop)
            const sourceRow = spelledRows[sourceIdx.rIdx];
            const itemDeleted = sourceRow ? sourceRow[sourceIdx.lIdx] : null;
            if (itemDeleted) {
              setUndoHistory(prev => [
                ...prev,
                {
                  type: 'block',
                  letter: itemDeleted,
                  rIdx: sourceIdx.rIdx,
                  lIdx: sourceIdx.lIdx
                }
              ]);
            }

            setSpelledRows(prev => {
              const copy = prev.map(r => [...r]);
              const sRow = copy[sourceIdx.rIdx];
              if (sRow) {
                sRow.splice(sourceIdx.lIdx, 1);
              }
              return copy;
            });
            dropSuccessful = true;
          }
        }
        setDraggedTrayIndex(null);
        draggedTrayIndexRef.current = null;
        setDraggedBoardLetter(null);
        draggedBoardLetterRef.current = null;
      }

      // 3. FREE SHELF REORDER DROP (SWAP/REPLACE POSITION ON DROP)
      if (draggedShelfIndexRef.current !== null) {
        const sourceShelfIdx = draggedShelfIndexRef.current; // Capture local ref value before asynchronous/batched state updates
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const shelfEl = el?.closest('[data-shelf-idx]');
        if (shelfEl) {
          const targetIdx = parseInt(shelfEl.getAttribute('data-shelf-idx') || '', 10);
          if (!isNaN(targetIdx) && targetIdx !== sourceShelfIdx) {
            setShelfCubes(prev => {
              const copy = [...prev];
              const temp = copy[sourceShelfIdx];
              copy[sourceShelfIdx] = copy[targetIdx];
              copy[targetIdx] = temp;
              return copy;
            });
          }
        }
        setDraggedShelfIndex(null);
        draggedShelfIndexRef.current = null;
      }

      if (trayDragStartRef.current !== null && draggedTrayIndexRef.current === null) {
        const startRef = trayDragStartRef.current; // Capture local ref value before asynchronous/batched state updates
        const dist = Math.hypot(e.clientX - startRef.x, e.clientY - startRef.y);
        const timeElapsed = Date.now() - startRef.time;
        // Only trigger action if it was a quick click, not a long press
        if (dist < 10 && timeElapsed < 300) {
          const letterId = startRef.letterObj.id;
          const now = Date.now();
          const lastTime = lastClicksRef.current[letterId] || 0;

          if (now - lastTime < 350) {
            // Double click: open Cube Edit Modal
            if (clickTimeoutsRef.current[letterId]) {
              clearTimeout(clickTimeoutsRef.current[letterId]);
              delete clickTimeoutsRef.current[letterId];
            }
            delete lastClicksRef.current[letterId];

            if (!isEditingBlocked) {
              setActiveEditCube({
                rIdx: startRef.rowIdx,
                slotIdx: startRef.index,
                letterObj: startRef.letterObj
              });
              setIsCubeEditModalOpen(true);
            }
          } else {
            // Single click: do nothing except register time
            lastClicksRef.current[letterId] = now;
          }
        }
      }

      setTrayDragStart(null);
      setDragHoverInfo(null);
    };

    const handlePointerCancel = (e: PointerEvent) => {
      setDraggedCube(null);
      draggedCubeRef.current = null;
      setDraggedLetter(null);
      draggedLetterRef.current = null;
      setDraggedTrayIndex(null);
      draggedTrayIndexRef.current = null;
      setDraggedBoardLetter(null);
      draggedBoardLetterRef.current = null;
      setDraggedShelfIndex(null);
      draggedShelfIndexRef.current = null;
      setTrayDragStart(null);
      setDragHoverInfo(null);
      setDragScribblePoints([]);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerCancel);

    const handleGlobalTouch = (e: TouchEvent) => {
      // Only block scroll when a drag is actually in progress — do NOT block when simply touching near cubes!
      const isCurrentlyDragging =
        draggedCubeRef.current !== null ||
        draggedLetterRef.current !== null ||
        draggedTrayIndexRef.current !== null ||
        draggedShelfIndexRef.current !== null;
      if (isCurrentlyDragging && e.cancelable) {
        e.preventDefault();
      }
    };

    window.addEventListener('touchstart', handleGlobalTouch, { passive: false });
    window.addEventListener('touchmove', handleGlobalTouch, { passive: false });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerCancel);
      window.removeEventListener('touchstart', handleGlobalTouch);
      window.removeEventListener('touchmove', handleGlobalTouch);
    };
  }, []);

  // Insert a letter onto a specific row and optional slot index
  const handleSelectLetter = (letter: string, targetRowIdx: number = activeRowIdxRef.current, insertIdx?: number) => {
    const currentSpelledRows = spelledRowsRef.current;
    if (!currentSpelledRows[targetRowIdx]) {
      targetRowIdx = 0;
    }

    if (currentSpelledRows[targetRowIdx].length >= 36) { 
      return;
    }

    const cellId = `letter-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const matchedCubeId = draggedCubeRef.current ? `cube-${draggedCubeRef.current.id}` : getShelfCubeIdForLetter(letter);

    let originalOrdinal = "1°";
    const cubeToUse = draggedCubeRef.current || shelfCubes.find(c => c.primaryLetter === letter || c.secondaryLetter === letter);
    if (cubeToUse) {
      if (cubeToUse.secondaryLetter === letter) {
        originalOrdinal = cubeToUse.secondaryOrdinal || cubeToUse.primaryOrdinal;
      } else {
        originalOrdinal = cubeToUse.primaryOrdinal;
      }
    }

    // NEW RULE: If target row already contains blocks, the new block adopts their color!
    let targetColor = themeColorRef.current;
    const existingRow = currentSpelledRows[targetRowIdx];
    if (existingRow && existingRow.length > 0) {
      targetColor = existingRow[0].color || getRowColor(targetRowIdx);
    }
    targetColor = normalizeColor(targetColor);
    const colorName = targetColor === '#0004FD' ? 'blue' : targetColor === '#FF0000' ? 'red' : targetColor === '#009246' ? 'green' : 'black';

    const newLetter: SpelledLetter = {
      id: cellId,
      letter,
      originCubeId: matchedCubeId,
      originalOrdinal,
      color: targetColor
    };

    setSpelledRows(prev => {
      const copy = prev.map(r => [...r]);
      if (typeof insertIdx === 'number') {
        copy[targetRowIdx].splice(insertIdx, 0, newLetter);
      } else {
        copy[targetRowIdx].push(newLetter);
      }
      // Force all items in this target row to have the same color as the dropped block
      copy[targetRowIdx] = copy[targetRowIdx].map(item => ({
        ...item,
        color: targetColor
      }));
      return copy;
    });

    setRowColors(prevColors => ({
      ...prevColors,
      [targetRowIdx]: colorName
    }));
    
    setActiveRowIdx(targetRowIdx);
  };

  // Replace a letter on a specific row at a target slot index
  const handleReplaceLetter = (letter: string, targetRowIdx: number, targetSlotIdx: number) => {
    const currentSpelledRows = spelledRowsRef.current;
    if (!currentSpelledRows[targetRowIdx]) return;

    const cellId = `letter-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const matchedCubeId = draggedCubeRef.current ? `cube-${draggedCubeRef.current.id}` : getShelfCubeIdForLetter(letter);

    let originalOrdinal = "1°";
    const cubeToUse = draggedCubeRef.current || shelfCubes.find(c => c.primaryLetter === letter || c.secondaryLetter === letter);
    if (cubeToUse) {
      if (cubeToUse.secondaryLetter === letter) {
        originalOrdinal = cubeToUse.secondaryOrdinal || cubeToUse.primaryOrdinal;
      } else {
        originalOrdinal = cubeToUse.primaryOrdinal;
      }
    }

    // NEW RULE: If target row already contains blocks, the new block adopts their color!
    let targetColor = themeColorRef.current;
    const existingRow = currentSpelledRows[targetRowIdx];
    if (existingRow && existingRow.length > 0) {
      targetColor = existingRow[0].color || getRowColor(targetRowIdx);
    }
    targetColor = normalizeColor(targetColor);
    const colorName = targetColor === '#0004FD' ? 'blue' : targetColor === '#FF0000' ? 'red' : targetColor === '#009246' ? 'green' : 'black';

    const newLetter: SpelledLetter = {
      id: cellId,
      letter,
      originCubeId: matchedCubeId,
      originalOrdinal,
      color: targetColor
    };

    setSpelledRows(prev => {
      const copy = prev.map(r => [...r]);
      if (copy[targetRowIdx] && copy[targetRowIdx][targetSlotIdx] !== undefined) {
        copy[targetRowIdx][targetSlotIdx] = newLetter;
      }
      // Force all items in this target row to have the same color as the dropped block
      copy[targetRowIdx] = copy[targetRowIdx].map(item => ({
        ...item,
        color: targetColor
      }));
      return copy;
    });

    setRowColors(prevColors => ({
      ...prevColors,
      [targetRowIdx]: colorName
    }));

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
    setSpelledRows(prev => {
      setActiveRowIdx(prev.length);
      return [...prev, []];
    });
  };

  const handleRemoveRow = (rIdx: number) => {
    setSpelledRows(prev => {
      const copy = prev.map((r, idx) => idx === rIdx ? [] : [...r]);
      return copy;
    });
    setRowColors(prev => {
      const next = { ...prev };
      delete next[rIdx];
      return next;
    });
    setRowActiveModes(prev => {
      const next = { ...prev };
      delete next[rIdx];
      return next;
    });
    setCutWiresRows(prev => {
      const next = { ...prev };
      delete next[rIdx];
      return next;
    });
  };

  const handleDeleteRowWithHistory = (rIdx: number) => {
    const rowToSave = spelledRows[rIdx];
    const colorToSave = rowColors[rIdx];
    const rowIdToSave = rowIds[rIdx];
    const cutWiresToSave = cutWiresRows[rIdx];
    const activeModeToSave = rowActiveModes[rIdx];
    
    // Save to history stack
    setUndoHistory(prev => [
      ...prev,
      { 
        type: 'row',
        row: rowToSave, 
        index: rIdx, 
        color: colorToSave, 
        rowId: rowIdToSave,
        cutWires: cutWiresToSave,
        activeMode: activeModeToSave
      }
    ]);
    
    handleRemoveRow(rIdx);
  };

  const handleUndoDelete = () => {
    if (isEditingBlocked) return;
    if (undoHistory.length === 0) return;

    // Action lock to shield visual updates against rapid repetitive clicks
    const now = Date.now();
    if (now - lastActionTimeRef.current < 200) return;
    lastActionTimeRef.current = now;
    
    const lastItem = undoHistory[undoHistory.length - 1];
    
    if (lastItem.type === 'row') {
      setRowIds(prev => {
        const copy = [...prev];
        if (lastItem.index < copy.length) {
          copy[lastItem.index] = lastItem.rowId || copy[lastItem.index];
        }
        return copy;
      });

      setSpelledRows(prev => {
        const copy = prev.map(r => [...r]);
        if (lastItem.index < copy.length) {
          copy[lastItem.index] = lastItem.row;
        }
        return copy;
      });

      if (lastItem.color) {
        setRowColors(prev => ({
          ...prev,
          [lastItem.index]: lastItem.color as any
        }));
      }

      setRowActiveModes(prev => ({
        ...prev,
        [lastItem.index]: lastItem.activeMode as any
      }));

      setCutWiresRows(prev => ({
        ...prev,
        [lastItem.index]: lastItem.cutWires as any
      }));
    } else if (lastItem.type === 'block') {
      // Restore individual block!
      const { letter, rIdx, lIdx } = lastItem;
      setSpelledRows(prev => {
        const copy = prev.map(r => [...r]);
        while (copy.length <= rIdx) {
          copy.push([]);
        }
        const row = copy[rIdx];
        const insertIdx = Math.min(lIdx, row.length);
        
        // Generate a new fresh unique key/id to trigger enter transitions beautifully
        const restoredLetter = {
          ...letter,
          id: `letter-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          color: row.length > 0 && row[0].color ? row[0].color : letter.color
        };
        
        row.splice(insertIdx, 0, restoredLetter);
        return copy;
      });
      setActiveRowIdx(rIdx);
    }

    setUndoHistory(prev => prev.slice(0, -1));
  };

  const handleClearAllRows = () => {
    if (isEditingBlocked) return;
    // Collect all rows that actually contain cubes
    const nonKeys = spelledRows
      .map((row, idx) => ({ 
        row, 
        index: idx, 
        color: rowColors[idx], 
        rowId: rowIds[idx],
        cutWires: cutWiresRows[idx],
        activeMode: rowActiveModes[idx]
      }))
      .filter(item => item.row.length > 0);
    
    if (nonKeys.length > 0) {
      setUndoHistory(prev => [
        ...prev,
        ...nonKeys.map(item => ({ type: 'row' as const, ...item }))
      ]);
    }

    setSpelledRows([[], [], [], [], [], []]);
    setRowColors({});
    setRowActiveModes({});
    setCutWiresRows({});
    setActiveRowIdx(0);
    setRowIds([
      'row-initial-1-' + Math.random().toString(36).substring(2, 11),
      'row-initial-2-' + Math.random().toString(36).substring(2, 11),
      'row-initial-3-' + Math.random().toString(36).substring(2, 11),
      'row-initial-4-' + Math.random().toString(36).substring(2, 11),
      'row-initial-5-' + Math.random().toString(36).substring(2, 11),
      'row-initial-6-' + Math.random().toString(36).substring(2, 11)
    ]);
  };

  const cycleRowColor = (rIdx: number) => {
    if (isEditingBlocked) return;
    const current = rowColors[rIdx] || (themeColor === '#000000' ? 'black' : themeColor === '#0004FD' ? 'blue' : themeColor === '#FF0000' ? 'red' : 'green');
    const colorCycle = ['black', 'blue', 'red', 'green'];
    const nextIdx = (colorCycle.indexOf(current) + 1) % colorCycle.length;
    const newColorName = colorCycle[nextIdx] as 'black'|'blue'|'red'|'green';
    
    setRowColors(prev => ({ ...prev, [rIdx]: newColorName }));
    
    const newHex = newColorName === 'black' ? '#000000' : newColorName === 'blue' ? '#0004FD' : newColorName === 'red' ? '#FF0000' : '#009246';
    setSpelledRows(prev => {
        const copy = prev.map(r => [...r]);
        copy[rIdx] = copy[rIdx].map(l => ({ ...l, color: newHex }));
        return copy;
    });
  };

  // Handle pointer down triggers from alphabet cube grid
  const handleCubePointerDown = (e: React.PointerEvent, cube: LetterCubeData, letter: string) => {
    if (isEditingBlocked) return;
    e.preventDefault();
    // Only use setPointerCapture on desktop — on mobile/touch it causes pointercancel which kills drags
    const isMobile = window.matchMedia('(pointer: coarse)').matches;
    if (!isMobile) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (err) {}
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const startX = rect.left + rect.width / 2 + window.scrollX;
    const startY = rect.top + rect.height / 2 + window.scrollY;

    setDraggedCube(cube);
    draggedCubeRef.current = cube;
    setDraggedLetter(letter);
    draggedLetterRef.current = letter;
    setDragStartPosCenter({ x: startX, y: startY });
    
    // Initialize predictive drag tracking variables
    dragLastTimeRef.current = performance.now();
    dragLastMouseRef.current = { x: e.clientX, y: e.clientY };
    dragVelocityRef.current = { x: 0, y: 0 };
    
    setPointerPos({ x: e.clientX, y: e.clientY });
    pointerPosRef.current = { x: e.clientX, y: e.clientY };
    setDragScribblePoints([{ x: startX, y: startY }]);

    // Programmatic scrolling on drag is disabled to ensure the alphabet shelf remains completely stationary
  };

  const hasAnyBlocks = spelledRows.some(row => row.length > 0);

  // Session Expired Modal
  const renderSessionExpiredModal = () => (
    <AnimatePresence>
      {isSessionExpiredOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl border border-red-200 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <span className="material-symbols-outlined text-red-500 text-5xl">lock_clock</span>
            <h3 className="text-lg font-extrabold text-slate-800">Sessão Expirada!</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              O tempo limite de segurança do seu Código de Acesso Único expirou. Por favor, solicite um novo código ao seu Teatcher.
            </p>
            <button
              onClick={() => setIsSessionExpiredOpen(false)}
              className="w-full py-3 bg-[#005bb3] text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-all active:scale-95"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </AnimatePresence>
  );

  // Render routing screens
  if (currentScreen === 'login') {
    return (
      <>
        {renderSessionExpiredModal()}
        <LoginScreen
          onLoginSuccess={async (loggedUser) => {
            if (loggedUser.role === 'student') {
              // 1. Buscar a imagem de perfil mais recente no Supabase
              let avatarUrl = loggedUser.img || "/padrao/foto-do-perfil.avif";
              try {
                const { data: dbStudent } = await supabase
                  .from('students')
                  .select('img')
                  .eq('name', loggedUser.name)
                  .maybeSingle();
                if (dbStudent?.img) {
                  avatarUrl = dbStudent.img;
                }
              } catch (e) {
                console.warn('Erro ao restaurar avatar no login:', e);
              }
              loggedUser.img = avatarUrl;

              // 2. Buscar e restaurar progresso de palavras e histórico de atividades enviadas
              try {
                const { data: dbSubmissions } = await supabase
                  .from('student_submissions')
                  .select('*')
                  .eq('student_name', loggedUser.name);
                
                if (dbSubmissions && dbSubmissions.length > 0) {
                  // Restaurar palavras concluídas no Ábaco
                  const mergedWords: SavedWord[] = [];
                  dbSubmissions.forEach((sub: any) => {
                    if (sub.spelled_words) {
                      try {
                        const parsed = JSON.parse(sub.spelled_words);
                        if (Array.isArray(parsed)) {
                          parsed.forEach((w: SavedWord) => {
                            if (w && w.word && !mergedWords.some(mw => mw.word.toUpperCase() === w.word.toUpperCase())) {
                              mergedWords.push(w);
                            }
                          });
                        }
                      } catch (e) {
                        console.error('Error parsing spelled words in restore:', e);
                      }
                    }
                  });
                  localStorage.setItem('abba_completed_spelled_words', JSON.stringify(mergedWords));
                  setCompletedSpelledWords(mergedWords);

                  // Restaurar histórico de atividades enviadas
                  const sentList = dbSubmissions.map((sub: any) => ({
                    id: `SUB-${new Date(sub.submitted_at).getTime()}`,
                    studentName: sub.student_name,
                    studentEmail: sub.student_email,
                    taskTitle: sub.task_title,
                    submittedAt: sub.submitted_at,
                    spelledWordsCount: sub.spelled_words_count
                  }));
                  localStorage.setItem('abba_student_sent_activities', JSON.stringify(sentList));
                } else {
                  // Sem submissões no banco: limpar progresso antigo para iniciar limpo
                  localStorage.removeItem('abba_completed_spelled_words');
                  setCompletedSpelledWords([]);
                  localStorage.removeItem('abba_student_sent_activities');
                }
              } catch (e) {
                console.warn('Erro ao restaurar progresso no login:', e);
              }
            }

            setUser(loggedUser);
            localStorage.setItem('abba_logged_in_user', JSON.stringify(loggedUser));
            setShowLanding(false); // Pular tela inicial ao estar logado
            if (loggedUser.role === 'teacher') {
              setCurrentScreen('teacher-dashboard');
            } else {
              setCurrentScreen('student-dashboard');
            }
          }}
          onGoToSignup={() => setCurrentScreen('signup')}
          onGoToLanding={() => {
            setShowLanding(true);
            setCurrentScreen('abacus');
            setActiveTab('app');
          }}
        />
      </>
    );
  }

  if (currentScreen === 'signup') {
    return (
      <SignupScreen
        onSignupSuccess={() => setCurrentScreen('login')}
        onGoToLogin={() => setCurrentScreen('login')}
        onGoToLanding={() => {
          setShowLanding(true);
          setCurrentScreen('abacus');
          setActiveTab('app');
        }}
      />
    );
  }

  if (currentScreen === 'teacher-dashboard' && user && user.role === 'teacher') {
    return (
      <TeacherDashboard
        user={user}
        onLogout={() => {
          setUser(null);
          localStorage.removeItem('abba_logged_in_user');
          setCurrentScreen('abacus');
          setShowLanding(true);
        }}
        onLaunchReviewMode={handleLaunchReviewMode}
        onGoToLanding={() => {
          setShowLanding(true);
          setCurrentScreen('abacus');
          setActiveTab('app');
        }}
        onDraftCreated={(task) => {
          setTeacherDraftingTask(task);
          setSpelledRows([[], [], [], [], [], []]);
          setRowColors({});
          setSavedWordsList([]);
          setCurrentScreen('abacus');
        }}
      />
    );
  }

  if (currentScreen === 'student-dashboard' && user && user.role === 'student') {
    return (
      <StudentDashboard
        user={user}
        onUpdateUser={setUser}
        onLogout={() => {
          setUser(null);
          localStorage.removeItem('abba_logged_in_user');
          localStorage.removeItem('abba_completed_spelled_words');
          localStorage.removeItem('abba_student_sent_activities');
          localStorage.removeItem('abba_student_accepted_links');
          localStorage.removeItem('savedWords');
          setCompletedSpelledWords([]);
          setCurrentScreen('abacus');
          setShowLanding(true);
        }}
        onLaunchSpellingTask={handleLaunchSpellingTask}
        completedSpelledWords={completedSpelledWords}
        onGoToAbacus={(title, summary, wordsToEdit) => {
          if (title && summary) {
            setActiveTaskInfo({ title, summary });
            if (wordsToEdit && wordsToEdit.length > 0) {
              setLastSavedTask({ title, words: wordsToEdit });
              setIsStudentEditing(false); // start read-only for already saved task
            } else {
              setLastSavedTask(null);
              setIsStudentEditing(true); // start editing for fresh/unsaved task
            }
          } else {
            setActiveTaskInfo(null);
            setLastSavedTask(null);
            setIsStudentEditing(true);
          }
          setActiveSpellingTarget(null);
          
          if (wordsToEdit && wordsToEdit.length > 0) {
            const newSpelledRows = [[], [], [], [], [], []];
            const newRowColors = {};
            
            wordsToEdit.forEach((wordObj, idx) => {
              if (idx < 6) {
                const col = normalizeColor(wordObj.themeColor);
                newSpelledRows[idx] = wordObj.letters.map(l => ({
                  ...l,
                  color: normalizeColor(l.color || col)
                }));
                if (col === '#0004FD' || col === 'blue' || col === '#0052cc') newRowColors[idx] = 'blue';
                else if (col === '#FF0000' || col === 'red' || col === '#ef4444') newRowColors[idx] = 'red';
                else if (col === '#009246' || col === 'green' || col === '#10b981') newRowColors[idx] = 'green';
                else newRowColors[idx] = 'black';
              }
            });
            
            setSpelledRows(newSpelledRows);
            setRowColors(newRowColors);
            setSavedWordsList(wordsToEdit);

            try {
              const boardStateObj = {
                spelledRows: newSpelledRows,
                rowColors: newRowColors,
                rowIds: { 0: "0", 1: "1", 2: "2", 3: "3", 4: "4", 5: "5" },
                cutWiresRows: [false, false, false, false, false, false],
                savedWordsList: wordsToEdit
              };
              if (title) {
                localStorage.setItem('abba_board_state_' + title, JSON.stringify(boardStateObj));
              }
            } catch (err) {
              console.warn("Erro ao salvar estado do tabuleiro reconstruído:", err);
            }
          } else {
            const savedTaskBoardState = title ? localStorage.getItem('abba_board_state_' + title) : null;
            if (savedTaskBoardState) {
              try {
                const parsed = JSON.parse(savedTaskBoardState);
                if (parsed.spelledRows) setSpelledRows(parsed.spelledRows);
                if (parsed.rowColors) setRowColors(parsed.rowColors);
                if (parsed.rowIds) setRowIds(parsed.rowIds);
                if (parsed.cutWiresRows) setCutWiresRows(parsed.cutWiresRows);
                if (parsed.savedWordsList) setSavedWordsList(parsed.savedWordsList);
              } catch (err) {
                console.warn("Erro ao restaurar estado do tabuleiro:", err);
              }
            } else {
              setSpelledRows([[], [], [], [], [], []]);
              setRowColors({});
              setSavedWordsList([]);
            }
          }
          setIsEditingTask(false);
          setLastSavedTask(null);
          setCurrentScreen('abacus');
          setShowLanding(false);
          setActiveTab('app');
        }}
        onRemoveCompletedWord={(idx) => {
          setCompletedSpelledWords(prev => prev.filter((_, i) => i !== idx));
        }}
        onClearCompletedWords={() => {
          setCompletedSpelledWords([]);
        }}
        onGoToLanding={() => {
          setShowLanding(true);
          setCurrentScreen('abacus');
          setActiveTab('app');
        }}
      />
    );
  }

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
            <div className="flex flex-col items-center justify-center">
              <div className="scale-110">
                <Loader />
              </div>
              <p className="text-sm font-bold text-slate-500 mt-8 font-sans tracking-wide animate-pulse">
                Direcionando para a matéria completa...
              </p>
            </div>
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
                  src="/logo_splash.svg"
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
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          
          <div className="flex items-center gap-2.5">
            {/* Hamburger button */}
            <button
              onClick={() => setIsMenuOpen(prev => !prev)}
              className="p-2 rounded-xl hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center cursor-pointer relative"
              aria-label="Toggle menu"
            >
              <StyledHamburger isOpen={isMenuOpen}>
                <div className="bar bar--top" />
                <div className="bar bar--middle" />
                <div className="bar bar--bottom" />
              </StyledHamburger>
            </button>

            <div 
              onClick={() => {
                setShowLanding(true);
                setCurrentScreen('abacus');
                setActiveTab('app');
                setIsMenuOpen(false);
              }}
              className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 active:scale-[0.99] transition-all"
              title="Voltar para a página principal"
            >
              <img src="https://res.cloudinary.com/dudmozd8z/image/upload/v1779315941/logoabra2_kls3we.svg" alt="ABBA Logo" className="w-10 h-10 ml-0.5 object-contain" />
              <div>
                <h1 className="font-display font-extrabold text-xl tracking-tight text-gray-950 flex items-center gap-1.5">
                  ABBA DIGITAL
                </h1>
                <p className="text-[10px] font-medium text-gray-500 h-[15px] flex items-center">Ábaco Brasileiro de Alfabetização Bilingue</p>
              </div>
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
                <div
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsAboutLoading(true);
                    window.scrollTo({ top: 0, behavior: 'instant' });
                    setTimeout(() => {
                      setIsAboutLoading(false);
                      setActiveTab('about');
                    }, 2500);
                  }}
                  className="text-left group cursor-pointer border-none bg-transparent p-0 focus:outline-none w-full max-w-[576px] block"
                >
                  <h3 className="font-display font-black text-2xl sm:text-3xl text-gray-950 group-hover:text-[#005ba4] transition-colors tracking-tight leading-tight">
                    Saiba mais
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-2 font-medium leading-relaxed font-sans w-full max-w-[448px] font-semibold">
                    Clique aqui para acessar a matéria completa sobre o Ábaco Brasileiro de Alfabetização Bilingue por José Décio de Alencar.
                  </p>
                </div>

                {/* Profile/Login Section inside Menu */}
                {user ? (
                  <div className="border-t border-gray-150 mt-6 pt-6 flex flex-col gap-5">
                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-gray-100 max-w-[448px]">
                      <div className="w-12 h-12 rounded-full bg-[#005ba4] text-white flex items-center justify-center font-display font-extrabold text-lg shadow-xs shrink-0">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <h4 className="font-display font-black text-gray-950 text-base leading-tight">{user.name}</h4>
                        <p className="text-xs text-gray-500 font-medium font-sans mt-0.5">{user.email}</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        if (user.role === 'teacher') {
                          setCurrentScreen('teacher-dashboard');
                        } else {
                          setCurrentScreen('student-dashboard');
                        }
                      }}
                      className="text-left font-display font-black text-2xl sm:text-3xl text-[#005ba3] hover:text-[#00468c] transition-colors tracking-tight leading-tight cursor-pointer border-none bg-transparent p-0 focus:outline-none w-full"
                    >
                      Voltar ao Painel Geral
                    </button>
                    
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        setUser(null);
                        localStorage.removeItem('abba_logged_in_user');
                        localStorage.removeItem('abba_completed_spelled_words');
                        localStorage.removeItem('abba_student_sent_activities');
                        localStorage.removeItem('abba_student_accepted_links');
                        localStorage.removeItem('savedWords');
                        setCompletedSpelledWords([]);
                        setCurrentScreen('abacus');
                        setShowLanding(true);
                      }}
                      className="text-left font-display font-black text-2xl sm:text-3xl text-red-600 hover:text-red-800 transition-colors tracking-tight leading-tight cursor-pointer border-none bg-transparent p-0 focus:outline-none w-full"
                    >
                      Sair da Conta
                    </button>
                  </div>
                ) : (
                  <div className="border-t border-gray-150 mt-6 pt-6 flex flex-col gap-4">
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        setCurrentScreen('login');
                      }}
                      className="text-left font-display font-black text-2xl sm:text-3xl text-gray-950 hover:text-[#005ba4] transition-colors tracking-tight leading-tight cursor-pointer border-none bg-transparent p-0 focus:outline-none w-full"
                    >
                      Minha Conta
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BODY CONTENT AREA */}
      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 md:px-8 mt-6 flex flex-col gap-6">
        
        {teacherDraftingTask ? (
          <div className="bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent border border-blue-300 rounded-3xl p-5 sm:p-6 text-left relative overflow-hidden shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="bg-blue-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 animate-pulse">
                  <span className="material-symbols-outlined text-[12px] font-bold">edit_document</span>
                  Configurando Rascunho
                </span>
              </div>
              <h2 className="font-display font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight leading-tight mb-1">
                {teacherDraftingTask.title}
              </h2>
              <p className="text-xs text-slate-650 mt-0.5">
                Monte e salve as palavras que desejar para este rascunho usando os blocos abaixo. Cada linha no ábaco representará uma palavra no rascunho.
              </p>
            </div>
            
            <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-center">
              <button
                onClick={() => {
                  // Compile spelling words on the board
                  const finalWords = spelledRows
                    .map(row => row.map(l => l.letter).join("").trim())
                    .filter(w => w.length > 0)
                    .map(w => ({
                      word: w.toUpperCase(),
                      language: 'pt' as const,
                      color: '#1e293b'
                    }));

                  if (finalWords.length === 0) {
                    alert("Por favor, construa pelo menos uma palavra no ábaco para salvar!");
                    return;
                  }

                  // 1. Update teacher tasks in local storage
                  const local = localStorage.getItem('abba_teacher_tasks');
                  let tasksList: TaskItem[] = local ? JSON.parse(local) : [];
                  tasksList = tasksList.map(t => {
                    if (t.id === teacherDraftingTask.id) {
                      return {
                        ...t,
                        targetWords: finalWords
                      };
                    }
                    return t;
                  });
                  localStorage.setItem('abba_teacher_tasks', JSON.stringify(tasksList));

                  alert("Rascunho de atividade atualizado com as novas palavras! 🚀");
                  
                  // Go back to teacher dashboard
                  setTeacherDraftingTask(null);
                  setCurrentScreen('teacher-dashboard');
                }}
                className="inline-flex items-center justify-center gap-2 bg-[#00aa6c] hover:bg-[#00925c] text-white px-5 py-2.5 rounded-xl font-bold shadow-sm hover:shadow active:scale-95 transition-all text-sm cursor-pointer whitespace-nowrap border-none"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                <span>Salvar Palavras</span>
              </button>

              <button
                onClick={() => {
                  if (window.confirm("Deseja cancelar a configuração do rascunho? O progresso não salvo no ábaco será perdido.")) {
                    setTeacherDraftingTask(null);
                    setCurrentScreen('teacher-dashboard');
                  }
                }}
                className="inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-bold shadow-sm hover:shadow active:scale-95 transition-all text-sm cursor-pointer whitespace-nowrap border-none"
              >
                <span>Cancelar</span>
              </button>
            </div>
          </div>
        ) : activeReviewSubmission ? (
          <div className="bg-gradient-to-r from-[#0004fd]/10 via-[#0004fd]/5 to-transparent border border-[#0004fd]/20 rounded-3xl p-5 sm:p-6 text-left relative overflow-hidden shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="bg-[#0004fd] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Revisão de Atividade
                </span>
                <span className="text-gray-400 text-sm">•</span>
                <span className="text-gray-500 text-xs sm:text-sm font-medium">
                  {new Date(activeReviewSubmission.submittedAt).toLocaleDateString('pt-BR')} às {new Date(activeReviewSubmission.submittedAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
              <h2 className="font-display font-extrabold text-xl sm:text-2xl text-gray-950 tracking-tight leading-tight mb-1">
                {activeReviewSubmission.taskTitle || "Atividade do Ábaco"}
              </h2>
              <p className="text-gray-600 text-sm">
                Aluno(a): <strong className="text-gray-950 font-bold">{activeReviewSubmission.studentName}</strong>
              </p>
            </div>
            
            <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-center shrink-0">
              {/* Message / Chat button that opens the WhatsApp style chat modal */}
              <button
                type="button"
                title="Mensagens da Matéria"
                onClick={() => {
                  setChatSubject(activeReviewSubmission.taskTitle || "Exercício de Numerais Multilingue");
                  setChatMessage(reviewCommentText);
                  setTeacherReply(reviewTeacherReplySaved);
                  setShowChatModal(true);
                }}
                className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-all active:scale-95 cursor-pointer relative shrink-0"
              >
                <span className="material-symbols-outlined text-[20px]">message</span>
                {reviewCommentText && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsTeacherEditingReview(!isTeacherEditingReview)}
                className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold shadow-sm hover:shadow active:scale-95 transition-all text-sm cursor-pointer whitespace-nowrap border-none ${
                  isTeacherEditingReview 
                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-800' 
                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-150'
                }`}
                title={isTeacherEditingReview ? 'Clique para bloquear a edição do progresso' : 'Clique para habilitar a edição do progresso'}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isTeacherEditingReview ? 'edit_off' : 'edit'}
                </span>
                <span>{isTeacherEditingReview ? 'Bloquear Edição' : 'Editar Progresso'}</span>
              </button>

              <button
                onClick={handleSaveReviewSubmission}
                className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm hover:shadow active:scale-95 transition-all text-sm cursor-pointer whitespace-nowrap border-none animate-pulse"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                <span>Salvar</span>
              </button>

              <button
                onClick={handleCloseReviewMode}
                className="inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold shadow-sm hover:shadow active:scale-95 transition-all text-sm cursor-pointer whitespace-nowrap border-none"
              >
                <span>Voltar ao Painel</span>
              </button>
            </div>
          </div>
        ) : activeTaskInfo ? (
          <div className="bg-gradient-to-r from-green-500/10 via-green-500/5 to-transparent border border-green-200 rounded-3xl p-5 sm:p-6 text-left relative overflow-hidden shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="bg-green-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {lastSavedTask && lastSavedTask.title === activeTaskInfo.title ? 'Atividade Salva' : 'Atividade Atual'}
                </span>
                {lastSavedTask && lastSavedTask.title === activeTaskInfo.title && (
                  <>
                    <span className="text-gray-400 text-sm">•</span>
                    <span className="text-emerald-600 text-xs sm:text-sm font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] font-bold">check_circle</span>
                      Salva com sucesso!
                    </span>
                  </>
                )}
              </div>
              <h2 className="font-display font-extrabold text-xl sm:text-2xl text-gray-950 tracking-tight leading-tight mb-1">
                {activeTaskInfo.title}
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm font-medium mt-0.5">
                {lastSavedTask && lastSavedTask.title === activeTaskInfo.title
                  ? (isStudentEditing 
                      ? 'Modo de Edição Ativo. Modifique o tabuleiro e clique em "Salvar Atividade" para atualizar.' 
                      : 'Sua atividade está salva. Clique em "Editar Atividade" para destravar e modificar o ábaco.')
                  : 'Monte as palavras deslizando as letras e clique em "Salvar Atividade" para gravar o progresso.'
                }
              </p>
            </div>
            
            <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-center shrink-0">
              {/* Message / Chat button (only if saved previously) */}
              {lastSavedTask && lastSavedTask.title === activeTaskInfo.title && (
                <button
                  type="button"
                  title="Enviar mensagem para o professor"
                  onClick={() => {
                    setChatTarget({
                      studentName: user?.name || "Estudante",
                      taskId: activeTaskInfo.title.toLowerCase().replace(/\s+/g, '-'),
                      taskTitle: activeTaskInfo.title
                    });
                    setIsChatModalOpen(true);
                  }}
                  className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">chat</span>
                </button>
              )}

              {/* Edit toggle button (only if saved previously) */}
              {lastSavedTask && lastSavedTask.title === activeTaskInfo.title && (
                <button
                  type="button"
                  onClick={() => setIsStudentEditing(!isStudentEditing)}
                  className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold shadow-sm hover:shadow active:scale-95 transition-all text-sm cursor-pointer whitespace-nowrap border-none ${
                    isStudentEditing 
                      ? 'bg-amber-100 hover:bg-amber-200 text-amber-800' 
                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-150'
                  }`}
                  title={isStudentEditing ? 'Clique para bloquear a edição' : 'Clique para habilitar a edição'}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isStudentEditing ? 'edit_off' : 'edit'}
                  </span>
                  <span>{isStudentEditing ? 'Bloquear Edição' : 'Editar Atividade'}</span>
                </button>
              )}

              {/* Save activity button (visible if fresh or student editing is unlocked) */}
              {(!lastSavedTask || lastSavedTask.title !== activeTaskInfo.title || isStudentEditing) && (
                <button
                  onClick={handleSaveAndSubmitActivity}
                  className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm hover:shadow active:scale-95 transition-all text-sm cursor-pointer whitespace-nowrap border-none animate-pulse"
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  <span>Salvar Atividade</span>
                </button>
              )}

              {/* Trash delete button (only if saved previously) */}
              {lastSavedTask && lastSavedTask.title === activeTaskInfo.title && (
                <button
                  type="button"
                  title="Excluir atividade"
                  onClick={() => {
                    if (window.confirm("Deseja remover esta atividade salva permanentemente?")) {
                      try {
                        const localSent = localStorage.getItem('abba_student_sent_activities');
                        const sentList = localSent ? JSON.parse(localSent) : [];
                        const updated = sentList.filter((a: any) => a.taskTitle !== activeTaskInfo.title);
                        localStorage.setItem('abba_student_sent_activities', JSON.stringify(updated));
                        
                        setCompletedSpelledWords(prev => prev.filter(w => !lastSavedTask.words.some(lw => lw.word === w.word)));
                      } catch (e) {
                        console.error(e);
                      }
                      
                      const delPayload = {
                        student_name: user?.name || '',
                        task_title: activeTaskInfo.title
                      };
                      try {
                        const pendingDeletions = JSON.parse(localStorage.getItem('abba_pending_submission_deletions') || '[]');
                        if (!pendingDeletions.some((item: any) => item.student_name === delPayload.student_name && item.task_title === delPayload.task_title)) {
                          pendingDeletions.push(delPayload);
                          localStorage.setItem('abba_pending_submission_deletions', JSON.stringify(pendingDeletions));
                        }
                      } catch (e) {
                        console.error('Erro ao enfileirar exclusão de submissão:', e);
                      }

                      (async () => {
                        try {
                          const { error } = await supabase
                            .from('student_submissions')
                            .delete()
                            .eq('student_name', delPayload.student_name)
                            .eq('task_title', delPayload.task_title);
                          if (!error) {
                            console.log("🗑️ Submissão excluída do Supabase com sucesso!");
                            try {
                              const pendingDeletions = JSON.parse(localStorage.getItem('abba_pending_submission_deletions') || '[]');
                              const remaining = pendingDeletions.filter((item: any) => 
                                !(item.student_name === delPayload.student_name && item.task_title === delPayload.task_title)
                              );
                              localStorage.setItem('abba_pending_submission_deletions', JSON.stringify(remaining));
                            } catch (e) {
                              console.error(e);
                            }
                          }
                        } catch (err) {
                          console.warn(err);
                        }
                      })();

                      setLastSavedTask(null);
                      setSpelledRows([[], [], [], [], [], []]);
                      setRowColors({});
                      setSavedWordsList([]);
                      setIsStudentEditing(true);
                    }
                  }}
                  className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 hover:bg-red-100 text-red-650 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              )}

              {/* Back to student dashboard */}
              <button
                onClick={() => {
                  setActiveTaskInfo(null);
                  setLastSavedTask(null);
                  setSpelledRows([[], [], [], [], [], []]);
                  setRowColors({});
                  setSavedWordsList([]);
                  setIsStudentEditing(true);
                  setCurrentScreen('student-dashboard');
                }}
                className="inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold shadow-sm hover:shadow active:scale-95 transition-all text-sm cursor-pointer whitespace-nowrap border-none animate-none"
              >
                <span>Voltar ao Painel</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-left">
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-gray-950 tracking-tight leading-tight">
              Inovação Brasileira no ensino de línguas estrangeiras.
            </h2>
          </div>
        )}

        {/* Objective outside container */}
        {(() => {
          let description = "";
          
          if (activeReviewSubmission) {
            try {
              const local = localStorage.getItem('abba_teacher_tasks');
              const tasks = local ? JSON.parse(local) : [];
              const matched = tasks.find((t: any) => t.title === activeReviewSubmission.taskTitle);
              if (matched && matched.description) description = matched.description;
            } catch (e) {}

            if (!description) {
              if (activeReviewSubmission.taskTitle === 'Exercício de Numerais Multilingue') {
                description = 'Soletrar os numerais de 0 a 9 em Português, Inglês e Alemão usando as cores de fios correspondentes.';
              } else if (activeReviewSubmission.taskTitle === 'Gramática Básica - Unidade 4') {
                description = 'Exercícios práticos de tempos verbais e estruturação de frases no idioma nativo.';
              } else if (activeReviewSubmission.taskTitle === 'História das Civilizações') {
                description = 'Soletrar conceitos-chave do surgimento das sociedades clássicas.';
              } else if (activeReviewSubmission.taskTitle === 'Revisão de Verbos Irregulares') {
                description = 'Atividade concluída de conjugação de verbos em múltiplos idiomas.';
              } else if (activeReviewSubmission.taskTitle === 'Cálculo Diferencial Avançado') {
                description = 'Montar os símbolos fundamentais de cálculo no ábaco numérico.';
              } else {
                description = 'Soletrar as palavras indicadas no painel do ábaco para fixação de vocabulário e tradução bilíngue.';
              }
            }
          } else if (activeTaskInfo) {
            description = activeTaskInfo.summary;
          }

          if (!description) return null;

          return (
            <div className="text-left bg-transparent p-0 mt-2">
              <h1 className="font-display font-extrabold text-xl sm:text-2xl text-gray-950 tracking-tight leading-tight mb-2">
                Objetivo da tarefa
              </h1>
              <p className="text-gray-600 text-sm leading-relaxed">
                {description}
              </p>
            </div>
          );
        })()}

        {/* 1. INTERACTIVE CUBES GRID */}
        <section className={`bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 shadow-xs w-full text-left ${isCurrentlyDragging ? 'pointer-events-none' : ''}`}>
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
            className="grid grid-cols-5 gap-3 sm:gap-4 md:gap-5 w-full max-w-[384px] sm:max-w-[448px] md:max-w-[512px] mx-auto p-2 rounded-xl border border-transparent"
          >
            {shelfCubes.map((cube, cubeIdx) => (
              <div 
                key={cube.id} 
                className="aspect-square w-full shrink-0 text-left relative z-20"
                data-shelf-idx={cubeIdx}
              >
                <div 
                  className={`select-none transition-all duration-150 w-full h-full border-2 border-transparent rounded-2xl touch-none ${
                    draggedShelfIndex === cubeIdx 
                      ? 'opacity-30 scale-95 border-gray-300 border-dashed' 
                      : 'active:scale-95 cursor-grab'
                  }`}
                  style={{ touchAction: 'none' }}
                  onTouchStart={(e) => {
                    if (e.cancelable) e.preventDefault();
                  }}
                  onTouchMove={(e) => {
                    if (e.cancelable) e.preventDefault();
                  }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    // Only use setPointerCapture on desktop — on touch devices it triggers pointercancel
                    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
                    if (!isTouchDevice) {
                      try {
                        e.currentTarget.setPointerCapture(e.pointerId);
                      } catch (err) {}
                    }
                    if (isReorderCubesActive) {
                      setDraggedShelfIndex(cubeIdx);
                      draggedShelfIndexRef.current = cubeIdx;
                      dragLastTimeRef.current = performance.now();
                      dragLastMouseRef.current = { x: e.clientX, y: e.clientY };
                      dragVelocityRef.current = { x: 0, y: 0 };
                      setPointerPos({ x: e.clientX, y: e.clientY });
                      pointerPosRef.current = { x: e.clientX, y: e.clientY };
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
          className={`bg-white rounded-3xl border border-gray-150 p-5 sm:p-6 shadow-xs relative overflow-hidden w-full text-left font-sans animate-feed ${isCurrentlyDragging ? 'pointer-events-none' : ''}`}
        >
          <div className="flex flex-col gap-4 w-full">

            {/* SINGLE BOARD CONTAINER (Original style matching the grey dashed card, growing internally) */}
            <motion.div 
              ref={boardRef}
              className="w-full relative rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-4 sm:p-5 flex flex-col gap-5"
            >
              
              <AnimatePresence mode="popLayout">
                {spelledRows.map((row, rIdx) => {
                  const isActiveRow = activeRowIdx === rIdx;
                  const isLastRow = rIdx === spelledRows.length - 1;
                  const rowKey = rowIds[rIdx] || `row-box-fallback-${rIdx}`;

                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: -15, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ 
                        opacity: 0, 
                        y: 15, 
                        scale: 0.96,
                        transition: { duration: 0.15 }
                      }}
                      transition={{ 
                        type: "spring",
                        stiffness: 450,
                        damping: 32
                      }}
                      key={rowKey}
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
                                 if (isEditingBlocked) return;
                                 if (rowActiveModes[rIdx] === 'save') {
                                   handleOpenSaveModal(rIdx);
                                 } else {
                                   setRowActiveModes(prev => ({
                                     ...prev,
                                     [rIdx]: 'save'
                                   }));
                                 }
                               }}
                               onDoubleClick={(e) => {
                                 e.stopPropagation();
                                 if (isEditingBlocked) return;
                                 handleOpenSaveModal(rIdx);
                                }}
                               style={{ touchAction: 'manipulation' }}
                               className="z-10 w-[32px] h-[32px] flex items-center justify-center rounded-full cursor-pointer focus:outline-none transition-all hover:scale-105 active:scale-95"
                               title="Toque/Clique uma vez para selecionar; toque/clique novamente para salvar esta palavra"
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
                                 if (isEditingBlocked) return;
                                 if (rowActiveModes[rIdx] === 'scissors') {
                                   setCutWiresRows(prev => ({
                                     ...prev,
                                     [rIdx]: !prev[rIdx]
                                   }));
                                 } else {
                                   setRowActiveModes(prev => ({
                                     ...prev,
                                     [rIdx]: 'scissors'
                                   }));
                                 }
                               }}
                               onDoubleClick={(e) => {
                                 e.stopPropagation();
                                 if (isEditingBlocked) return;
                                 setCutWiresRows(prev => ({
                                   ...prev,
                                   [rIdx]: !prev[rIdx]
                                 }));
                                 setRowActiveModes(prev => ({
                                   ...prev,
                                   [rIdx]: 'scissors'
                                 }));
                               }}
                               style={{ touchAction: 'manipulation' }}
                               className="z-10 w-[32px] h-[32px] flex items-center justify-center rounded-full cursor-pointer focus:outline-none transition-all hover:scale-105 active:scale-95"
                               title="Toque/Clique uma vez para selecionar; toque/clique novamente para cortar/mostrar conexões"
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
                                 if (isEditingBlocked) return;
                                 if (rowActiveModes[rIdx] === 'trash') {
                                   handleDeleteRowWithHistory(rIdx);
                                 } else {
                                   setRowActiveModes(prev => ({
                                     ...prev,
                                     [rIdx]: 'trash'
                                   }));
                                 }
                               }}
                               onDoubleClick={(e) => {
                                 e.stopPropagation();
                                 if (isEditingBlocked) return;
                                 handleDeleteRowWithHistory(rIdx);
                               }}
                               style={{ touchAction: 'manipulation' }}
                               className="z-10 w-[32px] h-[32px] flex items-center justify-center rounded-full cursor-pointer focus:outline-none transition-all hover:scale-105 active:scale-95"
                               title="Toque/Clique uma vez para selecionar; toque/clique novamente para excluir esta palavra"
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
                          className="spelling-scroll-container w-full h-[calc((100vw-6.5rem)/4+8px)] min-h-[calc((100vw-6.5rem)/4+8px)] max-h-[calc((100vw-6.5rem)/4+8px)] sm:h-[74px] sm:min-h-[74px] sm:max-h-[74px] md:h-[84px] md:min-h-[84px] md:max-h-[84px] flex flex-nowrap items-center gap-3.5 py-1 px-1 overflow-x-auto no-scrollbar scroll-auto relative"
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
                            {(() => {
                              const elements: React.ReactNode[] = [];
                              
                              row.forEach((filledLetterObj, slotIdx) => {
                                if (!filledLetterObj || !filledLetterObj.letter) return;
                                
                                const isHoveredRow = dragHoverInfo !== null && dragHoverInfo.rIdx === rIdx;
                                const isBeingDragged = draggedTrayIndex && draggedTrayIndex.rIdx === rIdx && draggedTrayIndex.lIdx === slotIdx;
                                const isBeingReplaced = isHoveredRow && dragHoverInfo!.type === 'replace' && dragHoverInfo!.index === slotIdx;
                                
                                const matchedCubeData: LetterCubeData = {
                                  id: filledLetterObj.id,
                                  primaryLetter: filledLetterObj.letter,
                                  primaryOrdinal: filledLetterObj.originalOrdinal || `${slotIdx + 1}°`,
                                };
                                
                                // Insert indicator before this item if matched
                                if (isHoveredRow && dragHoverInfo!.type === 'insert' && dragHoverInfo!.index === slotIdx) {
                                  elements.push(
                                    <motion.div 
                                      layout
                                      key="row-insert-indicator"
                                      initial={{ scaleY: 0, opacity: 0, width: 0 }}
                                      animate={{ scaleY: 1, opacity: 1, width: "auto" }}
                                      exit={{ 
                                        scaleY: 0, 
                                        opacity: 0, 
                                        width: 0,
                                        transition: { duration: 0.05 }
                                      }}
                                      transition={{ type: "spring", stiffness: 450, damping: 25 }}
                                      className="relative w-0 h-[calc((100vw-6.5rem)/4)] sm:h-[66px] md:h-[76px] flex items-center justify-center shrink-0 z-35 select-none pointer-events-none"
                                    >
                                      <motion.div 
                                        initial={{ scaleY: 0, opacity: 0 }}
                                        animate={{ scaleY: 1, opacity: 1 }}
                                        exit={{ scaleY: 0, opacity: 0 }}
                                        transition={{ type: "spring", stiffness: 450, damping: 25 }}
                                        className="absolute w-[3px] h-4/5 rounded-full shadow-lg border"
                                        style={{ 
                                          backgroundColor: row.length > 0 ? (row[0].color || getRowColor(rIdx)) : getRowColor(rIdx), 
                                          borderColor: row.length > 0 ? (row[0].color || getRowColor(rIdx)) : getRowColor(rIdx) 
                                        }}
                                      />
                                    </motion.div>
                                  );
                                }
                                
                                elements.push(
                                  <motion.div 
                                     layout
                                     transition={{
                                       type: "spring",
                                       stiffness: 550,
                                       damping: 38
                                     }}
                                     key={filledLetterObj.id}
                                     id={filledLetterObj.id}
                                     data-row-idx={rIdx}
                                     data-slot-idx={slotIdx}
                                     initial={{ opacity: 0, scale: 1, y: 0, rotate: 0 }}
                                     animate={{ 
                                       opacity: isBeingDragged ? 0.35 : 1, 
                                       scale: isBeingReplaced ? 1.08 : (isBeingDragged ? 0.95 : 1), 
                                       y: 0, 
                                       rotate: 0,
                                       boxShadow: isBeingReplaced ? "0px 10px 25px -5px rgba(0,0,0,0.15)" : "0px 2px 8px -3px rgba(0,0,0,0.05)"
                                     }}
                                     exit={{ 
                                       opacity: 0, 
                                       scale: 0.35, 
                                       y: 12,
                                       transition: { 
                                         duration: 0.22,
                                         ease: [0.32, 0.94, 0.60, 1]
                                       } 
                                     }}
                                    className={`relative z-20 min-w-[calc((100vw-6.5rem)/4)] w-[calc((100vw-6.5rem)/4)] sm:min-w-[66px] sm:w-[66px] md:min-w-[76px] md:w-[76px] aspect-square flex items-center justify-center rounded-xl cursor-grab active:cursor-grabbing shrink-0 touch-none transition-shadow transition-colors duration-250 ${
                                      isBeingReplaced 
                                        ? 'ring-4 ring-offset-2' 
                                        : ''
                                    }`}
                                    style={isBeingReplaced ? { willChange: 'transform' } : undefined}
                                    onTouchStart={(e) => {
                                      // Only block native scroll when a tray drag is in progress
                                      if (draggedTrayIndexRef.current !== null || trayDragStartRef.current !== null) {
                                        if (e.cancelable) e.preventDefault();
                                      }
                                    }}
                                    onTouchMove={(e) => {
                                      // Only block native scroll when a tray drag is in progress
                                      if (draggedTrayIndexRef.current !== null || trayDragStartRef.current !== null) {
                                        if (e.cancelable) e.preventDefault();
                                      }
                                    }}
                                    onPointerDown={(e) => {
                                      if (isEditingBlocked) return;
                                      if (isBeingDragged) return;
                                      e.preventDefault();
                                      e.stopPropagation(); // Stop bubbling to prevent showing the scrollbar when grabbing a letter
                                      // Only use setPointerCapture on desktop — on touch it causes pointercancel killing drags
                                      const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
                                      if (!isTouchDevice) {
                                        try {
                                          e.currentTarget.setPointerCapture(e.pointerId);
                                        } catch (err) {}
                                      }
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
                                      {filledLetterObj.letter === ' ' ? (
                                        <div className="w-full h-full rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 flex items-center justify-center relative">
                                          <span className="material-symbols-outlined text-slate-400 text-[20px] select-none pointer-events-none">
                                            space_bar
                                          </span>
                                        </div>
                                      ) : (
                                        <LetterCube 
                                          data={matchedCubeData}
                                          variant="square"
                                          interactive={false}
                                          sizeClassName="w-full h-full"
                                          themeColor={filledLetterObj.color || getRowColor(rIdx)}
                                        />
                                      )}
                                    </motion.div>
                                  </motion.div>
                                );
                                
                                // Insert indicator after if it's the last item and matched
                                if (isHoveredRow && dragHoverInfo!.type === 'insert' && dragHoverInfo!.index === slotIdx + 1 && slotIdx === row.length - 1) {
                                  elements.push(
                                    <motion.div 
                                      layout
                                      key="row-insert-indicator"
                                      initial={{ scaleY: 0, opacity: 0, width: 0 }}
                                      animate={{ scaleY: 1, opacity: 1, width: "auto" }}
                                      exit={{ 
                                        scaleY: 0, 
                                        opacity: 0, 
                                        width: 0,
                                        transition: { duration: 0.05 }
                                      }}
                                      transition={{ type: "spring", stiffness: 450, damping: 25 }}
                                      className="relative w-0 h-[calc((100vw-6.5rem)/4)] sm:h-[66px] md:h-[76px] flex items-center justify-center shrink-0 z-35 select-none pointer-events-none"
                                    >
                                      <motion.div 
                                        initial={{ scaleY: 0, opacity: 0 }}
                                        animate={{ scaleY: 1, opacity: 1 }}
                                        exit={{ scaleY: 0, opacity: 0 }}
                                        transition={{ type: "spring", stiffness: 450, damping: 25 }}
                                        className="absolute w-[3px] h-4/5 rounded-full shadow-lg border"
                                        style={{ 
                                          backgroundColor: row.length > 0 ? (row[0].color || getRowColor(rIdx)) : getRowColor(rIdx), 
                                          borderColor: row.length > 0 ? (row[0].color || getRowColor(rIdx)) : getRowColor(rIdx) 
                                        }}
                                      />
                                    </motion.div>
                                  );
                                }
                              });
                              
                              // If row is completely empty, and dragHoverInfo is matched to insert
                              if (row.length === 0) {
                                const isHoveredRow = dragHoverInfo !== null && dragHoverInfo.rIdx === rIdx;
                                if (isHoveredRow && dragHoverInfo!.type === 'insert') {
                                  elements.push(
                                    <motion.div 
                                      layout
                                      key="row-insert-indicator"
                                      initial={{ scaleY: 0, opacity: 0, width: 0 }}
                                      animate={{ scaleY: 1, opacity: 1, width: "auto" }}
                                      exit={{ 
                                        scaleY: 0, 
                                        opacity: 0, 
                                        width: 0,
                                        transition: { duration: 0.05 }
                                      }}
                                      transition={{ type: "spring", stiffness: 450, damping: 25 }}
                                      className="relative w-0 h-[calc((100vw-6.5rem)/4)] sm:h-[66px] md:h-[76px] flex items-center justify-center shrink-0 z-35 select-none pointer-events-none"
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
                              }
                              
                              return elements;
                            })()}
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
                  disabled={undoHistory.length === 0}
                  className={`p-2 sm:p-2.5 border rounded-xl transition-all cursor-pointer shadow-2xs flex items-center justify-center ${
                    undoHistory.length > 0
                      ? 'bg-white hover:bg-indigo-50 border-indigo-200 hover:border-indigo-300 text-indigo-600 active:scale-95'
                      : 'bg-gray-50 border-gray-150 text-gray-300 cursor-not-allowed opacity-50'
                  }`}
                  title={undoHistory.length > 0 ? "Desfazer última exclusão de bloco ou palavra" : "Nada para desfazer"}
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
          const visibleWires: { letter: SpelledLetter; rIdx: number; lIdx: number }[] = [];
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

            // Hide the connection wire ONLY if the placed block has been scrolled past at the TOP of the board container
            if (boardRef.current) {
              const boardRect = boardRef.current.getBoundingClientRect();
              const letterEl = document.getElementById(letter.id);
              if (letterEl) {
                const rect = letterEl.getBoundingClientRect();
                // ONLY hide if the block goes above the top visible border of the board container!
                if (rect.bottom < boardRect.top + 4) {
                  return null;
                }
              }
            }

            // Get live coordinates directly from the DOM to ensure 100% lag-free tracking during slide animations!
            const startEl = document.getElementById(letter.originCubeId);
            const endEl = document.getElementById(letter.id);

            if (!startEl || !endEl) return null;

            const startRect = startEl.getBoundingClientRect();
            const endRect = endEl.getBoundingClientRect();

            const peers = originsMap[letter.originCubeId];
            const peerIndex = peers.indexOf(w);
            const totalPeers = peers.length;

            const clip = elementPositions[`row-clip-${rIdx}`];
            const trayBounds = elementPositions['tray-bounds'];

            // Compute outside boundary connection coordinates
            const startW = startRect.width;
            const startH = startRect.height;
            const endW = endRect.width;
            const endH = endRect.height;

            const startX = startRect.left + startW / 2 + window.scrollX;
            const startY = startRect.top + startH / 2 + window.scrollY;

            // start is a 3D shelf cube (variant="cube"), adjust center and sizes
            const startCenterX = startX + 0.1244 * startW;
            const startCenterY = startY + 0.1244 * startH;
            const startFaceW = 0.720 * startW;
            const startFaceH = 0.720 * startH;

            // end is a 2D board square (variant="square"), perfectly centered
            const endCenterX = endRect.left + endW / 2 + window.scrollX;
            const endCenterY = endRect.top + endH / 2 + window.scrollY;
            const endFaceW = endW;
            const endFaceH = endH;

            const dx = endCenterX - startCenterX;
            const dy = endCenterY - startCenterY;
            const dist = Math.hypot(dx, dy) || 1;
            const ux = dx / dist;
            const uy = dy / dist;

            // Base position on the cube boundary
            let baseX = startCenterX + ux * (startFaceW / 2);
            let baseY = startCenterY + uy * (startFaceH / 2);
            
            // Add spreading offset based on peers
            if (totalPeers > 1) {
                // If it's mainly going downwards, spread horizontally
                if (Math.abs(uy) > Math.abs(ux)) {
                   const spreadSpan = startFaceW * 0.7; // use 70% of the front face width
                   const offset = ((peerIndex / (totalPeers - 1)) - 0.5) * spreadSpan;
                   baseX = startCenterX + offset;
                   baseY = startCenterY + (Math.sign(uy) * startFaceH / 2);
                } else {
                   const spreadSpan = startFaceH * 0.7;
                   const offset = ((peerIndex / (totalPeers - 1)) - 0.5) * spreadSpan;
                   baseX = startCenterX + (Math.sign(ux) * startFaceW / 2);
                   baseY = startCenterY + offset;
                }
            }

            let wireStartX = startCenterX;
            let wireStartY = startCenterY + (startFaceH / 2);
            let wireEndX = endCenterX;
            let wireEndY = endCenterY - (endFaceH / 2);

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
                  style={{ transition: 'stroke 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
                />
                <path
                  d={pathData}
                  fill="none"
                  stroke={currentWireColor}
                  className="stroke-[1px] md:stroke-[1.6px]"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.85"
                  style={{ transition: 'stroke 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
                />
                <circle cx={wireStartX} cy={wireStartY} r="3" fill={currentWireColor} opacity="0.9" style={{ transition: 'fill 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }} />
                <circle cx={wireEndX} cy={wireEndY} r="3" fill={currentWireColor} opacity="0.9" style={{ transition: 'fill 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }} />
              </g>
            );
          });
        })()}

        {/* Real-time board letter dragging elastic wire connection line */}
        {!isReorderCubesActive && draggedBoardLetter && draggedTrayIndex !== null && (
          (() => {
            const startKey = draggedBoardLetter.originCubeId || draggedBoardLetter.id;
            const startEl = document.getElementById(startKey);
            if (!startEl) return null;

            const startRect = startEl.getBoundingClientRect();
            const currentDragPageX = pointerPos.x + window.scrollX;
            const currentDragPageY = pointerPos.y + window.scrollY;

            const startW = startRect.width;
            const startH = startRect.height;
            const endW = 66;
            const endH = 66;

            const isStart3D = startKey.startsWith('cube-');
            let startCenterX = startRect.left + startW / 2 + window.scrollX;
            let startCenterY = startRect.top + startH / 2 + window.scrollY;
            let startFaceW = startW;
            let startFaceH = startH;

            if (isStart3D) {
              startCenterX = startRect.left + startW / 2 + window.scrollX + 0.1244 * startW;
              startCenterY = startRect.top + startH / 2 + window.scrollY + 0.1244 * startH;
              startFaceW = 0.720 * startW;
              startFaceH = 0.720 * startH;
            }

            const dx = currentDragPageX - startCenterX;
            const dy = currentDragPageY - startCenterY;
            const dist = Math.hypot(dx, dy) || 1;
            const ux = dx / dist;
            const uy = dy / dist;

            const dragW = window.innerWidth < 640 ? (window.innerWidth - 104) / 4 : 66;
            const dragH = dragW;
            const dragFaceH = 0.720 * dragH;

            const wireStartX = startCenterX;
            const wireStartY = startCenterY + (startFaceH / 2);
            const wireEndX = currentDragPageX + 0.1244 * dragW;
            const wireEndY = currentDragPageY + 0.1244 * dragH - (dragFaceH / 2);

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
            const startEl = document.getElementById(`cube-${draggedCube.id}`);
            if (!startEl) return null;

            const startRect = startEl.getBoundingClientRect();
            const currentDragPageX = pointerPos.x + window.scrollX;
            const currentDragPageY = pointerPos.y + window.scrollY;
            
            const startW = startRect.width;
            const startH = startRect.height;
            const startX = startRect.left + startW / 2 + window.scrollX;
            const startY = startRect.top + startH / 2 + window.scrollY;

            // startCubePos represents a 3D shelf cube
            const startCenterX = startX + 0.1244 * startW;
            const startCenterY = startY + 0.1244 * startH;
            const startFaceW = 0.720 * startW;
            const startFaceH = 0.720 * startH;

            const dx = currentDragPageX - startCenterX;
            const dy = currentDragPageY - startCenterY;
            const dist = Math.hypot(dx, dy) || 1;
            const ux = dx / dist;
            const uy = dy / dist;

            const dragW = window.innerWidth < 640 ? (window.innerWidth - 104) / 4 : 66;
            const dragH = dragW;
            const dragFaceH = 0.720 * dragH;

            const edgeStartX = startCenterX;
            const edgeStartY = startCenterY + (startFaceH / 2);
            const edgeEndX = currentDragPageX + 0.1244 * dragW;
            const edgeEndY = currentDragPageY + 0.1244 * dragH - (dragFaceH / 2);

            const dragMidY = edgeStartY + (edgeEndY - edgeStartY) * 0.45;
            const livePathData = `M ${edgeStartX} ${edgeStartY} C ${edgeStartX} ${dragMidY}, ${edgeEndX} ${edgeStartY + (edgeEndY - edgeStartY) * 0.55}, ${edgeEndX} ${edgeEndY}`;

            // Adapte a cor do fio reativamente se pairado sobre uma linha com blocos
            const wireColor = getDragPreviewColor();

            return (
              <g>
                <path
                  d={livePathData}
                  fill="none"
                  stroke={wireColor}
                  strokeWidth="4"
                  strokeLinecap="round"
                  opacity="0.12"
                />
                <path
                  d={livePathData}
                  fill="none"
                  stroke={wireColor}
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.9"
                />
                <circle cx={edgeStartX} cy={edgeStartY} r="3.5" fill={wireColor} />
                <circle cx={edgeEndX} cy={edgeEndY} r="3.5" fill={wireColor} />
              </g>
            );
          })()
        )}
      </svg>

      {/* DRAG PREVIEWS */}
      <AnimatePresence>
        {((draggedCube && draggedLetter) || (draggedTrayIndex !== null && draggedBoardLetter !== null) || (draggedShelfIndex !== null)) && (
          <div
            className="pointer-events-none fixed z-50 w-[calc((100vw-6.5rem)/4)] h-[calc((100vw-6.5rem)/4)] sm:w-[66px] sm:h-[66px] md:w-[76px] md:h-[76px] -translate-x-1/2 -translate-y-1/2 overflow-visible"
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
              <div className={`relative w-full h-full transition-[opacity,transform] duration-200 ${isPointerInsideTray() ? 'opacity-100 scale-100' : 'opacity-40 scale-90'}`}>
                <LetterCube 
                  data={{
                    id: `floating-reorder-${draggedBoardLetter.id}`,
                    primaryLetter: draggedBoardLetter.letter,
                    primaryOrdinal: draggedBoardLetter.originalOrdinal || '1°',
                  }}
                  variant="square"
                  interactive={false}
                  sizeClassName="w-full h-full text-red-650"
                  themeColor={getDragPreviewColor()}
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
                themeColor={getDragPreviewColor()}
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
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(8px)',
              padding: '16px',
              boxSizing: 'border-box'
            }}
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
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(8px)',
              padding: '16px',
              boxSizing: 'border-box'
            }}
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
                                const wordToDelete = savedWordObj.word;
                                const updated = savedWordsList.filter((_, i) => i !== wIdx);
                                setSavedWordsList(updated);
                                localStorage.setItem('savedWords', JSON.stringify(updated));
                                
                                // Also clear the corresponding row in spelledRows so they stay perfectly in sync!
                                setSpelledRows(prev => {
                                  const next = prev.map(row => {
                                    const wordstr = row.map(l => l.letter).join("").trim();
                                    if (wordstr === wordToDelete) {
                                      return [];
                                    }
                                    return row;
                                  });
                                  return next;
                                });
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

      {/* TEACHER SAVE REVIEW SELECTION MODAL */}
      <AnimatePresence>
        {isTeacherSaveModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(8px)',
              padding: '16px',
              boxSizing: 'border-box'
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-white/75 backdrop-blur-2xl border border-white/45 rounded-3xl p-6 sm:p-8 flex flex-col shadow-[0_25px_50px_-12px_rgba(0,0,0,0.12)] text-slate-800"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-indigo-50 border border-indigo-150 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">edit_document</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-display leading-tight">
                    Alteração de Atividade
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold">Salvar progresso revisado</p>
                </div>
              </div>

              <div className="text-sm text-slate-700 font-medium mb-6 leading-relaxed">
                Você alterou essa tarefa, deseja salvar ou deixar como o aluno fez?
              </div>

              <div className="flex flex-col gap-3 mb-6">
                {/* Option A: Teacher's edits */}
                <label 
                  className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all select-none ${
                    teacherReviewSavedChoice === 'teacher'
                      ? 'bg-indigo-50/50 border-indigo-200 shadow-2xs'
                      : 'bg-white/40 border-slate-150 hover:bg-slate-50/40'
                  }`}
                  onClick={() => setTeacherReviewSavedChoice('teacher')}
                >
                  <input
                    type="radio"
                    name="teacherSavedChoice"
                    checked={teacherReviewSavedChoice === 'teacher'}
                    onChange={() => setTeacherReviewSavedChoice('teacher')}
                    className="mt-0.5 accent-indigo-600 cursor-pointer h-4 w-4 shrink-0"
                  />
                  <div>
                    <span className="text-sm font-bold text-slate-900 leading-tight block">
                      Salvar alterações feitas por mim (professor)
                    </span>
                    <span className="text-xs text-slate-500 font-semibold block mt-0.5">
                      Substitui o tabuleiro e salva suas edições de cubos, cores e wires.
                    </span>
                  </div>
                </label>

                {/* Option B: Student's original */}
                <label 
                  className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all select-none ${
                    teacherReviewSavedChoice === 'student'
                      ? 'bg-indigo-50/50 border-indigo-200 shadow-2xs'
                      : 'bg-white/40 border-slate-150 hover:bg-slate-50/40'
                  }`}
                  onClick={() => setTeacherReviewSavedChoice('student')}
                >
                  <input
                    type="radio"
                    name="teacherSavedChoice"
                    checked={teacherReviewSavedChoice === 'student'}
                    onChange={() => setTeacherReviewSavedChoice('student')}
                    className="mt-0.5 accent-indigo-600 cursor-pointer h-4 w-4 shrink-0"
                  />
                  <div>
                    <span className="text-sm font-bold text-slate-900 leading-tight block">
                      Deixar exatamente como o aluno enviou
                    </span>
                    <span className="text-xs text-slate-500 font-semibold block mt-0.5">
                      Descarta suas edições temporárias de cubos e mantém o trabalho original do aluno.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex items-center gap-3 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setIsTeacherSaveModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold transition-all text-sm cursor-pointer whitespace-nowrap border-none active:scale-95"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsTeacherSaveModalOpen(false);
                    handleConfirmSaveReview(teacherReviewSavedChoice);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm hover:shadow active:scale-95 transition-all text-sm cursor-pointer whitespace-nowrap border-none"
                >
                  Confirmar Salvar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CUBE EDIT MODAL */}
      <AnimatePresence>
        {isCubeEditModalOpen && activeEditCube && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(8px)',
              padding: '16px',
              boxSizing: 'border-box'
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-white/75 backdrop-blur-2xl border border-white/45 rounded-3xl p-6 sm:p-8 flex flex-col shadow-[0_25px_50px_-12px_rgba(0,0,0,0.12)] text-slate-800"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-50 border border-indigo-150 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">settings_accessibility</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-display leading-tight">
                    Editar Bloco do Ábaco
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    Cubo da Fila {activeEditCube.rIdx + 1} • Posição {activeEditCube.slotIdx + 1}
                  </p>
                </div>
              </div>

              {/* SECTION 1: COLOR SELECTION */}
              <div className="mb-6 bg-slate-50/50 border border-slate-150 rounded-2xl p-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
                  1. Mudar cor da Fila Inteira
                </span>
                <div className="flex gap-4 justify-center py-1">
                  {([
                    { name: 'black', hex: '#000000', label: 'Preto' },
                    { name: 'blue', hex: '#0004FD', label: 'Azul' },
                    { name: 'red', hex: '#FF0000', label: 'Vermelho' },
                    { name: 'green', hex: '#009246', label: 'Verde' }
                  ] as const).map(color => {
                    const rowColorHex = activeEditCube.letterObj.color || getRowColor(activeEditCube.rIdx);
                    const isSelected = rowColorHex === color.hex;
                    return (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => {
                          const { rIdx } = activeEditCube;
                          setRowColors(prev => ({ ...prev, [rIdx]: color.name }));
                          setSpelledRows(prev => {
                            const copy = prev.map((row, idx) => {
                              if (idx !== rIdx) return row;
                              return row.map(l => ({ ...l, color: color.hex }));
                            });
                            return copy;
                          });
                          setIsCubeEditModalOpen(false);
                          setActiveEditCube(null);
                        }}
                        className={`w-11 h-11 rounded-full border-4 cursor-pointer transition-all active:scale-90 flex items-center justify-center ${
                          isSelected ? 'border-indigo-600 scale-110 shadow-md' : 'border-white hover:scale-105'
                        }`}
                        style={{ backgroundColor: color.hex }}
                        title={`Mudar fio e cubos para ${color.label}`}
                      >
                        {isSelected && (
                          <span className="material-symbols-outlined text-white text-[18px] font-bold">check</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 2: EXCLUDE OPTIONS */}
              <div className="mb-6 bg-slate-50/50 border border-slate-150 rounded-2xl p-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
                  2. Excluir Cubo ou Fila
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const { rIdx, slotIdx } = activeEditCube;
                      setSpelledRows(prev => {
                        const copy = prev.map(r => [...r]);
                        if (copy[rIdx]) {
                          copy[rIdx].splice(slotIdx, 1);
                        }
                        return copy;
                      });
                      setIsCubeEditModalOpen(false);
                      setActiveEditCube(null);
                    }}
                    className="flex flex-col items-center justify-center gap-2 p-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-xl cursor-pointer transition-all active:scale-95 text-xs font-bold"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                    <span>Apenas este Cubo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const { rIdx } = activeEditCube;
                      handleRemoveRow(rIdx);
                      setIsCubeEditModalOpen(false);
                      setActiveEditCube(null);
                    }}
                    className="flex flex-col items-center justify-center gap-2 p-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl cursor-pointer transition-all active:scale-95 text-xs font-bold"
                  >
                    <span className="material-symbols-outlined text-[20px]">clear_all</span>
                    <span>Toda a Fila</span>
                  </button>
                </div>
              </div>

              {/* SECTION 3: SPACING OPTIONS */}
              <div className="mb-6 bg-slate-50/50 border border-slate-150 rounded-2xl p-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
                  3. Adicionar Espaçamento
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const { rIdx, slotIdx } = activeEditCube;
                      setSpelledRows(prev => {
                        const copy = prev.map(r => [...r]);
                        const spaceLetter: SpelledLetter = {
                          id: 'space-' + Math.random().toString(36).substring(2, 9),
                          letter: ' ',
                          originCubeId: 'space',
                          color: getRowColor(rIdx)
                        };
                        if (copy[rIdx]) {
                          copy[rIdx].splice(slotIdx, 0, spaceLetter);
                        }
                        return copy;
                      });
                      setIsCubeEditModalOpen(false);
                      setActiveEditCube(null);
                    }}
                    className="flex flex-col items-center justify-center gap-2 p-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 text-indigo-700 rounded-xl cursor-pointer transition-all active:scale-95 text-xs font-bold"
                  >
                    <span className="material-symbols-outlined text-[20px]">keyboard_double_arrow_left</span>
                    <span>Espaço à Esquerda</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const { rIdx, slotIdx } = activeEditCube;
                      setSpelledRows(prev => {
                        const copy = prev.map(r => [...r]);
                        const spaceLetter: SpelledLetter = {
                          id: 'space-' + Math.random().toString(36).substring(2, 9),
                          letter: ' ',
                          originCubeId: 'space',
                          color: getRowColor(rIdx)
                        };
                        if (copy[rIdx]) {
                          copy[rIdx].splice(slotIdx + 1, 0, spaceLetter);
                        }
                        return copy;
                      });
                      setIsCubeEditModalOpen(false);
                      setActiveEditCube(null);
                    }}
                    className="flex flex-col items-center justify-center gap-2 p-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 text-indigo-700 rounded-xl cursor-pointer transition-all active:scale-95 text-xs font-bold"
                  >
                    <span className="material-symbols-outlined text-[20px]">keyboard_double_arrow_right</span>
                    <span>Espaço à Direita</span>
                  </button>
                </div>
              </div>

              {/* FOOTER ACTIONS */}
              <div className="flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCubeEditModalOpen(false);
                    setActiveEditCube(null);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold transition-all text-sm cursor-pointer border-none active:scale-95"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SAVING TASK ACTIVITY OVERLAY */}
      <AnimatePresence>
        {isSavingActivity && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 flex flex-col items-center justify-center text-center select-none"
            >
              {/* Premium Rotating/Pulsing Spinner with gradient */}
              <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 border-r-emerald-500 animate-spin" />
                <span className="material-symbols-outlined text-[36px] text-emerald-500 animate-pulse">save</span>
              </div>
              
              <h3 className="text-xl font-bold text-white tracking-tight leading-tight">Salvando Palavra</h3>
              <p className="text-sm font-medium text-slate-400 mt-2 min-h-[40px] transition-all duration-300">
                Aguarde, estamos registrando no seu ábaco...
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SAVING LOADER OVERLAY */}
      <AnimatePresence>
        {isSavingInProgress && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 flex flex-col items-center justify-center text-center select-none"
            >
              <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-6 shadow-2xl">
                <span className="material-symbols-outlined text-[36px] text-emerald-500 animate-pulse">save</span>
              </div>
              
              <h3 className="text-xl font-bold text-white tracking-tight leading-tight">Salvando Atividade</h3>
              <p className="text-sm font-medium text-slate-400 mt-2 min-h-[40px] transition-all duration-300">
                {savingProgressText}
              </p>
              
              {/* Modern progress track */}
              <div className="w-48 h-1 bg-slate-800 rounded-full mt-4 overflow-hidden relative">
                <div className="absolute inset-y-0 left-0 bg-emerald-500 w-full animate-[fillProgress_3.2s_linear_infinite]" />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TASK CONCLUDED SUCCESS MODAL */}
      <AnimatePresence>
        {showSuccessModal && lastSavedTask && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 select-text">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowSuccessModal(false);
                setActiveTaskInfo(null);
                setCurrentScreen('student-dashboard');
              }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md cursor-pointer"
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col relative z-10 text-left min-h-[500px]"
            >
              {/* Header Decorative Confetti Ribbon */}
              <div className="h-2 bg-gradient-to-r from-emerald-400 via-teal-500 to-indigo-500" />
              
              <div className="p-6 sm:p-8 flex flex-col items-center text-center">
                {/* Checkmark icon with micro-animations */}
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 shadow-sm shadow-emerald-100">
                  <span className="material-symbols-outlined text-[32px] text-emerald-500 font-bold block animate-bounce">check_circle</span>
                </div>
                
                <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">Tarefa Salva no Sistema!</h3>
                <p className="text-sm font-medium text-slate-400 mt-1">Parabéns, sua atividade foi registrada e concluída com sucesso.</p>
                
                {/* Spelled Words & Details Box */}
                <div className="w-full mt-6 bg-slate-50 border border-slate-100 rounded-2xl p-4 sm:p-5 text-left flex flex-col gap-3.5 select-none">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Atividade Realizada</span>
                    <h4 className="text-[16px] font-bold text-slate-800 tracking-tight leading-tight mt-0.5">{lastSavedTask.title}</h4>
                  </div>
                  
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Palavras Soletradas ({lastSavedTask.words.length})</span>
                    <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto pr-1">
                      {lastSavedTask.words.length === 0 ? (
                        <span className="text-xs italic text-slate-400 font-medium">Nenhuma palavra gravada nesta rodada.</span>
                      ) : (
                        lastSavedTask.words.map((wordObj, i) => {
                          let langFlag = "🇧🇷";
                          let badgeBg = "bg-slate-100 border-slate-200 text-slate-700";
                          if (wordObj.themeColor === 'blue' || wordObj.themeColor === '#0052cc') {
                            langFlag = "🇺🇸";
                            badgeBg = "bg-blue-50 border-blue-150 text-blue-700";
                          } else if (wordObj.themeColor === 'red' || wordObj.themeColor === '#ef4444') {
                            langFlag = "🇩🇪";
                            badgeBg = "bg-red-50 border-red-150 text-red-700";
                          } else if (wordObj.themeColor === 'green' || wordObj.themeColor === '#10b981') {
                            langFlag = "🇮🇹";
                            badgeBg = "bg-emerald-50 border-emerald-150 text-emerald-700";
                          }
                          return (
                            <div key={i} className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-mono font-bold tracking-wide shadow-3xs ${badgeBg}`}>
                              <span>{langFlag}</span>
                              <span>{wordObj.word}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="border-t border-slate-200/60 pt-3 flex justify-between items-center text-xs font-medium text-slate-500">
                    <span>Estudante: {user?.name || "Estudante"}</span>
                    <span>{new Date().toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleDownloadTaskCode}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 bg-[#0052cc] hover:bg-[#0043a4] text-white font-bold text-sm rounded-xl shadow cursor-pointer transition-all active:scale-[0.98] border-none"
                >
                  <span className="material-symbols-outlined text-[20px]">download</span>
                  Baixar Confirmação (.txt)
                </button>
                
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    setActiveTaskInfo(null);
                    setCurrentScreen('student-dashboard');
                  }}
                  className="py-3 px-6 bg-slate-200 hover:bg-slate-350 text-slate-700 font-bold text-sm rounded-xl cursor-pointer transition-colors border-none"
                >
                  Voltar ao Painel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* PREMIUM CHAT UPLOAD MODAL BY SUBJECT */}
      <AnimatePresence>
        {showChatModal && (
          <div className="fixed inset-0 z-[99999] flex items-stretch md:items-center justify-stretch md:justify-center p-0 md:p-4 antialiased select-none">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowChatModal(false);
              }}
              className="absolute inset-0 bg-[#0B1121]/60 backdrop-blur-sm cursor-pointer hidden md:block"
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative z-10 w-full h-full md:h-auto md:max-w-[620px] lg:max-w-[850px] bg-white md:bg-gradient-to-b md:from-white/70 md:via-white/20 md:to-black/[0.04] p-0 md:p-[1px] rounded-none md:rounded-[32px] shadow-none md:shadow-[0_15px_35px_rgba(15,23,42,0.06)] overflow-hidden"
            >
              <div className="bg-white rounded-none md:rounded-[31px] p-4 sm:p-5 lg:p-8 flex flex-col gap-3 md:gap-4 text-left border-none md:border md:border-black/[0.02] relative w-full h-[100dvh] md:h-[550px] lg:h-[650px] max-h-[100dvh] md:max-h-[90vh] justify-between overflow-hidden">
                
                {/* Header Actions: Fechar and Excluir Lixeira (Always Visible and Active!) */}
                <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
                  <button
                    onClick={handleDeleteComment}
                    title="Excluir Comentário"
                    className="w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors border-none cursor-pointer"
                  >
                    <img 
                      src="/icones/lixeira.svg" 
                      alt="Excluir" 
                      className="w-4 h-4 object-contain filter invert-[20%] sepia-[90%] saturate-[6000%] hue-rotate-[350deg]" 
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                        const span = document.createElement('span');
                        span.className = "material-symbols-outlined text-red-600 text-[18px]";
                        span.innerText = "delete";
                        (e.target as HTMLElement).parentNode?.appendChild(span);
                      }}
                    />
                  </button>
                  <button
                    onClick={() => {
                      setShowChatModal(false);
                    }}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors border-none cursor-pointer font-bold text-xs"
                    title="Fechar"
                  >
                    ✕
                  </button>
                </div>

                {/* Dashed Upload / Header box */}
                <div className="w-full py-4 md:py-8 border md:border-2 border-dashed border-slate-200/80 rounded-2xl flex flex-col items-center justify-center bg-slate-50/40 relative shrink-0">
                  <div className="flex items-center -space-x-2 mb-3">
                    <div className="w-8 h-8 bg-white border border-slate-100 rounded-lg flex items-center justify-center p-1 shadow-xs rotate-[-6deg]">
                      <img 
                        src="/icones/LINK1.svg" 
                        alt="Link1" 
                        className="w-full h-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://res.cloudinary.com/dudmozd8z/image/upload/v1780112648/link-square-svgrepo-com_xspcrf.svg";
                        }}
                      />
                    </div>
                    <div className="w-8 h-8 bg-white border border-slate-100 rounded-lg flex items-center justify-center p-1.5 shadow-xs z-10">
                      <img 
                        src="/icones/LINK2.svg" 
                        alt="Link" 
                        className="w-full h-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://res.cloudinary.com/dudmozd8z/image/upload/v1780030910/LINK_SVG_x0b9c3.svg";
                        }}
                      />
                    </div>
                    <div className="w-8 h-8 bg-white border border-slate-100 rounded-lg flex items-center justify-center p-1 shadow-xs rotate-[8deg]">
                      <img 
                        src="/icones/LINK3.svg" 
                        alt="Link2" 
                        className="w-full h-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://res.cloudinary.com/dudmozd8z/image/upload/v1780112648/link-circle-svgrepo-com_snvxqq.svg";
                        }}
                      />
                    </div>
                  </div>
                  <h4 className="text-[14px] lg:text-[16px] font-black text-slate-800 tracking-tight">
                    {user?.role === 'teacher' ? chatSubject : "Envie sua tarefa"}
                  </h4>
                  <p className="text-[11px] lg:text-[12px] font-medium text-slate-400 mt-1 px-4 text-center">
                    {user?.role === 'teacher' ? (
                      <>
                        revise essa matéria adicionando um comentário sobre
                      </>
                    ) : (
                      <>
                        Você pode mandar uma mensagem para o professor Décio sobre a matéria: <strong className="text-emerald-600 font-semibold">{chatSubject}</strong>
                      </>
                    )}
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto w-full my-1 pr-1 py-1">
                  {(() => {
                    const messages = getConversationMessages(chatMessage, teacherReply);
                    if (messages.length === 0) {
                      return (
                        <div className="text-center py-6 text-slate-400 font-medium text-[12px]">
                          Nenhuma mensagem enviada para esta matéria ainda. Digite abaixo para iniciar!
                        </div>
                      );
                    }
                    
                    return (
                      <div className="flex flex-col gap-3 w-full">
                        {messages.map((msg: any, i: number) => {
                          const isTeacherMsg = msg.role === 'teacher';
                          if (isTeacherMsg) {
                            return (
                              <div key={i} className="flex justify-end w-full pl-10 animate-fade-in">
                                <div className="bg-[#0075e0] text-[#ffffff] text-[12px] font-semibold px-4 py-2.5 rounded-2xl rounded-tr-xs border border-slate-100 shadow-3xs leading-relaxed max-w-[90%] break-words whitespace-pre-wrap">
                                  {msg.text}
                                </div>
                              </div>
                            );
                          } else {
                            const displayName = user?.role === 'teacher' && activeReviewSubmission 
                              ? activeReviewSubmission.studentName 
                              : (msg.senderName || user?.name || "Nome do Aluno");
                            return (
                              <div key={i} className="flex items-start gap-3 max-w-[90%] animate-fade-in">
                                <div className="w-7 h-7 bg-slate-200 rounded-full overflow-hidden shrink-0 mt-2 flex items-center justify-center text-[10px] text-slate-500 font-bold">
                                  <img 
                                    src="/padrao/foto-do-perfil.avif" 
                                    className="w-full h-full object-cover" 
                                    alt="User"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100";
                                    }}
                                  />
                                </div>
                                
                                <div className="flex flex-col gap-1.5 flex-1">
                                  <h3 className="text-[13px] font-bold text-slate-900 tracking-wide ml-0.5 capitalize">
                                    {displayName}
                                  </h3>
                                  
                                  <div className="bg-[#f4f6f8] text-[#475569] text-[12px] font-medium p-3 rounded-2xl rounded-tl-none border border-slate-100 shadow-3xs leading-relaxed break-words whitespace-pre-wrap">
                                    {msg.text}
                                  </div>
                                </div>
                              </div>
                            );
                          }
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* Input box and buttons */}
                <div className="w-full bg-[#f4f6f9] rounded-full px-4 py-2 flex items-center justify-between border border-slate-200/60 gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 cursor-pointer hover:stroke-slate-500 transition-colors">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="16"></line>
                      <line x1="8" y1="12" x2="16" y2="12"></line>
                    </svg>
                    
                    <textarea 
                      rows={1}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Clique aqui para digitar sua mensagem..." 
                      className="w-full bg-transparent border-none outline-none text-[13px] font-medium text-slate-600 placeholder-slate-400/90 p-0 resize-none overflow-hidden flex-1 self-center mt-[2px] h-[20px]"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (chatInput.trim()) {
                            handleSaveComment(chatInput, false);
                          }
                        }
                      }}
                    />
                  </div>
                  
                  <div className="flex items-center shrink-0 gap-2">
                    {/* Salvar Button (Saves and closes modal) */}
                    <button
                      onClick={() => handleSaveComment(chatInput, true)}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-[12px] font-bold shadow transition-all active:scale-95 border-none cursor-pointer"
                    >
                      Salvar
                    </button>
                    
                    {/* Enviar Button (Sends message and keeps modal open, WhatsApp style) */}
                    <button 
                      onClick={() => handleSaveComment(chatInput, false)}
                      disabled={!chatInput.trim()}
                      className="w-8 h-8 bg-[#0B1121] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center shadow-md hover:bg-slate-800 transition-all active:scale-95 border-none cursor-pointer"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* STUDENT CHAT WHATSAPP MODAL */}
      <AnimatePresence>
        {isChatModalOpen && chatTarget && (
          <div className="fixed inset-0 z-[99999] flex items-stretch md:items-center justify-stretch md:justify-center p-0 md:p-4 select-text">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsChatModalOpen(false);
                setChatTarget(null);
              }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md cursor-pointer hidden md:block"
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full h-full md:h-auto md:max-w-[580px] lg:max-w-[850px] bg-white md:bg-gradient-to-b md:from-white/70 md:via-white/20 md:to-black/[0.04] p-0 md:p-[1px] rounded-none md:rounded-[32px] shadow-none md:shadow-[0_15px_35px_rgba(15,23,42,0.06)] relative z-10 overflow-hidden"
            >
              <div className="bg-white rounded-none md:rounded-[31px] p-4 sm:p-5 lg:p-8 flex flex-col gap-3 md:gap-4 text-left border-none md:border md:border-black/[0.02] w-full h-[100dvh] md:h-[550px] lg:h-[650px] max-h-[100dvh] md:max-h-[90vh] justify-between overflow-hidden relative">
                
                {/* Header Container */}
                <div className="w-full py-3 md:py-5 border border-dashed border-slate-200/80 rounded-2xl flex flex-col items-center justify-center bg-slate-50/40 relative shrink-0">
                  {/* Close button */}
                  <button 
                    onClick={() => {
                      setIsChatModalOpen(false);
                      setChatTarget(null);
                    }}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer border-none"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>

                  <div className="flex items-center -space-x-2 mb-2">
                    <div className="w-8 h-8 bg-white border border-slate-100 rounded-lg flex items-center justify-center p-1 shadow-xs rotate-[-6deg]">
                      <img src="https://res.cloudinary.com/dudmozd8z/image/upload/v1780112648/link-square-svgrepo-com_xspcrf.svg" alt="Link1" className="w-full h-full" />
                    </div>
                    <div className="w-8 h-8 bg-white border border-slate-100 rounded-lg flex items-center justify-center p-1.5 shadow-xs z-10">
                      <img src="https://res.cloudinary.com/dudmozd8z/image/upload/v1780030910/LINK_SVG_x0b9c3.svg" alt="Link" className="w-full h-full" />
                    </div>
                    <div className="w-8 h-8 bg-white border border-slate-100 rounded-lg flex items-center justify-center p-1 shadow-xs rotate-[8deg]">
                      <img src="https://res.cloudinary.com/dudmozd8z/image/upload/v1780112648/link-circle-svgrepo-com_snvxqq.svg" alt="Link2" className="w-full h-full" />
                    </div>
                  </div>
                  <h4 className="text-[14px] font-extrabold text-slate-800 tracking-tight">Envie sua tarefa</h4>
                  <p className="text-[11px] font-medium text-slate-400 mt-0.5 text-center px-6">
                    Você pode mandar uma mensagem para o professor sobre a atividade <strong>{chatTarget.taskTitle}</strong>.
                  </p>
                </div>

                {/* Conversation History Area */}
                <div className="flex flex-col gap-3 w-full my-1 overflow-y-auto pr-1 py-1 flex-1">
                  {(() => {
                    const filtered = chatMessages.filter(
                      (m: any) => m.taskId === chatTarget.taskId && m.studentName.toLowerCase().trim() === chatTarget.studentName.toLowerCase().trim()
                    );
                    
                    if (filtered.length === 0) {
                      return (
                        <div className="py-8 text-center text-xs text-slate-400 font-medium italic">
                          Nenhuma mensagem enviada ainda. Escreva abaixo para iniciar a conversa!
                        </div>
                      );
                    }
                    
                    return filtered.map((msg: any) => {
                      const isStudent = msg.senderRole === 'student';
                      
                      if (isStudent) {
                        return (
                          <div key={msg.id} className="flex justify-end w-full pl-10 animate-fade-in">
                            <div className="bg-[#0075e0] text-[#ffffff] text-[12px] font-medium px-4 py-2.5 rounded-2xl rounded-tr-xs border border-blue-600/30 shadow-3xs leading-relaxed max-w-[85%] break-words">
                              {msg.text}
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div key={msg.id} className="flex items-start gap-3 max-w-[90%] animate-fade-in">
                            <div className="w-7 h-7 bg-slate-200 rounded-full overflow-hidden shrink-0 mt-4 flex items-center justify-center text-[10px] text-slate-500 font-bold border border-slate-350">
                              <span className="material-symbols-outlined text-[14px] text-slate-600">person</span>
                            </div>
                            
                            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                              <h3 className="text-[10px] font-extrabold text-slate-400 tracking-wide ml-0.5 capitalize">
                                {msg.senderName}
                              </h3>
                              <div className="bg-[#f4f6f8] text-[#475569] text-[12px] font-medium p-3 rounded-2xl rounded-tl-none border border-slate-100 shadow-3xs leading-relaxed break-words">
                                {msg.text}
                              </div>
                            </div>
                          </div>
                        );
                      }
                    });
                  })()}
                  <div id="student-chat-bottom" />
                </div>

                {/* Input bar */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const inputEl = form.elements.namedItem('chatInput') as HTMLInputElement;
                    const text = inputEl.value.trim();
                    if (!text) return;
                    
                    const newMsg = {
                      id: `MSG-${Date.now()}`,
                      taskId: chatTarget.taskId,
                      studentName: chatTarget.studentName,
                      senderRole: 'student',
                      senderName: chatTarget.studentName,
                      text,
                      timestamp: new Date().toISOString()
                    };
                    
                    const updated = [...chatMessages, newMsg];
                    setChatMessages(updated);
                    localStorage.setItem('abba_task_chats', JSON.stringify(updated));
                    
                    inputEl.value = '';
                    
                    setTimeout(() => {
                      const el = document.getElementById('student-chat-bottom');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }, 50);
                  }}
                  className="w-full bg-[#f4f6f9] rounded-full px-4 py-2 flex items-center justify-between border border-slate-200/60 gap-3"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 cursor-pointer hover:stroke-slate-500 transition-colors">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="16"></line>
                      <line x1="8" y1="12" x2="16" y2="12"></line>
                    </svg>
                    
                    <input
                      name="chatInput"
                      autoComplete="off"
                      placeholder="Clique aqui para digitar sua mensagem..." 
                      className="w-full bg-transparent border-none outline-none text-[13px] font-semibold text-slate-700 placeholder-slate-400 p-0 flex-1 self-center mt-[1px]"
                    />
                  </div>
                  
                  <div className="flex items-center shrink-0">
                    <button 
                      type="submit"
                      className="w-8 h-8 bg-[#0B1121] text-white rounded-full flex items-center justify-center shadow-md hover:bg-slate-800 transition-all active:scale-95 cursor-pointer border-none"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </button>
                  </div>
                </form>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
