import React from 'react';
import { StyleSheet, View, ScrollView, Linking, Alert } from 'react-native';
import { Text, Button, Appbar, Card, Divider } from 'react-native-paper';

interface SettingsProps {
  onBack: () => void;
  appVersion: string;
}

export default function Settings({ onBack, appVersion }: SettingsProps) {
  const handleOpenURL = (url: string, serviceName: string) => {
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert(
            'Unable to open link',
            `Could not open ${serviceName}. Please visit manually.`,
            [{ text: 'OK' }]
          );
        }
      })
      .catch((err) => {
        console.error(`Error opening ${serviceName} link:`, err);
        Alert.alert(
          'Error',
          `Failed to open ${serviceName} link.`,
          [{ text: 'OK' }]
        );
      });
  };

  const handleGitHubPress = () => {
    handleOpenURL('https://github.com/vincentventalon/UniversalS3Client', 'GitHub');
  };

  const handleTwitterPress = () => {
    handleOpenURL('https://x.com/10x_indie?s=21', 'Twitter');
  };

  const handleReviewPress = () => {
    Alert.alert(
      'Leave a Review ⭐',
      'Your 5-star review would help me. Would you like to leave a review on the App Store/Play Store?',
      [
        { text: 'Maybe Later', style: 'cancel' },
        { text: 'Leave Review ⭐', onPress: () => {
          Alert.alert('Thank You! 🙏', 'Please search for "Universal S3 Client" in your app store to leave a review.');
        }}
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content title="Settings" />
        <Appbar.Action 
          icon="check" 
          onPress={onBack}
          accessibilityLabel="Done"
        />
      </Appbar.Header>
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About the Developer</Text>
          <Text style={styles.description}>
            Hi, I'm Vincent! I built this app to help developers and power users manage their S3 storage efficiently. 
            This is a passion project that I maintain in my free time.
          </Text>
          
          <Button
            mode="outlined"
            onPress={handleTwitterPress}
            style={styles.button}
            contentStyle={styles.buttonContent}
            icon="twitter"
          >
            Follow me on Twitter/X
          </Button>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>🎉 Free & Open Source</Text>
            <Text style={styles.description}>
              This app is completely free and open source! No ads, no tracking, no premium features. 
              I believe in creating useful tools for the developer community.
            </Text>
            <Button
              mode="contained"
              onPress={handleReviewPress}
              style={styles.primaryButton}
              contentStyle={styles.buttonContent}
              icon="star"
            >
              Leave a 5⭐ Review - It helps a lot!
            </Button>
          </Card.Content>
        </Card>

        <Divider style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Source Code & Feedback</Text>
          <Button
            mode="contained"
            onPress={handleGitHubPress}
            style={styles.githubButton}
            contentStyle={styles.buttonContent}
            icon="github"
          >
            View Source Code on GitHub
          </Button>
          
          <Text style={styles.contributionText}>
            Found a bug or have a feature request? Open an issue on GitHub. Pull requests are welcome!
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
  header: {
    height: 56, // Reduced from default ~64px to 56px
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    padding: 16,
  },
  card: {
    marginBottom: 24,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2E7D32',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: '#FF6B35',
  },
  buttonContent: {
    paddingVertical: 8,
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
  button: {
    marginBottom: 8,
  },
  divider: {
    marginVertical: 16,
  },
  githubButton: {
    marginBottom: 16,
    backgroundColor: '#24292e',
  },
  contributionText: {
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