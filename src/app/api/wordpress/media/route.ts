import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/wordpress/media
 *
 * Uploads an image file to the WordPress media library via the REST API.
 * Returns the uploaded image URL so it can be used in ads/newsletter content.
 *
 * Expects: multipart/form-data with a "file" field.
 * Optional form field: "alt_text" for image alt attribute.
 */
export async function POST(req: NextRequest) {
  const wpUrl = process.env.WORDPRESS_URL;
  const wpUser = process.env.WORDPRESS_USERNAME;
  const wpPass = process.env.WORDPRESS_APP_PASSWORD;

  if (!wpUrl || !wpUser || !wpPass) {
    return NextResponse.json(
      { error: "WordPress credentials not configured" },
      { status: 500 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const altText = (formData.get("alt_text") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `File type "${file.type}" not allowed. Use JPEG, PNG, GIF, WebP, or SVG.` },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // Read file into a Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Build auth header
    const auth = Buffer.from(`${wpUser}:${wpPass}`).toString("base64");

    // Upload to WordPress
    const uploadUrl = `${wpUrl}/wp-json/wp/v2/media`;
    const wpRes = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(file.name)}"`,
        "Content-Type": file.type,
      },
      body: buffer,
    });

    if (!wpRes.ok) {
      const errText = await wpRes.text();
      console.error("WordPress media upload failed:", wpRes.status, errText);
      return NextResponse.json(
        { error: `WordPress upload failed (${wpRes.status})` },
        { status: wpRes.status }
      );
    }

    const media = await wpRes.json();

    // If alt text was provided, update the media item
    if (altText && media.id) {
      await fetch(`${uploadUrl}/${media.id}`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ alt_text: altText }),
      }).catch(() => {
        /* non-critical */
      });
    }

    // Return useful data
    return NextResponse.json({
      id: media.id,
      url: media.source_url,
      sizes: {
        full: media.source_url,
        large: media.media_details?.sizes?.large?.source_url || media.source_url,
        medium: media.media_details?.sizes?.medium_large?.source_url || media.source_url,
      },
      filename: media.title?.rendered || file.name,
    });
  } catch (err) {
    console.error("Media upload error:", err);
    return NextResponse.json(
      { error: "Upload failed. Check server logs." },
      { status: 500 }
    );
  }
}
