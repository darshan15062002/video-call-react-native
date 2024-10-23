import React from 'react';
import {StyleSheet} from 'react-native';
import {TextInput, Button, View} from 'react-native';

interface LoginFormProps {
  phone: string;
  password: string;
  setPhone: (value: string) => void;
  setPassword: (value: string) => void;
  handleLogin: () => void;
  styles: any;
}

const LoginForm: React.FC<LoginFormProps> = ({
  phone,
  password,
  setPhone,
  setPassword,
  handleLogin,
  styles,
}) => {
  return (
    <View
      style={{
        width: '100%',
        position: 'absolute',
        bottom: 40,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <TextInput
        style={styles.input}
        placeholder="Enter your Phone no"
        placeholderTextColor="#888"
        onChangeText={setPhone}
        value={phone}
      />
      <TextInput
        style={styles.input}
        placeholder="Enter password"
        placeholderTextColor="#888"
        onChangeText={setPassword}
        value={password}
        secureTextEntry
      />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
};

export default LoginForm;
