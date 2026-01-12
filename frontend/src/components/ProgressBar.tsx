import { Progress, Space, Typography } from 'antd';

const { Text } = Typography;

interface ProgressBarProps {
  completed: number;
  total: number;
  isStreaming: boolean;
}

function ProgressBar({ completed, total, isStreaming }: ProgressBarProps) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const status = isStreaming ? 'active' : 'success';

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="small">
      <Text strong>
        {isStreaming ? 'Generating fake news...' : 'Generation complete!'}
      </Text>
      <Progress
        percent={percent}
        status={status}
        format={() => `${completed} / ${total}`}
      />
    </Space>
  );
}

export default ProgressBar;
