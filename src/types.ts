export interface LetterCubeData {
  id: string;
  primaryLetter: string;
  primaryOrdinal: string;
  isSplit?: boolean;
  secondaryLetter?: string;
  secondaryOrdinal?: string;
}

export interface SpelledLetter {
  id: string; // Unique transient ID for instances on the board
  letter: string; // The specific letter (e.g. 'C' or 'Ç' or 'V' or 'W')
  originCubeId: string;
  originalOrdinal?: string; // Optional permanent original ordinal from source cube
  color?: string; // Stored color of wire and letter (specific instance)
}

export interface SavedWord {
  word: string;
  letters: SpelledLetter[];
  themeColor?: string;
}

export interface PresetWord {
  word: string; // In uppercase, e.g., "DADO"
  hint: string; // Small explanation/hint
  category: string; // e.g., "Animais", "Objetos", "Natureza"
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
  iconType: 'dice' | 'car' | 'star' | 'sun' | 'cat' | 'book' | 'fruit' | 'crown';
}

export interface User {
  name: string;
  email: string;
  role: 'student' | 'teacher';
  img?: string;
  codeSession?: {
    code: string;
    expiresAt: number;
    codeId: string;
  };
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'active' | 'draft' | 'completed';
  targetWords: { word: string; language: 'pt' | 'en' | 'de'; color: string }[];
  submissionsCount?: number;
  startDate?: string;
  teacherNote?: string;
  priority?: 'Alta' | 'Média' | 'Baixa';
  assignedStudentIds?: string[];
  supportFiles?: { name: string; url: string; size: string }[];
}

export interface StudentSubmission {
  id: string;
  studentName: string;
  studentEmail?: string;
  taskTitle: string;
  submittedAt: string;
  spelledWords: SavedWord[];
  reviewed?: boolean;
  taskFiles?: { name: string; url?: string; size?: string }[];
}

export interface AccessCode {
  id: string;
  code: string;
  studentName: string;
  expiresAt: number;
  durationLabel: string;
  status: 'active' | 'expired';
}

