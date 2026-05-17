# 🚀 Quick Start Guide - InterviewAI Frontend

## Running the Application

### Development Server
```bash
cd frontend
npm run dev
```
Opens at: **http://localhost:5173**

### Production Build
```bash
npm run build
npm run preview
```

## 🎨 What You'll See

### 1. **Login/Signup Page** (/)
- Premium split-screen design
- Beautiful gradient backgrounds
- Form with validation
- Social login buttons
- Switch between login and signup modes

```jsx
// Try these credentials (mocked):
Email: test@example.com
Password: password123
```

### 2. **Dashboard** (/dashboard)
- Welcome greeting with user name
- 4 stat cards with trends
- Weekly performance chart
- Test accuracy bar chart
- ATS score circular progress
- Recent tests list
- Quick action buttons

### 3. **Resume Analysis** (/resume)
- Drag & drop file upload
- ATS score with circular progress
- Score breakdown by category
- Extracted skills with tags
- Feedback cards (strengths & improvements)
- Action buttons for next steps

### 4. **Practice Arena** (/practice, /practice/mcq, etc.)
- MCQ Round with timer
- Question navigation
- Multiple choice options
- Progress tracking
- Previous/Next buttons

## 🎯 Key Features to Explore

### Animations
- Hover effects on cards and buttons
- Smooth page transitions
- Loading spinners
- Progress bar animations
- Glow effects on interactive elements

### Responsive Design
- **Desktop**: 4-column grid layouts
- **Tablet**: 2-column layouts
- **Mobile**: Single column with collapsible sidebar
- Try resizing your browser!

### Dark Theme
- Professional dark background
- Blue/purple gradient accents
- White text for readability
- Glassmorphism frosted glass effect
- Neon glow highlights

### Glassmorphism Components
- Cards with backdrop blur
- Transparent backgrounds
- Border with 10% opacity
- Smooth transitions and hover states
- Subtle shadow effects

## 📋 Component Usage Examples

### Using the Button Component
```jsx
import { Button } from '@/components/ui';

<Button variant="primary">Click Me</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button loading={true}>Loading...</Button>
```

### Using Cards
```jsx
import { Card } from '@/components/ui';

<Card>
  <h3>Card Title</h3>
  <p>Card content here</p>
</Card>
```

### Using Forms
```jsx
import { Input, Button } from '@/components/ui';

<form>
  <Input 
    label="Email"
    type="email"
    placeholder="email@example.com"
  />
  <Button type="submit">Submit</Button>
</form>
```

### Using Feature Components
```jsx
import { StatCard, CircularProgress, Timer } from '@/components/features';

<StatCard 
  title="Score"
  value={88}
  icon="📊"
  trend={+5}
/>

<CircularProgress value={88} label="ATS Score" />

<Timer duration={300} onTimeUp={handleTimeUp} />
```

### Using Layout
```jsx
import { MainLayout } from '@/components/layout';

<MainLayout user={user} onLogout={handleLogout}>
  {/* Page content */}
</MainLayout>
```

## 🔧 State Management Examples

### Accessing Auth Store
```jsx
import { useAuthStore } from '@/store';

const user = useAuthStore((state) => state.user);
const login = useAuthStore((state) => state.login);

await login(email, password);
```

### Using Custom Hooks
```jsx
import { useApi, useLocalStorage, useDebounce } from '@/hooks';

const { data, loading, error } = useApi('/api/questions');
const [theme, setTheme] = useLocalStorage('theme', 'dark');
const debouncedSearch = useDebounce(searchQuery, 500);
```

## 🎨 Customizing Styles

### Tailwind Configuration
Edit `tailwind.config.js` to:
- Change color theme
- Add custom colors
- Adjust spacing
- Modify border radius
- Create custom utilities

### CSS Variables
Edit `src/index.css` to:
- Add new layer components
- Create custom animations
- Define utility classes
- Adjust scrollbar styling

## 📱 Responsive Breakpoints

```jsx
// Tailwind breakpoints
sm: 640px   -> hidden sm:flex
md: 768px   -> md:grid-cols-2
lg: 1024px  -> lg:col-span-2
xl: 1280px  -> xl:text-4xl
```

## 🔗 Backend Integration

### Connecting to API
Edit the `useApi` hook in `src/hooks/index.js`:
```jsx
const baseURL = 'http://localhost:8000/api/v1';

const response = await fetch(baseURL + url, options);
```

### Authentication Token
The app automatically:
- Saves token to localStorage
- Includes token in API requests
- Validates token on page load
- Redirects to login if expired

## 📦 Package Locations

All imports are configured for clean paths:
```jsx
import { Button, Card } from '@/components/ui';
import { useAuthStore } from '@/store';
import { MainLayout } from '@/components/layout';
import { useApi } from '@/hooks';
```

## 🐛 Debugging

### Browser DevTools
- React DevTools for component inspection
- Network tab for API calls
- Console for error messages
- Local Storage for state inspection

### Common Issues
1. **Blank page?** - Check browser console for errors
2. **Styling not applied?** - Ensure `index.css` is imported in `main.jsx`
3. **Components not found?** - Verify imports match folder structure
4. **API calls failing?** - Check backend is running on port 8000

## 📚 Additional Resources

- **Tailwind CSS**: https://tailwindcss.com/docs
- **Framer Motion**: https://www.framer.com/motion
- **React Router**: https://reactrouter.com
- **Zustand**: https://github.com/pmndrs/zustand
- **Recharts**: https://recharts.org/api

## ✨ What's Next?

1. **Connect Backend** - Replace mock data with API calls
2. **Add Video** - Integrate video recording
3. **Real-time Features** - Add WebSocket support
4. **More Pages** - Complete all interview rounds
5. **Mobile App** - React Native version

---

**Enjoy building! 🎉**

For issues or questions, check the frontend README.md
