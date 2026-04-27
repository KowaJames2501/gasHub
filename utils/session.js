import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { getItem} from '../utils/storage';
import { triggerLocalNotification } from '../utils/notifications';

const SessionGuard = ({ children }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      const token = await getItem('token');
      if (!token) {
       triggerLocalNotification(`Access Denied!`,`Authenthication required. Please log in to continue.`);
        router.push('/login'); return;
      } else {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#4f46e5"/>
      </View>
    );
  }

  return children;
};

export default SessionGuard;



