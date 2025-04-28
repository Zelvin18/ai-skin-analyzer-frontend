import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Container, 
  Heading, 
  Text, 
  VStack, 
  HStack, 
  Image, 
  useBreakpointValue,
  Input,
  useToast,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Icon,
  Flex,
  List,
  ListItem,
  ListIcon,
  Divider,
  useColorModeValue,
  SimpleGrid,
  Badge,
} from '@chakra-ui/react';
import { FaCamera, FaUpload, FaCheck, FaLightbulb, FaExclamationTriangle, FaShoppingCart, FaArrowLeft } from 'react-icons/fa';
import axios from 'axios';
import './SkinAnalysis.css';
import { SkinAnalysisResult } from '../types/index';

const SkinAnalysis: React.FC = () => {
  const navigate = useNavigate();
  const isDesktop = useBreakpointValue({ base: false, lg: true });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const toast = useToast();
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Clean up camera stream when component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
      
      // Reset states
      setError(null);
    }
  };

  const startCamera = async () => {
    try {
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Set camera active first to ensure the video element is rendered
      setCameraActive(true);
      
      // Log available devices to help diagnose the issue
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      console.log('Available video devices:', videoDevices);
      
      // Try to get the front camera specifically
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user', // Specifically request front camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      console.log('Camera stream obtained:', stream);
      
      // Store the stream reference
      streamRef.current = stream;
      
      // Wait a short time for the DOM to update and the video element to be rendered
      setTimeout(async () => {
        // Set the stream to the video element
        if (videoRef.current) {
          console.log('Setting video source');
          videoRef.current.srcObject = stream;
          
          // Set properties directly on the element
          videoRef.current.setAttribute('autoplay', 'true');
          videoRef.current.setAttribute('muted', 'true');
          videoRef.current.setAttribute('playsinline', 'true');
          
          // Add event listeners for debugging
          videoRef.current.onloadedmetadata = () => {
            console.log('Video metadata loaded');
          };
          
          videoRef.current.onloadeddata = () => {
            console.log('Video data loaded');
          };
          
          videoRef.current.onerror = (err) => {
            console.error('Video error:', err);
          };
          
          // Try to play the video
          try {
            console.log('Attempting to play video');
            await videoRef.current.play();
            console.log('Video playing successfully');
          } catch (playError) {
            console.error('Error playing video:', playError);
            
            // Show a message to the user
            toast({
              title: 'Camera started',
              description: 'Please click anywhere on the screen to enable camera',
              status: 'info',
              duration: 3000,
              isClosable: true,
            });
            
            // Add a one-time click handler to play the video
            const playOnClick = async () => {
              try {
                if (videoRef.current) {
                  console.log('Attempting to play video after user interaction');
                  await videoRef.current.play();
                  console.log('Video playing after user interaction');
                  document.removeEventListener('click', playOnClick);
                }
              } catch (err) {
                console.error('Still couldn\'t play video after user interaction:', err);
              }
            };
            
            document.addEventListener('click', playOnClick);
          }
        } else {
          console.error('Video element reference is null');
          // Try to find the video element directly
          const videoElement = document.querySelector('video');
          if (videoElement) {
            console.log('Found video element directly');
            videoElement.srcObject = stream;
            videoElement.setAttribute('autoplay', 'true');
            videoElement.setAttribute('muted', 'true');
            videoElement.setAttribute('playsinline', 'true');
            
            try {
              await videoElement.play();
              console.log('Video playing successfully via direct element');
            } catch (err) {
              console.error('Error playing video via direct element:', err);
            }
          } else {
            console.error('Could not find video element in DOM');
          }
        }
        
        // Show success message
        toast({
          title: 'Camera started',
          description: 'Your camera is now active',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      }, 500); // Wait 500ms for the DOM to update
      
    } catch (err) {
      console.error('Error accessing camera:', err);
      toast({
        title: 'Camera access denied',
        description: 'Please allow camera access to take a photo',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        
        // Convert to file
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
            setFile(file);
            setPreview(canvas.toDataURL('image/jpeg'));
            
            // Show success message
            toast({
              title: 'Photo captured',
              description: 'Your photo has been captured successfully',
              status: 'success',
              duration: 2000,
              isClosable: true,
            });
          }
        }, 'image/jpeg', 0.9);
      }
      
      stopCamera();
    }
  };

  const analyzeImage = async () => {
    if (!file) {
      toast({
        title: 'No image selected',
        description: 'Please select an image first',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      
      // Log the request details
      console.log('Sending request to AI model with file:', file.name, file.type, file.size);
      
      // Send request to AI model
      const response = await axios.post<SkinAnalysisResult>(
        'http://localhost:5000/predict',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000, // 60 second timeout
        }
      );
      
      console.log('AI Model Response:', response.data);
      
      // Navigate to results page with the analysis result
      navigate('/results', { 
        state: { 
          result: response.data,
          image: preview
        }
      });
      
    } catch (error) {
      console.error('Error analyzing image:', error);
      
      let errorMessage = 'An unknown error occurred';
      if (axios.isAxiosError(error)) {
        if (error.response) {
          errorMessage = `Server error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`;
        } else if (error.request) {
          errorMessage = 'No response received from AI model. Please check your internet connection.';
        } else {
          errorMessage = `Request error: ${error.message}`;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      
      toast({
        title: 'Analysis failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box className="app-container">
      {/* Header */}
      <Box py={4} className="nav-header">
        <Container maxW="container.xl">
          <HStack justify="space-between" align="center">
            <Text fontSize="xl" fontWeight="bold" cursor="pointer" onClick={() => navigate('/')}>
              <span style={{ color: '#E53E3E' }}>GET</span>
              <span style={{ color: '#000000' }}>SKIN</span>
              <span style={{ color: '#E53E3E' }}>BEAUTY</span>
            </Text>
            {isDesktop && (
              <HStack spacing={8}>
                <Text cursor="pointer" onClick={() => navigate('/how-it-works')}>How it Works</Text>
                <Text cursor="pointer" onClick={() => navigate('/about')}>About</Text>
                <Text cursor="pointer" onClick={() => navigate('/contact')}>Contact</Text>
              </HStack>
            )}
          </HStack>
        </Container>
      </Box>

      {/* Main Content */}
      <Box className="main-content" py={8}>
        <Container maxW="container.xl">
          <VStack spacing={8} align="stretch">
            <Box textAlign="center">
              <Heading size="xl" mb={4}>Skin Analysis</Heading>
              <Text fontSize="lg" color="gray.600" maxW="800px" mx="auto">
                Upload a photo or take a picture of your skin for AI-powered analysis
              </Text>
            </Box>
            
            <Button 
              leftIcon={<Icon as={FaArrowLeft} />} 
              variant="outline" 
              colorScheme="red" 
              alignSelf="flex-start"
              onClick={() => navigate('/')}
            >
              Back to Home
            </Button>
            
            <Card 
              borderRadius="xl" 
              overflow="hidden" 
              boxShadow="lg"
              bg={cardBg}
              borderColor={borderColor}
            >
              <CardHeader bg="red.50">
                <Heading size="md">Upload or Take Photo</Heading>
              </CardHeader>
              
              <CardBody>
                <VStack spacing={6}>
                  {cameraActive ? (
                    <Box position="relative" width="100%" maxW="500px" mx="auto">
                      <video
                        ref={videoRef}
                        style={{
                          width: '100%',
                          borderRadius: '0.5rem',
                          transform: 'scaleX(-1)', // Mirror the video
                        }}
                      />
                      <Button
                        position="absolute"
                        bottom="1rem"
                        left="50%"
                        transform="translateX(-50%)"
                        colorScheme="red"
                        onClick={capturePhoto}
                      >
                        Capture Photo
                      </Button>
                    </Box>
                  ) : (
                    <Box
                      className="camera-preview"
                      position="relative"
                      width="100%"
                      maxW="500px"
                      mx="auto"
                    >
                      {preview ? (
                        <Image
                          src={preview}
                          alt="Preview"
                          width="100%"
                          height="100%"
                          objectFit="cover"
                          borderRadius="lg"
                        />
                      ) : (
                        <Box
                          width="100%"
                          height="100%"
                          bg="gray.100"
                          borderRadius="lg"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <VStack spacing={4}>
                            <Icon as={FaCamera} w={12} h={12} color="gray.400" />
                            <Text color="gray.500">
                              No image selected
                            </Text>
                          </VStack>
                        </Box>
                      )}
                    </Box>
                  )}
                  
                  <HStack spacing={4} width="100%" justify="center">
                    <Button
                      leftIcon={<Icon as={FaUpload} />}
                      onClick={() => document.getElementById('file-upload')?.click()}
                      isDisabled={cameraActive}
                    >
                      Upload Photo
                    </Button>
                    <Button
                      leftIcon={<Icon as={FaCamera} />}
                      onClick={cameraActive ? stopCamera : startCamera}
                      colorScheme={cameraActive ? 'red' : 'blue'}
                    >
                      {cameraActive ? 'Stop Camera' : 'Take Photo'}
                    </Button>
                  </HStack>
                  
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  
                  {error && (
                    <Alert status="error" borderRadius="md">
                      <AlertIcon />
                      {error}
                    </Alert>
                  )}
                  
                  {isLoading && (
                    <Center py={4}>
                      <VStack>
                        <Spinner size="xl" color="red.500" />
                        <Text mt={2}>Analyzing your image...</Text>
                      </VStack>
                    </Center>
                  )}
                </VStack>
              </CardBody>
              
              <CardFooter>
                <Button
                  colorScheme="red"
                  size="lg"
                  width="100%"
                  onClick={analyzeImage}
                  isDisabled={!file || isLoading}
                  isLoading={isLoading}
                  loadingText="Analyzing..."
                >
                  Analyze Image
                </Button>
              </CardFooter>
            </Card>
            
            {/* Tips Card */}
            <Card 
              borderRadius="xl" 
              overflow="hidden" 
              boxShadow="lg"
              bg={cardBg}
              borderColor={borderColor}
            >
              <CardHeader bg="blue.50">
                <Heading size="md" color="blue.800">Tips for Best Results</Heading>
              </CardHeader>
              
              <CardBody>
                <List spacing={3}>
                  <ListItem>
                    <ListIcon as={FaCheck} color="green.500" />
                    Ensure good lighting for clear visibility
                  </ListItem>
                  <ListItem>
                    <ListIcon as={FaCheck} color="green.500" />
                    Keep your face centered in the frame
                  </ListItem>
                  <ListItem>
                    <ListIcon as={FaCheck} color="green.500" />
                    Remove any makeup or filters
                  </ListItem>
                  <ListItem>
                    <ListIcon as={FaCheck} color="green.500" />
                    Use a neutral background
                  </ListItem>
                </List>
              </CardBody>
            </Card>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
};

export default SkinAnalysis; 