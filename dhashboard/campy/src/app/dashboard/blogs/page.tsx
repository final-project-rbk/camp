'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';

// Update this line to use the environment variable directly
const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Blog {
  id: number;
  title: string;
  content: string;
  image: string;
  likes: number;
  created_at: string;
  user: {
    first_name: string;
    last_name: string;
    profile_image: string;
  };
  comments: Comment[];
}

interface Comment {
  id: number;
  content: string;
  created_at: string;
  user: {
    first_name: string;
    last_name: string;
    profile_image: string;
  };
}

// Add new interface for detailed comment view
interface DetailedComment {
  id: number;
  content: string;
  created_at: string;
  user: {
    first_name: string;
    last_name: string;
    profile_image: string;
  };
}

export default function BlogManagement() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const fetchBlogs = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${API_URL}blogs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch blogs');
      const data = await response.json();
      setBlogs(data.data);
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to load blogs');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (blogId: number) => {
    if (!confirm('Are you sure you want to delete this blog?')) return;

    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${API_URL}blogs/${blogId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to delete blog');
      fetchBlogs(); // Refresh the list
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to delete blog');
    }
  };

  const handleBlogClick = (blog: Blog) => {
    setSelectedBlog(blog);
    setShowDetailModal(true);
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-[#0A192F]">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-[#64FFDA]"></div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#0A192F]">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className={`flex-1 p-6 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-[#64FFDA] mb-8">Blog Management</h1>
          
          <div className="grid gap-6">
            {blogs.map((blog) => (
              <div 
                key={blog.id} 
                className="bg-[#112240] rounded-lg p-6 shadow-lg cursor-pointer hover:bg-[#1D2D50] transition-colors"
                onClick={() => handleBlogClick(blog)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-[#CCD6F6] mb-2">{blog.title}</h2>
                    <div className="flex items-center space-x-2 text-[#8892B0]">
                      <img
                        src={blog.user.profile_image || 'https://via.placeholder.com/40'}
                        alt={`${blog.user.first_name}'s profile`}
                        className="w-8 h-8 rounded-full"
                      />
                      <span>{`${blog.user.first_name} ${blog.user.last_name}`}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDelete(blog.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                <div className="mb-4">
                  <img
                    src={blog.image}
                    alt={blog.title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
                
                <p className="text-[#8892B0] mb-4 line-clamp-3">{blog.content}</p>
                
                <div className="flex justify-between items-center text-[#8892B0]">
                  <div className="flex items-center space-x-4">
                    <span>❤️ {blog.likes} likes</span>
                    <span>💬 {blog.comments.length} comments</span>
                  </div>
                  <span>{new Date(blog.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Blog Detail Modal */}
      {showDetailModal && selectedBlog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0A192F] rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-[#64FFDA] hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Blog Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#64FFDA] mb-4">{selectedBlog.title}</h2>
              <div className="flex items-center space-x-3 text-[#8892B0] mb-4">
                <img
                  src={selectedBlog.user.profile_image || 'https://via.placeholder.com/40'}
                  alt={`${selectedBlog.user.first_name}'s profile`}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-semibold">{`${selectedBlog.user.first_name} ${selectedBlog.user.last_name}`}</p>
                  <p className="text-sm">{new Date(selectedBlog.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Blog Image */}
            <div className="mb-6">
              <img
                src={selectedBlog.image}
                alt={selectedBlog.title}
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>

            {/* Blog Content */}
            <div className="mb-8">
              <p className="text-[#CCD6F6] whitespace-pre-wrap">{selectedBlog.content}</p>
            </div>

            {/* Blog Stats */}
            <div className="flex items-center space-x-4 text-[#8892B0] mb-6">
              <span className="flex items-center space-x-2">
                <span>❤️</span>
                <span>{selectedBlog.likes} likes</span>
              </span>
              <span className="flex items-center space-x-2">
                <span>💬</span>
                <span>{selectedBlog.comments.length} comments</span>
              </span>
            </div>

            {/* Comments Section */}
            <div className="border-t border-[#1D2D50] pt-6">
              <h3 className="text-xl font-semibold text-[#64FFDA] mb-4">Comments</h3>
              <div className="space-y-4">
                {selectedBlog.comments.map((comment) => (
                  <div key={comment.id} className="bg-[#112240] rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-2">
                      <img
                        src={comment.user.profile_image || 'https://via.placeholder.com/32'}
                        alt={`${comment.user.first_name}'s profile`}
                        className="w-8 h-8 rounded-full"
                      />
                      <div>
                        <p className="text-[#CCD6F6] font-semibold">
                          {`${comment.user.first_name} ${comment.user.last_name}`}
                        </p>
                        <p className="text-sm text-[#8892B0]">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <p className="text-[#8892B0] ml-11">{comment.content}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => handleDelete(selectedBlog.id)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Delete Blog
              </button>
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-[#64FFDA] text-[#0A192F] rounded hover:opacity-90 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 