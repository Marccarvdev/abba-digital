import React, { SVGProps, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Loader from './Loader';

// Custom icons to keep everything clean and self-contained
const ArrowLeftIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const WhatsAppIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
);

const GmailIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
  </svg>
);

const CalendarIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const HeartIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

// Mapped metadata for the 8 sequential gallery images
const GALLERY_ITEMS = [
  {
    src: "https://res.cloudinary.com/dudmozd8z/image/upload/v1779565246/tabvermelho_iuejrf.avif",
    title: "Tabela de Letras Vermelhas (Alemão)",
    description: "Tabela em formato A4 para os exercícios do ABBA analógico na língua alemã."
  },
  {
    src: "https://res.cloudinary.com/dudmozd8z/image/upload/v1779565247/tabazul_eplu2h.avif",
    title: "Tabela de Letras Azuis (Inglês)",
    description: "Tabela em formato A4 para os exercícios na língua inglesa."
  },
  {
    src: "https://res.cloudinary.com/dudmozd8z/image/upload/v1779565246/tabpreto_dbwmcl.avif",
    title: "Tabela de Letras Pretas (Português)",
    description: "Tabela em formato A4 para os exercícios na língua portuguesa."
  },
  {
    src: "https://res.cloudinary.com/dudmozd8z/image/upload/v1779565246/palavras1_hj2w4z.avif",
    title: "Palavras Escritas com os Cubos (Exemplo 1)",
    description: "Exemplo de palavras montadas e alinhadas empiricamente em paralelo."
  },
  {
    src: "https://res.cloudinary.com/dudmozd8z/image/upload/v1779565246/palavras2_bky3wy.avif",
    title: "Palavras Escritas com os Cubos (Exemplo 2)",
    description: "Destaque para a correspondência de cores e caracteres entre as línguas."
  },
  {
    src: "https://res.cloudinary.com/dudmozd8z/image/upload/v1779565246/palav3_bhesqe.avif",
    title: "Frases Escritas com os Cubos (Exemplo 1)",
    description: "Montagem física de frases integradoras usando os cubos do ABBA."
  },
  {
    src: "https://res.cloudinary.com/dudmozd8z/image/upload/v1779565245/palavr4_qbydb0.avif",
    title: "Frases Escritas com os Cubos (Exemplo 2)",
    description: "Tradução paralela e consolidação da velocidade de leitura e escrita."
  },
  {
    src: "https://res.cloudinary.com/dudmozd8z/image/upload/v1779565245/painel_k2fqw5.avif",
    title: "O Painel Magnético do ABBA",
    description: "Estrutura metálica de apoio para fixação dos cubos e treinamento pedagógico."
  },
  {
    src: "https://res.cloudinary.com/dudmozd8z/image/upload/v1779565508/habenter_cfxsmy.avif",
    title: "A Camiseta Bordada do ABBA",
    description: "Apresentação da identidade visual do ábaco bilingue."
  }
];

const GALLERY_GROUPS: Record<string, typeof GALLERY_ITEMS> = {
  tables: [
    GALLERY_ITEMS[0],
    GALLERY_ITEMS[1],
    GALLERY_ITEMS[2]
  ],
  words: [
    GALLERY_ITEMS[3],
    GALLERY_ITEMS[4]
  ],
  phrases: [
    GALLERY_ITEMS[5],
    GALLERY_ITEMS[6]
  ],
  panel: [
    GALLERY_ITEMS[7]
  ],
  shirt: [
    GALLERY_ITEMS[8]
  ]
};

const renderAbacusBlockSVG = (letter: string) => {
  return (
    <span className="inline-block align-middle mx-1.5 select-none font-sans">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="filter drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.12)]">
        {/* Extruded base for depth */}
        <rect x="0" y="2" width="28" height="26" rx="5" fill="#D1D5DB" />
        {/* Main top face of block */}
        <rect x="0" y="0" width="28" height="25" rx="5" fill="#FFFFFF" />
        {/* Subtle top bezel highlight */}
        <rect x="1" y="1" width="26" height="23" rx="4" fill="none" stroke="#E2E8F0" strokeWidth="1" />
        {/* Centered Bold Letter */}
        <text 
          x="14" 
          y="17" 
          textAnchor="middle" 
          fill="#000000" 
          fontSize="14" 
          fontWeight="900" 
          fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
        >
          {letter}
        </text>
      </svg>
    </span>
  );
};

interface AboutSectionProps {
  onBack: () => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ onBack }) => {
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [activeGroupIndex, setActiveGroupIndex] = useState<number>(0);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isRespectModalOpen, setIsRespectModalOpen] = useState(false);

  const OFFENSIVE_WORDS = [
    'porra', 'caralho', 'puta', 'viado', 'viido', 'vido', 'viad', 'fdp', 'corno', 'bosta', 'merda', 'otario', 'otário',
    'imbecil', 'idiota', 'retardado', 'lixo', 'babaca', 'burro', 'estupido', 'estúpido',
    'cu', 'cuzao', 'cuzão', 'asshole', 'bitch', 'shit', 'fuck', 'paspalho', 'arrombado', 'desgraçado',
    'chupador', 'vagabundo', 'canalha', 'safado', 'cretino', 'escroto', 'fedorento', 'corrupto',
    'pinto', 'bunda', 'crl', 'vtnc', 'tnc', 'pqp', 'caralha', 'caralhao', 'caralhão', 'fodase', 'foda-se',
    'piroca', 'cacete', 'xereca', 'xota', 'buceta', 'pica', 'rola', 'boquete', 'punheta', 'bicha', 'viadinho',
    'crleo', 'caraleo', 'caralho', 'bct', 'crlh', 'krlh', 'filhodaputa', 'putaria', 'cuzao', 'fodido'
  ];

  const hasOffensiveTerms = (text: string): boolean => {
    if (!text) return false;
    const normalized = text.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // strip accents
      // Leetspeak / bypasses translation
      .replace(/4|@/g, "a")
      .replace(/3|&/g, "e")
      .replace(/1|!|%|\|/g, "i")
      .replace(/0|\*/g, "o")
      .replace(/5|\$/g, "s")
      .replace(/7/g, "t")
      .replace(/k/g, "c") // treat 'k' as 'c' (e.g. krl -> crl)
      .replace(/\s+/g, "") // strip all spaces
      .replace(/[^a-z]/g, ""); // strip all other symbols (e.g. @, %, *, _)
      
    return OFFENSIVE_WORDS.some(word => {
      const wordNormalized = word.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/4|@/g, "a")
        .replace(/3|&/g, "e")
        .replace(/1|!|%|\|/g, "i")
        .replace(/0|\*/g, "o")
        .replace(/5|\$/g, "s")
        .replace(/7/g, "t")
        .replace(/k/g, "c")
        .replace(/\s+/g, "")
        .replace(/[^a-z]/g, "");
      return normalized.includes(wordNormalized);
    });
  };

  const isGibberish = (text: string): boolean => {
    const trimmed = text.trim();
    if (trimmed.length < 2) return true;

    // 1. Repeated letters (3 or more same letters consecutively)
    if (/(.)\1\1/.test(trimmed)) return true;

    // 2. Count vowels and consonants
    const vowels = (trimmed.match(/[aeiouyáéíóúâêôãõüÀ-ÿ]/gi) || []).length;
    const letters = (trimmed.match(/[a-zA-ZÀ-ÿ]/g) || []).length;
    const consonants = letters - vowels;

    // A valid name must have at least one vowel
    if (vowels === 0 && letters > 0) return true;

    // Consonant smash (e.g. "sdfgh")
    if (/[bcdfghjklmnpqrstvwxz]{4,}/i.test(trimmed)) return true;

    // Vowel smash (e.g. "aeiouy")
    if (/[aeiouyáéíóúâêôãõü]{5,}/i.test(trimmed)) return true;

    // Extreme ratios
    if (letters >= 4) {
      if (vowels / letters < 0.15) return true;
      if (vowels / letters === 1) return true;
    }

    // Key smash patterns
    const commonSmashes = ['qwe', 'asd', 'zxc', 'jkl', 'dfg', 'yui', 'bnm', 'hjkl', 'asdf'];
    const lower = trimmed.toLowerCase();
    if (commonSmashes.some(smash => lower.includes(smash))) return true;

    return false;
  };

  const [formValues, setFormValues] = useState({ firstName: '', lastName: '', phone: '', message: '' });
  const [formErrors, setFormErrors] = useState<{ firstName?: string, lastName?: string, phone?: string, message?: string }>({});
  const [gmailOffensiveWarned, setGmailOffensiveWarned] = useState(false);

  const [whatsappFormValues, setWhatsappFormValues] = useState({ firstName: '', lastName: '', message: '' });
  const [whatsappFormErrors, setWhatsappFormErrors] = useState<{ firstName?: string, lastName?: string, message?: string }>({});
  const [whatsappOffensiveWarned, setWhatsappOffensiveWarned] = useState(false);

  const validatePhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, '');
    if (!numbers) return "Preencha o número de Whatsapp";
    if (numbers.length > 0 && numbers.length < 11) return "Formato de número invalido, digite novamente";
    return "";
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 11) val = val.slice(0, 11);
    let formatted = val;
    if (val.length > 2) formatted = `(${val.slice(0,2)}) ${val.slice(2)}`;
    if (val.length > 7) formatted = `(${val.slice(0,2)}) ${val.slice(2,7)}-${val.slice(7)}`;
    setFormValues(prev => ({ ...prev, phone: formatted }));
    
    if (formErrors.phone) {
        setFormErrors(prev => ({ ...prev, phone: undefined }));
    }
  };

  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const errors: any = {};
    const fName = formValues.firstName.trim();
    const lName = formValues.lastName.trim();

    let hasOffensive = false;

    if (!fName) {
      errors.firstName = "Nome é obrigatório.";
    } else if (hasOffensiveTerms(fName)) {
      errors.firstName = "O Nome contém um termo inadequado!";
      hasOffensive = true;
    } else if (isGibberish(fName)) {
      errors.firstName = "Insira um nome válido.";
    }

    if (!lName) {
      errors.lastName = "Sobrenome é obrigatório.";
    } else if (hasOffensiveTerms(lName)) {
      errors.lastName = "O Sobrenome contém um termo inadequado!";
      hasOffensive = true;
    } else if (isGibberish(lName)) {
      errors.lastName = "Insira um sobrenome válido.";
    }

    if (!formValues.message.trim()) {
      errors.message = "Mensagem é obrigatória.";
    } else if (hasOffensiveTerms(formValues.message)) {
      errors.message = "A Mensagem contém um termo inadequado!";
      hasOffensive = true;
    }
    
    const phoneErr = validatePhone(formValues.phone);
    if (phoneErr) errors.phone = phoneErr;

    if (Object.keys(errors).length > 0 || hasOffensive) {
      setFormErrors(errors);
      if (hasOffensive) {
        if (gmailOffensiveWarned) {
          setIsRespectModalOpen(true);
        } else {
          setGmailOffensiveWarned(true);
        }
      }
      return;
    }

    setIsSending(true);

    try {
      const resp = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formValues)
      });
      const data = await resp.json();
      
      if (data && data.isValid === false) {
        setIsSending(false);
        setIsRespectModalOpen(true);
        return;
      }
    } catch(err) {
      console.error(err);
    }

    if (formValues.message) {
      navigator.clipboard.writeText(formValues.message).catch(() => {});
    }

    setTimeout(() => {
      setIsSending(false);
      setIsFormModalOpen(false);
      const subject = encodeURIComponent(`Nome: ${formValues.firstName}, Sobrenome: ${formValues.lastName}, Whatsapp: ${formValues.phone}`);
      const body = encodeURIComponent(formValues.message || '');
      window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=projetobrasilbilingue@gmail.com&su=${subject}&body=${body}`, '_blank');
      setFormValues({ firstName: '', lastName: '', phone: '', message: '' });
      setFormErrors({});
    }, 2500);
  };

  const handleWhatsappSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const errors: any = {};
    const fName = whatsappFormValues.firstName.trim();
    const lName = whatsappFormValues.lastName.trim();

    let hasOffensive = false;

    if (!fName) {
      errors.firstName = "Nome é obrigatório.";
    } else if (hasOffensiveTerms(fName)) {
      errors.firstName = "O Nome contém um termo inadequado!";
      hasOffensive = true;
    } else if (isGibberish(fName)) {
      errors.firstName = "Insira um nome válido.";
    }

    if (!lName) {
      errors.lastName = "Sobrenome é obrigatório.";
    } else if (hasOffensiveTerms(lName)) {
      errors.lastName = "O Sobrenome contém um termo inadequado!";
      hasOffensive = true;
    } else if (isGibberish(lName)) {
      errors.lastName = "Insira um sobrenome válido.";
    }

    if (!whatsappFormValues.message.trim()) {
      errors.message = "Mensagem é obrigatória.";
    } else if (hasOffensiveTerms(whatsappFormValues.message)) {
      errors.message = "A Mensagem contém um termo inadequado!";
      hasOffensive = true;
    }
    
    if (Object.keys(errors).length > 0 || hasOffensive) {
      setWhatsappFormErrors(errors);
      if (hasOffensive) {
        if (whatsappOffensiveWarned) {
          setIsRespectModalOpen(true);
        } else {
          setWhatsappOffensiveWarned(true);
        }
      }
      return;
    }

    setIsSending(true);

    try {
      const resp = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(whatsappFormValues)
      });
      const data = await resp.json();
      
      if (data && data.isValid === false) {
        setIsSending(false);
        setIsRespectModalOpen(true);
        return;
      }
    } catch(err) {
      console.error(err);
    }

    setTimeout(() => {
      setIsSending(false);
      setIsWhatsappModalOpen(false);
      const contactText = `*Nome:* ${whatsappFormValues.firstName}\n*Sobrenome:* ${whatsappFormValues.lastName}\n*Mensagem enviada do Abba digital*\n\n${whatsappFormValues.message}`;
      const url = `https://wa.me/5547999034403?text=${encodeURIComponent(contactText)}`;
      window.open(url, '_blank');
      setWhatsappFormValues({ firstName: '', lastName: '', message: '' });
      setWhatsappFormErrors({});
    }, 2500);
  };

  const handleExit = () => {
    setIsExiting(true);
    setTimeout(() => {
      onBack();
    }, 500); // Wait for the transition to finish before actually unmounting
  };

  // Unified grouped keyboard navigation controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // First try closing fullscreen image
      if (e.key === 'Escape' && fullScreenImage !== null) {
        setFullScreenImage(null);
        return;
      }

      // Allow navigation and closing if in gallery mode
      if (activeGroup === null) return;
      const currentItems = GALLERY_GROUPS[activeGroup] || [];
      if (currentItems.length === 0) return;

      if (e.key === 'Escape') {
        setActiveGroup(null);
      } else if (e.key === 'ArrowLeft') {
        setActiveGroupIndex(prev => {
          return prev === 0 ? currentItems.length - 1 : prev - 1;
        });
      } else if (e.key === 'ArrowRight') {
        setActiveGroupIndex(prev => {
          return prev === currentItems.length - 1 ? 0 : prev + 1;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeGroup, activeGroupIndex, fullScreenImage]);

  // Prevent background scrolling while the modal gallery is active
  useEffect(() => {
    if (activeGroup !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [activeGroup]);

  // Proactive preloader for high performance loading
  useEffect(() => {
    if (activeGroup && GALLERY_GROUPS[activeGroup]) {
      const group = GALLERY_GROUPS[activeGroup];
      if (group.length <= 1) return;

      const nextIndex = (activeGroupIndex + 1) % group.length;
      const prevIndex = (activeGroupIndex - 1 + group.length) % group.length;

      // Preload next image in background
      const imgNext = new Image();
      imgNext.src = group[nextIndex].src;

      // Preload previous image in background
      const imgPrev = new Image();
      imgPrev.src = group[prevIndex].src;
    }
  }, [activeGroup, activeGroupIndex]);

  // Render container with blurred backdrop and contained clean photo (WhatsApp style)
  const renderCardVisual = (item: { src: string; title: string }) => {
    return (
      <div className={`w-full h-full relative flex items-center justify-center overflow-hidden select-none transition-colors duration-300 ${
        theme === 'dark' ? 'bg-[#05050a]' : 'bg-[#FAF9F5]'
      }`}>
        {/* WhatsApp-style blurred background */}
        <img 
          src={item.src} 
          alt="" 
          className={`absolute inset-0 w-full h-full object-cover blur-2xl scale-[1.08] pointer-events-none select-none transition-opacity duration-300 ${
            theme === 'dark' ? 'opacity-[0.25]' : 'opacity-[0.14]'
          }`}
          referrerPolicy="no-referrer"
        />
        
        {/* Foreground Image */}
        <img 
          src={item.src} 
          alt={item.title} 
          className="relative z-10 max-w-full max-h-full object-contain pointer-events-none" 
          referrerPolicy="no-referrer"
        />

        {/* Fullscreen Icon Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setFullScreenImage(item.src);
          }}
          className={`absolute bottom-4 right-4 z-30 p-2.5 rounded-xl backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 ${
            theme === 'dark' 
              ? 'bg-black/40 hover:bg-black/60 text-white/90' 
              : 'bg-white/40 hover:bg-white/60 text-black/90 shadow-sm'
          }`}
          title="Ver imagem em tamanho máximo"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8V3m0 0h5M3 3l7 7m4-7h5v5m0-5l-7 7m7 4v5m0 0h-5m5 0l-7-7M8 21H3v-5m0 5l7-7" />
          </svg>
        </button>
      </div>
    );
  };

  // Reusable WhatsApp style thumbnail with blurred background inside a solid frame
  const renderThumbnail = (src: string, alt: string, groupKey: string, indexInGroup: number, aspectClass = "aspect-[4/3]", isVertical = false) => {
    return (
      <div 
        onClick={() => {
          setActiveGroup(groupKey);
          setActiveGroupIndex(indexInGroup);
        }}
        className={`flex flex-col text-center font-mono p-1.5 rounded-2xl border transition-all duration-300 hover:scale-[1.015] hover:shadow-lg cursor-pointer w-full ${
          theme === 'dark' 
            ? 'bg-slate-950/40 border-slate-800/60 hover:border-slate-700/80 shadow-black/40' 
            : 'bg-[#FAF9F5] border-gray-150 hover:border-gray-250 shadow-gray-200/50'
        }`}
      >
        <div className={`${aspectClass} w-full rounded-xl overflow-hidden relative group border ${
          theme === 'dark' ? 'border-white/5 bg-[#05050a]' : 'border-black/5 bg-[#fcfbfa]'
        }`}>
          {isVertical && (
            /* Blurred WhatsApp style background image */
            <img 
              src={src} 
              alt="" 
              className={`absolute inset-0 w-full h-full object-cover blur-xl scale-110 pointer-events-none select-none transition-opacity duration-300 ${
                theme === 'dark' ? 'opacity-[0.25]' : 'opacity-[0.14]'
              }`}
              referrerPolicy="no-referrer"
            />
          )}
          {/* Main image */}
          <img 
            src={src} 
            alt={alt} 
            className={`relative z-10 w-full h-full pointer-events-none transition-transform duration-500 group-hover:scale-[1.03] ${
              isVertical ? 'object-contain' : 'object-cover'
            }`} 
            referrerPolicy="no-referrer" 
          />
          <div className="absolute inset-0 z-20 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    );
  };

  const currentGroupItems = activeGroup ? GALLERY_GROUPS[activeGroup] : [];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -15 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`min-h-screen font-sans pb-24 overflow-y-auto transition-colors duration-500 relative ${
        theme === 'dark' ? 'bg-[#00000f] text-[#cfd5dc] dark-theme-article' : 'bg-white text-gray-900'
      }`}
    >
      {/* Grid background overlay for Dark mode (subtle, soft grid + elegant gradient mask fading at the bottom) */}
      <div 
        className={`absolute inset-0 pointer-events-none select-none z-0 transition-opacity duration-500 ease-in-out ${
          !isExiting && theme === 'dark' ? 'opacity-[0.012]' : 'opacity-0'
        }`}
        style={{
          maskImage: 'linear-gradient(to bottom, black 50%, rgba(0, 0, 0, 0.15) 98%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 50%, rgba(0, 0, 0, 0.15) 98%)'
        }}
      >
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="bg-dark-grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <rect width="30" height="30" fill="none" />
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#bg-dark-grid)" />
        </svg>
      </div>

      {/* Editorial top navigation bar with Voltar, Logo & Modern Switcher (Only visible in blog article, opposite to Logo) */}
      <div className={`sticky top-0 z-50 py-3.5 px-4 sm:px-6 md:px-8 flex items-center justify-center transition-all duration-300 border-b ${
        isExiting ? 'bg-transparent border-transparent shadow-none backdrop-blur-none' : (
          theme === 'dark' 
            ? 'bg-[#00000f]/95 border-slate-800 text-white shadow-[0_1px_3px_rgba(0,0,0,0.4)] backdrop-blur-md' 
            : 'bg-white/95 border-gray-100 text-gray-900 shadow-xs backdrop-blur-md'
        )
      }`}>
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
          {/* Left side: Morphing Hamburger/Back Button and Logo */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExit}
              className={`p-2 -ml-1 rounded-full active:scale-95 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer flex items-center justify-center border shadow-[0_1px_2px_rgba(0,0,0,0.05)] bg-transparent w-10 h-10 ${
                theme === 'dark'
                  ? 'border-slate-800 bg-slate-900/80 hover:bg-slate-800 hover:text-white'
                  : 'border-gray-200 bg-white hover:bg-gray-100 hover:text-gray-900'
              }`}
              title="Voltar para o Ábaco"
            >
              <div className="w-4.5 h-3.5 flex items-center relative">
                <span className={`absolute left-0 h-0.5 rounded-full transition-all duration-500 origin-left ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    theme === 'dark' ? 'bg-gray-300' : 'bg-gray-700'
                } ${
                    isExiting 
                      ? 'w-full -translate-y-[5px] rotate-0' 
                      : 'w-[11px] -rotate-45 translate-x-[-1px]'
                }`} />
                <span className={`absolute left-0 h-0.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    theme === 'dark' ? 'bg-gray-300' : 'bg-gray-700'
                } ${
                    isExiting 
                       ? 'w-full translate-x-0' 
                       : 'w-full translate-x-[1px]'
                }`} />
                <span className={`absolute left-0 h-0.5 rounded-full transition-all duration-500 origin-left ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    theme === 'dark' ? 'bg-gray-300' : 'bg-gray-700'
                } ${
                    isExiting 
                      ? 'w-full translate-y-[5px] rotate-0' 
                      : 'w-[11px] rotate-45 translate-x-[-1px]'
                }`} />
              </div>
            </button>

            {/* Logo & Title */}
            <img src="https://res.cloudinary.com/dudmozd8z/image/upload/v1779315941/logoabra2_kls3we.svg" alt="ABBA Logo" className="w-10 h-10 ml-0.5 object-contain" />
            <div>
              <h1 className={`font-display font-extrabold text-xl tracking-tight flex items-center gap-1.5 transition-colors duration-500 ${
                theme === 'dark' ? 'text-white' : 'text-gray-950'
              }`}>
                ABBA DIGITAL
              </h1>
              <p className={`text-[10px] font-medium transition-colors duration-500 relative flex items-center h-[15px] ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                  <span className={`absolute left-0 whitespace-nowrap transition-opacity duration-500 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>Artigo Científico</span>
                  <span className={`absolute left-0 whitespace-nowrap transition-opacity duration-500 ${isExiting ? 'opacity-100' : 'opacity-0'}`}>Ábaco Brasileiro de Alfabetização Bilíngue</span>
                  <span className="opacity-0 pointer-events-none whitespace-nowrap">Ábaco Brasileiro de Alfabetização Bilíngue</span>
              </p>
            </div>
          </div>

          {/* Right side: Fluid & Modern Theme Switcher (opposing the logo on the right side) */}
          <div 
            className={`flex items-center gap-2 select-none shrink-0 transition-opacity duration-300 ${
              isExiting ? 'opacity-0' : 'opacity-100'
            }`}
          >
          <span className={`hidden sm:inline text-[10px] font-mono font-extrabold tracking-widest uppercase transition-colors duration-305 ${
            theme === 'dark' ? 'text-slate-400' : 'text-gray-505'
          }`}>
            TEMA
          </span>

          {/* Fluid capsule container switcher */}
          <div className={`p-1 rounded-full flex items-center relative gap-1 border transition-all duration-300 w-[72px] h-9 ${
            theme === 'dark' 
              ? 'bg-slate-900 border-slate-800' 
              : 'bg-gray-100 border-gray-250/70'
          }`}>
            {/* Sliding backdrop capsule with spring animation style */}
            <motion.div 
              layout
              transition={{ type: "spring", stiffness: 350, damping: 26 }}
              className="absolute w-7 h-7 rounded-full bg-[#005ba4] shadow-sm"
              style={{
                left: theme === 'light' ? '4px' : '36px',
              }}
            />

            {/* Light Mode Switch Target */}
            <button
              onClick={() => setTheme('light')}
              className={`w-7 h-7 rounded-full flex items-center justify-center relative z-10 transition-colors duration-300 cursor-pointer ${
                theme === 'light' ? 'text-white' : 'text-slate-455 hover:text-slate-700'
              }`}
              title="Tema Claro"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10 5 5 0 000-10z" />
              </svg>
            </button>

            {/* Dark Mode Switch Target */}
            <button
              onClick={() => setTheme('dark')}
              className={`w-7 h-7 rounded-full flex items-center justify-center relative z-10 transition-colors duration-300 cursor-pointer ${
                theme === 'dark' ? 'text-white' : 'text-slate-550 hover:text-slate-200'
              }`}
              title="Tema Escuro"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </button>
          </div>
        </div>
        </div>
      </div>

      {/* Main post body container */}
      <article 
        className={`max-w-4xl mx-auto px-5 sm:px-6 md:px-8 pt-8 sm:pt-12 flex flex-col text-left transition-opacity duration-300 ease-in-out ${
          isExiting ? 'opacity-0' : 'opacity-100'
        }`}
      >
            
            {/* Big Editorial Title */}
        <h1 className={`font-display font-black text-3xl sm:text-4xl md:text-5xl tracking-tight leading-[1.08] mb-4 transition-colors duration-300 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          ABBA — Ábaco Brasileiro de Alfabetização Bilíngue
        </h1>

        {/* Author details card matching Perplexity layout */}
        <div className={`flex flex-wrap items-center gap-x-4 gap-y-3 py-4 border-y mb-8 max-w-full transition-colors duration-300 ${
          theme === 'dark' ? 'border-slate-800' : 'border-gray-150'
        }`}>
          {/* Avatar sphere */}
          <div className={`shrink-0 rounded-full p-[2px] border-2 transition-colors duration-300 ${
            theme === 'dark' ? 'border-white' : 'border-gray-900'
          }`}>
            <img 
              src="https://res.cloudinary.com/dudmozd8z/image/upload/v1779573141/clipboard-image-1779573127_oef0qy.avif" 
              alt="José Décio de Alencar" 
              className="w-10 h-10 rounded-full object-cover"
            />
          </div>
          
          <div className="flex flex-col gap-0.5 justify-center flex-1 min-w-[240px]">
            <span className={`font-display font-extrabold text-sm transition-colors duration-300 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              José Décio de Alencar
            </span>
            <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold font-mono transition-colors duration-306 ${
              theme === 'dark' ? 'text-slate-400' : 'text-gray-505'
            }`}>
              <span className={`font-black tracking-widest ${theme === 'dark' ? 'text-white drop-shadow-sm' : 'text-gray-900'}`}>
                2026
              </span>
              <a href="#" onClick={(e) => { e.preventDefault(); setIsFormModalOpen(true); }} className={`flex items-center gap-1.5 transition-colors ${
                theme === 'dark' ? 'hover:text-sky-400' : 'hover:text-[#005ba4]'
              }`}>
                <img src="https://res.cloudinary.com/dudmozd8z/image/upload/v1779574833/gmail-svgrepo-com_hwwnlb.svg" alt="Email" className="w-4 h-4 shrink-0" />
                <span className="break-all">projetobrasilbilingue@gmail.com</span>
              </a>
              <a href="#" onClick={(e) => { e.preventDefault(); setIsWhatsappModalOpen(true); }} className={`flex items-center gap-1.5 transition-colors ${
                theme === 'dark' ? 'hover:text-sky-400' : 'hover:text-[#005ba4] text-gray-400'
              }`}>
                <img src="https://res.cloudinary.com/dudmozd8z/image/upload/v1779574832/whatsapp-svgrepo-com_tgqnb3.svg" alt="WhatsApp" className="w-4 h-4" />
                <span className="break-all">47 9 9903-4403</span>
              </a>
            </div>
          </div>
        </div>

        {/* Subtitle / Lead section */}
        <p className={`text-lg sm:text-xl font-medium leading-relaxed mb-8 border-l-4 border-[#005ba4] pl-4 italic transition-colors duration-300 ${
          theme === 'dark' ? 'text-[#cfd5dc]' : 'text-gray-600'
        }`}>
          Um material didático para alfabetização simultânea em inglês e alemão, baseado em cubos coloridos, numbers e formação visual das palavras.
        </p>

        {/* SECTION: O que é o ABBA */}
        <section className="mb-10">
          <h2 className={`font-display font-extrabold text-xl sm:text-2xl tracking-tight mb-3 transition-colors duration-300 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            O que é o ABBA
          </h2>
          <div className={`leading-relaxed space-y-4 text-sm sm:text-base transition-colors duration-300 ${
            theme === 'dark' ? 'text-[#cfd5dc]' : 'text-gray-750'
          }`}>
            <p>
              O ABBA é um material didático para alfabetização simultânea em inglês e alemão. Ele consiste de <strong>150 cubos de madeira ou cartolina MDF</strong> de 27cm³ cada, com 900 letras selecionadas pela lógica do <strong>DIAGRAMA DE PARETO</strong> impressas em todas as seis faces of cada cubo.
            </p>
            <p>
              Cada letra tem o número correspondente a sua ordem no alfabeto. Exemplo: <strong>A</strong>, primeira letra <em>(1)</em> e <strong>Z</strong>, vigésima sexta letra <em>(26)</em>.
            </p>
            <p className={`p-4 rounded-xl border transition-colors duration-300 ${
              theme === 'dark' 
                ? 'bg-slate-900/60 border-slate-800 text-[#cfd5dc]' 
                : 'bg-[#FAF9F5] border-gray-200 text-gray-700'
            }`}>
              Cada cubo tem 6 lados. Destes, 2 lados têm letras pretas para escrever as palavras portuguesas, 2 lados letras azuis para as palavras inglesas e 2 lados letras vermelhas para as palavras alemãs. As letras da mesma cor devem ficar em lados vizinhos para facilitar a visualização das duas ao mesmo tempo ao se fazer os exercícios propostos.
            </p>

            {/* Exemplo de Codificação Block */}
            <div className={`mt-8 mb-6 p-5 sm:p-7 rounded-[20px] border relative overflow-hidden transition-colors duration-300 ${
              theme === 'dark' 
                ? 'bg-[#040810] border-[#1A2639]' 
                : 'bg-[#F8FAFC] border-slate-200 shadow-sm'
            }`}>
              {/* Subtle background grid pattern */}
              <div className="absolute inset-0 pointer-events-none opacity-25" style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'30\' height=\'30\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M 30 0 L 0 0 0 30\' fill=\'none\' stroke=\'%233B82F6\' stroke-width=\'0.5\' opacity=\'0.2\'/%3E%3C/svg%3E")',
                backgroundSize: '30px 30px'
              }}></div>
              
              <div className="relative z-10">
                <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[11px] font-black tracking-[0.15em] uppercase mb-6 ${
                  theme === 'dark' ? 'bg-[#111A2C] text-[#F1F5F9]' : 'bg-slate-200/70 text-slate-805'
                }`}>
                  Exemplo de codificação:
                </div>

                <div className="space-y-6 text-[15px] sm:text-base leading-relaxed font-medium">
                  <p className={theme === 'dark' ? 'text-[#E2E8F0]' : 'text-slate-700'}>
                    <strong className={theme === 'dark' ? 'text-white font-extrabold' : 'text-slate-900 font-extrabold'}>Português</strong> <span className={`px-2 py-0.5 rounded text-[11px] uppercase tracking-wider ml-1 ${theme === 'dark' ? 'bg-white text-black font-extrabold' : 'bg-black text-white font-extrabold'}`}>(Preto)</span> : Escrever o número <span className={`px-1.5 py-0.5 rounded mx-0.5 ${theme === 'dark' ? 'bg-[#1E293B] text-slate-300' : 'bg-slate-200 text-slate-800'}`}>1</span> requer duas letras <span className={`px-2 py-0.5 rounded text-[11px] uppercase tracking-wider mx-0.5 font-extrabold ${theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'}`}>Pretas</span> <span className={`px-2 py-0.5 rounded mx-0.5 ${theme === 'dark' ? 'bg-white text-black font-bold' : 'bg-white border border-slate-300 text-slate-900 font-bold shadow-sm'}`}>U</span> e <span className={`px-2 py-0.5 rounded mx-0.5 ${theme === 'dark' ? 'bg-white text-black font-bold' : 'bg-white border border-slate-300 text-slate-900 font-bold shadow-sm'}`}>M</span> , que são a 21ª e a 13ª do alfabeto nesta ordem: <span className={theme === 'dark' ? 'text-[#94A3B8] font-mono font-semibold' : 'text-slate-500 font-mono font-semibold'}>[21, 13]</span>.
                  </p>

                  <p className={theme === 'dark' ? 'text-[#E2E8F0]' : 'text-slate-700'}>
                    <strong className={theme === 'dark' ? 'text-white font-extrabold' : 'text-slate-900 font-extrabold'}>Inglês</strong> <span className="text-[#3B82F6] font-bold ml-1">(Azul)</span>: Escrever o mesmo número <span className={`px-1.5 py-0.5 rounded mx-0.5 ${theme === 'dark' ? 'bg-[#1E3A8A]/40 text-[#60A5FA]' : 'bg-blue-100 text-[#1E3A8A]'}`}>1</span> requer 3 letras <strong className="text-blue-500">azuis</strong> as quais, nos cubos, contêm respectively os seguintes números dispostos nesta ordem: <span className="text-[#3B82F6] font-mono font-medium tracking-wide">[<span className={`px-1.5 py-0.5 rounded mx-0.5 ${theme === 'dark' ? 'bg-[#1E3A8A]/40 text-[#60A5FA]' : 'bg-blue-100 text-[#1E3A8A]'}`}>15</span>, <span className={`px-1.5 py-0.5 rounded mx-0.5 ${theme === 'dark' ? 'bg-[#1E3A8A]/40 text-[#60A5FA]' : 'bg-blue-100 text-[#1E3A8A]'}`}>14</span>, <span className={`px-1.5 py-0.5 rounded mx-0.5 ${theme === 'dark' ? 'bg-[#1E3A8A]/40 text-[#60A5FA]' : 'bg-blue-100 text-[#1E3A8A]'}`}>5</span>]</span>.
                  </p>

                  <p className={theme === 'dark' ? 'text-[#E2E8F0]' : 'text-slate-700'}>
                    <strong className={theme === 'dark' ? 'text-white font-extrabold' : 'text-slate-900 font-extrabold'}>Alemão</strong> <span className="text-[#EF4444] font-bold ml-1">(Vermelho)</span>: Já a palavra <span className={`px-2 py-0.5 rounded mx-1 font-bold ${theme === 'dark' ? 'bg-[#EF4444] text-white' : 'bg-[#EF4444] text-white shadow-sm'}`}>EINS</span> em alemão tem 4 letras <strong className="text-red-500">vermelhas</strong> correspondentes aos números <span className="text-[#EF4444] font-mono font-medium tracking-wide">[<span className={`px-1.5 py-0.5 rounded mx-0.5 ${theme === 'dark' ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-[#EF4444]'}`}>5</span>, <span className={`px-1.5 py-0.5 rounded mx-0.5 ${theme === 'dark' ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-[#EF4444]'}`}>9</span>, <span className={`px-1.5 py-0.5 rounded mx-0.5 ${theme === 'dark' ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-[#EF4444]'}`}>14</span>, <span className={`px-1.5 py-0.5 rounded mx-0.5 ${theme === 'dark' ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-[#EF4444]'}`}>19</span>]</span> exatamente nesta sequência.
                  </p>
                </div>
              </div>
            </div>

            {/* 3 IMAGENS LADO A LADO */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 my-8">
              {renderThumbnail("https://res.cloudinary.com/dudmozd8z/image/upload/v1779565246/tabvermelho_iuejrf.avif", "Tabela Vermelho", "tables", 0)}
              {renderThumbnail("https://res.cloudinary.com/dudmozd8z/image/upload/v1779565247/tabazul_eplu2h.avif", "Tabela Azul", "tables", 1)}
              {renderThumbnail("https://res.cloudinary.com/dudmozd8z/image/upload/v1779565246/tabpreto_dbwmcl.avif", "Tabela Preto", "tables", 2)}
            </div>
            <p className={`text-xs text-center -mt-2 mb-8 ${theme === 'dark' ? 'text-white font-bold' : 'text-gray-800 font-semibold'}`}>
              O ABBA ANALÓGICO de Cartolina
            </p>
          </div>
        </section>

        {/* SECTION: Como funciona */}
        <section className="mb-10">
          <h2 className={`font-display font-extrabold text-xl sm:text-2xl tracking-tight mb-3 transition-colors duration-300 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Como funciona
          </h2>
          <div className={`leading-relaxed space-y-4 text-sm sm:text-base transition-colors duration-305 ${
            theme === 'dark' ? 'text-[#cfd5dc]' : 'text-gray-700'
          }`}>
            <p>
              Usam-se tabelas em folhas A4 com quadrados de 9 cm², nos quais estão impressos os números correspondentes às letras usadas para escrever os números de <strong>ZERO a CEM</strong> nas três línguas.
            </p>
            <p>
              Cada tabela tem 10 números assim divididos: de 0 a 4 na frente e de 5 a 9 no verso, de 10 a 14 frente e 15 a 19 verso, e assim subsequentemente até a última com os números 90 a 94 na frente e 96 a 100 no verso.
            </p>

            {/* 2 IMAGENS LADO A LADO: Palavras Escritas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-8 relative z-10">
              {renderThumbnail("https://res.cloudinary.com/dudmozd8z/image/upload/v1779565246/palavras1_hj2w4z.avif", "Palavras Escritas 1", "words", 0)}
              {renderThumbnail("https://res.cloudinary.com/dudmozd8z/image/upload/v1779565246/palavras2_bky3wy.avif", "Palavras Escritas 2", "words", 1)}
            </div>
            <p className={`text-xs text-center -mt-2 mb-8 ${theme === 'dark' ? 'text-white font-bold' : 'text-gray-800 font-semibold'}`}>
              PALAVRAS ESCRITAS COM OS CUBOS DO ABBA ANALÓGICO
            </p>
          </div>
        </section>

        {/* SECTION: Objetivo das tarefas */}
        <section className="mb-10">
          <h2 className={`font-display font-extrabold text-xl sm:text-2xl tracking-tight mb-3 transition-colors duration-300 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Objetivo das tarefas
          </h2>
          <p className={`leading-relaxed text-sm sm:text-base transition-colors duration-300 ${
            theme === 'dark' ? 'text-[#cfd5dc]' : 'text-gray-750'
          }`}>
            Proporcionar ao aprendiz uma forma prática e fácil de medir, comparar e controlar a velocidade com a qual lê e escreve ao mesmo tempo em que reconhece e identifica a composição das letras de cada palavra, na medida em que organiza e/ou coloca na sequência correta e de forma paralela, integrada e correspondente, a quantidade certa de letras necessárias para escrever cada número de 0 A 100 nos três idiomas.
          </p>

          {/* 2 IMAGENS LADO A LADO: Frases Escritas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-8 relative z-10">
            {renderThumbnail("https://res.cloudinary.com/dudmozd8z/image/upload/v1779565246/palav3_bhesqe.avif", "Frase Escrita 1", "phrases", 0)}
            {renderThumbnail("https://res.cloudinary.com/dudmozd8z/image/upload/v1779565245/palavr4_qbydb0.avif", "Frase Escrita 2", "phrases", 1)}
          </div>
          <p className={`text-xs text-center -mt-2 mb-8 ${theme === 'dark' ? 'text-white font-bold' : 'text-gray-800 font-semibold'}`}>
            FRASES ESCRITAS COM OS CUBOS DO ABBA ANALÓGICO
          </p>
        </section>

         {/* SECTION: Teoria Alencarina */}
        <section className="mb-10">
          <h2 className={`font-display font-extrabold text-xl sm:text-2xl tracking-tight mb-3 transition-colors duration-300 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Teoria Alencarina
          </h2>
          <div className={`leading-relaxed space-y-4 text-sm sm:text-base transition-colors duration-300 ${
            theme === 'dark' ? 'text-[#cfd5dc]' : 'text-gray-700'
          }`}>
            <p>
              Acreditamos que existe uma relação de equivalência entre os numerais que formam os números e as letras que formam as palavras dentro de cada idioma que usa o alfabeto.
            </p>
            <p>
              Esta relação de equivalência é regida por um fator ainda desconhecido que determina que; a transformação de números em palavras, através da escrita dos números por extenso, representa em escala menor, porém fiel, toda a lógica da organization existente em todas as outras categorias de palavras como, os verbos, substantivos, pronomes, preposições, advérbios e artigos.
            </p>
            <p>
              Isto faz com que a organização das letras dentro das palavras com as quais escrevemos os números por extenso seja representativa fiel da organização das letras dentro das palavras de todas as outras categorias gramaticais.
            </p>

            <p>
              Isso ocorre porque o mesmo fator linguístico que determinou que a palavra numérica <strong>UM</strong> na língua portuguesa tivesse apenas duas letras, que estas letras fossem U e M e, que estas letras estivessem nesta sequência específica, também determina a quantidade, quais e em que ordem tem que estar as letras de todas as outras palavras, de todas as outras categorias gramaticais, não somente na língua portuguesa, mas em todas os idiomas que usam o alfabeto.
            </p>
          </div>
        </section>

        {/* SECTION: Conceito de símbolo linguístico */}
        <section className="mb-10">
          <h2 className={`font-display font-extrabold text-xl sm:text-2xl tracking-tight mb-3 transition-colors duration-300 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Conceito de símbolo linguístico
          </h2>
          <div className={`leading-relaxed space-y-4 text-sm sm:text-base transition-colors duration-300 ${
            theme === 'dark' ? 'text-[#cfd5dc]' : 'text-gray-700'
          }`}>
            <p>
              É a primeira imagem que registramos na memória, antes de conhecermos as palavras que as representam em nosso idioma materno, associada ao objeto ou conceito que originalmente se formou e ficou guardada em nosso cérebro quando começamos a ver, ouvir, perceber e entender o mundo a nossa volta.
            </p>
            <p>
              A palavra portuguesa que representa o símbolo linguístico tem 4 letras, a primeira <strong>C</strong>, depois <strong>A</strong>, depois <strong>S</strong> e por último <strong>A</strong>, formando a palavra <strong>CASA</strong>. Este mesmo símbolo linguístico é descrito na língua inglesa pela palavra de 5 letras <strong>HOUSE</strong> que corresponde a palavra portuguesa CASA. Em inglês a primeira letra da palavra casa é H, depois O, depois U, depois S e por fim E.
            </p>
            <p>
              Este mesmo símbolo linguístico é descrito na língua alemã pela palavra de 4 letras <strong>HAUS</strong> que corresponde a palavra portuguesa CASA e a palavra inglesa HOUSE. Em alemão a primeira letra é H, depois A, depois U, por último S.
            </p>

            <div className={`p-5 rounded-2xl border transition-colors duration-300 ${
              theme === 'dark' 
                ? 'bg-emerald-950/20 border-emerald-900/40 text-[#cfd5dc]' 
                : 'bg-[#FAF9F5] border-[#006837]/15 text-gray-700'
            }`}>
              <span className={`text-xs font-black uppercase tracking-widest block mb-2 ${
                theme === 'dark' ? 'text-emerald-400' : 'text-[#006837]'
              }`}>PREMISSA ABBA</span>
              <p className="italic">
                "Quando o aprendiz faz os exercícios com o ABBA, a mente dele aprende a identificar automaticamente estas duas novas palavras, <strong>HOUSE</strong> e <strong>HAUS</strong>, para descrever este único símbolo linguístico que é <strong>SEMPRE</strong> o mesmo para todas as línguas."
              </p>
            </div>
            <p>
              É importante enfatizar que o símbolo linguístico é sempre o mesmo, não somente para estas três línguas, mas para todas as outras, diferindo apenas nas palavras que o descrevem. Todas as palavras de todas as línguas que usam o alfabeto diferem apenas em três coisas: <strong>1. Quais letras usar para escrever</strong>, <strong>2. Quantas letras usar</strong> e <strong>3. A ordem em que estas letras devem ser dispostas</strong>.
            </p>
          </div>
        </section>

        {/* SECTION: Meta inicial e final */}
        <section className="mb-10">
          <h2 className={`font-display font-extrabold text-xl sm:text-2xl tracking-tight mb-3 transition-colors duration-305 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Metas do Projeto
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className={`p-5 rounded-2xl border transition-colors duration-300 ${
              theme === 'dark' ? 'border-slate-800 bg-slate-900/40' : 'border-gray-150 bg-[#FAF9F5]'
            }`}>
              <span className={`text-xs font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-gray-400'}`}>Meta Inicial</span>
              <p className={`text-sm mt-2 transition-colors duration-306 ${theme === 'dark' ? 'text-[#cfd5dc]' : 'text-gray-700'}`}>
                Guiar o aprendiz para escrever com o auxílio dos cubos os números de <strong>0 a 100 nos três idiomas e na mesma velocidade</strong>, ou seja, que ele consiga escrever no mesmo tempo que leva para escrever em português.
              </p>
            </div>
            <div className={`p-5 rounded-2xl border transition-colors duration-300 ${
              theme === 'dark' ? 'border-sky-900/50 bg-sky-950/20' : 'border-[#005ba4]/20 bg-sky-50/20'
            }`}>
              <span className={`text-xs font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-[#005ba4]'}`}>Meta Final</span>
              <p className={`text-sm mt-2 transition-colors duration-306 ${theme === 'dark' ? 'text-[#cfd5dc]' : 'text-gray-700'}`}>
                Transferir automaticamente as habilidades de leitura e escrita de tempos na língua portuguesa já desenvolvida pelo aluno alfabetizado para os idiomas <strong>inglês e alemão</strong>.
              </p>
            </div>
          </div>

          {/* 1 IMAGEM SOZINHA E CENTRALIZADA: Painel Magnético */}
          <div className="flex flex-col items-center gap-2 text-center font-mono my-8 max-w-4xl mx-auto w-full">
            {renderThumbnail("https://res.cloudinary.com/dudmozd8z/image/upload/v1779565245/painel_k2fqw5.avif", "O Painel Magnético do ABBA", "panel", 0, "aspect-[4/3] md:aspect-video", true)}
            <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-white font-bold' : 'text-gray-800 font-semibold'}`}>
              O PAINEL MAGNÉTICO DO ABBA
            </p>
          </div>
        </section>

        {/* SECTION: Fundamentação lógica */}
        <section className="mb-10">
          <h2 className={`font-display font-extrabold text-xl sm:text-2xl tracking-tight mb-3 transition-colors duration-300 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Fundamentação Lógica
          </h2>
          <div className={`leading-relaxed space-y-4 text-sm sm:text-base transition-colors duration-300 ${
            theme === 'dark' ? 'text-[#cfd5dc]' : 'text-gray-770'
          }`}>
            <p>
              Supomos que tais exercícios empíricos estimulam a formação de <strong>novas conexões sinápticas paralelas</strong> às já existentes entre o símbolo linguístico e a palavra portuguesa usada para descrevê-lo, ligando o mesmo símbolo linguístico às palavras correspondentes nas línguas inglesa e/ou alemã, simplesmente porque este é o caminho mais curto a ser percorrido pelos impulsos elétricos desencadeados no nosso cérebro.
            </p>
          </div>
        </section>

        {/* SECTION: Problema que resolve / Diferencial / vantagem */}
        <section className={`mb-10 p-6 rounded-3xl space-y-6 transition-colors duration-300 ${
          theme === 'dark' 
            ? 'bg-slate-900/40 border border-slate-800' 
            : 'bg-slate-50 border border-slate-150'
        }`}>
          <div>
            <span className={`text-[10px] font-black tracking-widest uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-450'}`}>A DOR</span>
            <h3 className={`font-display font-black text-lg tracking-tight mt-0.5 mb-1.5 ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>Problema que resolve</h3>
            <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-[#cfd5dc]' : 'text-slate-700'}`}>
              O ABBA resolve o problema da ineficácia crônica do ensino de idiomas estrangeiros na escola brasileira.
            </p>
          </div>
          <div className={`border-t pt-5 transition-colors duration-300 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
            <span className={`text-[10px] font-black tracking-widest uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-450'}`}>A ABORDAGEM</span>
            <h3 className={`font-display font-black text-lg tracking-tight mt-0.5 mb-1.5 font-sans ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Diferencial Único</h3>
            <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-[#cfd5dc]' : 'text-slate-700'}`}>
              Divide as habilidades linguísticas em duas etapas dinstintas: <strong>primeiro só LEITURA/ESCRITA</strong> e deixa a FALA/AUDIÇÃO para um momento futuro.
            </p>
          </div>
          <div className={`border-t pt-5 transition-colors duration-300 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
            <span className={`text-[10px] font-black tracking-widest uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-450'}`}>ILUSTRAÇÃO PRÁTICA</span>
            <p className={`text-sm leading-relaxed italic mt-2 pl-4 border-l-2 ${
              theme === 'dark' ? 'text-[#cfd5dc]/80 border-slate-750' : 'text-slate-700 border-slate-350'
            }`}>
              "É como se fizesse um degrau para subir uma calçada alta ou uma ilha de tráfego para atravessar uma rua larga com trânsito nos dois sentidos. Subir um degrau de cada vez é mais fácil e, preocupar-se apenas com um sentido de trânsito de cada vez, reduz a probabilidade de acidente. Assim, concentrar-se apenas na leitura/escrita e livrar-se temporariamente da preocupação com o falar/ouvir, eleva sobremaneira a probabilidade de êxito do aprendiz."
            </p>
          </div>
          <div className={`border-t pt-5 transition-colors duration-300 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
            <span className={`text-[10px] font-black tracking-widest uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-450'}`}>PROPOSTA DE VALOR</span>
            <h3 className={`font-display font-black text-lg tracking-tight mt-0.5 mb-1.5 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Vantagem Competitiva</h3>
            <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-[#cfd5dc]' : 'text-slate-700'}`}>
              Facilita e apressa o aprendizado porque requer menos competência e habilidade no início do processo uma vez que não há necessidade de adaptar o aparelho auditivo para distinguir os novos ou diferentes fonemas do segundo idioma, nem o aparelho fonador para emitir os novos sons requeridos.
            </p>
          </div>
        </section>

        {/* SECTION: Geração do insight */}
        <section className="mb-10">
          <h2 className={`font-display font-extrabold text-xl sm:text-2xl tracking-tight mb-3 transition-colors duration-300 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Como nasceu o projeto (A Geração do Insight)
          </h2>
          <div className={`leading-relaxed space-y-4 text-sm sm:text-base transition-colors duration-300 ${
            theme === 'dark' ? 'text-[#cfd5dc]' : 'text-gray-700'
          }`}>
            <p>
              O insight nasceu da conjunção de fatores cruciais: o fato de falar português como língua materna, ser fluente em inglês e residir em Blumenau (SC) há 40 anos, onde as famílias de origem alemã preservam a língua alemã de sua época de colonização.
            </p>
            <p>
              José Décio trabalhou como tradutor de inglês em feiras industriais em Frankfurt, na Alemanha, onde teve a oportunidade de observar <em>in loco</em> as semelhanças morfológicas, sintáticas e semânticas entre as três línguas. Pesquisando a origem e a história delas, constatou padrões pequenos mas linguisticamente fundamentais que apontam para regras regulares:
            </p>

            <ul className={`list-disc pl-5 space-y-2 mt-4 text-sm sm:text-base transition-colors duration-300 ${
              theme === 'dark' ? 'text-[#cfd5dc]' : 'text-gray-750'
            }`}>
              <li>
                As letras do alfabeto são pronunciadas em alemão assim como em português. Enquanto o inglês fala <strong>A (ei) B (bi) C (ci) D (di)</strong>, o alemão fala <strong>A (a) B (be) C (ce) D (de)</strong>, iguaizinhos à nossa grafia fonética em português.
              </li>
              <li>
                As letras <strong>V e F</strong>, <strong>Z e S</strong>, e <strong>B e P</strong> são sonoramente inversas entre português e alemão. Exemplo: <em>Zusammen</em>, <em>Uplegen</em>, etc.
              </li>
              <li>
                As letras <strong>D</strong> e <strong>TH</strong> realizam esta transição fonética exata entre inglês e alemão. Exemplo: <em>Three</em> se torna <em>Drei</em>, <em>South</em> se torna <em>Süd</em>.
              </li>
            </ul>

            <p className="mt-4">
              Saber que estes padrões são consequências do fato de a língua inglesa resultar da própria integração entre o idioma latim (romano) e o germânico antigo focado das lutas germânicas, atuou como a queda de maçã sob a mente!
            </p>
            <p>
              <em>"Todo este histórico se desenrolou antes de eu ingressar no IFC. De fato, entrei no IFC na esperança de que, como inovador em uma instituição de prestígio que traz o DNA da inovação em seu estatuto, fosse mais fácil obter apoio institucional para concretizar e desenvolver este brilhante projeto."</em>
            </p>
          </div>
        </section>

        {/* 1 IMAGEM SOZINHA E CENTRALIZADA: Camiseta Bordada */}
        <div className="flex flex-col items-center gap-2 text-center font-mono my-8 max-w-4xl mx-auto w-full">
          {renderThumbnail("https://res.cloudinary.com/dudmozd8z/image/upload/v1779565508/habenter_cfxsmy.avif", "A Camiseta Bordada do ABBA", "shirt", 0, "aspect-[4/3] md:aspect-video", true)}
          <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-white font-bold' : 'text-gray-800 font-semibold'}`}>
            A CAMISETA BORDADA DO ABBA
          </p>
        </div>

        {/* Editorial Footer Quote */}
        <div className={`border-t pt-8 mt-12 flex flex-col items-center select-none text-center transition-colors duration-300 ${
          theme === 'dark' ? 'border-slate-800' : 'border-gray-200'
        }`}>
          {/* Custom loadingspinner replacing the heart */}
          <div className="loadingspinner scale-[0.8] origin-center my-1 select-none">
            <div id="square1" />
            <div id="square2" />
            <div id="square3" />
            <div id="square4" />
            <div id="square5" />
          </div>
          <p className={`font-display font-black tracking-wider text-[11px] uppercase mr-0.5 transition-colors duration-300 ${
            theme === 'dark' ? 'text-white' : 'text-gray-500'
          }`}>
            Ábaco Brasileiro de Alfabetização Bilíngue
          </p>
          <p className={`text-xs mt-1 max-w-sm transition-colors duration-300 ${
            theme === 'dark' ? 'text-slate-500' : 'text-gray-400'
          }`}>
            José Décio de Alencar © 2026. Todos os direitos reservados.
          </p>
        </div>
      </article>

      {/* Immersive fluid image gallery overlay */}
      <AnimatePresence>
        {activeGroup !== null && currentGroupItems.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[100] flex flex-col justify-between backdrop-blur-xl p-4 sm:p-6 md:p-8 select-none transition-colors duration-300 ${
              theme === 'dark' ? 'bg-black/95' : 'bg-[#FAF9F5]/95'
            }`}
          >
            {/* Top header controls */}
            <div className="flex items-center justify-between w-full max-w-4xl mx-auto mb-8 sm:mb-10 md:mb-12 shrink-0 px-2 relative h-12">
              <div className="invisible font-mono text-xs sm:text-sm font-bold text-white/50 tracking-widest uppercase">
                {currentGroupItems[activeGroupIndex]?.title}
              </div>

              {/* Fractional counter always absolute centered and in the middle */}
              <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 backdrop-blur-md rounded-full px-4 py-1.5 text-xs font-mono font-bold tracking-widest shadow-inner transition-colors duration-300 ${
                theme === 'dark' ? 'bg-white/10 text-white' : 'bg-black/5 text-black'
              }`}>
                {activeGroupIndex + 1} / {currentGroupItems.length}
              </div>

              {/* Close button with circular hover shape */}
              <button
                onClick={() => setActiveGroup(null)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md ml-auto active:scale-90 ${
                  theme === 'dark' 
                    ? 'bg-white/10 hover:bg-white/15 text-white' 
                    : 'bg-black/5 hover:bg-black/10 text-black'
                }`}
                title="Fechar (Esc)"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Main Stage with elegant navigation arrows */}
            <div className="flex-1 flex flex-col sm:flex-row items-center justify-center max-w-5xl mx-auto w-full relative gap-6 my-auto min-h-0">
              
              {/* Left Arrow Button */}
              {currentGroupItems.length > 1 && (
                <button
                  onClick={() => setActiveGroupIndex(prev => {
                    return prev === 0 ? currentGroupItems.length - 1 : prev - 1;
                  })}
                  className={`hidden sm:flex w-12 h-12 rounded-full items-center justify-center transition-all cursor-pointer shadow-md shrink-0 active:scale-95 ${
                    theme === 'dark' 
                      ? 'bg-white/10 hover:bg-white/15 text-white' 
                      : 'bg-black/5 hover:bg-black/10 text-black'
                  }`}
                  title="Anterior (Seta Esquerda)"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}

              {/* Spacious visual stage with custom motion spring animation */}
              <motion.div 
                key={`${activeGroup}-${activeGroupIndex}`}
                initial={{ opacity: 0, scale: 0.98, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -15 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-5xl flex flex-col gap-6 sm:gap-8 justify-center min-h-0"
              >
                {/* Visual Area - True Custom proportional sizing to prevent any overflow or clipping */}
                <div className={`w-full h-[38vh] sm:h-[48vh] md:h-[52vh] rounded-3xl border overflow-hidden shadow-2xl relative shrink-0 transition-colors duration-300 ${
                  theme === 'dark' ? 'border-white/10' : 'border-black/5'
                }`}>
                  {renderCardVisual(currentGroupItems[activeGroupIndex])}
                </div>

                {/* Elegant White Bold Caption Area - Centered below the image */}
                <div className="text-center max-w-3xl mx-auto px-4 select-text">
                  <p className={`text-sm sm:text-base md:text-lg font-bold tracking-normal leading-relaxed transition-colors duration-300 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {currentGroupItems[activeGroupIndex]?.description}
                  </p>
                </div>
              </motion.div>

              {/* Right Arrow Button */}
              {currentGroupItems.length > 1 && (
                <button
                  onClick={() => setActiveGroupIndex(prev => {
                    return prev === currentGroupItems.length - 1 ? 0 : prev + 1;
                  })}
                  className={`hidden sm:flex w-12 h-12 rounded-full items-center justify-center transition-all cursor-pointer shadow-md shrink-0 active:scale-95 ${
                    theme === 'dark' 
                      ? 'bg-white/10 hover:bg-white/15 text-white' 
                      : 'bg-black/5 hover:bg-black/10 text-black'
                  }`}
                  title="Próxima (Seta Direita)"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}

            </div>

            {/* Bottom Controls for Mobile Arrow Bar */}
            {currentGroupItems.length > 1 && (
              <div className="flex sm:hidden items-center justify-center gap-6 mt-4 mb-2 shrink-0">
                <button
                  onClick={() => setActiveGroupIndex(prev => {
                    return prev === 0 ? currentGroupItems.length - 1 : prev - 1;
                  })}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-90 ${
                    theme === 'dark' 
                      ? 'bg-white/10 hover:bg-white/15 text-white' 
                      : 'bg-black/5 hover:bg-black/10 text-black'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div className={`text-xs font-mono font-bold tracking-widest transition-colors duration-300 ${
                  theme === 'dark' ? 'text-white/45' : 'text-gray-400'
                }`}>
                  NAVEGAR
                </div>

                <button
                  onClick={() => setActiveGroupIndex(prev => {
                    return prev === currentGroupItems.length - 1 ? 0 : prev + 1;
                  })}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-90 ${
                    theme === 'dark' 
                      ? 'bg-white/10 hover:bg-white/15 text-white' 
                      : 'bg-black/5 hover:bg-black/10 text-black'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>

      {/* Pure Fullscreen Image Overlay */}
      <AnimatePresence>
        {fullScreenImage !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[200] flex items-center justify-center backdrop-blur-xl ${
              theme === 'dark' ? 'bg-black/95' : 'bg-white/95'
            }`}
            onClick={() => setFullScreenImage(null)}
          >
            {/* Close Button at top right */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFullScreenImage(null);
              }}
              className={`absolute top-6 right-6 w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-90 z-[210] ${
                theme === 'dark' 
                  ? 'bg-white/10 hover:bg-white/15 text-white' 
                  : 'bg-black/5 hover:bg-black/10 text-black'
              }`}
              title="Fechar Tela Cheia (Esc)"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Natural size image but contained to not exceed viewport */}
            <img 
              src={fullScreenImage} 
              alt="Imagem em Tamanho Original" 
              className="max-w-full max-h-full object-contain cursor-zoom-out select-none"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isFormModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[300] flex items-center justify-center backdrop-blur-xl ${
              theme === 'dark' ? 'bg-black/95' : 'bg-black/40'
            }`}
            onClick={() => setIsFormModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`p-10 rounded-lg shadow-lg relative max-w-2xl w-full max-h-[95vh] m-4 transition-colors duration-300 overflow-hidden overflow-y-auto ${
                theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-black'
              }`}
            >
              <AnimatePresence>
                {isSending && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`absolute inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-md ${
                      theme === 'dark' ? 'bg-slate-900/90' : 'bg-white/90'
                    }`}
                  >
                    <div className="mb-8 scale-75">
                      <Loader />
                    </div>
                    <span className={`text-sm font-semibold tracking-wide animate-pulse ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Encaminhando para o Gmail...</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleContactSubmit}>
                <div className="flex flex-wrap gap-5 items-center w-full max-md:max-w-full mb-10">
                <div className="flex flex-wrap flex-1 shrink gap-5 items-center self-stretch my-auto basis-0 min-w-[240px] max-md:max-w-full">
                  <div className={`flex relative shrink-0 justify-center items-center h-[70px] rounded-[16px] overflow-hidden w-[70px] transition-colors duration-300 ${
                    theme === 'dark' ? 'bg-slate-800' : 'bg-gray-100'
                  }`}>
                    <img 
                      src="https://res.cloudinary.com/dudmozd8z/image/upload/v1779573141/clipboard-image-1779573127_oef0qy.avif" 
                      alt="José Décio de Alencar"
                      className="w-full h-full object-cover object-center" 
                    />
                  </div>
                  <div className="flex flex-col flex-1 shrink self-stretch my-auto basis-4 min-w-[240px] max-md:max-w-full justify-center">
                    <h2 className="text-xl font-bold font-inter tracking-[0] leading-[150%] max-md:max-w-full mb-3">
                      Entrar em contato com o professor Decio por E-mail
                    </h2>
                    <div className="flex flex-col self-stretch min-w-[240px]">
                      <div className={`text-base font-bold transition-colors duration-300 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-800'
                      }`}>José Décio de Alencar</div>
                      <div className={`mt-1 text-sm transition-colors duration-300 ${
                        theme === 'dark' ? 'text-slate-400' : 'text-gray-505'
                      }`}>
                        Professor e Autor, Projeto Brasil Bilíngue
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
                <div className="relative">
                  <input 
                    type="text" 
                    id="floating_first_name" 
                    name="firstName" 
                    value={formValues.firstName}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^a-zA-Z\sÀ-ÿ]/g, '');
                      setFormValues({ ...formValues, firstName: val });
                      if (formErrors.firstName) setFormErrors({ ...formErrors, firstName: undefined });
                      setGmailOffensiveWarned(false);
                    }}
                    className={`block w-full text-sm h-[50px] px-4 bg-transparent rounded-[8px] border appearance-none focus:outline-none focus:ring-1 peer overflow-ellipsis overflow-hidden pr-4 transition-colors duration-300 placeholder-transparent focus:placeholder-gray-400 dark:focus:placeholder-slate-500 ${
                    formErrors.firstName 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500 text-red-500' 
                      : theme === 'dark'
                        ? 'border-slate-700 text-white focus:border-sky-400 focus:ring-sky-400'
                        : 'border-blue-200 text-slate-900 focus:border-[#005ba4] focus:ring-[#005ba4]'
                  }`} placeholder="Digite seu nome aqui" />
                  <label htmlFor="floating_first_name" className={`absolute text-[14px] leading-[150%] duration-300 transform -translate-y-[1.2rem] scale-75 top-2 z-10 origin-[0] px-2 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-[1.2rem] left-2 transition-colors duration-300 ${
                    formErrors.firstName 
                      ? theme === 'dark' ? 'bg-slate-900 text-red-500' : 'bg-white text-red-500'
                      : theme === 'dark'
                        ? 'bg-slate-900 text-slate-400 peer-focus:text-sky-400'
                        : 'bg-white text-gray-500 peer-focus:text-[#005ba4]'
                  }`}>
                    Nome *
                  </label>
                  {formErrors.firstName && (
                    <div className="absolute bottom-full left-0 mb-2.5 z-20">
                      <div className="relative bg-[#FC2020] text-white text-[13.5px] px-4 py-2 rounded shadow-lg whitespace-nowrap font-medium">
                        {formErrors.firstName}
                        <div className="absolute top-full left-4 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[7px] border-t-[#FC2020]"></div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <input 
                    type="text" 
                    id="floating_last_name" 
                    name="lastName" 
                    value={formValues.lastName}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^a-zA-Z\sÀ-ÿ]/g, '');
                      setFormValues({ ...formValues, lastName: val });
                      if (formErrors.lastName) setFormErrors({ ...formErrors, lastName: undefined });
                      setGmailOffensiveWarned(false);
                    }}
                    className={`block w-full text-sm h-[50px] px-4 bg-transparent rounded-[8px] border appearance-none focus:outline-none focus:ring-1 peer overflow-ellipsis overflow-hidden pr-4 transition-colors duration-300 placeholder-transparent focus:placeholder-gray-400 dark:focus:placeholder-slate-500 ${
                    formErrors.lastName 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500 text-red-500' 
                      : theme === 'dark'
                        ? 'border-slate-700 text-white focus:border-sky-400 focus:ring-sky-400'
                        : 'border-blue-200 text-slate-900 focus:border-[#005ba4] focus:ring-[#005ba4]'
                  }`} placeholder="Digite seu sobrenome aqui" />
                  <label htmlFor="floating_last_name" className={`absolute text-[14px] leading-[150%] duration-300 transform -translate-y-[1.2rem] scale-75 top-2 z-10 origin-[0] px-2 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-[1.2rem] left-2 transition-colors duration-300 ${
                    formErrors.lastName 
                      ? theme === 'dark' ? 'bg-slate-900 text-red-500' : 'bg-white text-red-500'
                      : theme === 'dark'
                        ? 'bg-slate-900 text-slate-400 peer-focus:text-sky-400'
                        : 'bg-white text-gray-500 peer-focus:text-[#005ba4]'
                  }`}>
                    Sobrenome *
                  </label>
                  {formErrors.lastName && (
                    <div className="absolute bottom-full left-0 mb-2.5 z-20">
                      <div className="relative bg-[#FC2020] text-white text-[13.5px] px-4 py-2 rounded shadow-lg whitespace-nowrap font-medium">
                        {formErrors.lastName}
                        <div className="absolute top-full left-4 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[7px] border-t-[#FC2020]"></div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <input type="text" id="floating_email" name="email" className={`block w-full text-sm h-[50px] px-4 bg-transparent rounded-[8px] border appearance-none focus:outline-none focus:ring-1 peer overflow-ellipsis overflow-hidden pr-4 transition-colors duration-300 ${
                    theme === 'dark'
                      ? 'border-slate-700 text-slate-400 focus:border-sky-400 focus:ring-sky-400 opacity-60 cursor-not-allowed'
                      : 'border-blue-200 text-slate-500 focus:border-[#005ba4] focus:ring-[#005ba4] disabled:bg-gray-50 cursor-not-allowed'
                  }`} placeholder=" " defaultValue="projetobrasilbilingue@gmail.com" disabled />
                  <label htmlFor="floating_email" className={`absolute text-[14px] leading-[150%] duration-300 transform -translate-y-[1.2rem] scale-75 top-2 z-10 origin-[0] px-2 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-[1.2rem] left-2 transition-colors duration-300 ${
                    theme === 'dark'
                      ? 'bg-slate-900 text-slate-500 peer-focus:text-sky-400'
                      : 'bg-white text-gray-400 peer-focus:text-[#005ba4]'
                  }`}>
                    E-mail
                  </label>
                </div>
                <div className="relative">
                  <input 
                    type="text" 
                    id="floating_phone" 
                    name="phone" 
                    value={formValues.phone}
                    onChange={handlePhoneChange}
                    className={`block w-full text-sm h-[50px] px-4 bg-transparent rounded-[8px] border appearance-none focus:outline-none focus:ring-1 peer overflow-ellipsis overflow-hidden pr-4 transition-colors duration-300 placeholder-transparent focus:placeholder-gray-400 dark:focus:placeholder-slate-500 ${
                    formErrors.phone 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500 text-red-500' 
                      : theme === 'dark'
                        ? 'border-slate-700 text-white focus:border-sky-400 focus:ring-sky-400'
                        : 'border-blue-200 text-slate-900 focus:border-[#005ba4] focus:ring-[#005ba4]'
                  }`} placeholder="Digite seu WhatsApp aqui" />
                  <label htmlFor="floating_phone" className={`absolute text-[14px] leading-[150%] duration-300 transform -translate-y-[1.2rem] scale-75 top-2 z-10 origin-[0] px-2 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-[1.2rem] left-2 transition-colors duration-300 ${
                    formErrors.phone 
                      ? theme === 'dark' ? 'bg-slate-900 text-red-500' : 'bg-white text-red-500'
                      : theme === 'dark'
                        ? 'bg-slate-900 text-slate-400 peer-focus:text-sky-400'
                        : 'bg-white text-gray-500 peer-focus:text-[#005ba4]'
                  }`}>
                    WhatsApp *
                  </label>
                  {formErrors.phone && (
                    <div className="absolute top-full left-0 mt-2 z-20">
                      <div className="relative bg-[#FC2020] text-white text-[13.5px] px-4 py-2 rounded shadow-lg whitespace-nowrap font-medium">
                        {formErrors.phone}
                        <div className="absolute bottom-full left-4 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-b-[7px] border-b-[#FC2020]"></div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="relative sm:col-span-2">
                  <textarea 
                    id="floating_message" 
                    name="message" 
                    value={formValues.message}
                    onChange={(e) => {
                      setFormValues({ ...formValues, message: e.target.value });
                      if (formErrors.message) setFormErrors({ ...formErrors, message: undefined });
                      setGmailOffensiveWarned(false);
                    }}
                    className={`block w-full text-sm min-h-[120px] max-h-[200px] px-4 pt-6 pb-6 bg-transparent rounded-[8px] border appearance-none focus:outline-none focus:ring-1 peer resize-y transition-colors duration-300 placeholder-transparent focus:placeholder-gray-400 dark:focus:placeholder-slate-500 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-gray-400 ${
                    formErrors.message
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500 text-red-500 [&::-webkit-scrollbar-thumb]:bg-red-300'
                      : theme === 'dark'
                        ? 'border-slate-700 text-white focus:border-sky-400 focus:ring-sky-400 [&::-webkit-scrollbar-thumb]:bg-slate-600 hover:[&::-webkit-scrollbar-thumb]:bg-slate-500 [&::-webkit-scrollbar-thumb]:rounded-full'
                        : 'border-blue-200 text-slate-900 focus:border-[#005ba4] focus:ring-[#005ba4] [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400'
                  }`} placeholder="Digite sua mensagem aqui"></textarea>
                  <label htmlFor="floating_message" className={`absolute text-[14px] leading-[150%] duration-300 transform -translate-y-[1.2rem] scale-75 top-2 z-10 origin-[0] px-2 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-6 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-[1.2rem] left-2 transition-colors duration-300 ${
                    formErrors.message
                      ? theme === 'dark' ? 'bg-slate-900 text-red-500' : 'bg-white text-red-500'
                      : theme === 'dark'
                        ? 'bg-slate-900 text-slate-400 peer-focus:text-sky-400'
                        : 'bg-white text-gray-500 peer-focus:text-[#005ba4]'
                  }`}>
                    Mensagem *
                  </label>
                  {formErrors.message && (
                    <div className="absolute top-full left-0 mt-2 z-20">
                      <div className="relative bg-[#FC2020] text-white text-[13.5px] px-4 py-2 rounded shadow-lg font-medium">
                        {formErrors.message}
                        <div className="absolute bottom-full left-4 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-b-[7px] border-b-[#FC2020]"></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row-reverse gap-4">
                <button className={`w-full sm:w-fit rounded-lg text-sm px-6 py-2 h-[50px] font-semibold text-white transition-all shadow-md active:scale-95 ${
                  theme === 'dark'
                    ? 'bg-sky-500 hover:bg-sky-600 focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-900'
                    : 'bg-[#005ba4] hover:bg-[#004a87] focus:ring-2 focus:ring-[#005ba4] focus:ring-offset-2 focus:ring-offset-white'
                }`} type="submit">
                  Enviar
                </button>
                <button type="button" className={`w-full sm:w-fit rounded-lg text-sm px-6 py-2 h-[50px] font-medium border transition-all active:scale-95 ${
                  theme === 'dark'
                    ? 'border-slate-700 text-slate-300 hover:bg-slate-800 focus:ring-2 focus:ring-slate-700 focus:ring-offset-2 focus:ring-offset-slate-900'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-200 focus:ring-offset-2 focus:ring-offset-white'
                }`} onClick={() => setIsFormModalOpen(false)}>
                  Cancelar
                </button>
              </div>
            </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isWhatsappModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[300] flex items-center justify-center backdrop-blur-xl ${
              theme === 'dark' ? 'bg-black/95' : 'bg-black/40'
            }`}
            onClick={() => setIsWhatsappModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`p-10 rounded-lg shadow-lg relative max-w-2xl w-full max-h-[95vh] m-4 transition-colors duration-305 overflow-hidden overflow-y-auto ${
                theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-black'
              }`}
            >
              <AnimatePresence>
                {isSending && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`absolute inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-md ${
                      theme === 'dark' ? 'bg-slate-900/90' : 'bg-white/90'
                    }`}
                  >
                    <div className="mb-8 scale-75">
                      <Loader />
                    </div>
                    <span className={`text-sm font-semibold tracking-wide animate-pulse ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Encaminhando para o WhatsApp...</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleWhatsappSubmit}>
                <div className="flex flex-wrap gap-5 items-center w-full max-md:max-w-full mb-10">
                <div className="flex flex-wrap flex-1 shrink gap-5 items-center self-stretch my-auto basis-0 min-w-[240px] max-md:max-w-full">
                  <div className={`flex relative shrink-0 justify-center items-center h-[70px] rounded-[16px] overflow-hidden w-[70px] transition-colors duration-300 ${
                    theme === 'dark' ? 'bg-slate-800' : 'bg-gray-100'
                  }`}>
                    <img 
                      src="https://res.cloudinary.com/dudmozd8z/image/upload/v1779573141/clipboard-image-1779573127_oef0qy.avif" 
                      alt="José Décio de Alencar"
                      className="w-full h-full object-cover object-center" 
                    />
                  </div>
                  <div className="flex flex-col flex-1 shrink self-stretch my-auto basis-4 min-w-[240px] max-md:max-w-full justify-center">
                    <h2 className="text-xl font-bold font-inter tracking-[0] leading-[150%] max-md:max-w-full mb-3">
                      Entrar em contato com o professor Decio via Whatsapp
                    </h2>
                    <div className="flex flex-col self-stretch min-w-[240px]">
                      <div className={`text-base font-bold transition-colors duration-300 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-800'
                      }`}>José Décio de Alencar</div>
                      <div className={`mt-1 text-sm transition-colors duration-305 ${
                        theme === 'dark' ? 'text-slate-400' : 'text-gray-500'
                      }`}>
                        Professor e Autor, Projeto Brasil Bilíngue
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="relative">
                  <input 
                    type="text" 
                    id="wa_floating_first_name" 
                    name="firstName" 
                    value={whatsappFormValues.firstName}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^a-zA-Z\sÀ-ÿ]/g, '');
                      setWhatsappFormValues(prev => ({ ...prev, firstName: val }));
                      if (whatsappFormErrors.firstName) setWhatsappFormErrors(prev => ({ ...prev, firstName: undefined }));
                      setWhatsappOffensiveWarned(false);
                    }}
                    className={`block w-full text-sm h-[50px] px-4 bg-transparent rounded-[8px] border appearance-none focus:outline-none focus:ring-1 peer placeholder-transparent focus:placeholder-gray-400 dark:focus:placeholder-slate-500 transition-colors duration-300 ${
                    whatsappFormErrors.firstName 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500 text-red-500' 
                      : theme === 'dark'
                        ? 'border-slate-700 text-white focus:border-green-400 focus:ring-green-400'
                        : 'border-green-200 text-slate-900 focus:border-green-600 focus:ring-green-600'
                  }`} placeholder="Digite seu nome aqui" />
                  <label htmlFor="wa_floating_first_name" className={`absolute text-[14px] leading-[150%] duration-300 transform -translate-y-[1.2rem] scale-75 top-2 z-10 origin-[0] px-2 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-[1.2rem] left-2 transition-colors duration-305 ${
                    whatsappFormErrors.firstName 
                      ? theme === 'dark' ? 'bg-slate-900 text-red-500' : 'bg-white text-red-500'
                      : theme === 'dark'
                        ? 'bg-slate-900 text-slate-400 peer-focus:text-green-400'
                        : 'bg-white text-gray-500 peer-focus:text-green-600'
                  }`}>
                    Nome *
                  </label>
                  {whatsappFormErrors.firstName && (
                    <div className="absolute top-full left-0 mt-2 z-20">
                      <div className="relative bg-[#FC2020] text-white text-[13.5px] px-4 py-2 rounded shadow-lg font-medium whitespace-nowrap">
                        {whatsappFormErrors.firstName}
                        <div className="absolute bottom-full left-4 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-b-[7px] border-b-[#FC2020]"></div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <input 
                    type="text" 
                    id="wa_floating_last_name" 
                    name="lastName" 
                    value={whatsappFormValues.lastName}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^a-zA-Z\sÀ-ÿ]/g, '');
                      setWhatsappFormValues(prev => ({ ...prev, lastName: val }));
                      if (whatsappFormErrors.lastName) setWhatsappFormErrors(prev => ({ ...prev, lastName: undefined }));
                      setWhatsappOffensiveWarned(false);
                    }}
                    className={`block w-full text-sm h-[50px] px-4 bg-transparent rounded-[8px] border appearance-none focus:outline-none focus:ring-1 peer placeholder-transparent focus:placeholder-gray-400 dark:focus:placeholder-slate-500 transition-colors duration-300 ${
                    whatsappFormErrors.lastName 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500 text-red-500' 
                      : theme === 'dark'
                        ? 'border-slate-700 text-white focus:border-green-400 focus:ring-green-400'
                        : 'border-green-200 text-slate-900 focus:border-green-600 focus:ring-green-600'
                  }`} placeholder="Digite seu sobrenome aqui" />
                  <label htmlFor="wa_floating_last_name" className={`absolute text-[14px] leading-[150%] duration-300 transform -translate-y-[1.2rem] scale-75 top-2 z-10 origin-[0] px-2 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-[1.2rem] left-2 transition-colors duration-305 ${
                    whatsappFormErrors.lastName 
                      ? theme === 'dark' ? 'bg-slate-900 text-red-500' : 'bg-white text-red-500'
                      : theme === 'dark'
                        ? 'bg-slate-900 text-slate-400 peer-focus:text-green-400'
                        : 'bg-white text-gray-500 peer-focus:text-green-600'
                  }`}>
                    Sobrenome *
                  </label>
                  {whatsappFormErrors.lastName && (
                    <div className="absolute top-full left-0 mt-2 z-20">
                      <div className="relative bg-[#FC2020] text-white text-[13.5px] px-4 py-2 rounded shadow-lg font-medium whitespace-nowrap">
                        {whatsappFormErrors.lastName}
                        <div className="absolute bottom-full left-4 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-b-[7px] border-b-[#FC2020]"></div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="relative sm:col-span-2">
                  <textarea 
                    id="wa_floating_message" 
                    name="message" 
                    value={whatsappFormValues.message}
                    onChange={(e) => {
                      setWhatsappFormValues(prev => ({ ...prev, message: e.target.value }));
                      if (whatsappFormErrors.message) setWhatsappFormErrors(prev => ({ ...prev, message: undefined }));
                      setWhatsappOffensiveWarned(false);
                    }}
                    className={`block w-full min-h-[120px] text-sm py-4 px-4 bg-transparent rounded-[8px] border appearance-none focus:outline-none focus:ring-1 peer placeholder-transparent focus:placeholder-gray-400 dark:focus:placeholder-slate-500 transition-colors duration-300 resize-y max-h-[300px] ${
                    whatsappFormErrors.message 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500 text-red-500' 
                      : theme === 'dark'
                        ? 'border-slate-700 text-white focus:border-green-400 focus:ring-green-400'
                        : 'border-green-200 text-slate-900 focus:border-green-600 focus:ring-green-600'
                  }`} placeholder="Digite sua mensagem aqui"></textarea>
                  <label htmlFor="wa_floating_message" className={`absolute text-[14px] leading-[150%] duration-300 transform -translate-y-[1.2rem] scale-75 top-2 z-10 origin-[0] px-2 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-6 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-[1.2rem] left-2 transition-colors duration-300 ${
                    whatsappFormErrors.message
                      ? theme === 'dark' ? 'bg-slate-900 text-red-500' : 'bg-white text-red-500'
                      : theme === 'dark'
                        ? 'bg-slate-900 text-slate-400 peer-focus:text-green-400'
                        : 'bg-white text-gray-500 peer-focus:text-green-600'
                  }`}>
                    Mensagem *
                  </label>
                  {whatsappFormErrors.message && (
                    <div className="absolute top-full left-0 mt-2 z-20">
                      <div className="relative bg-[#FC2020] text-white text-[13.5px] px-4 py-2 rounded shadow-lg font-medium">
                        {whatsappFormErrors.message}
                        <div className="absolute bottom-full left-4 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-b-[7px] border-b-[#FC2020]"></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row-reverse gap-4">
                <button className={`w-full sm:w-fit rounded-lg text-sm px-6 py-2 h-[50px] font-semibold text-white transition-all shadow-md active:scale-95 ${
                  theme === 'dark'
                    ? 'bg-[#25D366] hover:bg-[#1ebd5a] focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2 focus:ring-offset-slate-900'
                    : 'bg-[#25D366] hover:bg-[#1ebd5a] focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2 focus:ring-offset-white'
                }`} type="submit">
                  Enviar
                </button>
                <button type="button" className={`w-full sm:w-fit rounded-lg text-sm px-6 py-2 h-[50px] font-medium border transition-all active:scale-95 ${
                  theme === 'dark'
                    ? 'border-slate-700 text-slate-300 hover:bg-slate-800 focus:ring-2 focus:ring-slate-700 focus:ring-offset-2 focus:ring-offset-slate-900'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-200 focus:ring-offset-2 focus:ring-offset-white'
                }`} onClick={() => setIsWhatsappModalOpen(false)}>
                  Cancelar
                </button>
              </div>
            </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* RESPECT AND LEGAL WARNING MODAL */}
      <AnimatePresence>
        {isRespectModalOpen && (
          <motion.div
            key="respect-warning-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[11000] flex items-center justify-center p-4 backdrop-blur-xl ${
              theme === 'dark' ? 'bg-black/85' : 'bg-black/50'
            }`}
            onClick={() => setIsRespectModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className={`p-8 rounded-2xl shadow-2xl relative max-w-lg w-full max-h-[90vh] overflow-y-auto border transition-colors duration-300 ${
                theme === 'dark' 
                  ? 'bg-slate-900 border-red-500/30 text-white shadow-red-950/20' 
                  : 'bg-white border-red-200 text-slate-900 shadow-slate-200'
              }`}
            >
              {/* Alert Header Icon */}
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-xl">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold font-inter tracking-tight text-red-600 dark:text-red-400">
                    Aviso de Respeito e Cidadania
                  </h3>
                  <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    Internet não é terra sem leis
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-[14.5px] leading-relaxed font-sans">
                <p className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>
                  Detectamos termos ofensivos ou inadequados nos campos digitados. A empatia, a ética e o respeito mútuo são fundamentais para uma convivência harmônica em nossa sociedade.
                </p>

                <div className={`p-4 rounded-xl border ${
                  theme === 'dark' 
                    ? 'bg-slate-950/50 border-slate-800' 
                    : 'bg-slate-50 border-slate-100'
                }`}>
                  <h4 className="font-bold text-sm mb-2 uppercase tracking-wider text-red-500 flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-red-500"></span>
                    Crimes Virtuais de Ofensa
                  </h4>
                  <p className={`text-[13px] leading-normal ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} mb-3`}>
                    No Brasil, injúrias, calúnias ou difamações proferidas por meios eletrônicos (redes sociais, formulários, e-mails) constituem infrações de alta gravidade enquadradas no <strong>Código Penal Brasileiro</strong>:
                  </p>
                  <ul className="space-y-2.5 text-[13px] list-none pl-0">
                    <li className="flex gap-2">
                      <span className="text-red-500 font-bold">•</span>
                      <span><strong>Injúria (Art. 140)</strong>: Ofender a dignidade ou o decoro de outrem. Pena aumentada caso utilize elementos discriminatórios.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-red-500 font-bold">•</span>
                      <span><strong>Difamação (Art. 139)</strong>: Difamar a reputação alheia imputando-lhe fato ofensivo à sua reputação.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-red-500 font-bold">•</span>
                      <span><strong>Calúnia (Art. 138)</strong>: Afirmar falsamente que alguém cometeu um ato criminoso.</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-2">
                  <p className={`text-xs font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} mb-2`}>
                    Consulte a legislação oficial sobre Crimes Contra a Honra diretamente no site do Planalto:
                  </p>
                  <a
                    href="https://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-bold text-sky-500 hover:text-sky-400 hover:underline transition-colors"
                  >
                    <span>Decreto-Lei nº 2.848 (Código Penal Brasileiro)</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Close Button */}
              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsRespectModalOpen(false)}
                  className="w-full py-3 px-6 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-500 active:scale-98 transition-all shadow-md shadow-red-600/10 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                >
                  Entendi e me comprometo a respeitar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};


