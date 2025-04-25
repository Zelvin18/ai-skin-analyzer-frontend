import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Container, 
  Heading, 
  Text, 
  VStack, 
  HStack, 
  useBreakpointValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Icon,
  Flex,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Card,
  CardBody,
  CardHeader,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useToast,
  Badge,
  Image,
  useColorModeValue,
  Alert,
  AlertIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Spacer,
  IconButton,
  Tooltip,
  Spinner,
  Center,
  SimpleGrid,
  Avatar,
} from '@chakra-ui/react';
import { FaPlus, FaEdit, FaTrash, FaImage, FaShoppingBag, FaUsers, FaChartBar, FaSync, FaUserSlash, FaUserCheck, FaUserTimes, FaUserMd } from 'react-icons/fa';
import { AddIcon, EditIcon, DeleteIcon, ViewIcon } from '@chakra-ui/icons';
import axios from 'axios';
import './AdminDashboard.css';
import ProductImage from '../components/ProductImage';
import { productAPI } from '../services/api';

// Initial empty products array (will be populated from API)
const initialProducts: any[] = [];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const isDesktop = useBreakpointValue({ base: false, lg: true });
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [products, setProducts] = useState(initialProducts);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    brand: 'Aurora Beauty',
    category: '',
    description: '',
    price: '',
    image: '',
    stock: '',
    suitable_for: '',
    targets: '',
    when_to_apply: ''
  });
  
  const [users, setUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Fetch products from the API
  useEffect(() => {
    fetchProducts();
    fetchUsers();
  }, []);
  
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching products from server...');
      const response = await axios.get('http://localhost:8000/api/products/', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      console.log('Server response:', response);
      
      if (!response.data) {
        throw new Error('No data received from server');
      }
      
      setProducts(response.data);
      toast({
        title: 'Products loaded',
        description: `Successfully loaded ${response.data.length} products`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        request: error.request,
        config: error.config
      });
      
      let errorMessage = 'Failed to load products from the server';
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorMessage = `Server error: ${error.response.status} - ${error.response.statusText}`;
        if (error.response.status === 401) {
          // Handle unauthorized access
          navigate('/admin/login');
          return;
        }
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'No response received from server. Please check if the server is running.';
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage = `Error: ${error.message}`;
      }
      
      toast({
        title: 'Error loading products',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await axios.get('http://localhost:8000/api/users/', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      setUsers(response.data);
      toast({
        title: 'Users loaded',
        description: `Successfully loaded ${response.data.length} users`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error('Error loading users:', error);
      toast({
        title: 'Error loading users',
        description: error.message || 'Failed to load users',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleNumberInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const updateProduct = async (productData: any) => {
    try {
      console.log('Updating product:', productData);
      
      // Ensure ID is a string
      const productId = String(productData.id);
      delete productData.id; // Remove id from the payload
      
      const response = await productAPI.updateProduct(productId, productData);
      console.log('Product updated successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating product:', error);
      if (error.response?.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        navigate('/admin/login');
        throw new Error('Session expired. Please login again.');
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to update products.');
      } else {
        throw new Error(error.response?.data?.error || 'Failed to update product');
      }
    }
  };
  
  const updateProductImageInBackend = async (productId: string, imageFile: File) => {
    try {
      console.log('Updating product image in backend for product ID:', productId);
      const response = await productAPI.updateProductImage(productId, imageFile);
      console.log('Product image updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating product image:', error);
      throw error;
    }
  };
  
  const handleImageChange = async (file: File) => {
    try {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Image too large",
          description: "Please select an image under 5MB",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      // If we're editing an existing product, update the image immediately
      if (selectedProduct?.id) {
        try {
          await updateProductImageInBackend(selectedProduct.id, file);
          toast({
            title: "Image updated successfully",
            status: "success",
            duration: 3000,
            isClosable: true,
          });
        } catch (error) {
          console.error('Error updating product image:', error);
          toast({
            title: "Failed to update product image",
            description: error instanceof Error ? error.message : "Please try again",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
        }
      }
      
      // Update the form data with the new image
      setFormData(prev => ({ ...prev, image: URL.createObjectURL(file) }));
    } catch (error) {
      console.error('Error handling image change:', error);
      toast({
        title: "Error handling image",
        description: error instanceof Error ? error.message : "Please try again",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      brand: 'Aurora Beauty',
      category: '',
      description: '',
      price: '',
      image: '',
      stock: '',
      suitable_for: '',
      targets: '',
      when_to_apply: ''
    });
    setSelectedProduct(null);
  };
  
  const openAddProductModal = () => {
    resetForm();
    onOpen();
  };
  
  const openEditProductModal = (product: any) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name || '',
      brand: product.brand || 'Aurora Beauty',
      category: product.category || '',
      description: product.description || '',
      price: product.price?.toString() || '',
      image: product.image || '',
      stock: product.stock?.toString() || '',
      suitable_for: product.suitable_for || '',
      targets: product.targets || '',
      when_to_apply: product.when_to_apply || ''
    });
    onOpen();
  };
  
  const addProduct = async (productData: any) => {
    try {
      console.log('Adding new product:', productData);
      
      // Ensure ID is a string
      const productDataCopy = { ...productData };
      productDataCopy.id = String(productDataCopy.id);
      
      const response = await fetch('http://localhost:8000/api/products/add/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(productDataCopy),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to add product:', errorData);
        throw new Error(errorData.error || 'Failed to add product');
      }
      
      const data = await response.json();
      console.log('Product added successfully:', data);
      return data.product;
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate form data
      if (!formData.name || !formData.brand || !formData.category || !formData.description || !formData.price || !formData.stock) {
        toast({
          title: "Missing required fields",
          description: "Please fill in all required fields",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        setIsSubmitting(false);
        return;
      }
      
      // Convert price and stock to numbers
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
      };
      
      let updatedProduct;
      
      if (selectedProduct) {
        // Update existing product
        productData.id = selectedProduct.id;
        updatedProduct = await updateProduct(productData);
        
        // Update image if it has changed and is a File object
        if (formData.image && formData.image instanceof File) {
          try {
            await updateProductImageInBackend(updatedProduct.id, formData.image);
            toast({
              title: "Product updated successfully",
              status: "success",
              duration: 3000,
              isClosable: true,
            });
          } catch (error) {
            console.error('Error updating product image:', error);
            toast({
              title: "Product saved but image update failed",
              description: error instanceof Error ? error.message : "Please try updating the image again",
              status: "warning",
              duration: 5000,
              isClosable: true,
            });
          }
        } else {
          toast({
            title: "Product updated successfully",
            status: "success",
            duration: 3000,
            isClosable: true,
          });
        }
      } else {
        // Add new product
        updatedProduct = await addProduct(productData);
        
        // Update image for new product if it's a File object
        if (formData.image && formData.image instanceof File) {
          try {
            await updateProductImageInBackend(updatedProduct.id, formData.image);
            toast({
              title: "Product added successfully",
              status: "success",
              duration: 3000,
              isClosable: true,
            });
          } catch (error) {
            console.error('Error updating product image:', error);
            toast({
              title: "Product saved but image update failed",
              description: error instanceof Error ? error.message : "Please try updating the image again",
              status: "warning",
              duration: 5000,
              isClosable: true,
            });
          }
        } else {
          toast({
            title: "Product added successfully",
            status: "success",
            duration: 3000,
            isClosable: true,
          });
        }
      }
      
      // Refresh products list
      fetchProducts();
      
      // Close modal and reset form
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Error saving product",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteProduct = (id: number) => {
    // Simulate API call (in a real app, this would be an actual API call)
    const updatedProducts = products.filter(p => p.id !== id);
    setProducts(updatedProducts);
    
    toast({
      title: 'Product deleted',
      description: 'Product has been deleted successfully',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      await axios.delete(`http://localhost:8000/api/users/${userId}/`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      setUsers(users.filter(user => user.id !== userId));
      toast({
        title: 'User deleted',
        description: 'User has been deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error deleting user',
        description: error.message || 'Failed to delete user',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleToggleUserStatus = async (userId: number, isActive: boolean) => {
    try {
      await axios.patch(`http://localhost:8000/api/users/${userId}/`, {
        is_active: !isActive
      }, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_active: !isActive } : user
      ));
      
      toast({
        title: isActive ? 'User blocked' : 'User unblocked',
        description: `User has been ${isActive ? 'blocked' : 'unblocked'} successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error('Error updating user status:', error);
      toast({
        title: 'Error updating user status',
        description: error.message || 'Failed to update user status',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
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
              <Badge ml={2} colorScheme="red">Admin</Badge>
            </Text>
            {isDesktop && (
              <HStack spacing={8}>
                <Text cursor="pointer" onClick={() => navigate('/')}>Home</Text>
                <Text cursor="pointer">Logout</Text>
              </HStack>
            )}
          </HStack>
        </Container>
      </Box>

      {/* Main Content */}
      <Box className="main-content" py={8}>
        <Container maxW="container.xl">
          <VStack spacing={8} align="stretch">
            <Box>
              <Heading size="xl" mb={2}>Admin Dashboard</Heading>
              <Text color="gray.600">Manage your products, users, and view analytics</Text>
            </Box>
            
            <Tabs variant="enclosed" colorScheme="red" isFitted>
              <TabList mb="1em">
                <Tab>
                  <Icon as={FaShoppingBag} mr={2} />
                  Products
                </Tab>
                <Tab>
                  <Icon as={FaUsers} mr={2} />
                  Users
                </Tab>
                <Tab>
                  <Icon as={FaChartBar} mr={2} />
                  Analytics
                </Tab>
              </TabList>
              
              <TabPanels>
                {/* Products Tab */}
                <TabPanel>
                  <Card 
                    borderRadius="xl" 
                    overflow="hidden" 
                    boxShadow="lg"
                    bg={cardBg}
                    borderColor={borderColor}
                  >
                    <CardHeader bg="red.50">
                      <Flex justify="space-between" align="center">
                        <Heading size="md">Products</Heading>
                        <Button 
                          colorScheme="red" 
                          leftIcon={<Icon as={FaPlus} />}
                          onClick={openAddProductModal}
                        >
                          Add Product
                        </Button>
                      </Flex>
                    </CardHeader>
                    <CardBody>
                      {isLoading ? (
                        <Center py={8}>
                          <Spinner size="xl" color="red.500" />
                        </Center>
                      ) : (
                        <SimpleGrid columns={{ base: 1, md: 2, lg: 2, xl: 3 }} spacing={8}>
                          {products.map((product) => (
                            <Box
                              key={product.id}
                              borderWidth="1px"
                              borderRadius="lg"
                              overflow="hidden"
                              bg="white"
                              boxShadow="sm"
                              transition="all 0.3s"
                              _hover={{ boxShadow: 'md', transform: 'translateY(-2px)' }}
                            >
                              <Box position="relative" height="250px" overflow="hidden" display="flex" justifyContent="center" alignItems="center" bg="gray.50">
                                {product.image ? (
                                  <ProductImage
                                    imageUrl={product.image}
                                    size="md"
                                  />
                                ) : (
                                  <Box
                                    width="200px"
                                    height="200px"
                                    bg="gray.100"
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                  >
                                    <Text color="gray.500">No image</Text>
                                  </Box>
                                )}
                              </Box>
                              <Box p={5}>
                                <Heading size="md" mb={2} noOfLines={1}>
                                  {product.name}
                                </Heading>
                                <Text color="gray.600" fontSize="sm" mb={2}>
                                  {product.brand} • {product.category}
                                </Text>
                                <Text noOfLines={2} mb={4} fontSize="sm">
                                  {product.description}
                                </Text>
                                <Flex justify="space-between" align="center">
                                  <Text fontWeight="bold" color="blue.600">
                                    ${typeof product.price === 'number' ? product.price.toFixed(2) : '0.00'}
                                  </Text>
                                  <Text fontSize="sm" color={product.stock > 0 ? 'green.500' : 'red.500'}>
                                    {product.stock > 0 ? `In Stock: ${product.stock}` : 'Out of Stock'}
                                  </Text>
                                </Flex>
                                <Flex mt={4} gap={2}>
                                  <Button
                                    size="sm"
                                    colorScheme="blue"
                                    leftIcon={<EditIcon />}
                                    onClick={() => openEditProductModal(product)}
                                    flex={1}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    colorScheme="red"
                                    leftIcon={<DeleteIcon />}
                                    onClick={() => handleDeleteProduct(product.id)}
                                    flex={1}
                                  >
                                    Delete
                                  </Button>
                                </Flex>
                              </Box>
                            </Box>
                          ))}
                        </SimpleGrid>
                      )}
                    </CardBody>
                  </Card>
                </TabPanel>
                
                {/* Users Tab */}
                <TabPanel>
                  <Card 
                    borderRadius="xl" 
                    overflow="hidden" 
                    boxShadow="lg"
                    bg={cardBg}
                    borderColor={borderColor}
                  >
                    <CardHeader bg="red.50">
                      <Flex justify="space-between" align="center">
                        <Heading size="md">Users</Heading>
                        <Button 
                          colorScheme="red" 
                          leftIcon={<Icon as={FaUserMd} />}
                          onClick={fetchUsers}
                        >
                          Refresh Users
                        </Button>
                      </Flex>
                    </CardHeader>
                    <CardBody>
                      {isLoadingUsers ? (
                        <Center py={8}>
                          <Spinner size="xl" color="red.500" />
                        </Center>
                      ) : (
                        <Box overflowX="auto">
                          <Table variant="simple">
                            <Thead>
                              <Tr>
                                <Th>Name</Th>
                                <Th>Email</Th>
                                <Th>Age</Th>
                                <Th>Last Skin Condition</Th>
                                <Th>Status</Th>
                                <Th>Actions</Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              {users.map((user) => (
                                <Tr key={user.id}>
                                  <Td>
                                    <HStack spacing={2}>
                                      <Avatar size="sm" name={`${user.first_name} ${user.last_name}`} />
                                      <Text>{user.first_name} {user.last_name}</Text>
                                    </HStack>
                                  </Td>
                                  <Td>{user.email}</Td>
                                  <Td>{user.age || 'N/A'}</Td>
                                  <Td>
                                    <Badge colorScheme="blue">
                                      {user.last_skin_condition}
                                    </Badge>
                                  </Td>
                                  <Td>
                                    <Badge colorScheme={user.is_active ? 'green' : 'red'}>
                                      {user.is_active ? 'Active' : 'Blocked'}
                                    </Badge>
                                  </Td>
                                  <Td>
                                    <HStack spacing={2}>
                                      <Tooltip label={user.is_active ? 'Block User' : 'Unblock User'}>
                                        <IconButton
                                          aria-label={user.is_active ? 'Block user' : 'Unblock user'}
                                          icon={user.is_active ? <FaUserSlash /> : <FaUserCheck />}
                                          colorScheme={user.is_active ? 'red' : 'green'}
                                          size="sm"
                                          onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                                        />
                                      </Tooltip>
                                      <Tooltip label="Delete User">
                                        <IconButton
                                          aria-label="Delete user"
                                          icon={<FaUserTimes />}
                                          colorScheme="red"
                                          size="sm"
                                          onClick={() => {
                                            if (window.confirm('Are you sure you want to delete this user?')) {
                                              handleDeleteUser(user.id);
                                            }
                                          }}
                                        />
                                      </Tooltip>
                                    </HStack>
                                  </Td>
                                </Tr>
                              ))}
                            </Tbody>
                          </Table>
                        </Box>
                      )}
                    </CardBody>
                  </Card>
                </TabPanel>
                
                {/* Analytics Tab */}
                <TabPanel>
                  <Card 
                    borderRadius="xl" 
                    overflow="hidden" 
                    boxShadow="lg"
                    bg={cardBg}
                    borderColor={borderColor}
                  >
                    <CardHeader bg="red.50">
                      <Heading size="md">Analytics</Heading>
                    </CardHeader>
                    <CardBody>
                      <Alert status="info">
                        <AlertIcon />
                        Analytics dashboard will be implemented in a future update.
                      </Alert>
                    </CardBody>
                  </Card>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </VStack>
        </Container>
      </Box>
      
      {/* Add/Edit Product Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedProduct ? 'Edit Product' : 'Add New Product'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Product Name</FormLabel>
                <Input 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  placeholder="Enter product name" 
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Brand</FormLabel>
                <Input 
                  name="brand" 
                  value={formData.brand} 
                  onChange={handleInputChange} 
                  placeholder="Enter brand name" 
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Category</FormLabel>
                <Input 
                  name="category" 
                  value={formData.category} 
                  onChange={handleInputChange} 
                  placeholder="Enter product category" 
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Description</FormLabel>
                <Textarea 
                  name="description" 
                  value={formData.description} 
                  onChange={handleInputChange} 
                  placeholder="Enter product description" 
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Price ($)</FormLabel>
                <NumberInput 
                  value={formData.price} 
                  onChange={(value) => handleNumberInputChange('price', value)}
                  min={0}
                  precision={2}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Stock</FormLabel>
                <NumberInput 
                  value={formData.stock} 
                  onChange={(value) => handleNumberInputChange('stock', value)}
                  min={0}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
              
              <FormControl>
                <FormLabel>Product Image</FormLabel>
                <ProductImage
                  imageUrl={formData.image}
                  onImageChange={handleImageChange}
                  isEditable={true}
                  size="lg"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Suitable For</FormLabel>
                <Textarea 
                  name="suitable_for" 
                  value={formData.suitable_for} 
                  onChange={handleInputChange} 
                  placeholder="Enter skin types this product is suitable for" 
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Targets</FormLabel>
                <Textarea 
                  name="targets" 
                  value={formData.targets} 
                  onChange={handleInputChange} 
                  placeholder="Enter skin concerns this product targets" 
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>When to Apply</FormLabel>
                <Input 
                  name="when_to_apply" 
                  value={formData.when_to_apply} 
                  onChange={handleInputChange} 
                  placeholder="e.g., AM, PM, AM/PM" 
                />
              </FormControl>
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={handleSubmit} isLoading={isSubmitting}>
              {selectedProduct ? 'Update Product' : 'Add Product'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AdminDashboard; 