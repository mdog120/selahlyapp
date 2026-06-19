import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { FLOWERS, FlowerType } from '@/data/gardenVerses';

export async function POST(request: NextRequest) {
  return await processCheck(request);
}

export async function GET(request: NextRequest) {
  return await processCheck(request);
}

async function processCheck(request: NextRequest) {
  try {
    // 1. Authenticate Request
    const authHeader = request.headers.get('Authorization');
    const expectedSecret = process.env.PUSH_WEBHOOK_SECRET;

    let targetUserId: string | null = null;
    let isAdmin = false;
    const supabase = createAdminClient();

    if (expectedSecret && authHeader === `Bearer ${expectedSecret}`) {
      isAdmin = true;
    } else if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // Validate token with Supabase Auth
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (user && !authError) {
        targetUserId = user.id;
      } else {
        return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
      }
    } else {
      return NextResponse.json({ error: 'Unauthorized: Missing credentials' }, { status: 401 });
    }

    const now = new Date();
    const reports = {
      plantsChecked: 0,
      plantsMatured: 0,
      votdChecked: 0,
      votdSent: 0,
      gamesChecked: 0,
      gamesSent: 0,
    };

    // 2. Check Garden Plants
    let plantsQuery = supabase
      .from('garden_plants')
      .select('id, user_id, flower_type, planted_at')
      .eq('status', 'planted');

    if (targetUserId) {
      plantsQuery = plantsQuery.eq('user_id', targetUserId);
    }

    const { data: plants, error: plantsError } = await plantsQuery;

    if (plantsError) {
      console.error('Error fetching garden plants in cron:', plantsError);
    } else if (plants) {
      reports.plantsChecked = plants.length;
      for (const plant of plants) {
        const flower = FLOWERS[plant.flower_type as FlowerType];
        if (!flower) continue;

        const plantedTime = new Date(plant.planted_at).getTime();
        const growthTime = flower.growthTimeMs;
        const readyTime = plantedTime + growthTime;

        if (now.getTime() >= readyTime) {
          // Check if notification already exists for this plant
          const { data: existing } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', plant.user_id)
            .eq('type', 'plant_ready')
            .eq('resource_id', plant.id)
            .maybeSingle();

          if (!existing) {
            const { error: insertErr } = await supabase.from('notifications').insert({
              user_id: plant.user_id,
              actor_id: null,
              type: 'plant_ready',
              resource_id: plant.id,
              resource_type: 'garden_plant',
            });
            if (!insertErr) {
              reports.plantsMatured++;
            }
          }
        }
      }
    }

    // 3. Check Verse of the Day & Solo Minigames
    const usersToCheck: { id: string }[] = [];
    if (targetUserId) {
      usersToCheck.push({ id: targetUserId });
    } else if (isAdmin) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id');
      if (profiles && !profilesError) {
        usersToCheck.push(...profiles);
      }
    }

    for (const user of usersToCheck) {
      // --- Verse of the Day (24-hour limit) ---
      reports.votdChecked++;
      const { data: lastVotd } = await supabase
        .from('notifications')
        .select('created_at')
        .eq('user_id', user.id)
        .eq('type', 'verse_of_the_day')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const shouldSendVotd =
        !lastVotd ||
        now.getTime() - new Date(lastVotd.created_at).getTime() >= 24 * 60 * 60 * 1000;

      if (shouldSendVotd) {
        const { error: insertErr } = await supabase.from('notifications').insert({
          user_id: user.id,
          actor_id: null,
          type: 'verse_of_the_day',
          resource_id: null,
          resource_type: null,
        });
        if (!insertErr) {
          reports.votdSent++;
        }
      }

      // --- Solo Minigames (48-hour limit) ---
      reports.gamesChecked++;
      const { data: lastGame } = await supabase
        .from('notifications')
        .select('created_at')
        .eq('user_id', user.id)
        .eq('type', 'solo_minigame')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const shouldSendGame =
        !lastGame ||
        now.getTime() - new Date(lastGame.created_at).getTime() >= 48 * 60 * 60 * 1000;

      if (shouldSendGame) {
        const { error: insertErr } = await supabase.from('notifications').insert({
          user_id: user.id,
          actor_id: null,
          type: 'solo_minigame',
          resource_id: null,
          resource_type: null,
        });
        if (!insertErr) {
          reports.gamesSent++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      reports,
    });
  } catch (err: any) {
    console.error('Notification cron error:', err);
    return NextResponse.json({ error: 'Internal server error', details: err?.message }, { status: 500 });
  }
}
