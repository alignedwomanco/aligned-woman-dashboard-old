import React from "react";

function getEmbedUrl(url) {
  if (!url) return null;
  // YouTube
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    const videoId = url.includes("youtu.be")
      ? url.split("youtu.be/")[1]?.split("?")[0]
      : new URLSearchParams(url.split("?")[1]).get("v");
    return `https://www.youtube.com/embed/${videoId}?rel=0`;
  }
  // Wistia
  if (url.includes("wistia.com")) {
    const videoId =
      url.match(/medias\/([a-zA-Z0-9]+)/)?.[1] || url.split("/").pop();
    return `https://fast.wistia.net/embed/iframe/${videoId}`;
  }
  // Google Drive
  if (url.includes("drive.google.com")) {
    const fileId = url.match(/[-\w]{25,}/)?.[0];
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }
  return url;
}

export default function VideoEmbed({ videoUrl }) {
  const embedUrl = getEmbedUrl(videoUrl);

  return (
    <div className="rounded-2xl overflow-hidden bg-gray-900" style={{ position: "relative", paddingTop: "56.25%" }}>
      {embedUrl ? (
        <iframe
          src={embedUrl}
          className="absolute top-0 left-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          style={{ border: 0 }}
        />
      ) : (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-white/60 text-sm">
          Video coming soon
        </div>
      )}
    </div>
  );
}