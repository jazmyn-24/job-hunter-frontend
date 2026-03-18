"use client";

const MOCK_USER = {
  id: "1",
  name: "Jazmyn Singh",
  email: "jazmyn@northeastern.edu",
};

export function useAuth() {
  return {
    user: MOCK_USER,
    isSignedIn: true,
  };
}
