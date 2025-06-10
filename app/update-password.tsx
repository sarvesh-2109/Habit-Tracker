import { useAuth } from "@/lib/auth-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { Button, Text, TextInput, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function UpdatePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [error, setError] = useState<string | null>("");
  const [success, setSuccess] = useState<string | null>(null);

  const theme = useTheme();
  const router = useRouter();
  const { updatePassword } = useAuth();

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long");
      return;
    }

    setError(null);
    setSuccess(null);

    const result = await updatePassword(newPassword, currentPassword);
    if (result) {
      setError(result);
    } else {
      setSuccess("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setTimeout(() => {
        router.back();
      }, 1500);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "android" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.content}>
          <Text style={styles.title} variant="headlineSmall">
            Update Password
          </Text>

          <View style={styles.formContainer}>
            <TextInput
              label="Current Password"
              autoCapitalize="none"
              secureTextEntry
              mode="outlined"
              style={styles.input}
              theme={{ roundness: 12 }}
              onChangeText={setCurrentPassword}
              value={currentPassword}
            />

            <TextInput
              label="New Password"
              autoCapitalize="none"
              secureTextEntry
              mode="outlined"
              style={styles.input}
              theme={{ roundness: 12 }}
              onChangeText={setNewPassword}
              value={newPassword}
            />

            {error && <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>}
            {success && <Text style={[styles.successText, { color: "#4caf50" }]}>{success}</Text>}

            <Button
              mode="contained"
              style={styles.button}
              contentStyle={styles.buttonContent}
              onPress={handleUpdatePassword}
            >
              Update Password
            </Button>

            <Button
              mode="text"
              onPress={() => router.back()}
              style={styles.cancelButton}
            >
              Cancel
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },
  title: {
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
    color: "#22223b",
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
  button: {
    marginTop: 16,
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  errorText: {
    marginTop: 16,
    textAlign: "center",
    fontSize: 14,
  },
  successText: {
    marginTop: 16,
    textAlign: "center",
    fontSize: 14,
  },
  cancelButton: {
    marginTop: 8,
  },
});