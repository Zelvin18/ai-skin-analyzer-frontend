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
} from '@chakra-ui/react';
import { FaCamera, FaUpload, FaCheck, FaLightbulb, FaExclamationTriangle } from 'react-icons/fa';
import axios from 'axios';
import './SkinAnalysis.css';

const SkinAnalysis = () => {
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
        description: 'Please select an image or take a photo first',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // First, upload the image to our backend
      const formData = new FormData();
      formData.append('image', file);
      
      // Get the auth token
      const token = localStorage.getItem('access_token');
      
      // Upload the image
      const uploadResponse = await axios.post(
        'http://127.0.0.1:8000/api/images/',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          },
        }
      );
      
      console.log('Image uploaded successfully:', uploadResponse.data);
      
      // Then analyze the uploaded image
      const imageId = uploadResponse.data.id;
      const analyzeResponse = await axios.post(
        `http://127.0.0.1:8000/api/images/${imageId}/analyze/`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          timeout: 120000 // 120 seconds timeout
        }
      );
      
      console.log('Analysis response:', analyzeResponse.data);
      
      // Navigate to results page with the data
      navigate('/results', { 
        state: { 
          result: analyzeResponse.data,
          image: preview
        } 
      });
      
    } catch (error) {
      console.error('Error analyzing image:', error);
      
      // Handle specific error cases
      let errorMessage = 'Failed to analyze image. Please try again.';
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          errorMessage = 'The analysis is taking longer than expected. Please try again with a smaller image or try again later.';
        } else if (error.response) {
          // The request was made and the server responded with a status code
          console.error('Error response:', error.response.data);
          errorMessage = error.response.data.error || errorMessage;
        } else if (error.request) {
          // The request was made but no response was received
          console.error('No response received:', error.request);
          errorMessage = 'No response from server. Please check your internet connection and try again.';
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error('Error setting up request:', error.message);
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      toast({
        title: 'Error',
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
                <Text cursor="pointer" onClick={() => navigate('/')}>Home</Text>
                <Text cursor="pointer">How it Works</Text>
                <Text cursor="pointer">About</Text>
                <Text cursor="pointer">Contact</Text>
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
                Upload a photo or take a picture of your skin to get an AI-powered analysis and personalized recommendations.
              </Text>
            </Box>

            <Box maxW="1000px" mx="auto" width="100%">
              <Tabs variant="enclosed" colorScheme="red" isFitted>
                <TabList mb="1em">
                  <Tab>
                    <Icon as={FaUpload} mr={2} />
                    Upload Photo
                  </Tab>
                  <Tab>
                    <Icon as={FaCamera} mr={2} />
                    Take Photo
                  </Tab>
                </TabList>
                
                <TabPanels>
                  {/* Upload Tab */}
                  <TabPanel>
                    <Card 
                      borderRadius="xl" 
                      overflow="hidden" 
                      boxShadow="lg"
                      bg={cardBg}
                      borderColor={borderColor}
                    >
                      <CardBody>
                        <VStack spacing={6}>
                          <Box 
                            border="2px dashed" 
                            borderColor="gray.300" 
                            borderRadius="md" 
                            p={8} 
                            width="100%" 
                            textAlign="center"
                            cursor="pointer"
                            _hover={{ borderColor: 'red.500' }}
                            onClick={() => document.getElementById('file-upload')?.click()}
                          >
                            <Input 
                              id="file-upload" 
                              type="file" 
                              accept="image/*" 
                              onChange={handleFileChange} 
                              display="none" 
                            />
                            <VStack spacing={4}>
                              <Icon as={FaUpload} w={10} h={10} color="gray.400" />
                              <Text fontSize="lg">Click to upload or drag and drop</Text>
                              <Text fontSize="sm" color="gray.500">PNG, JPG, JPEG up to 10MB</Text>
                            </VStack>
                          </Box>
                          
                          {preview && (
                            <Box width="100%" maxW="400px" mx="auto">
                              <Image 
                                src={preview} 
                                alt="Preview" 
                                borderRadius="md" 
                                width="100%" 
                                objectFit="cover"
                              />
                            </Box>
                          )}
                        </VStack>
                      </CardBody>
                    </Card>
                  </TabPanel>
                  
                  {/* Camera Tab */}
                  <TabPanel>
                    <Card 
                      borderRadius="xl" 
                      overflow="hidden" 
                      boxShadow="lg"
                      bg={cardBg}
                      borderColor={borderColor}
                    >
                      <CardBody>
                        <VStack spacing={6}>
                          {!cameraActive ? (
                            <Button 
                              colorScheme="red" 
                              size="lg" 
                              leftIcon={<Icon as={FaCamera} />}
                              onClick={startCamera}
                              width="100%"
                              maxW="300px"
                            >
                              Start Camera
                            </Button>
                          ) : (
                            <VStack spacing={4} width="100%">
                              <Box 
                                width="100%" 
                                maxW="400px" 
                                mx="auto" 
                                borderRadius="md" 
                                overflow="hidden"
                                boxShadow="md"
                                position="relative"
                                height="300px"
                                bg="black"
                              >
                                {cameraActive && (
                                  <video 
                                    ref={videoRef} 
                                    style={{ 
                                      width: '100%', 
                                      height: '100%',
                                      objectFit: 'cover',
                                      transform: 'scaleX(-1)' // Mirror the video for selfie view
                                    }}
                                    autoPlay
                                    muted
                                    playsInline
                                  />
                                )}
                              </Box>
                              
                              <HStack spacing={4}>
                                <Button 
                                  colorScheme="red" 
                                  onClick={capturePhoto}
                                  leftIcon={<Icon as={FaCamera} />}
                                >
                                  Take Photo
                                </Button>
                                <Button 
                                  variant="outline" 
                                  onClick={stopCamera}
                                >
                                  Cancel
                                </Button>
                              </HStack>
                            </VStack>
                          )}
                          
                          {preview && !cameraActive && (
                            <Box width="100%" maxW="400px" mx="auto">
                              <Image 
                                src={preview} 
                                alt="Preview" 
                                borderRadius="md" 
                                width="100%" 
                                objectFit="cover"
                              />
                            </Box>
                          )}
                        </VStack>
                      </CardBody>
                    </Card>
                  </TabPanel>
                </TabPanels>
              </Tabs>
              
              {/* Guidelines Card */}
              <Card 
                mt={8} 
                borderRadius="xl" 
                overflow="hidden" 
                boxShadow="lg"
                bg={cardBg}
                borderColor={borderColor}
              >
                <CardHeader bg="red.50">
                  <Heading size="md">Photo Guidelines</Heading>
                </CardHeader>
                <CardBody>
                  <VStack align="start" spacing={4}>
                    <List spacing={3} width="100%">
                      <ListItem>
                        <ListIcon as={FaCheck} color="green.500" />
                        <Text as="span" fontWeight="medium">Good lighting:</Text> Take the photo in a well-lit area, preferably with natural light
                      </ListItem>
                      <ListItem>
                        <ListIcon as={FaCheck} color="green.500" />
                        <Text as="span" fontWeight="medium">Close-up:</Text> Get a clear, close-up shot of the area you want to analyze
                      </ListItem>
                      <ListItem>
                        <ListIcon as={FaCheck} color="green.500" />
                        <Text as="span" fontWeight="medium">Focus:</Text> Ensure the image is in focus and not blurry
                      </ListItem>
                      <ListItem>
                        <ListIcon as={FaCheck} color="green.500" />
                        <Text as="span" fontWeight="medium">Clean skin:</Text> Make sure your skin is clean and free of makeup or products
                      </ListItem>
                    </List>
                    
                    <Alert status="info" borderRadius="md">
                      <AlertIcon />
                      <Text>For best results, take photos of specific areas of concern rather than your entire face.</Text>
                    </Alert>
                  </VStack>
                </CardBody>
              </Card>
              
              {/* Analyze Button */}
              <Box mt={8} textAlign="center">
                <Button
                  colorScheme="red"
                  size="lg"
                  onClick={analyzeImage}
                  isLoading={isLoading}
                  loadingText="Analyzing..."
                  width="100%"
                  maxW="300px"
                  isDisabled={!file}
                >
                  Analyze Skin
                </Button>
                
                {error && (
                  <Alert status="error" mt={4} borderRadius="md">
                    <AlertIcon />
                    {error}
                  </Alert>
                )}
              </Box>
            </Box>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
};

export default SkinAnalysis; 