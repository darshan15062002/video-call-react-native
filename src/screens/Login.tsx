import {useEffect, useState} from 'react';
import {useUser} from '../hook/useUser';
import {loadUser, login} from '../hook/api';
import notifee, {AndroidImportance, EventType} from '@notifee/react-native';

import {
  ActivityIndicator,
  Linking,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LoginForm from '../components/LoginForm';
import {StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import messaging from '@react-native-firebase/messaging';

function Login({navigation}: any): React.JSX.Element {
  const {user, loading: userLoading, userList, refetch} = useUser();
  const [phone, setPhone] = useState<string>();
  const [password, setPassword] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [me, setMe] = useState({});

  const handleLogin = async () => {
    const res = await login(phone, password);
    refetch();
  };

  useEffect(() => {
    // Listen for notification actions

    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log(
        'Notification caused app to open from background state:',
        remoteMessage,
      );

      // Navigate to the VideoCallScreen or any other screen with parameters
      if (remoteMessage.data && remoteMessage.data.type === 'call') {
        const phone = remoteMessage.data.phone;
        const roomId = remoteMessage.data.roomId;
        const url = `myapp://video-call/${phone}/${roomId}`;

        Linking.openURL(url).catch(err =>
          console.error('Failed to open URL:', err),
        );
      }
    });

    const unsubscribe = notifee.onForegroundEvent(async ({type, detail}) => {
      if (type === EventType.ACTION_PRESS) {
        if (detail.pressAction.id === 'answer') {
          // Handle answer logic
          console.log('User answered the call');
          const userData = await loadUser();
          console.log(userData?.user?.phone, userData?.user?.code);

          if (userData?.user) {
            handleMakeConnection(
              userData?.user?.name,
              userData?.user?.code,
              true,
            );
          }
        } else if (detail.pressAction.id === 'decline') {
          // Handle decline logic
          console.log('User declined the call');
        }
      }
    });

    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log(
            'Notification caused app to open from quit state:',
            remoteMessage,
          );

          // Handle the navigation for deep linking
          if (remoteMessage.data && remoteMessage.data.type === 'call') {
            const phone = remoteMessage.data.phone;
            const roomId = remoteMessage.data.roomId;
            const url = `myapp://video-call/${phone}/${roomId}`;

            Linking.openURL(url).catch(err =>
              console.error('Failed to open URL:', err),
            );
          }
        }
      });

    return () => unsubscribe();
  }, []);

  const handleMakeConnection = (
    email: string,
    roomId: string,
    self: boolean,
  ) => {
    // Implement your call connection logic here
    console.log(`Initiating call to ${email} in room ${roomId}`);
    navigation.navigate('VideoCall', {email, roomId, self});
  };

  if (userLoading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color="black" />
      </View>
    );
  }
  return (
    <SafeAreaView
      style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      {!user ? (
        // Show login form if not logged in
        <LoginForm
          phone={phone}
          setPhone={setPhone}
          password={password}
          setPassword={setPassword}
          handleLogin={handleLogin}
          styles={styles}
        />
      ) : (
        // Show user list if logged in
        <View
          style={{
            flex: 1,
          }}>
          <Text style={{fontSize: 20, marginBottom: 20, color: 'black'}}>
            Welcome, {user.name}! Select a user to call:
          </Text>

          {userList.length > 0 ? (
            userList.map(item => (
              <View
                style={{
                  borderWidth: 1,
                  borderColor: 'gray',
                  borderRadius: 10,
                  marginHorizontal: 10,
                  alignItems: 'center',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                }}
                key={item.phone}>
                <Text style={{color: 'black'}}>{item.name}</Text>
                <TouchableOpacity
                  onPress={() =>
                    handleMakeConnection(user.phone, item.code, false)
                  }
                  style={{
                    backgroundColor: 'green',
                    borderRadius: 50,
                    paddingVertical: 10,
                    paddingHorizontal: 15,
                  }}>
                  <Icon name="phone" size={30} color="white" />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={{color: 'black'}}>No users available to call.</Text>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

export default Login;

const styles = StyleSheet.create({
  inputContainer: {
    padding: 20,
  },
  input: {
    height: 50,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
    width: '70%',
    paddingHorizontal: 10,
    color: 'black',
  },
});
