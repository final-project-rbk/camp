'use client';
import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import { BookOpen, PlusCircle, Pencil, Trash2, TrendingUp, Eye, Search, Clock, Flame, Home, Utensils, Backpack, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getAllHints, createHint, updateHint, deleteHint, Hint } from '@/services/hintsService';
import { Toaster, toast } from 'react-hot-toast';

const DIFFICULTY_COLORS = {
  beginner: 'bg-green-500',
  intermediate: 'bg-yellow-500',
  advanced: 'bg-red-500'
};

const CATEGORY_ICONS = {
  fire: Flame,
  shelter: Home,
  food: Utensils,
  gear: Backpack
};

export default function HintsDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [sortBy, setSortBy] = useState('title');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [hints, setHints] = useState<Hint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingHint, setEditingHint] = useState<Hint | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const categories = ['fire', 'shelter', 'food', 'gear'] as const;
  const difficulties = ['beginner', 'intermediate', 'advanced'] as const;
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Use useCallback to memoize the fetchHints function
  const fetchHints = useCallback(async () => {
    try {
      setRefreshing(true);
      // Add cache-busting parameter by passing timestamp
      const data = await getAllHints({ _t: Date.now() });
      setHints(data);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch hints:', error);
      setError('Failed to load hints. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch hints on component mount and set up auto-refresh
  useEffect(() => {
    fetchHints();
    
    // Set up polling every 30 seconds for live updates
    const interval = setInterval(() => {
      fetchHints();
    }, 30000);
    
    // Clean up on unmount
    return () => clearInterval(interval);
  }, [fetchHints]);

  const filteredHints = hints
    .filter(hint => 
      hint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hint.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(hint => selectedCategory === 'all' || hint.category === selectedCategory)
    .filter(hint => selectedDifficulty === 'all' || hint.difficulty === selectedDifficulty)
    .sort((a, b) => {
      switch (sortBy) {
        case 'views':
          return b.views - a.views;
        case 'difficulty':
          return difficulties.indexOf(a.difficulty) - difficulties.indexOf(b.difficulty);
        case 'time':
          return parseInt(a.timeToComplete) - parseInt(b.timeToComplete);
        default:
          return a.title.localeCompare(b.title);
      }
    });

  const viewsData = hints.map(hint => ({
    name: hint.title.substring(0, 20) + (hint.title.length > 20 ? '...' : ''),
    views: hint.views
  }));

  const categoryData = categories.map(category => ({
    name: category,
    value: hints.filter(h => h.category === category).length
  }));

  const CATEGORY_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];

  const handleAddHint = async (newHint: Omit<Hint, 'id' | 'views'>) => {
    try {
      setIsSubmitting(true);
      const hint = await createHint(newHint);
      setHints([...hints, hint]);
      setShowAddModal(false);
      toast.success('Hint added successfully!');
    } catch (error) {
      console.error('Error adding hint:', error);
      toast.error('Failed to add hint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditHint = async (hint: Hint) => {
    try {
      setIsSubmitting(true);
      const updatedHint = await updateHint(hint);
      const updatedHints = hints.map((h) => (h.id === hint.id ? updatedHint : h));
      setHints(updatedHints);
      setEditingHint(null);
      toast.success('Hint updated successfully!');
    } catch (error) {
      console.error('Error updating hint:', error);
      toast.error('Failed to update hint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteHint = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this hint?')) {
      try {
        setLoading(true);
        await deleteHint(id);
        setHints(hints.filter((hint) => hint.id !== id));
        toast.success('Hint deleted successfully!');
      } catch (error) {
        console.error('Error deleting hint:', error);
        toast.error('Failed to delete hint. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const StatCard = ({ title, value, icon: Icon }: { title: string; value: number; icon: any }) => (
    <div className="bg-[#1E293B] p-6 rounded-lg border border-gray-700" style={{ backgroundColor: 'rgba(100, 255, 218, 0.1)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
      <div className="flex items-center gap-3 mb-2">
        <Icon size={24} className="text-[#64FFDA]" />
        <h3 className="text-gray-400 font-medium" style={{ color: '#8892B0' }}>{title}</h3>
      </div>
      <p className="text-3xl font-bold text-white" style={{ color: '#CCD6F6' }}>{value.toLocaleString()}</p>
    </div>
  );

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#0A192F' }}>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#112240',
            color: '#CCD6F6',
            border: '1px solid rgba(100, 255, 218, 0.2)'
          },
          success: {
            iconTheme: {
              primary: '#64FFDA',
              secondary: '#0A192F',
            },
          },
          error: {
            iconTheme: {
              primary: '#FF6B6B',
              secondary: '#0A192F',
            },
          }
        }}
      />
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className={`flex-1 ${isSidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300 ease-in-out p-6`}>
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: '#64FFDA' }}>
              Hints Dashboard
            </h1>
            <p className="mt-1" style={{ color: '#8892B0' }}>
              Manage all your survival hints here
            </p>
          </div>
          
          {/* Add manual refresh button */}
          <button
            onClick={fetchHints}
            disabled={refreshing}
            className="px-4 py-2 rounded-lg flex items-center gap-2 transition-all hover:opacity-90"
            style={{
              backgroundColor: '#64FFDA',
              color: '#0A192F',
            }}
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </header>

        {/* Show error message if there's an error */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-900 bg-opacity-20 border border-red-700">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Show loading indicator */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#64FFDA]"></div>
          </div>
        )}

        {!loading && (
          <>
            {/* Overview Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatCard 
                title="Total Hints" 
                value={hints.length}
                icon={BookOpen}
              />
              <StatCard 
                title="Total Views" 
                value={hints.reduce((sum, hint) => sum + hint.views, 0)}
                icon={Eye}
              />
              <StatCard 
                title="Most Popular Views" 
                value={hints.length > 0 ? Math.max(...hints.map(hint => hint.views)) : 0}
                icon={TrendingUp}
              />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="p-6 rounded-lg border" style={{ backgroundColor: 'rgba(17, 34, 64, 0.6)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                <h3 className="text-lg font-semibold mb-4" style={{ color: '#CCD6F6' }}>Views Distribution</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={viewsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#112240',
                          border: '1px solid #1E2D3D',
                          borderRadius: '0.5rem',
                          color: '#CCD6F6'
                        }}
                      />
                      <Area type="monotone" dataKey="views" stroke="#64FFDA" fill="#64FFDA" fillOpacity={0.2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="p-6 rounded-lg border" style={{ backgroundColor: 'rgba(17, 34, 64, 0.6)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                <h3 className="text-lg font-semibold mb-4" style={{ color: '#CCD6F6' }}>Hints by Category</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#112240',
                          border: '1px solid #1E2D3D',
                          borderRadius: '0.5rem',
                          color: '#CCD6F6'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Filtering and Controls */}
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search hints..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full rounded-lg focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: '#CCD6F6',
                      borderColor: 'rgba(255, 255, 255, 0.1)'
                    }}
                  />
                </div>
                <div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: '#CCD6F6',
                      borderColor: 'rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: '#CCD6F6',
                      borderColor: 'rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <option value="all">All Difficulties</option>
                    {difficulties.map(difficulty => (
                      <option key={difficulty} value={difficulty}>{difficulty}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="w-full px-4 py-2 rounded-lg flex items-center gap-2 justify-center transition-colors hover:opacity-90"
                    style={{
                      backgroundColor: '#64FFDA',
                      color: '#0A192F',
                    }}
                  >
                    <PlusCircle size={20} />
                    Add New Hint
                  </button>
                </div>
              </div>
            </div>

            {/* Hints Table - Show message if no hints */}
            {filteredHints.length === 0 ? (
              <div className="p-8 text-center rounded-lg" style={{ backgroundColor: 'rgba(17, 34, 64, 0.6)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                <p style={{ color: '#8892B0' }}>No hints found. Try adjusting your filters or add a new hint.</p>
              </div>
            ) : (
              <div className="rounded-lg shadow overflow-hidden" style={{ backgroundColor: 'rgba(17, 34, 64, 0.6)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                <table className="min-w-full">
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(100, 255, 218, 0.1)' }}>
                      <th className="px-6 py-3 text-left text-xs font-medium" style={{ color: '#64FFDA' }}>Image</th>
                      <th className="px-6 py-3 text-left text-xs font-medium" style={{ color: '#64FFDA' }}>Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium" style={{ color: '#64FFDA' }}>Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium" style={{ color: '#64FFDA' }}>Difficulty</th>
                      <th className="px-6 py-3 text-left text-xs font-medium" style={{ color: '#64FFDA' }}>Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium" style={{ color: '#64FFDA' }}>Views</th>
                      <th className="px-6 py-3 text-left text-xs font-medium" style={{ color: '#64FFDA' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredHints.map((hint) => {
                      const CategoryIcon = CATEGORY_ICONS[hint.category];
                      return (
                        <tr key={hint.id} className="border-t border-gray-700" style={{ color: '#8892B0' }}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <img src={hint.image} alt={hint.title} className="w-16 h-16 rounded-lg object-cover" />
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium" style={{ color: '#CCD6F6' }}>{hint.title}</div>
                            <div className="text-sm" style={{ color: '#8892B0' }}>{hint.description}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <CategoryIcon size={16} className="text-[#64FFDA]" />
                              <span className="capitalize" style={{ color: '#CCD6F6' }}>{hint.category}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-sm ${DIFFICULTY_COLORS[hint.difficulty]} bg-opacity-20 text-white`}>
                              {hint.difficulty}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap" style={{ color: '#CCD6F6' }}>
                            {hint.timeToComplete}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap" style={{ color: '#CCD6F6' }}>
                            <div className="flex items-center gap-1">
                              <Eye size={14} className="text-[#64FFDA]" />
                              {hint.views}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setEditingHint(hint)}
                                className="p-1 rounded hover:bg-gray-700"
                              >
                                <Pencil size={16} className="text-[#64FFDA]" />
                              </button>
                              <button
                                onClick={() => handleDeleteHint(hint.id)}
                                className="p-1 rounded hover:bg-gray-700"
                              >
                                <Trash2 size={16} className="text-red-400" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Add/Edit Modal */}
        {(showAddModal || editingHint) && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-[#112240] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-4" style={{ color: '#64FFDA' }}>
                  {editingHint ? 'Edit Hint' : 'Add New Hint'}
                </h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    
                    // Start with empty gallery steps
                    let gallerySteps = [];
                    
                    // Try to parse gallery steps from form
                    try {
                      const galleryStepsText = formData.get('gallerySteps') as string;
                      if (galleryStepsText && galleryStepsText.trim() !== '') {
                        gallerySteps = JSON.parse(galleryStepsText);
                      }
                    } catch (error) {
                      console.error('Error parsing gallery steps:', error);
                      alert('Invalid JSON format for gallery steps. Please check and try again.');
                      return;
                    }
                    
                    const hintData = {
                      title: formData.get('title') as string,
                      description: formData.get('description') as string,
                      category: formData.get('category') as 'fire' | 'shelter' | 'food' | 'gear',
                      difficulty: formData.get('difficulty') as 'beginner' | 'intermediate' | 'advanced',
                      timeToComplete: formData.get('timeToComplete') as string,
                      image: formData.get('image') as string,
                      gallerySteps
                    };
                    
                    if (editingHint) {
                      handleEditHint({ ...hintData, id: editingHint.id, views: editingHint.views });
                    } else {
                      handleAddHint(hintData);
                    }
                  }}
                >
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#CCD6F6' }}>
                        Title
                      </label>
                      <input
                        type="text"
                        name="title"
                        defaultValue={editingHint?.title}
                        className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: '#CCD6F6',
                          borderColor: 'rgba(255, 255, 255, 0.1)'
                        }}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#CCD6F6' }}>
                        Description
                      </label>
                      <textarea
                        name="description"
                        defaultValue={editingHint?.description}
                        className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: '#CCD6F6',
                          borderColor: 'rgba(255, 255, 255, 0.1)'
                        }}
                        required
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#CCD6F6' }}>
                          Category
                        </label>
                        <select
                          name="category"
                          defaultValue={editingHint?.category}
                          className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2"
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            color: '#CCD6F6',
                            borderColor: 'rgba(255, 255, 255, 0.1)'
                          }}
                          required
                        >
                          {categories.map(category => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#CCD6F6' }}>
                          Difficulty
                        </label>
                        <select
                          name="difficulty"
                          defaultValue={editingHint?.difficulty}
                          className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2"
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            color: '#CCD6F6',
                            borderColor: 'rgba(255, 255, 255, 0.1)'
                          }}
                          required
                        >
                          {difficulties.map(difficulty => (
                            <option key={difficulty} value={difficulty}>{difficulty}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#CCD6F6' }}>
                        Time to Complete
                      </label>
                      <input
                        type="text"
                        name="timeToComplete"
                        defaultValue={editingHint?.timeToComplete}
                        placeholder="e.g., 30 minutes"
                        className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: '#CCD6F6',
                          borderColor: 'rgba(255, 255, 255, 0.1)'
                        }}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#CCD6F6' }}>
                        Image URL
                      </label>
                      <input
                        type="url"
                        name="image"
                        defaultValue={editingHint?.image}
                        className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: '#CCD6F6',
                          borderColor: 'rgba(255, 255, 255, 0.1)'
                        }}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#CCD6F6' }}>
                        Gallery Steps (JSON format)
                      </label>
                      <textarea
                        name="gallerySteps"
                        defaultValue={editingHint?.gallerySteps ? JSON.stringify(editingHint.gallerySteps, null, 2) : '[]'}
                        className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 font-mono text-sm"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: '#CCD6F6',
                          borderColor: 'rgba(255, 255, 255, 0.1)'
                        }}
                        rows={5}
                        placeholder='[
  { 
    "title": "Step 1", 
    "description": "First step description", 
    "image": "https://example.com/image1.jpg" 
  },
  { 
    "title": "Step 2", 
    "description": "Second step description", 
    "image": "https://example.com/image2.jpg" 
  }
]'
                      />
                      <p className="text-xs mt-1" style={{ color: '#8892B0' }}>
                        Enter an array of steps with title, description, and image properties.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        setEditingHint(null);
                      }}
                      className="px-4 py-2 text-gray-400 hover:text-white"
                      style={{ color: '#8892B0' }}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg transition-colors hover:opacity-90 flex items-center gap-2"
                      style={{
                        backgroundColor: '#64FFDA',
                        color: '#0A192F',
                      }}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-[#0A192F] border-l-transparent rounded-full"></div>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <span>{editingHint ? 'Save Changes' : 'Add Hint'}</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 