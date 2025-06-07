// import { account } from "@/lib/appwrite";
// import React, { createContext, useContext } from "react";
// import { ID } from "react-native-appwrite";

// type AuthContextType = {
//   //  user: Models.User<Models.Preferences> | null;
//   signUp: (email: string, password: string) => Promise<string | null>;
//   signIn: (email: string, password: string) => Promise<string | null>;
// };

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const signUp = async (email: string, password: string) => {
//     try {
//       await account.create(ID.unique(), email, password);
//       await signIn(email, password);
//       return null;
//     } catch (error) {
//       if (error instanceof Error) {
//         return error.message;
//       }

//       return "An error occured during signup";
//     }
//   };

//   const signIn = async (email: string, password: string) => {
//     try {
//       await account.createEmailPasswordSession(email, password);
//       return null;
//     } catch (error) {
//       if (error instanceof Error) {
//         return error.message;
//       }

//       return "An error occured during sign in";
//     }
//   };

//   return (
//     <AuthContext.Provider value={{ signUp, signIn }}></AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error("useAuth must be inside of the AuthProvider");
//   }

//   return context;
// }
