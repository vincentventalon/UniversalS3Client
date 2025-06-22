import React, { useState, useEffect } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { TextInput, Button, Text, Card, HelperText } from 'react-native-paper';
import { verifyPassword, isPasswordConfigured } from '../services/secureStorage';
import { confirmAndResetApp } from '../services/appReset';

interface PasswordFormProps {
  onPasswordSuccess: (password: string) => void;
}

function PasswordForm({ onPasswordSuccess }: PasswordFormProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);

  // Check if a password is already configured
  useEffect(() => {
    async function checkExistingPassword() {
      try {
        setChecking(true);
        const hasPassword = await isPasswordConfigured();
        setIsFirstTime(!hasPassword);
      } catch (err) {
        console.error('Error checking password configuration:', err);
        Alert.alert(
          'Setup Error',
          'Could not check password configuration. Please restart the app.'
        );
      } finally {
        setChecking(false);
      }
    }
    
    checkExistingPassword();
  }, []);

  async function handleSubmit() {
    if (!password.trim()) {
      setError('Password cannot be empty');
      return;
    }

    // For first-time setup, check that passwords match
    if (isFirstTime) {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
    }

    try {
      setIsVerifying(true);
      setError('');
      
      const isValid = await verifyPassword(password);
      
      if (isValid) {
        onPasswordSuccess(password);
      } else {
        if (isFirstTime) {
          setError('Failed to set password. Please try using a simpler password without special characters.');
        } else {
          setError('Invalid password. Please try again.');
        }
      }
    } catch (err) {
      console.error('Password verification error:', err);
      setError('Failed to verify password. Please try again with a different password.');
    } finally {
      setIsVerifying(false);
    }
  }

  // For first-time users, provide a system reset option
  function handleResetSystem() {
    confirmAndResetApp(() => {
      setIsFirstTime(true);
      setPassword('');
      setConfirmPassword('');
      setError('');
    });
  }

  if (checking) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Initializing app...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>Universal S3 Client</Text>
          <Text style={styles.subtitle}>
            {isFirstTime ? 'Create a master password' : 'Enter your master password'}
          </Text>
          
          <TextInput
            mode="outlined"
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder={isFirstTime ? "Create a new password" : "Enter your password"}
          />
          
          {isFirstTime && (
            <TextInput
              mode="outlined"
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Confirm your new password"
            />
          )}
          
          {error ? <HelperText type="error">{error}</HelperText> : null}
          
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={isVerifying}
            disabled={isVerifying}
            style={styles.button}
          >
            {isFirstTime ? 'Set Password' : 'Unlock'}
          </Button>
          
          {isFirstTime ? (
            <Text style={styles.hint}>
              Create a simple password without special characters.
              This password will encrypt your S3 provider credentials.
              Make sure to remember it!
            </Text>
          ) : (
            <Text style={styles.hint}>
              If you've forgotten your password or are having issues logging in,
              you can reset the app to start fresh.
            </Text>
          )}
          
          {!isFirstTime && (
            <Button
              mode="text"
              onPress={handleResetSystem}
              style={styles.resetButton}
            >
              Reset App
            </Button>
          )}
        </Card.Content>
      </Card>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    borderRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.7,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    marginBottom: 16,
  },
  errorText: {
    color: 'red',
    marginBottom: 8,
  },
  hint: {
    textAlign: 'center',
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 16,
  },
  resetButton: {
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
});

export default PasswordForm; 