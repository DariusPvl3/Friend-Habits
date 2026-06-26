import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, useColorScheme, Alert, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../constants/Colors';

// Import our Firestore tools
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const CATEGORIES = ['Sports', 'Health', 'Free time', 'Work', 'Study'];

export default function AddHabitScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const currentColors = Colors[colorScheme];

  // Form State
  const [title, setTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Sports');
  const [frequency, setFrequency] = useState(7);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    // Basic Validation check
    if (!title.trim()) {
      Alert.alert('Hold on!', 'Please give your habit a title before saving.');
      return;
    }

    setIsSaving(true);

    try {
      // Push a brand new document straight into our 'habits' collection folder
      await addDoc(collection(db, 'habits'), {
        title: title.trim(),
        category: selectedCategory,
        frequency: frequency,
        streak: 0, // New habits start at 0
        completedToday: false, // Freshly added and waiting
        userId: 'test_user_1',
        history: {},
        createdAt: serverTimestamp() // Great practice to log server creation times
      });

      // Slide back to the main habits list screen smoothly
      router.back();
    } catch (error) {
      console.error("Error adding document to Firestore: ", error);
      Alert.alert('Error', 'Could not save habit. Check your internet connection.');
    } finally {
      setIsSaving(false);
    }
  };

  const decrementCounter = () => {
    if (frequency > 1) {
        setFrequency(frequency - 1);
    }
  };

  const incrementCounter = () => {
    if (frequency < 7) {
        setFrequency(frequency + 1);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
        <Stack.Screen 
            options={{ 
              headerShown: true, 
              title: "Create Habit",
              headerTintColor: currentColors.tint,
              headerStyle: { backgroundColor: currentColors.background },
              animation: 'slide_from_right'
            }} 
        />
        
        <View style={styles.formContainer}>
            <Text style={[styles.label, { color: currentColors.text }]}>What is your habit called?</Text>
            <TextInput 
            style={[styles.input, { 
                backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFF',
                color: currentColors.text,
                borderColor: colorScheme === 'dark' ? '#334155' : '#CBD5E1'
            }]}
            placeholder="e.g., Drink water, Meditate, Code..."
            placeholderTextColor="#64748B"
            value={title}
            onChangeText={setTitle}
            maxLength={40}
            />

            <Text style={[styles.label, { color: currentColors.text, marginTop: 24 }]}>Category</Text>
            <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                <TouchableOpacity
                    key={cat}
                    style={[
                    styles.categoryCard,
                    { 
                        backgroundColor: isSelected ? currentColors.tint : (colorScheme === 'dark' ? '#1E293B' : '#E2E8F0'),
                    }
                    ]}
                    onPress={() => setSelectedCategory(cat)}
                >
                    <Text style={[
                    styles.categoryText, 
                    { color: isSelected ? '#FFF' : (colorScheme === 'dark' ? '#94A3B8' : '#475569') }
                    ]}>
                    {cat}
                    </Text>
                </TouchableOpacity>
                );
            })}
            </View>

            <View>
                <Text style={[styles.label, { color: currentColors.text}]}>Days per week</Text>
                <View style={styles.counterRowContainer}>
                
                <TouchableOpacity style={styles.counterButton} onPress={decrementCounter}>
                    <Text style={styles.counterButtonText}>-</Text>
                </TouchableOpacity>

                <Text style={[styles.counterValueText, { color: currentColors.text }]}>
                    {frequency} {frequency === 1 ? 'day' : 'days'} / week
                </Text>

                <TouchableOpacity style={styles.counterButton} onPress={incrementCounter}>
                    <Text style={styles.counterButtonText}>+</Text>
                </TouchableOpacity>

                </View>
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
                <Text style={styles.saveButtonText}>Save Habit</Text>
            )}
            </TouchableOpacity>
        </View>
        </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  formContainer: { padding: 24, flex: 1 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  input: { height: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, fontSize: 16 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 40 },
  categoryCard: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  categoryText: { fontSize: 14, fontWeight: '600' },
  saveButton: { height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 'auto' },
  saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  counterRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    gap: 20,
    },
    counterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    },
    counterButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
    },
    counterValueText: {
    fontSize: 18,
    fontWeight: '600',
    minWidth: 120,
    textAlign: 'center',
    },
});