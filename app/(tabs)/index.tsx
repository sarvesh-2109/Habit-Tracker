import { View, StyleSheet, Platform } from "react-native";
import { Text, Button, Surface } from "react-native-paper";
import { useAuth } from "@/lib/auth-context";
import { Query } from "react-native-appwrite";
import {
  client,
  DATABASE_ID,
  databases,
  HABITS_COLLECTION_ID,
  Realtimeresponse,
} from "@/lib/appwrite";
import React, { useEffect, useState } from "react";
import { Habit } from "@/types/database.type";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function Index() {
  const { signOut, user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.$id) {
      const channel = `databases.${DATABASE_ID}.collections.${HABITS_COLLECTION_ID}.documents`;
      const habitsSubscription = client.subscribe(
        channel,
        (response: Realtimeresponse) => {
          if (
            response.events.includes(
              "databases.*.collections.*.documents.*.create"
            )
          ) {
            fetchHabits();
          } else if (
            response.events.includes(
              "databases.*.collections.*.documents.*.update"
            )
          ) {
            fetchHabits();
          } else if (
            response.events.includes(
              "databases.*.collections.*.documents.*.delete"
            )
          ) {
            fetchHabits();
          }
        }
      );
      fetchHabits();
      return () => habitsSubscription(); // Unsubscribe on cleanup
    }
  }, [user]);

  const fetchHabits = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await databases.listDocuments(
        DATABASE_ID,
        HABITS_COLLECTION_ID,
        [Query.equal("user_id", user!.$id)]
      );
      setHabits(response.documents as Habit[]);
    } catch (error) {
      console.error("Error fetching habits:", error);
      setError("Failed to load habits. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          Today's Habits
        </Text>
        <Button mode="text" onPress={signOut} icon={"logout"}>
          Sign Out
        </Button>
      </View>

      {loading ? (
        <Text>Loading habits...</Text>
      ) : error ? (
        <Text>{error}</Text>
      ) : habits.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No habits yet. Add your first habit.
          </Text>
        </View>
      ) : (
        habits.map((habit, index) => (
          <Surface
            key={habit.$id || index}
            style={styles.card}
            elevation={4} // Increased elevation for visible shadow
          >
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{habit.title}</Text>
              <Text style={styles.cardDescription}>{habit.description}</Text>
              <View style={styles.cardFooter}>
                <View style={styles.streakBadge}>
                  <MaterialCommunityIcons
                    name="fire"
                    size={18}
                    color={"#ff9800"}
                  />
                  <Text style={styles.streakText}>
                    {habit.streak_count} day streak
                  </Text>
                </View>
                <View style={styles.frequencyBadge}>
                  <Text style={styles.frequencyText}>
                    {habit.frequency.charAt(0).toUpperCase() +
                      habit.frequency.slice(1)}
                  </Text>
                </View>
              </View>
            </View>
          </Surface>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 24,
  },
  title: {
    fontWeight: "bold",
  },
  card: {
    marginBottom: 18,
    borderRadius: 18,
    backgroundColor: "#f7f2fa",
    // Platform-specific shadow styles
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4, // Handled by Surface, but kept for clarity
      },
    }),
  },
  cardContent: {
    padding: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#22223b", // Fixed typo in color code
  },
  cardDescription: {
    fontSize: 15,
    marginBottom: 16,
    color: "#6c6c80",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff3e0",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  streakText: {
    marginLeft: 6,
    color: "#ff9800",
    fontWeight: "bold",
    fontSize: 14,
  },
  frequencyBadge: {
    backgroundColor: "#ede7f6",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  frequencyText: {
    color: "#7c4dff",
    fontWeight: "bold",
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyStateText: {
    color: "#666666",
  },
});
