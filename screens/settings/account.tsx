import React, { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import {
  verifyBeforeUpdateEmail,
  sendPasswordResetEmail,
  signOut,
  deleteUser,
} from "firebase/auth";
import { auth, db } from "@/config/firebase";
import { useAppTheme } from "@/context/ThemeContext";
import Colors from "@/constants/Colors";
import { defaultStyles } from "@/constants/GlobalStyles";
import CustomButton from "@/components/CustomButton";
import CustomModal from "@/components/CustomModal";
import { collection, doc, getDocs, query, where, writeBatch } from "firebase/firestore";

export default function AccountSettingsRoute() {
  const router = useRouter();
  const { theme: colorScheme } = useAppTheme();
  const currentColors = Colors[colorScheme];

  const [newEmail, setNewEmail] = useState(auth.currentUser?.email || "");
  const [loading, setLoading] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalDescription, setModalDescription] = useState("");
  const [modalButtons, setModalButtons] = useState<any[]>([]);

  const scrollViewRef = useRef<ScrollView>(null);

  const currentEmail = auth.currentUser?.email || "";
  const hasEmailChanges =
    newEmail.trim().toLowerCase() !== currentEmail.toLowerCase();

  const triggerAlert = (
    title: string,
    message: string,
    onClosePress?: () => void,
    isSuccess: boolean = false
  ) => {
    setModalTitle(title);
    setModalDescription(message);
    setModalButtons([
      {
        text: "Got it",
        variant: isSuccess ? "tint" : "danger",
        onPress: () => {
          setModalVisible(false);
          if (onClosePress) onClosePress();
        },
      },
    ]);
    setModalVisible(true);
  };

  // Email Update Handler
  const handleEmailUpdate = async () => {
    const cleanEmail = newEmail.trim().toLowerCase();

    if (!cleanEmail) {
      triggerAlert("Hold on!", "Email field cannot be blank.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      triggerAlert(
        "Invalid Format",
        "Please enter a valid email address (e.g., user@example.com)."
      );
      return;
    }

    if (cleanEmail === currentEmail.toLowerCase()) {
      triggerAlert(
        "No Changes",
        "This email is already associated with your account."
      );
      return;
    }

    try {
      setLoading(true);
      const user = auth.currentUser;

      if (user) {
        await verifyBeforeUpdateEmail(user, cleanEmail);
        triggerAlert(
          "Verification Sent! ✉️",
          `A confirmation link was dispatched to ${cleanEmail}. Your email will update as soon as you confirm the link.`,
          undefined,
          true
        );
      }
    } catch (error: any) {
      console.error("Email update failed:", error);
      let message = "Could not update email. Please try again.";

      if (error.code === "auth/requires-recent-login") {
        message =
          "For security reasons, changing your email requires a fresh login. Please sign out and sign back in before trying again.";
      } else if (error.code === "auth/email-already-in-use") {
        message = "This email address is already claimed by another user.";
      }

      triggerAlert("Update Failed", message);
    } finally {
      setLoading(false);
    }
  };

  // Password Reset Handler
  const handlePasswordResetRequest = () => {
    router.push("/(auth)/reset-password");
  };

  // Log Out Handler
  const handleSignOutPress = () => {
    setModalTitle("Log Out");
    setModalDescription("Are you sure you want to sign out of your account?");
    setModalButtons([
      {
        text: "Cancel",
        variant: "tint",
        onPress: () => setModalVisible(false),
      },
      {
        text: "Log Out",
        variant: "danger",
        onPress: async () => {
          setModalVisible(false);
          try {
            await signOut(auth);
          } catch (error) {
            console.error("Sign out error:", error);
            triggerAlert("Error", "Could not log out. Please check your connection.");
          }
        },
      },
    ]);
    setModalVisible(true);
  };

  // Delete Account Handler
  const handleDeleteAccountPress = () => {
    setModalTitle("Delete Account");
    setModalDescription(
      "Are you sure you want to permanently delete your account? All habits, streak history, and friendships will be removed forever."
    );
    setModalButtons([
      {
        text: "Cancel",
        variant: "tint",
        onPress: () => setModalVisible(false),
      },
      {
        text: "Delete Forever",
        variant: "danger",
        onPress: () => {
          setModalVisible(false);
          executeCascadeDelete();
        },
      },
    ]);
    setModalVisible(true);
  };

  const executeCascadeDelete = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      setLoading(true);
      const batch = writeBatch(db);

      // Free up the unique username record
      if (user.displayName) {
        const usernameRef = doc(db, "usernames", user.displayName);
        batch.delete(usernameRef);
      }

      // Query and delete all habits created by this user
      const habitsQuery = query(
        collection(db, "habits"),
        where("userId", "==", user.uid)
      );
      const habitsSnapshot = await getDocs(habitsQuery);
      habitsSnapshot.forEach((habitDoc) => {
        batch.delete(habitDoc.ref);
      });

      // Query and delete all friendships involving this user
      const friendshipsQuery = query(
        collection(db, "friendships"),
        where("users", "array-contains", user.uid)
      );
      const friendshipsSnapshot = await getDocs(friendshipsQuery);
      friendshipsSnapshot.forEach((friendshipDoc) => {
        batch.delete(friendshipDoc.ref);
      });

      // Commit all Firestore deletions atomically
      await batch.commit();

      // Delete Firebase Auth user
      await deleteUser(user);

      // Root auth gatekeeper will catch null state and redirect to (auth)/login automatically
    } catch (error: any) {
      console.error("Cascade account deletion error:", error);
      let message = "Could not complete account deletion. Please try again.";

      if (error.code === "auth/requires-recent-login") {
        message =
          "For security reasons, deleting your account requires a fresh login. Please log out, sign back in, and try deleting again.";
      }

      triggerAlert("Deletion Failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[defaultStyles.safeArea, { backgroundColor: currentColors.background }]}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Account Settings",
          headerTintColor: currentColors.tint,
          headerStyle: { backgroundColor: currentColors.background },
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={defaultStyles.container}
          contentContainerStyle={defaultStyles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={defaultStyles.headerBox}>
            <Text style={[defaultStyles.title, { color: currentColors.text }]}>
              Account Management
            </Text>
            <Text style={{ color: "#94A3B8", fontSize: 14 }}>
              Manage your credentials, authentication session, and privacy.
            </Text>
          </View>

          {/* EMAIL MANAGEMENT */}
          <Text style={[defaultStyles.label, { color: currentColors.text }]}>
            Change Email
          </Text>
          <TextInput
            style={[
              defaultStyles.input,
              {
                backgroundColor: colorScheme === "dark" ? "#1E293B" : "#FFF",
                color: currentColors.text,
                borderColor: colorScheme === "dark" ? "#334155" : "#CBD5E1",
              },
            ]}
            value={newEmail}
            onChangeText={setNewEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <View style={{ marginTop: 8, marginBottom: 28 }}>
            <CustomButton
              text="Update Email"
              disabled={!hasEmailChanges || loading}
              variant="tint"
              onPress={handleEmailUpdate}
            />
          </View>

          {/* PASSWORD CHANGING */}
          <Text style={[defaultStyles.label, { color: currentColors.text }]}>
            Password Security
          </Text>
          <View
            style={[
              styles.card,
              {
                backgroundColor: colorScheme === "dark" ? "#1E293B" : "#F8FAFC",
              },
            ]}
          >
            <Text style={styles.cardSubtext}>
              Need to change your credentials? Send a secure recovery link to your
              current email address ({currentEmail}).
            </Text>
            <CustomButton
              text="Change Password"
              variant="tint"
              disabled={loading}
              onPress={handlePasswordResetRequest}
            />
          </View>

          {/* SESSION MANAGEMENT */}
          <Text style={[defaultStyles.label, { color: currentColors.text, marginTop: 16 }]}>
            Session
          </Text>
          <View
            style={[
              styles.card,
              {
                backgroundColor: colorScheme === "dark" ? "#1E293B" : "#F8FAFC",
              },
            ]}
          >
            <Text style={styles.cardSubtext}>
              Sign out of this device. You will need to enter your credentials to access your routines again.
            </Text>
            <CustomButton
              text="Log Out"
              variant="danger"
              disabled={loading}
              onPress={handleSignOutPress}
            />
          </View>

          {/* ACCOUNT DELETION */}
          <Text
            style={[
              defaultStyles.label,
              { color: "#EF4444", marginTop: 16 },
            ]}
          >
            Danger Zone
          </Text>
          <View
            style={[
              styles.card,
              {
                backgroundColor: colorScheme === "dark" ? "#1E293B" : "#F8FAFC",
                borderColor: "rgba(239, 68, 68, 0.3)",
              },
            ]}
          >
            <Text style={styles.cardSubtext}>
              Permanently delete your account, habits, streak records, and friend connections. This action cannot be reversed.
            </Text>
            <CustomButton
              text="Delete Account"
              variant="danger"
              disabled={loading}
              onPress={handleDeleteAccountPress}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomModal
        visible={modalVisible}
        title={modalTitle}
        description={modalDescription}
        onClose={() => setModalVisible(false)}
        buttons={modalButtons}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.12)",
    width: "100%",
    marginBottom: 12,
  },
  cardSubtext: {
    color: "#94A3B8",
    fontSize: 14,
    marginBottom: 14,
    lineHeight: 20,
  },
});