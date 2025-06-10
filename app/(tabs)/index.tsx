import {
  client,
  COMPLETIONS_COLLECTION_ID,
  DATABASE_ID,
  databases,
  HABITS_COLLECTION_ID,
  Realtimeresponse,
} from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { Habit, HabitCompletion } from "@/types/database.type";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Platform, ScrollView, StyleSheet, View } from "react-native";
import { ID, Query } from "react-native-appwrite";
import { Swipeable } from "react-native-gesture-handler";
import { Button, Surface, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const { signOut, user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completedHabits, setCompletedHabits] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useLocalSearchParams();
  const showTutorial = params.showTutorial === "true";
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const [lastAction, setLastAction] = useState<{
    type: 'complete' | 'delete';
    habitId: string;
    habit?: Habit;
  } | null>(null);
  const undoFadeAnim = useRef(new Animated.Value(0)).current;
  const undoSlideAnim = useRef(new Animated.Value(50)).current;

  const swipableRefs = useRef<{ [key: string]: Swipeable | null }>({});

  useEffect(() => {
    if (showTutorial) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();

      // Hide the tutorial after 5 seconds
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 50,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [showTutorial]);

  useEffect(() => {
    if (user?.$id) {
      const habitsChannel = `databases.${DATABASE_ID}.collections.${HABITS_COLLECTION_ID}.documents`;
      const habitsSubscription = client.subscribe(
        habitsChannel,
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

      const completionsChannel = `databases.${DATABASE_ID}.collections.${COMPLETIONS_COLLECTION_ID}.documents`;
      const completionsSubscription = client.subscribe(
        completionsChannel,
        (response: Realtimeresponse) => {
          if (
            response.events.includes(
              "databases.*.collections.*.documents.*.create"
            )
          ) {
            fetchTodayCompletions();
          }
        }
      );

      fetchHabits();
      fetchTodayCompletions();
      return () => {
        habitsSubscription();
        completionsSubscription();
      }; // Unsubscribe on cleanup
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

  const fetchTodayCompletions = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setLoading(true);
      setError(null);
      const response = await databases.listDocuments(
        DATABASE_ID,
        COMPLETIONS_COLLECTION_ID,
        [
          Query.equal("user_id", user!.$id),
          Query.greaterThanEqual("completed_at", today.toISOString()),
        ]
      );
      const completions = response.documents as HabitCompletion[];
      setCompletedHabits(completions.map((c) => c.habit_id));
    } catch (error) {
      console.error(error);
    }
  };

  const showUndoButton = (type: 'complete' | 'delete', habitId: string, habit?: Habit) => {
    setLastAction({ type, habitId, habit });
    Animated.parallel([
      Animated.timing(undoFadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(undoSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Hide undo button after 5 seconds
    setTimeout(() => {
      hideUndoButton();
    }, 5000);
  };

  const hideUndoButton = () => {
    Animated.parallel([
      Animated.timing(undoFadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(undoSlideAnim, {
        toValue: 50,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setLastAction(null);
    });
  };

  const handleUndo = async () => {
    if (!lastAction || !user) return;

    try {
      if (lastAction.type === 'complete') {
        // Find the most recent completion
        const completions = await databases.listDocuments(
          DATABASE_ID,
          COMPLETIONS_COLLECTION_ID,
          [
            Query.equal("habit_id", lastAction.habitId),
            Query.equal("user_id", user.$id),
            Query.orderDesc("completed_at"),
            Query.limit(1)
          ]
        );
        
        if (completions.documents.length > 0) {
          const completion = completions.documents[0];
          
          // Verify the completion belongs to the current user
          if (completion.user_id !== user.$id) {
            throw new Error("You don't have permission to undo this action");
          }

          // Delete the completion
          await databases.deleteDocument(
            DATABASE_ID,
            COMPLETIONS_COLLECTION_ID,
            completion.$id
          );

          // Update the habit's streak count
          if (lastAction.habit) {
            // Verify the habit belongs to the current user
            if (lastAction.habit.user_id !== user.$id) {
              throw new Error("You don't have permission to update this habit");
            }

            await databases.updateDocument(
              DATABASE_ID,
              HABITS_COLLECTION_ID,
              lastAction.habitId,
              {
                streak_count: Math.max(0, lastAction.habit.streak_count - 1),
                last_completed: lastAction.habit.last_completed
              }
            );
          }
        }
      } else if (lastAction.type === 'delete' && lastAction.habit) {
        // Verify the habit belongs to the current user
        if (lastAction.habit.user_id !== user.$id) {
          throw new Error("You don't have permission to restore this habit");
        }

        // Restore the deleted habit with only the necessary fields
        const habitData = {
          user_id: lastAction.habit.user_id,
          title: lastAction.habit.title,
          description: lastAction.habit.description,
          frequency: lastAction.habit.frequency,
          streak_count: lastAction.habit.streak_count,
          last_completed: lastAction.habit.last_completed,
          created_at: lastAction.habit.created_at
        };

        await databases.createDocument(
          DATABASE_ID,
          HABITS_COLLECTION_ID,
          ID.unique(),
          habitData
        );
      }

      // Refresh data
      await Promise.all([
        fetchHabits(),
        fetchTodayCompletions()
      ]);

      hideUndoButton();
    } catch (error) {
      console.error("Error undoing action:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to undo action. Please try again.");
      }
      hideUndoButton();
    }
  };

  const handelDeleteHabit = async (id: string) => {
    try {
      const habit = habits.find(h => h.$id === id);
      if (!habit) return;

      // Store the habit data before deleting
      const habitData = { ...habit };
      await databases.deleteDocument(DATABASE_ID, HABITS_COLLECTION_ID, id);
      showUndoButton('delete', id, habitData);
    } catch (error) {
      console.error(error);
      setError("Failed to delete habit. Please try again.");
    }
  };

  const handelCompleteHabit = async (id: string) => {
    if (!user || completedHabits?.includes(id)) return;
    try {
      const habit = habits.find(h => h.$id === id);
      if (!habit) return;

      const currentDate = new Date().toISOString();
      
      // Store the current habit state before updating
      const habitData = { ...habit };
      
      // Create completion record
      await databases.createDocument(
        DATABASE_ID,
        COMPLETIONS_COLLECTION_ID,
        ID.unique(),
        {
          habit_id: id,
          user_id: user.$id,
          completed_at: currentDate,
        }
      );

      // Update habit
      await databases.updateDocument(DATABASE_ID, HABITS_COLLECTION_ID, id, {
        streak_count: habit.streak_count + 1,
        last_completed: currentDate,
      });

      showUndoButton('complete', id, habitData);
    } catch (error) {
      console.error(error);
      setError("Failed to complete habit. Please try again.");
    }
  };

  const isHabitCompleted = (habitId: string) =>
    completedHabits?.includes(habitId);

  const renderLeftActions = (habitId: string) => (
    <View style={styles.swipeActionLeft}>
      {isHabitCompleted(habitId) ? (
        <Text style={{color: "#fff"}}> Completed!</Text>
      ) : (
        <MaterialCommunityIcons
          name="check-circle-outline"
          size={32}
          color={"#fff"}
        />
      )}
    </View>
  );

  const renderRightActions = () => (
    <View style={styles.swipeActionRight}>
      <MaterialCommunityIcons
        name="trash-can-outline"
        size={32}
        color={"#fff"}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.title}>
            Today's Habits
          </Text>
        </View>

        {showTutorial && (
          <Animated.View
            style={[
              styles.tutorialContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.tutorialContent}>
              <MaterialCommunityIcons name="gesture-swipe" size={24} color="#7c4dff" />
              <Text style={styles.tutorialText}>
                Swipe right to complete, left to delete
              </Text>
            </View>
          </Animated.View>
        )}

        {lastAction && (
          <Animated.View
            style={[
              styles.undoContainer,
              {
                opacity: undoFadeAnim,
                transform: [{ translateY: undoSlideAnim }],
              },
            ]}
          >
            <View style={styles.undoContent}>
              <Text style={styles.undoText}>
                {lastAction.type === 'complete' ? 'Habit completed' : 'Habit deleted'}
              </Text>
              <Button
                mode="contained"
                onPress={handleUndo}
                style={styles.undoButton}
              >
                Undo
              </Button>
            </View>
          </Animated.View>
        )}

        <ScrollView showsVerticalScrollIndicator={false}>
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
              <Swipeable
                ref={(ref) => {
                  swipableRefs.current[habit.$id] = ref;
                }}
                key={habit.$id || index}
                overshootLeft={false}
                overshootRight={false}
                renderLeftActions={() => renderLeftActions(habit.$id)}
                renderRightActions={renderRightActions}
                onSwipeableOpen={(direction) => {
                  if (direction === "right") {
                    handelDeleteHabit(habit.$id);
                  } else if (direction === "left") {
                    handelCompleteHabit(habit.$id);
                  }

                  swipableRefs.current[habit.$id]?.close();
                }}
              >
                <Surface
                  key={habit.$id || index}
                  style={[
                    styles.card,
                    isHabitCompleted(habit.$id) && styles.cardCompleted,
                  ]}
                  elevation={4} // Increased elevation for visible shadow
                >
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{habit.title}</Text>
                    <Text style={styles.cardDescription}>
                      {habit.description}
                    </Text>
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
              </Swipeable>
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  container: {
    flex: 1,
    padding: 16,
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
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardCompleted: {
    opacity: 0.6,
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
  swipeActionLeft: {
    justifyContent: "center",
    alignItems: "flex-start",
    flex: 1,
    backgroundColor: "#4caf50",
    borderRadius: 18,
    marginBottom: 18,
    marginTop: 2,
    paddingLeft: 16,
  },
  swipeActionRight: {
    justifyContent: "center",
    alignItems: "flex-end",
    flex: 1,
    backgroundColor: "#e53935",
    borderRadius: 18,
    marginBottom: 18,
    marginTop: 2,
    paddingRight: 16,
  },
  tutorialContainer: {
    position: 'absolute',
    top: 80,
    left: 16,
    right: 16,
    zIndex: 1000,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  tutorialContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tutorialText: {
    fontSize: 16,
    color: '#22223b',
    fontWeight: '500',
  },
  undoContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    zIndex: 1000,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  undoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  undoText: {
    fontSize: 16,
    color: '#22223b',
    fontWeight: '500',
  },
  undoButton: {
    marginLeft: 16,
    borderRadius: 8,
  },
});
