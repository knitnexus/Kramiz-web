
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { JWT } from 'https://esm.sh/google-auth-library@9';

// Setup Supabase Client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Setup Firebase Auth
const firebaseConfig = JSON.parse(Deno.env.get('FIREBASE_CONFIG')!);

async function getAccessToken() {
  const client = new JWT({
    email: firebaseConfig.client_email,
    key: firebaseConfig.private_key,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  const tokens = await client.authorize();
  return tokens.access_token;
}

Deno.serve(async (req) => {
  try {
    const accessToken = await getAccessToken();
    const today = new Date().toISOString().split('T')[0];
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const sevenDaysStr = sevenDaysFromNow.toISOString().split('T')[0];

    console.log(`Checking alerts for dates between ${today} and ${sevenDaysStr}`);

    // 1. Get Channels with nearing due dates
    const { data: channels, error: channelError } = await supabase
      .from('channels')
      .select('id, name, due_date, po_id')
      .neq('status', 'COMPLETED')
      .gte('due_date', today)
      .lte('due_date', sevenDaysStr);

    if (channelError) throw channelError;

    let totalAlertsSent = 0;

    for (const channel of channels) {
      // 2. Get members of this channel
      const { data: members } = await supabase
        .from('channel_members')
        .select('user_id')
        .eq('channel_id', channel.id);

      if (!members) continue;

      for (const member of members) {
        // 3. Check if we already alerted this user for THIS channel TODAY
        const { data: existingAlert } = await supabase
          .from('daily_due_alerts')
          .select('id')
          .eq('channel_id', channel.id)
          .eq('user_id', member.user_id)
          .eq('alert_date', today)
          .maybeSingle();

        if (existingAlert) continue;

        // 4. Get native push tokens for this user
        const { data: tokens } = await supabase
          .from('native_push_tokens')
          .select('token')
          .eq('user_id', member.user_id);

        if (!tokens || tokens.length === 0) continue;

        // 5. Build the message
        const daysLeft = Math.ceil((new Date(channel.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        const relativeTime = daysLeft === 0 ? "TODAY" : `in ${daysLeft} days`;
        
        const messageTitle = "⏰ Due Date Nearing!";
        const messageBody = `Order ${channel.name} is due ${relativeTime} (${channel.due_date}). Please check current status.`;

        // 6. Send to all user's devices
        for (const tokenItem of tokens) {
          const fcmResponse = await fetch(
            `https://fcm.googleapis.com/v1/projects/${firebaseConfig.project_id}/messages:send`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                message: {
                  token: tokenItem.token,
                  notification: {
                    title: messageTitle,
                    body: messageBody,
                  },
                  android: {
                    priority: "high",
                    notification: {
                      sound: "default",
                      channel_id: "default"
                    }
                  }
                },
              }),
            }
          );
          
          if (fcmResponse.ok) {
            console.log(`Alert sent to user ${member.user_id} for channel ${channel.id}`);
          }
        }

        // 7. Log the alert so we don't send it again today
        await supabase.from('daily_due_alerts').insert({
          channel_id: channel.id,
          user_id: member.user_id,
          alert_date: today
        });

        totalAlertsSent++;
      }
    }

    return new Response(JSON.stringify({ success: true, alerts_sent: totalAlertsSent }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error running daily alerts:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
