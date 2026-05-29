import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../types';
import { supabase, logUserAction } from '../supabaseClient';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
  onGoToSignup: () => void;
  onGoToLanding?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onGoToSignup, onGoToLanding }) => {
  const [activeTab, setActiveTab] = useState<'email' | 'code'>('code');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isTeacherCodeMode, setIsTeacherCodeMode] = useState<boolean>(false);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [studentEmailInput, setStudentEmailInput] = useState('');
  const [alphanumericCode, setAlphanumericCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      setActiveTab('code'); // Auto-switch to access code tab when offline
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Set default tab on mount based on network state
  useEffect(() => {
    if (!isOnline) {
      setActiveTab('code');
    }
  }, [isOnline]);

  // Pre-fill access code from URL parameters (join/code)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinParam = params.get('join') || params.get('code');
    if (joinParam) {
      const cleanParam = joinParam.trim().toUpperCase().replace('ABBA-', '');
      const registryKey = 'abba_invite_codes_registry';
      let matchedRecord = null;
      try {
        const localRegistry = localStorage.getItem(registryKey);
        const registryList = localRegistry ? JSON.parse(localRegistry) : [];
        matchedRecord = registryList.find((item: any) => item.code === cleanParam);
      } catch (err) {
        console.error('Error looking up code registry:', err);
      }

      if (matchedRecord) {
        setAccessCode(matchedRecord.code);
        setActiveTab('code');
      } else {
        setAccessCode(joinParam);
        setActiveTab('code');
      }
    }
  }, []);

  // Check active Supabase session on mount (handles OAuth redirect success)
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          const loggedUser: User = {
            name: 'José Décio de Alencar',
            email: 'inglesdecio@gmail.com',
            role: 'teacher'
          };
          setSuccessMsg('Autenticação social realizada com sucesso! Redirecionando...');
          setTimeout(() => {
            onLoginSuccess(loggedUser);
          }, 800);
        }
      } catch (err) {
        console.error('Error fetching Supabase session:', err);
      }
    };
    if (isOnline) {
      checkSession();
    }
  }, [isOnline]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isOnline) {
      setErrorMsg('Login por e-mail indisponível em modo offline.');
      return;
    }

    if (!email || !password) {
      setErrorMsg('Por favor, preencha todos os campos.');
      return;
    }

    // Default teacher account bypass for fast demonstration
    if (email === 'inglesdecio@gmail.com' && password === 'admin') {
      const teacherUser: User = {
        name: 'José Décio de Alencar',
        email: 'inglesdecio@gmail.com',
        role: 'teacher'
      };
      setSuccessMsg('Login realizado com sucesso! Redirecionando...');
      setTimeout(() => {
        onLoginSuccess(teacherUser);
      }, 1000);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: password
      });

      if (error) {
        setErrorMsg('Erro ao fazer login: ' + error.message);
        return;
      }

      if (data.user) {
        const user: User = {
          name: 'José Décio de Alencar',
          email: 'inglesdecio@gmail.com',
          role: 'teacher'
        };
        setSuccessMsg('Login realizado com sucesso! Redirecionando...');
        setTimeout(() => {
          onLoginSuccess(user);
        }, 1000);
      }
    } catch (err: any) {
      setErrorMsg('Erro de conexão: ' + err.message);
    }
  };

  const handleCodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!accessCode.trim()) {
      setErrorMsg('Por favor, insira seu Código de Acesso Único.');
      return;
    }

    const trimmedCode = accessCode.trim().toUpperCase();
    const cleanCode = trimmedCode.replace('ABBA-', '');

    if (cleanCode === 'PROF123' || cleanCode === 'ABC123DEF') {
      setErrorMsg('Código inválido para login de aluno. Teatchers devem entrar pela Área do Teatcher.');
      return;
    }

    // 1. Validate student email input (must be Gmail or Outlook format)
    if (!studentEmailInput.trim()) {
      setErrorMsg('Por favor, informe seu e-mail (Gmail ou Outlook) para acessar.');
      return;
    }
    const emailLower = studentEmailInput.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@(?:gmail|outlook)\.com$/;
    if (!emailRegex.test(emailLower)) {
      setErrorMsg('E-mail inválido. O e-mail deve ser do formato @gmail.com ou @outlook.com.');
      return;
    }

    // 2. First, check if this matches our 6-char alphanumeric registry!
    const registryKey = 'abba_invite_codes_registry';
    let matchedRecord = null;
    if (cleanCode === 'ALUNO123') {
      matchedRecord = {
        code: 'ALUNO123',
        name: 'Aluno Fixo',
        codeId: 'student-fixed-id',
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000
      };
    } else {
      try {
        const localRegistry = localStorage.getItem(registryKey);
        const registryList = localRegistry ? JSON.parse(localRegistry) : [];
        matchedRecord = registryList.find((item: any) => item.code === cleanCode);
      } catch (err) {
        console.error('Error looking up registry code:', err);
      }
    }

    if (matchedRecord) {
      if (Date.now() > matchedRecord.expiresAt) {
        setErrorMsg('Este código de acesso expirou. Solicite um novo ao Teatcher.');
        return;
      }

      // Update or add student record in abba_students_list
      try {
        const studentListLocal = localStorage.getItem('abba_students_list');
        const studentsList = studentListLocal ? JSON.parse(studentListLocal) : [];
        const index = studentsList.findIndex((s: any) => s.id === matchedRecord.codeId || s.name.toLowerCase() === matchedRecord.name.toLowerCase());
        if (index !== -1) {
          studentsList[index].email = emailLower;
          studentsList[index].lastAccessAt = new Date().toISOString();
          studentsList[index].loginMethod = 'code';
          localStorage.setItem('abba_students_list', JSON.stringify(studentsList));
        } else {
          const newStudent = {
            id: matchedRecord.codeId || `st-${Date.now()}`,
            name: matchedRecord.name,
            class: "Turma A - 3º Ano",
            img: `https://images.unsplash.com/photo-${1535713875002 + Math.floor(Math.random() * 100)}?auto=format&fit=crop&q=80&w=150&h=150`,
            progress: 0,
            matricula: `2026${Math.floor(1000 + Math.random() * 9000)}`,
            gender: 'M',
            email: emailLower,
            lastAccessAt: new Date().toISOString(),
            loginMethod: 'code'
          };
          studentsList.push(newStudent);
          localStorage.setItem('abba_students_list', JSON.stringify(studentsList));
        }
      } catch (err) {
        console.error('Error updating student list in login:', err);
      }

      const studentUser: User = {
        name: matchedRecord.name,
        email: emailLower,
        role: 'student',
        codeSession: {
          code: matchedRecord.code,
          expiresAt: matchedRecord.expiresAt,
          codeId: matchedRecord.codeId
        }
      };

      // Record access in localStorage for Teacher's dashboard to see!
      const accessRecord = {
        id: matchedRecord.codeId || `st-${Date.now()}`,
        studentName: matchedRecord.name,
        accessedAt: new Date().toISOString(),
        code: matchedRecord.code
      };
      try {
        const local = localStorage.getItem('abba_students_logged_by_code');
        const list = local ? JSON.parse(local) : [];
        const filtered = list.filter((item: any) => item.studentName.toLowerCase() !== matchedRecord.name.toLowerCase());
        localStorage.setItem('abba_students_logged_by_code', JSON.stringify([accessRecord, ...filtered]));
      } catch (err) {
        console.error(err);
      }

      // Supabase database capture integration
      try {
        await supabase.from('student_logins').insert([
          {
            student_name: matchedRecord.name,
            student_email: emailLower,
            access_code: matchedRecord.code,
            logged_at: new Date().toISOString(),
            login_method: 'code'
          }
        ]);
        await logUserAction({
          userName: matchedRecord.name,
          userEmail: emailLower,
          role: 'student',
          actionType: 'login_code',
          actionDetails: `Acessou com o código: ${matchedRecord.code}`
        });
      } catch (dbErr) {
        console.warn('Erro ao registrar login do estudante no Supabase:', dbErr);
      }

      setSuccessMsg(`Bem-vindo, ${matchedRecord.name}! Carregando atividades...`);
      setTimeout(() => {
        onLoginSuccess(studentUser);
      }, 1000);
      return;
    }

    // 2. Legacy Base64 fallback (must start with ABBA-)
    if (!trimmedCode.startsWith('ABBA-')) {
      setErrorMsg('Código de acesso inválido. Verifique o código e tente novamente.');
      return;
    }

    try {
      const base64Part = trimmedCode.substring(5);
      const decodedJson = atob(base64Part);
      const sessionData = JSON.parse(decodedJson);

      if (!sessionData.name || !sessionData.expiresAt || !sessionData.codeId) {
        setErrorMsg('Código corrompido ou inválido.');
        return;
      }

      // Check expiration
      if (Date.now() > sessionData.expiresAt) {
        setErrorMsg('Este código de acesso expirou. Solicite um novo ao Teatcher.');
        return;
      }

      // Update or add student record in abba_students_list
      try {
        const studentListLocal = localStorage.getItem('abba_students_list');
        const studentsList = studentListLocal ? JSON.parse(studentListLocal) : [];
        const index = studentsList.findIndex((s: any) => s.id === sessionData.codeId || s.name.toLowerCase() === sessionData.name.toLowerCase());
        if (index !== -1) {
          studentsList[index].email = `student-${sessionData.codeId}@abba.com`;
          studentsList[index].lastAccessAt = new Date().toISOString();
          studentsList[index].loginMethod = 'link';
          localStorage.setItem('abba_students_list', JSON.stringify(studentsList));
        } else {
          const newStudent = {
            id: sessionData.codeId,
            name: sessionData.name,
            class: "Turma A - 3º Ano",
            img: `https://images.unsplash.com/photo-${1535713875002 + Math.floor(Math.random() * 100)}?auto=format&fit=crop&q=80&w=150&h=150`,
            progress: 0,
            matricula: `2026${Math.floor(1000 + Math.random() * 9000)}`,
            gender: 'M',
            email: `student-${sessionData.codeId}@abba.com`,
            lastAccessAt: new Date().toISOString(),
            loginMethod: 'link'
          };
          studentsList.push(newStudent);
          localStorage.setItem('abba_students_list', JSON.stringify(studentsList));
        }
      } catch (err) {
        console.error('Error updating student list in login:', err);
      }

      // Active session successful
      const studentUser: User = {
        name: sessionData.name,
        email: `student-${sessionData.codeId}@abba.com`,
        role: 'student',
        codeSession: {
          code: trimmedCode,
          expiresAt: sessionData.expiresAt,
          codeId: sessionData.codeId
        }
      };

      // Record access in localStorage for Teacher's dashboard to see!
      const accessRecord = {
        id: sessionData.codeId,
        studentName: sessionData.name,
        accessedAt: new Date().toISOString(),
        code: trimmedCode
      };
      try {
        const local = localStorage.getItem('abba_students_logged_by_code');
        const list = local ? JSON.parse(local) : [];
        const filtered = list.filter((item: any) => item.studentName.toLowerCase() !== sessionData.name.toLowerCase());
        localStorage.setItem('abba_students_logged_by_code', JSON.stringify([accessRecord, ...filtered]));
      } catch (err) {
        console.error(err);
      }

      // Supabase database capture integration
      try {
        await supabase.from('student_logins').insert([
          {
            student_name: sessionData.name,
            student_email: `student-${sessionData.codeId}@abba.com`,
            access_code: trimmedCode,
            logged_at: new Date().toISOString(),
            login_method: 'link'
          }
        ]);
        await logUserAction({
          userName: sessionData.name,
          userEmail: `student-${sessionData.codeId}@abba.com`,
          role: 'student',
          actionType: 'login_link',
          actionDetails: `Acessou com o link do código: ${trimmedCode}`
        });
      } catch (dbErr) {
        console.warn('Erro ao registrar login do estudante no Supabase:', dbErr);
      }

      setSuccessMsg(`Bem-vindo, ${sessionData.name}! Carregando atividades...`);
      setTimeout(() => {
        onLoginSuccess(studentUser);
      }, 1000);

    } catch (err) {
      setErrorMsg('Falha ao decodificar o código. Verifique e tente novamente.');
    }
  };

  const handleTeacherCodeLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmed = alphanumericCode.trim().toUpperCase();
    if (!trimmed) {
      setErrorMsg('Por favor, insira o código alfanumérico do Teatcher.');
      return;
    }

    const cleanCode = trimmed.replace('ABBA-', '');
    if (cleanCode === 'ALUNO123') {
      setErrorMsg('Código inválido para login de Teatcher. Alunos devem entrar pela Área do Aluno.');
      return;
    }
    const registryKey = 'abba_invite_codes_registry';
    try {
      const localRegistry = localStorage.getItem(registryKey);
      const registryList = localRegistry ? JSON.parse(localRegistry) : [];
      if (registryList.some((item: any) => item.code === cleanCode)) {
        setErrorMsg('Código inválido para login de Teatcher. Alunos devem entrar pela Área do Aluno.');
        return;
      }
    } catch {}

    if (trimmed === 'ABC123DEF' || trimmed === 'PROF123') {
      const teacherUser: User = {
        name: 'José Décio de Alencar',
        email: 'inglesdecio@gmail.com',
        role: 'teacher'
      };
      setSuccessMsg('Login de Teatcher realizado com sucesso! Redirecionando...');
      setTimeout(() => {
        onLoginSuccess(teacherUser);
      }, 1000);
    } else {
      setErrorMsg('Código incorreto. Tente "PROF123" para demonstração de Teatcher.');
    }
  };

  // Real social login handlers
  const handleSocialLogin = async (platform: 'google' | 'microsoft') => {
    if (!isOnline) return;
    setErrorMsg(null);
    setSuccessMsg(`Redirecionando para login com ${platform === 'google' ? 'Google' : 'Microsoft'}...`);
    
    try {
      const provider = platform === 'google' ? 'google' : 'azure';
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) {
        setErrorMsg('Erro na autenticação social: ' + error.message);
      }
    } catch (err: any) {
      setErrorMsg('Erro de conexão: ' + err.message);
    }
  };

  const glassBackgroundStyle: React.CSSProperties = {
    backgroundImage: `radial-gradient(circle at 20% 30%, #d6e3ff 0%, transparent 40%), 
                      radial-gradient(circle at 80% 70%, #dae2fd 0%, transparent 40%)`
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8ff] selection:bg-[#d6e3ff] selection:text-[#001b3d] text-[#131b2e] font-sans">
      
      {/* HEADER COMPONENT */}
      <header className="flex justify-between items-center px-6 sm:px-10 h-16 w-full bg-white border-b border-[#c1c6d6]/30">
        <div 
          className="font-extrabold text-xl text-[#000000] flex items-center gap-2 cursor-pointer hover:opacity-90 active:scale-[0.99] transition-all" 
          onClick={() => onGoToLanding && onGoToLanding()}
          title="Voltar para a página principal"
        >
          <img 
            src="https://res.cloudinary.com/dudmozd8z/image/upload/v1779315941/logoabra2_kls3we.svg" 
            alt="ABBA Logo" 
            className="w-8 h-8 object-contain"
          />
          ABBA DIGITAL
        </div>
        <div className="flex items-center gap-4">
          <button 
            type="button" 
            onClick={() => setIsTeacherCodeMode(prev => !prev)}
            className="font-semibold text-xs sm:text-sm text-[#005bb3] hover:text-[#00468c] transition-colors cursor-pointer"
          >
            {isTeacherCodeMode ? 'Área do Aluno' : 'Área do Teatcher'}
          </button>
          <span className="font-medium text-xs sm:text-sm text-[#5b5f61] cursor-pointer hover:text-[#005bb3] transition-colors">
            Help
          </span>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-grow flex items-center justify-center p-6 glass-background relative overflow-hidden bg-[#faf8ff]" style={glassBackgroundStyle}>
        
        {/* Abstract background elements */}
        <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-[#d6e3ff] opacity-20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[300px] h-[300px] bg-[#dae2fd] opacity-30 rounded-full blur-[80px]"></div>
        
        <div className="w-full max-w-[520px] bg-white rounded-2xl border border-[#c1c6d6] shadow-[0_20px_40px_rgba(0,93,183,0.08)] p-6 sm:p-8 relative z-10">
          
          {/* Subtelas Toggle based on isTeacherCodeMode state */}
          {!isTeacherCodeMode ? (
            // SUBTELA 1: GENERAL LOGIN (STUDENTS / E-MAIL)
            <>
              {/* Branding & Title */}
              <div className="text-center mb-6 sm:mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#0073e0] text-white rounded-2xl mb-4 shadow-sm">
                  <span className="material-symbols-outlined text-white text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    school
                  </span>
                </div>
                <h1 className="font-extrabold text-2xl tracking-tight text-[#131b2e] mb-1">
                  Bem-vindo(a) ao Abba digital
                </h1>
                <p className="text-xs text-[#414754]">
                  Acesse sua conta para continuar aprendendo
                </p>
              </div>

              {/* Status Alert (Offline warning banner) */}
              <AnimatePresence>
                {!isOnline && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 p-4 bg-[#ffdad6] text-[#93000a] rounded-xl border border-red-200 flex items-start gap-3 text-xs"
                  >
                    <span className="material-symbols-outlined shrink-0 text-red-600 mt-0.5">wifi_off</span>
                    <div>
                      <span className="font-bold block mb-1">Você está Offline!</span>
                      Login por e-mail indisponível. Utilize seu **Código de Acesso Único** fornecido pelo Teatcher para acessar o aplicativo localmente.
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error and Success Notifications */}
              <AnimatePresence>
                {errorMsg && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="mb-4 p-3.5 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-semibold rounded-xl"
                  >
                    {errorMsg}
                  </motion.div>
                )}
                {successMsg && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="mb-4 p-3.5 bg-green-50 border-l-4 border-green-500 text-green-700 text-xs font-semibold rounded-xl"
                  >
                    {successMsg}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Login Form */}
              <form 
                onSubmit={handleCodeLogin} 
                className="space-y-4 sm:space-y-5"
              >
                
                {/* TAB: STUDENT CODE FIELDS */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#414754] ml-1" htmlFor="access-code">
                      Código de Acesso
                    </label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#005bb3] transition-colors">
                        key
                      </span>
                      <input 
                        className="w-full pl-11 pr-4 py-3 bg-[#faf8ff] border border-[#c1c6d6] rounded-lg focus:ring-2 focus:ring-[#005bb3]/20 focus:border-[#005bb3] outline-none transition-all text-xs sm:text-sm text-[#131b2e] placeholder:text-slate-400/60 font-mono" 
                        id="access-code" 
                        placeholder="Digite seu código (ex: NKOHML)" 
                        type="text"
                        value={accessCode}
                        onChange={(e) => setAccessCode(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#414754] ml-1" htmlFor="student-email">
                      E-mail de Acesso (Gmail ou Outlook)
                    </label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#005bb3] transition-colors">
                        mail
                      </span>
                      <input 
                        className="w-full pl-11 pr-4 py-3 bg-[#faf8ff] border border-[#c1c6d6] rounded-lg focus:ring-2 focus:ring-[#005bb3]/20 focus:border-[#005bb3] outline-none transition-all text-xs sm:text-sm text-[#131b2e] placeholder:text-slate-400/60" 
                        id="student-email" 
                        placeholder="Ex: seu.nome@gmail.com" 
                        type="email"
                        value={studentEmailInput}
                        onChange={(e) => setStudentEmailInput(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <p className="text-[11px] text-[#414754] px-1 leading-normal">
                    Insira o seu código de acesso simples de 6 dígitos e seu e-mail do Gmail ou Outlook para autenticar instantaneamente!
                  </p>
                </div>

                <button 
                  className="w-full bg-[#0073e0] text-[#fefcff] font-semibold text-xs sm:text-sm py-3 sm:py-3.5 rounded-lg hover:shadow-lg hover:shadow-[#005bb3]/20 active:scale-[0.98] transition-all duration-200 cursor-pointer border-none" 
                  type="submit"
                >
                  Entrar na Plataforma
                </button>
              </form>
            </>
          ) : (
            // SUBTELA 2: TEACHER EXCLUSIVE LOGIN (ALPHANUMERIC CODE)
            <>
              {/* Branding & Title */}
              <div className="text-center mb-6 sm:mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#0073e0] text-white rounded-2xl mb-4 shadow-sm">
                  <span className="material-symbols-outlined text-white text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    school
                  </span>
                </div>
                <h1 className="font-extrabold text-2xl tracking-tight text-[#131b2e] mb-1">
                  Login do Teatcher
                </h1>
                <p className="text-xs text-[#414754]">
                  Acesse sua conta para entrar
                </p>
              </div>

              {/* Error and Success Notifications */}
              <AnimatePresence>
                {errorMsg && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="mb-4 p-3.5 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-semibold rounded-xl"
                  >
                    {errorMsg}
                  </motion.div>
                )}
                {successMsg && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="mb-4 p-3.5 bg-green-50 border-l-4 border-green-500 text-green-700 text-xs font-semibold rounded-xl"
                  >
                    {successMsg}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Login Form */}
              <form onSubmit={handleTeacherCodeLogin} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#414754] ml-1" htmlFor="alphanumeric-code">
                    Código de Acesso Alfanumérico
                  </label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#005bb3] transition-colors">
                      vpn_key
                    </span>
                    <input 
                      className="w-full pl-11 pr-4 py-3 bg-[#faf8ff] border border-[#c1c6d6] rounded-lg focus:ring-2 focus:ring-[#005bb3]/20 focus:border-[#005bb3] outline-none transition-all text-xs sm:text-sm text-[#131b2e] placeholder:text-slate-400/60 font-mono tracking-widest" 
                      id="alphanumeric-code" 
                      placeholder="Ex: ABC123DEF" 
                      type="text"
                      value={alphanumericCode}
                      onChange={(e) => setAlphanumericCode(e.target.value)}
                    />
                  </div>
                </div>

                <button 
                  className="w-full bg-[#0073e0] text-[#fefcff] font-semibold text-xs sm:text-sm py-3 sm:py-3.5 rounded-lg hover:shadow-lg hover:shadow-[#005bb3]/20 active:scale-[0.98] transition-all duration-200 cursor-pointer border-none" 
                  type="submit"
                >
                  Entrar na Plataforma
                </button>
              </form>

              {/* Social Login Divider (Only online) */}
              {isOnline && (
                <>
                  <div className="flex items-center my-6">
                    <div className="flex-grow border-t border-[#c1c6d6]"></div>
                    <span className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Ou entrar com
                    </span>
                    <div className="flex-grow border-t border-[#c1c6d6]"></div>
                  </div>

                  {/* Social Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => handleSocialLogin('google')}
                      className="flex items-center justify-center gap-2 py-3 px-3 border border-[#c1c6d6] rounded-lg bg-[#faf8ff] hover:bg-[#eaedff] transition-colors active:scale-[0.98] cursor-pointer"
                    >
                      <img alt="Google" className="w-5 h-5 object-contain" src="src/assets/icons/Google logo.svg" />
                      <span className="font-semibold text-xs sm:text-sm text-[#131b2e]">Google</span>
                    </button>
                    <button 
                      onClick={() => handleSocialLogin('microsoft')}
                      className="flex items-center justify-center gap-2 py-3 px-3 border border-[#c1c6d6] rounded-lg bg-[#faf8ff] hover:bg-[#eaedff] transition-colors active:scale-[0.98] cursor-pointer"
                    >
                      <img alt="Microsoft" className="w-5 h-5 object-contain" src="src/assets/icons/Microsoft_logo.svg" />
                      <span className="font-semibold text-xs sm:text-sm text-[#131b2e]">Microsoft</span>
                    </button>
                  </div>
                </>
              )}
            </>
          )}

        </div>

      </main>

      {/* FOOTER COMPONENT */}
      <footer className="flex flex-col md:flex-row justify-between items-center py-4 px-6 sm:px-10 w-full bg-[#f2f3ff] border-t border-[#c1c6d6]/20 text-xs sm:text-sm">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <span className="font-bold text-[#131b2e]">ABBA DIGITAL</span>
          <span className="text-[#414754]">© 2026 Abba digital. Todos os direitos reservados.</span>
        </div>
        <div className="flex gap-6 mt-4 md:mt-0">
          <a className="text-[#414754] hover:text-[#005bb3] transition-all duration-200" href="#">Política de privacidade</a>
          <a className="text-[#414754] hover:text-[#005bb3] transition-all duration-200" href="#">Termos de uso</a>
          <a className="text-[#414754] hover:text-[#005bb3] transition-all duration-200" href="#">Contato</a>
        </div>
      </footer>

    </div>
  );
};

interface SignupScreenProps {
  onSignupSuccess: () => void;
  onGoToLogin: () => void;
  onGoToLanding?: () => void;
}

export const SignupScreen: React.FC<SignupScreenProps> = ({ onSignupSuccess, onGoToLogin, onGoToLanding }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanValue = e.target.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s]/g, '');
    setName(cleanValue);
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setErrorMsg('Por favor, preencha todos os campos.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('As senhas não coincidem.');
      return;
    }

    if (!termsAccepted) {
      setErrorMsg('Você precisa aceitar os Termos e Políticas de Privacidade.');
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password: password,
        options: { data: { name: name.trim(), role: 'teacher' } }
      });

      if (error) {
        setErrorMsg('Erro ao cadastrar: ' + error.message);
        return;
      }

      setSuccessMsg('Cadastro realizado com sucesso! Redirecionando...');
      setTimeout(onSignupSuccess, 1500);
    } catch (err: any) {
      setErrorMsg('Erro: ' + err.message);
    }
  };

  const handleSocialSignup = async (platform: 'google' | 'microsoft') => {
    setErrorMsg(null);
    setSuccessMsg(`Redirecionando para ${platform === 'google' ? 'Google' : 'Microsoft'}...`);
    try {
      const provider = platform === 'google' ? 'google' : 'azure';
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin }
      });
      if (error) {
        setErrorMsg('Erro na autenticação: ' + error.message);
        setSuccessMsg(null);
      }
    } catch (err: any) {
      setErrorMsg('Erro de conexão: ' + err.message);
      setSuccessMsg(null);
    }
  };

  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "'Inter', sans-serif", backgroundColor: '#faf8ff', color: '#131b2e' }}>

      {/* ═══ HEADER ═══ */}
      <header
        className="fixed top-0 w-full z-50 border-b"
        style={{ backgroundColor: 'rgba(250, 248, 255, 0.8)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderColor: '#c1c6d6' }}
      >
        <div className="flex justify-between items-center w-full mx-auto" style={{ maxWidth: 1200, padding: '16px 20px' }}>
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-90 active:scale-[0.99] transition-all" 
            onClick={() => onGoToLanding ? onGoToLanding() : onGoToLogin()}
            title="Voltar para a página principal"
          >
            <img src="https://res.cloudinary.com/dudmozd8z/image/upload/v1779315941/logoabra2_kls3we.svg" alt="ABBA Logo" className="w-8 h-8 object-contain" />
            <span style={{ color: '#005bb3', fontSize: 28, lineHeight: '36px', fontWeight: 600, letterSpacing: '-0.02em' }}>ABBA DIGITAL</span>
          </div>
          <div className="flex items-center" style={{ gap: 16 }}>
            <span className="hidden md:inline" style={{ color: '#414754', fontSize: 13, lineHeight: '18px', fontWeight: 500 }}>Já tem uma conta?</span>
            <button
              onClick={onGoToLogin}
              className="cursor-pointer border-none bg-transparent"
              style={{ color: '#005bb3', fontWeight: 700, fontSize: 14, padding: '4px 8px' }}
            >
              Entrar
            </button>
          </div>
        </div>
      </header>

      {/* ═══ MAIN ═══ */}
      <main className="flex-grow flex items-stretch" style={{ paddingTop: 72 }}>
        <div className="flex w-full" style={{ minHeight: '100%' }}>

          {/* ── LEFT PANEL: Hero image + Glass card ── */}
          <section className="hidden lg:flex relative overflow-hidden items-center justify-center" style={{ width: '50%', padding: 32 }}>
            {/* Background image */}
            <div className="absolute inset-0" style={{ zIndex: 0 }}>
              <img
                alt="Estudantes colaborando"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBJM3W4OSkGFPWU6UimtB-Fvcrjrrzuub3IVwCevEH8sgByQgET-iZnCLaCzHbZXgi7_DRtGzWNq1APFm37XN978EpVU5WEXCB4dIRSnq9g43xk9TqB_lFfcXC9epBV9AIUWJ-DY56TluzXRcgSP8EpNH6YWK9jOHTRV05uEY0TcDe-kL4LmACJfJ54BG7TSCrj4vf55fwLZO7BBml0Ihm1MxZR2S4laeHiLldwWlOwZ083rXhdzSyk6htg1NKtSmp3ni7ZMeWPL9_w"
              />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top right, rgba(0,91,179,0.4), rgba(0,115,224,0.2))', mixBlendMode: 'multiply' }} />
            </div>

            {/* Glass card */}
            <div
              className="relative"
              style={{
                zIndex: 10,
                maxWidth: 512,
                width: '100%',
                padding: 32,
                borderRadius: 12,
                background: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.3)',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              }}
            >
              <h1 style={{ fontWeight: 600, fontSize: 28, lineHeight: '36px', letterSpacing: '-0.02em', color: '#131b2e', marginBottom: 16 }}>
                Expanda seus horizontes com o Abba Digital.
              </h1>
              <p style={{ fontSize: 16, lineHeight: '24px', color: '#414754', whiteSpace: 'pre-wrap' }}>
                Abba Digital é a evolução online do método ABBA: uma plataforma que transforma os cubos físicos em experiências interativas para leitura, escrita e práticas bilíngues, acessíveis de qualquer lugar
              </p>
              <div className="flex items-center" style={{ marginTop: 32, gap: 16 }}>
                <div className="flex" style={{ marginLeft: 0 }}>
                  <img alt="User 1" className="w-10 h-10 rounded-full" style={{ border: '2px solid #faf8ff', marginRight: -12 }} src="https://lh3.googleusercontent.com/aida-public/AB6AXuDE7Zl4eLsTwLr1CnPreQc7_143RMvlmv8fV9QgzaBURfjdtjnGii4i0Jq_jyfssUREgesEKpmTkiZsT7j1_RbKBt93oZzMYrKbWdqpOhyRtrjHq80RPIpbzmABShKulRCvb2_n4YSroPdHfNha7mntyKet3rbKa3MGdIOqWnlDYwtGBRgwhHKx7WwURT6t1g7aB9o0KAR40R4QUQqG-xqIRVDRVkkMfDKcpYxFjoC24vDCRHVTqqeMYvE8qPN_Hb3B_13dtutd892D" />
                  <img alt="User 2" className="w-10 h-10 rounded-full" style={{ border: '2px solid #faf8ff', marginRight: -12 }} src="https://lh3.googleusercontent.com/aida-public/AB6AXuA9meeOXPXwLVfWzM30w-DR8sjrUx2srrdCRzljhbkP2c22W5GRir2REb3MGASHLISGyiTFtheRlr20wxOLRp07CdVMvLuG2Zh3AWv3vhCHnvazcKf-XB7PQYv7u4qJYxNbmr-gYcj820-cZAXKOUJ6zDiwVaC0uAeEmlec9wAQjwaR4Iqd0pVEdRDVcmHJBf_P0Ii6l5fiiHl8wtbbLvZ5r_No8aUxoP1S7NZ4VsPmJFyJIlGc1mVU5PAfuQP6BRYkjgEIYG8ndXt4" />
                  <img alt="User 3" className="w-10 h-10 rounded-full" style={{ border: '2px solid #faf8ff', marginRight: -12 }} src="https://lh3.googleusercontent.com/aida-public/AB6AXuDtt-wVq_Q5H8vbqqp93I1TYU-uLntQHjQwiN8u3KzcVqJ4Nj5BZSDs67N1lXkV7H6G-8pFppEZGENb0yZbERZdUcarWFY1pFLihPuzXC8lWZRhaSwf3TPr41pkqnbHXtcr5l0nBjp4aKER5XwY7DgF-TabnDZy44ttdd9RtUrp9LaiEj_eKLAZI31ofp3hzNY209moYRrsfIwdrBLTW_cYrxVTADH1gN2JqA_JFFrpNNThLhTGKo5A133THqdhQ0Ocz-YbqA3XdZiZ" />
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ border: '2px solid #faf8ff', backgroundColor: '#005bb3', color: '#fff', fontSize: 12, fontWeight: 700 }}>+</div>
                </div>
                <span style={{ color: '#414754', fontSize: 13, lineHeight: '18px', fontWeight: 500 }}>Educação levada a sério.</span>
              </div>
            </div>
          </section>

          {/* ── RIGHT PANEL: Signup form ── */}
          <section className="w-full lg:w-auto flex items-center justify-center" style={{ flex: '1 1 50%', padding: '20px', backgroundColor: '#faf8ff' }}>
            <div className="w-full flex flex-col" style={{ maxWidth: 440, gap: 32 }}>

              {/* Title block */}
              <div className="flex flex-col" style={{ gap: 8 }}>
                <h2 style={{ fontWeight: 600, fontSize: 28, lineHeight: '36px', letterSpacing: '-0.02em', color: '#131b2e' }}>Criar Conta</h2>
                <p style={{ fontSize: 14, lineHeight: '20px', color: '#414754' }}>Comece sua jornada educacional hoje mesmo.</p>
              </div>

              {/* Error / Success feedback */}
              <AnimatePresence>
                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{ padding: 14, backgroundColor: '#fef2f2', borderLeft: '4px solid #ef4444', color: '#b91c1c', fontSize: 12, fontWeight: 600, borderRadius: 12 }}
                  >
                    {errorMsg}
                  </motion.div>
                )}
                {successMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{ padding: 14, backgroundColor: '#f0fdf4', borderLeft: '4px solid #22c55e', color: '#15803d', fontSize: 12, fontWeight: 600, borderRadius: 12 }}
                  >
                    {successMsg}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form area */}
              <div className="flex flex-col" style={{ gap: 16 }}>
                <h3 style={{ fontWeight: 600, fontSize: 16, lineHeight: '24px', color: '#131b2e', marginBottom: 8 }}>Crie sua conta com:</h3>

                {/* Social buttons */}
                <div className="flex flex-col" style={{ gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => handleSocialSignup('google')}
                    className="w-full flex items-center justify-center cursor-pointer group"
                    style={{ gap: 16, padding: '16px 24px', border: '1px solid #c1c6d6', borderRadius: 8, backgroundColor: 'transparent', transition: 'background-color 200ms' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f2f3ff')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <img alt="Google Logo" className="w-5 h-5" src="src/assets/icons/Google logo.svg" />
                    <span style={{ fontSize: 13, lineHeight: '18px', fontWeight: 500, color: '#414754' }}>Entrar com o Google</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSocialSignup('microsoft')}
                    className="w-full flex items-center justify-center cursor-pointer group"
                    style={{ gap: 16, padding: '16px 24px', border: '1px solid #c1c6d6', borderRadius: 8, backgroundColor: 'transparent', transition: 'background-color 200ms' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f2f3ff')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <img alt="Microsoft Logo" className="w-5 h-5" src="src/assets/icons/Microsoft_logo.svg" />
                    <span style={{ fontSize: 13, lineHeight: '18px', fontWeight: 500, color: '#414754' }}>Entrar com o Microsoft</span>
                  </button>
                </div>

                {/* Divider */}
                <div className="relative flex items-center" style={{ padding: '16px 0' }}>
                  <div className="flex-grow" style={{ borderTop: '1px solid #c1c6d6' }} />
                  <span style={{ flexShrink: 0, margin: '0 16px', fontSize: 12, lineHeight: '16px', fontWeight: 500, color: '#717785' }}>OU</span>
                  <div className="flex-grow" style={{ borderTop: '1px solid #c1c6d6' }} />
                </div>

                {/* Email form */}
                <form onSubmit={handleSignupSubmit} className="flex flex-col" style={{ gap: 16 }}>

                  {/* Nome */}
                  <div className="flex flex-col" style={{ gap: 4 }}>
                    <label style={{ fontSize: 13, lineHeight: '18px', fontWeight: 500, color: '#414754', marginLeft: 4 }} htmlFor="signup-name">Nome Completo</label>
                    <input
                      style={{ width: '100%', height: 48, padding: '0 16px', backgroundColor: '#ffffff', border: '1px solid #c1c6d6', borderRadius: 8, outline: 'none', fontSize: 14, lineHeight: '20px', color: '#131b2e', transition: 'all 200ms' }}
                      id="signup-name"
                      placeholder="Ex: Maria Silva"
                      type="text"
                      value={name}
                      onChange={handleNameChange}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#005bb3'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,91,179,0.2)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = '#c1c6d6'; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                  </div>

                  {/* Email */}
                  <div className="flex flex-col" style={{ gap: 4 }}>
                    <label style={{ fontSize: 13, lineHeight: '18px', fontWeight: 500, color: '#414754', marginLeft: 4 }} htmlFor="signup-email">Email Profissional</label>
                    <input
                      style={{ width: '100%', height: 48, padding: '0 16px', backgroundColor: '#ffffff', border: '1px solid #c1c6d6', borderRadius: 8, outline: 'none', fontSize: 14, lineHeight: '20px', color: '#131b2e', transition: 'all 200ms' }}
                      id="signup-email"
                      placeholder="nome@email.com"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#005bb3'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,91,179,0.2)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = '#c1c6d6'; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                  </div>

                  {/* Senha + Confirmar lado a lado em md+ */}
                  <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 16 }}>
                    <div className="flex flex-col" style={{ gap: 4 }}>
                      <label style={{ fontSize: 13, lineHeight: '18px', fontWeight: 500, color: '#414754', marginLeft: 4 }} htmlFor="signup-password">Senha</label>
                      <div className="relative">
                        <input
                          style={{ width: '100%', height: 48, padding: '0 40px 0 16px', backgroundColor: '#ffffff', border: '1px solid #c1c6d6', borderRadius: 8, outline: 'none', fontSize: 14, lineHeight: '20px', color: '#131b2e', transition: 'all 200ms' }}
                          id="signup-password"
                          placeholder="••••••••"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onFocus={(e) => { e.currentTarget.style.borderColor = '#005bb3'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,91,179,0.2)'; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = '#c1c6d6'; e.currentTarget.style.boxShadow = 'none'; }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(prev => !prev)}
                          className="absolute cursor-pointer border-none bg-transparent"
                          style={{ right: 12, top: '50%', transform: 'translateY(-50%)', color: '#717785', transition: 'color 200ms' }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#005bb3')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = '#717785')}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                            {showPassword ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col" style={{ gap: 4 }}>
                      <label style={{ fontSize: 13, lineHeight: '18px', fontWeight: 500, color: '#414754', marginLeft: 4 }} htmlFor="signup-confirm">Confirmar Senha</label>
                      <input
                        style={{ width: '100%', height: 48, padding: '0 16px', backgroundColor: '#ffffff', border: '1px solid #c1c6d6', borderRadius: 8, outline: 'none', fontSize: 14, lineHeight: '20px', color: '#131b2e', transition: 'all 200ms' }}
                        id="signup-confirm"
                        placeholder="••••••••"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onFocus={(e) => { e.currentTarget.style.borderColor = '#005bb3'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,91,179,0.2)'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = '#c1c6d6'; e.currentTarget.style.boxShadow = 'none'; }}
                      />
                    </div>
                  </div>

                  {/* Termos checkbox */}
                  <div className="flex items-start" style={{ gap: 16, marginTop: 8 }}>
                    <input
                      className="cursor-pointer"
                      style={{ marginTop: 4, width: 16, height: 16, accentColor: '#005bb3', borderRadius: 4 }}
                      id="signup-terms"
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                    />
                    <label style={{ fontSize: 12, lineHeight: '16px', fontWeight: 500, color: '#414754' }} htmlFor="signup-terms" className="cursor-pointer select-none">
                      Eu concordo com os{' '}
                      <a href="#" style={{ color: '#005bb3' }} className="hover:underline">Termos de Serviço</a>
                      {' '}e com a{' '}
                      <a href="#" style={{ color: '#005bb3' }} className="hover:underline">Política de Privacidade</a>
                      {' '}do Abba digital.
                    </label>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    className="w-full cursor-pointer border-none"
                    style={{
                      marginTop: 16,
                      height: 48,
                      backgroundColor: '#005bb3',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: 14,
                      borderRadius: 8,
                      boxShadow: '0 10px 15px -3px rgba(0,91,179,0.2)',
                      transition: 'all 200ms',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0073e0')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#005bb3')}
                  >
                    Criar Minha Conta
                  </button>
                </form>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ backgroundColor: '#f2f3ff', borderTop: '1px solid #c1c6d6' }}>
        <div className="w-full flex flex-col md:flex-row justify-between items-center mx-auto" style={{ maxWidth: 1200, padding: '16px 20px', gap: 16 }}>
          <div style={{ fontSize: 12, lineHeight: '16px', fontWeight: 500, color: '#5f6365' }}>© 2026 Abba Digital. Todos os direitos reservados.</div>
          <div className="flex" style={{ gap: 24 }}>
            <a href="#" style={{ fontSize: 12, lineHeight: '16px', fontWeight: 500, color: '#5f6365' }} className="hover:text-[#005bb3] transition-colors">Política de privacidade</a>
            <a href="#" style={{ fontSize: 12, lineHeight: '16px', fontWeight: 500, color: '#5f6365' }} className="hover:text-[#005bb3] transition-colors">Termos de uso</a>
            <a href="#" style={{ fontSize: 12, lineHeight: '16px', fontWeight: 500, color: '#5f6365' }} className="hover:text-[#005bb3] transition-colors">Suporte</a>
          </div>
        </div>
      </footer>

    </div>
  );
};

