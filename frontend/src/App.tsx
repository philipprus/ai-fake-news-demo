import { useState } from 'react';
import { Layout, Typography, Space, Card, message } from 'antd';
import SourceSelector from './components/SourceSelector';
import ArticleTable from './components/ArticleTable';
import ProgressBar from './components/ProgressBar';
import ErrorDisplay from './components/ErrorDisplay';
import { useFakeNews } from './hooks/useFakeNews';
import { FullArticle } from './types';
import { API_BASE_URL } from './constants/api';

const { Header, Content } = Layout;
const { Title, Paragraph } = Typography;

function App() {
  const [selectedSource, setSelectedSource] = useState<string>('');
  const { articles, progress, isStreaming, error, startStream, reset, updateArticle } = useFakeNews();
  const [regeneratingIds, setRegeneratingIds] = useState<Set<string>>(new Set());

  const handleSourceSelect = (source: string) => {
    // Only reset if changing source
    if (selectedSource && selectedSource !== source) {
      reset();
    }
    
    setSelectedSource(source);
    startStream(source);
  };

  const handleReset = () => {
    setSelectedSource('');
    reset();
  };

  const handleRegenerate = async (article: FullArticle) => {
    // Add to regenerating set
    setRegeneratingIds(prev => new Set(prev).add(article.id));
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/regenerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articleId: article.id,
          source: selectedSource,
          realTitle: article.realTitle,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.article) {
        // Update article in state
        updateArticle({
          ...article,
          fakeTitle: data.article.fakeTitle,
          category: data.article.category,
        });
        message.success('Fake headline regenerated!');
      } else {
        throw new Error(data.message || 'Failed to regenerate');
      }
    } catch (error) {
      message.error('Failed to regenerate headline');
    } finally {
      // Remove from regenerating set
      setRegeneratingIds(prev => {
        const next = new Set(prev);
        next.delete(article.id);
        return next;
      });
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0' }}>
        <Space align="center" style={{ height: '100%' }}>
          <Title level={3} style={{ margin: 0 }}>
            🎭 Fake News Generator
          </Title>
        </Space>
      </Header>

      <Content style={{ padding: '24px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <Card style={{ marginBottom: 24 }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Title level={4}>Welcome to Fake News Generator!</Title>
                <Paragraph>
                  This demo fetches real news headlines and uses AI to generate obviously fake, 
                  absurd, and humorous alternatives. Watch as the results stream in real-time!
                </Paragraph>
              </div>

              <SourceSelector
                onSelect={handleSourceSelect}
                disabled={isStreaming}
                selectedSource={selectedSource}
              />

              {error && <ErrorDisplay error={error} onReset={handleReset} />}

              {(isStreaming || articles.length > 0) && (
                <ProgressBar
                  completed={progress.completed}
                  total={progress.total}
                  isStreaming={isStreaming}
                />
              )}
            </Space>
          </Card>

          {articles.length > 0 && (
            <ArticleTable 
              articles={articles} 
              isStreaming={isStreaming} 
              onRegenerate={handleRegenerate}
              regeneratingIds={regeneratingIds}
            />
          )}
        </div>
      </Content>
    </Layout>
  );
}

export default App;
