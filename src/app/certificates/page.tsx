'use client';
// @ts-nocheck

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  Award,
  Download,
  CheckCircle,
  AlertCircle,
  TrendingUp
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function CertificatesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [certificateData, setCertificateData] = useState({
    overallProgress: 0,
    completed: [],
    inProgress: []
  });
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userData && token) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      loadCertificateData();
    } else {
      router.push('/login');
    }
  }, [router]);

  const loadCertificateData = async () => {
    try {
      setLoading(true);
      // Mock data - in a real app, this would fetch from an API
      const mockCertificateData = {
        overallProgress: 75, // 75% overall completion
        completed: [
          {
            id: '1',
            title: 'Agricultural Fundamentals Certificate',
            completedDate: 'March 15, 2024',
            score: 92,
            description: 'Comprehensive understanding of basic agricultural principles and practices.',
            issuer: 'AgriSkills Academy',
            validUntil: 'March 15, 2026'
          },
          {
            id: '2', 
            title: 'Crop Management Certificate',
            completedDate: 'February 28, 2024',
            score: 88,
            description: 'Advanced knowledge in crop planning, cultivation, and harvest management.',
            issuer: 'AgriSkills Academy',
            validUntil: 'February 28, 2026'
          },
          {
            id: '3',
            title: 'Soil Health & Nutrition Certificate',
            completedDate: 'January 20, 2024',
            score: 95,
            description: 'Expert understanding of soil composition, health assessment, and nutrition management.',
            issuer: 'AgriSkills Academy',
            validUntil: 'January 20, 2026'
          }
        ],
        inProgress: [
          {
            id: '4',
            title: 'Sustainable Farming Certificate',
            progress: 60,
            chaptersCompleted: 6,
            totalChapters: 10,
            description: 'Learn eco-friendly farming practices and sustainable agriculture techniques.',
            estimatedCompletion: 'April 2024'
          },
          {
            id: '5',
            title: 'Modern Agricultural Technology Certificate', 
            progress: 30,
            chaptersCompleted: 3,
            totalChapters: 10,
            description: 'Master the latest agricultural technologies, IoT, and precision farming tools.',
            estimatedCompletion: 'May 2024'
          },
          {
            id: '6',
            title: 'Organic Farming Certification',
            progress: 15,
            chaptersCompleted: 2,
            totalChapters: 12,
            description: 'Complete certification in organic farming methods and certification processes.',
            estimatedCompletion: 'June 2024'
          }
        ]
      };
      setCertificateData(mockCertificateData);
    } catch (error) {
      console.error('Failed to load certificate data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCertificate = async (certificate: any) => {
    try {
      setDownloadingId(certificate.id);
      const certificateData = {
        studentName: user?.name || 'Student Name',
        courseName: certificate.title,
        score: certificate.score,
        date: certificate.completedDate,
        issuer: certificate.issuer
      };

      const response = await fetch('/api/certificates/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ certificateData })
      });

      const result = await response.json();

      if (result.success) {
        // Create download link
        const link = document.createElement('a');
        link.href = result.pdf;
        link.download = `${certificate.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_certificate.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        console.error('Failed to generate certificate:', result.error);
        alert('Failed to generate certificate. Please try again.');
      }
    } catch (error) {
      console.error('Error downloading certificate:', error);
      alert('Error downloading certificate. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50">
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Back Button */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard/user')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>

          <div className="flex items-center gap-3 mb-2">
            <Award className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">Your Certificates</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Track your learning progress and download your certificates
          </p>
        </div>

        {/* Overall Progress Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-8 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-green-700" />
              <h2 className="text-2xl font-semibold text-gray-900">Overall Certification Progress</h2>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{certificateData.overallProgress}%</div>
              <div className="text-sm text-gray-600">Complete</div>
            </div>
          </div>
          
          <div className="w-full h-4 bg-white border border-amber-200 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-1000 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, certificateData.overallProgress || 0))}%` }}
            />
          </div>
          
          <div className="flex justify-between text-sm text-gray-700">
            <span>{certificateData.completed.length} certificates completed</span>
            <span>{certificateData.inProgress.length} in progress</span>
          </div>
        </motion.div>

        {/* Completed Certificates */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-6">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900">Completed Certificates</h2>
            <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
              {certificateData.completed.length}
            </span>
          </div>

          {certificateData.completed?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certificateData.completed.map((cert: any, index: number) => (
                <motion.div
                  key={cert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                  className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300"
                >
                  {/* Certificate Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Award className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-green-600">Score: {cert.score}%</div>
                      <div className="text-xs text-gray-500">Completed</div>
                    </div>
                  </div>

                  {/* Certificate Info */}
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                    {cert.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {cert.description}
                  </p>

                  {/* Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Completed:</span>
                      <span className="font-medium text-gray-900">{cert.completedDate}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Issuer:</span>
                      <span className="font-medium text-gray-900">{cert.issuer}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Valid until:</span>
                      <span className="font-medium text-gray-900">{cert.validUntil}</span>
                    </div>
                  </div>

                  {/* Download Button */}
                  <button
                    onClick={() => handleDownloadCertificate(cert)}
                    disabled={downloadingId === cert.id}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {downloadingId === cert.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Download Certificate
                      </>
                    )}
                  </button>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No completed certificates yet</h3>
              <p className="text-gray-600 mb-6">Complete courses and pass quizzes to earn your first certificate!</p>
              <button
                onClick={() => router.push('/dashboard/user')}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Start Learning
              </button>
            </div>
          )}
        </motion.section>

        {/* In-Progress Certificates */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-6">
            <Award className="w-6 h-6 text-amber-600" />
            <h2 className="text-2xl font-bold text-gray-900">Certificates In Progress</h2>
            <span className="bg-amber-100 text-amber-800 text-sm font-medium px-3 py-1 rounded-full">
              {certificateData.inProgress.length}
            </span>
          </div>

          {certificateData.inProgress?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {certificateData.inProgress.map((prog: any, index: number) => (
                <motion.div
                  key={prog.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  {/* Progress Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                      <Award className="w-6 h-6 text-amber-600" />
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-amber-600">{prog.progress}%</div>
                      <div className="text-xs text-gray-500">Complete</div>
                    </div>
                  </div>

                  {/* Certificate Info */}
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {prog.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {prog.description}
                  </p>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Progress</span>
                      <span className="text-sm text-gray-600">
                        {Math.max(0, 100 - prog.progress)}% remaining
                      </span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, prog.progress || 0))}%` }}
                      />
                    </div>
                  </div>

                  {/* Chapter Progress */}
                  {typeof prog.chaptersCompleted === 'number' && typeof prog.totalChapters === 'number' && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Chapters completed:</span>
                        <span className="font-medium text-gray-900">
                          {prog.chaptersCompleted} of {prog.totalChapters}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Estimated Completion */}
                  <div className="flex items-center justify-between text-sm mb-4">
                    <span className="text-gray-500">Est. completion:</span>
                    <span className="font-medium text-gray-900">{prog.estimatedCompletion}</span>
                  </div>

                  {/* Continue Button */}
                  <button
                    onClick={() => router.push('/dashboard/user')}
                    className="w-full bg-amber-100 hover:bg-amber-200 text-amber-800 px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Continue Learning
                  </button>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No certificates in progress</h3>
              <p className="text-gray-600 mb-6">Start a course to begin working towards your next certificate!</p>
              <button
                onClick={() => router.push('/dashboard/user')}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Explore Courses
              </button>
            </div>
          )}
        </motion.section>
      </main>
    </div>
  );
}
