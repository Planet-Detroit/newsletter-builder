import { NextRequest, NextResponse } from 'next/server';

interface RequestBody {
  html: string;
  subjectLine: string;
  issueDate: string;
  senderName?: string;
  senderEmail?: string;
}

const AC_API_URL = process.env.ACTIVECAMPAIGN_API_URL; // e.g. https://planetdetroit.api-us1.com
const AC_API_KEY = process.env.ACTIVECAMPAIGN_API_KEY;

/**
 * ActiveCampaign v1 API helper.
 * The v3 API can create campaigns and messages separately but cannot link them together.
 * The v1 API supports the full workflow: message_add → campaign_create with message linkage.
 */
async function v1Post(action: string, postData: Record<string, string>): Promise<Record<string, unknown>> {
  if (!AC_API_URL || !AC_API_KEY) {
    throw new Error('Missing ActiveCampaign API credentials. Set ACTIVECAMPAIGN_API_URL and ACTIVECAMPAIGN_API_KEY in .env.local');
  }

  const params = new URLSearchParams({
    api_action: action,
    api_key: AC_API_KEY,
    api_output: 'json',
  });

  const url = `${AC_API_URL}/admin/api.php?${params.toString()}`;

  console.log(`[ActiveCampaign v1] POST ${action}`);

  const formBody = new URLSearchParams(postData);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formBody.toString(),
  });

  const data = await response.json();

  if (data.result_code === 0 || data.result_code === '0') {
    console.error(`[ActiveCampaign v1] Error in ${action}:`, data.result_message);
    throw new Error(`ActiveCampaign ${action} failed: ${data.result_message}`);
  }

  console.log(`[ActiveCampaign v1] ${action} succeeded`);
  return data;
}

/**
 * v3 API helper — used for fetching list IDs (read-only, works fine in v3).
 */
async function v3Get(endpoint: string): Promise<Record<string, unknown>> {
  if (!AC_API_URL || !AC_API_KEY) {
    throw new Error('Missing ActiveCampaign API credentials');
  }

  const url = `${AC_API_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: { 'Api-Token': AC_API_KEY },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ActiveCampaign API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('[ActiveCampaign] Received POST request');

    const body: RequestBody = await request.json();
    const { html, subjectLine, issueDate, senderName, senderEmail } = body;

    if (!html || !subjectLine || !issueDate) {
      return NextResponse.json(
        { error: 'Missing required fields: html, subjectLine, issueDate' },
        { status: 400 }
      );
    }

    // Step 1: Get list IDs via v3 API (read-only, works fine)
    console.log('[ActiveCampaign] Fetching lists...');
    const listsData = await v3Get('/api/3/lists');
    const lists = (listsData.lists as Array<{ id: string }>) || [];

    if (lists.length === 0) {
      throw new Error('No lists found in ActiveCampaign account');
    }

    const listIds = lists.map((l) => l.id);
    console.log(`[ActiveCampaign] Found ${listIds.length} lists: ${listIds.join(', ')}`);

    // Step 2: Create message via v1 API (message_add)
    const fromEmail = senderEmail || 'newsletter@planetdetroit.org';
    const fromName = senderName ? `${senderName} at Planet Detroit` : 'Planet Detroit';

    const messagePostData: Record<string, string> = {
      format: 'html',
      subject: subjectLine,
      fromemail: fromEmail,
      fromname: fromName,
      reply2: fromEmail,
      priority: '3',
      charset: 'utf-8',
      encoding: 'quoted-printable',
      html: html,
    };

    // Assign message to all lists: p[listId]=listId
    for (const listId of listIds) {
      messagePostData[`p[${listId}]`] = listId;
    }

    const messageResult = await v1Post('message_add', messagePostData);
    const messageId = String(messageResult.id);
    console.log(`[ActiveCampaign] Message created with ID: ${messageId}`);

    // Step 3: Create campaign via v1 API (campaign_create)
    const campaignName = `Planet Detroit Newsletter - ${new Date(issueDate + 'T12:00:00').toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}`;

    // Format date for AC v1: YYYY-MM-DD HH:MM:SS
    const sdate = `${issueDate} 08:00:00`;

    const campaignPostData: Record<string, string> = {
      type: 'single',
      name: campaignName,
      sdate: sdate,
      status: '0', // 0 = draft, will NOT send immediately
      tracklinks: 'all',
      analytics_campaign_name: campaignName,
    };

    // Assign campaign to all lists: p[listId]=listId
    for (const listId of listIds) {
      campaignPostData[`p[${listId}]`] = listId;
    }

    // Link the message to this campaign: m[messageId]=100 (100% of recipients)
    campaignPostData[`m[${messageId}]`] = '100';

    const campaignResult = await v1Post('campaign_create', campaignPostData);
    const campaignId = String(campaignResult.id);
    console.log(`[ActiveCampaign] Campaign created with ID: ${campaignId}`);

    // Build the campaign URL for the AC UI
    const acDomain = (AC_API_URL || '').replace('https://', '').replace('.api-us1.com', '');
    const campaignUrl = `https://${acDomain}.activehosted.com/app/campaigns/${campaignId}`;

    return NextResponse.json(
      {
        success: true,
        campaignId,
        campaignUrl,
        campaignName,
      },
      { status: 201 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[ActiveCampaign] Error:', errorMessage);

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function OPTIONS(): Promise<NextResponse> {
  return NextResponse.json({}, { status: 200 });
}
