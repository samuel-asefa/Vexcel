// src/App.js
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { GoogleOAuthProvider, GoogleLogin, googleLogout } from '@react-oauth/google';
import { Play, Users, Trophy, BookOpen, Code, Zap, Target, Award, ChevronRight, X, Check, RotateCcw, Home, LogOut, Search, Eye, MessageSquare, Brain, Settings2, Puzzle, HelpCircle, Clock, BarChart2 } from 'lucide-react';

// Firebase imports
import { auth, db } from './Firebase'; // Assuming Firebase.js is in src folder and exports auth, db
import { GoogleAuthProvider as FirebaseGoogleAuthProvider, signInWithCredential, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import {
  doc, getDoc, setDoc, updateDoc, writeBatch,
  collection, query, where, getDocs, addDoc, serverTimestamp,
  increment, arrayUnion, arrayRemove, orderBy, limit
} from 'firebase/firestore';

// Console logs to check imported Firebase services
console.log("[App.js] Value of 'auth' imported from ./Firebase.js:", auth);
console.log("[App.js] Value of 'db' imported from ./Firebase.js:", db);

const App = () => {
  const [user, setUser] = useState(null); // Will store Firestore profile
  const [loading, setLoading] = useState(true); // For initial app load
  const authStateResolvedRef = useRef(false); // Ref to track if auth state has been resolved
  const [actionLoading, setActionLoading] = useState(false); // For specific actions
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
  const [challengeTimer, setChallengeTimer] = useState(20);

  const CHALLENGE_MAX_XP = 100;
  const QUESTIONS_PER_CHALLENGE = 5;
  const QUESTION_TIMER_DURATION = 20;

  const [numChallengeQuestionsInput, setNumChallengeQuestionsInput] = useState(QUESTIONS_PER_CHALLENGE);
  const [availableChallengeCategories, setAvailableChallengeCategories] = useState([]);
  const [selectedChallengeCategories, setSelectedChallengeCategories] = useState([]);

  // Ensure this GOOGLE_CLIENT_ID matches the one configured in Firebase Auth > Google Sign In for your Web SDK
  const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '664588170188-e2mvb0g24k22ghdfv6534kp3808rk70q.apps.googleusercontent.com';
  const XP_PER_LEVEL = 500;

  // Learning content
  const learningModules = useMemo(() => [
    {
      id: 'intro-vex',
      category: 'Hardware',
      title: 'Introduction to VEX V5',
      description: 'Master the fundamentals of the VEX V5 robotics system, from brain to sensors.',
      duration: 'Approx. 30 min',
      lessons: 3,
      difficulty: 'Beginner',
      color: 'blue',
      icon: Brain,
      content: {
        lessons: [
          { id: 'vex-brain-overview', title: 'VEX V5 Brain Deep Dive', type: 'lesson', xp: 20,
            contentDetail: "<h1>Understanding the VEX V5 Brain</h1><p>The VEX V5 Brain is the central processing unit (CPU) of your robot. It's more than just a controller; it's the robot's mind. It houses the main processor, memory, and a versatile array of ports for connecting motors, sensors, and the V5 Controller.</p><img src=\"https://placehold.co/600x350/EBF4FF/7F9CF5?text=VEX+V5+Brain+Diagram\" alt=\"VEX V5 Brain Diagram\" style=\"width:100%;max-width:450px;border-radius:8px;margin:1.5rem auto;display:block;border:1px solid #ccc;\"><h3>Key Features:</h3><ul><li><strong>Touchscreen LCD:</strong> A vibrant, responsive interface for program selection, live diagnostics, and direct feedback without needing a computer.</li><li><strong>Smart Ports (21):</strong> These auto-detect connected V5 Smart Devices (motors, sensors), simplifying wiring and programming.</li><li><strong>Wireless Communication:</strong> Supports VEXnet 3.0 for competition and controller linking, and Bluetooth for wireless programming and data transfer.</li><li><strong>Processor:</strong> Dual Core ARM Cortex A9 processor ensures rapid computation for complex tasks.</li><li><strong>MicroSD Card Slot:</strong> Allows for expanded program storage, data logging for performance analysis, and firmware updates.</li></ul><p>Proper handling, understanding its capabilities, and knowing how to troubleshoot the Brain are foundational skills for any VEX robotics participant. Keep it updated with the latest firmware for optimal performance and features!</p>" },
          { id: 'motors-sensors', title: 'V5 Motors & Essential Sensors', type: 'lesson', xp: 25,
            contentDetail: "<h1>VEX V5 Motors and Sensors</h1><p>Motors provide the brawn for movement, while sensors give your robot the crucial awareness of its environment, enabling autonomous behavior and precise control.</p><img src=\"https://placehold.co/600x350/E6FFFA/38B2AC?text=V5+Smart+Motor+%26+Sensors\" alt=\"VEX V5 Smart Motor and Sensors\" style=\"width:100%;max-width:450px;border-radius:8px;margin:1.5rem auto;display:block;border:1px solid #ccc;\"><h3>V5 Smart Motor:</h3><ul><li><strong>Integrated Encoder:</strong> Provides precise feedback on position, velocity, and torque, enabling closed-loop control.</li><li><strong>Internal PID Control:</strong> Allows for accurate and stable movement without complex user programming for basic tasks.</li><li><strong>Monitoring:</strong> Tracks temperature, current, and voltage to prevent damage and provide diagnostic data.</li><li><strong>Gear Cartridges:</strong> Easily swappable gear ratios (Red for 100 RPM/High Torque, Green for 200 RPM/Standard, Blue for 600 RPM/High Speed) to tailor performance.</li></ul><h3>Common VEX V5 Sensors:</h3><ul><li><strong>Distance Sensor:</strong> Uses ultrasonic sound waves or laser to measure distance to objects, crucial for navigation and object avoidance.</li><li><strong>Optical Sensor:</strong> Detects colors, ambient light levels, and proximity of objects. Useful for line following or detecting game elements.</li><li><strong>Inertial Sensor (IMU):</strong> Measures orientation (roll, pitch, yaw), acceleration, and gyroscopic data. Essential for robot balancing, accurate turns, and field navigation.</li><li><strong>Vision Sensor:</strong> A powerful sensor that can detect and track up to 7 different colored objects, enabling advanced autonomous tasks like aiming or identifying specific game pieces.</li><li><strong>Rotation Sensor:</strong> Measures the amount of rotation of an axle, useful for tracking wheel travel or arm position.</li></ul><p>Effectively integrating and programming these motors and sensors is what elevates a simple chassis to a competitive robot.</p>" },
          { id: 'intro-knowledge-check', title: 'V5 Fundamentals Quiz', type: 'quiz', xp: 35 },
        ]
      }
    },
    {
      id: 'building-basics',
      category: 'Hardware',
      title: 'VEX Building Fundamentals',
      description: 'Learn structural design, mechanical principles, and robust robot construction techniques.',
      duration: 'Approx. 60 min',
      lessons: 4,
      difficulty: 'Beginner',
      color: 'green',
      icon: Settings2,
      content: {
        lessons: [
          { id: 'structural-integrity', title: 'Structural Integrity & Design', type: 'lesson', xp: 20, contentDetail: "<h1>Structural Integrity in Robotics</h1><p>A robot's performance is heavily reliant on its structural integrity. A well-built robot is robust, reliable, and can withstand the rigors of competition.</p><img src=\"https://placehold.co/600x350/F0FFF4/7CB342?text=Robot+Structure+Example\" alt=\"Robot Structure Example\" style=\"width:100%;max-width:450px;border-radius:8px;margin:1.5rem auto;display:block;border:1px solid #ccc;\"><h3>Key Principles:</h3><ul><li><strong>Triangulation:</strong> Using triangular supports (e.g., C-channels forming triangles) significantly increases rigidity and prevents flexing.</li><li><strong>Boxed Structures:</strong> Creating closed box sections (e.g., using two C-channels face-to-face or back-to-back with standoffs) provides strength in multiple directions.</li><li><strong>Bearing Supports:</strong> All rotating shafts MUST be supported by bearings on at least two points, ideally on opposite sides of any load, to reduce friction and prevent shaft bending.</li><li><strong>Secure Connections:</strong> Use appropriate screws (Keps nuts, Nylock nuts) and ensure they are tightened correctly. Avoid over-tightening, which can strip threads.</li><li><strong>Weight Distribution:</strong> Consider the center of gravity. A lower, more central CoG generally leads to a more stable robot.</li></ul><p>Think about how forces will act on your robot during operation. Reinforce areas that will experience high stress, such as arm joints or drivetrain mounts.</p>" },
          { id: 'gear-ratios', title: 'Gear Ratios & Mechanical Advantage', type: 'lesson', xp: 25, contentDetail: "<h1>Understanding Gear Ratios</h1><p>Gear ratios are fundamental to robotics, allowing you to trade speed for torque (rotational force) or vice-versa.</p><h3>Calculating Gear Ratios:</h3><p>Ratio = (Number of teeth on Driven Gear) / (Number of teeth on Driving Gear)</p><ul><li><strong>Torque Increase (Speed Decrease):</strong> Driving a larger gear with a smaller gear (e.g., 12-tooth driving a 60-tooth). Ratio = 60/12 = 5:1. Torque is multiplied by 5, speed is divided by 5.</li><li><strong>Speed Increase (Torque Decrease):</strong> Driving a smaller gear with a larger gear (e.g., 60-tooth driving a 12-tooth). Ratio = 12/60 = 1:5. Speed is multiplied by 5, torque is divided by 5.</li><li><strong>Idler Gears:</strong> Gears placed between the driving and driven gear change the direction of rotation but do NOT affect the overall gear ratio.</li></ul><h3>Compound Gear Ratios:</h3><p>When multiple gear stages are used, the total gear ratio is the product of individual stage ratios. Example: Stage 1 (5:1) driving Stage 2 (3:1) results in a total ratio of 15:1.</p><p>Choosing the right gear ratio is critical for mechanisms like lifts, intakes, and drivetrains to achieve desired performance.</p>" },
          { id: 'building-quiz', title: 'Building Principles Quiz', type: 'quiz', xp: 35 },
          { id: 'design-challenge-game', title: 'Mini Design Challenge', type: 'game', xp: 40 }
        ]
      }
    },
    {
      id: 'intro-vexcode-python',
      category: 'Software',
      title: 'Python with VEX V5',
      description: 'Learn the basics of programming your VEX V5 robot using Python.',
      duration: 'Approx. 45 min',
      lessons: 2,
      difficulty: 'Beginner',
      color: 'purple',
      icon: Code,
      content: {
        lessons: [
          { id: 'python-basics', title: 'Python Fundamentals for Robotics', type: 'lesson', xp: 25, contentDetail: "<h1>Python for VEX V5</h1><p>Content on Python syntax, VEX API, and basic motor/sensor control with Python.</p><img src='https://placehold.co/600x350/EDE9FE/8B5CF6?text=VEX+Python+Code' alt='VEX Python Code' style='width:100%;max-width:450px;border-radius:8px;margin:1.5rem auto;display:block;border:1px solid #ccc;'>" },
          { id: 'python-sensor-quiz', title: 'Python Sensor Quiz', type: 'quiz', xp: 30 },
        ]
      }
    },
    {
      id: 'autonomous-programming',
      category: 'Software',
      title: 'Autonomous Programming Logic',
      description: 'Understand how to use sensors and control structures for autonomous robot behavior.',
      duration: 'Approx. 75 min',
      lessons: 3,
      difficulty: 'Intermediate',
      color: 'orange',
      icon: Zap,
      content: {
        lessons: [
            { id: 'control-flow', title: 'Control Flow (Loops & Conditionals)', type: 'lesson', xp: 30, contentDetail: "<h1>Autonomous Control Flow</h1><p>Detailed explanation of if/else, while loops, for loops in context of robot actions.</p>" },
            { id: 'sensor-integration', title: 'Integrating Sensor Feedback', type: 'lesson', xp: 35, contentDetail: "<h1>Using Sensors in Autonomous</h1><p>Examples of using distance, optical, inertial sensors to make decisions.</p>" },
            { id: 'auton-challenge', title: 'Mini Autonomous Challenge', type: 'game', xp: 40 }
        ]
      }
    },
    {
      id: 'intro-cad-vex',
      category: 'CAD',
      title: 'Introduction to CAD for VEX',
      description: 'Explore the basics of Computer-Aided Design for planning and visualizing your VEX robot.',
      duration: 'Approx. 60 min',
      lessons: 2,
      difficulty: 'Beginner',
      color: 'red',
      icon: Target,
      content: {
        lessons: [
          { id: 'cad-basics', title: 'CAD Software Overview & Basic Sketching', type: 'lesson', xp: 30, contentDetail: "<h1>Why CAD?</h1><p>Introduction to common CAD software (Onshape, Fusion 360) and fundamental 2D sketching and 3D modeling concepts relevant to VEX parts.</p><img src='https://placehold.co/600x350/FEE2E2/EF4444?text=VEX+Robot+CAD+Model' alt='VEX Robot CAD Model' style='width:100%;max-width:450px;border-radius:8px;margin:1.5rem auto;display:block;border:1px solid #ccc;'>" },
          { id: 'cad-assembly-quiz', title: 'Basic Assembly Concepts Quiz', type: 'quiz', xp: 35 },
        ]
      }
    },
  ], []);
  const sampleQuizzes = useMemo(() => ({
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
    'python-sensor-quiz': {
      title: 'Python Sensor Quiz',
      questions: [
        { id: 1, question: 'In VEXcode V5 Python, how do you get the distance value from a Distance Sensor named `distance_sensor`?', options: ['distance_sensor.value()', 'distance_sensor.distance(MM)', 'distance_sensor.get_distance()', 'distance_sensor.read()'], correct: 1, explanation: 'Typically, methods like `object.distance(UNITS)` are used.' },
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
    { id: 'vcq3', category: 'Software', difficulty: 'Easy', question: 'In VEXcode V5 Blocks, what color are "Motion" blocks usually?', options: ['Green', 'Blue', 'Yellow', 'Red'], correctAnswerIndex: 1, explanation: 'Motion blocks, like those for driving or spinning motors, are typically blue in VEXcode V5 Blocks.' },
    { id: 'vcq4', category: 'Software', difficulty: 'Medium', question: 'What does "PID" stand for in the context of robot motor control?', options: ['Positive Input Drive', 'Proportional Integral Derivative', 'Program Instruction Data', 'Power Intensity Diagram'], correctAnswerIndex: 1, explanation: 'PID is a control loop mechanism meaning Proportional, Integral, Derivative, used for precise motor control.' },
    { id: 'vcq5', category: 'Building', difficulty: 'Medium', question: 'When attaching a V5 Smart Motor to a C-channel, what is a common cause of motor strain or damage?', options: ['Using too many screws', 'Misaligned screw holes causing stress', 'Not using bearing flats', 'Painting the motor'], correctAnswerIndex: 1, explanation: 'Misalignment can put stress on the motor casing and internal gears. Bearing flats support shafts, not direct motor mounting stress.'},
    { id: 'vcq6', category: 'Game Strategy', difficulty: 'Easy', question: 'In many VEX Robotics Competition games, what is "Autonomous Period"?', options: ['A period where robots are manually controlled', 'A period where robots operate using pre-programmed instructions without driver input', 'The time allocated for building the robot', 'The inspection phase before a match'], correctAnswerIndex: 1, explanation: 'The Autonomous Period is when robots run solely on code written beforehand.'},
    { id: 'vcq7', category: 'Hardware', difficulty: 'Hard', question: 'What is the primary advantage of using "Omni-Directional" wheels?', options: ['Higher torque', 'Ability to move in any direction without turning the robot\'s body', 'Better traction on rough surfaces', 'Lighter weight than regular wheels'], correctAnswerIndex: 1, explanation: 'Omni-directional wheels allow for holonomic movement, meaning translation in any direction (strafe).'},
    { id: 'vcq8', category: 'Software', difficulty: 'Hard', question: 'What is a "function" in programming used for?', options: ['Storing a single variable', 'Repeating a block of code indefinitely', 'Grouping a set of instructions to perform a specific task, which can be reused', 'Defining the robot\'s physical dimensions'], correctAnswerIndex: 2, explanation: 'Functions help organize code into reusable blocks for specific tasks.'},
    { id: 'vcq9', category: 'CAD', difficulty: 'Medium', question: 'In CAD, what is an "extrusion"?', options: ['A type of file format', 'A process of creating a 3D shape by extending a 2D profile along a path', 'A simulation of robot movement', 'A tool for measuring distances'], correctAnswerIndex: 1, explanation: 'Extrusion is a fundamental CAD operation to create 3D geometry from 2D sketches.'},
    { id: 'vcq10', category: 'Building', difficulty: 'Medium', question: 'Why are bearings important for rotating shafts in VEX?', options: ['They add weight to the robot', 'They reduce friction and support the shaft', 'They help motors run cooler', 'They are only for decoration'], correctAnswerIndex: 1, explanation: 'Bearings reduce friction, prevent shafts from wobbling, and allow for smoother rotation.'}
  ], []);


  // --- Firebase Data Fetching Callbacks ---
  const fetchUserProfile = useCallback(async (firebaseUserId) => {
    console.log("[App.js fetchUserProfile] Attempting for UID:", firebaseUserId);
    if (!db) { console.error("[App.js fetchUserProfile] Firestore 'db' is not available!"); return null; }
    try {
      const userDocRef = doc(db, "users", firebaseUserId);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        console.log("[App.js fetchUserProfile] Profile found for UID:", firebaseUserId, userSnap.data());
        return { id: userSnap.id, ...userSnap.data() };
      }
      console.log("[App.js fetchUserProfile] No profile in Firestore for UID:", firebaseUserId);
      return null;
    } catch (error) {
      console.error("[App.js fetchUserProfile] Error for UID:", firebaseUserId, error);
      return null;
    }
  }, []);

  const fetchUserProgress = useCallback(async (firebaseUserId) => {
    console.log("[App.js fetchUserProgress] Attempting for UID:", firebaseUserId);
    if (!db) { console.error("[App.js fetchUserProgress] Firestore 'db' is not available!"); return; }
    try {
      const progressColRef = collection(db, `users/${firebaseUserId}/progress`);
      const progressSnap = await getDocs(progressColRef);
      const loadedProgress = {};
      progressSnap.forEach((docSnap) => { loadedProgress[docSnap.id] = docSnap.data(); });
      setUserProgress(loadedProgress);
      console.log("[App.js fetchUserProgress] Progress fetched for UID:", firebaseUserId, loadedProgress);
    } catch (error) {
      console.error("[App.js fetchUserProgress] Error for UID:", firebaseUserId, error);
    }
  }, []);

  const fetchUserTeam = useCallback(async (teamId) => {
    console.log("[App.js fetchUserTeam] Attempting for team ID:", teamId);
    if (!teamId) { setUserTeam(null); console.log("[App.js fetchUserTeam] No teamId provided."); return null; }
    if (!db) { console.error("[App.js fetchUserTeam] Firestore 'db' is not available!"); return null; }
    try {
      const teamDocRef = doc(db, "teams", teamId);
      const teamSnap = await getDoc(teamDocRef);
      if (teamSnap.exists()) {
        const teamData = { id: teamSnap.id, ...teamSnap.data() };
        setUserTeam(teamData);
        console.log("[App.js fetchUserTeam] Team data fetched:", teamData);
        return teamData;
      } else {
        setUserTeam(null);
        console.warn("[App.js fetchUserTeam] Team document not found for ID:", teamId);
        if (user && user.id) { // Check if user exists before trying to access user.id
          console.log("[App.js fetchUserTeam] Clearing dangling teamId from user profile:", user.id);
          const userRef = doc(db, "users", user.id);
          await updateDoc(userRef, { teamId: null });
        }
        return null;
      }
    } catch (error) {
      console.error("[App.js fetchUserTeam] Error for team ID:", teamId, error);
      setUserTeam(null);
      return null;
    }
  }, [user]); // user is a dependency here


  // --- Auth State Listener ---
  useEffect(() => {
    console.log("App.js: Auth listener useEffect mounting/re-running.");
    authStateResolvedRef.current = false; 

    const timeoutDuration = 20000; // 20 seconds
    const timeoutId = setTimeout(() => {
        if (!authStateResolvedRef.current) { 
            console.error(`App.js: Firebase auth state check timed out after ${timeoutDuration/1000} seconds.`);
            setLoading(false);
            setMessage(
                "CRITICAL: Vexcel platform is taking too long to initialize. This might be due to network issues or Firebase configuration problems. " +
                "Please VERY CAREFULLY check your browser's developer console (F12 key) for any error messages, " +
                "especially related to Firebase. Then, meticulously verify your Firebase setup in Firebase.js " +
                "against your Firebase project console, and ensure Authentication service (with Google provider) is enabled."
            );
            setCurrentView('login'); 
            setUser(null); 
        }
    }, timeoutDuration);

    if (!auth) {
        console.error("App.js: Firebase 'auth' service is not initialized (imported as null). App cannot function.");
        authStateResolvedRef.current = true; 
        clearTimeout(timeoutId);
        setLoading(false);
        setMessage("CRITICAL: Firebase Authentication module not loaded. Check Firebase.js initialization and console for errors.");
        setCurrentView('login');
        return;
    }

    console.log("[App.js] Firebase 'auth' service IS available. Setting up onAuthStateChanged listener.");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseAuthUser) => {
        console.log("[App.js] onAuthStateChanged FIRED. User UID:", firebaseAuthUser ? firebaseAuthUser.uid : 'null');
        authStateResolvedRef.current = true;
        clearTimeout(timeoutId);

        try {
            if (firebaseAuthUser) {
                console.log("App.js: User IS signed in (firebaseAuthUser exists). UID:", firebaseAuthUser.uid);
                setActionLoading(true);
                let userProfile = await fetchUserProfile(firebaseAuthUser.uid);

                if (!userProfile) {
                    console.log("App.js: No Firestore profile for UID:", firebaseAuthUser.uid, ". Creating new one.");
                    const newUserProfileData = {
                        id: firebaseAuthUser.uid, name: firebaseAuthUser.displayName || `User${Math.floor(Math.random() * 10000)}`,
                        email: firebaseAuthUser.email,
                        avatar: firebaseAuthUser.photoURL || `https://source.boringavatars.com/beam/120/${firebaseAuthUser.email || firebaseAuthUser.uid}?colors=264653,2a9d8f,e9c46a,f4a261,e76f51`,
                        xp: 0, level: 1, streak: 0, teamId: null,
                        createdAt: serverTimestamp(), lastLogin: serverTimestamp(),
                    };
                    if (!db) { console.error("App.js: Firestore 'db' is null while trying to create profile!"); throw new Error("Firestore not available for profile creation."); }
                    await setDoc(doc(db, "users", firebaseAuthUser.uid), newUserProfileData);
                    userProfile = newUserProfileData;
                    console.log("App.js: New Firestore profile CREATED for UID:", firebaseAuthUser.uid);
                } else {
                    console.log("App.js: Existing Firestore profile FOUND for UID:", firebaseAuthUser.uid, ". Updating lastLogin etc.");
                    const profileUpdates = { lastLogin: serverTimestamp() };
                    if (firebaseAuthUser.displayName && firebaseAuthUser.displayName !== userProfile.name) profileUpdates.name = firebaseAuthUser.displayName;
                    if (firebaseAuthUser.photoURL && firebaseAuthUser.photoURL !== userProfile.avatar) profileUpdates.avatar = firebaseAuthUser.photoURL;
                    if (Object.keys(profileUpdates).length > 0) {
                        if (!db) { console.error("App.js: Firestore 'db' is null while trying to update profile!"); throw new Error("Firestore not available for profile update."); }
                        await updateDoc(doc(db, "users", firebaseAuthUser.uid), profileUpdates);
                        userProfile = { ...userProfile, ...profileUpdates };
                        console.log("App.js: Firestore profile UPDATED for UID:", firebaseAuthUser.uid);
                    }
                }
                
                setUser(userProfile);
                await fetchUserProgress(firebaseAuthUser.uid);
                if (userProfile && userProfile.teamId) {
                    await fetchUserTeam(userProfile.teamId);
                } else {
                    setUserTeam(null);
                }
                setCurrentView('dashboard');
            } else {
                console.log("App.js: User IS NOT signed in (firebaseAuthUser is null). Resetting state.");
                setUser(null);
                setUserTeam(null);
                setUserProgress({});
                setCurrentView('login');
                setSelectedModule(null);
                setCurrentLesson(null);
            }
        } catch (error) {
            console.error("App.js: CRITICAL ERROR in onAuthStateChanged's async block:", error);
            setUser(null); setUserTeam(null); setUserProgress({}); setCurrentView('login');
            setMessage(`Error during authentication processing: ${error.message}. Please try again.`);
        } finally {
            console.log("App.js: onAuthStateChanged FINALLY block. Setting loading to false.");
            setLoading(false);
            setActionLoading(false);
        }
    });

    return () => {
        console.log("[App.js] Auth listener CLEANUP.");
        clearTimeout(timeoutId);
        if (unsubscribe) unsubscribe();
    };
  }, [fetchUserProfile, fetchUserProgress, fetchUserTeam]);


  useEffect(() => {
    const categories = [...new Set(vexpertChallengeBank.map(q => q.category))].sort();
    setAvailableChallengeCategories(categories);
    if (categories.length > 0 && selectedChallengeCategories.length === 0) {
        setSelectedChallengeCategories(categories);
    }
  }, [vexpertChallengeBank, selectedChallengeCategories.length]);


  const handleChallengeAnswer = useCallback((selectedIndex) => {
    if (showChallengeAnswer) return;
    setShowChallengeAnswer(true); setChallengeSelectedAnswer(selectedIndex);
    if (selectedIndex === challengeQuestions[currentChallengeQuestionIdx].correctAnswerIndex) {
      setChallengeScore(s => s + 1);
    }
  }, [challengeQuestions, currentChallengeQuestionIdx, showChallengeAnswer]); // Added dependencies

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
  }, [challengeState, challengeTimer, showChallengeAnswer, handleChallengeAnswer]); // Added handleChallengeAnswer


  const handleLoginSuccess = async (credentialResponse) => {
    console.log("App.js: Google Login Button Success. Credential Token (start):", credentialResponse.credential ? credentialResponse.credential.substring(0,30)+"..." : "N/A");
    if (!auth) {
        console.error("App.js: FATAL in handleLoginSuccess - Firebase 'auth' service is not available!");
        setMessage("Critical Firebase Error: Auth service not loaded. Cannot process login.");
        setActionLoading(false);
        return;
    }
    setMessage('Processing Firebase sign-in...');
    setActionLoading(true);
    try {
      const idToken = credentialResponse.credential;
      const credential = FirebaseGoogleAuthProvider.credential(idToken);
      console.log("App.js: Attempting Firebase signInWithCredential...");
      const firebaseAuthResult = await signInWithCredential(auth, credential);
      console.log("App.js: Firebase signInWithCredential successful. Firebase User UID:", firebaseAuthResult.user.uid);
      setMessage(`Successfully signed in with Firebase as ${firebaseAuthResult.user.displayName || firebaseAuthResult.user.email}!`);
    } catch (error) {
      console.error("App.js: Error in handleLoginSuccess (Firebase signInWithCredential):", error);
      if (error.code === 'auth/configuration-not-found') {
          setMessage(`Firebase Config Error: ${error.message}. Check Firebase.js & console.`);
      } else if (error.code === 'auth/invalid-credential') {
          setMessage(`Firebase Auth Error: ${error.message}. Client ID mismatch or token issue. Check Firebase & Google Cloud Console OAuth settings.`);
      } else {
          setMessage(`Firebase sign-in error: ${error.message}. Please try again.`);
      }
      googleLogout();
    } finally {
      console.log("App.js: handleLoginSuccess finally block. setActionLoading(false).");
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
        console.error("App.js: FATAL in handleLogout - Firebase 'auth' service not available!");
        setMessage("Critical Firebase Error: Auth service not loaded. Cannot process logout.");
        setUser(null); setUserTeam(null); setUserProgress({}); setCurrentView('login'); 
        return;
    }
    setActionLoading(true);
    try {
      await firebaseSignOut(auth); 
      googleLogout();
      console.log("App.js: Firebase sign out and Google logout successful.");
      setMessage('You have been logged out successfully.');
    } catch (error) {
      console.error("App.js: Error during logout:", error);
      setMessage('Error during logout.');
    } finally {
      setActionLoading(false);
    }
  };

  const navigate = (view, data = null) => {
    console.log(`[App.js navigate] To: ${view}, Data:`, data);
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
        setChallengeState('idle'); setChallengeScore(0); setCurrentChallengeQuestionIdx(0);
        setChallengeSelectedAnswer(null); setShowChallengeAnswer(false);
      }
    }
  };

  useEffect(() => { if (message) { const t = setTimeout(() => setMessage(''), 7000); return () => clearTimeout(t); } }, [message]);

  useEffect(() => {
    if (user && user.xp !== undefined && user.level !== undefined && (Math.floor(user.xp / XP_PER_LEVEL) + 1) > user.level) {
      const newLevel = Math.floor(user.xp/XP_PER_LEVEL)+1;
      console.log(`[App.js LevelUp] User ${user.id} leveled up to ${newLevel}`);
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
  }, [user, XP_PER_LEVEL]); 


  const handleCompleteItem = async (moduleId, lessonId, itemType, score = null, xpEarned = 0) => {
    if (!user || !user.id) {setMessage("Error: User not identified."); return;}
    if (!db) {setMessage("Error: Database service unavailable."); return;}
    console.log(`App.js: handleCompleteItem UID: ${user.id}, modId: ${moduleId}, lesId: ${lessonId}, xp: ${xpEarned}`);
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
      batch.set(progressDocRef, { lessons: updatedLessonData, moduleXp: currentModuleXp + xpEarned, title: learningModules.find(m=>m.id===moduleId)?.title || 'Module'}, { merge: true });
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
      console.error("App.js: Error completing item in Firebase:", error);
      setMessage("Failed to save progress. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinTeam = async (teamCodeToJoinArg = joinTeamCodeInput) => {
    const teamCodeToJoin = typeof teamCodeToJoinArg === 'string' ? teamCodeToJoinArg : joinTeamCodeInput;
    if (!teamCodeToJoin.trim()) { setMessage("Please enter a team code."); return; }
    if (userTeam) { setMessage("You are already in a team."); return; }
    if (!user || !user.id) { setMessage("User not logged in."); return; }
    if (!db) { setMessage("Database service unavailable."); return; }
    setActionLoading(true);
    try {
      const teamsQuery = query(collection(db, "teams"), where("code", "==", teamCodeToJoin.trim()));
      const querySnapshot = await getDocs(teamsQuery);
      if (querySnapshot.empty) { setMessage("Invalid team code or team not found."); setActionLoading(false); return; }
      const teamDocSnap = querySnapshot.docs[0];
      const teamToJoinData = { id: teamDocSnap.id, ...teamDocSnap.data() };
      if (teamToJoinData.memberIds && teamToJoinData.memberIds.includes(user.id)) {
          setMessage(`You are already a member of ${teamToJoinData.name}.`); setUserTeam(teamToJoinData);
          const userRefForConsistency = doc(db, "users", user.id); await updateDoc(userRefForConsistency, { teamId: teamToJoinData.id });
          setActionLoading(false); return;
      }
      const batch = writeBatch(db);
      const teamRef = doc(db, "teams", teamToJoinData.id);
      batch.update(teamRef, { memberIds: arrayUnion(user.id) });
      const userRef = doc(db, "users", user.id);
      batch.update(userRef, { teamId: teamToJoinData.id });
      await batch.commit();
      const updatedTeamSnap = await getDoc(teamRef);
      const finalTeamData = {id: updatedTeamSnap.id, ...updatedTeamSnap.data()};
      setUserTeam(finalTeamData);
      setAllTeams(prevTeams => prevTeams.map(t => t.id === finalTeamData.id ? finalTeamData : t));
      setMessage(`Successfully joined team: ${finalTeamData.name}!`); setJoinTeamCodeInput('');
    } catch (error) { console.error("App.js: Error joining team:", error); setMessage("Failed to join team."); }
    finally { setActionLoading(false); }
  };

  const handleCreateTeam = async () => {
    if (!createTeamNameInput.trim()) { setMessage("Please enter a team name."); return; }
    if (userTeam) { setMessage("You are already in a team."); return; }
    if (!user || !user.id) { setMessage("User not logged in."); return; }
    if (!db) {setMessage("Database service unavailable."); return;}
    setActionLoading(true);
    try {
      const newTeamCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const newTeamData = {
        name: createTeamNameInput.trim(), code: newTeamCode,
        description: `A brand new Vexcel team led by ${user.name}!`,
        totalXP: user.xp || 0, memberIds: [user.id], creatorId: user.id,
        createdAt: serverTimestamp(),
      };
      const teamColRef = collection(db, "teams");
      const teamDocRef = await addDoc(teamColRef, newTeamData);
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, { teamId: teamDocRef.id });
      const createdTeamForState = { id: teamDocRef.id, ...newTeamData };
      setUserTeam(createdTeamForState);
      setAllTeams(prev => [...prev, createdTeamForState]);
      setMessage(`Team "${createdTeamForState.name}" created! Code: ${newTeamCode}`); setCreateTeamNameInput('');
    } catch (error) { console.error("App.js: Error creating team:", error); setMessage("Failed to create team."); }
    finally { setActionLoading(false); }
  };

  const handleLeaveTeam = async () => {
    if (!userTeam || !userTeam.id || !user || !user.id) return;
    if (!db) {setMessage("Database service unavailable."); return;}
    setActionLoading(true);
    try {
      const teamName = userTeam.name;
      const teamIdToRemove = userTeam.id;
      const batch = writeBatch(db);
      const teamRef = doc(db, "teams", teamIdToRemove);
      batch.update(teamRef, { memberIds: arrayRemove(user.id) });
      const userRef = doc(db, "users", user.id);
      batch.update(userRef, { teamId: null });
      await batch.commit();
      setUserTeam(null);
      setAllTeams(prevTeams => prevTeams.map(t => (t.id === teamIdToRemove ? { ...t, memberIds: t.memberIds?.filter(id => id !== user.id) } : t)));
      setMessage(`You have left team: ${teamName}.`);
    } catch (error) { console.error("App.js: Error leaving team:", error); setMessage("Failed to leave team."); }
    finally { setActionLoading(false); }
  };

  const fetchAllTeamsForBrowse = useCallback(async () => {
    if (!db) { console.error("App.js: fetchAllTeamsForBrowse - DB not available."); return; }
    if (currentView === 'browseTeams' || currentView === 'leaderboard') {
      setActionLoading(true);
      try {
        const teamsColRef = collection(db, "teams");
        let q = teamsColRef;
        if (currentView === 'leaderboard') q = query(teamsColRef, orderBy("totalXP", "desc"), limit(50));
        const querySnapshot = await getDocs(q);
        const loadedTeams = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data()}));
        setAllTeams(loadedTeams);
      } catch (error) { console.error("App.js: Error fetching teams:", error); setMessage("Could not load teams."); }
      finally { setActionLoading(false); }
    }
  }, [currentView]);

  useEffect(() => {
    fetchAllTeamsForBrowse();
  }, [fetchAllTeamsForBrowse]);


  const startVexpertChallenge = () => {
    setActionLoading(true);
    if (selectedChallengeCategories.length === 0) {setMessage("Please select at least one category."); setActionLoading(false); return;}
    const filtered = vexpertChallengeBank.filter(q => selectedChallengeCategories.includes(q.category));
    if (filtered.length === 0) {setMessage("No questions for selected categories."); setActionLoading(false); return;}
    let count = numChallengeQuestionsInput;
    if (count > filtered.length) { setMessage(`Only ${filtered.length} questions available for selected categories. Reducing count.`); count = filtered.length;}
    if (count <= 0) {setMessage("Cannot start with 0 questions."); setActionLoading(false); return;}
    
    const shuffled = [...filtered].sort(() => 0.5 - Math.random());
    setChallengeQuestions(shuffled.slice(0, count));
    setCurrentChallengeQuestionIdx(0); setChallengeScore(0); setChallengeSelectedAnswer(null); setShowChallengeAnswer(false);
    setChallengeTimer(QUESTION_TIMER_DURATION); setChallengeState('active'); setActionLoading(false);
    setMessage(`Challenge started with ${count} questions!`);
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
          if (userTeam && userTeam.id) batch.update(doc(db, "teams", userTeam.id), { totalXP: increment(xp) });
          await batch.commit();
          setUser(prev => ({ ...prev, xp: (prev.xp || 0) + xp }));
          if (userTeam) {
            const newTeamXp = (userTeam.totalXP || 0) + xp;
            setUserTeam(prev => ({ ...prev, totalXP: newTeamXp }));
            setAllTeams(prevs => prevs.map(t => t.id === userTeam.id ? { ...t, totalXP: newTeamXp } : t));
          }
          setMessage(`Challenge finished! Score: ${challengeScore}/${challengeQuestions.length}. +${xp} XP!`);
        } catch (e) { console.error("App.js: Error saving challenge XP:", e); setMessage("Error saving XP."); }
        finally { setActionLoading(false); }
      } else if (xp === 0 && challengeQuestions.length > 0) {
        setMessage(`Challenge finished! Score: ${challengeScore}/${challengeQuestions.length}.`);
      } else if(!db && xp > 0) {
        setMessage("DB error. Challenge XP not saved.");
      } else if (challengeQuestions.length === 0) {
         setMessage("Challenge ended, but no questions were loaded.");
      }
    }
  };

  const resetChallenge = () => {
    setChallengeState('idle'); 
    setChallengeQuestions([]);
    setCurrentChallengeQuestionIdx(0); 
    setChallengeScore(0);
    setChallengeSelectedAnswer(null); 
    setShowChallengeAnswer(false);
  };


  // --- Sub-components ---
  const Navigation = () => ( <nav className="nav">
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
  const Dashboard = () => { if (!user) return null;
    const modulesInProgress = learningModules.filter(m => {
        const prog = userProgress[m.id];
        return prog && Object.keys(prog.lessons).length > 0 && Object.keys(prog.lessons).length < m.lessons;
    });
    const recommendedNextModule = modulesInProgress.length > 0 ? modulesInProgress[0] : learningModules.find(m => !userProgress[m.id] || Object.keys(userProgress[m.id].lessons).length === 0);
    const categorizedModules = learningModules.reduce((acc, module) => {
        const category = module.category || 'General';
        if (!acc[category]) acc[category] = [];
        acc[category].push(module);
        return acc;
    }, {});
    const categoryOrder = ['Hardware', 'Software', 'CAD', 'General'];

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
  const ModuleView = () => { if (!selectedModule) return <p className="error-message">Module not found. Please go back to the dashboard.</p>;
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
            const lessonSanitizedId = lesson.id.replace(/\./g, '_');
            const lessonState = moduleProg.lessons[lessonSanitizedId] || { completed: false };
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
  const LessonContentView = () => { if (!currentLesson || !selectedModule) return <p className="error-message">Lesson content not found or module context missing.</p>;
    const sanitizedLessonId = currentLesson.id.replace(/\./g, '_');
    const moduleProg = userProgress[selectedModule.id] || { lessons: {} };
    const lessonState = moduleProg.lessons[sanitizedLessonId] || { completed: false };
    const isCompleted = lessonState.completed;

    const handleMarkCompleteAndContinue = () => {
      if (actionLoading) return;
      if (!isCompleted) handleCompleteItem(selectedModule.id, sanitizedLessonId, currentLesson.type, null, currentLesson.xp);
      
      const currentIndex = selectedModule.content.lessons.findIndex(l => l.id === currentLesson.id);
      const nextLesson = selectedModule.content.lessons[currentIndex + 1];
      
      if (nextLesson) {
        const currentNowCompleted = true; 
        const nextLessonSanitizedId = nextLesson.id.replace(/\./g, '_');
        const nextLessonProg = moduleProg.lessons[nextLessonSanitizedId] || { completed: false };
        const isNextLocked = !(currentNowCompleted) && !nextLessonProg.completed && currentIndex + 1 > 0;

        if (isNextLocked) { 
             navigate('module', { id: selectedModule.id }); 
             return; 
        }

        if (nextLesson.type === 'lesson') navigate('lessonContent', { moduleId: selectedModule.id, lesson: nextLesson });
        else if (nextLesson.type === 'quiz') navigate('quiz', { moduleId: selectedModule.id, lesson: nextLesson });
        else if (nextLesson.type === 'game') navigate('game', { moduleId: selectedModule.id, lesson: nextLesson });
        else navigate('module', { id: selectedModule.id });
      } else {
        navigate('module', { id: selectedModule.id });
      }
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
  const QuizView = () => { 
    const [currentQIdx, setCurrentQIdx] = useState(0);
    const [selectedAns, setSelectedAns] = useState(null);
    const [showRes, setShowRes] = useState(false);
    const [quizScore, setQuizScore] = useState(0);
    const [showExplanation, setShowExplanation] = useState(false);

    if (!quizData || !quizData.lessonId || !selectedModule) return <p className="error-message">Loading quiz...</p>;
    
    const sanitizedLessonId = quizData.lessonId.replace(/\./g, '_');
    const quizContent = sampleQuizzes[sanitizedLessonId];

    if (!quizContent) return <p className="error-message">Quiz content not found for: {quizData.lessonId}</p>;

    const handleAnsSelect = (idx) => { if (showExplanation || actionLoading) return; setSelectedAns(idx); }
    
    const handleSubmitAnswer = () => {
      if (selectedAns === null || actionLoading) return;
      setShowExplanation(true);
      const q = quizContent.questions[currentQIdx];
      if (selectedAns === q.correct) { 
        setQuizScore(s => s + 1); 
      }
    };

    const handleNextQ = () => {
      if (actionLoading) return;
      setShowExplanation(false); 
      setSelectedAns(null);
      if (currentQIdx + 1 < quizContent.questions.length) {
        setCurrentQIdx(i => i + 1);
      } else {
        setShowRes(true);
        const finalAttemptScore = quizScore;
        const passPercent = 70;
        const isAlreadyCompleted = userProgress[quizData.moduleId]?.lessons[sanitizedLessonId]?.completed;

        if (!isAlreadyCompleted && (finalAttemptScore / quizContent.questions.length) * 100 >= passPercent) {
          handleCompleteItem(quizData.moduleId, sanitizedLessonId, 'quiz', finalAttemptScore, quizData.lesson.xp);
        } else if (isAlreadyCompleted) {
            setMessage(`Quiz reviewed. Score: ${finalAttemptScore}/${quizContent.questions.length}. XP already earned.`);
        } else {
            setMessage(`Quiz attempt recorded. Score: ${finalAttemptScore}/${quizContent.questions.length}. You need ${passPercent}% to pass and earn XP.`);
        }
      }
    };

    const resetQuiz = () => { 
      setCurrentQIdx(0); 
      setSelectedAns(null); 
      setShowRes(false); 
      setQuizScore(0); 
      setShowExplanation(false); 
    };

    if (showRes) {
      const perc = quizContent.questions.length > 0 ? Math.round((quizScore / quizContent.questions.length) * 100) : 0;
      const passedThisAttempt = perc >= 70;
      const wasAlreadyCompleted = userProgress[quizData.moduleId]?.lessons[sanitizedLessonId]?.completed;
      const earnedXpThisSession = passedThisAttempt && !wasAlreadyCompleted;

      return (
        <div className="quiz-result">
          <div className={`result-icon ${passedThisAttempt ? 'success' : 'fail'}`}>{passedThisAttempt ? <Check /> : <X />}</div>
          <h2>{passedThisAttempt ? 'Excellent Work!' : 'Keep Practicing!'}</h2>
          <p>Your score for this attempt: {quizScore}/{quizContent.questions.length} ({perc}%)</p>
          {earnedXpThisSession && <p className="xp-earned">+{quizData.lesson.xp} XP Earned!</p>}
          {wasAlreadyCompleted && <p className="xp-earned">XP previously earned for this quiz.</p>}
          {!passedThisAttempt && !wasAlreadyCompleted && <p>You need 70% to pass and earn XP for this quiz.</p>}
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
  const GameView = () => { 
    if (!gameData || !gameData.lessonId || !selectedModule) return <p className="error-message">Loading game...</p>;
    
    const sanitizedLessonId = gameData.lessonId.replace(/\./g, '_');
    const gameContent = sampleGames[sanitizedLessonId];

    if (!gameContent) return <p className="error-message">Game content not found for: {gameData.lessonId}</p>;

    const handleCompleteGame = () => {
      if (actionLoading) return;
      const isAlreadyCompleted = userProgress[gameData.moduleId]?.lessons[sanitizedLessonId]?.completed;
      if (!isAlreadyCompleted) {
        handleCompleteItem(gameData.moduleId, sanitizedLessonId, 'game', null, gameContent.xp || 30);
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
  const TeamsView = () => { return (
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
          <button className="leave-team-btn" onClick={handleLeaveTeam} disabled={actionLoading}>{actionLoading ? 'Processing...' : 'Leave Team'}</button>
        </div>
      ) : (
        <div className="no-team-actions">
          <div className="team-action-card">
            <h3>Join an Existing Team</h3> <p>Enter the code shared by a team leader.</p>
            <div className="input-group">
              <input type="text" placeholder="Enter team code" value={joinTeamCodeInput} onChange={(e) => setJoinTeamCodeInput(e.target.value.toUpperCase())} disabled={actionLoading} />
              <button onClick={() => handleJoinTeam()} disabled={actionLoading || !joinTeamCodeInput}>{actionLoading ? 'Processing...' : 'Join Team'}</button>
            </div>
          </div>
          <div className="divider-or">OR</div>
          <div className="team-action-card">
            <h3>Create a New Team</h3> <p>Start your own Vexcel squad!</p>
            <div className="input-group">
              <input type="text" placeholder="Enter new team name" value={createTeamNameInput} onChange={(e) => setCreateTeamNameInput(e.target.value)} disabled={actionLoading} />
              <button onClick={handleCreateTeam} disabled={actionLoading || !createTeamNameInput}>{actionLoading ? 'Processing...' : 'Create Team'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  };
  const BrowseTeamsView = () => { 
    const [searchTerm, setSearchTerm] = useState('');
    const filteredAndSortedTeams = useMemo(() =>
        allTeams
            .filter(team =>
                team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (team.description && team.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                team.code.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a,b) => (b.totalXP || 0) - (a.totalXP || 0)),
        [allTeams, searchTerm]
    );

    useEffect(() => {
        if (currentView === 'browseTeams' && allTeams.length === 0) {
            fetchAllTeamsForBrowse();
        }
    }, [currentView, allTeams.length, fetchAllTeamsForBrowse]);


    return (
      <div className="browse-teams-view">
        <div className="view-header"> <Eye className="header-icon" /> <h1>Browse All Teams</h1> <p>Find a team, see who's competing, or get inspired!</p> </div>
        <div className="search-bar-container"> <Search className="search-icon" /> <input type="text" placeholder="Search by name, description, or code..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="teams-search-input" /> </div>
        {actionLoading && allTeams.length === 0 && <div className="full-page-loader"><div className="spinner"></div><p>Loading teams...</p></div>}
        {!actionLoading && allTeams.length === 0 && currentView === 'browseTeams' && (
          <p className="info-message">No teams exist yet. Go to "My Team" to create one!</p>
        )}
        { filteredAndSortedTeams.length > 0 && (
          <div className="teams-grid">
            {filteredAndSortedTeams.map(team => (
              <div key={team.id} className="team-browse-card">
                <div className="team-card-header"><h3>{team.name}</h3><span className="team-code-badge">CODE: {team.code}</span></div>
                <p className="team-description">{team.description || "No description available."}</p>
                <div className="team-card-footer">
                  <span><Users size={16} /> {(team.memberIds ? team.memberIds.length : 0)} Members</span> <span><Trophy size={16} /> {(team.totalXP || 0).toLocaleString()} XP</span>
                  {(!userTeam || userTeam.id !== team.id) && <button onClick={() => handleJoinTeam(team.code)} className="join-team-browse-btn" disabled={actionLoading || !!userTeam}>{!!userTeam ? 'In a Team' : (actionLoading ? 'Processing...' : 'Join Team')}</button>}
                  {userTeam && userTeam.id === team.id && <span className="current-team-indicator"><Check size={16}/> Your Team</span>}
                </div>
              </div>
            ))}
          </div>
        )}
        { !actionLoading && allTeams.length > 0 && filteredAndSortedTeams.length === 0 && (
          <p className="info-message">No teams match your search criteria.</p>
        )}
      </div>
    );
  };
  const LeaderboardView = () => { 
    const sortedLeaderboard = useMemo(() =>
        [...allTeams].sort((a, b) => (b.totalXP || 0) - (a.totalXP || 0)).map((team, index) => ({ ...team, rank: index + 1 })),
        [allTeams]
    );

    useEffect(() => {
        if (currentView === 'leaderboard' && allTeams.length === 0) {
            fetchAllTeamsForBrowse();
        }
    }, [currentView, allTeams.length, fetchAllTeamsForBrowse]);

    return (
      <div className="leaderboard-view">
        <div className="view-header"> <Trophy className="header-icon" /> <h1>Global Team Leaderboard</h1> <p>See how teams stack up in the Vexcel universe!</p> </div>
        {actionLoading && sortedLeaderboard.length === 0 && <div className="full-page-loader"><div className="spinner"></div><p>Loading leaderboard...</p></div>}
        
        {!actionLoading && sortedLeaderboard.length > 0 && (
            <div className="leaderboard-list">
            {sortedLeaderboard.map((team) => (
                <div key={team.id} className={`leaderboard-item ${userTeam && team.id === userTeam.id ? 'current-team' : ''}`}>
                <span className="rank-badge">#{team.rank}</span>
                <div className="team-info"><h3>{team.name}</h3> <p>{(team.memberIds ? team.memberIds.length : 0)} members • Code: {team.code}</p></div>
                <span className="team-xp">{(team.totalXP || 0).toLocaleString()} XP</span>
                </div>
            ))}
            </div>
        )}
        {!actionLoading && sortedLeaderboard.length === 0 && (
             <p className="info-message">The leaderboard is currently empty. Create or join a team to get started!</p>
        )}
      </div>
    );
  };
  const VexpertChallengeView = () => { 
    if (actionLoading && challengeState === 'idle' && challengeQuestions.length === 0) {
        return <div className="full-page-loader"><div className="spinner"></div><p>Preparing Challenge Setup...</p></div>;
    }

    if (challengeState === 'idle') {
      return (
        <div className="challenge-view">
          <div className="view-header">
            <Puzzle className="header-icon" style={{color: 'var(--color-purple-500)'}} />
            <h1>VEXpert Knowledge Challenge</h1>
            <p>Test your VEX robotics knowledge! Answer a series of questions and earn XP.</p>
          </div>
          <div className="challenge-idle-content">
            <img src={`https://source.boringavatars.com/bauhaus/120/${user?.email || 'challenge-ready'}?colors=8B5CF6,A78BFA,EDE9FE,F3E8FF,C084FC`} alt="Challenge Icon" className="challenge-arena-icon"/>
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
              onClick={startVexpertChallenge}
              disabled={actionLoading || selectedChallengeCategories.length === 0 || numChallengeQuestionsInput <= 0 || vexpertChallengeBank.filter(q => selectedChallengeCategories.includes(q.category)).length < numChallengeQuestionsInput || vexpertChallengeBank.filter(q => selectedChallengeCategories.includes(q.category)).length === 0 }
            >
              {actionLoading ? 'Loading...' : `Start ${numChallengeQuestionsInput}-Question Challenge`}
            </button>
          </div>
        </div>
      );
    }

    if (challengeState === 'active' && challengeQuestions.length > 0 && currentChallengeQuestionIdx < challengeQuestions.length) {
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
                    ${challengeSelectedAnswer === index ? 'selected' : ''}
                    ${showChallengeAnswer && currentQuestion.correctAnswerIndex === index ? 'correct' : ''}
                    ${showChallengeAnswer && challengeSelectedAnswer === index && currentQuestion.correctAnswerIndex !== index ? 'incorrect' : ''}
                  `}
                  onClick={() => handleChallengeAnswer(index)}
                  disabled={showChallengeAnswer || actionLoading}
                >
                  <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                  {option}
                </button>
              ))}
            </div>
            {showChallengeAnswer && (
              <div className="challenge-feedback">
                {challengeSelectedAnswer === currentQuestion.correctAnswerIndex ?
                  <p className="feedback-correct"><Check size={20}/> Correct!</p> :
                  <p className="feedback-incorrect"><X size={20}/> Incorrect. The correct answer was {String.fromCharCode(65 + currentQuestion.correctAnswerIndex)} ({currentQuestion.options[currentQuestion.correctAnswerIndex]}).</p>
                }
                {currentQuestion.explanation && <p className="explanation-text"><em>Explanation:</em> {currentQuestion.explanation}</p>}
                <button className="challenge-action-btn next-question-btn" onClick={handleNextChallengeQuestion} disabled={actionLoading}>
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
            {xpAwarded > 0 && <p className="xp-earned-challenge">You've earned {xpAwarded} XP!</p>}
          </div>
          <div className="challenge-ended-options">
            <button className="challenge-action-btn play-again-btn" onClick={resetChallenge} disabled={actionLoading}>Configure New Challenge</button>
            <button className="challenge-action-btn back-dashboard-btn" onClick={() => navigate('dashboard')} disabled={actionLoading}>Back to Dashboard</button>
          </div>
        </div>
      );
    }
    return <div className="challenge-view"><p>Loading challenge state or invalid state...</p></div>;
  };
  const LoginView = () => { 
    return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
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
          {message && (currentView === 'login') && (
            <div className={`message login-message ${message.toLowerCase().includes('failed') || message.toLowerCase().includes('error') || message.toLowerCase().includes('invalid') || message.toLowerCase().includes('critical') ? 'error' : (message.toLowerCase().includes('logout') || message.toLowerCase().includes('logged out') ? 'info' : 'success')}`}
                 dangerouslySetInnerHTML={{ __html: message }}
            />
          )}
          {!actionLoading && !user && (
            <div className="login-section">
              <GoogleLogin
                onSuccess={handleLoginSuccess}
                onError={handleLoginError}
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
  };


  // --- Main App Render Logic ---
  if (loading) {
    return (
      <div className="full-page-loader">
        <div className="spinner"></div>
        <p>Initializing Vexcel Platform...</p>
        {message && message.toLowerCase().includes("critical") && ( // Only show critical timeout messages here
             <p style={{color: 'red', marginTop: '1rem', maxWidth: '80%', textAlign: 'center', fontWeight: 'bold'}} dangerouslySetInnerHTML={{ __html: message }} />
        )}
      </div>
    );
  }

  return (
    <>
      {!user ? (
        <LoginView />
      ) : (
        <div className="app">
          <Navigation />
          <main className="main-content">
            {message && (currentView !== 'login' || user) && !message.toLowerCase().includes("critical") && // Don't show critical timeout messages once main app might render
                <div className={`message app-message ${message.toLowerCase().includes('failed')||message.toLowerCase().includes('error')||message.toLowerCase().includes('invalid')?'error':(message.toLowerCase().includes('level up')||message.toLowerCase().includes('completed')||message.toLowerCase().includes('🎉')||message.toLowerCase().includes('challenge finished')||message.toLowerCase().includes('successfully')||message.toLowerCase().includes('created') ?'success':'info')}`}
                 dangerouslySetInnerHTML={{ __html: message }}
                />
            }
            {actionLoading && currentView !== 'login' && (
                 <div className="loading-section page-loader"><div className="spinner" /> <p>Processing...</p></div>
            )}

            {currentView === 'dashboard' && <Dashboard />}
            {currentView === 'module' && selectedModule && <ModuleView />}
            {currentView === 'lessonContent' && currentLesson && selectedModule && <LessonContentView />}
            {currentView === 'quiz' && quizData && selectedModule && <QuizView />}
            {currentView === 'game' && gameData && selectedModule && <GameView />}
            {currentView === 'teams' && <TeamsView />}
            {currentView === 'browseTeams' && <BrowseTeamsView />}
            {currentView === 'leaderboard' && <LeaderboardView />}
            {currentView === 'challenge' && <VexpertChallengeView />}
          </main>
        </div>
      )}

      <style jsx global>{`
        :root {
            --color-blue-500: #3b82f6; --color-blue-600: #2563eb; --color-blue-100: #dbeafe; --color-blue-50: #eff6ff;
            --color-green-500: #10b981; --color-green-600: #059669; --color-green-100: #d1fae5; --color-green-50: #f0fdfa;
            --color-purple-500: #8b5cf6; --color-purple-600: #7c3aed; --color-purple-100: #ede9fe; --color-purple-300: #c4b5fd;
            --color-orange-500: #f59e0b; --color-orange-600: #d97706; --color-orange-100: #fff7ed;
            --color-red-500: #ef4444; --color-red-600: #dc2626; --color-red-100: #fee2e2;
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
        .icon { width: 1.25rem; height: 1.25rem; vertical-align: middle; } .icon-small { width: 1rem; height: 1rem; vertical-align: middle; } .icon.rotated { transform: rotate(180deg); }
        .error-message { color: var(--color-red-600); background-color: var(--color-red-100); padding: 1rem; border-radius: 8px; text-align: center; margin: 1rem; border: 1px solid var(--color-red-500); }
        .info-message { color: var(--text-secondary); text-align: center; padding: 1rem; font-style: italic;}

        .full-page-loader { display: flex; flex-direction:column; align-items: center; justify-content: center; min-height: 100vh; width:100%; background-color: rgba(243,244,246,0.95); gap:1rem; position: fixed; top:0; left:0; z-index:9999; text-align: center; padding: 20px;}
        .full-page-loader p { font-size: 1.1rem; color: var(--text-secondary); }
        .spinner { width: 3.5rem; height: 3.5rem; border: 5px solid #e0e0e0; border-top-color: var(--color-blue-500); border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 1rem; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .loading-section { display: flex; align-items: center; justify-content:center; gap: 1rem; padding: 1.5rem; background: rgba(255,255,255,0.8); border-radius:8px; margin-bottom:1.5rem; color: var(--text-secondary); box-shadow: var(--shadow-sm); }
        .loading-section.page-loader { margin: 2rem auto; }

        .message { padding: 1rem 1.5rem; border-radius: 8px; margin-bottom: 1.5rem; font-weight: 500; border: 1px solid transparent; box-shadow: var(--shadow-md); text-align: center;}
        .message.app-message {max-width: 800px; margin-left:auto; margin-right:auto;}
        .message.login-message { margin-top: 1.5rem; margin-bottom: 0.5rem; }
        .message.success { background: var(--color-green-100); color: var(--color-green-600); border-color: var(--color-green-500); }
        .message.error { background: var(--color-red-100); color: var(--color-red-600); border-color: var(--color-red-500); }
        .message.info { background: var(--color-blue-100); color: var(--color-blue-600); border-color: var(--color-blue-500); }

        .login-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1rem; background: linear-gradient(135deg, #6B73FF 0%, #000DFF 100%); }
        .login-card { background: white; border-radius: 16px; padding: 2.5rem 3rem; box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.2); width: 100%; max-width: 480px; text-align: center; }
        .login-header { margin-bottom: 2rem; }
        .login-header .brand-icon-large { width: 4.5rem; height: 4.5rem; margin: 0 auto 1rem; color: var(--color-blue-500); }
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
        .nav-item .icon { margin-right: 0.3rem; }
        .nav-item:hover { background: var(--color-blue-50); color: var(--color-blue-600); }
        .nav-item.active { background: var(--color-blue-500); color: white; }
        .nav-user { display: flex; align-items: center; gap: 0.75rem; padding-left: 1rem; border-left: 1px solid var(--border-color); margin-left: 0.75rem;}
        .user-avatar { width: 2.5rem; height: 2.5rem; border-radius: 50%; object-fit: cover; border: 2px solid var(--border-color);}
        .user-info { display: flex; flex-direction: column; align-items: flex-start;}
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
        .stat-card .stat-icon { color: var(--color-blue-500); width: 2rem; height: 2rem; }
        .stat-card .stat-value { font-size: 1.75rem; font-weight: 700; }
        .stat-card .stat-label { font-size: 0.9rem; color: var(--text-light); }
        .team-card { background: linear-gradient(135deg, var(--color-blue-500) 0%, var(--color-purple-500) 100%); color:white; padding: 2rem; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; box-shadow: var(--shadow-lg); }
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
        .recommended-module-card .start-btn.small { padding: 0.6rem 1rem; font-size:0.9rem; margin-top:auto; display:inline-flex; align-items:center; gap:0.3rem; background:var(--color-blue-500); color:white; border-radius:6px; font-weight:500;}
        .recommended-module-card .start-btn.small:hover { background:var(--color-blue-600); }
        .modules-section .module-category-section { margin-bottom: 2.5rem; }
        .modules-section .category-title { font-size: 1.75rem; font-weight: 600; margin-bottom: 1.5rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border-color); color: var(--text-primary); }
        .modules-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 2rem; }
        .module-card { background: var(--bg-card); padding: 1.5rem; border-radius: 12px; box-shadow: var(--shadow-md); display: flex; flex-direction: column; cursor:pointer; transition: transform 0.2s, box-shadow 0.2s;}
        .module-card:hover { transform: translateY(-5px); box-shadow: var(--shadow-lg); }
        .module-card .module-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .module-card .module-icon { width: 2.5rem; height: 2.5rem; }
        .module-card.blue .module-icon { color: var(--color-blue-500); } .module-card.blue .progress-fill { background: var(--color-blue-500); }
        .module-card.green .module-icon { color: var(--color-green-500); } .module-card.green .progress-fill { background: var(--color-green-500); }
        .module-card.purple .module-icon { color: var(--color-purple-500); } .module-card.purple .progress-fill { background: var(--color-purple-500); }
        .module-card.orange .module-icon { color: var(--color-orange-500); } .module-card.orange .progress-fill { background: var(--color-orange-500); }
        .module-card.red .module-icon { color: var(--color-red-500); } .module-card.red .progress-fill { background: var(--color-red-500); }
        .module-card .module-meta { display: flex; gap: 0.75rem; }
        .module-card .difficulty, .module-card .duration { font-size: 0.8rem; padding: 0.3rem 0.6rem; border-radius: 16px; background: #e9ecef; color: var(--text-secondary); }
        .module-card h3 { font-size: 1.35rem; font-weight: 600; margin-bottom: 0.5rem; }
        .module-card p { color: var(--text-secondary); margin-bottom: 1.5rem; line-height: 1.5; flex-grow: 1; font-size:0.95rem; }
        .module-card .progress-section { margin-bottom: 1.5rem; }
        .module-card .progress-bar { height: 8px; background: #e9ecef; border-radius: 4px; overflow: hidden; margin-bottom: 0.5rem; }
        .module-card .progress-fill { height: 100%; transition: width 0.3s ease-in-out; }
        .module-card .progress-text { font-size: 0.85rem; color: var(--text-light); }
        .module-card .start-btn { width: 100%; padding: 0.8rem 1.2rem; background: var(--color-blue-500); color: white; border-radius: 8px; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-size:0.95rem; }
        .module-card .start-btn .icon { margin-left: 0.25rem; }
        .module-card .start-btn:hover { background: var(--color-blue-600); }

        .module-view-header { background: var(--bg-card); padding: 2rem; border-radius: 12px; box-shadow: var(--shadow-md); margin-bottom:2rem;}
        .module-title-section { display: flex; align-items: flex-start; gap: 2rem; }
        .category-tag-module { display: inline-block; background-color: var(--color-purple-100); color: var(--color-purple-600); padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.8rem; font-weight: 500; margin-bottom: 0.5rem; }
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
        .lesson-item .lesson-btn .icon-small { margin-left:0.2rem;}
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
        .lesson-content-view .complete-lesson-btn .icon-small { margin-left:0.3rem; }
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
        .explanation-box { margin-top: 1.5rem; padding: 1rem; background-color: var(--color-blue-50); border-radius: 8px; border: 1px solid var(--color-blue-100); color: var(--text-secondary); font-size: 0.95rem; text-align: left; }
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
        .quiz-result .retry-btn .icon-small { margin-right:0.3rem; }
        .quiz-result .continue-btn .icon-small { margin-left:0.3rem; }
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
        .current-team-card .team-card-main { display:flex; align-items:flex-start; gap:2rem; margin-bottom:2rem;}
        .team-avatar-icon { width:4rem; height:4rem; flex-shrink:0; color: var(--color-blue-500); }
        .current-team-card h2 { font-size:1.8rem; font-weight:700; margin-bottom:0.5rem;}
        .team-description-small { font-size:1rem; color: var(--text-secondary); margin-bottom:0.75rem;}
        .current-team-card p {font-size:1rem; color:var(--text-secondary); margin-bottom:0.3rem;}
        .team-code-display { background: var(--color-blue-100); color: var(--color-blue-600); padding:0.3rem 0.6rem; border-radius:4px; font-weight:bold;}
        .leave-team-btn { padding: 0.8rem 1.5rem; background: var(--color-red-100); color: var(--color-red-600); border:1px solid var(--color-red-500); border-radius: 8px; font-weight: 600; }
        .leave-team-btn:hover { background: var(--color-red-500); color:white; }
        .no-team-actions { display:grid; grid-template-columns:1fr; gap:2.5rem; max-width:700px; margin:0 auto;}
        @media (min-width: 768px) { 
          .no-team-actions { grid-template-columns: 1fr auto 1fr; align-items:center; }
        }
        .team-action-card { background:var(--bg-card); padding:2rem; border-radius:10px; box-shadow:var(--shadow-md); text-align:center;}
        .team-action-card h3 {font-size:1.4rem; font-weight:600; margin-bottom:0.5rem;}
        .team-action-card p {font-size:1rem; color:var(--text-secondary); margin-bottom:1.5rem;}
        .input-group { display:flex; gap:1rem; }
        .input-group input {flex-grow:1;}
        .input-group button { padding: 0.75rem 1.5rem; background: var(--color-blue-500); color:white; border-radius:6px; font-weight:500;}
        .input-group button:hover:not(:disabled) {background: var(--color-blue-600);}
        .divider-or {text-align:center; font-weight:500; color:var(--text-light); position:relative; margin: 1rem 0;}
        .divider-or::before, .divider-or::after {content:''; display:block; width:40%; height:1px; background:var(--border-color); position:absolute; top:50%;}
        .divider-or::before {left:0;} .divider-or::after {right:0;}
        @media (max-width: 767px) { 
          .divider-or::before, .divider-or::after { width:0; } 
        }
        
        .browse-teams-view .search-bar-container { display: flex; align-items: center; margin-bottom: 2.5rem; background: var(--bg-card); padding: 0.6rem 1.2rem; border-radius: 8px; box-shadow: var(--shadow-md); }
        .browse-teams-view .search-icon { color: #9ca3af; margin-right: 0.8rem; width:1.25rem; height:1.25rem;}
        .browse-teams-view .teams-search-input { flex-grow: 1; border: none; padding: 0.8rem 0.5rem; font-size: 1.05rem; outline: none; background:transparent; }
        .teams-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 2rem; }
        .team-browse-card { background: var(--bg-card); padding: 1.75rem; border-radius: 10px; box-shadow: var(--shadow-md); display:flex; flex-direction:column; transition: transform 0.2s, box-shadow 0.2s;}
        .team-browse-card:hover {transform:translateY(-4px); box-shadow:var(--shadow-lg);}
        .team-browse-card .team-card-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;}
        .team-browse-card h3 { font-size: 1.3rem; color: var(--color-blue-600); margin-bottom:0.25rem; font-weight:600;}
        .team-browse-card .team-code-badge { font-size:0.8rem; background-color:var(--color-purple-100); color:var(--color-purple-600); padding:0.3rem 0.7rem; border-radius:12px; font-weight:500;}
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
        .leaderboard-item .team-xp {font-size:1.2rem; font-weight:700; color:var(--color-purple-500); margin-left:auto; text-align:right;}

        .challenge-view { background: var(--bg-card); padding: 2rem; border-radius: 12px; box-shadow: var(--shadow-lg); }
        .challenge-idle-content { text-align:center; padding: 2rem 0;}
        .challenge-arena-icon { width: 100px; height: 100px; margin: 0 auto 1.5rem; border-radius: 12px; }
        .challenge-idle-content h2 { font-size: 1.8rem; color: var(--text-primary); margin-bottom: 0.75rem; }
        .challenge-idle-content p { font-size: 1.1rem; color: var(--text-secondary); margin-bottom: 2rem; max-width:600px; margin-left:auto; margin-right:auto;}
        .challenge-action-btn { padding: 0.8rem 1.5rem; border-radius:8px; font-size:1rem; font-weight:500; display:inline-flex; align-items:center; justify-content:center; gap:0.6rem; border:1px solid transparent; line-height: 1.2;}
        .start-challenge-btn { background-color: var(--color-purple-500); color:white; padding: 1rem 2.5rem; font-size:1.1rem; font-weight:600;}
        .start-challenge-btn:hover:not(:disabled) { background-color: var(--color-purple-600); }

        .active-challenge .challenge-header { display: flex; justify-content: space-between; align-items: center; margin-bottom:1.5rem; padding-bottom:1rem; border-bottom:1px solid var(--border-color); flex-wrap: wrap; gap: 0.5rem; }
        .active-challenge .challenge-header h2 { font-size:1.4rem; font-weight:600; color:var(--text-primary); }
        .challenge-timer { font-size:1rem; font-weight:500; color:var(--text-secondary); display:flex; align-items:center; gap:0.4rem; }
        .timer-critical { color: var(--color-red-500); font-weight: bold; }
        .challenge-score { font-size:1rem; font-weight:500; color:var(--color-green-600); }

        .challenge-question-card { padding: 1rem 0; }
        .challenge-question-card .question-category-tag { display:inline-block; background-color:var(--color-blue-100); color:var(--color-blue-600); padding:0.3rem 0.8rem; border-radius:12px; font-size:0.85rem; margin-bottom:1rem;}
        .challenge-question-card h3 { font-size: 1.4rem; font-weight: 600; margin-bottom: 1.5rem; line-height: 1.4; color:var(--text-primary); text-align:center; }
        .challenge-options-list { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem; }
        .challenge-option-btn { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: white; border: 2px solid var(--border-color); border-radius: 8px; text-align: left; width:100%; font-size:1rem;}
        .challenge-option-btn:hover:not(:disabled) { border-color: var(--color-purple-100); background: var(--color-purple-50); }
        .challenge-option-btn.selected:not(.correct):not(.incorrect) { border-color: var(--color-purple-500); background: var(--color-purple-100); font-weight:500;}
        .challenge-option-btn.correct { background-color: var(--color-green-100); border-color: var(--color-green-500); color: var(--color-green-600); font-weight: bold; }
        .challenge-option-btn.incorrect { background-color: var(--color-red-100); border-color: var(--color-red-500); color: var(--color-red-600); }
        .challenge-option-btn .option-letter { background: #e9ecef; }
        .challenge-option-btn.selected:not(.correct):not(.incorrect) .option-letter { background: var(--color-purple-500); color: white; }
        .challenge-option-btn.correct .option-letter { background: var(--color-green-500); color: white; }
        .challenge-option-btn.incorrect .option-letter { background: var(--color-red-500); color: white; }

        .challenge-feedback { margin-top:1.5rem; padding:1rem; border-radius:8px; background-color: #f8f9fa; border: 1px solid var(--border-color); text-align: left;}
        .challenge-feedback .feedback-correct { color:var(--color-green-600); font-weight:bold; display:flex; align-items:center; gap:0.5rem; margin-bottom:0.5rem; }
        .challenge-feedback .feedback-incorrect { color:var(--color-red-600); font-weight:bold; display:flex; align-items:center; gap:0.5rem; margin-bottom:0.5rem;}
        .challenge-feedback .explanation-text { font-size:0.9rem; color:var(--text-secondary); margin-bottom:1rem; }
        .next-question-btn { background-color: var(--color-blue-500); color:white; margin-top:1rem; display:block; margin-left:auto; margin-right:auto; }
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
            border-color: var(--color-purple-500);
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
          transition: border-color 0.2s, background-color 0.2s;
        }
        .category-checkbox-item:hover {
            border-color: var(--color-purple-300);
        }
        .category-checkbox-item input[type="checkbox"] {
          width: 1rem;
          height: 1rem;
          accent-color: var(--color-purple-500); 
          cursor: pointer;
        }
        .category-checkbox-item input[type="checkbox"]:checked + label {
            color: var(--color-purple-600);
            font-weight: 500;
        }
        .category-checkbox-item label {
            cursor: pointer;
            font-weight: normal; 
            color: var(--text-secondary);
            transition: color 0.2s;
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
