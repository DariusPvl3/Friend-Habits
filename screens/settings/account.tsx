import CustomButton from "@/components/CustomButton";
import CustomModal from "@/components/CustomModal";
import Colors from "@/constants/Colors";
import { defaultStyles } from "@/constants/GlobalStyles";
import { useAppTheme } from "@/context/ThemeContext";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
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
import {
  verifyBeforeUpdateEmail,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "@/config/firebase";
import React from "react";

export default function AccountSettingsRoute(){
  const router = useRouter();
  const { theme: colorScheme } = useAppTheme();
  const currentColors = Colors[colorScheme];

  const [newEmail, setNewEmail] = useState(auth.currentUser?.email || "");
  const [loading, setLoading] = useState(false);

  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalDescription, setModalDescription] = useState("");
  const [modalOnCloseAction, setModalOnCloseAction] = useState<() => void>(
    () => {},
  );

  const scrollViewRef = React.useRef<ScrollView>(null);

  const hasChanges = newEmail.trim().toLowerCase() !== (auth.currentUser?.email || "").toLowerCase();

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

  const handleAccountSave = async () => {
    if (!newEmail.trim()) {
      triggerAlert("Hold on!", "Email field cannot be blank.");
      return;
    }

    try {
      setLoading(true);
      const user = auth.currentUser;

      if (user) {
        let requiresVerificationAlert = false;

        // Conditional Email update check
        if (newEmail.trim().toLowerCase() !== (user.email || "").toLowerCase()) {
          await verifyBeforeUpdateEmail(user, newEmail.trim().toLowerCase());
          requiresVerificationAlert = true;
        }

        await user.reload();

        if (requiresVerificationAlert) {
          triggerAlert(
            "Account Updated!",
            "Your changes are live. Check your inbox at the new email address to verify and complete your account email update!",
            () => {
              setAlertModalVisible(false);
              router.back();
            },
          );
        } else {
          triggerAlert(
            "Changes Saved!",
            "Your account information has been successfully synced.",
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
      style={[defaultStyles.safeArea, { backgroundColor: currentColors.background }]}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Settings",
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
          style={defaultStyles.container}
          contentContainerStyle={defaultStyles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled" 
          automaticallyAdjustKeyboardInsets={true}
        >
          <View style={defaultStyles.headerBox}>
            <Text style={[defaultStyles.title, { color: currentColors.text }]}>
              View and Edit Account Details
            </Text>
          </View>

          <View style={defaultStyles.form}>
            <Text style={[defaultStyles.label, { color: currentColors.text }]}>
              Change e-mail
            </Text>
            <TextInput
              style={[defaultStyles.input, { 
                backgroundColor: colorScheme === "dark" ? "#1E293B" : "#FFF",
                color: currentColors.text,
                borderColor: colorScheme === "dark" ? "#334155" : "#CBD5E1",
              }]}
              value={newEmail}
              onChangeText={setNewEmail}
              autoCapitalize="none"
              onFocus={() => scrollViewRef.current?.scrollTo({ y: 180, animated: true })}
            />

            <Text style={[defaultStyles.label, { color: currentColors.text, marginTop: 16 }]}>
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

            <View style={defaultStyles.actionSpace}>
              <CustomButton
                text="Save Changes"
                disabled={!hasChanges || loading}
                variant="tint"
                onPress={handleAccountSave}
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
  securityCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.12)",
    width: "100%",
    marginBottom: 12,
  },
});