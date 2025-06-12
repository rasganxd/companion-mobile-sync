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
      selectProduct(products[0]);
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
            unit: product.unit
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
    product.code.toString().includes(searchTerm)
  );

  const selectProduct = (product: Product) => {
    console.log('📦 PRODUTO SELECIONADO:', {
      id: product.id,
      name: product.name,
      code: product.code,
      sale_price: product.sale_price,
      max_discount_percent: product.max_discount_percent,
      hasDiscountRestriction: (product.max_discount_percent && product.max_discount_percent > 0),
      hasSubunit: product.has_subunit,
      subunit: product.subunit,
      subunitRatio: product.subunit_ratio
    });
    
    setSelectedProduct(product);
    
    // O preço será definido automaticamente pelo useEffect que monitora selectedUnit
    // Não definir unitPrice aqui para evitar conflitos
    
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
    
    // Limpar seleção
    setSelectedProduct(null);
    setQuantity(1);
    setUnitPrice(0);
    setSearchTerm('');
    
    console.log('✅ PRODUTO ADICIONADO COM SUCESSO E SELEÇÃO LIMPA');
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
    clearSelection
  };
};
