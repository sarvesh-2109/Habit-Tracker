import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";

function RouteGaurd({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuth = false; // Replace with your actual auth check
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) return; // Skip navigation until mounted

    if (!isAuth) {
      router.replace("/auth");
    }
  }, [hasMounted, isAuth, router]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <RouteGaurd>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* <Stack.Screen name="auth" options={{ headerShown: false }} /> */}
      </Stack>
    </RouteGaurd>
  );
}
