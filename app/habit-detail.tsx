import React, { useState, useEffect } from 'react';
import { Alert, StyleSheet, Text, View, TouchableOpacity, useColorScheme, TextInput, ScrollView } from 'react-native';
import { useLocalSearchParams, Stack, useRouter, useNavigation } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import Colors from '../constants/Colors';

import { db } from '../config/firebase';
import { doc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import CustomModal from '@/components/CustomModal';
import CustomButton from '@/components/CustomButton';

const CATEGORIES = ['Sports', 'Health', 'Free time', 'Work', 'Study'];

export default function HabitDetailScreen() {
  const router = useRouter();
  
  const { id, title, category, streak, frequency: initialFrequency } = useLocalSearchParams();

  const colorScheme = useColorScheme() ?? 'light';
  const currentColors = Colors[colorScheme];

  const [isEditing, setIsEditing] = useState(false);
  const [updatedTitle, setUpdatedTitle] = useState(title as string);
  const [updatedCategory, setUpdatedCategory] = useState(category as string);
  const [updatedFrequency, setUpdatedFrequency] = useState(Number(initialFrequency) || 7);

  const [habitHistory, setHabitHistory] = useState<Record<string, 'completed' | 'skipped' | 'failed'>>({});

  const [confirmEditModalVisible, setConfirmEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const [pendingNavigationAction, setPendingNavigationAction] = useState<any>(null);

  const decrementCounter = () => { if (updatedFrequency > 1) setUpdatedFrequency(updatedFrequency - 1); };
  const incrementCounter = () => { if (updatedFrequency < 7) setUpdatedFrequency(updatedFrequency + 1); };

  const hasUnsavedChanges = updatedTitle !== title || updatedCategory !== category || updatedFrequency !== Number(initialFrequency);

  useEffect(() => {
    const docRef = doc(db, 'habits', id as string);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setHabitHistory(data.history || {});
      }
    });

    return () => unsubscribe();
  }, [id]);

  const handleUpdate = async () => {
    if (!updatedTitle.trim()) {
      Alert.alert("Hold on!", "Please enter a valid title before saving.");
      return;
    }

    try {
      const docRef = doc(db, 'habits', id as string);
      await updateDoc(docRef, {
        title: updatedTitle.trim(),
        category: updatedCategory,
        frequency: updatedFrequency,
      });
      
      setConfirmEditModalVisible(false);
      setIsEditing(false);
      router.back();
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
    setDeleteModalVisible(true);
  };

  const generateMarkedDates = () => {
    const marked: Record<string, any> = {};
    Object.keys(habitHistory).forEach((dateStr) => {
      const status = habitHistory[dateStr];
      if (status === 'completed') {
        marked[dateStr] = { selected: true, selectedColor: '#34D399' };
      } else if (status === 'skipped') {
        marked[dateStr] = { selected: true, selectedColor: '#64748B' };
      } else if (status === 'failed') {
        marked[dateStr] = { selected: true, selectedColor: '#EF4444' };
      }
    });
    return marked;
  };

  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if(isEditing && hasUnsavedChanges){
        e.preventDefault();
        setPendingNavigationAction(e.data.action); 
        setConfirmEditModalVisible(true);
      }
    });
    return unsubscribe;
  }, [navigation, isEditing, hasUnsavedChanges]);

  return (
    <View style={[styles.container, { backgroundColor: currentColors.background }]}>
      <Stack.Screen 
        options={{ 
          headerShown: true, 
          title: isEditing ? "Edit Habit" : updatedTitle,
          headerTintColor: currentColors.tint,
          headerStyle: { backgroundColor: currentColors.background },
          animation: 'slide_from_right'
        }} 
      />

      {/* Free Scrolling Content Body */}
      <ScrollView 
        style={{ flex: 1, backgroundColor: currentColors.background }} 
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
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
            <Text style={styles.subtext}>Category: {updatedCategory}</Text>
            <Text style={styles.subtext}>Weekly Target: {updatedFrequency} {updatedFrequency === 1 ? 'day' : 'days'} / week</Text>
            <Text style={styles.subtext}>Current Streak: {streak} days</Text>
            
            <Calendar
              current={new Date().toISOString().split('T')[0]} 
              markedDates={generateMarkedDates()}             
              theme={{
                calendarBackground: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF',
                textSectionTitleColor: '#94A3B8',
                dayTextColor: currentColors.text,
                todayTextColor: currentColors.tint,
                arrowColor: currentColors.tint,
                monthTextColor: currentColors.text,
                textDisabledColor: colorScheme === 'dark' ? '#334155' : '#CBD5E1',
              }}
              style={{
                borderRadius: 16,
                marginTop: 24,
                paddingVertical: 10
              }}
            />
          </View>
        )}
      </ScrollView>

      <CustomModal
        visible={deleteModalVisible}
        title="Delete Habit"
        description={`Are you sure you want to permanently delete "${updatedTitle}"?`}
        onClose={() => setDeleteModalVisible(false)}
        buttons={[
          { text: "Yes, delete", variant: "danger", onPress: executeDelete },
          { text: "No, go back", variant: "outline", onPress: () => setDeleteModalVisible(false) }
        ]}
      />

      <CustomModal
        visible={confirmEditModalVisible}
        title="Unsaved Changes"
        description="You have unsaved changes. Do you want to save them before leaving?"
        onClose={() => setConfirmEditModalVisible(false)}
        buttons={[
          { text: "Yes, save changes", variant: "success", onPress: handleUpdate },
          { 
            text: "Discard changes", 
            variant: "danger", 
            onPress: () => {
              setConfirmEditModalVisible(false);
              if (pendingNavigationAction) {
                navigation.dispatch(pendingNavigationAction);
              } else {
                router.back();
              }
            } 
          },
          { text: "Keep Editing", variant: "outline", onPress: () => setConfirmEditModalVisible(false) }
        ]}
      />

      {/* Static Bottom-Pinned Action Deck */}
      <View style={styles.buttonContainer}>
        {isEditing ? (
          <>
            <CustomButton text="Save Changes" variant="success" onPress={handleUpdate} />
            <CustomButton 
              text="Cancel" 
              variant="neutral" 
              onPress={() => {
                setIsEditing(false);
                setUpdatedTitle(title as string);
                setUpdatedCategory(category as string);
                setUpdatedFrequency(Number(initialFrequency) || 7);
              }} 
            />
          </>
        ) : (
          <>
            <CustomButton text="Edit Habit" variant="tint" onPress={() => setIsEditing(true)} />
            <CustomButton text="Delete Habit" variant="danger" onPress={confirmDelete} />
          </>
        )}
      </View>
    </View>
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
    gap: 12,
  },
});