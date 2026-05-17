# InterviewAI - Premium Frontend

A premium, modern, production-level frontend for an AI-based Virtual Mock Interview Training System built with React.js, Tailwind CSS, and Framer Motion.

## 🎨 Design Features

### Modern Glassmorphism + Dark Theme
- Clean, professional dark theme (#0f172a background)
- Frosted glass effect with backdrop blur
- Smooth gradient animations and glow effects
- Neon blue/purple accent colors
- Fully responsive (mobile to desktop)

### Technology Stack
- **React.js 19.2.4** - UI framework
- **Vite 8** - Lightning-fast build tool
- **Tailwind CSS 3.4** - Utility-first styling
- **Framer Motion 12.38** - Smooth animations
- **Recharts 2.14** - Data visualization
- **Zustand 4.5** - State management
- **React Router DOM 7.14** - Client-side routing
- **React Hot Toast 2.6** - Toast notifications
- **Heroicons & MUI Icons** - Icon libraries

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.jsx              # Top navigation with user menu
│   │   │   ├── Sidebar.jsx             # Collapsible navigation sidebar
│   │   │   ├── MainLayout.jsx          # Wrapper layout with nav + sidebar
│   │   │   └── index.js
│   │   ├── ui/
│   │   │   ├── Button.jsx              # Premium button component
│   │   │   ├── Card.jsx                # Glassmorphism card
│   │   │   ├── Input.jsx               # Glass input field
│   │   │   ├── Modal.jsx               # Animated modal dialog
│   │   │   ├── Badge.jsx               # Status badges
│   │   │   ├── Progress.jsx            # Progress bar
│   │   │   ├── Skeleton.jsx            # Loading skeleton
│   │   │   ├── Spinner.jsx             # Loading spinner
│   │   │   └── index.js
│   │   └── features/
│   │       ├── StatCard.jsx            # Stat display card
│   │       ├── CircularProgress.jsx    # ATS score circle
│   │       ├── DragDropZone.jsx        # Resume upload
│   │       ├── SkillsList.jsx          # Skill tags
│   │       ├── FeedbackCard.jsx        # Feedback display
│   │       ├── QuestionCard.jsx        # Question display
│   │       ├── Timer.jsx               # Countdown timer
│   │       └── index.js
│   ├── pages/
│   │   ├── Auth.jsx                    # Login/Signup
│   │   ├── Dashboard.jsx               # Main dashboard
│   │   ├── Practice.jsx                # MCQ practice
│   │   ├── ArenaSetup.jsx              # Practice arena lobby
│   │   ├── InterviewResults.jsx        # Results display
│   │   ├── RealInterviewLayout.jsx     # Interview wrapper
│   │   └── [Other rounds...]
│   ├── store/
│   │   └── index.js                    # Zustand stores
│   │       ├── useAuthStore
│   │       ├── useInterviewStore
│   │       ├── useResumeStore
│   │       ├── useThemeStore
│   │       └── useNotificationStore
│   ├── hooks/
│   │   └── index.js                    # Custom React hooks
│   │       ├── useApi
│   │       ├── useLocalStorage
│   │       ├── useDebounce
│   │       ├── useAsync
│   │       └── useWindowSize
│   ├── App.jsx                         # Main app routes
│   ├── main.jsx                        # React entry point
│   └── index.css                       # Global styles
├── package.json
├── tailwind.config.js                  # Tailwind configuration
├── postcss.config.js                   # PostCSS configuration
└── vite.config.js                      # Vite configuration
```

## 🎯 Core Pages

### 1. **Authentication** (`/`)
- Premium split-screen login/signup UI
- Form validation with error messages
- Social login buttons
- Smooth animations and transitions
- Support for both login and signup modes

### 2. **Dashboard** (`/dashboard`)
- User greeting with dynamic name
- Stats cards showing:
  - ATS Score (out of 100)
  - Completed practice tests
  - Average interview score
  - Daily streak
- Weekly performance chart
- Test category accuracy bar chart
- Quick action buttons
- Recent tests list
- Responsive grid layout

### 3. **Resume Analysis** (`/resume`)
- Drag & drop resume upload
- Circular ATS score display
- Score breakdown (Formatting, Keywords, Experience, Structure)
- Extracted skills with proficiency levels
- Feedback cards (strengths, improvements)
- Download and comparison features

### 4. **Practice Arena** (`/practice`)
- **MCQ Round** - Multiple choice questions with timer
- **Theory Round** - Conceptual questions
- **Communication Round** - Speaking practice
- **Coding Round** - Algorithm problems
- Progress tracker with question navigation
- Real-time timer with warnings

### 5. **Real Interview** (`/interview`)
- Video interview UI layout
- Camera preview section
- Question panel with answer input
- Anti-cheat indicators
- Multiple rounds support

### 6. **Performance Reports** (`/reports`)
- Detailed performance breakdown
- Charts and score visualizations
- Category-wise analysis
- Download report button

## 🎨 Component System

### UI Components
- **Button** - Multiple variants (primary, secondary, ghost, icon)
- **Card** - Glassmorphism design with variants
- **Input** - With icons, labels, and error handling
- **Modal** - Animated modal with close button
- **Badge** - Status indicators with colors
- **Progress** - Animated progress bar
- **Skeleton** - Loading state placeholder
- **Spinner** - Rotating loading spinner

### Feature Components
- **StatCard** - Display statistics with icons and trends
- **CircularProgress** - Circular progress indicator for scores
- **DragDropZone** - File upload with drag & drop
- **SkillsList** - Skill tags with proficiency levels
- **FeedbackCard** - Strength/improvement feedback
- **QuestionCard** - Question display for tests
- **Timer** - Countdown timer with animations

### Layout Components
- **Navbar** - Top navigation with user menu
- **Sidebar** - Collapsible navigation menu
- **MainLayout** - Wrapper component with nav + sidebar

## 🎬 Animations

- **Framer Motion** for smooth page transitions
- **Glassmorphism effects** with CSS backdrop filters
- **Glow animations** on cards and buttons
- **Pulse animations** on timers
- **Slide and fade** entrance animations
- **Hover effects** on interactive elements
- **Progress animations** on bars and circles

## 🌈 Design System

### Colors
- **Background**: Dark (#0f172a)
- **Primary**: Blue gradient (rgb(59, 130, 246) to rgb(14, 165, 233))
- **Accent**: Purple/Violet gradients
- **Text**: Gray scale (#ffffff to #9ca3af)
- **Success**: Green (#10b981)
- **Warning**: Yellow (#f59e0b)
- **Error**: Red (#ef4444)

### Typography
- **Heading**: Semibold/Bold (text-white)
- **Body**: Regular (text-gray-300)
- **Caption**: Small (text-gray-400)
- **Code**: Monospace with code highlighting

### Spacing & Sizing
- Tailwind default spacing scale (4px base unit)
- Border radius: 8px to 24px (rounded corners)
- Shadow: Subtle glass shadow + glow effects
- Gap: 6px to 8px for component spacing

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
cd frontend
npm install
```

### Development
```bash
npm run dev
```
Opens at `http://localhost:5173`

### Production Build
```bash
npm run build
npm run preview
```

## 📊 State Management (Zustand)

### useAuthStore
- User authentication state
- Login/Signup actions
- User profile management

### useInterviewStore
- Interview questions
- Current question tracking
- User answers storage
- Timer management

### useResumeStore
- Resume file upload
- ATS score tracking
- Extracted skills
- Feedback data

### useThemeStore
- Dark/light theme toggle
- User preferences

### useNotificationStore
- Toast notifications
- Notification management

## 🎣 Custom Hooks

- **useApi** - Fetch data from API endpoints
- **useLocalStorage** - Persist state in localStorage
- **useDebounce** - Debounce search inputs
- **useAsync** - Handle async operations
- **useWindowSize** - Responsive design helper

## 📱 Responsive Design

- **Mobile First** approach
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Sidebar**: Collapsible on mobile with overlay
- **Grid Layouts**: Adapt from 1 to 4 columns
- **Touch-Friendly**: Large buttons and spacing on mobile

## 🔐 Protected Routes

All authenticated routes use `ProtectedRoute` wrapper:
```jsx
<Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
```

Authentication check:
- Validates user token in localStorage
- Redirects unauthenticated users to login
- Shows loading spinner during auth check

## 🎯 Best Practices

1. **Component Composition** - Small, reusable components
2. **Props Over State** - Pass data through props
3. **Hooks** - Use custom hooks for logic reuse
4. **Performance** - Memoization and code splitting
5. **Accessibility** - Semantic HTML, ARIA labels
6. **Dark Mode** - Consistent dark theme
7. **Mobile Responsive** - Works on all devices
8. **Clean Code** - Well-commented, organized files

## 📝 Styling Approach

### Tailwind CSS + Custom CSS
- **Utility Classes** for rapid development
- **Custom Components** in @layer components
- **CSS Variables** for consistent values
- **Responsive Utilities** for mobile-first design

### Custom Classes
```css
.glass-card { /* Glassmorphism effect */ }
.glass-input { /* Glass input styling */ }
.btn-primary { /* Primary button */ }
.badge { /* Badge styling */ }
.progress-bar { /* Progress bar */ }
```

## 🔄 API Integration

Ready for backend integration:
- Replace mock data with API calls
- Use `useApi` hook for data fetching
- Axios ready in dependencies
- Token-based authentication support

## 📚 Dependencies

All major packages installed:
- react, react-dom, react-router-dom
- tailwindcss, postcss, autoprefixer
- framer-motion
- recharts
- zustand
- react-hot-toast
- @heroicons/react, @mui/icons-material
- classnames, axios

## 🎓 Learning Resources

- [Tailwind CSS](https://tailwindcss.com)
- [Framer Motion](https://www.framer.com/motion)
- [React Router](https://reactrouter.com)
- [Zustand](https://github.com/pmndrs/zustand)
- [Recharts](https://recharts.org)

## 🚦 Next Steps

1. **Connect Backend API** - Replace mock data with real API calls
2. **Add More Pages** - Implement remaining interview rounds
3. **Video Integration** - Add video recording for interviews
4. **Real-time Features** - WebSocket for live proctoring
5. **Analytics** - Track user progress and performance
6. **Notifications** - Real-time notification system
7. **Export Reports** - PDF/CSV download functionality

---

**Built with ❤️ for premium user experience**
