import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, TaskItem, SavedWord } from '../types';
import abbaLogo from '../assets/logo abba.svg';
import { cardImageBase64 } from '../base64Data/cardBase64';
import Loader from './Loader';
import { supabase, logUserAction } from '../supabaseClient';

const parseTeacherNoteAndFiles = (rawNote: string) => {
  if (!rawNote) return { note: '', files: [] };
  const marker = '__SUPPORT_FILES_JSON__:';
  const index = rawNote.indexOf(marker);
  if (index !== -1) {
    const note = rawNote.substring(0, index);
    const filesJson = rawNote.substring(index + marker.length);
    try {
      return { note, files: JSON.parse(filesJson) };
    } catch {
      return { note, files: [] };
    }
  }
  return { note: rawNote, files: [] };
};

const serializeTeacherNoteAndFiles = (note: string, files: any[]) => {
  if (!files || files.length === 0) return note;
  return `${note}__SUPPORT_FILES_JSON__:${JSON.stringify(files)}`;
};

interface StudentDashboardProps {
  user: User;
  onUpdateUser?: (updated: User) => void;
  onLogout: () => void;
  onLaunchSpellingTask: (word: string, language: 'pt' | 'en' | 'de', color: string) => void;
  completedSpelledWords: SavedWord[];
  onRemoveCompletedWord: (index: number) => void;
  onClearCompletedWords: () => void;
  onGoToAbacus?: (title?: string, summary?: string) => void;
  onGoToLanding?: () => void;
}

// Preset list of 27 bilingual numerical items (0-9 in Portuguese, English, German)
const NUMERAL_ITEMS: { word: string; target?: string; language: 'pt' | 'en' | 'de'; langLabel: string; color: string }[] = [
  { word: 'ZERO', language: 'pt', langLabel: 'Português', color: '#1e293b' },
  { word: 'UM', language: 'pt', langLabel: 'Português', color: '#1e293b' },
  { word: 'DOIS', language: 'pt', langLabel: 'Português', color: '#1e293b' },
  { word: 'TRÊS', language: 'pt', langLabel: 'Português', color: '#1e293b' },
  { word: 'QUATRO', language: 'pt', langLabel: 'Português', color: '#1e293b' },
  { word: 'CINCO', language: 'pt', langLabel: 'Português', color: '#1e293b' },
  { word: 'SEIS', language: 'pt', langLabel: 'Português', color: '#1e293b' },
  { word: 'SETE', language: 'pt', langLabel: 'Português', color: '#1e293b' },
  { word: 'OITO', language: 'pt', langLabel: 'Português', color: '#1e293b' },
  { word: 'NOVE', language: 'pt', langLabel: 'Português', color: '#1e293b' },

  { word: 'ZERO_EN', target: 'ZERO', language: 'en', langLabel: 'Inglês', color: '#3b82f6' },
  { word: 'ONE', language: 'en', langLabel: 'Inglês', color: '#3b82f6' },
  { word: 'TWO', language: 'en', langLabel: 'Inglês', color: '#3b82f6' },
  { word: 'THREE', language: 'en', langLabel: 'Inglês', color: '#3b82f6' },
  { word: 'FOUR', language: 'en', langLabel: 'Inglês', color: '#3b82f6' },
  { word: 'FIVE', language: 'en', langLabel: 'Inglês', color: '#3b82f6' },
  { word: 'SIX', language: 'en', langLabel: 'Inglês', color: '#3b82f6' },
  { word: 'SEVEN', language: 'en', langLabel: 'Inglês', color: '#3b82f6' },
  { word: 'EIGHT', language: 'en', langLabel: 'Inglês', color: '#3b82f6' },
  { word: 'NINE', language: 'en', langLabel: 'Inglês', color: '#3b82f6' },

  { word: 'NULL', language: 'de', langLabel: 'Alemão', color: '#ef4444' },
  { word: 'EINS', language: 'de', langLabel: 'Alemão', color: '#ef4444' },
  { word: 'ZWEI', language: 'de', langLabel: 'Alemão', color: '#ef4444' },
  { word: 'DREI', language: 'de', langLabel: 'Alemão', color: '#ef4444' },
  { word: 'VIER', language: 'de', langLabel: 'Alemão', color: '#ef4444' },
  { word: 'FÜNF', language: 'de', langLabel: 'Alemão', color: '#ef4444' },
  { word: 'SECHS', language: 'de', langLabel: 'Alemão', color: '#ef4444' }
];

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  user,
  onUpdateUser,
  onLogout,
  onLaunchSpellingTask,
  completedSpelledWords,
  onRemoveCompletedWord,
  onClearCompletedWords,
  onGoToAbacus,
  onGoToLanding
}) => {
  const [filterLanguage, setFilterLanguage] = useState<'all' | 'pt' | 'en' | 'de'>('all');
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showProcessingQueue, setShowProcessingQueue] = useState(false);
  const [processingType, setProcessingType] = useState<'pdf' | 'link' | null>(null);

  const [showSpellingLoader, setShowSpellingLoader] = useState(false);
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState('Olá Professor, tenho uma dúvida sobre a atividade.');
  const [whatsappName, setWhatsappName] = useState(user.name);
  const [isWhatsappSending, setIsWhatsappSending] = useState(false);

  // Screen Toggles and Upload state parameters
  const [studentView, setStudentView] = useState<'tasks-list' | 'details'>(() => {
    const saved = localStorage.getItem('abba_student_view');
    if (saved === 'tasks-list' || saved === 'details') {
      return saved;
    }
    return 'tasks-list';
  });
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');
  const [generalSearchQuery, setGeneralSearchQuery] = useState('');
  const [taskFiles, setTaskFiles] = useState<{ name: string; size: string }[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [showMobileAvatarSelector, setShowMobileAvatarSelector] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const PRESET_AVATARS = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150",
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150&h=150",
    "https://images.unsplash.com/photo-1491349174775-aaafddd81942?auto=format&fit=crop&q=80&w=150&h=150",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150&h=150",
    "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=150&h=150",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150&h=150",
    "https://res.cloudinary.com/dudmozd8z/image/upload/v1780030087/USUARIOS_ndwkzb.svg"
  ];

  const handleSelectAvatar = async (imgUrl: string) => {
    const updatedUser = { ...user, img: imgUrl };
    if (onUpdateUser) {
      onUpdateUser(updatedUser);
    }
    localStorage.setItem('abba_logged_in_user', JSON.stringify(updatedUser));
    
    try {
      const { error } = await supabase
        .from('students')
        .update({ img: imgUrl })
        .eq('name', user.name);
      
      if (!error) {
        console.log('⚡ Avatar do estudante sincronizado com o Supabase!');
      }
      
      await logUserAction({
        userName: user.name,
        userEmail: user.email || 'aluno@abbadigital.com',
        role: 'student',
        actionType: 'update_avatar',
        actionDetails: `Atualizou sua imagem de perfil no sistema.`
      });
    } catch (err) {
      console.warn('Erro ao atualizar avatar no Supabase:', err);
    }
    setShowAvatarSelector(false);
    setShowMobileAvatarSelector(false);
  };

  const [uploadLink, setUploadLink] = useState('');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [excludedSearchTaskIds, setExcludedSearchTaskIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('abba_excluded_search_tasks');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('abba_excluded_search_tasks', JSON.stringify(excludedSearchTaskIds));
  }, [excludedSearchTaskIds]);

  // --- Smart Teacher Link Validation States ---
  type ValidatedTaskLink = {
    id: string;
    studentName: string;
    taskId: string;
    taskTitle: string;
    createdAt: string;
    link: string;
  };

  const [validatedLink, setValidatedLink] = useState<ValidatedTaskLink | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [isValidatingLink, setIsValidatingLink] = useState(false);

  // Stored accepted task links (localStorage + Supabase sync)
  const [acceptedTaskLinks, setAcceptedTaskLinks] = useState<ValidatedTaskLink[]>(() => {
    try {
      const raw = localStorage.getItem('abba_student_accepted_links');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  // Dynamic filter tab labels above cards
  const [activeTabLabel, setActiveTabLabel] = useState<'recebidas' | 'enviadas'>('recebidas');

  // Stored sent/submitted activities
  const [sentActivities, setSentActivities] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('abba_student_sent_activities');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  // Persist accepted links to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('abba_student_accepted_links', JSON.stringify(acceptedTaskLinks));
  }, [acceptedTaskLinks]);

  // Prevenção de duplicidades e notificações
  const [showAlreadyAssignedModal, setShowAlreadyAssignedModal] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);

  // Refs for click outside detection on header dropdowns
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const bellButtonRef = useRef<HTMLButtonElement>(null);
  const avatarButtonRef = useRef<HTMLButtonElement>(null);
  const mobileProfileMenuRef = useRef<HTMLDivElement>(null);
  const mobileAvatarSelectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (showNotificationsDropdown) {
        if (
          notificationsRef.current &&
          !notificationsRef.current.contains(event.target as Node) &&
          bellButtonRef.current &&
          !bellButtonRef.current.contains(event.target as Node)
        ) {
          setShowNotificationsDropdown(false);
        }
      }
      if (showProfileMenu) {
        const clickedOutsideDesktop = !profileMenuRef.current || !profileMenuRef.current.contains(event.target as Node);
        const clickedOutsideMobile = !mobileProfileMenuRef.current || !mobileProfileMenuRef.current.contains(event.target as Node);
        const clickedOutsideAvatarBtn = !avatarButtonRef.current || !avatarButtonRef.current.contains(event.target as Node);
        
        if (clickedOutsideDesktop && clickedOutsideMobile && clickedOutsideAvatarBtn) {
          setShowProfileMenu(false);
        }
      }
      if (showMobileAvatarSelector) {
        const clickedOutsideMobileSelector = !mobileAvatarSelectorRef.current || !mobileAvatarSelectorRef.current.contains(event.target as Node);
        if (clickedOutsideMobileSelector) {
          setShowMobileAvatarSelector(false);
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotificationsDropdown, showProfileMenu, showMobileAvatarSelector]);
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'unread'>('all');
  const [readNotifications, setReadNotifications] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('abba_read_notifications');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  const [teacherTasks, setTeacherTasks] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('abba_teacher_tasks');
      const parsed = raw ? JSON.parse(raw) : [];
      if (parsed.length === 0) {
        const defaultStudentId = user.codeSession?.codeId || user.email || 'st-unknown';
        const defaultStudentName = user.name || 'Estudante';
        return [
          {
            id: 'numerais',
            title: 'Exercício de Numerais Multilingue',
            description: 'Soletrar e gravar no ábaco digital os numerais de 0 a 9 em Português, Inglês e Alemão. Use os fios suspensos de costura correspondentes para ligar as prateleiras de letras.',
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'active',
            targetWords: ['ZERO', 'ONE', 'ZWEI', 'FIVE', 'NOVE'],
            priority: 'Alta',
            assignedStudentIds: [defaultStudentId, defaultStudentName, 'st-unknown'],
            startDate: new Date().toISOString(),
            teacherNote: 'Atenção aos fios correspondentes: Azul (en), Vermelho (de), Preto (pt).',
            submissionsCount: 0
          },
          {
            id: 'cores-animais',
            title: 'Vocabulário de Cores e Animais',
            description: 'Soletrar palavras como "RED" (vermelho) ou "CAT" (gato) no ábaco. Verifique a tradução inteligente agrupar os termos de significado equivalente no painel de aprendizado.',
            dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'active',
            targetWords: ['RED', 'BLUE', 'CAT', 'DOG'],
            priority: 'Média',
            assignedStudentIds: [defaultStudentId, defaultStudentName, 'st-unknown'],
            startDate: new Date().toISOString(),
            teacherNote: 'Lembre-se de clicar na pílula de idioma de cada linha para escolher as bandeiras dos países!',
            submissionsCount: 0
          }
        ];
      }
      return parsed;
    } catch {
      return [];
    }
  });

  const getStudentId = () => {
    if (user.codeSession?.codeId) return user.codeSession.codeId;
    try {
      const studentsList = JSON.parse(localStorage.getItem('abba_students_list') || '[]');
      const matched = studentsList.find((s: any) =>
        s.email?.toLowerCase() === user.email?.toLowerCase() ||
        s.name?.toLowerCase() === user.name?.toLowerCase()
      );
      if (matched) return matched.id;
    } catch (e) {
      console.error(e);
    }
    return user.email || 'st-unknown';
  };
  const studentId = getStudentId();

  useEffect(() => {
    const defaultStudentId = studentId;
    const defaultStudentName = user.name || 'Estudante';

    setTeacherTasks(prev => {
      const hasNumerais = prev.some(t => t.id === 'numerais');
      const hasCores = prev.some(t => t.id === 'cores-animais');

      if (!hasNumerais || !hasCores) {
        const updated = [...prev];

        if (!hasNumerais) {
          updated.push({
            id: 'numerais',
            title: 'Exercício de Numerais Multilingue',
            description: 'Soletrar e gravar no ábaco digital os numerais de 0 a 9 em Português, Inglês e Alemão. Use os fios suspensos de costura correspondentes para ligar as prateleiras de letras.',
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'active',
            targetWords: ['ZERO', 'ONE', 'ZWEI', 'FIVE', 'NOVE'],
            priority: 'Alta',
            assignedStudentIds: [defaultStudentId, defaultStudentName, 'st-unknown'],
            startDate: new Date().toISOString(),
            teacherNote: 'Atenção aos fios correspondentes: Azul (en), Vermelho (de), Preto (pt).',
            submissionsCount: 0
          });
        }

        if (!hasCores) {
          updated.push({
            id: 'cores-animais',
            title: 'Vocabulário de Cores e Animais',
            description: 'Soletrar palavras como "RED" (vermelho) ou "CAT" (gato) no ábaco. Verifique a tradução inteligente agrupar os termos de significado equivalente no painel de aprendizado.',
            dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'active',
            targetWords: ['RED', 'BLUE', 'CAT', 'DOG'],
            priority: 'Média',
            assignedStudentIds: [defaultStudentId, defaultStudentName, 'st-unknown'],
            startDate: new Date().toISOString(),
            teacherNote: 'Lembre-se de clicar na pílula de idioma de cada linha para escolher as bandeiras dos países!',
            submissionsCount: 0
          });
        }

        localStorage.setItem('abba_teacher_tasks', JSON.stringify(updated));
        return updated;
      }

      let changed = false;
      const verified = prev.map(t => {
        if ((t.id === 'numerais' || t.id === 'cores-animais') &&
          !t.assignedStudentIds?.includes(defaultStudentId) &&
          !t.assignedStudentIds?.includes(defaultStudentName)) {
          changed = true;
          return {
            ...t,
            assignedStudentIds: [...(t.assignedStudentIds || []), defaultStudentId, defaultStudentName]
          };
        }
        return t;
      });

      if (changed) {
        localStorage.setItem('abba_teacher_tasks', JSON.stringify(verified));
        return verified;
      }

      return prev;
    });
  }, [studentId, user.name]);

  const fetchTasksFromSupabase = async () => {
    try {
      const { data: dbTasks, error } = await supabase
        .from('tasks')
        .select('*');

      if (dbTasks && !error) {
        const mappedTasks = dbTasks.map((t: any) => ({
          id: t.id || t.task_id,
          title: t.title || t.task_title || '',
          description: t.description || t.task_description || '',
          dueDate: t.due_date || t.dueDate || '',
          status: t.status || 'active',
          targetWords: typeof t.target_words === 'string'
            ? JSON.parse(t.target_words)
            : t.target_words || typeof t.targetWords === 'string'
              ? JSON.parse(t.targetWords)
              : t.targetWords || [],
          priority: t.priority || 'Alta',
          assignedStudentIds: typeof t.assigned_student_ids === 'string'
            ? JSON.parse(t.assigned_student_ids)
            : t.assigned_student_ids || typeof t.assignedStudentIds === 'string'
              ? JSON.parse(t.assignedStudentIds)
              : t.assignedStudentIds || [],
          startDate: t.start_date || t.startDate || '',
          teacherNote: t.teacher_note || t.teacherNote || '',
          submissionsCount: t.submissions_count || t.submissionsCount || 0
        }));

        setTeacherTasks(prev => {
          const merged = [...prev];
          mappedTasks.forEach(mt => {
            const index = merged.findIndex(x => x.id === mt.id);
            if (index !== -1) {
              merged[index] = { ...merged[index], ...mt };
            } else {
              merged.push(mt);
            }
          });
          localStorage.setItem('abba_teacher_tasks', JSON.stringify(merged));
          return merged;
        });
      }
    } catch (e) {
      console.warn('Erro ao buscar tarefas do Supabase:', e);
    }
  };

  useEffect(() => {
    fetchTasksFromSupabase();
    window.addEventListener('online', fetchTasksFromSupabase);
    const interval = setInterval(fetchTasksFromSupabase, 15000);
    return () => {
      window.removeEventListener('online', fetchTasksFromSupabase);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('abba_read_notifications', JSON.stringify(readNotifications));
  }, [readNotifications]);

  // Persist sent activities to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('abba_student_sent_activities', JSON.stringify(sentActivities));
  }, [sentActivities]);

  // Auto-capture task links from URL query parameters on mount or user change
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinParam = params.get('join') || params.get('code');
    if (joinParam) {
      // 1. Try to decode as legacy Base64 task link
      try {
        const decoded = atob(joinParam);
        const data = JSON.parse(decoded);
        if (data.taskId && data.taskTitle) {
          const newLinkItem = {
            id: data.id || `LINK-${Date.now()}`,
            studentName: data.studentName || user?.name || 'Estudante',
            taskId: data.taskId,
            taskTitle: data.taskTitle,
            createdAt: data.createdAt || new Date().toISOString(),
            link: window.location.href
          };
          setAcceptedTaskLinks(prev => {
            if (prev.some(l => l.taskId === data.taskId)) return prev;
            return [newLinkItem, ...prev];
          });
          // Clean search params to avoid duplicate runs
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (err) {
        // 2. Try to lookup in the db registry
        const cleanCode = joinParam.trim().toUpperCase().replace('ABBA-', '');
        const registryKey = 'abba_invite_codes_registry';
        try {
          const localRegistry = localStorage.getItem(registryKey);
          const registryList = localRegistry ? JSON.parse(localRegistry) : [];
          const matchedRecord = registryList.find((item: any) => item.code === cleanCode);
          if (matchedRecord && matchedRecord.taskId) {
            const newLinkItem = {
              id: matchedRecord.codeId || `LINK-${Date.now()}`,
              studentName: matchedRecord.name || user?.name || 'Estudante',
              taskId: matchedRecord.taskId,
              taskTitle: matchedRecord.taskTitle,
              createdAt: new Date().toISOString(),
              link: window.location.href
            };
            setAcceptedTaskLinks(prev => {
              if (prev.some(l => l.taskId === matchedRecord.taskId)) return prev;
              return [newLinkItem, ...prev];
            });
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } catch (dbErr) {
          console.error(dbErr);
        }
      }
    }
  }, [user]);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // ---------- validate link typed in the input ----------
  const validateAndPreviewLink = async (raw: string) => {
    setLinkError(null);
    setValidatedLink(null);

    const rawTrimmed = raw.trim();
    if (!rawTrimmed) return;

    // 1. Inappropriate / offensive words filter
    const offensiveWords = [
      'bosta', 'merda', 'caralho', 'puta', 'viado', 'fdp', 'filho da puta', 'cu', 'cuzao',
      'shit', 'fuck', 'bitch', 'asshole', 'dick', 'pussy', 'bastard', 'crap', 'pqp'
    ];
    const hasOffensive = offensiveWords.some(word =>
      new RegExp(`\\b${word}\\b`, 'i').test(rawTrimmed)
    );
    if (hasOffensive) {
      setLinkError('Link inválido. Conteúdo inadequado ou ofensivo detectado. Cole apenas o link válido gerado pelo professor.');
      return;
    }

    // 2. Determine if it's a URL or direct 6-char code
    let code: string | null = null;
    let isUrl = false;
    let urlObj: URL | null = null;

    // Check if it matches a 6-character alphanumeric code directly (e.g., NKOHML)
    if (/^[a-zA-Z0-9]{6}$/.test(rawTrimmed)) {
      code = rawTrimmed.toUpperCase();
    } else {
      try {
        urlObj = new URL(rawTrimmed);
        isUrl = urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
      } catch {
        isUrl = false;
      }

      if (isUrl && urlObj) {
        code = urlObj.searchParams.get('code');
      }
    }

    if (!code) {
      setLinkError('Entrada inválida. Insira o link completo (ex: http://...) ou o código de 6 dígitos gerado pelo professor.');
      return;
    }

    // 4. Resolve the short code (6-char alphanumeric key)
    // First, look up locally
    const generatedLinks = JSON.parse(localStorage.getItem('abba_generated_task_links') || '[]');
    let matchedLink = generatedLinks.find((l: any) => l.id === code);

    // If not found locally, query Supabase database
    if (!matchedLink) {
      setIsValidatingLink(true);
      try {
        const { data, error } = await supabase
          .from('teacher_generated_links')
          .select('*')
          .eq('link_id', code)
          .maybeSingle();

        if (data && !error) {
          matchedLink = {
            id: data.link_id,
            studentName: data.student_name,
            taskId: data.task_id,
            taskTitle: data.task_title,
            createdAt: data.created_at,
            link: data.link_url
          };
        }
      } catch (err) {
        console.warn('Erro ao consultar Supabase para código encurtado:', err);
      } finally {
        setIsValidatingLink(false);
      }
    }

    if (!matchedLink) {
      setLinkError('Link ou código não reconhecido. Esse link não pertence a nenhuma tarefa ativa gerada pelo professor.');
      return;
    }

    // Proactive duplication validation
    const autoAssignedTasks = teacherTasks.filter((task: any) =>
      task.status === 'active' &&
      (task.assignedStudentIds?.includes(studentId) || task.assignedStudentIds?.includes(user.name))
    );
    if (autoAssignedTasks.some((t: any) => t.id === matchedLink.taskId)) {
      setShowAlreadyAssignedModal(true);
      setUploadLink('');
      return;
    }

    setValidatedLink({
      id: matchedLink.id,
      studentName: matchedLink.studentName,
      taskId: matchedLink.taskId,
      taskTitle: matchedLink.taskTitle,
      createdAt: matchedLink.createdAt || new Date().toISOString(),
      link: matchedLink.link || rawTrimmed,
    });
  };

  // ---------- sync manager for student ----------
  const syncStudentLinks = async () => {
    try {
      const unsynced = JSON.parse(localStorage.getItem('abba_unsynced_student_links') || '[]');
      if (unsynced.length === 0) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const remaining: any[] = [];
      for (const item of unsynced) {
        const { error } = await supabase
          .from('student_received_task_links')
          .insert([{
            link_id: item.id,
            student_name: item.studentName,
            task_id: item.taskId,
            task_title: item.taskTitle,
            link_url: item.link,
            student_user_id: session.user.id,
            accepted_at: item.createdAt || new Date().toISOString(),
          }]);
        if (error) {
          console.warn('Erro ao sincronizar link do aluno:', error);
          remaining.push(item);
        }
      }
      localStorage.setItem('abba_unsynced_student_links', JSON.stringify(remaining));
      if (remaining.length === 0) {
        console.log('⚡ Todos os links do aluno pendentes foram sincronizados com o Supabase!');
      }
    } catch (err) {
      console.warn('Erro na sincronização de links do aluno com o Supabase:', err);
    }
  };

  useEffect(() => {
    syncStudentLinks();
    window.addEventListener('online', syncStudentLinks);
    const interval = setInterval(syncStudentLinks, 15000);
    return () => {
      window.removeEventListener('online', syncStudentLinks);
      clearInterval(interval);
    };
  }, []);

  // ---------- accept the link (store + sync) ----------
  const handleAcceptTaskLink = async () => {
    if (!validatedLink) return;

    // Check if task is already automatically assigned by the professor
    const autoAssignedTasks = teacherTasks.filter((task: any) =>
      task.status === 'active' &&
      (task.assignedStudentIds?.includes(studentId) || task.assignedStudentIds?.includes(user.name))
    );
    const isAlreadyAutoAssigned = autoAssignedTasks.some((t: any) => t.id === validatedLink.taskId);
    if (isAlreadyAutoAssigned) {
      setShowAlreadyAssignedModal(true);
      setValidatedLink(null);
      setUploadLink('');
      return;
    }

    // Prevent duplicates
    if (acceptedTaskLinks.some(l => l.id === validatedLink.id)) {
      setLinkError('Este link já foi adicionado anteriormente.');
      return;
    }

    const enriched: ValidatedTaskLink = { ...validatedLink };
    setAcceptedTaskLinks(prev => [enriched, ...prev]);
    setUploadLink('');
    setValidatedLink(null);
    setLinkError(null);

    // Save in unsynced queue for background synchronization
    const unsynced = JSON.parse(localStorage.getItem('abba_unsynced_student_links') || '[]');
    localStorage.setItem('abba_unsynced_student_links', JSON.stringify([enriched, ...unsynced]));

    // Attempt sync
    syncStudentLinks();
  };

  useEffect(() => {
    localStorage.setItem('abba_student_view', studentView);
  }, [studentView]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const allowedExtensions = ['.pdf'];
      const fileName = file.name.toLowerCase();
      const isAllowed = allowedExtensions.some(ext => fileName.endsWith(ext));

      if (!isAllowed) {
        alert("Apenas arquivos em formato PDF são aceitos!");
        return;
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        alert('O tamanho do arquivo excede o limite máximo de 5MB!');
        return;
      }

      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setTaskFiles(prev => [...prev, { name: file.name, size: `${sizeMB} MB` }]);
      setProcessingType('pdf');
      setShowProcessingQueue(true);
    }
  };

  // Check if a specific target word is completed (exact match)
  const isWordCompleted = (targetWord: string) => {
    const checkWord = targetWord.includes('_EN') ? 'ZERO' : targetWord;
    return completedSpelledWords.some(w => w.word.toUpperCase() === checkWord.toUpperCase());
  };

  const completedCount = NUMERAL_ITEMS.filter(item => isWordCompleted(item.word)).length;
  const progressPercent = Math.round((completedCount / NUMERAL_ITEMS.length) * 100);

  // Funções utilitárias compartilhadas para exibição de tarefas e mini-cards
  const getCategoryTag = (id: string) => {
    if (id === 'numerais') return 'MULTILINGUE & ÁBACO';
    if (id === 'civilizacoes') return 'HISTÓRIA E HUMANAS';
    if (id === 'busca') return 'ALGORITMOS & PYTHON';
    if (id === 'quimica') return 'URGENTE - LABORATÓRIO';
    return 'EXERCÍCIO PRÁTICO';
  };

  const getLogoGradient = (id: string) => {
    if (id === 'numerais') return 'bg-gradient-to-br from-violet-500 to-indigo-600 shadow-xs shadow-indigo-100';
    if (id === 'civilizacoes') return 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-xs shadow-orange-100';
    if (id === 'busca') return 'bg-gradient-to-br from-teal-500 to-cyan-600 shadow-xs shadow-cyan-100';
    if (id === 'quimica') return 'bg-gradient-to-br from-rose-500 to-pink-600 shadow-xs shadow-rose-100';
    return 'bg-gradient-to-br from-slate-400 to-slate-600';
  };

  const getLogoIcon = (id: string) => {
    if (id === 'numerais') return 'translate';
    if (id === 'civilizacoes') return 'history_edu';
    if (id === 'busca') return 'account_tree';
    if (id === 'quimica') return 'science';
    return 'assignment';
  };

  const getLeftStripe = (status: string) => {
    if (status === 'pending') {
      return 'bg-gradient-to-b from-red-500 to-rose-600';
    }
    if (status === 'in-progress') {
      return 'bg-gradient-to-b from-blue-500 to-indigo-600';
    }
    return 'bg-gradient-to-b from-emerald-400 to-green-600';
  };


  const getLanguageBadgeStyles = (lang: string) => {
    if (lang === 'pt') return 'bg-slate-100 text-slate-700 border-slate-200';
    if (lang === 'en') return 'bg-blue-50 text-blue-700 border-blue-100';
    return 'bg-red-50 text-red-700 border-red-100';
  };

  // Magic Link generator encripted in Base64
  const generateMagicLink = () => {
    const payload = {
      studentName: user.name,
      taskTitle: 'Exercício de Numerais Multilingue',
      spelledWords: completedSpelledWords,
      submittedAt: new Date().toISOString()
    };
    const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    return `${window.location.origin}?import=${b64}`;
  };

  const registerSentActivity = async (taskTitle: string) => {
    const newSentItem = {
      id: `SUB-${Date.now()}`,
      studentName: user.name,
      studentEmail: user.email || `${user.name.toLowerCase().replace(/\s+/g, '.')}@email.com`,
      taskTitle: taskTitle || 'Exercício de Numerais Multilingue',
      submittedAt: new Date().toISOString(),
      spelledWordsCount: completedSpelledWords.length
    };

    setSentActivities(prev => {
      if (prev.some(a => a.taskTitle === newSentItem.taskTitle && Math.abs(new Date(a.submittedAt).getTime() - new Date(newSentItem.submittedAt).getTime()) < 10000)) {
        return prev;
      }
      return [newSentItem, ...prev];
    });

    try {
      await supabase.from('student_submissions').insert([
        {
          student_name: user.name,
          student_email: newSentItem.studentEmail,
          task_title: newSentItem.taskTitle,
          submitted_at: newSentItem.submittedAt,
          spelled_words_count: newSentItem.spelledWordsCount,
          spelled_words: JSON.stringify(completedSpelledWords),
          task_files: JSON.stringify(taskFiles)
        }
      ]);
      await logUserAction({
        userName: user.name,
        userEmail: newSentItem.studentEmail,
        role: 'student',
        actionType: 'task_submission',
        actionDetails: `Entregou a tarefa "${newSentItem.taskTitle}" com ${newSentItem.spelledWordsCount} palavras soletradas e ${taskFiles.length} arquivos/links anexados.`
      });
      console.log('⚡ Submission synced with Supabase!');
    } catch (err) {
      console.warn('Erro ao salvar submissão no Supabase:', err);
    }
  };

  const handleShareWhatsApp = () => {
    const link = generateMagicLink();
    const taskTitle = 'Exercício de Numerais Multilingue';
    const text = `*Nome:* ${user.name}\n*Tarefa:* ${taskTitle}\n*Progresso:* ${completedCount}/${NUMERAL_ITEMS.length} palavras concluídas\n\n*Relatório de Atividades:* Clique no link abaixo para importar meu ábaco digital:\n${link}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    registerSentActivity(taskTitle);
  };

  const handleShareGmail = () => {
    const link = generateMagicLink();
    const taskTitle = 'Exercício de Numerais Multilingue';
    const subject = `ABBA DIGITAL - Entrega de Tarefa - ${user.name}`;
    const body = `Nome: ${user.name}\nTarefa: ${taskTitle}\nProgresso: ${completedCount}/${NUMERAL_ITEMS.length} palavras concluídas\n\nLink do ábaco digital do aluno:\n${link}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
    registerSentActivity(taskTitle);
  };

  const handleCopyLink = () => {
    const taskTitle = 'Exercício de Numerais Multilingue';
    navigator.clipboard.writeText(generateMagicLink());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    registerSentActivity(taskTitle);
  };

  const handleDownloadPdf = () => {
    try {
      const encoder = new TextEncoder();
      const objects: Uint8Array[] = [];

      const escapePdfText = (text: string) => {
        if (!text) return "";
        return text
          .replace(/\\/g, "\\\\")
          .replace(/\(/g, "\\(")
          .replace(/\)/g, "\\)")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
      };

      objects.push(encoder.encode("<< /Type /Catalog /Pages 2 0 R >>"));
      objects.push(encoder.encode("<< /Type /Pages /Kids [ 3 0 R ] /Count 1 >>"));
      objects.push(encoder.encode("<< /Type /Page /Parent 2 0 R /MediaBox [ 0 0 595.27 841.89 ] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>"));

      const dateStr = new Date().toLocaleDateString('pt-BR');
      const progressText = `${completedCount} de ${NUMERAL_ITEMS.length} (${progressPercent}%)`;
      const studentName = user.name || "Estudante";

      const streamLines = [
        "BT",
        "/F1 20 Tf",
        "50 780 Td",
        "(ABBA DIGITAL - Relatorio de Atividades) Tj",
        "0 -40 Td",
        "/F1 13 Tf",
        `(${escapePdfText("Estudante: " + studentName)}) Tj`,
        "0 -22 Td",
        "/F2 11 Tf",
        `(${escapePdfText("Progresso Geral: " + progressText)}) Tj`,
        "0 -18 Td",
        `(${escapePdfText("Data de Emissao: " + dateStr)}) Tj`,
        "0 -18 Td",
        `(${escapePdfText("Status da Tarefa: Concluida")}) Tj`,
        "0 -40 Td",
        "/F1 13 Tf",
        "(Palavras Registradas no Abaco:) Tj",
        "0 -12 Td"
      ];

      if (completedSpelledWords.length === 0) {
        streamLines.push(
          "0 -20 Td",
          "/F2 11 Tf",
          "(Nenhuma palavra gravada ainda no abaco.) Tj"
        );
      } else {
        completedSpelledWords.forEach((wordObj, i) => {
          let langName = "Portugues";
          if (wordObj.themeColor === 'blue' || wordObj.themeColor === '#0052cc') langName = "Ingles";
          else if (wordObj.themeColor === 'red' || wordObj.themeColor === '#ef4444') langName = "Alemao";
          else if (wordObj.themeColor === 'green' || wordObj.themeColor === '#10b981') langName = "Italiano";

          const textLine = `${i + 1}. ${wordObj.word} (${langName})`;
          streamLines.push(
            "0 -20 Td",
            "/F2 11 Tf",
            `(${escapePdfText(textLine)}) Tj`
          );
        });
      }

      streamLines.push(
        "0 -50 Td",
        "/F1 9 Tf",
        "(Relatorio gerado em tempo real pelo Abaco Digital de Alfabetizacao.) Tj",
        "0 -14 Td",
        "(Acesse: abba-digital.vercel.app | Codigo de Autenticidade: ABBA-2026) Tj",
        "ET"
      );

      const streamContent = encoder.encode(streamLines.join("\n"));

      const headerStr = `<< /Length ${streamContent.length} >>\nstream\n`;
      const footerStr = `\nendstream`;
      const headerBin = encoder.encode(headerStr);
      const footerBin = encoder.encode(footerStr);

      const contentStreamObj = new Uint8Array(headerBin.length + streamContent.length + footerBin.length);
      contentStreamObj.set(headerBin, 0);
      contentStreamObj.set(streamContent, headerBin.length);
      contentStreamObj.set(footerBin, headerBin.length + streamContent.length);

      objects.push(contentStreamObj);
      objects.push(encoder.encode("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>"));
      objects.push(encoder.encode("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"));

      const chunks: Uint8Array[] = [];
      chunks.push(encoder.encode("%PDF-1.4\n"));

      const offsets: number[] = [];
      let currentOffset = chunks[0].length;

      for (let i = 0; i < objects.length; i++) {
        offsets.push(currentOffset);
        const objHeader = encoder.encode(`${i + 1} 0 obj\n`);
        const objFooter = encoder.encode("\nendobj\n");

        chunks.push(objHeader);
        chunks.push(objects[i]);
        chunks.push(objFooter);

        currentOffset += objHeader.length + objects[i].length + objFooter.length;
      }

      const xrefOffset = currentOffset;

      chunks.push(encoder.encode("xref\n"));
      chunks.push(encoder.encode(`0 ${objects.length + 1}\n`));
      chunks.push(encoder.encode("0000000000 65535 f\r\n"));

      for (let i = 0; i < offsets.length; i++) {
        const paddedOffset = String(offsets[i]).padStart(10, '0');
        chunks.push(encoder.encode(`${paddedOffset} 00000 n\r\n`));
      }

      chunks.push(encoder.encode("trailer\n"));
      chunks.push(encoder.encode(`<< /Size ${objects.length + 1} /Root 1 0 R >>\n`));
      chunks.push(encoder.encode("startxref\n"));
      chunks.push(encoder.encode(`${xrefOffset}\n`));
      chunks.push(encoder.encode("%%EOF\n"));

      const blob = new Blob(chunks as BlobPart[], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-abba-${studentName.toLowerCase().replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      registerSentActivity('Relatório de Atividades em PDF');
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Houve um erro ao gerar o arquivo PDF. Tente novamente.");
    }
  };


  const filteredItems = NUMERAL_ITEMS.filter(item => {
    const matchesLanguage = filterLanguage === 'all' ? true : item.language === filterLanguage;
    const matchesSearch = item.word.toLowerCase().includes(taskSearchQuery.toLowerCase()) ||
      item.langLabel.toLowerCase().includes(taskSearchQuery.toLowerCase());
    return matchesLanguage && matchesSearch;
  });

  const autoAssignedTasks = teacherTasks.filter((task: any) =>
    task.status === 'active' &&
    (task.assignedStudentIds?.includes(studentId) || task.assignedStudentIds?.includes(user.name))
  );

  const formatTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (isNaN(diffMins)) return 'algum tempo';
    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return `${diffDays}d atrás`;
  };

  const derivedNotifications = autoAssignedTasks.map((task: any) => ({
    id: `notif-${task.id}`,
    title: 'Nova tarefa atribuída!',
    message: `O professor enviou a tarefa: "${task.title}".`,
    taskTitle: task.title,
    taskDescription: task.description,
    createdAt: task.startDate || new Date().toISOString(),
    isRead: readNotifications.includes(`notif-${task.id}`)
  }));

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] flex flex-col font-sans">

      {/* Mobile Bottom Sheets (Notifications and Profile) - Rendered at root level */}
      <AnimatePresence>
        {showNotificationsDropdown && (
          <div className="fixed inset-0 z-[150] block lg:hidden">
            <div
              onClick={() => setShowNotificationsDropdown(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            ></div>
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed bottom-0 inset-x-0 z-[200] w-full bg-white rounded-t-[32px] shadow-2xl border-t border-slate-100 flex flex-col overflow-hidden text-left"
            >
              {/* Top Drag Indicator for Mobile Sheet */}
              <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mt-3 mb-1 shrink-0"></div>

              {/* Dropdown Header */}
              <div className="p-5 flex justify-between items-center border-b border-slate-100 bg-white select-none">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  Notificações
                  {derivedNotifications.filter(n => !n.isRead).length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black">
                      {derivedNotifications.filter(n => !n.isRead).length}
                    </span>
                  )}
                </h2>
                <button
                  onClick={() => setShowNotificationsDropdown(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border-none text-xs font-bold transition-all cursor-pointer"
                >
                  Fechar
                </button>
              </div>

              {/* Dropdown Content */}
              <div className="overflow-y-auto divide-y divide-slate-50 custom-scrollbar max-h-[340px] bg-white">
                {(() => {
                  const displayed = derivedNotifications.filter(n => {
                    if (notificationFilter === 'unread') return !n.isRead;
                    return true;
                  });

                  if (displayed.length === 0) {
                    return (
                      <div className="p-5 py-8 text-center text-slate-400 text-xs font-semibold">
                        Nenhuma notificação por enquanto.
                      </div>
                    );
                  }

                  return displayed.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        // Mark as read
                        if (!notif.isRead) {
                          setReadNotifications(prev => [...prev, notif.id]);
                        }
                        setShowNotificationsDropdown(false);
                        // Go to abacus directly
                        if (onGoToAbacus) {
                          onGoToAbacus(notif.taskTitle, notif.taskDescription);
                        }
                      }}
                      className={`p-4 flex gap-4 hover:bg-slate-50 transition-colors relative cursor-pointer text-left ${!notif.isRead ? 'bg-indigo-50/10' : ''
                        }`}
                    >
                      {/* Avatar section with badge */}
                      <div className="relative flex-shrink-0 select-none">
                        <img
                          alt="Teacher avatar"
                          className="w-12 h-12 rounded-full object-cover border border-slate-100"
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCX_vJ2RV-84eqC7hDG99QfvJN_YFDSCNvV5QYBANyHN-SQPSIwaBX7mCuBPrKMK1lOT1cBrC8fhzTMWltyDOw7Kvu5RRMu6C4IJ5mq5NMCsMKSx9FS3PAOyElWaDPdRnt4B-Je0ZY5P78nnBFGIUyAGI_udrG0i0iiu8rLlbp89jqa0p2fnmZTZWoSiF1QcYMJAsMvgq0y9K7coEW_H0f4a9sR1zi-5VpmBcW_9PwU9UNcd_XW5G5baBMAGoVuKtVnSmDfqv6P2P2N"
                        />
                        <div className="absolute -right-1 -bottom-1 bg-purple-600 text-white p-0.5 rounded-full border-2 border-white flex items-center justify-center">
                          <span className="material-symbols-outlined text-[10px] block font-black">assignment</span>
                        </div>
                      </div>

                      {/* Notification details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-semibold text-slate-900">
                            Prof. Marcos
                            <span className="text-slate-400 font-normal ml-2 text-xs">
                              {formatTimeAgo(notif.createdAt)}
                            </span>
                          </p>
                          {!notif.isRead && (
                            <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] shrink-0 mt-[6px]"></div>
                          )}
                        </div>
                        <p className="text-sm mt-0.5 text-slate-900">
                          Enviou a tarefa: <span className="font-semibold">{notif.taskTitle}</span>
                        </p>
                        <p
                          className="text-xs mt-1.5 text-slate-500 leading-relaxed"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {notif.taskDescription || "Pratique soletração no ábaco digital em três idiomas."}
                        </p>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showProfileMenu && (
          <div className="fixed inset-0 z-[150] block lg:hidden">
            <div
              onClick={() => setShowProfileMenu(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            ></div>
            <motion.div
              ref={mobileProfileMenuRef}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed bottom-0 inset-x-0 z-[200] w-full bg-white rounded-t-[32px] shadow-2xl border-t border-slate-100 flex flex-col max-h-[600px] overflow-hidden text-left"
            >
              {/* Top Drag Indicator for Mobile Sheet */}
              <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mt-3 mb-1 shrink-0"></div>

              {/* Header */}
              <div className="p-5 flex justify-between items-center border-b border-slate-100 bg-white">
                <h2 className="text-lg font-bold text-slate-900">Perfil do Aluno</h2>
                <button
                  onClick={() => setShowProfileMenu(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border-none text-xs font-bold transition-all cursor-pointer"
                >
                  Fechar
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto bg-white">
                {/* User info details */}
                <div className="p-5 flex gap-4 items-center border-b border-slate-100 bg-slate-50/30 select-none">
                  <div className="relative shrink-0">
                    <img
                      alt="Avatar"
                      className="w-14 h-14 rounded-full object-cover border-2 border-indigo-500/20"
                      src={user.img || "https://res.cloudinary.com/dudmozd8z/image/upload/v1780030087/USUARIOS_ndwkzb.svg"}
                    />
                    <div className="absolute -right-1 -bottom-1 bg-[#10B981] w-4.5 h-4.5 rounded-full border-2 border-white flex items-center justify-center">
                      <span className="w-2 h-2 bg-emerald-100 rounded-full animate-pulse" />
                    </div>
                  </div>
                  <div className="text-left min-w-0">
                    <p className="font-bold text-base text-slate-900 truncate">{user.name}</p>
                    <p className="text-xs text-slate-400 mt-1 truncate">{user.email || 'aluno@abbadigital.com'}</p>
                  </div>
                </div>

                {/* Progress card */}
                <div className="p-5 flex flex-col gap-3">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold text-slate-700">Progresso do Ábaco Digital</p>
                        <p className="text-[11px] text-slate-400 mt-1">{completedCount} / {NUMERAL_ITEMS.length} palavras soletradas</p>
                      </div>
                      <span className="material-symbols-outlined text-indigo-500 text-lg">emoji_events</span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-2.5 bg-slate-200 rounded-full mt-4 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-500"
                        style={{ width: `${(completedCount / NUMERAL_ITEMS.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Dropdown Menu Actions */}
                <div className="p-4 border-t border-slate-100 flex flex-col gap-1.5 bg-white">
                  <button
                    onClick={() => { setStudentView('tasks-list'); setShowProfileMenu(false); }}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-50 transition-colors text-sm text-slate-700 font-bold border-none bg-transparent cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">task</span>
                      Ver Minhas Tarefas
                    </span>
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>

                  <button
                    onClick={() => setShowMobileAvatarSelector(true)}
                    className="w-full flex items-center gap-2 p-3.5 rounded-2xl hover:bg-slate-50 transition-colors text-sm text-slate-700 font-bold border-none bg-transparent cursor-pointer text-left"
                  >
                    <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
                    Editar Perfil
                  </button>

                  <button
                    onClick={() => { setShowProfileMenu(false); onLogout(); }}
                    className="w-full flex items-center gap-2 p-3.5 rounded-2xl hover:bg-red-50 transition-colors text-sm text-red-500 font-bold border-none bg-transparent cursor-pointer text-left"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Sair da Conta
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MOBILE AVATAR SELECTOR BOTTOM SHEET */}
      <AnimatePresence>
        {showMobileAvatarSelector && (
          <div className="fixed inset-0 z-[205] block lg:hidden">
            <div
              onClick={() => setShowMobileAvatarSelector(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            ></div>
            <motion.div
              ref={mobileAvatarSelectorRef}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed bottom-0 inset-x-0 z-[210] w-full bg-white rounded-t-[32px] shadow-2xl border-t border-slate-100 flex flex-col max-h-[600px] overflow-hidden text-left"
            >
              {/* Top Drag Indicator */}
              <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mt-3 mb-1 shrink-0"></div>

              {/* Header */}
              <div className="p-5 flex justify-between items-center border-b border-slate-100 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <span className="material-symbols-outlined">account_circle</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Escolha seu Avatar</h2>
                    <p className="text-[10px] text-slate-400 font-medium">Selecione uma imagem para o seu perfil</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMobileAvatarSelector(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border-none text-xs font-bold transition-all cursor-pointer"
                >
                  Voltar
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto bg-white p-5 space-y-6">
                {/* Presets Grid */}
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider pl-1">Avatares Recomendados</label>
                  <div className="grid grid-cols-4 gap-4 py-2">
                    {PRESET_AVATARS.map((url, i) => (
                      <button
                        key={i}
                        onClick={() => handleSelectAvatar(url)}
                        className={`w-14 h-14 rounded-full overflow-hidden border-3 hover:scale-105 hover:shadow-md transition-all cursor-pointer p-0 bg-transparent flex items-center justify-center ${
                          user.img === url ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-transparent'
                        }`}
                      >
                        <img src={url} alt={`Preset Avatar ${i + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom URL Field */}
                <div className="flex flex-col gap-2 pt-4 border-t border-slate-100">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider pl-1">URL de Imagem Personalizada</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customAvatarUrl}
                      onChange={(e) => setCustomAvatarUrl(e.target.value)}
                      placeholder="https://exemplo.com/sua-foto.jpg..."
                      className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none text-sm placeholder-slate-400 transition-all text-slate-700"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customAvatarUrl.trim()) {
                          handleSelectAvatar(customAvatarUrl.trim());
                        } else {
                          alert('Por favor, insira uma URL de imagem válida.');
                        }
                      }}
                      className="px-5 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold rounded-xl transition-all shadow-md active:scale-98 cursor-pointer border-none text-sm whitespace-nowrap"
                    >
                      Aplicar
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal pl-1">Insira a URL de uma imagem pública leve.</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Sidebar Overlay Drawer (Symmetrical to Teacher's style) */}
      <div className={`fixed inset-0 z-50 flex lg:hidden transition-all duration-300 ${mobileSidebarOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className={`fixed inset-0 bg-slate-900/45 backdrop-blur-xs transition-opacity duration-300 ${mobileSidebarOpen ? 'opacity-100' : 'opacity-0'
            }`}
        ></div>

        <div
          className={`relative w-[280px] sm:w-[320px] shrink-0 bg-white h-full shadow-2xl p-6 flex flex-col justify-between text-left z-10 transition-transform duration-300 ease-out ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
          <div>
            <div className="flex items-center justify-between pb-6 border-b border-gray-100">
              <div
                onClick={() => onGoToLanding && onGoToLanding()}
                className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 active:scale-[0.99] transition-all"
                title="Voltar para a página principal"
              >
                <img src={abbaLogo} alt="ABBA Logo" className="w-10 h-10 object-contain" />
                <div>
                  <h1 className="font-bold text-lg tracking-tight text-gray-950">ABBA DIGITAL</h1>
                  <p className="text-[10px] font-medium text-gray-500">Portal da Educação</p>
                </div>
              </div>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 active:scale-95 transition-all border-none bg-transparent cursor-pointer flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <nav className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileSidebarOpen(false);
                  setShowSpellingLoader(true);
                  setTimeout(() => {
                    setShowSpellingLoader(false);
                    if (onGoToAbacus) {
                      onGoToAbacus();
                    }
                  }, 1500);
                }}
                className={`flex items-center gap-3 px-4 py-3 font-bold rounded-xl border-none cursor-pointer w-full text-left transition-all bg-transparent text-slate-600 hover:bg-slate-50`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" className="shrink-0"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                Início
              </button>
              <button
                onClick={() => {
                  setMobileSidebarOpen(false);
                  setStudentView('tasks-list');
                }}
                className={`flex items-center gap-3 px-4 py-3 font-bold rounded-xl border-none cursor-pointer w-full text-left transition-all ${studentView === 'tasks-list' ? 'bg-blue-50 text-blue-600' : 'bg-transparent text-slate-600 hover:bg-slate-50'
                  }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" className="shrink-0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                Tarefas
              </button>
            </nav>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-100">
            <button
              onClick={() => {
                setMobileSidebarOpen(false);
                alert('Dica: Complete o exercício de numerais soletando cada número no ábaco. Utilize as cores dos fios recomendados para pontuação máxima. Ao finalizar, copie seu link ou envie por WhatsApp/Gmail.');
              }}
              className="flex items-center gap-3 px-4 py-3 text-slate-500 text-sm font-semibold rounded-xl hover:bg-slate-50 border-none bg-transparent cursor-pointer w-full text-left transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" className="shrink-0"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              Ajuda
            </button>
            <button
              onClick={() => {
                setMobileSidebarOpen(false);
                onLogout();
              }}
              className="flex items-center gap-3 px-4 py-3 text-red-600 text-sm font-bold rounded-xl hover:bg-red-50 border-none bg-transparent cursor-pointer w-full text-left transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" className="shrink-0"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar (Identical to teacher's styling) */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 flex-col p-6 z-40 bg-white border-r border-gray-100 h-screen w-64 justify-between">
        <div className="space-y-8 flex-1 flex flex-col">
          <div
            onClick={() => onGoToLanding && onGoToLanding()}
            className="flex items-center gap-3 px-2 cursor-pointer hover:opacity-90 active:scale-[0.99] transition-all"
            title="Voltar para a página principal"
          >
            <img src={abbaLogo} alt="ABBA DIGITAL Logo" className="w-10 h-10 object-contain shrink-0" />
            <div>
              <h1 className="font-bold text-lg tracking-tight text-gray-950">ABBA DIGITAL</h1>
              <p className="text-[10px] font-medium text-gray-500">Portal da Educação</p>
            </div>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => {
                setShowSpellingLoader(true);
                setTimeout(() => {
                  setShowSpellingLoader(false);
                  if (onGoToAbacus) {
                    onGoToAbacus();
                  }
                }, 1500);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 font-bold rounded-xl border-none cursor-pointer text-left transition-all bg-transparent text-slate-600 hover:bg-slate-50`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" className="shrink-0"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              <span className="text-sm">Início</span>
            </button>

            <button
              onClick={() => setStudentView('tasks-list')}
              className={`w-full flex items-center gap-3 px-4 py-3 font-bold rounded-xl border-none cursor-pointer text-left transition-all ${studentView === 'tasks-list'
                ? 'bg-[#0073e0] text-white'
                : 'bg-transparent text-slate-600 hover:bg-slate-50'
                }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" className="shrink-0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
              <span className="text-sm">Tarefas</span>
            </button>
          </nav>
        </div>

        <div className="border-t border-gray-100 pt-4 flex flex-col gap-2">
          <button
            onClick={() => alert('Dica: Complete o exercício de numerais soletando cada número no ábaco. Utilize as cores dos fios recomendados para pontuação máxima. Ao finalizar, copie seu link ou envie por WhatsApp/Gmail.')}
            className="flex items-center gap-3 px-4 py-3 text-slate-500 text-sm font-semibold rounded-xl hover:bg-slate-50 border-none bg-transparent cursor-pointer w-full text-left transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" className="shrink-0"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            <span className="text-sm">Ajuda</span>
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-3 text-red-600 text-sm font-bold rounded-xl hover:bg-red-50 border-none bg-transparent cursor-pointer w-full text-left transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" className="shrink-0"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            <span className="text-sm">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="lg:ml-64 flex flex-col min-h-screen w-full lg:w-[calc(100%-16rem)] overflow-x-hidden">
        {/* Mobile Header (Symmetrical to Teacher's style) */}
        <header className="sticky top-0 bg-white border-b border-gray-100 py-3.5 px-4 sm:px-6 z-40 shadow-xs block lg:hidden w-full">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="p-2 rounded-xl hover:bg-slate-100 active:scale-95 transition-all border-none bg-transparent cursor-pointer flex items-center justify-center text-slate-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="text-slate-700 w-6 h-6">
                  <line x1="4" x2="20" y1="12" y2="12"></line>
                  <line x1="4" x2="20" y1="6" y2="6"></line>
                  <line x1="4" x2="20" y1="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setSearchExpanded(true)}
                className="p-0 border-none bg-transparent cursor-pointer flex items-center justify-center w-10 h-10 rounded-xl hover:bg-slate-50 text-slate-600 transition-all active:scale-95"
                title="Pesquisar Atividades"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="text-slate-600">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>

              <button
                onClick={() => setShowNotificationsDropdown(prev => !prev)}
                className="p-0 border-none bg-transparent cursor-pointer flex items-center justify-center w-10 h-10 rounded-xl hover:bg-slate-50 text-slate-600 transition-all active:scale-95 relative"
                title="Notificações"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="text-slate-600">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
                </svg>
                {derivedNotifications.filter(n => !n.isRead).length > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#10B981] rounded-full animate-pulse"></span>
                )}
              </button>

              <button
                onClick={() => setShowProfileMenu(prev => !prev)}
                className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer p-0 bg-transparent outline-none ring-0 focus:outline-none flex items-center justify-center"
                title="Perfil"
              >
                <img
                  alt={`${user.name} Avatar`}
                  className="w-full h-full object-cover"
                  src={user.img || "https://res.cloudinary.com/dudmozd8z/image/upload/v1780030087/USUARIOS_ndwkzb.svg"}
                />
              </button>
            </div>
          </div>
        </header>

        {/* Desktop Header (Identical to teacher's styling) */}
        <header className="hidden lg:flex items-center justify-between px-margin-desktop w-full sticky top-0 z-50 bg-white/80 backdrop-blur-md h-16 border-b border-gray-100">
          <div className="flex items-center gap-md flex-1">
            <h2 className="text-lg text-slate-800 font-extrabold lg:block hidden">Área do Aluno</h2>
          </div>

          <div className="flex items-center gap-4 relative">
            {/* Search Lupa Button */}
            <button
              onClick={() => setSearchExpanded(true)}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 text-slate-600 transition-all active:scale-95 cursor-pointer border-none bg-transparent"
              title="Pesquisar Atividades (Lupa)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="text-slate-600">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>

            {/* Notifications Bell Button */}
            <div className="relative">
              <button
                ref={bellButtonRef}
                onClick={() => setShowNotificationsDropdown(prev => !prev)}
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 text-slate-600 transition-all active:scale-95 cursor-pointer border-none bg-transparent relative"
                title="Notificações"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="text-slate-600">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {derivedNotifications.filter(n => !n.isRead).length > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#10B981] rounded-full animate-pulse"></span>
                )}
              </button>
            </div>

            <div className="w-px h-6 bg-gray-100 hidden lg:block mx-1"></div>

            {/* Profile Avatar & Dropdowns */}
            <div className="relative">
              <button
                ref={avatarButtonRef}
                onClick={() => setShowProfileMenu(prev => !prev)}
                className="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer p-0 bg-transparent outline-none ring-0 focus:outline-none flex items-center justify-center"
                title="Perfil"
              >
                <img
                  alt={`${user.name} Avatar`}
                  className="w-full h-full object-cover"
                  src={user.img || "https://res.cloudinary.com/dudmozd8z/image/upload/v1780030087/USUARIOS_ndwkzb.svg"}
                />
              </button>

              {/* Notifications Dropdown (Aligned perfectly with the right edge of the profile photo) */}
              <AnimatePresence>
                {showNotificationsDropdown && (
                  <motion.div
                    ref={notificationsRef}
                    initial={{ opacity: 0, y: 6, scale: 0.99 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.99 }}
                    transition={{
                      type: "spring",
                      damping: 30,
                      stiffness: 400
                    }}
                    className="absolute right-0 top-[calc(100%+4px)] z-[300] w-[420px] max-w-[calc(100vw-32px)] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden text-left origin-top-right hidden lg:flex"
                  >
                    {/* Dropdown Header */}
                    <div className="p-5 flex justify-between items-center border-b border-slate-100 bg-white select-none">
                      <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        Notificações
                        {derivedNotifications.filter(n => !n.isRead).length > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black">
                            {derivedNotifications.filter(n => !n.isRead).length}
                          </span>
                        )}
                      </h2>

                      <div className="flex bg-slate-100 p-1 rounded-xl items-center gap-1">
                        <button
                          onClick={() => setNotificationFilter('all')}
                          className={`px-4 py-1 text-sm rounded-lg transition-all cursor-pointer border-none font-semibold ${notificationFilter === 'all'
                            ? 'bg-white shadow-sm text-slate-900'
                            : 'bg-transparent text-slate-500 hover:text-slate-700'
                            }`}
                        >
                          Todas
                        </button>
                        <button
                          onClick={() => setNotificationFilter('unread')}
                          className={`px-4 py-1 text-sm rounded-lg transition-all cursor-pointer border-none font-semibold ${notificationFilter === 'unread'
                            ? 'bg-white shadow-sm text-slate-900'
                            : 'bg-transparent text-slate-500 hover:text-slate-700'
                            }`}
                        >
                          Não lidas
                        </button>
                      </div>
                    </div>

                    {/* Dropdown Content with smooth height animation */}
                    <motion.div
                      animate={{ height: 'auto' }}
                      transition={{
                        type: "spring",
                        damping: 30,
                        stiffness: 400
                      }}
                      style={{ overflow: 'hidden' }}
                      className="bg-white"
                    >
                      <div className="overflow-y-auto divide-y divide-slate-50 custom-scrollbar max-h-[340px] bg-white">
                        {(() => {
                          const displayed = derivedNotifications.filter(n => {
                            if (notificationFilter === 'unread') return !n.isRead;
                            return true;
                          });

                          if (displayed.length === 0) {
                            return (
                              <div className="px-5 py-8 text-center text-slate-400 text-xs font-semibold">
                                Nenhuma notificação por enquanto.
                              </div>
                            );
                          }

                          return displayed.map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => {
                                // Mark as read
                                if (!notif.isRead) {
                                  setReadNotifications(prev => [...prev, notif.id]);
                                }
                                setShowNotificationsDropdown(false);
                                // Go to abacus directly
                                if (onGoToAbacus) {
                                  onGoToAbacus(notif.taskTitle, notif.taskDescription);
                                }
                              }}
                              className={`p-4 flex gap-4 hover:bg-slate-50 transition-colors relative cursor-pointer text-left ${!notif.isRead ? 'bg-indigo-50/10' : ''
                                }`}
                            >
                              {/* Avatar section with badge */}
                              <div className="relative flex-shrink-0 select-none">
                                <img
                                  alt="Teacher avatar"
                                  className="w-12 h-12 rounded-full object-cover border border-slate-100"
                                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCX_vJ2RV-84eqC7hDG99QfvJN_YFDSCNvV5QYBANyHN-SQPSIwaBX7mCuBPrKMK1lOT1cBrC8fhzTMWltyDOw7Kvu5RRMu6C4IJ5mq5NMCsMKSx9FS3PAOyElWaDPdRnt4B-Je0ZY5P78nnBFGIUyAGI_udrG0i0iiu8rLlbp89jqa0p2fnmZTZWoSiF1QcYMJAsMvgq0y9K7coEW_H0f4a9sR1zi-5VpmBcW_9PwU9UNcd_XW5G5baBMAGoVuKtVnSmDfqv6P2P2N"
                                />
                                <div className="absolute -right-1 -bottom-1 bg-purple-600 text-white p-0.5 rounded-full border-2 border-white flex items-center justify-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" className="text-white shrink-0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                                </div>
                              </div>

                              {/* Notification details */}
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                  <p className="text-sm font-semibold text-slate-900">
                                    Prof. Marcos
                                    <span className="text-slate-400 font-normal ml-2 text-xs">
                                      {formatTimeAgo(notif.createdAt)}
                                    </span>
                                  </p>
                                  {!notif.isRead && (
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] shrink-0 mt-[6px]"></div>
                                  )}
                                </div>
                                <p className="text-sm mt-0.5 text-slate-900">
                                  Enviou a tarefa: <span className="font-semibold">{notif.taskTitle}</span>
                                </p>
                                <p
                                  className="text-xs mt-1.5 text-slate-500 leading-relaxed"
                                  style={{
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                  }}
                                >
                                  {notif.taskDescription || "Pratique soletração no ábaco digital em três idiomas."}
                                </p>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </motion.div>

                    {/* Dropdown Footer */}
                    {derivedNotifications.filter(n => !n.isRead).length > 0 && (
                      <div className="p-3 border-t border-slate-100 text-center bg-slate-50/50 select-none">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const allIds = derivedNotifications.map(n => n.id);
                            setReadNotifications(prev => [...new Set([...prev, ...allIds])]);
                          }}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-bold bg-transparent border-none cursor-pointer"
                        >
                          Marcar todas como lidas
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Profile Dropdown (Symmetric and right-aligned to the profile photo) */}
              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    ref={profileMenuRef}
                    initial={{ opacity: 0, y: 6, scale: 0.99 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.99 }}
                    transition={{
                      type: "spring",
                      damping: 30,
                      stiffness: 400
                    }}
                    className="absolute right-0 top-[calc(100%+4px)] z-[300] w-[420px] max-w-[calc(100vw-32px)] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[600px] overflow-hidden text-left origin-top-right hidden lg:flex"
                  >
                    {/* Header */}
                    <div className="py-4 px-5 flex justify-between items-center border-b border-slate-100 bg-white">
                      <h2 className="text-lg font-bold text-slate-900">Perfil do Aluno</h2>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="text-slate-400"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    </div>

                    {/* Scrollable Content */}
                    <div className="overflow-y-auto bg-white pb-4">
                      {/* User info details */}
                      <div className="py-3 px-5 flex gap-4 items-center border-b border-slate-100 bg-slate-50/30 select-none">
                        <div className="relative shrink-0">
                          <img
                            alt="Avatar"
                            className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500/20"
                            src={user.img || "https://res.cloudinary.com/dudmozd8z/image/upload/v1780030087/USUARIOS_ndwkzb.svg"}
                          />
                          <div className="absolute -right-1 -bottom-1 bg-[#10B981] w-4.5 h-4.5 rounded-full border-2 border-white flex items-center justify-center">
                            <span className="w-2 h-2 bg-emerald-100 rounded-full animate-pulse" />
                          </div>
                        </div>
                        <div className="text-left min-w-0">
                          <p className="font-bold text-base text-slate-900 truncate">{user.name}</p>
                          <p className="text-xs text-slate-400 mt-1 truncate">{user.email || 'aluno@abbadigital.com'}</p>
                        </div>
                      </div>

                      {/* Progress card */}
                      <div className="py-3 px-5 flex flex-col gap-2">
                        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-xs font-bold text-slate-700">Progresso do Ábaco Digital</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">{completedCount} / {NUMERAL_ITEMS.length} palavras soletradas</p>
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="text-indigo-500"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34"></path><path d="M12 2a6 6 0 0 1 6 6v3.5c0 1.66-1.34 3-3 3H9a3 3 0 0 1-3-3V8a6 6 0 0 1 6-6z"></path></svg>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full h-2 bg-slate-200 rounded-full mt-3 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-500"
                              style={{ width: `${(completedCount / NUMERAL_ITEMS.length) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      {/* Dropdown Menu Actions */}
                      <div className="px-4 py-2 border-t border-slate-100 flex flex-col gap-1 bg-white">
                        <button
                          onClick={() => { setStudentView('tasks-list'); setShowProfileMenu(false); }}
                          className="w-full flex items-center justify-between py-2 px-3 rounded-xl hover:bg-slate-50 transition-colors text-sm text-slate-700 font-bold border-none bg-transparent cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="shrink-0 text-slate-500"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                            Ver Minhas Tarefas
                          </span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="text-slate-400"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </button>

                        <button
                          onClick={() => { setShowProfileMenu(false); setShowAvatarSelector(true); }}
                          className="w-full flex items-center gap-2 py-2 px-3 rounded-xl hover:bg-slate-50 transition-colors text-sm text-slate-700 font-bold border-none bg-transparent cursor-pointer text-left"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="shrink-0 text-slate-500"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1-2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1-2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51-1z"></path></svg>
                          Editar Perfil
                        </button>

                        <button
                          onClick={() => { setShowProfileMenu(false); onLogout(); }}
                          className="w-full flex items-center gap-2 py-2 px-3 rounded-xl hover:bg-red-50 transition-colors text-sm text-red-500 font-bold border-none bg-transparent cursor-pointer text-left"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="text-red-500 shrink-0"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                          Sair da Conta
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>




        {/* Main Canvas */}
        <main className="p-margin-desktop max-w-[1200px] mx-auto w-full flex-1">

          {studentView === 'tasks-list' ? (
            /* RENDERING THE TASKS BENTO GRID SCREEN */
            <div className="animate-fade-in space-y-lg">
              {/* Hero Header */}
              <div className="mb-xl">
                <h1 className="text-[2.25rem] sm:text-[2.75rem] font-black text-on-surface mb-xs leading-tight tracking-tight">Olá, {user.name}! 👋</h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
                  Aqui estão as suas atividades programadas. Mantenha seu progresso em dia para atingir suas metas de aprendizado.
                </p>
              </div>

              {/* Upload / Submission Section */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs mb-lg">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary text-[22px]">cloud_upload</span>
                  <h3 className="text-lg font-bold text-slate-800">Upload da Atividade</h3>
                </div>
                <p className="text-sm text-slate-500 mb-5">Faça o upload da sua atividade através de um arquivo ou cole um link enviado pelo professor</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* File Upload */}
                  <div className="border border-slate-200 rounded-xl p-6 flex flex-col gap-4 bg-white shadow-xs">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-slate-400 text-[20px]">upload_file</span>
                      <p className="text-sm font-semibold text-slate-700">Fazer o upload por arquivo</p>
                    </div>

                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                      onDragLeave={() => setDragActive(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragActive(false);
                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                          const file = e.dataTransfer.files[0];
                          const allowedExtensions = ['.pdf'];
                          const fileName = file.name.toLowerCase();
                          const isAllowed = allowedExtensions.some(ext => fileName.endsWith(ext));

                          if (!isAllowed) {
                            alert("Apenas arquivos em formato PDF são aceitos!");
                            return;
                          }

                          const maxSize = 5 * 1024 * 1024; // 5MB
                          if (file.size > maxSize) {
                            alert('O tamanho do arquivo excede o limite máximo de 5MB!');
                            return;
                          }

                          const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
                          setTaskFiles(prev => [...prev, { name: file.name, size: `${sizeMB} MB` }]);
                          setProcessingType('pdf');
                          setShowProcessingQueue(true);
                        }
                      }}
                      className={`relative overflow-hidden rounded-2xl p-6 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer flex-grow min-h-[160px] border border-emerald-500/20 hover:border-emerald-500/40 hover:shadow-md hover:shadow-emerald-50/50 group ${dragActive ? 'ring-2 ring-emerald-500 ring-offset-2' : ''}`}
                      onClick={() => fileInputRef.current?.click()}
                      style={{ backgroundColor: '#f0fdf4' }}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        accept=".pdf"
                      />
                      <div className="w-14 h-14 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                        <span className="material-symbols-outlined text-white text-[28px] font-variation-settings-fill">upload_file</span>
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-sm font-bold text-slate-800 tracking-tight">Arraste seu arquivo aqui</p>
                        <p className="text-xs text-slate-500">ou <span className="text-emerald-600 font-bold group-hover:underline">clique para selecionar</span></p>
                      </div>
                      <span className="bg-emerald-500/10 text-emerald-700 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        PDF — MÁX. 5 MB
                      </span>
                    </div>
                  </div>

                  {/* Smart Teacher Link Input */}
                  <div className="border border-slate-200 rounded-xl p-6 flex flex-col gap-4 bg-white shadow-xs">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-slate-400 text-[20px]">link</span>
                      <p className="text-sm font-semibold text-slate-700">Fazer o upload por link</p>
                    </div>

                    <div className="flex flex-col justify-center flex-grow gap-4">
                      {/* Input field */}
                      <div className="relative">
                        <input
                          type="text"
                          id="task-link-input"
                          value={uploadLink}
                          onChange={(e) => {
                            setUploadLink(e.target.value);
                            setLinkError(null);
                            setValidatedLink(null);
                          }}
                          onBlur={(e) => validateAndPreviewLink(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') validateAndPreviewLink(uploadLink); }}
                          placeholder="Cole o link ou código de 6 dígitos..."
                          className={`w-full px-4 py-3 rounded-lg border text-sm placeholder-slate-400 outline-none transition-all bg-slate-50 ${linkError
                            ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100 text-red-700'
                            : validatedLink
                              ? 'border-emerald-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 text-slate-700'
                              : 'border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 text-slate-700'
                            }`}
                        />
                        {uploadLink && (
                          <button
                            type="button"
                            onClick={() => { setUploadLink(''); setValidatedLink(null); setLinkError(null); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors bg-transparent border-none cursor-pointer p-1"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                          </button>
                        )}
                      </div>

                      {/* Validation error */}
                      <AnimatePresence>
                        {linkError && (
                          <motion.div
                            key="link-error"
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100"
                          >
                            <span className="material-symbols-outlined text-red-500 shrink-0" style={{ fontSize: 18 }}>error</span>
                            <p className="text-xs text-red-600 font-medium" style={{ lineHeight: 1.5 }}>{linkError}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Validated link preview */}
                      <AnimatePresence>
                        {validatedLink && (
                          <motion.div
                            key="link-preview"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                            style={{ overflow: 'hidden' }}
                          >
                            <div
                              className="rounded-xl p-4 flex flex-col gap-3"
                              style={{
                                background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(34,197,94,0.06) 100%)',
                                border: '1px solid rgba(99,102,241,0.2)'
                              }}
                            >
                              {/* Tag */}
                              <div className="flex items-center gap-2">
                                <span
                                  className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase"
                                  style={{ background: 'rgba(34,197,94,0.15)', color: '#16a34a' }}
                                >
                                  ✓ Link verificado
                                </span>
                              </div>

                              {/* Task info */}
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                                  <span className="material-symbols-outlined text-white" style={{ fontSize: 20 }}>assignment</span>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500 font-medium mb-0.5">Tarefa do professor</p>
                                  <p className="text-sm font-bold text-slate-800">{validatedLink.taskTitle}</p>
                                  <p className="text-xs text-slate-500 mt-0.5">Para: <span className="font-semibold text-slate-700">{validatedLink.studentName}</span></p>
                                </div>
                              </div>

                              {/* Link preview text */}
                              <div className="rounded-lg px-3 py-2 bg-white/70 border border-slate-100">
                                <p className="text-[11px] text-slate-400 font-medium truncate">{validatedLink.link}</p>
                              </div>

                              {/* Fazer tarefa button */}
                              <button
                                type="button"
                                onClick={handleAcceptTaskLink}
                                className="w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer border-none"
                                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>play_arrow</span>
                                Fazer tarefa
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Validate button when no preview yet */}
                      {!validatedLink && !linkError && (
                        <button
                          type="button"
                          onClick={() => validateAndPreviewLink(uploadLink)}
                          disabled={!uploadLink.trim()}
                          className="w-full py-2.5 rounded-lg bg-primary disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold text-sm transition-all hover:bg-primary/95 disabled:hover:bg-slate-100 disabled:cursor-not-allowed cursor-pointer border-none active:scale-[0.98]"
                        >
                          Verificar Link
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Accepted Task Links history */}
                  <AnimatePresence>
                    {acceptedTaskLinks.length > 0 && (
                      <motion.div
                        key="accepted-links"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-1"
                      >
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Links de tarefa aceitos ({acceptedTaskLinks.length})</p>
                        <div className="flex flex-col gap-2">
                          {acceptedTaskLinks.map((item) => (
                            <motion.div
                              key={item.id}
                              layout
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-slate-100 shadow-sm"
                            >
                              <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                                  <span className="material-symbols-outlined text-white" style={{ fontSize: 16 }}>assignment</span>
                                </div>
                                <div className="overflow-hidden">
                                  <p className="text-sm font-semibold text-slate-800 truncate">{item.taskTitle}</p>
                                  <p className="text-[11px] text-slate-400 truncate">{item.link}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 ml-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (onGoToAbacus) {
                                      onGoToAbacus(
                                        item.taskTitle,
                                        'Atividade carregada via link do professor.'
                                      );
                                    } else {
                                      alert(`Iniciando atividade: ${item.taskTitle}`);
                                    }
                                  }}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:brightness-110 active:scale-95 cursor-pointer border-none flex items-center gap-1"
                                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                                >
                                  <span className="material-symbols-outlined text-[14px]">play_arrow</span>
                                  Fazer tarefa
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setAcceptedTaskLinks(prev => prev.filter(l => l.id !== item.id))}
                                  className="text-slate-300 hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer p-1"
                                  title="Remover"
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                                </button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Uploaded Files List */}
                {taskFiles.length > 0 && (
                  <div className="mt-5 space-y-2">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Arquivos enviados ({taskFiles.length})</p>
                    {taskFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3 border border-slate-100">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <span className="material-symbols-outlined text-primary text-[18px] shrink-0">
                            {file.size === 'link' ? 'link' : 'description'}
                          </span>
                          <span className="text-sm text-slate-700 font-medium truncate">{file.name}</span>
                          {file.size !== 'link' && (
                            <span className="text-[10px] text-slate-400 shrink-0">{file.size}</span>
                          )}
                        </div>
                        <button
                          onClick={() => setTaskFiles(prev => prev.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-red-500 transition-colors bg-transparent border-none cursor-pointer p-1"
                          title="Remover"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Filters & Search toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-sm mb-lg bg-white p-sm rounded-xl border border-outline-variant shadow-xs">
                <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-50 border border-slate-100">
                  <button
                    onClick={() => setActiveTabLabel('recebidas')}
                    className={`px-lg py-sm rounded-lg font-label-md text-label-md transition-all border-none cursor-pointer ${activeTabLabel === 'recebidas'
                      ? 'bg-primary text-on-primary font-bold shadow-sm'
                      : 'bg-transparent text-on-surface-variant hover:bg-slate-200/50'
                      }`}
                  >
                    Recebidas
                  </button>
                  <button
                    onClick={() => setActiveTabLabel('enviadas')}
                    className={`px-lg py-sm rounded-lg font-label-md text-label-md transition-all border-none cursor-pointer ${activeTabLabel === 'enviadas'
                      ? 'bg-primary text-on-primary font-bold shadow-sm'
                      : 'bg-transparent text-on-surface-variant hover:bg-slate-200/50'
                      }`}
                  >
                    Enviadas
                  </button>
                </div>

                <div className="flex items-center gap-2 border-l border-slate-200 pl-4 py-1.5 flex-1 max-w-xs min-w-[200px]">
                  <span className="material-symbols-outlined text-slate-400 text-[20px]">search</span>
                  <input
                    type="text"
                    placeholder="Filtrar nesta página..."
                    value={generalSearchQuery}
                    onChange={(e) => setGeneralSearchQuery(e.target.value)}
                    className="bg-transparent border-none focus:ring-0 text-label-md font-label-md w-full outline-none"
                  />
                </div>
              </div>

              {/* Title Section & Description based on filters */}
              <div className="mb-md pl-1 animate-fade-in">
                {activeTabLabel === 'recebidas' ? (
                  <>
                    <h3 className="text-lg font-extrabold text-slate-800 tracking-tight font-display">
                      Atividades recebidas
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">essas atividades foram enviadas pelo professor</p>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-extrabold text-slate-800 tracking-tight font-display">
                      Atividades enviadas
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Essas são as atividades que você enviou ao professor</p>
                  </>
                )}
              </div>

              {/* Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg min-h-[320px]">
                <AnimatePresence mode="popLayout">
                  {(() => {
                    const autoAssignedTasks = teacherTasks.filter(task =>
                      task.status === 'active' &&
                      (task.assignedStudentIds?.includes(studentId) || task.assignedStudentIds?.includes(user.name))
                    );

                    const mergedRecebidas = [...acceptedTaskLinks];
                    autoAssignedTasks.forEach(task => {
                      if (!mergedRecebidas.some(link => link.taskId === task.id)) {
                        mergedRecebidas.push({
                          id: `AUTO-${task.id}`,
                          studentName: user.name,
                          taskId: task.id,
                          taskTitle: task.title,
                          createdAt: task.startDate || new Date().toISOString(),
                          link: 'Atribuição direta do professor'
                        });
                      }
                    });

                    const listToRender = activeTabLabel === 'recebidas'
                      ? mergedRecebidas.map(link => {
                        const dbTask = teacherTasks.find(t => t.id === link.taskId);
                        const isTask1 = dbTask?.id === 'task-1';
                        const progress = isTask1 ? progressPercent : 0;
                        const status = progress === 100
                          ? 'completed'
                          : progress > 0
                            ? 'in-progress'
                            : 'pending';

                        return {
                          id: link.id,
                          title: link.taskTitle,
                          description: dbTask?.description || 'Soletrar as palavras indicadas pelo professor usando as cores correspondentes no ábaco digital.',
                          dueDate: dbTask?.dueDate ? `Entrega: ${new Date(dbTask.dueDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}` : 'Entrega flexível',
                          status: status,
                          progress: progress,
                          grade: null,
                          urgent: dbTask?.priority === 'Alta',
                          filesCount: dbTask?.targetWords?.length || 0,
                          teacherImg: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150',
                          actionLabel: 'Fazer tarefa',
                          supportFiles: dbTask?.supportFiles || [],
                          onAction: () => {
                            if (onGoToAbacus) {
                              onGoToAbacus(link.taskTitle, dbTask?.description || 'Atividade carregada via link do professor.');
                            } else {
                              alert(`Iniciando atividade: ${link.taskTitle}`);
                            }
                          }
                        };
                      })
                      : sentActivities.map(activity => {
                        return {
                          id: activity.id,
                          title: activity.taskTitle,
                          description: `Esta tarefa foi concluída e enviada para o professor. Contém ${activity.spelledWordsCount} palavras soletradas no ábaco digital.`,
                          dueDate: `Enviado em: ${new Date(activity.submittedAt).toLocaleDateString('pt-BR')} às ${new Date(activity.submittedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
                          status: 'completed',
                          progress: 100,
                          grade: activity.grade || 'Revisado',
                          urgent: false,
                          filesCount: 0,
                          teacherImg: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150',
                          actionLabel: 'Ver Detalhes',
                          supportFiles: [],
                          onAction: () => alert(`Tarefa "${activity.taskTitle}" enviada com sucesso em ${new Date(activity.submittedAt).toLocaleString('pt-BR')}.`)
                        };
                      });

                    const filtered = listToRender.filter(t => {
                      return t.title.toLowerCase().includes(generalSearchQuery.toLowerCase()) ||
                        t.description.toLowerCase().includes(generalSearchQuery.toLowerCase());
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="col-span-full py-16 text-center text-slate-400 text-sm">
                          Nenhuma atividade encontrada nesta seção.
                        </div>
                      );
                    }

                    return filtered.map((task) => {
                      return (
                        <motion.div
                          layout
                          initial={{ opacity: 0, y: 15, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -15, scale: 0.98 }}
                          whileHover={{
                            y: -6,
                            boxShadow: "0 12px 20px -8px rgba(0, 0, 0, 0.08), 0 4px 12px -8px rgba(0, 0, 0, 0.04)"
                          }}
                          transition={{
                            type: "spring",
                            damping: 26,
                            stiffness: 280
                          }}
                          key={task.id}
                          className="bg-white rounded-2xl border border-slate-200/85 p-6 flex flex-col gap-4 relative overflow-hidden min-h-[290px] shadow-xs w-full hover:border-slate-300 transition-colors"
                        >
                          {/* Left Stripe Indicator */}
                          <div className={`absolute top-0 left-0 w-1.5 h-full ${getLeftStripe(task.status)}`} />

                          {/* Header Row */}
                          <div className="flex items-start justify-between w-full pl-1">
                            <div className="flex items-center gap-3">
                              {/* Stylized Logo Square */}
                              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white ${getLogoGradient(task.id)}`}>
                                <span className="material-symbols-outlined text-[22px] font-medium">
                                  {getLogoIcon(task.id)}
                                </span>
                              </div>

                              {/* Category Tag & Metadata */}
                              <div className="flex flex-col gap-0.5">
                                <span className={`text-[10px] font-extrabold tracking-wider uppercase ${task.urgent ? 'text-red-600' : 'text-slate-400'
                                  }`}>
                                  {getCategoryTag(task.id)}
                                </span>
                                <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                                  <span className="material-symbols-outlined text-[12px]">schedule</span>
                                  {task.dueDate.replace('Entrega: ', '').replace('Concluído em: ', '').replace('Enviado em: ', '')}
                                </span>
                              </div>
                            </div>

                            {/* Action badge */}
                            <div className="flex items-center gap-1">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${task.status === 'completed' ? 'bg-green-50 text-green-600 border border-green-100' :
                                task.status === 'in-progress' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                  'bg-red-50 text-red-600 border border-red-100'
                                }`}>
                                {task.status === 'completed' ? 'Concluída' : task.status === 'in-progress' ? 'Fazendo' : 'Pendente'}
                              </span>
                            </div>
                          </div>

                          {/* Content Area */}
                          <div className="space-y-1.5 pl-1">
                            <h3 className="font-extrabold text-slate-800 text-sm tracking-tight leading-snug font-display">
                              {task.title}
                            </h3>
                            <p className="text-xs text-slate-500 font-sans line-clamp-2 leading-relaxed">
                              {task.description}
                            </p>
                          </div>

                          {/* Progress Area if Active */}
                          {task.status === 'in-progress' && (
                            <div className="space-y-1 mt-1 pl-1">
                              <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                <span>Progresso</span>
                                <span className="text-primary">{task.progress}%</span>
                              </div>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-primary to-indigo-500 h-full rounded-full transition-all duration-500"
                                  style={{ width: `${task.progress}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Support Files Area (PDF or Images from Teacher) */}
                          {task.supportFiles && task.supportFiles.length > 0 && (
                            <div className="space-y-1.5 mt-1 bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px]">folder_open</span>
                                Arquivos de Apoio ({task.supportFiles.length})
                              </span>
                              <div className="flex flex-col gap-1 max-h-[85px] overflow-y-auto pr-1">
                                {task.supportFiles.map((file: any, idx: number) => {
                                  const isPdf = file.name.toLowerCase().endsWith('.pdf');
                                  return (
                                    <a
                                      key={idx}
                                      href={file.url}
                                      download={file.name}
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex items-center justify-between p-1.5 bg-white border border-slate-200/80 rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-left no-underline group cursor-pointer"
                                      title={`Baixar ${file.name} (${file.size})`}
                                    >
                                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                        <span className={`material-symbols-outlined text-[15px] shrink-0 ${isPdf ? 'text-red-500' : 'text-blue-500'}`}>
                                          {isPdf ? 'picture_as_pdf' : 'image'}
                                        </span>
                                        <span className="text-[11px] text-slate-700 font-semibold truncate group-hover:text-primary transition-colors">
                                          {file.name}
                                        </span>
                                      </div>
                                      <span className="text-[8px] text-slate-400 font-mono ml-2 shrink-0 group-hover:text-primary/70 transition-colors">
                                        {file.size}
                                      </span>
                                    </a>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Divider & Footer */}
                          <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between pl-1">
                            <div className="flex items-center gap-2">
                              {task.grade ? (
                                <div className="flex items-center gap-0.5 text-emerald-600 font-extrabold text-[11px] bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                                  <span className="material-symbols-outlined text-[13px]">grade</span>
                                  <span>Status: {task.grade}</span>
                                </div>
                              ) : task.filesCount > 0 ? (
                                <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                                  <span className="material-symbols-outlined text-[14px]">attachment</span>
                                  <span>{task.filesCount} {task.filesCount === 1 ? 'palavra' : 'palavras'}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <img
                                    src={task.teacherImg}
                                    alt="Professor"
                                    className="w-6 h-6 rounded-full object-cover border border-slate-200"
                                  />
                                  <span className="text-[10px] text-slate-400 font-medium">Prof. Décio</span>
                                </div>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={task.onAction}
                                className={`px-4 py-1.5 rounded-full font-extrabold text-[11px] transition-all flex items-center gap-1 cursor-pointer active:scale-95 duration-100 border border-slate-300 hover:border-slate-400 text-slate-700 hover:bg-slate-50`}
                              >
                                <span>{task.actionLabel}</span>
                                <span className="material-symbols-outlined text-[12px] font-bold">open_in_new</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(`Deseja remover a atividade "${task.title}" permanentemente do seu perfil?`)) {
                                    if (activeTabLabel === 'recebidas') {
                                      setAcceptedTaskLinks(prev => prev.filter(l => l.id !== task.id));
                                    } else {
                                      setSentActivities(prev => prev.filter(a => a.id !== task.id));
                                    }
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all border-none cursor-pointer flex items-center justify-center"
                                title="Remover"
                              >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    });
                  })()}
                </AnimatePresence>
              </div>


              {/* Pagination Footer */}
              <div className="mt-xl py-lg border-t border-outline-variant flex items-center justify-center">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Página 1 de 1</span>
              </div>
            </div>
          ) : studentView === 'details' ? (
            /* RENDERING THE DETAILS SCREEN */
            <div className="animate-fade-in space-y-lg">
              {/* Breadcrumbs */}
              <nav className="flex items-center gap-xs mb-md text-on-surface-variant font-label-sm text-label-sm">
                <button onClick={() => setStudentView('tasks-list')} className="hover:text-primary transition-colors cursor-pointer bg-transparent border-none p-0 outline-none">
                  Tarefas
                </button>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-primary font-bold">Numerais Multilingue</span>
              </nav>

              {/* Header Section */}
              <div className="mb-xl">
                <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">Exercício de Numerais Multilingue</h2>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl mt-xs">
                  Atividade de tradução e pronúncia focada no vocabulário básico de numeração em Português, Inglês e Alemão.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-start">
                {/* Left Column: Details & Upload */}
                <div className="lg:col-span-8 space-y-lg">
                  {/* Content Card */}
                  <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm">
                    <div className="flex items-center gap-sm mb-md pb-sm border-b border-outline-variant/30">
                      <span className="material-symbols-outlined text-primary">description</span>
                      <h3 className="font-headline-md text-headline-md text-on-surface">Instruções do Exercício</h3>
                    </div>
                    <div className="rounded-lg mb-lg">
                      <h4 className="font-headline-md text-headline-md text-on-surface mb-xs">Descrição da Atividade</h4>
                      <p className="font-body-md text-body-md text-on-surface leading-relaxed">
                        Fazer os numerais nas três línguas: Zero, zero, null. Um, one, eins, Dois, two, zwei, Três, three, drei, Quatro, four, vier, Cinco, five, funf, Seis, six, sechs, Oito, eight, acht, Nove, nine, neun.
                      </p>
                    </div>
                    <div className="p-md bg-tertiary-container/10 border-l-4 border-tertiary rounded-r-lg">
                      <div className="flex items-center gap-xs mb-xs">
                        <span className="material-symbols-outlined text-tertiary text-[20px]">record_voice_over</span>
                        <p className="font-label-md text-label-md font-bold text-tertiary">Nota do Professor</p>
                      </div>
                      <p className="font-body-md text-body-md text-on-surface">
                        Capriche na pronúncia e na escrita correta de cada termo. Cada um separado: <span className="font-bold">ZERO</span>, preto; <span className="text-primary font-bold">ZERO</span>, azul; <span className="text-tertiary font-bold">NULL</span>, vermelho.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (onGoToAbacus) {
                          onGoToAbacus(
                            'Exercício de Numerais Multilingue',
                            'Atividade de tradução e pronúncia focada no vocabulário básico de numeração em Português, Inglês e Alemão.'
                          );
                        }
                      }}
                      className="w-full mt-lg flex items-center justify-center gap-sm bg-primary text-on-primary py-md px-lg rounded-lg font-bold font-label-md hover:opacity-90 transition-all shadow-sm cursor-pointer active:scale-95 duration-150 border-none"
                    >
                      <span className="material-symbols-outlined">arrow_forward</span>
                      <span className="">Ir para a tarefa</span>
                    </button>
                  </div>

                  {/* Upload Area */}
                  <div className="bg-white rounded-3xl border border-slate-100 p-lg shadow-xs">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf"
                    />
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                      onDragLeave={() => setDragActive(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragActive(false);
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          const file = e.dataTransfer.files[0];
                          const allowedExtensions = ['.pdf'];
                          const fileName = file.name.toLowerCase();
                          const isAllowed = allowedExtensions.some(ext => fileName.endsWith(ext));

                          if (!isAllowed) {
                            alert("Apenas arquivos em formato PDF são aceitos!");
                            return;
                          }

                          const maxSize = 5 * 1024 * 1024; // 5MB
                          if (file.size > maxSize) {
                            alert('O tamanho do arquivo excede o limite máximo de 5MB!');
                            return;
                          }

                          const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
                          setTaskFiles([...taskFiles, { name: file.name, size: `${sizeMB} MB` }]);
                          setProcessingType('pdf');
                          setShowProcessingQueue(true);
                        }
                      }}
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.click();
                        }
                      }}
                      className={`w-full relative rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/8 to-emerald-500/3 p-5 sm:p-6 text-left overflow-hidden shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 cursor-pointer hover:shadow-md hover:border-emerald-500/40 transition-all duration-200 group ${
                        dragActive ? 'ring-2 ring-emerald-500 ring-offset-2' : ''
                      }`}
                      style={{ backgroundColor: '#f0fdf4' }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-500/10 group-hover:scale-105 transition-transform duration-300 relative shadow-inner">
                          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                            {/* Left PDF Icon */}
                            <g transform="translate(4, 8)">
                              {/* Document Base */}
                              <rect x="0" y="0" width="16" height="22" rx="3" fill="#FFF5F5" stroke="#F87171" strokeWidth="1.5"/>
                              {/* Lines inside */}
                              <line x1="4" y1="6" x2="12" y2="6" stroke="#F87171" strokeWidth="1.5" strokeLinecap="round"/>
                              <line x1="4" y1="10" x2="10" y2="10" stroke="#F87171" strokeWidth="1.5" strokeLinecap="round"/>
                              {/* PDF text label badge inside */}
                              <rect x="3" y="14" width="10" height="5" rx="1" fill="#EF4444"/>
                              <path d="M5 17.5H6.5M8 17.5H9.5" stroke="white" strokeWidth="1" strokeLinecap="round"/>
                            </g>
                            
                            {/* Right PDF Icon */}
                            <g transform="translate(28, 14)">
                              {/* Document Base */}
                              <rect x="0" y="0" width="16" height="22" rx="3" fill="#FFF5F5" stroke="#F87171" strokeWidth="1.5"/>
                              {/* Lines inside */}
                              <line x1="4" y1="6" x2="12" y2="6" stroke="#F87171" strokeWidth="1.5" strokeLinecap="round"/>
                              <line x1="4" y1="10" x2="10" y2="10" stroke="#F87171" strokeWidth="1.5" strokeLinecap="round"/>
                              {/* PDF text label badge inside */}
                              <rect x="3" y="14" width="10" height="5" rx="1" fill="#EF4444"/>
                              <path d="M5 17.5H6.5M8 17.5H9.5" stroke="white" strokeWidth="1" strokeLinecap="round"/>
                            </g>
                            
                            {/* Link in the middle connecting them */}
                            <g transform="translate(17, 18)">
                              {/* White background pill for the link */}
                              <rect x="0" y="0" width="14" height="10" rx="5" fill="white" stroke="#9CA3AF" strokeWidth="1.5"/>
                              {/* Link chain look */}
                              <path d="M4 5H10" stroke="#4B5563" strokeWidth="2" strokeLinecap="round"/>
                            </g>
                          </svg>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm shadow-emerald-600/10">
                              Arquivos da Tarefa
                            </span>
                          </div>
                          <h3 className="font-display font-extrabold text-lg sm:text-xl text-slate-900 tracking-tight leading-tight mb-0.5">
                            Envie sua tarefa
                          </h3>
                          <p className="text-xs text-slate-600 font-medium leading-relaxed">
                            Envie sua tarefa para o Teatcher e anexe seus arquivos em formato PDF.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
                        <button
                          type="button"
                          className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm hover:shadow active:scale-95 transition-all text-sm cursor-pointer whitespace-nowrap border-none"
                        >
                          <span className="material-symbols-outlined text-[18px]">upload_file</span>
                          <span>Selecionar PDF</span>
                        </button>
                      </div>
                    </div>

                    {/* Placeholder for uploaded files */}
                    <div className="mt-lg space-y-sm">
                      {taskFiles.length === 0 ? (
                        <p className="text-xs text-slate-400 italic text-center py-2">Nenhum arquivo anexado.</p>
                      ) : (
                        taskFiles.map((fileObj, idx) => (
                          <div key={idx} className="flex items-center justify-between p-sm border border-outline-variant rounded-lg bg-surface flex-wrap sm:flex-nowrap">
                            <div className="flex items-center gap-sm">
                              <span className="material-symbols-outlined text-primary">article</span>
                              <div>
                                <p className="font-label-md text-label-md text-on-surface">{fileObj.name}</p>
                                <p className="text-[10px] text-on-surface-variant">{fileObj.size}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setTaskFiles(taskFiles.filter((_, i) => i !== idx))}
                              className="text-on-surface-variant hover:text-error transition-colors cursor-pointer bg-transparent border-none p-0"
                            >
                              <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                          </div>
                        ))
                      )}

                      <button
                        onClick={() => {
                          if (completedCount === 0) {
                            alert('Atenção: Você ainda não soletrou nenhuma palavra no ábaco. É altamente recomendado soletrar pelo menos alguns numerais antes de enviar a tarefa.');
                          }
                          setShowShareModal(true);
                        }}
                        disabled={taskFiles.length === 0}
                        className={`w-full mt-lg flex items-center justify-center gap-sm py-md px-lg rounded-lg font-bold font-label-md transition-all shadow-sm border-none ${taskFiles.length === 0
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-70'
                          : 'bg-primary text-on-primary hover:opacity-90 active:scale-95 duration-150 cursor-pointer'
                          }`}
                        title={taskFiles.length === 0 ? 'Por favor, anexe a tarefa clicando na área de upload acima antes de enviar.' : 'Enviar tarefa'}
                      >
                        <span className="material-symbols-outlined">send</span>
                        <span className="">Enviar Tarefa</span>
                      </button>
                    </div>

                    {/* Link Submission Section */}
                    <div className="border-t border-outline-variant/30 pt-lg mt-lg flex flex-col gap-sm">
                      <div className="flex items-center gap-sm mb-xs">
                        <span className="material-symbols-outlined text-primary">link</span>
                        <h4 className="font-headline-md text-headline-md text-on-surface">Enviar Link da Tarefa</h4>
                      </div>
                      <p className="text-xs text-on-surface-variant leading-relaxed font-light">
                        Cole abaixo o link do WhatsApp enviado pelo professor para realizar a sua tarefa.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-sm items-center mt-xs w-full">
                        <input
                          type="url"
                          value={uploadLink}
                          onChange={(e) => setUploadLink(e.target.value)}
                          placeholder="Cole o link do WhatsApp aqui (ex: https://wa.me/... ou https://chat.whatsapp.com/...)"
                          className="w-full sm:flex-1 px-4 py-3 rounded-lg border border-outline text-sm text-on-surface placeholder-on-surface-variant/50 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-surface-container-low"
                        />
                        <button
                          onClick={() => {
                            const trimmedLink = uploadLink.trim();
                            if (!trimmedLink) return;

                            // Regex to match WhatsApp domains and paths (wa.me, api.whatsapp.com, chat.whatsapp.com, web.whatsapp.com)
                            const whatsappRegex = /^(https?:\/\/)?(www\.)?(wa\.me|api\.whatsapp\.com|chat\.whatsapp\.com|web\.whatsapp\.com)\/.+$/i;

                            if (!whatsappRegex.test(trimmedLink)) {
                              alert('Por favor, insira um link válido do WhatsApp (ex: https://wa.me/... ou https://chat.whatsapp.com/...)');
                              return;
                            }

                            setTaskFiles(prev => [...prev, { name: trimmedLink, size: 'link' }]);
                            setUploadLink('');
                            setProcessingType('link');
                            setShowProcessingQueue(true);
                          }}
                          type="button"
                          disabled={!uploadLink.trim()}
                          className={`w-full sm:w-auto flex items-center justify-center gap-sm py-3 px-lg rounded-lg font-bold font-label-md transition-all shadow-sm border-none shrink-0 ${!uploadLink.trim()
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-70'
                            : 'bg-primary text-on-primary hover:opacity-90 active:scale-95 duration-150 cursor-pointer'
                            }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">attachment</span>
                          <span>Anexar Link</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Metadata */}
                <div className="lg:col-span-4 space-y-lg">
                  {/* Metadata Card */}
                  <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-lg opacity-10">
                      <span className="material-symbols-outlined text-[80px]">assignment_turned_in</span>
                    </div>
                    <h3 className="font-headline-md text-headline-md text-on-surface mb-md">Detalhamento</h3>

                    <div className="space-y-md">
                      <div className="flex items-center gap-md">
                        <div className="w-10 h-10 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined">fingerprint</span>
                        </div>
                        <div>
                          <p className="font-label-sm text-label-sm text-on-surface-variant">ID da Tarefa</p>
                          <p className="font-body-lg text-body-lg text-on-surface font-semibold">#ED-2026-11</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-md">
                        <div className="w-10 h-10 rounded-lg bg-secondary-container/20 flex items-center justify-center text-secondary">
                          <span className="material-symbols-outlined">calendar_today</span>
                        </div>
                        <div>
                          <p className="font-label-sm text-label-sm text-on-surface-variant">Data de Início</p>
                          <p className="font-body-lg text-body-lg text-on-surface font-semibold">20 de Out, 2024</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-md">
                        <div className="w-10 h-10 rounded-lg bg-tertiary-container/20 flex items-center justify-center text-tertiary">
                          <span className="material-symbols-outlined">event_busy</span>
                        </div>
                        <div>
                          <p className="font-label-sm text-label-sm text-on-surface-variant">Data de Entrega</p>
                          <p className="font-body-lg text-body-lg text-on-surface font-semibold">15 de Jun, 2026</p>
                        </div>
                      </div>
                      <div className="pt-md mt-md border-t border-outline-variant/30">
                        <p className="font-label-sm text-label-sm text-on-surface-variant mb-xs">Status de atividade</p>
                        <div className={`inline-flex items-center gap-xs px-md py-xs rounded-full font-label-md text-label-md font-bold ${completedCount === NUMERAL_ITEMS.length
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : completedCount > 0
                            ? 'bg-blue-50 text-blue-700 border border-blue-100'
                            : 'bg-red-50 text-red-700 border border-red-100'
                          }`}>
                          <span className={`w-2 h-2 rounded-full ${completedCount === NUMERAL_ITEMS.length
                            ? 'bg-emerald-500'
                            : completedCount > 0
                              ? 'bg-blue-500 animate-pulse'
                              : 'bg-red-500'
                            }`}></span>
                          {completedCount === NUMERAL_ITEMS.length ? 'Concluído' : completedCount > 0 ? 'Em andamento' : 'Pendente'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Teacher Card */}
                  <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm">
                    <p className="font-label-sm text-label-sm text-on-surface-variant mb-md">Professor Responsável</p>
                    <div className="flex items-center gap-md">
                      <img
                        alt="Avatar do Professor"
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-primary-container/30"
                        src="src/assets/Imagens/profdecioperfil.avif"
                      />
                      <div>
                        <p className="font-body-lg text-body-lg text-on-surface font-bold">Prof. José Décio de Alencar</p>
                        <p className="font-label-sm text-label-sm text-on-surface-variant">Projeto Brasil bilíngue</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowWhatsappModal(true)}
                      className="w-full mt-md py-xs border border-primary text-primary rounded-lg font-label-md text-label-md hover:bg-primary-container/10 transition-colors cursor-pointer bg-transparent"
                    >
                      Mensagem para o Professor
                    </button>
                  </div>

                  {/* Task Image Reference (Contextual) */}
                  <div className="rounded-xl overflow-hidden shadow-sm h-48 relative group">
                    <img
                      alt="Material de apoio"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAGGGtwFfvjetdboO-4SfeJb17cGynQ2Q5xpB2scHQJuPYgpmN_Uv6_uBH-8T1XnZZSraoUghUNlF202q5GyaoiEmI4sNT_YPtpizMCN3leqMeR1yqB55XPdvBXdVSqwKBF4lxKOh8nSSlSMjhxJd5N1NVULlgi34Yx1_8cc3VVqvuEAI9oDsj2zoB8BPSJw4Kd_kJzzmbVJvMF9ZrMpQVXsB9bBBgiwwYxN9LO6O3jgppgcNRNnp3hYerzRRjvzxR-NMAinf8yaDnr"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-on-surface/60 to-transparent flex items-end p-md">
                      <p className="text-on-primary font-label-md text-label-md">Material de Apoio Digital</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* RENDERING THE CHECKLIST SCREEN */
            <div className="animate-fade-in space-y-8">
              {/* Breadcrumbs */}
              <nav className="flex items-center gap-xs mb-md text-on-surface-variant font-label-sm text-label-sm">
                <button onClick={() => setStudentView('tasks-list')} className="hover:text-primary transition-colors cursor-pointer bg-transparent border-none p-0 outline-none">
                  Tarefas
                </button>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-primary font-bold">Checklist de Numerais</span>
              </nav>

              {/* Progress & Intro Card */}
              <section className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 flex-grow">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-on-surface">Exercício de Numerais Multilingue</h2>
                  <p className="text-xs text-on-surface-variant leading-relaxed font-light">
                    Desafio trilíngue! Soletre os números de 0 a 9 em Português, Inglês e Alemão. Clique em **Soletrar** para abrir o ábaco e montar as palavras com as cores de fio recomendadas.
                  </p>

                  {/* Real Progress indicator */}
                  <div className="pt-2 max-w-md space-y-1.5">
                    <div className="flex justify-between text-[11px] font-bold text-slate-500">
                      <span>Palavras Soletradas</span>
                      <span className="text-primary font-extrabold">{completedCount} / {NUMERAL_ITEMS.length} ({progressPercent}%)</span>
                    </div>
                    <div className="w-full bg-[#eaedff] h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-primary to-primary-container h-full rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex md:flex-col gap-3">
                  <button
                    onClick={() => setStudentView('details')}
                    className="flex items-center justify-center gap-2 px-5 py-4 border border-outline text-on-surface-variant hover:bg-slate-50 text-xs font-bold rounded-2xl transition-all cursor-pointer bg-white"
                  >
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                    Voltar a Detalhes
                  </button>
                  {completedCount > 0 && (
                    <button
                      onClick={() => setShowShareModal(true)}
                      className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-primary to-primary-container hover:shadow-lg text-white text-xs font-bold rounded-2xl transition-all shadow cursor-pointer active:scale-95 border-none"
                    >
                      <span className="material-symbols-outlined text-[18px]">send</span>
                      Entregar Atividade
                    </button>
                  )}
                </div>
              </section>

              {/* Filters and Checklist Grid */}
              <section className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <h3 className="font-extrabold text-lg text-on-surface">Checklist de Palavras</h3>
                    <p className="text-xs text-on-surface-variant">Clique em qualquer número para começar a soletrar</p>
                  </div>

                  {/* Language filter pills */}
                  <div className="flex items-center gap-1 bg-surface-container-high p-1 rounded-xl self-start sm:self-auto border border-outline-variant/40">
                    <button
                      onClick={() => setFilterLanguage('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-none ${filterLanguage === 'all' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface bg-transparent'
                        }`}
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => setFilterLanguage('pt')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-none ${filterLanguage === 'pt' ? 'bg-white text-slate-700 shadow-sm' : 'text-on-surface-variant hover:text-on-surface bg-transparent'
                        }`}
                    >
                      Português
                    </button>
                    <button
                      onClick={() => setFilterLanguage('en')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-none ${filterLanguage === 'en' ? 'bg-white text-blue-700 shadow-sm' : 'text-on-surface-variant hover:text-on-surface bg-transparent'
                        }`}
                    >
                      Inglês
                    </button>
                    <button
                      onClick={() => setFilterLanguage('de')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-none ${filterLanguage === 'de' ? 'bg-white text-red-700 shadow-sm' : 'text-on-surface-variant hover:text-on-surface bg-transparent'
                        }`}
                    >
                      Alemão
                    </button>
                  </div>
                </div>

                {/* Numeral Items Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 min-h-[220px]">
                  <AnimatePresence>
                    {filteredItems.length === 0 ? (
                      <div className="col-span-full text-center py-8 text-slate-400 italic text-sm">
                        Nenhuma palavra encontrada.
                      </div>
                    ) : (
                      filteredItems.map((item, idx) => {
                        const displayWord = item.word.includes('_EN') ? 'ZERO' : item.word;
                        const isDone = isWordCompleted(item.word);

                        return (
                          <motion.div
                            key={item.word + '-' + item.language}
                            layout="position"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                            className="bg-white rounded-2xl border border-slate-200/85 p-5 flex flex-col gap-4 transition-all hover:translate-y-[-4px] hover:shadow-md duration-300 relative overflow-hidden min-h-[195px] shadow-xs"
                          >
                            {/* Left Stripe Indicator */}
                            <div className={`absolute top-0 left-0 w-1.5 h-full ${isDone
                              ? 'bg-gradient-to-b from-emerald-400 to-green-600'
                              : 'bg-gradient-to-b from-slate-200 to-slate-400'
                              }`} />

                            {/* Header Row */}
                            <div className="flex items-start justify-between w-full pl-1">
                              <div className="flex items-center gap-2">
                                {/* Language Logo Square */}
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-black tracking-tighter ${item.language === 'pt'
                                  ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-xs shadow-green-100'
                                  : item.language === 'en'
                                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xs shadow-blue-100'
                                    : 'bg-gradient-to-br from-red-500 to-amber-600 shadow-xs shadow-red-100'
                                  }`}>
                                  {item.language.toUpperCase()}
                                </div>

                                {/* Language Label */}
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                                    {item.langLabel}
                                  </span>
                                </div>
                              </div>

                              {/* Status Icon */}
                              <span className={`material-symbols-outlined text-[20px] ${isDone ? 'text-green-500 font-bold' : 'text-slate-300'
                                }`} title={isDone ? 'Concluída' : 'Pendente'}>
                                {isDone ? 'check_circle' : 'hourglass_empty'}
                              </span>
                            </div>

                            {/* Spelled Word */}
                            <div className="pl-1 space-y-1">
                              <h4 className="font-black text-lg tracking-wider text-slate-800 font-mono uppercase leading-none">
                                {displayWord}
                              </h4>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                                <span>Fio recomendado:</span>
                                <div
                                  className="w-3.5 h-3.5 rounded-full border border-slate-200 shadow-xs shrink-0"
                                  style={{ backgroundColor: item.color }}
                                  title={`Cor do Fio: ${item.color}`}
                                />
                              </div>
                            </div>

                            {/* Footer Action Outline Button */}
                            <button
                              onClick={() => onLaunchSpellingTask(displayWord, item.language, item.color)}
                              className={`w-full py-2 rounded-full font-extrabold text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 duration-100 pl-1 border-none ${isDone
                                ? 'bg-green-50 hover:bg-green-100 text-green-700 border border-green-200'
                                : 'bg-white border border-slate-300 hover:border-slate-400 text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                              <span className="material-symbols-outlined text-[13px]">
                                {isDone ? 'replay' : 'keyboard'}
                              </span>
                              <span>{isDone ? 'Soletrar Novamente' : 'Soletrar'}</span>
                            </button>
                          </motion.div>
                        );
                      })
                    )}
                  </AnimatePresence>
                </div>
              </section>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="px-margin-desktop py-lg border-t border-outline-variant mt-xl bg-surface-container-low/40">
          <div className="flex flex-col md:flex-row justify-between items-center gap-md">
            <p className="text-label-sm text-on-surface-variant">© 2026 ABBA DIGITAL - Todos os direitos reservados.</p>
            <div className="flex gap-lg">
              <a className="text-label-sm text-on-surface-variant hover:text-primary" href="#">Termos de Uso</a>
              <a className="text-label-sm text-on-surface-variant hover:text-primary" href="#">Política de Privacidade</a>
            </div>
          </div>
        </footer>
      </div>

      {/* SHARE / SUBMISSION MODAL */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#131b2e]/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 w-screen h-screen"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-3xl border border-[#c1c6d6] w-[90vw] sm:w-[500px] max-w-full p-6 sm:p-8 space-y-6 shadow-2xl flex flex-col"
            >
              <div className="flex justify-between items-center border-b border-[#dde0e2] pb-4">
                <h3 className="text-xl font-extrabold text-[#131b2e] flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-500">task_alt</span>
                  Finalizar e Entregar
                </h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all cursor-pointer bg-transparent border-none"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Spelled words review checklist */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Minhas Palavras Gravadas</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Confirme as palavras que você soletrou antes de entregar.</p>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-2 pr-2 border border-[#dde0e2] p-3 rounded-xl bg-slate-50">
                  {completedSpelledWords.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs italic">Nenhuma palavra gravada ainda no ábaco.</div>
                  ) : (
                    completedSpelledWords.map((wordObj, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2.5 bg-white border border-slate-100 rounded-lg shadow-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-3.5 h-3.5 rounded-full border border-slate-200" style={{ backgroundColor: wordObj.themeColor }} />
                          <span className="font-bold text-sm tracking-wide text-slate-700 font-mono">{wordObj.word}</span>
                        </div>
                        <button
                          onClick={() => onRemoveCompletedWord(idx)}
                          className="text-red-500 hover:text-red-700 p-1 cursor-pointer transition-colors bg-transparent border-none"
                          title="Excluir palavra"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {taskFiles.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Arquivos Físicos Anexados ({taskFiles.length})</h4>
                    <ul className="text-xs text-slate-500 list-disc pl-4 mt-1 space-y-0.5">
                      {taskFiles.map((f, idx) => (
                        <li key={idx} className="font-mono">{f.name} ({f.size})</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Delivery Channels */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Selecione o Canal de Envio</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleShareWhatsApp}
                    className="flex items-center justify-center gap-2 py-3.5 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-all active:scale-[0.98] border-none"
                  >
                    <span className="material-symbols-outlined text-[18px]">chat</span>
                    Enviar por WhatsApp
                  </button>

                  <button
                    onClick={handleShareGmail}
                    className="flex items-center justify-center gap-2 py-3.5 bg-[#EA4335] hover:bg-[#c62828] text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-all active:scale-[0.98] border-none"
                  >
                    <span className="material-symbols-outlined text-[18px]">mail</span>
                    Enviar por E-mail
                  </button>
                </div>

                <div className="pt-1">
                  <button
                    onClick={handleDownloadPdf}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-all active:scale-[0.98] border-none"
                  >
                    <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                    Baixar Relatório em PDF
                  </button>
                </div>

                <div className="pt-1">
                  <button
                    onClick={handleCopyLink}
                    className="w-full flex items-center justify-center gap-1.5 py-3 border border-[#005bb3] text-[#005bb3] hover:bg-blue-50 font-bold text-xs rounded-xl cursor-pointer transition-all bg-transparent"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {copiedLink ? 'check' : 'link'}
                    </span>
                    {copiedLink ? 'Link Copiado!' : 'Copiar Link Mágico de Entrega'}
                  </button>
                  <p className="text-[9px] text-slate-400 text-center mt-2 leading-relaxed">
                    O link contém todas as informações da sua tarefa montada de forma encriptada para que o professor possa revisar em 3D.
                  </p>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PROCESSING QUEUE MODAL */}
      <AnimatePresence>
        {showProcessingQueue && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 w-screen h-screen"
          >
            {/* Scoped CSS styling for pure CSS synchro-triggers */}
            <style dangerouslySetInnerHTML={{
              __html: `
              /* ================= ANIMAÇÕES DE TEMPO CONFIGURADAS ================= */
              
              /* 1. Giro do Ícone Superior (1.5s) */
              @keyframes spinIcon {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }

              /* 2. Carregamento das Barras (4s) */
              @keyframes fillProgress {
                0% { width: 0%; }
                100% { width: 100%; }
              }

              /* 3. Surgimento Suave de Elementos (Fade In) */
              @keyframes fadeInAction {
                0% { opacity: 0; pointer-events: none; transform: scale(0.9); }
                100% { opacity: 1; pointer-events: auto; transform: scale(1); }
              }

              /* 4. Sumiço Suave de Elementos (Fade Out) */
              @keyframes fadeOutAction {
                0% { opacity: 1; pointer-events: auto; transform: scale(1); }
                100% { opacity: 0; pointer-events: none; transform: scale(0.8); visibility: hidden; }
              }

              /* 5. Transição do Fundo dos Containers para Azul */
              @keyframes bgToBlue {
                0% { background-color: #ffffff; }
                100% { background-color: #f0f5ff; border-color: #e0eaff; }
              }

              /* 6. Transição das Cores de Texto/Ícone para Azul */
              @keyframes textToBlue {
                0% { color: #64748b; }
                100% { color: #0052cc; }
              }

              /* ================= SINCRO-GATILHOS EM CSS PURO ================= */

              #trigger:checked ~ .card-container #syncIcon {
                animation: spinIcon 1.5s ease-in-out;
              }

              /* --- TIMING CARD 1: PDF/LINK (Janela de tempo: 1.5s a 5.5s) --- */
              
              #trigger:checked ~ .card-container #progress1 {
                animation: fillProgress 4s linear forwards 1.5s;
              }
              /* "Cancel" ativo enquanto carrega */
              #trigger:checked ~ .card-container #btnCancel1 {
                animation: fadeInAction 0.3s ease-out forwards 1.5s, fadeOutAction 0.2s ease-in forwards 5.5s;
              }
              /* Ao bater 5.5s, ativa o fundo azul, muda textos e surge "Ver atividade" */
              #trigger:checked ~ .card-container #card1 {
                animation: bgToBlue 0.4s ease-out forwards 5.5s;
              }
              #trigger:checked ~ .card-container #text1,
              #trigger:checked ~ .card-container #icon1 {
                animation: textToBlue 0.4s ease-out forwards 5.5s;
              }
              #trigger:checked ~ .card-container #btnActivity1 {
                animation: fadeInAction 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards 5.5s;
              }
            `}} />

            <input type="checkbox" id="trigger" checked={true} readOnly className="hidden" />

            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="card-container w-full max-w-[540px] bg-white rounded-[28px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col relative select-none"
            >
              <div className="p-6 pb-5 flex items-center justify-between">
                <div className="flex items-center gap-4 text-left">
                  <div className="w-12 h-12 bg-[#0052cc] text-white rounded-full flex items-center justify-center shadow-md">
                    <div id="syncIcon" className="w-5 h-5 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" className="w-5 h-5"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" /></svg>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-[19px] font-bold text-[#1e293b] tracking-tight leading-tight">Fila de Processamento</h2>
                    <p className="text-[14px] font-medium text-slate-400 mt-1">Anexando e validando a sua atividade...</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowProcessingQueue(false)}
                    className="w-8 h-8 bg-[#ebf2ff] hover:bg-[#d0e0ff] text-[#0052cc] rounded-full flex items-center justify-center transition-colors cursor-pointer border-none"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
              </div>

              <div className="px-6 pb-6 bg-[#f8fafc] pt-5 space-y-4">
                {processingType === 'pdf' && (
                  <div id="card1" className="bg-white rounded-2xl px-5 pt-5 pb-4 flex flex-col border border-slate-100 shadow-3xs text-left gap-4 relative transition-all duration-300">
                    <div className="flex items-center justify-between gap-4 h-9 relative">
                      <div className="flex items-center gap-4">
                        <div id="icon1" className="text-slate-400 shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M9 15a1 1 0 1 0 2 0 1 1 0 1 0-2 0Z" /></svg>
                        </div>
                        <span id="text1" className="text-[15px] font-semibold text-slate-500 tracking-tight transition-colors">Processando anexo em formato PDF...</span>
                      </div>

                      <div className="relative w-28 h-full flex items-center justify-end">
                        <button
                          id="btnCancel1"
                          onClick={() => setShowProcessingQueue(false)}
                          className="absolute border border-slate-200 text-[#0052cc] font-bold text-xs px-4 py-1.5 rounded-full opacity-0 pointer-events-none bg-white hover:bg-slate-50 transition-colors z-20 shadow-3xs cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          id="btnActivity1"
                          onClick={() => setShowProcessingQueue(false)}
                          className="absolute bg-[#0052cc] text-white font-bold text-xs px-3 py-1.5 rounded-full opacity-0 pointer-events-none hover:bg-[#0043a4] transition-colors z-10 shadow-sm shrink-0 whitespace-nowrap cursor-pointer border-none"
                        >
                          Ver atividade
                        </button>
                      </div>
                    </div>

                    <div className="w-full px-1">
                      <div className="w-full h-[4px] bg-[#ebf2ff] rounded-full relative overflow-hidden">
                        <div id="progress1" className="absolute left-0 top-0 h-full bg-[#0052cc] w-0 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                )}

                {processingType === 'link' && (
                  <div id="card1" className="bg-white rounded-2xl px-5 pt-5 pb-4 flex flex-col border border-slate-100 shadow-3xs text-left gap-4 relative transition-all duration-300">
                    <div className="flex items-center justify-between gap-4 h-9 relative">
                      <div className="flex items-center gap-4">
                        <div id="icon1" className="text-slate-400 shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="text-slate-500"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                        </div>
                        <span id="text1" className="text-[15px] font-semibold text-slate-500 tracking-tight transition-colors">Processando link de entrega do WhatsApp...</span>
                      </div>

                      <div className="relative w-28 h-full flex items-center justify-end">
                        <button
                          id="btnCancel1"
                          onClick={() => setShowProcessingQueue(false)}
                          className="absolute border border-slate-200 text-[#0052cc] font-bold text-xs px-4 py-1.5 rounded-full opacity-0 pointer-events-none bg-white hover:bg-slate-50 transition-colors z-20 shadow-3xs cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          id="btnActivity1"
                          onClick={() => setShowProcessingQueue(false)}
                          className="absolute bg-[#0052cc] text-white font-bold text-xs px-3 py-1.5 rounded-full opacity-0 pointer-events-none hover:bg-[#0043a4] transition-colors z-10 shadow-sm shrink-0 whitespace-nowrap cursor-pointer border-none"
                        >
                          Ver atividade
                        </button>
                      </div>
                    </div>

                    <div className="w-full px-1">
                      <div className="w-full h-[4px] bg-[#ebf2ff] rounded-full relative overflow-hidden">
                        <div id="progress1" className="absolute left-0 top-0 h-full bg-[#0052cc] w-0 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Panel Modal em Largura Total da Tela */}
      {searchExpanded && (
        <>
          {/* Backdrop que fecha ao clicar fora, com desfoque e z-index apropriado */}
          <div
            className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm z-[9998] animate-search-backdrop"
            onClick={() => { setSearchExpanded(false); setGeneralSearchQuery(''); setTaskSearchQuery(''); }}
          />

          {/* Modal de Pesquisa posicionado no centro, por cima do cabeçalho e ocupando metade da tela */}
          <div
            className="fixed top-0 w-full max-w-[800px] md:w-1/2 min-w-[600px] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-search-panel z-[9999] mt-4"
            style={{
              left: '50%',
              transform: 'translateX(-50%)',
              height: '80vh',
              maxHeight: '800px'
            }}
            data-purpose="search-modal"
          >
            {/* Search Header */}
            <div className="p-6 border-b border-slate-100 flex items-center gap-4">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
              <input
                autoFocus
                type="text"
                value={studentView === 'tasks-list' ? generalSearchQuery : taskSearchQuery}
                onChange={(e) => {
                  if (studentView === 'tasks-list') {
                    setGeneralSearchQuery(e.target.value);
                  } else {
                    setTaskSearchQuery(e.target.value);
                  }
                }}
                placeholder="Pesquisar no ABBA Digital..."
                className="flex-1 text-lg border-none focus:ring-0 text-slate-600 placeholder-slate-400 font-medium outline-none"
              />
              <button
                onClick={() => { setSearchExpanded(false); setGeneralSearchQuery(''); setTaskSearchQuery(''); }}
                className="p-2 text-slate-300 hover:text-slate-500 transition-colors bg-transparent border-none cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-grow overflow-y-auto p-8 custom-scrollbar flex flex-col">
              <h2 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-8">Atividades &amp; Tarefas</h2>

              {/* Carrossel Horizontal de Cards de Atividades */}
              <div className="relative group/carousel w-full mb-6">
                <div className="flex flex-nowrap overflow-x-auto gap-4 no-scrollbar pb-4 scroll-smooth">
                  {(() => {
                    const query = studentView === 'tasks-list' ? generalSearchQuery : taskSearchQuery;

                    const autoAssigned = teacherTasks.filter(task =>
                      task.status === 'active' &&
                      (task.assignedStudentIds?.includes(studentId) || task.assignedStudentIds?.includes(user.name))
                    );

                    const merged = [...acceptedTaskLinks];
                    autoAssigned.forEach(task => {
                      if (!merged.some(link => link.taskId === task.id)) {
                        merged.push({
                          id: `AUTO-${task.id}`,
                          studentName: user.name,
                          taskId: task.id,
                          taskTitle: task.title,
                          createdAt: task.startDate || new Date().toISOString(),
                          link: 'Atribuição direta do professor'
                        });
                      }
                    });

                    const mapped = merged.map(link => {
                      const dbTask = teacherTasks.find(t => t.id === link.taskId);
                      const isTask1 = dbTask?.id === 'task-1';
                      const progress = isTask1 ? progressPercent : 0;
                      const status = progress === 100
                        ? 'completed'
                        : progress > 0
                          ? 'in-progress'
                          : 'pending';

                      return {
                        id: link.id,
                        taskId: link.taskId,
                        title: link.taskTitle,
                        description: dbTask?.description || 'Soletrar as palavras indicadas pelo professor usando as cores correspondentes no ábaco digital.',
                        dueDate: dbTask?.dueDate ? `Entrega: ${new Date(dbTask.dueDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}` : 'Entrega flexível',
                        status: status,
                        progress: progress,
                        grade: null,
                        urgent: dbTask?.priority === 'Alta',
                        supportFiles: dbTask?.supportFiles || [],
                        category: dbTask?.priority === 'Alta' ? 'Urgente' : 'Atividade'
                      };
                    });

                    // Filter out any excluded cards
                    const actualSearchTasks = mapped.filter(t => !excludedSearchTaskIds.includes(t.id));

                    const filteredSearchTasks = actualSearchTasks.filter(task =>
                      task.title.toLowerCase().includes(query.toLowerCase()) ||
                      task.description.toLowerCase().includes(query.toLowerCase())
                    );

                    return (
                      <>
                        {filteredSearchTasks.map((task) => (
                          <article
                            key={task.id}
                            id="ccDxtp"
                            onClick={() => {
                              if (task.taskId === 'task-1') {
                                setStudentView('details');
                              } else {
                                if (onGoToAbacus) {
                                  onGoToAbacus(task.title, task.description);
                                } else {
                                  alert(`Iniciando atividade: ${task.title}`);
                                }
                              }
                              setSearchExpanded(false);
                              setGeneralSearchQuery('');
                              setTaskSearchQuery('');
                            }}
                            className="relative flex-shrink-0 w-[300px] min-h-[220px] bg-white rounded-xl border border-slate-200/90 flex flex-col gap-3 transition-all hover:-translate-y-1 hover:shadow-md cursor-pointer overflow-hidden group select-none text-left"
                          >
                            {/* Cabeçalho ilustrado (figura com imagem base64) exatamente como no ccDxtp */}
                            <header className="relative w-full h-24 overflow-hidden bg-slate-50 border-b border-slate-100 flex items-center justify-center shrink-0">
                              {/* Close/Exclude Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExcludedSearchTaskIds(prev => [...prev, task.id]);
                                }}
                                className="absolute top-2 left-2 w-6 h-6 rounded-full bg-slate-900/60 hover:bg-red-500 hover:text-white text-white flex items-center justify-center shadow transition-colors cursor-pointer border-none z-30"
                                title="Excluir atividade do modal"
                              >
                                <span className="material-symbols-outlined text-[14px]">close</span>
                              </button>

                              <figure className="w-full h-full flex items-center justify-center p-2 opacity-85 group-hover:opacity-100 transition-opacity">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 234" className="w-full h-full max-h-20 object-contain">
                                  <image
                                    style={{ isolation: 'isolate' }}
                                    width="240"
                                    height="234"
                                    href={cardImageBase64}
                                  />
                                </svg>
                              </figure>
                              {/* Brand logo square overlay */}
                              <div className={`absolute top-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs ${getLogoGradient(task.id)}`}>
                                <span className="material-symbols-outlined text-[14px]">
                                  {getLogoIcon(task.id)}
                                </span>
                              </div>
                            </header>

                            {/* Lateral gradient status line */}
                            <div className={`absolute top-0 left-0 w-1 h-full ${getLeftStripe(task.status)}`} />

                            {/* Body Area */}
                            <div className="flex-grow px-3.5 pb-3.5 flex flex-col justify-between gap-2.5">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[8px] font-black tracking-wider uppercase text-slate-400 truncate">
                                    {getCategoryTag(task.id)}
                                  </span>
                                  <span className="text-[8px] font-medium text-slate-400 shrink-0">
                                    {task.dueDate}
                                  </span>
                                </div>
                                <h4 className="text-xs font-bold text-slate-700 leading-snug group-hover:text-primary transition-colors line-clamp-1">
                                  {task.title}
                                </h4>
                                <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                                  {task.description}
                                </p>
                              </div>

                              {/* Footer / Action row */}
                              <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-auto">
                                <div className="flex items-center gap-1.5">
                                  <span className={`w-2 h-2 rounded-full ${task.status === 'completed'
                                    ? 'bg-emerald-500'
                                    : task.status === 'in-progress'
                                      ? 'bg-blue-500'
                                      : 'bg-red-500'
                                    }`} />
                                  <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                                    {task.status === 'completed' ? 'Concluído' : task.status === 'in-progress' ? 'Pendente' : 'Não Iniciado'}
                                  </span>
                                </div>
                                <span className="text-[10px] text-primary font-bold bg-primary/5 px-2 py-1 rounded-md transition-all group-hover:bg-primary group-hover:text-white">
                                  {task.status === 'completed' ? 'Ver Feedback' : 'Fazer'}
                                </span>
                              </div>
                            </div>
                          </article>
                        ))}
                        {filteredSearchTasks.length === 0 && (
                          <div className="py-8 text-center text-slate-400 text-xs font-medium w-full">
                            Nenhuma atividade encontrada para "{query}"
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Navigation Arrow */}
                <button
                  onClick={(e) => {
                    const carousel = e.currentTarget.previousElementSibling;
                    if (carousel) {
                      carousel.scrollBy({ left: 320, behavior: 'smooth' });
                    }
                  }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-10 h-10 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full flex items-center justify-center shadow-xl border border-white/10 transition-colors z-20 cursor-pointer"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>

              {/* Divider */}
              <div className="border-t border-slate-100 my-4 mx-1" />

              {/* Section: Navegação Rápida */}
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 px-1 mb-2">Navegação Rápida</p>

              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => {
                    setSearchExpanded(false);
                    setGeneralSearchQuery('');
                    setTaskSearchQuery('');
                    setShowSpellingLoader(true);
                    setTimeout(() => {
                      setShowSpellingLoader(false);
                      if (onGoToAbacus) {
                        onGoToAbacus();
                      }
                    }, 1500);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer bg-transparent border-none text-left group"
                >
                  <span className="material-symbols-outlined text-slate-400 text-[20px] group-hover:text-primary transition-colors">home</span>
                  <span className="text-sm text-slate-600 font-semibold group-hover:text-slate-800 transition-colors">Início</span>
                </button>

                <button
                  onClick={() => { setStudentView('tasks-list'); setSearchExpanded(false); setGeneralSearchQuery(''); setTaskSearchQuery(''); }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer bg-transparent border-none text-left group"
                >
                  <span className="material-symbols-outlined text-slate-400 text-[20px] group-hover:text-primary transition-colors">assignment</span>
                  <span className="text-sm text-slate-600 font-semibold group-hover:text-slate-800 transition-colors">Tarefas</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* CUBE LOADER OVERLAY */}
      <AnimatePresence>
        {showSpellingLoader && (
          <motion.div
            key="spelling-loading-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/95 backdrop-blur-xl z-[99999] flex flex-col items-center justify-center select-none"
          >
            <div className="flex flex-col items-center justify-center">
              <div className="scale-110">
                <Loader />
              </div>
              <p className="text-sm font-bold text-slate-500 mt-8 font-sans tracking-wide animate-pulse">
                Carregando o Ábaco...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WHATSAPP MODAL */}
      <AnimatePresence>
        {showWhatsappModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowWhatsappModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white text-slate-900 p-8 rounded-3xl shadow-2xl relative max-w-lg w-full max-h-[95vh] m-4 transition-colors duration-300 border border-slate-200 overflow-y-auto"
            >
              <AnimatePresence>
                {isWhatsappSending && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-md"
                  >
                    <div className="mb-12 scale-75">
                      <Loader />
                    </div>
                    <span className="text-sm font-semibold tracking-wide animate-pulse text-gray-900">Encaminhando para o WhatsApp...</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Close Button */}
              <button
                onClick={() => setShowWhatsappModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer border-none bg-transparent"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>

              <div className="flex flex-wrap gap-5 items-center w-full mb-8">
                <div className="flex flex-wrap flex-1 shrink gap-5 items-center">
                  <div className="flex relative shrink-0 justify-center items-center h-[70px] rounded-[16px] overflow-hidden w-[70px] bg-gray-100">
                    <img
                      src="src/assets/Imagens/profdecioperfil.avif"
                      alt="Prof. José Décio de Alencar"
                      className="w-full h-full object-cover object-center"
                    />
                  </div>
                  <div className="flex flex-col flex-1 shrink justify-center">
                    <h2 className="text-xl font-bold font-inter tracking-[0] leading-[150%] mb-1">
                      Mensagem para o Professor
                    </h2>
                    <div className="flex flex-col">
                      <div className="text-base font-bold text-gray-800">Prof. José Décio de Alencar</div>
                      <div className="text-xs text-gray-500">
                        Professor e Autor, Projeto Brasil Bilíngue
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setIsWhatsappSending(true);
                  setTimeout(() => {
                    setIsWhatsappSending(false);
                    setShowWhatsappModal(false);
                    const contactText = `*Nome:* ${whatsappName}\n*Mensagem enviada do Abba Digital:* ${whatsappMessage}`;
                    window.open(`https://wa.me/5547999034403?text=${encodeURIComponent(contactText)}`, '_blank');
                  }, 1200);
                }}
              >
                <div className="space-y-6 mb-8">
                  <div className="relative">
                    <input
                      type="text"
                      id="wa_student_name"
                      value={whatsappName}
                      onChange={(e) => setWhatsappName(e.target.value)}
                      required
                      className="block w-full text-sm h-[50px] px-4 bg-transparent rounded-[8px] border border-blue-200 text-slate-900 focus:outline-none focus:ring-1 focus:border-[#005bb3] focus:ring-[#005bb3] transition-colors placeholder-transparent"
                      placeholder="Seu Nome"
                    />
                    <label htmlFor="wa_student_name" className="absolute text-[14px] leading-[150%] top-2 z-10 origin-[0] px-2 left-2 bg-white text-gray-500 transition-all transform scale-75 -translate-y-[1.2rem]">
                      Nome *
                    </label>
                  </div>

                  <div className="relative">
                    <textarea
                      id="wa_student_message"
                      value={whatsappMessage}
                      onChange={(e) => setWhatsappMessage(e.target.value)}
                      required
                      className="block w-full min-h-[120px] max-h-[200px] px-4 pt-6 pb-6 bg-transparent rounded-[8px] border border-blue-200 text-slate-900 focus:outline-none focus:ring-1 focus:border-[#005bb3] focus:ring-[#005bb3] resize-y transition-colors placeholder-transparent"
                      placeholder="Mensagem"
                    />
                    <label htmlFor="wa_student_message" className="absolute text-[14px] leading-[150%] top-2 z-10 origin-[0] px-2 left-2 bg-white text-gray-500 transition-all transform scale-75 -translate-y-[1.2rem]">
                      Mensagem *
                    </label>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row-reverse gap-4">
                  <button
                    className="w-full sm:w-fit rounded-lg text-sm px-6 py-2 h-[50px] font-semibold text-white bg-[#25D366] hover:bg-[#1ebd5a] transition-all shadow-md active:scale-95 border-none cursor-pointer flex items-center justify-center gap-1.5"
                    type="submit"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.338 5.395.002 11.95.002c3.176.002 6.165 1.241 8.413 3.49 2.247 2.246 3.486 5.234 3.486 8.41-.003 6.557-5.338 11.892-11.893 11.892-2.096-.002-4.14-.549-5.945-1.59L0 24zm6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413A11.815 11.815 0 0 0 12.05.001C5.495.001.16 5.336.157 11.893c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654zm11.115-8.083c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
                    </svg>
                    <span>Enviar no WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    className="w-full sm:w-fit rounded-lg text-sm px-6 py-2 h-[50px] font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all cursor-pointer bg-white active:scale-95"
                    onClick={() => setShowWhatsappModal(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ALREADY ASSIGNED DUPLICATION MODAL */}
      <AnimatePresence>
        {showAlreadyAssignedModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAlreadyAssignedModal(false)}
              className="fixed inset-0 bg-slate-900/60"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-200 shadow-2xl relative z-10 flex flex-col items-center text-center gap-6"
            >
              <div className="w-16 h-16 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <span className="material-symbols-outlined text-[32px] font-bold">assignment_turned_in</span>
              </div>
              <div>
                <h3 className="font-extrabold text-xl text-slate-800 tracking-tight mb-2">Atividade já atribuída!</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Esta tarefa já foi enviada a você pelo seu professor e está disponível na sua lista de atividades recebidas. Não é necessário adicioná-la novamente.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAlreadyAssignedModal(false)}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold rounded-xl transition-all shadow-md active:scale-98 cursor-pointer border-none"
              >
                Entendido
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AVATAR SELECTOR MODAL */}
      <AnimatePresence>
        {showAvatarSelector && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAvatarSelector(false)}
              className="fixed inset-0 bg-slate-900/60"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 shadow-2xl relative z-10 flex flex-col gap-6"
            >
              <div className="flex justify-between items-center select-none">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <span className="material-symbols-outlined">account_circle</span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xl text-slate-800 tracking-tight">Escolha seu Avatar</h3>
                    <p className="text-xs text-slate-400 mt-[2px]">Selecione uma imagem premium para o seu perfil</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAvatarSelector(false)}
                  className="p-2 hover:bg-slate-100 rounded-full border-none bg-transparent cursor-pointer flex items-center justify-center text-slate-400"
                  title="Fechar"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Presets Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-4 py-2">
                {PRESET_AVATARS.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectAvatar(url)}
                    className={`w-14 h-14 rounded-full overflow-hidden border-3 hover:scale-105 hover:shadow-md transition-all cursor-pointer p-0 bg-transparent flex items-center justify-center ${
                      user.img === url ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-transparent'
                    }`}
                  >
                    <img src={url} alt={`Preset Avatar ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>

              {/* Custom URL Field */}
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider pl-1">URL de Imagem Personalizada (Leve)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customAvatarUrl}
                    onChange={(e) => setCustomAvatarUrl(e.target.value)}
                    placeholder="https://exemplo.com/sua-foto.jpg..."
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none text-sm placeholder-slate-400 transition-all text-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customAvatarUrl.trim()) {
                        handleSelectAvatar(customAvatarUrl.trim());
                      } else {
                        alert('Por favor, insira uma URL de imagem válida.');
                      }
                    }}
                    className="px-5 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold rounded-xl transition-all shadow-md active:scale-98 cursor-pointer border-none text-sm whitespace-nowrap"
                  >
                    Aplicar URL
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal pl-1">Insira a URL de uma imagem pública leve (PNG, JPG, SVG ou WebP) para economizar recursos.</p>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
