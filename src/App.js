import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GoogleOAuthProvider, GoogleLogin, googleLogout } from '@react-oauth/google';
import { Play, Users, Trophy, BookOpen, Code, Zap, Target, Award, ChevronRight, X, Check, RotateCcw, Home, LogOut, Search, Eye, MessageSquare, Brain, Settings2, Puzzle, HelpCircle, Clock, BarChart2, Layers, Crosshair, Truck, Wrench, University, SquarePen, Terminal, Bot, CircuitBoard, Radar, Trash2 } from 'lucide-react';

import { auth, db } from './Firebase'; // Assuming Firebase.js is correctly configured
import { GoogleAuthProvider as FirebaseGoogleAuthProvider, signInWithCredential, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import {
  doc, getDoc, setDoc, updateDoc, writeBatch,
  collection, query, where, getDocs, addDoc, serverTimestamp,
  increment, arrayUnion, arrayRemove, orderBy, limit, deleteDoc
} from 'firebase/firestore';

console.log("[App.js] Value of 'auth' imported from ./Firebase.js:", auth);
console.log("[App.js] Value of 'db' imported from ./Firebase.js:", db);

// Helper function to generate unique IDs (slugify)
const slugify = (text) => text.toString().toLowerCase().trim()
  .replace(/\s+/g, '-')           // Replace spaces with -
  .replace(/[^\w-]+/g, '')       // Remove all non-word chars
  .replace(/--+/g, '-')         // Replace multiple - with single -
  .replace(/^-+/, '')             // Trim - from start of text
  .replace(/-+$/, '');            // Trim - from end of text

// Helper function to generate placeholder contentDetail
const generateContentDetail = (title, customText = "") => {
  const placeholderText = customText || `Comprehensive guide on ${title}. Learn about its principles, applications in VEX robotics, and best practices. Detailed examples and diagrams will be provided.`;
  return `<h1>${title}</h1><p>${placeholderText}</p><img src='https://placehold.co/600x350/EBF0F5/8FA4B8?text=${encodeURIComponent(title)}' alt='${title}' style='width:100%;max-width:450px;border-radius:8px;margin:1.5rem auto;display:block;border:1px solid #ccc;'>`;
};

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '664588170188-e2mvb0g24k22ghdfv6534kp3808rk70q.apps.googleusercontent.com';
const XP_PER_LEVEL = 500;
const CHALLENGE_MAX_XP = 100;
const QUESTIONS_PER_CHALLENGE = 5;
const QUESTION_TIMER_DURATION = 20;


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
          <Target className="brand-icon-large" style={{color: '#667eea'}}/>
          <h1>Vexcel</h1>
          <p>Your Ultimate VEX V5 Learning & Competition Platform</p>
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
          <div className="feature"><BookOpen className="feature-icon" /><span>Interactive Modules</span></div>
          <div className="feature"><Users className="feature-icon" /><span>Team Collaboration</span></div>
          <div className="feature"><Trophy className="feature-icon" /><span>Leaderboards</span></div>
          <div className="feature"><Puzzle className="feature-icon" /><span>Knowledge Challenges</span></div>
        </div>
        <p className="login-footer">© {new Date().getFullYear()} Vexcel Platform. Empowering VEX enthusiasts.</p>
      </div>
    </div>
  </GoogleOAuthProvider>
);

const Navigation = ({ user, currentView, navigate, handleLogout, actionLoading }) => (
  <nav className="nav">
    <div className="nav-brand" onClick={() => user && navigate('dashboard')} style={{cursor: user ? 'pointer' : 'default'}}>
      <img src="/brand-logo.png" alt="Vexcel Logo" className="brand-logo-image" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.marginLeft='0'; }}/>
      <span className="brand-text">Vexcel</span>
    </div>
    {user && (
      <div className="nav-items">
        <button className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => navigate('dashboard')}><Home className="icon" />Dashboard</button>
        <button className={`nav-item ${currentView === 'teams' ? 'active' : ''}`} onClick={() => navigate('teams')}><Users className="icon" />My Team</button>
        <button className={`nav-item ${currentView === 'browseTeams' ? 'active' : ''}`} onClick={() => navigate('browseTeams')}><Search className="icon" />Browse Teams</button>
        <button className={`nav-item ${currentView === 'leaderboard' ? 'active' : ''}`} onClick={() => navigate('leaderboard')}><Trophy className="icon" />Leaderboard</button>
        <button className={`nav-item ${currentView === 'challenge' ? 'active' : ''}`} onClick={() => navigate('challenge')}><Puzzle className="icon" />Challenge</button>
        <div className="nav-user">
          <img src={user.avatar} alt={user.name} className="user-avatar" onError={(e)=>e.target.src='https://source.boringavatars.com/beam/120/default?colors=264653,2a9d8f,e9c46a,f4a261,e76f51'}/>
          <div className="user-info"><span className="user-name">{user.name}</span><span className="user-level">Lvl {user.level} ({user.xp || 0} XP)</span></div>
          <button onClick={handleLogout} className="logout-btn" title="Logout" disabled={actionLoading}><LogOut size={18}/></button>
        </div>
      </div>
    )}
  </nav>
);

const Dashboard = ({ user, userProgress, userTeam, learningModules, navigate, actionLoading }) => {
  if (!user) return null;
  const modulesInProgress = learningModules.filter(m => {
      const prog = userProgress[m.id];
      return prog && Object.keys(prog.lessons).length > 0 && Object.keys(prog.lessons).length < m.lessons;
  });
  const recommendedNextModule = modulesInProgress.length > 0 ? modulesInProgress[0] : learningModules.find(m => !userProgress[m.id] || Object.keys(userProgress[m.id].lessons).length === 0);
  
  const allCategories = [...new Set(learningModules.map(m => m.category || 'General'))];
  const preferredCategoryOrder = ['Hardware', 'Software', 'CAD', 'Electronics', 'Sensors', 'Team Management', 'Competition', 'AI', 'General'];
  const categoryOrder = [...new Set([...preferredCategoryOrder, ...allCategories])];

  const categorizedModules = learningModules.reduce((acc, module) => {
      const category = module.category || 'General';
      if (!acc[category]) acc[category] = [];
      acc[category].push(module);
      return acc;
  }, {});

  return (
  <div className="dashboard">
    <div className="dashboard-header">
      <div className="welcome-section">
        <h1>Welcome back, {user.name}!</h1>
        <p>Ready to tackle new VEX challenges today?</p>
      </div>
      <div className="stats-grid">
        <div className="stat-card"><Award className="stat-icon" /><div><span className="stat-value">{user.xp || 0}</span><span className="stat-label">Total XP</span></div></div>
        <div className="stat-card"><Target className="stat-icon" /><div><span className="stat-value">{user.level}</span><span className="stat-label">Level</span></div></div>
        <div className="stat-card"><Zap className="stat-icon" /><div><span className="stat-value">{user.streak}</span><span className="stat-label">Day Streak</span></div></div>
      </div>
    </div>
    {userTeam && (
      <div className="team-card">
        <div className="team-info"> <Users className="team-icon" /> <div> <h3>{userTeam.name}</h3> <p>{(userTeam.memberIds ? userTeam.memberIds.length : 0)} members • Rank #{userTeam.rank || 'N/A'} • Code: <code>{userTeam.code}</code></p> </div> </div>
        <div className="team-stats"><span className="team-xp">{(userTeam.totalXP || 0).toLocaleString()} XP</span></div>
      </div>
    )}
    {recommendedNextModule && (
        <div className="recommended-module-card" onClick={() => navigate('module', recommendedNextModule)}>
            <div className="recommended-tag">Recommended Next</div>
            <recommendedNextModule.icon className="module-icon" style={{color: `var(--color-${recommendedNextModule.color}-500)`}}/>
            <h3>{recommendedNextModule.title}</h3>
            <p>{recommendedNextModule.description.substring(0,100)}...</p>
            <button className="start-btn small" disabled={actionLoading}>
                {userProgress[recommendedNextModule.id] && Object.keys(userProgress[recommendedNextModule.id].lessons).length > 0 ? 'Continue Module' : 'Start Module'} <ChevronRight className="icon-small"/>
            </button>
        </div>
    )}
    <div className="modules-section">
      {categoryOrder.map(category => {
          if (!categorizedModules[category] || categorizedModules[category].length === 0) return null;
          return (
              <div key={category} className="module-category-section">
                  <h2 className="category-title">{category} Modules</h2>
                  <div className="modules-grid">
                  {categorizedModules[category].map((module) => {
                      const Icon = module.icon;
                      const prog = userProgress[module.id] || { lessons: {}, moduleXp: 0 };
                      const completedCount = Object.values(prog.lessons).filter(l => l.completed).length;
                      const progressPercent = module.lessons > 0 ? (completedCount / module.lessons) * 100 : 0;
                      return (
                      <div key={module.id} className={`module-card ${module.color}`} onClick={() => navigate('module', module)}>
                          <div className="module-header"> <Icon className="module-icon" /> <div className="module-meta"> <span className="difficulty">{module.difficulty}</span> <span className="duration">{module.duration}</span> </div> </div>
                          <h3>{module.title}</h3> <p>{module.description}</p>
                          <div className="progress-section">
                          <div className="progress-bar"><div className="progress-fill" style={{ width: `${progressPercent}%` }}></div></div>
                          <span className="progress-text">{completedCount}/{module.lessons} items ({(prog.moduleXp || 0)} XP)</span>
                          </div>
                          <button className="start-btn" disabled={actionLoading}> {progressPercent === 100 ? 'Review Module' : progressPercent > 0 ? 'Continue Learning' : 'Start Learning'} <ChevronRight className="icon" /> </button>
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

const ModuleView = ({ selectedModule, userProgress, navigate, actionLoading }) => {
  if (!selectedModule) return <p className="error-message">Module not found. Please go back to the dashboard.</p>;
  const moduleProg = userProgress[selectedModule.id] || { lessons: {} };
  const Icon = selectedModule.icon;
  return (
    <div className="module-view">
      <div className="module-view-header">
        <button onClick={() => navigate('dashboard')} className="back-btn" disabled={actionLoading}><ChevronRight className="icon rotated" /> Back to Dashboard</button>
        <div className="module-title-section">
          <Icon className="module-icon-large" style={{color: `var(--color-${selectedModule.color}-500)`}} />
          <div>
            <span className="category-tag-module">{selectedModule.category || 'General'}</span>
            <h1>{selectedModule.title}</h1> <p>{selectedModule.description}</p>
            <div className="module-badges"> <span className="badge">{selectedModule.difficulty}</span> <span className="badge">{selectedModule.duration}</span> <span className="badge">{selectedModule.lessons} items</span> </div>
          </div>
        </div>
      </div>
      <div className="lessons-list">
        {selectedModule.content.lessons.map((lesson, index) => {
          const lessonState = moduleProg.lessons[lesson.id.replace(/\./g, '_')] || { completed: false };
          const isCompleted = lessonState.completed;
          const prevLessonSanitizedId = index > 0 ? selectedModule.content.lessons[index - 1].id.replace(/\./g, '_') : null;
          const isLocked = index > 0 && !(moduleProg.lessons[prevLessonSanitizedId]?.completed);
          const LessonIcon = lesson.type === 'quiz' ? Puzzle : lesson.type === 'game' ? Play : MessageSquare;
          return (
            <div key={lesson.id} className={`lesson-item ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''}`}
              onClick={() => {
                if (actionLoading || (isLocked && !isCompleted)) return;
                if (lesson.type === 'lesson') navigate('lessonContent', { moduleId: selectedModule.id, lesson });
                else if (lesson.type === 'quiz') navigate('quiz', { moduleId: selectedModule.id, lesson });
                else if (lesson.type === 'game') navigate('game', { moduleId: selectedModule.id, lesson });
              }}>
              <div className="lesson-number">{isCompleted ? <Check className="icon-small" /> : index + 1}</div>
              <LessonIcon className="lesson-type-icon" style={{color: `var(--color-${selectedModule.color}-500)`}}/>
              <div className="lesson-content"> <h3>{lesson.title}</h3> <span className="lesson-type-badge">{lesson.type} (+{lesson.xp} XP)</span> </div>
              <button className="lesson-btn" disabled={actionLoading || (isLocked && !isCompleted)}> {isCompleted ? 'Review' : (isLocked ? 'Locked' : 'Start')} <ChevronRight className="icon-small" /> </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const LessonContentView = ({ currentLesson, selectedModule, userProgress, handleCompleteItem, navigate, actionLoading }) => {
  if (!currentLesson || !selectedModule) return <p className="error-message">Lesson content not found or module context missing.</p>;
  const moduleProg = userProgress[selectedModule.id] || { lessons: {} };
  const lessonState = moduleProg.lessons[currentLesson.id.replace(/\./g, '_')] || { completed: false };
  const isCompleted = lessonState.completed;

  const handleMarkCompleteAndContinue = () => {
    if (actionLoading) return;
    const sanitizedLessonId = currentLesson.id.replace(/\./g, '_');
    if (!isCompleted) handleCompleteItem(selectedModule.id, sanitizedLessonId, currentLesson.type, null, currentLesson.xp);
    
    const currentIndex = selectedModule.content.lessons.findIndex(l => l.id === currentLesson.id);
    const nextLesson = selectedModule.content.lessons[currentIndex + 1];
    if (nextLesson) {
      const nextLessonProg = moduleProg.lessons[nextLesson.id.replace(/\./g, '_')] || { completed: false };
      // const currentNowCompleted = true; 
      // const isNextLocked = !(currentNowCompleted || nextLessonProg.completed) && currentIndex + 1 > 0 && selectedModule.content.lessons[currentIndex].type !== 'quiz' && selectedModule.content.lessons[currentIndex].type !== 'game';

      // if (isNextLocked && !(moduleProg.lessons[selectedModule.content.lessons[currentIndex].id.replace(/\./g, '_')]?.completed)) {
      //        navigate('module', { id: selectedModule.id }); return;
      // }

      if (nextLesson.type === 'lesson') navigate('lessonContent', { moduleId: selectedModule.id, lesson: nextLesson });
      else if (nextLesson.type === 'quiz') navigate('quiz', { moduleId: selectedModule.id, lesson: nextLesson });
      else if (nextLesson.type === 'game') navigate('game', { moduleId: selectedModule.id, lesson: nextLesson });
      else navigate('module', { id: selectedModule.id });
    } else navigate('module', { id: selectedModule.id });
  };

  return (
    <div className="lesson-content-view">
      <button onClick={() => navigate('module', {id: selectedModule.id})} className="back-btn" disabled={actionLoading}><ChevronRight className="icon rotated" /> Back to {selectedModule.title}</button>
      <div className="lesson-title-header">
          <MessageSquare className="lesson-type-icon-large" style={{color: `var(--color-${selectedModule.color}-500)`}}/>
          <h2>{currentLesson.title}</h2>
      </div>
      <div className="content-area" dangerouslySetInnerHTML={{ __html: currentLesson.contentDetail || "<p>No detailed content available for this lesson.</p>" }} />
      <button onClick={handleMarkCompleteAndContinue} className="complete-lesson-btn" disabled={actionLoading}>
        {isCompleted ? 'Continue to Next Item' : `Mark as Complete & Continue (+${currentLesson.xp} XP)`}
        <ChevronRight className="icon-small"/>
      </button>
    </div>
  );
};

const QuizView = ({ quizData, sampleQuizzes, userProgress, selectedModule, handleCompleteItem, navigate, actionLoading, setMessage }) => {
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [selectedAns, setSelectedAns] = useState(null);
  const [showRes, setShowRes] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);

  if (!quizData || !quizData.lessonId) return <p className="error-message">Loading quiz...</p>;
  const sanitizedLessonId = quizData.lessonId.replace(/\./g, '_');
  const quizContent = sampleQuizzes[sanitizedLessonId];
  if (!quizContent) return <p className="error-message">Quiz content not found for: {quizData.lessonId}. Please check `sampleQuizzes` and ensure keys match sanitized lesson IDs.</p>;

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
      const passPercent = 70;
      const currentModuleProgress = userProgress[quizData.moduleId]?.lessons[sanitizedLessonId] || {};
      if (!currentModuleProgress.completed && (finalScore / quizContent.questions.length) * 100 >= passPercent) {
        handleCompleteItem(quizData.moduleId, sanitizedLessonId, 'quiz', finalScore, quizData.lesson.xp);
      } else if (currentModuleProgress.completed) {
          setMessage(`Quiz reviewed. Score: ${finalScore}/${quizContent.questions.length}. XP already earned.`);
      }
      else { 
          setMessage(`Quiz attempt recorded. Score: ${finalScore}/${quizContent.questions.length}. You need ${passPercent}% to pass and earn XP.`);
      }
    }
  };
  const resetQuiz = () => { setCurrentQIdx(0); setSelectedAns(null); setShowRes(false); setQuizScore(0); setShowExplanation(false); };

  if (showRes) {
    const perc = Math.round((quizScore / quizContent.questions.length) * 100);
    const passed = perc >= 70;
    const currentModuleProgress = userProgress[quizData.moduleId]?.lessons[sanitizedLessonId] || {};
    return (
      <div className="quiz-result">
        <div className={`result-icon ${passed ? 'success' : 'fail'}`}>{passed ? <Check /> : <X />}</div>
        <h2>{passed ? 'Excellent Work!' : 'Keep Practicing!'}</h2>
        <p>Your score: {quizScore}/{quizContent.questions.length} ({perc}%)</p>
        {passed && !currentModuleProgress.completed && <p className="xp-earned">+{quizData.lesson.xp} XP Earned!</p>}
        {passed && currentModuleProgress.completed && <p className="xp-earned">XP previously earned for this quiz.</p>}
        {!passed && <p>You need 70% to pass and earn XP for this quiz.</p>}
        <div className="result-actions">
          <button onClick={resetQuiz} className="retry-btn" disabled={actionLoading}><RotateCcw className="icon-small"/> Try Again</button>
          <button onClick={() => navigate('module', {id: quizData.moduleId})} className="continue-btn" disabled={actionLoading}>Back to Module <ChevronRight className="icon-small"/></button>
        </div>
      </div>
    );
  }
  const q = quizContent.questions[currentQIdx];
  return (
    <div className="quiz-view">
      <button onClick={() => navigate('module', {id: quizData.moduleId})} className="back-btn" disabled={actionLoading}><ChevronRight className="icon rotated"/> Back to Module</button>
      <div className="quiz-header-info">
          <Puzzle className="lesson-type-icon-large" style={{color: selectedModule ? `var(--color-${selectedModule.color}-500)` : '#3b82f6'}}/>
          <h2>{quizContent.title}</h2>
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
        {showExplanation && <button className="submit-btn" onClick={handleNextQ} disabled={actionLoading}>{currentQIdx + 1 === quizContent.questions.length ? 'Finish Quiz' : 'Next Question'}</button>}
      </div>
    </div>
  );
};

const GameView = ({ gameData, sampleGames, userProgress, selectedModule, handleCompleteItem, navigate, actionLoading, setMessage }) => {
  if (!gameData || !gameData.lessonId) return <p className="error-message">Loading game...</p>;
  const sanitizedLessonId = gameData.lessonId.replace(/\./g, '_');
  const gameContent = sampleGames[sanitizedLessonId];
  if (!gameContent) return <p className="error-message">Game content not found for: {gameData.lessonId}. Please check `sampleGames` and ensure keys match sanitized lesson IDs.</p>;

  const handleCompleteGame = () => {
    if (actionLoading) return;
    const isAlreadyCompleted = userProgress[gameData.moduleId]?.lessons[sanitizedLessonId]?.completed;
    if (!isAlreadyCompleted) {
      handleCompleteItem(gameData.moduleId, sanitizedLessonId, 'game', null, gameContent.xp || 30);
      setMessage(`Challenge "${gameContent.title}" completed! +${gameContent.xp || 30} XP`);
    } else {
      setMessage(`Challenge "${gameContent.title}" reviewed. XP already earned.`);
    }
    navigate('module', {id: gameData.moduleId});
  };

  return (
    <div className="game-view">
      <button onClick={() => navigate('module', {id: gameData.moduleId})} className="back-btn" disabled={actionLoading}><ChevronRight className="icon rotated"/> Back to Module</button>
      <div className="game-header-info">
          <Play className="lesson-type-icon-large" style={{color: selectedModule ? `var(--color-${selectedModule.color}-500)` : '#3b82f6'}}/>
          <h2>{gameContent.title}</h2>
      </div>
      <div className="game-container">
        <p className="game-instructions">{gameContent.instructions}</p>
        <div className="game-placeholder">Simulated Game Area / Conceptual Challenge</div>
        <button onClick={handleCompleteGame} className="complete-game-btn" disabled={actionLoading}>Complete Challenge</button>
      </div>
    </div>
  );
};

const TeamsView = ({
  user,
  userTeam,
  actionLoading,
  joinTeamCodeInput,
  setJoinTeamCodeInput,
  createTeamNameInput,
  setCreateTeamNameInput,
  onJoinTeam,
  onCreateTeam,
  onLeaveTeam,
  onDeleteTeam
}) => {
  return (
    <div className="teams-view">
      <div className="view-header"> <Users className="header-icon" /> <h1>My Team</h1> <p>Manage your team or join/create a new one.</p> </div>
      {userTeam ? (
        <div className="current-team-card">
          <div className="team-card-main">
            <Users size={48} className="team-avatar-icon" style={{color: `var(--color-${userTeam.color || 'blue'}-500)`}}/>
            <div>
                <h2>{userTeam.name}</h2>
                <p className="team-description-small">{userTeam.description}</p>
                <p><strong>Team Code:</strong> <code className="team-code-display">{userTeam.code}</code> (Share this!)</p>
                <p>{(userTeam.memberIds ? userTeam.memberIds.length : 0)} members • Rank #{userTeam.rank || 'N/A'} • {(userTeam.totalXP || 0).toLocaleString()} Total XP</p>
            </div>
          </div>
          <div className="team-management-actions">
            <button className="leave-team-btn" onClick={onLeaveTeam} disabled={actionLoading}>{actionLoading ? 'Processing...' : 'Leave Team'}</button>
            {user && userTeam.creatorId === user.id && (
                <button className="delete-team-btn" onClick={onDeleteTeam} disabled={actionLoading}>
                    <Trash2 size={16} /> {actionLoading ? 'Deleting...' : 'Delete Team'}
                </button>
            )}
          </div>
        </div>
      ) : (
        <div className="no-team-actions">
          <div className="team-action-card">
            <h3>Join an Existing Team</h3> <p>Enter the code shared by a team leader.</p>
            <div className="input-group">
              <input type="text" placeholder="Enter team code" value={joinTeamCodeInput} onChange={(e) => setJoinTeamCodeInput(e.target.value.toUpperCase())} disabled={actionLoading} />
              <button onClick={() => onJoinTeam()} disabled={actionLoading || !joinTeamCodeInput}>{actionLoading ? 'Processing...' : 'Join Team'}</button>
            </div>
          </div>
          <div className="divider-or">OR</div>
          <div className="team-action-card">
            <h3>Create a New Team</h3> <p>Start your own Vexcel squad!</p>
            <div className="input-group">
              <input type="text" placeholder="Enter new team name" value={createTeamNameInput} onChange={(e) => setCreateTeamNameInput(e.target.value)} disabled={actionLoading} />
              <button onClick={onCreateTeam} disabled={actionLoading || !createTeamNameInput}>{actionLoading ? 'Processing...' : 'Create Team'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const BrowseTeamsView = ({ allTeams, actionLoading, user, currentView, fetchAllTeams, userTeam, onJoinTeam }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const filteredAndSortedTeams = useMemo(() =>
      allTeams
          .filter(team =>
              team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (team.description && team.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
              team.code.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .sort((a,b) => (b.totalXP || 0) - (a.totalXP || 0) || a.name.localeCompare(b.name)),
      [allTeams, searchTerm]
  );

  useEffect(() => {
      if (user && (currentView === 'browseTeams' && allTeams.length === 0 && !actionLoading)) {
          fetchAllTeams();
      }
  }, [currentView, allTeams.length, fetchAllTeams, user, actionLoading]);

  return (
    <div className="browse-teams-view">
      <div className="view-header"> <Eye className="header-icon" /> <h1>Browse All Teams</h1> <p>Find a team, see who's competing, or get inspired!</p> </div>
      <div className="search-bar-container"> <Search className="search-icon" /> <input type="text" placeholder="Search by name, description, or code..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="teams-search-input" /> </div>
      {actionLoading && allTeams.length === 0 && <div className="full-page-loader"><div className="spinner"></div><p>Loading teams...</p></div>}
      {!actionLoading && allTeams.length === 0 && currentView === 'browseTeams' ? (
        <p className="info-message">No teams exist yet. Go to "My Team" to create one!</p>
      ) : filteredAndSortedTeams.length > 0 ? (
        <div className="teams-grid">
          {filteredAndSortedTeams.map(team => (
            <div key={team.id} className="team-browse-card">
              <div className="team-card-header"><h3>{team.name}</h3><span className="team-code-badge">CODE: {team.code}</span></div>
              <p className="team-description">{team.description || "No description available."}</p>
              <div className="team-card-footer">
                <span><Users size={16} /> {(team.memberIds ? team.memberIds.length : 0)} Members</span> <span><Trophy size={16} /> {(team.totalXP || 0).toLocaleString()} XP</span>
                {(!userTeam || userTeam.id !== team.id) && <button onClick={() => onJoinTeam(team.code)} className="join-team-browse-btn" disabled={actionLoading || !!userTeam}>{!!userTeam ? 'In a Team' : (actionLoading ? 'Processing...' : 'Join Team')}</button>}
                {userTeam && userTeam.id === team.id && <span className="current-team-indicator"><Check size={16}/> Your Team</span>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        !actionLoading && <p className="info-message">No teams match your search criteria.</p>
      )}
    </div>
  );
};

const LeaderboardView = ({ allTeams, actionLoading, user, currentView, fetchAllTeams, userTeam }) => {
  const sortedLeaderboard = useMemo(() =>
      [...allTeams].sort((a, b) => (b.totalXP || 0) - (a.totalXP || 0)).map((team, index) => ({ ...team, rank: index + 1 })),
      [allTeams]
  );

  useEffect(() => {
      if (user && (currentView === 'leaderboard' && allTeams.length === 0 && !actionLoading)) {
          fetchAllTeams();
      }
  }, [currentView, allTeams.length, fetchAllTeams, user, actionLoading]);

  return (
    <div className="leaderboard-view">
      <div className="view-header"> <Trophy className="header-icon" /> <h1>Global Team Leaderboard</h1> <p>See how teams stack up in the Vexcel universe!</p> </div>
      {actionLoading && sortedLeaderboard.length === 0 && <div className="full-page-loader"><div className="spinner"></div><p>Loading leaderboard...</p></div>}
      <div className="leaderboard-list">
        {!actionLoading && sortedLeaderboard.length > 0 ? sortedLeaderboard.map((team) => (
          <div key={team.id} className={`leaderboard-item ${userTeam && team.id === userTeam.id ? 'current-team' : ''}`}>
            <span className="rank-badge">#{team.rank}</span>
            <div className="team-info"><h3>{team.name}</h3> <p>{(team.memberIds ? team.memberIds.length : 0)} members • Code: {team.code}</p></div>
            <span className="team-xp">{(team.totalXP || 0).toLocaleString()} XP</span>
          </div>
        )) : !actionLoading && <p className="info-message">The leaderboard is currently empty or no teams were found. Create or join a team to get started!</p>}
      </div>
    </div>
  );
};

const VexpertChallengeView = ({
    user, actionLoading, challengeState, vexpertChallengeBank,
    selectedChallengeCategories, setSelectedChallengeCategories, availableChallengeCategories,
    numChallengeQuestionsInput, setNumChallengeQuestionsInput, onStartChallenge,
    challengeQuestions, currentChallengeQuestionIdx, challengeTimer, showChallengeAnswer, challengeScore,
    onChallengeAnswer, onNextChallengeQuestion, onResetChallenge, questionTimerDuration, navigate
}) => {
    if (actionLoading && challengeState === 'idle') {
        return <div className="full-page-loader"><div className="spinner"></div><p>Preparing Challenge...</p></div>;
    }

    if (challengeState === 'idle') {
      return (
        <div className="challenge-view">
          <div className="view-header">
            <Puzzle className="header-icon" style={{color: 'var(--color-green-500)'}} />
            <h1>Knowledge Challenge</h1>
            <p>Test your VEX robotics knowledge! Answer a series of questions and earn XP.</p>
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
                  {[3, 5, 7, 10, 15, vexpertChallengeBank.length]
                    .filter((val, idx, self) => self.indexOf(val) === idx && val <= vexpertChallengeBank.length && val > 0) 
                    .sort((a,b) => a-b)
                    .map(num => (
                      <option key={num} value={num}>
                        {num === vexpertChallengeBank.length ? `All (${vexpertChallengeBank.length})` : num}
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
                <Clock size={18} /> Time Left: <span className={challengeTimer <=5 ? 'timer-critical': ''}>{challengeTimer}s</span>
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
                    ${currentQuestion.selectedAnswer === index ? 'selected' : ''} // Assume selectedAnswer is part of question object in state for this view
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
                {currentQuestion.selectedAnswer === currentQuestion.correctAnswerIndex ? // Use selectedAnswer from question for feedback
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
            <BarChart2 className="header-icon" style={{color: 'var(--color-green-500)'}} />
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
  const [selectedModule, setSelectedModule] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [userTeam, setUserTeam] = useState(null);
  const [userProgress, setUserProgress] = useState({});
  const [quizData, setQuizData] = useState(null);
  const [gameData, setGameData] = useState(null);

  const [joinTeamCodeInput, setJoinTeamCodeInput] = useState('');
  const [createTeamNameInput, setCreateTeamNameInput] = useState('');
  const [allTeams, setAllTeams] = useState([]);

  const [challengeState, setChallengeState] = useState('idle');
  const [challengeQuestions, setChallengeQuestions] = useState([]);
  const [currentChallengeQuestionIdx, setCurrentChallengeQuestionIdx] = useState(0);
  const [challengeScore, setChallengeScore] = useState(0);
  const [challengeSelectedAnswer, setChallengeSelectedAnswer] = useState(null); // This is for App state
  const [showChallengeAnswer, setShowChallengeAnswer] = useState(false);
  const [challengeTimer, setChallengeTimer] = useState(QUESTION_TIMER_DURATION);


  const [numChallengeQuestionsInput, setNumChallengeQuestionsInput] = useState(QUESTIONS_PER_CHALLENGE);
  const [availableChallengeCategories, setAvailableChallengeCategories] = useState([]);
  const [selectedChallengeCategories, setSelectedChallengeCategories] = useState([]);


  const learningModules = useMemo(() => [
 {
  id: slugify('Design Fundamentals'),
  category: 'Hardware',
  title: 'Design Fundamentals',
  description: 'Gear Ratios In-Depth, Understanding Internal Forces (Stress), Torque Applications, RPM and Speed Control, Center of Mass (CoM)',
  duration: 'Approx. 75 min',
  lessons: 5,
  difficulty: 'Intermediate',
  color: 'green',
  icon: Settings2,
  content: {
   lessons: [
    { id: slugify('Gear Ratios In-Depth'), title: 'Gear Ratios In-Depth', type: 'lesson', xp: 25, contentDetail: generateContentDetail('Gear Ratios In-Depth', "Gear ratios are one of the most common design decisions that a team must master in order to optimize mechanical advantage in their designs.") },
    { id: slugify('Understanding Internal Forces (Stress)'), title: 'Understanding Internal Forces (Stress)', type: 'lesson', xp: 20, contentDetail: generateContentDetail('Understanding Internal Forces (Stress)', "In materials science, stress refers to the internal forces that exist within a material as a result of external loads or forces acting on it.") },
    { id: slugify('Torque Applications'), title: 'Torque Applications', type: 'lesson', xp: 20, contentDetail: generateContentDetail('Torque Applications', "Torque, also known as moment of force, is a measure of the rotational force applied to an object.") },
    { id: slugify('RPM and Speed Control'), title: 'RPM and Speed Control', type: 'lesson', xp: 20, contentDetail: generateContentDetail('RPM and Speed Control', "RPM, or revolutions per minute, is a measure of the rotational speed of an object.") },
    { id: slugify('Center of Mass (CoM)'), title: 'Center of Mass (CoM)', type: 'lesson', xp: 20, contentDetail: generateContentDetail('Center of Mass (CoM)', "The center of mass significantly impacts the robot's maneuverability. Make sure to consider its effect on each subsystem during the design stage, rather than addressing it after the robot is built.") },
   ]
  }
 },
 {
  id: slugify('Structure'),
  category: 'Hardware',
  title: 'Structure',
  description: 'C-Channels and Angles, Fasteners, Retainers, Gussets and Brackets, Bearings, Plates and Flat Bars',
  duration: 'Approx. 30 min',
  lessons: 6,
  difficulty: 'Beginner',
  color: 'blue',
  icon: Puzzle,
  content: {
   lessons: [
    { id: slugify('C-Channels and Angles'), title: 'C-Channels and Angles', type: 'lesson', xp: 20, contentDetail: generateContentDetail('C-Channels and Angles', "Important components for main structural foundations. The most commonly used type of metal in VEX, C-Channels provide a stable, secure grounding for a majority of subsystems that can be used.") },
    { id: slugify('Fasteners'), title: 'Fasteners', type: 'lesson', xp: 20, contentDetail: generateContentDetail('Fasteners', "Crucial for attaching structural pieces to each other. In the scope of the VEX Robotics Competition, the typical screw will be steel and will have an #8-32 thread size.") },
    { id: slugify('Retainers'), title: 'Retainers', type: 'lesson', xp: 15, contentDetail: generateContentDetail('Retainers', "Simplify robot construction with hex nut retainers and standoffs retainers. Retainers are nylon, hexagonally-shaped parts which have varying protrusions depending on the type of retainer used.") },
    { id: slugify('Gussets and Brackets'), title: 'Gussets and Brackets', type: 'lesson', xp: 20, contentDetail: generateContentDetail('Gussets and Brackets', "Smaller metal pieces used to mount structural components. There are many different varieties of Gusset available to use in the VEX Robotics Competition.") },
    { id: slugify('Bearings'), title: 'Bearings', type: 'lesson', xp: 20, contentDetail: generateContentDetail('Bearings', "Ensure smooth, frictionless motion in moving parts. The most frequently used type of bearing among competition teams, Bearing Flats are most often used on joints.") },
    { id: slugify('Plates and Flat Bars'), title: 'Plates and Flat Bars', type: 'lesson', xp: 15, contentDetail: generateContentDetail('Plates and Flat Bars', "Versatile structural components with a variety of uses. As barebones as it gets, Plate Metal is a 5x15 or 5x25 hole plate.") },
   ]
  }
 },
 {
  id: slugify('Motion Parts'),
  category: 'Hardware',
  title: 'Motion Parts',
  description: 'High Strength Components, Gears and Sprockets, Flex Wheels, Mecanum Wheels, Omnidirectional Wheels, Traction Wheels',
  duration: 'Approx. 90 min',
  lessons: 6,
  difficulty: 'Intermediate',
  color: 'green',
  icon: Layers,
  content: {
   lessons: [
    { id: slugify('High Strength Components'), title: 'High Strength Components', type: 'lesson', xp: 20, contentDetail: generateContentDetail('High Strength Components', "This section covers the difference between various High Strength and Low Strength components in VEX.") },
    { id: slugify('Gears and Sprockets'), title: 'Gears and Sprockets', type: 'lesson', xp: 20, contentDetail: generateContentDetail('Gears and Sprockets', "Gears and sprockets are both used to transfer motion from a powered to an unpowered object.") },
    { id: slugify('Flex Wheels'), title: 'Flex Wheels', type: 'lesson', xp: 20, contentDetail: generateContentDetail('Flex Wheels', "Compressible wheels that are useful for intakes, flywheels, and even drivetrains.") },
    { id: slugify('Mecanum Wheels'), title: 'Mecanum Wheels', type: 'lesson', xp: 20, contentDetail: generateContentDetail('Mecanum Wheels', "Clever programmers can take advantage of mecanum wheels to improve maneuverability in the autonomous period.") },
    { id: slugify('Omnidirectional Wheels'), title: 'Omnidirectional Wheels', type: 'lesson', xp: 20, contentDetail: generateContentDetail('Omnidirectional Wheels', "Wheels that have a multitude of degrees of freedom thanks to their rollers.") },
    { id: slugify('Traction Wheels'), title: 'Traction Wheels', type: 'lesson', xp: 20, contentDetail: generateContentDetail('Traction Wheels', "Mitigate the effects of opposing defense with traction wheels.") },
   ]
  }
 },
 {
  id: slugify('Lifts'),
  category: 'Hardware',
  title: 'Lifts',
  description: 'Double Reverse Four Bar (DR4B), Four Bar Lifts, Scissor Lifts, Six Bar Lifts, Other Lift Designs, Best Practices for Lifts',
  duration: 'Approx. 90 min',
  lessons: 6,
  difficulty: 'Intermediate',
  color: 'green',
  icon: Layers,
  content: {
   lessons: [
    { id: slugify('Double Reverse Four Bar (DR4B)'), title: 'Double Reverse Four Bar (DR4B)', type: 'lesson', xp: 30, contentDetail: generateContentDetail('Double Reverse Four Bar (DR4B)', "The mighty Double Reverse Four Bar. The double reverse four bar (also referred to as DR4B or RD4B) lift is one of the more complicated lift designs used in VEX Robotics competitions.") },
    { id: slugify('Four Bar Lifts'), title: 'Four Bar Lifts', type: 'lesson', xp: 20, contentDetail: generateContentDetail('Four Bar Lifts', "The 4 bar lift, the simplest linkage for keeping both ends parallel. The four bar lift is one of the most used lifts in VEX Robotics competitions due to its relative simplicity and ease of building.") },
    { id: slugify('Scissor Lifts'), title: 'Scissor Lifts', type: 'lesson', xp: 25, contentDetail: generateContentDetail('Scissor Lifts', "The tall and controversial scissor lift. The scissor lift is named because of its overlapping metal bars that open and close similarly to scissors.") },
    { id: slugify('Six Bar Lifts'), title: 'Six Bar Lifts', type: 'lesson', xp: 25, contentDetail: generateContentDetail('Six Bar Lifts', "The six bar lift, the four bar's big brother. The six bar lift is a derivative of the four bar lift.") },
    { id: slugify('Other Lift Designs'), title: 'Other Lift Designs', type: 'lesson', xp: 20, contentDetail: generateContentDetail('Other Lift Designs', "Other lifts that could possibly be found on robots, such as Two Bars, Chain Bars, and Elevator/Cascade Lifts.") },
    { id: slugify('Best Practices for Lifts'), title: 'Best Practices for Lifts', type: 'lesson', xp: 20, contentDetail: generateContentDetail('Best Practices for Lifts', "Tips and Tricks for building good lifts, focusing on bracing and joints.") },
   ]
  }
 },
 {
  id: slugify('Shooting Mechanisms'),
  category: 'Hardware',
  title: 'Shooting Mechanisms',
  description: 'Catapult Designs, Flywheel Shooters, Linear Punchers',
  duration: 'Approx. 60 min',
  lessons: 3,
  difficulty: 'Intermediate',
  color: 'orange',
  icon: Crosshair,
  content: {
   lessons: [
    { id: slugify('Catapult Designs'), title: 'Catapult Designs', type: 'lesson', xp: 25, contentDetail: generateContentDetail('Catapult Designs', "Flingin' things. A catapult is a launching mechanism that utilizes rotational movement in order to fire objects.") },
    { id: slugify('Flywheel Shooters'), title: 'Flywheel Shooters', type: 'lesson', xp: 30, contentDetail: generateContentDetail('Flywheel Shooters', "Shooting things and busting encoders. A flywheel is a mechanism that is designed to store rotational energy as efficiently as possible.") },
    { id: slugify('Linear Punchers'), title: 'Linear Punchers', type: 'lesson', xp: 20, contentDetail: generateContentDetail('Linear Punchers', "Linear punchers are one of the simplest, yet most effective ball-launching mechanisms.") },
   ]
  }
 },
 {
  id: slugify('Drivetrains'),
  category: 'Hardware',
  title: 'Drivetrains',
  description: 'Tank Drive, Mecanum Drive, Holonomic Drive (Non-Mecanum), Designing a Drivetrain, Drivetrain Best Practices',
  duration: 'Approx. 90 min',
  lessons: 5,
  difficulty: 'Intermediate',
  color: 'red',
  icon: Truck,
  content: {
   lessons: [
    { id: slugify('Tank Drive'), title: 'Tank Drive', type: 'lesson', xp: 20, contentDetail: generateContentDetail('Tank Drive', "Tank drives are a very popular type of drivetrain used in the VEX Robotics Competition.") },
    { id: slugify('Mecanum Drive'), title: 'Mecanum Drive', type: 'lesson', xp: 25, contentDetail: generateContentDetail('Mecanum Drive', "The Mecanum Drive is just as simple to build as the Tank Drive, but has the ability to drive sideways.") },
    { id: slugify('Holonomic Drive (Non-Mecanum)'), title: 'Holonomic Drive (Non-Mecanum)', type: 'lesson', xp: 25, contentDetail: generateContentDetail('Holonomic Drive (Non-Mecanum)', "Holonomic drives have become a popular choice for VEX Robotics teams due to their enhanced maneuverability and flexibility in movement. This primarily covers X-Drives and H-Drives.") },
    { id: slugify('Designing a Drivetrain'), title: 'Designing a Drivetrain', type: 'lesson', xp: 20, contentDetail: generateContentDetail('Designing a Drivetrain', "The performance of any drivetrain is based not only on the type selected, but also on the quality with which it is designed and built.") },
    { id: slugify('Drivetrain Best Practices'), title: 'Drivetrain Best Practices', type: 'lesson', xp: 20, contentDetail: generateContentDetail('Drivetrain Best Practices', "This video does a great job show casing some of the best practices when building a drivetrain, focusing on core components like bearing blocks, standoffs, and C-Channels.") },
   ]
  }
 },
 {
  id: slugify('Advanced Building Techniques'),
  category: 'Hardware',
  title: 'Advanced Building Techniques',
  description: 'Pivots and Joints, Pneumatics Systems & Best Practices, Intake Mechanisms, Flip Out Mechanisms, Defensive Mechanisms, Miscellaneous Building Techniques',
  duration: 'Approx. 100 min',
  lessons: 6,
  difficulty: 'Advanced',
  color: 'blue',
  icon: Wrench,
  content: {
   lessons: [
    { id: slugify('Pivots and Joints'), title: 'Pivots and Joints', type: 'lesson', xp: 20, contentDetail: generateContentDetail('Pivots and Joints', "Joints are attachment points between components used to create mechanisms based on rotation. Covers Single-Bearing Screw Joint, Compact Screw Joint, and Axle Joints.") },
    { id: slugify('Pneumatics Systems and Best Practices'), title: 'Pneumatics Systems & Best Practices', type: 'lesson', xp: 25, contentDetail: generateContentDetail('Pneumatics Systems & Best Practices', "Frankly this is just a lot of hot air... Introduction to pneumatics components, subsystems, and best practices for design, construction, and operation.") },
    { id: slugify('Intake Mechanisms'), title: 'Intake Mechanisms', type: 'lesson', xp: 25, contentDetail: generateContentDetail('Intake Mechanisms', "Tips on building a good intake, regardless of the game. Intakes are one of the most common, versatile, and useful mechanisms in VEX Robotics.") },
    { id: slugify('Flip Out Mechanisms'), title: 'Flip Out Mechanisms', type: 'lesson', xp: 20, contentDetail: generateContentDetail('Flip Out Mechanisms', "Tips on building mechanisms that extend outside of the robot's starting size. A lot of times a robot will need to have a mechanism that \"flips out\".") },
    { id: slugify('Defensive Mechanisms'), title: 'Defensive Mechanisms', type: 'lesson', xp: 15, contentDetail: generateContentDetail('Defensive Mechanisms', "With VRC drives becoming more powerful, Defensive Mechanisms can help give teams an edge when it comes to defensive play. Covers wedges, skirts, and defensive wheel setups.") },
    { id: slugify('Miscellaneous Building Techniques'), title: 'Miscellaneous Building Techniques', type: 'lesson', xp: 20, contentDetail: generateContentDetail('Miscellaneous Building Techniques', "Outside of specific mechanisms and subsystems, which have their own section, there is much general information that can be applicable in many applications when building. Covers Box Bracing, Custom Plastic Parts, and Connecting Gears to Wheels.") },
   ]
  }
 },
 {
  id: slugify('Robot Decorations and Customization'),
  category: 'Hardware',
  title: 'Robot Decorations & Customization',
  description: 'Robot Decoration Rules Overview, License Plate Holders, Metal Coloring Techniques, Plastic Part Dyeing',
  duration: 'Approx. 60 min',
  lessons: 4,
  difficulty: 'Beginner',
  color: 'pink',
  icon: Target,
  content: {
   lessons: [
    { id: slugify('Robot Decoration Rules Overview'), title: 'Robot Decoration Rules Overview', type: 'lesson', xp: 15, contentDetail: generateContentDetail('Robot Decoration Rules Overview', "The biggest thing to know about decorations is that Decorations are Allowed, Certain non-VEX components are allowed, and A limited amount of custom plastic is allowed.") },
    { id: slugify('License Plate Holders'), title: 'License Plate Holders', type: 'lesson', xp: 15, contentDetail: generateContentDetail('License Plate Holders', "Non-functional 3D printed license plates, are permitted, including any supporting structures whose sole purpose is to hold, mount, or display an official license plate.") },
    { id: slugify('Metal Coloring Techniques'), title: 'Metal Coloring Techniques', type: 'lesson', xp: 20, contentDetail: generateContentDetail('Metal Coloring Techniques', "Covers painting and anodizing VEX metal parts, including tips and vendor information.") },
    { id: slugify('Plastic Part Dyeing'), title: 'Plastic Part Dyeing', type: 'lesson', xp: 20, contentDetail: generateContentDetail('Plastic Part Dyeing', "This article contains dangerous actions that should only be taken with adult supervision. Instructions on dyeing VEX plastic parts using Rit DyeMore.") },
   ]
  },
 },
 {
  id: slugify('Team Administration'),
  category: 'Team Management',
  title: 'Team Administration',
  description: 'New Team Resources, Team Dynamics and Roles, Team Finances and Fundraising, Hosting VEX Competitions',
  duration: 'Approx. 60 min',
  lessons: 4,
  difficulty: 'Beginner',
  color: 'green',
  icon: Award,
  content: {
   lessons: [
    { id: slugify('New Team Resources'), title: 'New Team Resources', type: 'lesson', xp: 20, contentDetail: generateContentDetail('New Team Resources', "Essential steps and resources for starting a new VEX robotics team, including registration, grants, and initial equipment.") },
    { id: slugify('Team Dynamics and Roles'), title: 'Team Dynamics and Roles', type: 'lesson', xp: 20, contentDetail: generateContentDetail('Team Dynamics and Roles', "Building a cohesive team: defining roles (builder, programmer, driver, notebooker), communication, and conflict resolution.") },
    { id: slugify('Team Finances and Fundraising'), title: 'Team Finances and Fundraising', type: 'lesson', xp: 25, contentDetail: generateContentDetail('Team Finances and Fundraising', "Managing team budgets, fundraising strategies, sponsorships, and financial planning for parts, registration, and travel.") },
    { id: slugify('Hosting VEX Competitions'), title: 'Hosting VEX Competitions', type: 'lesson', xp: 25, contentDetail: generateContentDetail('Hosting VEX Competitions', "A guide for teams interested in hosting their own VEX scrimmages or official events, covering logistics, volunteering, and RECF requirements.") },
    ]
  }
 },
 {
  id: slugify('The Judging Process'),
  category: 'Competition',
  title: 'The Judging Process',
  description: 'The Engineering Design Process Explained, Effective Testing and Refinement, The Engineering Notebook Excellence, The Team Interview, Understanding the Interview Rubric, Using Notion for Engineering Notebook',
  duration: 'Approx. 90 min',
  lessons: 6,
  difficulty: 'Intermediate',
  color: 'orange',
  icon: BookOpen,
  content: {
   lessons: [
    { id: slugify('The Engineering Design Process Explained'), title: 'The Engineering Design Process Explained', type: 'lesson', xp: 20, contentDetail: generateContentDetail('The Engineering Design Process Explained', "A deep dive into the iterative Engineering Design Process (Identify, Brainstorm, Design, Build, Test, Iterate) as it applies to VEX.") },
    { id: slugify('Effective Testing and Refinement'), title: 'Effective Testing and Refinement', type: 'lesson', xp: 20, contentDetail: generateContentDetail('Effective Testing and Refinement', "Strategies for systematically testing your robot, collecting data, and using that data to make informed design improvements.") },
    { id: slugify('The Engineering Notebook Excellence'), title: 'The Engineering Notebook Excellence', type: 'lesson', xp: 30, contentDetail: generateContentDetail('The Engineering Notebook Excellence', "How to create an award-winning engineering notebook: content, organization, detail, and showcasing your design journey.") },
    { id: slugify('The Team Interview'), title: 'The Team Interview', type: 'lesson', xp: 25, contentDetail: generateContentDetail('The Team Interview', "Preparing for the team interview with judges: common questions, presentation skills, and effectively communicating your robot's design and team's efforts.") },
    { id: slugify('Understanding the Interview Rubric'), title: 'Understanding the Interview Rubric', type: 'lesson', xp: 20, contentDetail: generateContentDetail('Understanding the Interview Rubric', "Breaking down the official judging rubrics to understand what judges are looking for and how to maximize your scores.") },
    { id: slugify('Using Notion for Engineering Notebook'), title: 'Using Notion for Engineering Notebook', type: 'lesson', xp: 20, contentDetail: generateContentDetail('Using Notion for Engineering Notebook', "A practical guide on leveraging Notion (or similar digital tools) for creating a dynamic and well-organized digital engineering notebook.") },
    ]
  }
 },
 {
  id: slugify('VEX CAD'),
  category: 'CAD',
  title: 'VEX CAD',
  description: 'CAD Programs Overview (VEX Focus), Inventor Chassis Design: The Basics, Inventor Chassis: Best Practices, Fusion 360 Chassis Design, SolidWorks: Chassis, Chain, Custom Plastic, Remembering The Best (CAD Inspiration), Scuff Controller CAD Design',
  duration: 'Approx. 120 min',
  lessons: 7,
  difficulty: 'Advanced',
  color: 'red',
  icon: SquarePen,
  content: {
   lessons: [
    { id: slugify('CAD Programs Overview (VEX Focus)'), title: 'CAD Programs Overview (VEX Focus)', type: 'lesson', xp: 20, contentDetail: generateContentDetail('CAD Programs Overview (VEX Focus)', "Comparison of popular CAD software for VEX (Inventor, Fusion 360, SolidWorks, OnShape), their pros/cons, and VEX part libraries. Includes Protobot info.") },
    { id: slugify('Inventor Chassis Design Basics'), title: 'Inventor Chassis Design: The Basics', type: 'lesson', xp: 25, contentDetail: generateContentDetail('Inventor Chassis Design: The Basics', "Step-by-step guide to designing a basic VEX drivetrain chassis in Autodesk Inventor.") },
    { id: slugify('Inventor Chassis Best Practices'), title: 'Inventor Chassis: Best Practices', type: 'lesson', xp: 25, contentDetail: generateContentDetail('Inventor Chassis: Best Practices', "Advanced techniques and best practices for efficient and robust chassis design in Inventor, including constraints and assemblies.") },
    { id: slugify('Fusion 360 Chassis Design'), title: 'Fusion 360 Chassis Design', type: 'lesson', xp: 25, contentDetail: generateContentDetail('Fusion 360 Chassis Design', "Designing a VEX chassis using Autodesk Fusion 360, highlighting its features and workflow.") },
    { id: slugify('SolidWorks Chassis Chain Custom Plastic'), title: 'SolidWorks: Chassis, Chain, Custom Plastic', type: 'lesson', xp: 30, contentDetail: generateContentDetail('SolidWorks: Chassis, Chain, Custom Plastic', "Using SolidWorks for VEX robot design, including chassis, chain generation, and designing custom 3D printable plastic parts.") },
    { id: slugify('Remembering The Best (CAD Inspiration)'), title: 'Remembering The Best (CAD Inspiration)', type: 'lesson', xp: 15, contentDetail: generateContentDetail('Remembering The Best (CAD Inspiration)', "Showcase of exemplary VEX CAD models and design approaches from past competitions to inspire new ideas.") },
    { id: slugify('Scuff Controller CAD Design'), title: 'Scuff Controller CAD Design', type: 'lesson', xp: 20, contentDetail: generateContentDetail('Scuff Controller CAD Design', "Tips and considerations for designing custom controller modifications or accessories using CAD (if rules permit).") },
    ]
  }
 },
 {
  id: slugify('Advanced Robotics Software'),
  category: 'Software',
  title: 'Advanced Robotics Software',
  description: 'Odometry and Position Tracking, Path Planning Algorithms, Robotics Basics: Drive Controls, Code Organization and Version Control, Advanced Control Algorithms (PID and beyond), Competition Programming Strategies, C++ Fundamentals for VEX',
  duration: 'Approx. 150 min',
  lessons: 7,
  difficulty: 'Advanced',
  color: 'blue',
  icon: Terminal,
  content: {
   lessons: [
    { id: slugify('Odometry and Position Tracking'), title: 'Odometry and Position Tracking', type: 'lesson', xp: 30, contentDetail: generateContentDetail('Odometry and Position Tracking', "Implementing odometry using tracking wheels or motor encoders to accurately determine robot position and orientation on the field.") },
    { id: slugify('Path Planning Algorithms'), title: 'Path Planning Algorithms', type: 'lesson', xp: 30, contentDetail: generateContentDetail('Path Planning Algorithms', "Introduction to path planning concepts (e.g., A*, Pure Pursuit) for generating smooth and efficient autonomous robot movements.") },
    { id: slugify('Robotics Basics Drive Controls'), title: 'Robotics Basics: Drive Controls', type: 'lesson', xp: 25, contentDetail: generateContentDetail('Robotics Basics: Drive Controls', "Exploring different drive controls (Arcade, Tank, Curvature/Cheesy Drive), joystick deadzones, and toggling subsystems for intuitive driver control.") },
    { id: slugify('Code Organization and Version Control'), title: 'Code Organization and Version Control', type: 'lesson', xp: 20, contentDetail: generateContentDetail('Code Organization and Version Control', "Best practices for structuring robot code, using functions, classes, code styling guides (e.g., Google C++ Style Guide), writing good comments, and employing version control (e.g., Git).") },
    { id: slugify('Advanced Control Algorithms'), title: 'Advanced Control Algorithms (PID and beyond)', type: 'lesson', xp: 35, contentDetail: generateContentDetail('Advanced Control Algorithms (PID and beyond)', "In-depth look at PID controllers, Bang-Bang, Flywheel Velocity Control (TBH, Kalman Filter concepts), RAMSETE, and Basic Pure Pursuit for precise mechanism and motion control.") },
    { id: slugify('Competition Programming Strategies'), title: 'Competition Programming Strategies', type: 'lesson', xp: 25, contentDetail: generateContentDetail('Competition Programming Strategies', "Developing robust operator control schemes and complex autonomous routines, including sensor integration and decision making for competitions.") },
    { id: slugify('C++ Fundamentals for VEX'), title: 'C++ Fundamentals for VEX', type: 'lesson', xp: 25, contentDetail: generateContentDetail('C++ Fundamentals for VEX', "Key C++ concepts for VEX programming: basic control flow (if, else, loops), enumerations, namespaces, and managing multiple source files (header/source).") },
    ]
  }
 },
 {
  id: slugify('Software Tools and Techniques'),
  category: 'Software',
  title: 'Software Tools and Techniques',
  description: 'VEX Programming Software Overview (Non-VEXcode), Introduction to Object Recognition',
  duration: 'Approx. 60 min',
  lessons: 2,
  difficulty: 'Intermediate',
  color: 'green',
  icon: Code,
  content: {
   lessons: [
    { id: slugify('VEX Programming Software Overview (Non-VEXcode)'), title: 'VEX Programming Software Overview (Non-VEXcode)', type: 'lesson', xp: 25, contentDetail: generateContentDetail('VEX Programming Software Overview (Non-VEXcode)', "Overview of PROS, vexide, Robot Mesh Studio (RMS), EasyC, RobotC, and Midnight C, discussing their features and use cases for different skill levels and needs.") },
    { id: slugify('Introduction to Object Recognition'), title: 'Introduction to Object Recognition', type: 'lesson', xp: 25, contentDetail: generateContentDetail('Introduction to Object Recognition', "Basics of using vision sensors or simple computer vision algorithms for recognizing game elements or field features in VEX.") },
    ]
  }
 },
 {
  id: slugify('AI in VRC Pac-Man Pete'),
  category: 'AI',
  title: 'AI in VRC: Pac-Man Pete',
  description: 'Understanding AI in VRC Context, Pac-Man Pete Case Study, Implementing Basic AI Behaviors',
  duration: 'Approx. 45 min',
  lessons: 3,
  difficulty: 'Advanced',
  color: 'green',
  icon: Bot,
  content: {
   lessons: [
    { id: slugify('Understanding AI in VRC Context'), title: 'Understanding AI in VRC Context', type: 'lesson', xp: 20, contentDetail: generateContentDetail('Understanding AI in VRC Context', "Exploring what AI means in the context of VRC, from simple decision trees to more complex sensor-based behaviors.") },
    { id: slugify('Pac-Man Pete Case Study'), title: 'Pac-Man Pete Case Study', type: 'lesson', xp: 25, contentDetail: generateContentDetail('Pac-Man Pete Case Study', "Analyzing the design and programming of AI-driven robots like 'Pac-Man Pete', focusing on strategy and implementation.") },
    { id: slugify('Implementing Basic AI Behaviors'), title: 'Implementing Basic AI Behaviors', type: 'lesson', xp: 20, contentDetail: generateContentDetail('Implementing Basic AI Behaviors', "Practical steps for programming simple autonomous decision-making and reactive behaviors in your VEX robot.") },
    ]
  }
 },
 {
  id: slugify('VEX Electronics Deep Dive'),
  category: 'Electronics',
  title: 'VEX Electronics Deep Dive',
  description: 'V5 ESD Protection Board, Core VEX Electronic Components, V5 Brain Wiring Guide',
  duration: 'Approx. 60 min',
  lessons: 3,
  difficulty: 'Intermediate',
  color: 'orange',
  icon: CircuitBoard,
  content: {
   lessons: [
    { id: slugify('V5 ESD Protection Board'), title: 'V5 ESD Protection Board', type: 'lesson', xp: 20, contentDetail: generateContentDetail('V5 ESD Protection Board', "Understanding the purpose and proper use of the V5 Electrostatic Discharge (ESD) Protection Board for safeguarding your electronics.") },
    { id: slugify('Core VEX Electronic Components'), title: 'Core VEX Electronic Components', type: 'lesson', xp: 25, contentDetail: generateContentDetail('Core VEX Electronic Components', "Detailed overview of the V5 Brain, V5 Smart Motors, V5 Robot Battery, Controller, and their electrical characteristics and connections.") },
    { id: slugify('V5 Brain Wiring Guide'), title: 'V5 Brain Wiring Guide', type: 'lesson', xp: 20, contentDetail: generateContentDetail('V5 Brain Wiring Guide', "Best practices for wiring the V5 Brain, including Smart Ports, legacy ports, power connections, and wire management to prevent issues.") },
    ]
  }
 },
 {
  id: slugify('VEX Sensors In-Depth'),
  category: 'Sensors',
  title: 'VEX Sensors In-Depth',
  description: '3-Pin / ADI Sensors, Smart Port Sensors',
  duration: 'Approx. 75 min',
  lessons: 2,
  difficulty: 'Intermediate',
  color: 'red',
  icon: Radar,
  content: {
   lessons: [
    { id: slugify('3-Pin ADI Sensors'), title: '3-Pin / ADI Sensors', type: 'lesson', xp: 30, contentDetail: generateContentDetail('3-Pin / ADI Sensors', "Exploring legacy 3-pin sensors: Encoder, Potentiometer, Limit Switch, Bumper Switch, Accelerometer, Gyroscope, Ultrasonic, Line Tracker, and LED Indicator. Learn their function, wiring, and programming.") },
    { id: slugify('Smart Port Sensors'), title: 'Smart Port Sensors', type: 'lesson', xp: 30, contentDetail: generateContentDetail('Smart Port Sensors', "Detailed look at V5 Smart Port sensors: GPS Sensor, Rotation Sensor, Vision Sensor, Optical Sensor, Distance Sensor, Inertial Sensor (IMU), and the 3-Wire Expander. Understand their capabilities and integration.") },
    ]
  }
 }
], []);
  const sampleQuizzes = useMemo(() => ({
    'gear-ratios-in-depth': { 
      title: 'Gear Ratios Quiz',
      questions: [
        { id: 1, question: 'If a 12-tooth gear drives a 60-tooth gear, what is the speed ratio?', options: ['1:5 (output is 5x faster)', '5:1 (output is 5x slower)', '1:1', 'Cannot be determined'], correct: 1, explanation: 'The output gear is 5 times larger, so it will spin 5 times slower. Speed ratio is input:output, so 1:5. Torque is multiplied by 5.' },
        { id: 2, question: 'What is a compound gear ratio?', options: ['A ratio with more than two gears', 'Multiple gear pairs where the output of one pair is the input to the next', 'A gear ratio that is difficult to calculate', 'A gear ratio used only in drivetrains'], correct: 1, explanation: 'A compound gear ratio involves multiple gear pairs, multiplying their individual ratios to achieve a larger overall ratio.' },
      ]
    },
    'intro-knowledge-check': {
      title: 'V5 Fundamentals Quiz',
      questions: [
        { id: 1, question: 'How many Smart Ports does a VEX V5 Brain have?', options: ['12', '8', '21', '16'], correct: 2, explanation: 'The VEX V5 Brain features 21 Smart Ports for connecting motors and sensors.' },
        { id: 2, question: 'Which V5 Smart Motor gear cartridge provides the highest torque?', options: ['Red (100 RPM)', 'Green (200 RPM)', 'Blue (600 RPM)', 'They all have the same torque'], correct: 0, explanation: 'The Red 100 RPM gear cartridge is geared for the highest torque output, sacrificing speed.' },
        { id: 3, question: 'What is a primary function of the VEX V5 Inertial Sensor (IMU)?', options: ['Detecting colors', 'Measuring distance to objects', 'Measuring orientation and heading', 'Controlling motor speed directly'], correct: 2, explanation: 'The IMU is crucial for determining the robot\'s orientation, including heading, roll, and pitch.' },
      ]
    },
    'building-quiz': { 
      title: 'Building Principles Quiz',
      questions: [
        { id: 1, question: 'What is the primary benefit of triangulation in robot structures?', options: ['Reduces weight', 'Increases electrical conductivity', 'Increases rigidity and strength', 'Makes the robot look cooler'], correct: 2, explanation: 'Triangulation is a key engineering principle to create strong and rigid structures by distributing forces effectively.' },
        { id: 2, question: 'If a 12-tooth gear drives a 36-tooth gear, what is the gear ratio for torque?', options: ['1:3 (torque divided by 3)', '3:1 (torque multiplied by 3)', '1:1 (no change)', '2:1 (torque multiplied by 2)'], correct: 1, explanation: 'The ratio is 36/12 = 3:1. This means the output (driven gear) has 3 times the torque and 1/3 the speed of the input (driving gear).' },
      ]
    },
    'cad-assembly-quiz': { 
      title: 'Basic Assembly Concepts Quiz',
      questions: [
        { id: 1, question: 'What is a "mate" in CAD assembly?', options: ['A duplicate part', 'A constraint that defines the relationship between parts', 'A type of screw', 'A rendering style'], correct: 1, explanation: 'Mates (or joints) define how parts are positioned and move relative to each other in an assembly.' },
      ]
    }
  }), []);

  const sampleGames = useMemo(() => ({
    'design-challenge-game': { 
      title: 'Mini Design Challenge: Object Mover',
      type: 'simulation',
      instructions: 'Your robot needs to pick up a small cube from Zone A and place it in Zone B. Consider the arm design, gripper, and gear ratios. (This is a conceptual challenge. Click "Complete" to simulate successful design and testing.)',
      xp: 40,
    },
    'auton-challenge': { 
      title: 'Mini Autonomous Challenge: Navigate Maze',
      type: 'simulation',
      instructions: 'Conceptually guide your robot through a simple maze using sensor logic. (Click "Complete" to simulate successful navigation.)',
      xp: 40,
    }
  }), []);

  const vexpertChallengeBank = useMemo(() => [
    { id: 'vcq1', category: 'Hardware', difficulty: 'Easy', question: 'What is the typical voltage of a VEX V5 Robot Battery?', options: ['7.4V', '9.6V', '12V', '5V'], correctAnswerIndex: 2, explanation: 'VEX V5 Robot Batteries are nominally 12V.' },
    { id: 'vcq2', category: 'Hardware', difficulty: 'Medium', question: 'Which sensor is best for accurately measuring the robot\'s turning angle?', options: ['Optical Sensor', 'Distance Sensor', 'Bumper Switch', 'Inertial Sensor (IMU)'], correctAnswerIndex: 3, explanation: 'The Inertial Sensor (IMU) is designed to measure heading and rotation precisely.' },
    { id: 'vcq3', category: 'Software', difficulty: 'Easy', question: 'In C++ based VEX programming, what is often used to define a reusable block of code for a specific task?', options: ['A variable', 'A loop statement', 'A function', 'An array'], correctAnswerIndex: 2, explanation: 'Functions are fundamental for organizing code into reusable blocks for specific tasks in C++ and other languages.' },
    { id: 'vcq4', category: 'Software', difficulty: 'Medium', question: 'What does "PID" stand for in the context of robot motor control?', options: ['Positive Input Drive', 'Proportional Integral Derivative', 'Program Instruction Data', 'Power Intensity Diagram'], correctAnswerIndex: 1, explanation: 'PID is a control loop mechanism meaning Proportional, Integral, Derivative, used for precise motor control.' },
    { id: 'vcq5', category: 'Hardware', difficulty: 'Medium', question: 'When attaching a V5 Smart Motor to a C-channel, what is a common cause of motor strain or damage?', options: ['Using too many screws', 'Misaligned screw holes causing stress', 'Not using bearing flats', 'Painting the motor'], correctAnswerIndex: 1, explanation: 'Misalignment can put stress on the motor casing and internal gears. Bearing flats support shafts, not direct motor mounting stress.'},
    { id: 'vcq6', category: 'Competition', difficulty: 'Easy', question: 'In many VEX Robotics Competition games, what is "Autonomous Period"?', options: ['A period where robots are manually controlled', 'A period where robots operate using pre-programmed instructions without driver input', 'The time allocated for building the robot', 'The inspection phase before a match'], correctAnswerIndex: 1, explanation: 'The Autonomous Period is when robots run solely on code written beforehand.'},
    { id: 'vcq7', category: 'Hardware', difficulty: 'Hard', question: 'What is the primary advantage of using "Omni-Directional" wheels?', options: ['Higher torque', 'Ability to move in any direction without turning the robot\'s body', 'Better traction on rough surfaces', 'Lighter weight than regular wheels'], correctAnswerIndex: 1, explanation: 'Omni-directional wheels allow for holonomic movement, meaning translation in any direction (strafe).'},
    { id: 'vcq8', category: 'Software', difficulty: 'Hard', question: 'In C++, what is `::` typically used for?', options: ['Declaring a pointer', 'The scope resolution operator', 'Logical AND operator', 'Bitwise XOR operator'], correctAnswerIndex: 1, explanation: 'The `::` symbol is the scope resolution operator, used to access static members, enums, or members of a namespace or class.'},
    { id: 'vcq9', category: 'CAD', difficulty: 'Medium', question: 'In CAD, what is an "extrusion"?', options: ['A type of file format', 'A process of creating a 3D shape by extending a 2D profile along a path', 'A simulation of robot movement', 'A tool for measuring distances'], correctAnswerIndex: 1, explanation: 'Extrusion is a fundamental CAD operation to create 3D geometry from 2D sketches.'},
    { id: 'vcq10', category: 'Hardware', difficulty: 'Medium', question: 'Why are bearings important for rotating shafts in VEX?', options: ['They add weight to the robot', 'They reduce friction and support the shaft', 'They help motors run cooler', 'They are only for decoration'], correctAnswerIndex: 1, explanation: 'Bearings reduce friction, prevent shafts from wobbling, and allow for smoother rotation.'},
    { id: 'vcq11', category: 'Electronics', difficulty: 'Medium', question: 'What is the main purpose of an ESD Protection Board in a VEX V5 system?', options: ['To increase motor power', 'To protect electronics from electrostatic discharge', 'To charge the robot battery faster', 'To provide extra USB ports'], correctAnswerIndex: 1, explanation: 'The ESD (Electrostatic Discharge) Protection Board helps safeguard sensitive electronic components from static electricity damage.' },
    { id: 'vcq12', category: 'Sensors', difficulty: 'Medium', question: 'Which VEX sensor is typically used to detect lines for autonomous navigation?', options: ['Distance Sensor', 'Line Tracker / Optical Sensor', 'Bumper Switch', 'GPS Sensor'], correctAnswerIndex: 1, explanation: 'Line Trackers (an ADI sensor) or the Optical Sensor (Smart Port) are used to detect contrasting lines on the field.' },
  ], []);

  const fetchUserProfile = useCallback(async (firebaseUserId) => {
    console.log("Attempting to fetch user profile for Firebase UID:", firebaseUserId);
    if (!db) {
      console.error("[fetchUserProfile] Firestore 'db' instance is not available. Firebase might not be initialized correctly.");
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
      console.error("[fetchUserProgress] Firestore 'db' instance is not available.");
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

  const fetchUserTeam = useCallback(async (teamId, currentUserIdToUpdate) => {
    console.log("Attempting to fetch team with ID:", teamId);
    if (!teamId) { setUserTeam(null); console.log("No teamId provided to fetchUserTeam."); return null; }
    if (!db) { console.error("[fetchUserTeam] Firestore 'db' instance is not available."); return null; }

    try {
      const teamDocRef = doc(db, "teams", teamId);
      const teamSnap = await getDoc(teamDocRef);
      if (teamSnap.exists()) {
        const teamData = { id: teamSnap.id, ...teamSnap.data() };
        if (!Array.isArray(teamData.memberIds)) {
            teamData.memberIds = [];
        }
        setUserTeam(teamData);
        console.log("Team data fetched:", teamData);
        return teamData;
      } else {
        setUserTeam(null);
        console.warn("Team document not found for ID:", teamId);
        if (currentUserIdToUpdate) {
          console.log("Attempting to clear dangling teamId from user profile:", currentUserIdToUpdate);
          const userRef = doc(db, "users", currentUserIdToUpdate);
          await updateDoc(userRef, { teamId: null });
          setUser(prevUser => {
            if (prevUser && prevUser.id === currentUserIdToUpdate) {
              return { ...prevUser, teamId: null };
            }
            return prevUser;
          });
          console.log("Dangling teamId cleared from user profile:", currentUserIdToUpdate);
        }
        return null;
      }
    } catch (error) {
      console.error("Error in fetchUserTeam for team ID:", teamId, error);
      setUserTeam(null);
      return null;
    }
  }, []);

  useEffect(() => {
    console.log("App.js: Auth listener effect is running.");
    if (!auth) {
      console.error("App.js: Firebase 'auth' service is not available in onAuthStateChanged. Firebase might not be initialized correctly in Firebase.js or imported incorrectly.");
      setLoading(false);
      setMessage("Critical Firebase Error: Auth service not loaded. Please check console and Firebase.js configuration.");
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseAuthUser) => {
      console.log("App.js: onAuthStateChanged triggered. Firebase Auth User:", firebaseAuthUser ? firebaseAuthUser.uid : 'null');

      try {
        if (firebaseAuthUser) {
          console.log("App.js: Firebase Auth User signed in. UID:", firebaseAuthUser.uid);
          setMessage("Firebase authenticated. Loading your Vexcel profile...");

          let userProfile = await fetchUserProfile(firebaseAuthUser.uid);

          if (!userProfile) {
            console.log("App.js: No Firestore profile for UID:", firebaseAuthUser.uid, ". Creating new profile.");
            setMessage("Welcome! Creating your Vexcel profile...");
            const newUserProfileData = {
              id: firebaseAuthUser.uid,
              name: firebaseAuthUser.displayName || `User${firebaseAuthUser.uid.substring(0,5)}`,
              email: firebaseAuthUser.email || `${firebaseAuthUser.uid.substring(0,5)}@example.com`,
              avatar: firebaseAuthUser.photoURL || `https://source.boringavatars.com/beam/120/${firebaseAuthUser.email || firebaseAuthUser.uid}?colors=264653,2a9d8f,e9c46a,f4a261,e76f51`,
              xp: 0, level: 1, streak: 0, teamId: null,
              createdAt: serverTimestamp(), lastLogin: serverTimestamp(),
            };
            console.log("[App.js] Attempting to create user profile with data:", JSON.stringify(newUserProfileData));
            if (!db) {
              console.error("App.js: Firestore 'db' instance is NOT available for creating profile.");
              throw new Error("Firestore not available for profile creation. Check Firebase.js and initialization logs.");
            }
            await setDoc(doc(db, "users", firebaseAuthUser.uid), newUserProfileData);
            userProfile = newUserProfileData;
            console.log("App.js: New Firestore profile CREATED for UID:", firebaseAuthUser.uid);
          } else {
            console.log("App.js: Existing Firestore profile FOUND for UID:", firebaseAuthUser.uid, ". Updating profile.");
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
                console.log("[App.js] Attempting to update user profile with data:", JSON.stringify(profileUpdates));
                if (!db) {
                  console.error("App.js: Firestore 'db' instance is NOT available for updating profile.");
                  throw new Error("Firestore not available for profile update. Check Firebase.js and initialization logs.");
                }
                await updateDoc(doc(db, "users", firebaseAuthUser.uid), profileUpdates);
            }
            userProfile = { ...userProfile, ...profileUpdates }; 
            console.log("App.js: Firestore profile UPDATED for UID:", firebaseAuthUser.uid);
          }

          setUser(userProfile);
          console.log("App.js: User state (Firestore profile) set. Fetching progress for UID:", firebaseAuthUser.uid);
          await fetchUserProgress(firebaseAuthUser.uid);

          if (userProfile.teamId) {
            console.log("App.js: User has teamId:", userProfile.teamId, ". Fetching team data.");
            const fetchedTeam = await fetchUserTeam(userProfile.teamId, userProfile.id);
            if (!fetchedTeam) { 
                setUser(prev => ({...prev, teamId: null}));
            }
          } else {
            setUserTeam(null);
            console.log("App.js: User has no teamId.");
          }

          setCurrentView('dashboard');
          setMessage('');
          console.log("App.js: User setup complete. View set to dashboard.");

        } else {
          console.log("App.js: No Firebase Auth User signed in. Resetting user state.");
          setUser(null); setUserTeam(null); setUserProgress({});
          setCurrentView('login');
          setSelectedModule(null); setCurrentLesson(null);
          setMessage('');
        }
      } catch (error) {
        console.error("App.js: CRITICAL ERROR within onAuthStateChanged async block:", error);
        console.error("App.js: Firestore operation error details:", error.code, error.message, error.stack);
        setUser(null);
        setUserTeam(null);
        setUserProgress({});
        setCurrentView('login');
        setMessage(`Error setting up your session: ${error.message}. Please check the console and Firebase project setup (Firestore enabled & correct rules).`);
        setActionLoading(false);
      } finally {
        console.log("App.js: onAuthStateChanged finally block. setLoading(false).");
        setLoading(false);
      }
    });

    return () => {
      console.log("App.js: Auth listener cleaning up.");
      unsubscribe();
    };
  }, [fetchUserProfile, fetchUserProgress, fetchUserTeam]);


  useEffect(() => {
    const categories = [...new Set(vexpertChallengeBank.map(q => q.category).concat(learningModules.map(m => m.category)))].sort();
    setAvailableChallengeCategories(categories.filter(Boolean)); 
    if (categories.length > 0 && selectedChallengeCategories.length === 0) {
        setSelectedChallengeCategories(categories.filter(Boolean));
    }
  }, [vexpertChallengeBank, learningModules, selectedChallengeCategories.length]);

  const handleChallengeAnswer = useCallback((selectedIndex) => {
    if (showChallengeAnswer) return; 
    setShowChallengeAnswer(true);
    setChallengeSelectedAnswer(selectedIndex); // Store user's choice for UI feedback
    // Update the specific question in challengeQuestions to include selectedAnswer for the VexpertChallengeView
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
      handleChallengeAnswer(null); 
    }
    return () => clearInterval(interval);
  }, [challengeState, challengeTimer, showChallengeAnswer, handleChallengeAnswer]);


  const handleLoginSuccess = async (credentialResponse) => {
    console.log("App.js: Google Login Button Success. Credential Token (start):", credentialResponse.credential ? credentialResponse.credential.substring(0,30)+"..." : "N/A");
    if (!auth) {
        console.error("App.js: FATAL in handleLoginSuccess - Firebase 'auth' service is not available!");
        setMessage("Critical Firebase Error: Auth service not loaded. Cannot process login.");
        setActionLoading(false);
        return;
    }
    setMessage('Successfully authenticated with Google. Signing into Vexcel...');
    setActionLoading(true);
    try {
      const idToken = credentialResponse.credential;
      const credential = FirebaseGoogleAuthProvider.credential(idToken);
      console.log("App.js: Attempting Firebase signInWithCredential...");
      const firebaseAuthResult = await signInWithCredential(auth, credential);
      console.log("App.js: Firebase signInWithCredential successful. Firebase User UID:", firebaseAuthResult.user.uid);
    } catch (error) {
      console.error("App.js: Error in handleLoginSuccess (Firebase signInWithCredential):", error);
      if (error.code === 'auth/configuration-not-found') {
          setMessage(`Firebase Config Error: ${error.message}. Please ensure Firebase is correctly configured with your project details in Firebase.js.`);
      } else if (error.code === 'auth/network-request-failed') {
           setMessage(`Network error during Firebase sign-in: ${error.message}. Please check your internet connection.`);
      }
      else {
          setMessage(`Firebase sign-in error: ${error.message}. Please try again.`);
      }
      googleLogout(); 
      setActionLoading(false); 
    }
  };


  const handleLoginError = (error) => {
    console.error("App.js: Google Login Button Error (@react-oauth/google):", error);
    setMessage('Google login failed. Please ensure pop-ups are enabled and try again.');
    setActionLoading(false);
  };

  const handleLogout = async () => {
    console.log("App.js: handleLogout called.");
    if (!auth) {
        console.error("App.js: FATAL in handleLogout - Firebase 'auth' service is not available!");
        setMessage("Critical Firebase Error: Auth service not loaded. Cannot process logout.");
        setUser(null); setUserTeam(null); setUserProgress({}); setCurrentView('login');
        return;
    }
    setActionLoading(true);
    try {
      await firebaseSignOut(auth);
      googleLogout(); 
      console.log("App.js: Firebase sign out and Google logout successful.");
    } catch (error) {
      console.error("App.js: Error during logout:", error);
      setMessage('Error during logout.');
    } finally {
      setActionLoading(false);
    }
  };

  const navigate = (view, data = null) => {
    setMessage(''); 
    setCurrentView(view);
    if (data) {
      if (view === 'module') {
        const moduleData = learningModules.find(m => m.id === (data.id || data));
        setSelectedModule(moduleData);
        setCurrentLesson(null); 
      } else if (view === 'lessonContent' && data.lesson && data.moduleId) {
        const moduleForLesson = learningModules.find(m => m.id === data.moduleId);
        if (moduleForLesson) {
            setSelectedModule(moduleForLesson); 
            setCurrentLesson(data.lesson);
        } else {
            setMessage("Error: Module context for lesson not found.");
            setCurrentView('dashboard'); 
        }
      } else if (view === 'quiz') setQuizData({ moduleId: data.moduleId, lessonId: data.lesson.id, lesson: data.lesson });
      else if (view === 'game') setGameData({ moduleId: data.moduleId, lessonId: data.lesson.id, lesson: data.lesson });
    } else {
      if (!['module', 'lessonContent', 'quiz', 'game', 'challenge'].includes(view)) {
        setSelectedModule(null); setCurrentLesson(null); setQuizData(null); setGameData(null);
      }
      if(view === 'challenge') { 
        setChallengeState('idle');
        setChallengeScore(0);
        setCurrentChallengeQuestionIdx(0);
        setChallengeSelectedAnswer(null);
        setShowChallengeAnswer(false);
      }
    }
  };

  useEffect(() => { if (message) { const t = setTimeout(() => setMessage(''), 7000); return () => clearTimeout(t); } }, [message]);

  useEffect(() => {
    if (user && user.xp !== undefined && user.level !== undefined && (Math.floor(user.xp / XP_PER_LEVEL) + 1) > user.level) {
      const newLevel = Math.floor(user.xp/XP_PER_LEVEL)+1;
      setUser(prev => ({ ...prev, level: newLevel }));
      setMessage(`🎉 Level Up! You are now Level ${newLevel}! Keep going!`);
      if(user.id && db) { 
          const userRef = doc(db, "users", user.id);
          updateDoc(userRef, { level: newLevel })
            .then(() => console.log("App.js: Level updated in Firestore for UID:", user.id))
            .catch(err => console.error("App.js: Error updating level in Firestore:", err));
      } else if (!db) { 
          console.error("App.js: Cannot update level in Firestore, 'db' instance is not available.");
      }
    }
  }, [user]);


  const handleCompleteItem = async (moduleId, lessonId, itemType, score = null, xpEarned = 0) => {
    if (!user || !user.id) {setMessage("Error: User not identified."); console.error("App.js: handleCompleteItem - User not identified."); return;}
    if (!db) {setMessage("Error: Database service unavailable."); console.error("App.js: handleCompleteItem - DB not available."); return;}

    console.log(`App.js: handleCompleteItem called for UID: ${user.id}, moduleId: ${moduleId}, lessonId: ${lessonId}, xp: ${xpEarned}`);
    setActionLoading(true);
    const userRef = doc(db, "users", user.id);
    const progressDocRef = doc(db, `users/${user.id}/progress`, moduleId);

    try {
      const batch = writeBatch(db);
      batch.update(userRef, { xp: increment(xpEarned) });
      const sanitizedLessonId = lessonId.replace(/\./g, '_'); 
      
      const currentModuleProgSnap = await getDoc(progressDocRef);
      let currentModuleXp = 0;
      let existingLessons = {};

      if (currentModuleProgSnap.exists()) {
          const currentData = currentModuleProgSnap.data();
          currentModuleXp = currentData.moduleXp || 0;
          existingLessons = currentData.lessons || {};
      }
      const updatedLessonData = { ...existingLessons, [sanitizedLessonId]: { completed: true, score: score } }; 
      batch.set(progressDocRef, { lessons: updatedLessonData, moduleXp: currentModuleXp + xpEarned }, { merge: true });


      if (userTeam && userTeam.id) {
        const teamRef = doc(db, "teams", userTeam.id);
        batch.update(teamRef, { totalXP: increment(xpEarned) });
      }

      await batch.commit();
      console.log("App.js: Item completion saved to Firebase.");

      setUser(prevUser => ({ ...prevUser, xp: (prevUser.xp || 0) + xpEarned }));
      setUserProgress(prev => ({ ...prev, [moduleId]: { ...prev[moduleId] || {lessons:{}, moduleXp:0}, lessons: updatedLessonData, moduleXp: (prev[moduleId]?.moduleXp || 0) + xpEarned }}));
      if (userTeam) {
        const updatedTeamTotalXP = (userTeam.totalXP || 0) + xpEarned;
        setUserTeam(prevTeam => ({ ...prevTeam, totalXP: updatedTeamTotalXP }));
        setAllTeams(prevAllTeams => prevAllTeams.map(t => t.id === userTeam.id ? { ...t, totalXP: updatedTeamTotalXP } : t));
      }

      if (selectedModule && selectedModule.id === moduleId) setSelectedModule(prev => ({ ...prev }));

      setMessage(`Completed: ${itemType}! +${xpEarned} XP`);
    } catch (error) {
      console.error("App.js: Error completing item in Firebase:", error);
      setMessage("Failed to save progress. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinTeam = async (teamCodeToJoinArg = joinTeamCodeInput) => {
    const teamCodeToJoin = typeof teamCodeToJoinArg === 'string' ? teamCodeToJoinArg.trim() : joinTeamCodeInput.trim();
    if (!teamCodeToJoin) { setMessage("Please enter a team code."); return; }
    if (userTeam) { setMessage("You are already in a team. Leave your current team to join another."); return; }
    if (!user || !user.id) { setMessage("User not logged in. Please sign in again."); return; }
    if (!db) {setMessage("Database service unavailable. Cannot join team."); return;}

    console.log("App.js: handleJoinTeam called with code:", teamCodeToJoin, "for user:", user.id);
    setActionLoading(true);
    try {
      const teamsQuery = query(collection(db, "teams"), where("code", "==", teamCodeToJoin));
      const querySnapshot = await getDocs(teamsQuery);

      if (querySnapshot.empty) {
        setMessage("Invalid team code or team not found."); 
        setActionLoading(false); 
        return;
      }

      const teamDocSnap = querySnapshot.docs[0];
      const teamToJoinData = { id: teamDocSnap.id, ...teamDocSnap.data() };
      if (!Array.isArray(teamToJoinData.memberIds)) {
        teamToJoinData.memberIds = [];
      }

      if (teamToJoinData.memberIds.includes(user.id)) {
          setMessage(`You are already a member of ${teamToJoinData.name}.`);
          setUserTeam(teamToJoinData); 
          const userRefForConsistency = doc(db, "users", user.id);
          const userSnap = await getDoc(userRefForConsistency);
          if (userSnap.exists() && userSnap.data().teamId !== teamToJoinData.id) {
            await updateDoc(userRefForConsistency, { teamId: teamToJoinData.id });
          }
          setUser(prevUser => ({...prevUser, teamId: teamToJoinData.id})); 
          setActionLoading(false); 
          return;
      }

      const batch = writeBatch(db);
      const teamRef = doc(db, "teams", teamToJoinData.id);
      batch.update(teamRef, { memberIds: arrayUnion(user.id) });

      const userRef = doc(db, "users", user.id);
      batch.update(userRef, { teamId: teamToJoinData.id });

      await batch.commit();

      const updatedTeamSnap = await getDoc(teamRef);
      const finalTeamData = {id: updatedTeamSnap.id, ...updatedTeamSnap.data()};
      if (!Array.isArray(finalTeamData.memberIds)) { 
        finalTeamData.memberIds = [];
      }

      setUserTeam(finalTeamData);
      setUser(prevUser => ({...prevUser, teamId: finalTeamData.id}));
      setAllTeams(prevTeams => prevTeams.map(t => t.id === finalTeamData.id ? finalTeamData : t)); 
      setMessage(`Successfully joined team: ${finalTeamData.name}!`);
      setJoinTeamCodeInput('');
    } catch (error) {
      console.error("App.js: Error joining team:", error);
      setMessage("Failed to join team. " + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!createTeamNameInput.trim()) { setMessage("Please enter a team name."); return; }
    if (userTeam) { setMessage("You are already in a team. Leave your current team to create a new one."); return; }
    if (!user || !user.id) { setMessage("User not logged in. Please sign in again."); return; }
    if (!db) {setMessage("Database service unavailable. Cannot create team."); return;}

    console.log("App.js: handleCreateTeam called with name:", createTeamNameInput, "for user:", user.id);
    setActionLoading(true);
    try {
      const newTeamCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const newTeamData = {
        name: createTeamNameInput.trim(),
        code: newTeamCode,
        description: `A brand new Vexcel team with ${user.name}!`,
        totalXP: user.xp || 0, 
        memberIds: [user.id],
        creatorId: user.id,
        createdAt: serverTimestamp(),
      };

      const teamColRef = collection(db, "teams");
      const teamDocRef = await addDoc(teamColRef, newTeamData);

      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, { teamId: teamDocRef.id });

      const createdTeamForState = { 
          id: teamDocRef.id, 
          ...newTeamData, 
          members: 1 
      };
      setUserTeam(createdTeamForState);
      setUser(prevUser => ({...prevUser, teamId: teamDocRef.id})); 
      setAllTeams(prev => [...prev, createdTeamForState]); 
      setMessage(`Team "${createdTeamForState.name}" created! Your Team Code is: ${newTeamCode}`);
      setCreateTeamNameInput('');
    } catch (error) {
      console.error("App.js: Error creating team:", error);
      setMessage("Failed to create team. " + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveTeam = async () => {
    if (!userTeam || !userTeam.id || !user || !user.id) {
        setMessage("Cannot leave team: No team or user identified.");
        return;
    }
    if (!db) {setMessage("Database service unavailable. Cannot leave team."); return;}

    console.log("App.js: handleLeaveTeam called for team:", userTeam.id, "by user:", user.id);
    setActionLoading(true);
    try {
      const teamId = userTeam.id;
      const teamName = userTeam.name;
      const batch = writeBatch(db);

      const teamRef = doc(db, "teams", teamId);
      batch.update(teamRef, { memberIds: arrayRemove(user.id) });

      const userRef = doc(db, "users", user.id);
      batch.update(userRef, { teamId: null });

      await batch.commit();

      const updatedTeamSnap = await getDoc(teamRef);
      if (updatedTeamSnap.exists()) {
        const updatedTeamData = updatedTeamSnap.data();
        if (!updatedTeamData.memberIds || updatedTeamData.memberIds.length === 0) {
          console.log(`Team ${teamName} (${teamId}) has 0 members after leave. Deleting team.`);
          await deleteDoc(teamRef);
          setAllTeams(prevTeams => prevTeams.filter(t => t.id !== teamId)); 
          setMessage(`You have left team: ${teamName}. The team was empty and has been deleted.`);
        } else {
          setAllTeams(prevTeams =>
            prevTeams.map(t =>
              (t.id === teamId ?
                { ...t, memberIds: updatedTeamData.memberIds, members: updatedTeamData.memberIds.length }
                : t)
            )
          );
          setMessage(`You have left team: ${teamName}.`);
        }
      } else {
        setAllTeams(prevTeams => prevTeams.filter(t => t.id !== teamId));
        setMessage(`You have left team: ${teamName}. The team seems to no longer exist.`);
      }

      setUserTeam(null);
      setUser(prevUser => ({...prevUser, teamId: null})); 

    } catch (error) {
      console.error("App.js: Error leaving team:", error);
      setMessage("Failed to leave team. " + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!userTeam || !userTeam.id || !user || !user.id) {
        setMessage("Cannot delete team: No team or user identified.");
        return;
    }
    if (user.id !== userTeam.creatorId) {
        setMessage("Only the team creator can delete the team.");
        return;
    }
    if (!db) {setMessage("Database service unavailable. Cannot delete team."); return;}

    if (!window.confirm(`Are you sure you want to permanently delete team "${userTeam.name}"? This action cannot be undone.`)) {
        return;
    }

    console.log("App.js: handleDeleteTeam called for team:", userTeam.id, "by owner:", user.id);
    setActionLoading(true);
    try {
        const teamIdToDelete = userTeam.id;
        const teamNameToDelete = userTeam.name;
        const memberIdsToUpdate = userTeam.memberIds || [];

        const batch = writeBatch(db);

        const teamRef = doc(db, "teams", teamIdToDelete);
        batch.delete(teamRef);

        memberIdsToUpdate.forEach(memberId => {
            const userRef = doc(db, "users", memberId);
            batch.update(userRef, { teamId: null });
        });

        await batch.commit();

        setUserTeam(null);
        setUser(prevUser => ({...prevUser, teamId: null})); 
        setAllTeams(prevTeams => prevTeams.filter(t => t.id !== teamIdToDelete));
        setMessage(`Team "${teamNameToDelete}" has been successfully deleted.`);

    } catch (error) {
        console.error("App.js: Error deleting team:", error);
        setMessage("Failed to delete team. " + error.message);
    } finally {
        setActionLoading(false);
    }
  };


  const fetchAllTeamsForBrowse = useCallback(async () => {
    if (!db) {
        console.error("[fetchAllTeamsForBrowse] DB not available. Aborting fetch.");
        setMessage("Database error. Cannot fetch teams.");
        return;
    }
    if (user && (currentView === 'browseTeams' || currentView === 'leaderboard' || allTeams.length === 0)) {
      console.log(`[fetchAllTeamsForBrowse] Called for view: ${currentView} or initial load. Setting actionLoading TRUE.`);
      setActionLoading(true);
      try {
        const teamsColRef = collection(db, "teams");
        let q;
        if (currentView === 'leaderboard') {
          q = query(teamsColRef, orderBy("totalXP", "desc"), limit(50));
          console.log("[fetchAllTeamsForBrowse] Querying for LEADERBOARD (orderBy totalXP desc, limit 50).");
        } else {
          q = query(teamsColRef, orderBy("createdAt", "desc"), limit(100)); 
          console.log("[fetchAllTeamsForBrowse] Querying for BROWSE/INITIAL (orderBy createdAt desc, limit 100).");
        }

        console.log(`[fetchAllTeamsForBrowse] Executing getDocs() for ${currentView}...`);
        const querySnapshot = await getDocs(q);
        console.log(`[fetchAllTeamsForBrowse] getDocs() completed. Found ${querySnapshot.docs.length} teams for ${currentView}.`);

        const loadedTeams = querySnapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                ...data,
                memberIds: Array.isArray(data.memberIds) ? data.memberIds : [], 
                members: Array.isArray(data.memberIds) ? data.memberIds.length : 0 
            };
        });
        setAllTeams(loadedTeams);
        console.log(`[fetchAllTeamsForBrowse] setAllTeams done for ${currentView}. Team count: ${loadedTeams.length}`);
      } catch (error) {
        console.error(`[fetchAllTeamsForBrowse] Error fetching teams for ${currentView}:`, error);
        console.error(`[fetchAllTeamsForBrowse] Error details: Code: ${error.code}, Message: ${error.message}`);
        setMessage(`Could not load teams for ${currentView}: ${error.message}. Check console for Firestore errors (e.g. missing index).`);
      } finally {
        console.log(`[fetchAllTeamsForBrowse] FINALLY block. Setting actionLoading FALSE for ${currentView}.`);
        setActionLoading(false);
      }
    } else {
        console.log(`[fetchAllTeamsForBrowse] Not fetching. Conditions not met. Current view: ${currentView}, User: ${!!user}, AllTeams length: ${allTeams.length}`);
    }
  }, [currentView, user, allTeams.length]); 

  useEffect(() => {
    if (user) {
        fetchAllTeamsForBrowse();
    }
  }, [user, fetchAllTeamsForBrowse]); 


  const startVexpertChallenge = () => {
    console.log("App.js: startVexpertChallenge called.");
    setActionLoading(true);
    if (selectedChallengeCategories.length === 0) {setMessage("Please select at least one category."); setActionLoading(false); return;}
    const filtered = vexpertChallengeBank.filter(q => selectedChallengeCategories.includes(q.category));
    if (filtered.length === 0) {setMessage("No questions for selected categories."); setActionLoading(false); return;}

    let count = numChallengeQuestionsInput;
    if (count > filtered.length) {
        setMessage(`Only ${filtered.length} questions available for the selected categories. Reducing question count.`);
        count = filtered.length;
    }
    if (count <= 0) {setMessage("Cannot start with 0 questions."); setActionLoading(false); return;}

    const shuffled = [...filtered].sort(() => 0.5 - Math.random());
    setChallengeQuestions(shuffled.slice(0, count).map(q => ({...q, selectedAnswer: null}))); // Initialize selectedAnswer for each question
    setCurrentChallengeQuestionIdx(0); setChallengeScore(0); setChallengeSelectedAnswer(null); setShowChallengeAnswer(false);
    setChallengeTimer(QUESTION_TIMER_DURATION); setChallengeState('active'); setActionLoading(false);
    setMessage(`Challenge started with ${count} questions! Good luck!`);
  };


  const handleNextChallengeQuestion = async () => {
    setShowChallengeAnswer(false);
    setChallengeSelectedAnswer(null); // Clear global selected answer

    if (currentChallengeQuestionIdx < challengeQuestions.length - 1) {
      setCurrentChallengeQuestionIdx(i => i + 1);
      setChallengeTimer(QUESTION_TIMER_DURATION); 
    } else { 
      setChallengeState('results');
      const xp = challengeQuestions.length > 0 ? Math.round((challengeScore / challengeQuestions.length) * CHALLENGE_MAX_XP) : 0;
      console.log("App.js: Challenge finished. Score:", challengeScore, "XP:", xp);

      if (user && user.id && xp > 0 && db) {
        setActionLoading(true);
        try {
          const batch = writeBatch(db);
          const userRef = doc(db, "users", user.id);
          batch.update(userRef, { xp: increment(xp) });

          if (userTeam && userTeam.id) {
            batch.update(doc(db, "teams", userTeam.id), { totalXP: increment(xp) });
          }
          await batch.commit();

          setUser(prev => ({ ...prev, xp: (prev.xp || 0) + xp }));
          if (userTeam) {
            const newTeamXp = (userTeam.totalXP || 0) + xp;
            setUserTeam(prev => ({ ...prev, totalXP: newTeamXp }));
            setAllTeams(prevs => prevs.map(t => t.id === userTeam.id ? { ...t, totalXP: newTeamXp } : t));
          }
          setMessage(`Challenge finished! Score: ${challengeScore}/${challengeQuestions.length}. You earned ${xp} XP!`);
        } catch (e) {
          console.error("App.js: Error saving challenge XP:", e);
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

  const resetChallenge = () => {
    setChallengeState('idle'); setChallengeQuestions([]);
    setCurrentChallengeQuestionIdx(0); setChallengeScore(0);
    setChallengeSelectedAnswer(null); setShowChallengeAnswer(false);
    console.log("App.js: Challenge reset to configuration screen.");
  };


  if (loading) {
    const loadingMessageText = message || (user ? "Loading Vexcel Dashboard..." : "Initializing Vexcel Platform...");
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

            {currentView === 'dashboard' && <Dashboard user={user} userProgress={userProgress} userTeam={userTeam} learningModules={learningModules} navigate={navigate} actionLoading={actionLoading} />}
            {currentView === 'module' && selectedModule && <ModuleView selectedModule={selectedModule} userProgress={userProgress} navigate={navigate} actionLoading={actionLoading} />}
            {currentView === 'lessonContent' && currentLesson && selectedModule && <LessonContentView currentLesson={currentLesson} selectedModule={selectedModule} userProgress={userProgress} handleCompleteItem={handleCompleteItem} navigate={navigate} actionLoading={actionLoading} />}
            {currentView === 'quiz' && quizData && <QuizView quizData={quizData} sampleQuizzes={sampleQuizzes} userProgress={userProgress} selectedModule={selectedModule} handleCompleteItem={handleCompleteItem} navigate={navigate} actionLoading={actionLoading} setMessage={setMessage} />}
            {currentView === 'game' && gameData && <GameView gameData={gameData} sampleGames={sampleGames} userProgress={userProgress} selectedModule={selectedModule} handleCompleteItem={handleCompleteItem} navigate={navigate} actionLoading={actionLoading} setMessage={setMessage} />}
            {currentView === 'teams' && <TeamsView user={user} userTeam={userTeam} actionLoading={actionLoading} joinTeamCodeInput={joinTeamCodeInput} setJoinTeamCodeInput={setJoinTeamCodeInput} createTeamNameInput={createTeamNameInput} setCreateTeamNameInput={setCreateTeamNameInput} onJoinTeam={handleJoinTeam} onCreateTeam={handleCreateTeam} onLeaveTeam={handleLeaveTeam} onDeleteTeam={handleDeleteTeam} />}
            {currentView === 'browseTeams' && <BrowseTeamsView allTeams={allTeams} actionLoading={actionLoading} user={user} currentView={currentView} fetchAllTeams={fetchAllTeamsForBrowse} userTeam={userTeam} onJoinTeam={handleJoinTeam} />}
            {currentView === 'leaderboard' && <LeaderboardView allTeams={allTeams} actionLoading={actionLoading} user={user} currentView={currentView} fetchAllTeams={fetchAllTeamsForBrowse} userTeam={userTeam} />}
            {currentView === 'challenge' && <VexpertChallengeView user={user} actionLoading={actionLoading} challengeState={challengeState} vexpertChallengeBank={vexpertChallengeBank} selectedChallengeCategories={selectedChallengeCategories} setSelectedChallengeCategories={setSelectedChallengeCategories} availableChallengeCategories={availableChallengeCategories} numChallengeQuestionsInput={numChallengeQuestionsInput} setNumChallengeQuestionsInput={setNumChallengeQuestionsInput} onStartChallenge={startVexpertChallenge} challengeQuestions={challengeQuestions} currentChallengeQuestionIdx={currentChallengeQuestionIdx} challengeTimer={challengeTimer} showChallengeAnswer={showChallengeAnswer} challengeScore={challengeScore} onChallengeAnswer={handleChallengeAnswer} onNextChallengeQuestion={handleNextChallengeQuestion} onResetChallenge={resetChallenge} questionTimerDuration={QUESTION_TIMER_DURATION} navigate={navigate} />}
          </main>
        </div>
      )}

      {/* Global Styles */}
      <style jsx global>{`
        :root {
            --color-blue-500: #3b82f6; --color-blue-600: #2563eb; --color-blue-100: #dbeafe; --color-blue-50: #eff6ff;
            --color-green-500: #10b981; --color-green-600: #059669; --color-green-100: #d1fae5; --color-green-50: #f0fdfa;
            --color-green-500: #8b5cf6; --color-green-600: #7c3aed; --color-green-100: #ede9fe; --color-green-300: #c4b5fd;
            --color-orange-500: #f59e0b; --color-orange-600: #d97706; --color-orange-100: #fff7ed;
            --color-red-500: #ef4444; --color-red-600: #dc2626; --color-red-100: #fee2e2; --color-red-50: #fff1f2;
            --color-pink-500: #ec4899; --color-pink-600: #db2777; --color-pink-100: #fce7f3;
            
            --text-primary: #1f2937; --text-secondary: #4b5563; --text-light: #6b7280;
            --bg-main: #f3f4f6; --bg-card: white; --border-color: #e5e7eb;
            --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
            --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
            --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; background-color: var(--bg-main); color: var(--text-primary); line-height: 1.6; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }

        .app { min-height: 100vh; display: flex; flex-direction: column; }

        button { font-family: inherit; cursor: pointer; border:none; background:none; transition: all 0.2s ease-in-out;}
        button:disabled { cursor: not-allowed; opacity: 0.7; }
        input[type="text"], input[type="password"], input[type="email"], select { font-family: inherit; padding: 0.75rem 1rem; border: 1px solid var(--border-color); border-radius: 6px; font-size: 1rem; transition: border-color 0.2s, box-shadow 0.2s;}
        input[type="text"]:focus, input[type="password"]:focus, input[type="email"]:focus, select:focus { outline: none; border-color: var(--color-blue-500); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); }
        code { background-color: #f3f4f6; padding: 0.2em 0.4em; margin: 0 0.1em; font-size: 85%; border-radius: 3px; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; }
        .icon { width: 1.25rem; height: 1.25rem; } .icon-small { width: 1rem; height: 1rem; } .icon.rotated { transform: rotate(180deg); }
        .error-message { color: var(--color-red-600); background-color: var(--color-red-100); padding: 1rem; border-radius: 8px; text-align: center; margin: 1rem; border: 1px solid var(--color-red-500); }
        .info-message { color: var(--text-secondary); text-align: center; padding: 1rem; font-style: italic;}

        .full-page-loader { display: flex; flex-direction:column; align-items: center; justify-content: center; min-height: 100vh; width:100%; background-color: rgba(243,244,246,0.9); gap:1rem; position: fixed; top:0; left:0; z-index:9999; }
        .spinner { width: 3.5rem; height: 3.5rem; border: 5px solid #e0e0e0; border-top-color: var(--color-blue-500); border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .loading-section { display: flex; align-items: center; justify-content:center; gap: 1rem; padding: 1.5rem; background: rgba(255,255,255,0.7); border-radius:8px; margin-bottom:1.5rem; color: var(--text-secondary); }
        .loading-section.page-loader { margin: 2rem auto; }

        .message { padding: 1rem 1.5rem; border-radius: 8px; margin-bottom: 1.5rem; font-weight: 500; border: 1px solid transparent; box-shadow: var(--shadow-sm); }
        .message.app-message {max-width: 800px; margin-left:auto; margin-right:auto;}
        .message.login-message { margin-top: 1.5rem; margin-bottom: 0.5rem; }
        .message.success { background: var(--color-green-100); color: var(--color-green-600); border-color: var(--color-green-500); }
        .message.error { background: var(--color-red-100); color: var(--color-red-600); border-color: var(--color-red-500); }
        .message.info { background: var(--color-blue-100); color: var(--color-blue-600); border-color: var(--color-blue-500); }

        .login-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1rem; background: linear-gradient(135deg, #6B73FF 0%, #000DFF 100%); }
        .login-card { background: white; border-radius: 16px; padding: 2.5rem 3rem; box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.2); width: 100%; max-width: 480px; text-align: center; }
        .login-header { margin-bottom: 2rem; }
        .login-header .brand-icon-large { width: 4.5rem; height: 4.5rem; margin: 0 auto 1rem; }
        .login-header h1 { font-size: 2.5rem; font-weight: 700; color: #1a202c; margin-bottom: 0.5rem; }
        .login-header p { color: #718096; font-size: 1.05rem; margin-bottom: 1rem;}
        .login-specific-loader { background:transparent; box-shadow:none; padding:1rem 0;}
        .login-section { margin: 2.5rem 0; display: flex; justify-content: center; }
        .features-preview { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; margin-top: 2.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color); }
        .feature { display: flex; flex-direction: column; align-items: center; gap: 0.6rem; color: var(--text-light); font-size: 0.9rem; }
        .feature .feature-icon { width: 1.75rem; height: 1.75rem; color: var(--color-blue-500); }
        .login-footer { margin-top: 2.5rem; font-size: 0.85rem; color: #a0aec0; }

        .nav { background: var(--bg-card); border-bottom: 1px solid var(--border-color); padding: 0 2rem; display: flex; align-items: center; justify-content: space-between; height: 4.5rem; position: sticky; top: 0; z-index: 1000; box-shadow: var(--shadow-sm); }
        .nav-brand { display: flex; align-items: center; gap: 0.75rem; font-weight: 700; font-size: 1.5rem; color: var(--text-primary); }
        .brand-logo-image { width: 32px; height: 32px; border-radius: 4px; object-fit: contain; }
        .nav-items { display: flex; align-items: center; gap: 0.75rem; }
        .nav-item { display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1rem; border-radius: 6px; color: var(--text-secondary); font-weight: 500; font-size:0.95rem; }
        .nav-item:hover { background: var(--color-blue-50); color: var(--color-blue-600); }
        .nav-item.active { background: var(--color-blue-500); color: white; }
        .nav-user { display: flex; align-items: center; gap: 0.75rem; padding-left: 1rem; border-left: 1px solid var(--border-color); margin-left: 0.75rem;}
        .user-avatar { width: 2.5rem; height: 2.5rem; border-radius: 50%; object-fit: cover; border: 2px solid var(--border-color);}
        .user-info .user-name { font-weight: 600; font-size: 0.9rem; }
        .user-info .user-level { font-size: 0.8rem; color: var(--text-light); }
        .logout-btn { background: var(--color-blue-50); color: var(--color-blue-600); padding: 0.6rem; border-radius: 50%; line-height:0;}
        .logout-btn:hover { background: var(--color-red-100); color: var(--color-red-600); }

        .main-content { flex: 1; padding: 2.5rem; max-width: 1320px; margin: 0 auto; width: 100%; }
        .view-header { text-align: center; margin-bottom: 2.5rem; padding-bottom:1.5rem; border-bottom: 1px solid var(--border-color);}
        .view-header .header-icon { width: 3.5rem; height: 3.5rem; color: var(--color-blue-500); margin: 0 auto 1rem; }
        .view-header h1 { font-size: 2.25rem; font-weight: 700; margin-bottom: 0.5rem; }
        .view-header p { color: var(--text-secondary); font-size: 1.1rem; max-width: 650px; margin: 0 auto;}
        .back-btn { display:inline-flex; align-items:center; gap: 0.4rem; padding: 0.6rem 1rem; margin-bottom: 1.5rem; font-size:0.95rem; color:var(--color-blue-600); font-weight:500; border-radius:6px; background-color: var(--color-blue-50); }
        .back-btn:hover { background-color: var(--color-blue-100); }
        .back-btn .icon.rotated { transform: rotate(180deg); }

        .dashboard { display: flex; flex-direction: column; gap: 2.5rem; }
        .dashboard-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 2rem; flex-wrap: wrap;}
        .welcome-section { flex-grow: 1; }
        .welcome-section h1 { font-size: 2.25rem; font-weight: 700; margin-bottom: 0.25rem; }
        .welcome-section p { color: var(--text-secondary); font-size: 1.15rem; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1.5rem; }
        .stat-card { background: var(--bg-card); padding: 1.5rem; border-radius: 10px; display: flex; align-items: center; gap: 1rem; box-shadow: var(--shadow-md); }
        .stat-card .stat-icon { color: var(--color-blue-500); }
        .stat-card .stat-value { font-size: 1.75rem; font-weight: 700; }
        .stat-card .stat-label { font-size: 0.9rem; color: var(--text-light); }
        .team-card { background: linear-gradient(135deg, var(--color-blue-500) 0%, var(--color-green-500) 100%); color:white; padding: 2rem; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; box-shadow: var(--shadow-lg); }
        .team-card .team-info {display:flex; align-items:center; gap:1rem;}
        .team-card .team-icon { width:2.5rem; height:2.5rem; color:white;}
        .team-card h3 { font-size: 1.5rem; font-weight: 600; margin-bottom: 0.25rem; }
        .team-card p { opacity:0.9; font-size: 0.95rem; }
        .team-card code { background:rgba(255,255,255,0.2); color:white; padding:0.2rem 0.4rem; border-radius:4px;}
        .team-card .team-xp { font-size: 1.5rem; font-weight: 700; }
        .recommended-module-card { background: var(--bg-card); border: 2px solid var(--color-blue-500); padding: 1.5rem; border-radius: 10px; box-shadow: var(--shadow-md); cursor:pointer; transition: transform 0.2s, box-shadow 0.2s; position:relative; overflow:hidden;}
        .recommended-module-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); }
        .recommended-tag { position:absolute; top:0; right:0; background: var(--color-blue-500); color:white; padding:0.3rem 0.8rem; font-size:0.8rem; font-weight:600; border-bottom-left-radius:10px;}
        .recommended-module-card .module-icon { width: 2.5rem; height:2.5rem; margin-bottom:0.75rem;}
        .recommended-module-card h3 { font-size:1.3rem; margin-bottom:0.5rem;}
        .recommended-module-card p { font-size:0.95rem; color: var(--text-secondary); margin-bottom:1rem;}
        .recommended-module-card .start-btn.small { padding: 0.6rem 1rem; font-size:0.9rem; margin-top:auto;}
        .modules-section .module-category-section { margin-bottom: 2.5rem; }
        .modules-section .category-title { font-size: 1.75rem; font-weight: 600; margin-bottom: 1.5rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border-color); color: var(--text-primary); }
        .modules-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 2rem; }
        .module-card { background: var(--bg-card); padding: 1.5rem; border-radius: 12px; box-shadow: var(--shadow-md); display: flex; flex-direction: column; cursor:pointer; transition: transform 0.2s, box-shadow 0.2s;}
        .module-card:hover { transform: translateY(-5px); box-shadow: var(--shadow-lg); }
        .module-card .module-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .module-card .module-icon { width: 2.5rem; height: 2.5rem; }
        .module-card.blue .module-icon { color: var(--color-blue-500); } .module-card.blue .progress-fill { background: var(--color-blue-500); }
        .module-card.green .module-icon { color: var(--color-green-500); } .module-card.green .progress-fill { background: var(--color-green-500); }
        .module-card.green .module-icon { color: var(--color-green-500); } .module-card.green .progress-fill { background: var(--color-green-500); }
        .module-card.orange .module-icon { color: var(--color-orange-500); } .module-card.orange .progress-fill { background: var(--color-orange-500); }
        .module-card.red .module-icon { color: var(--color-red-500); } .module-card.red .progress-fill { background: var(--color-red-500); }
        .module-card.pink .module-icon { color: var(--color-pink-500); } .module-card.pink .progress-fill { background: var(--color-pink-500); }
        .module-card .module-meta { display: flex; gap: 0.75rem; }
        .module-card .difficulty, .module-card .duration { font-size: 0.8rem; padding: 0.3rem 0.6rem; border-radius: 16px; background: #e9ecef; color: var(--text-secondary); }
        .module-card h3 { font-size: 1.35rem; font-weight: 600; margin-bottom: 0.5rem; }
        .module-card p { color: var(--text-secondary); margin-bottom: 1.5rem; line-height: 1.5; flex-grow: 1; font-size:0.95rem; }
        .module-card .progress-section { margin-bottom: 1.5rem; }
        .module-card .progress-bar { height: 8px; background: #e9ecef; border-radius: 4px; overflow: hidden; margin-bottom: 0.5rem; }
        .module-card .progress-fill { height: 100%; transition: width 0.3s ease-in-out; }
        .module-card .progress-text { font-size: 0.85rem; color: var(--text-light); }
        .module-card .start-btn { width: 100%; padding: 0.8rem 1.2rem; background: var(--color-blue-500); color: white; border-radius: 8px; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-size:0.95rem; }
        .module-card .start-btn:hover { background: var(--color-blue-600); }

        .module-view-header { background: var(--bg-card); padding: 2rem; border-radius: 12px; box-shadow: var(--shadow-md); margin-bottom:2rem;}
        .module-title-section { display: flex; align-items: flex-start; gap: 2rem; }
        .category-tag-module { display: inline-block; background-color: var(--color-green-100); color: var(--color-green-600); padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.8rem; font-weight: 500; margin-bottom: 0.5rem; }
        .module-icon-large { width: 4rem; height: 4rem; flex-shrink: 0; }
        .module-title-section h1 { font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem; }
        .module-title-section p { color: var(--text-secondary); font-size: 1.1rem; margin-bottom: 1rem; }
        .module-badges { display: flex; gap: 0.75rem; flex-wrap: wrap; }
        .badge { font-size: 0.85rem; padding: 0.35rem 0.8rem; border-radius: 16px; background: var(--color-blue-100); color: var(--color-blue-600); font-weight:500;}
        .lessons-list { background: var(--bg-card); border-radius: 12px; box-shadow: var(--shadow-md); overflow: hidden; }
        .lesson-item { display: flex; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color); transition: background-color 0.2s; cursor:pointer;}
        .lesson-item:last-child { border-bottom: none; }
        .lesson-item:not(.locked):hover { background: var(--color-blue-50); }
        .lesson-item.completed { background: var(--color-green-50); border-left: 5px solid var(--color-green-500); padding-left: calc(1.5rem - 5px);}
        .lesson-item.locked { opacity: 0.6; background: #f8f9fa; cursor: not-allowed; }
        .lesson-item .lesson-number { width: 2.5rem; height: 2.5rem; border-radius: 50%; border: 2px solid var(--border-color); display: flex; align-items: center; justify-content: center; font-weight: 600; margin-right: 1rem; flex-shrink: 0; color: var(--text-secondary); }
        .lesson-item.completed .lesson-number { background: var(--color-green-500); border-color: var(--color-green-500); color: white; }
        .lesson-item .lesson-type-icon { width: 1.75rem; height: 1.75rem; margin-right: 1rem; }
        .lesson-item .lesson-content { flex: 1; }
        .lesson-item .lesson-content h3 { font-size: 1.15rem; font-weight: 600; margin-bottom: 0.25rem; }
        .lesson-item .lesson-type-badge { font-size: 0.8rem; color: var(--text-light); background-color: #f1f3f5; padding:0.2rem 0.5rem; border-radius:4px; display:inline-block;}
        .lesson-item .lesson-btn { padding: 0.6rem 1rem; background: var(--color-blue-500); color: white; border-radius: 6px; display: flex; align-items: center; gap: 0.4rem; font-size:0.9rem; margin-left:auto;}
        .lesson-item .lesson-btn:hover:not(:disabled) { background: var(--color-blue-600); }
        .lesson-item.locked .lesson-btn { background: #adb5bd; }

        .lesson-content-view { background: var(--bg-card); padding: 2.5rem; border-radius: 12px; box-shadow: var(--shadow-lg); }
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

        .quiz-view { background: var(--bg-card); padding: 2rem; border-radius: 12px; box-shadow: var(--shadow-lg); }
        .quiz-header-info {text-align:center; margin-bottom:2rem; padding-bottom:1.5rem; border-bottom:1px solid var(--border-color);}
        .quiz-header-info h2 {font-size:1.8rem; margin-top:0.5rem; margin-bottom:1rem;}
        .quiz-progress { display: flex; flex-direction: column; gap: 0.5rem; max-width:400px; margin:0 auto;}
        .quiz-progress span { font-size: 0.9rem; color: var(--text-light); }
        .quiz-progress .progress-bar { height: 10px; background: #e9ecef; border-radius: 5px; overflow: hidden; }
        .quiz-progress .progress-bar div { height:100%; background: var(--color-blue-500); transition: width 0.3s; }
        .question-card { padding: 1.5rem 0; }
        .question-card h3 { font-size: 1.5rem; font-weight: 600; margin-bottom: 2rem; line-height: 1.4; text-align:center; }
        .options-list { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem; max-width:700px; margin-left:auto; margin-right:auto;}
        .option-btn { display: flex; align-items: center; gap: 1rem; padding: 1.25rem; background: white; border: 2px solid var(--border-color); border-radius: 10px; cursor: pointer; transition: all 0.2s; text-align: left; width:100%; font-size:1.05rem;}
        .option-btn:hover:not(:disabled) { border-color: var(--color-blue-100); background: var(--color-blue-50); }
        .option-btn.selected:not(.correct):not(.incorrect) { border-color: var(--color-blue-500); background: var(--color-blue-100); box-shadow: 0 0 0 2px var(--color-blue-500); font-weight:500;}
        .option-btn.correct { background-color: var(--color-green-100); border-color: var(--color-green-500); color: var(--color-green-600); font-weight: bold; }
        .option-btn.incorrect { background-color: var(--color-red-100); border-color: var(--color-red-500); color: var(--color-red-600); }
        .option-letter { width: 2.25rem; height: 2.25rem; border-radius: 50%; background: #f1f3f5; display: flex; align-items: center; justify-content: center; font-weight: 600; color: var(--text-secondary); flex-shrink: 0; transition: all 0.2s;}
        .option-btn.selected:not(.correct):not(.incorrect) .option-letter { background: var(--color-blue-500); color: white; }
        .option-btn.correct .option-letter { background: var(--color-green-500); color: white; }
        .option-btn.incorrect .option-letter { background: var(--color-red-500); color: white; }
        .explanation-box { margin-top: 1.5rem; padding: 1rem; background-color: var(--color-blue-50); border-radius: 8px; border: 1px solid var(--color-blue-100); color: var(--text-secondary); font-size: 0.95rem; }
        .explanation-box strong { color: var(--text-primary); }
        .quiz-view .submit-btn { display: block; width: auto; min-width:200px; margin:1.5rem auto 0; padding: 1rem 2.5rem; background: var(--color-blue-500); color: white; border-radius: 8px; font-size: 1.05rem; font-weight: 600; }
        .quiz-view .submit-btn:hover:not(:disabled) { background: var(--color-blue-600); }
        .quiz-result { text-align: center; padding: 2rem; }
        .quiz-result .result-icon { width: 5rem; height: 5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; }
        .quiz-result .result-icon svg {width:2.5rem; height:2.5rem; color:white;}
        .quiz-result .result-icon.success { background: var(--color-green-500); }
        .quiz-result .result-icon.fail { background: var(--color-red-500); }
        .quiz-result h2 { font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem; }
        .quiz-result p { font-size: 1.15rem; color: var(--text-secondary); margin-bottom: 0.5rem;}
        .quiz-result .xp-earned {color: var(--color-green-600); font-weight:600;}
        .quiz-result .result-actions { display: flex; gap: 1.5rem; justify-content: center; margin-top: 2rem; }
        .quiz-result .retry-btn, .quiz-result .continue-btn { padding: 0.8rem 1.8rem; border-radius: 8px; font-weight: 600; font-size: 0.95rem; display:inline-flex; align-items:center; gap:0.5rem;}
        .quiz-result .retry-btn { background: #f1f3f5; color: var(--text-primary); border: 1px solid var(--border-color); }
        .quiz-result .retry-btn:hover { background: #e9ecef; }
        .quiz-result .continue-btn { background: var(--color-blue-500); color: white; }
        .quiz-result .continue-btn:hover { background: var(--color-blue-600); }

        .game-view { background: var(--bg-card); padding: 2rem; border-radius: 12px; box-shadow: var(--shadow-lg); }
        .game-header-info {text-align:center; margin-bottom:2rem; padding-bottom:1.5rem; border-bottom:1px solid var(--border-color);}
        .game-header-info h2 {font-size:1.8rem; margin-top:0.5rem; margin-bottom:1rem;}
        .game-container { text-align:center; }
        .game-instructions { font-size:1.05rem; color: var(--text-secondary); margin-bottom: 2rem; padding: 1rem; background: var(--color-blue-50); border-radius:8px;}
        .game-placeholder { min-height: 200px; background: #e9ecef; border-radius: 8px; display:flex; align-items:center; justify-content:center; color: var(--text-light); font-style:italic; margin-bottom:2rem;}
        .complete-game-btn { padding: 1rem 2.5rem; background: var(--color-green-500); color: white; border-radius: 8px; font-size: 1.05rem; font-weight: 600; }
        .complete-game-btn:hover { background: var(--color-green-600); }

        .teams-view .current-team-card { background: var(--bg-card); padding: 2.5rem; border-radius: 12px; box-shadow: var(--shadow-lg); }
        .current-team-card .team-card-main { display:flex; align-items:flex-start; gap:2rem; margin-bottom:1.5rem;}
        .team-avatar-icon { width:4rem; height:4rem; flex-shrink:0; }
        .current-team-card h2 { font-size:1.8rem; font-weight:700; margin-bottom:0.5rem;}
        .team-description-small { font-size:1rem; color: var(--text-secondary); margin-bottom:0.75rem;}
        .current-team-card p {font-size:1rem; color:var(--text-secondary); margin-bottom:0.3rem;}
        .team-code-display { background: var(--color-blue-100); color: var(--color-blue-600); padding:0.3rem 0.6rem; border-radius:4px; font-weight:bold;}
        .team-management-actions { display: flex; gap: 1rem; margin-top: 1.5rem; border-top: 1px solid var(--border-color); padding-top: 1.5rem; }
        .leave-team-btn { padding: 0.8rem 1.5rem; background: var(--color-orange-100); color: var(--color-orange-600); border:1px solid var(--color-orange-500); border-radius: 8px; font-weight: 600; }
        .leave-team-btn:hover { background: var(--color-orange-500); color:white; }
        .delete-team-btn { padding: 0.8rem 1.5rem; background: var(--color-red-100); color: var(--color-red-600); border:1px solid var(--color-red-500); border-radius: 8px; font-weight: 600; display:inline-flex; align-items:center; gap:0.5rem;}
        .delete-team-btn:hover { background: var(--color-red-500); color:white; }

        .no-team-actions { display:grid; grid-template-columns:1fr; gap:2.5rem; max-width:700px; margin:0 auto;}
        .team-action-card { background:var(--bg-card); padding:2rem; border-radius:10px; box-shadow:var(--shadow-md); text-align:center;}
        .team-action-card h3 {font-size:1.4rem; font-weight:600; margin-bottom:0.5rem;}
        .team-action-card p {font-size:1rem; color:var(--text-secondary); margin-bottom:1.5rem;}
        .input-group { display:flex; gap:1rem; }
        .input-group input {flex-grow:1;}
        .input-group button { padding: 0.75rem 1.5rem; background: var(--color-blue-500); color:white; border-radius:6px; font-weight:500;}
        .input-group button:hover:not(:disabled) {background: var(--color-blue-600);}
        .divider-or {text-align:center; font-weight:500; color:var(--text-light); position:relative;}
        .divider-or::before, .divider-or::after {content:''; display:block; width:40%; height:1px; background:var(--border-color); position:absolute; top:50%;}
        .divider-or::before {left:0;} .divider-or::after {right:0;}

        .browse-teams-view .search-bar-container { display: flex; align-items: center; margin-bottom: 2.5rem; background: var(--bg-card); padding: 0.6rem 1.2rem; border-radius: 8px; box-shadow: var(--shadow-md); }
        .browse-teams-view .search-icon { color: #9ca3af; margin-right: 0.8rem; width:1.25rem; height:1.25rem;}
        .browse-teams-view .teams-search-input { flex-grow: 1; border: none; padding: 0.8rem 0.5rem; font-size: 1.05rem; outline: none; background:transparent; }
        .teams-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 2rem; }
        .team-browse-card { background: var(--bg-card); padding: 1.75rem; border-radius: 10px; box-shadow: var(--shadow-md); display:flex; flex-direction:column; transition: transform 0.2s, box-shadow 0.2s;}
        .team-browse-card:hover {transform:translateY(-4px); box-shadow:var(--shadow-lg);}
        .team-browse-card .team-card-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;}
        .team-browse-card h3 { font-size: 1.3rem; color: var(--color-blue-600); margin-bottom:0.25rem; font-weight:600;}
        .team-browse-card .team-code-badge { font-size:0.8rem; background-color:var(--color-green-100); color:var(--color-green-600); padding:0.3rem 0.7rem; border-radius:12px; font-weight:500;}
        .team-browse-card .team-description { color: var(--text-secondary); font-size:0.95rem; line-height:1.5; margin-bottom:1.5rem; flex-grow:1;}
        .team-browse-card .team-card-footer { display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-color); padding-top:1.25rem; font-size:0.9rem; color:var(--text-light);}
        .team-browse-card .team-card-footer span { display:flex; align-items:center; gap:0.4rem;}
        .join-team-browse-btn { background-color: var(--color-blue-500); color:white; padding: 0.7rem 1.2rem; border-radius:6px; font-weight:500;}
        .join-team-browse-btn:hover:not(:disabled) { background-color: var(--color-blue-600);}
        .join-team-browse-btn:disabled { background-color: #bdc3c7; }
        .current-team-indicator { color: var(--color-green-600); font-weight:600; display:flex; align-items:center; gap:0.3rem;}

        .leaderboard-view .leaderboard-list { background: var(--bg-card); border-radius:10px; box-shadow: var(--shadow-lg); overflow:hidden;}
        .leaderboard-item { display:flex; align-items:center; padding: 1.25rem 1.75rem; border-bottom: 1px solid var(--border-color); transition: background-color 0.2s;}
        .leaderboard-item:last-child {border-bottom:none;}
        .leaderboard-item:hover { background-color: var(--color-blue-50); }
        .leaderboard-item.current-team { background-color: var(--color-blue-100); border-left: 5px solid var(--color-blue-500); padding-left: calc(1.75rem - 5px);}
        .leaderboard-item .rank-badge { font-size:1.2rem; font-weight:700; color:var(--text-primary); width:3.5rem; text-align:left;}
        .leaderboard-item .team-info { flex-grow:1; }
        .leaderboard-item .team-info h3 {font-size:1.2rem; color:var(--color-blue-600); margin-bottom:0.1rem; font-weight:600;}
        .leaderboard-item .team-info p {font-size:0.9rem; color:var(--text-light);}
        .leaderboard-item .team-xp {font-size:1.2rem; font-weight:700; color:var(--color-green-500); margin-left:auto; text-align:right;}

        .challenge-view { background: var(--bg-card); padding: 2rem; border-radius: 12px; box-shadow: var(--shadow-lg); }
        .challenge-idle-content { text-align:center; padding: 2rem 0;}
        .challenge-arena-icon { width: 100px; height: 100px; margin: 0 auto 1.5rem; border-radius: 12px; }
        .challenge-idle-content h2 { font-size: 1.8rem; color: var(--text-primary); margin-bottom: 0.75rem; }
        .challenge-idle-content p { font-size: 1.1rem; color: var(--text-secondary); margin-bottom: 2rem; }
        .challenge-action-btn { padding: 0.8rem 1.5rem; border-radius:8px; font-size:1rem; font-weight:500; display:inline-flex; align-items:center; justify-content:center; gap:0.6rem; border:1px solid transparent; line-height: 1.2;}
        .start-challenge-btn { background-color: var(--color-green-500); color:white; padding: 1rem 2.5rem; font-size:1.1rem; font-weight:600;}
        .start-challenge-btn:hover:not(:disabled) { background-color: var(--color-blue-600); }

        .active-challenge .challenge-header { display: flex; justify-content: space-between; align-items: center; margin-bottom:1.5rem; padding-bottom:1rem; border-bottom:1px solid var(--border-color); }
        .active-challenge .challenge-header h2 { font-size:1.4rem; font-weight:600; color:var(--text-primary); }
        .challenge-timer { font-size:1rem; font-weight:500; color:var(--text-secondary); display:flex; align-items:center; gap:0.4rem; }
        .timer-critical { color: var(--color-red-500); font-weight: bold; }
        .challenge-score { font-size:1rem; font-weight:500; color:var(--color-green-600); }

        .challenge-question-card { padding: 1rem 0; }
        .challenge-question-card .question-category-tag { display:inline-block; background-color:var(--color-blue-100); color:var(--color-blue-600); padding:0.3rem 0.8rem; border-radius:12px; font-size:0.85rem; margin-bottom:1rem;}
        .challenge-question-card h3 { font-size: 1.4rem; font-weight: 600; margin-bottom: 1.5rem; line-height: 1.4; color:var(--text-primary); }
        .challenge-options-list { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem; }
        .challenge-option-btn { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: white; border: 2px solid var(--border-color); border-radius: 8px; text-align: left; width:100%; font-size:1rem;}
        .challenge-option-btn:hover:not(:disabled) { border-color: var(--color-blue-100); background: var(--color-blue-50); }
        .challenge-option-btn.selected:not(.correct):not(.incorrect) { border-color: var(--color-blue-500); background: var(--color-blue-100); font-weight:500;}
        .challenge-option-btn.correct { background-color: var(--color-green-100); border-color: var(--color-green-500); color: var(--color-green-600); font-weight: bold; }
        .challenge-option-btn.incorrect { background-color: var(--color-red-100); border-color: var(--color-red-500); color: var(--color-red-600); }
        .challenge-option-btn .option-letter { background: #e9ecef; }
        .challenge-option-btn.selected:not(.correct):not(.incorrect) .option-letter { background: var(--color-blue-500); color: white; }
        .challenge-option-btn.correct .option-letter { background: var(--color-green-500); color: white; }
        .challenge-option-btn.incorrect .option-letter { background: var(--color-red-500); color: white; }

        .challenge-feedback { margin-top:1.5rem; padding:1rem; border-radius:8px; }
        .challenge-feedback .feedback-correct { color:var(--color-green-600); font-weight:bold; display:flex; align-items:center; gap:0.5rem; margin-bottom:0.5rem; }
        .challenge-feedback .feedback-incorrect { color:var(--color-red-600); font-weight:bold; display:flex; align-items:center; gap:0.5rem; margin-bottom:0.5rem;}
        .challenge-feedback .explanation-text { font-size:0.9rem; color:var(--text-secondary); margin-bottom:1rem; }
        .next-question-btn { background-color: var(--color-blue-500); color:white; margin-top:1rem; }
        .next-question-btn:hover:not(:disabled) { background-color: var(--color-blue-600); }

        .challenge-results .results-summary { text-align:center; padding:2rem 0; font-size:1.2rem; color:var(--text-secondary);}
        .challenge-results .xp-earned-challenge { font-size:1.4rem; color:var(--color-green-600); font-weight:bold; margin-top:0.5rem;}
        .challenge-ended-options { margin-top:1.5rem; display:flex; justify-content:center; gap:1.5rem;}
        .play-again-btn { background-color:var(--color-green-500); color:white; border-color:var(--color-green-600);}
        .play-again-btn:hover { background-color:var(--color-green-600);}
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
            border-color: var(--color-green-500);
            box-shadow: 0 0 0 0.2rem rgba(139, 92, 246, 0.25);
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
            border-color: var(--color-green-300);
        }
        .category-checkbox-item input[type="checkbox"] {
          width: 1rem;
          height: 1rem;
          accent-color: var(--color-green-500);
          cursor: pointer;
        }
        .category-checkbox-item label {
            cursor: pointer;
            font-weight: normal;
            color: var(--text-secondary);
        }

        @media (max-width: 1024px) {
            .nav-items { gap: 0.5rem; }
            .nav-item { padding: 0.6rem 0.8rem; font-size:0.9rem;}
            .main-content { padding: 2rem 1.5rem; }
        }
        @media (max-width: 768px) {
            .nav { flex-direction:column; height:auto; padding:1rem; }
            .nav-brand {margin-bottom:0.5rem;}
            .nav-items { width:100%; flex-direction:column; align-items:stretch; gap:0.3rem; margin-top:0.5rem; }
            .nav-item { justify-content:flex-start; }
            .nav-user { width:100%; border-left:none; border-top:1px solid var(--border-color); margin-top:1rem; padding-top:1rem; justify-content:space-between; margin-left:0;}
            .main-content { padding: 1.5rem 1rem; }
            .view-header h1 {font-size:1.8rem;} .view-header p {font-size:1rem;}
            .dashboard-header {flex-direction:column; align-items:stretch;}
            .welcome-section h1 {font-size:1.8rem;}
            .modules-grid, .teams-grid {grid-template-columns:1fr;}
            .module-title-section {flex-direction:column; align-items:flex-start;}
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
            .module-card h3, .team-browse-card h3 {font-size:1.2rem;}
            .lesson-item {padding:1rem; flex-wrap:wrap;}
            .lesson-item .lesson-btn {width:100%; margin-top:0.75rem; justify-content:center;}
            .lesson-content-view {padding:1.5rem;}
            .quiz-view, .challenge-view {padding:1.5rem;}
            .option-btn, .challenge-option-btn {padding:1rem; font-size:0.95rem;}
            .current-team-card .team-card-main {flex-direction:column; align-items:center; text-align:center; gap:1rem;}
            .team-avatar-icon {margin-bottom:0.5rem;}
            .challenge-question-card h3 { font-size:1.2rem; }
            .category-checkboxes { justify-content: center; }
        }
      `}</style>
    </>
  );
};

export default App;