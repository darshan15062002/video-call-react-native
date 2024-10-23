import {useEffect, useRef, useState} from 'react';
import {
  mediaDevices,
  MediaStream,
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
} from 'react-native-webrtc';
import {io, Socket} from 'socket.io-client';

import {SafeAreaView} from 'react-native';
import VideoStreamView from '../components/VideoStreamView';
import CallControls from '../components/CallControls';

const VideoCallScreen = ({route, navigation}: any) => {
  const {email, roomId, self} = route.params;
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomJoin, setRoomJoin] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [remoteEmailId, setRemoteEmailId] = useState<String>();
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [EventMessage, setEventMessage] = useState<String>('');
  const [localMicOn, setlocalMicOn] = useState(true);
  const [localWebcamOn, setlocalWebcamOn] = useState(true);

  const peerConnection = useRef<RTCPeerConnection | null>(null);

  // create socket connection and emit with email and code
  const handleMakeConnection = (
    email: string,
    roomId: string,
    self: boolean = true,
  ) => {
    try {
      let _socket = socket;
      if (!_socket) {
        _socket = io('https://ice-server-socket.onrender.com');
        // const _socket = io('http://10.0.2.2:8000');
        // _socket.emit('set-status', {code});
        setSocket(_socket);
      }

      if (_socket) {
        // const roomId = generateRandomString(10);
        // const email = user${generateRandomString(5)}@example.com;

        setEventMessage('Connecting...');

        _socket.emit('join_room', {room_id: roomId, email_id: email, self});
      } else {
        // console.log('socket not present');
      }
    } catch (error) {
      // console.log(error);
    }
  };

  // --------------------------------------------------------------------------------
  // when there is new user with same code on server this even trigger
  // we create offer and send buy socket newly arrived user
  const createOffer = async () => {
    if (!peerConnection.current) return;
    try {
      const offer = await peerConnection.current.createOffer({});
      await peerConnection.current.setLocalDescription(offer);

      return offer;
    } catch (error) {
      console.error('Error creating offer:', error);
      // Handle error appropriately
    }
  };

  const handleNewUserJoin = async ({email_id}: any) => {
    if (socket) {
      const offer = await createOffer();
      console.log('new USer Arrive ');
      socket.emit('call_user', {email_id, offer});
      setRemoteEmailId(email_id);
    }
  };
  // --------------------------------------------------------------------------------------

  // --------------------------------------------------------------------------------------
  // when  newly arrive user receive offer he create ans
  // and send back to user who start calling
  const createAns = async (offer: any) => {
    if (!peerConnection.current) return;
    try {
      // console.log('offer recived to peer', offer);
      const offerDescription = new RTCSessionDescription(offer);
      await peerConnection.current.setRemoteDescription(offerDescription);
      const answerDescription = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answerDescription);

      return answerDescription;
    } catch (error) {
      console.error('Error creating ans:', error);
    }
  };
  const handleIncommingCall = async (data: any) => {
    if (socket) {
      const {fromEmail, offer} = data;
      const ans = await createAns(offer);

      socket.emit('call_accepted', {email_id: fromEmail, ans});
      setRemoteEmailId(fromEmail);
    }
  };
  // --------------------------------------------------------------------------------------

  // --------------------------------------------------------------------------------------
  // when call accepted user Receive the ans of offer
  // set to there remote description
  const handleCallAccepted = async ({ans}: any) => {
    if (peerConnection.current) {
      try {
        const answerDescription = new RTCSessionDescription(ans);
        await peerConnection.current.setRemoteDescription(answerDescription);
      } catch (error) {
        console.error('Error setting setRemoteDescription:', error);
      }
    }
  };
  // --------------------------------------------------------------------------------------

  // --------------------------------------------------------------------------------------
  // when user get connected  with socket by  code and email
  // we get joined_room Event
  // than we start camera and set Room join
  useEffect(() => {
    if (socket) {
      const startStream = async () => {
        try {
          const _stream = await mediaDevices.getUserMedia({
            video: {
              facingMode: 'user',
            },
            audio: true,
          });

          setStream(_stream);

          // Add each track from the local stream to the peer connection
          _stream.getTracks().forEach(track => {
            peerConnection.current.addTrack(track, _stream);
          });

          // Set the stream to be shown locally in the RTCView
        } catch (error) {
          console.error('Error accessing media devices.', error);
        }
      };

      const handleRoomJoined = (data: RoomJoinedData) => {
        setRoomJoin(data.room_id);
        setEventMessage('');
        startStream();
      };

      socket.on('joined_room', handleRoomJoined);

      return () => {
        socket.off('joined_room', handleRoomJoined);
        socket.disconnect(); // Ensure proper disconnection
      };
    }
  }, [socket]);
  // --------------------------------------------------------------------------------------

  useEffect(() => {
    if (socket) {
      socket.on('user_joined', handleNewUserJoin);
      socket.on('incomming_call', handleIncommingCall);
      socket.on('call_accepted', handleCallAccepted);
      socket.on('ice_candidate', async ({candidate}) => {
        try {
          if (candidate) {
            await peerConnection.current.addIceCandidate(
              new RTCIceCandidate(candidate),
            );
          }
        } catch (error) {
          console.error('Error adding received ICE candidate', error);
        }
      });

      return () => {
        socket.off('user_joined', handleNewUserJoin);
        socket.off('incomming_call', handleIncommingCall);
        socket.off('call_accepted', handleCallAccepted);
        socket.on('ice_candidate', async ({candidate}) => {
          try {
            if (candidate) {
              await peerConnection.current.addIceCandidate(
                new RTCIceCandidate(candidate),
              );
            }
          } catch (error) {
            console.error('Error adding received ICE candidate', error);
          }
        });
      };
    }
  }, [socket]);

  useEffect(() => {
    if (socket && peerConnection.current) {
      peerConnection.current.onicecandidate = event => {
        if (event.candidate && remoteEmailId) {
          socket.emit('ice_candidate', {
            email_id: remoteEmailId,
            candidate: event.candidate,
          });
        }
      };

      peerConnection.current.ontrack = event => {
        const [remoteStream] = event.streams;

        if (remoteStream) {
          setRemoteStream(remoteStream);
        }
      };

      peerConnection.current.onconnectionstatechange = () => {
        const connectionState = peerConnection.current.connectionState;

        if (connectionState === 'connected') {
          console.log('Peers connected');
        } else if (
          connectionState === 'disconnected' ||
          connectionState === 'failed'
        ) {
          console.log('Connection failed or disconnected');
        }
      };
    }
  }, [socket, peerConnection, remoteEmailId]);

  useEffect(() => {
    peerConnection.current = new RTCPeerConnection({
      iceServers: [
        {
          urls: 'stun:stun.l.google.com:19302',
        },
        {
          urls: 'stun:stun1.l.google.com:19302',
        },
        {
          urls: 'stun:stun2.l.google.com:19302',
        },
      ],
    });

    const _socket = io('https://ice-server-socket.onrender.com');
    // const _socket = io('http://10.0.2.2:8000');
    // _socket.emit('set-status', {code});
    setSocket(_socket);
  }, []);

  const handleHagout = () => {
    if (peerConnection.current) {
      // peerConnection.current.close();
      setStream(null);
      setRemoteStream(null);
      setRoomJoin('');
    }
  };

  function toggleMic() {
    if (stream) {
      setlocalMicOn(prev => !prev);
      stream.getAudioTracks().forEach(track => {
        localMicOn ? (track.enabled = false) : (track.enabled = true);
      });
    }
  }

  // Switch Camera
  // function switchCamera() {
  //   localStream.getVideoTracks().forEach((track) => {
  //     track._switchCamera();
  //   });
  // }

  // Enable/Disable Camera
  function toggleCamera() {
    if (stream) {
      setlocalWebcamOn(prev => !prev);
      stream.getVideoTracks().forEach(track => {
        localWebcamOn ? (track.enabled = false) : (track.enabled = true);
      });
    }
  }

  function switchCamera() {
    if (stream) {
      stream.getVideoTracks().forEach(track => {
        track._switchCamera();
      });
    }
  }

  useEffect(() => {
    email && roomId && handleMakeConnection(email, roomId, self);
  }, [email, roomId, self]);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: 'black',
      }}>
      <VideoStreamView
        stream={stream}
        remoteStream={remoteStream}
        localWebcamOn={localWebcamOn}
      />

      {(remoteStream || stream) && (
        <CallControls
          localMicOn={localMicOn}
          localWebcamOn={localWebcamOn}
          toggleMic={toggleMic}
          toggleCamera={toggleCamera}
          handleHangout={handleHagout}
        />
      )}
    </SafeAreaView>
  );
};

export default VideoCallScreen;
