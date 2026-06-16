import { NextRequest, NextResponse } from 'next/server';
import { adminMessaging } from '@/lib/firebase-admin';
import { createAdminClient } from '@/lib/supabase/admin';

// Notification type to human-readable message mapping
const typeToMessage: Record<string, string> = {
  like: 'liked your post.',
  comment: 'commented on your post.',
  reply: 'replied to your question.',
  pray: 'prayed for you.',
  prayer: 'prayed for you.',
  friend_request: 'sent you a friend request.',
  message: 'sent you a message.',
  post: 'shared a new post.',
  mention: 'mentioned you.',
};

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate the webhook request
    const authHeader = request.headers.get('Authorization');
    const expectedSecret = process.env.PUSH_WEBHOOK_SECRET;

    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse the notification payload
    const body = await request.json();
    const { user_id, actor_id, type, resource_id, resource_type } = body;

    if (!user_id || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 3. Get the recipient's FCM tokens
    const supabase = createAdminClient();
    const { data: tokens, error: tokensError } = await supabase
      .from('device_tokens')
      .select('token')
      .eq('user_id', user_id);

    if (tokensError) {
      console.error('Error fetching device tokens:', tokensError);
      return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 });
    }

    if (!tokens || tokens.length === 0) {
      // No tokens registered — user hasn't enabled push on any device
      return NextResponse.json({ message: 'No device tokens found' }, { status: 200 });
    }

    // 4. Get the actor's name for the notification body
    let actorName = 'Someone';
    if (actor_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('id', actor_id)
        .single();

      if (profile?.first_name) {
        actorName = profile.first_name;
      }
    }

    const action = typeToMessage[type] || 'sent you a notification.';
    const notificationBody = `${actorName} ${action}`;

    // 5. Send to each device token
    const results = await Promise.allSettled(
      tokens.map(async ({ token }) => {
        try {
          await adminMessaging.send({
            token,
            notification: {
              title: 'Selahly ౨ৎ',
              body: notificationBody,
            },
            webpush: {
              fcmOptions: {
                link: getNotificationLink(type, resource_id, resource_type, actor_id),
              },
              notification: {
                icon: '/logo-v2.svg',
                badge: '/brand-icon-v2.png',
              },
            },
            data: {
              type: type || '',
              resource_id: resource_id || '',
              resource_type: resource_type || '',
              actor_id: actor_id || '',
            },
          });
          return { token: token.substring(0, 10) + '...', success: true };
        } catch (err: any) {
          // If the token is invalid or expired, remove it from the database
          if (
            err?.code === 'messaging/invalid-registration-token' ||
            err?.code === 'messaging/registration-token-not-registered'
          ) {
            console.log('Removing invalid/expired token:', token.substring(0, 10) + '...');
            await supabase
              .from('device_tokens')
              .delete()
              .eq('token', token);
          }
          return { token: token.substring(0, 10) + '...', success: false, error: err?.message };
        }
      })
    );

    const successCount = results.filter(
      (r) => r.status === 'fulfilled' && (r.value as any).success
    ).length;

    return NextResponse.json({
      message: `Push sent to ${successCount}/${tokens.length} devices`,
      results,
    });
  } catch (err) {
    console.error('Push notification error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getNotificationLink(
  type: string,
  resourceId?: string,
  resourceType?: string,
  actorId?: string
): string {
  switch (type) {
    case 'reply':
      return resourceId ? `/velvet-vault/${resourceId}` : '/velvet-vault';
    case 'pray':
    case 'prayer':
      return '/prayer-pocket';
    case 'friend_request':
      return '/home';
    case 'message':
      return actorId ? `/messages/${actorId}` : '/messages';
    case 'mention':
      if (resourceType === 'group_chat' && resourceId) return `/messages/group/${resourceId}`;
      return '/home';
    case 'like':
    case 'comment':
    case 'post':
    default:
      return '/home';
  }
}
