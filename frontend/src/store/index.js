import { create } from 'zustand';
import { authService } from '../api';

/**
 * Auth Store - FIXED VERSION
 */
export const useAuthStore = create((set) => ({
  user: null,
  currentRound: 'mcq',
  progress: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // 🔥 LOGIN (FIXED)
  login: async (email, password) => {
    set({ isLoading: true, error: null });

    try {
      const response = await authService.login(email, password);

      console.log("STORE LOGIN RESPONSE:", response);

      // ✅ FIX: direct response (no .data)
      if (response && response.access_token) {
        const token = response.access_token;

        const user = {
          id: response.user_id,
          name: response.username,
          email: email,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${response.username}`,
        };

        const currentRound = response.current_round || 'mcq';

        const progress = response.progress || {
          mcq_completed: false,
          intermediate_completed: false,
          communication_completed: false,
          coding_completed: false,
        };

        // ✅ Save to localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('currentRound', currentRound);
        localStorage.setItem('progress', JSON.stringify(progress));

        // ✅ Update state
        set({
          user,
          currentRound,
          progress,
          isAuthenticated: true,
          error: null
        });

        return { success: true };
      } else {
        throw new Error("Invalid response from server");
      }

    } catch (error) {
      const errorMessage = error.message || 'Login failed';
      console.error("LOGIN ERROR:", errorMessage);

      set({ error: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      set({ isLoading: false });
    }
  },

  // 🔥 SIGNUP (FIXED)
  signup: async (name, email, password) => {
    set({ isLoading: true, error: null });

    try {
      const payload = {
        username: name,
        email,
        password
      };

      const registerResponse = await authService.register(payload);

      console.log("REGISTER RESPONSE:", registerResponse);

      // ✅ After register → login
      const loginResponse = await authService.login(email, password);

      console.log("LOGIN AFTER REGISTER:", loginResponse);

      if (loginResponse && loginResponse.access_token) {
        const token = loginResponse.access_token;

        const user = {
          id: loginResponse.user_id,
          name: loginResponse.username,
          email: email,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${loginResponse.username}`,
        };

        const currentRound = loginResponse.current_round || 'mcq';

        const progress = loginResponse.progress || {
          mcq_completed: false,
          intermediate_completed: false,
          communication_completed: false,
          coding_completed: false,
        };

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('currentRound', currentRound);
        localStorage.setItem('progress', JSON.stringify(progress));

        set({
          user,
          currentRound,
          progress,
          isAuthenticated: true,
          error: null
        });

        return { success: true };
      } else {
        throw new Error("Login after signup failed");
      }

    } catch (error) {
      const errorMessage = error.message || 'Signup failed';
      console.error("SIGNUP ERROR:", errorMessage);

      set({ error: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      set({ isLoading: false });
    }
  },

  // 🔥 LOGOUT
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('currentRound');
    localStorage.removeItem('progress');

    set({
      user: null,
      isAuthenticated: false,
      currentRound: 'mcq',
      progress: null
    });
  },

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setError: (error) => set({ error }),

  // 🔥 RESTORE SESSION
  restoreFromLocalStorage: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const currentRound = localStorage.getItem('currentRound');
    const progress = localStorage.getItem('progress');

    if (token && user) {
      set({
        user: JSON.parse(user),
        isAuthenticated: true,
        currentRound: currentRound || 'mcq',
        progress: progress ? JSON.parse(progress) : null,
      });
    }
  },

  // 🔥 UPDATE PROGRESS
  updateProgress: (currentRound, progress) => {
    localStorage.setItem('currentRound', currentRound);
    localStorage.setItem('progress', JSON.stringify(progress));

    set({ currentRound, progress });
  },
}));

/**
 * Interview Store (UNCHANGED)
 */
export const useInterviewStore = create((set) => ({
  questions: [],
  currentQuestion: 0,
  answers: {},
  timeStarted: null,

  setQuestions: (questions) => set({ questions }),
  setCurrentQuestion: (index) => set({ currentQuestion: index }),
  saveAnswer: (questionId, answer) => set((state) => ({
    answers: { ...state.answers, [questionId]: answer },
  })),
  startTimer: () => set({ timeStarted: Date.now() }),
  reset: () => set({
    questions: [],
    currentQuestion: 0,
    answers: {},
    timeStarted: null,
  }),
}));

/**
 * Resume Store (UNCHANGED)
 */
export const useResumeStore = create((set) => ({
  resume: null,
  atsScore: 0,
  skills: [],
  feedback: [],
  isAnalyzing: false,

  uploadResume: (file) => set({ resume: file }),
  setAtsScore: (score) => set({ atsScore: score }),
  setSkills: (skills) => set({ skills }),
  setFeedback: (feedback) => set({ feedback }),
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
}));

/**
 * Theme Store (UNCHANGED)
 */
export const useThemeStore = create((set) => ({
  isDark: true,

  toggleTheme: () => set((state) => ({ isDark: !state.isDark })),
  setTheme: (isDark) => set({ isDark }),
}));

/**
 * Notification Store (UNCHANGED)
 */
export const useNotificationStore = create((set) => ({
  notifications: [],

  addNotification: (notification) => set((state) => ({
    notifications: [...state.notifications, { ...notification, id: Date.now() }],
  })),

  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id),
  })),
}));