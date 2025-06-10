
import { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { useUnitSelection } from './useUnitSelection';
import { useProductPriceValidation } from './useProductPriceValidation';

interface Product {
  id: string;
  name: string;
  price: number;
  sale_price?: number;
  code: number;
  stock: number;
  unit?: string;
  has_subunit?: boolean;
  subunit?: string;
  subunit_ratio?: number;
  min_price?: number;
}

export const useProductSelection = (addOrderItem: (item: any) => void) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const unitSelection = useUnitSelection(selectedProduct);
  const { unitOptions, selectedUnit, hasMultipleUnits, handleUnitTypeChange: handleUnitTypeChangeBase } = unitSelection;

  const {
    checkPriceAndNotify,
    validatePrice
  } = useProductPriceValidation(selectedProduct);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`http://localhost:3001/products?name_like=${searchTerm}`);
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        toast.error('Erro ao buscar produtos');
      }
    };

    fetchProducts();
  }, [searchTerm]);

  useEffect(() => {
    if (selectedProduct) {
      setUnitPrice(selectedProduct.price);
    }
  }, [selectedProduct]);

  const selectProduct = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setUnitPrice(product.price);
  };

  const clearSelection = () => {
    setSelectedProduct(null);
    setQuantity(1);
    setUnitPrice(0);
  };

  const handleUnitTypeChange = (unitType: 'main' | 'sub') => {
    console.log('🔄 useProductSelection - handleUnitTypeChange para:', unitType);
    
    handleUnitTypeChangeBase(unitType, (price) => {
      console.log('💰 useProductSelection - Atualizando preço para:', price);
      setUnitPrice(price);
    });
    
    // ✅ CORREÇÃO: Validar preço após a mudança de unidade
    if (selectedProduct) {
      // Buscar o preço da nova unidade selecionada
      const newUnit = unitOptions.find(opt => opt.value === unitType);
      if (newUnit) {
        console.log('🔍 useProductSelection - Validando preço com nova unidade:', {
          price: newUnit.price,
          unitType,
          productName: selectedProduct.name
        });
        validatePrice(newUnit.price, unitType);
      }
    }
  };

  const addProduct = () => {
    console.log('➕ useProductSelection - addProduct iniciado');
    
    if (!selectedProduct) {
      console.log('❌ addProduct: Nenhum produto selecionado');
      toast.error('Selecione um produto');
      return;
    }

    if (quantity <= 0) {
      console.log('❌ addProduct: Quantidade inválida');
      toast.error('Quantidade deve ser maior que zero');
      return;
    }

    // ✅ CORREÇÃO: Validar preço com tipo de unidade atual
    const isValidPrice = checkPriceAndNotify(unitPrice, unitSelection.selectedUnitType);
    
    if (!isValidPrice) {
      console.log('❌ addProduct: Preço inválido');
      return;
    }

    const item = {
      product: selectedProduct,
      quantity: quantity,
      unitPrice: unitPrice,
      total: quantity * unitPrice,
      unit: selectedUnit?.code
    };

    addOrderItem(item);
    clearSelection();
    toast.success('Produto adicionado ao pedido');
  };

  return {
    products,
    selectedProduct,
    quantity,
    unitPrice,
    searchTerm,
    selectedUnit: selectedUnit?.code || 'UN',
    unitOptions,
    selectedUnitType: unitSelection.selectedUnitType,
    hasMultipleUnits,
    selectProduct,
    setQuantity,
    setUnitPrice,
    setSearchTerm,
    setSelectedUnit: unitSelection.setSelectedUnitType,
    handleUnitTypeChange,
    addProduct,
    clearSelection
  };
};
