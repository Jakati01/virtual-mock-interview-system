const BASE_URL = "http://127.0.0.1:8000/api/v1";

/**
 * Master fetch wrapper for standard API calls
 * Automatically handles the JWT token and headers
 */
export const apiRequest = async (endpoint, method = "GET", body = null, isFormData = false) => {
  const token = localStorage.getItem("token");
  
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  
  // If it's NOT FormData (like a PDF upload), we send JSON
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const config = {
    method,
    headers,
    ...(body && { body: isFormData ? body : JSON.stringify(body) }),
  };
try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    if (!response.ok) {
      const errorData = await response.json();
      
      // 🟢 FIXED: Prevent [object Object] by stringifying FastAPI validation arrays
      let errorMessage = "API Request Failed";
      if (errorData.detail) {
        errorMessage = typeof errorData.detail === 'string' 
          ? errorData.detail 
          : JSON.stringify(errorData.detail); 
      }
      throw new Error(errorMessage);
    }
    return await response.json();
  } catch (error) {
    console.error(`[API Error] ${method} ${endpoint}:`, error.message);
    throw error;
  }
};

/**
 * Specific Service Endpoints for Authentication
 */
export const authService = {
  
  login: async (email, password) => {
    // ⚠️ CRITICAL FIX: The FastAPI backend requires the key "login_id"
    const payload = {
      login_id: email, 
      password: password
    };

    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      
      // Advanced error parsing to catch FastAPI's specific 422 messages
      let errorMessage = "Invalid credentials";
      if (errorData.detail) {
        if (Array.isArray(errorData.detail)) {
            // Extracts standard FastAPI validation errors e.g. "login_id: Field required"
            errorMessage = `${errorData.detail[0].loc[1]}: ${errorData.detail[0].msg}`;
        } else {
            // Extracts custom HTTPExceptions thrown in the backend
            errorMessage = errorData.detail;
        }
      }
      throw new Error(errorMessage);
    }
    
    return response.json();
  },
  
  // Register uses the standard apiRequest wrapper
  register: (data) => apiRequest("/auth/register", "POST", data),
};

/**
 * User Profile & Stats Service
 */
export const userService = {
  // Get user profile (current user info)
  getProfile: () => apiRequest("/auth/me", "GET"),
  
  // Get user dashboard stats
  getDashboardStats: (userId) => apiRequest(`/users/${userId}/stats`, "GET"),
  
  // Get user's ATS score and resume analysis
  getResumeAnalysis: (userId) => apiRequest(`/resume/${userId}`, "GET"),
  
  // Get all user interview results
  getResults: (userId) => apiRequest(`/results/user/${userId}`, "GET"),
  
  // Get final report for a specific interview
  getFinalReport: (userId) => apiRequest(`/results/final-report/${userId}`, "GET"),
  
  // Get user progress (which round they should resume from)
  getProgress: (userId) => apiRequest(`/users/${userId}/progress`, "GET"),
  
  // Update user progress after completing a round
  updateProgress: (userId, progressData) => 
    apiRequest(`/users/${userId}/progress`, "POST", progressData),
};

/**
 * Resume Service
 */
export const resumeService = {
  upload: async (userId, formData) => {
    const token = localStorage.getItem("token");
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    
    try {
      // Create an AbortController to timeout after 60 seconds
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
      
      const response = await fetch(`${BASE_URL}/resume/upload/${userId}`, {
        method: "POST",
        headers,
        body: formData, // FormData is not stringified
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // Log response for debugging
      console.log(`Upload response status: ${response.status}`);
      
      const data = await response.json();
      
      if (!response.ok) {
        const errorMsg = data?.detail || `Upload failed with status ${response.status}`;
        console.error('Upload error:', errorMsg);
        throw new Error(errorMsg);
      }
      
      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('Resume upload timed out after 60 seconds');
        throw new Error('Upload timed out. The server is taking too long to respond. Please try again.');
      }
      console.error('Resume upload fetch error:', error);
      throw error;
    }
  },
  
  analyze: (userId) => apiRequest(`/resume/${userId}/analyze`, "POST"),
};

/**
 * Practice Service
 */
export const practiceService = {

  // ==========================================
  // ROUND 1: MCQ
  // ==========================================
  generateMCQ: (skill, domain) => apiRequest("/practice/mcq/generate", "POST", { skill, domain }),
  submitMCQ: (userId, score, totalQuestions = 100) =>
    apiRequest("/practice/mcq/submit", "POST", { user_id: userId, score, total_questions: totalQuestions }),
  
  // ==========================================
  // ROUND 2: TECHNICAL DISCUSSION (Upgraded!)
  // ==========================================
  generateTheory: (skill, domain) => apiRequest("/practice/theory/generate", "POST", { skill, domain }),
  
  // 🟢 NEW: Custom fetch for Audio FormData
  evaluateDiscussionAudio: async (formData) => {
    const token = localStorage.getItem("token");
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const formatApiError = (errorData) => {
      if (!errorData?.detail) return "Audio evaluation failed";
      if (typeof errorData.detail === "string") return errorData.detail;
      if (Array.isArray(errorData.detail)) {
        return errorData.detail
          .map((item) => {
            const field = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : "field";
            return `${field}: ${item.msg}`;
          })
          .join(", ");
      }
      return JSON.stringify(errorData.detail);
    };

    try {
      const response = await fetch(`${BASE_URL}/practice/theory/evaluate-audio`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(formatApiError(errorData));
      }
      return await response.json();
    } catch (error) {
      console.error("Audio Evaluation Error:", error);
      throw error;
    }
  },

  // 🟢 NEW: Complete Round 2
  completeDiscussionRound: (payload) => apiRequest("/practice/theory/complete-round", "POST", payload),
  
  // ==========================================
  // ROUND 3 & 4: COMMUNICATION & CODING
  // ==========================================
  generateCommunicationTasks: (skill, domain) => {
    const safeSkill = skill ? String(skill) : "";
    const safeDomain = domain ? String(domain) : "";
    return apiRequest("/practice/generate-communication-tasks", "POST", { skill: safeSkill, domain: safeDomain });
  },
  
  evaluateCommunication: (payload) => apiRequest("/practice/evaluate-communication", "POST", payload),
  
  submitCommunication: (userId, transcript, overallScore, feedback) =>
    apiRequest("/practice/communication/submit", "POST", {
      user_id: userId,
      transcript,
      ...(overallScore !== undefined ? { overall_score: overallScore } : {}),
      ...(feedback ? { feedback } : {}),
    }),
  
  readAloud: (userId, audioFile, sentence) =>
    apiRequest("/practice/read-aloud", "POST", { user_id: userId, audio_file: audioFile, sentence }),
  
  repeatSentence: (userId, audioFile, originalText) =>
    apiRequest("/practice/repeat-sentence", "POST", { user_id: userId, audio_file: audioFile, original_text: originalText }),
  
  storyRetell: (userId, audioFile, storySummary) =>
    apiRequest("/practice/story-retell", "POST", { user_id: userId, audio_file: audioFile, story_summary: storySummary }),
  
  describeImage: (userId, audioFile, imageDescription) =>
    apiRequest("/practice/describe-image", "POST", { user_id: userId, audio_file: audioFile, image_description: imageDescription }),
  
  // 🟢 FIXED: Changed to POST and added payload
  generatePracticeCoding: (payload) => 
    apiRequest("/practice/coding/generate", "POST", payload),
  
  submitCodingSolution: (payload) =>
    apiRequest("/practice/coding/submit", "POST", payload),
  
  runCode: (payload) =>
    apiRequest("/practice/run-code", "POST", payload),
  
  logWarning: (payload) =>
    apiRequest("/practice/log-warning", "POST", payload),
  
  analyzeFrame: (payload) =>
    apiRequest("/practice/analyze-frame", "POST", payload),
};

/**
 * Interview Service
 */
export const interviewService = {
  checkEligibility: (userId) => apiRequest(`/interview/check-eligibility/${userId}`, "GET"),
  
  startInterview: (userId) => apiRequest("/interview/start", "POST", { user_id: userId }),
  submitResume: (userId, answers) => apiRequest("/interview/round1/resume-deep-dive", "POST", { user_id: userId, answers }),
  submitConceptual: (userId, answers) => apiRequest("/interview/round2/conceptual", "POST", { user_id: userId, answers }),
  submitRealWorld: (userId, code) => apiRequest("/interview/round3/real-world-coding", "POST", { user_id: userId, code }),
  submitHR: (userId, transcript) => apiRequest("/interview/round4/hr-behavioral", "POST", { user_id: userId, transcript }),
};

// Default export for BASE_URL (used by components)
export default BASE_URL;
