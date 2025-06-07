
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';

interface Product {
  id: string;
  name: string;
  price: number;
  sale_price?: number;
  cost_price?: number;
  code: number;
  stock: number;
  unit?: string;
  cost?: number;
  has_subunit?: boolean;
  subunit?: string;
  subunit_ratio?: number;
  main_unit_id?: string;
  sub_unit_id?: string;
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
      
      // Ensure products have the correct price field
      const normalizedProducts = productsData?.map(product => ({
        ...product,
        // Use sale_price as the primary price, fallback to price field
        price: product.sale_price || product.price || 0,
        sale_price: product.sale_price || product.price || 0
      })) || [];
      
      setProducts(normalizedProducts);
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
    console.log('📦 Produto selecionado:', product);
    setSelectedProduct(product);
    
    // Use sale_price if available, otherwise use price
    const correctPrice = product.sale_price || product.price || 0;
    setUnitPrice(correctPrice);
    
    console.log('💰 Preço definido:', correctPrice);
  };

  const addProduct = () => {
    if (!selectedProduct || quantity <= 0) {
      toast.error('Selecione um produto e quantidade válida');
      return;
    }

    // Calculate final price considering subunits if applicable
    let finalPrice = unitPrice;
    let finalUnit = selectedProduct.unit || 'UN';
    
    // If product has subunit and ratio, adjust pricing
    if (selectedProduct.has_subunit && selectedProduct.subunit_ratio && selectedProduct.subunit_ratio > 1) {
      // If selling by subunit, price should be calculated per subunit
      if (selectedProduct.subunit) {
        finalUnit = selectedProduct.subunit;
        // Price per subunit = main unit price / ratio
        finalPrice = (selectedProduct.sale_price || selectedProduct.price || 0) / selectedProduct.subunit_ratio;
      }
    }

    const newItem: OrderItem = {
      id: Date.now(),
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity,
      price: unitPrice, // Use the price set by user (can be different from product price)
      code: selectedProduct.code.toString(),
      unit: finalUnit
    };

    console.log('➕ Adicionando item ao pedido:', newItem);
    onAddItem(newItem);
    
    // Limpar seleção
    setSelectedProduct(null);
    setQuantity(1);
    setUnitPrice(0);
    setSearchTerm('');
  };

  const clearSelection = () => {
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
    clearSelection
  };
};
