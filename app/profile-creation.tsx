import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, Image, TextInput, 
  KeyboardAvoidingView, ScrollView, TouchableWithoutFeedback, Keyboard, Platform, 
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/context/ThemeContext';
import Colors from '../constants/Colors';
import CustomButton from '@/components/CustomButton';
import CustomModal from '@/components/CustomModal';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { updateProfile } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import { auth, db } from '@/config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function ProfileCreatorScreen() {
  const router = useRouter();
  const { theme: colorScheme } = useAppTheme();
  const currentColors = Colors[colorScheme];

  const [username, setUsername] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [loading, setLoading] = useState(false);

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

    if (!cleanUsername) {
      triggerAlert("Hold on!", "Username is mandatory.");
      return;// Store the clean, unique version
    }

    // Regex to ensure username only contains letters, numbers, underscores, or periods
    const usernameRegex = /^[a-zA-Z0-9_.]+$/;
    if (!usernameRegex.test(cleanUsername)) {
      triggerAlert("Invalid Username", "Usernames can only contain letters, numbers, underscores, and periods.");
      return;
    }

    try {
      setLoading(true);
      const user = auth.currentUser;

      if (user) {
        // CHECK FIRESTORE FOR UNIQUENESS
        const usernameDocRef = doc(db, 'usernames', cleanUsername);
        const usernameSnapshot = await getDoc(usernameDocRef);

        if (usernameSnapshot.exists()) {
          triggerAlert("Taken!", "This username is already claimed by another user.");
          setLoading(false);
          return; // Kill the execution block early
        }

        // CLAIM THE USERNAME: Save it in our global lookup table
        await setDoc(usernameDocRef, {
          uid: user.uid,
          createdAt: new Date().toISOString()
        });

        // Update the native Auth profile metadata
        await updateProfile(user, {
          displayName: cleanUsername,
          photoURL: imageUri,
        });

        await user.reload();
        router.replace('/(tabs)/home');
      }
    } catch (error: any) {
      console.error(error);
      triggerAlert("Saving Failed", "Could not check username availability. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: currentColors.background }]}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
        >
          <ScrollView 
            style={styles.container} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerBox}>
              <Text style={[styles.title, { color: currentColors.text }]}>Create your Profile</Text>
              <Text style={styles.subtitle}>Based on this, your friends will know who needs to be motivated. You can change things later.</Text>
            </View>

            <View style={styles.form}>
              <Text style={[styles.label, { color: currentColors.text }]}>Profile Picture</Text>
              <View style={styles.avatarWrapper}>
              {imageUri ? (
                <Image source={{uri: imageUri}} style={styles.profileAvatar}/>
              ) : (
                <View style={[styles.profileAvatar, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#E2E8F0', justifyContent: 'center', alignItems: 'center' }]}>
                  <MaterialCommunityIcons name="account" size={50} color="#94A3B8" />
                </View>
              )}
                <TouchableOpacity style={styles.pencilBadge} onPress={pickImage}>
                  <MaterialCommunityIcons 
                    name='pencil-outline'
                    size={22} 
                    color="#fff" 
                  />
                </TouchableOpacity>
              </View>

              <Text style={[styles.label, { color: currentColors.text }]}>Preffered Username</Text>
              <TextInput
                style={[styles.input, { 
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

              <View style={styles.actionSpace}>
                <CustomButton 
                  text={loading ? "Saving Profile..." : "Save Profile"} 
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

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 24 },
  scrollContent: { paddingTop: 40, paddingBottom: 40, justifyContent: 'center', flexGrow: 1 },
  headerBox: { marginBottom: 32 },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#94A3B8', lineHeight: 22 },
  form: { width: '100%' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { height: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, width: '100%' },
  actionSpace: { marginTop: 24, gap: 12 },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50, // Perfect circle for a profile header
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#10B981',
  },
  avatarWrapper: {
    position: 'relative',
    alignSelf: 'center',
    marginBottom: 24,
    },
    pencilBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#34D399', // Or your currentColors.tint
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    },
});