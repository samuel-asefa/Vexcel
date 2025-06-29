import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  getDocs,
  orderBy,
  where
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Lesson, LessonProgress } from '../types/lesson';

export const getAllLessons = async (): Promise<Lesson[]> => {
  try {
    console.log('Fetching lessons from Firestore...');
    const lessonsRef = collection(db, 'lessons');
    const q = query(lessonsRef, orderBy('category', 'asc'), orderBy('order', 'asc'));
    
    const querySnapshot = await getDocs(q);
    const lessons: Lesson[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      lessons.push({ 
        id: doc.id, 
        ...data,
        // Convert Firestore timestamps to Date objects
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Lesson);
    });
    
    console.log(`Loaded ${lessons.length} lessons from Firestore`);
    
    // If no lessons found, return some default lessons
    if (lessons.length === 0) {
      console.log('No lessons found in Firestore, returning default lessons');
      return getDefaultLessons();
    }
    
    return lessons;
  } catch (error) {
    console.error('Error getting lessons from Firestore:', error);
    // Fallback to default lessons if Firestore fails
    console.log('Falling back to default lessons');
    return getDefaultLessons();
  }
};

// Default lessons organized by categories
const getDefaultLessons = (): Lesson[] => {
  return [
    // BUILDING CATEGORY
    {
      id: 'building-1',
      title: 'VEX Building Fundamentals',
      description: 'Learn the basics of VEX construction, including structural components, fasteners, and assembly techniques.',
      duration: 45,
      difficulty: 'Beginner',
      category: 'Building',
      order: 1,
      rating: 4.9,
      students: 1850,
      xpReward: 150,
      sections: [
        {
          id: 'section-1',
          title: 'VEX Structural Components',
          content: `VEX robotics uses a modular building system with standardized components that connect together seamlessly.

**Metal Structure:**
• C-Channel - Primary structural beam (various lengths)
• Angle Brackets - Corner reinforcement and connections
• Flat Bars - Lightweight structural elements
• Standoffs - Spacing and mounting components

**Fasteners:**
• 8-32 Screws - Standard threading for metal connections
• Keps Nuts - Self-locking nuts for secure assembly
• Nylock Nuts - Vibration-resistant fasteners
• Washers - Load distribution and spacing

**Connection Methods:**
• Direct screw connections through holes
• Standoff spacing for parallel structures
• Bracket reinforcement for strong joints
• Bearing flats for rotating assemblies`,
          order: 1
        },
        {
          id: 'section-2',
          title: 'Assembly Best Practices',
          content: `Proper assembly techniques ensure your robot is strong, reliable, and easy to maintain.

**Planning Your Build:**
• Start with a clear design concept
• Consider weight distribution and balance
• Plan for easy access to components
• Think about maintenance and adjustments

**Assembly Techniques:**
• Use proper torque - snug but not over-tight
• Align holes carefully before inserting screws
• Use threadlocker on critical connections
• Leave room for wire routing

**Common Mistakes to Avoid:**
• Over-tightening screws (strips threads)
• Misaligned holes (causes binding)
• Poor wire management (interference)
• Inadequate structural support (flexing)`,
          order: 2
        }
      ],
      quiz: {
        id: 'quiz-building-1',
        questions: [
          {
            id: 'q1',
            question: 'What is the standard screw thread size for VEX metal components?',
            options: ['6-32', '8-32', '10-24', '1/4-20'],
            correctAnswer: 1,
            explanation: '8-32 is the standard thread size for VEX metal components, providing the right balance of strength and ease of use.',
            difficulty: 'Easy'
          },
          {
            id: 'q2',
            question: 'Which fastener type is best for connections that may vibrate?',
            options: ['Regular nuts', 'Keps nuts', 'Wing nuts', 'Thumb screws'],
            correctAnswer: 1,
            explanation: 'Keps nuts have a built-in washer and locking feature that prevents loosening from vibration.',
            difficulty: 'Medium'
          }
        ]
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'building-2',
      title: 'Advanced Structural Design',
      description: 'Master advanced building techniques including triangulation, load distribution, and complex mechanisms.',
      duration: 60,
      difficulty: 'Intermediate',
      category: 'Building',
      order: 2,
      rating: 4.7,
      students: 1200,
      xpReward: 200,
      sections: [
        {
          id: 'section-1',
          title: 'Structural Engineering Principles',
          content: `Understanding engineering principles helps you build stronger, more efficient robots.

**Triangulation:**
• Triangles are the strongest geometric shape
• Use diagonal bracing to prevent flexing
• Create rigid frames with triangular supports
• Apply to both 2D and 3D structures

**Load Distribution:**
• Spread forces across multiple points
• Use wider bases for stability
• Consider both static and dynamic loads
• Plan for worst-case scenarios

**Material Efficiency:**
• Use the right amount of material
• Avoid over-building (adds unnecessary weight)
• Strategic placement of reinforcement
• Balance strength with weight`,
          order: 1
        }
      ],
      quiz: {
        id: 'quiz-building-2',
        questions: [
          {
            id: 'q1',
            question: 'What is the primary benefit of triangulation in robot construction?',
            options: ['Reduces weight', 'Increases rigidity', 'Saves space', 'Looks better'],
            correctAnswer: 1,
            explanation: 'Triangulation creates rigid structures that resist deformation under load, making the robot more stable and precise.',
            difficulty: 'Medium'
          }
        ]
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },

    // PROGRAMMING CATEGORY
    {
      id: 'programming-1',
      title: 'VEXcode Basics',
      description: 'Get started with VEXcode programming environment, from blocks to text-based coding.',
      duration: 50,
      difficulty: 'Beginner',
      category: 'Programming',
      order: 1,
      rating: 4.8,
      students: 2100,
      xpReward: 175,
      sections: [
        {
          id: 'section-1',
          title: 'Introduction to VEXcode',
          content: `VEXcode is the official programming environment for VEX robots, supporting both visual and text-based programming.

**Programming Options:**
• VEXcode Blocks - Visual drag-and-drop programming
• VEXcode Text - C++ text-based programming
• VEXcode Python - Python programming support
• Cross-platform compatibility (Windows, Mac, Chromebook)

**Key Features:**
• Built-in device configuration
• Real-time debugging tools
• Extensive help documentation
• Competition templates and examples

**Getting Started:**
• Download and install VEXcode
• Connect your VEX Brain via USB
• Configure your robot's devices
• Write your first program`,
          order: 1
        },
        {
          id: 'section-2',
          title: 'Basic Programming Concepts',
          content: `Understanding fundamental programming concepts is essential for robot control.

**Program Structure:**
• Setup code (runs once at start)
• Main loop (repeats continuously)
• Functions (reusable code blocks)
• Comments (documentation)

**Basic Commands:**
• Motor control (spin, stop, set velocity)
• Sensor reading (get values)
• Wait commands (timing control)
• Conditional statements (if/else)

**Best Practices:**
• Use descriptive variable names
• Comment your code thoroughly
• Test small sections at a time
• Keep functions simple and focused`,
          order: 2
        }
      ],
      quiz: {
        id: 'quiz-programming-1',
        questions: [
          {
            id: 'q1',
            question: 'What are the two main programming modes in VEXcode?',
            options: ['Blocks and Text', 'Visual and Audio', 'Simple and Advanced', 'Auto and Manual'],
            correctAnswer: 0,
            explanation: 'VEXcode supports both Blocks (visual drag-and-drop) and Text (C++ code) programming modes.',
            difficulty: 'Easy'
          },
          {
            id: 'q2',
            question: 'What is the purpose of the main loop in a robot program?',
            options: ['Runs once at startup', 'Repeats continuously', 'Handles errors', 'Saves data'],
            correctAnswer: 1,
            explanation: 'The main loop repeats continuously while the program runs, allowing the robot to respond to changing conditions.',
            difficulty: 'Medium'
          }
        ]
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'programming-2',
      title: 'Sensor Programming',
      description: 'Learn to program and integrate various VEX sensors for autonomous robot behavior.',
      duration: 65,
      difficulty: 'Intermediate',
      category: 'Programming',
      order: 2,
      rating: 4.6,
      students: 1650,
      xpReward: 225,
      sections: [
        {
          id: 'section-1',
          title: 'Sensor Types and Applications',
          content: `VEX sensors provide robots with the ability to perceive and respond to their environment.

**Distance Sensors:**
• Ultrasonic Sensor - Measures distance using sound waves
• Optical Sensor - Detects objects using light
• Range: 3cm to 300cm (ultrasonic)
• Applications: Obstacle avoidance, positioning

**Contact Sensors:**
• Bumper Switch - Detects physical contact
• Limit Switch - Precise position detection
• Applications: End-of-travel detection, collision response

**Motion Sensors:**
• Gyroscope - Measures rotation and orientation
• Accelerometer - Detects acceleration and tilt
• Applications: Straight driving, turn accuracy

**Vision Sensors:**
• Camera-based object recognition
• Color detection and tracking
• Applications: Game piece identification, navigation`,
          order: 1
        }
      ],
      quiz: {
        id: 'quiz-programming-2',
        questions: [
          {
            id: 'q1',
            question: 'Which sensor is best for measuring precise distances to objects?',
            options: ['Bumper Switch', 'Ultrasonic Sensor', 'Gyroscope', 'Limit Switch'],
            correctAnswer: 1,
            explanation: 'Ultrasonic sensors use sound waves to accurately measure distances from 3cm to 300cm.',
            difficulty: 'Medium'
          }
        ]
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },

    // CAD CATEGORY
    {
      id: 'cad-1',
      title: 'Introduction to VEX CAD',
      description: 'Learn computer-aided design for VEX robotics using Fusion 360 and VEX part libraries.',
      duration: 55,
      difficulty: 'Beginner',
      category: 'CAD',
      order: 1,
      rating: 4.5,
      students: 980,
      xpReward: 200,
      sections: [
        {
          id: 'section-1',
          title: 'CAD Software and Setup',
          content: `Computer-Aided Design (CAD) allows you to design and test your robot before building it physically.

**Recommended CAD Software:**
• Fusion 360 - Professional CAD with free education license
• Inventor - Autodesk's mechanical design software
• SolidWorks - Industry-standard CAD platform
• Onshape - Cloud-based CAD solution

**VEX Part Libraries:**
• Official VEX part libraries available
• Accurate 3D models of all components
• Proper constraints and connections
• Regular updates with new parts

**Benefits of CAD:**
• Visualize designs before building
• Check for interference and clearances
• Calculate weight and center of mass
• Generate assembly instructions
• Share designs with team members`,
          order: 1
        },
        {
          id: 'section-2',
          title: 'Basic CAD Operations',
          content: `Master the fundamental CAD operations needed for robot design.

**Essential Skills:**
• Creating sketches and profiles
• Extruding and cutting features
• Assembling components
• Applying constraints and mates

**VEX-Specific Techniques:**
• Using hole patterns for VEX spacing
• Proper fastener representation
• Subassembly organization
• Motion studies for mechanisms

**Design Workflow:**
• Start with overall layout
• Design major subsystems
• Add detailed components
• Check for conflicts and issues
• Generate documentation`,
          order: 2
        }
      ],
      quiz: {
        id: 'quiz-cad-1',
        questions: [
          {
            id: 'q1',
            question: 'What is the main advantage of using CAD before building a robot?',
            options: ['Saves money', 'Visualize and test designs', 'Faster building', 'Better documentation'],
            correctAnswer: 1,
            explanation: 'CAD allows you to visualize and test your design virtually, identifying problems before physical construction.',
            difficulty: 'Easy'
          },
          {
            id: 'q2',
            question: 'Which CAD software offers free education licenses for students?',
            options: ['AutoCAD', 'Fusion 360', 'CATIA', 'Rhino'],
            correctAnswer: 1,
            explanation: 'Fusion 360 provides free education licenses for students and educators, making it accessible for VEX teams.',
            difficulty: 'Medium'
          }
        ]
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'cad-2',
      title: 'Advanced CAD Techniques',
      description: 'Master advanced CAD features including assemblies, motion simulation, and design optimization.',
      duration: 70,
      difficulty: 'Advanced',
      category: 'CAD',
      order: 2,
      rating: 4.4,
      students: 650,
      xpReward: 275,
      sections: [
        {
          id: 'section-1',
          title: 'Assembly Design and Motion',
          content: `Advanced CAD techniques help you create sophisticated robot designs with moving mechanisms.

**Assembly Strategies:**
• Top-down design approach
• Modular subassembly organization
• Proper constraint hierarchy
• Design for manufacturability

**Motion Simulation:**
• Joint definitions and limits
• Collision detection
• Kinematic analysis
• Performance optimization

**Advanced Features:**
• Parametric design with variables
• Design tables for configurations
• Stress analysis and simulation
• Weight and balance calculations

**Collaboration Tools:**
• Version control and branching
• Design reviews and markup
• Shared libraries and standards
• Export formats for manufacturing`,
          order: 1
        }
      ],
      quiz: {
        id: 'quiz-cad-2',
        questions: [
          {
            id: 'q1',
            question: 'What is the benefit of motion simulation in CAD?',
            options: ['Prettier renders', 'Test mechanism function', 'Faster modeling', 'Better colors'],
            correctAnswer: 1,
            explanation: 'Motion simulation allows you to test how mechanisms will move and function before building them physically.',
            difficulty: 'Hard'
          }
        ]
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },

    // NOTEBOOK CATEGORY
    {
      id: 'notebook-1',
      title: 'Engineering Notebook Fundamentals',
      description: 'Learn to create and maintain a professional engineering notebook for VEX competitions.',
      duration: 40,
      difficulty: 'Beginner',
      category: 'Notebook',
      order: 1,
      rating: 4.7,
      students: 1450,
      xpReward: 125,
      sections: [
        {
          id: 'section-1',
          title: 'Purpose and Importance',
          content: `The engineering notebook is a crucial component of VEX competitions and real-world engineering practice.

**Why Keep a Notebook:**
• Documents the design process
• Shows problem-solving methodology
• Demonstrates learning and growth
• Required for many VEX awards
• Develops professional habits

**Competition Benefits:**
• Excellence Award consideration
• Design Award qualification
• Judge interview preparation
• Team organization tool

**Professional Skills:**
• Technical documentation
• Project management
• Communication skills
• Critical thinking development

**Legal and Academic Value:**
• Intellectual property protection
• Academic portfolio development
• Scholarship applications
• Career preparation`,
          order: 1
        },
        {
          id: 'section-2',
          title: 'Notebook Structure and Format',
          content: `A well-organized notebook follows consistent formatting and documentation standards.

**Physical Requirements:**
• Bound notebook (not loose-leaf)
• Numbered pages
• Permanent ink (pen, not pencil)
• No erasures (cross out mistakes)
• Date and sign each entry

**Content Organization:**
• Table of contents
• Team information and goals
• Meeting notes and decisions
• Design iterations and testing
• Competition reflections

**Entry Types:**
• Brainstorming sessions
• Design sketches and CAD
• Build photos and documentation
• Programming code and logic
• Test results and data
• Competition performance analysis`,
          order: 2
        }
      ],
      quiz: {
        id: 'quiz-notebook-1',
        questions: [
          {
            id: 'q1',
            question: 'What type of notebook is required for VEX competitions?',
            options: ['Loose-leaf binder', 'Digital only', 'Bound notebook', 'Spiral notebook'],
            correctAnswer: 2,
            explanation: 'VEX competitions require bound notebooks to ensure entries cannot be removed or rearranged.',
            difficulty: 'Easy'
          },
          {
            id: 'q2',
            question: 'What should you do if you make a mistake in your notebook?',
            options: ['Erase it', 'Use white-out', 'Cross it out', 'Tear out the page'],
            correctAnswer: 2,
            explanation: 'Mistakes should be crossed out with a single line so the original entry remains visible, maintaining notebook integrity.',
            difficulty: 'Medium'
          }
        ]
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'notebook-2',
      title: 'Advanced Documentation Techniques',
      description: 'Master advanced notebook techniques including technical drawings, data analysis, and award preparation.',
      duration: 55,
      difficulty: 'Intermediate',
      category: 'Notebook',
      order: 2,
      rating: 4.6,
      students: 890,
      xpReward: 175,
      sections: [
        {
          id: 'section-1',
          title: 'Technical Documentation',
          content: `Advanced documentation techniques make your notebook more professional and informative.

**Technical Drawings:**
• Isometric sketches of mechanisms
• Dimensioned drawings with measurements
• Assembly diagrams and exploded views
• Wiring diagrams and schematics

**Data Collection and Analysis:**
• Test data tables and charts
• Performance graphs and trends
• Statistical analysis of results
• Comparison matrices for design options

**Photography and Media:**
• High-quality build photos
• Action shots during testing
• Before/after comparisons
• Video frame captures for analysis

**Professional Presentation:**
• Consistent formatting and layout
• Clear headings and organization
• Proper grammar and spelling
• Logical flow of information`,
          order: 1
        }
      ],
      quiz: {
        id: 'quiz-notebook-2',
        questions: [
          {
            id: 'q1',
            question: 'What type of drawing best shows how parts fit together?',
            options: ['Top view', 'Side view', 'Exploded view', 'Cross-section'],
            correctAnswer: 2,
            explanation: 'Exploded views show how individual parts relate to each other in an assembly, making construction clear.',
            difficulty: 'Medium'
          }
        ]
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
};

export const getLessonById = async (lessonId: string): Promise<Lesson | null> => {
  try {
    const lessonDoc = await getDoc(doc(db, 'lessons', lessonId));
    if (lessonDoc.exists()) {
      const data = lessonDoc.data();
      return { 
        id: lessonId, 
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Lesson;
    }
    
    // Fallback to default lessons
    const defaultLessons = getDefaultLessons();
    return defaultLessons.find(lesson => lesson.id === lessonId) || null;
  } catch (error) {
    console.error('Error getting lesson:', error);
    // Fallback to default lessons
    const defaultLessons = getDefaultLessons();
    return defaultLessons.find(lesson => lesson.id === lessonId) || null;
  }
};

export const getUserLessonProgress = async (
  userId: string, 
  lessonId: string
): Promise<LessonProgress | null> => {
  try {
    const progressDoc = await getDoc(doc(db, 'lessonProgress', `${userId}_${lessonId}`));
    if (progressDoc.exists()) {
      const data = progressDoc.data();
      return { 
        id: progressDoc.id, 
        ...data,
        lastAccessed: data.lastAccessed?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        completedAt: data.completedAt?.toDate() || null
      } as LessonProgress;
    }
    return null;
  } catch (error) {
    console.error('Error getting lesson progress:', error);
    return null;
  }
};

export const updateLessonProgress = async (
  userId: string,
  lessonId: string,
  sectionIndex: number,
  timeSpent: number
): Promise<void> => {
  try {
    const progressId = `${userId}_${lessonId}`;
    const progressRef = doc(db, 'lessonProgress', progressId);
    
    const existingProgress = await getDoc(progressRef);
    
    if (existingProgress.exists()) {
      const data = existingProgress.data() as LessonProgress;
      const updatedSections = [...data.sectionsCompleted];
      
      if (!updatedSections.includes(sectionIndex)) {
        updatedSections.push(sectionIndex);
      }
      
      await updateDoc(progressRef, {
        sectionsCompleted: updatedSections,
        timeSpent: data.timeSpent + timeSpent,
        lastAccessed: new Date(),
        updatedAt: new Date()
      });
    } else {
      const newProgress: Omit<LessonProgress, 'id'> = {
        userId,
        lessonId,
        sectionsCompleted: [sectionIndex],
        quizCompleted: false,
        quizScore: 0,
        timeSpent,
        completed: false,
        completedAt: null,
        lastAccessed: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await setDoc(progressRef, newProgress);
    }
  } catch (error) {
    console.error('Error updating lesson progress:', error);
    // Don't throw error, just log it
  }
};

export const completeLessonQuiz = async (
  userId: string,
  lessonId: string,
  score: number,
  totalQuestions: number
): Promise<void> => {
  try {
    const progressId = `${userId}_${lessonId}`;
    const progressRef = doc(db, 'lessonProgress', progressId);
    
    const isCompleted = score >= totalQuestions * 0.7; // 70% passing grade
    
    await updateDoc(progressRef, {
      quizCompleted: true,
      quizScore: score,
      completed: isCompleted,
      completedAt: isCompleted ? new Date() : null,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error completing lesson quiz:', error);
    // Don't throw error, just log it
  }
};

export const getLessonsByCategory = async (category: string): Promise<Lesson[]> => {
  try {
    const q = query(
      collection(db, 'lessons'),
      where('category', '==', category),
      orderBy('order', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const lessons: Lesson[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      lessons.push({ 
        id: doc.id, 
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Lesson);
    });
    
    return lessons;
  } catch (error) {
    console.error('Error getting lessons by category:', error);
    // Fallback to filtering default lessons
    const defaultLessons = getDefaultLessons();
    return defaultLessons.filter(lesson => lesson.category === category);
  }
};