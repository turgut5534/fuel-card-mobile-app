import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface HistoryItem {
  id: string;
  amount: number;
  newBalance: number;
  date: string;
  type: string;
  liters: number;
  fuel_price: number;
  fuel_type?: string;
}

interface CardData {
  id: number;
  balance: number;
  name: string;
}

enum FuelType {
  PETROL = "petrol",
  DIESEL = "diesel",
  LPG = "lpg",
}

const SELECTED_CARD_KEY = "@selected_card";

export default function CardDetailsScreen() {
  const [balance, setBalance] = useState<number>(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [selectedCardName, setSelectedCardName] = useState("Loading...");
  const [fuelPrice, setFuelPrice] = useState<number>(2.4);
  const [fuelType, setFuelType] = useState<FuelType>(FuelType.LPG);
  const [cardId, setCardId] = useState<string>("");

  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const getFormattedDate = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const getFormattedDateofData = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const startChanging = (changeFn: () => void) => {
    changeFn();
    intervalRef.current = setInterval(changeFn, 100);
  };

  const stopChanging = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const addHistoryItem = (
    amount: number,
    newBal: number,
    type: "added" | "purchased",
    liters: number,
    fuel_price: number,
    fuel_type?: FuelType
  ) => {
    const newHistoryItem: HistoryItem = {
      id: Date.now().toString(),
      amount,
      newBalance: newBal,
      date: getFormattedDate(),
      type,
      liters,
      fuel_price,
      fuel_type,
    };
    setHistory((prev) => [newHistoryItem, ...prev]);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedCardData = await AsyncStorage.getItem(SELECTED_CARD_KEY);

        if (!storedCardData) {
          Alert.alert("Error", "No card selected");
          router.back();
          return;
        }

        const cardData: CardData = JSON.parse(storedCardData);
        setCardId(cardData.id.toString());
        setBalance(cardData.balance);
        setSelectedCardName(cardData.name);

        const token = await AsyncStorage.getItem("userToken");

        const historyItemsRes = await fetch(
          `http://192.168.0.10:3000/cards/${cardData.id}/transactions`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await historyItemsRes.json();

        // Safely parse latestFuelPrice
        if (
          data.latestFuelPrice !== undefined &&
          data.latestFuelPrice !== null
        ) {
          const latestPrice = parseFloat(data.latestFuelPrice);
          if (!isNaN(latestPrice)) setFuelPrice(latestPrice);
        }

        if(data.latestFuelPrice && data.latestFuelPrice <= 3.50){
          setFuelType(FuelType.LPG);
        } else if(data.latestFuelPrice && data.latestFuelPrice > 3.50 && data.latestFuelPrice <= 5.70){
          setFuelType(FuelType.PETROL);
        } else if(data.latestFuelPrice && data.latestFuelPrice > 5.70){
          setFuelType(FuelType.DIESEL);
        }

        // Safely map transactions
        if (Array.isArray(data.transactions)) {
          const mappedHistory: HistoryItem[] = data.transactions.map(
            (item: any) => ({
              id: item.id.toString(),
              amount:
                item.transaction_type === "spend"
                  ? -parseFloat(item.amount)
                  : parseFloat(item.amount),
              newBalance: parseFloat(item.new_balance),
              date: getFormattedDateofData(item.transaction_date),
              type:
                item.transaction_type === "spend"
                  ? "purchased"
                  : item.transaction_type === "topup"
                  ? "added"
                  : "setted",
              liters: parseFloat(item.liters || "0"),
              fuel_price: parseFloat(item.fuel_price || "0"),
              fuel_type: item.fuel_type || undefined,
            })
          );
          setHistory(mappedHistory);
        }
      } catch (error) {
        console.error("An error occurred", error);
        Alert.alert("Error", "Failed to load card data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSubtract = async () => {
    const value = parseFloat(inputValue);
    const currentFuelPrice = parseFloat(fuelPrice.toFixed(2));

    if (isNaN(value) || value <= 0) {
      Alert.alert("Invalid Amount", "Please enter a positive amount.");
      return;
    }

    if (value > balance) {
      Alert.alert(
        "Insufficient balance",
        "You cannot spend more than you have."
      );
      return;
    }

    Alert.alert(
      "Confirm",
      `${value.toFixed(2)} zł will be spent. Are you sure?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("userToken");

              const response = await fetch(
                `http://192.168.0.10:3000/cards/${cardId}/spend`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    amount: value,
                    fuel_price: currentFuelPrice,
                    fuel_type: fuelType,
                  }),
                }
              );

              const data = await response.json();

              if (!response.ok) {
                Alert.alert("Error", data.error || "An error occurred.");
                return;
              }

              const newBalance = parseFloat(data.new_balance);
              setBalance(newBalance);
              addHistoryItem(
                -value,
                newBalance,
                "purchased",
                parseFloat(data.liters || "0"),
                parseFloat(data.fuel_price || "0"),
                data.fuel_type
              );
              setInputValue("");
            } catch (error) {
              console.error(error);
              Alert.alert("Error", "Cannot connect to the server.");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleAddBalance = async () => {
    const value = parseFloat(inputValue);

    if (isNaN(value) || value <= 0) {
      Alert.alert("Invalid Amount", "Please enter a positive amount.");
      return;
    }

    Alert.alert(
      "Confirm",
      `${value.toFixed(2)} zł will be added. Are you sure?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("userToken");

              const response = await fetch(
                `http://192.168.0.10:3000/cards/${cardId}/topup`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ amount: value }),
                }
              );

              const data = await response.json();

              if (!response.ok) {
                Alert.alert("Error", data.error || "Error while topping up.");
                return;
              }

              setBalance(parseFloat(data.balance));
              addHistoryItem(value, parseFloat(data.balance), "added", 0, 0);
              setInputValue("");
            } catch (error) {
              console.error(error);
              Alert.alert(
                "Error",
                "An error occurred connecting to the server."
              );
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#000" barStyle="light-content" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar backgroundColor="#000" barStyle="light-content" />
      <SafeAreaView edges={["bottom"]} style={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>💳 {selectedCardName}</Text>

        <Text style={styles.balance}>Balance: {balance.toFixed(2)} zł</Text>

        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="Enter an amount"
          placeholderTextColor="#666"
          value={inputValue}
          onChangeText={setInputValue}
        />

        <View style={styles.stepperContainer}>
          <Text style={styles.stepperLabel}>Fuel Price (zł/L)</Text>

          {/* Fuel type buttons */}
          <View style={styles.fuelTypeRow}>
            <TouchableOpacity
              style={[styles.fuelTypeButton, styles.petrolButton]}
              onPress={() => {
                setFuelPrice(5.6);
                setFuelType(FuelType.PETROL);
              }}
            >
              <Text style={styles.fuelTypeText}>Petrol</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.fuelTypeButton, styles.dieselButton]}
              onPress={() => {
                setFuelPrice(5.9);
                setFuelType(FuelType.DIESEL);
              }}
            >
              <Text style={styles.fuelTypeText}>Diesel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.fuelTypeButton, styles.lpgButton]}
              onPress={() => {
                setFuelPrice(2.5);
                setFuelType(FuelType.LPG);
              }}
            >
              <Text style={styles.fuelTypeText}>LPG</Text>
            </TouchableOpacity>
          </View>

          {/* Stepper */}
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={styles.stepperButton}
              onPressIn={() =>
                startChanging(() =>
                  setFuelPrice((prev) => Math.max(prev - 0.01, 0))
                )
              }
              onPressOut={stopChanging}
            >
              <Text style={styles.stepperButtonText}>−</Text>
            </TouchableOpacity>

            <Text style={styles.stepperValue}>{fuelPrice.toFixed(2)}</Text>

            <TouchableOpacity
              style={styles.stepperButton}
              onPressIn={() =>
                startChanging(() => setFuelPrice((prev) => prev + 0.01))
              }
              onPressOut={stopChanging}
            >
              <Text style={styles.stepperButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.buttonSubtract}
            onPress={handleSubtract}
          >
            <Text style={styles.buttonText}>Buy Fuel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonAdd} onPress={handleAddBalance}>
            <Text style={styles.buttonText}>Top Up</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>Recent Transactions</Text>
        </View>

        <FlatList
          data={history.slice(0, 10)}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              style={[
                styles.historyItem,
                { borderLeftColor: item.amount < 0 ? "#FF3B30" : "#34C759" },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.historyText}>
                  {item.type === "added" && (
                    <>
                      +{item.amount.toFixed(2)} zł added → Balance:{" "}
                      {item.newBalance.toFixed(2)} zł
                    </>
                  )}
                  {item.type === "purchased" && (
                    <>
                      {item.amount.toFixed(2)} zł spent → Balance:{" "}
                      {item.newBalance.toFixed(2)} zł
                    </>
                  )}
                </Text>

                {item.type === "purchased" && item.liters > 0 && (
                  <View>
                    <Text style={styles.historyLiters}>
                      Amount: {item.liters.toFixed(2)} L
                    </Text>
                    <Text style={styles.historyFuelPrice}>
                      Fuel price: {item.fuel_price.toFixed(2)} zł/L
                    </Text>
                    <Text style={styles.historyFuelType}>
                      Fuel Type:{" "}
                      {item.fuel_type
                        ? item.fuel_type.charAt(0).toUpperCase() +
                          item.fuel_type.slice(1)
                        : "N/A"}
                    </Text>
                  </View>
                )}

                <Text style={styles.historyDate}>{item.date}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyHistory}>
              {loading ? "Loading..." : "No transaction yet"}
            </Text>
          }
        />
      </SafeAreaView>
    </>
  );
}

// Your styles remain unchanged
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 20,
    paddingTop: 50,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
    textAlign: "center",
  },
  balance: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#34C759",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderColor: "#333",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    marginBottom: 20,
    backgroundColor: "#1a1a1a",
    color: "#fff",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  buttonSubtract: {
    backgroundColor: "#FF3B30",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    flex: 1,
    marginRight: 10,
  },
  buttonAdd: {
    backgroundColor: "#34C759",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    flex: 1,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  historyHeader: {
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    marginBottom: 10,
  },
  historyTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 10,
  },
  historyItem: {
    backgroundColor: "#1a1a1a",
    padding: 12,
    marginBottom: 10,
    borderRadius: 12,
    borderLeftWidth: 5,
  },
  historyText: { fontSize: 16, color: "#fff" },
  historyDate: { fontSize: 12, color: "#666", marginTop: 4 },
  emptyHistory: {
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
    marginTop: 20,
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
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  stepperButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  stepperButtonText: { color: "white", fontSize: 20, fontWeight: "bold" },
  stepperValue: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  historyLiters: { fontSize: 14, color: "#999", marginTop: 4 },
  historyFuelPrice: { fontSize: 14, color: "#34C759", marginTop: 2 },
  fuelTypeRow: {
    flexDirection: "row",
    width: "100%",
    marginBottom: 8,
  },

  fuelTypeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
  },

  petrolButton: {
    backgroundColor: "#f97316", // orange
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },

  lpgButton: {
    backgroundColor: "#22c55e", // green
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  dieselButton: {
    backgroundColor: "#2276c5ff", // green
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },

  fuelTypeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
  },
  historyFuelType: {
    fontSize: 14,
    color: "#ff9500",
    marginTop: 2,
  },
});
