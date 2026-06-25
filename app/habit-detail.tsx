import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View, TouchableOpacity, useColorScheme, TextInput } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../constants/Colors';

import { db } from '../config/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';

const CATEGORIES = ['Sports', 'Health', 'Free time', 'Work', 'Study'];

export default function HabitDetailScreen() {
  const router = useRouter();
  
  // Grab frequency from params (fallback to 7 if it wasn't passed yet)
  const { id, title, category, streak, frequency: initialFrequency } = useLocalSearchParams();
  const displayTitle = title as string;

  const colorScheme = useColorScheme() ?? 'light';
  const currentColors = Colors[colorScheme];

  // Editing states for all editable fields
  const [isEditing, setIsEditing] = useState(false);
  const [updatedTitle, setUpdatedTitle] = useState(title as string);
  const [updatedCategory, setUpdatedCategory] = useState(category as string);
  const [updatedFrequency, setUpdatedFrequency] = useState(Number(initialFrequency) || 7);

  // Counter logic handlers
  const decrementCounter = () => { if (updatedFrequency > 1) setUpdatedFrequency(updatedFrequency - 1); };
  const incrementCounter = () => { if (updatedFrequency < 7) setUpdatedFrequency(updatedFrequency + 1); };

  const handleUpdate = async () => {
    if (!updatedTitle.trim()) {
      Alert.alert("Hold on!", "Please enter a valid title before saving.");
      return;
    }

    try {
      const docRef = doc(db, 'habits', id as string);
      
      // Update all three fields in Firestore
      await updateDoc(docRef, {
        title: updatedTitle.trim(),
        category: updatedCategory,
        frequency: updatedFrequency,
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating habit document: ", error);
      Alert.alert("Error", "Could not save changes. Check your internet connection.");
    }
  };

  const executeDelete = async () => {
    try {
      const docRef = doc(db, 'habits', id as string);
      await deleteDoc(docRef);
      router.back();
    } catch (error) {
      console.error("Error deleting habit document: ", error);
      Alert.alert("Error", "Could not delete habit. Please check your internet connection.");
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      "Delete Habit",
      `Are you sure you want to permanently delete "${title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: executeDelete }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
      <Stack.Screen 
        options={{ 
          headerShown: true, 
          title: isEditing ? "Edit Habit" : displayTitle,
          headerTintColor: currentColors.tint,
          headerStyle: { backgroundColor: currentColors.background }
        }} 
      />

      {isEditing ? (
        /* --- EDIT MODE VIEW --- */
        <View style={styles.content}>
          <Text style={[styles.label, { color: currentColors.text }]}>Habit Name</Text>
          <TextInput 
            style={[styles.input, { 
                backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFF',
                color: currentColors.text,
                borderColor: colorScheme === 'dark' ? '#334155' : '#CBD5E1'
            }]}
            value={updatedTitle}
            onChangeText={setUpdatedTitle}
            maxLength={40}
          />

          <Text style={[styles.label, { color: currentColors.text, marginTop: 20 }]}>Category</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => {
              const isSelected = updatedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryCard, { backgroundColor: isSelected ? currentColors.tint : (colorScheme === 'dark' ? '#1E293B' : '#E2E8F0') }]}
                  onPress={() => setUpdatedCategory(cat)}
                >
                  <Text style={[styles.categoryText, { color: isSelected ? '#FFF' : (colorScheme === 'dark' ? '#94A3B8' : '#475569') }]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.label, { color: currentColors.text, marginTop: 10 }]}>Target Frequency</Text>
          <View style={styles.counterRowContainer}>
            <TouchableOpacity style={styles.counterButton} onPress={decrementCounter}>
              <Text style={styles.counterButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={[styles.counterValueText, { color: currentColors.text }]}>
              {updatedFrequency} {updatedFrequency === 1 ? 'day' : 'days'} / week
            </Text>
            <TouchableOpacity style={styles.counterButton} onPress={incrementCounter}>
              <Text style={styles.counterButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* --- READ MODE VIEW --- */
        <View style={styles.content}>
          <Text style={[styles.title, { color: currentColors.text }]}>{updatedTitle}</Text>
          <Text style={styles.subtext}>Category: {updatedCategory}</Text>
          <Text style={styles.subtext}>Weekly Target: {updatedFrequency} {updatedFrequency === 1 ? 'day' : 'days'} / week</Text>
          <Text style={styles.subtext}>Current Streak: {streak} days</Text>
        </View>
      )}
      
      {/* Dynamic Button Deck */}
      <View style={styles.buttonContainer}>
        {isEditing ? (
          <>
            <TouchableOpacity style={[styles.button, { backgroundColor: '#34D399' }]} onPress={handleUpdate} activeOpacity={0.8}>
              <Text style={styles.buttonText}>Save Changes</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, { backgroundColor: '#64748B' }]} 
              onPress={() => {
                setIsEditing(false);
                setUpdatedTitle(title as string);
                setUpdatedCategory(category as string);
                setUpdatedFrequency(Number(initialFrequency) || 7);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={[styles.button, { backgroundColor: currentColors.tint }]} onPress={() => setIsEditing(true)} activeOpacity={0.8}>
              <Text style={styles.buttonText}>Edit Habit</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, { backgroundColor: '#EF4444' }]} onPress={confirmDelete} activeOpacity={0.8}>
              <Text style={styles.buttonText}>Delete Habit</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    width: '100%',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  input: { 
    height: 50, 
    borderWidth: 1, 
    borderRadius: 12, 
    paddingHorizontal: 16, 
    fontSize: 16,
    width: '100%',
    marginBottom: 10
  },
  categoryGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 8, 
    marginVertical: 8,
    width: '100%'
  },
  categoryCard: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  categoryText: { fontSize: 14, fontWeight: '600' },
  counterRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    gap: 20,
    width: '100%'
  },
  counterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterButtonText: { fontSize: 20, fontWeight: 'bold', color: '#0F172A' },
  counterValueText: { fontSize: 18, fontWeight: '600', minWidth: 120, textAlign: 'center' },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtext: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    marginTop: 'auto',
    width: '100%',
  },
  button: {
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12, 
    width: '100%',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});