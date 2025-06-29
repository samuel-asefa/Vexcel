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
    const q = query(lessonsRef, orderBy('order', 'asc'));
    
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

// Default lessons as fallback
const getDefaultLessons = (): Lesson[] => {
  return [
    {
      id: 'lesson-1',
      title: 'Introduction to VEX Robotics',
      description: 'Learn the fundamentals of VEX robotics, including basic components and assembly techniques.',
      duration: 30,
      difficulty: 'Beginner',
      category: 'Basics',
      order: 1,
      rating: 4.8,
      students: 1250,
      xpReward: 100,
      sections: [
        {
          id: 'section-1',
          title: 'What is VEX Robotics?',
          content: `VEX Robotics is an educational robotics platform designed to provide students with hands-on experience in STEM fields. The VEX system uses metal and plastic components that can be assembled into various robot configurations.

Key benefits of VEX Robotics include:
• Develops problem-solving skills
• Teaches engineering principles
• Builds teamwork and collaboration
• Prepares students for real-world challenges

The VEX system is used in classrooms and competitions worldwide, making it one of the most popular educational robotics platforms available today.`,
          order: 1
        },
        {
          id: 'section-2',
          title: 'VEX Components Overview',
          content: `Understanding the basic components of VEX robotics is essential for building successful robots. Here are the main categories:

**Structural Components:**
• Metal beams and angles for the robot frame
• Plastic connectors and joints
• Wheels and gears for movement

**Electronic Components:**
• VEX Brain (the main control unit)
• Motors for movement and manipulation
• Sensors for environmental awareness
• Cables for connections

**Tools:**
• Hex keys for assembly
• Screws and fasteners
• VEXcode software for programming`,
          order: 2
        }
      ],
      quiz: {
        id: 'quiz-1',
        questions: [
          {
            id: 'q1',
            question: 'What is the main control unit in a VEX robotics system?',
            options: ['VEX Motor', 'VEX Brain', 'VEX Sensor', 'VEX Wheel'],
            correctAnswer: 1,
            explanation: 'The VEX Brain is the main control unit that processes your program and controls all the robot\'s components.',
            difficulty: 'Easy'
          }
        ]
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'lesson-2',
      title: 'Basic Programming Concepts',
      description: 'Master the basics of robot programming with VEXcode and understand fundamental programming principles.',
      duration: 45,
      difficulty: 'Beginner',
      category: 'Programming',
      order: 2,
      rating: 4.9,
      students: 980,
      xpReward: 150,
      sections: [
        {
          id: 'section-1',
          title: 'Introduction to VEXcode',
          content: `VEXcode is the programming environment used to control VEX robots. It provides a user-friendly interface for both block-based and text-based programming.

**Key Features:**
• Drag-and-drop block programming
• Text-based programming in C++
• Built-in help and tutorials
• Device configuration tools
• Real-time debugging

VEXcode makes it easy for beginners to start programming while providing advanced features for experienced programmers.`,
          order: 1
        }
      ],
      quiz: {
        id: 'quiz-2',
        questions: [
          {
            id: 'q1',
            question: 'What programming languages does VEXcode support?',
            options: ['Only blocks', 'Only C++', 'Both blocks and C++', 'Python and Java'],
            correctAnswer: 2,
            explanation: 'VEXcode supports both drag-and-drop block programming and text-based C++ programming.',
            difficulty: 'Easy'
          }
        ]
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'lesson-3',
      title: 'Understanding Sensors',
      description: 'Deep dive into various VEX sensors, their applications, and advanced integration techniques.',
      duration: 60,
      difficulty: 'Intermediate',
      category: 'Hardware',
      order: 3,
      rating: 4.7,
      students: 750,
      xpReward: 200,
      sections: [
        {
          id: 'section-1',
          title: 'Types of VEX Sensors',
          content: `VEX robots can use various sensors to interact with their environment. Understanding these sensors is crucial for building intelligent robots.

**Common VEX Sensors:**
• Bumper Switch - Detects physical contact
• Ultrasonic Sensor - Measures distance
• Gyro Sensor - Detects rotation and orientation
• Vision Sensor - Recognizes colors and objects
• Line Tracker - Follows lines on the ground
• Light Sensor - Detects light levels

Each sensor has specific use cases and programming requirements.`,
          order: 1
        }
      ],
      quiz: {
        id: 'quiz-3',
        questions: [
          {
            id: 'q1',
            question: 'Which sensor would be best for measuring distance to an object?',
            options: ['Bumper Switch', 'Ultrasonic Sensor', 'Gyro Sensor', 'Light Sensor'],
            correctAnswer: 1,
            explanation: 'The Ultrasonic Sensor uses sound waves to accurately measure distance to objects.',
            difficulty: 'Medium'
          }
        ]
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'lesson-4',
      title: 'Competition Strategies',
      description: 'Learn winning strategies and tactics for VEX competitions.',
      duration: 50,
      difficulty: 'Advanced',
      category: 'Competition',
      order: 4,
      rating: 4.8,
      students: 650,
      xpReward: 250,
      sections: [
        {
          id: 'section-1',
          title: 'Competition Basics',
          content: `Understanding VEX competition formats and rules is essential for success. VEX competitions test both technical skills and strategic thinking.

**Competition Elements:**
• Autonomous Period - Robot operates independently
• Driver Control - Human operators control the robot
• Skills Challenges - Specialized scoring opportunities
• Alliance Play - Teams work together

**Key Success Factors:**
• Reliable robot design
• Consistent autonomous routines
• Effective driver practice
• Strategic alliance selection`,
          order: 1
        }
      ],
      quiz: {
        id: 'quiz-4',
        questions: [
          {
            id: 'q1',
            question: 'What is the most important aspect of competition strategy?',
            options: ['Speed', 'Accuracy', 'Teamwork', 'All of the above'],
            correctAnswer: 3,
            explanation: 'Successful VEX competition requires a balance of speed, accuracy, and teamwork.',
            difficulty: 'Medium'
          }
        ]
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'lesson-5',
      title: 'Autonomous Programming',
      description: 'Master autonomous robot programming for competition success.',
      duration: 75,
      difficulty: 'Advanced',
      category: 'Programming',
      order: 5,
      rating: 4.6,
      students: 320,
      xpReward: 300,
      sections: [
        {
          id: 'section-1',
          title: 'Autonomous Basics',
          content: `Autonomous programming allows robots to operate without human control. This is crucial for VEX competitions where robots must perform tasks independently.

**Key Concepts:**
• Sensor feedback loops
• Path planning algorithms
• Error correction and recovery
• Timing and coordination

**Programming Strategies:**
• Start with simple movements
• Add sensor feedback gradually
• Test extensively in competition conditions
• Plan for multiple scenarios

**Common Challenges:**
• Sensor noise and calibration
• Environmental variations
• Battery voltage changes
• Mechanical wear and tear`,
          order: 1
        }
      ],
      quiz: {
        id: 'quiz-5',
        questions: [
          {
            id: 'q1',
            question: 'What is the key to successful autonomous programming?',
            options: ['Complex algorithms', 'Sensor integration', 'Precise movements', 'All of the above'],
            correctAnswer: 3,
            explanation: 'Successful autonomous programming requires complex algorithms, proper sensor integration, and precise movements.',
            difficulty: 'Hard'
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