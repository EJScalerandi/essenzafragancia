import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api/http.js";
import {
  BRAND,
  DEFAULT_CONTACT_LINKS,
  DEFAULT_HOME_IMAGES,
  DEFAULT_MUSIC,
  DEFAULT_PAYMENTS,
  normalizeContactLinks,
  normalizeHomeImages,
  normalizeMusicSettings,
  normalizePayments,
  normalizeStoreName,
} from "../branding/brand.js";

const StoreContext = createContext(null);

function normalizeSettings(value = {}) {
  return {
    ...value,
    storeName: normalizeStoreName(value.storeName),
    music: normalizeMusicSettings(value.music || DEFAULT_MUSIC),
    homeImages: normalizeHomeImages(value.homeImages || DEFAULT_HOME_IMAGES),
    payments: normalizePayments(value.payments || DEFAULT_PAYMENTS),
    contactLinks: normalizeContactLinks(value.contactLinks || DEFAULT_CONTACT_LINKS),
  };
}

export function StoreProvider({ children }) {
  const [settings, setSettings] = useState(() =>
    normalizeSettings({
      storeName: BRAND.name,
      music: DEFAULT_MUSIC,
      homeImages: DEFAULT_HOME_IMAGES,
      payments: DEFAULT_PAYMENTS,
      contactLinks: DEFAULT_CONTACT_LINKS,
    })
  );

  const refreshSettings = useCallback(async () => {
    try {
      const remote = await apiFetch("/api/store/settings");
      const next = normalizeSettings({
        ...remote,
        music: remote?.music || DEFAULT_MUSIC,
        homeImages: remote?.homeImages || DEFAULT_HOME_IMAGES,
        payments: remote?.payments || DEFAULT_PAYMENTS,
        contactLinks: remote?.contactLinks || DEFAULT_CONTACT_LINKS,
      });
      setSettings(next);
      return next;
    } catch {
      const fallback = normalizeSettings({
        storeName: BRAND.name,
        music: DEFAULT_MUSIC,
        homeImages: DEFAULT_HOME_IMAGES,
        payments: DEFAULT_PAYMENTS,
        contactLinks: DEFAULT_CONTACT_LINKS,
      });
      setSettings(fallback);
      return fallback;
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const setStoreName = useCallback(async (storeName) => {
    const nextName = normalizeStoreName(storeName);
    setSettings((current) => ({ ...current, storeName: nextName }));

    const updated = await apiFetch("/api/admin/store/settings", {
      method: "PATCH",
      body: JSON.stringify({ storeName: nextName }),
    });

    const normalized = normalizeSettings({
      ...updated,
      music: updated?.music || settings.music,
      homeImages: updated?.homeImages || settings.homeImages,
      payments: updated?.payments || settings.payments,
      contactLinks: updated?.contactLinks || settings.contactLinks,
    });
    setSettings(normalized);
    return normalized;
  }, [settings.contactLinks, settings.homeImages, settings.music, settings.payments]);

  const setMusicSettings = useCallback(async (music) => {
    const normalizedMusic = normalizeMusicSettings(music);
    setSettings((current) => ({ ...current, music: normalizedMusic }));

    const updated = await apiFetch("/api/admin/store/settings", {
      method: "PATCH",
      body: JSON.stringify({ music: normalizedMusic }),
    });

    const normalized = normalizeSettings(updated);
    setSettings(normalized);
    return normalized;
  }, []);

  const setHomeImages = useCallback(async (homeImages) => {
    const normalizedHomeImages = normalizeHomeImages(homeImages);
    setSettings((current) => ({ ...current, homeImages: normalizedHomeImages }));

    const updated = await apiFetch("/api/admin/store/settings", {
      method: "PATCH",
      body: JSON.stringify({ homeImages: normalizedHomeImages }),
    });

    const normalized = normalizeSettings(updated);
    setSettings(normalized);
    return normalized;
  }, []);

  const setPaymentSettings = useCallback(async (payments) => {
    const normalizedPayments = normalizePayments(payments);
    setSettings((current) => ({ ...current, payments: normalizedPayments }));

    const updated = await apiFetch("/api/admin/store/settings", {
      method: "PATCH",
      body: JSON.stringify({ payments: normalizedPayments }),
    });

    const normalized = normalizeSettings(updated);
    setSettings(normalized);
    return normalized;
  }, []);

  const setContactLinks = useCallback(async (contactLinks) => {
    const normalizedContactLinks = normalizeContactLinks(contactLinks);
    setSettings((current) => ({ ...current, contactLinks: normalizedContactLinks }));

    const updated = await apiFetch("/api/admin/store/settings", {
      method: "PATCH",
      body: JSON.stringify({ contactLinks: normalizedContactLinks }),
    });

    const normalized = normalizeSettings(updated);
    setSettings(normalized);
    return normalized;
  }, []);

  const uploadMusicTrack = useCallback(async ({ fileName, title, mimeType, dataUrl }) => {
    const updated = await apiFetch("/api/admin/store/music-tracks", {
      method: "POST",
      body: JSON.stringify({ fileName, title, mimeType, dataUrl }),
    });

    const normalized = normalizeSettings(updated);
    setSettings(normalized);
    return normalized;
  }, []);

  const deleteMusicTrack = useCallback(async (trackId) => {
    const updated = await apiFetch(`/api/admin/store/music-tracks/${encodeURIComponent(trackId)}`, {
      method: "DELETE",
    });

    const normalized = normalizeSettings(updated);
    setSettings(normalized);
    return normalized;
  }, []);

  const uploadHomeImage = useCallback(async ({ fileName, title, mimeType, dataUrl }) => {
    const updated = await apiFetch("/api/admin/store/home-images", {
      method: "POST",
      body: JSON.stringify({ fileName, title, mimeType, dataUrl }),
    });

    const normalized = normalizeSettings(updated);
    setSettings(normalized);
    return normalized;
  }, []);

  const deleteHomeImage = useCallback(async (imageId) => {
    const updated = await apiFetch(`/api/admin/store/home-images/${encodeURIComponent(imageId)}`, {
      method: "DELETE",
    });

    const normalized = normalizeSettings(updated);
    setSettings(normalized);
    return normalized;
  }, []);

  const api = useMemo(
    () => ({
      settings,
      refreshSettings,
      setStoreName,
      setMusicSettings,
      setHomeImages,
      setPaymentSettings,
      setContactLinks,
      uploadMusicTrack,
      deleteMusicTrack,
      uploadHomeImage,
      deleteHomeImage,
    }),
    [
      settings,
      refreshSettings,
      setStoreName,
      setMusicSettings,
      setHomeImages,
      setPaymentSettings,
      setContactLinks,
      uploadMusicTrack,
      deleteMusicTrack,
      uploadHomeImage,
      deleteHomeImage,
    ]
  );

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
