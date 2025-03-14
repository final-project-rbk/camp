'use client';
import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { BookOpen, PlusCircle, Pencil, Trash2, TrendingUp, Eye, Search, Clock, Flame, Home, Utensils, Backpack } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Hint {
  id: number;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  timeToComplete: string;
  image: string;
  gallerySteps?: { title: string; description: string; image: string }[];
  views: number;
  category: 'fire' | 'shelter' | 'food' | 'gear';
}

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
  const [hints, setHints] = useState<Hint[]>([
    {
      id: 1,
      title: 'Starting a Fire with Flint',
      description: 'Learn the basics of fire starting using flint and steel.',
      difficulty: 'beginner',
      timeToComplete: '15 minutes',
      image: 'https://images.unsplash.com/photo-1542396601-dca920ea2807?w=800',
      views: 1200,
      category: 'fire',
      gallerySteps: [
        {
          title: 'Gather Materials',
          description: 'Collect your flint, steel, and tinder.',
          image: 'https://images.unsplash.com/photo-1542396601-dca920ea2807?w=400'
        }
      ]
    },
    {
      id: 2,
      title: 'Building a Basic Shelter',
      description: 'Essential shelter building techniques for survival.',
      difficulty: 'intermediate',
      timeToComplete: '45 minutes',
      image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800',
      views: 890,
      category: 'shelter'
    },
    {
      id: 3,
      title: 'Advanced Gear Maintenance',
      description: 'Keep your survival gear in top condition.',
      difficulty: 'advanced',
      timeToComplete: '30 minutes',
      image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800',
      views: 2300,
      category: 'gear'
    },
  ]);

  const [editingHint, setEditingHint] = useState<Hint | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const categories = ['fire', 'shelter', 'food', 'gear'] as const;
  const difficulties = ['beginner', 'intermediate', 'advanced'] as const;
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

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

  const handleAddHint = (newHint: Omit<Hint, 'id' | 'views'>) => {
    const hint = {
      ...newHint,
      id: hints.length + 1,
      views: 0
    };
    setHints([...hints, hint]);
    setShowAddModal(false);
  };

  const handleEditHint = (hint: Hint) => {
    const updatedHints = hints.map((h) => (h.id === hint.id ? hint : h));
    setHints(updatedHints);
    setEditingHint(null);
  };

  const handleDeleteHint = (id: number) => {
    setHints(hints.filter((hint) => hint.id !== id));
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
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className={`flex-1 ${isSidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300 ease-in-out p-6`}>
        <header className="mb-8">
          <h1 className="text-3xl font-bold" style={{ color: '#64FFDA' }}>
            Hints Dashboard
          </h1>
          <p className="mt-1" style={{ color: '#8892B0' }}>
            Manage all your survival hints here
          </p>
        </header>

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
            value={Math.max(...hints.map(hint => hint.views))}
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
                  <Area type="monotone" dataKey="views" stroke="#64FFDA" fill="rgba(100, 255, 218, 0.2)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-6 rounded-lg border" style={{ backgroundColor: 'rgba(17, 34, 64, 0.6)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: '#CCD6F6' }}>Category Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
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
            <div className="flex flex-wrap gap-4 mt-4 justify-center">
              {categories.map((category, index) => (
                <div key={category} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[index] }} />
                  <span className="text-gray-300 capitalize" style={{ color: '#8892B0' }}>{category}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Advanced Search and Filters */}
        <div className="p-6 rounded-lg mb-6" style={{ backgroundColor: 'rgba(17, 34, 64, 0.6)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
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

        {/* Hints Table */}
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-gray-400" />
                        <span style={{ color: '#CCD6F6' }}>{hint.timeToComplete}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Eye size={16} className="text-gray-400" />
                        <span style={{ color: '#CCD6F6' }}>{hint.views.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingHint(hint)}
                          className="text-[#64FFDA] hover:text-[#4CD8B9]"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteHint(hint.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Add/Edit Modal */}
        {(showAddModal || editingHint) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="p-6 rounded-lg w-[600px] max-h-[80vh] overflow-y-auto" style={{ backgroundColor: '#112240' }}>
              <h2 className="text-xl font-semibold mb-4" style={{ color: '#64FFDA' }}>
                {editingHint ? 'Edit Hint' : 'Add New Hint'}
              </h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const hintData = {
                    title: formData.get('title') as string,
                    description: formData.get('description') as string,
                    category: formData.get('category') as 'fire' | 'shelter' | 'food' | 'gear',
                    difficulty: formData.get('difficulty') as 'beginner' | 'intermediate' | 'advanced',
                    timeToComplete: formData.get('timeToComplete') as string,
                    image: formData.get('image') as string,
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
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg transition-colors hover:opacity-90"
                    style={{
                      backgroundColor: '#64FFDA',
                      color: '#0A192F',
                    }}
                  >
                    {editingHint ? 'Save Changes' : 'Add Hint'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 