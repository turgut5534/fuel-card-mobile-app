import { useAuth } from "@/contexts/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const SettingsScreen = () => {
  const navigation = useNavigation();

  const [email, setEmail] = useState("");
  const [cards, setCards] = useState(0);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const { signOut } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");

        const profile = await fetch("http://192.168.0.10:3000/auth/profile", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await profile.json();
        setEmail(data.email);
        setCards(data._count.cards);
      } catch (error) {
        Alert.alert("Error", "Failed to load settings.");
      }
    };

    fetchData();
  }, []);

  const onSavePassword = async () => {
    try {
      if (!newPassword || !confirmPassword) {
        Alert.alert("Error", "Please fill in both password fields.");
        return;
      }
      if (newPassword !== confirmPassword) {
        Alert.alert("Error", "Passwords do not match.");
        return;
      }
      const token = await AsyncStorage.getItem("userToken");

      const response = await fetch(
        "http://192.168.0.10:3000/auth/changePassword",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
            confirmPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const message = Array.isArray(data.message)
          ? data.message.join("\n")
          : data.message;

        Alert.alert("Error", message);
        return;
      }
    } catch (error) {
      Alert.alert("Error", "Failed to change password.");
    }

    setNewPassword("");
    setCurrentPassword("");
    setConfirmPassword("");
    Alert.alert("Success", "Password updated successfully! You're being logged out.");

    setTimeout(async() => {
      await signOut();
    }, 2000);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Settings</Text>

          {/* Spacer to keep title centered */}
          <View style={styles.headerSpacer} />
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{email}</Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.label}>Number of Fuel Cards</Text>
          <Text style={styles.value}>{cards}</Text>
        </View>

        <View style={styles.divider} />

        {/* Password */}
        <Text style={styles.sectionTitle}>Change Password</Text>

        <TextInput
          style={styles.input}
          placeholder="Current Password"
          placeholderTextColor="#888"
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />

        <TextInput
          style={styles.input}
          placeholder="New Password"
          placeholderTextColor="#888"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />

        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#888"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <TouchableOpacity style={styles.saveButton} onPress={onSavePassword}>
          <Text style={styles.saveButtonText}>Save Password</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 50,
  },

  scrollContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    marginTop: 8,
  },

  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 20,
  },
  backButtonText: { color: "white", fontWeight: "600", fontSize: 14 },
  stepperContainer: { marginBottom: 20 },
  stepperLabel: {
    fontSize: 14,
    color: "#999",
    marginBottom: 8,
    fontWeight: "500",
  },

  headerSpacer: {
    width: 40,
  },

  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },

  infoContainer: {
    marginBottom: 16,
  },

  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },

  value: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "600",
  },

  divider: {
    height: 1,
    backgroundColor: "#333",
    marginVertical: 24,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
  },

  input: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#fff",
    marginBottom: 12,
  },

  saveButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },

  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
});
