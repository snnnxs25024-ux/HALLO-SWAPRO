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

export interface ContractDocument {
  id: string; // unique id for the document, e.g., uuid
  name: string; // e.g., "PKWT Perpanjangan 2"
  startDate: string; // ISO string date
  endDate: string; // ISO string date
  fileUrl: string;
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
    spLetter?: string;
    contractHistory?: ContractDocument[];
  };
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
    fileUrl: string;
}

// --- NEW TYPES FOR DOCUMENT REQUEST SYSTEM ---

export enum DocumentRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export enum DocumentType {
  PAYSLIP = 'PAYSLIP',
  PKWT_NEW = 'PKWT_NEW',
  PKWT_HISTORY = 'PKWT_HISTORY',
  SP_LETTER = 'SP_LETTER',
}

export interface DocumentRequest {
  id: string; // uuid
  employeeId: string;
  documentType: DocumentType;
  documentIdentifier: string; // e.g., payslip period "2024-07" or contract ID
  documentName: string; // e.g., "Slip Gaji Juli 2024" or "PKWT Perpanjangan 2"
  status: DocumentRequestStatus;
  requestTimestamp: string; // ISO string
  responseTimestamp?: string; // ISO string
  rejectionReason?: string;
  accessExpiresAt?: string; // ISO string
  picId?: string; // ID of the PIC who responded
}

// FIX: Add missing types for Discussion page
export enum DataStatus {
  BARU = 'BARU',
  PROSES = 'PROSES',
  PENDING = 'PENDING',
  SELESAI = 'SELESAI',
}

export interface DataEntry {
  id: string;
  judul: string;
  deskripsi: string;
  userId: string;
  status: DataStatus;
  createdAt: string; // ISO string
}


export interface AppState {
  currentUser: User | null;
  employees: Employee[];
  clients: Client[];
  employeeChats: Record<string, Chat>;
  payslips: Payslip[];
  documentRequests: DocumentRequest[];
  // FIX: Add dataEntries for Discussion page state
  dataEntries?: DataEntry[];
}