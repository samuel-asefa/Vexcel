// src/App.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GoogleOAuthProvider, GoogleLogin, googleLogout } from '@react-oauth/google';
// Replacing VEX-specific icons with more generic/science ones from Lucide
import {
  Play, Users, Trophy, BookOpen, Code, Zap, Target, Award, ChevronRight, X, Check, RotateCcw, Home, LogOut, Search, Eye, MessageSquare, Brain, Settings2, Puzzle, HelpCircle, Clock, BarChart2, Layers, Crosshair, Truck, Wrench, University, SquarePen, Terminal, Bot, CircuitBoard, Radar, Trash2,
  FlaskConical, Atom, Beaker, TestTube, Lightbulb, Sigma, FunctionSquare, Move, MousePointer, FileCog, PenTool, Edit3, Code2, BrainCog, Cpu, Microscope, Notebook, Telescope, Dna, Leaf, Wind, Mountain, BookMarked, UsersRound, BrainCircuit, FileQuestion, TrendingUp, BarChartHorizontal, CheckCircle, ListChecks
} from 'lucide-react';


import { auth, db } from './Firebase'; // Assuming Sciolytics_Firebase.js is correctly configured
import { GoogleAuthProvider as FirebaseGoogleAuthProvider, signInWithCredential, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import {
  doc, getDoc, setDoc, updateDoc, writeBatch,
  collection, query, where, getDocs, addDoc, serverTimestamp,
  increment, arrayUnion, arrayRemove, orderBy, limit, deleteDoc
} from 'firebase/firestore';

console.log("[Sciolytics_App.js] Value of 'auth' imported from ./Firebase.js:", auth);
console.log("[Sciolytics_App.js] Value of 'db' imported from ./Firebase.js:", db);

// Helper function to generate unique IDs (slugify)
const slugify = (text) => text.toString().toLowerCase().trim()
  .replace(/\s+/g, '-')           // Replace spaces with -
  .replace(/[^\w-]+/g, '')       // Remove all non-word chars
  .replace(/--+/g, '-')         // Replace multiple - with single -
  .replace(/^-+/, '')             // Trim - from start of text
  .replace(/-+$/, '');            // Trim - from end of text

// Helper function to generate placeholder contentDetail
const generateContentDetail = (title, customText = "", eventType = "event") => {
  const placeholderText = customText || `Explore the key concepts of ${title}. This section includes practice questions, essential theory, and resources to help you master this Science Olympiad ${eventType}.`;
  return `<h1>${title}</h1><p>${placeholderText}</p><img src='https://placehold.co/600x350/D1E8FF/4A90E2?text=${encodeURIComponent(title)}' alt='${title}' style='width:100%;max-width:450px;border-radius:8px;margin:1.5rem auto;display:block;border:1px solid #ccc;'>`;
};

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '114611845198-3ufro2pgosmo5kma37t15v34gk7lbdvi.apps.googleusercontent.com'; // KEEPING OLD ID AS PER ASSUMPTION
const XP_PER_LEVEL = 500; // Can be adjusted for Sciolytics
const CHALLENGE_MAX_XP = 100; // XP for completing a knowledge challenge
const QUESTIONS_PER_CHALLENGE = 7; // Default questions in knowledge challenge
const QUESTION_TIMER_DURATION = 30; // Timer per question in challenge (seconds)


// --- Component Definitions ---

const LoginView = ({
  googleClientId,
  actionLoading,
  currentView,
  message,
  user,
  onLoginSuccess,
  onLoginError,
}) => (
  <GoogleOAuthProvider clientId={googleClientId}>
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <Atom className="brand-icon-large" style={{color: 'var(--theme-primary)'}}/> {/* Sciolytics Icon */}
          <h1>Sciolytics</h1>
          <p>Master Science Olympiad Events</p>
        </div>
        {actionLoading && currentView === 'login' && (
          <div className="loading-section login-specific-loader">
            <div className="spinner"></div>
            <p>Processing Sign-In...</p>
          </div>
        )}
        {message && !user && currentView === 'login' && (
          <div className={`message login-message ${message.includes('failed') || message.includes('Error') || message.includes('Invalid') ? 'error' : (message.includes('Logout') || message.includes('logged out') ? 'info' : 'success')}`}>
            {message}
          </div>
        )}
        {!actionLoading && !user && (
          <div className="login-section">
            <GoogleLogin
              onSuccess={onLoginSuccess}
              onError={onLoginError}
              useOneTap={true}
              auto_select={false}
              theme="outline"
              size="large"
              text="signin_with"
              shape="rectangular"
              width="300px"
            />
          </div>
        )}
        <div className="features-preview">
          <div className="feature"><ListChecks className="feature-icon" /><span>MCQ & FRQ Practice</span></div>
          <div className="feature"><BookMarked className="feature-icon" /><span>All Div C Events</span></div>
          <div className="feature"><TrendingUp className="feature-icon" /><span>Track Progress</span></div>
          <div className="feature"><UsersRound className="feature-icon" /><span>Study Groups</span></div>
        </div>
        <p className="login-footer">© {new Date().getFullYear()} Sciolytics Platform. Excel in Science Olympiad.</p>
      </div>
    </div>
  </GoogleOAuthProvider>
);

const Navigation = ({ user, currentView, navigate, handleLogout, actionLoading }) => (
  <nav className="nav">
    <div className="nav-brand" onClick={() => user && navigate('dashboard')} style={{cursor: user ? 'pointer' : 'default'}}>
      {/* Replace with Sciolytics logo or keep simple text + icon */}
      <Atom className="brand-logo-image" style={{color: 'var(--theme-primary)'}}/>
      <span className="brand-text">Sciolytics</span>
    </div>
    {user && (
      <div className="nav-items">
        <button className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => navigate('dashboard')}><Home className="icon" />Dashboard</button>
        <button className={`nav-item ${currentView === 'events' ? 'active' : ''}`} onClick={() => navigate('events')}><Notebook className="icon" />Events</button> {/* Changed from modules */}
        <button className={`nav-item ${currentView === 'studygroups' ? 'active' : ''}`} onClick={() => navigate('studygroups')}><UsersRound className="icon" />Study Groups</button> {/* Changed from teams */}
        <button className={`nav-item ${currentView === 'browseGroups' ? 'active' : ''}`} onClick={() => navigate('browseGroups')}><Search className="icon" />Browse Groups</button> {/* Changed */}
        <button className={`nav-item ${currentView === 'leaderboard' ? 'active' : ''}`} onClick={() => navigate('leaderboard')}><Trophy className="icon" />Leaderboard</button>
        <button className={`nav-item ${currentView === 'challenge' ? 'active' : ''}`} onClick={() => navigate('challenge')}><BrainCircuit className="icon" />Challenge</button> {/* Changed Icon */}
        <div className="nav-user">
          <img src={user.avatar} alt={user.name} className="user-avatar" onError={(e)=>e.target.src='https://source.boringavatars.com/beam/120/default?colors=4A90E2,86C4EB,F0F8FF,BDC3C7,7f8c8d'}/> {/* Updated boringavatars colors */}
          <div className="user-info"><span className="user-name">{user.name}</span><span className="user-level">Lvl {user.level} ({user.xp || 0} XP)</span></div>
          <button onClick={handleLogout} className="logout-btn" title="Logout" disabled={actionLoading}><LogOut size={18}/></button>
        </div>
      </div>
    )}
  </nav>
);

const Dashboard = ({ user, userProgress, userTeam, learningModules, navigate, actionLoading }) => { // learningModules renamed to sciolyEvents internally
  if (!user) return null;
  const sciolyEvents = learningModules; // Renaming for clarity in this component

  // Simplified recommended next module logic for Sciolytics
  const modulesInProgress = sciolyEvents.filter(m => {
      const prog = userProgress[m.id];
      return prog && Object.keys(prog.lessons).length > 0 && Object.keys(prog.lessons).length < m.lessons;
  });
  const recommendedNextModule = modulesInProgress.length > 0 ? modulesInProgress[0] : sciolyEvents.find(m => !userProgress[m.id] || Object.keys(userProgress[m.id].lessons).length === 0);

  const allCategories = [...new Set(sciolyEvents.map(m => m.category || 'General Science'))];
  // Adjusted category order for Science Olympiad
  const preferredCategoryOrder = ['Life Science', 'Earth & Space Science', 'Physical Science & Chemistry', 'Technology & Engineering', 'Inquiry & Nature of Science', 'General Science'];
  const categoryOrder = [...new Set([...preferredCategoryOrder, ...allCategories])];

  const categorizedModules = sciolyEvents.reduce((acc, module) => {
      const category = module.category || 'General Science';
      if (!acc[category]) acc[category] = [];
      acc[category].push(module);
      return acc;
  }, {});

  // Example of more stats (can be expanded with more user data fields)
  const completedEventsCount = sciolyEvents.filter(m => {
    const prog = userProgress[m.id];
    return prog && Object.values(prog.lessons).filter(l => l.completed).length === m.lessons;
  }).length;
  const practiceSetsAttempted = Object.values(userProgress).reduce((sum, mod) => sum + Object.keys(mod.lessons).length, 0);


  return (
  <div className="dashboard">
    <div className="dashboard-header">
      <div className="welcome-section">
        <h1>Welcome back, {user.name}!</h1>
        <p>Ready to explore Science Olympiad events?</p>
      </div>
      <div className="stats-grid">
        <div className="stat-card"><Award className="stat-icon" /><div><span className="stat-value">{user.xp || 0}</span><span className="stat-label">Total XP</span></div></div>
        <div className="stat-card"><Target className="stat-icon" /><div><span className="stat-value">{user.level}</span><span className="stat-label">Level</span></div></div>
        <div className="stat-card"><CheckCircle className="stat-icon" /><div><span className="stat-value">{completedEventsCount}</span><span className="stat-label">Events Mastered</span></div></div>
        <div className="stat-card"><ListChecks className="stat-icon" /><div><span className="stat-value">{practiceSetsAttempted}</span><span className="stat-label">Practice Sets Done</span></div></div>
        {/* <div className="stat-card"><Zap className="stat-icon" /><div><span className="stat-value">{user.streak || 0}</span><span className="stat-label">Day Streak</span></div></div> */}
      </div>
    </div>
    {userTeam && ( // userTeam is now userStudyGroup
      <div className="team-card study-group-card"> {/* Renamed class */}
        <div className="team-info"> <UsersRound className="team-icon" /> <div> <h3>{userTeam.name}</h3> <p>{(userTeam.memberIds ? userTeam.memberIds.length : 0)} members • Rank #{userTeam.rank || 'N/A'} • Code: <code>{userTeam.code}</code></p> </div> </div>
        <div className="team-stats"><span className="team-xp">{(userTeam.totalXP || 0).toLocaleString()} XP</span></div>
      </div>
    )}
    {recommendedNextModule && (
        <div className="recommended-module-card" onClick={() => navigate('eventView', recommendedNextModule)}> {/* navigate to eventView */}
            <div className="recommended-tag">Recommended Next</div>
            <recommendedNextModule.icon className="module-icon" style={{color: `var(--color-${recommendedNextModule.color}-500)`}}/>
            <h3>{recommendedNextModule.title}</h3>
            <p>{recommendedNextModule.description.substring(0,100)}...</p>
            <button className="start-btn small" disabled={actionLoading}>
                {userProgress[recommendedNextModule.id] && Object.keys(userProgress[recommendedNextModule.id].lessons).length > 0 ? 'Continue Event' : 'Start Event'} <ChevronRight className="icon-small"/>
            </button>
        </div>
    )}
    <div className="modules-section"> {/* Renamed to events-section */}
      {categoryOrder.map(category => {
          if (!categorizedModules[category] || categorizedModules[category].length === 0) return null;
          return (
              <div key={category} className="module-category-section">
                  <h2 className="category-title">{category} Events</h2>
                  <div className="modules-grid">
                  {categorizedModules[category].map((module) => { // module is now an event
                      const Icon = module.icon;
                      const prog = userProgress[module.id] || { lessons: {}, moduleXp: 0 };
                      const completedCount = Object.values(prog.lessons).filter(l => l.completed).length;
                      const progressPercent = module.lessons > 0 ? (completedCount / module.lessons) * 100 : 0;
                      return (
                      <div key={module.id} className={`module-card ${module.color}`} onClick={() => navigate('eventView', module)}> {/* navigate to eventView */}
                          <div className="module-header"> <Icon className="module-icon" /> <div className="module-meta"> <span className="difficulty">{module.difficulty}</span> <span className="duration">{module.duration}</span> </div> </div>
                          <h3>{module.title}</h3> <p>{module.description}</p>
                          <div className="progress-section">
                          <div className="progress-bar"><div className="progress-fill" style={{ width: `${progressPercent}%` }}></div></div>
                          <span className="progress-text">{completedCount}/{module.lessons} practice sets ({(prog.moduleXp || 0)} XP)</span>
                          </div>
                          <button className="start-btn" disabled={actionLoading}> {progressPercent === 100 ? 'Review Event' : progressPercent > 0 ? 'Continue Learning' : 'Start Learning'} <ChevronRight className="icon" /> </button>
                      </div>
                      );
                  })}
                  </div>
              </div>
          );
      })}
      </div>
  </div>
)};

// Renamed ModuleView to EventView
const EventView = ({ selectedModule, userProgress, navigate, actionLoading }) => { // selectedModule is now selectedEvent
  const selectedEvent = selectedModule;
  if (!selectedEvent) return <p className="error-message">Event not found. Please go back to the dashboard.</p>;
  const moduleProg = userProgress[selectedEvent.id] || { lessons: {} };
  const Icon = selectedEvent.icon;
  return (
    <div className="module-view event-view"> {/* Added event-view class */}
      <div className="module-view-header">
        <button onClick={() => navigate('events')} className="back-btn" disabled={actionLoading}><ChevronRight className="icon rotated" /> Back to Events</button> {/* Navigate to 'events' */}
        <div className="module-title-section">
          <Icon className="module-icon-large" style={{color: `var(--color-${selectedEvent.color}-500)`}} />
          <div>
            <span className="category-tag-module">{selectedEvent.category || 'General Science'}</span>
            <h1>{selectedEvent.title}</h1> <p>{selectedEvent.description}</p>
            <div className="module-badges"> <span className="badge">{selectedEvent.difficulty}</span> <span className="badge">{selectedEvent.duration}</span> <span className="badge">{selectedEvent.lessons} practice sets</span> </div>
          </div>
        </div>
      </div>
      <div className="lessons-list">
        {selectedEvent.content.lessons.map((lesson, index) => {
          const lessonState = moduleProg.lessons[lesson.id.replace(/\./g, '_')] || { completed: false };
          const isCompleted = lessonState.completed;
          const prevLessonSanitizedId = index > 0 ? selectedEvent.content.lessons[index - 1].id.replace(/\./g, '_') : null;
          const isLocked = index > 0 && !(moduleProg.lessons[prevLessonSanitizedId]?.completed);
          // Differentiate icons for MCQ, FRQ, Lesson
          let LessonIcon = BookOpen; // Default for 'lesson'
          if (lesson.type === 'mcq') LessonIcon = ListChecks;
          else if (lesson.type === 'frq') LessonIcon = FileQuestion;

          return (
            <div key={lesson.id} className={`lesson-item ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''}`}
              onClick={() => {
                if (actionLoading || (isLocked && !isCompleted)) return;
                // Navigate based on lesson type
                if (lesson.type === 'lesson' || lesson.type === 'frq') navigate('lessonContent', { moduleId: selectedEvent.id, lesson }); // FRQ uses LessonContentView
                else if (lesson.type === 'mcq') navigate('practiceView', { moduleId: selectedEvent.id, lesson }); // mcq uses practiceView (renamed QuizView)
                // else if (lesson.type === 'game') navigate('game', { moduleId: selectedEvent.id, lesson }); // Game view removed for Sciolytics for now
              }}>
              <div className="lesson-number">{isCompleted ? <Check className="icon-small" /> : index + 1}</div>
              <LessonIcon className="lesson-type-icon" style={{color: `var(--color-${selectedEvent.color}-500)`}}/>
              <div className="lesson-content"> <h3>{lesson.title}</h3> <span className="lesson-type-badge">{lesson.type.toUpperCase()} (+{lesson.xp} XP)</span> </div>
              <button className="lesson-btn" disabled={actionLoading || (isLocked && !isCompleted)}> {isCompleted ? 'Review' : (isLocked ? 'Locked' : 'Start')} <ChevronRight className="icon-small" /> </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// LessonContentView now also handles FRQs for self-assessment
const LessonContentView = ({ currentLesson, selectedModule, userProgress, handleCompleteItem, navigate, actionLoading }) => { // selectedModule is selectedEvent
  const selectedEvent = selectedModule;
  if (!currentLesson || !selectedEvent) return <p className="error-message">Lesson content not found or event context missing.</p>;
  const moduleProg = userProgress[selectedEvent.id] || { lessons: {} };
  const lessonState = moduleProg.lessons[currentLesson.id.replace(/\./g, '_')] || { completed: false };
  const isCompleted = lessonState.completed;

  const handleMarkCompleteAndContinue = () => {
    if (actionLoading) return;
    const sanitizedLessonId = currentLesson.id.replace(/\./g, '_');
    if (!isCompleted) handleCompleteItem(selectedEvent.id, sanitizedLessonId, currentLesson.type, null, currentLesson.xp);

    const currentIndex = selectedEvent.content.lessons.findIndex(l => l.id === currentLesson.id);
    const nextLesson = selectedEvent.content.lessons[currentIndex + 1];
    if (nextLesson) {
      if (nextLesson.type === 'lesson' || nextLesson.type === 'frq') navigate('lessonContent', { moduleId: selectedEvent.id, lesson: nextLesson });
      else if (nextLesson.type === 'mcq') navigate('practiceView', { moduleId: selectedEvent.id, lesson: nextLesson });
      else navigate('eventView', { id: selectedEvent.id });
    } else navigate('eventView', { id: selectedEvent.id });
  };
  const LessonTypeIcon = currentLesson.type === 'frq' ? FileQuestion : MessageSquare;

  return (
    <div className="lesson-content-view">
      <button onClick={() => navigate('eventView', {id: selectedEvent.id})} className="back-btn" disabled={actionLoading}><ChevronRight className="icon rotated" /> Back to {selectedEvent.title}</button>
      <div className="lesson-title-header">
          <LessonTypeIcon className="lesson-type-icon-large" style={{color: `var(--color-${selectedEvent.color}-500)`}}/>
          <h2>{currentLesson.title} ({currentLesson.type.toUpperCase()})</h2>
      </div>
      <div className="content-area" dangerouslySetInnerHTML={{ __html: currentLesson.contentDetail || `<p>No detailed content available for this ${currentLesson.type}.</p>` }} />
      {currentLesson.type === 'frq' && (
        <div className="frq-self-assessment">
          <h4>Model Answer/Rubric (Self-Assess)</h4>
          <div className="model-answer-placeholder">
            <p>{currentLesson.modelAnswer || "Model answer or scoring rubric would appear here for self-assessment."}</p>
          </div>
        </div>
      )}
      <button onClick={handleMarkCompleteAndContinue} className="complete-lesson-btn" disabled={actionLoading}>
        {isCompleted ? 'Continue to Next Item' : `Mark as Reviewed & Continue (+${currentLesson.xp} XP)`}
        <ChevronRight className="icon-small"/>
      </button>
    </div>
  );
};

// Renamed QuizView to PracticeView (handles MCQs)
const PracticeView = ({ quizData, sampleQuizzes, userProgress, selectedModule, handleCompleteItem, navigate, actionLoading, setMessage }) => { // selectedModule is selectedEvent, sampleQuizzes is sampleMcqs
  const selectedEvent = selectedModule;
  const sampleMcqs = sampleQuizzes;

  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [selectedAns, setSelectedAns] = useState(null);
  const [showRes, setShowRes] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);

  if (!quizData || !quizData.lessonId) return <p className="error-message">Loading practice set...</p>;
  const sanitizedLessonId = quizData.lessonId.replace(/\./g, '_');
  const quizContent = sampleMcqs[sanitizedLessonId]; // Practice set content
  if (!quizContent) return <p className="error-message">MCQ practice content not found for: {quizData.lessonId}. Please check `sampleMcqs` and ensure keys match sanitized lesson IDs.</p>;

  const handleAnsSelect = (idx) => { if (showExplanation || actionLoading) return; setSelectedAns(idx); }
  const handleSubmitAnswer = () => {
    if (selectedAns === null || actionLoading) return;
    setShowExplanation(true);
    const q = quizContent.questions[currentQIdx];
    if (selectedAns === q.correct) { setQuizScore(s => s + 1); }
  };
  const handleNextQ = () => {
    if (actionLoading) return;
    setShowExplanation(false); setSelectedAns(null);
    if (currentQIdx + 1 < quizContent.questions.length) {
      setCurrentQIdx(i => i + 1);
    } else {
      setShowRes(true);
      const finalScore = quizScore;
      const passPercent = 70; // Can be adjusted
      const currentModuleProgress = userProgress[quizData.moduleId]?.lessons[sanitizedLessonId] || {};
      if (!currentModuleProgress.completed && (finalScore / quizContent.questions.length) * 100 >= passPercent) {
        handleCompleteItem(quizData.moduleId, sanitizedLessonId, 'mcq', finalScore, quizData.lesson.xp);
      } else if (currentModuleProgress.completed) {
          setMessage(`Practice set reviewed. Score: ${finalScore}/${quizContent.questions.length}. XP already earned.`);
      }
      else {
          setMessage(`Practice set attempt recorded. Score: ${finalScore}/${quizContent.questions.length}. You need ${passPercent}% to pass and earn XP.`);
      }
    }
  };
  const resetQuiz = () => { setCurrentQIdx(0); setSelectedAns(null); setShowRes(false); setQuizScore(0); setShowExplanation(false); };

  if (showRes) {
    const perc = Math.round((quizScore / quizContent.questions.length) * 100);
    const passed = perc >= 70;
    const currentModuleProgress = userProgress[quizData.moduleId]?.lessons[sanitizedLessonId] || {};
    return (
      <div className="quiz-result practice-result"> {/* Added practice-result class */}
        <div className={`result-icon ${passed ? 'success' : 'fail'}`}>{passed ? <Check /> : <X />}</div>
        <h2>{passed ? 'Excellent Work!' : 'Keep Practicing!'}</h2>
        <p>Your score: {quizScore}/{quizContent.questions.length} ({perc}%)</p>
        {passed && !currentModuleProgress.completed && <p className="xp-earned">+{quizData.lesson.xp} XP Earned!</p>}
        {passed && currentModuleProgress.completed && <p className="xp-earned">XP previously earned for this practice set.</p>}
        {!passed && <p>You need 70% to pass and earn XP for this practice set.</p>}
        <div className="result-actions">
          <button onClick={resetQuiz} className="retry-btn" disabled={actionLoading}><RotateCcw className="icon-small"/> Try Again</button>
          <button onClick={() => navigate('eventView', {id: quizData.moduleId})} className="continue-btn" disabled={actionLoading}>Back to Event <ChevronRight className="icon-small"/></button> {/* Back to EventView */}
        </div>
      </div>
    );
  }
  const q = quizContent.questions[currentQIdx];
  return (
    <div className="quiz-view practice-view"> {/* Added practice-view class */}
      <button onClick={() => navigate('eventView', {id: quizData.moduleId})} className="back-btn" disabled={actionLoading}><ChevronRight className="icon rotated"/> Back to Event</button> {/* Back to EventView */}
      <div className="quiz-header-info">
          <ListChecks className="lesson-type-icon-large" style={{color: selectedEvent ? `var(--color-${selectedEvent.color}-500)` : 'var(--theme-primary)'}}/>
          <h2>{quizContent.title} (MCQ)</h2>
          <div className="quiz-progress"><span>Question {currentQIdx + 1}/{quizContent.questions.length}</span><div className="progress-bar"><div style={{width: `${((currentQIdx+1)/quizContent.questions.length)*100}%`}}/></div></div>
      </div>
      <div className="question-card">
        <h3>{q.question}</h3>
        <div className="options-list">
          {q.options.map((opt, i) =>
              <button
                  key={i}
                  className={`option-btn ${selectedAns === i ? 'selected' : ''} ${showExplanation && q.correct === i ? 'correct' : ''} ${showExplanation && selectedAns === i && q.correct !== i ? 'incorrect' : ''}`}
                  onClick={() => handleAnsSelect(i)}
                  disabled={showExplanation || actionLoading}>
                  <span className="option-letter">{String.fromCharCode(65+i)}</span>{opt}
              </button>
          )}
        </div>
        {showExplanation && q.explanation && (
          <div className="explanation-box">
            <strong>Explanation:</strong> {q.explanation}
          </div>
        )}
        {!showExplanation && <button className="submit-btn" disabled={selectedAns === null || actionLoading} onClick={handleSubmitAnswer}>Submit Answer</button>}
        {showExplanation && <button className="submit-btn" onClick={handleNextQ} disabled={actionLoading}>{currentQIdx + 1 === quizContent.questions.length ? 'Finish Practice' : 'Next Question'}</button>}
      </div>
    </div>
  );
};

// GameView is removed for Sciolytics initial version. This can be added back later if specific interactive "games" are designed.
// const GameView = (...) => { ... };

// Renamed TeamsView to StudyGroupsView
const StudyGroupsView = ({
  user,
  userTeam, // userTeam is userStudyGroup
  actionLoading,
  joinTeamCodeInput,
  setJoinTeamCodeInput,
  createTeamNameInput,
  setCreateTeamNameInput,
  onJoinTeam, // onJoinStudyGroup
  onCreateTeam, // onCreateStudyGroup
  onLeaveTeam, // onLeaveStudyGroup
  onDeleteTeam // onDeleteStudyGroup
}) => {
  const userStudyGroup = userTeam;
  return (
    <div className="teams-view study-groups-view"> {/* Added study-groups-view class */}
      <div className="view-header"> <UsersRound className="header-icon" /> <h1>My Study Group</h1> <p>Manage your study group or join/create a new one.</p> </div>
      {userStudyGroup ? (
        <div className="current-team-card current-study-group-card"> {/* Renamed class */}
          <div className="team-card-main">
            <UsersRound size={48} className="team-avatar-icon" style={{color: `var(--color-${userStudyGroup.color || 'blue'}-500)`}}/>
            <div>
                <h2>{userStudyGroup.name}</h2>
                <p className="team-description-small">{userStudyGroup.description}</p>
                <p><strong>Group Code:</strong> <code className="team-code-display">{userStudyGroup.code}</code> (Share this!)</p>
                <p>{(userStudyGroup.memberIds ? userStudyGroup.memberIds.length : 0)} members • Rank #{userStudyGroup.rank || 'N/A'} • {(userStudyGroup.totalXP || 0).toLocaleString()} Total XP</p>
            </div>
          </div>
          <div className="team-management-actions">
            <button className="leave-team-btn" onClick={onLeaveTeam} disabled={actionLoading}>{actionLoading ? 'Processing...' : 'Leave Group'}</button>
            {user && userStudyGroup.creatorId === user.id && (
                <button className="delete-team-btn" onClick={onDeleteTeam} disabled={actionLoading}>
                    <Trash2 size={16} /> {actionLoading ? 'Deleting...' : 'Delete Group'}
                </button>
            )}
          </div>
        </div>
      ) : (
        <div className="no-team-actions">
          <div className="team-action-card">
            <h3>Join an Existing Study Group</h3> <p>Enter the code shared by a group leader.</p>
            <div className="input-group">
              <input type="text" placeholder="Enter group code" value={joinTeamCodeInput} onChange={(e) => setJoinTeamCodeInput(e.target.value.toUpperCase())} disabled={actionLoading} />
              <button onClick={() => onJoinTeam()} disabled={actionLoading || !joinTeamCodeInput}>{actionLoading ? 'Processing...' : 'Join Group'}</button>
            </div>
          </div>
          <div className="divider-or">OR</div>
          <div className="team-action-card">
            <h3>Create a New Study Group</h3> <p>Start your own Sciolytics squad!</p>
            <div className="input-group">
              <input type="text" placeholder="Enter new group name" value={createTeamNameInput} onChange={(e) => setCreateTeamNameInput(e.target.value)} disabled={actionLoading} />
              <button onClick={onCreateTeam} disabled={actionLoading || !createTeamNameInput}>{actionLoading ? 'Processing...' : 'Create Group'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Renamed BrowseTeamsView to BrowseGroupsView
const BrowseGroupsView = ({ allTeams, actionLoading, user, currentView, fetchAllTeams, userTeam, onJoinTeam }) => { // allTeams is allStudyGroups, userTeam is userStudyGroup
  const allStudyGroups = allTeams;
  const userStudyGroup = userTeam;

  const [searchTerm, setSearchTerm] = useState('');
  const filteredAndSortedGroups = useMemo(() =>
      allStudyGroups
          .filter(group =>
              group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (group.description && group.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
              group.code.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .sort((a,b) => (b.totalXP || 0) - (a.totalXP || 0) || a.name.localeCompare(b.name)),
      [allStudyGroups, searchTerm]
  );

  useEffect(() => {
      if (user && (currentView === 'browseGroups' && allStudyGroups.length === 0 && !actionLoading)) {
          fetchAllTeams(); // fetchAllStudyGroups
      }
  }, [currentView, allStudyGroups.length, fetchAllTeams, user, actionLoading]);

  return (
    <div className="browse-teams-view browse-groups-view"> {/* Added browse-groups-view class */}
      <div className="view-header"> <Eye className="header-icon" /> <h1>Browse All Study Groups</h1> <p>Find a group, see who's collaborating, or get inspired!</p> </div>
      <div className="search-bar-container"> <Search className="search-icon" /> <input type="text" placeholder="Search by name, description, or code..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="teams-search-input" /> </div>
      {actionLoading && allStudyGroups.length === 0 && <div className="full-page-loader"><div className="spinner"></div><p>Loading groups...</p></div>}
      {!actionLoading && allStudyGroups.length === 0 && currentView === 'browseGroups' ? (
        <p className="info-message">No study groups exist yet. Go to "My Study Group" to create one!</p>
      ) : filteredAndSortedGroups.length > 0 ? (
        <div className="teams-grid">
          {filteredAndSortedGroups.map(group => (
            <div key={group.id} className="team-browse-card study-group-browse-card"> {/* Renamed class */}
              <div className="team-card-header"><h3>{group.name}</h3><span className="team-code-badge">CODE: {group.code}</span></div>
              <p className="team-description">{group.description || "No description available."}</p>
              <div className="team-card-footer">
                <span><UsersRound size={16} /> {(group.memberIds ? group.memberIds.length : 0)} Members</span> <span><Trophy size={16} /> {(group.totalXP || 0).toLocaleString()} XP</span>
                {(!userStudyGroup || userStudyGroup.id !== group.id) && <button onClick={() => onJoinTeam(group.code)} className="join-team-browse-btn" disabled={actionLoading || !!userStudyGroup}>{!!userStudyGroup ? 'In a Group' : (actionLoading ? 'Processing...' : 'Join Group')}</button>}
                {userStudyGroup && userStudyGroup.id === group.id && <span className="current-team-indicator"><Check size={16}/> Your Group</span>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        !actionLoading && <p className="info-message">No study groups match your search criteria.</p>
      )}
    </div>
  );
};

// Renamed LeaderboardView
const LeaderboardView = ({ allTeams, actionLoading, user, currentView, fetchAllTeams, userTeam }) => { // allTeams is allStudyGroups, userTeam is userStudyGroup
  const allStudyGroups = allTeams;
  const userStudyGroup = userTeam;

  const sortedLeaderboard = useMemo(() =>
      [...allStudyGroups].sort((a, b) => (b.totalXP || 0) - (a.totalXP || 0)).map((group, index) => ({ ...group, rank: index + 1 })),
      [allStudyGroups]
  );

  useEffect(() => {
      if (user && (currentView === 'leaderboard' && allStudyGroups.length === 0 && !actionLoading)) {
          fetchAllTeams(); // fetchAllStudyGroups
      }
  }, [currentView, allStudyGroups.length, fetchAllTeams, user, actionLoading]);

  return (
    <div className="leaderboard-view">
      <div className="view-header"> <Trophy className="header-icon" /> <h1>Global Study Group Leaderboard</h1> <p>See how groups stack up in the Sciolytics universe!</p> </div>
      {actionLoading && sortedLeaderboard.length === 0 && <div className="full-page-loader"><div className="spinner"></div><p>Loading leaderboard...</p></div>}
      <div className="leaderboard-list">
        {!actionLoading && sortedLeaderboard.length > 0 ? sortedLeaderboard.map((group) => (
          <div key={group.id} className={`leaderboard-item ${userStudyGroup && group.id === userStudyGroup.id ? 'current-team current-study-group' : ''}`}> {/* Renamed class */}
            <span className="rank-badge">#{group.rank}</span>
            <div className="team-info"><h3>{group.name}</h3> <p>{(group.memberIds ? group.memberIds.length : 0)} members • Code: {group.code}</p></div>
            <span className="team-xp">{(group.totalXP || 0).toLocaleString()} XP</span>
          </div>
        )) : !actionLoading && <p className="info-message">The leaderboard is currently empty. Create or join a study group to get started!</p>}
      </div>
    </div>
  );
};

// Renamed VexpertChallengeView to SciolyticsChallengeView
const SciolyticsChallengeView = ({
    user, actionLoading, challengeState, vexpertChallengeBank, // vexpertChallengeBank is sciolyticsChallengeBank
    selectedChallengeCategories, setSelectedChallengeCategories, availableChallengeCategories,
    numChallengeQuestionsInput, setNumChallengeQuestionsInput, onStartChallenge,
    challengeQuestions, currentChallengeQuestionIdx, challengeTimer, showChallengeAnswer, challengeScore,
    onChallengeAnswer, onNextChallengeQuestion, onResetChallenge, questionTimerDuration, navigate
}) => {
    const sciolyticsChallengeBank = vexpertChallengeBank;
    if (actionLoading && challengeState === 'idle') {
        return <div className="full-page-loader"><div className="spinner"></div><p>Preparing Challenge...</p></div>;
    }

    if (challengeState === 'idle') {
      return (
        <div className="challenge-view">
          <div className="view-header">
            <BrainCircuit className="header-icon" style={{color: 'var(--theme-accent)'}} /> {/* Changed Icon */}
            <h1>Knowledge Challenge</h1>
            <p>Test your Science Olympiad knowledge! Answer a series of questions and earn XP.</p>
          </div>
          <div className="challenge-idle-content">
            <h2>Ready to Test Your Expertise?</h2>
            <div className="challenge-config">
              <div className="config-item">
                <label htmlFor="numQuestionsConfig">Number of Questions:</label>
                <select
                  id="numQuestionsConfig"
                  value={numChallengeQuestionsInput}
                  onChange={(e) => setNumChallengeQuestionsInput(Number(e.target.value))}
                  disabled={actionLoading}
                >
                  {[3, 5, 7, 10, 15, sciolyticsChallengeBank.length] // Used sciolyticsChallengeBank
                    .filter((val, idx, self) => self.indexOf(val) === idx && val <= sciolyticsChallengeBank.length && val > 0)
                    .sort((a,b) => a-b)
                    .map(num => (
                      <option key={num} value={num}>
                        {num === sciolyticsChallengeBank.length ? `All (${sciolyticsChallengeBank.length})` : num}
                      </option>
                  ))}
                </select>
              </div>
              <div className="config-item">
                <label>Categories (select at least one):</label>
                <div className="category-checkboxes">
                  {availableChallengeCategories.map(category => (
                    <div key={category} className="category-checkbox-item">
                      <input
                        type="checkbox"
                        id={`cat-config-${category}`}
                        value={category}
                        checked={selectedChallengeCategories.includes(category)}
                        onChange={(e) => {
                          const cat = e.target.value;
                          setSelectedChallengeCategories(prev =>
                            e.target.checked ? [...prev, cat] : prev.filter(c => c !== cat)
                          );
                        }}
                        disabled={actionLoading}
                      />
                      <label htmlFor={`cat-config-${category}`}>{category}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p>You'll face {numChallengeQuestionsInput} questions from selected categories. Each question is timed. Aim for accuracy and speed!</p>
            <button
              className="challenge-action-btn start-challenge-btn"
              onClick={onStartChallenge}
              disabled={actionLoading || selectedChallengeCategories.length === 0 || numChallengeQuestionsInput <= 0}
            >
              {actionLoading ? 'Loading...' : `Start ${numChallengeQuestionsInput}-Question Challenge`}
            </button>
          </div>
        </div>
      );
    }

    if (challengeState === 'active' && challengeQuestions.length > 0) {
      const currentQuestion = challengeQuestions[currentChallengeQuestionIdx];
      return (
        <div className="challenge-view active-challenge">
          <div className="challenge-header">
            <h2>Question {currentChallengeQuestionIdx + 1} / {challengeQuestions.length}</h2>
            <div className="challenge-timer">
                <Clock size={18} /> Time Left: <span className={challengeTimer <=10 ? 'timer-critical': ''}>{challengeTimer}s</span> {/* Adjusted critical time */}
            </div>
            <div className="challenge-score">Score: {challengeScore}</div>
          </div>
          <div className="challenge-question-card">
            <p className="question-category-tag">{currentQuestion.category} - {currentQuestion.difficulty}</p>
            <h3>{currentQuestion.question}</h3>
            <div className="challenge-options-list">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  className={`challenge-option-btn
                    ${currentQuestion.selectedAnswer === index ? 'selected' : ''}
                    ${showChallengeAnswer && currentQuestion.correctAnswerIndex === index ? 'correct' : ''}
                    ${showChallengeAnswer && currentQuestion.selectedAnswer === index && currentQuestion.correctAnswerIndex !== index ? 'incorrect' : ''}
                  `}
                  onClick={() => onChallengeAnswer(index)}
                  disabled={showChallengeAnswer || actionLoading}
                >
                  <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                  {option}
                </button>
              ))}
            </div>
            {showChallengeAnswer && (
              <div className="challenge-feedback">
                {currentQuestion.selectedAnswer === currentQuestion.correctAnswerIndex ?
                  <p className="feedback-correct"><Check size={20}/> Correct!</p> :
                  <p className="feedback-incorrect"><X size={20}/> Incorrect. The correct answer was {String.fromCharCode(65 + currentQuestion.correctAnswerIndex)}.</p>
                }
                {currentQuestion.explanation && <p className="explanation-text"><em>Explanation:</em> {currentQuestion.explanation}</p>}
                <button className="challenge-action-btn next-question-btn" onClick={onNextChallengeQuestion} disabled={actionLoading}>
                  {currentChallengeQuestionIdx < challengeQuestions.length - 1 ? 'Next Question' : 'Finish Challenge'}
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (challengeState === 'results') {
      const percentage = challengeQuestions.length > 0 ? Math.round((challengeScore / challengeQuestions.length) * 100) : 0;
      const xpAwarded = challengeQuestions.length > 0 ? Math.round((challengeScore / challengeQuestions.length) * CHALLENGE_MAX_XP) : 0;
      return (
        <div className="challenge-view challenge-results">
          <div className="view-header">
            <BarChartHorizontal className="header-icon" style={{color: 'var(--theme-accent)'}} /> {/* Changed Icon */}
            <h1>Challenge Results</h1>
          </div>
          <div className="results-summary">
            <p>You answered {challengeScore} out of {challengeQuestions.length} questions correctly ({percentage}%).</p>
            <p className="xp-earned-challenge">You've earned {xpAwarded} XP!</p>
          </div>
          <div className="challenge-ended-options">
            <button className="challenge-action-btn play-again-btn" onClick={onResetChallenge} disabled={actionLoading}>Configure New Challenge</button>
            <button className="challenge-action-btn back-dashboard-btn" onClick={() => navigate('dashboard')} disabled={actionLoading}>Back to Dashboard</button>
          </div>
        </div>
      );
    }
    return <div className="challenge-view"><p>Loading challenge state...</p></div>;
  };


// --- Main App Component ---
const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [currentView, setCurrentView] = useState('login');
  const [selectedEvent, setSelectedEvent] = useState(null); // Renamed from selectedModule
  const [currentLesson, setCurrentLesson] = useState(null);
  const [userStudyGroup, setUserStudyGroup] = useState(null); // Renamed from userTeam
  const [userProgress, setUserProgress] = useState({});
  const [practiceSetData, setPracticeSetData] = useState(null); // Renamed from quizData (for MCQs)
  // gameData removed for Sciolytics v1

  const [joinGroupCodeInput, setJoinGroupCodeInput] = useState(''); // Renamed from joinTeamCodeInput
  const [createGroupNameInput, setCreateGroupNameInput] = useState(''); // Renamed from createTeamNameInput
  const [allStudyGroups, setAllStudyGroups] = useState([]); // Renamed from allTeams

  // Challenge State (VexpertChallenge -> SciolyticsChallenge)
  const [challengeState, setChallengeState] = useState('idle');
  const [challengeQuestions, setChallengeQuestions] = useState([]);
  const [currentChallengeQuestionIdx, setCurrentChallengeQuestionIdx] = useState(0);
  const [challengeScore, setChallengeScore] = useState(0);
  const [challengeSelectedAnswer, setChallengeSelectedAnswer] = useState(null);
  const [showChallengeAnswer, setShowChallengeAnswer] = useState(false);
  const [challengeTimer, setChallengeTimer] = useState(QUESTION_TIMER_DURATION);
  const [numChallengeQuestionsInput, setNumChallengeQuestionsInput] = useState(QUESTIONS_PER_CHALLENGE);
  const [availableChallengeCategories, setAvailableChallengeCategories] = useState([]);
  const [selectedChallengeCategories, setSelectedChallengeCategories] = useState([]);


  // Sciolytics Learning Modules (Science Olympiad Events)
  const sciolyEvents = useMemo(() => [
    {
      id: slugify('Anatomy and Physiology'), category: 'Life Science', title: 'Anatomy and Physiology',
      description: 'Understand the structure and function of human body systems. Focus on nervous, endocrine, and sensory systems for 2025-26.',
      duration: 'Approx. 60 min', lessons: 3, difficulty: 'Intermediate', color: 'green', icon: Brain, // Lucide Icon
      content: {
        lessons: [
          { id: slugify('Nervous System Overview'), title: 'Nervous System Overview', type: 'lesson', xp: 20, contentDetail: generateContentDetail('Nervous System Overview', "Explore neurons, brain structures, and nerve impulses. Includes key terminology and diagrams.", "lesson") },
          { id: slugify('Anatomy MCQs Set 1'), title: 'Anatomy MCQs Set 1', type: 'mcq', xp: 25, contentDetail: "Test your knowledge on basic anatomy." },
          { id: slugify('Endocrine System FRQ'), title: 'Endocrine System FRQ', type: 'frq', xp: 30, contentDetail: generateContentDetail("Endocrine System FRQ", "FRQ Prompt: Describe the feedback loop involving insulin and glucagon in blood sugar regulation. Include the organs and hormones involved.", "FRQ"), modelAnswer: "The pancreas (islets of Langerhans) secretes insulin when blood glucose is high, promoting glucose uptake by cells and storage as glycogen in the liver. Glucagon is secreted when blood glucose is low, stimulating the liver to convert glycogen to glucose and release it into the bloodstream. This is a negative feedback loop." },
        ]
      }
    },
    {
      id: slugify('Astronomy'), category: 'Earth & Space Science', title: 'Astronomy',
      description: 'Journey through stellar evolution, star formation, and exoplanets.',
      duration: 'Approx. 75 min', lessons: 2, difficulty: 'Advanced', color: 'purple', icon: Telescope, // Lucide Icon
      content: {
        lessons: [
          { id: slugify('Stellar Evolution Basics'), title: 'Stellar Evolution Basics', type: 'lesson', xp: 25, contentDetail: generateContentDetail('Stellar Evolution Basics', "Learn about the lifecycle of stars, from nebulae to black holes or white dwarfs.", "lesson") },
          { id: slugify('Astronomy MCQs'), title: 'Astronomy MCQs', type: 'mcq', xp: 30, contentDetail: "Test your knowledge on celestial objects and theories." },
        ]
      }
    },
     {
      id: slugify('Chemistry Lab'), category: 'Physical Science & Chemistry', title: 'Chemistry Lab',
      description: 'Focus on concepts of periodicity and equilibrium. Hands-on knowledge and calculations.',
      duration: 'Approx. 90 min', lessons: 3, difficulty: 'Advanced', color: 'orange', icon: Beaker,
      content: {
        lessons: [
          { id: slugify('Periodicity Trends'), title: 'Periodicity Trends', type: 'lesson', xp: 20, contentDetail: generateContentDetail('Periodicity Trends', "Explore atomic radius, ionization energy, and electronegativity.", "lesson") },
          { id: slugify('Equilibrium MCQs'), title: 'Equilibrium MCQs', type: 'mcq', xp: 30, contentDetail: "Test your knowledge on chemical equilibrium." },
          { id: slugify('Chem Lab Safety FRQ'), title: 'Chem Lab Safety FRQ', type: 'frq', xp: 25, contentDetail: generateContentDetail("Chem Lab Safety FRQ", "FRQ Prompt: List five essential safety precautions to take before starting any chemistry lab experiment.", "FRQ"), modelAnswer: "1. Wear appropriate PPE (goggles, lab coat, gloves). 2. Know the location of safety equipment (eyewash, shower, fire extinguisher). 3. Read and understand the experimental procedure beforehand. 4. Never eat or drink in the lab. 5. Properly label all chemicals and waste containers." },
        ]
      }
    },
    {
        id: slugify('Disease Detectives'), category: 'Life Science', title: 'Disease Detectives',
        description: 'Use investigative skills in the scientific study of disease, injury, health, and disability in populations.',
        duration: 'Approx. 60 min', lessons: 2, difficulty: 'Intermediate', color: 'red', icon: Microscope,
        content: {
            lessons: [
                { id: slugify('Epidemiology Basics'), title: 'Epidemiology Basics', type: 'lesson', xp: 20, contentDetail: generateContentDetail('Epidemiology Basics', "Learn about study types, measures of association, and outbreak investigation.", "lesson") },
                { id: slugify('Disease Detectives MCQs'), title: 'Disease Detectives MCQs', type: 'mcq', xp: 25, contentDetail: "Test your epidemiological knowledge." },
            ]
        }
    },
    {
        id: slugify('Write It Do It'), category: 'Inquiry & Nature of Science', title: 'Write It Do It',
        description: 'One student writes a description of an object and how to build it, and the other student attempts to reconstruct the object from the description.',
        duration: 'Approx. 45 min', lessons: 2, difficulty: 'Beginner', color: 'blue', icon: Edit3,
        content: {
            lessons: [
                { id: slugify('Effective Technical Writing'), title: 'Effective Technical Writing', type: 'lesson', xp: 15, contentDetail: generateContentDetail('Effective Technical Writing', "Tips for clear, concise, and unambiguous instructions.", "lesson") },
                { id: slugify('Spatial Reasoning Practice'), title: 'Spatial Reasoning Practice', type: 'lesson', xp: 15, contentDetail: generateContentDetail('Spatial Reasoning Practice', "Visual exercises to improve your ability to interpret and build from descriptions.", "lesson") },
            ]
        }
    },
    // Add more SciOly events here...
  ], []);

  // Sample MCQs for Sciolytics (Practice Sets)
  const sampleMcqs = useMemo(() => ({
    'anatomy-mcqs-set-1': {
      title: 'Anatomy Basics MCQs',
      questions: [
        { id: 1, question: 'Which part of the neuron transmits signals to other neurons?', options: ['Dendrite', 'Soma', 'Axon', 'Myelin Sheath'], correct: 2, explanation: 'The axon is responsible for transmitting electrical impulses away from the neuron\'s cell body.' },
        { id: 2, question: 'The pituitary gland is often called the "master gland" because it:', options: ['Is the largest gland', 'Controls several other hormone glands', 'Is located in the brain', 'Produces adrenaline'], correct: 1, explanation: 'The pituitary gland controls many other endocrine glands by releasing hormones that regulate their function.' },
      ]
    },
    'astronomy-mcqs': {
      title: 'Stellar Concepts MCQs',
      questions: [
        { id: 1, question: 'What is the primary fuel for main-sequence stars like our Sun?', options: ['Helium', 'Oxygen', 'Hydrogen', 'Carbon'], correct: 2, explanation: 'Main-sequence stars primarily fuse hydrogen into helium in their cores.' },
        { id: 2, question: 'A very massive star will likely end its life as a:', options: ['White Dwarf', 'Neutron Star or Black Hole', 'Red Giant', 'Planetary Nebula'], correct: 1, explanation: 'Stars much more massive than the Sun undergo a supernova and can leave behind a neutron star or, if massive enough, a black hole.' },
      ]
    },
    'equilibrium-mcqs': {
        title: 'Chemical Equilibrium MCQs',
        questions: [
            {id: 1, question: 'For the reaction A + B <=> C + D, what does a Keq > 1 imply?', options: ['More reactants than products at equilibrium', 'More products than reactants at equilibrium', 'Reaction has stopped', 'Reaction is very slow'], correct: 1, explanation: 'A Keq > 1 indicates that the concentration of products is greater than the concentration of reactants at equilibrium.'},
            {id: 2, question: 'Which of these changes will shift an exothermic reaction\'s equilibrium towards the products? N2(g) + 3H2(g) <=> 2NH3(g) + heat', options: ['Increasing temperature', 'Decreasing temperature', 'Adding a catalyst', 'Increasing volume'], correct: 1, explanation: 'For an exothermic reaction, decreasing the temperature will shift the equilibrium to the right (towards products) to produce more heat, according to Le Chatelier\'s Principle.'}
        ]
    },
    'disease-detectives-mcqs': {
        title: 'Epidemiology MCQs',
        questions: [
            {id: 1, question: 'Which type of epidemiological study is best for determining the cause of a rare disease?', options:['Cohort Study', 'Cross-sectional Study', 'Case-Control Study', 'Randomized Controlled Trial'], correct: 2, explanation: 'Case-control studies are efficient for rare diseases as they start by identifying cases (people with the disease) and then look back for exposures.'},
        ]
    }
    // Add more MCQ sets
  }), []);

  // sampleGames removed, FRQs handled via 'lesson' type in learningModules or a dedicated FRQ view in future.

  // Sciolytics Knowledge Challenge Bank
  const sciolyticsChallengeBank = useMemo(() => [
    { id: 'scq1', category: 'Life Science', difficulty: 'Easy', question: 'What is the powerhouse of the cell?', options: ['Nucleus', 'Ribosome', 'Mitochondria', 'Golgi Apparatus'], correctAnswerIndex: 2, explanation: 'Mitochondria are responsible for generating most of the cell\'s supply of ATP through cellular respiration.' },
    { id: 'scq2', category: 'Earth & Space Science', difficulty: 'Medium', question: 'Which planet is known as the Red Planet?', options: ['Venus', 'Mars', 'Jupiter', 'Saturn'], correctAnswerIndex: 1, explanation: 'Mars is called the Red Planet due to the iron oxide prevalent on its surface.' },
    { id: 'scq3', category: 'Physical Science & Chemistry', difficulty: 'Easy', question: 'What is the chemical symbol for water?', options: ['HO2', 'O2H', 'H2O', 'Wa'], correctAnswerIndex: 2, explanation: 'H2O represents two hydrogen atoms and one oxygen atom.' },
    { id: 'scq4', category: 'Inquiry & Nature of Science', difficulty: 'Medium', question: 'What is the first step in the scientific method?', options: ['Formulate a hypothesis', 'Conduct an experiment', 'Make an observation/Ask a question', 'Analyze data'], correctAnswerIndex: 2, explanation: 'The scientific method typically begins with an observation or a question about the natural world.' },
    { id: 'scq5', category: 'Technology & Engineering', difficulty: 'Medium', question: 'In simple machines, what is mechanical advantage?', options: ['The speed of the machine', 'The ratio of output force to input force', 'The efficiency of the machine', 'The weight of the machine'], correctAnswerIndex: 1, explanation: 'Mechanical advantage is a measure of the force amplification achieved by using a tool, mechanical device or machine system.'},
    // Add more challenge questions
  ], []);

  const fetchUserProfile = useCallback(async (firebaseUserId) => {
    console.log("Attempting to fetch user profile for Firebase UID:", firebaseUserId);
    if (!db) {
      console.error("[Sciolytics_App.js_fetchUserProfile] Firestore 'db' instance is not available. Firebase might not be initialized correctly.");
      return null;
    }
    try {
      const userDocRef = doc(db, "users", firebaseUserId);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        console.log("Profile found in Firestore for Firebase UID:", firebaseUserId, userSnap.data());
        return { id: userSnap.id, ...userSnap.data() };
      }
      console.log("No profile in Firestore for Firebase UID:", firebaseUserId);
      return null;
    } catch (error) {
      console.error("Error in fetchUserProfile for Firebase UID:", firebaseUserId, error);
      return null;
    }
  }, []);

  const fetchUserProgress = useCallback(async (firebaseUserId) => {
    console.log("Attempting to fetch user progress for Firebase UID:", firebaseUserId);
    if (!db) {
      console.error("[Sciolytics_App.js_fetchUserProgress] Firestore 'db' instance is not available.");
      return;
    }
    try {
      const progressColRef = collection(db, `users/${firebaseUserId}/progress`);
      const progressSnap = await getDocs(progressColRef);
      const loadedProgress = {};
      progressSnap.forEach((docSnap) => {
        loadedProgress[docSnap.id] = docSnap.data();
      });
      setUserProgress(loadedProgress);
      console.log("User progress fetched for Firebase UID:", firebaseUserId, loadedProgress);
    } catch (error) {
      console.error("Error in fetchUserProgress for Firebase UID:", firebaseUserId, error);
    }
  }, []);

  const fetchUserStudyGroup = useCallback(async (groupId, currentUserIdToUpdate) => { // Renamed from fetchUserTeam
    console.log("Attempting to fetch study group with ID:", groupId);
    if (!groupId) { setUserStudyGroup(null); console.log("No groupId provided to fetchUserStudyGroup."); return null; }
    if (!db) { console.error("[Sciolytics_App.js_fetchUserStudyGroup] Firestore 'db' instance is not available."); return null; }

    try {
      const groupDocRef = doc(db, "studyGroups", groupId); // Changed collection name "teams" to "studyGroups"
      const groupSnap = await getDoc(groupDocRef);
      if (groupSnap.exists()) {
        const groupData = { id: groupSnap.id, ...groupSnap.data() };
        if (!Array.isArray(groupData.memberIds)) {
            groupData.memberIds = [];
        }
        setUserStudyGroup(groupData);
        console.log("Study group data fetched:", groupData);
        return groupData;
      } else {
        setUserStudyGroup(null);
        console.warn("Study group document not found for ID:", groupId);
        if (currentUserIdToUpdate) {
          console.log("Attempting to clear dangling groupId from user profile:", currentUserIdToUpdate);
          const userRef = doc(db, "users", currentUserIdToUpdate);
          await updateDoc(userRef, { studyGroupId: null }); // Changed field name
          setUser(prevUser => {
            if (prevUser && prevUser.id === currentUserIdToUpdate) {
              return { ...prevUser, studyGroupId: null };
            }
            return prevUser;
          });
          console.log("Dangling groupId cleared from user profile:", currentUserIdToUpdate);
        }
        return null;
      }
    } catch (error) {
      console.error("Error in fetchUserStudyGroup for group ID:", groupId, error);
      setUserStudyGroup(null);
      return null;
    }
  }, []);

  useEffect(() => {
    console.log("Sciolytics_App.js: Auth listener effect is running.");
    if (!auth) {
      console.error("Sciolytics_App.js: Firebase 'auth' service is not available in onAuthStateChanged. Firebase might not be initialized correctly in Sciolytics_Firebase.js or imported incorrectly.");
      setLoading(false);
      setMessage("Critical Firebase Error: Auth service not loaded. Please check console and Sciolytics_Firebase.js configuration.");
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseAuthUser) => {
      console.log("Sciolytics_App.js: onAuthStateChanged triggered. Firebase Auth User:", firebaseAuthUser ? firebaseAuthUser.uid : 'null');

      try {
        if (firebaseAuthUser) {
          console.log("Sciolytics_App.js: Firebase Auth User signed in. UID:", firebaseAuthUser.uid);
          setMessage("Firebase authenticated. Loading your Sciolytics profile...");

          let userProfile = await fetchUserProfile(firebaseAuthUser.uid);

          if (!userProfile) {
            console.log("Sciolytics_App.js: No Firestore profile for UID:", firebaseAuthUser.uid, ". Creating new profile.");
            setMessage("Welcome! Creating your Sciolytics profile...");
            const newUserProfileData = {
              id: firebaseAuthUser.uid,
              name: firebaseAuthUser.displayName || `Student${firebaseAuthUser.uid.substring(0,5)}`, // Changed default name
              email: firebaseAuthUser.email || `${firebaseAuthUser.uid.substring(0,5)}@example.com`,
              avatar: firebaseAuthUser.photoURL || `https://source.boringavatars.com/beam/120/${firebaseAuthUser.email || firebaseAuthUser.uid}?colors=4A90E2,86C4EB,F0F8FF,BDC3C7,7f8c8d`, // Sciolytics colors
              xp: 0, level: 1, streak: 0, studyGroupId: null, // Renamed teamId
              createdAt: serverTimestamp(), lastLogin: serverTimestamp(),
            };
            console.log("[Sciolytics_App.js] Attempting to create user profile with data:", JSON.stringify(newUserProfileData));
            if (!db) {
              console.error("Sciolytics_App.js: Firestore 'db' instance is NOT available for creating profile.");
              throw new Error("Firestore not available for profile creation. Check Sciolytics_Firebase.js and initialization logs.");
            }
            await setDoc(doc(db, "users", firebaseAuthUser.uid), newUserProfileData);
            userProfile = newUserProfileData;
            console.log("Sciolytics_App.js: New Firestore profile CREATED for UID:", firebaseAuthUser.uid);
          } else {
            console.log("Sciolytics_App.js: Existing Firestore profile FOUND for UID:", firebaseAuthUser.uid, ". Updating profile.");
             setMessage("Profile found. Finalizing login...");
            const profileUpdates = { lastLogin: serverTimestamp() };
            if (firebaseAuthUser.displayName && firebaseAuthUser.displayName !== userProfile.name) {
              profileUpdates.name = firebaseAuthUser.displayName;
            }
            if (firebaseAuthUser.photoURL && firebaseAuthUser.photoURL !== userProfile.avatar) {
              profileUpdates.avatar = firebaseAuthUser.photoURL;
            }
            if (firebaseAuthUser.email && firebaseAuthUser.email !== userProfile.email) {
                profileUpdates.email = firebaseAuthUser.email;
            }

            if (Object.keys(profileUpdates).length > 0) {
                console.log("[Sciolytics_App.js] Attempting to update user profile with data:", JSON.stringify(profileUpdates));
                if (!db) {
                  console.error("Sciolytics_App.js: Firestore 'db' instance is NOT available for updating profile.");
                  throw new Error("Firestore not available for profile update. Check Sciolytics_Firebase.js and initialization logs.");
                }
                await updateDoc(doc(db, "users", firebaseAuthUser.uid), profileUpdates);
            }
            userProfile = { ...userProfile, ...profileUpdates };
            console.log("Sciolytics_App.js: Firestore profile UPDATED for UID:", firebaseAuthUser.uid);
          }

          setUser(userProfile);
          console.log("Sciolytics_App.js: User state (Firestore profile) set. Fetching progress for UID:", firebaseAuthUser.uid);
          await fetchUserProgress(firebaseAuthUser.uid);

          if (userProfile.studyGroupId) { // Renamed from teamId
            console.log("Sciolytics_App.js: User has studyGroupId:", userProfile.studyGroupId, ". Fetching group data.");
            const fetchedGroup = await fetchUserStudyGroup(userProfile.studyGroupId, userProfile.id);
            if (!fetchedGroup) {
                setUser(prev => ({...prev, studyGroupId: null}));
            }
          } else {
            setUserStudyGroup(null);
            console.log("Sciolytics_App.js: User has no studyGroupId.");
          }

          setCurrentView('dashboard');
          setMessage('');
          console.log("Sciolytics_App.js: User setup complete. View set to dashboard.");

        } else {
          console.log("Sciolytics_App.js: No Firebase Auth User signed in. Resetting user state.");
          setUser(null); setUserStudyGroup(null); setUserProgress({});
          setCurrentView('login');
          setSelectedEvent(null); setCurrentLesson(null); // Renamed
          setMessage('');
        }
      } catch (error) {
        console.error("Sciolytics_App.js: CRITICAL ERROR within onAuthStateChanged async block:", error);
        console.error("Sciolytics_App.js: Firestore operation error details:", error.code, error.message, error.stack);
        setUser(null);
        setUserStudyGroup(null);
        setUserProgress({});
        setCurrentView('login');
        setMessage(`Error setting up your session: ${error.message}. Please check the console and Firebase project setup (Firestore enabled & correct rules).`);
        setActionLoading(false);
      } finally {
        console.log("Sciolytics_App.js: onAuthStateChanged finally block. setLoading(false).");
        setLoading(false);
      }
    });

    return () => {
      console.log("Sciolytics_App.js: Auth listener cleaning up.");
      unsubscribe();
    };
  }, [fetchUserProfile, fetchUserProgress, fetchUserStudyGroup]);


  useEffect(() => {
    // Combine categories from Scioly Events and Challenge Bank
    const categories = [...new Set(sciolyticsChallengeBank.map(q => q.category).concat(sciolyEvents.map(m => m.category)))].sort();
    setAvailableChallengeCategories(categories.filter(Boolean));
    if (categories.length > 0 && selectedChallengeCategories.length === 0) {
        setSelectedChallengeCategories(categories.filter(Boolean)); // Default to all categories
    }
  }, [sciolyticsChallengeBank, sciolyEvents, selectedChallengeCategories.length]);

  const handleChallengeAnswer = useCallback((selectedIndex) => {
    if (showChallengeAnswer) return;
    setShowChallengeAnswer(true);
    setChallengeSelectedAnswer(selectedIndex);
    setChallengeQuestions(prevQuestions => prevQuestions.map((q, idx) =>
        idx === currentChallengeQuestionIdx ? { ...q, selectedAnswer: selectedIndex } : q
    ));
    if (selectedIndex === challengeQuestions[currentChallengeQuestionIdx].correctAnswerIndex) {
      setChallengeScore(s => s + 1);
    }
  }, [showChallengeAnswer, challengeQuestions, currentChallengeQuestionIdx]);


  useEffect(() => {
    let interval;
    if (challengeState === 'active' && challengeTimer > 0 && !showChallengeAnswer) {
      interval = setInterval(() => {
        setChallengeTimer(prevTime => prevTime - 1);
      }, 1000);
    } else if (challengeState === 'active' && challengeTimer === 0 && !showChallengeAnswer) {
      handleChallengeAnswer(null); // Auto-submit if timer runs out (counts as wrong/no answer)
    }
    return () => clearInterval(interval);
  }, [challengeState, challengeTimer, showChallengeAnswer, handleChallengeAnswer]);


  const handleLoginSuccess = async (credentialResponse) => {
    console.log("Sciolytics_App.js: Google Login Button Success. Credential Token (start):", credentialResponse.credential ? credentialResponse.credential.substring(0,30)+"..." : "N/A");
    if (!auth) {
        console.error("Sciolytics_App.js: FATAL in handleLoginSuccess - Firebase 'auth' service is not available!");
        setMessage("Critical Firebase Error: Auth service not loaded. Cannot process login.");
        setActionLoading(false);
        return;
    }
    setMessage('Successfully authenticated with Google. Signing into Sciolytics...');
    setActionLoading(true);
    try {
      const idToken = credentialResponse.credential;
      const credential = FirebaseGoogleAuthProvider.credential(idToken);
      console.log("Sciolytics_App.js: Attempting Firebase signInWithCredential...");
      const firebaseAuthResult = await signInWithCredential(auth, credential);
      console.log("Sciolytics_App.js: Firebase signInWithCredential successful. Firebase User UID:", firebaseAuthResult.user.uid);
      // User profile creation/update is handled by onAuthStateChanged
    } catch (error) {
      console.error("Sciolytics_App.js: Error in handleLoginSuccess (Firebase signInWithCredential):", error);
      if (error.code === 'auth/configuration-not-found') {
          setMessage(`Firebase Config Error: ${error.message}. Please ensure Firebase is correctly configured with your project details in Sciolytics_Firebase.js.`);
      } else if (error.code === 'auth/network-request-failed') {
           setMessage(`Network error during Firebase sign-in: ${error.message}. Please check your internet connection.`);
      }
      else {
          setMessage(`Firebase sign-in error: ${error.message}. Please try again.`);
      }
      googleLogout(); // Ensure Google session is also logged out on Firebase error
      setActionLoading(false); // Reset loading state
    }
    // setLoading(false) is handled by onAuthStateChanged's finally block
  };


  const handleLoginError = (error) => {
    console.error("Sciolytics_App.js: Google Login Button Error (@react-oauth/google):", error);
    setMessage('Google login failed. Please ensure pop-ups are enabled and try again.');
    setActionLoading(false);
  };

  const handleLogout = async () => {
    console.log("Sciolytics_App.js: handleLogout called.");
    if (!auth) {
        console.error("Sciolytics_App.js: FATAL in handleLogout - Firebase 'auth' service is not available!");
        setMessage("Critical Firebase Error: Auth service not loaded. Cannot process logout.");
        // Force client-side state reset if auth is broken
        setUser(null); setUserStudyGroup(null); setUserProgress({}); setCurrentView('login');
        return;
    }
    setActionLoading(true);
    try {
      await firebaseSignOut(auth);
      googleLogout(); // From @react-oauth/google
      console.log("Sciolytics_App.js: Firebase sign out and Google logout successful.");
      // State reset (user, view, etc.) is handled by onAuthStateChanged
    } catch (error) {
      console.error("Sciolytics_App.js: Error during logout:", error);
      setMessage('Error during logout.');
    } finally {
      setActionLoading(false);
    }
  };

  const navigate = (view, data = null) => {
    setMessage(''); // Clear messages on navigation
    setCurrentView(view);
    if (data) {
      if (view === 'eventView') { // Renamed from 'module'
        const eventData = sciolyEvents.find(m => m.id === (data.id || data));
        setSelectedEvent(eventData);
        setCurrentLesson(null); // Reset current lesson when viewing an event overview
      } else if (view === 'lessonContent' && data.lesson && data.moduleId) {
        const eventForLesson = sciolyEvents.find(m => m.id === data.moduleId);
        if (eventForLesson) {
            setSelectedEvent(eventForLesson); // Set parent event context
            setCurrentLesson(data.lesson);
        } else {
            setMessage("Error: Event context for lesson not found.");
            setCurrentView('events'); // Navigate to events list
        }
      } else if (view === 'practiceView') setPracticeSetData({ moduleId: data.moduleId, lessonId: data.lesson.id, lesson: data.lesson }); // Renamed from 'quiz'
      // gameData related navigation removed
    } else {
      // Reset specific states if navigating away from them
      if (!['eventView', 'lessonContent', 'practiceView', 'challenge'].includes(view)) {
        setSelectedEvent(null); setCurrentLesson(null); setPracticeSetData(null);
      }
      if(view === 'challenge') { // Reset challenge state when navigating to it
        setChallengeState('idle');
        setChallengeScore(0);
        setCurrentChallengeQuestionIdx(0);
        setChallengeSelectedAnswer(null);
        setShowChallengeAnswer(false);
      }
    }
  };

  // Auto-clear messages after a delay
  useEffect(() => { if (message) { const t = setTimeout(() => setMessage(''), 7000); return () => clearTimeout(t); } }, [message]);

  // Handle user leveling up
  useEffect(() => {
    if (user && user.xp !== undefined && user.level !== undefined && (Math.floor(user.xp / XP_PER_LEVEL) + 1) > user.level) {
      const newLevel = Math.floor(user.xp/XP_PER_LEVEL)+1;
      setUser(prev => ({ ...prev, level: newLevel }));
      setMessage(`🎉 Level Up! You are now Level ${newLevel}! Keep going!`);
      if(user.id && db) { // Ensure db is available
          const userRef = doc(db, "users", user.id);
          updateDoc(userRef, { level: newLevel })
            .then(() => console.log("Sciolytics_App.js: Level updated in Firestore for UID:", user.id))
            .catch(err => console.error("Sciolytics_App.js: Error updating level in Firestore:", err));
      } else if (!db) { // Log error if db is not available
          console.error("Sciolytics_App.js: Cannot update level in Firestore, 'db' instance is not available.");
      }
    }
  }, [user]); // Removed db from dependency array as it should be stable or handled by auth check.


  const handleCompleteItem = async (moduleId, lessonId, itemType, score = null, xpEarned = 0) => {
    if (!user || !user.id) {setMessage("Error: User not identified."); console.error("Sciolytics_App.js: handleCompleteItem - User not identified."); return;}
    if (!db) {setMessage("Error: Database service unavailable."); console.error("Sciolytics_App.js: handleCompleteItem - DB not available."); return;}

    console.log(`Sciolytics_App.js: handleCompleteItem called for UID: ${user.id}, eventId: ${moduleId}, lessonId: ${lessonId}, type: ${itemType}, xp: ${xpEarned}`);
    setActionLoading(true);
    const userRef = doc(db, "users", user.id);
    const progressDocRef = doc(db, `users/${user.id}/progress`, moduleId); // moduleId is now eventId

    try {
      const batch = writeBatch(db);
      
      const sanitizedLessonId = lessonId.replace(/\./g, '_'); // Ensure lessonId is Firestore friendly

      const currentModuleProgSnap = await getDoc(progressDocRef);
      let currentModuleXp = 0;
      let existingLessons = {};

      if (currentModuleProgSnap.exists()) {
          const currentData = currentModuleProgSnap.data();
          currentModuleXp = currentData.moduleXp || 0; // moduleXp is eventXp
          existingLessons = currentData.lessons || {};
      }
      
      const lessonAlreadyCompleted = existingLessons[sanitizedLessonId]?.completed;
      const actualXpToAdd = lessonAlreadyCompleted ? 0 : xpEarned;
      
      if (actualXpToAdd > 0) { // Only add XP to user if it's new XP
        batch.update(userRef, { xp: increment(actualXpToAdd) });
      }


      const updatedLessonData = { ...existingLessons, [sanitizedLessonId]: { completed: true, score: score, completedAt: serverTimestamp() } };
      batch.set(progressDocRef, {
        lessons: updatedLessonData,
        moduleXp: currentModuleXp + actualXpToAdd,
        lastUpdatedAt: serverTimestamp()
       }, { merge: true });


      if (userStudyGroup && userStudyGroup.id && actualXpToAdd > 0) {
        const groupRef = doc(db, "studyGroups", userStudyGroup.id);
        batch.update(groupRef, { totalXP: increment(actualXpToAdd) });
      }

      await batch.commit();
      console.log("Sciolytics_App.js: Item completion saved to Firebase.");

      if(actualXpToAdd > 0) {
        setUser(prevUser => ({ ...prevUser, xp: (prevUser.xp || 0) + actualXpToAdd }));
      }
      setUserProgress(prev => ({ ...prev, [moduleId]: { ...prev[moduleId] || {lessons:{}, moduleXp:0}, lessons: updatedLessonData, moduleXp: (prev[moduleId]?.moduleXp || 0) + actualXpToAdd }}));
      if (userStudyGroup && actualXpToAdd > 0) {
        const updatedGroupTotalXP = (userStudyGroup.totalXP || 0) + actualXpToAdd;
        setUserStudyGroup(prevGroup => ({ ...prevGroup, totalXP: updatedGroupTotalXP }));
        setAllStudyGroups(prevAllGroups => prevAllGroups.map(g => g.id === userStudyGroup.id ? { ...g, totalXP: updatedGroupTotalXP } : g));
      }

      if (selectedEvent && selectedEvent.id === moduleId) setSelectedEvent(prev => ({ ...prev }));

      setMessage(lessonAlreadyCompleted ? `Reviewed: ${itemType}! XP already earned.` : `Completed: ${itemType}! +${xpEarned} XP`);
    } catch (error) {
      console.error("Sciolytics_App.js: Error completing item in Firebase:", error);
      setMessage("Failed to save progress. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinStudyGroup = async (groupCodeToJoinArg = joinGroupCodeInput) => {
    const groupCodeToJoin = typeof groupCodeToJoinArg === 'string' ? groupCodeToJoinArg.trim() : joinGroupCodeInput.trim();
    if (!groupCodeToJoin) { setMessage("Please enter a study group code."); return; }
    if (userStudyGroup) { setMessage("You are already in a study group. Leave your current group to join another."); return; }
    if (!user || !user.id) { setMessage("User not logged in. Please sign in again."); return; }
    if (!db) {setMessage("Database service unavailable. Cannot join group."); return;}

    console.log("Sciolytics_App.js: handleJoinStudyGroup called with code:", groupCodeToJoin, "for user:", user.id);
    setActionLoading(true);
    try {
      const groupsQuery = query(collection(db, "studyGroups"), where("code", "==", groupCodeToJoin));
      const querySnapshot = await getDocs(groupsQuery);

      if (querySnapshot.empty) {
        setMessage("Invalid group code or group not found.");
        setActionLoading(false);
        return;
      }

      const groupDocSnap = querySnapshot.docs[0];
      const groupToJoinData = { id: groupDocSnap.id, ...groupDocSnap.data() };
      if (!Array.isArray(groupToJoinData.memberIds)) {
        groupToJoinData.memberIds = [];
      }

      if (groupToJoinData.memberIds.includes(user.id)) {
          setMessage(`You are already a member of ${groupToJoinData.name}.`);
          setUserStudyGroup(groupToJoinData);
          const userRefForConsistency = doc(db, "users", user.id);
          const userSnap = await getDoc(userRefForConsistency);
          if (userSnap.exists() && userSnap.data().studyGroupId !== groupToJoinData.id) {
            await updateDoc(userRefForConsistency, { studyGroupId: groupToJoinData.id });
          }
          setUser(prevUser => ({...prevUser, studyGroupId: groupToJoinData.id}));
          setActionLoading(false);
          return;
      }

      const batch = writeBatch(db);
      const groupRef = doc(db, "studyGroups", groupToJoinData.id);
      batch.update(groupRef, { memberIds: arrayUnion(user.id) });

      const userRef = doc(db, "users", user.id);
      batch.update(userRef, { studyGroupId: groupToJoinData.id });

      await batch.commit();

      const updatedGroupSnap = await getDoc(groupRef);
      const finalGroupData = {id: updatedGroupSnap.id, ...updatedGroupSnap.data()};
      if (!Array.isArray(finalGroupData.memberIds)) {
        finalGroupData.memberIds = [];
      }

      setUserStudyGroup(finalGroupData);
      setUser(prevUser => ({...prevUser, studyGroupId: finalGroupData.id}));
      setAllStudyGroups(prevGroups => prevGroups.map(g => g.id === finalGroupData.id ? finalGroupData : g));
      setMessage(`Successfully joined study group: ${finalGroupData.name}!`);
      setJoinGroupCodeInput('');
    } catch (error) {
      console.error("Sciolytics_App.js: Error joining study group:", error);
      setMessage("Failed to join group. " + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateStudyGroup = async () => {
    if (!createGroupNameInput.trim()) { setMessage("Please enter a study group name."); return; }
    if (userStudyGroup) { setMessage("You are already in a study group. Leave your current group to create a new one."); return; }
    if (!user || !user.id) { setMessage("User not logged in. Please sign in again."); return; }
    if (!db) {setMessage("Database service unavailable. Cannot create group."); return;}

    console.log("Sciolytics_App.js: handleCreateStudyGroup called with name:", createGroupNameInput, "for user:", user.id);
    setActionLoading(true);
    try {
      const newGroupCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const newGroupData = {
        name: createGroupNameInput.trim(),
        code: newGroupCode,
        description: `A new Sciolytics study group led by ${user.name}!`,
        totalXP: user.xp || 0,
        memberIds: [user.id],
        creatorId: user.id,
        createdAt: serverTimestamp(),
        color: ['blue', 'green', 'purple', 'orange', 'red', 'pink'][Math.floor(Math.random()*6)]
      };

      const groupColRef = collection(db, "studyGroups");
      const groupDocRef = await addDoc(groupColRef, newGroupData);

      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, { studyGroupId: groupDocRef.id });

      const createdGroupForState = {
          id: groupDocRef.id,
          ...newGroupData,
      };
      setUserStudyGroup(createdGroupForState);
      setUser(prevUser => ({...prevUser, studyGroupId: groupDocRef.id}));
      setAllStudyGroups(prev => [...prev, createdGroupForState]);
      setMessage(`Study group "${createdGroupForState.name}" created! Your Group Code is: ${newGroupCode}`);
      setCreateGroupNameInput('');
    } catch (error) {
      console.error("Sciolytics_App.js: Error creating study group:", error);
      setMessage("Failed to create group. " + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveStudyGroup = async () => {
    if (!userStudyGroup || !userStudyGroup.id || !user || !user.id) {
        setMessage("Cannot leave group: No group or user identified.");
        return;
    }
    if (!db) {setMessage("Database service unavailable. Cannot leave group."); return;}

    console.log("Sciolytics_App.js: handleLeaveStudyGroup called for group:", userStudyGroup.id, "by user:", user.id);
    setActionLoading(true);
    try {
      const groupId = userStudyGroup.id;
      const groupName = userStudyGroup.name;
      const batch = writeBatch(db);

      const groupRef = doc(db, "studyGroups", groupId);
      batch.update(groupRef, { memberIds: arrayRemove(user.id) });

      const userRef = doc(db, "users", user.id);
      batch.update(userRef, { studyGroupId: null });

      await batch.commit();

      const updatedGroupSnap = await getDoc(groupRef);
      if (updatedGroupSnap.exists()) {
        const updatedGroupData = updatedGroupSnap.data();
        if (!updatedGroupData.memberIds || updatedGroupData.memberIds.length === 0) {
          console.log(`Study group ${groupName} (${groupId}) has 0 members after leave. Deleting group.`);
          await deleteDoc(groupRef);
          setAllStudyGroups(prevGroups => prevGroups.filter(g => g.id !== groupId));
          setMessage(`You have left study group: ${groupName}. The group was empty and has been deleted.`);
        } else {
          setAllStudyGroups(prevGroups =>
            prevGroups.map(g =>
              (g.id === groupId ?
                { ...g, memberIds: updatedGroupData.memberIds }
                : g)
            )
          );
          setMessage(`You have left study group: ${groupName}.`);
        }
      } else {
        setAllStudyGroups(prevGroups => prevGroups.filter(g => g.id !== groupId));
        setMessage(`You have left study group: ${groupName}. The group seems to no longer exist.`);
      }

      setUserStudyGroup(null);
      setUser(prevUser => ({...prevUser, studyGroupId: null}));

    } catch (error) {
      console.error("Sciolytics_App.js: Error leaving study group:", error);
      setMessage("Failed to leave group. " + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteStudyGroup = async () => {
    if (!userStudyGroup || !userStudyGroup.id || !user || !user.id) {
        setMessage("Cannot delete group: No group or user identified.");
        return;
    }
    if (user.id !== userStudyGroup.creatorId) {
        setMessage("Only the group creator can delete the group.");
        return;
    }
    if (!db) {setMessage("Database service unavailable. Cannot delete group."); return;}

    if (!window.confirm(`Are you sure you want to permanently delete study group "${userStudyGroup.name}"? This action cannot be undone.`)) {
        return;
    }

    console.log("Sciolytics_App.js: handleDeleteStudyGroup called for group:", userStudyGroup.id, "by owner:", user.id);
    setActionLoading(true);
    try {
        const groupIdToDelete = userStudyGroup.id;
        const groupNameToDelete = userStudyGroup.name;
        const memberIdsToUpdate = userStudyGroup.memberIds || [];

        const batch = writeBatch(db);

        const groupRef = doc(db, "studyGroups", groupIdToDelete);
        batch.delete(groupRef);

        memberIdsToUpdate.forEach(memberId => {
            const userRef = doc(db, "users", memberId);
            batch.update(userRef, { studyGroupId: null });
        });

        await batch.commit();

        setUserStudyGroup(null);
        setUser(prevUser => ({...prevUser, studyGroupId: null}));
        setAllStudyGroups(prevGroups => prevGroups.filter(g => g.id !== groupIdToDelete));
        setMessage(`Study group "${groupNameToDelete}" has been successfully deleted.`);

    } catch (error) {
        console.error("Sciolytics_App.js: Error deleting study group:", error);
        setMessage("Failed to delete group. " + error.message);
    } finally {
        setActionLoading(false);
    }
  };


  const fetchAllStudyGroupsForBrowse = useCallback(async () => { // Renamed
    if (!db) {
        console.error("[Sciolytics_App.js_fetchAllStudyGroupsForBrowse] DB not available. Aborting fetch.");
        setMessage("Database error. Cannot fetch groups.");
        return;
    }
    // Fetch if on browseGroups or leaderboard, or if the list is empty and user is logged in
    if (user && (currentView === 'browseGroups' || currentView === 'leaderboard' || allStudyGroups.length === 0)) {
      console.log(`[Sciolytics_App.js_fetchAllStudyGroupsForBrowse] Called for view: ${currentView} or initial load. Setting actionLoading TRUE.`);
      setActionLoading(true);
      try {
        const groupsColRef = collection(db, "studyGroups"); // Collection "studyGroups"
        let q;
        if (currentView === 'leaderboard') {
          q = query(groupsColRef, orderBy("totalXP", "desc"), limit(50));
          console.log("[Sciolytics_App.js_fetchAllStudyGroupsForBrowse] Querying for LEADERBOARD (orderBy totalXP desc, limit 50).");
        } else {
          // For browse or initial load, sort by creation date or name
          q = query(groupsColRef, orderBy("createdAt", "desc"), limit(100));
          console.log("[Sciolytics_App.js_fetchAllStudyGroupsForBrowse] Querying for BROWSE/INITIAL (orderBy createdAt desc, limit 100).");
        }

        console.log(`[Sciolytics_App.js_fetchAllStudyGroupsForBrowse] Executing getDocs() for ${currentView}...`);
        const querySnapshot = await getDocs(q);
        console.log(`[Sciolytics_App.js_fetchAllStudyGroupsForBrowse] getDocs() completed. Found ${querySnapshot.docs.length} groups for ${currentView}.`);

        const loadedGroups = querySnapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                ...data,
                memberIds: Array.isArray(data.memberIds) ? data.memberIds : [],
                // members count can be derived from memberIds.length in component
            };
        });
        setAllStudyGroups(loadedGroups);
        console.log(`[Sciolytics_App.js_fetchAllStudyGroupsForBrowse] setAllStudyGroups done for ${currentView}. Group count: ${loadedGroups.length}`);
      } catch (error) {
        console.error(`[Sciolytics_App.js_fetchAllStudyGroupsForBrowse] Error fetching groups for ${currentView}:`, error);
        console.error(`[Sciolytics_App.js_fetchAllStudyGroupsForBrowse] Error details: Code: ${error.code}, Message: ${error.message}`);
        setMessage(`Could not load groups for ${currentView}: ${error.message}. Check console for Firestore errors (e.g. missing index).`);
      } finally {
        console.log(`[Sciolytics_App.js_fetchAllStudyGroupsForBrowse] FINALLY block. Setting actionLoading FALSE for ${currentView}.`);
        setActionLoading(false);
      }
    } else {
        console.log(`[Sciolytics_App.js_fetchAllStudyGroupsForBrowse] Not fetching. Conditions not met. Current view: ${currentView}, User: ${!!user}, AllGroups length: ${allStudyGroups.length}`);
    }
  }, [currentView, user, allStudyGroups.length]); // db is not needed here as it's checked inside

  useEffect(() => {
    if (user) { // Fetch groups when user logs in or view changes appropriately
        fetchAllStudyGroupsForBrowse();
    }
  }, [user, fetchAllStudyGroupsForBrowse]); // fetchAllStudyGroupsForBrowse is memoized


  const startSciolyticsChallenge = () => { // Renamed
    console.log("Sciolytics_App.js: startSciolyticsChallenge called.");
    setActionLoading(true);
    if (selectedChallengeCategories.length === 0) {setMessage("Please select at least one category."); setActionLoading(false); return;}
    const filtered = sciolyticsChallengeBank.filter(q => selectedChallengeCategories.includes(q.category)); // Use sciolyticsChallengeBank
    if (filtered.length === 0) {setMessage("No questions for selected categories."); setActionLoading(false); return;}

    let count = numChallengeQuestionsInput;
    if (count > filtered.length) {
        setMessage(`Only ${filtered.length} questions available for the selected categories. Reducing question count.`);
        count = filtered.length;
    }
    if (count <= 0) {setMessage("Cannot start with 0 questions."); setActionLoading(false); return;}

    const shuffled = [...filtered].sort(() => 0.5 - Math.random());
    setChallengeQuestions(shuffled.slice(0, count).map(q => ({...q, selectedAnswer: null})));
    setCurrentChallengeQuestionIdx(0); setChallengeScore(0); setChallengeSelectedAnswer(null); setShowChallengeAnswer(false);
    setChallengeTimer(QUESTION_TIMER_DURATION); setChallengeState('active'); setActionLoading(false);
    setMessage(`Challenge started with ${count} questions! Good luck!`);
  };


  const handleNextChallengeQuestion = async () => {
    setShowChallengeAnswer(false);
    setChallengeSelectedAnswer(null);

    if (currentChallengeQuestionIdx < challengeQuestions.length - 1) {
      setCurrentChallengeQuestionIdx(i => i + 1);
      setChallengeTimer(QUESTION_TIMER_DURATION);
    } else {
      setChallengeState('results');
      const xp = challengeQuestions.length > 0 ? Math.round((challengeScore / challengeQuestions.length) * CHALLENGE_MAX_XP) : 0;
      console.log("Sciolytics_App.js: Challenge finished. Score:", challengeScore, "XP:", xp);

      if (user && user.id && xp > 0 && db) {
        setActionLoading(true);
        try {
          const batch = writeBatch(db);
          const userRef = doc(db, "users", user.id);
          batch.update(userRef, { xp: increment(xp) });

          if (userStudyGroup && userStudyGroup.id) { // Renamed
            batch.update(doc(db, "studyGroups", userStudyGroup.id), { totalXP: increment(xp) }); // Collection "studyGroups"
          }
          await batch.commit();

          setUser(prev => ({ ...prev, xp: (prev.xp || 0) + xp }));
          if (userStudyGroup) {
            const newGroupXp = (userStudyGroup.totalXP || 0) + xp;
            setUserStudyGroup(prev => ({ ...prev, totalXP: newGroupXp }));
            setAllStudyGroups(prevs => prevs.map(g => g.id === userStudyGroup.id ? { ...g, totalXP: newGroupXp } : g));
          }
          setMessage(`Challenge finished! Score: ${challengeScore}/${challengeQuestions.length}. You earned ${xp} XP!`);
        } catch (e) {
          console.error("Sciolytics_App.js: Error saving challenge XP:", e);
          setMessage("Error saving your XP. Your score was " + `${challengeScore}/${challengeQuestions.length}.`);
        }
        finally { setActionLoading(false); }
      } else if (xp === 0) {
        setMessage(`Challenge finished! Score: ${challengeScore}/${challengeQuestions.length}. No XP earned this time.`);
      } else if(!db) {
        setMessage("Database error. Challenge XP could not be saved. Your score was " + `${challengeScore}/${challengeQuestions.length}.`);
      }
    }
  };

  const resetSciolyticsChallenge = () => { // Renamed
    setChallengeState('idle'); setChallengeQuestions([]);
    setCurrentChallengeQuestionIdx(0); setChallengeScore(0);
    setChallengeSelectedAnswer(null); setShowChallengeAnswer(false);
    console.log("Sciolytics_App.js: Challenge reset to configuration screen.");
  };


  if (loading) {
    const loadingMessageText = message || (user ? "Loading Sciolytics Dashboard..." : "Initializing Sciolytics Platform...");
    return (
      <div className="full-page-loader">
        <div className="spinner"></div>
        <p>{loadingMessageText}</p>
      </div>
    );
  }

  return (
    <>
      {!user ? (
        <LoginView
          googleClientId={GOOGLE_CLIENT_ID}
          actionLoading={actionLoading}
          currentView={currentView}
          message={message}
          user={user}
          onLoginSuccess={handleLoginSuccess}
          onLoginError={handleLoginError}
        />
      ) : (
        <div className="app">
          <Navigation
            user={user}
            currentView={currentView}
            navigate={navigate}
            handleLogout={handleLogout}
            actionLoading={actionLoading}
          />
          <main className="main-content">
            {message && (currentView !== 'login' || user) &&
                <div className={`message app-message ${message.includes('failed')||message.includes('Error')||message.includes('Invalid')?'error':(message.includes('Level Up')||message.includes('Completed')||message.includes('🎉')||message.includes('Challenge finished')||message.includes('Successfully')||message.includes('created') ?'success':'info')}`}>{message}</div>
            }
            {actionLoading && currentView !== 'login' && (
                 <div className="loading-section page-loader"><div className="spinner" /> <p>Processing...</p></div>
            )}

            {currentView === 'dashboard' && <Dashboard user={user} userProgress={userProgress} userTeam={userStudyGroup} learningModules={sciolyEvents} navigate={navigate} actionLoading={actionLoading} />}
            {currentView === 'events' && <Dashboard user={user} userProgress={userProgress} userTeam={userStudyGroup} learningModules={sciolyEvents} navigate={navigate} actionLoading={actionLoading} />} {/* For now, 'events' shows dashboard layout */}
            {currentView === 'eventView' && selectedEvent && <EventView selectedModule={selectedEvent} userProgress={userProgress} navigate={navigate} actionLoading={actionLoading} />}
            {currentView === 'lessonContent' && currentLesson && selectedEvent && <LessonContentView currentLesson={currentLesson} selectedModule={selectedEvent} userProgress={userProgress} handleCompleteItem={handleCompleteItem} navigate={navigate} actionLoading={actionLoading} />}
            {currentView === 'practiceView' && practiceSetData && <PracticeView quizData={practiceSetData} sampleQuizzes={sampleMcqs} userProgress={userProgress} selectedModule={selectedEvent} handleCompleteItem={handleCompleteItem} navigate={navigate} actionLoading={actionLoading} setMessage={setMessage} />}
            {currentView === 'studygroups' && <StudyGroupsView user={user} userTeam={userStudyGroup} actionLoading={actionLoading} joinTeamCodeInput={joinGroupCodeInput} setJoinTeamCodeInput={setJoinGroupCodeInput} createTeamNameInput={createGroupNameInput} setCreateTeamNameInput={setCreateGroupNameInput} onJoinTeam={handleJoinStudyGroup} onCreateTeam={handleCreateStudyGroup} onLeaveTeam={handleLeaveStudyGroup} onDeleteTeam={handleDeleteStudyGroup} />}
            {currentView === 'browseGroups' && <BrowseGroupsView allTeams={allStudyGroups} actionLoading={actionLoading} user={user} currentView={currentView} fetchAllTeams={fetchAllStudyGroupsForBrowse} userTeam={userStudyGroup} onJoinTeam={handleJoinStudyGroup} />}
            {currentView === 'leaderboard' && <LeaderboardView allTeams={allStudyGroups} actionLoading={actionLoading} user={user} currentView={currentView} fetchAllTeams={fetchAllStudyGroupsForBrowse} userTeam={userStudyGroup} />}
            {currentView === 'challenge' && <SciolyticsChallengeView user={user} actionLoading={actionLoading} challengeState={challengeState} vexpertChallengeBank={sciolyticsChallengeBank} selectedChallengeCategories={selectedChallengeCategories} setSelectedChallengeCategories={setSelectedChallengeCategories} availableChallengeCategories={availableChallengeCategories} numChallengeQuestionsInput={numChallengeQuestionsInput} setNumChallengeQuestionsInput={setNumChallengeQuestionsInput} onStartChallenge={startSciolyticsChallenge} challengeQuestions={challengeQuestions} currentChallengeQuestionIdx={currentChallengeQuestionIdx} challengeTimer={challengeTimer} showChallengeAnswer={showChallengeAnswer} challengeScore={challengeScore} onChallengeAnswer={handleChallengeAnswer} onNextChallengeQuestion={handleNextChallengeQuestion} onResetChallenge={resetSciolyticsChallenge} questionTimerDuration={QUESTION_TIMER_DURATION} navigate={navigate} />}
          </main>
        </div>
      )}

      {/* Global Styles - Sciolytics Theme */}
      <style jsx global>{`
        :root {
            --theme-primary: #4A90E2; /* Sciolytics Blue */
            --theme-primary-dark: #357ABD;
            --theme-primary-light: #D1E8FF;
            --theme-primary-hover: #EAF3FB;

            --theme-secondary: #50E3C2; /* Minty Green Accent */
            --theme-accent: #F5A623; /* Orange Accent */

            --text-primary: #2c3e50; /* Dark Grey-Blue */
            --text-secondary: #7f8c8d; /* Medium Grey */
            --text-light: #95a5a6; /* Light Grey */

            --bg-main: #f4f6f8; /* Lightest Grey */
            --bg-card: white;
            --border-color: #e0e6ed; /* Softer border */

            --success-bg: #d4edda; --success-text: #155724; --success-border: #c3e6cb;
            --error-bg: #f8d7da; --error-text: #721c24; --error-border: #f5c6cb;
            --info-bg: #d1ecf1; --info-text: #0c5460; --info-border: #bee5eb;


            --shadow-sm: 0 2px 4px rgba(0,0,0,0.05);
            --shadow-md: 0 4px 8px rgba(0,0,0,0.07);
            --shadow-lg: 0 10px 20px rgba(0,0,0,0.08), 0 3px 6px rgba(0,0,0,0.05);

            /* Color mapping for modules/events */
            --color-blue-500: #4A90E2; --color-blue-600: #357ABD; --color-blue-100: #D1E8FF; --color-blue-50: #EAF3FB;
            --color-green-500: #2ECC71; --color-green-600: #27AE60; --color-green-100: #D5F5E3; --color-green-50: #E8F8F5;
            --color-purple-500: #9B59B6; --color-purple-600: #8E44AD; --color-purple-100: #EBDEF0; --color-purple-50: #F4ECF7;
            --color-orange-500: #F39C12; --color-orange-600: #D35400; --color-orange-100: #FDEBD0; --color-orange-50: #FEF9E7;
            --color-red-500: #E74C3C; --color-red-600: #C0392B; --color-red-100: #FADBD8; --color-red-50: #FDEDEC;
            --color-pink-500: #FF69B4; --color-pink-600: #FF1493; --color-pink-100: #FFDFEF; /* Example */
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          background-color: var(--bg-main);
          color: var(--text-primary);
          line-height: 1.65; /* Increased for readability */
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .app { min-height: 100vh; display: flex; flex-direction: column; }

        button { font-family: inherit; cursor: pointer; border:none; background:none; transition: all 0.2s ease-in-out;}
        button:disabled { cursor: not-allowed; opacity: 0.6; }
        input[type="text"], input[type="password"], input[type="email"], select {
          font-family: inherit; padding: 0.8rem 1.1rem; border: 1px solid var(--border-color); border-radius: 6px; font-size: 1rem;
          transition: border-color 0.2s, box-shadow 0.2s; background-color: white;
        }
        input[type="text"]:focus, input[type="password"]:focus, input[type="email"]:focus, select:focus {
          outline: none; border-color: var(--theme-primary); box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.15);
        }
        code { background-color: #e9ecef; padding: 0.2em 0.45em; margin: 0 0.1em; font-size: 88%; border-radius: 4px; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; color: #c0392b; }
        .icon { width: 1.2rem; height: 1.2rem; } .icon-small { width: 0.9rem; height: 0.9rem; } .icon.rotated { transform: rotate(180deg); }
        .error-message { color: var(--error-text); background-color: var(--error-bg); padding: 1.25rem; border-radius: 8px; text-align: center; margin: 1rem; border: 1px solid var(--error-border); font-weight:500; }
        .info-message { color: var(--text-secondary); text-align: center; padding: 1.25rem; font-style: italic;}

        .full-page-loader { display: flex; flex-direction:column; align-items: center; justify-content: center; min-height: 100vh; width:100%; background-color: rgba(244,246,248,0.95); gap:1rem; position: fixed; top:0; left:0; z-index:9999; }
        .spinner { width: 3.75rem; height: 3.75rem; border: 5px solid #e0e0e0; border-top-color: var(--theme-primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .loading-section { display: flex; align-items: center; justify-content:center; gap: 1rem; padding: 1.5rem; background: rgba(255,255,255,0.8); border-radius:8px; margin-bottom:1.5rem; color: var(--text-secondary); box-shadow: var(--shadow-sm); }
        .loading-section.page-loader { margin: 2rem auto; }

        .message { padding: 1rem 1.5rem; border-radius: 8px; margin-bottom: 1.5rem; font-weight: 500; border: 1px solid transparent; box-shadow: var(--shadow-sm); }
        .message.app-message {max-width: 800px; margin-left:auto; margin-right:auto;}
        .message.login-message { margin-top: 1.5rem; margin-bottom: 0.5rem; }
        .message.success { background: var(--success-bg); color: var(--success-text); border-color: var(--success-border); }
        .message.error { background: var(--error-bg); color: var(--error-text); border-color: var(--error-border); }
        .message.info { background: var(--info-bg); color: var(--info-text); border-color: var(--info-border); }

        .login-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1rem; background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-secondary) 100%); }
        .login-card { background: white; border-radius: 16px; padding: 2.5rem 3rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); width: 100%; max-width: 480px; text-align: center; }
        .login-header { margin-bottom: 2rem; }
        .login-header .brand-icon-large { width: 4.5rem; height: 4.5rem; margin: 0 auto 1rem; }
        .login-header h1 { font-size: 2.75rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem; }
        .login-header p { color: var(--text-secondary); font-size: 1.1rem; margin-bottom: 1rem;}
        .login-specific-loader { background:transparent; box-shadow:none; padding:1rem 0;}
        .login-section { margin: 2.5rem 0; display: flex; justify-content: center; }
        .features-preview { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; margin-top: 2.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color); }
        .feature { display: flex; flex-direction: column; align-items: center; gap: 0.6rem; color: var(--text-light); font-size: 0.9rem; }
        .feature .feature-icon { width: 1.75rem; height: 1.75rem; color: var(--theme-primary); }
        .login-footer { margin-top: 2.5rem; font-size: 0.85rem; color: #a0aec0; }

        .nav { background: var(--bg-card); border-bottom: 1px solid var(--border-color); padding: 0 2rem; display: flex; align-items: center; justify-content: space-between; height: 4.5rem; position: sticky; top: 0; z-index: 1000; box-shadow: var(--shadow-sm); }
        .nav-brand { display: flex; align-items: center; gap: 0.75rem; font-weight: 700; font-size: 1.6rem; color: var(--theme-primary); } /* Sciolytics text uses theme primary */
        .brand-logo-image { width: 32px; height: 32px; /* Icon, not image */ }
        .nav-items { display: flex; align-items: center; gap: 0.5rem; } /* Reduced gap */
        .nav-item { display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1rem; border-radius: 6px; color: var(--text-secondary); font-weight: 500; font-size:0.95rem; }
        .nav-item:hover { background: var(--theme-primary-hover); color: var(--theme-primary-dark); }
        .nav-item.active { background: var(--theme-primary); color: white; }
        .nav-user { display: flex; align-items: center; gap: 0.75rem; padding-left: 1rem; border-left: 1px solid var(--border-color); margin-left: 0.75rem;}
        .user-avatar { width: 2.5rem; height: 2.5rem; border-radius: 50%; object-fit: cover; border: 2px solid var(--border-color);}
        .user-info .user-name { font-weight: 600; font-size: 0.9rem; }
        .user-info .user-level { font-size: 0.8rem; color: var(--text-light); }
        .logout-btn { background: var(--theme-primary-hover); color: var(--theme-primary-dark); padding: 0.6rem; border-radius: 50%; line-height:0;}
        .logout-btn:hover { background: #fadbd8; color: #c0392b; } /* Softer red for logout hover */

        .main-content { flex: 1; padding: 2.5rem; max-width: 1320px; margin: 0 auto; width: 100%; }
        .view-header { text-align: center; margin-bottom: 2.5rem; padding-bottom:1.5rem; border-bottom: 1px solid var(--border-color);}
        .view-header .header-icon { width: 3.5rem; height: 3.5rem; color: var(--theme-primary); margin: 0 auto 1rem; }
        .view-header h1 { font-size: 2.25rem; font-weight: 700; margin-bottom: 0.5rem; }
        .view-header p { color: var(--text-secondary); font-size: 1.1rem; max-width: 650px; margin: 0 auto;}
        .back-btn { display:inline-flex; align-items:center; gap: 0.4rem; padding: 0.6rem 1rem; margin-bottom: 1.5rem; font-size:0.95rem; color:var(--theme-primary-dark); font-weight:500; border-radius:6px; background-color: var(--theme-primary-hover); }
        .back-btn:hover { background-color: var(--theme-primary-light); color: var(--theme-primary-dark); }
        .back-btn .icon.rotated { transform: rotate(180deg); }

        .dashboard { display: flex; flex-direction: column; gap: 2.5rem; }
        .dashboard-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 2rem; flex-wrap: wrap;}
        .welcome-section { flex-grow: 1; }
        .welcome-section h1 { font-size: 2.25rem; font-weight: 700; margin-bottom: 0.25rem; }
        .welcome-section p { color: var(--text-secondary); font-size: 1.15rem; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1.5rem; }
        .stat-card { background: var(--bg-card); padding: 1.5rem; border-radius: 10px; display: flex; align-items: center; gap: 1rem; box-shadow: var(--shadow-md); border: 1px solid var(--border-color); }
        .stat-card .stat-icon { color: var(--theme-primary); } /* Use theme primary for stat icons */
        .stat-card .stat-value { font-size: 1.75rem; font-weight: 700; }
        .stat-card .stat-label { font-size: 0.9rem; color: var(--text-light); }

        .team-card.study-group-card { background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-secondary) 100%); color:white; padding: 2rem; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; box-shadow: var(--shadow-lg); }
        .team-card.study-group-card .team-info {display:flex; align-items:center; gap:1rem;}
        .team-card.study-group-card .team-icon { width:2.5rem; height:2.5rem; color:white;}
        .team-card.study-group-card h3 { font-size: 1.5rem; font-weight: 600; margin-bottom: 0.25rem; }
        .team-card.study-group-card p { opacity:0.9; font-size: 0.95rem; }
        .team-card.study-group-card code { background:rgba(255,255,255,0.2); color:white; padding:0.2rem 0.4rem; border-radius:4px;}
        .team-card.study-group-card .team-xp { font-size: 1.5rem; font-weight: 700; }

        .recommended-module-card { background: var(--bg-card); border: 2px solid var(--theme-primary); padding: 1.5rem; border-radius: 10px; box-shadow: var(--shadow-md); cursor:pointer; transition: transform 0.2s, box-shadow 0.2s; position:relative; overflow:hidden;}
        .recommended-module-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); }
        .recommended-tag { position:absolute; top:0; right:0; background: var(--theme-primary); color:white; padding:0.3rem 0.8rem; font-size:0.8rem; font-weight:600; border-bottom-left-radius:10px;}
        .recommended-module-card .module-icon { width: 2.5rem; height:2.5rem; margin-bottom:0.75rem;}
        .recommended-module-card h3 { font-size:1.3rem; margin-bottom:0.5rem;}
        .recommended-module-card p { font-size:0.95rem; color: var(--text-secondary); margin-bottom:1rem;}
        .recommended-module-card .start-btn.small { padding: 0.6rem 1rem; font-size:0.9rem; margin-top:auto;}

        .modules-section .module-category-section { margin-bottom: 2.5rem; }
        .modules-section .category-title { font-size: 1.75rem; font-weight: 600; margin-bottom: 1.5rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border-color); color: var(--text-primary); }
        .modules-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 2rem; } /* Slightly smaller minmax */
        .module-card { background: var(--bg-card); padding: 1.5rem; border-radius: 12px; box-shadow: var(--shadow-md); display: flex; flex-direction: column; cursor:pointer; transition: transform 0.2s, box-shadow 0.2s; border: 1px solid var(--border-color); }
        .module-card:hover { transform: translateY(-5px); box-shadow: var(--shadow-lg); border-color: var(--theme-primary-light); }
        .module-card .module-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .module-card .module-icon { width: 2.5rem; height: 2.5rem; }
        /* Using Sciolytics theme colors for progress fills and icons as defined in :root */
        .module-card .module-meta { display: flex; gap: 0.75rem; }
        .module-card .difficulty, .module-card .duration { font-size: 0.8rem; padding: 0.3rem 0.6rem; border-radius: 16px; background: #e9ecef; color: var(--text-secondary); }
        .module-card h3 { font-size: 1.35rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-primary); }
        .module-card p { color: var(--text-secondary); margin-bottom: 1.5rem; line-height: 1.5; flex-grow: 1; font-size:0.95rem; }
        .module-card .progress-section { margin-bottom: 1.5rem; }
        .module-card .progress-bar { height: 8px; background: #e9ecef; border-radius: 4px; overflow: hidden; margin-bottom: 0.5rem; }
        .module-card .progress-fill { height: 100%; transition: width 0.3s ease-in-out; background-color: var(--theme-primary); } /* Default progress fill */
        .module-card.blue .progress-fill { background: var(--color-blue-500); }
        .module-card.green .progress-fill { background: var(--color-green-500); }
        .module-card.purple .progress-fill { background: var(--color-purple-500); }
        .module-card.orange .progress-fill { background: var(--color-orange-500); }
        .module-card.red .progress-fill { background: var(--color-red-500); }
        .module-card .progress-text { font-size: 0.85rem; color: var(--text-light); }
        .module-card .start-btn { width: 100%; padding: 0.8rem 1.2rem; background: var(--theme-primary); color: white; border-radius: 8px; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-size:0.95rem; }
        .module-card .start-btn:hover { background: var(--theme-primary-dark); }


        .module-view.event-view .module-view-header { background: var(--bg-card); padding: 2rem; border-radius: 12px; box-shadow: var(--shadow-md); margin-bottom:2rem; border: 1px solid var(--border-color); }
        .module-view.event-view .module-title-section { display: flex; align-items: flex-start; gap: 2rem; }
        .module-view.event-view .category-tag-module { display: inline-block; background-color: var(--theme-primary-light); color: var(--theme-primary-dark); padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.8rem; font-weight: 500; margin-bottom: 0.5rem; }
        .module-view.event-view .module-icon-large { width: 4rem; height: 4rem; flex-shrink: 0; }
        .module-view.event-view .module-title-section h1 { font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem; }
        .module-view.event-view .module-title-section p { color: var(--text-secondary); font-size: 1.1rem; margin-bottom: 1rem; }
        .module-view.event-view .module-badges { display: flex; gap: 0.75rem; flex-wrap: wrap; }
        .module-view.event-view .badge { font-size: 0.85rem; padding: 0.35rem 0.8rem; border-radius: 16px; background: var(--theme-primary-light); color: var(--theme-primary-dark); font-weight:500;}

        .lessons-list { background: var(--bg-card); border-radius: 12px; box-shadow: var(--shadow-md); overflow: hidden; border: 1px solid var(--border-color); }
        .lesson-item { display: flex; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color); transition: background-color 0.2s; cursor:pointer;}
        .lesson-item:last-child { border-bottom: none; }
        .lesson-item:not(.locked):hover { background: var(--theme-primary-hover); }
        .lesson-item.completed { background: var(--color-green-50); border-left: 5px solid var(--color-green-500); padding-left: calc(1.5rem - 5px);}
        .lesson-item.locked { opacity: 0.6; background: #f8f9fa; cursor: not-allowed; }
        .lesson-item .lesson-number { width: 2.5rem; height: 2.5rem; border-radius: 50%; border: 2px solid var(--border-color); display: flex; align-items: center; justify-content: center; font-weight: 600; margin-right: 1rem; flex-shrink: 0; color: var(--text-secondary); }
        .lesson-item.completed .lesson-number { background: var(--color-green-500); border-color: var(--color-green-500); color: white; }
        .lesson-item .lesson-type-icon { width: 1.75rem; height: 1.75rem; margin-right: 1rem; }
        .lesson-item .lesson-content { flex: 1; }
        .lesson-item .lesson-content h3 { font-size: 1.15rem; font-weight: 600; margin-bottom: 0.25rem; }
        .lesson-item .lesson-type-badge { font-size: 0.8rem; color: var(--text-light); background-color: #f1f3f5; padding:0.2rem 0.5rem; border-radius:4px; display:inline-block; text-transform:uppercase;}
        .lesson-item .lesson-btn { padding: 0.6rem 1rem; background: var(--theme-primary); color: white; border-radius: 6px; display: flex; align-items: center; gap: 0.4rem; font-size:0.9rem; margin-left:auto;}
        .lesson-item .lesson-btn:hover:not(:disabled) { background: var(--theme-primary-dark); }
        .lesson-item.locked .lesson-btn { background: #adb5bd; }

        .lesson-content-view { background: var(--bg-card); padding: 2.5rem; border-radius: 12px; box-shadow: var(--shadow-lg); border: 1px solid var(--border-color); }
        .lesson-title-header { display:flex; align-items:center; gap:1rem; margin-bottom:1.5rem; padding-bottom:1rem; border-bottom:1px solid var(--border-color);}
        .lesson-type-icon-large { width:2.5rem; height:2.5rem;}
        .lesson-content-view h2 { font-size: 2rem; font-weight: 700; color: var(--text-primary); }
        .lesson-content-view .content-area { font-size: 1.05rem; line-height: 1.75; color: var(--text-secondary); margin-bottom: 2.5rem; }
        .lesson-content-view .content-area img {max-width:100%; height:auto; border-radius:8px; margin:1rem 0; box-shadow: var(--shadow-md);}
        .lesson-content-view .content-area h1, .lesson-content-view .content-area h2, .lesson-content-view .content-area h3 { color: var(--text-primary); margin-top: 2rem; margin-bottom: 1rem; line-height:1.3; }
        .lesson-content-view .content-area ul, .lesson-content-view .content-area ol { margin-left: 1.75rem; margin-bottom: 1.25rem; }
        .lesson-content-view .content-area li { margin-bottom:0.5rem;}
        .lesson-content-view .content-area p { margin-bottom: 1.25rem; }
        .lesson-content-view .content-area strong { font-weight:600; color: var(--text-primary);}
        .lesson-content-view .complete-lesson-btn { display: inline-flex; align-items:center; gap:0.5rem; padding: 0.9rem 2rem; background: var(--color-green-500); color: white; border-radius: 8px; font-size: 1rem; font-weight: 600; }
        .lesson-content-view .complete-lesson-btn:hover { background: var(--color-green-600); }
        .frq-self-assessment { margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color); }
        .frq-self-assessment h4 { font-size: 1.1rem; font-weight: 600; margin-bottom: 0.75rem; color: var(--text-primary); }
        .model-answer-placeholder { background-color: #f8f9fa; padding: 1rem; border-radius: 6px; border: 1px solid var(--border-color); font-style: italic; color: var(--text-secondary); }


        .quiz-view.practice-view { background: var(--bg-card); padding: 2rem; border-radius: 12px; box-shadow: var(--shadow-lg); border: 1px solid var(--border-color); }
        .quiz-header-info {text-align:center; margin-bottom:2rem; padding-bottom:1.5rem; border-bottom:1px solid var(--border-color);}
        .quiz-header-info h2 {font-size:1.8rem; margin-top:0.5rem; margin-bottom:1rem;}
        .quiz-progress { display: flex; flex-direction: column; gap: 0.5rem; max-width:400px; margin:0 auto;}
        .quiz-progress span { font-size: 0.9rem; color: var(--text-light); }
        .quiz-progress .progress-bar { height: 10px; background: #e9ecef; border-radius: 5px; overflow: hidden; }
        .quiz-progress .progress-bar div { height:100%; background: var(--theme-primary); transition: width 0.3s; }
        .question-card { padding: 1.5rem 0; }
        .question-card h3 { font-size: 1.5rem; font-weight: 600; margin-bottom: 2rem; line-height: 1.4; text-align:center; }
        .options-list { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem; max-width:700px; margin-left:auto; margin-right:auto;}
        .option-btn { display: flex; align-items: center; gap: 1rem; padding: 1.25rem; background: white; border: 2px solid var(--border-color); border-radius: 10px; cursor: pointer; transition: all 0.2s; text-align: left; width:100%; font-size:1.05rem;}
        .option-btn:hover:not(:disabled) { border-color: var(--theme-primary-light); background: var(--theme-primary-hover); }
        .option-btn.selected:not(.correct):not(.incorrect) { border-color: var(--theme-primary); background: var(--theme-primary-light); box-shadow: 0 0 0 2px var(--theme-primary); font-weight:500;}
        .option-btn.correct { background-color: var(--success-bg); border-color: var(--success-border); color: var(--success-text); font-weight: bold; }
        .option-btn.incorrect { background-color: var(--error-bg); border-color: var(--error-border); color: var(--error-text); }
        .option-letter { width: 2.25rem; height: 2.25rem; border-radius: 50%; background: #f1f3f5; display: flex; align-items: center; justify-content: center; font-weight: 600; color: var(--text-secondary); flex-shrink: 0; transition: all 0.2s;}
        .option-btn.selected:not(.correct):not(.incorrect) .option-letter { background: var(--theme-primary); color: white; }
        .option-btn.correct .option-letter { background: var(--color-green-500); color: white; }
        .option-btn.incorrect .option-letter { background: var(--color-red-500); color: white; }
        .explanation-box { margin-top: 1.5rem; padding: 1rem; background-color: var(--theme-primary-hover); border-radius: 8px; border: 1px solid var(--theme-primary-light); color: var(--text-secondary); font-size: 0.95rem; }
        .explanation-box strong { color: var(--text-primary); }
        .quiz-view.practice-view .submit-btn { display: block; width: auto; min-width:200px; margin:1.5rem auto 0; padding: 1rem 2.5rem; background: var(--theme-primary); color: white; border-radius: 8px; font-size: 1.05rem; font-weight: 600; }
        .quiz-view.practice-view .submit-btn:hover:not(:disabled) { background: var(--theme-primary-dark); }

        .quiz-result.practice-result { text-align: center; padding: 2rem; }
        .quiz-result.practice-result .result-icon { width: 5rem; height: 5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; }
        .quiz-result.practice-result .result-icon svg {width:2.5rem; height:2.5rem; color:white;}
        .quiz-result.practice-result .result-icon.success { background: var(--color-green-500); }
        .quiz-result.practice-result .result-icon.fail { background: var(--color-red-500); }
        .quiz-result.practice-result h2 { font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem; }
        .quiz-result.practice-result p { font-size: 1.15rem; color: var(--text-secondary); margin-bottom: 0.5rem;}
        .quiz-result.practice-result .xp-earned {color: var(--color-green-600); font-weight:600;}
        .quiz-result.practice-result .result-actions { display: flex; gap: 1.5rem; justify-content: center; margin-top: 2rem; }
        .quiz-result.practice-result .retry-btn, .quiz-result.practice-result .continue-btn { padding: 0.8rem 1.8rem; border-radius: 8px; font-weight: 600; font-size: 0.95rem; display:inline-flex; align-items:center; gap:0.5rem;}
        .quiz-result.practice-result .retry-btn { background: #f1f3f5; color: var(--text-primary); border: 1px solid var(--border-color); }
        .quiz-result.practice-result .retry-btn:hover { background: #e9ecef; }
        .quiz-result.practice-result .continue-btn { background: var(--theme-primary); color: white; }
        .quiz-result.practice-result .continue-btn:hover { background: var(--theme-primary-dark); }

        .teams-view.study-groups-view .current-team-card.current-study-group-card { background: var(--bg-card); padding: 2.5rem; border-radius: 12px; box-shadow: var(--shadow-lg); border: 1px solid var(--border-color); }
        .current-team-card.current-study-group-card .team-card-main { display:flex; align-items:flex-start; gap:2rem; margin-bottom:1.5rem;}
        .team-avatar-icon { width:4rem; height:4rem; flex-shrink:0; color: var(--theme-primary); /* Default for group icon */ }
        .current-team-card.current-study-group-card h2 { font-size:1.8rem; font-weight:700; margin-bottom:0.5rem;}
        .team-description-small { font-size:1rem; color: var(--text-secondary); margin-bottom:0.75rem;}
        .current-team-card.current-study-group-card p {font-size:1rem; color:var(--text-secondary); margin-bottom:0.3rem;}
        .team-code-display { background: var(--theme-primary-light); color: var(--theme-primary-dark); padding:0.3rem 0.6rem; border-radius:4px; font-weight:bold;}
        .team-management-actions { display: flex; gap: 1rem; margin-top: 1.5rem; border-top: 1px solid var(--border-color); padding-top: 1.5rem; }
        .leave-team-btn { padding: 0.8rem 1.5rem; background: var(--color-orange-100); color: var(--color-orange-600); border:1px solid var(--color-orange-500); border-radius: 8px; font-weight: 600; }
        .leave-team-btn:hover { background: var(--color-orange-500); color:white; }
        .delete-team-btn { padding: 0.8rem 1.5rem; background: var(--error-bg); color: var(--error-text); border:1px solid var(--error-border); border-radius: 8px; font-weight: 600; display:inline-flex; align-items:center; gap:0.5rem;}
        .delete-team-btn:hover { background: var(--error-text); color:white; }

        .no-team-actions { display:grid; grid-template-columns:1fr; gap:2.5rem; max-width:700px; margin:0 auto;}
        .team-action-card { background:var(--bg-card); padding:2rem; border-radius:10px; box-shadow:var(--shadow-md); text-align:center; border: 1px solid var(--border-color); }
        .team-action-card h3 {font-size:1.4rem; font-weight:600; margin-bottom:0.5rem;}
        .team-action-card p {font-size:1rem; color:var(--text-secondary); margin-bottom:1.5rem;}
        .input-group { display:flex; gap:1rem; }
        .input-group input {flex-grow:1;}
        .input-group button { padding: 0.8rem 1.5rem; background: var(--theme-primary); color:white; border-radius:6px; font-weight:500;}
        .input-group button:hover:not(:disabled) {background: var(--theme-primary-dark);}
        .divider-or {text-align:center; font-weight:500; color:var(--text-light); position:relative;}
        .divider-or::before, .divider-or::after {content:''; display:block; width:40%; height:1px; background:var(--border-color); position:absolute; top:50%;}
        .divider-or::before {left:0;} .divider-or::after {right:0;}

        .browse-teams-view.browse-groups-view .search-bar-container { display: flex; align-items: center; margin-bottom: 2.5rem; background: var(--bg-card); padding: 0.6rem 1.2rem; border-radius: 8px; box-shadow: var(--shadow-md); border: 1px solid var(--border-color); }
        .browse-teams-view.browse-groups-view .search-icon { color: #9ca3af; margin-right: 0.8rem; width:1.25rem; height:1.25rem;}
        .browse-teams-view.browse-groups-view .teams-search-input { flex-grow: 1; border: none; padding: 0.8rem 0.5rem; font-size: 1.05rem; outline: none; background:transparent; }
        .teams-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 2rem; }
        .team-browse-card.study-group-browse-card { background: var(--bg-card); padding: 1.75rem; border-radius: 10px; box-shadow: var(--shadow-md); display:flex; flex-direction:column; transition: transform 0.2s, box-shadow 0.2s; border: 1px solid var(--border-color); }
        .team-browse-card.study-group-browse-card:hover {transform:translateY(-4px); box-shadow:var(--shadow-lg); border-color: var(--theme-primary-light);}
        .team-browse-card.study-group-browse-card .team-card-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;}
        .team-browse-card.study-group-browse-card h3 { font-size: 1.3rem; color: var(--theme-primary-dark); margin-bottom:0.25rem; font-weight:600;}
        .team-browse-card.study-group-browse-card .team-code-badge { font-size:0.8rem; background-color:var(--theme-secondary); color:var(--text-primary); padding:0.3rem 0.7rem; border-radius:12px; font-weight:500;}
        .team-browse-card.study-group-browse-card .team-description { color: var(--text-secondary); font-size:0.95rem; line-height:1.5; margin-bottom:1.5rem; flex-grow:1;}
        .team-browse-card.study-group-browse-card .team-card-footer { display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-color); padding-top:1.25rem; font-size:0.9rem; color:var(--text-light);}
        .team-browse-card.study-group-browse-card .team-card-footer span { display:flex; align-items:center; gap:0.4rem;}
        .join-team-browse-btn { background-color: var(--theme-primary); color:white; padding: 0.7rem 1.2rem; border-radius:6px; font-weight:500;}
        .join-team-browse-btn:hover:not(:disabled) { background-color: var(--theme-primary-dark);}
        .join-team-browse-btn:disabled { background-color: #bdc3c7; }
        .current-team-indicator { color: var(--color-green-600); font-weight:600; display:flex; align-items:center; gap:0.3rem;}

        .leaderboard-view .leaderboard-list { background: var(--bg-card); border-radius:10px; box-shadow: var(--shadow-lg); overflow:hidden; border: 1px solid var(--border-color); }
        .leaderboard-item { display:flex; align-items:center; padding: 1.25rem 1.75rem; border-bottom: 1px solid var(--border-color); transition: background-color 0.2s;}
        .leaderboard-item:last-child {border-bottom:none;}
        .leaderboard-item:hover { background-color: var(--theme-primary-hover); }
        .leaderboard-item.current-team.current-study-group { background-color: var(--theme-primary-light); border-left: 5px solid var(--theme-primary); padding-left: calc(1.75rem - 5px);}
        .leaderboard-item .rank-badge { font-size:1.2rem; font-weight:700; color:var(--text-primary); width:3.5rem; text-align:left;}
        .leaderboard-item .team-info { flex-grow:1; }
        .leaderboard-item .team-info h3 {font-size:1.2rem; color:var(--theme-primary-dark); margin-bottom:0.1rem; font-weight:600;}
        .leaderboard-item .team-info p {font-size:0.9rem; color:var(--text-light);}
        .leaderboard-item .team-xp {font-size:1.2rem; font-weight:700; color:var(--color-green-500); margin-left:auto; text-align:right;}

        .challenge-view { background: var(--bg-card); padding: 2rem; border-radius: 12px; box-shadow: var(--shadow-lg); border: 1px solid var(--border-color); }
        .challenge-idle-content { text-align:center; padding: 2rem 0;}
        .challenge-idle-content h2 { font-size: 1.8rem; color: var(--text-primary); margin-bottom: 0.75rem; }
        .challenge-idle-content p { font-size: 1.1rem; color: var(--text-secondary); margin-bottom: 2rem; }
        .challenge-action-btn { padding: 0.8rem 1.5rem; border-radius:8px; font-size:1rem; font-weight:500; display:inline-flex; align-items:center; justify-content:center; gap:0.6rem; border:1px solid transparent; line-height: 1.2;}
        .start-challenge-btn { background-color: var(--theme-accent); color:white; padding: 1rem 2.5rem; font-size:1.1rem; font-weight:600;}
        .start-challenge-btn:hover:not(:disabled) { background-color: #e69500; /* Darker orange */ }

        .active-challenge .challenge-header { display: flex; justify-content: space-between; align-items: center; margin-bottom:1.5rem; padding-bottom:1rem; border-bottom:1px solid var(--border-color); }
        .active-challenge .challenge-header h2 { font-size:1.4rem; font-weight:600; color:var(--text-primary); }
        .challenge-timer { font-size:1rem; font-weight:500; color:var(--text-secondary); display:flex; align-items:center; gap:0.4rem; }
        .timer-critical { color: var(--color-red-500); font-weight: bold; }
        .challenge-score { font-size:1rem; font-weight:500; color:var(--color-green-500); }

        .challenge-question-card { padding: 1rem 0; }
        .challenge-question-card .question-category-tag { display:inline-block; background-color:var(--theme-primary-light); color:var(--theme-primary-dark); padding:0.3rem 0.8rem; border-radius:12px; font-size:0.85rem; margin-bottom:1rem;}
        .challenge-question-card h3 { font-size: 1.4rem; font-weight: 600; margin-bottom: 1.5rem; line-height: 1.4; color:var(--text-primary); }
        .challenge-options-list { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem; }
        .challenge-option-btn { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: white; border: 2px solid var(--border-color); border-radius: 8px; text-align: left; width:100%; font-size:1rem;}
        .challenge-option-btn:hover:not(:disabled) { border-color: var(--theme-primary-light); background: var(--theme-primary-hover); }
        .challenge-option-btn.selected:not(.correct):not(.incorrect) { border-color: var(--theme-primary); background: var(--theme-primary-light); font-weight:500;}
        .challenge-option-btn.correct { background-color: var(--success-bg); border-color: var(--success-border); color: var(--success-text); font-weight: bold; }
        .challenge-option-btn.incorrect { background-color: var(--error-bg); border-color: var(--error-border); color: var(--error-text); }
        .challenge-option-btn .option-letter { background: #e9ecef; }
        .challenge-option-btn.selected:not(.correct):not(.incorrect) .option-letter { background: var(--theme-primary); color: white; }
        .challenge-option-btn.correct .option-letter { background: var(--color-green-500); color: white; }
        .challenge-option-btn.incorrect .option-letter { background: var(--color-red-500); color: white; }

        .challenge-feedback { margin-top:1.5rem; padding:1rem; border-radius:8px; }
        .challenge-feedback .feedback-correct { color:var(--success-text); font-weight:bold; display:flex; align-items:center; gap:0.5rem; margin-bottom:0.5rem; }
        .challenge-feedback .feedback-incorrect { color:var(--error-text); font-weight:bold; display:flex; align-items:center; gap:0.5rem; margin-bottom:0.5rem;}
        .challenge-feedback .explanation-text { font-size:0.9rem; color:var(--text-secondary); margin-bottom:1rem; }
        .next-question-btn { background-color: var(--theme-primary); color:white; margin-top:1rem; }
        .next-question-btn:hover:not(:disabled) { background-color: var(--theme-primary-dark); }

        .challenge-results .results-summary { text-align:center; padding:2rem 0; font-size:1.2rem; color:var(--text-secondary);}
        .challenge-results .xp-earned-challenge { font-size:1.4rem; color:var(--color-green-600); font-weight:bold; margin-top:0.5rem;}
        .challenge-ended-options { margin-top:1.5rem; display:flex; justify-content:center; gap:1.5rem;}
        .play-again-btn { background-color:var(--theme-accent); color:white; border-color:var(--theme-accent);}
        .play-again-btn:hover { background-color:#e69500;}
        .back-dashboard-btn { background-color:#6c757d; color:white; border-color:#5a6268;}
        .back-dashboard-btn:hover { background-color:#5a6268;}

        .challenge-config {
          margin: 1.5rem auto 2rem;
          max-width: 550px;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          background-color: #f8f9fa;
          padding: 1.5rem;
          border-radius: 10px;
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-sm);
        }
        .config-item {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .config-item label {
          font-weight: 500;
          color: var(--text-primary);
          font-size: 0.95rem;
          text-align: left;
        }
        .config-item select,
        .config-item input[type="number"] {
          padding: 0.7rem 0.9rem;
          border-radius: 6px;
          border: 1px solid #ced4da;
          font-size: 0.95rem;
          background-color: white;
        }
        .config-item select:focus,
        .config-item input[type="number"]:focus {
            border-color: var(--theme-accent);
            box-shadow: 0 0 0 0.2rem rgba(245, 166, 35, 0.25); /* Accent color shadow */
            outline: none;
        }
        .category-checkboxes {
          display: flex;
          flex-wrap: wrap;
          gap: 0.8rem;
          justify-content: flex-start;
        }
        .category-checkbox-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background-color: white;
          padding: 0.6rem 0.9rem;
          border-radius: 6px;
          border: 1px solid #ced4da;
          font-size: 0.9rem;
          cursor: pointer;
          transition: border-color 0.2s;
        }
        .category-checkbox-item:hover {
            border-color: var(--theme-primary-light);
        }
        .category-checkbox-item input[type="checkbox"] {
          width: 1rem;
          height: 1rem;
          accent-color: var(--theme-primary); /* Checkbox uses primary theme color */
          cursor: pointer;
        }
        .category-checkbox-item label {
            cursor: pointer;
            font-weight: normal;
            color: var(--text-secondary);
        }

        @media (max-width: 1024px) {
            .nav-items { gap: 0.3rem; } /* Further reduce gap */
            .nav-item { padding: 0.6rem 0.7rem; font-size:0.9rem;}
            .main-content { padding: 2rem 1.5rem; }
        }
        @media (max-width: 768px) {
            .nav { flex-direction:column; height:auto; padding:1rem; }
            .nav-brand {margin-bottom:0.75rem;}
            .nav-items { width:100%; flex-direction:column; align-items:stretch; gap:0.3rem; margin-top:0.5rem; }
            .nav-item { justify-content:flex-start; }
            .nav-user { width:100%; border-left:none; border-top:1px solid var(--border-color); margin-top:1rem; padding-top:1rem; justify-content:space-between; margin-left:0;}
            .main-content { padding: 1.5rem 1rem; }
            .view-header h1 {font-size:1.8rem;} .view-header p {font-size:1rem;}
            .dashboard-header {flex-direction:column; align-items:stretch;}
            .welcome-section h1 {font-size:1.8rem;}
            .modules-grid, .teams-grid {grid-template-columns:1fr;}
            .module-view.event-view .module-title-section {flex-direction:column; align-items:flex-start;}
            .lesson-content-view h2 {font-size:1.6rem;}
            .quiz-header-info h2 {font-size:1.5rem;}
            .options-list, .challenge-options-list {max-width:100%;}
            .no-team-actions {grid-template-columns:1fr;}
            .input-group {flex-direction:column;}
            .input-group button {width:100%;}
            .divider-or::before, .divider-or::after {width:35%;}
            .active-challenge .challenge-header { flex-direction:column; gap:0.75rem; align-items:flex-start;}
            .challenge-config { max-width: 100%; }
            .team-management-actions { flex-direction: column; gap: 0.75rem; }
            .team-management-actions .leave-team-btn, .team-management-actions .delete-team-btn { width: 100%; }
        }
        @media (max-width: 480px) {
            .login-card {padding: 2rem 1.5rem;}
            .login-header h1 {font-size:2rem;}
            .features-preview {grid-template-columns:1fr; gap:1rem;}
            .main-content {padding:1rem 0.75rem;}
            .nav {padding:0.75rem;}
            .nav-item {padding:0.7rem 0.8rem;}
            .stat-card {flex-direction:column; align-items:flex-start; text-align:left;}
            .stat-card .stat-icon {margin-bottom:0.5rem;}
            .module-card h3, .team-browse-card.study-group-browse-card h3 {font-size:1.2rem;}
            .lesson-item {padding:1rem; flex-wrap:wrap;}
            .lesson-item .lesson-btn {width:100%; margin-top:0.75rem; justify-content:center;}
            .lesson-content-view {padding:1.5rem;}
            .quiz-view.practice-view, .challenge-view {padding:1.5rem;}
            .option-btn, .challenge-option-btn {padding:1rem; font-size:0.95rem;}
            .current-team-card.current-study-group-card .team-card-main {flex-direction:column; align-items:center; text-align:center; gap:1rem;}
            .team-avatar-icon {margin-bottom:0.5rem;}
            .challenge-question-card h3 { font-size:1.2rem; }
            .category-checkboxes { justify-content: center; }
        }
      `}</style>
    </>
  );
};

export default App;