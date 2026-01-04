import { API_ENDPOINTS } from "@/constants/api";
import { useAuth } from "@/contexts/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface FuelCard {
  id: number;
  balance: number;
  name: string;
}

const SELECTED_CARD_KEY = "@selected_card";

export default function CardsScreen() {
  const [cards, setCards] = useState<FuelCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { signOut } = useAuth();

  const fetchCards = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");

      if (!token) {
        setLoading(false);
      return; 
    }

      // console.log("Fetching cards with token:", token);

      const response = await fetch(API_ENDPOINTS.CARDS, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const mapped = data.map((c: any) => ({
          id: c.id,
          name: c.card_name,
          balance: parseFloat(c.balance),
        }));
        setCards(mapped);
        setError("");
      } else {
        setError("Failed to load cards");
      }
    } catch (e) {
      console.error("Error fetching cards:", e);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

useFocusEffect(
  useCallback(() => {
    fetchCards();
  }, [])
);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCards();
  };
  // Inside CardsScreen.tsx
  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            // 1. Clear the storage
            // await AsyncStorage.removeItem("userToken");
            await signOut();

            // router.replace("/(auth)/login");
          } catch (err) {
            console.error("Error logging out", err);
          }
        },
      },
    ]);
  };
  const handleCardPress = async (card: FuelCard) => {
    await AsyncStorage.setItem(SELECTED_CARD_KEY, JSON.stringify(card));
    router.push("/details");
  };

  const handleDeleteCard = async (cardId: number) => {
    try {
      const token = await AsyncStorage.getItem("userToken");

      const response = await fetch(`${API_ENDPOINTS.CARDS}/${cardId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setCards((prev) => prev.filter((c) => c.id !== cardId));
      } else {
        Alert.alert("Error", "Failed to delete card");
      }
    } catch (err) {
      console.error("Error deleting card", err);
      Alert.alert("Error", "Cannot connect to the server");
    }
  };

  const handleLongPress = (card: FuelCard) => {
    Alert.alert("Card Options", "What would you like to do?", [
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Alert.alert(
            "Delete Card",
            `Are you sure you want to delete "${card.name}"?`,
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: () => handleDeleteCard(card.id),
              },
            ]
          );
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleSettings = () => {
    router.push("/settings");
  }

  const handleAddCard = () => {
    router.push("/add-card");
  };

  const getCardColor = (id: number | string) => {
    const colors = ["#FF3B30", "#34C759", "#007AFF", "#FF9500"];
    const numericId = typeof id === "string" ? parseInt(id, 10) : id;
    return colors[numericId % colors.length];
  };

  const renderCard = ({ item }: { item: FuelCard }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: getCardColor(item.id) }]}
      onPress={() => handleCardPress(item)}
      onLongPress={() => handleLongPress(item)}
      activeOpacity={0.8}
    >
      <Text style={styles.cardName}>{item.name}</Text>
      <Text style={styles.balanceLabel}>Balance</Text>
      <Text style={styles.balance}>
        {typeof item.balance === "number"
          ? item.balance.toFixed(2)
          : parseFloat(item.balance || "0").toFixed(2)}{" "}
        zł
      </Text>
    </TouchableOpacity>
  );

  const renderFooter = () => (
    <TouchableOpacity style={styles.addButton} onPress={handleAddCard}>
      <Text style={styles.addButtonIcon}>+</Text>
      <Text style={styles.addButtonText}>Add a New Card</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error && cards.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchCards}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

return (
  <View style={styles.container}>
    {/* Top Bar */}
    <View style={styles.topBar}>
      <TouchableOpacity style={styles.settingsButton} onPress={handleSettings}>
        <Text style={styles.settingsText}>Settings</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>

    {/* Main Content */}
    <Text style={styles.title}>💳 My Fuel Cards</Text>
    <Text style={styles.subtitle}>Choose a card to make a transaction</Text>

    {cards.length === 0 ? (
      <View style={styles.listContainer}>
        <TouchableOpacity
          style={styles.addCard}
          onPress={handleAddCard}
          activeOpacity={0.7}
        >
          <Text style={styles.addCardIcon}>+</Text>
          <Text style={styles.addCardText}>Add Card</Text>
        </TouchableOpacity>
      </View>
    ) : (
      <FlatList
        data={cards}
        renderItem={renderCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
          />
        }
      />
    )}
  </View>
);

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 20, // push main content slightly down
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 40, // top padding for status bar
    paddingBottom: 10,
  },
  logoutButton: {
    backgroundColor: "#FF3B30", // red logout
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  settingsButton: {
    backgroundColor: "#007AFF", // blue settings
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  settingsText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    paddingHorizontal: 24,
    paddingTop: 20, // space below top bar
    paddingBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  listContainer: {
    paddingHorizontal: 24, // keep sides same
    paddingBottom: 24,
  },
  card: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  cardName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 4,
  },
  balance: {
    fontSize: 32,
    color: "#fff",
    fontWeight: "700",
  },
  addCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 40,
    borderWidth: 2,
    borderColor: "#007AFF",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
  },
  addCardIcon: {
    fontSize: 48,
    color: "#007AFF",
    fontWeight: "300",
    marginBottom: 8,
  },
  addCardText: {
    fontSize: 18,
    color: "#007AFF",
    fontWeight: "600",
  },
  addButton: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  addButtonIcon: {
    fontSize: 24,
    color: "#34C759",
    fontWeight: "bold",
    marginRight: 12,
  },
  addButtonText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "600",
  },
  errorText: {
    fontSize: 16,
    color: "#FF453A",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
});
