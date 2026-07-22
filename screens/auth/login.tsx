import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../../config/firebase";
import { useAppTheme } from "@/context/ThemeContext";
import Colors from "../../constants/Colors";
import { defaultStyles } from "@/constants/GlobalStyles";
import CustomButton from "@/components/CustomButton";
import CustomModal from "@/components/CustomModal";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const router = useRouter();
  const { theme: colorScheme } = useAppTheme();
  const currentColors = Colors[colorScheme];

  const scrollViewRef = React.useRef<ScrollView>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalDescription, setModalDescription] = useState("");
  const [modalVariant, setModalVariant] = useState<"success" | "danger">(
    "danger",
  );

  const triggerAlert = (
    title: string,
    message: string,
    variant: "success" | "danger" = "danger",
  ) => {
    setModalTitle(title);
    setModalDescription(message);
    setModalVariant(variant);
    setAlertModalVisible(true);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      triggerAlert("Hold on!", "Please fill in all fields before logging in.");
      return;
    }

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error: any) {
      console.error(error);
      let localizedError = "Invalid email or password. Please try again.";
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        localizedError =
          "The credentials you entered do not match our records.";
      } else if (error.code === "auth/invalid-email") {
        localizedError = "Please enter a valid email address structure.";
      }
      triggerAlert("Login Failed", localizedError, "danger");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      triggerAlert(
        "Email Required",
        "Please type your email address into the input field above first, then click reset.",
        "danger",
      );
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email.trim());
      triggerAlert(
        "Email Sent! ✉️",
        `A password reset link has been dispatched to ${email.trim()}. Check your spam folder if it doesn't arrive shortly.`,
        "success",
      );
    } catch (error: any) {
      console.error(error);
      triggerAlert(
        "Reset Failed",
        error.message || "Could not process password reset request.",
      );
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView
        style={[defaultStyles.safeArea, { backgroundColor: currentColors.background }]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={defaultStyles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={defaultStyles.container}>
              <View style={defaultStyles.headerBox}>
                <Text style={[defaultStyles.title, { color: currentColors.text }]}>
                  Welcome Back!
                </Text>
                <Text style={defaultStyles.subtitle}>
                  Log in to keep track of your habits with friends.
                </Text>
              </View>

              <View style={defaultStyles.form}>
                <Text style={[defaultStyles.label, { color: currentColors.text }]}>
                  Email Address
                </Text>
                <TextInput
                  style={[
                    defaultStyles.input,
                    {
                      backgroundColor:
                        colorScheme === "dark" ? "#1E293B" : "#FFF",
                      color: currentColors.text,
                      borderColor: colorScheme === "dark" ? "#334155" : "#CBD5E1",
                    },
                  ]}
                  placeholder="your.email@example.com"
                  placeholderTextColor="#64748B"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onFocus={() =>
                    scrollViewRef.current?.scrollTo({ y: 0, animated: true })
                  }
                />

                <Text
                  style={[
                    defaultStyles.label,
                    { color: currentColors.text, marginTop: 16 },
                  ]}
                >
                  Password
                </Text>
                <View
                  style={[
                    defaultStyles.passwordInputContainer,
                    {
                      backgroundColor:
                        colorScheme === "dark" ? "#1E293B" : "#FFF",
                      borderColor: colorScheme === "dark" ? "#334155" : "#CBD5E1",
                    },
                  ]}
                >
                  <TextInput
                    style={[defaultStyles.passwordField, { color: currentColors.text }]}
                    placeholder="••••••••"
                    placeholderTextColor="#64748B"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!isPasswordVisible}
                    autoCapitalize="none"
                    onFocus={() =>
                      scrollViewRef.current?.scrollTo({ y: 80, animated: true })
                    }
                  />
                  <TouchableOpacity
                    style={defaultStyles.eyeIconButton}
                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                  >
                    <MaterialCommunityIcons
                      name={isPasswordVisible ? "eye-off" : "eye"}
                      size={22}
                      color="#94A3B8"
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={defaultStyles.inputHelperAnchor}
                  onPress={handleForgotPassword}
                >
                  <Text
                    style={[
                      defaultStyles.inputHelperText,
                      { color: currentColors.tint },
                    ]}
                  >
                    Forgot Password?
                  </Text>
                </TouchableOpacity>

                <View style={defaultStyles.actionSpace}>
                  <CustomButton
                    text={loading ? "Logging in..." : "Log In"}
                    variant="tint"
                    onPress={handleLogin}
                  />
                  <CustomButton
                    text="Create an Account"
                    variant="outline"
                    onPress={() => router.push("/(auth)/register")}
                  />
                </View>
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
            {
              text: "Got it",
              variant: modalVariant === "success" ? "tint" : "danger",
              onPress: () => setAlertModalVisible(false),
            },
          ]}
        />
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}
