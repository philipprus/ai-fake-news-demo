import { Alert, Button } from 'antd';

interface ErrorDisplayProps {
  error: string;
  onReset: () => void;
}

function ErrorDisplay({ error, onReset }: ErrorDisplayProps) {
  return (
    <Alert
      message="Error"
      description={error}
      type="error"
      showIcon
      action={
        <Button size="small" danger onClick={onReset}>
          Try Again
        </Button>
      }
    />
  );
}

export default ErrorDisplay;
