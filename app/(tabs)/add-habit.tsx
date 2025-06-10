import { DATABASE_ID, databases, HABITS_COLLECTION_ID } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { ID } from "react-native-appwrite";
import {
  Button,
  SegmentedButtons,
  Surface,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";

const FREQUENCIES = ["daily", "weekly", "monthly"];
type Frequency = (typeof FREQUENCIES)[number];

export default function AddHabitScreen() {
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [frequency, setFrequency] = useState<string>("daily");
  const [error, setError] = useState<string>("");
  const { user } = useAuth();
  const router = useRouter();
  const theme = useTheme();

  const handelSubmit = async () => {
    if (!user) return;

    try {
      await databases.createDocument(
        DATABASE_ID,
        HABITS_COLLECTION_ID,
        ID.unique(),
        {
          user_id: user.$id,
          title,
          description,
          frequency,
          streak_count: 0,
          last_completed: new Date().toISOString(),
          created_at: new Date().toTimeString(),
        }
      );

      router.back();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
        return;
      }
      setError("There was an error creating an habit");
    }
  };

  return (
    <View style={styles.container}>
      <Surface style={styles.formContainer} elevation={4}>
        <TextInput
          label="Title"
          mode="outlined"
          onChangeText={setTitle}
          style={styles.input}
          theme={{ roundness: 12 }}
        />
        <TextInput
          label="Description"
          mode="outlined"
          onChangeText={setDescription}
          style={styles.input}
          theme={{ roundness: 12 }}
          multiline
          numberOfLines={3}
        />
        <View style={styles.frequencyContainer}>
          <Text style={styles.frequencyLabel}>Frequency</Text>
          <SegmentedButtons
            value={frequency}
            onValueChange={(value) => setFrequency(value as Frequency)}
            buttons={FREQUENCIES.map((freq) => ({
              value: freq,
              label: freq.charAt(0).toUpperCase() + freq.slice(1),
            }))}
            style={styles.segmentedButtons}
          />
        </View>
        <Button
          mode="contained"
          onPress={handelSubmit}
          disabled={!title || !description}
          style={styles.submitButton}
          contentStyle={styles.submitButtonContent}
        >
          Add Habit
        </Button>
        {error && <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>}
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  formContainer: {
    padding: 20,
    borderRadius: 18,
    backgroundColor: "#f7f2fa",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  input: {
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  frequencyContainer: {
    marginBottom: 24,
  },
  frequencyLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#22223b",
  },
  segmentedButtons: {
    borderRadius: 12,
  },
  submitButton: {
    borderRadius: 12,
    marginTop: 8,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
  errorText: {
    marginTop: 16,
    textAlign: "center",
    fontSize: 14,
  },
});
