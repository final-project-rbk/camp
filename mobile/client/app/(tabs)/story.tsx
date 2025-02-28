import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Modal, TextInput, Button, Alert, RefreshControl } from "react-native";
import { useState, useEffect } from "react";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { EXPO_PUBLIC_API_URL } from '../../config';
import { useRouter } from 'expo-router';
import React from "react";
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

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


    // Sort blogs by createdAt descending (newest first)
    const sortBlogs = (blogs: Blog[]) => {
        return blogs.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    };

    // Fetch blogs
    const fetchBlogData = async () => {
        try {
            const response = await fetch(`${EXPO_PUBLIC_API_URL}blogs/`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            if (result.success) {
                // Add a 'liked' property to track local like state
                const blogsWithLikeState = result.data.map((blog: any) => ({
                    ...blog,
                    liked: false, // Assume user hasn't liked it initially
                }));
                setBlogData(sortBlogs(blogsWithLikeState));
            } else {
                throw new Error(result.message || 'API request failed');
            }
            setLoading(false);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to fetch blog data');
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

    // Update createBlog function
    const createBlog = async () => {
        try {
            let imageUrl = '';
            if (newBlog.image) {
                imageUrl = await uploadImage(newBlog.image);
            }

            const blogToSubmit = {
                ...newBlog,
                image: imageUrl,
                userId: 3,
            };

            const response = await fetch(`${EXPO_PUBLIC_API_URL}blogs/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(blogToSubmit),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            if (result.success) {
                setCreateModalVisible(false);
                setNewBlog({ title: '', content: '', image: '' });
                fetchBlogData();
            } else {
                throw new Error(result.message || 'Failed to create blog');
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to create blog');
        }
    };

    // Delete blog
    const deleteBlog = async (blogId: number) => {
        try {
            const response = await fetch(`${EXPO_PUBLIC_API_URL}blogs/${blogId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            if (result.success) {
                fetchBlogData();
            } else {
                throw new Error(result.message || 'Failed to delete blog');
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to delete blog');
        }
    };

    // Confirm delete
    const confirmDelete = (blogId: number) => {
        Alert.alert(
            "Confirm Delete",
            "Are you sure you want to delete this blog?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Yes", onPress: () => deleteBlog(blogId), style: "destructive" },
            ],
            { cancelable: true }
        );
    };

    // Like/Unlike blog
    const toggleLike = async (blogId: number) => {
        try {
            const blog = blogData.find(b => b.id === blogId);
            const newLikedState = !blog?.liked;

            // Make API call to update likes
            const response = await fetch(`${EXPO_PUBLIC_API_URL}blogs/${blogId}/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: 3, // Replace with actual user ID from your auth system
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

    // Handle 3-dot menu click
    const handleMenuPress = (blogId: number) => {
        if (dropdownVisible && selectedBlogId === blogId) {
            setDropdownVisible(false);
        } else {
            setSelectedBlogId(blogId);
            setDropdownVisible(true);
        }
    };

    // Update updateBlog function
    const updateBlog = async () => {
        if (!blogToUpdate) return;

        try {
            let imageUrl = blogToUpdate.image;
            // Check if we need to upload a new image
            if (blogToUpdate.image) {
                if (Platform.OS === 'web') {
                    if (blogToUpdate.image instanceof File) {
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
        fetchBlogData().finally(() => setRefreshing(false));
    }, []);

    // Fetch data on mount
    useEffect(() => {
        fetchBlogData();
    }, []);

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
                    {blogData.length > 0 ? (
                        sortBlogs(blogData).map((blog) => (
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
                                        <Icon name="more-vert" size={24} color="#64FFDA" />
                                    </TouchableOpacity>
                                </View>
                                {blog.image && (
                                    <Image 
                                        source={{ uri: blog.image }} 
                                        style={styles.blogImage} 
                                        resizeMode="cover"
                                    />
                                )}
                                {dropdownVisible && selectedBlogId === blog.id && (
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
                                                confirmDelete(blog.id);
                                            }}
                                        >
                                            <Text style={styles.dropdownText}>Delete</Text>
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
                        <Text style={styles.noDataText}>No blog posts available</Text>
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
        bottom: 30,
        right: 30,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#64FFDA',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
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
});