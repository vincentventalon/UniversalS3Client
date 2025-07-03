import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, FlatList } from 'react-native';
import { TextInput, Button, Text, Card, Divider, HelperText, Menu, List, Icon } from 'react-native-paper';
import { S3Provider, S3ProviderType } from '../types';
import { generateId } from '../utils/idGenerator';
import { getProviderConfig, generateEndpoint, PROVIDER_CONFIGS } from '../config/providers';

interface ProviderFormProps {
  bucketName: string;
  setBucketName: (v: string) => void;
  type: S3ProviderType;
  setType: (v: S3ProviderType) => void;
  region: string;
  setRegion: (v: string) => void;
  accessKey: string;
  setAccessKey: (v: string) => void;
  secretKey: string;
  setSecretKey: (v: string) => void;
  accountId: string;
  setAccountId: (v: string) => void;
  namespace: string;
  setNamespace: (v: string) => void;
  locationHint: string;
  setLocationHint: (v: string) => void;
  clusterId: string;
  setClusterId: (v: string) => void;
  customEndpoint: string;
  setCustomEndpoint: (v: string) => void;
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
  accountId,
  setAccountId,
  namespace,
  setNamespace,
  locationHint,
  setLocationHint,
  clusterId,
  setClusterId,
  customEndpoint,
  setCustomEndpoint,
  onSubmit
}: ProviderFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [errors, setErrors] = useState({
    bucketName: '',
    region: '',
    accessKey: '',
    secretKey: '',
    accountId: '',
    namespace: '',
    clusterId: '',
    customEndpoint: '',
  });
  const [typeMenuVisible, setTypeMenuVisible] = useState(false);
  const [regionMenuVisible, setRegionMenuVisible] = useState(false);
  const [locationHintMenuVisible, setLocationHintMenuVisible] = useState(false);

  const currentConfig = getProviderConfig(type);

  // Reset additional fields when provider type changes
  useEffect(() => {
    setAccountId('');
    setNamespace('');
    setLocationHint('');
    setClusterId('');
    setCustomEndpoint('');
    setRegion('');
  }, [type]);

  function validateForm() {
    let isValid = true;
    const newErrors = {
      bucketName: '',
      region: '',
      accessKey: '',
      secretKey: '',
      accountId: '',
      namespace: '',
      clusterId: '',
      customEndpoint: '',
    };

    if (!bucketName.trim()) {
      newErrors.bucketName = 'Bucket name is required';
      isValid = false;
    }

    if (!region.trim() && type !== 'minio') {
      newErrors.region = 'Region is required';
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

    if (currentConfig.requiresAccountId && !accountId.trim()) {
      newErrors.accountId = 'Account ID is required for this provider';
      isValid = false;
    }

    if (currentConfig.requiresNamespace && !namespace.trim()) {
      newErrors.namespace = 'Namespace is required for this provider';
      isValid = false;
    }

    if (currentConfig.requiresClusterId && !clusterId.trim()) {
      newErrors.clusterId = 'Cluster ID is required for this provider';
      isValid = false;
    }

    if (type === 'minio' && !customEndpoint.trim()) {
      newErrors.customEndpoint = 'Custom endpoint is required for MinIO';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  }
  
  // Generate endpoint based on provider type and settings
  function getEndpointPreview(): string {
    try {
      return generateEndpoint(type, region, accountId, namespace, clusterId, customEndpoint);
    } catch {
      return 'Invalid configuration';
    }
  }

  function handleSubmit() {
    if (!validateForm()) {
      return;
    }
    setIsSubmitting(true);
    onSubmit();
    setIsSubmitting(false);
  }

  const providerTypes = Object.keys(PROVIDER_CONFIGS).map(key => PROVIDER_CONFIGS[key as S3ProviderType]);

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

          <Text style={styles.sectionLabel}>Storage Provider</Text>
          <Menu
            visible={typeMenuVisible}
            onDismiss={() => setTypeMenuVisible(false)}
            anchor={
              <Button 
                mode="outlined" 
                onPress={() => setTypeMenuVisible(true)} 
                style={styles.dropdownButton} 
                contentStyle={styles.dropdownContent} 
                icon="chevron-down"
              >
                {currentConfig.name}
              </Button>
            }
            style={{ maxHeight: 320 }}
          >
            <ScrollView style={{ maxHeight: 300 }}>
              {providerTypes.map((provider) => (
                <Menu.Item 
                  key={provider.type}
                  onPress={() => { 
                    setType(provider.type); 
                    setTypeMenuVisible(false); 
                  }} 
                  title={provider.name} 
                />
              ))}
            </ScrollView>
          </Menu>

          {/* Account ID field for Cloudflare R2 */}
          {currentConfig.requiresAccountId && (
            <>
              <TextInput
                mode="outlined"
                label="Account ID"
                value={accountId}
                onChangeText={setAccountId}
                style={styles.input}
                error={!!errors.accountId}
                placeholder="Your Cloudflare account ID"
                autoCapitalize="none"
              />
              {errors.accountId ? <HelperText type="error">{errors.accountId}</HelperText> : null}
            </>
          )}

          {/* Namespace field for Oracle OCI */}
          {currentConfig.requiresNamespace && (
            <>
              <TextInput
                mode="outlined"
                label="Namespace"
                value={namespace}
                onChangeText={setNamespace}
                style={styles.input}
                error={!!errors.namespace}
                placeholder="Your Oracle Cloud namespace"
                autoCapitalize="none"
              />
              {errors.namespace ? <HelperText type="error">{errors.namespace}</HelperText> : null}
            </>
          )}

          {/* Cluster ID field for Linode */}
          {currentConfig.requiresClusterId && (
            <>
              <TextInput
                mode="outlined"
                label="Cluster ID"
                value={clusterId}
                onChangeText={setClusterId}
                style={styles.input}
                error={!!errors.clusterId}
                placeholder="Your Linode cluster ID"
                autoCapitalize="none"
              />
              {errors.clusterId ? <HelperText type="error">{errors.clusterId}</HelperText> : null}
            </>
          )}

          {/* Custom endpoint for MinIO */}
          {type === 'minio' && (
            <>
              <TextInput
                mode="outlined"
                label="Custom Endpoint"
                value={customEndpoint}
                onChangeText={setCustomEndpoint}
                style={styles.input}
                error={!!errors.customEndpoint}
                placeholder="https://your-minio-server.com"
                autoCapitalize="none"
              />
              {errors.customEndpoint ? <HelperText type="error">{errors.customEndpoint}</HelperText> : null}
            </>
          )}

          {/* Region selection */}
          {type !== 'minio' && (
            <>
              <Text style={styles.sectionLabel}>Region</Text>
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
                    {currentConfig.regions.find(r => r.value === region)?.label || 'Select a region'}
                  </Button>
                }
                style={{ maxHeight: 320 }}
              >
                <FlatList
                  data={currentConfig.regions}
                  keyExtractor={item => item.value}
                  style={{ maxHeight: 300 }}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator
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
              {errors.region ? <HelperText type="error">{errors.region}</HelperText> : null}
            </>
          )}

          {/* Location hint for Cloudflare R2 */}
          {currentConfig.supportsLocationHints && currentConfig.locationHints && (
            <>
              <Text style={styles.sectionLabel}>Location Hint (Optional)</Text>
              <Menu
                visible={locationHintMenuVisible}
                onDismiss={() => setLocationHintMenuVisible(false)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setLocationHintMenuVisible(true)}
                    contentStyle={{ justifyContent: 'space-between' }}
                    style={styles.menuButton}
                    icon="chevron-down"
                  >
                    {currentConfig.locationHints.find(h => h.value === locationHint)?.label || 'Auto (Recommended)'}
                  </Button>
                }
              >
                <Menu.Item
                  onPress={() => {
                    setLocationHint('');
                    setLocationHintMenuVisible(false);
                  }}
                  title="Auto (Recommended)"
                />
                {currentConfig.locationHints.map((hint) => (
                  <Menu.Item
                    key={hint.value}
                    onPress={() => {
                      setLocationHint(hint.value);
                      setLocationHintMenuVisible(false);
                    }}
                    title={hint.label}
                  />
                ))}
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
            Endpoint: {getEndpointPreview()}
          </Text>
          
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