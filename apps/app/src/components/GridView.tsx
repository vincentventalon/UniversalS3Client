import React from 'react';
import { FlatList, Dimensions, RefreshControl } from 'react-native';
import { S3Object } from '../types';
import { GridFileItem } from './GridFileItem';

interface GridViewProps {
  data: S3Object[];
  provider: any;
  bucketName: string;
  selectedKeys: string[];
  isMultiSelect: boolean;
  viewMode: 'grid2' | 'grid3';
  showTitles?: boolean;
  refreshing?: boolean;
  onItemPress: (item: S3Object) => void;
  onItemSelect: (item: S3Object) => void;
  onRefresh?: () => void;
}

export function GridView({
  data,
  provider,
  bucketName,
  selectedKeys,
  isMultiSelect,
  viewMode,
  showTitles = true,
  refreshing = false,
  onItemPress,
  onItemSelect,
  onRefresh,
}: GridViewProps) {
  const screenWidth = Dimensions.get('window').width;
  const numColumns = viewMode === 'grid2' ? 2 : 3;
  const itemSize = viewMode === 'grid2' ? 'large' : 'small';
  
  // Calculate item width with minimal spacing
  const containerPadding = 4; // Minimal container padding
  const itemSpacing = 2; // Minimal space between items
  const availableWidth = screenWidth - (containerPadding * 2);
  const totalSpacing = itemSpacing * (numColumns - 1);
  const itemWidth = (availableWidth - totalSpacing) / numColumns;

  const renderItem = ({ item }: { item: S3Object }) => (
    <GridFileItem
      item={item}
      provider={provider}
      bucketName={bucketName}
      isSelected={selectedKeys.includes(item.key)}
      isMultiSelect={isMultiSelect}
      size={itemSize}
      showTitle={showTitles}
      itemWidth={itemWidth}
      onPress={() => onItemPress(item)}
      onSelect={() => onItemSelect(item)}
    />
  );

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      numColumns={numColumns}
      key={`${viewMode}-${numColumns}`} // Force re-render when changing columns
      contentContainerStyle={{ 
        padding: containerPadding,
        paddingBottom: 80, // Extra space for FAB
      }}
      columnWrapperStyle={numColumns > 1 ? { 
        justifyContent: 'space-between',
        paddingHorizontal: 0,
      } : undefined}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        ) : undefined
      }
    />
  );
}