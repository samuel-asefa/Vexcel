import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  BookOpen, 
  Users, 
  Trophy, 
  Target, 
  Lightbulb,
  ArrowRight,
  CheckCircle,
  Star,
  TrendingUp,
  Code,
  Brain,
  Rocket
} from 'lucide-react';

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { isDark } = useTheme();

  const features = [
    {
      icon: BookOpen,
      title: 'Interactive Lessons',
      description: 'Comprehensive VEX robotics curriculum with hands-on activities and real-world applications.',
      gradient: 'from-blue-600 to-blue-800'
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Join teams, track progress, and learn together with captains monitoring your journey.',
      gradient: 'from-indigo-600 to-blue-700'
    },
    {
      icon: Trophy,
      title: 'Gamified Learning',
      description: 'Earn XP, unlock achievements, and compete in duels to make learning engaging and fun.',
      gradient: 'from-yellow-500 to-orange-500'
    },
    {
      icon: Target,
      title: 'Progress Tracking',
      description: 'Detailed analytics on lesson completion, quiz scores, and time spent learning.',
      gradient: 'from-green-500 to-emerald-500'
    }
  ];

  const stats = [
    { label: 'Active Students', value: '2,500+', icon: Users, gradient: 'from-blue-600 to-blue-800' },
    { label: 'Lessons Available', value: '150+', icon: BookOpen, gradient: 'from-indigo-600 to-blue-700' },
    { label: 'Teams Formed', value: '200+', icon: Trophy, gradient: 'from-yellow-500 to-orange-500' },
    { label: 'Success Rate', value: '94%', icon: TrendingUp, gradient: 'from-green-500 to-emerald-500' }
  ];

  const learningPath = [
    {
      step: '01',
      title: 'Foundation',
      description: 'Start with VEX basics, components, and fundamental concepts',
      lessons: 12,
      icon: Lightbulb,
      gradient: 'from-blue-600 to-blue-800'
    },
    {
      step: '02',
      title: 'Programming',
      description: 'Learn VEX coding, sensors, and autonomous programming',
      lessons: 18,
      icon: Code,
      gradient: 'from-indigo-600 to-blue-700'
    },
    {
      step: '03',
      title: 'Competition',
      description: 'Advanced strategies, team coordination, and competition prep',
      lessons: 15,
      icon: Rocket,
      gradient: 'from-blue-700 to-indigo-800'
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-blue-700/10 to-indigo-600/10 dark:from-blue-600/20 dark:via-blue-700/20 dark:to-indigo-600/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <img 
                  src="../../dist/assets/favicon.png" 
                  alt="Vexcel Logo" 
                  className="w-12 h-12 object-contain"
                />
              </div>
            </div>
            <h1 className="text-5xl sm:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Master VEX Robotics
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Like Never Before
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Make VEX learning engaging, effective, and collaborative with interactive lessons, 
              team progress tracking, and gamified experiences that motivate students to excel.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="group bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <button className="group bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 shadow-xl hover:shadow-2xl transform hover:-translate-y-1">
                  <span>Start Learning Free</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
              <Link
                to="/lessons"
                className="group border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 px-8 py-4 rounded-xl font-semibold transition-all duration-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                Browse Lessons
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-20 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center group">
                  <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${stat.gradient} rounded-2xl mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-1`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{stat.value}</div>
                  <div className="text-gray-600 dark:text-gray-400 font-medium">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Everything You Need to Excel
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Our comprehensive platform combines the best of interactive learning, 
              team collaboration, and gamification to make VEX education engaging and effective.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="group bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-2xl border border-gray-100 dark:border-gray-700 transition-all duration-300 transform hover:-translate-y-2">
                  <div className={`w-14 h-14 bg-gradient-to-r ${feature.gradient} rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Learning Path Section */}
      <div className="py-24 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Your Learning Journey
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Follow a structured path from beginner to expert with our comprehensive curriculum.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {learningPath.map((phase, index) => {
              const Icon = phase.icon;
              return (
                <div key={index} className="relative group">
                  <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-2xl border border-gray-100 dark:border-gray-700 transition-all duration-300 transform hover:-translate-y-2">
                    <div className="text-6xl font-bold text-gray-200 dark:text-gray-700 mb-4">{phase.step}</div>
                    <div className="flex items-center space-x-4 mb-6">
                      <div className={`w-12 h-12 bg-gradient-to-r ${phase.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{phase.title}</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">{phase.description}</p>
                    <div className="flex items-center space-x-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                      <BookOpen className="w-4 h-4" />
                      <span>{phase.lessons} lessons</span>
                    </div>
                  </div>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded-full flex items-center justify-center shadow-lg z-10">
                      <ArrowRight className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to Transform Your VEX Learning?
          </h2>
          <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto leading-relaxed">
            Join thousands of students and teams already using Vexcel to master VEX robotics 
            and achieve their competition goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Link
                to="/lessons"
                className="group bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
              >
                <span>Continue Learning</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <button className="group bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 shadow-xl hover:shadow-2xl transform hover:-translate-y-1">
                <span>Get Started Free</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;