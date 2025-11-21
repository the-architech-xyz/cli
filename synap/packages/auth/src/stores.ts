/**
 * Auth Feature Stores - Zustand State Management
 * 
 * This file contains all Zustand stores for the Auth feature.
 * These stores provide consistent state management patterns across all implementations.
 * 
 * Generated from: features/auth/contract.ts
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import type {
  User,
  Session,
  ConnectedAccount,
  Organization,
  Team,
  Invitation,
  AuthStatus,
  OAuthProvider,
  SessionStatus
} from './types';

// ============================================================================
// AUTH STORE - Primary Authentication State
// ============================================================================

interface AuthState {
  // Core Auth Data
  currentUser: User | null;
  session: Session | null;
  status: AuthStatus;
  
  // Multi-tenancy Context
  activeOrganization: Organization | null;
  activeTeam: Team | null;
  organizations: Organization[];
  teams: Team[];
  
  // UI State
  isAuthModalOpen: boolean;
  authModalView: 'login' | 'signup' | 'forgot-password' | 'reset-password' | 'verify-email' | 'two-factor';
  isSessionLoading: boolean;
  authError: string | null;
  
  // Actions - Session Management
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setStatus: (status: AuthStatus) => void;
  setSessionLoading: (isLoading: boolean) => void;
  setAuthError: (error: string | null) => void;
  clearAuth: () => void;
  
  // Actions - Multi-tenancy
  setActiveOrganization: (org: Organization | null) => void;
  setActiveTeam: (team: Team | null) => void;
  setOrganizations: (orgs: Organization[]) => void;
  setTeams: (teams: Team[]) => void;
  addOrganization: (org: Organization) => void;
  addTeam: (team: Team) => void;
  removeOrganization: (orgId: string) => void;
  removeTeam: (teamId: string) => void;
  
  // Actions - UI State
  setAuthModalOpen: (isOpen: boolean) => void;
  setAuthModalView: (view: AuthState['authModalView']) => void;
  openLoginModal: () => void;
  openSignupModal: () => void;
  closeAuthModal: () => void;
  
  // Computed Values
  isAuthenticated: () => boolean;
  isLoading: () => boolean;
  hasOrganizations: () => boolean;
  hasTeams: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      currentUser: null,
      session: null,
      status: 'loading',
      activeOrganization: null,
      activeTeam: null,
      organizations: [],
      teams: [],
      isAuthModalOpen: false,
      authModalView: 'login',
      isSessionLoading: false,
      authError: null,
      
      // Session Management Actions
      setUser: (user) => set((state) => {
        state.currentUser = user;
        if (user) {
          state.status = 'authenticated';
          state.authError = null;
        } else {
          state.status = 'unauthenticated';
        }
      }),
      
      setSession: (session) => set((state) => {
        state.session = session;
      }),
      
      setStatus: (status) => set((state) => {
        state.status = status;
      }),
      
      setSessionLoading: (isLoading) => set((state) => {
        state.isSessionLoading = isLoading;
      }),
      
      setAuthError: (error) => set((state) => {
        state.authError = error;
        if (error) {
          state.status = 'error';
        }
      }),
      
      clearAuth: () => set((state) => {
        state.currentUser = null;
        state.session = null;
        state.status = 'unauthenticated';
        state.activeOrganization = null;
        state.activeTeam = null;
        state.organizations = [];
        state.teams = [];
        state.authError = null;
      }),
      
      // Multi-tenancy Actions
      setActiveOrganization: (org) => set((state) => {
        state.activeOrganization = org;
        // Clear active team if it doesn't belong to this org
        if (org && state.activeTeam?.organizationId !== org.id) {
          state.activeTeam = null;
        }
      }),
      
      setActiveTeam: (team) => set((state) => {
        state.activeTeam = team;
      }),
      
      setOrganizations: (orgs) => set((state) => {
        state.organizations = orgs;
      }),
      
      setTeams: (teams) => set((state) => {
        state.teams = teams;
      }),
      
      addOrganization: (org) => set((state) => {
        state.organizations.push(org);
      }),
      
      addTeam: (team) => set((state) => {
        state.teams.push(team);
      }),
      
      removeOrganization: (orgId) => set((state) => {
        state.organizations = state.organizations.filter(org => org.id !== orgId);
        if (state.activeOrganization?.id === orgId) {
          state.activeOrganization = null;
          state.activeTeam = null;
        }
      }),
      
      removeTeam: (teamId) => set((state) => {
        state.teams = state.teams.filter(team => team.id !== teamId);
        if (state.activeTeam?.id === teamId) {
          state.activeTeam = null;
        }
      }),
      
      // UI State Actions
      setAuthModalOpen: (isOpen) => set((state) => {
        state.isAuthModalOpen = isOpen;
      }),
      
      setAuthModalView: (view) => set((state) => {
        state.authModalView = view;
      }),
      
      openLoginModal: () => set((state) => {
        state.isAuthModalOpen = true;
        state.authModalView = 'login';
      }),
      
      openSignupModal: () => set((state) => {
        state.isAuthModalOpen = true;
        state.authModalView = 'signup';
      }),
      
      closeAuthModal: () => set((state) => {
        state.isAuthModalOpen = false;
        state.authError = null;
      }),
      
      // Computed Values
      isAuthenticated: () => {
        const state = get();
        return state.status === 'authenticated' && state.currentUser !== null;
      },
      
      isLoading: () => {
        const state = get();
        return state.status === 'loading' || state.isSessionLoading;
      },
      
      hasOrganizations: () => {
        const state = get();
        return state.organizations.length > 0;
      },
      
      hasTeams: () => {
        const state = get();
        return state.teams.length > 0;
      },
    })),
    {
      name: 'auth-storage',
      // Only persist essential data
      partialize: (state) => ({
        currentUser: state.currentUser,
        activeOrganization: state.activeOrganization,
        activeTeam: state.activeTeam,
      }),
    }
  )
);

// ============================================================================
// CONNECTED ACCOUNTS STORE
// ============================================================================

interface ConnectedAccountsState {
  // Data
  accounts: ConnectedAccount[];
  
  // UI State
  isAccountsLoading: boolean;
  accountsError: string | null;
  isConnectingProvider: OAuthProvider | null;
  
  // Actions
  setAccounts: (accounts: ConnectedAccount[]) => void;
  addAccount: (account: ConnectedAccount) => void;
  removeAccount: (accountId: string) => void;
  setAccountsLoading: (isLoading: boolean) => void;
  setAccountsError: (error: string | null) => void;
  setConnectingProvider: (provider: OAuthProvider | null) => void;
  clearAccounts: () => void;
  
  // Computed
  getAccountByProvider: (provider: OAuthProvider) => ConnectedAccount | undefined;
  isProviderConnected: (provider: OAuthProvider) => boolean;
  getConnectedProviders: () => OAuthProvider[];
}

export const useConnectedAccountsStore = create<ConnectedAccountsState>()(
  immer((set, get) => ({
    // Initial state
    accounts: [],
    isAccountsLoading: false,
    accountsError: null,
    isConnectingProvider: null,
    
    // Actions
    setAccounts: (accounts) => set((state) => {
      state.accounts = accounts;
    }),
    
    addAccount: (account) => set((state) => {
      state.accounts.push(account);
    }),
    
    removeAccount: (accountId) => set((state) => {
      state.accounts = state.accounts.filter(acc => acc.id !== accountId);
    }),
    
    setAccountsLoading: (isLoading) => set((state) => {
      state.isAccountsLoading = isLoading;
    }),
    
    setAccountsError: (error) => set((state) => {
      state.accountsError = error;
    }),
    
    setConnectingProvider: (provider) => set((state) => {
      state.isConnectingProvider = provider;
    }),
    
    clearAccounts: () => set((state) => {
      state.accounts = [];
      state.accountsError = null;
    }),
    
    // Computed
    getAccountByProvider: (provider) => {
      const state = get();
      return state.accounts.find(acc => acc.provider === provider);
    },
    
    isProviderConnected: (provider) => {
      const state = get();
      return state.accounts.some(acc => acc.provider === provider);
    },
    
    getConnectedProviders: () => {
      const state = get();
      return state.accounts.map(acc => acc.provider);
    },
  }))
);

// ============================================================================
// TWO-FACTOR AUTHENTICATION STORE
// ============================================================================

interface TwoFactorState {
  // Data
  isEnabled: boolean;
  backupCodesCount: number;
  
  // UI State
  isSetupModalOpen: boolean;
  isVerifyModalOpen: boolean;
  setupStep: 'qr-code' | 'verify' | 'backup-codes' | 'complete';
  qrCodeUrl: string | null;
  secret: string | null;
  backupCodes: string[] | null;
  isSetupLoading: boolean;
  isVerifying: boolean;
  setupError: string | null;
  verifyError: string | null;
  
  // Actions
  setEnabled: (isEnabled: boolean) => void;
  setBackupCodesCount: (count: number) => void;
  setSetupModalOpen: (isOpen: boolean) => void;
  setVerifyModalOpen: (isOpen: boolean) => void;
  setSetupStep: (step: TwoFactorState['setupStep']) => void;
  setQrCode: (qrCodeUrl: string, secret: string) => void;
  setBackupCodes: (codes: string[]) => void;
  setSetupLoading: (isLoading: boolean) => void;
  setVerifying: (isVerifying: boolean) => void;
  setSetupError: (error: string | null) => void;
  setVerifyError: (error: string | null) => void;
  clearSetupData: () => void;
  resetTwoFactorState: () => void;
}

export const useTwoFactorStore = create<TwoFactorState>()(
  immer((set) => ({
    // Initial state
    isEnabled: false,
    backupCodesCount: 0,
    isSetupModalOpen: false,
    isVerifyModalOpen: false,
    setupStep: 'qr-code',
    qrCodeUrl: null,
    secret: null,
    backupCodes: null,
    isSetupLoading: false,
    isVerifying: false,
    setupError: null,
    verifyError: null,
    
    // Actions
    setEnabled: (isEnabled) => set((state) => {
      state.isEnabled = isEnabled;
    }),
    
    setBackupCodesCount: (count) => set((state) => {
      state.backupCodesCount = count;
    }),
    
    setSetupModalOpen: (isOpen) => set((state) => {
      state.isSetupModalOpen = isOpen;
      if (!isOpen) {
        state.setupStep = 'qr-code';
        state.setupError = null;
      }
    }),
    
    setVerifyModalOpen: (isOpen) => set((state) => {
      state.isVerifyModalOpen = isOpen;
      if (!isOpen) {
        state.verifyError = null;
      }
    }),
    
    setSetupStep: (step) => set((state) => {
      state.setupStep = step;
    }),
    
    setQrCode: (qrCodeUrl, secret) => set((state) => {
      state.qrCodeUrl = qrCodeUrl;
      state.secret = secret;
    }),
    
    setBackupCodes: (codes) => set((state) => {
      state.backupCodes = codes;
      state.backupCodesCount = codes.length;
    }),
    
    setSetupLoading: (isLoading) => set((state) => {
      state.isSetupLoading = isLoading;
    }),
    
    setVerifying: (isVerifying) => set((state) => {
      state.isVerifying = isVerifying;
    }),
    
    setSetupError: (error) => set((state) => {
      state.setupError = error;
    }),
    
    setVerifyError: (error) => set((state) => {
      state.verifyError = error;
    }),
    
    clearSetupData: () => set((state) => {
      state.qrCodeUrl = null;
      state.secret = null;
      state.backupCodes = null;
      state.setupError = null;
      state.setupStep = 'qr-code';
    }),
    
    resetTwoFactorState: () => set((state) => {
      state.isEnabled = false;
      state.backupCodesCount = 0;
      state.isSetupModalOpen = false;
      state.isVerifyModalOpen = false;
      state.qrCodeUrl = null;
      state.secret = null;
      state.backupCodes = null;
      state.isSetupLoading = false;
      state.isVerifying = false;
      state.setupError = null;
      state.verifyError = null;
      state.setupStep = 'qr-code';
    }),
  }))
);

// ============================================================================
// PASSWORD RESET STORE
// ============================================================================

interface PasswordResetState {
  // UI State
  isResetModalOpen: boolean;
  resetStep: 'request' | 'code-sent' | 'new-password' | 'complete';
  email: string | null;
  resetToken: string | null;
  isRequestingReset: boolean;
  isResettingPassword: boolean;
  requestError: string | null;
  resetError: string | null;
  
  // Actions
  setResetModalOpen: (isOpen: boolean) => void;
  setResetStep: (step: PasswordResetState['resetStep']) => void;
  setEmail: (email: string) => void;
  setResetToken: (token: string) => void;
  setRequestingReset: (isRequesting: boolean) => void;
  setResettingPassword: (isResetting: boolean) => void;
  setRequestError: (error: string | null) => void;
  setResetError: (error: string | null) => void;
  clearResetData: () => void;
  resetPasswordResetState: () => void;
}

export const usePasswordResetStore = create<PasswordResetState>()(
  immer((set) => ({
    // Initial state
    isResetModalOpen: false,
    resetStep: 'request',
    email: null,
    resetToken: null,
    isRequestingReset: false,
    isResettingPassword: false,
    requestError: null,
    resetError: null,
    
    // Actions
    setResetModalOpen: (isOpen) => set((state) => {
      state.isResetModalOpen = isOpen;
      if (!isOpen) {
        state.resetStep = 'request';
        state.requestError = null;
        state.resetError = null;
      }
    }),
    
    setResetStep: (step) => set((state) => {
      state.resetStep = step;
    }),
    
    setEmail: (email) => set((state) => {
      state.email = email;
    }),
    
    setResetToken: (token) => set((state) => {
      state.resetToken = token;
    }),
    
    setRequestingReset: (isRequesting) => set((state) => {
      state.isRequestingReset = isRequesting;
    }),
    
    setResettingPassword: (isResetting) => set((state) => {
      state.isResettingPassword = isResetting;
    }),
    
    setRequestError: (error) => set((state) => {
      state.requestError = error;
    }),
    
    setResetError: (error) => set((state) => {
      state.resetError = error;
    }),
    
    clearResetData: () => set((state) => {
      state.email = null;
      state.resetToken = null;
      state.requestError = null;
      state.resetError = null;
    }),
    
    resetPasswordResetState: () => set((state) => {
      state.isResetModalOpen = false;
      state.resetStep = 'request';
      state.email = null;
      state.resetToken = null;
      state.isRequestingReset = false;
      state.isResettingPassword = false;
      state.requestError = null;
      state.resetError = null;
    }),
  }))
);

// ============================================================================
// EMAIL VERIFICATION STORE
// ============================================================================

interface EmailVerificationState {
  // Data
  isVerified: boolean;
  verificationEmail: string | null;
  
  // UI State
  isVerificationModalOpen: boolean;
  isVerifying: boolean;
  isSendingVerification: boolean;
  verificationError: string | null;
  verificationSuccess: boolean;
  
  // Actions
  setVerified: (isVerified: boolean) => void;
  setVerificationEmail: (email: string | null) => void;
  setVerificationModalOpen: (isOpen: boolean) => void;
  setVerifying: (isVerifying: boolean) => void;
  setSendingVerification: (isSending: boolean) => void;
  setVerificationError: (error: string | null) => void;
  setVerificationSuccess: (success: boolean) => void;
  clearVerificationData: () => void;
  resetEmailVerificationState: () => void;
}

export const useEmailVerificationStore = create<EmailVerificationState>()(
  immer((set) => ({
    // Initial state
    isVerified: false,
    verificationEmail: null,
    isVerificationModalOpen: false,
    isVerifying: false,
    isSendingVerification: false,
    verificationError: null,
    verificationSuccess: false,
    
    // Actions
    setVerified: (isVerified) => set((state) => {
      state.isVerified = isVerified;
    }),
    
    setVerificationEmail: (email) => set((state) => {
      state.verificationEmail = email;
    }),
    
    setVerificationModalOpen: (isOpen) => set((state) => {
      state.isVerificationModalOpen = isOpen;
      if (!isOpen) {
        state.verificationError = null;
        state.verificationSuccess = false;
      }
    }),
    
    setVerifying: (isVerifying) => set((state) => {
      state.isVerifying = isVerifying;
    }),
    
    setSendingVerification: (isSending) => set((state) => {
      state.isSendingVerification = isSending;
    }),
    
    setVerificationError: (error) => set((state) => {
      state.verificationError = error;
    }),
    
    setVerificationSuccess: (success) => set((state) => {
      state.verificationSuccess = success;
    }),
    
    clearVerificationData: () => set((state) => {
      state.verificationError = null;
      state.verificationSuccess = false;
    }),
    
    resetEmailVerificationState: () => set((state) => {
      state.isVerified = false;
      state.verificationEmail = null;
      state.isVerificationModalOpen = false;
      state.isVerifying = false;
      state.isSendingVerification = false;
      state.verificationError = null;
      state.verificationSuccess = false;
    }),
  }))
);

