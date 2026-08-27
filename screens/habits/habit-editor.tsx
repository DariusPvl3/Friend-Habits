import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useRouter, Stack, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "@/context/ThemeContext";
import Colors from "../../constants/Colors";
import { defaultStyles } from "@/constants/GlobalStyles";
import { auth, db } from "../../config/firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const CATEGORIES = ["Sports", "Health", "Free time", "Work", "Study"];
const VISIBILITY_OPTIONS = [
  { label: "Private", icon: "lock-outline" },
  { label: "Friends", icon: "account-group-outline" },
  { label: "Public", icon: "earth" },
];

export default function HabitEditorScreen() {
  const router = useRouter();
  const { theme: colorScheme } = useAppTheme();
  const currentColors = Colors[colorScheme];
  const currentUser = auth.currentUser;

  const {
    mode,
    id,
    title: initialTitle,
    category: initialCategory,
    frequency: initialFrequency,
    visibility: initialVisibility
  } = useLocalSearchParams();

  const isEditing = mode === 'edit';

  // Form State
  const [title, setTitle] = useState(isEditing ? (initialTitle as string) : "");
  const [selectedCategory, setSelectedCategory] = useState(isEditing ? (initialCategory as string) : "Sports");
  const [frequency, setFrequency] = useState(isEditing ? Number(initialFrequency) : 7);
  const [visibility, setVisibility] = useState(isEditing ? (initialVisibility as string) : "Private")

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    // Basic Validation check
    if (!title.trim()) {
      Alert.alert("Hold on!", "Please give your habit a title before saving.");
      return;
    }

    setIsSaving(true);

    try {
      if(isEditing){
        const docRef = doc(db, "habits", id as string);
        await updateDoc(docRef, {
          title: title.trim(),
          category: selectedCategory,
          frequency: frequency,
          visibility: visibility
        });
      } else {
        // Push a brand new document straight into 'habits' collection folder
        await addDoc(collection(db, "habits"), {
          title: title.trim(),
          category: selectedCategory,
          frequency: frequency,
          streak: 0, // New habits start at 0
          visibility: visibility,
          completedToday: false,
          userId: currentUser?.uid,
          history: {},
          createdAt: serverTimestamp(), // log server creation times
        });
      }

      // Slide back to the main habits list screen
      router.back();
    } catch (error) {
      console.error("Error adding document to Firestore: ", error);
      Alert.alert(
        "Error",
        "Could not save habit. Check your internet connection.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const decrementCounter = () => { if (frequency > 1) { setFrequency(frequency - 1); } };
  const incrementCounter = () => { if (frequency < 7) { setFrequency(frequency + 1); } };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView
        style={[
          defaultStyles.container,
          { backgroundColor: currentColors.background },
        ]}
      >
        <Stack.Screen
          options={{
            headerShown: true,
            title: isEditing ? "Edit Habit" : "Create Habit",
            headerTintColor: currentColors.tint,
            headerStyle: { backgroundColor: currentColors.background },
            animation: "slide_from_right",
          }}
        />

        <View style={styles.formContainer}>
          <Text style={[defaultStyles.label, { color: currentColors.text }]}>
            What is your habit called?
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
            placeholder="e.g., Drink water, Meditate, Code..."
            placeholderTextColor="#64748B"
            value={title}
            onChangeText={setTitle}
            maxLength={40}
          />

          <Text
            style={[defaultStyles.label, { color: currentColors.text, marginTop: 24 }]}
          >
            Category
          </Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryCard,
                    {
                      backgroundColor: isSelected
                        ? currentColors.tint
                        : colorScheme === "dark"
                          ? "#1E293B"
                          : "#E2E8F0",
                    },
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      {
                        color: isSelected
                          ? "#FFF"
                          : colorScheme === "dark"
                            ? "#94A3B8"
                            : "#475569",
                      },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View>
            <Text style={[defaultStyles.label, { color: currentColors.text }]}>
              Days per week
            </Text>
            <View style={styles.counterRowContainer}>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={decrementCounter}
              >
                <Text style={styles.counterButtonText}>-</Text>
              </TouchableOpacity>

              <Text
                style={[styles.counterValueText, { color: currentColors.text }]}
              >
                {frequency} {frequency === 1 ? "day" : "days"} / week
              </Text>

              <TouchableOpacity
                style={styles.counterButton}
                onPress={incrementCounter}
              >
                <Text style={styles.counterButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text
            style={[defaultStyles.label, { color: currentColors.text, marginTop: 24 }]}
          >
            Visibility
          </Text>
          <View style={styles.categoryGrid}>
            {VISIBILITY_OPTIONS.map((option) => {
              const isSelected = visibility === option.label;
              const contentColor = isSelected
                ? "#FFF"
                : colorScheme === "dark"
                  ? "#94A3B8"
                  : "#475569";

              return (
                <TouchableOpacity
                  key={option.label}
                  style={[
                    styles.categoryCard,
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      backgroundColor: isSelected
                        ? currentColors.tint
                        : colorScheme === "dark"
                          ? "#1E293B"
                          : "#E2E8F0",
                    },
                  ]}
                  onPress={() => setVisibility(option.label)}
                >
                  <MaterialCommunityIcons 
                    name={option.icon as any} 
                    size={16} 
                    color={contentColor} 
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      { color: contentColor },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Action Button Container */}
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: currentColors.tint }]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveButtonText}>
                {isEditing ? "Save Changes" : "Save Habit"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  formContainer: { padding: 24, flex: 1 },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 40,
  },
  categoryCard: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  categoryText: { fontSize: 14, fontWeight: "600" },
  saveButton: {
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: "auto",
  },
  saveButtonText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
  counterRowContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
    gap: 20,
  },
  counterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },
  counterButtonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0F172A",
  },
  counterValueText: {
    fontSize: 18,
    fontWeight: "600",
    minWidth: 120,
    textAlign: "center",
  },
});
