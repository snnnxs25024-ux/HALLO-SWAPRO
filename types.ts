// Fix: Add ADMIN role.
export enum UserRole {
  PIC = 'PIC',
  ADMIN = 'ADMIN',
  KARYAWAN = 'Karyawan',
  CLIENT = 'Client',
}

export enum EmployeeStatus {
  ACTIVE = 'Active',
  RESIGNED = 'Resigned',
  TERMINATED = 'Terminated'
}

export type EducationLevel = 'SMA/SMK' | 'D3' | 'S1' | 'S2' | 'S3' | 'Lainnya';

export const EDUCATION_LEVELS: EducationLevel[] = ['SMA/SMK', 'D3', 'S1', 'S2', 'S3', 'Lainnya'];


export interface User {
  id: string;
  nama: string;
  role: UserRole;
  avatar?: string;
  clientId?: string; // For client users
  password?: string; // For client users
}

export interface Client {
  id: string;
  name: string;
}

export interface Employee {
  id: string; // NIK Karyawan
  swaproId: string; // NIK SWAPRO
  fullName: string;
  ktpId: string;
  whatsapp: string;
  clientId: string;
  position: string;
  branch: string;
  joinDate: string; // ISO string date
  endDate?: string; // ISO string date for EOC
  resignDate?: string; // ISO string date
  bankAccount: {
    number: string;
    holderName: string;
    bankName: string;
  };
  bpjs: {
    ketenagakerjaan: string;
    kesehatan: string;
  };
  npwp: string;
  gender: 'Laki-laki' | 'Perempuan';
  birthDate?: string; // ISO string date
  lastEducation?: EducationLevel;
  contractNumber: number;
  disciplinaryActions: string; // Changed to a single string for simplicity in form
  status: EmployeeStatus;
  profilePhotoUrl?: string;
  documents: {
    pkwtNewHire?: string;
    pkwtExtension?: string;
    spLetter?: string;
  };
}

// Fix: Add DataStatus enum for discussion entries.
export enum DataStatus {
    BARU = 'Baru',
    PROSES = 'Proses',
    PENDING = 'Pending',
    SELESAI = 'Selesai'
}

// Fix: Add DataEntry interface for discussion entries.
export interface DataEntry {
    id: string;
    judul: string;
    deskripsi: string;
    userId: string;
    status: DataStatus;
    createdAt: string; // ISO string
}

export interface Message {
  id: string;
  senderId: string; // 'admin' or user.id
  text: string;
  timestamp: string; // ISO string
  imageUrl?: string;
}

export interface Chat {
  messages: Message[];
  isTyping?: boolean;
}

export interface Payslip {
    id: string; // e.g., "K001-2024-07"
    employeeId: string;
    period: string; // YYYY-MM
    fileUrl: string; // data:application/pdf;base64,...
}

export interface AppState {
  currentUser: User | null;
  employees: Employee[];
  clients: Client[];
  employeeChats: Record<string, Chat>;
  payslips: Payslip[];
}
