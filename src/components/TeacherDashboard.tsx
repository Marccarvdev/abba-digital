import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, TaskItem, StudentSubmission, AccessCode, SavedWord } from '../types';
import abbaLogo from '../assets/logo abba.svg';
import { supabase, logUserAction } from '../supabaseClient';
import { SafeAvatar } from './CustomIcons';
import { cardImageBase64 } from '../base64Data/cardBase64';

const detectGenderFromName = (fullName: string): 'F' | 'M' => {
  const firstName = fullName.trim().split(/\s+/)[0].toLowerCase();
  if (!firstName) return 'M';
  
  // Common female names ending in consonants or 'e'
  const femaleNames = [
    'beatriz', 'alice', 'yasmin', 'raquel', 'ruth', 'rut', 'ester', 'esther', 
    'isabel', 'iris', 'miriam', 'suelen', 'ellen', 'solange', 'gisele', 
    'elisabeth', 'elisabete', 'rose', 'irene', 'cleide', 'neide', 'lourdes', 
    'ivone', 'viviane', 'ariane', 'iane', 'daiane'
  ];
  
  // Common male names ending in 'a' in Portuguese
  const maleNamesEndingInA = ['luca', 'lucas', 'joshua', 'mika', 'sasha', 'buda', 'senna'];

  if (femaleNames.includes(firstName)) return 'F';
  if (maleNamesEndingInA.includes(firstName)) return 'M';
  
  // Standard rule: ends in 'a' in Portuguese is female
  if (firstName.endsWith('a')) return 'F';
  
  return 'M';
};

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

interface TeacherDashboardProps {
  user: User;
  onLogout: () => void;
  onLaunchReviewMode: (submission: StudentSubmission) => void;
  onGoToLanding?: () => void;
  onDraftCreated?: (task: TaskItem) => void;
}

// Initial Mock Data
const INITIAL_STUDENTS: any[] = [];

const INITIAL_TASKS: TaskItem[] = [];

const INITIAL_SUBMISSIONS: StudentSubmission[] = [];

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ 
  user, 
  onLogout, 
  onLaunchReviewMode, 
  onGoToLanding,
  onDraftCreated
}) => {
  const teacherName = 'José Décio de Alencar';
  const teacherEmail = 'inglesdecio@gmail.com';
  const [activeTab, setActiveTab] = useState<'home' | 'tasks' | 'students' | 'access'>('home');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsSounds, setSettingsSounds] = useState(() => {
    return localStorage.getItem('abba_settings_sounds') !== 'false';
  });
  const [settingsLanguage, setSettingsLanguage] = useState(() => {
    return localStorage.getItem('abba_settings_language') || 'pt';
  });
  const [settingsContrast, setSettingsContrast] = useState(() => {
    return localStorage.getItem('abba_settings_contrast') === 'true';
  });
  
  // Custom teacher preferences
  const [settingsTheme, setSettingsTheme] = useState(() => {
    return localStorage.getItem('abba_settings_theme') || 'light';
  });
  const [settingsSandbox, setSettingsSandbox] = useState(() => {
    return localStorage.getItem('abba_settings_sandbox') !== 'false';
  });
  const [settingsCorrection, setSettingsCorrection] = useState(() => {
    return localStorage.getItem('abba_settings_correction') || 'reviewed';
  });
  const [settingsDuration, setSettingsDuration] = useState(() => {
    return localStorage.getItem('abba_settings_duration') || '7d';
  });

  const handleSaveSettings = () => {
    localStorage.setItem('abba_settings_sounds', String(settingsSounds));
    localStorage.setItem('abba_settings_language', settingsLanguage);
    localStorage.setItem('abba_settings_contrast', String(settingsContrast));
    localStorage.setItem('abba_settings_theme', settingsTheme);
    localStorage.setItem('abba_settings_sandbox', String(settingsSandbox));
    localStorage.setItem('abba_settings_correction', settingsCorrection);
    localStorage.setItem('abba_settings_duration', settingsDuration);
    
    // Toggle theme globally on HTML/body
    if (settingsTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark-theme-active');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark-theme-active');
    }
    
    setShowSettingsModal(false);
  };

  // Test simulation handler for Teacher profile notifications
  const handleTestTeacherNotification = () => {
    setShowSettingsModal(false);
    
    setTimeout(() => {
      const newMockSubmission: StudentSubmission = {
        id: `mock-sub-${Date.now()}`,
        studentName: 'Gabriel Oliveira',
        studentEmail: 'gabriel@gmail.com',
        taskTitle: 'Exercício de Numerais Multilingue',
        submittedAt: new Date().toISOString(),
        spelledWords: [
          {
            word: 'DOIS',
            letters: [
              { id: 'ml1', letter: 'D', originCubeId: 'cube-d', color: '#009246' },
              { id: 'ml2', letter: 'O', originCubeId: 'cube-o', color: '#009246' },
              { id: 'ml3', letter: 'I', originCubeId: 'cube-i', color: '#009246' },
              { id: 'ml4', letter: 'S', originCubeId: 'cube-s', color: '#009246' }
            ],
            themeColor: '#009246'
          }
        ]
      };
      
      setSubmissions(prev => [newMockSubmission, ...prev]);
      
      alert('🔔 Simulação: O aluno Gabriel Oliveira acabou de entregar o "Exercício de Numerais Multilingue"! A notificação visual e sonora foi disparada com sucesso no painel do professor.');
    }, 3000);
  };

  // Test simulation handler for Student profile notifications
  const handleTestStudentNotificationGlobal = () => {
    setShowSettingsModal(false);
    
    setTimeout(() => {
      try {
        const currentTasks = JSON.parse(localStorage.getItem('abba_teacher_tasks') || '[]');
        const newMockTask = {
          id: `mock-task-${Date.now()}`,
          title: 'Desafio Bilíngue: Frutas e Cores 🍎',
          description: 'Pratique a soletração dos numerais e das novas palavras no ábaco digital. Utilize fios coloridos recomendados para obter pontuação máxima.',
          startDate: new Date().toISOString(),
          dueDate: '2026-06-15',
          status: 'active',
          assignedStudentIds: ['Ana Beatriz Silva', 'Carlos andré', 'Gabriel Oliveira']
        };
        
        const merged = [newMockTask, ...currentTasks];
        localStorage.setItem('abba_teacher_tasks', JSON.stringify(merged));
        setTasks(merged);
        
        alert('🔔 Simulação: Uma nova tarefa ("Desafio Bilíngue: Frutas e Cores") foi atribuída! Os alunos receberão o alerta sonoro e visual instantaneamente ao abrirem seus painéis.');
      } catch (err) {
        console.error('Erro na simulação do aluno:', err);
      }
    }, 3000);
  };

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [students, setStudents] = useState<any[]>(() => {
    const local = localStorage.getItem('abba_students_list');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((s: any) => 
            s && 
            s.id && 
            !(s.id.startsWith('st-') && s.id !== 'student-fixed-id' && s.loginMethod !== 'login' && s.loginMethod !== 'code' && s.loginMethod !== 'link') &&
            !/^st-\d+$/.test(s.id) && 
            s.id !== 'student-fixed-id' &&
            s.name !== 'Alana' &&
            s.name !== 'Beatriz' &&
            s.name !== 'Carlos' &&
            s.name !== 'Diogo' &&
            s.name !== 'Eduarda' &&
            s.name !== 'Felipe' &&
            s.name !== 'Giovanna'
          );
          if (filtered.length !== parsed.length) {
            localStorage.setItem('abba_students_list', JSON.stringify(filtered));
          }
          return filtered;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_STUDENTS;
  });

  const [gridSearchQuery, setGridSearchQuery] = useState('');
  const [gridFilterType, setGridFilterType] = useState<'all' | 'code' | 'link' | 'login'>('all');
  const [isGridFilterOpen, setIsGridFilterOpen] = useState(false);

  useEffect(() => {
    // Proactive migration already handled synchronously on state init, kept for safety
    const listStr = localStorage.getItem('abba_students_list');
    if (listStr) {
      try {
        const list = JSON.parse(listStr);
        const filtered = list.filter((s: any) => 
          s && 
          s.id && 
          !(s.id.startsWith('st-') && s.id !== 'student-fixed-id' && s.loginMethod !== 'login' && s.loginMethod !== 'code' && s.loginMethod !== 'link') &&
          !/^st-\d+$/.test(s.id) && 
          s.id !== 'student-fixed-id' &&
          s.name !== 'Alana' &&
          s.name !== 'Beatriz' &&
          s.name !== 'Carlos' &&
          s.name !== 'Diogo' &&
          s.name !== 'Eduarda' &&
          s.name !== 'Felipe' &&
          s.name !== 'Giovanna'
        );
        if (list.length !== filtered.length) {
          localStorage.setItem('abba_students_list', JSON.stringify(filtered));
          setStudents(filtered);
        }
      } catch (e) {
        console.error(e);
      }
    }

    const logStr = localStorage.getItem('abba_students_logged_by_code');
    if (logStr) {
      try {
        const log = JSON.parse(logStr);
        const filteredLog = log.filter((s: any) => 
          s && 
          s.id && 
          !/^st-\d+$/.test(s.id) && 
          s.id !== 'student-fixed-id' &&
          s.studentName !== 'Alana' &&
          s.studentName !== 'Beatriz' &&
          s.studentName !== 'Carlos' &&
          s.studentName !== 'Diogo' &&
          s.studentName !== 'Eduarda' &&
          s.studentName !== 'Felipe' &&
          s.studentName !== 'Giovanna'
        );
        if (log.length !== filteredLog.length) {
          localStorage.setItem('abba_students_logged_by_code', JSON.stringify(filteredLog));
          setAccessedStudents(filteredLog);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('abba_students_list', JSON.stringify(students));
    
    // Background sync of all students to Supabase
    const syncAll = async () => {
      for (const s of students) {
        await syncSingleStudentToSupabase(s);
      }
    };
    syncAll();
  }, [students]);
  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    const local = localStorage.getItem('abba_teacher_tasks');
    const loaded: TaskItem[] = local ? JSON.parse(local) : INITIAL_TASKS;
    return loaded.filter(t => !['task-1', 'task-2', 'task-3', 'task-4', 'task-5'].includes(t.id));
  });
  
  const [submissions, setSubmissions] = useState<StudentSubmission[]>(() => {
    const local = localStorage.getItem('abba_student_submissions');
    const loaded: StudentSubmission[] = local ? JSON.parse(local) : INITIAL_SUBMISSIONS;
    return loaded.filter(s => !['sub-1', 'sub-2'].includes(s.id));
  });

  // Sound effects listener for newly received submissions
  const prevUnreadSubCount = useRef(submissions.length);
  const unreadSubCount = submissions.length;
  useEffect(() => {
    if (unreadSubCount > prevUnreadSubCount.current) {
      if ((window as any).playNotificationSound) {
        (window as any).playNotificationSound();
      }
    }
    prevUnreadSubCount.current = unreadSubCount;
  }, [unreadSubCount]);

  // Access Code Generation States
  const [studentNameInput, setStudentNameInput] = useState('');
  const [duration, setDuration] = useState('1h'); // 1h, 4h, 1d, 1w, custom
  const [customExpiryDate, setCustomExpiryDate] = useState('2026-12-31');
  const [customExpiryTime, setCustomExpiryTime] = useState('23:59');
  const [generatedCode, setGeneratedCode] = useState('');
  const [generatedBase64, setGeneratedBase64] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [generatedStudentName, setGeneratedStudentName] = useState('');
  
  const [activeCodes, setActiveCodes] = useState<AccessCode[]>(() => {
    const local = localStorage.getItem('abba_active_codes');
    return local ? JSON.parse(local) : [];
  });

  // Duplicate student active code prevention states
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [duplicateName, setDuplicateName] = useState('');
  const [duplicateActiveCode, setDuplicateActiveCode] = useState<AccessCode | null>(null);
  const [duplicateSelectedDuration, setDuplicateSelectedDuration] = useState('1h');
  const [duplicateCustomExpiryDate, setDuplicateCustomExpiryDate] = useState('2026-12-31');
  const [duplicateCustomExpiryTime, setDuplicateCustomExpiryTime] = useState('23:59');
  const [duplicateStep, setDuplicateStep] = useState<'question' | 'edit_duration'>('question');

  // Task link generation and sharing states
  const [generatedStudentLinks, setGeneratedStudentLinks] = useState<Record<string, string>>({});
  const [dbTaskLinks, setDbTaskLinks] = useState<{ id: string; studentName: string; link: string; taskId: string }[]>(() => {
    const local = localStorage.getItem('abba_generated_task_links');
    return local ? JSON.parse(local) : [];
  });

  useEffect(() => {
    localStorage.setItem('abba_generated_task_links', JSON.stringify(dbTaskLinks));
  }, [dbTaskLinks]);

  // States for Chat WhatsApp integration (Teacher view)
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

  useEffect(() => {
    if (isChatModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isChatModalOpen]);

  // Share task panel states (mini-modal below Confirmar Seleção)
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [shareTaskLinks, setShareTaskLinks] = useState<Record<string, string>>({}); // studentId -> link
  const [copiedShareId, setCopiedShareId] = useState<string | null>(null);

  const handleGenerateStudentLink = async (studentId: string, studentName: string, taskId: string, taskTitle: string) => {
    const salt = Math.random().toString(36).substring(2, 9).toUpperCase();
    const payload = {
      id: `LINK-${studentId}-${salt}`,
      studentName,
      taskId,
      taskTitle,
      createdAt: new Date().toISOString()
    };
    const code = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    const link = `${window.location.origin}?code=${code}`;

    const newLinkItem = { id: payload.id, studentName, link, taskId };

    // Update state and LocalStorage
    setDbTaskLinks(prev => [newLinkItem, ...prev]);

    setGeneratedStudentLinks(prev => ({
      ...prev,
      [studentId]: link
    }));

    // Database Sinking & Synchronization Integration (Supabase client check)
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { error } = await supabase
          .from('teacher_generated_links')
          .insert([
            {
              link_id: payload.id,
              student_name: studentName,
              task_id: taskId,
              task_title: taskTitle,
              link_url: link,
              teacher_id: session.user.id,
              created_at: payload.createdAt
            }
          ]);
        
        if (!error) {
          console.log('⚡ Sincronização em tempo real concluída com Supabase!');
        } else {
          console.warn('Conexão estabelecida, mas erro ao sincronizar tabela:', error);
        }
      }
    } catch (err) {
      console.log('💾 Backup Local Ativado: Dados salvos localmente e programados para envio automático quando o banco Supabase estiver disponível.');
    }

    alert(`✅ Código e link de acesso gerados com sucesso para ${studentName}!`);
  };

  const syncTeacherLinks = async () => {
    try {
      const unsynced = JSON.parse(localStorage.getItem('abba_unsynced_teacher_links') || '[]');
      if (unsynced.length === 0) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const remaining: any[] = [];
      for (const item of unsynced) {
        const { error } = await supabase
          .from('teacher_generated_links')
          .insert([
            {
              link_id: item.id,
              student_name: item.studentName,
              task_id: item.taskId,
              task_title: item.taskTitle || 'Exercício de Numerais Multilingue',
              link_url: item.link,
              teacher_id: session.user.id,
              created_at: item.createdAt || new Date().toISOString()
            }
          ]);
        if (error) {
          console.warn('Erro ao sincronizar link:', error);
          remaining.push(item);
        }
      }
      localStorage.setItem('abba_unsynced_teacher_links', JSON.stringify(remaining));
      if (remaining.length === 0) {
        console.log('⚡ Todos os links do professor pendentes foram sincronizados com o Supabase!');
      }
    } catch (err) {
      console.warn('Erro na sincronização de links com o Supabase:', err);
    }
  };

  const syncSingleTaskToSupabase = async (task: TaskItem) => {
    try {
      const finalNote = serializeTeacherNoteAndFiles(task.teacherNote || '', task.supportFiles || []);
      const dbPayload = {
        id: task.id,
        title: task.title,
        description: task.description,
        due_date: task.dueDate,
        status: task.status,
        target_words: JSON.stringify(task.targetWords),
        priority: task.priority || 'Alta',
        assigned_student_ids: JSON.stringify(task.assignedStudentIds || []),
        start_date: task.startDate || '',
        teacher_note: finalNote,
        submissions_count: task.submissionsCount || 0
      };
      
      const { error } = await supabase
        .from('tasks')
        .upsert([dbPayload], { onConflict: 'id' });
        
      if (!error) {
        console.log(`⚡ Tarefa "${task.title}" sincronizada com o Supabase!`);
      } else {
        console.warn('Erro ao salvar tarefa no Supabase:', error);
      }
    } catch (e) {
      console.warn('Falha na conexão com o Supabase ao salvar tarefa:', e);
    }
  };

  const syncSingleStudentToSupabase = async (student: any) => {
    try {
      const dbPayload = {
        id: student.id,
        name: student.name,
        class: student.class,
        img: student.img,
        progress: student.progress,
        matricula: student.matricula,
        gender: student.gender,
        email: student.email,
        last_access_at: student.lastAccessAt || null,
        login_method: student.loginMethod
      };
      
      const { error } = await supabase
        .from('students')
        .upsert([dbPayload], { onConflict: 'id' });
        
      if (!error) {
        console.log(`⚡ Estudante "${student.name}" sincronizado com o Supabase!`);
      } else {
        console.warn('Erro ao salvar estudante no Supabase:', error);
      }
    } catch (e) {
      console.warn('Falha na conexão com o Supabase ao salvar estudante:', e);
    }
  };

  const fetchSupabaseData = async () => {
    try {
      // 1. Sincronizar tarefas
      const { data: dbTasks, error: tasksErr } = await supabase
        .from('tasks')
        .select('*');
      if (dbTasks && !tasksErr) {
        const mappedTasks: TaskItem[] = dbTasks.map((t: any) => {
          const rawNote = t.teacher_note || t.teacherNote || '';
          const parsed = parseTeacherNoteAndFiles(rawNote);
          return {
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
            teacherNote: parsed.note,
            supportFiles: parsed.files,
            submissionsCount: t.submissions_count || t.submissionsCount || 0
          };
        });

        setTasks(prev => {
          const merged = [...prev];
          // Filtrar tarefas de mock temporárias para evitar alternâncias no contador
          const cleanMappedTasks = mappedTasks.filter(t => !['task-1', 'task-2', 'task-3', 'task-4', 'task-5'].includes(t.id));
          
          cleanMappedTasks.forEach(mt => {
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

      // 2. Sincronizar submissões
      const { data: dbSubs, error: subsErr } = await supabase
        .from('student_submissions')
        .select('*')
        .order('submitted_at', { ascending: false });
      if (dbSubs && !subsErr) {
        const mappedSubs: StudentSubmission[] = dbSubs.map((s: any) => ({
          id: s.id.toString(),
          studentName: s.student_name,
          studentEmail: s.student_email,
          taskTitle: s.task_title,
          submittedAt: s.submitted_at,
          spelledWords: typeof s.spelled_words === 'string'
            ? JSON.parse(s.spelled_words)
            : s.spelled_words || [],
          taskFiles: typeof s.task_files === 'string'
            ? JSON.parse(s.task_files)
            : s.task_files || []
        }));
        setSubmissions(prev => {
          const merged = [...prev];
          mappedSubs.forEach(ms => {
            const index = merged.findIndex(x => x.id === ms.id || (x.studentName === ms.studentName && x.taskTitle === ms.taskTitle));
            if (index !== -1) {
              merged[index] = { ...merged[index], ...ms, reviewed: merged[index].reviewed || ms.reviewed || false };
            } else {
              merged.unshift(ms);
            }
          });
          localStorage.setItem('abba_student_submissions', JSON.stringify(merged));
          return merged;
        });
      }

      // 3. Sincronizar links gerados
      const { data: dbLinks, error: linksErr } = await supabase
        .from('teacher_generated_links')
        .select('*')
        .order('created_at', { ascending: false });
      if (dbLinks && !linksErr) {
        const mappedLinks = dbLinks.map((l: any) => ({
          id: l.link_id,
          studentName: l.student_name,
          taskId: l.task_id,
          link: l.link_url
        }));
        setDbTaskLinks(prev => {
          const merged = [...prev];
          mappedLinks.forEach(ml => {
            if (!merged.some(x => x.id === ml.id)) {
              merged.unshift(ml);
            }
          });
          localStorage.setItem('abba_generated_task_links', JSON.stringify(merged));
          return merged;
        });
      }

      // 4. Sincronizar alunos da tabela 'students' ou fallback para 'student_logins'
      try {
        // Delete mock students from remote db to make it clean!
        await supabase
          .from('students')
          .delete()
          .in('id', ['student-fixed-id', 'st-1', 'st-2', 'st-3', 'st-4', 'st-5', 'st-6', 'st-7', 'st-8', 'st-9', 'st-10', 'st-11', 'st-12', 'st-13', 'st-14', 'st-15']);
        await supabase
          .from('students')
          .delete()
          .in('name', ['Alana', 'Beatriz', 'Carlos', 'Diogo', 'Eduarda', 'Felipe', 'Giovanna']);

        const { data: dbStudents, error: studentsErr } = await supabase
          .from('students')
          .select('*');

        if (dbStudents && !studentsErr) {
          // Identify and delete any ghost students (with temporary st- ID that haven't registered login method yet)
          const ghostIds = dbStudents
            .filter((s: any) => 
              s && 
              s.id && 
              s.id.startsWith('st-') && 
              s.id !== 'student-fixed-id' &&
              s.login_method !== 'login' && 
              s.login_method !== 'code' && 
              s.login_method !== 'link'
            )
            .map((s: any) => s.id);

          if (ghostIds.length > 0) {
            console.log('🗑️ Deletando alunos fantasmas do Supabase:', ghostIds);
            try {
              await supabase
                .from('students')
                .delete()
                .in('id', ghostIds);
            } catch (delErr) {
              console.warn('Erro ao deletar fantasmas no banco:', delErr);
            }
          }

          const mapped = dbStudents
            .filter((s: any) => 
              s && 
              s.id && 
              !ghostIds.includes(s.id) &&
              !/^st-\d+$/.test(s.id) && 
              s.id !== 'student-fixed-id' &&
              s.name !== 'Alana' &&
              s.name !== 'Beatriz' &&
              s.name !== 'Carlos' &&
              s.name !== 'Diogo' &&
              s.name !== 'Eduarda' &&
              s.name !== 'Felipe' &&
              s.name !== 'Giovanna'
            )
            .map(s => ({
              id: s.id,
              name: s.name,
              class: s.class || 'Turma A - 3º Ano',
              img: s.img || `/padrao/foto-do-perfil.avif`,
              progress: s.progress || 0,
              matricula: s.matricula || `2026${Math.floor(1000 + Math.random() * 9000)}`,
              gender: s.gender || 'M',
              email: s.email || 'estudante@abba.com',
              lastAccessAt: s.last_access_at,
              loginMethod: s.login_method
            }));
          setStudents(mapped);
          localStorage.setItem('abba_students_list', JSON.stringify(mapped));
        } else {
          // Fallback to student logins
          const { data: dbLogins, error: loginsErr } = await supabase
            .from('student_logins')
            .select('*')
            .order('logged_at', { ascending: false });
          if (dbLogins && !loginsErr) {
            setStudents(prev => {
              const updated = prev.filter((s: any) => 
                s && 
                s.id && 
                !(s.id.startsWith('st-') && s.id !== 'student-fixed-id' && s.loginMethod !== 'login' && s.loginMethod !== 'code' && s.loginMethod !== 'link') &&
                !/^st-\d+$/.test(s.id) && 
                s.id !== 'student-fixed-id' &&
                s.name !== 'Alana' &&
                s.name !== 'Beatriz' &&
                s.name !== 'Carlos' &&
                s.name !== 'Diogo' &&
                s.name !== 'Eduarda' &&
                s.name !== 'Felipe' &&
                s.name !== 'Giovanna'
              );
              dbLogins.forEach((login: any) => {
                // Skip mock logins
                if (
                  !login ||
                  login.student_name === 'Alana' ||
                  login.student_name === 'Beatriz' ||
                  login.student_name === 'Carlos' ||
                  login.student_name === 'Diogo' ||
                  login.student_name === 'Eduarda' ||
                  login.student_name === 'Felipe' ||
                  login.student_name === 'Giovanna' ||
                  /^st-\d+$/.test(login.id) ||
                  login.id === 'student-fixed-id'
                ) {
                  return;
                }
                const index = updated.findIndex(s => s.name.toLowerCase() === login.student_name.toLowerCase());
                if (index !== -1) {
                  updated[index].email = login.student_email;
                  updated[index].loginMethod = login.login_method;
                  updated[index].lastAccessAt = login.logged_at;
                } else {
                  updated.push({
                    id: 'st-' + login.id,
                    name: login.student_name,
                    class: "Turma A - 3º Ano",
                    img: `/padrao/foto-do-perfil.avif`,
                    progress: 0,
                    matricula: `2026${Math.floor(1000 + Math.random() * 9000)}`,
                    gender: 'M',
                    email: login.student_email,
                    lastAccessAt: login.logged_at,
                    loginMethod: login.login_method
                  });
                }
              });
              localStorage.setItem('abba_students_list', JSON.stringify(updated));
              return updated;
            });
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar tabela students, usando logins de backup:', err);
      }
    } catch (err) {
      console.warn('Erro ao carregar dados do Supabase:', err);
    }
  };

  const syncTeacherDeletions = async () => {
    try {
      // 1. Sincronizar exclusões de tarefas pendentes
      const pendingTaskDeletions = JSON.parse(localStorage.getItem('abba_pending_task_deletions') || '[]');
      if (pendingTaskDeletions.length > 0) {
        const remaining: string[] = [];
        for (const taskId of pendingTaskDeletions) {
          const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', taskId);
          if (error) {
            console.warn('Erro ao sincronizar exclusão de tarefa offline:', error);
            remaining.push(taskId);
          } else {
            console.log(`🗑️ Sincronização de exclusão da tarefa ${taskId} concluída!`);
          }
        }
        localStorage.setItem('abba_pending_task_deletions', JSON.stringify(remaining));
      }

      // 2. Sincronizar exclusões de alunos pendentes
      const pendingStudentDeletions = JSON.parse(localStorage.getItem('abba_pending_student_deletions') || '[]');
      if (pendingStudentDeletions.length > 0) {
        const remaining: string[] = [];
        for (const studentId of pendingStudentDeletions) {
          const { error } = await supabase
            .from('students')
            .delete()
            .eq('id', studentId);
          if (error) {
            console.warn('Erro ao sincronizar exclusão de aluno offline:', error);
            remaining.push(studentId);
          } else {
            console.log(`🗑️ Sincronização de exclusão do aluno ${studentId} concluída!`);
          }
        }
        localStorage.setItem('abba_pending_student_deletions', JSON.stringify(remaining));
      }
    } catch (err) {
      console.warn('Erro ao processar fila de exclusões pendentes do professor:', err);
    }
  };

  const runAllTeacherSync = () => {
    syncTeacherLinks();
    syncTeacherDeletions();
    fetchSupabaseData();
  };

  // Sync effect
  useEffect(() => {
    runAllTeacherSync();
    window.addEventListener('online', runAllTeacherSync);
    const interval = setInterval(runAllTeacherSync, 15000);
    return () => {
      window.removeEventListener('online', runAllTeacherSync);
      clearInterval(interval);
    };
  }, []);

  const modalBottomRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll effect
  useEffect(() => {
    if (showSharePanel && modalBottomRef.current) {
      setTimeout(() => {
        modalBottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [showSharePanel, shareTaskLinks]);

  // State for the beautiful visual task assignment success overlay
  const [assignedModalInfo, setAssignedModalInfo] = useState<{
    taskTitle: string;
    students: {
      id: string;
      name: string;
      link?: string;
      code?: string;
    }[];
  } | null>(null);

  // State to track copied status inside the success overlay
  const [copiedStudentItem, setCopiedStudentItem] = useState<{ id: string; type: 'link' | 'code' } | null>(null);

  // Track premium copy states for the "Compartilhar atividade" modal
  const [copiedButtons, setCopiedButtons] = useState<Record<string, Record<'code' | 'link' | 'txt', boolean>>>({});
  const [confirmCopyAgain, setConfirmCopyAgain] = useState<{ sid: string; type: 'code' | 'link' | 'txt' } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const resolveStudentTaskAccess = (studentName: string, studentId: string, taskId: string, taskTitle: string) => {
    // 1. Look for an active code for this student
    let foundCode = activeCodes.find(
      c => c.studentName.toLowerCase() === studentName.toLowerCase() && c.expiresAt > Date.now() && c.status === 'active'
    );

    let finalCode = foundCode?.code;
    let codeId = foundCode?.id;
    let expiresAt = foundCode?.expiresAt || (Date.now() + 365 * 24 * 60 * 60 * 1000);

    if (!finalCode) {
      expiresAt = Date.now() + 365 * 24 * 60 * 60 * 1000; // default 1 year
      codeId = 'st-' + Math.random().toString(36).substring(2, 9).toUpperCase();
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let codeVal = '';
      for (let i = 0; i < 6; i++) {
        codeVal += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      finalCode = codeVal;

      setActiveCodes(prev => [{
        id: codeId!,
        code: codeVal,
        studentName,
        expiresAt,
        durationLabel: 'Ativo',
        status: 'active'
      }, ...prev]);
    }

    // 2. Look for a link generated for this student and task
    let foundLink = dbTaskLinks.find(
      link => link.studentName === studentName && link.taskId === taskId
    );

    let finalActivityCode = '';
    if (foundLink) {
      try {
        const urlObj = new URL(foundLink.link);
        const codeParam = urlObj.searchParams.get('code');
        if (codeParam && codeParam.startsWith('ATV-')) {
          finalActivityCode = codeParam;
        }
      } catch {
        if (foundLink.id.startsWith('LINK-') && foundLink.id.includes('ATV-')) {
          const parts = foundLink.id.split('-');
          const atvPart = parts.find(p => p.startsWith('ATV-'));
          if (atvPart) {
            finalActivityCode = atvPart;
          }
        }
      }
    }

    if (!finalActivityCode) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let codeVal = '';
      for (let i = 0; i < 6; i++) {
        codeVal += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      finalActivityCode = `ATV-${codeVal}`;
    }

    let finalLink = `${window.location.origin}?code=${finalActivityCode}`;

    if (foundLink) {
      foundLink.link = finalLink;
      setDbTaskLinks(prev => prev.map(l => l.id === foundLink!.id ? { ...l, link: finalLink, id: `LINK-${studentId}-${finalActivityCode}` } : l));
    } else {
      setDbTaskLinks(prev => [{ id: `LINK-${studentId}-${finalActivityCode}`, studentName, link: finalLink, taskId }, ...prev]);
    }

    // 3. Always ensure the registry has this activity code mapped to this specific taskId and taskTitle
    const registryKey = 'abba_invite_codes_registry';
    const currentRegistry = localStorage.getItem(registryKey);
    const registryList = currentRegistry ? JSON.parse(currentRegistry) : [];
    
    const existingIndex = registryList.findIndex((item: any) => item.code === finalActivityCode);
    if (existingIndex !== -1) {
      registryList[existingIndex].taskId = taskId;
      registryList[existingIndex].taskTitle = taskTitle;
      registryList[existingIndex].name = studentName;
      registryList[existingIndex].codeId = `st-${studentId}`;
    } else {
      registryList.push({
        code: finalActivityCode,
        name: studentName,
        expiresAt: expiresAt,
        codeId: `st-${studentId}`,
        taskId,
        taskTitle
      });
    }
    localStorage.setItem(registryKey, JSON.stringify(registryList));

    return { link: finalLink, code: finalActivityCode };
  };

  const handleShareButtonPress = (studentName: string, studentId: string, taskTitle: string, taskId: string, type: 'code' | 'link' | 'txt') => {
    const isAlreadyCopied = copiedButtons[studentId]?.[type];

    if (isAlreadyCopied) {
      setConfirmCopyAgain({ sid: studentId, type });
      return;
    }

    executeCopyAction(studentName, studentId, taskTitle, taskId, type);
  };

  const executeCopyAction = (studentName: string, studentId: string, taskTitle: string, taskId: string, type: 'code' | 'link' | 'txt') => {
    const info = resolveStudentTaskAccess(studentName, studentId, taskId, taskTitle);

    let textToCopy = '';
    let alertMsg = '';

    if (type === 'code') {
      textToCopy = `Olá, *${studentName}* 👋🏾\nEssa é sua tarefa: *${taskTitle}* no Abba Digital*!\n\nUse o seu *código da tarefa*: *${info.code}*\n\n*Como usar o Código?*\nNa *Área do aluno* vá até o campo *Inserir código de acesso* e digite ou cole seu código de 6 dígitos. Após isso, clique em *Verificar* e depois em *Fazer tarefa*.`;
      alertMsg = 'O código foi copiado';
    } else if (type === 'link') {
      textToCopy = `Olá, *${studentName}* 👋🏾\nEssa é sua tarefa: *${taskTitle}* no Abba Digital*!\n\nClique no *link da tarefa* abaixo para acessar sua tarefa:\n${info.link}\n\n*Como usar o Link?*\nNa *Área do aluno* vá até o campo *Inserir código de acesso* e digite ou cole seu código de 6 dígitos. Após isso, clique em *Verificar* e depois em *Fazer tarefa*.`;
      alertMsg = 'O Link foi copiado';
    } else if (type === 'txt') {
      textToCopy = `Olá, *${studentName}* 👋🏾\nEssa é sua tarefa: *${taskTitle}* no Abba Digital*!\n\nSeu *código de acesso* alfanumérico é: *${info.code}*\nSeu *link de acesso direto* é:\n${info.link}\n\n*Como Acessar?*\nNa *Área do aluno* vá até o campo *Inserir código de acesso* e digite ou cole seu código de 6 dígitos. Após isso, clique em *Verificar* e depois em *Fazer tarefa*.`;
      alertMsg = 'As instruções de acesso foram copiadas e a ficha foi baixada!';
      
      // Also download actual TXT!
      handleDownloadStudentTaskCode(studentName, taskTitle, info.code || '', info.link || '');
    }

    navigator.clipboard.writeText(textToCopy);
    setCopiedButtons(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { code: false, link: false, txt: false }),
        [type]: true
      }
    }));
    setToastMessage(alertMsg);
    setConfirmCopyAgain(null);
  };

  // Helper function to map student data with their offline keys and links, and show the visual assignment overlay
  const showAssignmentSuccessOverlay = (taskTitle: string, taskId: string, studentIds: string[]) => {
    if (!studentIds || studentIds.length === 0) return;

    const mapped = studentIds.map(studentId => {
      const student = students.find(s => s.id === studentId || s.name.toLowerCase() === studentId.toLowerCase());
      if (!student) return null;

      // Always resolve task access using our robust, super-short alphanumeric link mechanism!
      const info = resolveStudentTaskAccess(student.name, student.id, taskId, taskTitle);

      return {
        id: student.id,
        name: student.name,
        link: info.link,
        code: info.code
      };
    }).filter(Boolean) as { id: string; name: string; link?: string; code?: string }[];

    setAssignedModalInfo({
      taskTitle,
      students: mapped
    });
  };

  const handleDownloadStudentTaskCode = (studentName: string, taskTitle: string, accessCode: string, accessLink: string) => {
    try {
      const foundTask = tasks.find(t => t.title === taskTitle || t.id === taskTitle);
      const taskDescription = foundTask?.description || 'Realize as atividades práticas de soletração no portal Abba Digital.';
      const dateStr = new Date().toLocaleDateString('pt-BR');

      const textContent = `==================================================
              ABBA DIGITAL - FICHA DE ACESSO
==================================================

Estudante: ${studentName}
Tarefa: ${taskTitle}
Data de Atribuição: ${dateStr}

Descrição da Tarefa:
${taskDescription}

--------------------------------------------------
CÓDIGO DE ACESSO ALFANUMÉRICO:
👉 ${accessCode}
--------------------------------------------------

Link de Acesso Direto:
🔗 ${accessLink}

Instruções para o Aluno:
1. Acesse o portal: abba-digital.vercel.app
2. Na Área do Aluno, insira seu Código de Acesso Alfanumérico
   ou clique diretamente no Link de Acesso Direto acima.

==================================================
Ficha de atividade oficial gerada pelo Painel do Professor.
==================================================`;

      const element = document.createElement("a");
      const file = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      element.href = URL.createObjectURL(file);
      element.download = `ficha-acesso-${taskTitle.toLowerCase().replace(/\s+/g, '-')}-${studentName.toLowerCase().replace(/\s+/g, '-')}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      setToastMessage('Ficha de acesso (.txt) baixada com sucesso!');
    } catch (error) {
      console.error("Erro ao gerar ficha de acesso:", error);
      alert("Houve um erro ao gerar a ficha de acesso. Tente novamente.");
    }
  };

  // Checkbox Student Selector States
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isBatchAssignModalOpen, setIsBatchAssignModalOpen] = useState(false);
  const [batchDuration, setBatchDuration] = useState('1d');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentsFilter, setStudentsFilter] = useState<'all' | 'completed' | 'pending' | 'inprogress'>('all');
  const [studentsLimit, setStudentsLimit] = useState(6);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentClass, setNewStudentClass] = useState('');
  const [newStudentProgress, setNewStudentProgress] = useState(0);

  // Modals for Cloud Save and Batch Delete
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedStudentIdsSave, setSelectedStudentIdsSave] = useState<string[]>([]);
  const [selectedStudentIdsDelete, setSelectedStudentIdsDelete] = useState<string[]>([]);

  // Add Task Modal State
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isDraftCreator, setIsDraftCreator] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('2026-06-30');
  const [newTaskWords, setNewTaskWords] = useState<{ word: string; language: 'pt' | 'en' | 'de'; color: string }[]>([
    { word: 'CASA', language: 'pt', color: '#1e293b' }
  ]);

  const [isAssignStudentsOpen, setIsAssignStudentsOpen] = useState(false);
  const [tempCreatedTask, setTempCreatedTask] = useState<TaskItem | null>(null);
  const [newTaskTeacherNote, setNewTaskTeacherNote] = useState('');
  const [newTaskStartDate, setNewTaskStartDate] = useState('2026-05-24');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [generalSearchQuery, setGeneralSearchQuery] = useState('');
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'unread'>('all');
  const [readNotifications, setReadNotifications] = useState<string[]>([]);
  const [excludedSearchTaskIds, setExcludedSearchTaskIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('abba_teacher_excluded_search_tasks');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('abba_teacher_excluded_search_tasks', JSON.stringify(excludedSearchTaskIds));
  }, [excludedSearchTaskIds]);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const bellButtonRef = useRef<HTMLButtonElement>(null);
  const avatarButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (showNotificationsDropdown) {
        const isClickingBell = (event.target as HTMLElement).closest('[title="Notificações"]') || 
                               (event.target as HTMLElement).closest('.bell-btn-mobile') ||
                               (bellButtonRef.current && bellButtonRef.current.contains(event.target as Node));
        if (
          notificationsRef.current && 
          !notificationsRef.current.contains(event.target as Node) &&
          !isClickingBell
        ) {
          setShowNotificationsDropdown(false);
        }
      }
      if (showProfileMenu) {
        const isClickingAvatar = (event.target as HTMLElement).closest('[title="Perfil"]') || 
                                 (event.target as HTMLElement).closest('.avatar-btn-mobile') ||
                                 (avatarButtonRef.current && avatarButtonRef.current.contains(event.target as Node));
        if (
          profileMenuRef.current && 
          !profileMenuRef.current.contains(event.target as Node) &&
          !isClickingAvatar
        ) {
          setShowProfileMenu(false);
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotificationsDropdown, showProfileMenu]);
  const [addTaskStudentSearchQuery, setAddTaskStudentSearchQuery] = useState('');
  const [addTaskFile, setAddTaskFile] = useState<File | null>(null);
  const addTaskFileInputRef = useRef<HTMLInputElement | null>(null);

  // States for Task Editing Modal (matches requested high-fidelity markup)
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskDueDate, setEditTaskDueDate] = useState('');
  const [editTaskDescription, setEditTaskDescription] = useState('');
  const [editTaskPriority, setEditTaskPriority] = useState<'Alta' | 'Média' | 'Baixa'>('Alta');
  const [editTaskAssignedStudentIds, setEditTaskAssignedStudentIds] = useState<string[]>([]);
  const [showEditAssignPanel, setShowEditAssignPanel] = useState(false);
  const [editTaskStudentSearchQuery, setEditTaskStudentSearchQuery] = useState('');
  const [isDetailEditMode, setIsDetailEditMode] = useState(false);
  const [isAssigningStudentsDetails, setIsAssigningStudentsDetails] = useState<TaskItem | null>(null);
  const [tempDetailsAssignedStudentIds, setTempDetailsAssignedStudentIds] = useState<string[]>([]);
  const [assignedStudentsResult, setAssignedStudentsResult] = useState<{
    taskTitle: string;
    studentIds: string[];
  } | null>(null);
  const [copiedInviteType, setCopiedInviteType] = useState<'code' | 'link' | null>(null);

  const [supportFilesModal, setSupportFilesModal] = useState<{
    isOpen: boolean;
    task: TaskItem;
    isNew: boolean;
    assignedStudentIds: string[];
  } | null>(null);
  const [uploadedSupportFiles, setUploadedSupportFiles] = useState<{ name: string; url: string; size: string }[]>([]);
  const [supportDragActive, setSupportDragActive] = useState(false);
  const supportFileInputRef = useRef<HTMLInputElement | null>(null);

  const getGenderedTitle = (selectedStudents: any[]): string => {
    if (selectedStudents.length === 0) {
      return "Nenhum aluno atribuído";
    }

    const studentsWithGender = selectedStudents.map(s => ({
      ...s,
      detectedGender: s.gender || (
        (() => {
          const firstName = s.name.split(' ')[0].toLowerCase();
          if (firstName.endsWith('a') || ['beatriz', 'alice', 'yasmin', 'isabel', 'raquel', 'ruth', 'irene'].includes(firstName)) {
            return 'F';
          }
          return 'M';
        })()
      )
    }));

    const allFemale = studentsWithGender.every(s => s.detectedGender === 'F');
    const allMale = studentsWithGender.every(s => s.detectedGender === 'M');

    if (allFemale) {
      return studentsWithGender.length === 1
        ? "Aluna que você atribuiu a essa tarefa"
        : "Alunas que você atribuiu a essa tarefa";
    } else if (allMale) {
      return studentsWithGender.length === 1
        ? "Aluno que você atribuiu a essa tarefa"
        : "Alunos que você atribuiu a essa tarefa";
    } else {
      return "Alunos que você atribuiu a essa tarefa";
    }
  };

  const [detailsAssignSearchQuery, setDetailsAssignSearchQuery] = useState('');
  const [detailsStudentSearchQuery, setDetailsStudentSearchQuery] = useState('');
  const [detailsStudentPage, setDetailsStudentPage] = useState(1);

  const handleAddTaskFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        alert('Por favor, selecione apenas arquivos de imagem.');
        return;
      }
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        alert('O arquivo selecionado excede o limite de tamanho de 5MB.');
        return;
      }
      setAddTaskFile(file);
      alert(`Arquivo "${file.name}" anexado com sucesso!`);
    }
  };

  // Leave students unchecked by default when the Add Task Modal opens
  useEffect(() => {
    if (isAddTaskOpen) {
      setSelectedStudentIds([]);
      setAddTaskStudentSearchQuery('');
      setAddTaskFile(null);
    }
  }, [isAddTaskOpen]);

  // Sync editing task states when selection changes
  useEffect(() => {
    if (editingTask) {
      setEditTaskTitle(editingTask.title);
      setEditTaskDueDate(editingTask.dueDate);
      setEditTaskDescription(editingTask.description);
      setEditTaskPriority(editingTask.priority || 'Alta');
      setEditTaskAssignedStudentIds(editingTask.assignedStudentIds || []);
      setShowEditAssignPanel(false);
      setEditTaskStudentSearchQuery('');
      setIsDetailEditMode(false);
      setDetailsStudentSearchQuery('');
      setDetailsStudentPage(1);
    }
  }, [editingTask]);

  // Lock body scroll when any modal is open
  useEffect(() => {
    const isAnyModalOpen = !!(
      isAddStudentOpen ||
      isAssigningStudentsDetails ||
      editingTask ||
      assignedStudentsResult ||
      isAddTaskOpen ||
      isDuplicateModalOpen ||
      isBatchAssignModalOpen ||
      isSaveModalOpen ||
      isDeleteModalOpen
    );

    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [
    isAddStudentOpen,
    isAssigningStudentsDetails,
    editingTask,
    assignedStudentsResult,
    isAddTaskOpen,
    isDuplicateModalOpen,
    isBatchAssignModalOpen,
    isSaveModalOpen,
    isDeleteModalOpen
  ]);

  // Stateful Bento Grid & Details parameters
  const [tasksFilter, setTasksFilter] = useState<'all' | 'active' | 'draft' | 'archived'>('all');
  const [tasksPage, setTasksPage] = useState(1);
  const [selectedTaskDetails, setSelectedTaskDetails] = useState<TaskItem | null>(null);
  const [taskSearchQuery, setTaskSearchQuery] = useState('');

  // Smooth scroll to top of content when pagination changes
  const scrollToContentTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sync state helpers
  useEffect(() => {
    localStorage.setItem('abba_teacher_tasks', JSON.stringify(tasks));
    
    // Background sync of all tasks to Supabase
    const syncAll = async () => {
      for (const t of tasks) {
        await syncSingleTaskToSupabase(t);
      }
    };
    syncAll();
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('abba_active_codes', JSON.stringify(activeCodes));
  }, [activeCodes]);

  const [accessedStudents, setAccessedStudents] = useState<{ id: string; studentName: string; accessedAt: string; code: string }[]>(() => {
    const local = localStorage.getItem('abba_students_logged_by_code');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((s: any) => 
            s && 
            s.id && 
            !/^st-\d+$/.test(s.id) && 
            s.id !== 'student-fixed-id' &&
            s.studentName !== 'Alana' &&
            s.studentName !== 'Beatriz' &&
            s.studentName !== 'Carlos' &&
            s.studentName !== 'Diogo' &&
            s.studentName !== 'Eduarda' &&
            s.studentName !== 'Felipe' &&
            s.studentName !== 'Giovanna'
          );
          if (filtered.length !== parsed.length) {
            localStorage.setItem('abba_students_logged_by_code', JSON.stringify(filtered));
          }
          return filtered;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'abba_students_logged_by_code') {
        const local = localStorage.getItem('abba_students_logged_by_code');
        if (local) {
          setAccessedStudents(JSON.parse(local));
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    const interval = setInterval(() => {
      const local = localStorage.getItem('abba_students_logged_by_code');
      if (local) {
        setAccessedStudents(prev => {
          const parsed = JSON.parse(local);
          if (JSON.stringify(prev) !== JSON.stringify(parsed)) {
            return parsed;
          }
          return prev;
        });
      }
    }, 3000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Sync students list in real time from localStorage (when active student logs in!)
  useEffect(() => {
    const syncStudents = () => {
      const local = localStorage.getItem('abba_students_list');
      if (local) {
        setStudents(prev => {
          const parsed = JSON.parse(local);
          if (JSON.stringify(prev) !== JSON.stringify(parsed)) {
            return parsed;
          }
          return prev;
        });
      }
    };

    window.addEventListener('storage', syncStudents);

    return () => {
      window.removeEventListener('storage', syncStudents);
    };
  }, []);

  const handleGenerateCode = () => {
    if (!studentNameInput.trim()) {
      alert('Por favor, informe o nome do aluno.');
      return;
    }

    const name = studentNameInput.trim();

    // Check for active keys matching name and surname
    const activeMatch = activeCodes.find(
      c => c.studentName.trim().toLowerCase() === name.toLowerCase() && Date.now() < c.expiresAt
    );

    if (activeMatch) {
      setDuplicateName(name);
      setDuplicateActiveCode(activeMatch);
      setDuplicateSelectedDuration(duration === 'custom' ? '1d' : duration);
      setDuplicateCustomExpiryDate(customExpiryDate);
      setDuplicateStep('question');
      setIsDuplicateModalOpen(true);
      return;
    }

    let durationMs = 0;
    let durationLabel = '';

    if (duration === '1h') {
      durationMs = 60 * 60 * 1000;
      durationLabel = '1 Hora';
    } else if (duration === '4h') {
      durationMs = 4 * 60 * 60 * 1000;
      durationLabel = '4 Horas';
    } else if (duration === '1d') {
      durationMs = 24 * 60 * 60 * 1000;
      durationLabel = '1 Dia';
    } else if (duration === '1w') {
      durationMs = 7 * 24 * 60 * 60 * 1000;
      durationLabel = '1 Semana';
    } else {
      const parts = customExpiryDate.split('-');
      const timeParts = customExpiryTime.split(':');
      const hour = timeParts.length > 0 ? Number(timeParts[0]) : 23;
      const minute = timeParts.length > 1 ? Number(timeParts[1]) : 59;
      const expDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), hour, minute, 0);
      durationMs = expDate.getTime() - Date.now();
      durationLabel = `Até ${parts[2]}/${parts[1]}/${parts[0]} às ${customExpiryTime}`;
    }

    const expiresAt = Date.now() + durationMs;
    const codeId = 'st-' + Math.random().toString(36).substring(2, 9).toUpperCase();

    // Generate a simple 6-char alphanumeric code (e.g., K9X8J2)
    const generateSimpleCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let res = '';
      for (let i = 0; i < 6; i++) {
        res += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return res;
    };
    const code = generateSimpleCode();

    // Save to local registry so App.tsx and AuthScreens.tsx can decode it!
    const registryKey = 'abba_invite_codes_registry';
    const currentRegistry = localStorage.getItem(registryKey);
    const registryList = currentRegistry ? JSON.parse(currentRegistry) : [];
    registryList.push({
      code: code,
      name: name,
      expiresAt: expiresAt,
      codeId: codeId
    });
    localStorage.setItem(registryKey, JSON.stringify(registryList));

    // Save to Supabase immediately so the student's app on other devices can recognize this code!
    const newStudent = {
      id: codeId,
      name: name,
      class: "Turma A - 3º Ano",
      img: `/padrao/foto-do-perfil.avif`,
      progress: 0,
      matricula: code,
      gender: detectGenderFromName(name),
      email: '',
      lastAccessAt: null,
      loginMethod: 'code'
    };

    // Update teacher student list
    setStudents(prev => [newStudent, ...prev]);
    try {
      const currentStudents = JSON.parse(localStorage.getItem('abba_students_list') || '[]');
      localStorage.setItem('abba_students_list', JSON.stringify([newStudent, ...currentStudents]));
    } catch (err) {
      console.error(err);
    }

    // Push to Supabase database
    syncSingleStudentToSupabase(newStudent);

    const friendlyCode = code;
    const token = code;

    const newCodeItem: AccessCode = {
      id: codeId,
      code: token,
      studentName: name,
      expiresAt,
      durationLabel,
      status: 'active'
    };

    setActiveCodes([newCodeItem, ...activeCodes]);
    setGeneratedCode(friendlyCode);
    setGeneratedBase64(token);
    setGeneratedStudentName(name);
    setStudentNameInput('');
  };

  const handleCopyCode = async (codeText: string, index: number) => {
    // Proactive Supabase sinking
    const registryKey = 'abba_invite_codes_registry';
    const localRegistry = localStorage.getItem(registryKey);
    const registryList = localRegistry ? JSON.parse(localRegistry) : [];
    
    const cleanCode = codeText.replace('ABBA-', '');
    let searchCode = cleanCode;
    if (cleanCode.includes('-')) {
      searchCode = cleanCode.split('-')[0];
    }

    const matchedLocal = registryList.find((item: any) => item.code === searchCode || item.code === codeText || item.code === cleanCode);
    const matchedActive = activeCodes.find((c: any) => c.code === codeText || c.code === cleanCode || c.id === `st-${searchCode}` || c.id === searchCode);

    const cleanUpper = cleanCode.toUpperCase();
    let matchedRecord = matchedLocal ? {
      codeId: matchedLocal.codeId,
      name: matchedLocal.name,
      code: matchedLocal.code
    } : matchedActive ? {
      codeId: matchedActive.id,
      name: matchedActive.studentName,
      code: searchCode
    } : null;

    if (!matchedRecord) {
      if (cleanUpper.includes('0TJZ3UW')) {
        matchedRecord = {
          codeId: 'st-2',
          name: 'Carlos André',
          code: 'ABBA-0TJZ3UW-CARLOS'
        };
      } else if (cleanUpper.includes('5MTAUIK')) {
        matchedRecord = {
          codeId: 'st-1',
          name: 'Ana Beatriz Silva',
          code: 'ABBA-5MTAUIK-ANA'
        };
      }
    }
    
    // Os dados do estudante no Supabase serão criados dinamicamente apenas quando o aluno realizar o seu primeiro login.

    let messageText = codeText;
    try {
      if (codeText.startsWith('ABBA-')) {
        const base64 = codeText.substring(5);
        // decode base64 safely
        const decoded = atob(base64);
        const payload = JSON.parse(decoded);
        if (payload && payload.name) {
          messageText = `Olá, ${payload.name}, esse é seu código para acessar o aplicativo:\n\n${codeText}\nInsira-o na página de login, clicando nesse link: https://abba-digital.vercel.app`;
        }
      } else {
        const activeItem = activeCodes.find(c => c.code === codeText);
        const name = activeItem ? activeItem.studentName : 'Aluno';
        
        const guessedGender = detectGenderFromName(name);
        const welcomeWord = guessedGender === 'F' ? 'bem-vinda' : 'bem-vindo';
        
        messageText = `Olá, *${name}* 👋🏾\nSeja muito ${welcomeWord} ao *Abba Digital*!\n\nUse o seu *código de acesso* na página de login do aluno para entrar:\nSeu código: *${codeText}*\n\n*Como entrar?*\nNa tela de login do Abba Digital, clique na aba *Entrar com código* e cole o código acima para acessar sua conta!`;
      }
    } catch (e) {
      console.error('Failed to construct whatsapp message:', e);
    }

    navigator.clipboard.writeText(messageText);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Mass / Bulk Task Actions
  const handleBulkArchiveTasks = () => {
    const tasksToArchive = filteredTasks.filter(t => t.status !== 'completed');
    if (tasksToArchive.length === 0) {
      alert("Nenhuma tarefa elegível para arquivamento nesta aba.");
      return;
    }

    const currentTabName = tasksFilter === 'all' ? 'todas as' : tasksFilter === 'active' ? 'ativas' : 'rascunhos';
    if (confirm(`Deseja realmente arquivar todas as ${tasksToArchive.length} tarefas (${currentTabName}) atualmente visíveis nesta aba?`)) {
      const tasksToArchiveIds = tasksToArchive.map(t => t.id);
      const updated = tasks.map(t => tasksToArchiveIds.includes(t.id) ? { ...t, status: 'completed' as const } : t);
      setTasks(updated);
      alert(`${tasksToArchive.length} tarefas foram arquivadas com sucesso! 📦`);
    }
  };

  const handleBulkDeleteTasks = () => {
    if (filteredTasks.length === 0) {
      alert("Nenhuma tarefa para excluir nesta aba.");
      return;
    }

    const currentTabName = tasksFilter === 'all' ? 'todas as' : tasksFilter === 'active' ? 'ativas' : tasksFilter === 'draft' ? 'rascunhos' : 'arquivadas';
    if (confirm(`Deseja realmente excluir permanentemente todas as ${filteredTasks.length} tarefas (${currentTabName}) atualmente visíveis nesta aba?`)) {
      const filteredIds = filteredTasks.map(t => t.id);
      const updated = tasks.filter(t => !filteredIds.includes(t.id));
      setTasks(updated);
      
      // Salvar na fila de exclusões pendentes para robustez offline
      try {
        const pending = JSON.parse(localStorage.getItem('abba_pending_task_deletions') || '[]');
        filteredIds.forEach(id => {
          if (!pending.includes(id)) {
            pending.push(id);
          }
        });
        localStorage.setItem('abba_pending_task_deletions', JSON.stringify(pending));
      } catch (e) {
        console.error(e);
      }

      // Deletar do Supabase para persistência total!
      (async () => {
        try {
          const { error } = await supabase
            .from('tasks')
            .delete()
            .in('id', filteredIds);
          if (!error) {
            console.log(`🗑️ ${filteredIds.length} tarefas excluídas com sucesso do Supabase!`);
            // Se deletado com sucesso, remover da fila
            try {
              const pending = JSON.parse(localStorage.getItem('abba_pending_task_deletions') || '[]');
              const remaining = pending.filter((id: string) => !filteredIds.includes(id));
              localStorage.setItem('abba_pending_task_deletions', JSON.stringify(remaining));
            } catch (e) {
              console.error(e);
            }
          } else {
            console.warn('Erro ao excluir tarefas no Supabase:', error);
          }
        } catch (err) {
          console.warn('Falha na comunicação com Supabase ao excluir tarefas:', err);
        }
      })();

      alert(`${filteredIds.length} tarefas foram excluídas permanentemente com sucesso! 🗑️`);
    }
  };

  // Student Select logic
  const handleSelectAllStudents = (checked: boolean) => {
    if (checked) {
      const filtered = students.filter(s => 
        s.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) || 
        s.class.toLowerCase().includes(studentSearchQuery.toLowerCase())
      );
      setSelectedStudentIds(filtered.map(s => s.id));
    } else {
      setSelectedStudentIds([]);
    }
  };

  const handleSelectStudent = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedStudentIds([...selectedStudentIds, id]);
    } else {
      setSelectedStudentIds(selectedStudentIds.filter(sid => sid !== id));
    }
  };

  const handleBatchAssignKeys = () => {
    if (selectedStudentIds.length === 0) {
      alert('Por favor, selecione ao menos um aluno para atribuição.');
      return;
    }

    // 1. Validation: check for existing active (not expired) keys for selected students
    const activeStudentNames = activeCodes
      .filter(c => Date.now() < c.expiresAt)
      .map(c => c.studentName.toLowerCase());

    const alreadyHasActiveKey = selectedStudentIds
      .map(sid => students.find(s => s.id === sid))
      .filter(s => s && activeStudentNames.includes(s.name.toLowerCase()));

    if (alreadyHasActiveKey.length > 0) {
      const names = alreadyHasActiveKey.map(s => s!.name).join(', ');
      alert(`Não é possível atribuir novas chaves. Os seguintes alunos já possuem chaves ativas em vigor: ${names}. Revogue as chaves atuais antes de gerar novas.`);
      return;
    }

    // 2. Open duration selection modal
    setBatchDuration('1d'); // default to 1 day
    setIsBatchAssignModalOpen(true);
  };

  const handleConfirmBatchAssignKeys = (selectedDuration: string) => {
    let durationMs = 0;
    let durationLabel = '';

    if (selectedDuration === '1h') {
      durationMs = 60 * 60 * 1000;
      durationLabel = '1 Hora';
    } else if (selectedDuration === '4h') {
      durationMs = 4 * 60 * 60 * 1000;
      durationLabel = '4 Horas';
    } else if (selectedDuration === '1d') {
      durationMs = 24 * 60 * 60 * 1000;
      durationLabel = '1 Dia';
    } else if (selectedDuration === '1w') {
      durationMs = 7 * 24 * 60 * 60 * 1000;
      durationLabel = '1 Semana';
    } else if (selectedDuration === '30d') {
      durationMs = 30 * 24 * 60 * 60 * 1000;
      durationLabel = '30 Dias';
    }

    const expiresAt = Date.now() + durationMs;
    const newCodes: AccessCode[] = [];

    const registryKey = 'abba_invite_codes_registry';
    const currentRegistry = localStorage.getItem(registryKey);
    const registryList = currentRegistry ? JSON.parse(currentRegistry) : [];

    // Generate a simple 6-char alphanumeric code (e.g., K9X8J2)
    const generateSimpleCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let res = '';
      for (let i = 0; i < 6; i++) {
        res += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return res;
    };

    selectedStudentIds.forEach(sid => {
      const student = students.find(s => s.id === sid);
      if (!student) return;

      const code = generateSimpleCode();
      const codeId = 'st-' + Math.random().toString(36).substring(2, 9).toUpperCase();

      registryList.push({
        code: code,
        name: student.name,
        expiresAt,
        codeId
      });

      newCodes.push({
        id: codeId,
        code: code,
        studentName: student.name,
        expiresAt,
        durationLabel,
        status: 'active'
      });
    });

    localStorage.setItem(registryKey, JSON.stringify(registryList));

    setActiveCodes(prev => [...newCodes, ...prev]);
    setSelectedStudentIds([]);
    setIsBatchAssignModalOpen(false);
    alert(`Chaves de acesso geradas e atribuídas com sucesso para ${newCodes.length} alunos! 🚀`);
  };

  // Add word helper in Add Task
  const handleAddWordToNewTask = () => {
    setNewTaskWords([...newTaskWords, { word: '', language: 'pt', color: '#1e293b' }]);
  };

  const handleRemoveWordFromNewTask = (index: number) => {
    setNewTaskWords(newTaskWords.filter((_, idx) => idx !== index));
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !newTaskDesc.trim()) {
      alert('Preencha os campos obrigatórios.');
      return;
    }

    const cleanWords = newTaskWords
      .filter(w => w.word.trim().length > 0)
      .map(w => ({
        word: w.word.trim().toUpperCase(),
        language: w.language,
        color: w.color
      }));

    if (cleanWords.length === 0 && !isDraftCreator) {
      alert('Adicione pelo menos uma palavra para a tarefa.');
      return;
    }

    const newTaskItem: TaskItem = {
      id: 'task-' + Math.random().toString(36).substring(2, 9),
      title: newTaskTitle.trim(),
      description: newTaskDesc.trim(),
      dueDate: newTaskDueDate,
      status: isDraftCreator ? 'draft' : 'active',
      targetWords: cleanWords.length > 0 ? cleanWords : [{ word: 'DIGITE', language: 'pt', color: '#1e293b' }],
      submissionsCount: 0,
      startDate: newTaskStartDate,
      teacherNote: newTaskTeacherNote.trim() || undefined,
      assignedStudentIds: selectedStudentIds,
      supportFiles: []
    };

    setUploadedSupportFiles([]);
    setSupportFilesModal({
      isOpen: true,
      task: newTaskItem,
      isNew: true,
      assignedStudentIds: selectedStudentIds
    });
  };

  const handleSupportFileUpload = (filesList: FileList) => {
    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    Array.from(filesList).forEach(file => {
      const fileName = file.name.toLowerCase();
      const isAllowed = allowedExtensions.some(ext => fileName.endsWith(ext));

      if (!isAllowed) {
        alert(`O arquivo "${file.name}" não é suportado! Apenas Imagens são permitidas.`);
        return;
      }

      if (file.size > maxSize) {
        alert(`O arquivo "${file.name}" excede o limite máximo de 5MB!`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        const fileData = {
          name: file.name,
          url: reader.result as string,
          size: `${sizeMB} MB`
        };
        setUploadedSupportFiles(prev => {
          // Prevent duplicates by name
          if (prev.some(f => f.name === fileData.name)) return prev;
          return [...prev, fileData];
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSaveWithSupportFiles = (includeFiles: boolean) => {
    if (!supportFilesModal) return;
    const { task, isNew, assignedStudentIds } = supportFilesModal;

    const finalSupportFiles = includeFiles ? uploadedSupportFiles : [];
    const savedTask: TaskItem = {
      ...task,
      supportFiles: finalSupportFiles
    };

    if (isNew) {
      setTasks(prev => [savedTask, ...prev]);
      setIsAddTaskOpen(false);
      
      // Reset Create Form
      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskTeacherNote('');
      setNewTaskStartDate('2026-05-24');
      setNewTaskDueDate('2026-06-30');
      setNewTaskWords([{ word: 'CASA', language: 'pt', color: '#1e293b' }]);
      setSelectedStudentIds([]);

      if (isDraftCreator && onDraftCreated) {
        onDraftCreated(savedTask);
      } else {
        // Trigger the beautiful success overlay
        showAssignmentSuccessOverlay(savedTask.title, savedTask.id, assignedStudentIds);
      }
    } else {
      setTasks(prev => prev.map(t => t.id === task.id ? savedTask : t));
      setEditingTask(null);
      
      // Also show success overlay for updated student assignments if any!
      if (assignedStudentIds && assignedStudentIds.length > 0) {
        showAssignmentSuccessOverlay(savedTask.title, savedTask.id, assignedStudentIds);
      } else {
        alert('Tarefa atualizada com sucesso! 🚀');
      }
    }

    setSupportFilesModal(null);
  };

  const filteredStudentsForGrid = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) || 
                          s.class.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                          (s.name.toLowerCase().replace(' ', '.') + '@email.com').includes(studentSearchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (studentsFilter === 'completed') return s.progress === 100;
    if (studentsFilter === 'pending') return s.progress < 50;
    if (studentsFilter === 'inprogress') return s.progress >= 50 && s.progress < 100;
    return true;
  });

  const filteredActiveCodes = activeCodes.filter(c =>
    c.studentName.toLowerCase().includes(studentSearchQuery.toLowerCase())
  );

  const [selectedStudentIdsGrid, setSelectedStudentIdsGrid] = useState<string[]>([]);

  const handleCloudSync = () => {
    setSelectedStudentIdsSave(students.map(s => s.id));
    setIsSaveModalOpen(true);
  };

  const handleDeleteSelected = () => {
    setSelectedStudentIdsDelete(selectedStudentIdsGrid);
    setIsDeleteModalOpen(true);
  };

  const toggleSelectStudentGrid = (id: string) => {
    setSelectedStudentIdsGrid(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Filter and paginated tasks logic
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(taskSearchQuery.toLowerCase()) || 
                          task.description.toLowerCase().includes(taskSearchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (tasksFilter === 'all') return true;
    if (tasksFilter === 'active') return task.status === 'active';
    if (tasksFilter === 'draft') return task.status === 'draft';
    if (tasksFilter === 'archived') return task.status === 'completed';
    return true;
  });
  const TASKS_PER_PAGE = 5;
  const totalPages = Math.ceil(filteredTasks.length / TASKS_PER_PAGE) || 1;
  const startIndex = (tasksPage - 1) * TASKS_PER_PAGE;
  const paginatedTasks = filteredTasks.slice(startIndex, startIndex + TASKS_PER_PAGE);

  return (
    <div className="min-h-screen bg-surface text-on-background flex flex-col font-sans">
      
      {/* Mobile Bottom Sheets (Notifications and Profile) - Rendered at root level to prevent parent display hidden bugs */}
      <AnimatePresence>
        {showNotificationsDropdown && (
          <div className="fixed inset-0 z-[150] block md:hidden">
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
                {[
                  {
                    id: 'notif-1',
                    title: 'Nova entrega!',
                    message: 'Ana Beatriz Silva concluiu "Exercício de Numerais Multilingue".',
                    createdAt: new Date().toISOString(),
                    isRead: false,
                  },
                  {
                    id: 'notif-2',
                    title: 'Tarefa criada!',
                    message: 'Você criou com sucesso a tarefa "Tarefa de cores".',
                    createdAt: new Date(Date.now() - 3600000).toISOString(),
                    isRead: true,
                  }
                ].map((notif) => (
                  <div 
                    key={notif.id}
                    className="p-5 flex gap-4 transition-colors relative text-left bg-white"
                  >
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-indigo-500 text-[18px]">
                        {notif.title.includes('entrega') ? 'assignment_turned_in' : 'assignment_add'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <p className="font-bold text-xs text-slate-800 leading-tight truncate">{notif.title}</p>
                        <span className="text-[9px] text-slate-400 font-medium shrink-0">agora</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-normal">{notif.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showProfileMenu && (
          <div className="fixed inset-0 z-[150] block md:hidden">
            <div 
              onClick={() => setShowProfileMenu(false)} 
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            ></div>
            <motion.div
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
                <h2 className="text-lg font-bold text-slate-900">Perfil do Teatcher</h2>
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
                      src="/padrao/foto-do-professor.avif" 
                    />
                    <div className="absolute -right-1 -bottom-1 bg-[#10B981] w-4.5 h-4.5 rounded-full border-2 border-white flex items-center justify-center">
                      <span className="w-2 h-2 bg-emerald-100 rounded-full animate-pulse" />
                    </div>
                  </div>
                  <div className="text-left min-w-0">
                    <p className="font-bold text-base text-slate-900 truncate">{teacherName}</p>
                    <p className="text-xs text-slate-400 mt-1 truncate">{teacherEmail}</p>
                  </div>
                </div>

                {/* Progress/Summary Card for Teacher */}
                <div className="p-5 flex flex-col gap-3">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold text-slate-700">Função: Teatcher</p>
                                <p className="text-[11px] text-slate-400 mt-1">Teatcher de inglês e idiomas</p>
                      </div>
                      <span className="material-symbols-outlined text-indigo-500 text-lg">verified_user</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-3 leading-relaxed">
                      Gerencie tarefas, atribua atividades e acompanhe o progresso de alfabetização digital dos seus alunos.
                    </p>
                  </div>
                </div>

                {/* Dropdown Menu Actions */}
                <div className="p-4 border-t border-slate-100 flex flex-col gap-1.5 bg-white">
                  <button 
                    onClick={() => { setActiveTab('tasks'); setShowProfileMenu(false); }}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-50 transition-colors text-sm text-slate-700 font-bold border-none bg-transparent cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">task</span>
                      Ver Minhas Tarefas
                    </span>
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>
                  
                  <button 
                    onClick={() => { setShowProfileMenu(false); alert('Funcionalidade de edição de perfil em breve!'); }}
                    className="w-full flex items-center gap-2 p-3.5 rounded-2xl hover:bg-slate-50 transition-colors text-sm text-slate-700 font-bold border-none bg-transparent cursor-pointer text-left"
                  >
                    <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
                    Editar Perfil
                  </button>
                  
                  <button 
                    onClick={() => { setShowProfileMenu(false); setShowSettingsModal(true); }}
                    className="w-full flex items-center gap-2 p-3.5 rounded-2xl hover:bg-slate-50 transition-colors text-sm text-slate-700 font-bold border-none bg-transparent cursor-pointer text-left"
                  >
                    <span className="material-symbols-outlined text-[18px]">settings</span>
                    Configurações
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

      {/* Mobile Sidebar Overlay Drawer (Exact match to user's layout) */}
      <div className={`fixed inset-0 z-50 flex md:hidden transition-all duration-300 ${isMobileSidebarOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div 
          onClick={() => setIsMobileSidebarOpen(false)} 
          className={`fixed inset-0 bg-slate-900/45 backdrop-blur-xs transition-opacity duration-300 ${
            isMobileSidebarOpen ? 'opacity-100' : 'opacity-0'
          }`}
        ></div>
        
        <div 
          className={`relative w-[280px] sm:w-[320px] shrink-0 bg-white h-full shadow-2xl p-6 flex flex-col justify-between text-left z-10 transition-transform duration-300 ease-out ${
            isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
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
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 active:scale-95 transition-all border-none bg-transparent cursor-pointer flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <nav className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => { setActiveTab('home'); setSelectedTaskDetails(null); setIsMobileSidebarOpen(false); }}
                className={`flex items-center gap-3 px-4 py-3 font-bold rounded-xl border-none cursor-pointer w-full text-left transition-all ${
                  activeTab === 'home' ? 'bg-blue-50 text-blue-600' : 'bg-transparent text-slate-600 hover:bg-slate-50'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" className="shrink-0"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                Início
              </button>
              <button
                onClick={() => { setActiveTab('students'); setSelectedTaskDetails(null); setIsMobileSidebarOpen(false); }}
                className={`flex items-center gap-3 px-4 py-3 font-bold rounded-xl border-none cursor-pointer w-full text-left transition-all ${
                  activeTab === 'students' ? 'bg-blue-50 text-blue-600' : 'bg-transparent text-slate-600 hover:bg-slate-50'
                }`}
              >
                <img 
                  src="/icones/usuarios.svg" 
                  className="w-[18px] h-[18px] object-contain shrink-0"
                  style={{ filter: activeTab === 'students' ? 'brightness(0) invert(1)' : 'none' }}
                  alt="Alunos"
                />
                Alunos
              </button>
              <button
                onClick={() => { setActiveTab('tasks'); setSelectedTaskDetails(null); setIsMobileSidebarOpen(false); }}
                className={`flex items-center gap-3 px-4 py-3 font-bold rounded-xl border-none cursor-pointer w-full text-left transition-all ${
                  activeTab === 'tasks' ? 'bg-blue-50 text-blue-600' : 'bg-transparent text-slate-600 hover:bg-slate-50'
                }`}
              >
                <img 
                  src="/icones/tarefas_totais.svg" 
                  className="w-[18px] h-[18px] object-contain shrink-0"
                  style={{ filter: activeTab === 'tasks' ? 'brightness(0) invert(1)' : 'none' }}
                  alt="Tarefas"
                />
                Tarefas
              </button>
              <button
                onClick={() => { setActiveTab('access'); setSelectedTaskDetails(null); setIsMobileSidebarOpen(false); }}
                className={`flex items-center gap-3 px-4 py-3 font-bold rounded-xl border-none cursor-pointer w-full text-left transition-all ${
                  activeTab === 'access' ? 'bg-blue-50 text-blue-600' : 'bg-transparent text-slate-600 hover:bg-slate-50'
                }`}
              >
                <img 
                  src="/icones/chave.svg" 
                  className="w-[18px] h-[18px] object-contain shrink-0"
                  style={{ filter: activeTab === 'access' ? 'brightness(0) invert(1)' : 'none' }}
                  alt="Acessos"
                />
                Acessos
              </button>
            </nav>
          </div>

          <div className="space-y-4">
            <button 
              onClick={() => { setIsMobileSidebarOpen(false); alert('Para obter ajuda, entre em contato em contato.elefusion@gmail.com'); }}
              className="flex items-center gap-3 px-4 py-3 text-slate-500 text-sm font-semibold rounded-xl hover:bg-slate-50 border-none bg-transparent cursor-pointer w-full text-left"
            >
              Ajuda
            </button>
            <button 
              onClick={() => { setIsMobileSidebarOpen(false); onLogout(); }}
              className="flex items-center gap-3 px-4 py-3 text-red-600 text-sm font-bold rounded-xl hover:bg-red-50 border-none bg-transparent cursor-pointer w-full text-left"
            >
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Navigation Sidebar (Original, untouched) */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 flex-col p-6 z-40 bg-white border-r border-gray-100 h-screen w-64 justify-between">
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
              onClick={() => { setActiveTab('home'); setSelectedTaskDetails(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 font-bold rounded-xl border-none cursor-pointer text-left transition-all ${
                activeTab === 'home'
                  ? 'bg-[#0073e0] text-white'
                  : 'bg-transparent text-slate-600 hover:bg-slate-50'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" className="shrink-0"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              <span className="text-sm">Início</span>
            </button>
            
            <button
              onClick={() => { setActiveTab('students'); setSelectedTaskDetails(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 font-bold rounded-xl border-none cursor-pointer text-left transition-all ${
                activeTab === 'students'
                  ? 'bg-[#0073e0] text-white'
                  : 'bg-transparent text-slate-600 hover:bg-slate-50'
              }`}
            >
              <img 
                src="/icones/usuarios.svg" 
                className="w-[18px] h-[18px] object-contain shrink-0"
                style={{ filter: activeTab === 'students' ? 'brightness(0) invert(1)' : 'none' }}
                alt="Alunos"
              />
              <span className="text-sm">Alunos</span>
            </button>

            <button
              onClick={() => { setActiveTab('tasks'); setSelectedTaskDetails(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 font-bold rounded-xl border-none cursor-pointer text-left transition-all ${
                activeTab === 'tasks'
                  ? 'bg-[#0073e0] text-white'
                  : 'bg-transparent text-slate-600 hover:bg-slate-50'
              }`}
            >
              <img 
                src="/icones/tarefas_totais.svg" 
                className="w-[18px] h-[18px] object-contain shrink-0"
                style={{ filter: activeTab === 'tasks' ? 'brightness(0) invert(1)' : 'none' }}
                alt="Tarefas"
              />
              <span className="text-sm">Tarefas</span>
            </button>

            <button
              onClick={() => { setActiveTab('access'); setSelectedTaskDetails(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 font-bold rounded-xl border-none cursor-pointer text-left transition-all ${
                activeTab === 'access'
                  ? 'bg-[#0073e0] text-white'
                  : 'bg-transparent text-slate-600 hover:bg-slate-50'
              }`}
            >
              <img 
                src="/icones/chave.svg" 
                className="w-[18px] h-[18px] object-contain shrink-0"
                style={{ filter: activeTab === 'access' ? 'brightness(0) invert(1)' : 'none' }}
                alt="Acessos"
              />
              <span className="text-sm">Acessos</span>
            </button>
          </nav>
        </div>
        
        <div className="border-t border-gray-100 pt-4 flex flex-col gap-2">
          <button
            onClick={() => alert('Para obter ajuda, entre em contato em contato.elefusion@gmail.com')}
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

      {/* Main Content Area */}
      <main className="ml-0 md:ml-64 min-h-screen flex flex-col">
        {/* Mobile Header (Exact match to user's layout) */}
        <header className="sticky top-0 bg-white border-b border-gray-100 py-3.5 px-4 sm:px-6 z-40 shadow-xs block md:hidden">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <button 
                onClick={() => setIsMobileSidebarOpen(true)}
                className="p-2 rounded-xl hover:bg-slate-100 active:scale-95 transition-all border-none bg-transparent cursor-pointer flex items-center justify-center text-slate-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="text-slate-700 w-6 h-6"><line x1="4" x2="20" y1="12" y2="12"></line><line x1="4" x2="20" y1="6" y2="6"></line><line x1="4" x2="20" y1="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowNotificationsDropdown(prev => !prev)}
                className="bell-btn-mobile p-0 border-none bg-transparent cursor-pointer flex items-center justify-center"
              >
                <img src="/icones/notificações.svg" alt="Notificações" className="w-[20px] h-[20px] object-contain" />
              </button>
              
              <button
                onClick={() => setShowProfileMenu(prev => !prev)}
                className="avatar-btn-mobile w-9 h-9 rounded-full overflow-hidden border border-gray-200 p-0 bg-transparent cursor-pointer flex items-center justify-center"
              >
                <img src="/padrao/foto-do-professor.avif" alt="Teatcher" className="w-full h-full object-cover" />
              </button>
            </div>
          </div>
        </header>

        {/* Desktop Header (Original, untouched) */}
        <header className="hidden md:flex items-center justify-between px-margin-desktop w-full sticky top-0 z-50 bg-white/80 backdrop-blur-md h-16 border-b border-gray-100">
          <div className="flex items-center gap-md flex-1">
            <h2 className="text-lg text-slate-800 font-extrabold md:block hidden">Área do Teatcher</h2>
            {activeTab === 'students' && (
              <div className="flex items-center gap-2 ml-4">
                <button 
                  onClick={() => setIsAddStudentOpen(true)}
                  className="bg-[#0073e0] text-white px-5 py-2.5 rounded-full font-bold flex items-center gap-2 hover:bg-[#005ba4] transition-all shadow-sm border-none cursor-pointer text-xs"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" className="text-white shrink-0"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  Adicionar Aluno
                </button>
                <button 
                  onClick={handleCloudSync}
                  className="w-10 h-10 bg-white border border-slate-200 hover:bg-[#f0f4f9] text-[#0073e0] rounded-full transition-all shadow-xs flex items-center justify-center cursor-pointer active:scale-95" 
                  title="Sincronizar Cloud"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" className="text-[#0073e0]"><path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.42-1.04-1.21-1.88-2.2-2.4A5.5 5.5 0 0 0 4 11.5c-2 .5-4 2.2-4 4.5A3.5 3.5 0 0 0 3.5 19z"></path></svg>
                </button>
                <button 
                  onClick={handleDeleteSelected}
                  className="w-10 h-10 bg-white border border-slate-200 hover:bg-[#fce8e6] text-[#ea4335] rounded-full transition-all shadow-xs flex items-center justify-center cursor-pointer active:scale-95" 
                  title="Excluir Selecionados"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" className="text-[#ea4335]"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4 relative">
            {/* Notifications Bell Button */}
            <div className="relative">
              <button 
                ref={bellButtonRef}
                onClick={() => setShowNotificationsDropdown(prev => !prev)}
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 text-slate-600 transition-all active:scale-95 cursor-pointer border-none bg-transparent relative"
                title="Notificações"
              >
                <img src="/icones/notificações.svg" alt="Notificações" className="w-[20px] h-[20px] object-contain" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#10B981] rounded-full animate-pulse"></span>
              </button>
            </div>
            
            {/* Settings Cog Wheel Button (Instead of Search Lupa) */}
            <button 
              onClick={() => setShowSettingsModal(true)}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 text-slate-600 transition-all active:scale-95 cursor-pointer border-none bg-transparent"
              title="Configurações"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="text-slate-600"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>
            
            <div className="w-px h-6 bg-gray-100 hidden md:block mx-1"></div>
 
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
                  src="/padrao/foto-do-professor.avif"
                />
              </button>
 
              {/* Notifications Dropdown for Teacher */}
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
                    className="absolute right-0 top-[calc(100%+4px)] z-[300] w-[420px] max-w-[calc(100vw-32px)] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden text-left origin-top-right hidden md:flex"
                  >

                      {/* Dropdown Header */}
                      <div className="p-5 flex justify-between items-center border-b border-slate-100 bg-white select-none">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                          Notificações
                        </h2>
                        
                        <div className="flex bg-slate-100 p-1 rounded-xl items-center gap-1">
                          <button 
                            onClick={() => setNotificationFilter('all')}
                            className={`px-4 py-1 text-sm rounded-lg transition-all cursor-pointer border-none font-semibold ${
                              notificationFilter === 'all' 
                                ? 'bg-white shadow-sm text-slate-900' 
                                : 'bg-transparent text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            Todas
                          </button>
                        </div>
                      </div>

                      {/* Dropdown Content */}
                      <div className="overflow-y-auto divide-y divide-slate-50 custom-scrollbar max-h-[340px] bg-white">
                        {[
                          {
                            id: 'notif-1',
                            title: 'Nova entrega!',
                            message: 'Ana Beatriz Silva concluiu "Exercício de Numerais Multilingue".',
                            createdAt: new Date().toISOString(),
                            isRead: false,
                          },
                          {
                            id: 'notif-2',
                            title: 'Tarefa criada!',
                            message: 'Você criou com sucesso a tarefa "Tarefa de cores".',
                            createdAt: new Date(Date.now() - 3600000).toISOString(),
                            isRead: true,
                          }
                        ].map((notif) => (
                          <div 
                            key={notif.id}
                            className={`p-5 flex gap-4 transition-colors relative text-left bg-white`}
                          >
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-indigo-500 text-[18px]">
                                {notif.title.includes('entrega') ? 'assignment_turned_in' : 'assignment_add'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-2">
                                <p className="font-bold text-xs text-slate-800 leading-tight truncate">{notif.title}</p>
                                <span className="text-[9px] text-slate-400 font-medium shrink-0">agora</span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-1 leading-normal">{notif.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Profile Dropdown for Teacher */}
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
                      className="absolute right-0 top-[calc(100%+4px)] z-[300] w-[420px] max-w-[calc(100vw-32px)] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[600px] overflow-hidden text-left origin-top-right hidden md:flex"
                    >
                      {/* Header */}
                      <div className="py-4 px-5 flex justify-between items-center border-b border-slate-100 bg-white">
                        <h2 className="text-lg font-bold text-slate-900">Perfil do Teatcher</h2>
                        <span className="material-symbols-outlined text-slate-400">school</span>
                      </div>
 
                      {/* Scrollable Content */}
                      <div className="overflow-y-auto bg-white pb-4">
                        {/* User info details */}
                        <div className="py-3 px-5 flex gap-4 items-center border-b border-slate-100 bg-slate-50/30 select-none">
                          <div className="relative shrink-0">
                            <img 
                              alt="Avatar" 
                              className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500/20" 
                              src="/padrao/foto-do-professor.avif" 
                            />
                            <div className="absolute -right-1 -bottom-1 bg-[#10B981] w-4.5 h-4.5 rounded-full border-2 border-white flex items-center justify-center">
                              <span className="w-2 h-2 bg-emerald-100 rounded-full animate-pulse" />
                            </div>
                          </div>
                          <div className="text-left min-w-0">
                            <p className="font-bold text-base text-slate-900 truncate">{teacherName}</p>
                            <p className="text-xs text-slate-400 mt-1 truncate">{teacherEmail}</p>
                          </div>
                        </div>
 
                        {/* Progress/Summary Card for Teacher */}
                        <div className="py-3 px-5 flex flex-col gap-2">
                          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-xs font-bold text-slate-700">Função: Teatcher</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">Teatcher de inglês e idiomas</p>
                              </div>
                              <span className="material-symbols-outlined text-indigo-500 text-lg">verified_user</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                              Gerencie tarefas, atribua atividades e acompanhe o progresso de alfabetização digital dos seus alunos.
                            </p>
                          </div>
                        </div>
 
                        {/* Dropdown Menu Actions */}
                        <div className="px-4 py-2 border-t border-slate-100 flex flex-col gap-1 bg-white">
                          <button 
                            onClick={() => { setActiveTab('tasks'); setShowProfileMenu(false); }}
                            className="w-full flex items-center justify-between py-2 px-3 rounded-xl hover:bg-slate-50 transition-colors text-sm text-slate-700 font-bold border-none bg-transparent cursor-pointer"
                          >
                            <span className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[18px]">task</span>
                              Ver Minhas Tarefas
                            </span>
                            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                          </button>
                          
                          <button 
                            onClick={() => { setShowProfileMenu(false); alert('Funcionalidade de edição de perfil em breve!'); }}
                            className="w-full flex items-center gap-2 py-2 px-3 rounded-xl hover:bg-slate-50 transition-colors text-sm text-slate-700 font-bold border-none bg-transparent cursor-pointer text-left"
                          >
                            <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
                            Editar Perfil
                          </button>
                          
                          <button 
                            onClick={() => { setShowProfileMenu(false); setShowSettingsModal(true); }}
                            className="w-full flex items-center gap-2 py-2 px-3 rounded-xl hover:bg-slate-50 transition-colors text-sm text-slate-700 font-bold border-none bg-transparent cursor-pointer text-left"
                          >
                            <span className="material-symbols-outlined text-[18px]">settings</span>
                            Configurações
                          </button>
                          
                          <button 
                            onClick={() => { setShowProfileMenu(false); onLogout(); }}
                            className="w-full flex items-center gap-2 py-2 px-3 rounded-xl hover:bg-red-50 transition-colors text-sm text-red-500 font-bold border-none bg-transparent cursor-pointer text-left"
                          >
                            <span className="material-symbols-outlined text-[18px]">logout</span>
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

        {/* Content Body */}
        <main className="p-4 sm:p-6 md:p-margin-desktop max-w-[1200px] mx-auto w-full flex-1">
          
          {/* TAB 1: HOME */}
          {activeTab === 'home' && (
            <>
              {/* DESKTOP VERSION (Identical to original) */}
              <div className="hidden md:block space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm text-left">
                  <div>
                    <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Bem-vindo de volta, Teatcher! 👋</h2>
                    <p className="text-sm text-slate-500 mt-1">Aqui está a visão geral da alfabetização bilingue de suas turmas.</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsDraftCreator(false);
                      setIsAddTaskOpen(true);
                    }}
                    className="flex items-center justify-center gap-2 px-5 py-3.5 bg-[#005bb3] hover:bg-[#00468c] text-white text-sm font-bold rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer border-none"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" className="text-white shrink-0"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Adicionar Tarefa
                  </button>
                </div>

                {/* Bento Grid Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                  {/* Card 1 */}
                  <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-4 text-left">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <img src="/icones/usuarios.svg" className="w-6 h-6 object-contain" alt="Alunos Ativos" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-slate-900 leading-none">{students.length}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">Alunos Ativos</p>
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-4 text-left">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <img src="/icones/tarefas_totais.svg" className="w-6 h-6 object-contain" alt="Tarefas Totais" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-slate-900 leading-none">{tasks.length}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">Tarefas Totais</p>
                    </div>
                  </div>

                  {/* Card 3 */}
                  <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-4 text-left">
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                      <img src="/icones/tarefas_pendentes.svg" className="w-6 h-6 object-contain" alt="Entregas Pendentes" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-slate-900 leading-none">{submissions.length}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">Entregas Pendentes</p>
                    </div>
                  </div>

                  {/* Card 4 */}
                  <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-4 text-left">
                    <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                      <img src="/icones/chave.svg" className="w-6 h-6 object-contain" alt="Códigos Ativos" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-slate-900 leading-none">
                        {activeCodes.filter(c => c.expiresAt > Date.now()).length}
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">Códigos Ativos</p>
                    </div>
                  </div>

                  {/* Card 5 */}
                  <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-4 text-left">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <img src="/icones/tarefas_concluidas.svg" className="w-6 h-6 object-contain" alt="Tarefas Concluídas" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-slate-900 leading-none">
                        {tasks.filter(t => t.status === 'completed').length}
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">Tarefas Concluídas</p>
                    </div>
                  </div>
                </div>

                {/* Submissions Section */}
                <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden text-left">
                  <div className="p-6 border-b border-gray-100">
                    <h3 className="font-extrabold text-lg text-slate-900">Submissões Recentes dos Alunos</h3>
                    <p className="text-xs text-slate-400 mt-1">Clique em Revisar para abrir a simulação tridimensional do ábaco</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-slate-50/20">
                    {submissions.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-sm col-span-full">
                        Nenhuma submissão recebida até o momento.
                      </div>
                    ) : (
                      submissions.map((sub, idx) => {
                        const studentInfo = students.find(s => s.name.toLowerCase() === sub.studentName.toLowerCase()) || 
                                            INITIAL_STUDENTS.find(s => s.name.toLowerCase() === sub.studentName.toLowerCase());
                        const avatarUrl = studentInfo ? studentInfo.img : `/padrao/foto-do-perfil.avif`;
                        const isReviewed = sub.reviewed || false;

                        return (
                          <div 
                            key={sub.id} 
                            className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[220px] relative group"
                          >
                            {/* Top Header Row */}
                            <div className="flex justify-between items-center w-full mb-4 select-none">
                              <span className="bg-sky-50 text-sky-600 text-[11px] font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wider">
                                {sub.spelledWords.length} {sub.spelledWords.length === 1 ? 'Palavra' : 'Palavras'}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-black ${isReviewed ? 'text-emerald-600' : 'text-slate-400'}`}>
                                  {isReviewed ? '100%' : 'Pendente'}
                                </span>
                                <div className="relative w-5 h-5 shrink-0 flex items-center justify-center">
                                  {isReviewed ? (
                                    <svg className="w-full h-full text-emerald-500" viewBox="0 0 36 36">
                                      <path
                                        className="text-emerald-100"
                                        strokeWidth="4"
                                        stroke="currentColor"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                      />
                                      <path
                                        className="text-emerald-500"
                                        strokeWidth="4"
                                        strokeDasharray="100, 100"
                                        strokeLinecap="round"
                                        stroke="currentColor"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                      />
                                    </svg>
                                  ) : (
                                    <svg className="w-full h-full text-slate-300" viewBox="0 0 36 36">
                                      <path
                                        className="text-slate-100"
                                        strokeWidth="4"
                                        stroke="currentColor"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                      />
                                      <path
                                        className="text-slate-300"
                                        strokeWidth="4"
                                        strokeDasharray="25, 100"
                                        strokeLinecap="round"
                                        stroke="currentColor"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                      />
                                    </svg>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Title & Description Section */}
                            <div className="text-left mb-4 flex-grow">
                              <h4 className="font-display font-black text-slate-900 text-base leading-tight group-hover:text-primary transition-colors">
                                {sub.taskTitle}
                              </h4>
                              <p className="text-[11px] text-slate-400 font-semibold mt-1.5">
                                {new Date(sub.submittedAt).toLocaleDateString('pt-BR')} às {new Date(sub.submittedAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                              </p>
                            </div>

                            {/* Files Attachments if any */}
                            {sub.taskFiles && sub.taskFiles.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-4 font-sans text-left">
                                {sub.taskFiles.map((file, fIdx) => (
                                  file.url ? (
                                    <a
                                      key={fIdx}
                                      href={file.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-lg text-[9px] font-bold text-slate-600 transition-all no-underline"
                                      title={`Abrir ${file.name}`}
                                    >
                                      <span className="material-symbols-outlined text-[11px] text-slate-400">download</span>
                                      <span className="truncate max-w-[80px]">{file.name}</span>
                                    </a>
                                  ) : (
                                    <span
                                      key={fIdx}
                                      className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[9px] font-semibold text-slate-400"
                                      title={`${file.name} (Salvo apenas localmente)`}
                                    >
                                      <span className="material-symbols-outlined text-[11px]">file_present</span>
                                      <span className="truncate max-w-[80px]">{file.name}</span>
                                    </span>
                                  )
                                ))}
                              </div>
                            )}

                            {/* Bottom Row: Profile Photo & CTA Button */}
                            <div className="flex justify-between items-center w-full pt-4 border-t border-slate-100 mt-auto select-none">
                              <div className="flex items-center gap-2">
                                <div className="relative w-8 h-8 rounded-full border-2 border-white shadow-xs overflow-hidden bg-slate-100 shrink-0">
                                  <img 
                                    src={avatarUrl} 
                                    alt={sub.studentName} 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(sub.studentName)}&background=random`;
                                    }}
                                  />
                                </div>
                                <span className="text-[11px] text-slate-800 font-extrabold max-w-[90px] truncate">
                                  {sub.studentName}
                                </span>
                              </div>

                              <button
                                onClick={() => onLaunchReviewMode(sub)}
                                className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-xl transition-all active:scale-95 cursor-pointer border-none ${
                                  isReviewed 
                                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' 
                                    : 'bg-[#0004fd] hover:bg-[#0003c7] text-white shadow-sm hover:shadow'
                                }`}
                                title="Revisar Ábaco"
                              >
                                <span className="material-symbols-outlined text-[18px]">visibility</span>
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* MOBILE VERSION (Our beautifully designed, exact match mobile design) */}
              <div className="block md:hidden space-y-6">
                {/* Mobile Title */}
                <div className="mb-1 text-left">
                  <h2 className="text-xl font-bold text-slate-900">Área do Teatcher</h2>
                </div>

                <div className="flex flex-col gap-4 bg-white p-5 rounded-[24px] border border-slate-200 shadow-sm text-left">
                  <div>
                    <h3 className="text-xl font-extrabold tracking-tight text-slate-950 flex items-center gap-2">
                      Bem-vindo de volta, Teatcher! 👋
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Aqui está a visão geral da alfabetização bilíngue de suas turmas.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsDraftCreator(false);
                      setIsAddTaskOpen(true);
                    }}
                    className="inline-flex items-center justify-center gap-2 bg-[#005ba4] hover:bg-[#004780] text-white px-5 py-3.5 rounded-2xl font-bold text-sm shadow-sm transition-all active:scale-95 w-full shrink-0 border-none cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Adicionar Tarefa
                  </button>
                </div>

                {/* Bento Grid Stats */}
                <div className="grid grid-cols-2 gap-4 w-full">
                  {/* Card 1 */}
                  <div className="bg-white border border-slate-200 p-4 rounded-[24px] shadow-sm flex flex-col gap-2.5 text-left">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0 flex items-center justify-center">
                        <img src="/icones/usuarios.svg" className="w-[20px] h-[20px] object-contain" alt="Alunos Ativos" />
                      </div>
                      <div className="text-2xl font-black text-slate-950 leading-none">{students.length}</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Alunos Ativos</div>
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div className="bg-white border border-slate-200 p-4 rounded-[24px] shadow-sm flex flex-col gap-2.5 text-left">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shrink-0 flex items-center justify-center">
                        <img src="/icones/tarefas_totais.svg" className="w-[20px] h-[20px] object-contain" alt="Tarefas Totais" />
                      </div>
                      <div className="text-2xl font-black text-slate-950 leading-none">{tasks.length}</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Tarefas Totais</div>
                    </div>
                  </div>

                  {/* Card 3 */}
                  <div className="bg-white border border-slate-200 p-4 rounded-[24px] shadow-sm flex flex-col gap-2.5 text-left">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-orange-50 text-orange-600 rounded-xl shrink-0 flex items-center justify-center">
                        <img src="/icones/tarefas_pendentes.svg" className="w-[20px] h-[20px] object-contain" alt="Entregas Pendentes" />
                      </div>
                      <div className="text-2xl font-black text-slate-950 leading-none">{submissions.length}</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Entregas Pendentes</div>
                    </div>
                  </div>

                  {/* Card 4 */}
                  <div className="bg-white border border-slate-200 p-4 rounded-[24px] shadow-sm flex flex-col gap-2.5 text-left">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-green-50 text-green-600 rounded-xl shrink-0 flex items-center justify-center">
                        <img src="/icones/chave.svg" className="w-[20px] h-[20px] object-contain" alt="Códigos Ativos" />
                      </div>
                      <div className="text-2xl font-black text-slate-950 leading-none">
                        {activeCodes.filter(c => c.expiresAt > Date.now()).length}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Códigos Ativos</div>
                    </div>
                  </div>

                  {/* Card 5 */}
                  <div className="bg-white border border-slate-200 p-4 rounded-[24px] shadow-sm flex flex-col gap-2.5 text-left col-span-2">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0 flex items-center justify-center">
                        <img src="/icones/tarefas_concluidas.svg" className="w-[20px] h-[20px] object-contain" alt="Tarefas Concluídas" />
                      </div>
                      <div className="text-2xl font-black text-slate-950 leading-none">
                        {tasks.filter(t => t.status === 'completed').length}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Tarefas Concluídas</div>
                    </div>
                  </div>
                </div>

                {/* Submissions Section */}
                <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden text-left">
                  <div className="p-5 border-b border-slate-100">
                    <h3 className="font-extrabold text-lg text-slate-950">Submissões Recentes dos Alunos</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Clique em Revisar para abrir a simulação tridimensional do ábaco</p>
                  </div>
                  <div className="flex flex-col gap-3 p-4 bg-white">
                    {submissions.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-sm">
                        Nenhuma submissão recebida até o momento.
                      </div>
                    ) : (
                      submissions.map((sub, idx) => {
                        const studentInfo = students.find(s => s.name.toLowerCase() === sub.studentName.toLowerCase()) || 
                                            INITIAL_STUDENTS.find(s => s.name.toLowerCase() === sub.studentName.toLowerCase());
                        const avatarUrl = studentInfo ? studentInfo.img : `/padrao/foto-do-perfil.avif`;
                        const isReviewed = sub.reviewed || false;

                        return (
                          <div 
                            key={sub.id} 
                            className="bg-white rounded-[28px] border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[210px] relative group text-left"
                          >
                            {/* Top Header Row */}
                            <div className="flex justify-between items-center w-full mb-3 select-none">
                              <span className="bg-sky-50 text-sky-600 text-[10px] font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wider">
                                {sub.spelledWords.length} {sub.spelledWords.length === 1 ? 'Palavra' : 'Palavras'}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[11px] font-black ${isReviewed ? 'text-emerald-600' : 'text-slate-400'}`}>
                                  {isReviewed ? '100%' : 'Pendente'}
                                </span>
                                <div className="relative w-4.5 h-4.5 shrink-0 flex items-center justify-center">
                                  {isReviewed ? (
                                    <svg className="w-full h-full text-emerald-500" viewBox="0 0 36 36">
                                      <path
                                        className="text-emerald-100"
                                        strokeWidth="4"
                                        stroke="currentColor"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                      />
                                      <path
                                        className="text-emerald-500"
                                        strokeWidth="4"
                                        strokeDasharray="100, 100"
                                        strokeLinecap="round"
                                        stroke="currentColor"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                      />
                                    </svg>
                                  ) : (
                                    <svg className="w-full h-full text-slate-300" viewBox="0 0 36 36">
                                      <path
                                        className="text-slate-100"
                                        strokeWidth="4"
                                        stroke="currentColor"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                      />
                                      <path
                                        className="text-slate-300"
                                        strokeWidth="4"
                                        strokeDasharray="25, 100"
                                        strokeLinecap="round"
                                        stroke="currentColor"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                      />
                                    </svg>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Title & Description Section */}
                            <div className="text-left mb-3 flex-grow">
                              <h4 className="font-display font-black text-slate-900 text-sm leading-tight group-hover:text-primary transition-colors">
                                {sub.taskTitle}
                              </h4>
                              <p className="text-[10px] text-slate-400 font-semibold mt-1">
                                {new Date(sub.submittedAt).toLocaleDateString('pt-BR')} às {new Date(sub.submittedAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                              </p>
                            </div>

                            {/* Files Attachments if any */}
                            {sub.taskFiles && sub.taskFiles.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3 font-sans text-left">
                                {sub.taskFiles.map((file, fIdx) => (
                                  file.url ? (
                                    <a
                                      key={fIdx}
                                      href={file.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 px-2 py-0.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-lg text-[8px] font-bold text-slate-600 transition-all no-underline"
                                      title={`Abrir ${file.name}`}
                                    >
                                      <span className="material-symbols-outlined text-[10px] text-slate-400">download</span>
                                      <span className="truncate max-w-[70px]">{file.name}</span>
                                    </a>
                                  ) : (
                                    <span
                                      key={fIdx}
                                      className="flex items-center gap-1 px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-lg text-[8px] font-semibold text-slate-400"
                                      title={`${file.name} (Salvo apenas localmente)`}
                                    >
                                      <span className="material-symbols-outlined text-[10px]">file_present</span>
                                      <span className="truncate max-w-[70px]">{file.name}</span>
                                    </span>
                                  )
                                ))}
                              </div>
                            )}

                            {/* Bottom Row: Profile Photo & CTA Button */}
                            <div className="flex justify-between items-center w-full pt-3 border-t border-slate-100 mt-auto select-none">
                              <div className="flex items-center gap-1.5">
                                <div className="relative w-7 h-7 rounded-full border border-slate-100 shadow-xs overflow-hidden bg-slate-100 shrink-0">
                                  <img 
                                    src={avatarUrl} 
                                    alt={sub.studentName} 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(sub.studentName)}&background=random`;
                                    }}
                                  />
                                </div>
                                <span className="text-[10px] text-slate-800 font-extrabold max-w-[80px] truncate">
                                  {sub.studentName}
                                </span>
                              </div>

                              <button
                                onClick={() => onLaunchReviewMode(sub)}
                                className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-xl transition-all active:scale-95 cursor-pointer border-none ${
                                  isReviewed 
                                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' 
                                    : 'bg-[#0004fd] hover:bg-[#0003c7] text-white shadow-sm'
                                }`}
                                title="Revisar"
                              >
                                <span className="material-symbols-outlined text-[16px]">visibility</span>
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: TASKS */}
          {activeTab === 'tasks' && (
            selectedTaskDetails ? (
              <div className="space-y-xl animate-fade-in select-text">
                  {/* Breadcrumbs */}
                  <nav className="flex items-center gap-sm text-label-sm text-outline mb-md select-none">
                    <span onClick={() => { setActiveTab('tasks'); setSelectedTaskDetails(null); }} className="cursor-pointer hover:text-primary transition-colors">Tarefas</span>
                    <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                    <span onClick={() => setSelectedTaskDetails(null)} className="cursor-pointer hover:text-primary transition-colors font-semibold">Minhas Tarefas</span>
                    <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                    <span style={{ color: '#0075e0' }} className="font-bold">Detalhes</span>
                  </nav>

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 text-left">
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-2">{selectedTaskDetails.title}</h1>
                    <p className="text-sm sm:text-base text-slate-500 font-medium mt-1 mb-5 max-w-3xl leading-relaxed">{selectedTaskDetails.description}</p>
                    <div className="flex flex-wrap items-center gap-md">
                      <div className="flex items-center gap-xs text-on-surface-variant">
                        <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                        <span className="text-body-md">Entrega: <span className="font-semibold">{selectedTaskDetails.dueDate ? new Date(selectedTaskDetails.dueDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Sem prazo'}</span></span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-xs ${
                        selectedTaskDetails.status === 'active' 
                          ? 'bg-primary-fixed text-on-primary-fixed-variant' 
                          : selectedTaskDetails.status === 'draft'
                          ? 'bg-secondary-fixed text-on-secondary-fixed-variant'
                          : 'bg-surface-container-high text-on-surface-variant'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          selectedTaskDetails.status === 'active' ? 'bg-primary animate-pulse' : 'bg-secondary'
                        }`}></span>
                        {selectedTaskDetails.status === 'active' ? 'Ativa' : selectedTaskDetails.status === 'draft' ? 'Rascunho' : 'Arquivada'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-sm self-start shrink-0 select-none">
                    <button 
                      onClick={() => setEditingTask(selectedTaskDetails)}
                      className="flex items-center justify-center w-10 h-10 border border-outline-variant rounded-lg text-primary hover:bg-surface-container-high transition-all cursor-pointer bg-white" 
                      title="Editar Tarefa"
                    >
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                    <button 
                      onClick={() => {
                        setIsAssigningStudentsDetails(selectedTaskDetails);
                        setTempDetailsAssignedStudentIds(selectedTaskDetails.assignedStudentIds || []);
                        setDetailsAssignSearchQuery('');
                        setShowSharePanel(false);
                        setShareTaskLinks({});
                      }}
                      className="flex items-center justify-center w-10 h-10 bg-primary text-on-primary rounded-lg shadow-sm hover:bg-primary-container transition-all active:scale-95 cursor-pointer border-none" 
                      title="Selecionar Alunos"
                    >
                      <span className="material-symbols-outlined">person_add</span>
                    </button>
                  </div>
                </div>

                {/* Summary Bento Grid Section */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-md mb-xl select-none">
                  {(() => {
                    const totalTargetWords = selectedTaskDetails.targetWords?.length || 0;
                    const completedStudentsCount = students.filter(s => {
                      const submission = submissions.find(
                        sub => sub.studentName === s.name && sub.taskTitle === selectedTaskDetails.title
                      );
                      const spelledCount = submission?.spelledWords?.length || 0;
                      return totalTargetWords > 0 && spelledCount >= totalTargetWords;
                    }).length;
                    
                    const percentFinished = students.length > 0 ? Math.round((completedStudentsCount / students.length) * 100) : 0;

                    return (
                      <div className="md:col-span-2 bg-white card-shadow rounded-xl p-lg flex flex-col justify-between">
                        <div>
                          <p className="text-label-md text-outline uppercase tracking-wider mb-sm">Progresso Geral</p>
                          <h3 className="text-headline-md text-on-surface font-extrabold">
                            {completedStudentsCount} de {students.length} Alunos concluíram
                          </h3>
                        </div>
                        <div className="mt-md">
                          <div className="flex justify-between items-end mb-xs">
                            <span className="text-label-md font-bold text-primary">
                              {percentFinished}% concluído
                            </span>
                          </div>
                          <div className="w-full bg-surface-container-high rounded-full h-3 overflow-hidden">
                            <div 
                              className="bg-primary h-3 rounded-full shadow-inner transition-all duration-500" 
                              style={{ width: `${percentFinished}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  
                  <div className="bg-white card-shadow rounded-xl p-lg flex flex-col justify-center items-center text-center">
                    <div className="bg-surface-container-low text-primary p-md rounded-full mb-md flex items-center justify-center">
                      <span className="material-symbols-outlined text-[32px] font-variation-settings-fill">schedule</span>
                    </div>
                    <p className="text-label-sm text-outline mb-xs">Prazo Restante</p>
                    <p className="font-headline-md text-on-surface font-extrabold">
                      {(() => {
                        if (!selectedTaskDetails.dueDate) return 'Sem prazo';
                        const daysLeft = Math.ceil((new Date(selectedTaskDetails.dueDate + 'T23:59:59').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                        return daysLeft > 0 ? `${daysLeft} Dias` : 'Expirado';
                      })()}
                    </p>
                  </div>
                  
                  <div className="bg-white card-shadow rounded-xl p-lg flex flex-col justify-center items-center text-center">
                    <div className="bg-surface-container-low text-primary p-md rounded-full mb-md flex items-center justify-center">
                      <span className="material-symbols-outlined text-[32px] font-variation-settings-fill">star</span>
                    </div>
                    <p className="text-label-sm text-outline mb-xs">Média da Turma</p>
                    <p className="font-headline-md text-on-surface font-extrabold">8.4 / 10</p>
                  </div>
                </div>

                {/* Students List Header */}
                <div className="flex items-center justify-between mb-lg">
                  <h4 className="text-on-surface text-headline-lg font-bold text-black font-extrabold">Atribuído aos alunos</h4>
                  
                  <div className="flex-1 max-w-md mx-md hidden lg:block">
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3 text-outline text-[20px]">search</span>
                      <input 
                        className="pl-10 pr-4 py-2 bg-white border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary w-full text-body-md font-display outline-none" 
                        placeholder="Buscar aluno..." 
                        type="text"
                        value={detailsStudentSearchQuery}
                        onChange={(e) => {
                          setDetailsStudentSearchQuery(e.target.value);
                          setDetailsStudentPage(1);
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-sm select-none">
                    <button className="p-2 border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors bg-white cursor-pointer flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">filter_list</span>
                    </button>
                    <button className="p-2 border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors bg-white cursor-pointer flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">grid_view</span>
                    </button>
                  </div>
                </div>

                {/* Student Cards Grid */}
                {(() => {
                  const filteredStudents = students.filter(s => {
                    const matchesSearch = s.name.toLowerCase().includes(detailsStudentSearchQuery.toLowerCase());
                    if (!matchesSearch) return false;
                    
                    const isExplicitlyAssigned = selectedTaskDetails.assignedStudentIds?.includes(s.id);
                    const hasSubmission = submissions.some(
                      sub => sub.studentName === s.name && sub.taskTitle === selectedTaskDetails.title
                    );
                    const hasLink = dbTaskLinks.some(
                      link => link.taskId === selectedTaskDetails.id && 
                      link.studentName.toLowerCase() === s.name.toLowerCase()
                    );
                    
                    return isExplicitlyAssigned || hasSubmission || hasLink;
                  });
                  
                  const pageSize = 6;
                  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;
                  const startIndex = (detailsStudentPage - 1) * pageSize;
                  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + pageSize);
                  
                  return (
                    <>
                      <div className="student-grid">
                        {paginatedStudents.map(student => {
                          const submission = submissions.find(
                            sub => sub.studentName === student.name && sub.taskTitle === selectedTaskDetails.title
                          );
                          
                          const targetWordsCount = selectedTaskDetails.targetWords?.length || 0;
                          const spelledWordsCount = submission?.spelledWords?.length || 0;
                          
                          const progress = targetWordsCount > 0 ? Math.min(100, Math.round((spelledWordsCount / targetWordsCount) * 100)) : 0;
                          const isCompleted = progress === 100;
                          const status = isCompleted 
                            ? 'completed' 
                            : progress > 0 
                            ? 'inprogress' 
                            : 'pending';
                          
                          return (
                            <div 
                              key={student.id} 
                              className="bg-white card-shadow rounded-xl p-md flex flex-col gap-md hover:border-primary transition-all group border border-outline-variant/60"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-md">
                                  <div className="relative shrink-0">
                                    <img 
                                      alt={student.name} 
                                      className="w-12 h-12 rounded-full object-cover border-2 border-surface-container-high" 
                                      src={student.img || "/padrao/foto-do-perfil.avif"}
                                      onError={(e) => {
                                        e.currentTarget.src = "/padrao/foto-do-perfil.avif";
                                      }}
                                    />
                                    <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                                      status === 'completed' ? 'bg-green-500' : status === 'inprogress' ? 'bg-blue-500' : 'bg-slate-400'
                                    }`}></span>
                                  </div>
                                  <div>
                                    <h5 className="font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-1 font-sans">{student.name}</h5>
                                    <p className="text-xs text-outline">
                                      {status === 'completed' 
                                        ? `Entregue em: ${new Date(submission!.submittedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`
                                        : status === 'inprogress'
                                        ? 'Em progresso...'
                                        : 'Não iniciada.'}
                                    </p>
                                  </div>
                                </div>
                                
                                {status === 'completed' ? (
                                  <span className="flex items-center gap-xs px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded uppercase shrink-0">
                                    <span className="material-symbols-outlined text-[14px] font-variation-settings-fill">check_circle</span>
                                  </span>
                                ) : status === 'inprogress' ? (
                                  <span className="flex items-center gap-xs px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase shrink-0">
                                    <span className="material-symbols-outlined text-[14px] font-variation-settings-fill">pending</span>
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-xs px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase shrink-0" title="Não iniciada.">
                                    <span className="material-symbols-outlined text-[14px]">circle</span>
                                  </span>
                                )}
                              </div>
                              
                              <div className="space-y-sm select-none">
                                <div className="flex justify-between text-[11px] font-bold">
                                  <span className="text-on-surface-variant">Progresso</span>
                                  <span className={status === 'completed' ? 'text-green-600' : status === 'inprogress' ? 'text-blue-600' : 'text-slate-500'}>
                                    {progress}%
                                  </span>
                                </div>
                                <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-2 rounded-full transition-all duration-300 ${
                                      status === 'completed' ? 'bg-green-500' : status === 'inprogress' ? 'bg-blue-500' : 'bg-slate-300'
                                    }`} 
                                    style={{ width: `${progress}%` }}
                                  ></div>
                                </div>
                              </div>
                              
                              {submission ? (
                                <button 
                                  type="button"
                                  onClick={() => onLaunchReviewMode(submission)}
                                  className={`w-full py-sm text-label-md font-bold rounded-lg transition-all cursor-pointer shrink-0 select-none flex items-center justify-center gap-1.5 border ${
                                    submission.reviewed 
                                      ? 'text-emerald-700 bg-emerald-50 border-emerald-300 hover:bg-emerald-100/80' 
                                      : 'text-primary border-primary hover:bg-primary hover:text-white bg-white'
                                  }`}
                                >
                                  {submission.reviewed ? (
                                    <>
                                      <span className="material-symbols-outlined text-[16px] font-variation-settings-fill">check_circle</span>
                                      Conferido
                                    </>
                                  ) : (
                                    'Conferir'
                                  )}
                                </button>
                              ) : (
                                <button 
                                  type="button"
                                  onClick={() => alert('O aluno ou aluna não realizou a tarefa ainda')}
                                  className="w-full py-sm text-label-md font-bold text-slate-400 border border-slate-200 rounded-lg bg-slate-50 cursor-not-allowed shrink-0 select-none"
                                >
                                  Conferir
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Pagination Footer */}
                      <div className="flex items-center justify-between mt-xl pt-lg border-t border-outline-variant select-none">
                        <p className="text-body-md text-on-surface-variant">
                          Mostrando {Math.min(filteredStudents.length, startIndex + 1)}-{Math.min(filteredStudents.length, startIndex + pageSize)} de {filteredStudents.length} alunos
                        </p>
                        
                        {totalPages > 1 && (
                          <div className="flex items-center gap-xs">
                            <button 
                              type="button"
                              onClick={() => { setDetailsStudentPage(prev => Math.max(1, prev - 1)); scrollToContentTop(); }}
                              disabled={detailsStudentPage === 1}
                              className="p-2 rounded-lg border border-outline-variant hover:bg-surface-container-high transition-colors disabled:opacity-50 cursor-pointer bg-white flex items-center justify-center"
                            >
                              <span className="material-symbols-outlined">chevron_left</span>
                            </button>
                            
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                              <button 
                                key={page}
                                type="button"
                                onClick={() => { setDetailsStudentPage(page); scrollToContentTop(); }}
                                className={`w-10 h-10 rounded-lg font-bold cursor-pointer transition-all ${
                                  detailsStudentPage === page 
                                    ? 'bg-primary text-on-primary border-none shadow' 
                                    : 'border border-outline-variant hover:bg-surface-container-high bg-white'
                                }`}
                              >
                                {page}
                              </button>
                            ))}
                            
                            <button 
                              type="button"
                              onClick={() => { setDetailsStudentPage(prev => Math.min(totalPages, prev + 1)); scrollToContentTop(); }}
                              disabled={detailsStudentPage === totalPages}
                              className="p-2 rounded-lg border border-outline-variant hover:bg-surface-container-high transition-colors disabled:opacity-50 cursor-pointer bg-white flex items-center justify-center"
                            >
                              <span className="material-symbols-outlined">chevron_right</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="space-y-xl animate-fade-in overflow-x-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-xl select-none gap-4">
                  <div className="min-w-0">
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Minhas Tarefas</h2>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-1">Gerencie e acompanhe o progresso das atividades enviadas.</p>
                  </div>
                  <div className="flex items-center gap-md flex-wrap shrink-0">
                    {/* Bulk Archive Button */}
                    <button
                      type="button"
                      onClick={handleBulkArchiveTasks}
                      disabled={filteredTasks.filter(t => t.status !== 'completed').length === 0}
                      className="flex items-center gap-xs px-md py-2.5 border border-[#c1c6d6] hover:bg-slate-50 text-slate-600 rounded-xl font-label-md text-label-md transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-white shadow-sm"
                      title="Arquivar todas as tarefas visíveis nesta aba"
                      style={{ border: '1px solid #c1c6d6', background: '#ffffff' }}
                    >
                      <span className="material-symbols-outlined text-[18px]">archive</span>
                      Arquivar Tudo
                    </button>

                    {/* Bulk Delete Button */}
                    <button
                      type="button"
                      onClick={handleBulkDeleteTasks}
                      disabled={filteredTasks.length === 0}
                      className="flex items-center gap-xs px-md py-2.5 border border-red-200 hover:bg-red-50 text-red-600 rounded-xl font-label-md text-label-md transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-white shadow-sm"
                      title="Excluir todas as tarefas visíveis nesta aba"
                      style={{ border: '1px solid #fca5a5', background: '#ffffff' }}
                    >
                      <img src="/icones/lixeira.svg" alt="Excluir" className="w-[18px] h-[18px] object-contain inline-block shrink-0" />
                      Excluir Tudo
                    </button>

                    {/* Nova Tarefa Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsDraftCreator(false);
                        setIsAddTaskOpen(true);
                      }}
                      className="flex items-center gap-sm px-lg py-md bg-primary text-on-primary rounded-xl font-label-md text-label-md hover:opacity-90 transition-all shadow-sm active:scale-95 cursor-pointer border-none"
                    >
                      <span className="material-symbols-outlined">add</span>
                      Nova Tarefa
                    </button>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-md mb-xl border-b border-outline-variant select-none overflow-x-auto no-scrollbar">
                  <button
                    onClick={() => { setTasksFilter('all'); setTasksPage(1); }}
                    className={`px-md py-sm font-label-md text-label-md border-b-2 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                      tasksFilter === 'all'
                        ? 'border-primary text-primary font-bold'
                        : 'border-transparent text-on-surface-variant hover:text-primary'
                    }`}
                  >
                    Todas
                  </button>
                  <button
                    onClick={() => { setTasksFilter('active'); setTasksPage(1); }}
                    className={`px-md py-sm font-label-md text-label-md border-b-2 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                      tasksFilter === 'active'
                        ? 'border-primary text-primary font-bold'
                        : 'border-transparent text-on-surface-variant hover:text-primary'
                    }`}
                  >
                    Ativas
                  </button>
                  <button
                    onClick={() => { setTasksFilter('draft'); setTasksPage(1); }}
                    className={`px-md py-sm font-label-md text-label-md border-b-2 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                      tasksFilter === 'draft'
                        ? 'border-primary text-primary font-bold'
                        : 'border-transparent text-on-surface-variant hover:text-primary'
                    }`}
                  >
                    Rascunhos
                  </button>
                  <button
                    onClick={() => { setTasksFilter('archived'); setTasksPage(1); }}
                    className={`px-md py-sm font-label-md text-label-md border-b-2 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                      tasksFilter === 'archived'
                        ? 'border-primary text-primary font-bold'
                        : 'border-transparent text-on-surface-variant hover:text-primary'
                    }`}
                  >
                    Arquivadas
                  </button>
                </div>

                {/* Bento Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg min-h-[350px]">
                  {/* Create New Task Card - Outside AnimatePresence to prevent StrictMode duplication */}
                  {tasksPage === 1 && tasksFilter === 'all' && (
                    <button
                      onClick={() => {
                        setIsDraftCreator(false);
                        setIsAddTaskOpen(true);
                      }}
                      className="flex flex-col items-center justify-center border-2 border-dashed border-outline-variant rounded-xl p-xl bg-surface-container-lowest hover:bg-surface-container-low hover:border-primary transition-all group min-h-[280px] w-full cursor-pointer"
                    >
                      <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-primary mb-md group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-[32px]">add_task</span>
                      </div>
                      <span className="font-headline-md text-headline-md text-on-surface">Criar nova tarefa</span>
                      <span className="font-body-md text-body-md text-on-surface-variant mt-xs">Clique para iniciar uma nova atividade</span>
                    </button>
                  )}

                  {/* Create Draft Card */}
                  {tasksPage === 1 && tasksFilter === 'draft' && (
                    <button
                      onClick={() => {
                        setIsDraftCreator(true);
                        setIsAddTaskOpen(true);
                      }}
                      className="flex flex-col items-center justify-center border-2 border-dashed border-[#c1c6d6] rounded-xl p-xl bg-surface-container-lowest hover:bg-slate-50 hover:border-primary transition-all group min-h-[280px] w-full cursor-pointer"
                    >
                      <div className="w-16 h-16 rounded-full bg-[#f2f3ff] flex items-center justify-center text-primary mb-md group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-[32px]">edit_document</span>
                      </div>
                      <span className="font-headline-md text-headline-md text-on-surface">Criar rascunho</span>
                      <span className="font-body-md text-body-md text-on-surface-variant mt-xs">Clique para iniciar um novo rascunho de atividade</span>
                    </button>
                  )}

                  <AnimatePresence>
                    {/* Paginated Tasks list */}
                    {paginatedTasks.length === 0 ? (
                      <motion.div
                        key="empty-tasks-state"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 text-sm bg-white rounded-2xl border border-outline-variant p-6"
                      >
                        <span className="material-symbols-outlined text-4xl mb-2 text-slate-300">layers_clear</span>
                        Nenhuma tarefa encontrada neste filtro.
                      </motion.div>
                    ) : (
                      paginatedTasks.map(task => {
                        const isArchived = task.status === 'completed';
                        const isDraft = task.status === 'draft';
                        const isActive = task.status === 'active';

                        if (isArchived) {
                          return (
                            <motion.div
                              key={task.id}
                              layout="position"
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                              className="bg-white/60 rounded-xl border border-outline-variant p-lg card-shadow flex flex-col justify-between min-h-[280px] hover:shadow-md hover:translate-y-[-4px] transition-all duration-200"
                            >
                              <div>
                                <div className="flex justify-between items-start mb-md">
                                  <span className="px-sm py-xs bg-surface-container-high text-on-surface-variant rounded-lg font-label-sm text-label-sm">
                                    Arquivada
                                  </span>
                                </div>
                                <h3 className="font-headline-md text-headline-md text-on-surface-variant/80 mb-xs line-through">
                                  {task.title}
                                </h3>
                                <div className="flex items-center gap-xs text-on-surface-variant/60 mb-md">
                                  <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                                  <span className="font-label-sm text-label-sm">Finalizada</span>
                                </div>
                              </div>
                              <div className="space-y-md">
                                <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                                  <span>Relatório Final Gerado</span>
                                  <span className="material-symbols-outlined text-green-600">check_circle</span>
                                </div>
                                <button
                                  onClick={() => {
                                    const updated = tasks.map(t => t.id === task.id ? { ...t, status: 'active' as const } : t);
                                    setTasks(updated);
                                    alert(`Tarefa "${task.title}" reativada com sucesso! 🚀`);
                                  }}
                                  className="w-full py-sm border border-outline text-on-surface-variant rounded-lg font-label-md text-label-md hover:bg-surface-container-low transition-colors cursor-pointer bg-white"
                                >
                                  Reativar
                                </button>
                              </div>
                            </motion.div>
                          );
                        }

                        if (isDraft) {
                          return (
                            <motion.div
                              key={task.id}
                              layout="position"
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                              className="bg-white rounded-xl border border-outline-variant p-lg card-shadow flex flex-col justify-between min-h-[280px] hover:border-primary/30 hover:translate-y-[-4px] transition-all duration-200"
                            >
                              <div>
                                <div className="flex justify-between items-start mb-md select-none">
                                  <span className="px-sm py-xs bg-secondary-container text-on-secondary-container rounded-lg font-label-sm text-label-sm">
                                    Rascunho
                                  </span>
                                  <button
                                    onClick={() => setEditingTask(task)}
                                    className="text-on-surface-variant hover:text-primary cursor-pointer bg-transparent border-none"
                                  >
                                    <span className="material-symbols-outlined">edit</span>
                                  </button>
                                </div>
                                <h3 className="font-headline-md text-headline-md text-on-surface mb-xs">{task.title}</h3>
                                <div className="flex items-center gap-xs text-on-surface-variant mb-md">
                                  <span className="material-symbols-outlined text-[18px]">history</span>
                                  <span className="font-label-sm text-label-sm">Aguardando publicação</span>
                                </div>
                              </div>
                              <div className="space-y-md select-none">
                                <div className="p-md bg-surface-container-low rounded-lg text-center">
                                  <p className="font-body-md text-body-md text-on-surface-variant italic">Aguardando publicação</p>
                                </div>
                                <button
                                  onClick={() => {
                                    const updated = tasks.map(t => t.id === task.id ? { ...t, status: 'active' as const } : t);
                                    setTasks(updated);
                                    alert(`Tarefa "${task.title}" publicada com sucesso! 📡`);
                                  }}
                                  className="w-full py-sm border border-primary text-primary rounded-lg font-label-md text-label-md hover:bg-primary/5 transition-colors cursor-pointer bg-white"
                                >
                                  Retomar Edição
                                </button>
                              </div>
                            </motion.div>
                          );
                        }

                        // Active state (Ativa)
                        return (
                          <motion.div
                            key={task.id}
                            layout="position"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                            className="bg-white rounded-xl border border-outline-variant p-lg card-shadow flex flex-col justify-between min-h-[280px] hover:border-primary/50 transition-all hover:translate-y-[-4px] duration-200"
                          >
                            <div>
                              <div className="flex justify-between items-start mb-md select-none">
                                <span className="px-sm py-xs bg-primary-container/20 text-on-primary-fixed-variant rounded-lg font-label-sm text-label-sm flex items-center gap-xs">
                                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                                  Ativa
                                </span>
                                <button
                                  onClick={() => setEditingTask(task)}
                                  className="text-on-surface-variant hover:text-primary cursor-pointer bg-transparent border-none"
                                >
                                  <span className="material-symbols-outlined">edit</span>
                                </button>
                              </div>
                              <h3 className="font-headline-md text-headline-md text-on-surface mb-xs">{task.title}</h3>
                              <div className="flex items-center gap-xs text-on-surface-variant mb-md">
                                <span className="material-symbols-outlined text-[18px]">event</span>
                                <span className="font-label-sm text-label-sm">Entrega: {task.dueDate ? new Date(task.dueDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }) : 'Sem prazo'}</span>
                              </div>
                            </div>
                            <div className="space-y-md">
                              <div className="space-y-xs select-none">
                                {(() => {
                                    const assignedCount = students.filter(s => {
                                      const isExplicitlyAssigned = task.assignedStudentIds?.includes(s.id);
                                      const hasSubmission = submissions.some(
                                        sub => sub.studentName === s.name && sub.taskTitle === task.title
                                      );
                                      const hasLink = dbTaskLinks.some(
                                        link => link.taskId === task.id && 
                                        link.studentName.toLowerCase() === s.name.toLowerCase()
                                      );
                                      return isExplicitlyAssigned || hasSubmission || hasLink;
                                    }).length;
                                    const uniqueSubs = students.filter(s => {
                                      return submissions.some(
                                        sub => sub.studentName === s.name && sub.taskTitle === task.title
                                      );
                                    }).length;
                                    const displayAssigned = assignedCount;
                                    const displaySubs = Math.min(uniqueSubs, displayAssigned);
                                    const progressPercent = displayAssigned > 0 
                                      ? Math.min(100, Math.round((displaySubs / displayAssigned) * 100)) 
                                      : 0;
                                    return (
                                      <>
                                        <div className="flex justify-between font-label-sm text-label-sm">
                                          <span className="text-on-surface-variant">Progresso de Entrega</span>
                                          <span className="text-primary font-bold">{displaySubs}/{displayAssigned} Alunos</span>
                                        </div>
                                        <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                                          <div
                                            className="h-full bg-primary rounded-full transition-all duration-300"
                                            style={{ width: `${progressPercent}%` }}
                                          ></div>
                                        </div>
                                      </>
                                    );
                                  })()}
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedTaskDetails(task);
                                  setActiveTab('tasks');
                                }}
                                className="w-full py-sm bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:bg-primary-container transition-colors cursor-pointer border-none"
                              >
                                Ver Detalhes
                              </button>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </AnimatePresence>
                </div>

                {/* Pagination */}
                {filteredTasks.length > 0 && (
                  <div className="mt-xl flex items-center justify-between py-md border-t border-outline-variant select-none">
                    <p className="font-body-md text-body-md text-on-surface-variant">
                      Mostrando {Math.min(filteredTasks.length, startIndex + 1)}-{Math.min(filteredTasks.length, startIndex + TASKS_PER_PAGE)} de {filteredTasks.length} tarefas
                    </p>
                    <div className="flex items-center gap-xs">
                      <button
                        onClick={() => { setTasksPage(prev => Math.max(1, prev - 1)); scrollToContentTop(); }}
                        disabled={tasksPage === 1}
                        className="p-2 border border-outline-variant rounded-lg hover:bg-surface-container-low text-on-surface-variant transition-colors disabled:opacity-50 cursor-pointer bg-white flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined">chevron_left</span>
                      </button>
                      <div className="flex items-center gap-xs">
                        {Array.from({ length: totalPages }).map((_, i) => (
                          <button
                            key={i}
                            onClick={() => { setTasksPage(i + 1); scrollToContentTop(); }}
                            className={`w-10 h-10 rounded-lg font-label-md text-label-md cursor-pointer transition-colors ${
                              tasksPage === i + 1
                                ? 'bg-primary text-on-primary font-bold border-none shadow'
                                : 'hover:bg-surface-container-high text-on-surface-variant bg-white border border-outline-variant'
                            }`}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => { setTasksPage(prev => Math.min(totalPages, prev + 1)); scrollToContentTop(); }}
                        disabled={tasksPage === totalPages}
                        className="p-2 border border-outline-variant rounded-lg hover:bg-surface-container-low text-on-surface-variant transition-colors disabled:opacity-50 cursor-pointer bg-white flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined">chevron_right</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          )}

          {/* TAB 3: STUDENTS */}
          {activeTab === 'students' && (
            <div className="space-y-6">
              {/* Header Section with Search & Filter in the Upper Right */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-lg">
                <div className="text-left flex-1">
                   <h2 className="text-2xl font-bold text-slate-900">Alunos</h2>
                   <p className="font-body-md text-body-md text-on-surface-variant mt-1">Gerencie seus estudantes e acompanhe o progresso individual.</p>
                </div>
                
                <div className="flex items-center gap-4 flex-shrink-0">
                  {/* Search Input */}
                  <div className="relative w-64">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 shrink-0"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    <input
                      type="text"
                      value={gridSearchQuery}
                      onChange={(e) => {
                        setGridSearchQuery(e.target.value);
                        setStudentsLimit(6); // Reset limit on search
                      }}
                      placeholder="Pesquisar por nome ou turma..."
                      className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-full text-xs outline-none focus:ring-2 focus:ring-[#0073e0]/20 focus:border-[#0073e0] transition-all text-[#131b2e] shadow-xs"
                    />
                  </div>

                  {/* Filter Button & Popover */}
                  <div className="relative">
                    <button
                      onClick={() => setIsGridFilterOpen(prev => !prev)}
                      className={`flex items-center gap-1.5 px-5 py-2.5 bg-white border border-slate-200 rounded-full font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer text-slate-700 shadow-xs border-none ${isGridFilterOpen ? 'bg-blue-50 text-blue-600 font-extrabold' : ''}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="text-slate-500 shrink-0"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                      Filtros
                    </button>

                    <AnimatePresence>
                      {isGridFilterOpen && (
                        <>
                          <div className="fixed inset-0 z-40 cursor-default" onClick={() => setIsGridFilterOpen(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-lg z-50 p-4 font-sans flex flex-col gap-2 text-left"
                          >
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 select-none">MÉTODO DE LOGIN:</p>
                            <div className="flex flex-col gap-1">
                              {[
                                { type: 'all', label: 'Todos os Métodos' },
                                { type: 'code', label: 'Código (Entrou por Código)' },
                                { type: 'link', label: 'Link (Entrou por Link)' },
                                { type: 'login', label: 'Login (Email/Cadastro)' }
                              ].map(option => (
                                <button
                                  key={option.type}
                                  onClick={() => {
                                    setGridFilterType(option.type as any);
                                    setIsGridFilterOpen(false);
                                    setStudentsLimit(6); // Reset limit on filter
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-none ${
                                    gridFilterType === option.type
                                      ? 'bg-blue-50 text-[#0073e0]'
                                      : 'bg-transparent text-slate-600 hover:bg-slate-50'
                                  }`}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Filters & Stats Chips */}
              <div className="flex flex-wrap items-center gap-2 mb-lg">
                <button 
                  onClick={() => { setStudentsFilter('all'); setStudentsLimit(6); }}
                  className={`px-4 py-2 rounded-full font-bold text-xs border-none cursor-pointer transition-all duration-150 ${
                    studentsFilter === 'all' 
                      ? 'bg-[#191919] text-white shadow-sm font-extrabold' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Todos ({students.length})
                </button>
                <button 
                  onClick={() => { setStudentsFilter('completed'); setStudentsLimit(6); }}
                  className={`px-4 py-2 rounded-full font-bold text-xs border-none cursor-pointer transition-all duration-150 ${
                    studentsFilter === 'completed' 
                      ? 'bg-[#137333] text-white shadow-sm font-extrabold' 
                      : 'bg-[#e6f4ea] text-[#137333] hover:bg-[#d0edd7]'
                  }`}
                >
                  Concluídos ({students.filter(s => s.progress === 100).length})
                </button>
                <button 
                  onClick={() => { setStudentsFilter('pending'); setStudentsLimit(6); }}
                  className={`px-4 py-2 rounded-full font-bold text-xs border-none cursor-pointer transition-all duration-150 ${
                    studentsFilter === 'pending' 
                      ? 'bg-[#5c56d6] text-white shadow-sm font-extrabold' 
                      : 'bg-[#f3f3fd] text-[#5c56d6] hover:bg-[#e2e1f9]'
                  }`}
                >
                  Pendentes ({students.filter(s => s.progress < 50).length})
                </button>
                <button 
                  onClick={() => { setStudentsFilter('inprogress'); setStudentsLimit(6); }}
                  className={`px-4 py-2 rounded-full font-bold text-xs border-none cursor-pointer transition-all duration-150 ${
                    studentsFilter === 'inprogress' 
                      ? 'bg-[#1a73e8] text-white shadow-sm font-extrabold' 
                      : 'bg-[#e8f0fe] text-[#1a73e8] hover:bg-[#d2e3fc]'
                  }`}
                >
                  Concluindo ({students.filter(s => s.progress >= 50 && s.progress < 100).length})
                </button>
              </div>

              {/* Dynamic Filtering, Ordering & Sessions Layout */}
              {(() => {
                const renderStudentCard = (student: any) => {
                  const studentEmail = student.email || `${student.name.toLowerCase().replace(/\s+/g, '.')}@email.com`;
                  const isDone = student.progress === 100;
                  const isWaiting = student.progress < 50;

                  return (
                    <div 
                      className="bg-white border border-slate-100 rounded-[24px] p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-200 min-h-[220px] select-text relative text-left"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Circular Selection Checkbox */}
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelectStudentGrid(student.id);
                            }}
                            className={`w-5 h-5 rounded-full flex items-center justify-center cursor-pointer border transition-all shrink-0 ${
                              selectedStudentIdsGrid.includes(student.id)
                                ? 'bg-[#0073e0] border-[#0073e0] text-white shadow-sm'
                                : 'border-slate-200 bg-white text-transparent hover:border-[#0073e0]'
                            }`}
                            title="Selecionar aluno"
                          >
                            {selectedStudentIdsGrid.includes(student.id) && (
                              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" className="text-white shrink-0"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            )}
                          </div>

                          <div className="relative shrink-0">
                            <img 
                              src={student.img || "/padrao/foto-do-perfil.avif"} 
                              alt={student.name} 
                              className="w-12 h-12 rounded-full object-cover border-2 border-slate-100"
                              onError={(e) => {
                                e.currentTarget.src = "/padrao/foto-do-perfil.avif";
                              }}
                            />
                            {student.lastAccessAt && (
                              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full animate-pulse" title="Online recentemente" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1 text-left">
                            <h3 className="font-bold text-sm text-slate-800 flex flex-wrap items-center gap-xs truncate">
                              {student.name}
                            </h3>
                            <p className="text-slate-400 font-semibold text-xs truncate mt-0.5" title={studentEmail}>{studentEmail}</p>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isWaiting ? (
                            <span title="Pendente" className="text-[#ea4335]">
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" className="text-[#ea4335]"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                            </span>
                          ) : (
                            <span title={isDone ? "Concluído" : "Em Progresso"}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="text-slate-700"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl p-4 mb-5 bg-[#f0f4f9] mt-4 text-left">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Progresso de Tarefas</span>
                          <span className="font-bold text-xs text-blue-600">
                            {student.progress}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-[#0073e0] transition-all duration-500"
                            style={{ width: `${student.progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 mt-auto">
                        <button 
                          onClick={() => {
                            const sub = submissions.find(sub => sub.studentName === student.name);
                            if (sub && student.progress > 0) {
                              onLaunchReviewMode(sub);
                            } else {
                              alert('O aluno ou aluna não realizou a tarefa ainda');
                            }
                          }}
                          className="flex-1 py-3 bg-[#e8f0fe] hover:bg-[#d2e3fc] text-[#1a73e8] font-bold rounded-xl transition-all border-none cursor-pointer flex items-center justify-center text-xs"
                        >
                          Ver Tarefas
                        </button>
                        <button 
                          onClick={() => alert(`Acesso na Nuvem sincronizado para o aluno ${student.name} (ID: ${student.matricula})`)}
                          className="px-4 py-3 bg-[#0073e0] hover:bg-[#005ba4] text-white rounded-xl flex items-center justify-center transition-all border-none cursor-pointer active:scale-95 shrink-0"
                          title="Sincronizar Cloud PWA"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" className="text-white"><path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.42-1.04-1.21-1.88-2.2-2.4A5.5 5.5 0 0 0 4 11.5c-2 .5-4 2.2-4 4.5A3.5 3.5 0 0 0 3.5 19z"></path></svg>
                        </button>
                      </div>
                    </div>
                  );
                };

                const renderAddNewCardSkeleton = () => {
                  return (
                    <div 
                      onClick={() => setIsAddStudentOpen(true)}
                      className="border-2 border-dashed border-slate-200 rounded-[24px] p-6 flex flex-col items-center justify-center text-slate-400 hover:border-[#0073e0] hover:text-[#0073e0] transition-all cursor-pointer group bg-slate-50/20 min-h-[220px] duration-150 text-center"
                    >
                      <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center mb-4 group-hover:border-[#0073e0] transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" className="text-slate-400 group-hover:text-[#0073e0] transition-all"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                      </div>
                      <p className="font-bold text-sm text-slate-700">Adicionar Novo Aluno</p>
                      <p className="text-xs text-slate-400 mt-1 px-4">Adicione um aluno usando formulário rápido</p>
                    </div>
                  );
                };

                // Pipeline: 1. Search Query & Progress stats filter
                const filteredAll = students.filter(s => {
                  const q = gridSearchQuery.toLowerCase();
                  const matchesSearch = s.name.toLowerCase().includes(q) || 
                                        s.class.toLowerCase().includes(q) ||
                                        (s.email && s.email.toLowerCase().includes(q)) ||
                                        (s.name.toLowerCase().replace(/\s+/g, '.') + '@email.com').includes(q);
                  if (!matchesSearch) return false;

                  if (studentsFilter === 'completed') return s.progress === 100;
                  if (studentsFilter === 'pending') return s.progress < 50;
                  if (studentsFilter === 'inprogress') return s.progress >= 50 && s.progress < 100;
                  return true;
                });

                // Pipeline: 2. Sorting (Recent Access first in queue!)
                const sortStudents = (list: any[]) => {
                  return [...list].sort((a, b) => {
                    const timeA = a.lastAccessAt ? new Date(a.lastAccessAt).getTime() : 0;
                    const timeB = b.lastAccessAt ? new Date(b.lastAccessAt).getTime() : 0;
                    if (timeA !== timeB) return timeB - timeA; // Descending order (recent first)
                    return a.id.localeCompare(b.id);
                  });
                };

                const sortedAll = sortStudents(filteredAll);
                const limit = studentsLimit;

                // Apply active grid filter type (code, link, login)
                const filteredByLoginMethod = sortedAll.filter(s => {
                  if (gridFilterType === 'code') return s.loginMethod === 'code';
                  if (gridFilterType === 'link') return s.loginMethod === 'link';
                  if (gridFilterType === 'login') return s.loginMethod === 'login' || !s.loginMethod;
                  return true;
                });

                return (
                  <div className="space-y-8 select-text min-h-[450px]">
                    {filteredByLoginMethod.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence>
                          {filteredByLoginMethod.slice(0, limit).map(student => (
                            <motion.div
                              key={student.id}
                              layout="position"
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                            >
                              {renderStudentCard(student)}
                            </motion.div>
                          ))}
                        </AnimatePresence>
                        
                        {/* Add New Card Skeleton is rendered as the last element of the list */}
                        <motion.div layout="position">
                          {renderAddNewCardSkeleton()}
                        </motion.div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center">
                        <span className="material-symbols-outlined text-[48px] mb-2 text-slate-300">group_off</span>
                        <p className="font-medium text-sm font-sans">Nenhum aluno encontrado para os filtros ativos.</p>
                      </div>
                    )}

                    {/* Pagination/Load More button dynamically calculated */}
                    {(() => {
                      const totalLength = filteredByLoginMethod.length;

                      return totalLength > limit && (
                        <div className="mt-8 flex justify-center pt-4">
                          <button 
                            onClick={() => setStudentsLimit(prev => prev + 6)}
                            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-full text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all shadow-sm cursor-pointer active:scale-95 duration-100 border-none"
                          >
                            Carregar mais alunos
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="text-slate-600"><polyline points="6 9 12 15 18 9"></polyline></svg>
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 4: ACCESS (Template 8) */}
          {activeTab === 'access' && (
            <div className="space-y-6">
              
              {/* Alphanumeric Configuração de Acesso Block */}
              <div className="bg-white p-6 rounded-2xl border border-[#c1c6d6] shadow-sm space-y-6">
                <div>
                   <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Configuração de Acesso</h2>
                  <p className="text-xs text-slate-400 mt-1">Gere chaves encriptadas temporárias para acesso offline do aluno.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Name and Expiry select */}
                  <div className="space-y-4 md:col-span-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">
                        Nome do Aluno
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Ana Souza"
                        value={studentNameInput}
                        onChange={(e) => setStudentNameInput(e.target.value)}
                        className="w-full bg-[#f2f3ff] border border-[#c1c6d6] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#005bb3] outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">
                          Validade do Código
                        </label>
                        <select
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                          className="w-full bg-white border border-[#c1c6d6] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#005bb3] outline-none"
                        >
                          <option value="1h">1 Hora</option>
                          <option value="4h">4 Horas</option>
                          <option value="1d">1 Dia</option>
                          <option value="1w">1 Semana</option>
                          <option value="custom">Personalizado (Calendário)</option>
                        </select>
                      </div>

                      {duration === 'custom' && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1.5" htmlFor="expiry-date">
                              Data de Expiração
                            </label>
                            <input
                              type="date"
                              id="expiry-date"
                              value={customExpiryDate}
                              onChange={(e) => setCustomExpiryDate(e.target.value)}
                              className="w-full bg-white border border-[#c1c6d6] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#005bb3] outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1.5" htmlFor="expiry-time">
                              Hora de Expiração
                            </label>
                            <input
                              type="time"
                              id="expiry-time"
                              value={customExpiryTime}
                              onChange={(e) => setCustomExpiryTime(e.target.value)}
                              className="w-full bg-white border border-[#c1c6d6] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#005bb3] outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleGenerateCode}
                      className="px-6 py-3 bg-[#005bb3] hover:bg-[#00468c] text-white text-xs font-bold rounded-xl transition-all shadow cursor-pointer active:scale-95"
                    >
                      Gerar Código Criptografado
                    </button>
                  </div>

                  {/* Render Generated Code Area */}
                  {generatedCode && (
                    <div className="bg-[#f2f3ff] border border-[#d6e3ff] p-6 rounded-2xl flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                          {generatedStudentName && detectGenderFromName(generatedStudentName) === 'F' ? 'Código aluna' : 'Código aluno'}
                        </span>
                        <div className="font-mono text-lg font-bold text-[#005bb3] break-all leading-tight">
                          {generatedCode}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">
                          Utilize o botão abaixo para copiar o token integral encriptado em Base64.
                        </p>
                      </div>

                      <div className="flex gap-2 mt-4 pt-4 border-t border-[#dde0e2]">
                        <button
                          onClick={() => handleCopyCode(generatedBase64, 999)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white border border-[#c1c6d6] hover:bg-[#005bb3] hover:text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {copiedIndex === 999 ? 'check' : 'content_copy'}
                          </span>
                          {copiedIndex === 999 ? 'Copiado!' : 'Copiar Código'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Unified "Alunos que acessaram pelo código" section */}
              <div className="bg-white rounded-2xl border border-[#c1c6d6] shadow-sm overflow-hidden flex flex-col min-h-[400px]">
                <div className="p-6 border-b border-[#dde0e2]">
                  <h3 className="font-extrabold text-lg">Alunos que acessaram pelo código</h3>
                  <p className="text-xs text-slate-400 mt-1">Estudantes que realizaram login no portal utilizando chaves ativas em tempo real</p>
                </div>

                <div className="p-6 bg-slate-50/20 flex-grow">
                  {accessedStudents.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm">
                      Nenhum aluno realizou login pelo código no momento.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 p-8 bg-slate-50/50 min-h-[200px]">
                      <AnimatePresence>
                      {accessedStudents.map((item, index) => {
                        const activeCode = activeCodes.find(
                          c => c.code.toUpperCase() === item.code.toUpperCase() ||
                               c.studentName.toLowerCase() === item.studentName.toLowerCase()
                        );
                        const isExpired = activeCode ? (Date.now() > activeCode.expiresAt) : false;
                        const student = students.find(s => s.name.toLowerCase() === item.studentName.toLowerCase());
                        const studentImg = student?.img || "/padrao/foto-do-perfil.avif";

                        let durationLabel = activeCode ? activeCode.durationLabel : 'Ativo';
                        let friendlyCode = activeCode ? activeCode.code : item.code;
                        try {
                          if (friendlyCode.startsWith('ABBA-')) {
                            const base64 = friendlyCode.substring(5);
                            const payload = JSON.parse(atob(base64));
                            friendlyCode = `ABBA-${payload.codeId}-${payload.name.split(' ')[0].toUpperCase()}`;
                          }
                        } catch (e) {
                          // fallback
                        }

                        return (
                          <motion.div 
                            key={item.id}
                            layout="position"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                            className="bg-white rounded-2xl border border-outline-variant/60 shadow-sm p-6 pt-10 flex flex-col relative hover:border-[#005bb3]/40 transition-all group"
                          >
                            <div className="absolute -top-4 -left-4 w-16 h-16 rounded-full border-4 border-[#00c853] overflow-hidden shadow-md bg-white select-none shrink-0">
                              <img 
                                src={studentImg || "/padrao/foto-do-perfil.avif"} 
                                className="w-full h-full object-cover" 
                                alt={item.studentName} 
                                onError={(e) => {
                                  e.currentTarget.src = "/padrao/foto-do-perfil.avif";
                                }}
                              />
                            </div>

                            <div className="absolute top-4 right-4 flex items-center gap-2 select-none">
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60">
                                {durationLabel && durationLabel.startsWith('Até ') && durationLabel.includes('-')
                                  ? `Até ${durationLabel.substring(4).split('-').reverse().join('/')}`
                                  : durationLabel}
                              </span>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                isExpired ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                              }`}>
                                {isExpired ? 'Expirado' : 'Ativo'}
                              </span>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Deseja revogar o acesso de ${item.studentName}?`)) {
                                    // Remove from accessedStudents state and localStorage
                                    const updated = accessedStudents.filter(s => s.id !== item.id && s.studentName.toLowerCase() !== item.studentName.toLowerCase());
                                    setAccessedStudents(updated);
                                    localStorage.setItem('abba_students_logged_by_code', JSON.stringify(updated));

                                    // Also remove from activeCodes if found
                                    if (activeCode) {
                                      setActiveCodes(prev => prev.filter(c => c.id !== activeCode.id));
                                    }
                                  }
                                }}
                                className="p-1 hover:bg-red-50 hover:text-red-500 text-slate-300 hover:text-red-500 rounded-full transition-colors cursor-pointer bg-transparent border-none flex items-center justify-center"
                                title="Revogar Acesso"
                              >
                                <img src="/icones/lixeira.svg" alt="Excluir" className="w-[16px] h-[16px] object-contain inline-block" />
                              </button>
                            </div>

                            <div className="flex-1 mt-2">
                              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                                Chave gerada para {item.studentName}
                              </span>
                              
                              <h4 className="text-base font-extrabold text-[#005bb3] tracking-wide mt-2 font-mono block break-all">
                                {friendlyCode}
                              </h4>
                              
                              <p className="text-[11px] text-slate-400 font-medium leading-relaxed mt-2.5">
                                Utilize o botão abaixo para copiar o código de acesso.
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleCopyCode(activeCode ? activeCode.code : item.code, index)}
                              className="w-full py-3.5 mt-5 bg-white border border-[#c1c6d6] hover:bg-[#f2f3ff] hover:border-[#005bb3]/30 active:scale-[0.98] transition-all rounded-xl font-bold text-xs text-slate-700 cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                {copiedIndex === index ? 'check' : 'content_copy'}
                              </span>
                              {copiedIndex === index ? 'Copiado!' : 'Copiar Código'}
                            </button>
                          </motion.div>
                        );
                      })}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
        </main>

        {/* Modal: Batch Assign Duration */}
        <AnimatePresence>
          {isBatchAssignModalOpen && (
            <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
              {/* Sibling Backdrop Overlay */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsBatchAssignModalOpen(false)}
                className="absolute inset-0 bg-[#131b2e]/60 backdrop-blur-sm cursor-pointer"
              />
              
              {/* Sibling Modal Content Card */}
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative bg-white rounded-3xl border border-[#c1c6d6] max-w-md w-full p-6 space-y-6 shadow-2xl shrink-0 z-10"
                style={{ width: '100%', maxWidth: '28rem' }}
              >
                <div className="flex justify-between items-center border-b border-[#dde0e2] pb-4 select-none">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-400">Atribuição de Acesso</span>
                    <h3 className="text-lg font-extrabold text-[#131b2e]">Definir Validade da Chave</h3>
                  </div>
                  <button 
                    onClick={() => setIsBatchAssignModalOpen(false)}
                    className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all cursor-pointer bg-transparent border-none flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="space-y-4">
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Qual será a validade do código para {selectedStudentIds.length} {selectedStudentIds.length === 1 ? 'aluno selecionado' : 'alunos selecionados'}?
                  </p>

                  <div className="flex flex-col gap-1.5 select-none">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Duração da Chave</label>
                    <select
                      value={batchDuration}
                      onChange={(e) => setBatchDuration(e.target.value)}
                      className="bg-[#f2f3ff] border border-[#c1c6d6] rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-[#005bb3] outline-none cursor-pointer text-slate-700"
                    >
                      <option value="1h">1 Hora</option>
                      <option value="4h">4 Horas</option>
                      <option value="1d">1 Dia</option>
                      <option value="1w">1 Semana</option>
                      <option value="30d">30 Dias</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleConfirmBatchAssignKeys(batchDuration)}
                    className="flex-1 py-3 px-4 bg-[#005bb3] hover:brightness-110 text-white font-bold text-xs rounded-xl transition-all cursor-pointer border-none shadow-sm flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[16px]">vpn_key</span>
                    Confirmar
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsBatchAssignModalOpen(false)}
                    className="flex-1 py-3 px-4 bg-white border border-[#c1c6d6] hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center active:scale-95"
                  >
                    Cancelar
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal: Add Task */}
        <AnimatePresence>
          {isAddTaskOpen && (
            <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
              {/* Sibling Backdrop Overlay */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAddTaskOpen(false)}
                className="absolute inset-0 bg-[#131b2e]/60 backdrop-blur-sm cursor-pointer"
              />
              
              {/* Sibling Modal Content Card */}
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative bg-white rounded-3xl border border-[#c1c6d6] max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl cursor-default z-10"
              >
                <div className="flex justify-between items-center border-b border-[#dde0e2] px-6 py-4 md:px-8 bg-white shrink-0 select-none">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-400">Adicionar Nova Tarefa</span>
                    <h3 className="text-xl font-extrabold text-[#131b2e]">Criar Tarefa no Portal</h3>
                  </div>
                  <button 
                    onClick={() => setIsAddTaskOpen(false)}
                    className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all cursor-pointer bg-transparent border-none flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <form onSubmit={handleCreateTask} className="overflow-y-auto grow p-6 md:p-8 space-y-6 custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Task Title */}
                    <div className="md:col-span-2 flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nome da Tarefa *</label>
                      <input
                        type="text"
                        placeholder="Ex: Exercício de Numerais Multilingue"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        className="w-full bg-[#f2f3ff] border border-[#c1c6d6] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#005bb3] outline-none"
                        required
                      />
                    </div>

                    {/* Task Description */}
                    <div className="md:col-span-2 flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Descrição da Tarefa *</label>
                      <textarea
                        placeholder="Instruções gerais para os alunos de como soletrar no ábaco..."
                        value={newTaskDesc}
                        onChange={(e) => setNewTaskDesc(e.target.value)}
                        rows={3}
                        className="w-full bg-[#f2f3ff] border border-[#c1c6d6] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#005bb3] outline-none resize-none"
                        required
                      />
                    </div>

                    {/* Note from Teacher */}
                    <div className="md:col-span-2 flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nota do Teatcher (Dica especial)</label>
                      <textarea
                        placeholder="Adicione observações ou instruções adicionais de pronúncia..."
                        value={newTaskTeacherNote}
                        onChange={(e) => setNewTaskTeacherNote(e.target.value)}
                        rows={2}
                        className="w-full bg-[#f2f3ff] border border-[#c1c6d6] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#005bb3] outline-none resize-none"
                      />
                    </div>

                    {/* Start Date */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Data de início</label>
                      <input
                        type="date"
                        value={newTaskStartDate}
                        onChange={(e) => setNewTaskStartDate(e.target.value)}
                        className="w-full bg-[#f2f3ff] border border-[#c1c6d6] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#005bb3] outline-none"
                      />
                    </div>

                    {/* End Date */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Data de conclusão</label>
                      <input
                        type="date"
                        value={newTaskDueDate}
                        onChange={(e) => setNewTaskDueDate(e.target.value)}
                        className="w-full bg-[#f2f3ff] border border-[#c1c6d6] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#005bb3] outline-none"
                      />
                    </div>
                  </div>

                  {/* Two Column Section for Student Assign & Upload simulator */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Assign section */}
                    <div className="flex flex-col gap-2 bg-[#f8fafc] border border-outline-variant/30 rounded-2xl p-4 shadow-xs">
                      <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Atribuir a Alunos</h4>
                      <p className="text-[10px] text-slate-400">Selecione quais alunos devem receber esta tarefa</p>
                      
                      <input
                        type="text"
                        placeholder="Buscar aluno..."
                        value={addTaskStudentSearchQuery}
                        onChange={(e) => setAddTaskStudentSearchQuery(e.target.value)}
                        className="w-full bg-white border border-[#c1c6d6] rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-[#005bb3] outline-none mt-1"
                      />

                      <div className="space-y-2 max-h-36 overflow-y-auto pr-2 mt-1">
                        {students
                          .filter(s => s.name.toLowerCase().includes(addTaskStudentSearchQuery.toLowerCase()))
                          .map(s => {
                            const isAssigned = selectedStudentIds.includes(s.id);
                            return (
                              <div 
                                key={s.id} 
                                onClick={() => {
                                  setSelectedStudentIds(prev => 
                                    prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                                  );
                                }}
                                className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-100 hover:border-primary/30 transition-colors cursor-pointer group"
                              >
                                <div className="flex items-center gap-md">
                                  <img 
                                    src={s.img || "/padrao/foto-do-perfil.avif"} 
                                    alt={s.name} 
                                    className="w-8 h-8 rounded-full object-cover border border-[#eaedff]" 
                                    onError={(e) => {
                                      e.currentTarget.src = "/padrao/foto-do-perfil.avif";
                                    }}
                                  />
                                  <span className="font-bold text-xs text-on-background group-hover:text-primary transition-colors">{s.name}</span>
                                </div>
                                <span className={`material-symbols-outlined text-[20px] transition-all ${
                                  isAssigned ? 'text-primary' : 'text-slate-300'
                                }`}>
                                  {isAssigned ? 'check_circle' : 'circle'}
                                </span>
                              </div>
                            );
                          })}
                        {students.filter(s => s.name.toLowerCase().includes(addTaskStudentSearchQuery.toLowerCase())).length === 0 && (
                          <p className="text-center text-[10px] text-slate-400 py-4">Nenhum aluno encontrado</p>
                        )}
                      </div>
                    </div>

                    {/* Attachments Section */}
                    <div className="flex flex-col gap-2 bg-[#f8fafc] border border-outline-variant/30 rounded-2xl p-4 shadow-xs">
                      <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Adicionar Anexo</h4>
                      <p className="text-[10px] text-slate-400">Anexe imagens de materiais de apoio explicativos</p>
                      
                      <input 
                        type="file"
                        accept="image/*"
                        ref={addTaskFileInputRef}
                        className="hidden"
                        onChange={handleAddTaskFileChange}
                      />

                      <div 
                        onClick={() => addTaskFileInputRef.current?.click()}
                        className="flex-grow min-h-[120px] mt-2 border-2 border-dashed border-[#dde0e2] hover:border-primary hover:bg-[#eaedff]/20 rounded-2xl flex flex-col items-center justify-center transition-colors cursor-pointer group p-4 text-center"
                      >
                        {addTaskFile ? (
                          <>
                            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
                              <span className="material-symbols-outlined text-[24px]">
                                image
                              </span>
                            </div>
                            <p className="font-bold text-xs text-slate-600 truncate max-w-full px-2">{addTaskFile.name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{(addTaskFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                            <button
                              type="button"
                              onClick={(e) => {
                                  e.stopPropagation();
                                  setAddTaskFile(null);
                                  if (addTaskFileInputRef.current) addTaskFileInputRef.current.value = '';
                              }}
                              className="text-xs text-red-500 hover:text-red-700 mt-2 font-bold bg-transparent border-none cursor-pointer"
                            >
                              Remover
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-2 group-hover:scale-105 transition-all">
                              <span className="material-symbols-outlined text-[24px]">upload_file</span>
                            </div>
                            <p className="font-bold text-xs text-slate-600">Upload de Imagem de Apoio</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Tamanho máximo: 5MB</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Spelled Words Builder */}
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Palavras Meta (Soletrar no Fio do Ábaco)</label>
                      <button
                        type="button"
                        onClick={handleAddWordToNewTask}
                        className="flex items-center gap-1 text-[#005bb3] hover:text-[#00468c] font-bold text-xs cursor-pointer border-none bg-transparent"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        Adicionar Palavra
                      </button>
                    </div>

                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                      {newTaskWords.map((wordObj, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row gap-3 items-center bg-[#f2f3ff] p-3 rounded-xl border border-[#dde0e2]">
                          <input
                            type="text"
                            placeholder="PALAVRA"
                            value={wordObj.word}
                            onChange={(e) => {
                              const updated = [...newTaskWords];
                              updated[idx].word = e.target.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s]/g, '').toUpperCase();
                              setNewTaskWords(updated);
                            }}
                            className="bg-white border border-[#c1c6d6] rounded-lg px-3 py-1.5 text-xs font-bold text-[#131b2e] w-full sm:w-44 focus:ring-1 focus:ring-[#005bb3] outline-none"
                          />

                          <select
                            value={wordObj.language}
                            onChange={(e) => {
                              const updated = [...newTaskWords];
                              const lang = e.target.value as 'pt' | 'en' | 'de';
                              updated[idx].language = lang;
                              // Default language theme colors
                              if (lang === 'pt') updated[idx].color = '#1e293b'; // Slate (Black)
                              if (lang === 'en') updated[idx].color = '#3b82f6'; // Blue
                              if (lang === 'de') updated[idx].color = '#ef4444'; // Red
                              setNewTaskWords(updated);
                            }}
                            className="bg-white border border-[#c1c6d6] rounded-lg px-2 py-1.5 text-xs font-bold w-full sm:w-36 focus:ring-1"
                          >
                            <option value="pt">Português</option>
                            <option value="en">Inglês</option>
                            <option value="de">Alemão</option>
                          </select>

                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <label className="text-[10px] font-bold text-slate-400">Cor do Fio:</label>
                            <input
                              type="color"
                              value={wordObj.color}
                              onChange={(e) => {
                                const updated = [...newTaskWords];
                                updated[idx].color = e.target.value;
                                setNewTaskWords(updated);
                              }}
                              className="w-8 h-8 rounded-lg cursor-pointer border border-[#c1c6d6] p-0.5 bg-white shrink-0"
                            />
                          </div>

                          {newTaskWords.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveWordFromNewTask(idx)}
                              className="text-red-500 hover:text-red-700 transition-colors p-1.5 shrink-0 cursor-pointer border-none bg-transparent"
                            >
                              <img src="/icones/lixeira.svg" alt="Excluir" className="w-[18px] h-[18px] object-contain inline-block" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-[#dde0e2]">
                    <button
                      type="button"
                      onClick={() => setIsAddTaskOpen(false)}
                      className="px-5 py-2.5 border border-[#c1c6d6] hover:bg-slate-50 text-xs font-bold rounded-xl cursor-pointer bg-white"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-primary hover:bg-primary-container text-on-primary text-xs font-bold rounded-xl cursor-pointer shadow border-none"
                    >
                      Criar tarefa
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal: Selecionar Alunos (Template 9) */}
        <AnimatePresence>
          {isAssignStudentsOpen && tempCreatedTask && (
            <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
              {/* Sibling Backdrop Overlay */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setIsAssignStudentsOpen(false);
                  setTempCreatedTask(null);
                }}
                className="absolute inset-0 bg-[#131b2e]/60 backdrop-blur-sm cursor-pointer"
              />
              
              {/* Sibling Modal Content Card */}
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative bg-white rounded-3xl border border-[#c1c6d6] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-10"
              >
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-[#dde0e2] flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-extrabold text-[#131b2e]">Selecionar Alunos</h3>
                    <p className="text-[11px] text-slate-400 font-medium">Selecione os alunos que participarão desta atividade</p>
                  </div>
                  <button 
                    onClick={() => {
                      setIsAssignStudentsOpen(false);
                      setTempCreatedTask(null);
                    }}
                    className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                {/* Modal Sub-header / Filter */}
                <div className="px-6 py-3 bg-[#f2f3ff] flex items-center justify-between border-b border-[#dde0e2] shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center">
                      <input 
                        type="checkbox"
                        id="select-all-assign"
                        checked={selectedStudentIds.length === filteredStudentsForGrid.length && filteredStudentsForGrid.length > 0}
                        onChange={(e) => handleSelectAllStudents(e.target.checked)}
                        className="w-4 h-4 rounded text-[#005bb3] border-[#c1c6d6] cursor-pointer"
                      />
                      <label htmlFor="select-all-assign" className="ml-2 text-xs font-bold text-slate-600 cursor-pointer select-none">
                        Selecionar Todos
                      </label>
                    </div>
                    <span className="text-[#dde0e2]">|</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">{filteredStudentsForGrid.length} alunos encontrados</span>
                  </div>
                  <div className="relative flex items-center gap-1">
                    <span className="material-symbols-outlined text-slate-400 text-[18px]">search</span>
                    <input 
                      type="text"
                      placeholder="Filtrar por nome..."
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                      className="bg-transparent border-none text-xs focus:ring-0 placeholder:text-slate-400 w-32 p-0 outline-none"
                    />
                  </div>
                </div>

                {/* Student Grid list (Scrollable) */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-grow bg-[#faf8ff]">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {filteredStudentsForGrid.map(s => {
                      const isSelected = selectedStudentIds.includes(s.id);
                      return (
                        <div
                          key={s.id}
                          onClick={() => handleSelectStudent(s.id, !isSelected)}
                          className={`group flex flex-col items-center p-4 border rounded-2xl transition-all cursor-pointer relative bg-white hover:shadow-md ${
                            isSelected ? 'border-[#005bb3] bg-[#f2f3ff]' : 'border-[#c1c6d6]/70'
                          }`}
                        >
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="absolute top-3 right-3 w-4 h-4 rounded text-[#005bb3] border-[#c1c6d6] pointer-events-none"
                          />
                          <img 
                            src={s.img || "/padrao/foto-do-perfil.avif"} 
                            alt={s.name}
                            className={`w-14 h-14 rounded-full object-cover mb-2 border-2 transition-all ${
                              isSelected ? 'border-[#005bb3] scale-105' : 'border-slate-100'
                            }`}
                            onError={(e) => {
                              e.currentTarget.src = "/padrao/foto-do-perfil.avif";
                            }}
                          />
                          <p className="font-bold text-xs text-center text-[#131b2e] truncate w-full leading-tight">{s.name}</p>
                          <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">Matrícula: {s.matricula || '202400'}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-[#dde0e2] bg-white flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-1 text-xs">
                    <span className="font-black text-[#005bb3]" id="selected-count">{selectedStudentIds.length}</span>
                    <span className="text-slate-400 font-semibold">alunos selecionados</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setIsAssignStudentsOpen(false);
                        setTempCreatedTask(null);
                      }}
                      className="px-5 py-2.5 rounded-xl border border-[#c1c6d6] hover:bg-slate-50 text-xs font-bold text-slate-500 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={() => {
                        if (selectedStudentIds.length === 0) {
                          alert('Selecione pelo menos um aluno para a tarefa.');
                           return;
                        }
                        const finalTask: TaskItem = {
                          ...tempCreatedTask,
                          assignedStudentIds: selectedStudentIds,
                          submissionsCount: 0
                        } as TaskItem;
                        setTasks([finalTask, ...tasks]);
                        setIsAssignStudentsOpen(false);
                        setTempCreatedTask(null);
                        
                        // Trigger the beautiful success overlay
                        showAssignmentSuccessOverlay(finalTask.title, finalTask.id, selectedStudentIds);
                        
                        setSelectedStudentIds([]); // Reset selections
                      }}
                      className="px-7 py-2.5 rounded-xl bg-[#005bb3] hover:bg-[#00468c] text-white text-xs font-bold shadow-lg shadow-[#005bb3]/20 cursor-pointer transition-all"
                    >
                      Confirmar Atribuição
                    </button>
                  </div>
                </div>

              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal: Edit Task - Matches Mockup Exactly */}
        <AnimatePresence>
          {editingTask && (
            <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 select-text">
              {/* Sibling Backdrop Overlay */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setEditingTask(null)}
                className="absolute inset-0 bg-[#131b2e]/60 backdrop-blur-[4px] cursor-pointer"
              />
              
              {/* Sibling Modal Content Card */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
                className="relative bg-white w-full max-w-lg rounded-xl shadow-2xl flex flex-col max-h-[92vh] font-sans text-on-surface overflow-hidden border border-outline-variant/60 cursor-default z-10"
                style={{ width: '100%', maxWidth: '32rem' }}
              >
                {/* Modal Header */}
                <div className="p-md border-b border-outline-variant flex justify-between items-center select-none shrink-0">
                  <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Editar Tarefa</h2>
                  <div className="flex items-center gap-xs">
                    {/* Archive button */}
                    <button 
                      type="button"
                      onClick={() => {
                        if (confirm("Deseja realmente arquivar esta tarefa?")) {
                          const updated = tasks.map(t => t.id === editingTask.id ? { ...t, status: 'completed' as const } : t);
                          setTasks(updated);
                          setEditingTask(null);
                          alert("Tarefa arquivada com sucesso! 📦");
                        }
                      }}
                      className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors active:scale-90 group cursor-pointer bg-transparent border-none"
                      title="Arquivar Tarefa"
                    >
                      <span className="material-symbols-outlined text-slate-500" style={{ color: '#64748b' }}>archive</span>
                    </button>
                    {/* Delete button (Lixeira) */}
                    <button 
                      type="button"
                      onClick={() => {
                        if (confirm("Deseja realmente excluir permanentemente esta tarefa?")) {
                          const taskIdToDelete = editingTask.id;
                          const updated = tasks.filter(t => t.id !== taskIdToDelete);
                          setTasks(updated);
                          setEditingTask(null);

                          // Salvar na fila de exclusões pendentes para robustez offline
                          try {
                            const pending = JSON.parse(localStorage.getItem('abba_pending_task_deletions') || '[]');
                            if (!pending.includes(taskIdToDelete)) {
                              pending.push(taskIdToDelete);
                              localStorage.setItem('abba_pending_task_deletions', JSON.stringify(pending));
                            }
                          } catch (e) {
                            console.error(e);
                          }

                          // Deletar do Supabase para persistência total!
                          (async () => {
                            try {
                              const { error } = await supabase
                                .from('tasks')
                                .delete()
                                .eq('id', taskIdToDelete);
                              if (!error) {
                                console.log(`🗑️ Tarefa "${taskIdToDelete}" excluída do Supabase!`);
                                try {
                                  const pending = JSON.parse(localStorage.getItem('abba_pending_task_deletions') || '[]');
                                  const remaining = pending.filter((id: string) => id !== taskIdToDelete);
                                  localStorage.setItem('abba_pending_task_deletions', JSON.stringify(remaining));
                                } catch (e) {
                                  console.error(e);
                                }
                              } else {
                                console.warn('Erro ao deletar tarefa no Supabase:', error);
                              }
                            } catch (err) {
                              console.warn('Falha na comunicação com o Supabase ao excluir tarefa:', err);
                            }
                          })();

                          alert("Tarefa excluída com sucesso! 🗑️");
                        }
                      }}
                      className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors active:scale-90 group cursor-pointer bg-transparent border-none"
                      title="Excluir Tarefa"
                    >
                      <img src="/icones/lixeira.svg" alt="Excluir" className="w-[20px] h-[20px] object-contain inline-block" />
                    </button>
                    {/* Close button from mockup */}
                    <button 
                      type="button"
                      onClick={() => setEditingTask(null)}
                      className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-variant transition-colors active:scale-90 cursor-pointer bg-transparent border-none"
                      title="Fechar"
                    >
                      <span className="material-symbols-outlined text-on-surface-variant">close</span>
                    </button>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="p-md space-y-md overflow-y-auto">
                  {/* Task Name */}
                  <div className="space-y-xs">
                    <label className="font-label-md text-label-md text-on-surface-variant ml-1 font-medium">Nome da Tarefa</label>
                    <input 
                      className="w-full px-md py-sm bg-surface border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md text-body-md text-on-surface" 
                      type="text" 
                      value={editTaskTitle}
                      onChange={(e) => setEditTaskTitle(e.target.value)}
                    />
                  </div>

                  {/* Due Date & Priority Grid */}
                  <div className="grid grid-cols-2 gap-md">
                    <div className="space-y-xs">
                      <label className="font-label-md text-label-md text-on-surface-variant ml-1 font-medium">Data de Entrega</label>
                      <input 
                        className="w-full px-md py-sm bg-surface border border-outline-variant rounded-lg focus:border-primary outline-none transition-all font-body-md text-body-md text-on-surface" 
                        type="date" 
                        value={editTaskDueDate}
                        onChange={(e) => setEditTaskDueDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-xs">
                      <label className="font-label-md text-label-md text-on-surface-variant ml-1 font-medium">Prioridade</label>
                      <div className="relative">
                        <select 
                          className="w-full px-md py-sm bg-surface border border-outline-variant rounded-lg focus:border-primary outline-none transition-all font-body-md text-body-md text-on-surface appearance-none cursor-pointer"
                          value={editTaskPriority}
                          onChange={(e) => setEditTaskPriority(e.target.value as 'Alta' | 'Média' | 'Baixa')}
                        >
                          <option value="Alta">Alta</option>
                          <option value="Média">Média</option>
                          <option value="Baixa">Baixa</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-lg font-variation-settings-fill">arrow_drop_down</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-xs">
                    <label className="font-label-md text-label-md text-on-surface-variant ml-1 font-medium">Descrição / Objetivos</label>
                    <textarea 
                      className="w-full px-md py-sm bg-surface border border-outline-variant rounded-lg focus:border-primary outline-none transition-all font-body-md text-body-md text-on-surface resize-none" 
                      rows={3}
                      value={editTaskDescription}
                      onChange={(e) => setEditTaskDescription(e.target.value)}
                    />
                  </div>

                  {/* Assign To Section */}
                  <div className="space-y-sm">
                    <div className="flex justify-between items-center">
                      <label className="font-label-md text-label-md text-on-surface-variant ml-1 font-medium">Atribuir a</label>
                      <button 
                        type="button"
                        onClick={() => setShowEditAssignPanel(prev => !prev)}
                        className="text-primary font-label-sm text-label-sm hover:underline bg-transparent border-none cursor-pointer font-bold"
                      >
                        {showEditAssignPanel ? 'Ocultar Filtro' : 'Ver todos'}
                      </button>
                    </div>

                    <div className="flex -space-x-2 items-center">
                      {editTaskAssignedStudentIds.slice(0, 3).map(id => {
                        const student = students.find(s => s.id === id);
                        if (!student) return null;
                        return (
                          <div key={student.id} className="w-10 h-10 rounded-full border-2 border-surface-container-lowest overflow-hidden shrink-0 shadow-sm animate-fade-in">
                            <img src={student.img} alt={student.name} className="w-full h-full object-cover" />
                          </div>
                        );
                      })}
                      {editTaskAssignedStudentIds.length > 3 && (
                        <div className="w-10 h-10 rounded-full border-2 border-surface-container-lowest bg-surface-variant flex items-center justify-center text-primary font-label-sm text-label-sm font-bold shrink-0 shadow-sm animate-fade-in">
                          +{editTaskAssignedStudentIds.length - 3}
                        </div>
                      )}
                      {editTaskAssignedStudentIds.length === 0 && (
                        <p className="text-xs text-slate-400 italic py-1 pl-2">Nenhum aluno atribuído</p>
                      )}
                      
                      <button 
                        type="button"
                        onClick={() => setShowEditAssignPanel(prev => !prev)}
                        className="ml-4 w-10 h-10 rounded-full border border-dashed border-outline-variant flex items-center justify-center text-outline hover:border-primary hover:text-primary transition-colors cursor-pointer bg-white shrink-0"
                      >
                        <span className="material-symbols-outlined">person_add</span>
                      </button>
                    </div>

                    {showEditAssignPanel && (
                      <div className="mt-2 p-4 bg-[#f2f3ff]/50 border border-outline-variant/60 rounded-xl space-y-2 animate-fade-in max-h-48 overflow-y-auto">
                        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Selecionar Alunos</p>
                        <input
                          type="text"
                          placeholder="Buscar aluno..."
                          value={editTaskStudentSearchQuery}
                          onChange={(e) => setEditTaskStudentSearchQuery(e.target.value)}
                          className="w-full bg-white border border-[#c1c6d6] rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-[#005bb3] outline-none"
                        />
                        <div className="space-y-1.5 mt-2">
                          {students
                            .filter(s => s.name.toLowerCase().includes(editTaskStudentSearchQuery.toLowerCase()))
                            .map(s => {
                              const isChecked = editTaskAssignedStudentIds.includes(s.id);
                              return (
                                <div 
                                  key={s.id}
                                  onClick={() => {
                                    setEditTaskAssignedStudentIds(prev => 
                                      prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                                    );
                                  }}
                                  className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-100 hover:border-primary/30 transition-colors cursor-pointer select-none"
                                >
                                  <div className="flex items-center gap-2">
                                    <img 
                                      src={s.img || "/padrao/foto-do-perfil.avif"} 
                                      alt={s.name} 
                                      className="w-7 h-7 rounded-full object-cover border" 
                                      onError={(e) => {
                                        e.currentTarget.src = "/padrao/foto-do-perfil.avif";
                                      }}
                                    />
                                    <span className="font-semibold text-xs text-[#131b2e]">{s.name}</span>
                                  </div>
                                  <span className={`material-symbols-outlined text-[18px] ${isChecked ? 'text-primary' : 'text-slate-300'}`}>
                                    {isChecked ? 'check_circle' : 'circle'}
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="p-md border-t border-outline-variant bg-surface-container-low flex gap-md shrink-0">
                  <button 
                    type="button"
                    onClick={() => setEditingTask(null)}
                    className="flex-1 py-3 px-md border border-outline text-on-surface-variant font-label-md text-label-md rounded-lg active:scale-95 transition-all hover:bg-surface-variant/50 cursor-pointer bg-white"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      if (!editTaskTitle.trim()) {
                        alert('Por favor, informe o nome da tarefa.');
                        return;
                      }
                      if (!editingTask) return;
                      const updatedTask: TaskItem = {
                        ...editingTask,
                        title: editTaskTitle.trim(),
                        dueDate: editTaskDueDate,
                        description: editTaskDescription.trim(),
                        priority: editTaskPriority,
                        assignedStudentIds: editTaskAssignedStudentIds,
                      } as TaskItem;
                      setUploadedSupportFiles(editingTask.supportFiles || []);
                      setSupportFilesModal({
                        isOpen: true,
                        task: updatedTask,
                        isNew: false,
                        assignedStudentIds: editTaskAssignedStudentIds
                      });
                    }}
                    className="flex-1 py-3 px-md bg-primary text-on-primary font-label-md text-label-md rounded-lg font-bold shadow-md shadow-primary/20 active:scale-95 transition-all hover:brightness-110 cursor-pointer border-none"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal: Student Assignment from Details View */}
        <AnimatePresence>
          {isAssigningStudentsDetails && (
            <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center select-text">
              {/* Sibling Backdrop Overlay */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => { setIsAssigningStudentsDetails(null); setShowSharePanel(false); setShareTaskLinks({}); }}
                className="absolute inset-0 cursor-pointer"
                style={{ backgroundColor: 'rgba(19, 27, 46, 0.4)', backdropFilter: 'blur(4px)' }}
              />
              
              {/* Sibling Modal Content Card */}
              <motion.div 
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 28, stiffness: 260 }}
                onClick={(e) => e.stopPropagation()}
                className="relative bg-surface w-full max-w-md sm:rounded-xl shadow-xl flex flex-col h-[85vh] sm:h-[680px] sm:max-h-[90vh] font-sans text-on-surface overflow-hidden border border-outline-variant/60 shrink-0 cursor-default z-10"
                style={{ width: '100%', maxWidth: '28rem' }}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-lg py-md border-b border-outline-variant select-none shrink-0">
                  <h2 className="font-headline-md text-headline-md text-on-surface">Selecionar Alunos</h2>
                  <button 
                    type="button"
                    onClick={() => { setIsAssigningStudentsDetails(null); setShowSharePanel(false); setShareTaskLinks({}); }}
                    className="p-2 hover:bg-surface-container-low rounded-full transition-colors active:scale-95 text-on-surface-variant cursor-pointer bg-transparent border-none flex items-center justify-center"
                    title="Fechar"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                {/* Scrollable Container */}
                <div className="flex-1 overflow-y-auto px-lg py-md space-y-md custom-scrollbar bg-surface select-text">
                  
                  {/* Search and Select All */}
                  <div className="space-y-sm select-none">
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-4 text-outline">search</span>
                      <input 
                        className="w-full pl-11 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-body-md text-body-md transition-all text-on-surface" 
                        placeholder="Filtrar por nome do aluno..." 
                        type="text"
                        value={detailsAssignSearchQuery}
                        onChange={(e) => setDetailsAssignSearchQuery(e.target.value)}
                      />
                    </div>
                    
                    {(() => {
                      const filtered = students.filter(s => 
                        s.name.toLowerCase().includes(detailsAssignSearchQuery.toLowerCase())
                      );
                      const allSelected = filtered.length > 0 && filtered.every(s => tempDetailsAssignedStudentIds.includes(s.id));
                      
                      return (
                        <div className="flex items-center justify-between py-1">
                          <label className="flex items-center gap-sm cursor-pointer group">
                            <input 
                              className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary transition-all cursor-pointer" 
                              type="checkbox"
                              checked={allSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setTempDetailsAssignedStudentIds(prev => {
                                    const union = new Set([...prev, ...filtered.map(s => s.id)]);
                                    return Array.from(union);
                                  });
                                } else {
                                  const filteredIds = filtered.map(s => s.id);
                                  setTempDetailsAssignedStudentIds(prev => prev.filter(id => !filteredIds.includes(id)));
                                }
                              }}
                            />
                            <span className="font-label-md text-label-md text-on-surface-variant group-hover:text-on-surface transition-colors font-medium">
                              Selecionar todos os alunos
                            </span>
                          </label>
                          <span className="font-label-sm text-label-sm text-outline">
                            {filtered.length} {filtered.length === 1 ? 'aluno' : 'alunos'}
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Student Checklist Container */}
                  <div className="max-h-[220px] overflow-y-auto p-sm border border-outline-variant/40 rounded-xl space-y-2 bg-[#f8fafc]/30 custom-scrollbar select-none">
                    {(() => {
                      const filtered = students.filter(s => 
                        s.name.toLowerCase().includes(detailsAssignSearchQuery.toLowerCase())
                      );
                      
                      if (filtered.length === 0) {
                        return (
                          <div className="flex flex-col items-center justify-center py-6 text-center">
                            <span className="material-symbols-outlined text-outline text-3xl mb-1">person_off</span>
                            <p className="font-body-md text-body-md text-on-surface-variant italic">Nenhum aluno encontrado.</p>
                          </div>
                        );
                      }
                      
                      return filtered.map(student => {
                        const isChecked = tempDetailsAssignedStudentIds.includes(student.id);
                        return (
                          <label 
                            key={student.id}
                            className="flex items-center p-sm bg-white border border-outline-variant rounded-xl hover:border-primary-container hover:bg-slate-50 transition-all cursor-pointer group"
                          >
                            <img 
                              alt={student.name} 
                              className="w-10 h-10 rounded-full object-cover border shrink-0" 
                              src={student.img || "/padrao/foto-do-perfil.avif"}
                              onError={(e) => {
                                e.currentTarget.src = "/padrao/foto-do-perfil.avif";
                              }}
                            />
                            <div className="ml-md flex-1 min-w-0">
                              <p className="font-body-md text-body-md text-on-surface font-medium truncate">{student.name}</p>
                              <p className="font-label-sm text-label-sm text-on-surface-variant">Matrícula: {student.matricula || '202300000'}</p>
                            </div>
                            <input 
                              className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary transition-all cursor-pointer shrink-0" 
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setTempDetailsAssignedStudentIds(prev => [...prev, student.id]);
                                } else {
                                  setTempDetailsAssignedStudentIds(prev => prev.filter(id => id !== student.id));
                                }
                              }}
                            />
                          </label>
                        );
                      });
                    })()}
                  </div>

                  {/* Main Action Buttons */}
                  <div className="flex flex-col gap-sm select-none border-t border-outline-variant/30 pt-md">
                    <button 
                      type="button"
                      onClick={() => {
                        const updatedTask = {
                          ...isAssigningStudentsDetails,
                          assignedStudentIds: tempDetailsAssignedStudentIds
                        } as TaskItem;
                        setTasks(prev => prev.map(t => t.id === isAssigningStudentsDetails.id ? updatedTask : t));
                        setSelectedTaskDetails(updatedTask);
                        setIsAssigningStudentsDetails(null);
                        setShowSharePanel(false);
                        setShareTaskLinks({});

                        // Trigger the beautiful visual overlay
                        showAssignmentSuccessOverlay(updatedTask.title, updatedTask.id, tempDetailsAssignedStudentIds);
                      }}
                      className="w-full py-3.5 bg-primary text-on-primary font-label-md text-label-md rounded-lg shadow-sm hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer border-none flex items-center justify-center font-semibold"
                    >
                      Confirmar Seleção
                    </button>
                    <button 
                      type="button"
                      onClick={() => { setIsAssigningStudentsDetails(null); setShowSharePanel(false); setShareTaskLinks({}); }}
                      className="w-full py-3.5 bg-surface text-secondary font-label-md text-label-md rounded-lg border border-outline-variant hover:bg-surface-container-low active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center font-medium"
                    >
                      Cancelar
                    </button>
                  </div>

                  {/* Animated Share Panel */}
                  <AnimatePresence>
                    {showSharePanel && (
                      <motion.div
                        key="share-panel"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div className="pt-md pb-xs">
                          {/* Question Header */}
                          <div className="flex items-center gap-sm mb-md p-md rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.10) 0%, rgba(139,92,246,0.10) 100%)', border: '1px solid rgba(99,102,241,0.18)' }}>
                            <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>send</span>
                            <p className="font-label-md text-label-md text-on-surface font-semibold" style={{ lineHeight: 1.4 }}>
                              Deseja enviar o código da tarefa para quais alunos?
                            </p>
                          </div>

                          {/* Students List */}
                          <div className="flex flex-col gap-sm">
                            {tempDetailsAssignedStudentIds.length === 0 && (
                              <p className="text-center text-on-surface-variant font-body-sm text-body-sm py-4">Nenhum aluno selecionado.</p>
                            )}
                            {tempDetailsAssignedStudentIds.map((sid) => {
                              const student = students.find(s => s.id === sid);
                              if (!student) return null;
                              const hasLink = !!shareTaskLinks[sid];
                              return (
                                <motion.div
                                  key={sid}
                                  initial={{ opacity: 0, y: 6 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.25 }}
                                  className="rounded-xl border border-outline-variant overflow-hidden"
                                  style={{ background: 'rgba(255,255,255,0.03)' }}
                                >
                                  {/* Student row with avatar, name + code generator input + generate button */}
                                  <div className="flex items-center gap-sm p-sm">
                                    <img
                                      src={student.img || "/padrao/foto-do-perfil.avif"}
                                      alt={student.name}
                                      className="rounded-full shrink-0 border-2 border-primary/30"
                                      style={{ width: 40, height: 40, objectFit: 'cover' }}
                                      onError={(e) => {
                                        e.currentTarget.src = "/padrao/foto-do-perfil.avif";
                                      }}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="font-label-md text-label-md text-on-surface truncate font-semibold">{student.name}</p>
                                      <p className="font-body-sm text-body-sm text-on-surface-variant truncate">{student.class}</p>
                                    </div>

                                    {/* Code generator input field next to the link icon */}
                                    <div className="flex items-center gap-xs">
                                      <input 
                                        type="text"
                                        readOnly
                                        value={hasLink ? shareTaskLinks[sid].split('?code=')[1] : ''}
                                        placeholder="Gerar código..."
                                        className="w-24 bg-slate-50 border border-[#c1c6d6] rounded-lg px-2 py-1 text-[10px] font-mono text-center outline-none select-all text-slate-600"
                                      />
                                      <button
                                        type="button"
                                        title="Gerar link da tarefa"
                                        onClick={() => {
                                          if (!isAssigningStudentsDetails) return;
                                          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                                          let codeVal = '';
                                          for (let i = 0; i < 6; i++) {
                                            codeVal += chars.charAt(Math.floor(Math.random() * chars.length));
                                          }
                                          const shortCode = `ATV-${codeVal}`;
                                          const link = `${window.location.origin}?code=${shortCode}`;
                                          setShareTaskLinks(prev => ({ ...prev, [sid]: link }));
                                          
                                          const newLinkItem = { 
                                            id: shortCode, 
                                            studentName: student.name, 
                                            link, 
                                            taskId: isAssigningStudentsDetails.id, 
                                            taskTitle: isAssigningStudentsDetails.title,
                                            createdAt: new Date().toISOString() 
                                          };
                                          setDbTaskLinks(prev => [newLinkItem, ...prev]);

                                          // Save to local registry so it can be verified offline
                                          const registryKey = 'abba_invite_codes_registry';
                                          const currentRegistry = localStorage.getItem(registryKey);
                                          const registryList = currentRegistry ? JSON.parse(currentRegistry) : [];
                                          
                                          const existingIndex = registryList.findIndex((item: any) => item.code === shortCode);
                                          if (existingIndex !== -1) {
                                            registryList[existingIndex].taskId = isAssigningStudentsDetails.id;
                                            registryList[existingIndex].taskTitle = isAssigningStudentsDetails.title;
                                            registryList[existingIndex].name = student.name;
                                            registryList[existingIndex].codeId = `st-${student.id}`;
                                          } else {
                                            registryList.push({
                                              code: shortCode,
                                              name: student.name,
                                              expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
                                              codeId: `st-${student.id}`,
                                              taskId: isAssigningStudentsDetails.id,
                                              taskTitle: isAssigningStudentsDetails.title
                                            });
                                          }
                                          localStorage.setItem(registryKey, JSON.stringify(registryList));
 
                                          // Add to unsynced queue for offline storage
                                          const unsynced = JSON.parse(localStorage.getItem('abba_unsynced_teacher_links') || '[]');
                                          localStorage.setItem('abba_unsynced_teacher_links', JSON.stringify([newLinkItem, ...unsynced]));
                                          
                                          // Fire async background sync attempt
                                          syncTeacherLinks();
                                        }}
                                        className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 cursor-pointer border-none"
                                        style={{
                                          background: hasLink
                                            ? 'linear-gradient(135deg, #11bb4f, #32b966)'
                                            : 'rgba(99,102,241,0.12)',
                                          color: hasLink ? '#fff' : '#11bb4f'
                                        }}
                                      >
                                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                                          {hasLink ? 'link' : 'add_link'}
                                        </span>
                                      </button>
                                    </div>
                                  </div>

                                  {/* Generated link container – slides in */}
                                  <AnimatePresence>
                                    {hasLink && (
                                      <motion.div
                                        key={`link-${sid}`}
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                                        style={{ overflow: 'hidden' }}
                                      >
                                        <div className="px-sm pb-sm">
                                          <div
                                            className="rounded-lg p-sm flex items-center justify-between gap-sm"
                                            style={{
                                              background: 'linear-gradient(135deg, rgba(99,102,241,0.07) 0%, rgba(139,92,246,0.07) 100%)',
                                              border: '1px solid rgba(99,102,241,0.15)'
                                            }}
                                          >
                                            <div className="flex-1 min-w-0 text-left space-y-1">
                                              <p className="font-body-sm text-body-sm text-slate-700 leading-relaxed">
                                                Olá, <span className="font-extrabold text-[#131b2e]">{student.name}</span> 👋🏾
                                              </p>
                                              <p className="font-body-sm text-body-sm text-slate-600 leading-normal">
                                                Seu <span className="font-bold text-[#131b2e]">código da tarefa</span> é:
                                              </p>
                                              <p className="font-body-sm text-body-sm text-primary font-bold truncate" style={{ wordBreak: 'break-all' }}>
                                                {shareTaskLinks[sid]}
                                              </p>
                                              
                                              <div className="pt-2 border-t border-slate-100 mt-2">
                                                <p className="font-label-sm text-label-sm font-extrabold text-[#131b2e] mb-0.5">
                                                  *Como usar?*
                                                </p>
                                                <p className="text-[10px] text-slate-500 leading-relaxed">
                                                  Na <span className="font-bold text-slate-700">Área do aluno</span>, em <span className="font-bold text-slate-700">Upload de atividade</span>, coloque o <span className="font-bold text-slate-700">link</span> no campo de <span className="font-bold text-slate-700">Fazer o upload por link</span>
                                                </p>
                                              </div>
                                            </div>

                                            {/* Copy button on the right */}
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const msg = `Olá, *${student.name}* 👋🏾\nSeu *código da tarefa* é:\n${shareTaskLinks[sid]}\n\n*Como usar?*\nNa *Área do aluno*, em *Upload de atividade*, coloque o *link* no campo de *Fazer o upload por link*`;
                                                navigator.clipboard.writeText(msg);
                                                setCopiedShareId(sid);
                                                setTimeout(() => setCopiedShareId(null), 2200);
                                              }}
                                              className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all active:scale-95 cursor-pointer border-none"
                                              style={{
                                                background: copiedShareId === sid
                                                  ? 'rgba(34,197,94,0.15)'
                                                  : 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.18))',
                                                color: copiedShareId === sid ? '#22c55e' : '#6366f1'
                                              }}
                                              title="Copiar Mensagem"
                                            >
                                              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                                                {copiedShareId === sid ? 'check_circle' : 'content_copy'}
                                              </span>
                                            </button>
                                          </div>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </motion.div>
                              );
                            })}
                          </div>

                          {/* Concluir button at the bottom of the list */}
                          {tempDetailsAssignedStudentIds.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                if (isAssigningStudentsDetails) {
                                  const updatedTask = {
                                    ...isAssigningStudentsDetails,
                                    assignedStudentIds: tempDetailsAssignedStudentIds
                                  } as TaskItem;
                                  setTasks(prev => prev.map(t => t.id === isAssigningStudentsDetails.id ? updatedTask : t));
                                  setSelectedTaskDetails(updatedTask);
                                  setIsAssigningStudentsDetails(null);
                                  setShowSharePanel(false);
                                  setShareTaskLinks({});

                                  // Trigger the beautiful success overlay
                                  showAssignmentSuccessOverlay(updatedTask.title, updatedTask.id, tempDetailsAssignedStudentIds);
                                }
                              }}
                              className="mt-md w-full py-3 rounded-lg font-label-md text-label-md font-semibold transition-all active:scale-95 cursor-pointer border-none flex items-center justify-center gap-xs"
                              style={{ background: 'linear-gradient(135deg, #11bb4f, #32b966)', color: '#fff' }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check</span>
                              Concluir
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Dummy ref to scroll to bottom */}
                  <div ref={modalBottomRef} className="h-2" />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Success Modal: Student Assignment Confirmation with Offline Access Controls */}
        <AnimatePresence>
          {assignedModalInfo && (
            <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 select-text">
              {/* Sibling Backdrop Overlay */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setAssignedModalInfo(null)}
                className="absolute inset-0 cursor-pointer"
                style={{ backgroundColor: 'rgba(19, 27, 46, 0.65)', backdropFilter: 'blur(8px)' }}
              />
              
              {/* Sibling Modal Content Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                onClick={(e) => e.stopPropagation()}
                className="relative bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200/60 overflow-hidden flex flex-col text-on-surface cursor-default max-h-[85vh] z-10"
                style={{ width: '100%', maxWidth: '48rem' }}
              >
                {/* Modal Header */}
                <div className="flex items-center gap-4 p-6 md:p-8 border-b border-slate-100 bg-[#f8fafc]/50 shrink-0">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#005bb3] to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-[#005bb3]/20 shrink-0">
                    <span className="material-symbols-outlined font-black" style={{ fontSize: '26px' }}>task_alt</span>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <h3 className="text-lg md:text-xl font-black text-[#131b2e] tracking-tight">Atribuição Concluída com Sucesso!</h3>
                    <p className="text-xs text-slate-500 font-semibold truncate mt-[2px]">
                      Matéria Atribuída: <span className="text-[#005bb3] font-bold">{assignedModalInfo.taskTitle}</span>
                    </p>
                  </div>
                  <button 
                    onClick={() => setAssignedModalInfo(null)}
                    className="w-8 h-8 rounded-full hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 transition-all cursor-pointer flex items-center justify-center border-none bg-transparent"
                  >
                    <span className="material-symbols-outlined font-bold" style={{ fontSize: '20px' }}>close</span>
                  </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar text-left">
                  {/* General Notification Notice */}
                  <div className="p-4 rounded-2xl bg-[#f2f3ff] border border-[#d6e3ff] flex gap-3 text-[#005bb3] items-start">
                    <span className="material-symbols-outlined shrink-0 mt-[2px]" style={{ fontSize: '20px' }}>info</span>
                    <p className="text-xs font-semibold leading-relaxed">
                      A matéria já foi disponibilizada no portal dos alunos. Escolha abaixo como prefere enviar as instruções de acesso para cada estudante.
                    </p>
                  </div>

                  {/* Students List */}
                  <div className="space-y-4">
                    {assignedModalInfo.students.map((student, idx) => {
                      const hasLink = !!student.link;
                      const hasCode = !!student.code;
                      const isLinkCopied = copiedStudentItem?.id === student.id && copiedStudentItem?.type === 'link';
                      const isCodeCopied = copiedStudentItem?.id === student.id && copiedStudentItem?.type === 'code';
                      const studentImg = students.find(s => s.id === student.id)?.img || "/padrao/foto-do-perfil.avif";

                      return (
                        <div 
                          key={student.id} 
                          className="p-5 rounded-2xl border border-slate-200/80 bg-white hover:border-[#005bb3]/30 hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                        >
                          {/* Left Side: Avatar, Student details and direct Link */}
                          <div className="flex items-center gap-3.5 flex-1 min-w-0">
                            <div className="w-12 h-12 rounded-full border-2 border-[#00c853] overflow-hidden shadow-sm shrink-0 bg-white select-none">
                              <img 
                                src={studentImg} 
                                alt={student.name} 
                                className="w-full h-full object-cover" 
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-black text-[#131b2e] leading-tight">{student.name}</h4>
                            </div>
                          </div>

                          {/* Right Side: Options Buttons */}
                          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto shrink-0 select-none">

                            {/* Copy Code Button */}
                            <button
                              type="button"
                              onClick={() => {
                                if (student.code) {
                                  navigator.clipboard.writeText(student.code);
                                  setCopiedStudentItem({ id: student.id, type: 'code' });
                                  setTimeout(() => setCopiedStudentItem(null), 2000);
                                }
                              }}
                              className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                                isCodeCopied 
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm' 
                                  : 'bg-amber-50 hover:bg-amber-500 hover:text-white border-amber-200 text-amber-700'
                              }`}
                              title={`Código: ${student.code}`}
                            >
                              <span className="material-symbols-outlined text-[15px]">
                                {isCodeCopied ? 'check' : 'key'}
                              </span>
                              {isCodeCopied ? 'Copiado!' : `Código: ${student.code}`}
                            </button>

                            {/* Download TXT Button */}
                            <button
                              type="button"
                              onClick={() => handleDownloadStudentTaskCode(student.name, assignedModalInfo.taskTitle, student.code || '', student.link || '')}
                              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-[#0052cc]/10 hover:bg-[#0052cc] hover:text-white border border-[#0052cc]/20 text-[#0052cc] transition-all cursor-pointer"
                              title="Baixar Ficha de Instruções de Acesso (.txt)"
                            >
                              <span className="material-symbols-outlined text-[15px]">download</span>
                              Ficha de Acesso (.txt)
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-6 md:p-8 border-t border-slate-100 bg-[#f8fafc]/50 flex justify-end shrink-0 select-none">
                  <button 
                    type="button"
                    onClick={() => setAssignedModalInfo(null)}
                    className="px-8 py-3 rounded-xl bg-[#005bb3] hover:bg-[#004b93] text-white text-xs font-extrabold shadow-lg shadow-[#005bb3]/15 hover:shadow-xl hover:shadow-[#005bb3]/25 active:scale-95 transition-all cursor-pointer border-none"
                  >
                    Concluir Atribuição
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {isAddStudentOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsAddStudentOpen(false)}
            className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center select-text cursor-pointer"
            style={{ backgroundColor: 'rgba(19, 27, 46, 0.4)', backdropFilter: 'blur(4px)' }}
          >
            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface w-full max-w-md sm:rounded-xl shadow-xl flex flex-col h-[85vh] sm:h-[680px] sm:max-h-[90vh] font-sans text-on-surface overflow-hidden border border-outline-variant/60 shrink-0 cursor-default"
              style={{ width: '100%', maxWidth: '28rem' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-lg py-md border-b border-outline-variant select-none shrink-0">
                <h2 className="font-headline-md text-headline-md text-on-surface">Adicionar Novo Aluno</h2>
                <button 
                  type="button"
                  onClick={() => setIsAddStudentOpen(false)}
                  className="p-2 hover:bg-surface-container-low rounded-full transition-colors active:scale-95 text-on-surface-variant cursor-pointer bg-transparent border-none flex items-center justify-center"
                  title="Fechar"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Scrollable Container Body */}
              <div className="flex-1 overflow-y-auto px-lg py-md space-y-md custom-scrollbar bg-surface select-text">
                <div className="space-y-4">
                  {/* Name field */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider pl-1">Nome Completo</label>
                    <input
                      type="text"
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      placeholder="Ex: Beatriz Silva"
                      className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-body-md text-body-md transition-all text-on-surface"
                    />
                  </div>

                  {/* Email field */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider pl-1">E-mail</label>
                    <input
                      type="email"
                      value={newStudentEmail}
                      onChange={(e) => setNewStudentEmail(e.target.value)}
                      placeholder="Ex: beatriz.silva@email.com"
                      className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-body-md text-body-md transition-all text-on-surface"
                    />
                  </div>

                  {/* Class field */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider pl-1">Informação adicional</label>
                    <input
                      type="text"
                      value={newStudentClass}
                      onChange={(e) => setNewStudentClass(e.target.value)}
                      placeholder="Ex: Aluno da IFSC"
                      className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-body-md text-body-md transition-all text-on-surface"
                    />
                  </div>

                  {/* Animated Invite Generator Panel */}
                  <div className="pt-md pb-xs space-y-md">
                    {/* Section Header */}
                    <div className="flex items-center gap-sm p-sm rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.10) 0%, rgba(139,92,246,0.10) 100%)', border: '1px solid rgba(99,102,241,0.18)' }}>
                      <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>group_add</span>
                      <p className="font-label-md text-label-md text-on-surface font-semibold" style={{ lineHeight: 1.4 }}>
                        Deseja gerar o convite inteligente de boas-vindas?
                      </p>
                    </div>

                    {/* Action Buttons for Code and Link */}
                    <div className="grid grid-cols-1 gap-sm">
                      {/* Code Option */}
                      <div className="flex flex-col gap-xs p-sm bg-[#faf8ff] border border-outline-variant/60 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Opção 1: Código</span>
                        <p className="text-[11px] text-slate-500 leading-normal mb-sm">Gera o código de acesso para a tela de login.</p>
                        <button
                          type="button"
                          onClick={() => {
                            if (!newStudentName.trim()) {
                              alert('Por favor, informe o nome do aluno.');
                              return;
                            }

                            if (!newStudentEmail.trim()) {
                              alert('Por favor, preencha o e-mail do aluno para gerar o convite por código.');
                              return;
                            }
                            const emailLower = newStudentEmail.trim().toLowerCase();
                            const emailRegex = /^[a-zA-Z0-9._%+-]+@(?:gmail|outlook)\.com$/;
                            if (!emailRegex.test(emailLower)) {
                              alert('E-mail inválido. O e-mail deve ser do formato @gmail.com ou @outlook.com.');
                              return;
                            }

                            const tempId = 'st-' + Math.random().toString(36).substring(2, 9);
                            const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
                            
                            // Generate a simple 6-char alphanumeric code (e.g., K9X8J2)
                            const generateSimpleCode = () => {
                              const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                              let res = '';
                              for (let i = 0; i < 6; i++) {
                                res += chars.charAt(Math.floor(Math.random() * chars.length));
                              }
                              return res;
                            };
                            const code = generateSimpleCode();

                            // Save to local registry so App.tsx and AuthScreens.tsx can decode it!
                            const registryKey = 'abba_invite_codes_registry';
                            const currentRegistry = localStorage.getItem(registryKey);
                            const registryList = currentRegistry ? JSON.parse(currentRegistry) : [];
                            registryList.push({
                              code: code,
                              name: newStudentName.trim(),
                              expiresAt: expiry,
                              codeId: tempId
                            });
                            localStorage.setItem(registryKey, JSON.stringify(registryList));
                            
                            const guessedGender = (() => {
                              const firstName = newStudentName.split(' ')[0].toLowerCase();
                              if (firstName.endsWith('a') || ['beatriz', 'alice', 'yasmin', 'isabel', 'raquel', 'ruth', 'irene'].includes(firstName)) {
                                  return 'F';
                              }
                              return 'M';
                            })();
                            
                            const welcomeWord = guessedGender === 'F' ? 'bem-vinda' : 'bem-vindo';
                            const msg = `Olá, *${newStudentName.trim()}* 👋🏾\nSeja muito ${welcomeWord} ao *Abba Digital*!\n\nUse o seu *código de acesso* na página de login do aluno para entrar:\nSeu código: *${code}*\n\n*Como entrar?*\nNa tela de login do Abba Digital, clique na aba *Entrar com código* e cole o código acima para acessar sua conta!`;
                            
                            // Copy message
                            navigator.clipboard.writeText(msg);

                            logUserAction({
                              userName: teacherName,
                              userEmail: teacherEmail,
                              role: 'teacher',
                              actionType: 'add_student',
                              actionDetails: `Gerou convite com código de acesso para o aluno "${newStudentName.trim()}" (${emailLower}).`
                            });
                            setIsAddStudentOpen(false);
                            setNewStudentName('');
                            setNewStudentEmail('');
                            setNewStudentClass('');
                            setNewStudentProgress(0);

                            alert(`✅ Convite gerado com sucesso!\n\nO convite com o código de acesso para "${newStudentName.trim()}" foi copiado para a sua área de transferência (Ctrl+V para enviar no WhatsApp). Ele aparecerá na lista de alunos do dashboard assim que realizar o primeiro login!`);
                          }}
                          className="w-full py-2 bg-slate-50 hover:bg-[#d6e3ff] hover:text-[#005bb3] text-slate-600 font-label-sm text-label-sm font-bold rounded-lg transition-all active:scale-[0.97] cursor-pointer border border-outline-variant/60 flex items-center justify-center gap-xs"
                        >
                          <span className="material-symbols-outlined text-sm">
                            content_copy
                          </span>
                          Copiar por Código
                        </button>
                      </div>

                      {/* Link Option */}
                      <div className="flex flex-col gap-xs p-sm bg-[#faf8ff] border border-outline-variant/60 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Opção 2: Link</span>
                        <p className="text-[11px] text-slate-500 leading-normal mb-sm">Gera o link mágico para login automático.</p>
                        <button
                          type="button"
                          onClick={() => {
                            if (!newStudentName.trim()) {
                              alert('Por favor, informe o nome do aluno.');
                              return;
                            }

                            if (!newStudentEmail.trim()) {
                              alert('Por favor, preencha o e-mail do aluno para gerar o convite por link.');
                              return;
                            }
                            const emailLower = newStudentEmail.trim().toLowerCase();
                            const emailRegex = /^[a-zA-Z0-9._%+-]+@(?:gmail|outlook)\.com$/;
                            if (!emailRegex.test(emailLower)) {
                              alert('E-mail inválido. O e-mail deve ser do formato @gmail.com ou @outlook.com.');
                              return;
                            }

                            const tempId = 'st-' + Math.random().toString(36).substring(2, 9);
                            const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
                            
                            // Generate a simple 6-char alphanumeric code (e.g., K9X8J2)
                            const generateSimpleCode = () => {
                              const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                              let res = '';
                              for (let i = 0; i < 6; i++) {
                                res += chars.charAt(Math.floor(Math.random() * chars.length));
                              }
                              return res;
                            };
                            const code = generateSimpleCode();

                            // Save to local registry so App.tsx and AuthScreens.tsx can decode it!
                            const registryKey = 'abba_invite_codes_registry';
                            const currentRegistry = localStorage.getItem(registryKey);
                            const registryList = currentRegistry ? JSON.parse(currentRegistry) : [];
                            registryList.push({
                              code: code,
                              name: newStudentName.trim(),
                              expiresAt: expiry,
                              codeId: tempId
                            });
                            localStorage.setItem(registryKey, JSON.stringify(registryList));
                            
                            const link = `${window.location.origin}?join=${code}`;
                            
                            const guessedGender = (() => {
                              const firstName = newStudentName.split(' ')[0].toLowerCase();
                              if (firstName.endsWith('a') || ['beatriz', 'alice', 'yasmin', 'isabel', 'raquel', 'ruth', 'irene'].includes(firstName)) {
                                return 'F';
                              }
                              return 'M';
                            })();
                            
                            const welcomeWord = guessedGender === 'F' ? 'bem-vinda' : 'bem-vindo';
                            const msg = `Olá, *${newStudentName.trim()}* 👋🏾\nSeja muito ${welcomeWord} ao *Abba Digital*!\n\nClique no *link* abaixo para acessar a sua conta instantaneamente:\n${link}\n\n*Aproveite!*`;
                            
                            // Copy message
                            navigator.clipboard.writeText(msg);

                            logUserAction({
                              userName: teacherName,
                              userEmail: teacherEmail,
                              role: 'teacher',
                              actionType: 'add_student',
                              actionDetails: `Gerou convite com link de acesso para o aluno "${newStudentName.trim()}" (${emailLower}).`
                            });
                            setIsAddStudentOpen(false);
                            setNewStudentName('');
                            setNewStudentEmail('');
                            setNewStudentClass('');
                            setNewStudentProgress(0);

                            alert(`✅ Convite gerado com sucesso!\n\nO convite com o link de acesso rápido para "${newStudentName.trim()}" foi copiado para a sua área de transferência (Ctrl+V para enviar no WhatsApp). Ele aparecerá na lista de alunos do dashboard assim que realizar o primeiro login!`);
                          }}
                          className="w-full py-2 bg-slate-50 hover:bg-[#d6e3ff] hover:text-[#005bb3] text-slate-600 font-label-sm text-label-sm font-bold rounded-lg transition-all active:scale-[0.97] cursor-pointer border border-outline-variant/60 flex items-center justify-center gap-xs"
                        >
                          <img 
                            src="/icones/chave.svg" 
                            className="w-4 h-4 object-contain" 
                            alt="Link" 
                          />
                          Copiar por Link
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Actions Footer */}
              <div className="p-md border-t border-outline-variant bg-surface-container-low flex gap-md shrink-0">
                <button 
                  type="button"
                  onClick={() => setIsAddStudentOpen(false)}
                  className="flex-1 py-3 px-md border border-outline text-on-surface-variant font-label-md text-label-md rounded-lg active:scale-95 transition-all hover:bg-surface-variant/50 cursor-pointer bg-white"
                >
                  Cancelar
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    if (!newStudentName.trim()) {
                      alert('Por favor, informe o nome do aluno.');
                      return;
                    }
                    const emailValue = newStudentEmail.trim() || `${newStudentName.toLowerCase().replace(/\s+/g, '.')}@email.com`;
                    
                    const guessedGender = (() => {
                      const firstName = newStudentName.split(' ')[0].toLowerCase();
                      if (firstName.endsWith('a') || ['beatriz', 'alice', 'yasmin', 'isabel', 'raquel', 'ruth', 'irene'].includes(firstName)) {
                        return 'F';
                      }
                      return 'M';
                    })();

                    const newStudent = {
                      id: 'st-' + Math.random().toString(36).substring(2, 9),
                      name: newStudentName.trim(),
                      email: emailValue,
                      class: newStudentClass,
                      img: `/padrao/foto-do-perfil.avif`,
                      progress: newStudentProgress,
                      matricula: String(202400 + students.length + 1),
                      gender: guessedGender,
                      loginMethod: 'login'
                    };
                    setStudents([...students, newStudent]);
                    logUserAction({
                      userName: teacherName,
                      userEmail: teacherEmail,
                      role: 'teacher',
                      actionType: 'add_student',
                      actionDetails: `Adicionou o aluno "${newStudent.name}" (${newStudent.email}) via cadastro manual.`
                    });
                    setIsAddStudentOpen(false);
                    setNewStudentName('');
                    setNewStudentEmail('');
                    setNewStudentClass('');
                    setNewStudentProgress(0);
                    alert(`✅ Aluno(a) "${newStudent.name}" adicionado(a) com sucesso (sem convite)!`);
                  }}
                  className="flex-1 py-3 px-md bg-primary text-on-primary font-label-md text-label-md rounded-lg font-bold shadow-md shadow-primary/20 active:scale-95 transition-all hover:brightness-110 cursor-pointer border-none"
                >
                  Apenas Salvar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Modal: Salvar Alunos */}
        <AnimatePresence>
          {isSaveModalOpen && (
            <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
              {/* Sibling Backdrop Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSaveModalOpen(false)}
                className="absolute inset-0 bg-[#131b2e]/60 backdrop-blur-sm cursor-pointer"
              />
              
              {/* Sibling Modal Content Card */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative bg-white rounded-3xl border border-[#c1c6d6] max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl z-10"
                style={{ width: '100%', maxWidth: '56rem' }}
              >
                {/* Modal Header */}
                <div className="p-6 md:p-8 border-b border-[#dde0e2] space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-extrabold text-[#131b2e]">Salvar Alunos</h2>
                      <p className="text-xs text-slate-400 mt-0.5">Selecione os alunos que deseja processar e salvar no backup na nuvem.</p>
                    </div>
                    <button
                      onClick={() => setIsSaveModalOpen(false)}
                      className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all cursor-pointer bg-transparent border-none"
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                  
                  <label className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer transition-colors w-full">
                    <input
                      type="checkbox"
                      id="selectAllSave"
                      checked={selectedStudentIdsSave.length === students.length && students.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStudentIdsSave(students.map(s => s.id));
                        } else {
                          setSelectedStudentIdsSave([]);
                        }
                      }}
                      className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary transition-all cursor-pointer"
                    />
                    <span className="text-sm font-bold text-slate-700">Selecionar Todos ({students.length})</span>
                  </label>
                </div>

                {/* Modal Body Grid */}
                <div className="p-6 md:p-8 overflow-y-auto grow bg-[#faf8ff]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {students.map((student) => {
                      const isChecked = selectedStudentIdsSave.includes(student.id);
                      return (
                        <div
                          key={student.id}
                          onClick={() => {
                            setSelectedStudentIdsSave(prev =>
                              prev.includes(student.id)
                                ? prev.filter(id => id !== student.id)
                                : [...prev, student.id]
                            );
                          }}
                          className={`group relative p-4 rounded-2xl border transition-all flex flex-col gap-3 cursor-pointer ${
                            isChecked
                              ? 'border-primary bg-[#eaedff]/30 shadow-sm'
                              : 'bg-white border-slate-200 hover:border-primary/50'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <img
                              src={student.img || "/padrao/foto-do-perfil.avif"}
                              alt={student.name}
                              className="w-12 h-12 rounded-full border border-slate-100 object-cover"
                              onError={(e) => {
                                e.currentTarget.src = "/padrao/foto-do-perfil.avif";
                              }}
                            />
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary pointer-events-none"
                            />
                          </div>
                          
                          <div>
                            <p className="font-bold text-sm text-slate-800">{student.name}</p>
                            <p className="text-[10px] text-slate-400">
                              Status: {' '}
                              <span className={student.progress >= 50 ? 'text-primary font-bold' : 'text-red-500 font-bold'}>
                                {student.progress >= 50 ? 'Ativo' : 'Pendente'}
                              </span>
                            </p>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-bold text-slate-500">
                              <span>Progresso</span>
                              <span>{student.progress}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all duration-300"
                                style={{ width: `${student.progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-6 md:p-8 border-t border-[#dde0e2] bg-white flex justify-end items-center gap-3">
                  <button
                    onClick={() => setIsSaveModalOpen(false)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl cursor-pointer border-none"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      if (selectedStudentIdsSave.length === 0) {
                        alert('Por favor, selecione pelo menos um estudante para salvar.');
                        return;
                      }
                      // Simulate cloud save
                      alert(`Sincronização com a nuvem ABBA DIGITAL concluída!\nDados de progresso de ${selectedStudentIdsSave.length} alunos salvos com sucesso.`);
                      setIsSaveModalOpen(false);
                    }}
                    className="px-6 py-2.5 bg-primary hover:opacity-90 text-on-primary text-xs font-bold rounded-xl cursor-pointer shadow-lg shadow-primary/10 border-none flex items-center gap-1.5 active:scale-95 duration-100"
                  >
                    <span className="material-symbols-outlined text-[18px]">cloud</span>
                    Salvar Alunos
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal: Excluir Alunos */}
        <AnimatePresence>
          {isDeleteModalOpen && (
            <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
              {/* Sibling Backdrop Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsDeleteModalOpen(false)}
                className="absolute inset-0 bg-[#131b2e]/60 backdrop-blur-sm cursor-pointer"
              />
              
              {/* Sibling Modal Content Card */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative bg-white rounded-3xl border border-[#c1c6d6] max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl z-10"
                style={{ width: '100%', maxWidth: '56rem' }}
              >
                {/* Modal Header */}
                <div className="p-6 md:p-8 border-b border-[#dde0e2] flex justify-between items-center">
                  <div className="flex items-center gap-2 text-red-600">
                    <span className="material-symbols-outlined text-[24px]">delete_sweep</span>
                    <h3 className="text-xl font-extrabold">Excluir Alunos</h3>
                  </div>
                  <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all cursor-pointer bg-transparent border-none"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                {/* Toolbar */}
                <div className="px-6 md:px-8 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center flex-wrap gap-3">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      id="selectAllDelete"
                      checked={selectedStudentIdsDelete.length === students.length && students.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStudentIdsDelete(students.map(s => s.id));
                        } else {
                          setSelectedStudentIdsDelete([]);
                        }
                      }}
                      className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary transition-all cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-600 group-hover:text-slate-800 transition-colors">Selecionar Todos</span>
                  </label>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500">{selectedStudentIdsDelete.length} alunos selecionados</span>
                    <button
                      onClick={() => {
                        if (selectedStudentIdsDelete.length === 0) {
                          alert('Nenhum aluno selecionado para exclusão.');
                          return;
                        }
                        if (confirm(`Tem certeza de que deseja excluir permanentemente os ${selectedStudentIdsDelete.length} alunos selecionados?`)) {
                          const idsToDelete = [...selectedStudentIdsDelete];
                          // Update students list
                          setStudents(prev => prev.filter(s => !idsToDelete.includes(s.id)));
                          
                          // Salvar na fila de exclusões pendentes para robustez offline
                          try {
                            const pending = JSON.parse(localStorage.getItem('abba_pending_student_deletions') || '[]');
                            idsToDelete.forEach(id => {
                              if (!pending.includes(id)) {
                                pending.push(id);
                              }
                            });
                            localStorage.setItem('abba_pending_student_deletions', JSON.stringify(pending));
                          } catch (e) {
                            console.error(e);
                          }

                          // Delete from database
                          idsToDelete.forEach(async (id) => {
                            try {
                              const { error } = await supabase.from('students').delete().eq('id', id);
                              if (!error) {
                                try {
                                  const pending = JSON.parse(localStorage.getItem('abba_pending_student_deletions') || '[]');
                                  const remaining = pending.filter((x: string) => x !== id);
                                  localStorage.setItem('abba_pending_student_deletions', JSON.stringify(remaining));
                                } catch (e) {
                                  console.error(e);
                                }
                              }
                            } catch (err) {
                              console.warn('Erro ao excluir no banco:', err);
                            }
                          });
                          // Clear selection
                          setSelectedStudentIdsDelete([]);
                          // Close modal
                          setIsDeleteModalOpen(false);
                          alert('Alunos selecionados excluídos com sucesso! 🗑️');
                        }
                      }}
                      className="bg-red-100 hover:bg-red-200 text-red-600 w-9 h-9 rounded-full font-bold flex items-center justify-center cursor-pointer transition-all border-none active:scale-90"
                      title="Excluir selecionados em lote"
                    >
                      <img src="/icones/lixeira.svg" alt="Excluir" className="w-[20px] h-[20px] object-contain inline-block" />
                    </button>
                  </div>
                </div>

                {/* Modal Body Grid */}
                <div className="p-6 md:p-8 overflow-y-auto grow bg-[#faf8ff]">
                  {students.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 italic text-sm">
                      Nenhum aluno cadastrado no momento.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {students.map((student) => {
                        const isChecked = selectedStudentIdsDelete.includes(student.id);
                        return (
                          <div
                            key={student.id}
                            onClick={() => {
                              setSelectedStudentIdsDelete(prev =>
                                prev.includes(student.id)
                                  ? prev.filter(id => id !== student.id)
                                  : [...prev, student.id]
                              );
                            }}
                            className={`group relative p-4 rounded-2xl border transition-all flex items-center gap-3 cursor-pointer ${
                              isChecked
                                ? 'border-primary bg-[#eaedff]/30 shadow-sm'
                                : 'bg-white border-slate-200 hover:border-primary/50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              className="absolute top-3 right-3 w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary pointer-events-none"
                            />
                            
                            <img
                              src={student.img || "/padrao/foto-do-perfil.avif"}
                              alt={student.name}
                              className="w-12 h-12 rounded-full object-cover border border-slate-100"
                              onError={(e) => {
                                e.currentTarget.src = "/padrao/foto-do-perfil.avif";
                              }}
                            />
                            
                            <div className="flex-1 min-w-0 pr-4">
                              <p className="font-bold text-sm text-slate-800 truncate">{student.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">Matrícula: {student.matricula}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="p-6 md:p-8 border-t border-[#dde0e2] bg-white flex justify-end">
                  <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="px-6 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold cursor-pointer border-none"
                  >
                    Fechar
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal: Aviso de Duplicidade de Chave de Acesso */}
        <AnimatePresence>
          {isDuplicateModalOpen && (
            <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
              {/* Sibling Backdrop Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsDuplicateModalOpen(false)}
                className="absolute inset-0 bg-[#131b2e]/60 backdrop-blur-sm cursor-pointer"
              />
              
              {/* Sibling Modal Content Card */}
              <motion.div
                initial={{ scale: 0.95, y: 15, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: 15, opacity: 0 }}
                className="relative bg-white rounded-3xl border border-[#c1c6d6] max-w-md w-full overflow-hidden shadow-2xl flex flex-col z-10"
              >
                {/* Modal Header */}
                <div className="p-6 border-b border-[#dde0e2] flex justify-between items-center bg-slate-50/50">
                  <div className="flex items-center gap-2.5 text-[#e65100]">
                    <span className="material-symbols-outlined text-[24px]">warning</span>
                    <h3 className="text-base font-extrabold tracking-tight">Aviso: Código em Vigor</h3>
                  </div>
                  <button
                    onClick={() => setIsDuplicateModalOpen(false)}
                    className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all cursor-pointer bg-transparent border-none flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 space-y-4">
                  {duplicateStep === 'question' ? (
                    <>
                      {/* Warning Banner */}
                      <div className="bg-[#fff3e0] border border-[#ffe0b2] p-4 rounded-2xl text-left space-y-2">
                        <p className="text-xs text-[#e65100] font-bold">
                          O aluno ou aluna já possui um código gerado e ativo!
                        </p>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          Identificamos que já existe uma chave de acesso ativa em vigor para o nome 
                          <strong className="text-slate-800 font-extrabold"> {duplicateName}</strong>.
                        </p>
                      </div>

                      {/* Active Key Details Card */}
                      {duplicateActiveCode && (
                        <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl text-left space-y-1.5">
                          <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Detalhes da Chave Ativa</span>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500 font-medium">Código:</span>
                            <span className="font-mono font-bold text-[#005bb3]">
                              {`ABBA-${duplicateActiveCode.id}-${duplicateActiveCode.studentName.split(' ')[0].toUpperCase()}`}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500 font-medium">Duração:</span>
                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold text-[10px]">
                              {duplicateActiveCode.durationLabel && duplicateActiveCode.durationLabel.startsWith('Até ') && duplicateActiveCode.durationLabel.includes('-')
                                ? `Até ${duplicateActiveCode.durationLabel.substring(4).split('-').reverse().join('/')}`
                                : duplicateActiveCode.durationLabel}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500 font-medium">Expiração:</span>
                            <span className="text-slate-600 font-semibold text-[11px]">
                              {new Date(duplicateActiveCode.expiresAt).toLocaleString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Question */}
                      <div className="text-left space-y-1.5 pt-2">
                        <p className="text-xs font-extrabold text-slate-700">
                          Este aluno ou aluna é uma pessoa diferente?
                        </p>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Se for uma pessoa homônima (nome diferente, mas com mesmo nome e sobrenome), o sistema gerará uma nova chave separada. Caso contrário, você poderá editar a duração da chave existente.
                        </p>
                      </div>

                      {/* Options Buttons */}
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            // YES: generate new separate key!
                            let durationMs = 0;
                            let durationLabel = '';

                            if (duration === '1h') {
                              durationMs = 60 * 60 * 1000;
                              durationLabel = '1 Hora';
                            } else if (duration === '4h') {
                              durationMs = 4 * 60 * 60 * 1000;
                              durationLabel = '4 Horas';
                            } else if (duration === '1d') {
                              durationMs = 24 * 60 * 60 * 1000;
                              durationLabel = '1 Dia';
                            } else if (duration === '1w') {
                              durationMs = 7 * 24 * 60 * 60 * 1000;
                              durationLabel = '1 Semana';
                            } else {
                              const parts = customExpiryDate.split('-');
                              const timeParts = customExpiryTime.split(':');
                              const hour = timeParts.length > 0 ? Number(timeParts[0]) : 23;
                              const minute = timeParts.length > 1 ? Number(timeParts[1]) : 59;
                              const expDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), hour, minute, 0);
                              durationMs = expDate.getTime() - Date.now();
                              durationLabel = `Até ${parts[2]}/${parts[1]}/${parts[0]} às ${customExpiryTime}`;
                            }

                            const expiresAt = Date.now() + durationMs;
                            const codeId = 'st-' + Math.random().toString(36).substring(2, 9).toUpperCase();

                            // Generate a simple 6-char alphanumeric code (e.g., K9X8J2)
                            const generateSimpleCode = () => {
                              const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                              let res = '';
                              for (let i = 0; i < 6; i++) {
                                res += chars.charAt(Math.floor(Math.random() * chars.length));
                              }
                              return res;
                            };
                            const code = generateSimpleCode();

                            // Save to local registry so App.tsx and AuthScreens.tsx can decode it!
                            const registryKey = 'abba_invite_codes_registry';
                            const currentRegistry = localStorage.getItem(registryKey);
                            const registryList = currentRegistry ? JSON.parse(currentRegistry) : [];
                            registryList.push({
                              code: code,
                              name: duplicateName,
                              expiresAt,
                              codeId
                            });
                            localStorage.setItem(registryKey, JSON.stringify(registryList));

                            const token = code;
                            const friendlyCode = code;

                            const newCodeItem: AccessCode = {
                              id: codeId,
                              code: token,
                              studentName: duplicateName,
                              expiresAt,
                              durationLabel,
                              status: 'active'
                            };

                            setActiveCodes([newCodeItem, ...activeCodes]);
                            setGeneratedCode(friendlyCode);
                            setGeneratedBase64(token);
                            setStudentNameInput('');
                            setIsDuplicateModalOpen(false);
                            alert(`Uma nova chave separada foi gerada com sucesso para o(a) aluno(a) ${duplicateName}! 🚀`);
                          }}
                          className="py-3 bg-[#4caf50] hover:bg-[#43a047] text-white text-xs font-bold rounded-xl transition-all shadow cursor-pointer active:scale-95 border-none"
                        >
                          Sim, é diferente
                        </button>
                        <button
                          type="button"
                          onClick={() => setDuplicateStep('edit_duration')}
                          className="py-3 bg-[#005bb3] hover:bg-[#00468c] text-white text-xs font-bold rounded-xl transition-all shadow cursor-pointer active:scale-95 border-none"
                        >
                          Não, mesma pessoa
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Step 2: Edit Duration */}
                      <div className="text-left space-y-4">
                        <div>
                          <h4 className="text-xs font-bold text-slate-600 mb-1.5">
                            Nova Validade do Código
                          </h4>
                          <select
                            value={duplicateSelectedDuration}
                            onChange={(e) => setDuplicateSelectedDuration(e.target.value)}
                            className="w-full bg-white border border-[#c1c6d6] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#005bb3] outline-none"
                          >
                            <option value="1h">1 Hora</option>
                            <option value="4h">4 Horas</option>
                            <option value="1d">1 Dia</option>
                            <option value="1w">1 Semana</option>
                            <option value="custom">Personalizado (Calendário)</option>
                          </select>
                        </div>

                        {duplicateSelectedDuration === 'custom' && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-slate-600 mb-1.5" htmlFor="duplicate-expiry-date">
                                Data de Expiração
                              </label>
                              <input
                                type="date"
                                id="duplicate-expiry-date"
                                value={duplicateCustomExpiryDate}
                                onChange={(e) => setDuplicateCustomExpiryDate(e.target.value)}
                                className="w-full bg-white border border-[#c1c6d6] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#005bb3] outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-600 mb-1.5" htmlFor="duplicate-expiry-time">
                                Hora de Expiração
                              </label>
                              <input
                                type="time"
                                id="duplicate-expiry-time"
                                value={duplicateCustomExpiryTime}
                                onChange={(e) => setDuplicateCustomExpiryTime(e.target.value)}
                                className="w-full bg-white border border-[#c1c6d6] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#005bb3] outline-none"
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setDuplicateStep('question')}
                            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer border-none"
                          >
                            Voltar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!duplicateActiveCode) return;

                              let durationMs = 0;
                              let durationLabel = '';

                              if (duplicateSelectedDuration === '1h') {
                                durationMs = 60 * 60 * 1000;
                                durationLabel = '1 Hora';
                              } else if (duplicateSelectedDuration === '4h') {
                                durationMs = 4 * 60 * 60 * 1000;
                                durationLabel = '4 Horas';
                              } else if (duplicateSelectedDuration === '1d') {
                                durationMs = 24 * 60 * 60 * 1000;
                                durationLabel = '1 Dia';
                              } else if (duplicateSelectedDuration === '1w') {
                                durationMs = 7 * 24 * 60 * 60 * 1000;
                                durationLabel = '1 Semana';
                              } else {
                                const parts = duplicateCustomExpiryDate.split('-');
                                const timeParts = duplicateCustomExpiryTime.split(':');
                                const hour = timeParts.length > 0 ? Number(timeParts[0]) : 23;
                                const minute = timeParts.length > 1 ? Number(timeParts[1]) : 59;
                                const expDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), hour, minute, 0);
                                durationMs = expDate.getTime() - Date.now();
                                durationLabel = `Até ${parts[2]}/${parts[1]}/${parts[0]} às ${duplicateCustomExpiryTime}`;
                              }

                              const newExpiresAt = Date.now() + durationMs;

                              // Update common registry expiry
                              const registryKey = 'abba_invite_codes_registry';
                              const currentRegistry = localStorage.getItem(registryKey);
                              const registryList = currentRegistry ? JSON.parse(currentRegistry) : [];
                              
                              let matchedRegIndex = registryList.findIndex((item: any) => item.code === duplicateActiveCode.code || item.codeId === duplicateActiveCode.id);
                              if (matchedRegIndex !== -1) {
                                registryList[matchedRegIndex].expiresAt = newExpiresAt;
                                localStorage.setItem(registryKey, JSON.stringify(registryList));
                              }

                              setActiveCodes(prev => prev.map(c => {
                                if (c.id === duplicateActiveCode.id) {
                                  return {
                                    ...c,
                                    expiresAt: newExpiresAt,
                                    durationLabel
                                  };
                                }
                                return c;
                              }));

                              const friendlyCode = duplicateActiveCode.code;
                              const token = duplicateActiveCode.code;

                              setGeneratedCode(friendlyCode);
                              setGeneratedBase64(token);
                              setStudentNameInput('');
                              setIsDuplicateModalOpen(false);
                              alert(`Duração do código de ${duplicateName} atualizada com sucesso para ${durationLabel}! 🕒`);
                            }}
                            className="flex-1 py-3 bg-[#005bb3] hover:bg-[#00468c] text-white text-xs font-bold rounded-xl transition-all shadow cursor-pointer active:scale-95 border-none"
                          >
                            Salvar Alteração
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal: Compartilhar atividade */}
        <AnimatePresence>
          {supportFilesModal && supportFilesModal.isOpen && (
            <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
              {/* Sibling Backdrop Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSupportFilesModal(null)}
                className="absolute inset-0 bg-[#131b2e]/60 backdrop-blur-sm cursor-pointer"
              />
              
              {/* Sibling Modal Content Card */}
              <motion.div
                initial={{ scale: 0.95, y: 15, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: 15, opacity: 0 }}
                className="relative bg-white rounded-3xl border border-[#c1c6d6] max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl z-10"
                style={{ width: '100%', maxWidth: '42rem' }}
              >
                {/* Header */}
                <div className="p-6 md:p-8 border-b border-[#dde0e2] flex justify-between items-center bg-white shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[22px]">send</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-[#131b2e]">Compartilhar atividade</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Envie os acessos para os alunos atribuídos à matéria
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSupportFilesModal(null)}
                    className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all cursor-pointer bg-transparent border-none flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                {/* Body / Students Sharing Cards */}
                <div className="p-6 md:p-8 overflow-y-auto grow space-y-6 bg-slate-50/50 text-left">
                  <div className="space-y-1 select-none">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Atividade / Matéria</span>
                    <h4 className="font-extrabold text-sm text-slate-800">{supportFilesModal.task.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{supportFilesModal.task.description}</p>
                  </div>

                  <div className="space-y-4">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block select-none">
                      Compartilhar com os Alunos Atribuídos ({supportFilesModal.assignedStudentIds.length})
                    </span>

                    {supportFilesModal.assignedStudentIds.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-xs italic bg-white border border-slate-200/60 rounded-2xl select-none">
                        Nenhum aluno atribuído a esta tarefa por padrão.
                      </div>
                    ) : (
                      <div className="space-y-3.5 pr-1">
                        {supportFilesModal.assignedStudentIds.map(sid => {
                          const student = students.find(s => s.id === sid || s.name.toLowerCase() === sid.toLowerCase());
                          if (!student) return null;

                          const isCodeCopied = copiedButtons[student.id]?.code;
                          const isLinkCopied = copiedButtons[student.id]?.link;
                          const isTxtCopied = copiedButtons[student.id]?.txt;

                          return (
                            <div key={student.id} className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-primary/20 hover:shadow-sm transition-all flex flex-col gap-3">
                              {/* Student row */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3 min-w-0">
                                  <img 
                                    src={student.img || "/padrao/foto-do-perfil.avif"} 
                                    alt={student.name} 
                                    className="w-10 h-10 rounded-full object-cover border border-[#eaedff] shrink-0" 
                                    onError={(e) => {
                                      e.currentTarget.src = "/padrao/foto-do-perfil.avif";
                                    }}
                                  />
                                  <div className="min-w-0">
                                    <h4 className="text-xs font-extrabold text-[#131b2e] leading-tight truncate">{student.name}</h4>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{student.class}</p>
                                  </div>
                                </div>

                                {/* Three Sharing buttons */}
                                <div className="flex items-center gap-2 flex-wrap shrink-0 select-none">
                                  {/* Code/Compartilhar button */}
                                  <button
                                    type="button"
                                    onClick={() => handleShareButtonPress(student.name, student.id, supportFilesModal.task.title, supportFilesModal.task.id, 'code')}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                                      isCodeCopied 
                                        ? 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200/60' 
                                        : 'bg-amber-50 hover:bg-amber-500 hover:text-white border-amber-200 text-amber-700'
                                    }`}
                                    title="Copiar mensagem com código"
                                  >
                                    <span className="material-symbols-outlined text-[15px]">
                                      {isCodeCopied ? 'check' : 'key'}
                                    </span>
                                    {isCodeCopied ? 'Copiado' : 'Código'}
                                  </button>



                                  {/* Ficha button */}
                                  <button
                                    type="button"
                                    onClick={() => handleShareButtonPress(student.name, student.id, supportFilesModal.task.title, supportFilesModal.task.id, 'txt')}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                                      isTxtCopied 
                                        ? 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200/60' 
                                        : 'bg-rose-50 hover:bg-rose-500 hover:text-white border-rose-200 text-rose-700'
                                    }`}
                                    title="Copiar mensagem de acesso e baixar ficha .txt"
                                  >
                                    <span className="material-symbols-outlined text-[15px]">
                                      {isTxtCopied ? 'check' : 'download'}
                                    </span>
                                    {isTxtCopied ? 'Copiado' : 'Ficha'}
                                  </button>

                                  {/* Chat button */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setChatTarget({
                                        studentName: student.name,
                                        taskId: supportFilesModal.task.id || supportFilesModal.task.title.toLowerCase().replace(/\s+/g, '-'),
                                        taskTitle: supportFilesModal.task.title
                                      });
                                      setIsChatModalOpen(true);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer bg-blue-50 hover:bg-blue-500 hover:text-white border-blue-200 text-blue-700"
                                    title="Abrir chat de mensagens com o aluno"
                                  >
                                    <span className="material-symbols-outlined text-[15px]">
                                      chat
                                    </span>
                                    Chat
                                  </button>
                                </div>
                              </div>

                              {/* Inline Copy Confirmation Dialog */}
                              {confirmCopyAgain && confirmCopyAgain.sid === student.id && (
                                <div className="mt-2 p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in text-left">
                                  <p className="text-[11px] text-[#131b2e] font-bold flex items-center gap-1.5 select-none leading-normal">
                                    <span className="material-symbols-outlined text-indigo-600 text-[18px]">info</span>
                                    Você já copiou essa opção, deseja copiar novamente?
                                  </p>
                                  <div className="flex gap-2 shrink-0 select-none">
                                    <button
                                      type="button"
                                      onClick={() => executeCopyAction(student.name, student.id, supportFilesModal.task.title, supportFilesModal.task.id, confirmCopyAgain.type)}
                                      className="px-3.5 py-1.5 bg-[#005bb3] hover:bg-[#004b93] text-white text-[10px] font-black rounded-lg cursor-pointer border-none flex items-center gap-1 transition-all"
                                    >
                                      <span className="material-symbols-outlined text-[13px]">check</span>
                                      Sim
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmCopyAgain(null)}
                                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 text-[10px] font-bold rounded-lg cursor-pointer border-none transition-all"
                                    >
                                      Não
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 md:p-8 border-t border-[#dde0e2] bg-white flex shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSaveWithSupportFiles(false)}
                    className="w-full py-3.5 bg-primary text-on-primary font-bold text-xs rounded-xl shadow-md shadow-primary/20 active:scale-95 transition-all hover:brightness-110 cursor-pointer border-none"
                  >
                    Salvar e Concluir
                  </button>
                </div>
              </motion.div>
            </div>
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
                  value={taskSearchQuery}
                  onChange={(e) => setTaskSearchQuery(e.target.value)}
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
                <h2 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-8">Atividades &amp; Tarefas Criadas</h2>
                
                {/* Carrossel Horizontal de Cards de Atividades */}
                <div className="relative group/carousel w-full mb-6">
                  <div className="flex flex-nowrap overflow-x-auto gap-4 no-scrollbar pb-4 scroll-smooth">
                    {(() => {
                      const query = taskSearchQuery;
                      
                      const mapped = tasks.map(task => {
                        return {
                          id: task.id,
                          title: task.title,
                          description: task.description || 'Soletrar as palavras indicadas pelo professor usando as cores correspondentes no ábaco digital.',
                          dueDate: task.dueDate ? `Entrega: ${new Date(task.dueDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}` : 'Entrega flexível',
                          status: task.status === 'active' ? 'active' : 'draft',
                          category: task.priority === 'Alta' ? 'Urgente' : 'Tarefa'
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
                                const selectedTask = tasks.find(t => t.id === task.id);
                                if (selectedTask) {
                                  setSelectedTaskDetails(selectedTask);
                                  setActiveTab('tasks');
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
                                  title="Excluir do modal"
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
                                <div className={`absolute top-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs bg-gradient-to-r from-blue-500 to-indigo-600`}>
                                  <span className="material-symbols-outlined text-[14px]">
                                    school
                                  </span>
                                </div>
                              </header>

                              {/* Lateral gradient status line */}
                              <div className={`absolute top-0 left-0 w-1 h-full ${task.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />

                              {/* Body Area */}
                              <div className="flex-grow px-3.5 pb-3.5 flex flex-col justify-between gap-2.5">
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-[8px] font-black tracking-wider uppercase text-slate-400 truncate">
                                      {task.category}
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
                                    <span className={`w-2 h-2 rounded-full ${
                                      task.status === 'active' 
                                        ? 'bg-emerald-500' 
                                        : 'bg-amber-500'
                                    }`} />
                                    <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                                      {task.status === 'active' ? 'Ativa' : 'Rascunho'}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-primary font-bold bg-primary/5 px-2 py-1 rounded-md transition-all group-hover:bg-primary group-hover:text-white">
                                    Ver Detalhes
                                  </span>
                                </div>
                              </div>
                            </article>
                          ))}
                          {filteredSearchTasks.length === 0 && (
                            <div className="py-8 text-center text-slate-400 text-xs font-medium w-full">
                              Nenhuma tarefa encontrada para "{query}"
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
                      setActiveTab('home');
                      setSelectedTaskDetails(null);
                      setSearchExpanded(false);
                      setGeneralSearchQuery('');
                      setTaskSearchQuery('');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer bg-transparent border-none text-left group"
                  >
                    <span className="material-symbols-outlined text-slate-400 text-[20px] group-hover:text-primary transition-colors">home</span>
                    <span className="text-sm text-slate-600 font-semibold group-hover:text-slate-800 transition-colors">Início</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('tasks');
                      setSelectedTaskDetails(null);
                      setSearchExpanded(false);
                      setGeneralSearchQuery('');
                      setTaskSearchQuery('');
                    }}
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

      </main>

      {/* SETTINGS PANEL MODAL */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettingsModal(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            ></motion.div>
            
            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-white w-full max-w-[480px] rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden text-left z-10 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-slate-50 text-slate-700 rounded-xl">
                    <span className="material-symbols-outlined text-[20px] font-variation-settings-fill">settings</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 leading-tight">Configurações</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Personalize sua área do Teatcher</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer border-none transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {/* Body Content */}
              <div className="p-6 overflow-y-auto space-y-6 bg-white">
                {/* Section 1: Geral */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Preferências Gerais</h3>
                  
                  {/* Language Selector */}
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800">Idioma da Plataforma</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Selecione o idioma de exibição</p>
                    </div>
                    <select
                      value={settingsLanguage}
                      onChange={(e) => setSettingsLanguage(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#005ba4]"
                    >
                      <option value="pt">Português</option>
                      <option value="en">English</option>
                      <option value="de">Deutsch</option>
                    </select>
                  </div>

                  {/* High Contrast Mode */}
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800">Alto Contraste</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Otimizar cores para acessibilidade</p>
                    </div>
                    <button
                      onClick={() => setSettingsContrast(!settingsContrast)}
                      className={`w-11 h-6 rounded-full p-1 transition-colors border-none cursor-pointer flex items-center ${
                        settingsContrast ? 'bg-[#005ba4] justify-end' : 'bg-slate-200 justify-start'
                      }`}
                    >
                      <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-sm"></motion.div>
                    </button>
                  </div>
                </div>

                {/* Section 2: Recursos de Aula */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recursos de Aula</h3>
                  
                  {/* Sound Effects Toggle */}
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800">Sons e Feedback</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Efeitos sonoros ao mover as contas do ábaco</p>
                    </div>
                    <button
                      onClick={() => setSettingsSounds(!settingsSounds)}
                      className={`w-11 h-6 rounded-full p-1 transition-colors border-none cursor-pointer flex items-center ${
                        settingsSounds ? 'bg-[#005ba4] justify-end' : 'bg-slate-200 justify-start'
                      }`}
                    >
                      <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-sm"></motion.div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-white">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-600 border-none font-bold text-sm transition-all active:scale-95 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveSettings}
                  className="px-5 py-2.5 rounded-2xl bg-[#005ba4] hover:bg-[#004780] text-white border-none font-bold text-sm transition-all active:scale-95 cursor-pointer shadow-sm shadow-[#005ba4]/10"
                >
                  Salvar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Premium Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-[99999] bg-[#1e293b] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700/50 text-left font-sans"
          >
            <span className="material-symbols-outlined text-[#10B981] text-[20px] shrink-0 font-variation-settings-fill">check_circle</span>
            <span className="text-xs font-bold tracking-wide select-none">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TEACHER CHAT WHATSAPP MODAL */}
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
                  <h4 className="text-[14px] font-extrabold text-slate-800 tracking-tight">Conversa com {chatTarget.studentName}</h4>
                  <p className="text-[11px] font-medium text-slate-400 mt-0.5 text-center px-6">
                    Responda às dúvidas do aluno sobre a atividade <strong>{chatTarget.taskTitle}</strong>.
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
                          Nenhuma mensagem trocada ainda com este estudante. envie um alô!
                        </div>
                      );
                    }
                    
                    return filtered.map((msg: any) => {
                      const isTeacher = msg.senderRole === 'teacher';
                      
                      if (isTeacher) {
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
                  <div id="teacher-chat-bottom" />
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
                      senderRole: 'teacher',
                      senderName: 'Prof. Décio',
                      text,
                      timestamp: new Date().toISOString()
                    };
                    
                    const updated = [...chatMessages, newMsg];
                    setChatMessages(updated);
                    localStorage.setItem('abba_task_chats', JSON.stringify(updated));
                    
                    inputEl.value = '';
                    
                    setTimeout(() => {
                      const el = document.getElementById('teacher-chat-bottom');
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
                      placeholder="Clique aqui para digitar sua mensagem de resposta..." 
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
};
