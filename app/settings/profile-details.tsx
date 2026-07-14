import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useAppTheme } from "@/context/ThemeContext";
import Colors from "../../constants/Colors";
import CustomButton from "@/components/CustomButton";
import CustomModal from "@/components/CustomModal";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  updateProfile,
  verifyBeforeUpdateEmail,
  sendPasswordResetEmail,
} from "firebase/auth";
import * as ImagePicker from "expo-image-picker";
import { auth, db } from "@/config/firebase";
import { doc, getDoc, writeBatch } from 'firebase/firestore';

export default function ProfileEditorScreen() {
  const router = useRouter();
  const { theme: colorScheme } = useAppTheme();
  const currentColors = Colors[colorScheme];

  const [username, setUsername] = useState(auth.currentUser?.displayName || "");
  const [imageUri, setImageUri] = useState<string | null>(
    auth.currentUser?.photoURL || null,
  );
  const [newEmail, setNewEmail] = useState(auth.currentUser?.email || "");
  const [loading, setLoading] = useState(false);

  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalDescription, setModalDescription] = useState("");
  const [modalOnCloseAction, setModalOnCloseAction] = useState<() => void>(
    () => {},
  );

  const scrollViewRef = React.useRef<ScrollView>(null);

  const hasChanges =
    username.trim() !== (auth.currentUser?.displayName || "") ||
    imageUri !== (auth.currentUser?.photoURL || null) ||
    newEmail.trim().toLowerCase() !==
      (auth.currentUser?.email || "").toLowerCase();

  const triggerAlert = (
    title: string,
    message: string,
    onClosePress?: () => void,
  ) => {
    setModalTitle(title);
    setModalDescription(message);
    setModalOnCloseAction(
      () => onClosePress || (() => setAlertModalVisible(false)),
    );
    setAlertModalVisible(true);
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== "granted") {
      triggerAlert(
        "Permission Denied!",
        "We need photo library access in order to upload a profile picture.",
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (err) {
      console.error(err);
      triggerAlert("Error", "Something went wrong while picking your photo.");
    }
  };

  const handlePasswordResetRequest = async () => {
    const currentEmail = auth.currentUser?.email;

    if (!currentEmail) {
      triggerAlert(
        "Error",
        "We couldn't find an active email address attached to this account.",
      );
      return;
    }

    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, currentEmail);
      triggerAlert(
        "Reset Link Sent! ✉️",
        `A secure password reset link has been dispatched to ${currentEmail}. Follow the instructions inside the email to complete updating your credentials.`,
      );
    } catch (error: any) {
      console.error(error);
      triggerAlert(
        "Request Failed",
        "Could not dispatch reset email link. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async () => {
    const currentDisplayName = auth.currentUser?.displayName || "";
    const cleanUsername = username.trim().replace(/\s+/g, '');

    if (!cleanUsername) {
      triggerAlert("Hold on!", "Username is mandatory.");
      return;
    }

    if (!newEmail.trim()) {
      triggerAlert("Hold on!", "Email field cannot be blank.");
      return;
    }

    // Handle constraints validation
    const usernameRegex = /^[a-zA-Z0-9_.]+$/;
    if (!usernameRegex.test(cleanUsername)) {
      triggerAlert(
        "Invalid Username", 
        "Usernames can only contain letters, numbers, underscores, and periods."
      );
      return;
    }

    try {
      setLoading(true);
      const user = auth.currentUser;

      if (user) {
        let requiresVerificationAlert = false;
        const isNewUsername = cleanUsername !== currentDisplayName;

        // Username uniqueness check (Only runs if they actually changed it)
        if (isNewUsername) {
          const newUsernameRef = doc(db, 'usernames', cleanUsername);
          const usernameSnapshot = await getDoc(newUsernameRef);

          if (usernameSnapshot.exists()) {
            triggerAlert("Taken!", "This username is already claimed by another user.");
            setLoading(false);
            return; // Terminate execution stream early
          }

          // Prepare atomic switch database entries
          const batch = writeBatch(db);
          
          // Claim the new handle record
          batch.set(newUsernameRef, {
            uid: user.uid,
            updatedAt: new Date().toISOString()
          });

          // Release the old handle document if it existed
          if (currentDisplayName) {
            const oldUsernameRef = doc(db, 'usernames', currentDisplayName);
            batch.delete(oldUsernameRef);
          }

          // Commit both document changes together instantly
          await batch.commit();
        }

        // Profile updates (Username & Photo)
        await updateProfile(user, {
          displayName: cleanUsername, // Save the standardized unique handle string
          photoURL: imageUri,
        });

        // Conditional Email update check
        if (newEmail.trim().toLowerCase() !== (user.email || "").toLowerCase()) {
          await verifyBeforeUpdateEmail(user, newEmail.trim().toLowerCase());
          requiresVerificationAlert = true;
        }

        await user.reload();

        if (requiresVerificationAlert) {
          triggerAlert(
            "Profile Updated!",
            "Your changes are live. Check your inbox at the new email address to verify and complete your account email update!",
            () => {
              setAlertModalVisible(false);
              router.back();
            },
          );
        } else {
          triggerAlert(
            "Changes Saved!",
            "Your profile information has been successfully synced.",
            () => {
              setAlertModalVisible(false);
              router.back();
            },
          );
        }
      }
    } catch (error: any) {
      console.error(error);
      let localizedError = "Could not save updates. Please try again.";

      if (error.code === "auth/requires-recent-login") {
        localizedError =
          "For security purposes, modifying your credentials requires a fresh session. Please log out, sign back in, and try again instantly.";
      } else if (error.code === "auth/invalid-email") {
        localizedError = "The email address layout format is invalid.";
      } else if (error.code === "auth/email-already-in-use") {
        localizedError = "This email address is already claimed by another user account.";
      }

      triggerAlert("Update Failed", localizedError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: currentColors.background }]}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Edit Profile",
          headerTintColor: currentColors.tint,
          headerStyle: { backgroundColor: currentColors.background },
        }}
      />
  
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0} 
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled" 
          automaticallyAdjustKeyboardInsets={true}
        >
          <View style={styles.headerBox}>
            <Text style={[styles.title, { color: currentColors.text }]}>
              Update your Profile
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={[styles.label, { color: currentColors.text }]}>
              Profile Picture
            </Text>
            <View style={styles.avatarWrapper}>
              {imageUri ? (
                <Image
                  source={{ uri: imageUri }}
                  style={styles.profileAvatar}
                />
              ) : (
                <View
                  style={[
                    styles.profileAvatar,
                    {
                      backgroundColor:
                        colorScheme === "dark" ? "#1E293B" : "#E2E8F0",
                      justifyContent: "center",
                      alignItems: "center",
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="account"
                    size={50}
                    color="#94A3B8"
                  />
                </View>
              )}
              <TouchableOpacity style={styles.pencilBadge} onPress={pickImage}>
                <MaterialCommunityIcons
                  name="pencil-outline"
                  size={22}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: currentColors.text }]}>
              Preferred Username
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colorScheme === "dark" ? "#1E293B" : "#FFF",
                color: currentColors.text,
                borderColor: colorScheme === "dark" ? "#334155" : "#CBD5E1",
              }]}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              onFocus={() => scrollViewRef.current?.scrollTo({ y: 0, animated: true })}
            />

            <View style={[styles.headerBox, { marginTop: 28, marginBottom: 12 }]}>
              <Text style={[styles.title, { color: currentColors.text, fontSize: 24 }]}>
                Update your Account
              </Text>
            </View>
            
            <Text style={[styles.label, { color: currentColors.text }]}>
              Change e-mail
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colorScheme === "dark" ? "#1E293B" : "#FFF",
                color: currentColors.text,
                borderColor: colorScheme === "dark" ? "#334155" : "#CBD5E1",
              }]}
              value={newEmail}
              onChangeText={setNewEmail}
              autoCapitalize="none"
              onFocus={() => scrollViewRef.current?.scrollTo({ y: 180, animated: true })}
            />

            <Text style={[styles.label, { color: currentColors.text, marginTop: 16 }]}>
              Account Security
            </Text>
            <View style={[styles.securityCard, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#F8FAFC' }]}>
              <Text style={{ color: '#94A3B8', fontSize: 14, marginBottom: 16, lineHeight: 20 }}>
                Want to update your account security password? Click below to dispatch secure password reset instructions straight to your registered inbox.
              </Text>
              <CustomButton
                text="Send Password Reset Link"
                variant="danger"
                disabled={loading}
                onPress={handlePasswordResetRequest}
              />
            </View>

            <View style={styles.actionSpace}>
              <CustomButton
                text="Save Changes"
                disabled={!hasChanges || loading}
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
        onClose={modalOnCloseAction}
        buttons={[
          { 
            text: "Got it", 
            variant: modalTitle.includes("Saved") || modalTitle.includes("Updated") || modalTitle.includes("Link Sent") ? 'tint' : 'danger', 
            onPress: modalOnCloseAction
          }
        ]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 24 },
  scrollContent: {
    paddingTop: 10,
    paddingBottom: 40,
    justifyContent: "flex-start",
    flexGrow: 1,
  },
  headerBox: { marginTop: 0 },
  title: { fontSize: 32, fontWeight: "bold", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#94A3B8", lineHeight: 22 },
  form: { width: "100%" },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    width: "100%",
    marginBottom: 25,
  },
  actionSpace: { marginTop: 24, gap: 12 },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "#10B981",
  },
  avatarWrapper: {
    position: "relative",
    alignSelf: "center",
    marginBottom: 24,
  },
  pencilBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#34D399",
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  securityCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.12)",
    width: "100%",
    marginBottom: 12,
  },
});
