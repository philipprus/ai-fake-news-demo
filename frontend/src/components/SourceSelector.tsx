import { useEffect, useState } from 'react';
import { Select, Space, Typography } from 'antd';
import { API_ENDPOINTS } from '../constants/api';

const { Text } = Typography;

interface SourceSelectorProps {
  onSelect: (source: string) => void;
  disabled?: boolean;
  selectedSource?: string;
}

interface SourcesResponse {
  sources: string[];
  count: number;
}

function SourceSelector({ onSelect, disabled, selectedSource }: SourceSelectorProps) {
  const [sources, setSources] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(API_ENDPOINTS.SOURCES);
      if (!response.ok) {
        throw new Error('Failed to fetch sources');
      }

      const data: SourcesResponse = await response.json();
      setSources(data.sources);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sources');
    } finally {
      setLoading(false);
    }
  };

  const options = sources.map((source) => ({
    label: source.toUpperCase(),
    value: source,
  }));

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Text strong>Select News Source:</Text>
      <Select
        value={selectedSource || undefined}
        placeholder="Choose a news source to start..."
        options={options}
        onChange={onSelect}
        disabled={disabled || loading}
        loading={loading}
        style={{ width: 300 }}
        size="large"
      />
      {error && <Text type="danger">{error}</Text>}
    </Space>
  );
}

export default SourceSelector;
