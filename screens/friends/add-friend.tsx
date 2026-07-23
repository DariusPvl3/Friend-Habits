import React, { useState } from "react";
import { 
  Image, 
  View, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  TouchableWithoutFeedback, 
  TextInput, 
  Keyboard,
  ScrollView 
} from "react-native";
import Colors from "@/constants/Colors";
import { defaultStyles } from "@/constants/GlobalStyles";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useAppTheme } from "@/context/ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomModal from "@/components/CustomModal";

interface User {
  id: string;
  name: string;
  avatarUrl: string;
  friendStatus: 'friends' | 'pending' | 'none'; 
}

const FAKE_USERS: User[] = [
  { id: '1', name: 'Alexandru', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', friendStatus: 'none'},
  { id: '2', name: 'Elena', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', friendStatus: 'none' },
  { id: '3', name: 'Mihai', avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150', friendStatus: 'friends' },
  { id: '4', name: 'Alexandra', avatarUrl: '', friendStatus: 'pending' },
];

export default function AddFriendScreen() {
  const router = useRouter();
  const { theme: colorScheme } = useAppTheme();
  const currentColors = Colors[colorScheme];

  const [search, setSearch] = useState('');
  const [filteredData, setFilteredData] = useState<User[]>([]);

  const [isModalVisible, setModalVisible] = useState(false);
  const [userToCancel, setUserToCancel] = useState<string | null>(null);
  const [modalVariant, setModalVariant] = useState<"success" | "danger">(
    "danger",
  );

  const handleSearch = (text: string) => {
    setSearch(text);
    
    if (text.trim().length === 0) {
      setFilteredData([]);
      return;
    }

    const filtered = FAKE_USERS.filter(item =>
      item.friendStatus !== 'friends' && 
      item.name.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredData(filtered);
  };

  const handleUserPress = (userName: string) => {
    router.push({
      pathname: '/friend-profile',
      params: { name: userName, }
    });
  };

  const handleAddFriend = (userId: string) => {
    setFilteredData(prev => 
      prev.map(u => u.id === userId ? { ...u, friendStatus: 'pending' } : u)
    );
    console.log(`Sent friend request to user: ${userId}`);
  };

  const handleCancelRequest = (userId: string) => {
    setUserToCancel(userId);
    setModalVisible(true);
  };

  const confirmCancelRequest = () => {
    if (!userToCancel) return;

    setFilteredData(prev => 
      prev.map(u => u.id === userToCancel ? { ...u, friendStatus: 'none' } : u)
    );
    console.log(`Canceled request for user: ${userToCancel}`);
    
    // Close modal and clear the targeted user
    setModalVisible(false);
    setUserToCancel(null);
  };

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
            title: "Add Friend",
            headerTintColor: currentColors.tint,
            headerStyle: { backgroundColor: currentColors.background },
            animation: "slide_from_right",
          }}
        />
        <View style={defaultStyles.container}>
          <Text style={[defaultStyles.headerTitle, {color: currentColors.text}]}>Search by username</Text>
          <View style={styles.searchContainer}>
            <TextInput
              style={[
                styles.searchBar,
                {
                  backgroundColor: colorScheme === "dark" ? "#1E293B" : "#FFF",
                  color: currentColors.text,
                  borderColor: colorScheme === "dark" ? "#334155" : "#CBD5E1",
                },
              ]}
              placeholder="Search users..."
              placeholderTextColor="#64748B"
              value={search}
              onChangeText={handleSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <MaterialCommunityIcons 
              name="magnify" 
              size={24} 
              color="#64748B" 
              style={styles.searchIcon} 
            />
          </View>

          {search.trim().length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <MaterialCommunityIcons name="account-search" size={48} color="#94A3B8" />
              <Text style={[styles.emptyStateText, { color: '#94A3B8' }]}>
                Search for friends by username
              </Text>
            </View>
          ) : (
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled" 
            >
              {filteredData.map((user) => (
                <View 
                  key={user.id} 
                  style={[
                    defaultStyles.friendCard, 
                    styles.cardLayout, 
                    { backgroundColor: currentColors.cardBackground || (colorScheme === 'dark' ? '#1E293B' : '#FFFFFF') }
                  ]}
                >
                    <TouchableOpacity 
                      style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                      onPress={() => handleUserPress(user.id)}
                    >
                      {user.avatarUrl ? (
                        <Image 
                          source={{ uri: user.avatarUrl }} 
                          style={[defaultStyles.avatarMedium, { marginRight: 16 }]} 
                        />
                      ) : (
                        <View style={[
                          defaultStyles.avatarMedium, 
                          defaultStyles.avatarPlaceholder, 
                          { backgroundColor: colorScheme === 'dark' ? '#334155' : '#E2E8F0', marginRight: 16 }
                        ]}>
                          <MaterialCommunityIcons name="account" size={24} color="#94A3B8" />
                        </View>
                      )}

                      <View style={defaultStyles.infoContainer}>
                          <Text style={[defaultStyles.friendName, { color: currentColors.text }]}>{user.name}</Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[
                        styles.addButton, 
                        user.friendStatus === 'pending' ? styles.pendingButton : styles.activeAddButton
                      ]}
                      onPress={() => {
                        if (user.friendStatus === 'pending') {
                          handleCancelRequest(user.id);
                        } else {
                          handleAddFriend(user.id);
                        }
                      }}
                    >
                      <Text style={[
                        styles.addButtonText, 
                        user.friendStatus === 'pending' ? styles.pendingText : styles.activeText
                      ]}>
                        {user.friendStatus === 'pending' ? 'Pending' : 'Add'}
                      </Text>
                    </TouchableOpacity>
                </View>
              ))}
              
              {filteredData.length === 0 && search.trim().length > 0 && (
                <Text style={[styles.emptyStateText, { color: '#94A3B8', marginTop: 24 }]}>
                  No users found.
                </Text>
              )}
            </ScrollView>
          )}

          <CustomModal 
            visible={isModalVisible}
            title="Cancel Request"
            description="Are you sure you want to cancel this friend request?"
            onClose={() => setModalVisible(false)}
            buttons={[
              {
                text: "Yes, cancel request",
                variant: modalVariant === "success" ? "tint" : "danger",
                onPress: () => {setModalVisible(false); confirmCancelRequest()},
              },
              {
                text: "No",
                variant: "neutral",
                onPress: () => setModalVisible(false)
              },
            ]}
          />

        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    position: 'relative',
    width: '100%',
    marginBottom: 16,
  },
  searchBar: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingLeft: 16,
    paddingRight: 48, 
    fontSize: 16,
    width: '100%',
  },
  searchIcon: {
    position: 'absolute',
    right: 16,
    top: 13, 
  },
  scrollContent: {
    paddingBottom: 20, 
  },
  cardLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80, 
  },
  activeAddButton: {
    backgroundColor: '#3B82F6', 
  },
  pendingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#94A3B8',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeText: {
    color: '#FFFFFF',
  },
  pendingText: {
    color: '#94A3B8',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  }
});