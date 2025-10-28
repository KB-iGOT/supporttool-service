# Bulk User Migration V2 - Large Dataset Support

## Overview

The Bulk User Migration V2 feature is designed to handle large-scale user migrations with enhanced performance, reliability, and monitoring capabilities. This version can process CSV files containing up to **50,000 users** by breaking them into manageable chunks of **1,000 users** each.

## Key Features

### 🚀 **Chunk-Based Processing**
- Processes large datasets in chunks of 1,000 users
- **User fetching is also chunked**: Fetches user data in batches of 100 users to avoid API limits
- Prevents API timeouts and memory issues
- Allows for better error isolation and recovery

### ⏸️ **Pause/Resume Functionality**
- Users can pause the migration process at any time
- Resume processing from where it left off
- Ideal for long-running migrations

### 📊 **Real-Time Progress Tracking**
- Overall progress percentage
- Individual chunk status monitoring
- Detailed timing and performance metrics
- Live updates during processing

### 🔍 **Enhanced Error Handling**
- Chunk-level error isolation
- Detailed error reporting with reasons
- Failed migrations don't stop the entire process
- Comprehensive error logs for debugging

### 📈 **Performance Monitoring**
- Processing time per chunk
- Average time per user
- Performance metrics and statistics
- Estimated time remaining (future enhancement)

## Technical Specifications

### File Limits
- **Maximum File Size**: 400 MB
- **Maximum Users**: 50,000 users
- **Chunk Size**: 1,000 users per chunk
- **File Format**: CSV with headers (Email, Phone, Channel)

### Processing Details
- **Delay Between Chunks**: 2 seconds (configurable)
- **User Fetch Batch Size**: 100 users per API call
- **Fetch Delay**: 200ms between user fetch batches
- **API Timeout**: 30 seconds per request
- **Batch Processing**: 100ms delay every 100 users within a chunk
- **Version**: V2 with enhanced audit logging

## Usage Instructions

### 1. **File Upload**
- Navigate to Bulk Upload → Migrate Users V2
- Download the sample CSV template
- Prepare your CSV file with Email, Phone, and Channel columns
- Upload the file (max 400 MB, 50,000 users)

### 2. **Configuration**
Configure migration options:
- **Force Migration**: Overwrite existing data if conflicts occur
- **Soft Delete from Old Org**: Preserves data but removes user from old organization
- **Notify Users**: Send migration notification to users

### 3. **Processing**
- Review the preview showing total users and chunks
- Click "Start Processing" to begin
- Monitor real-time progress for each chunk
- Use Pause/Resume controls as needed

### 4. **Results**
- View summary statistics (total processed, successful, failed)
- Download success report (CSV)
- Download error report (CSV) 
- Review processing logs for detailed information

## CSV File Format

### Required Headers
```csv
Email,Phone,Channel
```

### Sample Data
```csv
Email,Phone,Channel
user1@example.com,9876543210,Organization A
user2@example.com,9876543211,Organization B
user3@example.com,9876543212,Organization C
```

### Data Validation
- **Email OR Phone** is required (at least one)
- **Channel** is always required
- Empty rows are automatically skipped
- Case-insensitive header matching

## API Endpoints

### V2 Bulk Migration Endpoint
```
POST /api/users/migrate-bulk-v2
```

### Request Payload
```typescript
{
  payload: {
    request: [
      { userId: "user123", channel: "new-channel" }
    ],
    migrationOptions: {
      forceMigration: true,
      softDeleteOldOrg: true,
      notifyMigration: false
    },
    chunkInfo: {
      chunkId: 1,
      totalChunks: 5,
      chunkSize: 1000
    }
  },
  jiraLink: "",
  changedFields: { ... },
  module: "Migrate Users V2",
  userId: "admin123"
}
```

### Response Format
```typescript
{
  status: 200,
  message: "Bulk migration V2 process completed...",
  results: {
    success: [...],
    failure: [...]
  },
  summary: {
    totalRequested: 1000,
    successful: 995,
    failed: 5,
    processingTimeMs: 45000,
    averageTimePerUserMs: 45,
    chunkInfo: { ... },
    version: "V2"
  }
}
```

## Error Handling

### Common Error Scenarios
1. **User Not Found**: Email/phone doesn't exist in the system
2. **Already in Target Channel**: User is already in the destination channel
3. **Email/Phone Mismatch**: Email and phone belong to different users
4. **API Timeouts**: Network or server timeouts during migration
5. **Invalid Data**: Malformed CSV data or missing required fields

### Error Resolution
- Check the error report CSV for detailed failure reasons
- Verify user data exists in the system
- Ensure CSV format matches the template
- Retry failed users after fixing data issues

## Performance Considerations

### Recommended File Sizes
- **Small Files** (< 1,000 users): Use standard Migrate Users V1
- **Medium Files** (1,000 - 10,000 users): Ideal for V2
- **Large Files** (10,000 - 50,000 users): V2 with monitoring

### Processing Time Estimates
- **1,000 users**: ~2-3 minutes
- **10,000 users**: ~20-30 minutes  
- **50,000 users**: ~2-3 hours

### System Impact
- Minimal memory usage due to chunk processing
- Reduced API load with built-in delays
- Safe for production environments

## Monitoring and Logging

### Audit Trail
- Complete audit logs for each migration
- Chunk-level tracking with timestamps
- Performance metrics collection
- JIRA integration for change management

### Progress Monitoring
- Real-time chunk status updates
- Overall progress percentage
- Processing time per chunk
- Success/failure statistics

## Troubleshooting

### Common Issues

#### 1. **Processing Stuck/Slow**
- Check network connectivity
- Verify API endpoint availability
- Monitor system resources
- Use pause/resume if needed

#### 2. **High Failure Rate**
- Validate CSV data format
- Check user existence in source system
- Verify channel names are correct
- Review error report for patterns

#### 3. **File Upload Issues**
- Ensure file size < 400 MB
- Verify CSV format and headers
- Check for special characters
- Use UTF-8 encoding

### Support Contact
For technical issues or questions:
- Check processing logs for error details
- Download error report for analysis
- Contact system administrator with chunk IDs and timestamps

## Version Comparison

| Feature | V1 (Standard) | V2 (Large Files) |
|---------|---------------|------------------|
| Max Users | 50 | 50,000 |
| Chunk Processing | No | Yes (1,000/chunk) |
| Pause/Resume | No | Yes |
| Progress Tracking | Basic | Advanced |
| Error Isolation | All-or-nothing | Per-chunk |
| Performance Metrics | No | Yes |
| Processing Time | Fast (small files) | Optimized (large files) |

## Future Enhancements

### Planned Features
- **Estimated Time Remaining**: Real-time ETA calculations
- **Background Processing**: Queue-based processing for massive files
- **Email Notifications**: Process completion alerts
- **Advanced Filtering**: Pre-migration data validation
- **Scheduling**: Delayed and recurring migrations
- **API Rate Limiting**: Configurable processing speeds

### Scalability Roadmap
- Support for 100,000+ users
- Distributed processing across multiple servers
- Advanced error recovery and retry mechanisms
- Integration with external data sources

---

*Last Updated: October 27, 2025*
*Version: 2.0.0*
