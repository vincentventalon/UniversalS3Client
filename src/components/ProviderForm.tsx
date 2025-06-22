import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, FlatList } from 'react-native';
import { TextInput, Button, Text, Card, Divider, HelperText, RadioButton, Menu, List, Icon } from 'react-native-paper';
import { S3Provider } from '../types';
import { generateId } from '../utils/idGenerator';

interface ProviderFormProps {
  bucketName: string;
  setBucketName: (v: string) => void;
  type: 'aws' | 'hetzner';
  setType: (v: 'aws' | 'hetzner') => void;
  region: string;
  setRegion: (v: string) => void;
  accessKey: string;
  setAccessKey: (v: string) => void;
  secretKey: string;
  setSecretKey: (v: string) => void;
  hetznerLocation: string;
  setHetznerLocation: (v: string) => void;
  onSubmit: () => void;
}

function ProviderForm({
  bucketName,
  setBucketName,
  type,
  setType,
  region,
  setRegion,
  accessKey,
  setAccessKey,
  secretKey,
  setSecretKey,
  hetznerLocation,
  setHetznerLocation,
  onSubmit
}: ProviderFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [errors, setErrors] = useState({
    bucketName: '',
    region: '',
    accessKey: '',
    secretKey: '',
  });
  const [typeMenuVisible, setTypeMenuVisible] = useState(false);
  const [locationMenuVisible, setLocationMenuVisible] = useState(false);
  const [customRegion, setCustomRegion] = useState('');
  const [showCustomRegion, setShowCustomRegion] = useState(false);
  const [regionMenuVisible, setRegionMenuVisible] = useState(false);
  const awsRegions = [
    { value: 'us-east-1', label: 'us-east-1 (N. Virginia)' },
    { value: 'us-east-2', label: 'us-east-2 (Ohio)' },
    { value: 'us-west-1', label: 'us-west-1 (N. California)' },
    { value: 'us-west-2', label: 'us-west-2 (Oregon)' },
    { value: 'af-south-1', label: 'af-south-1 (Cape Town)' },
    { value: 'ap-east-1', label: 'ap-east-1 (Hong Kong)' },
    { value: 'ap-south-2', label: 'ap-south-2 (Hyderabad)' },
    { value: 'ap-southeast-3', label: 'ap-southeast-3 (Jakarta)' },
    { value: 'ap-southeast-5', label: 'ap-southeast-5 (Kuala Lumpur)' },
    { value: 'ap-southeast-4', label: 'ap-southeast-4 (Melbourne)' },
    { value: 'ap-south-1', label: 'ap-south-1 (Mumbai)' },
    { value: 'ap-northeast-3', label: 'ap-northeast-3 (Osaka)' },
    { value: 'ap-northeast-2', label: 'ap-northeast-2 (Seoul)' },
    { value: 'ap-southeast-1', label: 'ap-southeast-1 (Singapore)' },
    { value: 'ap-southeast-2', label: 'ap-southeast-2 (Sydney)' },
    { value: 'ap-northeast-1', label: 'ap-northeast-1 (Tokyo)' },
    { value: 'ca-central-1', label: 'ca-central-1 (Central Canada)' },
    { value: 'ca-west-1', label: 'ca-west-1 (Calgary)' },
    { value: 'eu-central-1', label: 'eu-central-1 (Frankfurt)' },
    { value: 'eu-west-1', label: 'eu-west-1 (Ireland)' },
    { value: 'eu-west-2', label: 'eu-west-2 (London)' },
    { value: 'eu-south-1', label: 'eu-south-1 (Milan)' },
    { value: 'eu-west-3', label: 'eu-west-3 (Paris)' },
    { value: 'eu-south-2', label: 'eu-south-2 (Spain)' },
    { value: 'eu-north-1', label: 'eu-north-1 (Stockholm)' },
    { value: 'eu-central-2', label: 'eu-central-2 (Zurich)' },
    { value: 'il-central-1', label: 'il-central-1 (Tel Aviv)' },
    { value: 'me-south-1', label: 'me-south-1 (Bahrain)' },
    { value: 'me-central-1', label: 'me-central-1 (UAE)' },
    { value: 'mx-central-1', label: 'mx-central-1 (Mexico City)' },
    { value: 'sa-east-1', label: 'sa-east-1 (São Paulo)' },
    { value: 'us-gov-east-1', label: 'us-gov-east-1 (GovCloud US-East)' },
    { value: 'us-gov-west-1', label: 'us-gov-west-1 (GovCloud US-West)' },
  ];

  function validateForm() {
    let isValid = true;
    const newErrors = {
      bucketName: '',
      region: '',
      accessKey: '',
      secretKey: '',
    };

    if (!bucketName.trim()) {
      newErrors.bucketName = 'Bucket name is required';
      isValid = false;
    }

    if (type === 'aws' && !region.trim()) {
      newErrors.region = 'Region is required for AWS';
      isValid = false;
    }

    if (!accessKey.trim()) {
      newErrors.accessKey = 'Access key is required';
      isValid = false;
    }

    if (!secretKey.trim()) {
      newErrors.secretKey = 'Secret key is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  }
  
  // Generate endpoint based on provider type and settings
  function generateEndpoint(): string {
    if (type === 'aws') {
      return `https://s3.${region || 'us-east-1'}.amazonaws.com`;
    } else if (type === 'hetzner') {
      return `https://${hetznerLocation}.your-objectstorage.com`;
    }
    return '';
  }

  function handleSubmit() {
    if (!validateForm()) {
      return;
    }
    setIsSubmitting(true);
    onSubmit();
    setIsSubmitting(false);
  }

  return (
    <Card style={styles.card}>
      <Card.Title title="Add Bucket" />
      <Divider />
      <Card.Content>
        <ScrollView style={styles.scrollView}>
          <TextInput
            mode="outlined"
            label="Bucket Name"
            value={bucketName}
            onChangeText={setBucketName}
            style={styles.input}
            error={!!errors.bucketName}
            placeholder="my-bucket-name"
          />
          {errors.bucketName ? <HelperText type="error">{errors.bucketName}</HelperText> : null}

          <Text style={styles.sectionLabel}>Type de stockage</Text>
          <Menu
            visible={typeMenuVisible}
            onDismiss={() => setTypeMenuVisible(false)}
            anchor={
              <Button mode="outlined" onPress={() => setTypeMenuVisible(true)} style={styles.dropdownButton} contentStyle={styles.dropdownContent} icon="chevron-down">
                {type === 'aws' ? 'AWS S3' : 'Hetzner Storage Box'}
              </Button>
            }
          >
            <Menu.Item onPress={() => { setType('aws'); setTypeMenuVisible(false); }} title="AWS S3" />
            <Menu.Item onPress={() => { setType('hetzner'); setTypeMenuVisible(false); }} title="Hetzner Storage Box" />
          </Menu>

          {type === 'aws' ? (
            <>
              <Text style={styles.sectionLabel}>Région AWS</Text>
              <Menu
                visible={regionMenuVisible}
                onDismiss={() => setRegionMenuVisible(false)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setRegionMenuVisible(true)}
                    contentStyle={{ justifyContent: 'space-between' }}
                    style={styles.menuButton}
                    icon="chevron-down"
                  >
                    {awsRegions.find(r => r.value === region)?.label || 'Sélectionner une région'}
                  </Button>
                }
                style={{ maxHeight: 320 }}
              >
                <FlatList
                  data={awsRegions}
                  keyExtractor={item => item.value}
                  style={{ maxHeight: 300 }}
                  renderItem={({ item }) => (
                    <Menu.Item
                      onPress={() => {
                        setRegion(item.value);
                        setRegionMenuVisible(false);
                      }}
                      title={item.label}
                    />
                  )}
                />
              </Menu>
              {showCustomRegion && (
                <TextInput
                  mode="outlined"
                  label="Région personnalisée"
                  value={region}
                  onChangeText={setRegion}
                  style={styles.input}
                  error={!!errors.region}
                  placeholder="us-east-1"
                />
              )}
              {errors.region ? <HelperText type="error">{errors.region}</HelperText> : null}
            </>
          ) : (
            <>
              <Text style={styles.sectionLabel}>Hetzner Location</Text>
              <Menu
                visible={locationMenuVisible}
                onDismiss={() => setLocationMenuVisible(false)}
                anchor={
                  <Button mode="outlined" onPress={() => setLocationMenuVisible(true)} style={styles.dropdownButton} contentStyle={styles.dropdownContent} icon="chevron-down">
                    {hetznerLocation === 'fsn1' ? 'Falkenstein (fsn1)' : hetznerLocation === 'nbg1' ? 'Nuremberg (nbg1)' : 'Helsinki (hel1)'}
                  </Button>
                }
              >
                <Menu.Item onPress={() => { setHetznerLocation('fsn1'); setLocationMenuVisible(false); }} title="Falkenstein (fsn1)" />
                <Menu.Item onPress={() => { setHetznerLocation('nbg1'); setLocationMenuVisible(false); }} title="Nuremberg (nbg1)" />
                <Menu.Item onPress={() => { setHetznerLocation('hel1'); setLocationMenuVisible(false); }} title="Helsinki (hel1)" />
              </Menu>
            </>
          )}

          <TextInput
            mode="outlined"
            label="Access Key"
            value={accessKey}
            onChangeText={setAccessKey}
            style={styles.input}
            error={!!errors.accessKey}
            autoCapitalize="none"
          />
          {errors.accessKey ? <HelperText type="error">{errors.accessKey}</HelperText> : null}

          <TextInput
            mode="outlined"
            label="Secret Key"
            value={secretKey}
            onChangeText={setSecretKey}
            style={styles.input}
            secureTextEntry={!showSecret}
            error={!!errors.secretKey}
            autoCapitalize="none"
            right={<TextInput.Icon icon={showSecret ? 'eye-off' : 'eye'} onPress={() => setShowSecret(v => !v)} />}
          />
          {errors.secretKey ? <HelperText type="error">{errors.secretKey}</HelperText> : null}
          
          <Text style={styles.endpointPreview}>
            Endpoint: {generateEndpoint()}
          </Text>
          
          {type === 'hetzner' && (
            <Text style={styles.endpointPreview}>
              Bucket URL: https://{bucketName.toLowerCase() || 'your-bucket-name'}.{hetznerLocation}.your-objectstorage.com/
            </Text>
          )}
          
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
            style={styles.button}
          >
            Add Bucket
          </Button>
        </ScrollView>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  scrollView: {
    maxHeight: 500,
  },
  input: {
    marginTop: 8,
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 8,
  },
  dropdownButton: {
    marginTop: 8,
    marginBottom: 4,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  dropdownContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  endpointPreview: {
    marginTop: 12,
    marginBottom: 4,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  button: {
    marginTop: 16,
    marginBottom: 8,
  },
  menuButton: {
    marginTop: 8,
    marginBottom: 4,
    justifyContent: 'space-between',
  },
});

export default ProviderForm; 