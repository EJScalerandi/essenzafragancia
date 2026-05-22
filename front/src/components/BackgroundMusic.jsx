import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import MusicNoteIcon from "@mui/icons-material/MusicNote";
import MusicOffIcon from "@mui/icons-material/MusicOff";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SkipNextIcon from "@mui/icons-material/SkipNext";

import { buildApiUrl } from "../api/http.js";
import { useStore } from "../context/StoreContext.jsx";

const MUSIC_USER_PREFERENCE_KEY = "karolin_active_music_user_preference";

function resolveTrackUrl(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/media/")) return buildApiUrl(url);
  return url;
}

function randomIndex(length, currentIndex = -1) {
  if (length <= 1) return 0;
  let next = Math.floor(Math.random() * length);
  if (next === currentIndex) next = (next + 1) % length;
  return next;
}

function readMusicPreference() {
  try {
    return localStorage.getItem(MUSIC_USER_PREFERENCE_KEY) === "disabled" ? "disabled" : "enabled";
  } catch {
    return "enabled";
  }
}

function saveMusicPreference(value) {
  try {
    localStorage.setItem(MUSIC_USER_PREFERENCE_KEY, value);
  } catch {
    // localStorage puede no estar disponible en navegación privada o SSR.
  }
}

export default function BackgroundMusic() {
  const { settings } = useStore();
  const audioRef = useRef(null);
  const startedRef = useRef(false);

  const [userPreference, setUserPreference] = useState(readMusicPreference);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [needsActivation, setNeedsActivation] = useState(false);

  const music = settings?.music;
  const mode = music?.mode === "random" ? "random" : "sequential";
  const userMusicDisabled = userPreference === "disabled";

  const tracks = useMemo(() => {
    if (music?.enabled === false) return [];
    return (music?.tracks ?? [])
      .filter((track) => track?.enabled !== false && track?.url)
      .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
  }, [music]);

  const currentTrack = tracks[currentIndex] || tracks[0] || null;
  const currentUrl = currentTrack ? resolveTrackUrl(currentTrack.url) : "";

  useEffect(() => {
    if (!tracks.length) {
      const audio = audioRef.current;
      if (audio) audio.pause();
      startedRef.current = false;
      setIsPlaying(false);
      setNeedsActivation(false);
      return;
    }

    setCurrentIndex((idx) => {
      if (idx >= 0 && idx < tracks.length) return idx;
      return mode === "random" ? randomIndex(tracks.length) : 0;
    });
  }, [tracks, mode]);

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !currentUrl) return;

    try {
      audio.volume = 0.42;
      await audio.play();
      startedRef.current = true;
      setIsPlaying(true);
      setNeedsActivation(false);
    } catch {
      setIsPlaying(false);
      setNeedsActivation(true);
    }
  }, [currentUrl]);

  const activateMusic = useCallback(() => {
    saveMusicPreference("enabled");
    setUserPreference("enabled");
    setNeedsActivation(false);

    window.setTimeout(() => {
      play();
    }, 0);
  }, [play]);

  const disableMusic = useCallback(() => {
    const audio = audioRef.current;
    if (audio) audio.pause();

    saveMusicPreference("disabled");
    startedRef.current = false;
    setUserPreference("disabled");
    setIsPlaying(false);
    setNeedsActivation(false);
  }, []);

  const goNext = useCallback(() => {
    if (!tracks.length) return;
    setCurrentIndex((idx) => (mode === "random" ? randomIndex(tracks.length, idx) : (idx + 1) % tracks.length));
  }, [mode, tracks.length]);

  useEffect(() => {
    if (!currentUrl || !tracks.length || userMusicDisabled) return;
    const audio = audioRef.current;
    if (!audio) return;

    audio.load();

    if (!startedRef.current) {
      play();
      return;
    }

    if (isPlaying) play();
  }, [currentUrl, tracks.length, userMusicDisabled, isPlaying, play]);

  useEffect(() => {
    if (!tracks.length || !needsActivation || userMusicDisabled) return undefined;

    const onFirstGesture = () => {
      play();
    };

    window.addEventListener("pointerdown", onFirstGesture, { once: true });
    window.addEventListener("keydown", onFirstGesture, { once: true });
    window.addEventListener("touchstart", onFirstGesture, { once: true });

    return () => {
      window.removeEventListener("pointerdown", onFirstGesture);
      window.removeEventListener("keydown", onFirstGesture);
      window.removeEventListener("touchstart", onFirstGesture);
    };
  }, [needsActivation, play, tracks.length, userMusicDisabled]);

  if (!tracks.length || !currentTrack) return null;

  return (
    <>
      <audio ref={audioRef} src={currentUrl} preload={userMusicDisabled ? "metadata" : "auto"} onEnded={goNext} />

      <Paper
        elevation={8}
        sx={{
          position: "fixed",
          right: { xs: 12, sm: 18 },
          bottom: { xs: 12, sm: 18 },
          zIndex: (theme) => theme.zIndex.drawer + 2,
          p: 1,
          borderRadius: 999,
          border: "1px solid rgba(17,17,17,0.10)",
          maxWidth: { xs: "calc(100vw - 24px)", sm: 420 },
          bgcolor: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(10px)",
        }}
      >
        {userMusicDisabled || needsActivation ? (
          <Button startIcon={<MusicNoteIcon />} variant="contained" onClick={activateMusic} sx={{ borderRadius: 999 }}>
            Activar música
          </Button>
        ) : (
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                bgcolor: "#111111",
                color: "#ffffff",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <MusicNoteIcon fontSize="small" />
            </Box>

            <Box sx={{ minWidth: 0, display: { xs: "none", sm: "block" } }}>
              <Typography noWrap sx={{ fontSize: 13, fontWeight: 900, maxWidth: 210 }}>
                {currentTrack.title || "Música de fondo"}
              </Typography>
              <Typography noWrap variant="caption" color="text.secondary">
                {mode === "random" ? "Aleatorio" : "En orden"}
              </Typography>
            </Box>

            <IconButton
              size="small"
              aria-label={isPlaying ? "Desactivar música" : "Reproducir música"}
              onClick={isPlaying ? disableMusic : activateMusic}
            >
              {isPlaying ? <MusicOffIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
            </IconButton>

            <IconButton size="small" aria-label="Siguiente tema" onClick={goNext}>
              <SkipNextIcon fontSize="small" />
            </IconButton>
          </Stack>
        )}
      </Paper>
    </>
  );
}
