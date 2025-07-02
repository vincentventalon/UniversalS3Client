import React from 'react';
import { StyleSheet, View, ScrollView, Linking, Alert } from 'react-native';
import { Text, Button, Appbar, Card, Divider } from 'react-native-paper';

interface SettingsProps {
  onBack: () => void;
  appVersion: string;
}

export default function Settings({ onBack, appVersion }: SettingsProps) {
  const handleGitHubPress = () => {
    const gitHubURL = 'https://github.com/vincentventalon/UniversalS3Client';
    
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

  const handleTwitterPress = () => {
    const twitterURL = 'https://x.com/10x_indie?s=21';
    
    Linking.canOpenURL(twitterURL)
      .then((supported) => {
        if (supported) {
          Linking.openURL(twitterURL);
        } else {
          Alert.alert(
            'Unable to open link',
            'Could not open Twitter. Please visit the profile manually.',
            [{ text: 'OK' }]
          );
        }
      })
      .catch((err) => {
        console.error('Error opening Twitter link:', err);
        Alert.alert(
          'Error',
          'Failed to open Twitter link.',
          [{ text: 'OK' }]
        );
      });
  };

  const handleReviewPress = () => {
    Alert.alert(
      'Leave a Review ⭐',
      'Thank you for using Universal S3 Client! Your 5-star review would help me a lot as an indie developer. Would you like to leave a review on the App Store/Play Store?',
      [
        { text: 'Maybe Later', style: 'cancel' },
        { text: 'Leave Review ⭐', onPress: () => {
          // This would typically open the app store review page
          // For now, we'll show a thank you message
          Alert.alert('Thank You! 🙏', 'Thank you for your support! Please search for "Universal S3 Client" in your app store to leave a review.');
        }}
      ]
    );
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
        <Card style={styles.openSourceCard}>
          <Card.Content>
            <Text style={styles.openSourceTitle}>🎉 Free & Open Source</Text>
            <Text style={styles.openSourceDescription}>
              This app is completely free and open source! No ads, no tracking, no premium features. 
              Your support through reviews helps me continue developing useful tools for the community.
            </Text>
            <Button
              mode="contained"
              onPress={handleReviewPress}
              style={styles.reviewButton}
              contentStyle={styles.reviewButtonContent}
              labelStyle={styles.reviewButtonLabel}
              icon="star"
            >
              Leave a 5⭐ Review - It helps a lot!
            </Button>
          </Card.Content>
        </Card>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About the Developer</Text>
          <Text style={styles.aboutText}>
            I'm Vincent Ventalon, an indie hacker building useful tools for developers and power users.
          </Text>
          
          <Button
            mode="outlined"
            onPress={handleTwitterPress}
            style={styles.socialButton}
            contentStyle={styles.socialButtonContent}
            icon="twitter"
          >
            Follow me on Twitter/X
          </Button>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Source Code & Feedback</Text>
          <Button
            mode="contained"
            onPress={handleGitHubPress}
            style={styles.githubButton}
            contentStyle={styles.githubButtonContent}
            labelStyle={styles.githubButtonLabel}
            icon="github"
          >
            View Source Code on GitHub
          </Button>
          
          <Text style={styles.contributionText}>
            Found a bug or have a feature request? The easiest way to contribute 
            or report something is to open an issue on GitHub. Pull requests are welcome!
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
  openSourceCard: {
    marginBottom: 24,
    elevation: 2,
  },
  openSourceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2E7D32',
    textAlign: 'center',
  },
  openSourceDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  reviewButton: {
    marginTop: 8,
    backgroundColor: '#FF6B35',
  },
  reviewButtonContent: {
    paddingVertical: 8,
  },
  reviewButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
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
    marginBottom: 16,
  },
  socialButton: {
    marginBottom: 8,
  },
  socialButtonContent: {
    paddingVertical: 8,
  },
  divider: {
    marginVertical: 16,
  },
  githubButton: {
    marginBottom: 16,
    backgroundColor: '#24292e',
  },
  githubButtonContent: {
    paddingVertical: 8,
  },
  githubButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
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