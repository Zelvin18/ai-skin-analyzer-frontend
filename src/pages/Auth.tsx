import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  FormControl,
  FormLabel,
  Input,
  Button,
  HStack,
  useToast,
  InputGroup,
  InputRightElement,
  IconButton,
  Select,
  Checkbox,
  SimpleGrid,
  useColorModeValue,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { motion } from 'framer-motion';

interface SkinType {
  dry: boolean;
  oily: boolean;
  combination: boolean;
  normal: boolean;
  sensitive: boolean;
  [key: string]: boolean;
}

interface SkinConcerns {
  acne: boolean;
  aging: boolean;
  pigmentation: boolean;
  redness: boolean;
  dullness: boolean;
  [key: string]: boolean;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  age: string;
  sex: string;
  country: string;
  password: string;
  confirmPassword: string;
  skinType: SkinType;
  skinConcerns: SkinConcerns;
}

const MotionBox = motion(Box);

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    age: '',
    sex: '',
    country: '',
    password: '',
    confirmPassword: '',
    skinType: {
      dry: false,
      oily: false,
      combination: false,
      normal: false,
      sensitive: false
    },
    skinConcerns: {
      acne: false,
      aging: false,
      pigmentation: false,
      redness: false,
      dullness: false
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (category: 'skinType' | 'skinConcerns', name: string) => {
    setFormData(prev => {
      const newData = { ...prev };
      if (category === 'skinType') {
        newData.skinType = {
          ...prev.skinType,
          [name]: !prev.skinType[name]
        };
      } else {
        newData.skinConcerns = {
          ...prev.skinConcerns,
          [name]: !prev.skinConcerns[name]
        };
      }
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLogin) {
      // Registration validation
      if (formData.password !== formData.confirmPassword) {
        toast({
          title: 'Passwords do not match',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      try {
        // Format the data for the backend
        const registrationData = {
          email: formData.email,
          password: formData.password,
          first_name: formData.firstName,
          last_name: formData.lastName,
          username: formData.email.split('@')[0],
          age: parseInt(formData.age) || null,
          sex: formData.sex || null,
          country: formData.country || null,
          skin_type: Object.entries(formData.skinType)
            .filter(([_, value]) => value)
            .map(([key]) => key),
          skin_concerns: Object.entries(formData.skinConcerns)
            .filter(([_, value]) => value)
            .map(([key]) => key)
        };

        const response = await fetch('http://127.0.0.1:8000/api/users/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(registrationData),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || 'Registration failed');
        }

        if (data.tokens) {
          localStorage.setItem('access_token', data.tokens.access);
          localStorage.setItem('refresh_token', data.tokens.refresh);
        }

        toast({
          title: 'Account created successfully!',
          description: 'Welcome to AI Skin Analyzer',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        navigate('/');
      } catch (error) {
        toast({
          title: 'Registration failed',
          description: error instanceof Error ? error.message : 'Please try again later',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } else {
      // Login logic
      try {
        const response = await fetch('http://127.0.0.1:8000/api/token/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || 'Invalid credentials');
        }

        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);

        toast({
          title: 'Login successful!',
          description: 'Welcome back to AI Skin Analyzer',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        navigate('/');
      } catch (error) {
        toast({
          title: 'Login failed',
          description: error instanceof Error ? error.message : 'Please try again later',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  return (
    <Box
      minH="100vh"
      bgGradient="linear(to-r, pink.50, white)"
      py={8}
    >
      <Container maxW="7xl">
        <Box
          bg="white"
          borderRadius="3xl"
          overflow="hidden"
          boxShadow="2xl"
          mx="auto"
        >
          <VStack
            as="form"
            onSubmit={handleSubmit}
            spacing={6}
            align="stretch"
            w="full"
            maxW="500px"
            mx="auto"
            p={8}
          >
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              textAlign="center"
            >
              <Heading 
                as="h1" 
                size="xl" 
                mb={2}
                color="red.500"
              >
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </Heading>
              <Text color="gray.600">
                {isLogin 
                  ? 'Sign in to continue your skincare journey'
                  : 'Join us to get personalized skincare recommendations'
                }
              </Text>
            </MotionBox>

            {!isLogin && (
              <SimpleGrid columns={2} spacing={4}>
                <FormControl isRequired>
                  <FormLabel>First Name</FormLabel>
                  <Input
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Last Name</FormLabel>
                  <Input
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                  />
                </FormControl>
              </SimpleGrid>
            )}

            <FormControl isRequired>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Password</FormLabel>
              <InputGroup>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                />
                <InputRightElement>
                  <IconButton
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                    variant="ghost"
                    onClick={() => setShowPassword(!showPassword)}
                  />
                </InputRightElement>
              </InputGroup>
            </FormControl>

            {!isLogin && (
              <>
                <FormControl isRequired>
                  <FormLabel>Confirm Password</FormLabel>
                  <InputGroup>
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                    />
                    <InputRightElement>
                      <IconButton
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        icon={showConfirmPassword ? <ViewOffIcon /> : <ViewIcon />}
                        variant="ghost"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                <FormControl>
                  <FormLabel>Age</FormLabel>
                  <Input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Sex</FormLabel>
                  <Select
                    name="sex"
                    value={formData.sex}
                    onChange={handleInputChange}
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Country</FormLabel>
                  <Input
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Skin Type</FormLabel>
                  <SimpleGrid columns={2} spacing={2}>
                    {Object.entries(formData.skinType).map(([key, value]) => (
                      <Checkbox
                        key={key}
                        isChecked={value}
                        onChange={() => handleCheckboxChange('skinType', key)}
                      >
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </Checkbox>
                    ))}
                  </SimpleGrid>
                </FormControl>

                <FormControl>
                  <FormLabel>Skin Concerns</FormLabel>
                  <SimpleGrid columns={2} spacing={2}>
                    {Object.entries(formData.skinConcerns).map(([key, value]) => (
                      <Checkbox
                        key={key}
                        isChecked={value}
                        onChange={() => handleCheckboxChange('skinConcerns', key)}
                      >
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </Checkbox>
                    ))}
                  </SimpleGrid>
                </FormControl>
              </>
            )}

            <Button
              type="submit"
              colorScheme="red"
              size="lg"
              mt={4}
            >
              {isLogin ? 'Sign In' : 'Create Account'}
            </Button>

            <HStack justify="center" spacing={1}>
              <Text>
                {isLogin ? "Don't have an account?" : 'Already have an account?'}
              </Text>
              <Button
                variant="link"
                colorScheme="red"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </Button>
            </HStack>
          </VStack>
        </Box>
      </Container>
    </Box>
  );
};

export default Auth; 