
import RNNotificationCall from 'react-native-full-screen-notification-incoming-call';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';




export const showIncomingCallNotification=async()=>{

    await notifee.displayNotification({
      title: 'Incoming Video Call',
      body: 'John Doe is calling...',
      android: {
        channelId: 'call',
        sound: 'ringtone',
        fullScreenAction: {
          id: 'default', // This ensures full-screen display on Android
        },
        importance: AndroidImportance.HIGH,
        actions: [
          { title: 'Answer', pressAction: { id: 'answer' } },
          { title: 'Decline', pressAction: { id: 'decline' } },
        ],
        ongoing: true
      },
      ios: {
        sound: 'ringtone.caf', // Ensure sound is added in iOS project
        categoryId: 'call', // Define call notification category
        actions: [
          { title: 'Answer', pressAction: { id: 'answer' }, input: false },
          { title: 'Decline', pressAction: { id: 'decline' }, input: false },
        ],
      },
    });

    
  

  // RNNotificationCall.displayNotification(
  //   '22221a97-8eb4-4ac2-b2cf-0a3c0b9100ad',
  //   null,
  //   30000,
  //   {
  //     channelId: 'com.abc.incomingcall',
  //     channelName: 'Incoming video call',
  //     notificationIcon: 'ic_launcher', //mipmap
  //     notificationTitle: 'Linh Vo',
  //     notificationBody: 'Incoming video call', 
  //     answerText: 'Answer',
  //     declineText: 'Decline',
  //     notificationColor: 'colorAccent',
  //     isVideo:true,
  //     notificationSound: "marimba_soft", //raw
  //     //mainComponent:'MyReactNativeApp',//AppRegistry.registerComponent('MyReactNativeApp', () => CustomIncomingCall);
  //     // payload:{name:'Test',Body:'test'}
  //   }
  // );
}






