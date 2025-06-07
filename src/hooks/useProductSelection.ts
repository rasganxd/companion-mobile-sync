
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';

interface Product {
  id: string;
  name: string;
  price: number;
  code: number;
  stock: number;
  unit?: string;
  cost?: number;
}

interface OrderItem {
  id: number;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  code: string;
  unit: string;
}

export const useProductSelection = (onAddItem: (item: OrderItem) => void) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const db = getDatabaseAdapter();
      const productsData = await db.getProducts();
      console.log('📦 Produtos carregados:', productsData);
      setProducts(productsData || []);
    } catch (error) {
      console.error('❌ Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar produtos');
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toString().includes(searchTerm)
  );

  const selectProduct = (product: Product) => {
    setSelectedProduct(product);
    setUnitPrice(product.price);
  };

  const addProduct = () => {
    if (!selectedProduct || quantity <= 0) {
      toast.error('Selecione um produto e quantidade válida');
      return;
    }

    const newItem: OrderItem = {
      id: Date.now(),
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity,
      price: unitPrice || selectedProduct.price,
      code: selectedProduct.code.toString(),
      unit: selectedProduct.unit || 'UN'
    };

    onAddItem(newItem);
    
    // Limpar seleção
    setSelectedProduct(null);
    setQuantity(1);
    setUnitPrice(0);
    setSearchTerm('');
  };

  return {
    products: filteredProducts,
    selectedProduct,
    quantity,
    unitPrice,
    searchTerm,
    selectProduct,
    setQuantity,
    setUnitPrice,
    setSearchTerm,
    addProduct,
    clearSelection: () => {
      setSelectedProduct(null);
      setQuantity(1);
      setUnitPrice(0);
      setSearchTerm('');
    }
  };
};
