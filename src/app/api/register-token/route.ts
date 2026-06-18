import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/register-token
 * 
 * Called by the Flutter app (or any client) to save an FCM device token.
 * 
 * Headers:
 *   Authorization: Bearer <supabase-jwt>
 * 
 * Body:
 *   { "token": "<fcm-device-token>", "platform": "ios" | "android" | "web" }
 * 
 * The Flutter app should call this on startup after getting the FCM token
 * from firebase_messaging and the Supabase auth session.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate via Supabase JWT
    const authHeader = request.headers.get('Authorization');
    console.log('Register-token auth header present:', !!authHeader, 'headerLength:', authHeader?.length ?? 0);
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('Register token missing or invalid Authorization header', { authHeader });
      return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
    }

    const jwt = authHeader.replace('Bearer ', '');
    const supabase = createAdminClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);

    if (authError || !user) {
      console.error('Register token auth failure:', {
        authError: authError?.message ?? authError,
        user: user ?? null,
      });
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // 2. Parse request body
    const body = await request.json();
    console.log('Register-token body:', JSON.stringify(body));
    const { token, platform } = body;

    if (!token || typeof token !== 'string') {
      console.error('Register token validation failure:', { token, platform });
      return NextResponse.json({ error: 'Missing or invalid FCM token' }, { status: 400 });
    }

    const validPlatforms = ['ios', 'android', 'web'];
    const resolvedPlatform = validPlatforms.includes(platform) ? platform : 'web';

    console.log('Register token payload:', {
      user_id: user.id,
      tokenLength: token.length,
      platform: resolvedPlatform,
    });

    // 3. Upsert device token (insert or update timestamp if it already exists)
    const { error: upsertError } = await supabase
      .from('device_tokens')
      .upsert(
        {
          user_id: user.id,
          token,
          platform: resolvedPlatform,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,token' }
      );

    if (upsertError) {
      console.error('Error saving device token:', JSON.stringify(upsertError, Object.getOwnPropertyNames(upsertError)));
      const errorResponse = { error: 'Failed to save token' };
      if (isDebugMode(request)) {
        errorResponse.details = upsertError;
      }
      return NextResponse.json(errorResponse, { status: 500 });
    }

    return NextResponse.json({ success: true, user_id: user.id, platform: resolvedPlatform });
  } catch (err) {
    console.error('Register token error:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
    const errorResponse = { error: 'Internal server error' };
    if (isDebugMode(request)) {
      errorResponse.details = err;
    }
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * DELETE /api/register-token
 * 
 * Called by the Flutter app on logout to unregister the device token,
 * so the user stops receiving push notifications on that device.
 * 
 * Headers:
 *   Authorization: Bearer <supabase-jwt>
 * 
 * Body:
 *   { "token": "<fcm-device-token>" }
 */
function isDebugMode(request: NextRequest) {
  return (
    process.env.DEBUG_REGISTER_TOKEN === 'true' ||
    request.headers.get('x-debug-register-token') === 'true'
  );
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
    }

    const jwt = authHeader.replace('Bearer ', '');
    const supabase = createAdminClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Missing FCM token' }, { status: 400 });
    }

    const { error: deleteError } = await supabase
      .from('device_tokens')
      .delete()
      .eq('user_id', user.id)
      .eq('token', token);

    if (deleteError) {
      console.error('Error deleting device token:', deleteError);
      return NextResponse.json({ error: 'Failed to delete token' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Unregister token error:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
