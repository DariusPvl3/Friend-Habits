import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, Image, TextInput, 
  KeyboardAvoidingView, ScrollView, TouchableWithoutFeedback, Keyboard, Platform, 
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useAppTheme } from '@/context/ThemeContext';
import Colors from '../constants/Colors';
import { defaultStyles } from '@/constants/GlobalStyles';
import CustomButton from '@/components/CustomButton';
import CustomModal from '@/components/CustomModal';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { updateProfile } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import { auth, db } from '@/config/firebase';
import { doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';

export default function ProfileEditorScreen() {
  const router = useRouter();
  const { theme: colorScheme } = useAppTheme();
  const currentColors = Colors[colorScheme];
  const { mode } = useLocalSearchParams();
  const isCreating = mode === 'create';

  const [username, setUsername] = useState(isCreating ? '' : (auth.currentUser?.displayName || ''));
  const [imageUri, setImageUri] = useState<string | null>(isCreating ? null : (auth.currentUser?.photoURL || null));
  const [loading, setLoading] = useState(false);
  const screenTitle = isCreating ? "Create your profile" : "Edit Profile";
  const buttonText = isCreating ? "Save Profile" : "Save Changes";

  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDescription, setModalDescription] = useState('');

  const triggerAlert = (title: string, message: string) => {
    setModalTitle(title);
    setModalDescription(message);
    setAlertModalVisible(true);
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if(permission.status !== 'granted'){
      triggerAlert("Permission Denied!", "We need photo library access in order to upload a profile picture.");
      return;
    }
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if(!result.canceled && result.assets && result.assets.length > 0){
        setImageUri(result.assets[0].uri);
      }
    } catch (err) {
      console.error(err);
      triggerAlert("Error", "Something went wrong while picking your photo.")
    }
    
  }

  const handleProfileSave = async () => {
    const cleanUsername = username.trim().replace(/\s+/g, '');
    const currentDisplayName = auth.currentUser?.displayName || "";

    if (!cleanUsername) {
      triggerAlert("Hold on!", "Username is mandatory.");
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_.]+$/;
    if (!usernameRegex.test(cleanUsername)) {
      triggerAlert("Invalid Username", "Usernames can only contain letters, numbers, underscores, and periods.");
      return;
    }

    try {
      setLoading(true);
      const user = auth.currentUser;

      if (user) {
        const isNewUsername = cleanUsername !== currentDisplayName;

        // only hit Firestore if user actually typed a different username
        if (isNewUsername) {
          const newUsernameRef = doc(db, 'usernames', cleanUsername);
          const usernameSnapshot = await getDoc(newUsernameRef);

          // Check if it exists AND belongs to someone else
          if (usernameSnapshot.exists()) {
            const ownerUid = usernameSnapshot.data().uid;
            if (ownerUid !== user.uid) {
              triggerAlert("Taken!", "This username is already claimed by another user.");
              setLoading(false);
              return; 
            }
          }

          // If we get here, the username is valid.
          const batch = writeBatch(db);
          
          // Claim the new username
          batch.set(newUsernameRef, {
            uid: user.uid,
            updatedAt: new Date().toISOString()
          });

          // Delete the old username (Only if they aren't a brand new user creating a profile)
          if (currentDisplayName && !isCreating) {
            const oldUsernameRef = doc(db, 'usernames', currentDisplayName);
            batch.delete(oldUsernameRef);
          }

          await batch.commit();
        }

        // Update the native Auth profile metadata
        await updateProfile(user, {
          displayName: cleanUsername,
          photoURL: imageUri,
        });

        await user.reload();
        
        if (isCreating) {
            router.replace('/(tabs)/home'); 
        } else {
            router.back(); 
        }
      }
    } catch (error: any) {
      console.error(error);
      triggerAlert("Saving Failed", "Could not update profile. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={[defaultStyles.safeArea, { backgroundColor: currentColors.background }]}>
        <Stack.Screen
          options={{
            headerShown: !isCreating, // Hides header for creation, shows for editing
            title: "Edit Profile",
            headerTintColor: currentColors.tint,
            headerStyle: { backgroundColor: currentColors.background },
            headerShadowVisible: false,
          }}
        />
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
        >
          <ScrollView 
            style={defaultStyles.container} 
            contentContainerStyle={defaultStyles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={defaultStyles.headerBox}>
              <Text style={[defaultStyles.title, { color: currentColors.text }]}>{screenTitle}</Text>
              <Text style={defaultStyles.subtitle}>Based on this, your friends will know who needs to be motivated. You can change things later.</Text>
            </View>

            <View style={defaultStyles.form}>
              <Text style={[defaultStyles.label, { color: currentColors.text }]}>Profile Picture</Text>
              <View style={defaultStyles.avatarWrapper}>
                {imageUri ? (
                  <Image 
                    source={{ uri: imageUri }} 
                    style={[defaultStyles.avatarLarge, defaultStyles.avatarBordered]} 
                  />
                ) : (
                  <View style={[
                    defaultStyles.avatarLarge, 
                    defaultStyles.avatarBordered, 
                    defaultStyles.avatarPlaceholder, 
                    { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#E2E8F0' }
                  ]}>
                    <MaterialCommunityIcons name="account" size={50} color="#94A3B8" />
                  </View>
                )}
                
                {/* The Pencil Badge (Only in profile-editor) */}
                <TouchableOpacity style={defaultStyles.avatarBadgePencil} onPress={pickImage}>
                  <MaterialCommunityIcons name='pencil-outline' size={22} color="#fff" />
                </TouchableOpacity>
              </View>

              <Text style={[defaultStyles.label, { color: currentColors.text }]}>Preffered Username</Text>
              <TextInput
                style={[defaultStyles.input, { 
                  backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFF',
                  color: currentColors.text,
                  borderColor: colorScheme === 'dark' ? '#334155' : '#CBD5E1'
                }]}
                placeholder="Username"
                placeholderTextColor="#64748B"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                keyboardType="default"
              />

              <View style={defaultStyles.actionSpace}>
                <CustomButton 
                  text={loading ? "Saving Profile..." : buttonText} 
                  variant="tint" 
                  onPress={handleProfileSave} 
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <CustomModal
          visible={alertModalVisible}
          title={modalTitle}
          description={modalDescription}
          onClose={() => setAlertModalVisible(false)}
          buttons={[
            { text: "Got it", variant: 'danger', onPress: () => setAlertModalVisible(false) }
          ]}
        />
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}