import { collection, doc, setDoc, query, where, onSnapshot, getDocs, getDoc, updateDoc, deleteDoc, documentId, limit } from 'firebase/firestore';
import { db } from '../config/firebase';

export const searchUsers = async (searchText: string, currentUid: string) => {
  if (!searchText.trim().toLowerCase()) return [];

  try {
    const usernamesRef = collection(db, 'usernames');
    
    const q = query(
      usernamesRef,
      where(documentId(), '>=', searchText),
      where(documentId(), '<=', searchText + '\uf8ff'),
      limit(10)
    );

    const snapshot = await getDocs(q);
    const results: any[] = [];

    for (const document of snapshot.docs) {
      const username = document.id;
      const data = document.data();

      if (data.uid !== currentUid) {
        const targetUid = data.uid;
        const sortedUids = [currentUid, targetUid].sort();
        const friendshipId = `${sortedUids[0]}_${sortedUids[1]}`;
        const friendshipSnap = await getDoc(doc(db, 'friendships', friendshipId));
        
        let currentStatus = 'none';
        if (friendshipSnap.exists()) {
          const fData = friendshipSnap.data();
          if (fData.status === 'pending') {
            currentStatus = 'pending';
          } else if (fData.status === 'accepted') {
            currentStatus = 'friends';
          }
        }

        results.push({
          id: targetUid,          
          name: username,         
          avatarUrl: data.avatarUrl || '',
          friendStatus: currentStatus,
        });
      }
    }

    return results;
  } catch (error) {
    console.error("Error searching users:", error);
    return [];
  }
};

export const sendFriendRequest = async (currentUid: string, targetUid: string) => {
  try {
    const sortedUids = [currentUid, targetUid].sort();
    const friendshipId = `${sortedUids[0]}_${sortedUids[1]}`;

    const friendshipRef = doc(db, 'friendships', friendshipId);

    await setDoc(friendshipRef, {
      user1: sortedUids[0],
      user2: sortedUids[1],
      users: [sortedUids[0], sortedUids[1]], 
      requesterId: currentUid, 
      status: 'pending',
      createdAt: new Date().toISOString()
    });

    return { success: true };
  } catch (error) {
    console.error("Error sending friend request:", error);
    return { success: false, error };
  }
};

export const subscribeToIncomingRequests = (currentUid: string, callback: (requests: any[]) => void) => {
  const friendshipsRef = collection(db, 'friendships');
  
  const q = query(
    friendshipsRef,
    where('users', 'array-contains', currentUid),
    where('status', '==', 'pending')
  ) as any;

  return onSnapshot(q, async (snapshot: any) => {
    const requestsData = [];

    for (const document of snapshot.docs) {
      const data = document.data();
      if (data.requesterId === currentUid) continue;

      const otherUid = data.user1 === currentUid ? data.user2 : data.user1;
      
      // Find the username doc that has this UID
      const userQuery = query(collection(db, 'usernames'), where('uid', '==', otherUid));
      const userSnapshot = await getDocs(userQuery);

      if (!userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0];
        const username = userDoc.id;
        const userData = userDoc.data();

        requestsData.push({
          id: otherUid, 
          friendshipId: document.id, 
          name: username,
          avatarUrl: userData.avatarUrl || ''
        });
      }
    }
    callback(requestsData);
  });
};

export const subscribeToFriends = (currentUid: string, callback: (friends: any[]) => void) => {
  const friendshipsRef = collection(db, 'friendships');
  
  const q = query(
    friendshipsRef,
    where('users', 'array-contains', currentUid),
    where('status', '==', 'accepted')
  ) as any;

  return onSnapshot(q, async (snapshot: any) => {
    const friendsData = [];
    const todayStr = new Date().toISOString().split('T')[0];

    for (const document of snapshot.docs) {
      const data = document.data();
      const otherUid = data.user1 === currentUid ? data.user2 : data.user1;

      // Find the username doc that has this UID
      const userQuery = query(collection(db, 'usernames'), where('uid', '==', otherUid));
      const userSnapshot = await getDocs(userQuery);

      if (!userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0];
        const username = userDoc.id; 
        const userData = userDoc.data();

        let progress = 0;
        if (userData.todaysProgress && userData.todaysProgress.date === todayStr) {
          progress = userData.todaysProgress.percentage;
        }

        friendsData.push({
          id: otherUid,
          friendshipId: document.id,
          name: username,
          avatarUrl: userData.avatarUrl || '',
          dailyProgress: progress
        });
      }
    }
    callback(friendsData);
  });
};

export const respondToRequest = async (friendshipId: string, accept: boolean) => {
  try {
    const friendshipRef = doc(db, 'friendships', friendshipId);
    
    if (accept) {
      await updateDoc(friendshipRef, { status: 'accepted' });
    } else {
      await deleteDoc(friendshipRef);
    }
    return { success: true };
  } catch (error) {
    console.error("Error responding to request:", error);
    return { success: false, error };
  }
};

export const removeFriend = async (currentUid: string, targetUid: string) => {
  try{
    const friendshipId = [currentUid, targetUid].sort().join('_');
    const friendshipRef = doc(db, 'friendships', friendshipId);

    await deleteDoc(friendshipRef);
    console.log("Friendship successfully removed")
  } catch(error){
    console.error("Error removing friend:", error);
    throw error;
  }
}