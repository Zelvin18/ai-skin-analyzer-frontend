import React, { useState, useEffect } from 'react';
import {
  Box,
  Image,
  Input,
  VStack,
  Icon,
  Text,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { FaUpload, FaImage } from 'react-icons/fa';

interface ProductImageProps {
  imageUrl?: string;
  onImageChange?: (file: File) => void;
  onError?: () => void;
  isEditable?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const ProductImage: React.FC<ProductImageProps> = ({
  imageUrl,
  onImageChange,
  onError,
  isEditable = false,
  size = 'md',
}) => {
  const [preview, setPreview] = useState<string | undefined>(imageUrl);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const bgColor = useColorModeValue('gray.50', 'gray.700');

  // Update preview when imageUrl changes
  useEffect(() => {
    setPreview(imageUrl);
    setIsLoading(true);
    setHasError(false);
  }, [imageUrl]);

  const sizeMap = {
    sm: { width: '100px', height: '100px' },
    md: { width: '200px', height: '200px' },
    lg: { width: '300px', height: '300px' },
    xl: { width: '400px', height: '400px' },
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImageChange) {
      // Reset states
      setIsLoading(true);
      setHasError(false);
      
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setHasError(true);
        setIsLoading(false);
        if (onError) onError();
        return;
      }
      
      // Check file type
      if (!file.type.match('image.*')) {
        setHasError(true);
        setIsLoading(false);
        if (onError) onError();
        return;
      }
      
      onImageChange(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
    if (onError) {
      onError();
    }
  };

  // Generate a fallback image URL if the placeholder service is not available
  const getFallbackImageUrl = () => {
    if (!preview) return '';
    
    // If it's a data URL, return it directly
    if (preview.startsWith('data:')) return preview;
    
    // If it's a placeholder URL that's failing, create a local fallback
    if (preview.includes('via.placeholder.com')) {
      // Extract the text from the placeholder URL
      const textMatch = preview.match(/text=([^&]+)/);
      const text = textMatch ? decodeURIComponent(textMatch[1]) : 'Product';
      
      // Create a data URL with a simple colored background and text
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Fill background
        ctx.fillStyle = '#E53E3E';
        ctx.fillRect(0, 0, 300, 300);
        
        // Add text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 150, 150);
        
        return canvas.toDataURL();
      }
    }
    
    return preview;
  };

  return (
    <VStack spacing={2}>
      <Box
        width={sizeMap[size].width}
        height={sizeMap[size].height}
        border="2px dashed"
        borderColor={hasError ? 'red.500' : borderColor}
        borderRadius="lg"
        overflow="hidden"
        position="relative"
        bg={bgColor}
        cursor={isEditable ? 'pointer' : 'default'}
        onClick={() => isEditable && document.getElementById('product-image-upload')?.click()}
        _hover={isEditable ? { borderColor: 'red.500' } : undefined}
      >
        {preview && !hasError ? (
          <>
            <Image
              src={getFallbackImageUrl()}
              alt="Product"
              width="100%"
              height="100%"
              objectFit="contain"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
            {isLoading && (
              <Box
                position="absolute"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
              >
                <Spinner size="md" color="red.500" />
              </Box>
            )}
          </>
        ) : (
          <VStack
            height="100%"
            justify="center"
            align="center"
            spacing={2}
          >
            {hasError ? (
              <Alert status="error" borderRadius="md" p={2}>
                <AlertIcon />
                <Text fontSize="xs">Failed to load image</Text>
              </Alert>
            ) : (
              <>
                <Icon as={FaImage} w={8} h={8} color="gray.400" />
                <Text fontSize="sm" color="gray.500">
                  {isEditable ? 'Click to upload image' : 'No image available'}
                </Text>
              </>
            )}
          </VStack>
        )}
        
        {isEditable && (
          <Input
            id="product-image-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            display="none"
          />
        )}
      </Box>
    </VStack>
  );
};

export default ProductImage; 