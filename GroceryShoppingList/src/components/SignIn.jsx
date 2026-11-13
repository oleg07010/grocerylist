// src/components/SignIn.jsx
//
// Google-only sign-in. Who may read/write the list is decided server-side by the
// email allowlist in firestore.rules — signing in with any other Google account
// succeeds here but every Firestore read is denied.

import { useState } from "react";
import { Box, Typography, Button, Alert } from "@mui/material";
import { signInWithGoogle } from "../lib/googleSignIn";
import { tokens } from "../theme/tokens";

export default function SignIn() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleGoogle = async () => {
    setError("");
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch {
      setError("Sign-in failed. Please try again.");
      setBusy(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 2,
        px: 3,
        maxWidth: 400,
        mx: "auto",
        bgcolor: tokens.color.bg,
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: 700, color: tokens.color.ink }}>
        GrocerySync
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <Button variant="contained" size="large" onClick={handleGoogle} disabled={busy}>
        Sign in with Google
      </Button>
    </Box>
  );
}
