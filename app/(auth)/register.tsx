import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TextInput, 
  KeyboardAvoidingView, ScrollView, TouchableWithoutFeedback, Keyboard, Platform, 
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useAppTheme } from '@/context/ThemeContext';
import Colors from '../../constants/Colors';
import CustomButton from '@/components/CustomButton';
import CustomModal from '@/components/CustomModal';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const router = useRouter();
  const { theme: colorScheme } = useAppTheme();
  const currentColors = Colors[colorScheme];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDescription, setModalDescription] = useState('');

  const triggerAlert = (title: string, message: string) => {
    setModalTitle(title);
    setModalDescription(message);
    setAlertModalVisible(true);
  };

  const handleRegister = async () => {
    // validation Logic checks feeding into CustomModal
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      triggerAlert("Hold on!", "Please fill in all layout fields to register.");
      return;
    }

    if (password !== confirmPassword) {
      triggerAlert("Mismatch", "Passwords do not match. Double-check your entry.");
      return;
    }

    if (password.length < 6) {
      triggerAlert("Weak Password", "Firebase security protocols require passwords to be at least 6 characters.");
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_+\-=\[\]\\\/]).+$/;
    
    if (!passwordRegex.test(password)) {
      triggerAlert(
        "Password Too Simple", 
        "For account security, your password must contain at least:\n• One uppercase letter (A-Z)\n• One lowercase letter (a-z)\n• One numeric digit (0-9)\n• One special character (e.g., !, @, #, $, %)"
      );
      return;
    }

    try {
      setLoading(true);
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      // Global route guard automatically redirects user to dashboard on success
    } catch (error: any) {
      console.error(error);
      let localizedError = "Could not create account. Please try again.";
      
      // Handle explicit Firebase sign up errors cleanly
      if (error.code === 'auth/email-already-in-use') {
        localizedError = "An account with this email address already exists.";
      } else if (error.code === 'auth/invalid-email') {
        localizedError = "The email structure entered is invalid.";
      }
      
      triggerAlert("Registration Failed", localizedError);
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
              <Text style={[styles.title, { color: currentColors.text }]}>Join the Habit Tracking Community</Text>
              <Text style={styles.subtitle}>Create an account to start locking in daily targets with your friends.</Text>
            </View>

            <View style={styles.form}>
              <Text style={[styles.label, { color: currentColors.text }]}>Email Address</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFF',
                  color: currentColors.text,
                  borderColor: colorScheme === 'dark' ? '#334155' : '#CBD5E1'
                }]}
                placeholder="your.email@example.com"
                placeholderTextColor="#64748B"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <Text style={[styles.label, { color: currentColors.text, marginTop: 16 }]}>Password</Text>
              <View style={[styles.passwordInputContainer, { 
                backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFF',
                borderColor: colorScheme === 'dark' ? '#334155' : '#CBD5E1' 
              }]}>
                <TextInput
                  style={[styles.passwordField, { color: currentColors.text }]}
                  placeholder="Minimum 6 characters"
                  placeholderTextColor="#64748B"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!isPasswordVisible}
                  autoCapitalize="none"
                />
                <TouchableOpacity 
                  style={styles.eyeIconButton}
                  onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                >
                  <MaterialCommunityIcons 
                    name={isPasswordVisible ? 'eye-off' : 'eye'} 
                    size={22} 
                    color="#94A3B8" 
                  />
                </TouchableOpacity>
              </View>

              <Text style={[styles.label, { color: currentColors.text, marginTop: 16 }]}>Confirm Password</Text>
              <View style={[styles.passwordInputContainer, { 
                backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFF',
                borderColor: colorScheme === 'dark' ? '#334155' : '#CBD5E1' 
              }]}>
                <TextInput
                  style={[styles.passwordField, { color: currentColors.text }]}
                  placeholder="••••••••"
                  placeholderTextColor="#64748B"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!isConfirmPasswordVisible}
                  autoCapitalize="none"
                />
                <TouchableOpacity 
                  style={styles.eyeIconButton}
                  onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                >
                  <MaterialCommunityIcons 
                    name={isConfirmPasswordVisible ? 'eye-off' : 'eye'} 
                    size={22} 
                    color="#94A3B8" 
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.actionSpace}>
                <CustomButton 
                  text={loading ? "Creating Account..." : "Sign Up"} 
                  variant="tint" 
                  onPress={handleRegister} 
                />
                <CustomButton text="Already have an account? Log In" variant="outline" onPress={() => router.back()} />
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
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingLeft: 16,
    paddingRight: 8,
    width: '100%',
  },
  passwordField: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  eyeIconButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});