import React from 'react';
import { StyleSheet, View, ScrollView, Linking, Alert } from 'react-native';
import { Text, Button, Appbar } from 'react-native-paper';

interface SettingsProps {
  onBack: () => void;
  appVersion: string;
}

export default function Settings({ onBack, appVersion }: SettingsProps) {
  const handleGitHubPress = () => {
    const gitHubURL = 'https://github.com/vincent-ventalon/universal-s3-client/issues';
    
    Linking.canOpenURL(gitHubURL)
      .then((supported) => {
        if (supported) {
          Linking.openURL(gitHubURL);
        } else {
          Alert.alert(
            'Unable to open link',
            'Could not open GitHub. Please visit the repository manually.',
            [{ text: 'OK' }]
          );
        }
      })
      .catch((err) => {
        console.error('Error opening GitHub link:', err);
        Alert.alert(
          'Error',
          'Failed to open GitHub link.',
          [{ text: 'OK' }]
        );
      });
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Settings" />
        <Appbar.Action 
          icon="check" 
          onPress={onBack}
          accessibilityLabel="Done"
        />
      </Appbar.Header>
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>
            I'm Vincent Ventallon, an indie hacker. You can find me on Twitter.
          </Text>
        </View>

        <View style={styles.section}>
          <Button
            mode="contained"
            onPress={handleGitHubPress}
            style={styles.feedbackButton}
            contentStyle={styles.feedbackButtonContent}
            labelStyle={styles.feedbackButtonLabel}
          >
            Got an issue, feedback, or feature request? Click here!
          </Button>
          
          <Text style={styles.openSourceText}>
            The app is open source. The easiest way to contribute or report something is to open an issue on GitHub.
          </Text>
        </View>

        <View style={styles.spacer} />
        
        <Text style={styles.versionText}>v{appVersion}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    padding: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  aboutText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
  },
  feedbackButton: {
    marginBottom: 16,
    paddingVertical: 8,
  },
  feedbackButtonContent: {
    paddingVertical: 12,
  },
  feedbackButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  openSourceText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  spacer: {
    flex: 1,
    minHeight: 40,
  },
  versionText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 'auto',
    paddingBottom: 16,
  },
});