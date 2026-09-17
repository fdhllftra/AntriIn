import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography } from '../../constants';

export const LoginScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={Typography.h1}>AntriIn</Text>
      <Text>Login screen coming soon</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});