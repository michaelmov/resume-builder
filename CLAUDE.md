# Resume Builder

A modern React-based resume builder application that allows users to create, edit, and export professional resumes with real-time PDF preview.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Architecture Overview

This is a single-page application built with React 18 and TypeScript, using a component-based architecture with Context API for state management. The application follows a modern React patterns including:

- **State Management**: React Context + useReducer for global resume state
- **Local Persistence**: localStorage for automatic saving/loading
- **Real-time Preview**: Live PDF generation using @react-pdf/renderer
- **Form Handling**: React Hook Form for efficient form management
- **Drag & Drop**: @dnd-kit for sortable skills and tags
- **Export Options**: PDF, JSON, and ATS-compliant text formats

## Project Structure

```
src/
├── components/           # React components
│   ├── Editor/          # Resume editing components
│   │   ├── BasicsSection.tsx
│   │   ├── Editor.tsx
│   │   ├── EditorSections.tsx
│   │   ├── EducationSection.tsx
│   │   ├── SkillsSection/
│   │   │   ├── KeywordInput.tsx
│   │   │   ├── SkillsSection.tsx
│   │   │   ├── SortableKeywordTag.tsx
│   │   │   └── SortableKeywordTagContainer.tsx
│   │   └── WorkSection.tsx
│   ├── Preview/         # PDF preview components
│   │   ├── ExportMenu.tsx
│   │   ├── Preview.tsx
│   │   └── PreviewNavBar.tsx
│   ├── ui/             # Reusable UI components
│   │   └── Tooltip.tsx
│   ├── GlobalActionBar.tsx
│   └── Navbar.tsx
├── context/            # React Context providers
│   ├── GlobalFormContext.tsx
│   ├── ResumeContext.tsx
│   └── ResumeReducer.ts
├── hooks/              # Custom React hooks
│   ├── useJsonImport.ts
│   ├── useResume.ts
│   └── useResumeLocalStorage.ts
├── ResumeTemplates/    # PDF template components
│   ├── BasicTemplate.tsx
│   └── Duo.tsx
├── types/             # TypeScript type definitions
│   └── resume.model.ts
├── utils/             # Utility functions
│   ├── date-utilities.ts
│   ├── json-export.ts
│   └── text-export.ts
├── mocks/             # Mock data for development
│   └── resume.mock.ts
├── theme.ts           # Chakra UI theme configuration
├── decs.d.ts          # TypeScript declarations
├── index.css          # Global styles
├── main.tsx           # Application entry point
├── App.tsx            # Root component
└── vite-env.d.ts      # Vite environment types
```

## Key Components

### Core Layout (`App.tsx`)

- **Grid Layout**: Three-column layout (navbar, editor, preview)
- **Responsive Design**: Adapts to different screen sizes
- **Router Integration**: React Router for navigation (currently single route)

### State Management (`ResumeContext.tsx`)

- **Global State**: Resume data managed via Context API
- **Reducer Pattern**: Actions for updating different resume sections
- **Auto-Save**: Automatic localStorage persistence on state changes
- **Mock Data**: Fallback to mock resume for new users

### Editor Components (`components/Editor/`)

- **Section-Based**: Modular components for each resume section
- **Form Integration**: React Hook Form for validation and state management
- **Real-Time Updates**: Changes reflected immediately in preview
- **Drag & Drop**: Sortable skills tags using @dnd-kit

### Preview System (`components/Preview/`)

- **PDF Generation**: Real-time PDF creation using @react-pdf/renderer
- **Template System**: Modular PDF templates (currently "Duo" template)
- **Export Options**: Multiple format exports (PDF, JSON, TXT)
- **ATS Compliance**: Text export optimized for Applicant Tracking Systems

### Skills Section (`components/Editor/SkillsSection/`)

- **Dynamic Tags**: Add/remove skill keywords dynamically
- **Sortable Interface**: Drag and drop keyword reordering
- **Real-time Updates**: Immediate preview updates
- **Modular Components**: KeywordInput, SortableKeywordTag, SortableKeywordTagContainer

### Navigation & UI Components

- **Navbar** (`components/Navbar.tsx`): Main application navigation
- **GlobalActionBar** (`components/GlobalActionBar.tsx`): Global action controls
- **Tooltip** (`components/ui/Tooltip.tsx`): Reusable tooltip component
- **EditorSections** (`components/Editor/EditorSections.tsx`): Editor section management

### Theme & Styling (`theme.ts`)

- **Chakra UI System**: Custom theme configuration with createSystem
- **Design Tokens**: Standardized sizing tokens for consistent UI
- **Semantic Tokens**: Component-specific default sizes for inputs, textareas, and selects

## Data Model (`types/resume.model.ts`)

The application uses a comprehensive resume data model based on JSON Resume schema:

```typescript
interface Resume {
  basics: Basics; // Personal information
  work: Work[]; // Work experience
  education: Education[]; // Educational background
  skills: Skill[]; // Technical and soft skills
  // ... other sections (awards, certificates, etc.)
}
```

## State Management Pattern

### Resume Context (`context/ResumeContext.tsx`)

- **Provider Pattern**: Wraps entire application
- **useReducer Hook**: Manages complex state updates
- **Auto-persistence**: Saves to localStorage on every change
- **Type Safety**: Full TypeScript integration

### Reducer Actions (`context/ResumeReducer.ts`)

```typescript
enum ACTIONS {
  updateResume = 'UPDATE_RESUME',
  updateBasics = 'UPDATE_BASICS',
  updateSkills = 'UPDATE_SKILLS',
  updateWork = 'UPDATE_WORK',
  updateEducation = 'UPDATE_EDUCATION',
}
```

## Custom Hooks

### `useResume()` - Main state hook

- Provides resume data and update functions
- Abstracts Context API complexity
- Type-safe state access

### `useResumeLocalStorage()` - Persistence layer

- Handles localStorage operations
- JSON serialization/deserialization
- Error handling for storage operations

### `useJsonImport()` - File import functionality

- File input handling
- JSON validation and parsing
- Resume data import/merge capabilities

## PDF Template System (`ResumeTemplates/`)

### Available Templates

- **Duo Template** (`Duo.tsx`): Main professional template

### Template Features

- **@react-pdf/renderer**: PDF generation library
- **Custom Styling**: StyleSheet-based design
- **Font Integration**: Google Fonts integration
- **Responsive Sections**: Dynamic content rendering
- **Custom Components**: Reusable PDF components (SectionTitle, WorkExperience, etc.)

## Export Features (`utils/`)

### JSON Export (`json-export.ts`)

- Complete resume data export
- Maintains data structure integrity
- Compatible with JSON Resume standard

### Text Export (`text-export.ts`)

- ATS-compliant plain text format
- Structured sections with proper formatting
- Optimized for keyword scanning

### PDF Export (Built-in)

- Real-time PDF generation
- Professional template rendering
- Download functionality via @react-pdf/renderer

## Development Tools & Configuration

### Build Tools

- **Vite**: Fast development and build tool
- **TypeScript**: Type safety and better DX
- **ESLint**: Code linting with React-specific rules
- **Prettier**: Code formatting

### Key Scripts

```bash
npm run dev          # Development server with hot reload
npm run build        # Production build with type checking
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix linting issues
npm run format       # Format code with Prettier
npm run deploy       # Deploy to GitHub Pages
```

### GitHub Pages Configuration

- **Base Path**: `/resume-builder/` for GitHub Pages deployment
- **Hash Router**: Client-side routing for static hosting
- **Build Output**: `dist/` directory for deployment

## Tech Stack

### Core Dependencies

- **React 18.3.1**: Latest React with concurrent features
- **TypeScript**: Type safety and enhanced developer experience
- **Chakra UI 3.0.0**: Modern component library with design tokens
- **Vite 7.0.5**: Fast build tool and development server

### PDF & Export

- **@react-pdf/renderer 4.3.0**: PDF generation from React components
- **react-pdf 10.1.0**: PDF viewing in browser

### Form & Interaction

- **React Hook Form 7.53.0**: Efficient form handling
- **@dnd-kit**: Drag and drop functionality for sortable elements

### Routing & State

- **React Router DOM 6.26.1**: Client-side routing
- **Context API + useReducer**: Built-in React state management

### Development Tools

- **ESLint**: Code linting with TypeScript and React plugins
- **Prettier**: Code formatting
- **Husky**: Git hooks for code quality

## Notable Features

1. **Real-time PDF Preview**: Changes in the editor immediately reflect in the PDF preview
2. **Auto-save Functionality**: All changes automatically saved to localStorage
3. **Multiple Export Formats**: PDF, JSON, and ATS-compliant text exports
4. **Drag & Drop Interface**: Sortable skills and keyword tags
5. **Responsive Design**: Works on desktop and tablet devices
6. **Type Safety**: Full TypeScript coverage with strict type checking
7. **Accessibility**: Chakra UI components provide built-in accessibility features
