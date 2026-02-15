/**
 * Single source of truth for generating the Planet Detroit newsletter HTML.
 * Used by both the Preview page and the "Generate Newsletter" (ActiveCampaign push).
 *
 * All styles are INLINE — no <style> block — for maximum email client compatibility.
 */

import type { NewsletterState, PDPost, AdSlot, CivicAction, PublicMeeting, CommentPeriod } from "@/types/newsletter";
import { STAFF_MEMBERS } from "@/types/newsletter";

// ── Helpers ──────────────────────────────────────────────────────────────

function formatIssueDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ── Social Icon SVGs ─────────────────────────────────────────────────────

const SOCIAL_ICONS = {
  facebook: {
    url: "https://www.facebook.com/planetdetroitnews",
    title: "Facebook",
    svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.5 2 2 6.5 2 12c0 5 3.7 9.1 8.4 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7C18.3 21.1 22 17 22 12c0-5.5-4.5-10-10-10z"/></svg>`,
  },
  bluesky: {
    url: "https://bsky.app/profile/planetdetroit.bsky.social",
    title: "Bluesky",
    svg: `<svg width="20" height="20" viewBox="0 0 600 530" fill="#ffffff" xmlns="http://www.w3.org/2000/svg"><path d="M135.72 44.03c66.496 49.921 138.02 151.14 164.28 205.46 26.262-54.316 97.782-155.54 164.28-205.46 47.98-36.021 125.72-63.892 125.72 24.795 0 17.712-10.155 148.79-16.111 170.07-20.703 73.984-96.144 92.854-163.25 81.433 117.3 19.964 147.14 86.092 82.697 152.22-122.39 125.59-175.91-31.511-189.63-71.766-2.514-7.3797-3.6904-10.832-3.7077-7.8964-0.0174-2.9357-1.1937 0.51669-3.7077 7.8964-13.714 40.255-67.233 197.36-189.63 71.766-64.444-66.128-34.605-132.26 82.697-152.22-67.108 11.421-142.55-7.4491-163.25-81.433-5.9562-21.282-16.111-152.36-16.111-170.07 0-88.687 77.742-60.816 125.72-24.795z"/></svg>`,
  },
  instagram: {
    url: "https://www.instagram.com/planetdetroitnews/",
    title: "Instagram",
    svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff" xmlns="http://www.w3.org/2000/svg"><path d="M12,4.622c2.403,0,2.688,0.009,3.637,0.052c0.877,0.04,1.354,0.187,1.671,0.31c0.42,0.163,0.72,0.358,1.035,0.673c0.315,0.315,0.51,0.615,0.673,1.035c0.123,0.317,0.27,0.794,0.31,1.671c0.043,0.949,0.052,1.234,0.052,3.637s-0.009,2.688-0.052,3.637c-0.04,0.877-0.187,1.354-0.31,1.671c-0.163,0.42-0.358,0.72-0.673,1.035c-0.315,0.315-0.615,0.51-1.035,0.673c-0.317,0.123-0.794,0.27-1.671,0.31c-0.949,0.043-1.233,0.052-3.637,0.052s-2.688-0.009-3.637-0.052c-0.877-0.04-1.354-0.187-1.671-0.31c-0.42-0.163-0.72-0.358-1.035-0.673c-0.315-0.315-0.51-0.615-0.673-1.035c-0.123-0.317-0.27-0.794-0.31-1.671C4.631,14.688,4.622,14.403,4.622,12s0.009-2.688,0.052-3.637c0.04-0.877,0.187-1.354,0.31-1.671c0.163-0.42,0.358-0.72,0.673-1.035c0.315-0.315,0.615-0.51,1.035-0.673c0.317-0.123,0.794-0.27,1.671-0.31C9.312,4.631,9.597,4.622,12,4.622 M12,3C9.556,3,9.249,3.01,8.289,3.054C7.331,3.098,6.677,3.25,6.105,3.472C5.513,3.702,5.011,4.01,4.511,4.511c-0.5,0.5-0.808,1.002-1.038,1.594C3.25,6.677,3.098,7.331,3.054,8.289C3.01,9.249,3,9.556,3,12c0,2.444,0.01,2.751,0.054,3.711c0.044,0.958,0.196,1.612,0.418,2.185c0.23,0.592,0.538,1.094,1.038,1.594c0.5,0.5,1.002,0.808,1.594,1.038c0.572,0.222,1.227,0.375,2.185,0.418C9.249,20.99,9.556,21,12,21s2.751-0.01,3.711-0.054c0.958-0.044,1.612-0.196,2.185-0.418c0.592-0.23,1.094-0.538,1.594-1.038c0.5-0.5,0.808-1.002,1.038-1.594c0.222-0.572,0.375-1.227,0.418-2.185C20.99,14.751,21,14.444,21,12s-0.01-2.751-0.054-3.711c-0.044-0.958-0.196-1.612-0.418-2.185c-0.23-0.592-0.538-1.094-1.038-1.594c-0.5-0.5-1.002-0.808-1.594-1.038c-0.572-0.222-1.227-0.375-2.185-0.418C14.751,3.01,14.444,3,12,3L12,3z M12,7.378c-2.552,0-4.622,2.069-4.622,4.622S9.448,16.622,12,16.622s4.622-2.069,4.622-4.622S14.552,7.378,12,7.378z M12,15c-1.657,0-3-1.343-3-3s1.343-3,3-3s3,1.343,3,3S13.657,15,12,15z M16.804,6.116c-0.596,0-1.08,0.484-1.08,1.08s0.484,1.08,1.08,1.08c0.596,0,1.08-0.484,1.08-1.08S17.401,6.116,16.804,6.116z"/></svg>`,
  },
  linkedin: {
    url: "https://www.linkedin.com/company/planetdetroit/",
    title: "LinkedIn",
    svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff" xmlns="http://www.w3.org/2000/svg"><path d="M19.7,3H4.3C3.582,3,3,3.582,3,4.3v15.4C3,20.418,3.582,21,4.3,21h15.4c0.718,0,1.3-0.582,1.3-1.3V4.3C21,3.582,20.418,3,19.7,3z M8.339,18.338H5.667v-8.59h2.672V18.338z M7.004,8.574c-0.857,0-1.549-0.694-1.549-1.548c0-0.855,0.691-1.548,1.549-1.548c0.854,0,1.547,0.694,1.547,1.548C8.551,7.881,7.858,8.574,7.004,8.574z M18.339,18.338h-2.669v-4.177c0-0.996-0.017-2.278-1.387-2.278c-1.389,0-1.601,1.086-1.601,2.206v4.249h-2.667v-8.59h2.559v1.174h0.037c0.356-0.675,1.227-1.387,2.526-1.387c2.703,0,3.203,1.779,3.203,4.092V18.338z"/></svg>`,
  },
  nextdoor: {
    url: "https://nextdoor.com/page/planet-detroit-news/",
    title: "Nextdoor",
    svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff" xmlns="http://www.w3.org/2000/svg"><path d="M11.98 0C5.37 0 .02 5.35.02 11.96c0 6.62 5.35 11.97 11.96 11.97 6.62 0 11.97-5.35 11.97-11.97C23.95 5.35 18.6 0 11.98 0zm5.19 17.26h-2.72v-5.43c0-1.41-.56-2.37-1.96-2.37-1.07 0-1.7.72-1.98 1.42-.1.25-.13.59-.13.94v5.44H7.66s.04-8.83 0-9.74h2.72v1.38c.36-.56 1.01-1.35 2.45-1.35 1.79 0 3.13 1.17 3.13 3.69v6.02h.01zM6.26 6.45c-.93 0-1.54.61-1.54 1.41 0 .79.59 1.42 1.51 1.42h.02c.95 0 1.54-.63 1.54-1.42-.02-.8-.59-1.41-1.53-1.41z"/></svg>`,
  },
  tiktok: {
    url: "https://www.tiktok.com/@planetdetroitnews",
    title: "TikTok",
    svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff" xmlns="http://www.w3.org/2000/svg"><path d="M20.3,10.1c-0.2,0-0.3,0-0.5,0c-1.8,0-3.4-0.9-4.4-2.4c0,3.7,0,7.9,0,8c0,3.3-2.6,5.9-5.9,5.9s-5.9-2.6-5.9-5.9s2.6-5.9,5.9-5.9c0.1,0,0.2,0,0.4,0v2.9c-0.1,0-0.2,0-0.4,0c-1.7,0-3,1.4-3,3s1.4,3,3,3s3.1-1.3,3.1-3c0-0.1,0-13.6,0-13.6h2.8c0.3,2.5,2.3,4.5,4.8,4.6V10.1z"/></svg>`,
  },
};

// ── Story Layout Renderer ────────────────────────────────────────────────

function renderStoryHTML(post: PDPost): string {
  const layout = post.photoLayout || "small-left";
  const blurb = post.subtitle || post.excerpt;
  const img = post.featuredImage;

  if (layout === "top" && img) {
    return `<div style="margin-bottom:24px;">
  <a href="${post.url}" style="text-decoration:none;"><img src="${img}" alt="" style="width:100%;height:auto;border-radius:6px;display:block;margin-bottom:10px;" /></a>
  <h3 style="font-size:16px;margin:0 0 4px;"><a href="${post.url}" style="color:#2982C4;text-decoration:none;">${post.title}</a></h3>
  <p style="font-size:14px;color:#555;margin:0;line-height:1.5;">${blurb}</p>
</div>`;
  }

  if (layout === "small-left" && img) {
    return `<div style="margin-bottom:20px;overflow:hidden;">
  <a href="${post.url}" style="text-decoration:none;float:left;margin-right:14px;margin-bottom:4px;"><img src="${img}" alt="" style="width:120px;height:80px;object-fit:cover;border-radius:4px;display:block;" /></a>
  <h3 style="font-size:16px;margin:0 0 4px;"><a href="${post.url}" style="color:#2982C4;text-decoration:none;">${post.title}</a></h3>
  <p style="font-size:14px;color:#555;margin:0;line-height:1.5;">${blurb}</p>
  <div style="clear:both;"></div>
</div>`;
  }

  // "none" or no image
  return `<div style="margin-bottom:20px;">
  <h3 style="font-size:16px;margin:0 0 4px;"><a href="${post.url}" style="color:#2982C4;text-decoration:none;">${post.title}</a></h3>
  <p style="font-size:14px;color:#555;margin:0;line-height:1.5;">${blurb}</p>
</div>`;
}

// ── Section Title ────────────────────────────────────────────────────────

function sectionTitle(text: string): string {
  return `<div style="font-size:18px;font-weight:bold;color:#2982C4;border-bottom:2px solid #2982C4;padding-bottom:8px;margin-bottom:16px;">${text}</div>`;
}

// ── Ad Slot Renderer ─────────────────────────────────────────────────────

function renderAdsForPosition(ads: AdSlot[], position: AdSlot["position"]): string {
  const active = ads.filter((a) => a.active && a.position === position);
  if (active.length === 0) return "";
  return active
    .map(
      (ad) =>
        `\n<div style="padding:16px 32px;">
  <!-- Ad: ${ad.name} -->
  ${ad.htmlContent}
</div>`
    )
    .join("");
}

// ── Civic Action Renderer ────────────────────────────────────────────────

const ACTION_EMOJI: Record<string, string> = {
  attend: "&#x1F4CD;",    // 📍
  comment: "&#x1F4AC;",   // 💬
  sign: "&#x270D;&#xFE0F;", // ✍️
  contact: "&#x1F4DE;",   // 📞
  volunteer: "&#x1F64B;", // 🙋
  follow: "&#x1F441;&#xFE0F;", // 👁️
  "learn-more": "&#x1F4DA;", // 📚
};

function renderCivicActionHTML(intro: string, actions: CivicAction[]): string {
  const actionItems = actions
    .map((a) => {
      const emoji = ACTION_EMOJI[a.actionType] || "&#x2714;&#xFE0F;";
      const titleHtml = a.url
        ? `<a href="${a.url}" style="color:#1e293b;text-decoration:none;font-weight:bold;">${a.title}</a>`
        : `<strong>${a.title}</strong>`;
      const linkHtml = a.url
        ? ` <a href="${a.url}" style="color:#2982C4;font-size:13px;text-decoration:none;">&rarr; Learn more</a>`
        : "";
      return `<div style="margin-bottom:14px;padding-left:4px;">
        <div style="font-size:15px;margin-bottom:3px;">${emoji} ${titleHtml}</div>
        <div style="font-size:13px;color:#555;line-height:1.5;padding-left:24px;">${a.description}${linkHtml}</div>
      </div>`;
    })
    .join("");

  return `
<div style="padding:16px 32px;">
  <div style="background:#f0f7fc;border-left:4px solid #2982C4;border-radius:6px;padding:20px 24px;">
    <div style="font-size:18px;font-weight:bold;color:#2982C4;margin-bottom:12px;">&#x1F91D; Take Action</div>
    <p style="font-size:14px;color:#333;line-height:1.6;margin:0 0 16px;">${intro}</p>
    ${actionItems}
  </div>
</div>`;
}

// ── Public Meetings & Comment Periods Renderer ──────────────────────────

function formatMeetingDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function renderPublicMeetingsHTML(
  intro: string,
  meetings: PublicMeeting[],
  commentPeriods: CommentPeriod[]
): string {
  const parts: string[] = [];

  parts.push(`
<div style="padding:16px 32px;">
  <div style="background:#f0f7fc;border-left:4px solid #2982C4;border-radius:6px;padding:20px 24px;">
    <div style="font-size:18px;font-weight:bold;color:#2982C4;margin-bottom:12px;">&#x1F3DB;&#xFE0F; Public Meetings &amp; Comment Periods</div>`);

  if (intro) {
    parts.push(`    <p style="font-size:14px;color:#333;line-height:1.6;margin:0 0 16px;">${intro}</p>`);
  }

  // Meetings
  if (meetings.length > 0) {
    parts.push(`    <div style="font-size:13px;font-weight:bold;color:#1e293b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Upcoming Meetings</div>`);
    for (const m of meetings) {
      const badges: string[] = [];
      if (m.is_virtual) badges.push(`<span style="font-size:10px;font-weight:bold;color:#7c3aed;border:1px solid #7c3aed;padding:1px 5px;border-radius:3px;margin-left:6px;">Virtual</span>`);
      if (m.is_hybrid) badges.push(`<span style="font-size:10px;font-weight:bold;color:#0891b2;border:1px solid #0891b2;padding:1px 5px;border-radius:3px;margin-left:6px;">Hybrid</span>`);
      if (m.accepts_public_comment) badges.push(`<span style="font-size:10px;font-weight:bold;color:#16a34a;border:1px solid #16a34a;padding:1px 5px;border-radius:3px;margin-left:6px;">Public Comment</span>`);
      const badgesHtml = badges.join("");

      const titleHtml = m.details_url
        ? `<a href="${m.details_url}" style="color:#1e293b;text-decoration:none;font-weight:bold;">${m.title}</a>`
        : `<strong>${m.title}</strong>`;
      const linkHtml = m.details_url
        ? ` <a href="${m.details_url}" style="color:#2982C4;font-size:12px;text-decoration:none;">&rarr; Details</a>`
        : "";

      parts.push(`      <div style="margin-bottom:12px;padding-left:4px;">
        <div style="font-size:14px;margin-bottom:2px;">${titleHtml}${badgesHtml}</div>
        <div style="font-size:12px;color:#64748b;line-height:1.5;">
          <span style="font-weight:600;color:#2982C4;">${m.agency}</span>
          &middot; ${formatMeetingDate(m.start_datetime)}${m.location ? ` &middot; ${m.location}` : ""}${linkHtml}
        </div>
      </div>`);
    }
  }

  // Comment Periods
  if (commentPeriods.length > 0) {
    if (meetings.length > 0) {
      parts.push(`    <div style="height:1px;background:#d4e8f7;margin:14px 0;"></div>`);
    }
    parts.push(`    <div style="font-size:13px;font-weight:bold;color:#1e293b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Open Comment Periods</div>`);
    for (const cp of commentPeriods) {
      const days = cp.days_remaining;
      let urgencyColor = "#16a34a"; // green
      let urgencyLabel = `${days} days left`;
      if (days < 7) {
        urgencyColor = "#dc2626"; // red
        urgencyLabel = days <= 1 ? "Closing soon!" : `${days} days left`;
      } else if (days <= 14) {
        urgencyColor = "#d97706"; // amber
      }

      const titleHtml = cp.comment_url
        ? `<a href="${cp.comment_url}" style="color:#1e293b;text-decoration:none;font-weight:bold;">${cp.title}</a>`
        : `<strong>${cp.title}</strong>`;
      const linkHtml = cp.comment_url
        ? ` <a href="${cp.comment_url}" style="color:#2982C4;font-size:12px;text-decoration:none;">&rarr; Submit comment</a>`
        : "";

      parts.push(`      <div style="margin-bottom:12px;padding-left:4px;">
        <div style="font-size:14px;margin-bottom:2px;">${titleHtml} <span style="font-size:10px;font-weight:bold;color:${urgencyColor};border:1px solid ${urgencyColor};padding:1px 5px;border-radius:3px;margin-left:6px;">${urgencyLabel}</span></div>
        <div style="font-size:12px;color:#64748b;line-height:1.5;">
          <span style="font-weight:600;color:#2982C4;">${cp.agency}</span>
          &middot; Closes ${cp.end_date}${linkHtml}
        </div>
        ${cp.description ? `<div style="font-size:12px;color:#555;line-height:1.4;margin-top:3px;">${cp.description}</div>` : ""}
      </div>`);
    }
  }

  parts.push(`  </div>
</div>`);

  return parts.join("\n");
}

// ── Fundraising Email Generator ──────────────────────────────────────────

function generateFundraisingHTML(state: NewsletterState): string {
  const issueDate = formatIssueDate(state.issueDate);

  const logoHTML = state.logoUrl
    ? `<img src="${state.logoUrl}" alt="Planet Detroit" style="max-width:280px;height:auto;display:block;margin:0 auto 8px;" />`
    : `<h1 style="color:#1e293b;font-size:28px;margin:0;letter-spacing:1px;">PLANET DETROIT</h1>`;

  const parts: string[] = [];

  // Document open
  parts.push(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Planet Detroit</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;">${state.previewText ? `
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${state.previewText}</div>
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>` : ""}
<div style="max-width:600px;margin:0 auto;background:#ffffff;" role="article" aria-label="Planet Detroit">`);

  // Header
  parts.push(`
<div style="background:#ffffff;padding:24px 32px;text-align:center;border-bottom:1px solid #e2e8f0;">
  ${logoHTML}
  ${issueDate ? `<p style="color:#1e293b;font-size:14px;font-weight:bold;margin:8px 0 0;">${issueDate}</p>` : ""}
</div>`);

  // Fundraising letter with personalized greeting + signoff
  if (state.fundraisingLetter) {
    const staff = STAFF_MEMBERS.find((m) => m.id === state.signoffStaffId) || STAFF_MEMBERS[0];
    parts.push(`
<div style="padding:24px 32px;">
  <div style="font-size:16px;line-height:1.7;color:#333;"><strong>Dear %FIRSTNAME%,</strong><br><br>${state.fundraisingLetter.replace(/\n/g, "<br>")}</div>
  <table role="presentation" style="margin-top:24px;border-collapse:collapse;">
    <tr>
      <td style="vertical-align:middle;padding-right:14px;">
        <img src="${staff.photoUrl}" alt="${staff.name}" style="width:56px;height:56px;border-radius:50%;object-fit:cover;display:block;" />
      </td>
      <td style="vertical-align:middle;">
        <div style="font-size:14px;color:#64748b;font-style:italic;line-height:1.4;">With gratitude,</div>
        <div style="font-size:15px;font-weight:bold;color:#1e293b;line-height:1.4;">${staff.name}</div>
        <div style="font-size:13px;color:#64748b;line-height:1.4;">${staff.title}</div>
      </td>
    </tr>
  </table>
</div>`);
  }

  // Fundraising CTA
  if (state.fundraisingCTA && state.fundraisingCTA.buttonUrl) {
    const fCta = state.fundraisingCTA;
    parts.push(`
<div style="padding:16px 32px;">
  <div style="background:#ffffff;padding:24px;text-align:center;border-radius:8px;">
    <p style="color:#1e293b;font-size:16px;font-weight:bold;margin:0 0 12px;">${fCta.headline}</p>
    <a href="${fCta.buttonUrl}" style="display:inline-block;background:#ea5a39;color:#ffffff;padding:12px 32px;text-decoration:none;font-weight:bold;border-radius:6px;font-size:14px;">${fCta.buttonText}</a>
  </div>
</div>`);
  }

  // Minimal footer
  parts.push(`
<div style="background:#1e293b;padding:24px;text-align:center;">
  <p style="color:rgba(255,255,255,0.7);font-size:12px;margin:4px 0;"><a href="https://planetdetroit.org" style="color:#2982C4;">planetdetroit.org</a></p>
  <p style="color:rgba(255,255,255,0.5);font-size:11px;margin:8px 0 4px;">The Green Garage &middot; 4444 Second Avenue, Detroit, MI 48201</p>
</div>`);

  // Document close
  parts.push(`
</div>
</body>
</html>`);

  return parts.join("\n");
}

// ── Main Generator ───────────────────────────────────────────────────────

export function generateNewsletterHTML(state: NewsletterState): string {
  // ── Fundraising mode: stripped-down email ───────────────────────────────
  if (state.newsletterType === "fundraising") {
    return generateFundraisingHTML(state);
  }

  const selectedPosts = state.pdPosts.filter((p) => p.selected);
  const selectedStories = state.curatedStories.filter((s) => s.selected);
  const hasEventsHtml = state.eventsHtml && state.eventsHtml.replace(/<[^>]*>/g, "").trim().length > 0;
  const selectedJobs = state.jobs.filter((j) => j.selected);
  const issueDate = formatIssueDate(state.issueDate);

  // Logo
  const logoHTML = state.logoUrl
    ? `<img src="${state.logoUrl}" alt="Planet Detroit" style="max-width:280px;height:auto;display:block;margin:0 auto 8px;" />`
    : `<h1 style="color:#1e293b;font-size:28px;margin:0;letter-spacing:1px;">PLANET DETROIT</h1>`;

  // Environmental data strip — black & white minimalist with source links
  let envStrip = "";
  if (state.co2 || state.airQuality || state.lakeLevels) {
    const cells: string[] = [];
    if (state.co2) {
      const changeSign = state.co2.change > 0 ? "+" : "";
      cells.push(`<td style="text-align:center;padding:6px 10px;"><a href="https://gml.noaa.gov/ccgg/trends/weekly.html" style="text-decoration:none;color:inherit;"><div style="font-size:9px;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px;">CO&#8322;</div><div style="font-size:16px;font-weight:bold;color:#1a1a1a;letter-spacing:-0.5px;">${state.co2.current}</div><div style="font-size:9px;color:#666;">${changeSign}${state.co2.change} ppm YoY</div></a></td>`);
    }
    if (state.airQuality) {
      cells.push(`<td style="text-align:center;padding:6px 10px;"><a href="https://www.airnow.gov/?city=Detroit&state=MI" style="text-decoration:none;color:inherit;"><div style="font-size:9px;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px;">Detroit Air</div><div style="font-size:16px;font-weight:bold;color:#1a1a1a;letter-spacing:-0.5px;">${state.airQuality.aqi}</div><div style="font-size:9px;color:#666;">${state.airQuality.category}</div></a></td>`);
    }
    if (state.lakeLevels && state.lakeLevels.erie != null) {
      const arrow = state.lakeLevels.erieChange != null
        ? (state.lakeLevels.erieChange > 0 ? "\u2191" : state.lakeLevels.erieChange < 0 ? "\u2193" : "\u2192")
        : "";
      const changeText = state.lakeLevels.erieChange != null
        ? `${arrow}${Math.abs(state.lakeLevels.erieChange)}m`
        : "";
      cells.push(`<td style="text-align:center;padding:6px 10px;"><a href="https://www.glerl.noaa.gov/data/wlevels/levels.html" style="text-decoration:none;color:inherit;"><div style="font-size:9px;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px;">Lake Erie</div><div style="font-size:16px;font-weight:bold;color:#1a1a1a;letter-spacing:-0.5px;">${state.lakeLevels.erie}m</div>${changeText ? `<div style="font-size:9px;color:#666;">${changeText}</div>` : ""}</a></td>`);
    }
    if (state.lakeLevels && state.lakeLevels.michiganHuron != null) {
      const arrow = state.lakeLevels.michiganHuronChange != null
        ? (state.lakeLevels.michiganHuronChange > 0 ? "\u2191" : state.lakeLevels.michiganHuronChange < 0 ? "\u2193" : "\u2192")
        : "";
      const changeText = state.lakeLevels.michiganHuronChange != null
        ? `${arrow}${Math.abs(state.lakeLevels.michiganHuronChange)}m`
        : "";
      cells.push(`<td style="text-align:center;padding:6px 10px;"><a href="https://www.glerl.noaa.gov/data/wlevels/levels.html" style="text-decoration:none;color:inherit;"><div style="font-size:9px;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px;">MI-Huron</div><div style="font-size:16px;font-weight:bold;color:#1a1a1a;letter-spacing:-0.5px;">${state.lakeLevels.michiganHuron}m</div>${changeText ? `<div style="font-size:9px;color:#666;">${changeText}</div>` : ""}</a></td>`);
    }
    // Add thin separator between cells
    const styledCells = cells.map((cell, i) =>
      i < cells.length - 1
        ? cell.replace('<td style="text-align:center;padding:6px 10px;">', '<td style="text-align:center;padding:6px 10px;border-right:1px solid #e0e0e0;">')
        : cell
    );
    envStrip = `<div style="border-top:1px solid #e0e0e0;border-bottom:1px solid #e0e0e0;padding:10px 0;margin-top:16px;"><table role="presentation" style="width:100%;border-collapse:collapse;"><tr>${styledCells.join("")}</tr></table></div>`;
  }

  // Sponsors
  const championsHTML = state.sponsors.champions
    .map((s) => (s.url ? `<a href="${s.url}" style="color:#2982C4;text-decoration:none;">${s.name}</a>` : s.name))
    .join(" 🌎 ");
  const partnersHTML = state.sponsors.partners
    .map((s) => (s.url ? `<a href="${s.url}" style="color:#2982C4;text-decoration:none;">${s.name}</a>` : s.name))
    .join(" 🌎 ");

  // Social icons
  const socialIconsHTML = Object.values(SOCIAL_ICONS)
    .map((icon) => `<a href="${icon.url}" style="display:inline-block;margin:0 6px;" title="${icon.title}">${icon.svg}</a>`)
    .join("");

  // ── Build the HTML ─────────────────────────────────────────────────────

  const parts: string[] = [];

  // Document open
  parts.push(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Planet Detroit Newsletter</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;">${state.previewText ? `
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${state.previewText}</div>
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>` : ""}
<div style="max-width:600px;margin:0 auto;background:#ffffff;" role="article" aria-label="Planet Detroit Newsletter">`);

  // Header
  parts.push(`
<div style="background:#ffffff;padding:24px 32px;text-align:center;border-bottom:1px solid #e2e8f0;">
  ${logoHTML}
  ${issueDate ? `<p style="color:#1e293b;font-size:14px;font-weight:bold;margin:8px 0 0;">${issueDate}</p>` : ""}
  ${envStrip}
</div>`);

  // Intro + Signoff
  if (state.intro) {
    const staff = STAFF_MEMBERS.find((m) => m.id === state.signoffStaffId) || STAFF_MEMBERS[0];
    parts.push(`
<div style="padding:16px 32px;">
  <div style="font-size:16px;line-height:1.7;color:#333;"><strong>Dear Planet Detroiter,</strong><br><br>${state.intro.replace(/\n/g, "<br>")}</div>
  <table role="presentation" style="margin-top:24px;border-collapse:collapse;">
    <tr>
      <td style="vertical-align:middle;padding-right:14px;">
        <img src="${staff.photoUrl}" alt="${staff.name}" style="width:56px;height:56px;border-radius:50%;object-fit:cover;display:block;" />
      </td>
      <td style="vertical-align:middle;">
        <div style="font-size:14px;color:#64748b;font-style:italic;line-height:1.4;">Thanks for reading,</div>
        <div style="font-size:15px;font-weight:bold;color:#1e293b;line-height:1.4;">${staff.name}</div>
        <div style="font-size:13px;color:#64748b;line-height:1.4;">${staff.title}</div>
      </td>
    </tr>
  </table>
</div>
<div style="padding:0 32px;"><div style="height:1px;background:#e2e8f0;"></div></div>`);
  }

  // P.S. CTA
  if (state.psCTA) {
    const ctaUrl = state.psCtaUrl || "https://donorbox.org/be-a-planet-detroiter-780440";
    const ctaButtonText = state.psCtaButtonText || "Support Planet Detroit";
    parts.push(`
<div style="padding:16px 32px;">
  <p style="font-size:14px;color:#333;line-height:1.6;"><strong>P.S.</strong> ${state.psCTA}</p>
  <div style="text-align:center;margin-top:12px;">
    <a href="${ctaUrl}" style="display:inline-block;background:#ea5a39;color:#ffffff;padding:12px 32px;text-decoration:none;font-weight:bold;border-radius:6px;font-size:14px;">${ctaButtonText}</a>
  </div>
</div>`);
  }

  // Featured Promo
  if (state.featuredPromo) {
    const fp = state.featuredPromo;
    parts.push(`
<div style="padding:16px 32px;">
  <div style="background:#f0f7fc;border-radius:8px;overflow:hidden;border:1px solid #d4e8f7;">
    ${fp.imageUrl ? `<img src="${fp.imageUrl}" alt="" style="width:100%;height:auto;display:block;" />` : ""}
    <div style="padding:20px;">
      <h3 style="font-size:18px;font-weight:bold;color:#1e293b;margin:0 0 8px;">${fp.headline}</h3>
      <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 16px;">${fp.description}</p>
      ${fp.ctaUrl ? `<a href="${fp.ctaUrl}" style="display:inline-block;background:#2982C4;color:#ffffff;padding:10px 24px;text-decoration:none;font-weight:bold;border-radius:6px;font-size:14px;">${fp.ctaText || "Learn More"}</a>` : ""}
    </div>
  </div>
</div>`);
  }

  // Ad slot: after-intro
  parts.push(renderAdsForPosition(state.ads, "after-intro"));

  // PD Stories
  if (selectedPosts.length > 0) {
    parts.push(`
<div style="padding:16px 32px;">
  ${sectionTitle("Reporting from Planet Detroit")}
  ${selectedPosts.map((post) => renderStoryHTML(post)).join("")}
</div>`);
  }

  // Ad slot: after-pd-stories
  parts.push(renderAdsForPosition(state.ads, "after-pd-stories"));

  // Civic Action — Take Action section
  if (state.civicActionIntro && state.civicActions.length > 0) {
    parts.push(renderCivicActionHTML(state.civicActionIntro, state.civicActions));
  }

  // Public Meetings & Comment Periods
  const selectedMeetings = (state.publicMeetings || []).filter((m) => m.selected);
  const selectedCommentPeriods = (state.commentPeriods || []).filter((c) => c.selected);
  if (selectedMeetings.length > 0 || selectedCommentPeriods.length > 0) {
    parts.push(renderPublicMeetingsHTML(
      state.publicMeetingsIntro || "",
      selectedMeetings,
      selectedCommentPeriods
    ));
  }

  // Curated News / What We're Reading
  if (selectedStories.length > 0) {
    parts.push(`
<div style="padding:16px 32px;">
  ${sectionTitle("What We're Reading")}
  ${selectedStories
    .map(
      (s) => `<div style="margin-bottom:20px;">
    <h3 style="font-size:16px;margin:0 0 6px;">${
      s.url
        ? `<a href="${s.url}" style="color:#2982C4;text-decoration:none;">${s.headline.replace(/\*\*/g, "")}</a>`
        : `<span style="color:#2982C4;">${s.headline.replace(/\*\*/g, "")}</span>`
    }</h3>
    <p style="font-size:14px;color:#555;margin:0;line-height:1.5;">${s.summary.replace(/\*\*/g, "")}${s.source ? ` <span style="color:#2982C4;font-style:italic;"> — ${s.source}</span>` : ""}</p>
  </div>`
    )
    .join("")}
</div>`);
  }

  // Ad slot: after-reading
  parts.push(renderAdsForPosition(state.ads, "after-reading"));

  // Jobs — single-line format: Title | Organization
  if (selectedJobs.length > 0) {
    const PARTNER_LINK = "https://planetdetroit.org/impactpartners/";
    const tierBadge = (tier: string | null) => {
      if (tier === "champion") return ` <a href="${PARTNER_LINK}" style="font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;color:#2982C4;text-decoration:none;border:1px solid #2982C4;padding:1px 5px;border-radius:3px;margin-left:8px;">Planet Champion</a>`;
      if (tier === "partner") return ` <a href="${PARTNER_LINK}" style="font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;color:#16a34a;text-decoration:none;border:1px solid #16a34a;padding:1px 5px;border-radius:3px;margin-left:8px;">Impact Partner</a>`;
      return "";
    };
    const featuredBadge = `<span style="font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;color:#b45309;border:1px solid #b45309;padding:1px 5px;border-radius:3px;margin-left:8px;">&#9733; Featured</span>`;

    parts.push(`
<div style="padding:16px 32px;">
  ${sectionTitle("Jobs")}
  ${selectedJobs
    .map(
      (j) => {
        const isFeatured = j.featured;
        const badges = `${isFeatured ? featuredBadge : ""}${tierBadge(j.partnerTier)}`;
        const titleText = j.url
          ? `<a href="${j.url}" style="color:#2982C4;text-decoration:none;">${j.title}</a>`
          : j.title;
        const line = j.organization
          ? `${titleText} <span style="color:#94a3b8;">|</span> ${j.organization}`
          : titleText;
        return `<div style="margin-bottom:8px;font-size:14px;color:#1e293b;">${line}${badges}</div>`;
      }
    )
    .join("")}
</div>`);
  }

  // Events
  if (hasEventsHtml) {
    // Post-process events HTML to ensure links are blue
    const blueLinkedEventsHtml = state.eventsHtml.replace(
      /<a\s+(?![^>]*style=)/gi,
      '<a style="color:#2982C4;text-decoration:none;" '
    ).replace(
      /(<a\s+[^>]*style="[^"]*?)(?:color:[^;]*;?)/gi,
      '$1color:#2982C4;'
    );
    parts.push(`
<div style="padding:16px 32px;">
  ${sectionTitle("Events")}
  <div style="font-size:14px;color:#333;line-height:1.6;">
    ${blueLinkedEventsHtml}
  </div>
</div>`);
  }

  // Sponsors
  if (state.sponsors.champions.length > 0 || state.sponsors.partners.length > 0) {
    parts.push(`
<div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;text-align:center;">
  <p style="font-size:14px;font-weight:bold;color:#1e293b;margin:0 0 12px;text-align:center;">Thank you to Planet Detroit 2026 Planet Champions &amp; Impact Partners</p>
  ${state.sponsors.champions.length > 0 ? `<h3 style="font-size:14px;font-weight:bold;color:#2982C4;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.5px;text-align:center;">Planet Champions</h3><p style="font-size:12px;color:#64748b;line-height:1.6;margin:0 0 10px;text-align:center;">${championsHTML}</p>` : ""}
  ${state.sponsors.partners.length > 0 ? `<h3 style="font-size:14px;font-weight:bold;color:#2982C4;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.5px;text-align:center;">Impact Partners</h3><p style="font-size:12px;color:#64748b;line-height:1.6;margin:0 0 10px;text-align:center;">${partnersHTML}</p>` : ""}
</div>`);
  }

  // Support CTA — black text headline, #ea5a39 button with white text
  const supportCTA = state.supportCTA || {
    headline: "Support local environmental journalism",
    buttonText: "Donate to Planet Detroit",
    buttonUrl: "https://donorbox.org/be-a-planet-detroiter-780440",
  };
  parts.push(`
<div style="padding:16px 32px;">
  <div style="background:#ffffff;padding:24px;text-align:center;border-radius:8px;border:1px solid #e2e8f0;">
    <p style="color:#1e293b;font-size:16px;font-weight:bold;margin:0 0 12px;">${supportCTA.headline}</p>
    <a href="${supportCTA.buttonUrl}" style="display:inline-block;background:#ea5a39;color:#ffffff;padding:12px 32px;text-decoration:none;font-weight:bold;border-radius:6px;font-size:14px;">${supportCTA.buttonText}</a>
  </div>
</div>`);

  // Ad slot: before-footer
  parts.push(renderAdsForPosition(state.ads, "before-footer"));

  // Footer
  parts.push(`
<div style="background:#1e293b;padding:24px;text-align:center;">
  <p style="color:rgba(255,255,255,0.7);font-size:12px;margin:4px 0;"><a href="https://planetdetroit.org" style="color:#2982C4;">planetdetroit.org</a></p>
  <p style="color:rgba(255,255,255,0.9);font-size:12px;font-style:italic;margin:6px 0;">Stay informed about your environment and your health.</p>
  <div style="margin:12px 0 8px;" role="navigation" aria-label="Social media links">${socialIconsHTML}</div>
  <p style="color:rgba(255,255,255,0.5);font-size:11px;margin:8px 0 4px;">The Green Garage &middot; 4444 Second Avenue, Detroit, MI 48201</p>
</div>`);

  // Document close
  parts.push(`
</div>
</body>
</html>`);

  return parts.join("\n");
}
