import React, { useState, useCallback, useRef, useContext } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  AccessTime as AccessTimeIcon,
  Group as GroupIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import Papa, { ParseResult } from 'papaparse';
import { useLocation } from 'react-router-dom';
import { usersService } from '../../../services/users.service';
import { useActionInterceptor } from '../../../hooks/useActionInterceptor';
import { AppContext } from '../../../Context/AppContext';
import { appContextType } from '../../../types';
import { UserProfile } from '../../../types/users';

interface CsvData {
  email: string;
  phone: string;
  channel: string;
  userId: string;
}

interface MigrationFailure {
  email?: string;
  phone?: string;
  channel?: string;
  userId?: string;
  reason: string;
  chunkId?: number;
}

interface ChunkProgress {
  chunkId: number;
  status: 'pending' | 'fetching' | 'processing' | 'validating' | 'migrating' | 'completed' | 'failed' | 'paused';
  totalUsers: number;
  fetchedUsers: number;
  validatedUsers: number;
  migratedUsers: number;
  failedUsers: number;
  startTime?: Date;
  endTime?: Date;
  error?: string;
  fetchProgress?: number; // Progress for user fetching phase
}

interface ProcessingState {
  isProcessing: boolean;
  isPaused: boolean;
  currentChunk: number;
  totalChunks: number;
  chunks: ChunkProgress[];
  overallProgress: number;
  estimatedTimeRemaining?: number;
  startTime?: Date;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} id={`tabpanel-${index}`} aria-labelledby={`tab-${index}`} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const CHUNK_SIZE = 500; // Reduced from 1000 to avoid 413 Payload Too Large errors
const MAX_USERS = 50000; // Maximum allowed users
const DELAY_BETWEEN_CHUNKS = 2000; // 2 seconds delay between chunks

export const MigrateUsersV2 = () => {
  const location = useLocation();
  const { setNotification, user } = useContext(AppContext) as appContextType;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const processingControlRef = useRef<{ isPaused: boolean; isStopped: boolean; jiraLink?: string }>({ isPaused: false, isStopped: false });
  
  // Get current module info from location state
  const moduleState = location.state?.module || { name: 'Migrate Users V2' };
  
  // State management
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CsvData[]>([]);
  const [currentStep, setCurrentStep] = useState<'upload' | 'preview' | 'processing' | 'results'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [resultTab, setResultTab] = useState(0);
  
  // Processing state
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    isPaused: false,
    currentChunk: 0,
    totalChunks: 0,
    chunks: [],
    overallProgress: 0
  });
  
  // Migration options
  const [migrationOptions, setMigrationOptions] = useState({
    forceMigration: true,
    softDeleteOldOrg: true,
    notifyMigration: false
  });
  
  // Action interceptor for JIRA link collection
  const { handleAction: handleStartProcessing } = useActionInterceptor({
    actionType: 'BULK_MIGRATE_USERS_V2',
    onComplete: async (interceptPayload) => {
      console.log(`🎫 JIRA Link collected: ${interceptPayload.jiraLink}`);
      
      // Store JIRA link for use in chunk processing
      processingControlRef.current = { 
        isPaused: false, 
        isStopped: false, 
        jiraLink: interceptPayload.jiraLink // Store JIRA link in processing control
      };
      
      await performMigration(interceptPayload.jiraLink);
    }
  });
  
  // Results
  const [migrationResults, setMigrationResults] = useState<{
    success: UserProfile[];
    failure: MigrationFailure[];
    summary: {
      totalProcessed: number;
      totalSuccess: number;
      totalFailed: number;
      chunksCompleted: number;
      processingTime: number;
    };
  }>({
    success: [],
    failure: [],
    summary: {
      totalProcessed: 0,
      totalSuccess: 0,
      totalFailed: 0,
      chunksCompleted: 0,
      processingTime: 0
    }
  });

  const processFile = (selectedFile: File | undefined) => {
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.toLowerCase().endsWith('.csv')) {
        setNotification({
          open: true,
          message: 'Invalid file type. Please upload a CSV file.',
          severity: 'error'
        });
        setFile(null);
        setCsvData([]);
        return;
      }

      const maxSize = 400 * 1024 * 1024; // 400 MB
      if (selectedFile.size > maxSize) {
        setNotification({
          open: true,
          message: 'File size exceeds the 400 MB limit.',
          severity: 'error'
        });
        setFile(null);
        setCsvData([]);
        return;
      }

      setFile(selectedFile);
      Papa.parse<CsvData>(selectedFile, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string): string => {
          const lowerCaseHeader = header.toLowerCase().replace(/ /g, '');
          if (lowerCaseHeader === 'emailid' || lowerCaseHeader === 'email') {
            return 'email';
          }
          if (lowerCaseHeader === 'mobilenumber' || lowerCaseHeader === 'phone' || lowerCaseHeader === 'phonenumber') {
            return 'phone';
          }
          if (lowerCaseHeader === 'channel' || lowerCaseHeader === 'organization' || lowerCaseHeader === 'organisation') {
            return 'channel';
          }
          if (lowerCaseHeader === 'userid' || lowerCaseHeader === 'identifier' || lowerCaseHeader === 'id') {
            return 'userId';
          }
          return header;
        },
        complete: (results: ParseResult<CsvData>) => {
          const data = results.data.filter((row: CsvData) => (row.email || row.phone || row.userId) && row.channel);
          
          if (data.length === 0) {
            setNotification({
              open: true,
              message: 'CSV file must contain at least one row with an "email", "phone", or "userId" column and a "channel" column.',
              severity: 'error'
            });
            return;
          }
          
          // Check if CSV exceeds maximum allowed users
          if (data.length > MAX_USERS) {
            setNotification({
              open: true,
              message: `CSV file contains ${data.length.toLocaleString()} users. Maximum allowed is ${MAX_USERS.toLocaleString()} users. Please split your file into smaller files.`,
              severity: 'error'
            });
            return;
          }
          
          setCsvData(data);
          setCurrentStep('preview');
          
          // Calculate chunks
          const totalChunks = Math.ceil(data.length / CHUNK_SIZE);
          const chunks: ChunkProgress[] = [];
          
          for (let i = 0; i < totalChunks; i++) {
            const startIndex = i * CHUNK_SIZE;
            const endIndex = Math.min(startIndex + CHUNK_SIZE, data.length);
            chunks.push({
              chunkId: i + 1,
              status: 'pending',
              totalUsers: endIndex - startIndex,
              fetchedUsers: 0,
              validatedUsers: 0,
              migratedUsers: 0,
              failedUsers: 0
            });
          }
          
          setProcessingState(prev => ({
            ...prev,
            totalChunks,
            chunks,
            currentChunk: 0,
            overallProgress: 0
          }));
          
          setNotification({
            open: true,
            message: `Successfully loaded ${data.length.toLocaleString()} user records. Will be processed in ${totalChunks} chunks of ${CHUNK_SIZE} users each.`,
            severity: 'success'
          });
        }
      });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    processFile(event.target.files?.[0]);
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    processFile(event.dataTransfer.files?.[0]);
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  const fetchUsersInBatches = async (
    emails: string[], 
    phones: string[], 
    userIds: string[],
    searchFields: string[], 
    chunkIndex: number
  ) => {
    const USER_FETCH_BATCH_SIZE = 100; // Fetch users in smaller batches
    const userMapByEmail = new Map<string, UserProfile>();
    const userMapByPhone = new Map<string, UserProfile>();
    const userMapByUserId = new Map<string, UserProfile>();
    const totalFetchOperations = Math.ceil(emails.length / USER_FETCH_BATCH_SIZE) + Math.ceil(phones.length / USER_FETCH_BATCH_SIZE) + Math.ceil(userIds.length / USER_FETCH_BATCH_SIZE);
    let completedFetchOperations = 0;

    // Update chunk status to fetching
    setProcessingState(prev => ({
      ...prev,
      chunks: prev.chunks.map(chunk => 
        chunk.chunkId === chunkIndex + 1 
          ? { ...chunk, status: 'fetching', fetchProgress: 0 }
          : chunk
      )
    }));

    // Process emails in batches
    if (emails.length > 0) {
      for (let i = 0; i < emails.length; i += USER_FETCH_BATCH_SIZE) {
        const emailBatch = emails.slice(i, i + USER_FETCH_BATCH_SIZE);
        try {
          const emailResponse = await usersService.getUsers({ 
            request: { 
              filters: { email: emailBatch }, 
              fields: searchFields,
              limit: USER_FETCH_BATCH_SIZE
            } 
          });
          emailResponse.result.response.content.forEach((user: UserProfile) => 
            userMapByEmail.set(user.profileDetails.personalDetails.primaryEmail.toLowerCase(), user)
          );
          
          completedFetchOperations++;
          const fetchProgress = Math.round((completedFetchOperations / totalFetchOperations) * 100);
          
          // Update fetch progress
          setProcessingState(prev => ({
            ...prev,
            chunks: prev.chunks.map(chunk => 
              chunk.chunkId === chunkIndex + 1 
                ? { ...chunk, fetchProgress, fetchedUsers: userMapByEmail.size + userMapByPhone.size + userMapByUserId.size }
                : chunk
            )
          }));
          
          // Small delay between fetch batches
          if (i + USER_FETCH_BATCH_SIZE < emails.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        } catch (error: any) {
          console.error(`Error fetching email batch ${i + 1}-${Math.min(i + USER_FETCH_BATCH_SIZE, emails.length)}:`, error);
          completedFetchOperations++;
          // Continue with next batch even if one fails
        }
      }
    }

    // Process phones in batches
    if (phones.length > 0) {
      for (let i = 0; i < phones.length; i += USER_FETCH_BATCH_SIZE) {
        const phoneBatch = phones.slice(i, i + USER_FETCH_BATCH_SIZE);
        try {
          const phoneResponse = await usersService.getUsers({ 
            request: { 
              filters: { phone: phoneBatch }, 
              fields: searchFields,
              limit: USER_FETCH_BATCH_SIZE
            } 
          });
          phoneResponse.result.response.content.forEach((user: UserProfile) => 
            userMapByPhone.set(String(user.profileDetails.personalDetails.mobile), user)
          );
          
          completedFetchOperations++;
          const fetchProgress = Math.round((completedFetchOperations / totalFetchOperations) * 100);
          
          // Update fetch progress
          setProcessingState(prev => ({
            ...prev,
            chunks: prev.chunks.map(chunk => 
              chunk.chunkId === chunkIndex + 1 
                ? { ...chunk, fetchProgress, fetchedUsers: userMapByEmail.size + userMapByPhone.size + userMapByUserId.size }
                : chunk
            )
          }));
          
          // Small delay between fetch batches
          if (i + USER_FETCH_BATCH_SIZE < phones.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        } catch (error: any) {
          console.error(`Error fetching phone batch ${i + 1}-${Math.min(i + USER_FETCH_BATCH_SIZE, phones.length)}:`, error);
          completedFetchOperations++;
          // Continue with next batch even if one fails
        }
      }
    }

    // Process userIds in batches
    if (userIds.length > 0) {
      for (let i = 0; i < userIds.length; i += USER_FETCH_BATCH_SIZE) {
        const userIdBatch = userIds.slice(i, i + USER_FETCH_BATCH_SIZE);
        try {
          const userIdResponse = await usersService.getUsers({ 
            request: { 
              filters: { identifier: userIdBatch }, 
              fields: searchFields,
              limit: USER_FETCH_BATCH_SIZE
            } 
          });
          userIdResponse.result.response.content.forEach((user: UserProfile) => {
            userMapByUserId.set(user.userId, user);
            // Also map by identifier if different from userId
            if (user.identifier && user.identifier !== user.userId) {
              userMapByUserId.set(user.identifier, user);
            }
          });
          
          completedFetchOperations++;
          const fetchProgress = Math.round((completedFetchOperations / totalFetchOperations) * 100);
          
          // Update fetch progress
          setProcessingState(prev => ({
            ...prev,
            chunks: prev.chunks.map(chunk => 
              chunk.chunkId === chunkIndex + 1 
                ? { ...chunk, fetchProgress, fetchedUsers: userMapByEmail.size + userMapByPhone.size + userMapByUserId.size }
                : chunk
            )
          }));
          
          // Small delay between fetch batches
          if (i + USER_FETCH_BATCH_SIZE < userIds.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        } catch (error: any) {
          console.error(`Error fetching userId batch ${i + 1}-${Math.min(i + USER_FETCH_BATCH_SIZE, userIds.length)}:`, error);
          completedFetchOperations++;
          // Continue with next batch even if one fails
        }
      }
    }

    return { userMapByEmail, userMapByPhone, userMapByUserId };
  };

  const processChunk = async (chunkIndex: number): Promise<{ success: UserProfile[]; failure: MigrationFailure[] }> => {
    const startIndex = chunkIndex * CHUNK_SIZE;
    const endIndex = Math.min(startIndex + CHUNK_SIZE, csvData.length);
    const chunkData = csvData.slice(startIndex, endIndex);
    
    console.log(`🔍 Processing chunk ${chunkIndex + 1}: ${chunkData.length} users (indices ${startIndex}-${endIndex - 1})`);
    
    // Update chunk status to validating
    setProcessingState(prev => ({
      ...prev,
      chunks: prev.chunks.map(chunk => 
        chunk.chunkId === chunkIndex + 1 
          ? { ...chunk, status: 'validating', startTime: new Date() }
          : chunk
      )
    }));

    try {
      // Step 1: Validate users with chunked fetching
      const emails = chunkData.map(d => d.email).filter(Boolean) as string[];
      const phones = chunkData.map(d => d.phone).filter(Boolean) as string[];
      const userIds = chunkData.map(d => d.userId).filter(Boolean) as string[];
      
      const searchFields = ["userId", "email", "firstName", "lastName", "phone", "rootOrgId", "channel", "roles", "profileDetails", "createdDate", "rootOrgName", "organisations", "username", "status"];
      
      // Fetch users in smaller batches to avoid API limits
      console.log(`🔍 Starting user fetch for chunk ${chunkIndex + 1}: ${emails.length} emails, ${phones.length} phones, ${userIds.length} userIds`);
      const { userMapByEmail, userMapByPhone, userMapByUserId } = await fetchUsersInBatches(emails, phones, userIds, searchFields, chunkIndex);
      console.log(`✅ User fetch completed for chunk ${chunkIndex + 1}: ${userMapByEmail.size} by email, ${userMapByPhone.size} by phone, ${userMapByUserId.size} by userId`);
      
      const usersToMigrate: UserProfile[] = [];
      const validationErrors: MigrationFailure[] = [];
      const processedUserIds = new Set<string>();
      
      // Process each row in the chunk
      for (const row of chunkData) {
        const email = row.email?.trim().toLowerCase();
        const phone = row.phone?.trim();
        const userId = row.userId?.trim();
        const targetChannel = row.channel?.trim();

        // Priority: userId > email+phone > email > phone
        if (userId) {
          const user = userMapByUserId.get(userId);
          if (user) {
            if (!processedUserIds.has(user.userId)) {
              if (user.channel === targetChannel) {
                validationErrors.push({ 
                  userId, 
                  channel: targetChannel, 
                  reason: 'User is already in the target channel.',
                  chunkId: chunkIndex + 1
                });
                processedUserIds.add(user.userId);
                continue;
              }
              (user as any).targetChannel = targetChannel;
              usersToMigrate.push(user);
              processedUserIds.add(user.userId);
            }
          } else {
            validationErrors.push({ 
              userId, 
              channel: targetChannel, 
              reason: 'User not found for userId/identifier.',
              chunkId: chunkIndex + 1
            });
          }
        } else if (email && phone) {
          const userByEmail = userMapByEmail.get(email);
          const userByPhone = userMapByPhone.get(phone);
          if (userByEmail && userByPhone) {
            if (userByEmail.userId === userByPhone.userId) {
              if (!processedUserIds.has(userByEmail.userId)) {
                if (userByEmail.channel === targetChannel) {
                  validationErrors.push({ 
                    email, 
                    phone, 
                    channel: targetChannel, 
                    reason: 'User is already in the target channel.',
                    chunkId: chunkIndex + 1
                  });
                  processedUserIds.add(userByEmail.userId);
                  continue;
                }
                (userByEmail as any).targetChannel = targetChannel;
                usersToMigrate.push(userByEmail);
                processedUserIds.add(userByEmail.userId);
              }
            } else {
              validationErrors.push({ 
                email, 
                phone, 
                channel: targetChannel, 
                reason: 'Email and phone do not belong to the same user.',
                chunkId: chunkIndex + 1
              });
            }
          } else if (userByEmail && !userByPhone) {
            validationErrors.push({ 
              email, 
              phone, 
              channel: targetChannel, 
              reason: `User found for email, but not for phone.`,
              chunkId: chunkIndex + 1
            });
          } else if (!userByEmail && userByPhone) {
            validationErrors.push({ 
              email, 
              phone, 
              channel: targetChannel, 
              reason: `User found for phone, but not for email.`,
              chunkId: chunkIndex + 1
            });
          } else {
            validationErrors.push({ 
              email, 
              phone, 
              channel: targetChannel, 
              reason: 'User not found for either email or phone.',
              chunkId: chunkIndex + 1
            });
          }
        } else if (email) {
          const user = userMapByEmail.get(email);
          if (user) {
            if (!processedUserIds.has(user.userId)) {
              if (user.channel === targetChannel) {
                validationErrors.push({ 
                  email, 
                  channel: targetChannel, 
                  reason: 'User is already in the target channel.',
                  chunkId: chunkIndex + 1
                });
                processedUserIds.add(user.userId);
                continue;
              }
              (user as any).targetChannel = targetChannel;
              usersToMigrate.push(user);
              processedUserIds.add(user.userId);
            }
          } else {
            validationErrors.push({ 
              email, 
              channel: targetChannel, 
              reason: 'User not found.',
              chunkId: chunkIndex + 1
            });
          }
        } else if (phone) {
          const user = userMapByPhone.get(phone);
          if (user) {
            if (!processedUserIds.has(user.userId)) {
              if (user.channel === targetChannel) {
                validationErrors.push({ 
                  phone, 
                  channel: targetChannel, 
                  reason: 'User is already in the target channel.',
                  chunkId: chunkIndex + 1
                });
                processedUserIds.add(user.userId);
                continue;
              }
              (user as any).targetChannel = targetChannel;
              usersToMigrate.push(user);
              processedUserIds.add(user.userId);
            }
          } else {
            validationErrors.push({ 
              phone, 
              channel: targetChannel, 
              reason: 'User not found.',
              chunkId: chunkIndex + 1
            });
          }
        }
      }
      
      // Update chunk status after validation
      setProcessingState(prev => ({
        ...prev,
        chunks: prev.chunks.map(chunk => 
          chunk.chunkId === chunkIndex + 1 
            ? { 
                ...chunk, 
                status: 'migrating',
                validatedUsers: usersToMigrate.length,
                failedUsers: validationErrors.length
              }
            : chunk
        )
      }));
      
      // Step 2: Migrate users if any found
      const chunkSuccessfulMigrations: UserProfile[] = [];
      const chunkMigrationErrors: MigrationFailure[] = [...validationErrors];
      
      if (usersToMigrate.length > 0) {
        try {
          const requestPayload = {
            payload: {
              request: usersToMigrate.map(user => ({
                userId: user.identifier || user.userId,
                channel: (user as any).targetChannel
              })),
              migrationOptions: {
                forceMigration: migrationOptions.forceMigration,
                softDeleteOldOrg: migrationOptions.softDeleteOldOrg,
                notifyMigration: migrationOptions.notifyMigration
              },
              chunkInfo: {
                chunkId: chunkIndex + 1,
                totalChunks: processingState.totalChunks,
                chunkSize: usersToMigrate.length
              }
            },
            jiraLink: processingControlRef.current.jiraLink || '', // Use stored JIRA link from action interceptor
            changedFields: { 'channel': { 'new': 'bulk_migration_v2', 'original': 'various' } },
            module: moduleState?.name || 'Migrate Users V2',
            userId: user?.userId,
          };
          
          const response = await usersService.migrateBulkUserV2(requestPayload);
          
          console.log(`🔍 Migration response for chunk ${chunkIndex + 1}:`, response);
          
          // Process the bulk response
          if (response.results?.success && response.results.success.length > 0) {
            console.log(`✅ Success results from API:`, response.results.success);
            console.log(`🔍 Users to migrate for chunk ${chunkIndex + 1}:`, usersToMigrate.map(u => ({ 
              identifier: u.identifier, 
              userId: u.userId, 
              _id: (u as any)._id, 
              sourceUserId: (u as any)._source?.userId 
            })));
            
            // Enhanced success processing - Backend returns results with userId directly in the result object
            response.results.success.forEach((successResult: any, index: number) => {
              console.log(`🔍 Processing success result ${index + 1}:`, successResult);
              
              // The backend returns: { userId, channel, chunkId, processedAt, ...response.data }
              // So the userId is directly on the result object
              const userIdFromResult = successResult.userId;
              console.log(`🔍 UserID from success result: ${userIdFromResult}`);
              
              if (userIdFromResult) {
                // Find user in current chunk by matching the userId/identifier
                const matchedUser = usersToMigrate.find(user => {
                  const userIds = [
                    user.identifier,
                    user.userId,
                    (user as any)._id,
                    (user as any)._source?.userId
                  ].filter(Boolean);
                  
                  console.log(`🔍 Comparing ${userIdFromResult} against user IDs:`, userIds);
                  return userIds.includes(userIdFromResult);
                });
                
                if (matchedUser) {
                  console.log(`✅ Found match for userId: ${userIdFromResult}`);
                  // Add targetChannel info to the user object for success tracking
                  (matchedUser as any).migrationResult = successResult;
                  (matchedUser as any).targetChannel = successResult.channel; // Ensure target channel is set
                  chunkSuccessfulMigrations.push(matchedUser);
                  console.log(`✅ Added user to successful migrations:`, matchedUser.identifier || matchedUser.userId);
                } else {
                  console.warn(`⚠️ No matching user found for userId: ${userIdFromResult}`);
                  console.warn(`Available user identifiers:`, usersToMigrate.map(u => u.identifier || u.userId));
                  
                  // As a fallback, try matching by array index
                  if (index < usersToMigrate.length) {
                    const fallbackUser = usersToMigrate[index];
                    console.log(`🔄 Trying fallback match by index ${index}:`, fallbackUser.identifier || fallbackUser.userId);
                    (fallbackUser as any).migrationResult = successResult;
                    (fallbackUser as any).targetChannel = successResult.channel;
                    chunkSuccessfulMigrations.push(fallbackUser);
                    console.log(`✅ Added fallback user to successful migrations by index`);
                  }
                }
              } else {
                console.warn(`⚠️ Success result missing userId:`, successResult);
                
                // Try fallback by index
                if (index < usersToMigrate.length) {
                  const fallbackUser = usersToMigrate[index];
                  console.log(`🔄 Trying fallback match by index ${index} (no userId):`, fallbackUser.identifier || fallbackUser.userId);
                  (fallbackUser as any).migrationResult = successResult;
                  (fallbackUser as any).targetChannel = successResult.channel || (fallbackUser as any).targetChannel;
                  chunkSuccessfulMigrations.push(fallbackUser);
                  console.log(`✅ Added fallback user to successful migrations by index (no userId)`);
                }
              }
            });
            
            console.log(`📊 Chunk ${chunkIndex + 1} success matching complete: ${chunkSuccessfulMigrations.length} users successfully matched`);
          } else {
            console.log(`ℹ️ No success results in response for chunk ${chunkIndex + 1}`);
          }
          
          if (response.results?.failure && response.results.failure.length > 0) {
            console.log(`❌ Failure results:`, response.results.failure);
            
            response.results.failure.forEach((failureResult: any) => {
              const user = usersToMigrate.find(u => (u.identifier || u.userId) === failureResult.userId);
              chunkMigrationErrors.push({
                email: user?.profileDetails?.personalDetails?.primaryEmail || '',
                phone: user?.profileDetails?.personalDetails?.mobile || '',
                channel: (user as any)?.targetChannel || '',
                reason: failureResult.error || 'Migration failed',
                chunkId: chunkIndex + 1
              });
            });
          } else {
            console.log(`ℹ️ No failure results in response for chunk ${chunkIndex + 1}`);
          }
          
          // If no users were processed as success but there are no failures either,
          // it might be a different response structure or successful without detailed results
          const processedInThisIteration = chunkSuccessfulMigrations.length + chunkMigrationErrors.length;
          if (processedInThisIteration === 0 && usersToMigrate.length > 0) {
            console.warn(`⚠️ No success or failure results for ${usersToMigrate.length} users in chunk ${chunkIndex + 1}. Response:`, response);
            
            // Check if the overall response indicates success
            if (response.status === 200 && response.message && response.message.includes('successful')) {
              console.log(`✅ Assuming migration was successful based on response status and message: "${response.message}"`);
              // Add all users as successful with proper target channel information
              usersToMigrate.forEach(user => {
                (user as any).migrationResult = { success: true, message: response.message };
                chunkSuccessfulMigrations.push(user);
              });
            } else {
              // Add all users as failed with response information
              usersToMigrate.forEach(user => {
                chunkMigrationErrors.push({
                  email: user.profileDetails?.personalDetails?.primaryEmail || '',
                  phone: user.profileDetails?.personalDetails?.mobile || '',
                  channel: (user as any).targetChannel || '',
                  reason: `Unknown migration status. Response: ${response.message || 'No detailed results returned'}`,
                  chunkId: chunkIndex + 1
                });
              });
            }
          }
        } catch (error: any) {
          console.error(`❌ Migration API error for chunk ${chunkIndex + 1}:`, error);
          
          // If bulk operation fails, add all users to failure list
          usersToMigrate.forEach(user => {
            chunkMigrationErrors.push({ 
              email: user.profileDetails?.personalDetails?.primaryEmail || '', 
              phone: user.profileDetails?.personalDetails?.mobile || '', 
              channel: (user as any).targetChannel || '',
              reason: error.response?.data?.message || error.message || 'Bulk migration API failed',
              chunkId: chunkIndex + 1
            });
          });
        }
      }
      
      // Update final chunk status
      setProcessingState(prev => ({
        ...prev,
        chunks: prev.chunks.map(chunk => 
          chunk.chunkId === chunkIndex + 1 
            ? { 
                ...chunk, 
                status: 'completed',
                migratedUsers: chunkSuccessfulMigrations.length,
                endTime: new Date()
              }
            : chunk
        )
      }));
      
      console.log(`📋 Returning from chunk ${chunkIndex + 1}: ${chunkSuccessfulMigrations.length} success, ${chunkMigrationErrors.length} failures`);
      console.log(`🔍 Final chunk success users:`, chunkSuccessfulMigrations.map(u => ({
        identifier: u.identifier,
        userId: u.userId,
        email: u.profileDetails?.personalDetails?.primaryEmail
      })));
      
      return {
        success: chunkSuccessfulMigrations,
        failure: chunkMigrationErrors
      };
      
    } catch (error: any) {
      // Update chunk status to failed
      setProcessingState(prev => ({
        ...prev,
        chunks: prev.chunks.map(chunk => 
          chunk.chunkId === chunkIndex + 1 
            ? { 
                ...chunk, 
                status: 'failed',
                error: error.message || 'Chunk processing failed',
                endTime: new Date()
              }
            : chunk
        )
      }));
      
      // Return all users in this chunk as failures
      const chunkFailures: MigrationFailure[] = chunkData.map(row => ({
        email: row.email,
        phone: row.phone,
        channel: row.channel,
        reason: error.message || 'Chunk processing failed',
        chunkId: chunkIndex + 1
      }));
      
      return {
        success: [],
        failure: chunkFailures
      };
    }
  };

  const startProcessing = async () => {
    if (csvData.length === 0) {
      setNotification({
        open: true,
        message: 'No data to process.',
        severity: 'error'
      });
      return;
    }
    
    // Call the action interceptor which will collect JIRA link and call onComplete
    await handleStartProcessing();
  };

  const performMigration = async (jiraLink: string) => {
    // Calculate total chunks based on current CSV data
    const totalChunks = Math.ceil(csvData.length / CHUNK_SIZE);
    
    console.log(`🚀 Starting processing: ${csvData.length} users, ${totalChunks} chunks`);
    
    setCurrentStep('processing');
    setProcessingState(prev => ({
      ...prev,
      isProcessing: true,
      isPaused: false,
      currentChunk: 0,
      overallProgress: 0,
      startTime: new Date()
    }));
    
    const allResults = {
      success: [] as UserProfile[],
      failure: [] as MigrationFailure[]
    };
    
    try {
      for (let i = 0; i < totalChunks; i++) {
        console.log(`📦 Processing chunk ${i + 1}/${totalChunks}`);
        
        // Check if processing is paused (use ref for real-time state)
        while (processingControlRef.current.isPaused && !processingControlRef.current.isStopped) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Check if processing was stopped
        if (processingControlRef.current.isStopped) {
          console.log('⏹️ Processing stopped by user');
          break;
        }
        
        // Update current chunk
        setProcessingState(prev => ({
          ...prev,
          currentChunk: i + 1,
          overallProgress: Math.round((i / totalChunks) * 100)
        }));
        
        // Process the chunk
        const chunkResult = await processChunk(i);
        console.log(`✅ Chunk ${i + 1} completed: ${chunkResult.success.length} success, ${chunkResult.failure.length} failures`);
        console.log(`🔍 Chunk ${i + 1} returned success users:`, chunkResult.success.map(user => ({
          identifier: user.identifier,
          userId: user.userId,
          email: user.profileDetails?.personalDetails?.primaryEmail,
          migrationResult: (user as any).migrationResult ? 'Yes' : 'No'
        })));
        
        // Accumulate results from this chunk
        allResults.success.push(...chunkResult.success);
        allResults.failure.push(...chunkResult.failure);
        
        console.log(`📊 Running totals after chunk ${i + 1}: ${allResults.success.length} success, ${allResults.failure.length} failures`);
        
        // Update overall results for real-time UI updates
        setMigrationResults(prev => {
          console.log(`🔄 Updating migration results state. Previous success: ${prev.success.length}, adding: ${chunkResult.success.length}`);
          const newState = {
            ...prev,
            success: [...prev.success, ...chunkResult.success],
            failure: [...prev.failure, ...chunkResult.failure]
          };
          console.log(`🔄 New migration results state: ${newState.success.length} success, ${newState.failure.length} failures`);
          return newState;
        });
        
        // Add delay between chunks (except for the last chunk)
        if (i < processingState.totalChunks - 1) {
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_CHUNKS));
        }
      }
      
      // Processing completed
      const endTime = new Date();
      const processingTime = processingState.startTime ? 
        (endTime.getTime() - processingState.startTime.getTime()) / 1000 : 0;
      
      setProcessingState(prev => ({
        ...prev,
        isProcessing: false,
        overallProgress: 100
      }));
      
      setMigrationResults(prev => ({
        ...prev,
        summary: {
          totalProcessed: allResults.success.length + allResults.failure.length,
          totalSuccess: allResults.success.length,
          totalFailed: allResults.failure.length,
          chunksCompleted: totalChunks,
          processingTime
        }
      }));
      
      console.log(`🏁 Final processing results:`);
      console.log(`   - Total Success: ${allResults.success.length}`);
      console.log(`   - Total Failures: ${allResults.failure.length}`);
      console.log(`   - Success users:`, allResults.success.map(u => ({
        identifier: u.identifier,
        email: u.profileDetails?.personalDetails?.primaryEmail,
        hasTargetChannel: !!(u as any).targetChannel,
        hasMigrationResult: !!(u as any).migrationResult
      })));
      
      // Debug: Check current migrationResults state
      console.log(`🔍 Current migrationResults state before setCurrentStep:`, {
        successCount: allResults.success.length,
        failureCount: allResults.failure.length
      });
      
      setCurrentStep('results');
      
      setNotification({
        open: true,
        message: `Processing completed! ${allResults.success.length} successful, ${allResults.failure.length} failed out of ${allResults.success.length + allResults.failure.length} users processed.`,
        severity: allResults.success.length > 0 ? 'success' : 'error'
      });
      
    } catch (error: any) {
      setProcessingState(prev => ({
        ...prev,
        isProcessing: false
      }));
      
      setNotification({
        open: true,
        message: `Processing failed: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const pauseProcessing = () => {
    processingControlRef.current.isPaused = true;
    setProcessingState(prev => ({
      ...prev,
      isPaused: true
    }));
  };

  const resumeProcessing = () => {
    processingControlRef.current.isPaused = false;
    setProcessingState(prev => ({
      ...prev,
      isPaused: false
    }));
  };

  const stopProcessing = () => {
    processingControlRef.current.isStopped = true;
    processingControlRef.current.isPaused = false;
    setProcessingState(prev => ({
      ...prev,
      isProcessing: false,
      isPaused: false
    }));
    
    setNotification({
      open: true,
      message: 'Processing stopped by user.',
      severity: 'info'
    });
  };

  const reset = () => {
    // Reset processing control
    processingControlRef.current = { isPaused: false, isStopped: false };
    
    setCsvData([]);
    setFile(null);
    setCurrentStep('upload');
    setProcessingState({
      isProcessing: false,
      isPaused: false,
      currentChunk: 0,
      totalChunks: 0,
      chunks: [],
      overallProgress: 0
    });
    setMigrationResults({
      success: [],
      failure: [],
      summary: {
        totalProcessed: 0,
        totalSuccess: 0,
        totalFailed: 0,
        chunksCompleted: 0,
        processingTime: 0
      }
    });
      setResultTab(0);
  };

  const handleDownloadSample = () => {
    const sampleData = [
      { Email: 'user1@example.com', Phone: '9876543210', Channel: 'Organization A' },
      { Email: 'user2@example.com', Phone: '9876543211', Channel: 'Organization B' },
      { Email: 'user3@example.com', Phone: '9876543212', Channel: 'Organization C' }
    ];
    
    const csvContent = Papa.unparse(sampleData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'migrate-users-v2-sample.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };  const handleDownloadResults = (type: 'success' | 'failure') => {
    console.log(`📥 Download requested for ${type}. Current migrationResults:`, {
      successCount: migrationResults.success.length,
      failureCount: migrationResults.failure.length,
      successSample: migrationResults.success.slice(0, 2).map(u => ({
        identifier: u.identifier,
        email: u.profileDetails?.personalDetails?.primaryEmail,
        targetChannel: (u as any).targetChannel
      }))
    });
    
    let csvContent;
    if (type === 'success') {
      const successData = migrationResults.success.map(user => {
        const migrationResult = (user as any).migrationResult;
        return {
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.profileDetails?.personalDetails?.primaryEmail || user.email || '',
          phone: user.profileDetails?.personalDetails?.mobile || user.phone || '',
          fromChannel: user.channel || '',
          toChannel: migrationResult?.channel || (user as any).targetChannel || '',
          status: 'Successfully Migrated',
          migrationDate: migrationResult?.processedAt?.split('T')[0] || new Date().toISOString().split('T')[0]
        };
      });
      console.log(`📥 Success CSV data prepared:`, successData.slice(0, 2));
      csvContent = Papa.unparse(successData);
    } else {
      // Filter out any rows with missing required data to prevent blank rows
      const filteredFailures = migrationResults.failure.filter(failure => 
        failure.email || failure.phone || failure.reason
      ).map(failure => ({
        email: failure.email || '',
        phone: failure.phone || '',
        channel: failure.channel || '',
        reason: failure.reason || 'Unknown error',
        chunkId: failure.chunkId || ''
      }));
      csvContent = Papa.unparse(filteredFailures);
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `migration_${type}_report_v2.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderUploadStep = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, height: '100%' }}>
          <Typography variant="h6" gutterBottom>📄 Large File Migration</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This version can handle CSV files with up to <strong>{MAX_USERS.toLocaleString()} users</strong> by processing them in chunks of <strong>{CHUNK_SIZE} users</strong> at a time.
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Features:</strong><br/>
              • Chunk-based processing for large files<br/>
              • Pause/Resume functionality<br/>
              • Real-time progress tracking<br/>
              • Detailed chunk-level reporting
            </Typography>
          </Alert>
          <Button 
            variant="outlined" 
            startIcon={<DownloadIcon />} 
            onClick={handleDownloadSample}
            fullWidth
          >
            Download Sample CSV
          </Button>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, height: '100%' }}>
          <Typography variant="h6" gutterBottom>📤 Upload CSV File</Typography>
          <Box
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={() => setIsDragging(false)}
            sx={{
              border: '2px dashed',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderColor: isDragging ? 'primary.main' : 'grey.400',
              borderRadius: 1,
              p: 4,
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: isDragging ? 'action.hover' : 'transparent',
              transition: 'background-color 0.2s, border-color 0.2s',
              minHeight: 150
            }}
            component="label"
          >
            <input type="file" accept=".csv" onChange={handleFileChange} hidden />
            <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h6">Browse files</Typography>
            <Typography variant="body2" color="text.secondary">or</Typography>
            <Typography variant="h6">Drag file to upload</Typography>
            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
              Max file size: 400 MB | Max {MAX_USERS.toLocaleString()} users
            </Typography>
          </Box>
          {file && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Selected file: <strong>{file.name}</strong>
            </Alert>
          )}
        </Paper>
      </Grid>
    </Grid>
  );

  const renderPreviewStep = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>📋 Processing Preview</Typography>
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="primary.main">{csvData.length.toLocaleString()}</Typography>
              <Typography variant="body2" color="text.secondary">Total Users</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="info.main">{processingState.totalChunks}</Typography>
              <Typography variant="body2" color="text.secondary">Processing Chunks</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="warning.main">{CHUNK_SIZE}</Typography>
              <Typography variant="body2" color="text.secondary">Users per Chunk</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Migration Options */}
      <Paper sx={{ p: 2, mb: 3, backgroundColor: 'grey.50' }}>
        <Typography variant="subtitle2" gutterBottom>🔧 Migration Options:</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Force Migration</InputLabel>
              <Select
                value={migrationOptions.forceMigration.toString()}
                label="Force Migration"
                onChange={(e) => setMigrationOptions(prev => ({ ...prev, forceMigration: e.target.value === 'true' }))}
              >
                <MenuItem value="true">Yes</MenuItem>
                <MenuItem value="false">No</MenuItem>
              </Select>
              <FormHelperText>Overwrite existing data if conflicts occur</FormHelperText>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Soft Delete from Old Org</InputLabel>
              <Select
                value={migrationOptions.softDeleteOldOrg.toString()}
                label="Soft Delete from Old Org"
                onChange={(e) => setMigrationOptions(prev => ({ ...prev, softDeleteOldOrg: e.target.value === 'true' }))}
              >
                <MenuItem value="true">Yes</MenuItem>
                <MenuItem value="false">No</MenuItem>
              </Select>
              <FormHelperText>Preserves data but removes user from old org</FormHelperText>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Notify Users</InputLabel>
              <Select
                value={migrationOptions.notifyMigration.toString()}
                label="Notify Users"
                onChange={(e) => setMigrationOptions(prev => ({ ...prev, notifyMigration: e.target.value === 'true' }))}
              >
                <MenuItem value="true">Yes</MenuItem>
                <MenuItem value="false">No</MenuItem>
              </Select>
              <FormHelperText>Send migration notification to users</FormHelperText>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button onClick={reset} variant="outlined">
          Back to Upload
        </Button>
        <Button 
          onClick={startProcessing} 
          variant="contained" 
          startIcon={<PlayIcon />}
          size="large"
        >
          Start Processing ({csvData.length.toLocaleString()} users)
        </Button>
      </Box>
    </Paper>
  );

  const renderProcessingStep = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>⚡ Processing in Progress</Typography>
      
      {/* Overall Progress */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body1">
            Overall Progress: Chunk {processingState.currentChunk} of {processingState.totalChunks}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {processingState.overallProgress}%
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={processingState.overallProgress} 
          sx={{ height: 10, borderRadius: 1 }}
        />
      </Box>

      {/* Control Buttons */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        {processingState.isProcessing && !processingState.isPaused && (
          <Button
            onClick={pauseProcessing}
            variant="outlined"
            startIcon={<PauseIcon />}
            color="warning"
          >
            Pause
          </Button>
        )}
        {processingState.isPaused && (
          <Button
            onClick={resumeProcessing}
            variant="contained"
            startIcon={<PlayIcon />}
            color="success"
          >
            Resume
          </Button>
        )}
        <Button
          onClick={stopProcessing}
          variant="outlined"
          startIcon={<StopIcon />}
          color="error"
        >
          Stop
        </Button>
      </Box>

      {processingState.isPaused && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Processing is paused. Click Resume to continue.
        </Alert>
      )}

      {/* Chunk Progress */}
      <Typography variant="h6" gutterBottom>📊 Chunk Progress</Typography>
      <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
        {processingState.chunks.map((chunk) => (
          <Accordion key={chunk.chunkId} expanded={chunk.status !== 'pending'}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <Typography variant="body1">
                  Chunk {chunk.chunkId} ({chunk.totalUsers} users)
                </Typography>
                <Chip
                  label={chunk.status}
                  color={
                    chunk.status === 'completed' ? 'success' :
                    chunk.status === 'failed' ? 'error' :
                    chunk.status === 'fetching' || chunk.status === 'processing' || chunk.status === 'validating' || chunk.status === 'migrating' ? 'primary' :
                    'default'
                  }
                  size="small"
                />
                {chunk.status === 'completed' && (
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                    ✅ {chunk.migratedUsers} migrated, ❌ {chunk.failedUsers} failed
                  </Typography>
                )}
                {chunk.status === 'fetching' && chunk.fetchProgress !== undefined && (
                  <Typography variant="body2" color="primary.main" sx={{ ml: 'auto' }}>
                    🔍 Fetching users: {chunk.fetchProgress}%
                  </Typography>
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={6} md={2}>
                  <Typography variant="body2" color="text.secondary">Fetched</Typography>
                  <Typography variant="h6" color="info.main">{chunk.fetchedUsers}</Typography>
                </Grid>
                <Grid item xs={6} md={2}>
                  <Typography variant="body2" color="text.secondary">Validated</Typography>
                  <Typography variant="h6">{chunk.validatedUsers}</Typography>
                </Grid>
                <Grid item xs={6} md={2}>
                  <Typography variant="body2" color="text.secondary">Migrated</Typography>
                  <Typography variant="h6" color="success.main">{chunk.migratedUsers}</Typography>
                </Grid>
                <Grid item xs={6} md={2}>
                  <Typography variant="body2" color="text.secondary">Failed</Typography>
                  <Typography variant="h6" color="error.main">{chunk.failedUsers}</Typography>
                </Grid>
                <Grid item xs={6} md={2}>
                  <Typography variant="body2" color="text.secondary">
                    {chunk.status === 'fetching' ? 'Fetch Progress' : 'Duration'}
                  </Typography>
                  <Typography variant="h6">
                    {chunk.status === 'fetching' && chunk.fetchProgress !== undefined ? 
                      `${chunk.fetchProgress}%` :
                      chunk.startTime && chunk.endTime ? 
                        formatTime((chunk.endTime.getTime() - chunk.startTime.getTime()) / 1000) : 
                        chunk.startTime ? '⏱️ Running...' : '-'
                    }
                  </Typography>
                </Grid>
                <Grid item xs={6} md={2}>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                    {chunk.status === 'fetching' ? '🔍 Fetching' :
                     chunk.status === 'validating' ? '✅ Validating' :
                     chunk.status === 'migrating' ? '🚀 Migrating' :
                     chunk.status === 'completed' ? '✅ Complete' :
                     chunk.status === 'failed' ? '❌ Failed' : chunk.status}
                  </Typography>
                </Grid>
              </Grid>
              {chunk.error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {chunk.error}
                </Alert>
              )}
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Paper>
  );

  const renderResultsStep = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>🎉 Processing Complete!</Typography>
      
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="primary.main">
                {migrationResults.summary.totalProcessed.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">Total Processed</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="success.main">
                {migrationResults.summary.totalSuccess.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">Successful</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="error.main">
                {migrationResults.summary.totalFailed.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">Failed</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="info.main">
                {formatTime(migrationResults.summary.processingTime)}
              </Typography>
              <Typography variant="body2" color="text.secondary">Processing Time</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Results Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={resultTab} onChange={(_, newValue) => setResultTab(newValue)}>
          <Tab label={`Success (${migrationResults.success.length.toLocaleString()})`} />
          <Tab label={`Failures (${migrationResults.failure.length.toLocaleString()})`} />
          <Tab label="Processing Log" />
        </Tabs>
      </Box>

      <TabPanel value={resultTab} index={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" color="success.main">✅ Successfully Migrated Users</Typography>
          <Button 
            variant="outlined" 
            startIcon={<DownloadIcon />} 
            onClick={() => handleDownloadResults('success')}
            color="success"
          >
            Download Success Report
          </Button>
        </Box>
        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>First Name</TableCell>
                <TableCell>Last Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>User ID</TableCell>
                <TableCell>From Channel</TableCell>
                <TableCell>To Channel</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {migrationResults.success.slice(0, 1000).map((user, i) => (
                <TableRow key={user.userId || i}>
                  <TableCell>{user.firstName || '-'}</TableCell>
                  <TableCell>{user.lastName || '-'}</TableCell>
                  <TableCell>{user.profileDetails?.personalDetails?.primaryEmail || user.email || '-'}</TableCell>
                  <TableCell>{user.profileDetails?.personalDetails?.mobile || user.phone || '-'}</TableCell>
                  <TableCell>{user.userId || '-'}</TableCell>
                  <TableCell>{user.channel || '-'}</TableCell>
                  <TableCell>{(user as any).targetChannel || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {migrationResults.success.length > 1000 && (
            <Alert severity="info" sx={{ m: 2 }}>
              Showing first 1,000 results. Download the full report to see all {migrationResults.success.length.toLocaleString()} successful migrations.
            </Alert>
          )}
        </TableContainer>
      </TabPanel>

      <TabPanel value={resultTab} index={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" color="error.main">❌ Failed Migrations</Typography>
          <Button 
            variant="outlined" 
            startIcon={<DownloadIcon />} 
            onClick={() => handleDownloadResults('failure')}
            color="error"
          >
            Download Error Report
          </Button>
        </Box>
        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>User ID</TableCell>
                <TableCell>Target Channel</TableCell>
                <TableCell>Chunk</TableCell>
                <TableCell>Reason for Failure</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {migrationResults.failure.slice(0, 1000).map((item, i) => (
                <TableRow key={i}>
                  <TableCell>{item.email || '-'}</TableCell>
                  <TableCell>{item.phone || '-'}</TableCell>
                  <TableCell>{item.userId || '-'}</TableCell>
                  <TableCell>{item.channel || '-'}</TableCell>
                  <TableCell>
                    <Chip label={`Chunk ${item.chunkId}`} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{item.reason}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {migrationResults.failure.length > 1000 && (
            <Alert severity="info" sx={{ m: 2 }}>
              Showing first 1,000 results. Download the full report to see all {migrationResults.failure.length.toLocaleString()} failures.
            </Alert>
          )}
        </TableContainer>
      </TabPanel>

      <TabPanel value={resultTab} index={2}>
        <Typography variant="subtitle1" gutterBottom>📋 Chunk Processing Log</Typography>
        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
          {processingState.chunks.map((chunk) => (
            <Card key={chunk.chunkId} sx={{ mb: 1 }}>
              <CardContent sx={{ py: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">
                    <strong>Chunk {chunk.chunkId}</strong> ({chunk.totalUsers} users)
                  </Typography>
                  <Chip
                    label={chunk.status}
                    color={
                      chunk.status === 'completed' ? 'success' :
                      chunk.status === 'failed' ? 'error' :
                      'default'
                    }
                    size="small"
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  ✅ {chunk.migratedUsers} migrated • ❌ {chunk.failedUsers} failed
                  {chunk.startTime && chunk.endTime && (
                    <> • ⏱️ {formatTime((chunk.endTime.getTime() - chunk.startTime.getTime()) / 1000)}</>
                  )}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </TabPanel>

      <Divider sx={{ my: 3 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button onClick={reset} variant="outlined" size="large">
          Start New Migration
        </Button>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {migrationResults.success.length > 0 && (
            <Button 
              variant="contained" 
              startIcon={<DownloadIcon />} 
              onClick={() => handleDownloadResults('success')}
              color="success"
            >
              Download Success Report
            </Button>
          )}
          {migrationResults.failure.length > 0 && (
            <Button 
              variant="outlined" 
              startIcon={<DownloadIcon />} 
              onClick={() => handleDownloadResults('failure')}
              color="error"
            >
              Download Error Report
            </Button>
          )}
        </Box>
      </Box>
    </Paper>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🚀 Bulk Migrate Users V2 - Large File Support
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Process large CSV files with up to {MAX_USERS.toLocaleString()} users using chunk-based processing
      </Typography>

      {/* Step Indicator */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stepper activeStep={
          currentStep === 'upload' ? 0 :
          currentStep === 'preview' ? 1 :
          currentStep === 'processing' ? 2 : 3
        } alternativeLabel>
          <Step>
            <StepLabel>Upload File</StepLabel>
          </Step>
          <Step>
            <StepLabel>Preview & Configure</StepLabel>
          </Step>
          <Step>
            <StepLabel>Process Chunks</StepLabel>
          </Step>
          <Step>
            <StepLabel>View Results</StepLabel>
          </Step>
        </Stepper>
      </Paper>

      {/* Step Content */}
      {currentStep === 'upload' && renderUploadStep()}
      {currentStep === 'preview' && renderPreviewStep()}
      {currentStep === 'processing' && renderProcessingStep()}
      {currentStep === 'results' && renderResultsStep()}
    </Box>
  );
};
