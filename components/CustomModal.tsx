import React from 'react';
import { StyleSheet, Text, View, Modal } from 'react-native';
import CustomButton from './CustomButton';
import { useAppTheme } from '@/context/ThemeContext';

interface ModalButtonConfig {
  text: string;
  variant?: 'tint' | 'success' | 'danger' | 'neutral' | 'outline';
  onPress: () => void;
  disabled?: boolean;
}

// properties for the Modal container
interface CustomModalProps {
  visible: boolean;
  title: string;
  description?: string;
  buttons: ModalButtonConfig[];
  onClose: () => void;
}

export default function CustomModal({
  visible,
  title,
  description,
  buttons,
  onClose
}: CustomModalProps) {
  const { theme: colorScheme } = useAppTheme();

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalCard, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFF' }]}>
          
          <Text style={[styles.modalTitle, { color: colorScheme === 'dark' ? '#FFF' : '#0F172A' }]}>
            {title}
          </Text>

          {description && (
            <Text style={styles.modalDescription}>
              {description}
            </Text>
          )}

          {/* Dynamic Button Deck Layout */}
          <View style={styles.buttonDeck}>
            {buttons.map((btn, index) => (
              <View key={index} style={styles.buttonSpacing}>
                <CustomButton
                  text={btn.text}
                  variant={btn.variant}
                  disabled={btn.disabled}
                  onPress={btn.onPress}
                />
              </View>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 12,
    textAlign: 'center' 
  },
  modalDescription: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  buttonDeck: {
    width: '100%',
    marginTop: 4,
  },
  buttonSpacing: {
    marginTop: 12,
    width: '100%',
  }
});