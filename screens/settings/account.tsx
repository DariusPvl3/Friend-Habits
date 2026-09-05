import React, { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TouchableOpacity,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import {
  verifyBeforeUpdateEmail,
  signOut,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { auth, db } from "@/config/firebase";
import { useAppTheme } from "@/context/ThemeContext";
import Colors from "@/constants/Colors";
import { defaultStyles } from "@/constants/GlobalStyles";
import CustomButton from "@/components/CustomButton";
import CustomModal from "@/components/CustomModal";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { checkIsOnline } from "@/services/networkService";

export default function AccountSettingsRoute() {
  const router = useRouter();
  const { theme: colorScheme } = useAppTheme();
  const currentColors = Colors[colorScheme];

  const [newEmail, setNewEmail] = useState(auth.currentUser?.email || "");
  const [loading, setLoading] = useState(false);

  // Security Wall: Password Confirmation State
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Alert Modal State
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

  // Email Update Handler with Network Check
  const handleEmailUpdate = async () => {
    const isOnline = await checkIsOnline();
    if (!isOnline) {
      triggerAlert(
        "Network Error",
        "You appear to be offline. Please connect to the internet to update your email."
      );
      return;
    }

    const cleanEmail = newEmail.trim().toLowerCase();
    if (!cleanEmail) {
      triggerAlert("Hold on!", "Email field cannot be blank.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      triggerAlert("Invalid Format", "Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);
      const user = auth.currentUser;
      if (user) {
        await verifyBeforeUpdateEmail(user, cleanEmail);
        triggerAlert(
          "Verification Sent! ✉️",
          `A confirmation link was dispatched to ${cleanEmail}. Your email will update once confirmed.`,
          undefined,
          true
        );
      }
    } catch (error: any) {
      let message = "Could not update email. Please try again.";
      if (error.code === "auth/requires-recent-login") {
        message = "Session expired. Please sign out and sign back in to update your email.";
      }
      triggerAlert("Update Failed", message);
    } finally {
      setLoading(false);
    }
  };

  // Initial Danger Confirmation
  const handleDeleteAccountPress = () => {
    setModalTitle("Delete Account");
    setModalDescription(
      "Are you sure you want to permanently delete your account? All habits, history, and friendships will be removed forever."
    );
    setModalButtons([
      {
        text: "Cancel",
        variant: "tint",
        onPress: () => setModalVisible(false),
      },
      {
        text: "Continue",
        variant: "danger",
        onPress: () => {
          setModalVisible(false);
          setPasswordError("");
          setConfirmPasswordInput("");
          setPasswordModalVisible(true);
        },
      },
    ]);
    setModalVisible(true);
  };

  // Authenticated Cascade Deletion
  const handleFinalPasswordConfirmation = async () => {
    const isOnline = await checkIsOnline();
    if (!isOnline) {
      setPasswordError("No internet connection detected. Please connect to the internet to proceed.");
      return;
    }

    if (!confirmPasswordInput.trim()) {
      setPasswordError("Please enter your current password to proceed.");
      return;
    }

    const user = auth.currentUser;
    if (!user || !user.email) return;

    try {
      setLoading(true);
      setPasswordError("");

      // Re-authenticate with password
      const credential = EmailAuthProvider.credential(user.email, confirmPasswordInput.trim());
      await reauthenticateWithCredential(user, credential);

      // Dismiss the password modal upon successful authentication
      setPasswordModalVisible(false);

      // Atomic Firestore cleanup
      const batch = writeBatch(db);

      if (user.displayName) {
        const usernameRef = doc(db, "usernames", user.displayName);
        batch.delete(usernameRef);
      }

      const habitsSnapshot = await getDocs(
        query(collection(db, "habits"), where("userId", "==", user.uid))
      );
      habitsSnapshot.forEach((habitDoc) => {
        batch.delete(habitDoc.ref);
      });

      const friendshipsSnapshot = await getDocs(
        query(collection(db, "friendships"), where("users", "array-contains", user.uid))
      );
      friendshipsSnapshot.forEach((friendshipDoc) => {
        batch.delete(friendshipDoc.ref);
      });

      await batch.commit();

      // Delete Auth Record
      await deleteUser(user);
    } catch (error: any) {
      console.error("Account deletion failed:", error);
      if (
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        setPasswordError("Incorrect password. Please verify and try again.");
      } else {
        setPasswordModalVisible(false);
        triggerAlert("Deletion Failed", error.message || "An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[defaultStyles.safeArea, { backgroundColor: currentColors.background }]}>
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
            <Text style={{ color: "#94A3B8", fontSize: 14, marginTop: 4 }}>
              Manage your credentials, authentication session, and privacy.
            </Text>
          </View>

          {/* EMAIL SETTINGS */}
          <Text style={[defaultStyles.label, { color: currentColors.text }]}>Change Email</Text>
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

          {/* PASSWORD RESET */}
          <Text style={[defaultStyles.label, { color: currentColors.text }]}>Password Security</Text>
          <View
            style={[
              styles.card,
              { backgroundColor: colorScheme === "dark" ? "#1E293B" : "#F8FAFC" },
            ]}
          >
            <Text style={styles.cardSubtext}>
              Update your security credentials directly in the app.
            </Text>
            <CustomButton
              text="Change Password"
              variant="tint"
              disabled={loading}
              onPress={() => router.push("/(auth)/reset-password")}
            />
          </View>

          {/* LOG OUT */}
          <Text style={[defaultStyles.label, { color: currentColors.text, marginTop: 16 }]}>
            Session
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: colorScheme === "dark" ? "#1E293B" : "#F8FAFC" },
            ]}
          >
            <Text style={styles.cardSubtext}>
              Sign out of this device.
            </Text>
            <CustomButton
              text="Log Out"
              variant="danger"
              disabled={loading}
              onPress={() => {
                setModalTitle("Log Out");
                setModalDescription("Are you sure you want to sign out?");
                setModalButtons([
                  { text: "Cancel", variant: "tint", onPress: () => setModalVisible(false) },
                  {
                    text: "Log Out",
                    variant: "danger",
                    onPress: async () => {
                      setModalVisible(false);
                      await signOut(auth);
                    },
                  },
                ]);
                setModalVisible(true);
              }}
            />
          </View>

          {/* DANGER ZONE */}
          <Text style={[defaultStyles.label, { color: "#EF4444", marginTop: 16 }]}>
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
              Permanently delete your account, habits, streak records, and friend connections.
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

      {/* RE-AUTHENTICATION PASSWORD CONFIRMATION MODAL */}
      <Modal
        visible={passwordModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: colorScheme === "dark" ? "#1E293B" : "#FFFFFF" },
            ]}
          >
            <Text style={[styles.modalTitle, { color: currentColors.text }]}>
              Confirm Password
            </Text>
            <Text style={styles.modalSubtitle}>
              Please enter your password to confirm permanent account deletion.
            </Text>

            <View style={styles.passwordInputWrapper}>
              <TextInput
                style={[
                  defaultStyles.input,
                  styles.passwordField,
                  {
                    backgroundColor: colorScheme === "dark" ? "#0F172A" : "#F8FAFC",
                    color: currentColors.text,
                    borderColor: passwordError
                      ? "#EF4444"
                      : colorScheme === "dark"
                      ? "#334155"
                      : "#CBD5E1",
                  },
                ]}
                placeholder="Enter password"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!isConfirmPasswordVisible}
                value={confirmPasswordInput}
                onChangeText={(text) => {
                  setConfirmPasswordInput(text);
                  setPasswordError("");
                }}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
              >
                <MaterialCommunityIcons
                  name={isConfirmPasswordVisible ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color="#94A3B8"
                />
              </TouchableOpacity>
            </View>

            {passwordError ? (
              <Text style={styles.errorText}>{passwordError}</Text>
            ) : null}

            <View style={styles.modalActions}>
              <CustomButton
                text="Cancel"
                variant="neutral"
                style={{flex: 1}}
                onPress={() => setPasswordModalVisible(false)}
              />
              <CustomButton
                text={loading ? "Deleting..." : "Confirm Delete"}
                variant="danger"
                style={{flex: 1}}
                disabled={loading || !confirmPasswordInput}
                onPress={handleFinalPasswordConfirmation}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* STANDARD MODAL */}
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContainer: {
    width: "100%",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#94A3B8",
    lineHeight: 20,
    marginBottom: 20,
  },
  passwordInputWrapper: {
    position: "relative",
    width: "100%",
    justifyContent: "center",
  },
  passwordField: {
    paddingRight: 48,
    marginBottom: 0,
  },
  eyeIcon: {
    position: "absolute",
    right: 14,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 13,
    marginTop: 8,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    width: "100%",
  },
});