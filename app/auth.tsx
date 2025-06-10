import { useAuth } from "@/lib/auth-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { Button, Text, TextInput, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AuthScreen() {
  const [isSignUp, setisSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>("");
  const [showPassword, setShowPassword] = useState(false);

  const theme = useTheme();
  const router = useRouter();

  const { signIn, signUp } = useAuth();

  const handelAuth = async () => {
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setError(null);

    if (isSignUp) {
      const error = await signUp(email, password);
      if (error) {
        setError(error);
        return;
      }
    } else {
      const error = await signIn(email, password);
      if (error) {
        setError(error);
        return;
      }

      router.replace("/");
    }
  };

  const handelSwitchMode = () => {
    setisSignUp((prev) => !prev);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "android" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.content}>
          <Text style={styles.title} variant="headlineSmall">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </Text>

          <View style={styles.formContainer}>
            <TextInput
              label="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="example@gmail.com"
              mode="outlined"
              style={styles.input}
              theme={{ roundness: 12 }}
              onChangeText={setEmail}
            />

            <TextInput
              label="Password"
              autoCapitalize="none"
              secureTextEntry={!showPassword}
              mode="outlined"
              style={styles.input}
              theme={{ roundness: 12 }}
              onChangeText={setPassword}
              right={
                <TextInput.Icon
                  icon={showPassword ? "eye-off" : "eye"}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />

            {error && <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>}

            <Button
              mode="contained"
              style={styles.button}
              contentStyle={styles.buttonContent}
              onPress={handelAuth}
            >
              {isSignUp ? "Sign Up" : "Sign In"}
            </Button>

            <Button
              mode="text"
              onPress={handelSwitchMode}
              style={styles.switchButton}
            >
              {isSignUp
                ? "Already have an account? Sign In"
                : "Don't have an account? Sign Up"}
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
  switchButton: {
    marginTop: 8,
  },
});
