import { KeyboardAvoidingView, Platform, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import { useState } from "react";

export default function AuthScreen() {
  const [isSignup, setIsSignUp] = useState<boolean>(false);

  const handelSwitchMode = () => {
    setIsSignUp((prev) => !prev);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "android" ? "padding" : "height"}
    >
      <View>
        <Text> {isSignup ? "Create Account" : "Welcome Back"} </Text>

        <TextInput
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="example@gmail.com"
          mode="outlined"
        />

        <TextInput
          label="Password"
          autoCapitalize="none"
          keyboardType="email-address"
          mode="outlined"
        />
      </View>

      <Button mode="contained">{isSignup ? "Sign Up" : "Sign In"}</Button>

      <Button mode="text" onPress={handelSwitchMode}>
        {isSignup
          ? "Already have an account? Sign In"
          : "Don't have an account? Sign Up"}
      </Button>
    </KeyboardAvoidingView>
  );
}
