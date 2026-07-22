import { StyleSheet, Platform } from 'react-native';

export const defaultStyles = StyleSheet.create({
  // --- Layouts ---
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 10 : 24,
    paddingBottom: 40,
    flexGrow: 1,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },

  headerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginTop: 20, 
    marginBottom: 20 
  },
  
  // --- Headers & Text ---
  headerBox: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    lineHeight: 22,
    textAlign: 'center'
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },

  // --- Forms & Inputs ---
  form: {
    width: '100%',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    width: '100%',
    marginBottom: 16,
  },
  actionSpace: {
    marginTop: 24,
    gap: 12,
  },

  // --- Common UI Components ---
  card: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  // --- Flex Utilities ---
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // --- Common Cards & Shadows ---
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2, 
  },
  
  // --- Auth / Navigation Links ---
  linkText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    // Color will be injected dynamically in the component
  },
  footerText: {
    fontSize: 15,
    textAlign: 'center',
    color: '#94A3B8', // Static gray
  },

  // --- Complex Inputs (Passwords) ---
  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingLeft: 16,
    paddingRight: 8,
    width: "100%",
    marginBottom: 16, // Added to match the spacing of your standard inputs
  },
  passwordField: { 
    flex: 1, 
    height: "100%", 
    fontSize: 16 
  },
  eyeIconButton: { 
    padding: 8, 
    justifyContent: "center", 
    alignItems: "center" 
  },

  // --- Form Helper Anchors ---
  inputHelperAnchor: {
    alignSelf: "flex-end",
    marginTop: -4, // Pulls it slightly closer to the input above it
    marginBottom: 16,
    paddingVertical: 4,
  },
  inputHelperText: { 
    fontSize: 14, 
    fontWeight: "600" 
  },

  // --- Avatar Base Sizes ---
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20, // Always exactly half of width/height for a perfect circle
  },
  avatarMedium: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },

  // --- Avatar Modifiers ---
  avatarBordered: {
    borderWidth: 3,
    borderColor: '#10B981',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor is injected locally based on theme
  },

  // --- Avatar Wrappers & Badges ---
  avatarWrapper: {
    position: 'relative',
    alignSelf: 'center',
    marginBottom: 24, 
  },
  avatarBadgePencil: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#34D399', 
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
});