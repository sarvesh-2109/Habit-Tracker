import { useAuth } from "@/lib/auth-context";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Avatar, Button, Divider, List, Surface, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title} variant="headlineSmall">
          Profile
        </Text>

        <Surface style={styles.profileCard} elevation={4}>
          <View style={styles.avatarContainer}>
            <Avatar.Text
              size={80}
              label={getInitials(user?.email || "U")}
              style={styles.avatar}
            />
            <Text style={styles.email}>{user?.email}</Text>
          </View>

          <Divider style={styles.divider} />

          <List.Section>
            <List.Item
              title="Account Settings"
              left={props => <List.Icon {...props} icon="account-cog" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push("/update-password")}
            />
          </List.Section>

          <Button
            mode="outlined"
            onPress={signOut}
            icon="logout"
            style={styles.signOutButton}
          >
            Sign Out
          </Button>
        </Surface>
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
  title: {
    fontWeight: "bold",
    marginBottom: 16,
  },
  profileCard: {
    borderRadius: 18,
    backgroundColor: "#f7f2fa",
    overflow: "hidden",
  },
  avatarContainer: {
    alignItems: "center",
    padding: 24,
  },
  avatar: {
    backgroundColor: "#7c4dff",
    marginBottom: 12,
  },
  email: {
    fontSize: 16,
    color: "#666",
  },
  divider: {
    marginVertical: 8,
  },
  signOutButton: {
    margin: 16,
    borderColor: "#e53935",
  },
});