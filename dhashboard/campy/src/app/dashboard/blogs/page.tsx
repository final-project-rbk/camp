'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

interface Blog {
  id: number;
  title: string;
  content: string;
  image?: string;
  likes: number;
  createdAt: string;
  user: {
    first_name: string;
    last_name: string;
  };
  comments: {
    id: number;
    content: string;
    createdAt: string;
    user: {
      first_name: string;
      last_name: string;
    };
  }[];
}

export default function BlogManagement() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState<number | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [showDeleteCommentModal, setShowDeleteCommentModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const fetchBlogs = async () => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        router.push('/');
        return;
      }

      const response = await fetch(`${API_URL}blogs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch blogs');
      const data = await response.json();
      
      // Filter out blogs with invalid user data and sort them
      const validBlogs = data.data
        .filter((blog: Blog) => blog && blog.user)
        .sort((a: Blog, b: Blog) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      
      setBlogs(validBlogs);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      setError(error instanceof Error ? error.message : 'Failed to load blogs');
      setLoading(false);
    }
  };

  const handleDeleteClick = (blogId: number) => {
    setBlogToDelete(blogId);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!blogToDelete) return;

    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${API_URL}blogs/${blogToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to delete blog');
      await fetchBlogs();
      setShowDeleteModal(false);
      setBlogToDelete(null);
    } catch (error) {
      console.error('Error deleting blog:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete blog');
    }
  };

  const handleBlogClick = async (blogId: number) => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${API_URL}blogs/${blogId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch blog details');
      const data = await response.json();
      setSelectedBlog(data.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error fetching blog details:', error);
      setError(error instanceof Error ? error.message : 'Failed to load blog details');
    }
  };

  const handleDeleteComment = async () => {
    if (!commentToDelete || !selectedBlog) return;

    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        router.push('/');
        return;
      }

      console.log('Deleting comment:', commentToDelete);

      const response = await fetch(`${API_URL}blogs/${selectedBlog.id}/comments/${commentToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete comment');
        } else {
          throw new Error(`Server error: ${response.status}`);
        }
      }

      // Refresh the blog details after successful deletion
      const updatedBlogResponse = await fetch(`${API_URL}blogs/${selectedBlog.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!updatedBlogResponse.ok) {
        throw new Error('Failed to refresh blog details');
      }

      const updatedBlogData = await updatedBlogResponse.json();
      setSelectedBlog(updatedBlogData.data);
      setShowDeleteCommentModal(false);
      setCommentToDelete(null);

    } catch (error) {
      console.error('Error deleting comment:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete comment');
      setShowDeleteCommentModal(false);
      setCommentToDelete(null);
    }
  };

  const handleDeleteCommentClick = (commentId: number) => {
    setCommentToDelete(commentId);
    setShowDeleteCommentModal(true);
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  // Add useEffect to handle body scroll
  useEffect(() => {
    if (showDetailModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup function
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showDetailModal]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0A192F' }}>
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#0A192F' }}>
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <div className="p-8">
          <h1 className="text-2xl font-bold text-[#64FFDA] mb-6">Blog Management</h1>

          {error && (
            <div className="mb-4 p-4 bg-red-500 bg-opacity-10 text-red-400 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid gap-6">
            {blogs.map((blog) => (
              <div 
                key={blog.id} 
                className="bg-[#112240] rounded-lg p-6 shadow-lg hover:bg-[#1D2D50] transition-colors cursor-pointer relative"
                onClick={() => handleBlogClick(blog.id)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl text-[#CCD6F6] font-semibold mb-2">
                      {blog.title}
                    </h2>
                    <p className="text-[#8892B0] text-sm">
                      By {blog.user?.first_name || 'Unknown'} {blog.user?.last_name || ''}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(blog.id);
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </div>

                {blog.image && (
                  <img
                    src={blog.image}
                    alt={blog.title}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                )}

                <p className="text-[#CCD6F6] mb-4">{blog.content}</p>

                <div className="flex justify-between items-center text-sm text-[#8892B0]">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span>❤️</span>
                      <span>{blog.likes || 0} likes</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>💬</span>
                      <span>{blog.comments?.length || 0} Comments</span>
                    </div>
                  </div>
                  <span>Created: {new Date(blog.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Blog Detail Modal */}
      {showDetailModal && selectedBlog && (
        <div 
          className="fixed inset-0 z-50 overflow-hidden"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
        >
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div 
              className="bg-[#112240] rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-[#1D2D50]">
                <div className="flex justify-between items-start">
                  <h2 className="text-2xl font-bold text-[#64FFDA]">{selectedBlog.title}</h2>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-[#8892B0] hover:text-[#64FFDA]"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="mt-2 text-[#8892B0]">
                  By {selectedBlog.user.first_name} {selectedBlog.user.last_name} • {new Date(selectedBlog.createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {selectedBlog.image && (
                  <img
                    src={selectedBlog.image}
                    alt={selectedBlog.title}
                    className="w-full h-64 object-cover rounded-lg mb-4"
                  />
                )}

                <p className="text-[#CCD6F6] mb-6">{selectedBlog.content}</p>

                <div className="flex items-center mb-6">
                  <span className="text-[#8892B0]">❤️ {selectedBlog.likes} likes</span>
                </div>

                <div className="border-t border-[#1D2D50] pt-4">
                  <h3 className="text-xl font-bold text-[#64FFDA] mb-4">
                    Comments ({selectedBlog.comments.length})
                  </h3>
                  <div className="space-y-4">
                    {selectedBlog.comments.map((comment) => (
                      <div key={comment.id} className="bg-[#1D2D50] rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-[#CCD6F6] font-semibold">
                              {comment.user.first_name} {comment.user.last_name}
                            </div>
                            <div className="text-[#8892B0] text-sm">
                              {new Date(comment.createdAt).toLocaleString()}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setCommentToDelete(comment.id);
                              setShowDeleteCommentModal(true);
                            }}
                            className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                        <p className="text-[#CCD6F6] mt-2">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Comment Modal */}
      {showDeleteCommentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#112240] p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-xl text-[#64FFDA] font-semibold mb-4">
              Confirm Delete Comment
            </h3>
            <p className="text-[#CCD6F6] mb-6">
              Are you sure you want to delete this comment? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowDeleteCommentModal(false);
                  setCommentToDelete(null);
                }}
                className="px-4 py-2 bg-[#1D2D50] text-[#CCD6F6] rounded-lg hover:bg-opacity-80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteComment}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#112240] p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-xl text-[#64FFDA] font-semibold mb-4">
              Confirm Delete
            </h3>
            <p className="text-[#CCD6F6] mb-6">
              Are you sure you want to delete this blog? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setBlogToDelete(null);
                }}
                className="px-4 py-2 bg-[#1D2D50] text-[#CCD6F6] rounded-lg hover:bg-opacity-80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 