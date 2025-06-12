
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';
import { useProductPriceValidation } from '@/hooks/useProductPriceValidation';
import { useUnitSelection } from '@/hooks/useUnitSelection';

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
  max_discount_percent?: number;
  category_id?: string;
  category_name?: string;
  group_id?: string;
  group_name?: string;
  brand_id?: string;
  brand_name?: string;
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
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Usar o hook de seleção de unidades
  const { 
    unitOptions, 
    selectedUnit, 
    selectedUnitType, 
    setSelectedUnitType, 
    hasMultipleUnits 
  } = useUnitSelection(selectedProduct);

  const { checkPriceAndNotify, hasDiscountRestriction } = useProductPriceValidation(selectedProduct);

  useEffect(() => {
    loadProducts();
  }, []);

  // Auto-selecionar primeiro produto quando a lista estiver carregada
  useEffect(() => {
    if (products.length > 0 && !selectedProduct) {
      console.log('📦 Auto-selecionando primeiro produto:', products[0]);
      selectProduct(products[0], 0);
    }
  }, [products, selectedProduct]);

  // Atualizar preço automaticamente quando a unidade selecionada mudar
  useEffect(() => {
    if (selectedUnit) {
      console.log('📏 Unidade mudou, atualizando preço:', {
        unitType: selectedUnitType,
        unitPrice: selectedUnit.price,
        unitLabel: selectedUnit.label
      });
      setUnitPrice(selectedUnit.price);
    }
  }, [selectedUnit, selectedUnitType]);

  const loadProducts = async () => {
    try {
      const db = getDatabaseAdapter();
      const productsData = await db.getProducts();
      console.log('📦 Produtos carregados do banco local:', productsData);
      
      // Validar que apenas produtos reais são carregados
      const validProducts = productsData.filter(product => {
        const isValid = product.id && 
                       product.name && 
                       typeof product.sale_price === 'number' &&
                       typeof product.code === 'number';
        
        if (!isValid) {
          console.warn('⚠️ Produto inválido filtrado:', product);
        }
        
        return isValid;
      });
      
      console.log(`✅ ${validProducts.length} produtos válidos carregados (filtrados de ${productsData.length} total)`);
      
      // Ensure products have the correct price field and max_discount_percent
      const normalizedProducts = validProducts.map(product => ({
        ...product,
        price: product.sale_price || product.price || 0,
        sale_price: product.sale_price || product.price || 0,
        max_discount_percent: product.max_discount_percent || 0
      }));
      
      setProducts(normalizedProducts);
      
      // Log detalhado dos produtos para debug de desconto máximo
      normalizedProducts.forEach((product, index) => {
        if (product.max_discount_percent && product.max_discount_percent > 0) {
          console.log(`📦 Produto ${index + 1} COM DESCONTO MÁXIMO:`, {
            id: product.id,
            name: product.name,
            code: product.code,
            sale_price: product.sale_price,
            max_discount_percent: product.max_discount_percent,
            stock: product.stock,
            unit: product.unit,
            category_name: product.category_name,
            group_name: product.group_name
          });
        }
      });
      
    } catch (error) {
      console.error('❌ Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar produtos');
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toString().includes(searchTerm) ||
    (product.category_name && product.category_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (product.group_name && product.group_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectProduct = (product: Product, index?: number) => {
    console.log('📦 PRODUTO SELECIONADO:', {
      id: product.id,
      name: product.name,
      code: product.code,
      sale_price: product.sale_price,
      max_discount_percent: product.max_discount_percent,
      hasDiscountRestriction: (product.max_discount_percent && product.max_discount_percent > 0),
      hasSubunit: product.has_subunit,
      subunit: product.subunit,
      subunitRatio: product.subunit_ratio,
      category_name: product.category_name,
      group_name: product.group_name
    });
    
    setSelectedProduct(product);
    
    if (index !== undefined) {
      setCurrentProductIndex(index);
    }
    
    console.log('💰 Desconto máximo configurado:', product.max_discount_percent || 'Nenhum');
    
    // Log informações sobre unidades
    if (product.has_subunit) {
      console.log('📏 Produto com subunidade:', {
        unidadePrincipal: product.unit,
        subunidade: product.subunit,
        ratio: product.subunit_ratio
      });
    }
  };

  const addProduct = () => {
    console.log('🔍 INICIANDO ADIÇÃO DE PRODUTO:', {
      selectedProduct: selectedProduct?.name || 'Nenhum',
      quantity,
      unitPrice,
      selectedUnit: selectedUnit?.label || 'Nenhuma',
      hasProduct: !!selectedProduct
    });

    if (!selectedProduct || quantity <= 0 || !selectedUnit) {
      toast.error('Selecione um produto, unidade e quantidade válida');
      return;
    }

    // VALIDAÇÃO CRÍTICA: Verificar desconto máximo antes de adicionar
    console.log('🔍 VALIDAÇÃO DE DESCONTO - Verificando:', {
      productName: selectedProduct.name,
      unitPrice,
      maxDiscountPercent: selectedProduct.max_discount_percent,
      hasDiscountRestriction: hasDiscountRestriction()
    });

    // Esta é a validação que deve impedir a adição se o desconto for excedido
    const priceIsValid = checkPriceAndNotify(unitPrice);
    
    if (!priceIsValid) {
      console.log('❌ PREÇO INVÁLIDO - Produto NÃO será adicionado');
      console.log('❌ Motivo: Desconto excede o limite máximo permitido');
      return;
    }

    console.log('✅ PREÇO VÁLIDO - Prosseguindo com adição do produto');

    const newItem: OrderItem = {
      id: Date.now(),
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity,
      price: unitPrice,
      code: selectedProduct.code.toString(),
      unit: selectedUnit.label
    };

    console.log('➕ ADICIONANDO ITEM AO PEDIDO:', {
      productName: newItem.productName,
      quantity: newItem.quantity,
      unit: newItem.unit,
      price: newItem.price,
      maxDiscountPercent: selectedProduct.max_discount_percent,
      totalItem: (newItem.quantity * newItem.price).toFixed(2)
    });
    
    onAddItem(newItem);
    
    // NOVA LÓGICA: Avançar para o próximo produto ao invés de limpar seleção
    const nextIndex = currentProductIndex < products.length - 1 ? currentProductIndex + 1 : 0;
    const nextProduct = products[nextIndex];
    
    if (nextProduct) {
      console.log('🔄 AVANÇANDO PARA PRÓXIMO PRODUTO:', {
        currentIndex: currentProductIndex,
        nextIndex,
        nextProduct: nextProduct.name
      });
      
      selectProduct(nextProduct, nextIndex);
      setQuantity(1); // Reset apenas a quantidade
    }
    
    console.log('✅ PRODUTO ADICIONADO COM SUCESSO E AVANÇADO PARA PRÓXIMO');
  };

  const clearSelection = () => {
    setSelectedProduct(null);
    setCurrentProductIndex(0);
    setQuantity(1);
    setUnitPrice(0);
    setSearchTerm('');
  };

  const navigateToProduct = (index: number) => {
    if (index >= 0 && index < products.length) {
      selectProduct(products[index], index);
    }
  };

  return {
    products: filteredProducts,
    selectedProduct,
    currentProductIndex,
    quantity,
    unitPrice,
    searchTerm,
    unitOptions,
    selectedUnit,
    selectedUnitType,
    hasMultipleUnits,
    selectProduct,
    setQuantity,
    setUnitPrice,
    setSearchTerm,
    setSelectedUnitType,
    addProduct,
    clearSelection,
    navigateToProduct
  };
};
