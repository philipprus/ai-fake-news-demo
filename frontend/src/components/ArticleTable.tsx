import { Table, Tag, Typography, Space, Spin, Tooltip, Button } from 'antd';
import { LinkOutlined, LoadingOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { FullArticle } from '../types';

const { Text, Link } = Typography;

interface ArticleTableProps {
  articles: FullArticle[];
  isStreaming: boolean;
  onRegenerate?: (article: FullArticle) => void;
  regeneratingIds?: Set<string>;
}

function ArticleTable({ articles, isStreaming, onRegenerate, regeneratingIds = new Set() }: ArticleTableProps) {
  const columns: ColumnsType<FullArticle> = [
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      width: 100,
      render: (source: string) => <Tag color="blue">{source.toUpperCase()}</Tag>,
    },
    {
      title: 'Real Headline',
      dataIndex: 'realTitle',
      key: 'realTitle',
      width: 300,
      render: (text: string, record: FullArticle) => (
        <Tooltip title={record.realUrl}>
          <Link href={record.realUrl} target="_blank">
            {text} <LinkOutlined />
          </Link>
        </Tooltip>
      ),
    },
    {
      title: 'Fake Headline',
      dataIndex: 'fakeTitle',
      key: 'fakeTitle',
      width: 300,
      render: (text: string | undefined, record: FullArticle) => {
        const isRegenerating = regeneratingIds.has(record.id);
        
        if (record.error) {
          return <Text type="danger">❌ {record.error}</Text>;
        }
        if (!text) {
          return (
            <Space>
              <Spin indicator={<LoadingOutlined spin />} />
              <Text type="secondary">Generating...</Text>
            </Space>
          );
        }
        return (
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Text strong style={{ color: '#cf1322' }}>{text}</Text>
            {onRegenerate && (
              <Button
                type="link"
                size="small"
                icon={<ReloadOutlined spin={isRegenerating} />}
                onClick={() => onRegenerate(record)}
                disabled={isRegenerating}
                style={{ padding: 0, height: 'auto' }}
              >
                {isRegenerating ? 'Regenerating...' : 'Regenerate'}
              </Button>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: string | undefined) => {
        if (!category) {
          return <Text type="secondary">—</Text>;
        }
        return <Tag color="green">{category}</Tag>;
      },
    },
    {
      title: 'Date',
      dataIndex: 'dateISO',
      key: 'date',
      width: 120,
      render: (date: string) => {
        const formatted = new Date(date).toLocaleString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        return <Text type="secondary">{formatted}</Text>;
      },
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={articles}
      rowKey="id"
      pagination={false}
      loading={isStreaming && articles.length === 0}
      bordered
      size="middle"
      scroll={{ x: 1000 }}
    />
  );
}

export default ArticleTable;
