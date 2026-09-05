import React, { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { auth } from "@/config/firebase";
import { useAppTheme } from "@/context/ThemeContext";
import Colors from "@/constants/Colors";
import { defaultStyles } from "@/constants/GlobalStyles";
import CustomButton from "@/components/CustomButton";
import CustomModal from "@/components/CustomModal";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { theme: colorScheme } = useAppTheme();
  const currentColors = Colors[colorScheme];

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isCurrentVisible, setIsCurrentVisible] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalDescription, setModalDescription] = useState("");
  const [modalButtons, setModalButtons] = useState<any[]>([]);

  const scrollViewRef = useRef<ScrollView>(null);

  const triggerAlert = (
    title: string,
    message: string,
    onSuccess?: () => void,
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
          if (onSuccess) onSuccess();
        },
      },
    ]);
    setModalVisible(true);
  };

  const handlePasswordSubmit = async () => {
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      triggerAlert("Missing Fields", "Please fill in all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      triggerAlert("Mismatch", "The new passwords do not match. Please verify them.");
      return;
    }

    if (currentPassword === newPassword) {
      triggerAlert(
        "Same Password",
        "Your new password must be different from your current password."
      );
      return;
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_+\-=\[\]\\\/]).{6,}$/;
    if (!passwordRegex.test(newPassword)) {
      triggerAlert(
        "Weak Password",
        "Password must be at least 6 characters and include an uppercase letter, a lowercase letter, a digit, and a special character."
      );
      return;
    }

    const user = auth.currentUser;
    if (!user || !user.email) {
      triggerAlert("Error", "No active session found. Please sign in again.");
      return;
    }

    try {
      setSubmitting(true);

      // 1. Re-authenticate user with current password to satisfy security requirements
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword.trim()
      );
      await reauthenticateWithCredential(user, credential);

      // 2. Perform direct in-app password update
      await updatePassword(user, newPassword.trim());

      triggerAlert(
        "Password Updated! 🎉",
        "Your account password has been successfully updated.",
        () => {
          router.back();
        },
        true
      );
    } catch (err: any) {
      console.error("Password update error:", err);
      let message = "Could not update password. Please try again.";

      if (
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        message = "The current password you entered is incorrect.";
      } else if (err.code === "auth/weak-password") {
        message = "The password is too weak. Please use a stronger combination.";
      } else if (err.code === "auth/too-many-requests") {
        message = "Too many failed attempts. Please wait a moment and try again.";
      }

      triggerAlert("Update Failed", message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={[defaultStyles.safeArea, { backgroundColor: currentColors.background }]}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Change Password",
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
              Change Password
            </Text>
            <Text style={{ color: "#94A3B8", fontSize: 14, marginTop: 4, lineHeight: 20 }}>
              Enter your current credentials along with your new password to verify and apply changes.
            </Text>
          </View>

          {/* CURRENT PASSWORD */}
          <Text style={[defaultStyles.label, { color: currentColors.text }]}>
            Current Password
          </Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                defaultStyles.input,
                styles.passwordInput,
                {
                  backgroundColor: colorScheme === "dark" ? "#1E293B" : "#FFF",
                  color: currentColors.text,
                  borderColor: colorScheme === "dark" ? "#334155" : "#CBD5E1",
                },
              ]}
              secureTextEntry={!isCurrentVisible}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setIsCurrentVisible(!isCurrentVisible)}
            >
              <MaterialCommunityIcons
                name={isCurrentVisible ? "eye-off-outline" : "eye-outline"}
                size={22}
                color="#94A3B8"
              />
            </TouchableOpacity>
          </View>

          {/* NEW PASSWORD */}
          <Text style={[defaultStyles.label, { color: currentColors.text, marginTop: 14 }]}>
            New Password
          </Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                defaultStyles.input,
                styles.passwordInput,
                {
                  backgroundColor: colorScheme === "dark" ? "#1E293B" : "#FFF",
                  color: currentColors.text,
                  borderColor: colorScheme === "dark" ? "#334155" : "#CBD5E1",
                },
              ]}
              secureTextEntry={!isPasswordVisible}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            >
              <MaterialCommunityIcons
                name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                size={22}
                color="#94A3B8"
              />
            </TouchableOpacity>
          </View>

          {/* CONFIRM NEW PASSWORD */}
          <Text style={[defaultStyles.label, { color: currentColors.text, marginTop: 14 }]}>
            Confirm New Password
          </Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                defaultStyles.input,
                styles.passwordInput,
                {
                  backgroundColor: colorScheme === "dark" ? "#1E293B" : "#FFF",
                  color: currentColors.text,
                  borderColor: colorScheme === "dark" ? "#334155" : "#CBD5E1",
                },
              ]}
              secureTextEntry={!isConfirmVisible}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-type new password"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setIsConfirmVisible(!isConfirmVisible)}
            >
              <MaterialCommunityIcons
                name={isConfirmVisible ? "eye-off-outline" : "eye-outline"}
                size={22}
                color="#94A3B8"
              />
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 28 }}>
            <CustomButton
              text={submitting ? "Updating..." : "Update Password"}
              disabled={submitting || !currentPassword || !newPassword || !confirmPassword}
              variant="tint"
              onPress={handlePasswordSubmit}
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
  inputContainer: {
    position: "relative",
    width: "100%",
    justifyContent: "center",
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeIcon: {
    position: "absolute",
    right: 14,
    marginBottom: 16,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});