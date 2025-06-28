import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GoogleOAuthProvider, GoogleLogin, googleLogout } from '@react-oauth/google';
import { Play, Users, Trophy, BookOpen, Code, Zap, Target, Award, ChevronRight, X, Check, RotateCcw, Home, LogOut, Search, Eye, MessageSquare, Brain, Settings2, Puzzle, HelpCircle, Clock, BarChart2, Layers, Crosshair, Truck, Wrench, University, SquarePen, Terminal, Bot, CircuitBoard, Radar, Trash2, Sun, Moon } from 'lucide-react';

import { auth, db } from './Firebase';
import { GoogleAuthProvider as FirebaseGoogleAuthProvider, signInWithCredential, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import {
  doc, getDoc, setDoc, updateDoc, writeBatch,
  collection, query, where, getDocs, addDoc, serverTimestamp,
  increment, arrayUnion, arrayRemove, orderBy, limit, deleteDoc
} from 'firebase/firestore';

import './App.css';

const slugify = (text) => text.toString().toLowerCase().trim()
  .replace(/\s+/g, '-')
  .replace(/[^\w-]+/g, '')
  .replace(/--+/g, '-')
  .replace(/^-+/, '')
  .replace(/-+$/, '');

const generateContentDetail = (title, customText = "", includeAdvancedExamples = false) => {
    const placeholderText = customText || `Comprehensive guide on ${title}. Learn about its principles, applications in VEX robotics, and best practices. Detailed examples and diagrams will be provided.`;
    
    const imagePath = `/images/lessons/${slugify(title)}.png`;

    const advancedContent = `
        <h3>External Resources & Visuals</h3>
        <p>
            For a more in-depth look at this topic, you can review the official documentation.
            <a href="https://kb.vex.com/hc/en-us" target="_blank" rel="noopener noreferrer" class="content-link">
                Visit the VEX Knowledge Base
            </a>. This will open in a new tab.
        </p>
        
        <h4>Video Demonstration:</h4>
        <div class="video-container">
            <iframe 
                width="560" 
                height="315" 
                src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
                title="YouTube video player" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
            </iframe>
        </div>
        
        <h3>Data Comparison Table</h3>
        <p>Understanding the trade-offs between different components is crucial. Here's a sample comparison:</p>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Component</th>
                        <th>Primary Use</th>
                        <th>Advantage</th>
                        <th>Consideration</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>C-Channels</td>
                        <td>Main Structure</td>
                        <td>High Strength, Versatile</td>
                        <td>Can be heavy</td>
                    </tr>
                    <tr>
                        <td>Aluminum Angles</td>
                        <td>Bracing, Mounting</td>
                        <td>Lightweight</td>
                        <td>Less rigid than C-Channels</td>
                    </tr>
                    <tr>
                        <td>Gussets</td>
                        <td>Reinforcing Joints</td>
                        <td>Adds significant stability</td>
                        <td>Adds complexity</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;

    return `
        <h1>${title}</h1>
        <p>${placeholderText}</p>
        <img src='${imagePath}' 
             alt='${title}' 
             style='width:100%;max-width:450px;border-radius:8px;margin:1.5rem auto;display:block;border:1px solid #ccc;'
             onError="(e) => { e.target.onerror = null; e.target.src='https://placehold.co/600x350/EBF0F5/8FA4B8?text=${encodeURIComponent(title)}' }"
        />
        <h2>Key Concepts</h2>
        <ul>
            <li>Concept A: Detailed explanation.</li>
            <li>Concept B: Another detailed point.</li>
            <li>Concept C: Further elaboration.</li>
        </ul>
        ${includeAdvancedExamples ? advancedContent : ''}
        <p>This structure allows for rich content including headings, paragraphs, images, and lists.</p>
    `;
};


const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '664588170188-e2mvb0g24k22ghdfv6534kp3808rk70q.apps.googleusercontent.com';
const XP_PER_LEVEL = 500;
const CHALLENGE_MAX_XP = 100;
const QUESTIONS_PER_CHALLENGE = 5;
const QUESTION_TIMER_DURATION = 20;


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
          <p>The Ultimate VEX Learning Platform</p>
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

const Navigation = ({ user, currentView, navigate, handleLogout, actionLoading, theme, toggleTheme }) => (
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
            <div className="user-info"><span className="user-name">{user.name}</span><span className="user-level">  Lvl {user.level} ({user.xp || 0} XP)</span></div>
            <button onClick={toggleTheme} className="theme-toggle-btn" title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
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
  const preferredCategoryOrder = ['Hardware', 'Programming', 'CAD', 'Electronics', 'Sensors', 'Competition', 'General'];
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
            <button className="start-btn small recommended-start-btn" disabled={actionLoading}>
                {userProgress[recommendedNextModule.id] && Object.keys(userProgress[recommendedNextModule.id].lessons).length > 0 ? 'Continue Module' : 'Start Module'} <ChevronRight className="icon-small"/>
            </button>
        </div>
    )}
    <div className="modules-section">
      {categoryOrder.map(category => {
          if (!categorizedModules[category] || categorizedModules[category].length === 0) return null;
          return (
              <div key={category} className="module-category-section">
                  <h2 className="category-title">{category} Topics</h2>
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
            <Puzzle className="header-icon" style={{color: '--color-green-500'}} />
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
  const [challengeSelectedAnswer, setChallengeSelectedAnswer] = useState(null);
  const [showChallengeAnswer, setShowChallengeAnswer] = useState(false);
  const [challengeTimer, setChallengeTimer] = useState(QUESTION_TIMER_DURATION);
  const [theme, setTheme] = useState('light');

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };


  const [numChallengeQuestionsInput, setNumChallengeQuestionsInput] = useState(QUESTIONS_PER_CHALLENGE);
  const [availableChallengeCategories, setAvailableChallengeCategories] = useState([]);
  const [selectedChallengeCategories, setSelectedChallengeCategories] = useState([]);


  const learningModules = useMemo(() => [
 {
  id: slugify('Fundamentals'),
  category: 'Hardware',
  title: 'Design Fundamentals',
  description: 'Gears, Internal Forces (Stress), Torque, RPM and Speed Control, Center of Mass (CoM)',
  duration: 'Approx. 75 min',
  lessons: 5,
  difficulty: 'Beginner',
  color: 'blue',
  icon: Settings2,
  content: {
   lessons: [
    { id: slugify('Gears & Gear Ratios'), title: 'Gear Ratios In-Depth', type: 'lesson', xp: 25, contentDetail: generateContentDetail('Gear Ratios In-Depth', "Gear ratios are one of the most common design decisions that a team must master in order to optimize mechanical advantage in their designs.") },
    { id: slugify('Internal Forces (Stress)'), title: 'Understanding Internal Forces (Stress)', type: 'lesson', xp: 20, contentDetail: generateContentDetail('Understanding Internal Forces (Stress)', "In materials science, stress refers to the internal forces that exist within a material as a result of external loads or forces acting on it.") },
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
  duration: 'Approx. 40 min',
  lessons: 7,
  difficulty: 'Beginner',
  color: 'blue',
  icon: Puzzle,
  content: {
   lessons: [
    { id: slugify('C-Channels and Angles'), title: 'C-Channels and Angles', type: 'lesson', xp: 20, contentDetail: generateContentDetail('C-Channels and Angles', "Important components for main structural foundations. The most commonly used type of metal in VEX, C-Channels provide a stable, secure grounding for a majority of subsystems that can be used.", true) },
    { id: slugify('Fasteners'), title: 'Fasteners', type: 'lesson', xp: 20, contentDetail: generateContentDetail('Fasteners', "Crucial for attaching structural pieces to each other. In the scope of the VEX Robotics Competition, the typical screw will be steel and will have an #8-32 thread size.") },
    { id: slugify('Gussets and Brackets'), title: 'Gussets and Brackets', type: 'lesson', xp: 20, contentDetail: generateContentDetail('Gussets and Brackets', "Smaller metal pieces used to mount structural components. There are many different varieties of Gusset available to use in the VEX Robotics Competition.") },
    { id: slugify('Structure Principles Quiz'), title: 'Structure Principles Quiz', type: 'quiz', xp: 35 },
    { id: slugify('Retainers'), title: 'Retainers', type: 'lesson', xp: 15, contentDetail: generateContentDetail('Retainers', "Simplify robot construction with hex nut retainers and standoffs retainers. Retainers are nylon, hexagonally-shaped parts which have varying protrusions depending on the type of retainer used.") },
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
  color: 'blue',
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
  id: slugify('Drivetrains'),
  category: 'Hardware',
  title: 'Drivetrains',
  description: 'Tank Drive, Mecanum Drive, Holonomic Drive (Non-Mecanum), Designing a Drivetrain, Drivetrain Best Practices',
  duration: 'Approx. 100 min',
  lessons: 6,
  difficulty: 'Intermediate',
  color: 'blue',
  icon: Truck,
  content: {
   lessons: [
    { id: slugify('Tank Drive'), title: 'Tank Drive', type: 'lesson', xp: 20, contentDetail: generateContentDetail('Tank Drive', "Tank drives are a very popular type of drivetrain used in the VEX Robotics Competition.") },
    { id: slugify('Mecanum Drive'), title: 'Mecanum Drive', type: 'lesson', xp: 25, contentDetail: generateContentDetail('Mecanum Drive', "The Mecanum Drive is just as simple to build as the Tank Drive, but has the ability to drive sideways.") },
    { id: slugify('Holonomic Drive (Non-Mecanum)'), title: 'Holonomic Drive (Non-Mecanum)', type: 'lesson', xp: 25, contentDetail: generateContentDetail('Holonomic Drive (Non-Mecanum)', "Holonomic drives have become a popular choice for VEX Robotics teams due to their enhanced maneuverability and flexibility in movement. This primarily covers X-Drives and H-Drives.") },
    { id: slugify('Drivetrain Concepts Quiz'), title: 'Drivetrain Concepts Quiz', type: 'quiz', xp: 35 },
    { id: slugify('Designing a Drivetrain'), title: 'Designing a Drivetrain', type: 'lesson', xp: 20, contentDetail: generateContentDetail('Designing a Drivetrain', "The performance of any drivetrain is based not only on the type selected, but also on the quality with which it is designed and built.") },
    { id: slugify('Drivetrain Best Practices'), title: 'Drivetrain Best Practices', type: 'lesson', xp: 20, contentDetail: generateContentDetail('Drivetrain Best Practices', "This video does a great job show casing some of the best practices when building a drivetrain, focusing on core components like bearing blocks, standoffs, and C-Channels.") },
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
  color: 'blue',
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
  id: slugify('The Judging Process'),
  category: 'Competition',
  title: 'The Judging Process',
  description: 'The Engineering Design Process Explained, Effective Testing and Refinement, The Engineering Notebook Excellence, The Team Interview, Understanding the Interview Rubric, Using Notion for Engineering Notebook',
  duration: 'Approx. 90 min',
  lessons: 6,
  difficulty: 'Intermediate',
  color: 'blue',
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
  color: 'blue',
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
  category: 'Programming',
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
  category: 'Programming',
  title: 'Software Tools and Techniques',
  description: 'VEX Programming Software Overview (Non-VEXcode), Introduction to Object Recognition',
  duration: 'Approx. 60 min',
  lessons: 2,
  difficulty: 'Intermediate',
  color: 'blue',
  icon: Code,
  content: {
   lessons: [
    { id: slugify('VEX Programming Software Overview (Non-VEXcode)'), title: 'VEX Programming Software Overview (Non-VEXcode)', type: 'lesson', xp: 25, contentDetail: generateContentDetail('VEX Programming Software Overview (Non-VEXcode)', "Overview of PROS, vexide, Robot Mesh Studio (RMS), EasyC, RobotC, and Midnight C, discussing their features and use cases for different skill levels and needs.") },
    { id: slugify('Introduction to Object Recognition'), title: 'Introduction to Object Recognition', type: 'lesson', xp: 25, contentDetail: generateContentDetail('Introduction to Object Recognition', "Basics of using vision sensors or simple computer vision algorithms for recognizing game elements or field features in VEX.") },
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
    'structure-principles-quiz': {
      title: 'Structure Principles Quiz',
      questions: [
        { id: 1, question: 'What is the primary function of a Bearing Flat in a VEX robot design?', options: ['To connect two C-Channels at a 90-degree angle.', 'To reduce friction on a rotating shaft.', 'To secure a motor to the chassis.', 'To act as a primary structural element.'], correct: 1, explanation: 'Bearings are crucial for allowing shafts to spin smoothly with minimal friction, preventing wear and ensuring efficient power transfer.' },
        { id: 2, question: 'Which part is specifically designed to reinforce joints and create strong connections, often in a triangular pattern?', options: ['Standoff', 'C-Channel', 'Flex Wheel', 'Gusset'], correct: 3, explanation: 'Gussets are small plates used to strengthen the connection between two structural parts, significantly increasing the rigidity of the joint.' },
        { id: 3, question: 'In VEX, what is the standard thread size for the vast majority of screws and nuts used?', options: ['#6-32', '#10-24', '#8-32', 'M4'], correct: 2, explanation: 'The VEX EDR system is standardized around the #8-32 screw size for almost all structural connections.' }
      ]
    },
    'drivetrain-concepts-quiz': {
        title: 'Drivetrain Concepts Quiz',
        questions: [
            { id: 1, question: 'What is the key advantage of a Mecanum Drive compared to a standard Tank Drive?', options: ['It is much faster in a straight line.', 'It uses fewer motors.', 'It can move sideways (strafe) without turning.', 'It has better traction for pushing.'], correct: 2, explanation: 'Mecanum wheels, with their angled rollers, allow the robot to move in any direction (holonomic motion), including sideways, which is known as strafing.' },
            { id: 2, question: 'What is a major design consideration you must account for when building a robust Tank Drive?', options: ['Ensuring all wheels are omni-directional wheels.', 'Making the chassis as flexible as possible.', 'Properly supporting shafts with bearings to prevent bending.', 'Using the smallest possible gears for the drive.'], correct: 2, explanation: 'Drivetrain shafts are under significant stress. Supporting them on both sides of the wheel with bearings prevents friction, shaft bending, and power loss.' },
            { id: 3, question: 'A holonomic drive system (like an X-Drive or H-Drive) is defined by its ability to...', options: ['Climb steep ramps easily.', 'Translate and rotate simultaneously and independently.', 'Operate silently.', 'Be built with only aluminum parts.'], correct: 1, explanation: 'Holonomic drives have full maneuverability in a 2D plane, meaning they can move forward/backward, side-to-side, and rotate all at the same time.' }
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
    { id: 'vcq3', category: 'Programming', difficulty: 'Easy', question: 'In C++ based VEX programming, what is often used to define a reusable block of code for a specific task?', options: ['A variable', 'A loop statement', 'A function', 'An array'], correctAnswerIndex: 2, explanation: 'Functions are fundamental for organizing code into reusable blocks for specific tasks in C++ and other languages.' },
    { id: 'vcq4', category: 'Programming', difficulty: 'Medium', question: 'What does "PID" stand for in the context of robot motor control?', options: ['Positive Input Drive', 'Proportional Integral Derivative', 'Program Instruction Data', 'Power Intensity Diagram'], correctAnswerIndex: 1, explanation: 'PID is a control loop mechanism meaning Proportional, Integral, Derivative, used for precise motor control.' },
    { id: 'vcq5', category: 'Hardware', difficulty: 'Medium', question: 'When attaching a V5 Smart Motor to a C-channel, what is a common cause of motor strain or damage?', options: ['Using too many screws', 'Misaligned screw holes causing stress', 'Not using bearing flats', 'Painting the motor'], correctAnswerIndex: 1, explanation: 'Misalignment can put stress on the motor casing and internal gears. Bearing flats support shafts, not direct motor mounting stress.'},
    { id: 'vcq6', category: 'Competition', difficulty: 'Easy', question: 'In many VEX Robotics Competition games, what is "Autonomous Period"?', options: ['A period where robots are manually controlled', 'A period where robots operate using pre-programmed instructions without driver input', 'The time allocated for building the robot', 'The inspection phase before a match'], correctAnswerIndex: 1, explanation: 'The Autonomous Period is when robots run solely on code written beforehand.'},
    { id: 'vcq7', category: 'Hardware', difficulty: 'Hard', question: 'What is the primary advantage of using "Omni-Directional" wheels?', options: ['Higher torque', 'Ability to move in any direction without turning the robot\'s body', 'Better traction on rough surfaces', 'Lighter weight than regular wheels'], correctAnswerIndex: 1, explanation: 'Omni-directional wheels allow for holonomic movement, meaning translation in any direction (strafe).'},
    { id: 'vcq8', category: 'Programming', difficulty: 'Hard', question: 'In C++, what is `::` typically used for?', options: ['Declaring a pointer', 'The scope resolution operator', 'Logical AND operator', 'Bitwise XOR operator'], correctAnswerIndex: 1, explanation: 'The `::` symbol is the scope resolution operator, used to access static members, enums, or members of a namespace or class.'},
    { id: 'vcq9', category: 'CAD', difficulty: 'Medium', question: 'In CAD, what is an "extrusion"?', options: ['A type of file format', 'A process of creating a 3D shape by extending a 2D profile along a path', 'A simulation of robot movement', 'A tool for measuring distances'], correctAnswerIndex: 1, explanation: 'Extrusion is a fundamental CAD operation to create 3D geometry from 2D sketches.'},
    { id: 'vcq10', category: 'Hardware', difficulty: 'Medium', question: 'Why are bearings important for rotating shafts in VEX?', options: ['They add weight to the robot', 'They reduce friction and support the shaft', 'They help motors run cooler', 'They are only for decoration'], correctAnswerIndex: 1, explanation: 'Bearings reduce friction, prevent shafts from wobbling, and allow for smoother rotation.'},
    { id: 'vcq11', category: 'Electronics', difficulty: 'Medium', question: 'What is the main purpose of an ESD Protection Board in a VEX V5 system?', options: ['To increase motor power', 'To protect electronics from electrostatic discharge', 'To charge the robot battery faster', 'To provide extra USB ports'], correctAnswerIndex: 1, explanation: 'The ESD (Electrostatic Discharge) Protection Board helps safeguard sensitive electronic components from static electricity damage.' },
    { id: 'vcq12', category: 'Sensors', difficulty: 'Medium', question: 'Which VEX sensor is typically used to detect lines for autonomous navigation?', options: ['Distance Sensor', 'Line Tracker / Optical Sensor', 'Bumper Switch', 'GPS Sensor'], correctAnswerIndex: 1, explanation: 'Line Trackers (an ADI sensor) or the Optical Sensor (Smart Port) are used to detect contrasting lines on the field.' },
  ], []);

  const fetchUserProfile = useCallback(async (firebaseUserId) => {
    if (!db) {
      return null;
    }
    try {
      const userDocRef = doc(db, "users", firebaseUserId);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        return { id: userSnap.id, ...userSnap.data() };
      }
      return null;
    } catch (error) {
      return null;
    }
  }, []);

  const fetchUserProgress = useCallback(async (firebaseUserId) => {
    if (!db) {
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
    } catch (error) {
    }
  }, []);

  const fetchUserTeam = useCallback(async (teamId, currentUserIdToUpdate) => {
    if (!teamId) { setUserTeam(null); return null; }
    if (!db) { return null; }

    try {
      const teamDocRef = doc(db, "teams", teamId);
      const teamSnap = await getDoc(teamDocRef);
      if (teamSnap.exists()) {
        const teamData = { id: teamSnap.id, ...teamSnap.data() };
        if (!Array.isArray(teamData.memberIds)) {
            teamData.memberIds = [];
        }
        setUserTeam(teamData);
        return teamData;
      } else {
        setUserTeam(null);
        if (currentUserIdToUpdate) {
          const userRef = doc(db, "users", currentUserIdToUpdate);
          await updateDoc(userRef, { teamId: null });
          setUser(prevUser => {
            if (prevUser && prevUser.id === currentUserIdToUpdate) {
              return { ...prevUser, teamId: null };
            }
            return prevUser;
          });
        }
        return null;
      }
    } catch (error) {
      setUserTeam(null);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      setMessage("Critical Firebase Error: Auth service not loaded. Please check console and Firebase.js configuration.");
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseAuthUser) => {
      try {
        if (firebaseAuthUser) {
          setMessage("Firebase authenticated. Loading your Vexcel profile...");

          let userProfile = await fetchUserProfile(firebaseAuthUser.uid);

          if (!userProfile) {
            setMessage("Welcome! Creating your Vexcel profile...");
            const newUserProfileData = {
              id: firebaseAuthUser.uid,
              name: firebaseAuthUser.displayName || `User${firebaseAuthUser.uid.substring(0,5)}`,
              email: firebaseAuthUser.email || `${firebaseAuthUser.uid.substring(0,5)}@example.com`,
              avatar: firebaseAuthUser.photoURL || `https://source.boringavatars.com/beam/120/${firebaseAuthUser.email || firebaseAuthUser.uid}?colors=264653,2a9d8f,e9c46a,f4a261,e76f51`,
              xp: 0, level: 1, streak: 1, teamId: null,
              createdAt: serverTimestamp(), lastLogin: serverTimestamp(),
            };
            if (!db) {
              throw new Error("Firestore not available for profile creation. Check Firebase.js and initialization logs.");
            }
            await setDoc(doc(db, "users", firebaseAuthUser.uid), newUserProfileData);
            userProfile = newUserProfileData;
          } else {
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
                if (!db) {
                  throw new Error("Firestore not available for profile update. Check Firebase.js and initialization logs.");
                }
                await updateDoc(doc(db, "users", firebaseAuthUser.uid), profileUpdates);
            }
            userProfile = { ...userProfile, ...profileUpdates }; 
          }

          setUser(userProfile);
          await fetchUserProgress(firebaseAuthUser.uid);

          if (userProfile.teamId) {
            const fetchedTeam = await fetchUserTeam(userProfile.teamId, userProfile.id);
            if (!fetchedTeam) { 
                setUser(prev => ({...prev, teamId: null}));
            }
          } else {
            setUserTeam(null);
          }

          setCurrentView('dashboard');
          setMessage('');

        } else {
          setUser(null); setUserTeam(null); setUserProgress({});
          setCurrentView('login');
          setSelectedModule(null); setCurrentLesson(null);
          setMessage('');
        }
      } catch (error) {
        setUser(null);
        setUserTeam(null);
        setUserProgress({});
        setCurrentView('login');
        setMessage(`Error setting up your session: ${error.message}. Please check the console and Firebase project setup (Firestore enabled & correct rules).`);
        setActionLoading(false);
      } finally {
        setLoading(false);
      }
    });

    return () => {
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
      handleChallengeAnswer(null); 
    }
    return () => clearInterval(interval);
  }, [challengeState, challengeTimer, showChallengeAnswer, handleChallengeAnswer]);


  const handleLoginSuccess = async (credentialResponse) => {
    if (!auth) {
        setMessage("Critical Firebase Error: Auth service not loaded. Cannot process login.");
        setActionLoading(false);
        return;
    }
    setMessage('Successfully authenticated with Google. Signing into Vexcel...');
    setActionLoading(true);
    try {
      const idToken = credentialResponse.credential;
      const credential = FirebaseGoogleAuthProvider.credential(idToken);
      const firebaseAuthResult = await signInWithCredential(auth, credential);
    } catch (error) {
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
    setMessage('Google login failed. Please ensure pop-ups are enabled and try again.');
    setActionLoading(false);
  };

  const handleLogout = async () => {
    if (!auth) {
        setMessage("Critical Firebase Error: Auth service not loaded. Cannot process logout.");
        setUser(null); setUserTeam(null); setUserProgress({}); setCurrentView('login');
        return;
    }
    setActionLoading(true);
    try {
      await firebaseSignOut(auth);
      googleLogout(); 
    } catch (error) {
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
            .catch(err => {});
      } else if (!db) { 
      }
    }
  }, [user]);


  const handleCompleteItem = async (moduleId, lessonId, itemType, score = null, xpEarned = 0) => {
    if (!user || !user.id) {setMessage("Error: User not identified."); return;}
    if (!db) {setMessage("Error: Database service unavailable."); return;}

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
        setMessage("Failed to delete team. " + error.message);
    } finally {
      setActionLoading(false);
    }
  };


  const fetchAllTeamsForBrowse = useCallback(async () => {
    if (!db) {
        setMessage("Database error. Cannot fetch teams.");
        return;
    }
    if (user && (currentView === 'browseTeams' || currentView === 'leaderboard' || allTeams.length === 0)) {
      setActionLoading(true);
      try {
        const teamsColRef = collection(db, "teams");
        let q;
        if (currentView === 'leaderboard') {
          q = query(teamsColRef, orderBy("totalXP", "desc"), limit(50));
        } else {
          q = query(teamsColRef, orderBy("createdAt", "desc"), limit(100)); 
        }

        const querySnapshot = await getDocs(q);

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
      } catch (error) {
        setMessage(`Could not load teams for ${currentView}: ${error.message}. Check console for Firestore errors (e.g. missing index).`);
      } finally {
        setActionLoading(false);
      }
    } else {
    }
  }, [currentView, user, allTeams.length]); 

  useEffect(() => {
    if (user) {
        fetchAllTeamsForBrowse();
    }
  }, [user, fetchAllTeamsForBrowse]); 


  const startVexpertChallenge = () => {
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
            theme={theme}
            toggleTheme={toggleTheme}
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

      <style jsx global>{`
        
      `}</style>
    </>
  );
};

export default App;