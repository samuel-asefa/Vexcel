import { collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Lesson } from '../types/lesson';

// Sample lessons data to seed your Firestore
export const sampleLessons: Omit<Lesson, 'id'>[] = [
  {
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
  }
];

export const seedLessons = async (): Promise<void> => {
  try {
    const batch = writeBatch(db);
    
    sampleLessons.forEach((lesson, index) => {
      const lessonRef = doc(collection(db, 'lessons'));
      batch.set(lessonRef, lesson);
    });
    
    await batch.commit();
    console.log('Sample lessons seeded successfully!');
  } catch (error) {
    console.error('Error seeding lessons:', error);
    throw error;
  }
};

// Function to seed a sample team (optional)
export const seedSampleTeam = async (captainId: string): Promise<void> => {
  try {
    const teamData = {
      name: '750W',
      code: 'VRC750W',
      captainId: captainId,
      memberIds: [captainId],
      stats: {
        totalXP: 0,
        avgLevel: 1,
        totalLessons: 0,
        rank: 1
      },
      isPrivate: false,
      maxMembers: 6,
      description: 'A competitive VEX team focused on innovation and excellence.',
      createdAt: new Date(),
      updatedAt: new Date(),
      assignedLessons: []
    };
    
    const teamRef = doc(collection(db, 'teams'));
    await setDoc(teamRef, teamData);
    
    console.log('Sample team created successfully!');
  } catch (error) {
    console.error('Error creating sample team:', error);
    throw error;
  }
};