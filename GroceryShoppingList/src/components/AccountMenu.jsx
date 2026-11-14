// src/components/AccountMenu.jsx
//
// The header's "⋮" account menu: the privacy policy, and how to delete your account —
// the in-app path Google Play's account-deletion rule asks for (PLAYSTORE.md § Account
// deletion). Both open the LIVE page: inside the Android/iOS apps Capacitor hands every
// URL outside the app to the phone's browser (a relative link would load the bundled copy
// in the app's own WebView, with no way back on iOS); on the web they open a new tab.
import { useState } from "react";
import { IconButton, Menu, MenuItem } from "@mui/material";
import { MoreVerticalIcon } from "./icons";

const PRIVACY_POLICY_URL = "https://grocerylist-virid.vercel.app/privacy.html";
const ACCOUNT_DELETION_URL = `${PRIVACY_POLICY_URL}#delete`;

const externalLink = { component: "a", target: "_blank", rel: "noopener noreferrer" };

export default function AccountMenu({ buttonSx }) {
  const [anchor, setAnchor] = useState(null);
  const close = () => setAnchor(null);

  return (
    <>
      <IconButton
        aria-label="Account options"
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={buttonSx}
      >
        <MoreVerticalIcon size={18} />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem {...externalLink} href={PRIVACY_POLICY_URL} onClick={close}>
          Privacy policy
        </MenuItem>
        <MenuItem {...externalLink} href={ACCOUNT_DELETION_URL} onClick={close}>
          Delete account…
        </MenuItem>
      </Menu>
    </>
  );
}
