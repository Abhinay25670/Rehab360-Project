// Simple Expo push helper (you can call this from scheduled jobs later)
// Docs: https://docs.expo.dev/push-notifications/sending-notifications/

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

exports.sendExpoPushNotification = async ({ expoPushToken, title, body, data }) => {
  if (!expoPushToken) {
    throw new Error('Missing Expo push token');
  }

  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data: data || {},
  };

  const res = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.errors?.[0]?.message || 'Failed to send Expo push notification');
  }

  return json;
};

