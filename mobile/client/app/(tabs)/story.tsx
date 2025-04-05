import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Modal, TextInput, Button, Alert, RefreshControl } from "react-native";
import { useState, useEffect } from "react";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { EXPO_PUBLIC_API_URL } from '../../config';
import { useRouter } from 'expo-router';
import React from "react";
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from "jwt-decode";
import AsyncStorage from '@react-native-async-storage/async-storage';
import TokenDebug from '../../components/TokenDebug';
import { useFocusEffect } from '@react-navigation/native';

// Add this constant at the top of the file, after the imports
const DEFAULT_PROFILE_IMAGE = 'https://johannesippen.com/img/blog/humans-not-users/header.jpg';

// Add interface for blog type
interface Comment {
    id: number;
    content: string;
    createdAt: string;
    user: {
        first_name: string;
        last_name: string;
    };
}

interface Blog {
    id: number;
    title: string;
    content: string;
    image: string;
    createdAt: string;
    likes: number;
    liked: boolean;
    user: {
        first_name: string;
        last_name: string;
        profile_image: string;
    };
}

export default function Story() {
    const router = useRouter();
    const [blogData, setBlogData] = useState<Blog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [newBlog, setNewBlog] = useState({
        title: '',
        content: '',
        image: '',
    });
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const [selectedBlogId, setSelectedBlogId] = useState<number | null>(null);
    const [updateModalVisible, setUpdateModalVisible] = useState(false);
    const [blogToUpdate, setBlogToUpdate] = useState<Blog | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const [userId, setUserId] = useState<number | null>(null);
    const [showOnlyMyPosts, setShowOnlyMyPosts] = useState(false);

    // Sort blogs by createdAt descending (newest first)
    const sortBlogs = (blogs: Blog[]) => {
        return blogs.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    };

    // Update getToken function with redirect option
    const getToken = async (shouldRedirect = false) => {
        try {
            const storedToken = await AsyncStorage.getItem('userToken');
            console.log('Token retrieval attempt in story.tsx:', storedToken ? 'Token found' : 'No token');
            
            if (storedToken) {
                setToken(storedToken);
                
                try {
                    const decoded = jwtDecode<{ id: number }>(storedToken);
                    console.log('Decoded token:', decoded);
                    
                    if (decoded && decoded.id) {
                        setUserId(decoded.id);
                        console.log('Token is valid, userId set to:', decoded.id);
                        return true;
                    } else {
                        console.warn('Token format issue: no ID in decoded token');
                        if (shouldRedirect) router.replace('/auth');
                        return false;
                    }
                } catch (decodeError) {
                    console.error('Error decoding token:', decodeError);
                    if (shouldRedirect) router.replace('/auth');
                    return false;
                }
            } else {
                console.log('No token found in AsyncStorage');
                if (shouldRedirect) router.replace('/auth');
                return false;
            }
        } catch (error) {
            console.error('Error in getToken:', error);
            if (shouldRedirect) router.replace('/auth');
            return false;
        }
    };

    // Fetch blogs
    const fetchBlogData = async () => {
        try {
            console.log('Starting fetchBlogData');
            
            // Directly retrieve token from AsyncStorage instead of relying on state
            const storedToken = await AsyncStorage.getItem('userToken');
            
            if (!storedToken) {
                console.log('No token in AsyncStorage');
                setLoading(false);
                router.replace('/auth');
                return;
            }
            
            console.log(`Fetching blogs with direct token: ${storedToken.substring(0, 15)}...`);
            
            setLoading(true);
            
            const response = await fetch(`${EXPO_PUBLIC_API_URL}blogs/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${storedToken}`,
                    'Cache-Control': 'no-cache'
                }
            });
            
            console.log('Response status:', response.status);
            
            if (response.status === 401) {
                console.log('Auth failed (401) during blog fetch');
                await AsyncStorage.removeItem('userToken');
                setLoading(false);
                router.replace('/auth');
                return;
            }
            
            if (!response.ok) {
                console.log('Response not OK:', response.status);
                const errorText = await response.text();
                console.log('Error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Blog fetch response:', result.success ? 'Success' : 'Failed');
            
            if (result.success) {
                console.log(`Retrieved ${result.data.length} blogs`);
                // Log a sample blog to verify data structure
                if (result.data.length > 0) {
                    console.log('Sample blog data:', JSON.stringify(result.data[0]).substring(0, 100) + '...');
                } else {
                    console.log('No blogs returned from API');
                }
                
                // Store the data exactly as received from the API
                setBlogData(sortBlogs(result.data));
            } else {
                throw new Error(result.message || 'API request failed');
            }
        } catch (err) {
            console.error('Error fetching blogs:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch blog data');
        } finally {
            setLoading(false);
        }
    };

    // Add function to handle image upload
    const uploadImage = async (imageSource: string | File) => {
        try {
            const formData = new FormData();
            
            if (imageSource instanceof File) {
                // Web platform with File object
                formData.append('file', imageSource);
            } else if (typeof imageSource === 'string') {
                if (imageSource.startsWith('file://')) {
                    // Mobile platform
                    formData.append('file', {
                        uri: imageSource,
                        type: 'image/jpeg',
                        name: 'upload.jpg',
                    } as any);
                } else if (imageSource.startsWith('blob:')) {
                    // Convert blob URL to File
                    const response = await fetch(imageSource);
                    const blob = await response.blob();
                    const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });
                    formData.append('file', file);
                } else {
                    // Already a URL, no need to upload again
                    return imageSource;
                }
            }
            
            formData.append('upload_preset', 'Ghassen123');

            const response = await fetch('https://api.cloudinary.com/v1_1/dqh6arave/image/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error?.message || 'Failed to upload image');
            }
            return data.secure_url;
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    };

    // Update createBlog with more logging
    const createBlog = async () => {
        console.log('=== Create Blog Debug Info ===');
        
        // Force token refresh before proceeding
        const isAuthenticated = await getToken();
        if (!isAuthenticated || !token) {
            Alert.alert('Authentication Error', 'Please log in again to continue');
            // Redirect to auth instead of login
            router.replace('/auth');
            return;
        }

        try {
            let imageUrl = '';
            if (newBlog.image) {
                imageUrl = await uploadImage(newBlog.image);
            }

            const blogToSubmit = {
                ...newBlog,
                image: imageUrl,
                userId: userId,
            };

            const response = await fetch(`${EXPO_PUBLIC_API_URL}blogs/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(blogToSubmit),
            });

            if (response.status === 401) {
                // Token expired or invalid
                Alert.alert('Session Expired', 'Please log in again');
                // Clear token from AsyncStorage instead of SecureStore
                await AsyncStorage.removeItem('userToken');
                // Redirect to auth
                router.replace('/auth');
                return;
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            if (result.success) {
                setCreateModalVisible(false);
                setNewBlog({ title: '', content: '', image: '' });
                fetchBlogData();
                Alert.alert('Success', 'Blog created successfully');
            } else {
                throw new Error(result.message || 'Failed to create blog');
            }
        } catch (err: unknown) {
            console.error('Create blog error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to create blog';
            Alert.alert('Error', errorMessage);
            setError(errorMessage);
        }
    };

    // Update deleteBlog function to use disable endpoint
    const disableBlog = async (blogId: number) => {
        try {
            const response = await fetch(`${EXPO_PUBLIC_API_URL}blogs/${blogId}/disable`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            if (result.success) {
                fetchBlogData();
            } else {
                throw new Error(result.message || 'Failed to disable blog');
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to disable blog');
        }
    };

    // Update the confirm delete function
    const confirmDisable = (blogId: number) => {
        // First find the blog
        const blog = blogData.find(b => b.id === blogId);
        
        // Check if this is the owner
        if (!blog || blog.userId !== userId) {
            Alert.alert('Access Denied', "You can only disable your own blog posts.");
            return;
        }

        Alert.alert(
            "Confirm Disable",
            "Are you sure you want to disable this blog? It will no longer be visible to others.",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Yes", onPress: () => disableBlog(blogId), style: "destructive" },
            ],
            { cancelable: true }
        );
    };

    // Like/Unlike blog
    const toggleLike = async (blogId: number) => {
        if (!userId || !token) {
            Alert.alert('Error', 'Please login to like blogs');
            return;
        }

        try {
            const blog = blogData.find(b => b.id === blogId);
            const newLikedState = !blog?.liked;

            const response = await fetch(`${EXPO_PUBLIC_API_URL}blogs/${blogId}/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId: userId,
                    liked: newLikedState
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            if (result.success) {
                // Update UI only after successful API call
                setBlogData(prevData =>
                    prevData.map(b =>
                        b.id === blogId ? { 
                            ...b, 
                            liked: newLikedState, 
                            likes: newLikedState ? b.likes + 1 : b.likes - 1 
                        } : b
                    )
                );
            } else {
                throw new Error(result.message || 'Failed to update like');
            }

        } catch (err: unknown) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update like');
        }
    };

    // Show blog details
    const showBlogDetails = (blogId: number) => {
        router.push(`/storydetail?id=${blogId}`);
    };

    // Update handleMenuPress function to only show for blog owner
    const handleMenuPress = (blogId: number) => {
        // Get the blog first
        const blog = blogData.find(b => b.id === blogId);
        
        // Only allow if blog exists and this is the owner
        if (blog && blog.userId === userId) {
            if (dropdownVisible && selectedBlogId === blogId) {
                setDropdownVisible(false);
            } else {
                setSelectedBlogId(blogId);
                setDropdownVisible(true);
            }
        } else if (blog) {
            // Show an alert if they try to access options on someone else's blog
            Alert.alert('Access Denied', "You can only modify your own blog posts.");
        }
    };

    // Update updateBlog function
    const updateBlog = async () => {
        if (!blogToUpdate || !token) return;

        try {
            let imageUrl = blogToUpdate.image;
            // Check if we need to upload a new image
            if (blogToUpdate.image) {
                if (Platform.OS === 'web') {
                    // On web, check if image is a File object
                    if (typeof blogToUpdate.image === 'object') {
                        imageUrl = await uploadImage(blogToUpdate.image);
                    }
                } else if (typeof blogToUpdate.image === 'string' && blogToUpdate.image.startsWith('file://')) {
                    imageUrl = await uploadImage(blogToUpdate.image);
                }
            }

            const response = await fetch(`${EXPO_PUBLIC_API_URL}blogs/${blogToUpdate.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: blogToUpdate.title,
                    content: blogToUpdate.content,
                    image: imageUrl,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            if (result.success) {
                setUpdateModalVisible(false);
                setBlogToUpdate(null);
                fetchBlogData();
            } else {
                throw new Error(result.message || 'Failed to update blog');
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to update blog');
        }
    };

    // Add onRefresh handler
    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchBlogData().then(() => setRefreshing(false));
    }, [token]);

    // Immediately check for token on component mount - this is for debugging
    useEffect(() => {
        const inspectToken = async () => {
            try {
                const allKeys = await AsyncStorage.getAllKeys();
                console.log('All AsyncStorage keys:', allKeys);
                
                const token = await AsyncStorage.getItem('userToken');
                console.log('Token in AsyncStorage:', token ? 'Found' : 'Not found');
                
                if (token) {
                    try {
                        const decoded = jwtDecode(token);
                        console.log('Decoded token:', decoded);
                    } catch (e) {
                        console.error('Error decoding token:', e);
                    }
                }
            } catch (e) {
                console.error('Token inspection error:', e);
            }
        };
        
        inspectToken();
    }, []);

    // Update useEffect with more logging
    useEffect(() => {
        const checkAuthentication = async () => {
            console.log('Checking authentication in story.tsx');
            const isAuthenticated = await getToken();
            if (isAuthenticated) {
                console.log('Authentication successful, fetching data...');
                fetchBlogData();
            } else {
                console.log('Authentication failed, redirecting to auth screen');
                // Redirect to auth screen when not authenticated
                router.replace('/auth');
            }
        };
        
        checkAuthentication();
    }, []);

    // Add this function to check if likes have been updated
    const checkForLikeUpdates = async () => {
        try {
            // Check if there's a flag indicating likes were updated
            const likesUpdated = await AsyncStorage.getItem('likes_updated');
            
            if (likesUpdated === 'true') {
                console.log('Likes were updated, refreshing blog data...');
                // Clear the flag
                await AsyncStorage.removeItem('likes_updated');
                // Refresh blog data
                fetchBlogData();
            }
        } catch (error) {
            console.error('Error checking for like updates:', error);
        }
    };
    
    // Add this function to check for blog updates
    const checkForBlogUpdates = async () => {
        try {
            // Check if blogs_updated flag has been set
            const blogsUpdated = await AsyncStorage.getItem('blogs_updated');
            console.log('Checking for blog updates:', blogsUpdated);
            
            if (blogsUpdated === 'true') {
                // Clear the flag and refresh blogs
                await AsyncStorage.setItem('blogs_updated', 'false');
                console.log('Blogs were updated, refreshing list');
                fetchBlogData();
            }
        } catch (error) {
            console.error('Error checking for blog updates:', error);
        }
    };
    
    // Update the useFocusEffect to also check for blog updates
    useFocusEffect(
        React.useCallback(() => {
            // This runs when the screen comes into focus
            console.log('Story screen in focus, checking for updates');
            checkForLikeUpdates();
            checkForBlogUpdates(); // Add this new function call
            
            return () => {
                // This runs when the screen loses focus
                console.log('Story screen lost focus');
            };
        }, [])
    );

    // Filter blogs based on current filter setting
    const getFilteredBlogs = () => {
        if (showOnlyMyPosts && userId) {
            return blogData.filter(blog => blog.userId === userId);
        }
        return blogData;
    };

    // Loading state
    if (loading) {
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>Loading blogs...</Text>
            </View>
        );
    }

    // Error state
    if (error) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Error: {error}</Text>
                <Text style={styles.retryText} onPress={fetchBlogData}>
                    Tap to retry
                </Text>
            </View>
        );
    }

    // Main content
    return (
        <View style={styles.container}>
            {/* Add filter toggle section at the top */}
            <View style={styles.filterContainer}>
                <Text style={styles.filterLabel}>View: </Text>
                <TouchableOpacity 
                    style={[styles.filterButton, !showOnlyMyPosts && styles.activeFilterButton]} 
                    onPress={() => setShowOnlyMyPosts(false)}
                >
                    <Text style={[styles.filterButtonText, !showOnlyMyPosts && styles.activeFilterText]}>All Story</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.filterButton, showOnlyMyPosts && styles.activeFilterButton]} 
                    onPress={() => setShowOnlyMyPosts(true)}
                >
                    <Text style={[styles.filterButtonText, showOnlyMyPosts && styles.activeFilterText]}>My Story</Text>
                </TouchableOpacity>
            </View>
            
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#64FFDA']} // Android
                        tintColor="#64FFDA" // iOS
                    />
                }
            >
                <View style={styles.content}>
                    {getFilteredBlogs().length > 0 ? (
                        sortBlogs(getFilteredBlogs()).map((blog) => (
                            <TouchableOpacity 
                                key={blog.id} 
                                style={styles.blogCard}
                                onPress={() => showBlogDetails(blog.id)}
                            >
                                <View style={styles.cardHeader}>
                                    <View style={styles.authorInfo}>
                                        <Image 
                                            source={{ uri: blog.user?.profile_image || DEFAULT_PROFILE_IMAGE }} 
                                            style={styles.profileImage}
                                        />
                                        <View style={styles.authorTextContainer}>
                                            <Text style={styles.title}>{blog.title}</Text>
                                            <Text style={styles.authorText}>
                                                By: {blog.user?.first_name || 'Anonymous'} {blog.user?.last_name || ''}
                                            </Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity 
                                        style={styles.menuButton}
                                        onPress={() => handleMenuPress(blog.id)}
                                    >
                                        {blog.userId === userId ? (
                                            <Icon name="more-vert" size={24} color="#64FFDA" />
                                        ) : (
                                            <Icon name="info-outline" size={24} color="#64FFDA" onPress={() => showBlogDetails(blog.id)} />
                                        )}
                                    </TouchableOpacity>
                                </View>
                                {blog.image && (
                                    <Image 
                                        source={{ uri: blog.image }} 
                                        style={styles.blogImage} 
                                        resizeMode="cover"
                                    />
                                )}
                                {dropdownVisible && selectedBlogId === blog.id && blog.userId === userId && (
                                    <View style={styles.dropdownMenu}>
                                        <TouchableOpacity
                                            style={styles.dropdownItem}
                                            onPress={() => {
                                                setDropdownVisible(false);
                                                setBlogToUpdate(blog);
                                                setUpdateModalVisible(true);
                                            }}
                                        >
                                            <Text style={styles.dropdownText}>Update</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.dropdownItem}
                                            onPress={() => {
                                                setDropdownVisible(false);
                                                confirmDisable(blog.id);
                                            }}
                                        >
                                            <Text style={styles.dropdownText}>Disable</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.dropdownItem}
                                            onPress={() => {
                                                setDropdownVisible(false);
                                                showBlogDetails(blog.id);
                                            }}
                                        >
                                            <Text style={styles.dropdownText}>Details</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                                <Text style={styles.contentText}>{blog.content}</Text>
                                <View style={styles.metaContainer}>
                                    <TouchableOpacity
                                        style={styles.likeButton}
                                        onPress={() => toggleLike(blog.id)}
                                    >
                                        <Icon
                                            name={blog.liked ? "favorite" : "favorite-border"}
                                            size={20}
                                            color={blog.liked ? "#FF6B6B" : "#64FFDA"}
                                        />
                                        <Text style={styles.metaText}>
                                            {blog.likes} {blog.likes === 1 ? 'Like' : 'Likes'}
                                        </Text>
                                    </TouchableOpacity>
                                    <Text style={styles.metaText}>
                                        • Created: {new Date(blog.createdAt).toLocaleDateString()}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <Text style={styles.noDataText}>
                            {showOnlyMyPosts ? 'You haven\'t created any stories yet' : 'No stories available'}
                        </Text>
                    )}
                </View>
            </ScrollView>

            {/* Floating Action Button for Create */}
            <TouchableOpacity style={styles.fab} onPress={() => setCreateModalVisible(true)}>
                <Icon name="add" size={30} color="#0A192F" />
            </TouchableOpacity>

            {/* Modal for Blog Creation */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={createModalVisible}
                onRequestClose={() => setCreateModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Create New Blog</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Blog Title"
                            placeholderTextColor="#8892B0"
                            value={newBlog.title}
                            onChangeText={(text) => setNewBlog({ ...newBlog, title: text })}
                        />
                        <TextInput
                            style={[styles.input, styles.contentInput]}
                            placeholder="Blog Content"
                            placeholderTextColor="#8892B0"
                            value={newBlog.content}
                            onChangeText={(text) => setNewBlog({ ...newBlog, content: text })}
                            multiline
                        />
                        <TouchableOpacity 
                            style={styles.imageUploadButton}
                            onPress={async () => {
                                // Add image picker logic here
                                // Example using expo-image-picker:
                                const result = await ImagePicker.launchImageLibraryAsync({
                                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                                    allowsEditing: true,
                                    aspect: [4, 3],
                                    quality: 1,
                                });

                                if (!result.canceled) {
                                    setNewBlog({ ...newBlog, image: result.assets[0].uri });
                                }
                            }}
                        >
                            <Text style={styles.imageUploadText}>
                                {newBlog.image ? 'Change Image' : 'Add Image'}
                            </Text>
                        </TouchableOpacity>
                        <View style={styles.buttonContainer}>
                            <Button title="Cancel" onPress={() => setCreateModalVisible(false)} color="#FF6B6B" />
                            <Button title="Submit" onPress={createBlog} color="#64FFDA" />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Update Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={updateModalVisible}
                onRequestClose={() => setUpdateModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Update Blog</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Blog Title"
                            placeholderTextColor="#8892B0"
                            value={blogToUpdate?.title}
                            onChangeText={(text) => setBlogToUpdate(prev => prev ? {...prev, title: text} : null)}
                        />
                        <TextInput
                            style={[styles.input, styles.contentInput]}
                            placeholder="Blog Content"
                            placeholderTextColor="#8892B0"
                            value={blogToUpdate?.content}
                            onChangeText={(text) => setBlogToUpdate(prev => prev ? {...prev, content: text} : null)}
                            multiline
                        />
                        <TouchableOpacity 
                            style={styles.imageUploadButton}
                            onPress={async () => {
                                if (Platform.OS === 'web') {
                                    // Web platform: Use input file picker
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = 'image/*';
                                    input.onchange = async (e) => {
                                        const file = (e.target as HTMLInputElement).files?.[0];
                                        if (file) {
                                            const imageUrl = URL.createObjectURL(file);
                                            setBlogToUpdate(prev => 
                                                prev ? {...prev, image: imageUrl} : null
                                            );
                                        }
                                    };
                                    input.click();
                                } else {
                                    // Mobile platform: Use expo-image-picker
                                    const result = await ImagePicker.launchImageLibraryAsync({
                                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                                        allowsEditing: true,
                                        aspect: [4, 3],
                                        quality: 1,
                                    });

                                    if (!result.canceled) {
                                        setBlogToUpdate(prev => 
                                            prev ? {...prev, image: result.assets[0].uri} : null
                                        );
                                    }
                                }
                            }}
                        >
                            <Text style={styles.imageUploadText}>
                                {blogToUpdate?.image ? 'Change Image' : 'Add Image'}
                            </Text>
                        </TouchableOpacity>
                        {blogToUpdate?.image && (
                            <Image 
                                source={{ uri: blogToUpdate.image }} 
                                style={styles.previewImage}
                            />
                        )}
                        <View style={styles.buttonContainer}>
                            <Button 
                                title="Cancel" 
                                onPress={() => {
                                    setUpdateModalVisible(false);
                                    setBlogToUpdate(null);
                                }} 
                                color="#FF6B6B" 
                            />
                            <Button title="Update" onPress={updateBlog} color="#64FFDA" />
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A192F',
    },
    scrollContent: {
        paddingBottom: 80,
    },
    content: {
        padding: 20,
    },
    loadingText: {
        color: '#64FFDA',
        fontSize: 20,
        textAlign: 'center',
    },
    errorText: {
        color: '#FF6B6B',
        fontSize: 18,
        textAlign: 'center',
    },
    retryText: {
        color: '#64FFDA',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 10,
    },
    blogCard: {
        backgroundColor: '#112240',
        borderRadius: 8,
        padding: 15,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 2,
        elevation: 5,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    blogImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 15,
    },
    title: {
        color: '#64FFDA',
        fontSize: 22,
        fontWeight: 'bold',
        flex: 1,
    },
    menuButton: {
        padding: 5,
    },
    dropdownMenu: {
        position: 'absolute',
        top: 40,
        right: 10,
        backgroundColor: '#1A2C4B',
        borderRadius: 5,
        elevation: 5,
        zIndex: 1,
    },
    dropdownItem: {
        padding: 10,
    },
    dropdownText: {
        color: '#64FFDA',
        fontSize: 16,
    },
    authorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    profileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    authorTextContainer: {
        flex: 1,
    },
    authorText: {
        color: '#8892B0',
        fontSize: 14,
        marginTop: 2,
    },
    contentText: {
        color: '#8892B0',
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 10,
    },
    metaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },
    likeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 10,
    },
    metaText: {
        color: '#64FFDA',
        fontSize: 14,
    },
    commentsContainer: {
        marginTop: 15,
    },
    commentsTitle: {
        color: '#64FFDA',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
    },
    commentCard: {
        backgroundColor: '#1A2C4B',
        borderRadius: 6,
        padding: 10,
        marginBottom: 10,
    },
    commentAuthor: {
        color: '#64FFDA',
        fontSize: 14,
        fontWeight: '600',
    },
    commentText: {
        color: '#8892B0',
        fontSize: 14,
        marginVertical: 5,
    },
    commentDate: {
        color: '#576D93',
        fontSize: 12,
    },
    noDataText: {
        color: '#8892B0',
        fontSize: 18,
        textAlign: 'center',
    },
    fab: {
        position: 'absolute',
        bottom: 80,
        right: 30,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#64FFDA',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        zIndex: 999,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#112240',
        borderRadius: 10,
        padding: 20,
        elevation: 5,
    },
    modalTitle: {
        color: '#64FFDA',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    input: {
        backgroundColor: '#1A2C4B',
        color: '#FFFFFF',
        borderRadius: 5,
        padding: 10,
        marginBottom: 15,
        fontSize: 16,
    },
    contentInput: {
        height: 100,
        textAlignVertical: 'top',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    imageUploadButton: {
        backgroundColor: '#1A2C4B',
        padding: 10,
        borderRadius: 5,
        marginBottom: 15,
        alignItems: 'center',
    },
    imageUploadText: {
        color: '#64FFDA',
        fontSize: 16,
    },
    previewImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 15,
    },
    filterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#112240',
        paddingVertical: 15,
        paddingHorizontal: 20,
        zIndex: 1,
        marginTop: 30,
        marginBottom: 20,
        borderRadius: 8,
        marginHorizontal: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4,
    },
    filterLabel: {
        color: '#8892B0',
        fontSize: 16,
        marginRight: 15,
        fontWeight: '600',
    },
    filterButton: {
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 25,
        marginHorizontal: 6,
        borderWidth: 1.5,
        borderColor: '#64FFDA',
    },
    activeFilterButton: {
        backgroundColor: '#64FFDA',
    },
    filterButtonText: {
        color: '#64FFDA',
        fontSize: 15,
        fontWeight: '500',
    },
    activeFilterText: {
        color: '#0A192F',
        fontWeight: 'bold',
    },
});