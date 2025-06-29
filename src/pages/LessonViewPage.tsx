import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  BookOpen, 
  CheckCircle, 
  Play,
  Pause,
  RotateCcw,
  Trophy,
  Star
} from 'lucide-react';

const LessonViewPage: React.FC = () => {
  const { id } = useParams();
  const [currentSection, setCurrentSection] = useState(0);
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  // Mock lesson data
  const lesson = {
    id: id,
    title: 'Introduction to VEX Robotics',
    description: 'Learn the fundamentals of VEX robotics, including basic components and assembly.',
    duration: '30 min',
    difficulty: 'Beginner',
    sections: [
      {
        title: 'What is VEX Robotics?',
        content: `VEX Robotics is an educational robotics platform designed to provide students with hands-on experience in STEM fields. The VEX system uses metal and plastic components that can be assembled into various robot configurations.

        Key benefits of VEX Robotics include:
        • Develops problem-solving skills
        • Teaches engineering principles
        • Builds teamwork and collaboration
        • Prepares students for real-world challenges

        The VEX system is used in classrooms and competitions worldwide, making it one of the most popular educational robotics platforms available today.`,
        timeSpent: 0
      },
      {
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
        timeSpent: 0
      },
      {
        title: 'Building Your First Robot',
        content: `Now let's walk through building a simple VEX robot step by step:

        **Step 1: Planning**
        Before building, always plan your robot design. Consider:
        • What task will your robot perform?
        • What components do you need?
        • How will the parts fit together?

        **Step 2: Building the Chassis**
        Start with a sturdy base using metal beams. The chassis is the foundation of your robot and needs to be strong enough to support all other components.

        **Step 3: Adding Movement**
        Attach motors and wheels to your chassis. Most basic robots use a differential drive system with two motors controlling left and right wheels.

        **Step 4: Installing the Brain**
        Mount the VEX Brain securely to your chassis and connect the motors using the appropriate cables.`,
        timeSpent: 0
      }
    ],
    quiz: {
      question: 'What is the main control unit in a VEX robotics system?',
      options: [
        'VEX Motor',
        'VEX Brain',
        'VEX Sensor',
        'VEX Wheel'
      ],
      correctAnswer: 1,
      explanation: 'The VEX Brain is the main control unit that processes your program and controls all the robot\'s components.'
    }
  };

  const handleQuizAnswer = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    setShowResult(true);
  };

  const completeLesson = () => {
    // In a real app, this would update the user's progress
    console.log('Lesson completed!');
  };

  if (!lesson) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Lesson not found</h1>
          <Link to="/lessons" className="text-primary-600 hover:text-primary-700 mt-4 inline-block">
            ← Back to lessons
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link 
          to="/lessons" 
          className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to lessons
        </Link>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{lesson.title}</h1>
              <p className="text-gray-600">{lesson.description}</p>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{lesson.duration}</span>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                {lesson.difficulty}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{Math.round(((currentSection + (isQuizMode ? 1 : 0)) / (lesson.sections.length + 1)) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${((currentSection + (isQuizMode ? 1 : 0)) / (lesson.sections.length + 1)) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Section Navigation */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {lesson.sections.map((section, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentSection(index);
                  setIsQuizMode(false);
                }}
                className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                  currentSection === index && !isQuizMode
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {index + 1}. {section.title}
              </button>
            ))}
            <button
              onClick={() => setIsQuizMode(true)}
              className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                isQuizMode
                  ? 'bg-accent-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Quiz
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        {!isQuizMode ? (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {lesson.sections[currentSection].title}
            </h2>
            <div className="prose max-w-none">
              {lesson.sections[currentSection].content.split('\n\n').map((paragraph, index) => {
                if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                  return (
                    <h3 key={index} className="text-lg font-semibold text-gray-900 mt-6 mb-3">
                      {paragraph.replace(/\*\*/g, '')}
                    </h3>
                  );
                } else if (paragraph.includes('•')) {
                  const lines = paragraph.split('\n');
                  return (
                    <div key={index} className="mb-4">
                      {lines[0] && <p className="mb-2">{lines[0]}</p>}
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        {lines.slice(1).map((line, lineIndex) => 
                          line.trim().startsWith('•') && (
                            <li key={lineIndex}>{line.replace('•', '').trim()}</li>
                          )
                        )}
                      </ul>
                    </div>
                  );
                } else {
                  return (
                    <p key={index} className="text-gray-700 leading-relaxed mb-4">
                      {paragraph}
                    </p>
                  );
                }
              })}
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Knowledge Check</h2>
            <div className="bg-blue-50 p-6 rounded-lg mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">{lesson.quiz.question}</h3>
              <div className="space-y-3">
                {lesson.quiz.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuizAnswer(index)}
                    disabled={showResult}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      showResult
                        ? index === lesson.quiz.correctAnswer
                          ? 'border-green-500 bg-green-50 text-green-800'
                          : index === selectedAnswer && index !== lesson.quiz.correctAnswer
                          ? 'border-red-500 bg-red-50 text-red-800'
                          : 'border-gray-200 bg-gray-50 text-gray-600'
                        : selectedAnswer === index
                        ? 'border-primary-500 bg-primary-50 text-primary-800'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="mr-3 w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm">
                        {String.fromCharCode(65 + index)}
                      </span>
                      {option}
                      {showResult && index === lesson.quiz.correctAnswer && (
                        <CheckCircle className="ml-auto w-5 h-5 text-green-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
              {showResult && (
                <div className="mt-4 p-4 bg-white rounded-lg border">
                  <h4 className="font-medium text-gray-900 mb-2">Explanation:</h4>
                  <p className="text-gray-700">{lesson.quiz.explanation}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => {
            if (isQuizMode) {
              setIsQuizMode(false);
              setCurrentSection(lesson.sections.length - 1);
            } else if (currentSection > 0) {
              setCurrentSection(currentSection - 1);
            }
          }}
          disabled={currentSection === 0 && !isQuizMode}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <BookOpen className="w-4 h-4" />
          <span>
            {isQuizMode ? 'Quiz' : `Section ${currentSection + 1} of ${lesson.sections.length}`}
          </span>
        </div>

        {!isQuizMode && currentSection < lesson.sections.length - 1 ? (
          <button
            onClick={() => setCurrentSection(currentSection + 1)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <span>Next</span>
            <ArrowLeft className="w-4 h-4 rotate-180" />
          </button>
        ) : !isQuizMode && currentSection === lesson.sections.length - 1 ? (
          <button
            onClick={() => setIsQuizMode(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700"
          >
            <span>Take Quiz</span>
            <Trophy className="w-4 h-4" />
          </button>
        ) : isQuizMode && showResult ? (
          <button
            onClick={completeLesson}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <span>Complete Lesson</span>
            <Star className="w-4 h-4" />
          </button>
        ) : (
          <div></div>
        )}
      </div>
    </div>
  );
};

export default LessonViewPage;