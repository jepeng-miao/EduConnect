import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Paper
} from '@mui/material';
import { History as HistoryIcon } from '@mui/icons-material';
import { API_BASE_URL } from '../config';

/**
 * 比赛结果表格组件 - 可复用于不同场景
 * 
 * @param {Object} props
 * @param {string} props.apiUrl - API基础URL，如'/api/competition/results/class/'
 * @param {string} props.entityId - 实体ID，如班级ID或学生ID
 * @param {string} props.title - 表格标题
 * @param {boolean} props.showContent - 是否显示比赛内容列
 * @param {function} props.onDataLoaded - 数据加载后的回调函数
 */
function CompetitionResultsTable({ apiUrl, entityId, title = '比赛历史记录', showContent = true, onDataLoaded }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    searchText: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    if (entityId) {
      fetchResults();
    }
  }, [entityId]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}${apiUrl}${entityId}`;
      const queryParams = [];
      
      if (filters.searchText) {
        queryParams.push(`text=${encodeURIComponent(filters.searchText)}`);
      }
      if (filters.startDate) {
        queryParams.push(`startDate=${encodeURIComponent(filters.startDate)}`);
      }
      if (filters.endDate) {
        queryParams.push(`endDate=${encodeURIComponent(filters.endDate)}`);
      }
      
      if (queryParams.length > 0) {
        url += `?${queryParams.join('&')}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setResults(data.results);
        if (onDataLoaded) {
          onDataLoaded(data.results);
        }
      } else {
        setError('获取比赛历史记录失败');
      }
    } catch (err) {
      console.error('获取比赛历史记录失败:', err);
      setError('服务器连接失败');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApplyFilters = () => {
    fetchResults();
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <HistoryIcon sx={{ mr: 1 }} />
        {title}
      </Typography>
      
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="搜索比赛内容"
          name="searchText"
          value={filters.searchText}
          onChange={handleFilterChange}
          size="small"
          sx={{ minWidth: 200 }}
        />
        <TextField
          label="开始日期"
          name="startDate"
          type="date"
          value={filters.startDate}
          onChange={handleFilterChange}
          size="small"
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="结束日期"
          name="endDate"
          type="date"
          value={filters.endDate}
          onChange={handleFilterChange}
          size="small"
          InputLabelProps={{ shrink: true }}
        />
        <Button
          variant="contained"
          onClick={handleApplyFilters}
          startIcon={<HistoryIcon />}
        >
          应用筛选
        </Button>
      </Box>
      
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : results.length > 0 ? (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>学号</TableCell>
                <TableCell>姓名</TableCell>
                {showContent && <TableCell>比赛内容</TableCell>}
                <TableCell>准确率</TableCell>
                <TableCell>进度</TableCell>
                <TableCell>完成时间</TableCell>
                <TableCell>比赛日期</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {results.map((result) => (
                <TableRow key={result.id}>
                  <TableCell>{result.studentId}</TableCell>
                  <TableCell>{result.Student?.name || '未知'}</TableCell>
                  {showContent && (
                    <TableCell>
                      <Typography
                        sx={{
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        title={result.competitionText}
                      >
                        {result.competitionText}
                      </Typography>
                    </TableCell>
                  )}
                  <TableCell>{result.accuracy}%</TableCell>
                  <TableCell>{result.progress}%</TableCell>
                  <TableCell>{result.completionTime ? `${(result.completionTime / 1000).toFixed(2)}秒` : '未完成'}</TableCell>
                  <TableCell>{new Date(result.competitionDate).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            暂无比赛历史记录
          </Typography>
        </Box>
      )}
    </Paper>
  );
}

export default CompetitionResultsTable;