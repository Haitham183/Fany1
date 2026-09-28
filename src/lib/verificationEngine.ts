import { Student } from '@/types';

/**
 * دالة توليد عشوائي محددة ببذرة (Seeded PRNG)
 */
export const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

export interface VerificationSampleParams {
  students: Student[];
  sampleRate?: number; // 0.10 to 0.25 (or percentage 10 to 25)
  samplePercentage?: number;
  verifierType?: 'internal' | 'external';
  verifierName?: string;
  unitId?: string;
  departmentId?: string;
  gradeLevel?: number;
  customSeed?: string | number;
}

export interface VerificationSampleResult {
  sampledStudents: Student[];
  sampleStudents: Student[];
  sampleStudentIds: string[];
  sampleStudentNames: string[];
  seed: number;
  seedString: string;
  samplePercentage: number;
}

export function generateReproducibleSample<T>(items: T[], count: number, seed: number): T[] {
  if (items.length === 0 || count <= 0) return [];
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i * 31) * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(count, items.length));
}

export const generateVerificationSample = (
  paramsOrStudents: VerificationSampleParams | Student[],
  samplePercentageArg: number = 15,
  customSeedArg?: string | number
): VerificationSampleResult => {
  let students: Student[] = [];
  let samplePercentage = 15;
  let customSeed: string | number | undefined;

  if (Array.isArray(paramsOrStudents)) {
    students = paramsOrStudents;
    samplePercentage = samplePercentageArg;
    customSeed = customSeedArg;
  } else {
    students = paramsOrStudents.students || [];
    samplePercentage = paramsOrStudents.samplePercentage ?? (paramsOrStudents.sampleRate ? paramsOrStudents.sampleRate * 100 : 15);
    customSeed = paramsOrStudents.customSeed;
    if (!customSeed && paramsOrStudents.unitId && paramsOrStudents.verifierName) {
      customSeed = `${paramsOrStudents.unitId}_${paramsOrStudents.verifierName}_${paramsOrStudents.verifierType || 'iv'}`;
    }
  }

  if (students.length === 0) {
    return {
      sampledStudents: [],
      sampleStudents: [],
      sampleStudentIds: [],
      sampleStudentNames: [],
      seed: 0,
      seedString: 'seed_0',
      samplePercentage,
    };
  }

  let numericSeed = 0;
  let seedString = '';
  if (typeof customSeed === 'number') {
    numericSeed = customSeed;
    seedString = String(customSeed);
  } else if (typeof customSeed === 'string' && customSeed.length > 0) {
    seedString = customSeed;
    for (let i = 0; i < customSeed.length; i++) {
      numericSeed = (numericSeed << 5) - numericSeed + customSeed.charCodeAt(i);
      numericSeed |= 0;
    }
    numericSeed = Math.abs(numericSeed);
  } else {
    numericSeed = Math.floor(Date.now() % 10000000);
    seedString = `seed_${numericSeed}`;
  }

  const targetCount = Math.max(1, Math.ceil((students.length * samplePercentage) / 100));
  const sampledStudents = generateReproducibleSample(students, targetCount, numericSeed);

  return {
    sampledStudents,
    sampleStudents: sampledStudents,
    sampleStudentIds: sampledStudents.map((s) => s.id),
    sampleStudentNames: sampledStudents.map((s) => s.fullName),
    seed: numericSeed,
    seedString,
    samplePercentage,
  };
};
