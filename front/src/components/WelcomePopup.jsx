import React, { useEffect, useState } from "react";

import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import CloseIcon from "@mui/icons-material/Close";

import { STORAGE_KEYS } from "../branding/brand.js";
import { useStore } from "../context/StoreContext.jsx";

const SERIF = '"Playfair Display", Georgia, serif';

export default function WelcomePopup() {
  const { settings } = useStore();
  const popup = settings.welcomePopup;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!popup?.enabled) return;

    let alreadySeen = false;
    try {
      alreadySeen = sessionStorage.getItem(STORAGE_KEYS.WELCOME_POPUP_SEEN) === "1";
    } catch {
      alreadySeen = false;
    }

    if (!alreadySeen) setOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [popup?.enabled]);

  const handleClose = () => {
    setOpen(false);
    try {
      sessionStorage.setItem(STORAGE_KEYS.WELCOME_POPUP_SEEN, "1");
    } catch {
      /* sessionStorage unavailable */
    }
  };

  if (!popup?.enabled) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: "visible" } }}
    >
      <IconButton
        aria-label="Cerrar"
        onClick={handleClose}
        sx={{
          position: "absolute",
          top: 10,
          right: 10,
          border: "1px solid rgba(67,48,34,0.15)",
          bgcolor: "#fffdf8",
        }}
        size="small"
      >
        <CloseIcon fontSize="small" />
      </IconButton>

      <DialogContent sx={{ p: { xs: 3, sm: 4 } }}>
        <Stack spacing={2.5}>
          <Typography sx={{ fontFamily: SERIF, fontWeight: 800, fontSize: "1.6rem" }}>
            {popup.title}
          </Typography>

          {popup.subtitle ? (
            <Typography color="text.secondary" sx={{ mt: -1.5, fontSize: "0.95rem" }}>
              {popup.subtitle}
            </Typography>
          ) : null}

          <Stack spacing={2}>
            {(popup.steps || []).map((step, index) => (
              <Stack key={`${index}-${step}`} direction="row" spacing={1.5} alignItems="flex-start">
                <Box
                  sx={{
                    flexShrink: 0,
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    bgcolor: "#1d1612",
                    color: "#c8a45d",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 900,
                    fontSize: "0.85rem",
                  }}
                >
                  {index + 1}
                </Box>
                <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", lineHeight: 1.4, pt: 0.25 }}>
                  {step}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
