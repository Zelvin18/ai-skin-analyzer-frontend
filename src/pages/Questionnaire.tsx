import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  SimpleGrid,
  Icon,
  Flex,
  Card,
  CardBody,
  CardHeader,
  useBreakpointValue,
  useColorModeValue,
  FormControl,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
  Progress,
  useToast,
} from '@chakra-ui/react';
import { FaArrowRight, FaArrowLeft } from 'react-icons/fa';
import './Questionnaire.css';

interface Question {
  id: number;
  text: string;
  options: string[];
  category: 'skinType' | 'skinConcerns' | 'lifestyle' | 'medical';
}

const questions: Question[] = [
  {
    id: 1,
    text: 'What is your skin type?',
    options: ['Dry', 'Oily', 'Combination', 'Normal', 'Sensitive'],
    category: 'skinType'
  },
  {
    id: 2,
    text: 'What are your main skin concerns?',
    options: ['Acne', 'Aging', 'Pigmentation', 'Redness', 'Dullness'],
    category: 'skinConcerns'
  },
  {
    id: 3,
    text: 'How often do you spend time outdoors?',
    options: ['Rarely', 'Sometimes', 'Often', 'Very Often'],
    category: 'lifestyle'
  },
  {
    id: 4,
    text: 'Do you have any medical conditions affecting your skin?',
    options: ['None', 'Eczema', 'Psoriasis', 'Rosacea', 'Other'],
    category: 'medical'
  }
];

interface Answers {
  [key: string]: string;
}

const Questionnaire: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [progress, setProgress] = useState(0);
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  const handleAnswer = (value: string) => {
    const question = questions[currentQuestion];
    setAnswers(prev => ({
      ...prev,
      [question.category]: value
    }));
  };
  
  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setProgress(((currentQuestion + 1) / questions.length) * 100);
    } else {
      // Submit answers
      handleSubmit();
    }
  };
  
  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      setProgress(((currentQuestion - 1) / questions.length) * 100);
    }
  };
  
  const handleSubmit = () => {
    // Here you would typically send the answers to your backend
    console.log('Answers:', answers);
    
    toast({
      title: 'Questionnaire completed',
      description: 'Thank you for providing your information!',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    
    // Navigate to results or next step
    navigate('/analysis');
  };
  
  const currentQuestionData = questions[currentQuestion];
  
  return (
    <Box className="app-container">
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <Box textAlign="center">
            <Heading size="xl" mb={4}>Skin Analysis Questionnaire</Heading>
            <Text fontSize="lg" color="gray.600" maxW="800px" mx="auto">
              Help us understand your skin better by answering a few questions
            </Text>
          </Box>
          
          <Progress 
            value={progress} 
            colorScheme="red" 
            size="sm" 
            borderRadius="full"
          />
          
          <Card 
            borderRadius="xl" 
            overflow="hidden" 
            boxShadow="lg"
            bg={cardBg}
            borderColor={borderColor}
          >
            <CardHeader bg="red.50">
              <Heading size="md">Question {currentQuestion + 1} of {questions.length}</Heading>
            </CardHeader>
            
            <CardBody>
              <VStack spacing={6} align="stretch">
                <Text fontSize="xl" fontWeight="medium">
                  {currentQuestionData.text}
                </Text>
                
                <RadioGroup
                  value={answers[currentQuestionData.category] || ''}
                  onChange={handleAnswer}
                >
                  <Stack spacing={4}>
                    {currentQuestionData.options.map((option) => (
                      <Radio key={option} value={option}>
                        {option}
                      </Radio>
                    ))}
                  </Stack>
                </RadioGroup>
                
                <HStack justify="space-between" mt={8}>
                  <Button
                    leftIcon={<Icon as={FaArrowLeft} />}
                    onClick={handlePrevious}
                    isDisabled={currentQuestion === 0}
                    variant="outline"
                    colorScheme="red"
                  >
                    Previous
                  </Button>
                  
                  <Button
                    rightIcon={<Icon as={FaArrowRight} />}
                    onClick={handleNext}
                    colorScheme="red"
                    isDisabled={!answers[currentQuestionData.category]}
                  >
                    {currentQuestion === questions.length - 1 ? 'Submit' : 'Next'}
                  </Button>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
};

export default Questionnaire; 