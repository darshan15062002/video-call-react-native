import React, {useEffect} from 'react';
import {NavigationContainer, useNavigation} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {UserProvider} from './src/hook/useUser';
import Login from './src/screens/Login';
import VideoCallScreen from './src/screens/VideoCallScreen';
import RemoteNotification from './src/remoteNotification/RemoteNotification';
import notifee, {AndroidImportance} from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';

const Stack = createStackNavigator();

function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName={'Login'}>
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen
        name="VideoCall"
        component={VideoCallScreen}
        // Ensure email and roomId are passed as route params
        initialParams={{email: '', roomId: ''}}
      />
    </Stack.Navigator>
  );
}

const linking = {
  prefixes: ['videocall://'],
  config: {
    screens: {
      VideoCall: 'video-call/:email/:roomId',
    },
  },
};

function App(): React.JSX.Element {
  useEffect(() => {
    async function createChannel() {
      await notifee.createChannel({
        id: 'call',
        name: 'Incoming Call Channel',
        sound: 'ringtone', // Ensure ringtone is placed in 'res/raw' for Android
        importance: AndroidImportance.HIGH,
      });
    }
    createChannel();
  }, []);

  useEffect(() => {
    async function requestPermission() {
      await notifee.requestPermission();
    }
    requestPermission();
  }, []);

  return (
    <UserProvider>
      <RemoteNotification />
      <NavigationContainer linking={linking}>
        <AppNavigator />
      </NavigationContainer>
    </UserProvider>
  );
}

export default App;
