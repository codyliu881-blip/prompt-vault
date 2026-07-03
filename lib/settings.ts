"use client";

export const DEFAULT_VIDEO_TEST_URL =
  "https://dreamina.capcut.com/ai-tool/generate?type=video&workspace=0";

const VIDEO_URL_KEY = "pv_video_test_url";
const CHANGE_EVENT = "pv_video_test_url_change";

export function getVideoTestUrl(): string {
  if (typeof window === "undefined") return DEFAULT_VIDEO_TEST_URL;
  return window.localStorage.getItem(VIDEO_URL_KEY) || DEFAULT_VIDEO_TEST_URL;
}

export function setVideoTestUrl(url: string): void {
  if (typeof window === "undefined") return;
  const trimmed = url.trim();
  if (trimmed) {
    window.localStorage.setItem(VIDEO_URL_KEY, trimmed);
  } else {
    window.localStorage.removeItem(VIDEO_URL_KEY);
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeVideoTestUrl(callback: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
