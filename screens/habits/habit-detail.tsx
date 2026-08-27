import React, { useState, useEffect } from 'react';
import { Alert, StyleSheet, Text, View, ScrollView } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import { useAppTheme } from '@/context/ThemeContext';
import Colors from '../../constants/Colors';
import { defaultStyles } from '@/constants/GlobalStyles';
import { db } from '../../config/firebase';
import { doc, deleteDoc, onSnapshot } from 'firebase/firestore';
import CustomModal from '@/components/CustomModal';
import CustomButton from '@/components/CustomButton';

export default function HabitDetailScreen() {
  const router = useRouter();  
  const { id, title, category, streak, frequency, visibility } = useLocalSearchParams();

  const [liveTitle, setLiveTitle] = useState(title as string);
  const [liveCategory, setLiveCategory] = useState(category as string);
  const [liveFrequency, setLiveFrequency] = useState(frequency as string);
  const [liveVisibility, setLiveVisibility] = useState(visibility as string);
  const [habitHistory, setHabitHistory] = useState<Record<string, 'completed' | 'skipped' | 'failed'>>({});

  const { theme: colorScheme } = useAppTheme();
  const currentColors = Colors[colorScheme];
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  useEffect(() => {
    const docRef = doc(db, 'habits', id as string);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setHabitHistory(data.history || {});
        setLiveTitle(data.title);
        setLiveCategory(data.category);
        setLiveFrequency(String(data.frequency));
        setLiveVisibility(data.visibility || 'Private');
      }
    });

    return () => unsubscribe();
  }, [id]);

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

  return (
    <View style={[defaultStyles.container, { backgroundColor: currentColors.background }]}>
      <Stack.Screen 
        options={{ 
          headerShown: true, 
          title: liveTitle,
          headerTintColor: currentColors.tint,
          headerStyle: { backgroundColor: currentColors.background },
          animation: 'slide_from_right'
        }} 
      />

      <ScrollView 
        style={{ flex: 1, backgroundColor: currentColors.background }} 
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={defaultStyles.content}>
          <Text style={defaultStyles.subtitle}>Category: {liveCategory}</Text>
          <Text style={defaultStyles.subtitle}>Visibility: {liveVisibility || 'Private'}</Text>
          <Text style={defaultStyles.subtitle}>Weekly Target: {liveFrequency} {Number(liveFrequency) === 1 ? 'day' : 'days'} / week</Text>
          <Text style={defaultStyles.subtitle}>Current Streak: {streak} days</Text>
          
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
              paddingVertical: 8
            }}
          />
        </View>
      </ScrollView>

      <CustomModal
        visible={deleteModalVisible}
        title="Delete Habit"
        description={`Are you sure you want to permanently delete "${liveTitle}"?`}
        onClose={() => setDeleteModalVisible(false)}
        buttons={[
          { text: "Yes, delete", variant: "danger", onPress: executeDelete },
          { text: "No, go back", variant: "outline", onPress: () => setDeleteModalVisible(false) }
        ]}
      />

      {/* Static Bottom-Pinned Action Deck */}
      <View style={styles.buttonContainer}>
        <>
          <CustomButton text="Edit Habit" variant="tint" 
            onPress={() => {
              router.push({
                pathname: '/habit-editor',
                params: {
                  mode: 'edit',
                  id: id as string,
                  title: liveTitle,
                  category: liveCategory,
                  frequency: liveFrequency,
                  visibility: liveVisibility || 'Private'
                }
              });
            }}
          />
          <CustomButton text="Delete Habit" variant="danger" onPress={confirmDelete} />
        </>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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